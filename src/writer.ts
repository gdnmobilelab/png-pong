import { write as writePreheader, length as PreheaderLength } from './chunks/pre-header';
import { write as writeIHDR, length as IHDRLength, PNGColorType } from './chunks/ihdr';
import { write as writePalette, calculateLength as calculatePaletteLength } from './chunks/palette';
import { write as writeIEND, length as IENDLength } from './chunks/iend';
import { write as writeIDAT, calculateLength as calculateIDATLength } from './chunks/idat';

import { ArrayBufferWalker } from './util/arraybuffer-walker';

import { RGBAtoPalettedArray, PalettedArray } from './rgba-to-palette-array';

export class PngPongWriter {

    buffer: ArrayBuffer;
    walker: ArrayBufferWalker;
    paletteAndData: PalettedArray;

    calculateBufferLength() {

        // Before we write anything we need to work out the size of ArrayBuffer
        // we need. This is a combination of a whole load of factors, so we
        // separate out the logic into different chunks.

        return PreheaderLength
            + IHDRLength
            + calculatePaletteLength(this.paletteAndData.alphaPalette.length)
            + calculateIDATLength(this.width, this.height)
            + IENDLength;
    }

    constructor(private width: number, private height: number, private rgbaData: Uint8ClampedArray) {

        if (rgbaData.length !== width * height * 4) {
            throw new Error("Insufficient data for the image dimensions specified");
        }

        this.paletteAndData = RGBAtoPalettedArray(this.rgbaData);
        this.buffer = new ArrayBuffer(this.calculateBufferLength());
        this.walker = new ArrayBufferWalker(this.buffer);
    }

    write() {

        writePreheader(this.walker);
        writeIHDR(this.walker, {
            width: this.width,
            height: this.height,
            colorType: PNGColorType.Palette,
            bitDepth: 8
        });
        writePalette(this.walker, this.paletteAndData.rgbPalette, this.paletteAndData.alphaPalette);
        writeIDAT(this.walker, this.paletteAndData.data, this.width)
        writeIEND(this.walker);

        return this.buffer;
    }

}