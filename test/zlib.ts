import * as zlib from 'zlib';
import * as fs from 'fs';
import { ZlibWriter, calculateZlibbedLength, readZlib } from '../src/util/zlib';
import { ArrayBufferWalker } from '../src/util/arraybuffer-walker';
import * as expect from 'expect';

describe("Zlib writer", () => {
    it("Should output a buffer readable by the Node ZLib library", () => {

        let length = 120000;

        let arr = new ArrayBuffer(calculateZlibbedLength(length));

        let writer = new ArrayBufferWalker(arr);
        let zlibWriter = new ZlibWriter(writer, length);
        for (let i = 0; i < length; i++) {
            zlibWriter.writeUint8(i % 3 === 0 ? 1 : 0);
        }

        zlibWriter.end();

        let toNodeBuffer = new Buffer(new Uint8Array(arr));

        let inflatedAgain = zlib.inflateSync(toNodeBuffer);
        expect(inflatedAgain.length).toEqual(length);

        let outArray = new Uint8Array(inflatedAgain);
        for (let i = 0; i < length; i++) {
            expect(outArray[i]).toEqual(i % 3 === 0 ? 1 : 0);
        }

    })

    it("Read same size as written", () => {

        let length = 120000;

        let arr = new ArrayBuffer(calculateZlibbedLength(length));

        let writer = new ArrayBufferWalker(arr);
        let zlibWriter = new ZlibWriter(writer, length);
        for (let i = 0; i < length; i++) {
            zlibWriter.writeUint8(i % 2 === 0 ? 2 : 4);
        }

        zlibWriter.end();

        let toNodeBuffer = new Buffer(new Uint8Array(arr));

        // require('fs').writeFileSync('/tmp/zlibbed', toNodeBuffer)

        writer.offset = 0;
        let readLength = 0;

        readZlib(writer, (arr, readOffset, dataOffset, length) => {

            for (let i = 0; i < length; i++) {


                try {
                    expect(arr[readOffset + i]).toEqual((dataOffset + i) % 2 === 0 ? 2 : 4);
                } catch (err) {
                    console.log("Failed at index #" + readLength, readOffset + i, dataOffset + i);
                    throw err;
                }
                readLength++;
            }

        })

        expect(readLength).toEqual(120000);

    })
})