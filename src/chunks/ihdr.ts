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
    compressionMethod: number;
    filter: number;
    interface: number;
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
    walker.writeUint8(options.compressionMethod);
    walker.writeUint8(options.filter);
    walker.writeUint8(options.interface);

    walker.writeCRC();

}

export function read(walker: ArrayBufferWalker, length: number): IHDROptions {

    if (length !== 13) {
        throw new Error("IHDR length must always be 13")
    }

    let width = walker.readUint32();
    let height = walker.readUint32();

    let bitDepth = walker.readUint8() as validBitDepth;
    let colorType = walker.readUint8() as PNGColorType;
    let compressionMethod = walker.readUint8();
    let filter = walker.readUint8();
    let pngInterface = walker.readUint8();

    // Don't do anything with this as we can't edit the header
    let crc = walker.readUint32();

    return {
        width,
        height,
        bitDepth,
        colorType,
        compressionMethod,
        filter,
        interface: pngInterface
    };


}

export const length = 4 // Chunk length identifier
    + 4     // chunk header
    + 13    // actual IHDR length
    + 4     // CRC32 check;