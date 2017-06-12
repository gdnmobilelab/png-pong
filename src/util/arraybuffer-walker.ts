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


/**
 * A class that "walks" through an ArrayBuffer, either reading or writing
 * values as it goes. Intended as a less performance-draining alternative
 * to a DataView.
 * 
 * @export
 * @class ArrayBufferWalker
 */
export class ArrayBufferWalker {


    /**
     * The current index our walker is sat at. Can be modified.
     * 
     * @memberof ArrayBufferWalker
     */
    offset = 0;
    array: Uint8Array;


    /**
     * Creates an instance of ArrayBufferWalker.
     * @param {(ArrayBuffer | number)} bufferOrLength - either an existing ArrayBuffer
     * or the length of a new array you want to use.
     * 
     * @memberof ArrayBufferWalker
     */
    constructor(private bufferOrLength: ArrayBuffer | number) {
        if (bufferOrLength instanceof ArrayBuffer) {
            this.array = new Uint8Array(bufferOrLength);
        } else {
            this.array = new Uint8Array(bufferOrLength);
        }
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


    /**
     * Move around the array without writing or reading a value.
     * 
     * @param {any} length 
     * 
     * @memberof ArrayBufferWalker
     */
    skip(length) {
        this.offset += length;
    }


    rewindUint32() {
        this.offset -= 4;
    }

    rewindString(length) {
        this.offset -= length;
    }

    private crcStartOffset?: number


    /**
     * Mark the beginning of an area we want to calculate the CRC for.
     * 
     * @memberof ArrayBufferWalker
     */
    startCRC() {
        if (this.crcStartOffset) {
            throw new Error("CRC already started")
        }
        this.crcStartOffset = this.offset;
    }


    /**
     * After using .startCRC() to mark the start of a block, use this to mark the
     * end of the block and write the UInt32 CRC value.
     * 
     * @memberof ArrayBufferWalker
     */
    writeCRC() {
        if (this.crcStartOffset === undefined) {
            throw new Error("CRC has not been started, cannot write");
        }

        let crc = crc32(this.array, this.crcStartOffset, this.offset - this.crcStartOffset);

        this.crcStartOffset = undefined;
        this.writeUint32(crc);

    }

    private adlerStartOffset?: number;
    private savedAdlerValue?: number;


    /**
     * Similar to .startCRC(), this marks the start of a block we want to calculate the
     * ADLER32 checksum of.
     * 
     * @memberof ArrayBufferWalker
     */
    startAdler() {
        if (this.adlerStartOffset) {
            throw new Error("Adler already started")
        }
        this.adlerStartOffset = this.offset;
    }


    /**
     * ADLER32 is used in our ZLib blocks, but can span across multiple blocks. So sometimes
     * we need to pause it in order to start a new block.
     * 
     * @memberof ArrayBufferWalker
     */
    pauseAdler() {
        if (this.adlerStartOffset === undefined) {
            throw new Error("Adler has not been started, cannot pause");
        }
        this.savedAdlerValue = adler32_buf(this.array, this.adlerStartOffset, this.offset - this.adlerStartOffset, this.savedAdlerValue);
        this.adlerStartOffset = undefined;
    }


    /**
     * Similar to .writeCRC(), this marks the end of an ADLER32 checksummed block, and
     * writes the Uint32 checksum value to the ArrayBuffer.
     * 
     * @returns 
     * 
     * @memberof ArrayBufferWalker
     */
    writeAdler() {
        if (this.adlerStartOffset === undefined && this.savedAdlerValue === undefined) {
            throw new Error("CRC has not been started, cannot write");
        }

        if (this.adlerStartOffset === undefined) {
            this.writeUint32(this.savedAdlerValue);
            this.savedAdlerValue = undefined;
            return;
        }

        let adler = adler32_buf(this.array, this.adlerStartOffset, this.offset - this.adlerStartOffset, this.savedAdlerValue);

        this.adlerStartOffset = undefined;
        this.writeUint32(adler);

    }
}