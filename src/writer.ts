import { write as writePreheader, length as PreheaderLength } from './chunks/pre-header';
import { write as writeIHDR, length as IHDRLength, PNGColorType } from './chunks/ihdr';
import { write as writePalette, calculateLength as calculatePaletteLength } from './chunks/palette';
import { write as writeIEND, length as IENDLength } from './chunks/iend';
import { write as writeIDAT, calculateLength as calculateIDATLength, writeConstant as writeIDATConstant } from './chunks/idat';
import { RGB, RGBA } from './util/color-types';
import { ArrayBufferWalker } from './util/arraybuffer-walker';

import { RGBAtoPalettedArray, PalettedArray } from './rgba-to-palette-array';

function calculateBufferLength(width: number, height: number, numColors: number) {

    // Before we write anything we need to work out the size of ArrayBuffer
    // we need. This is a combination of a whole load of factors, so we
    // separate out the logic into different chunks.

    return PreheaderLength
        + IHDRLength
        + calculatePaletteLength(numColors)
        + calculateIDATLength(width, height)
        + IENDLength;
}


export function createFromRGBArray(width: number, height: number, rgbaData: Uint8ClampedArray, extraPaletteSpaces: number = 0) {

    let { rgbPalette, alphaPalette, data } = RGBAtoPalettedArray(rgbaData, extraPaletteSpaces);

    let arrayBufferLength = calculateBufferLength(width, height, alphaPalette.length + extraPaletteSpaces);

    let buffer = new ArrayBuffer(arrayBufferLength);
    let walker = new ArrayBufferWalker(buffer);

    writePreheader(walker);
    writeIHDR(walker, {
        width: width,
        height: height,
        colorType: PNGColorType.Palette,
        bitDepth: 8,
        compressionMethod: 0,
        filter: 0,
        interface: 0
    });
    writePalette(walker, rgbPalette, alphaPalette);
    writeIDAT(walker, data, width)
    writeIEND(walker);

    return buffer;
}

export function createWithMetadata(width: number, height: number, paletteSize: number, backgroundColor?: RGBA | RGB) {

    if (backgroundColor && paletteSize <= 1) {
        throw new Error("If specifying a background colour, palette must be greater than 1 entry big (#0 is always rgba(0,0,0,0))")
    }

    let length = calculateBufferLength(width, height, paletteSize);

    let buffer = new ArrayBuffer(length);
    let walker = new ArrayBufferWalker(buffer);

    writePreheader(walker);
    writeIHDR(walker, {
        width: width,
        height: height,
        colorType: PNGColorType.Palette,
        bitDepth: 8,
        compressionMethod: 0,
        filter: 0,
        interface: 0
    });

    let rgbColors = new Uint8ClampedArray(paletteSize * 3);
    let alphaValues = new Uint8ClampedArray(paletteSize);

    if (backgroundColor) {
        rgbColors[3] = backgroundColor[0];
        rgbColors[4] = backgroundColor[1];
        rgbColors[5] = backgroundColor[2];

        if (backgroundColor.length === 3) {
            alphaValues[1] = 255;
        } else {
            alphaValues[1] = backgroundColor[3];
        }
    }


    writePalette(walker, rgbColors, alphaValues);

    if (backgroundColor) {
        // The background color will be palette entry #1, as RGBA(0,0,0,0) is
        // always entry #0
        writeIDATConstant(walker, 1, width, height);

    } else {
        writeIDATConstant(walker, 0, width, height);
    }

    writeIEND(walker);

    return buffer;

}