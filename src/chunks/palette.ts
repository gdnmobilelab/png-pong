import { ArrayBufferWalker } from '../util/arraybuffer-walker';

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

