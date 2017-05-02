
export interface PalettedArray {
    rgbPalette: Uint8ClampedArray,
    alphaPalette: Uint8ClampedArray,
    data: Uint8ClampedArray
}

function findRGBA(rgba: Uint8ClampedArray, offset: number, rgbPalette: Uint8ClampedArray, alphaPalette: Uint8ClampedArray) {

    for (let i = 3; i < rgbPalette.length; i = i + 3) {

        // Because we already shortcut when looking for rgba(0,0,0,0) we know that if we
        // run into it here it's the end of our current palette. So we can end the loop early.

        if (rgbPalette[i] === 0 && rgbPalette[i + 1] === 0 && rgbPalette[i + 2] === 0 && alphaPalette[i / 3] === 0) {
            return -1;
        }


        if (rgbPalette[i] === rgba[offset] && rgbPalette[i + 1] === rgba[offset + 1]
            && rgbPalette[i + 2] === rgba[offset + 2] && rgba[offset + 3] === alphaPalette[i / 3]) {
            return i / 3;
        }
    }
    return -1;
}

function findOrAddColor(rgba: Uint8ClampedArray, offset: number, rgbPalette: Uint8ClampedArray, alphaPalette: Uint8ClampedArray) {

    // ISSUE: when reading back, we don't actually know how much of the array has been used. So if we'd 
    // specified rgba(0,0,0,0) as a colour we'd assume it is an empty byte, and use it. To cover this,
    // we are going to reserve the first entry in the array as rgba(0,0,0,0). Hopefully we don't end up
    // with images that need all 255 palette entries...

    if (rgba[offset] === 0 && rgba[offset + 1] === 0 && rgba[offset + 2] === 0 && rgba[offset + 3] === 0) {
        return 0;
    }

    // Technically we're passing a 4-length array here, but the function ignores it
    let rgbIndex = findRGBA(rgba, offset, rgbPalette, alphaPalette);

    if (rgbIndex > -1) {
        return rgbIndex;

    } else {

        // The colour is not yet in the palette. So we go through the palette array until we find
        // one (that isn't at index zero) that matches rgba(0,0,0,0). 
        let vacantIndex = 3;
        while (rgbPalette[vacantIndex] !== 0 || rgbPalette[vacantIndex + 1] !== 0 ||
            rgbPalette[vacantIndex + 2] !== 0 || alphaPalette[vacantIndex / 3] !== 0) {
            vacantIndex += 3;
            if (vacantIndex > 255) {
                throw new Error("No room left in the palette")
            }

        }


        rgbPalette[vacantIndex] = rgba[offset];
        rgbPalette[vacantIndex + 1] = rgba[offset + 1];
        rgbPalette[vacantIndex + 2] = rgba[offset + 2];
        alphaPalette[vacantIndex / 3] = rgba[offset + 3];

        // The actual index we use is that of the red value.
        return vacantIndex / 3;
    }

}

export function RGBAtoPalettedArray(rgba: Uint8ClampedArray, extraPaletteSpaces: number): PalettedArray {

    if (rgba.byteLength % 4 !== 0) {
        throw new Error("This is not divisible by 4, can't be an RGBA array");
    }

    let data = new Uint8ClampedArray(rgba.byteLength / 4);
    let rgbPalette = new Uint8ClampedArray(255 * 3);
    let alphaPalette = new Uint8ClampedArray(255);

    let maxColor = 0;

    for (let i = 0; i < rgba.length; i = i + 4) {
        let color = findOrAddColor(rgba, i, rgbPalette, alphaPalette);
        maxColor = Math.max(maxColor, color);
        data[i / 4] = color;
    }
    // maxColor is the index, we want the length, so bump it up by one
    maxColor++;

    return {
        data: data,
        rgbPalette: rgbPalette.slice(0, maxColor * 3 + (extraPaletteSpaces * 3)),
        alphaPalette: alphaPalette.slice(0, maxColor + extraPaletteSpaces)
    }

}