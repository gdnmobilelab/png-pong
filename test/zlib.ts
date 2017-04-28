import * as zlib from 'zlib';
import * as fs from 'fs';
import { ZlibWriter, calculateZlibbedLength } from '../src/util/zlib';
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
})