import { MultiArrayBufferWalker } from '../../src/util/multiarraybuffer-walker';
import { ArrayBufferWalker } from '../../src/util/arraybuffer-walker';
import * as expect from 'expect';

describe("Multi array walker", () => {
    it("Should walk across one arrays", () => {
        let ab = new ArrayBuffer(2);

        let walker = new MultiArrayBufferWalker([ab]);

        walker.writeUint8(1);
        walker.writeUint8(2);

        let arr = new Uint8Array(ab);

        expect(arr[0]).toEqual(1);
        expect(arr[1]).toEqual(2);


    });

    it("Should walk across two arrays", () => {
        let ab = new ArrayBuffer(2);
        let ab2 = new ArrayBuffer(2);

        let walker = new MultiArrayBufferWalker([ab, ab2]);

        walker.writeUint8(1);
        walker.writeUint8(2);
        walker.writeUint8(3);
        walker.writeUint8(4);

        let arr = new Uint8Array(ab);
        let arr2 = new Uint8Array(ab2);

        expect(arr[0]).toEqual(1);
        expect(arr[1]).toEqual(2);
        expect(arr2[0]).toEqual(3);
        expect(arr2[1]).toEqual(4);

        expect(walker.offset).toEqual(4);

    })

    it("Should read across two arrays", () => {
        let ab = new ArrayBuffer(2);
        let ab2 = new ArrayBuffer(2);

        let walker = new MultiArrayBufferWalker([ab, ab2]);

        walker.writeUint32(5000);

        walker.offset = 0;

        expect(walker.readUint32()).toEqual(5000);


    })

    it("Should write CRC across two arrays", () => {
        let ab = new ArrayBuffer(5);
        let ab2 = new ArrayBuffer(5);
        let ab3 = new ArrayBuffer(10);

        let walker = new MultiArrayBufferWalker([ab, ab2]);
        let singleWalker = new ArrayBufferWalker(ab3);

        walker.startCRC();
        walker.writeUint32(5000);
        walker.writeUint16(4000);
        walker.writeCRC();

        singleWalker.startCRC();
        singleWalker.writeUint32(5000);
        singleWalker.writeUint16(4000);
        singleWalker.writeCRC();

        walker.offset -= 4;
        singleWalker.offset -= 4;

        expect(walker.readUint32()).toEqual(singleWalker.readUint32());


    });

    it("Should write Adler across two arrays", () => {
        let ab = new ArrayBuffer(5);
        let ab2 = new ArrayBuffer(5);
        let ab3 = new ArrayBuffer(10);

        let walker = new MultiArrayBufferWalker([ab, ab2]);
        let singleWalker = new ArrayBufferWalker(ab3);

        walker.startAdler();
        walker.writeUint32(5000);
        walker.writeUint16(4000);
        walker.writeAdler();

        singleWalker.startAdler();
        singleWalker.writeUint32(5000);
        singleWalker.writeUint16(4000);
        singleWalker.writeAdler();

        walker.offset -= 4;
        singleWalker.offset -= 4;

        expect(walker.readUint32()).toEqual(singleWalker.readUint32());


    })
})