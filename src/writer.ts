import { writePreheader as writePreheader, length as PreheaderLength } from './chunks/pre-header';
import { writeIHDR as writeIHDR, IHDRLength as IHDRLength, PNGColorType } from './chunks/ihdr';
import { writePalette as writePalette, calculatePaletteLength as calculatePaletteLength } from './chunks/palette';
import { writeIEND as writeIEND, length as IENDLength } from './chunks/iend';
import { writeIDAT as writeIDAT, calculateIDATLength as calculateIDATLength, writeIDATConstant as writeIDATConstant } from './chunks/idat';
import { RGB } from './util/color-types';
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


/**
 * Create a PngPong-suitable PNG ArrayBuffer from an existing RGBA array. Combine
 * this with PNGJS to transform an existing PNG image into something PngPong can use.
 * 
 * @export
 * @param {number} width 
 * @param {number} height 
 * @param {Uint8ClampedArray} rgbaData 
 * @param {number} extraPaletteSpaces - How many extra palette entries should we make available for new colors, after we've added the colors from the existing array?
 * @returns 
 */
export function createFromRGBAArray(width: number, height: number, rgbaData: Uint8ClampedArray, extraPaletteSpaces: number = 0) {

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


/**
 * Create a PngPong-suitable ArrayBuffer based on the arguments provided.
 * 
 * @export
 * @param {number} width 
 * @param {number} height 
 * @param {number} paletteSize - Must be at least 1, and at least 2 if specifying a background color.
 * @param {RGB} [backgroundColor] 
 * @returns 
 */
export function createWithMetadata(width: number, height: number, paletteSize: number, backgroundColor?: RGB) {

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
        alphaValues[1] = 255;
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