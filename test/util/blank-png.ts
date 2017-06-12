import { createFromRGBAArray } from '../../src/writer';

export function createBlankPNG(width: number, height: number, backgroundColor: number[], extraPaletteSpaces: number = 0) {

    if (backgroundColor.length === 3) {
        backgroundColor.push(255);
    }

    let bgColors = new Uint8ClampedArray(backgroundColor);

    let sourceArray = new Uint8ClampedArray(width * height * 4);

    for (let i = 0; i < sourceArray.length; i = i + 4) {
        sourceArray.set(bgColors, i);
    }

    return createFromRGBAArray(width, height, sourceArray, extraPaletteSpaces);
}