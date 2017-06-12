import { crc32b } from './crc';
import { adler32_walker } from './adler';

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

    protected _offset: number;
    array: Uint8Array;

    public get offset() {
        return this._offset;
    }

    public set offset(val) {
        this._offset = val;
    }

    protected advanceOffset() {
        return this._offset++;
    }

    length: number;

    constructor(private buffer: ArrayBuffer | Uint8Array, offset = 0, length = -1) {
        if (buffer instanceof Uint8Array) {
            this.array = buffer;
        } else {
            this.array = new Uint8Array(buffer);
        }

        if (length > -1) {
            this.length = length;
        } else {
            this.length = this.array.length;
        }

        this._offset = offset;
    }

    writeUint32(value, littleEndian = false) {

        if (littleEndian) {
            value = swap32(value);
        }
        this.array[this.advanceOffset()] = (value >> 24) & 255;
        this.array[this.advanceOffset()] = (value >> 16) & 255;
        this.array[this.advanceOffset()] = (value >> 8) & 255;
        this.array[this.advanceOffset()] = value & 255;
    }

    writeUint16(value, littleEndian = false) {

        if (littleEndian) {
            value = swap16(value);
        }

        this.array[this.advanceOffset()] = (value >> 8) & 255;
        this.array[this.advanceOffset()] = value & 255;
    }

    writeUint8(value) {
        this.array[this.advanceOffset()] = value & 255;
    }

    writeString(value) {
        for (let i = 0, n = value.length; i < n; i++) {
            this.array[this.advanceOffset()] = value.charCodeAt(i);
        }
    }

    readUint32(littleEndian = false) {
        let val = this.array[this.advanceOffset()] << 24;
        val += this.array[this.advanceOffset()] << 16;
        val += this.array[this.advanceOffset()] << 8;
        val += this.array[this.advanceOffset()] & 255;
        return littleEndian ? swap32(val) : val;
    }

    readUint16(littleEndian = false) {
        let val = this.array[this.advanceOffset()] << 8;
        val += this.array[this.advanceOffset()] & 255;
        return littleEndian ? swap16(val) : val;
    }

    readUint8() {
        return this.array[this.advanceOffset()] & 255;
    }

    readString(length) {

        let result = "";
        let target = this._offset + length;

        while (this._offset < target) {
            result += String.fromCharCode(this.array[this.advanceOffset()]);
        }

        return result;

    }

    skip(length) {
        this._offset += length;
    }


    rewindUint32() {
        this._offset -= 4;
    }

    rewindString(length) {
        this._offset -= length;
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

        let crc = crc32b(this, this.crcStartOffset, this.offset - this.crcStartOffset);

        this.crcStartOffset = undefined;
        this.writeUint32(crc);

    }

    adlerStartOffset?: number;
    savedAdlerValue?: number;
    startAdler() {
        if (this.adlerStartOffset) {
            throw new Error("Adler already started")
        }
        this.adlerStartOffset = this.offset;
    }

    pauseAdler() {
        if (this.adlerStartOffset === undefined) {
            throw new Error("Adler has not been started, cannot pause");
        }
        this.savedAdlerValue = adler32_walker(this, this.adlerStartOffset, this.offset - this.adlerStartOffset, this.savedAdlerValue);
        this.adlerStartOffset = undefined;
    }

    writeAdler() {
        if (this.adlerStartOffset === undefined && this.savedAdlerValue === undefined) {
            throw new Error("Adler has not been started, cannot write");
        }

        if (this.adlerStartOffset === undefined) {
            this.writeUint32(this.savedAdlerValue);
            this.savedAdlerValue = undefined;
            return;
        }

        let adler = adler32_walker(this, this.adlerStartOffset, this.offset - this.adlerStartOffset, this.savedAdlerValue);

        this.adlerStartOffset = undefined;
        this.writeUint32(adler);

    }
}