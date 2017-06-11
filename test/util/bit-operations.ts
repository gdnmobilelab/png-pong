import { ArrayBufferWalker } from '../../src/util/arraybuffer-walker';
import * as expect from 'expect';
import { crc32 } from '../../src/util/crc';
import { adler32_buf } from '../../src/util/adler'

describe("Bit Operations", () => {
    it("should write and read uint32 big-endian", () => {
        let buff = new ArrayBuffer(4);

        let writer = new ArrayBufferWalker(buff);
        writer.writeUint32(3000);

        let dv = new DataView(buff);
        expect(dv.getUint32(0)).toEqual(3000);

        let reader = new ArrayBufferWalker(buff);
        expect(reader.readUint32()).toEqual(3000);

    })

    it("should write and read uint32 little-endian", () => {
        let buff = new ArrayBuffer(4);

        let writer = new ArrayBufferWalker(buff);
        writer.writeUint32(3000, true);

        let dv = new DataView(buff);
        expect(dv.getUint32(0, true)).toEqual(3000);

        let reader = new ArrayBufferWalker(buff);
        expect(reader.readUint32(true)).toEqual(3000);

    })

    it("should write and read uint8", () => {
        let buff = new ArrayBuffer(2);

        let writer = new ArrayBufferWalker(buff);
        writer.writeUint8(125);

        let array = new Uint8Array(buff);
        expect(array[0]).toEqual(125);

        let reader = new ArrayBufferWalker(buff);
        let value = reader.readUint8();
        expect(value).toEqual(125);

    })

    it("should write and read uint16 big-endian", () => {
        let buff = new ArrayBuffer(4);

        let writer = new ArrayBufferWalker(buff);
        writer.writeUint16(65533);


        let dv = new DataView(buff);
        expect(dv.getUint16(0, false)).toEqual(65533);

        let reader = new ArrayBufferWalker(buff);
        expect(reader.readUint16()).toEqual(65533);

    })

    it("should write and read uint16 little-endian", () => {
        let buff = new ArrayBuffer(4);

        let writer = new ArrayBufferWalker(buff);
        writer.writeUint16(65533, true);


        let dv = new DataView(buff);
        expect(dv.getUint16(0, true)).toEqual(65533);

        let reader = new ArrayBufferWalker(buff);
        expect(reader.readUint16(true)).toEqual(65533);

    })

    it("should write and read strings", () => {
        let buff = new ArrayBuffer(5);

        let writer = new ArrayBufferWalker(buff);
        writer.writeString("Hello");

        let reader = new ArrayBufferWalker(buff);
        let value = reader.readString(5);
        expect(value).toEqual("Hello");
    });

    it("should combine operations successfully", () => {

        let buff = new ArrayBuffer(4 + 2 + 5);

        let writer = new ArrayBufferWalker(buff);
        writer.writeString("Hello");
        writer.writeUint32(2465);
        writer.writeUint8(255);

        let reader = new ArrayBufferWalker(buff);
        expect(reader.readString(5)).toEqual("Hello");
        expect(reader.readUint32()).toEqual(2465);
        expect(reader.readUint8()).toEqual(255);

    })

    it("should save CRCs correctly", () => {
        let buff = new ArrayBuffer(8);
        let writer = new ArrayBufferWalker(buff);
        let reader = new ArrayBufferWalker(buff);
        writer.startCRC();
        writer.writeUint32(3000);
        writer.writeCRC();

        expect(writer.offset).toEqual(8);

        reader.offset = 4;
        let crc = reader.readUint32();
        let checkCRC = crc32(new Uint8Array(buff), 0, 4);

        expect(crc).toEqual(checkCRC);
    })

    it("should save Adlers correctly", () => {
        let buff = new ArrayBuffer(8);
        let writer = new ArrayBufferWalker(buff);
        let reader = new ArrayBufferWalker(buff);
        writer.startAdler();
        writer.writeUint32(3000);
        writer.writeAdler();

        expect(writer.offset).toEqual(8);

        reader.offset = 4;
        let adler = reader.readUint32();
        let checkAdler = adler32_buf(new Uint8Array(buff), 0, 4);

        expect(adler).toEqual(checkAdler);
    })
})