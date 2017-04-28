import { ArrayBufferWalker } from '../util/arraybuffer-walker';

// http://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html#C.IHDR

type validBitDepth = 1 | 2 | 4 | 8 | 16;

export enum PNGColorType {
    Grayscale = 0,
    RGB = 2,
    Palette = 3,
    GrayscaleWithAlpha = 4,
    RGBA = 6
}

export interface IHDROptions {
    width: number;
    height: number;
    bitDepth: validBitDepth;
    colorType: PNGColorType;
}

export function write(walker: ArrayBufferWalker, options: IHDROptions) {

    // IHDR length is always 13 bytes
    walker.writeUint32(13);

    walker.startCRC();
    walker.writeString("IHDR");

    walker.writeUint32(options.width);
    walker.writeUint32(options.height);

    walker.writeUint8(options.bitDepth);
    walker.writeUint8(options.colorType);
    walker.writeUint8(0); // compression method, always zero
    walker.writeUint8(0); // filter, we don't use one
    walker.writeUint8(0); // interface, also always zero

    walker.writeCRC();

}

export const length = 4 // Chunk length identifier
    + 4     // chunk header
    + 13    // actual IHDR length
    + 4     // CRC32 check;