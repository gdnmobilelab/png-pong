import { ArrayBufferWalker } from './arraybuffer-walker';
import { adler32_buf } from './adler';

export const ZLIB_WINDOW_SIZE = 1024 * 32; // 32KB
export const BLOCK_SIZE = 65535;

export function calculateZlibbedLength(dataLength: number) {

    let numberOfBlocks = Math.ceil(dataLength / BLOCK_SIZE);

    return 1                                // Compression method/flags code
        + 1                                 // Additional flags/check bits
        + (5 * numberOfBlocks)              // Number of Zlib block headers we'll need
        + 4                                 // ADLER checksum
        + dataLength;                       // The actual data.
};


export class ZlibWriter {

    bytesLeftInWindow = 0;
    bytesLeft: number;
    currentAdler?: number;
    windowStartOffset: number;

    private writeToUnderlyingWalker: (value: number) => void

    constructor(private walker: ArrayBufferWalker, dataLength: number) {
        this.bytesLeft = dataLength;
        this.writeZlibHeader();
        this.startBlock();
        // this.startAdler();
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

        this.windowStartOffset = this.walker.offset;
        this.bytesLeftInWindow = Math.min(this.bytesLeft, BLOCK_SIZE);
    }

    writeUint8(val: number) {

        if (this.bytesLeft <= 0) {
            throw new Error("Ran out of space")
        }

        if (this.bytesLeftInWindow === 0 && this.bytesLeft > 0) {

            this.currentAdler = adler32_buf(this.walker.array, this.windowStartOffset, this.walker.offset - this.windowStartOffset, this.currentAdler);
            this.startBlock();

        }

        this.walker.writeUint8(val);
        this.bytesLeftInWindow--;
        this.bytesLeft--;


    }

    end() {
        this.currentAdler = adler32_buf(this.walker.array, this.windowStartOffset, this.walker.offset - this.windowStartOffset, this.currentAdler);
        this.walker.writeUint32(this.currentAdler);
    }

    // adlerStartOffset?: number;
    // startAdler() {
    //     if (this.adlerStartOffset) {
    //         throw new Error("Adler already started")
    //     }
    //     this.adlerStartOffset = this.walker.offset;
    // }


    // writeAdler() {
    //     if (this.adlerStartOffset === undefined) {
    //         throw new Error("CRC has not been started, cannot write");
    //     }
    //     let adler = adler32_buf(this.walker.array, this.adlerStartOffset, this.walker.offset - this.adlerStartOffset);

    //     this.adlerStartOffset = undefined;
    //     this.walker.writeUint32(adler);

    // }
}