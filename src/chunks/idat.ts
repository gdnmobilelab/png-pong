import { ArrayBufferWalker } from '../util/arraybuffer-walker';
import { calculateZlibbedLength, ZlibWriter } from '../util/zlib';

export function write(walker: ArrayBufferWalker, data: Uint8ClampedArray, width: number) {

    // We need to account for a row filter pixel in our chunk length
    let height = data.length / width;

    // Zlibbed data will take up more space than the raw data
    walker.writeUint32(calculateZlibbedLength(data.length + height));

    walker.startCRC();
    walker.writeString("IDAT");

    let zlibWriter = new ZlibWriter(walker, data.length + height);

    let currentX = 0;
    let currentWindowLength = 0;

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

export function calculateLength(width: number, height: number) {

    // PNG has a row filter byte at the start of each row

    let bytes = (width + 1) * height;
    return 4                                // Chunk length
        + 4                                 // Identifier
        + calculateZlibbedLength(bytes)
        + 4                                 // CRC

}