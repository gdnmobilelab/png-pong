import { ArrayBufferWalker } from './util/arraybuffer-walker';
import { check as checkPreheader } from './chunks/pre-header';
import { read as readIHDR, IHDROptions } from './chunks/ihdr';
import { read as readPalette, Palette } from './chunks/palette';
import { DataCallback } from './util/data-callback';
import { readZlib } from './util/zlib';

export class EventPayloads {
    header: IHDROptions
    palette: Palette
    data: DataCallback
};

export type Callback<T> = (arg: T) => void;

export type EventCallback<K extends keyof EventPayloads> = (arg: EventPayloads[K]) => void

export class PngPong {

    walker: ArrayBufferWalker;

    headerListeners: Callback<IHDROptions>[] = [];
    paletteListeners: Callback<Palette>[] = [];
    dataListeners: DataCallback[] = [];

    // height:number;
    width: number;

    constructor(private source: ArrayBuffer) {
        this.walker = new ArrayBufferWalker(source);
    }

    readData(dataLength: number) {

        // Need to include the chunk identifier in the CRC. Need a better
        // way to do this.

        this.walker.skip(-4);
        this.walker.startCRC();
        this.walker.skip(4);

        let rowFilterBytesSkipped = 1;

        // Our PNG rows can be split across chunks, so we need to track
        // overall data length
        let dataReadSoFar = 0;

        readZlib(this.walker, (arr, readOffset, dataOffset, length) => {

            // The PNG stream has a row filter flag at the start of every row
            // which we want to disregard and not send to any listeners. So
            // we split up the data as we receive it into chunks, around that
            // flag.

            // ignore our first row flag
            let blockReadOffset = 0;

            while (blockReadOffset < length) {

                // In order to match rows across blocks and also ignore row flags,
                // we need to keep track of our current coordinate.
                let xAtThisPoint = dataReadSoFar % this.width;

                if (blockReadOffset === 0 && xAtThisPoint === 0) {
                    // If we're starting a new block AND it's the start of a row,
                    // we need to skip our row filter byte
                    blockReadOffset++;
                }

                let yAtThisPoint = (dataReadSoFar - xAtThisPoint) / this.width;

                // If we have an entire image row we can read, do that. If we have a partial
                // row, do that. If we have the end of a block, do that.
                let amountToRead = Math.min(this.width - xAtThisPoint, length - blockReadOffset);

                this.dataListeners.forEach((d) => d(this.walker.array, readOffset + blockReadOffset, xAtThisPoint, yAtThisPoint, amountToRead));

                // update our offsets to match the pixel amounts we just read
                dataReadSoFar += amountToRead;
                blockReadOffset += amountToRead;

                // now ALSO update our block offset to skip the next row filter byte
                blockReadOffset++;

            }

        });

        this.walker.writeCRC();
        // this.walker.skip(4)

        this.readChunk();


    }

    readChunk() {
        let length = this.walker.readUint32();
        let identifier = this.walker.readString(4);

        if (identifier === "IHDR") {
            let hdr = readIHDR(this.walker, length);

            this.width = hdr.width;

            this.headerListeners.forEach((l) => {
                l(hdr);
            });

            this.readChunk();

        } else if (identifier === "PLTE") {
            let plte = readPalette(this.walker, length);

            this.paletteListeners.forEach((l) => l(plte));

            plte.writeCRCs();
            this.readChunk();
        } else if (identifier === "IDAT") {

            this.readData(length);

        } else if (identifier === "IEND") {

            // we're done

        } else {
            throw new Error(`Did not recognise ${length} byte chunk: ${identifier}`);
        }

    }


    transform() {
        checkPreheader(this.walker);
        this.readChunk();
        return this.source;
        // console.log(readIHDR(this.walker))
    }


    onHeader(listener: Callback<IHDROptions>) {
        this.headerListeners.push(listener);
    }

    onPalette(listener: Callback<Palette>) {
        this.paletteListeners.push(listener)
    }

    onData(listener: DataCallback) {
        this.dataListeners.push(listener)
    }

}