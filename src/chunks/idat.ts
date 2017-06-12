import { ArrayBufferWalker } from '../util/arraybuffer-walker';
import { calculateZlibbedLength, ZlibWriter, readZlib } from '../util/zlib';


/**
 * Write an IDAT chunk all at once. Typically used when creating a new blank image.
 * 
 * @export
 * @param {ArrayBufferWalker} walker 
 * @param {Uint8ClampedArray} data 
 * @param {number} width 
 */
export function writeIDAT(walker: ArrayBufferWalker, data: Uint8ClampedArray, width: number) {

    // We need to account for a row filter pixel in our chunk length
    let height = data.length / width;

    // Zlibbed data will take up more space than the raw data
    walker.writeUint32(calculateZlibbedLength(data.length + height));

    walker.startCRC();
    walker.writeString("IDAT");

    let zlibWriter = new ZlibWriter(walker, data.length + height);

    let currentX = 0;

    // Write our row filter byte
    zlibWriter.writeUint8(0)

    for (var i = 0; i < data.length; i++) {

        if (currentX === width) {
            currentX = 0;
            // Write our row filter byte
            zlibWriter.writeUint8(0)
        }

        zlibWriter.writeUint8(data[i]);
        currentX++;

    }

    zlibWriter.end();
    walker.writeCRC();

}


/**
 * Write an IDAT chunk without wasting memory on a source ArrayBuffer - if we want it all to be one
 * palette index.
 * 
 * @export
 * @param {ArrayBufferWalker} walker 
 * @param {number} value - The palette index we want all the pixels to be
 * @param {number} width 
 * @param {number} height 
 */
export function writeIDATConstant(walker: ArrayBufferWalker, value: number, width: number, height: number) {

    let overallSize = (width + 1) * height; // +1 for row filter byte

    walker.writeUint32(calculateZlibbedLength(overallSize));

    walker.startCRC();
    walker.writeString("IDAT");

    let zlibWriter = new ZlibWriter(walker, overallSize);

    let currentX = 0;

    // Write our row filter byte
    zlibWriter.writeUint8(0)

    for (var i = 0; i < width * height; i++) {

        if (currentX === width) {
            currentX = 0;
            // Write our row filter byte
            zlibWriter.writeUint8(0);
        }

        zlibWriter.writeUint8(value);
        currentX++;

    }

    zlibWriter.end();
    walker.writeCRC();

}


/**
 * Calculate the length of an IDAT chunk. Because it uses both ZLib chunking
 * and a row filter byte at the start of each row, it isn't as simple as
 * width * height.
 * 
 * @export
 * @param {number} width 
 * @param {number} height 
 * @returns 
 */
export function calculateIDATLength(width: number, height: number) {

    // +1 for row filter byte at the start of each row
    let bytes = (width + 1) * height;

    return 4                                // Chunk length
        + 4                                 // Identifier
        + calculateZlibbedLength(bytes)
        + 4                                 // CRC

}