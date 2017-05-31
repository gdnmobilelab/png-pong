import { ArrayBufferWalker } from '../util/arraybuffer-walker';
import { crc32 } from '../util/crc';

export function write(walker: ArrayBufferWalker, rgbPalette: Uint8ClampedArray, alphaPalette: Uint8ClampedArray) {

    // Write PTLE

    walker.writeUint32(rgbPalette.length);
    walker.startCRC();
    walker.writeString("PLTE");

    for (let i = 0; i < rgbPalette.length; i++) {
        walker.writeUint8(rgbPalette[i]);
    }

    walker.writeCRC();

    // Write tRNS

    walker.writeUint32(alphaPalette.length);
    walker.startCRC();
    walker.writeString("tRNS");

    for (let i = 0; i < alphaPalette.length; i++) {
        walker.writeUint8(alphaPalette[i]);
    }

    walker.writeCRC();

}

export interface OffsetAndLength {
    offset: number;
    length: number;
}

export class Palette {


    constructor(private walker: ArrayBufferWalker, private rgbPalette: OffsetAndLength, private alphaPalette?: OffsetAndLength) {

    }

    writeCRCs() {

        this.walker.offset = this.rgbPalette.offset - 4; // CRC includes the identifier text
        this.walker.startCRC();
        this.walker.skip(4 + this.rgbPalette.length);
        this.walker.writeCRC();


        if (this.alphaPalette) {
            this.walker.offset = this.alphaPalette.offset - 4;
            this.walker.startCRC();
            this.walker.skip(4 + this.alphaPalette.length);
            this.walker.writeCRC();
        }

    }

    private checkColor(rgba: number[]) {
        if (rgba.length < 3 || rgba.length > 4) {
            throw new Error("Needs to be a 3 or 4 length array to check for color");
        }
        if (rgba.length === 3 && this.alphaPalette) {
            // If we need to search for alpha, just insert zero transparency
            rgba.push(255);
        }
    }

    getColorAtIndex(idx: number) {

        let rgbStartingIndex = idx * 3;

        let rgba = [
            this.walker.array[this.rgbPalette.offset + rgbStartingIndex],
            this.walker.array[this.rgbPalette.offset + rgbStartingIndex + 1],
            this.walker.array[this.rgbPalette.offset + rgbStartingIndex + 2],
            255
        ];

        if (this.alphaPalette) {
            rgba[3] = this.walker.array[this.alphaPalette.offset + idx];
        }

        return rgba;
    }

    getColorIndex(rgba: number[], startingIndex: number = 0) {

        this.checkColor(rgba);

        for (let i = this.rgbPalette.offset + (startingIndex * 3); i < this.rgbPalette.offset + this.rgbPalette.length; i = i + 3) {

            if (this.walker.array[i] === rgba[0] &&
                this.walker.array[i + 1] === rgba[1] &&
                this.walker.array[i + 2] === rgba[2]) {

                // Because this an array of RGB values, the actual index is / 3
                let index = ((i - this.rgbPalette.offset) / 3);

                if (!this.alphaPalette) {

                    // If we have no alpha palette then we've found our match.
                    return index;
                } else if (this.alphaPalette && this.walker.array[this.alphaPalette.offset + index] === rgba[3]) {
                    // Otherwise we need to check the alpha palette too.
                    return index;
                }
            }

        }
        return -1;
    }

    addColor(rgba: number[]) {

        // need to save this to reset later.
        let currentWalkerOffset = this.walker.offset;

        this.checkColor(rgba);

        // We start at index 1 because the PNGWriter stores 0,0,0,0 at palette index #0
        // and we want to ignore that.
        let vacantSpace = this.getColorIndex([0, 0, 0, 0], 1);

        if (vacantSpace === -1) {
            if (this.rgbPalette.length < 255) {
                throw new Error("No space left in palette. You need to create a source image with more space.")
            }
            throw new Error("No space left in palette. You need to use fewer colours.");
        }

        let rgbStartWriteAt = this.rgbPalette.offset + (vacantSpace * 3);

        // This feels like it kind of breaks the logic of using a walker
        // but the palette is this weird thing that we need to access at
        // different points...

        this.walker.offset = rgbStartWriteAt;
        this.walker.writeUint8(rgba[0]);
        this.walker.writeUint8(rgba[1]);
        this.walker.writeUint8(rgba[2]);

        if (this.alphaPalette) {
            this.walker.offset = this.alphaPalette.offset + vacantSpace;
            this.walker.writeUint8(rgba[3]);
        } else if (!this.alphaPalette && rgba[3] !== 255) {
            throw new Error("No alpha palette but color has alpha value.")
        }

        this.walker.offset = currentWalkerOffset;
        return vacantSpace;
    }

}

export function read(walker: ArrayBufferWalker, length: number) {

    let rgbPaletteBounds = { offset: walker.offset, length: length };

    walker.skip(length);

    let rgbCRC = walker.readUint32();

    // We might have a tRNS block next. But we also might not!

    let nextBlockLength = walker.readUint32();
    let nextBlockIdentifier = walker.readString(4);

    if (nextBlockIdentifier !== "tRNS") {

        // We want to move it back so that the transformer reader
        // can parse this block itself.
        walker.rewindString(4);
        walker.rewindUint32();

        return new Palette(walker, rgbPaletteBounds);
    } else {

        let alphaPalette = { offset: walker.offset, length: nextBlockLength };
        walker.skip(nextBlockLength);

        return new Palette(walker, rgbPaletteBounds, alphaPalette);
    }

}

export function calculateLength(numColors: number) {
    return (numColors * 3) // PLTE chunk size
        + 4     // PLTE identifier
        + 4     // PLTE CRC
        + 4     // PLTE length
        + numColors   // tRNS chunk Size
        + 4     // tRNS identifier
        + 4     // tRNS CRC
        + 4;    // tRNS length
}

