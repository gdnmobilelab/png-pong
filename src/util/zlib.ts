import { ArrayBufferWalker } from './arraybuffer-walker';
import { adler32_buf } from './adler';
import { DataCallback } from './data-callback';

export const ZLIB_WINDOW_SIZE = 1024 * 32; // 32KB
export const BLOCK_SIZE = 65535;



/**
 * Zlibbed data takes up more space than the raw data itself - we aren't
 * compressing it but we do need to add block headers and the like.
 * 
 * @export
 * @param {number} dataLength 
 * @returns 
 */
export function calculateZlibbedLength(dataLength: number) {

    let numberOfBlocks = Math.ceil(dataLength / BLOCK_SIZE);

    return 1                                // Compression method/flags code
        + 1                                 // Additional flags/check bits
        + (5 * numberOfBlocks)              // Number of Zlib block headers we'll need
        + 4                                 // ADLER checksum
        + dataLength;                       // The actual data.
};


/**
 * Our tool for writing IDAT chunks. Although Zlib is used for compression,
 * we aren't compressing anything here. Basically, this writes a Zlib chunk
 * as if it is set to a compression level of 0.
 * 
 * @export
 * @class ZlibWriter
 */
export class ZlibWriter {

    bytesLeftInWindow = 0;
    bytesLeft: number;

    constructor(private walker: ArrayBufferWalker, dataLength: number) {
        this.bytesLeft = dataLength;
        this.writeZlibHeader();
        this.startBlock();
    }

    writeZlibHeader() {
        // http://stackoverflow.com/questions/9050260/what-does-a-zlib-header-look-like

        let cinfo = Math.LOG2E * Math.log(ZLIB_WINDOW_SIZE) - 8;
        let compressionMethod = 8; // DEFLATE, only valid value.

        let zlibHeader = new Uint8Array(2);
        let cmf = (cinfo << 4) | compressionMethod;

        // Lifted a lot of this code from here: https://github.com/imaya/zlib.js/blob/master/src/deflate.js#L110

        let fdict = 0; // not totally sure what this is for
        let flevel = 0; // compression level. We don't want to compress at all

        let flg = (flevel << 6) | (fdict << 5);
        let fcheck = 31 - (cmf * 256 + flg) % 31;
        flg |= fcheck;

        this.walker.writeUint8(cmf);
        this.walker.writeUint8(flg);

    }

    startBlock() {

        // Whether this is the final block. If we've got less than 32KB to write, then yes.
        let bfinal = this.bytesLeft < BLOCK_SIZE ? 1 : 0;

        // Compression type. Will always be zero = uncompressed
        let btype = 0;

        // Again, this logic comes from: https://github.com/imaya/zlib.js/blob/master/src/deflate.js#L110

        let blockLength = Math.min(this.bytesLeft, BLOCK_SIZE);

        this.walker.writeUint8((bfinal) | (btype << 1));

        let nlen = (~blockLength + 0x10000) & 0xffff;

        // IMPORTANT: these values must be little-endian.
        this.walker.writeUint16(blockLength, true);
        this.walker.writeUint16(nlen, true);

        this.bytesLeftInWindow = Math.min(this.bytesLeft, BLOCK_SIZE);
        this.walker.startAdler();
    }

    writeUint8(val: number) {

        if (this.bytesLeft <= 0) {
            throw new Error("Ran out of space")
        }

        if (this.bytesLeftInWindow === 0 && this.bytesLeft > 0) {
            this.walker.pauseAdler();
            this.startBlock();

        }

        this.walker.writeUint8(val);
        this.bytesLeftInWindow--;
        this.bytesLeft--;


    }

    end() {
        this.walker.writeAdler();
    }
}

export type ZlibReadCallback = (array: Uint8Array, readOffset: number, dataOffset: number, length: number) => void;


/**
 * Utility function to parse out a Zlib-encoded block (at a compression level of 0 only). Will
 * skip over Zlib headers and block markers, and call the dataCallback repeatedly when actual
 * data is available.
 * 
 * @export
 * @param {ArrayBufferWalker} walker 
 * @param {ZlibReadCallback} dataCallback 
 */
export function readZlib(walker: ArrayBufferWalker, dataCallback: ZlibReadCallback) {

    // Disregard Zlib header
    walker.skip(2);

    let bfinal = false;
    let dataOffset = 0;

    while (bfinal === false) {
        // Start of first block
        bfinal = walker.readUint8() === 1;

        let blockLength = walker.readUint16(true);
        // console.log(`zlib block: ${blockLength} bytes, final: ${bfinal}`)
        // skip nlen
        walker.skip(2);

        // data might change during this time, so we recalc the adler
        walker.startAdler();
        dataCallback(walker.array, walker.offset, dataOffset, blockLength);

        walker.offset += blockLength;
        dataOffset += blockLength;
        walker.pauseAdler();
    }

    walker.writeAdler();

}