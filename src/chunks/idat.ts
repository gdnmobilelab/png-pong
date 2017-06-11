import { ArrayBufferWalker } from '../util/arraybuffer-walker';
import { calculateZlibbedLength, ZlibWriter, readZlib } from '../util/zlib';

export function write(walker: ArrayBufferWalker, data: Uint8ClampedArray, width: number) {

    // We need to account for a row filter pixel in our chunk length
    let numOfRowFilterBytes = data.length / width;

    // Zlibbed data will take up more space than the raw data
    walker.writeUint32(calculateZlibbedLength(data.length + numOfRowFilterBytes));

    walker.startCRC();
    walker.writeString("IDAT");

    let zlibWriter = new ZlibWriter(walker, data.length + numOfRowFilterBytes);

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

export function writeConstant(walker: ArrayBufferWalker, value: number, width: number, height: number) {

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
export function calculateLength(width: number, height: number) {

    // PNG has a row filter byte at the start of each row

    let bytes = (width + 1) * height;
    return 4                                // Chunk length
        + 4                                 // Identifier
        + calculateZlibbedLength(bytes)
        + 4                                 // CRC

}

export function read(walker: ArrayBufferWalker, length: number) {

}