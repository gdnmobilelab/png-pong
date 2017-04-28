import { crc32 } from './crc';
import { adler32_buf } from './adler';

function swap16(val) {
    return ((val & 0xFF) << 8)
        | ((val >> 8) & 0xFF);
}

function swap32(val) {
    return ((val & 0xFF) << 24)
        | ((val & 0xFF00) << 8)
        | ((val >> 8) & 0xFF00)
        | ((val >> 24) & 0xFF);
}

export class ArrayBufferWalker {

    offset = 0;
    array: Uint8Array;

    constructor(private buffer: ArrayBuffer) {
        this.array = new Uint8Array(buffer);
    }

    writeUint32(value, littleEndian = false) {

        if (littleEndian) {
            value = swap32(value);
        }

        this.array[this.offset++] = (value >> 24) & 255;
        this.array[this.offset++] = (value >> 16) & 255;
        this.array[this.offset++] = (value >> 8) & 255;
        this.array[this.offset++] = value & 255;
    }

    writeUint16(value, littleEndian = false) {

        if (littleEndian) {
            value = swap16(value);
        }

        this.array[this.offset++] = (value >> 8) & 255;
        this.array[this.offset++] = value & 255;
    }

    writeUint8(value) {
        this.array[this.offset++] = value & 255;
    }

    writeString(value) {
        for (let i = 0, n = value.length; i < n; i++) {
            this.array[this.offset++] = value.charCodeAt(i);
        }
    }

    readUint32(littleEndian = false) {
        let val = this.array[this.offset++] << 24;
        val += this.array[this.offset++] << 16;
        val += this.array[this.offset++] << 8;
        val += this.array[this.offset++] & 255;
        return littleEndian ? swap32(val) : val;
    }

    readUint16(littleEndian = false) {
        let val = this.array[this.offset++] << 8;
        val += this.array[this.offset++] & 255;
        return littleEndian ? swap16(val) : val;
    }

    readUint8() {
        return this.array[this.offset++] & 255;
    }

    readString(length) {

        let result = "";
        let target = this.offset + length;

        while (this.offset < target) {
            result += String.fromCharCode(this.array[this.offset++]);
        }

        return result;

    }


    crcStartOffset?: number
    startCRC() {
        if (this.crcStartOffset) {
            throw new Error("CRC already started")
        }
        this.crcStartOffset = this.offset;
    }


    writeCRC() {
        if (this.crcStartOffset === undefined) {
            throw new Error("CRC has not been started, cannot write");
        }

        let crc = crc32(this.array, this.crcStartOffset, this.offset - this.crcStartOffset);

        this.crcStartOffset = undefined;
        this.writeUint32(crc);

    }

    adlerStartOffset?: number;
    startAdler() {
        if (this.adlerStartOffset) {
            throw new Error("Adler already started")
        }
        this.adlerStartOffset = this.offset;
    }


    writeAdler() {
        if (this.adlerStartOffset === undefined) {
            throw new Error("CRC has not been started, cannot write");
        }
        let adler = adler32_buf(this.array, this.adlerStartOffset, this.offset - this.adlerStartOffset);

        this.adlerStartOffset = undefined;
        this.writeUint32(adler);

    }
}