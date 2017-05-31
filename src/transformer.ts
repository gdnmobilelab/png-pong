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

export class PngPongTransformer {

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

        readZlib(this.walker, (arr, readOffset, dataOffset, length) => {

            // console.log(`x:${x}, y:${y}, ${length}`)

            // The PNG stream has a row filter flag at the start of every row
            // which we want to disregard and not send to any listeners. So
            // we split up the data as we receive it into chunks, around that
            // flag.

            let dataSent = 1;
            let rowFilterBytesSkipped = 1;
            while (dataSent < length) {

                let individualReadOffset = readOffset + dataSent;
                let individualDataOffset = dataOffset + dataSent - rowFilterBytesSkipped;

                let individualLength = Math.min(this.width, length - dataSent);

                let x = individualDataOffset % this.width;
                let y = (individualDataOffset - x) / this.width;

                this.dataListeners.forEach((d) => d(this.walker.array, individualReadOffset, x, y, individualLength));

                // console.log('row filter?', this.walker.array.slice(individualReadOffset - 1, individualReadOffset + individualLength).join(","))
                // console.log(individualDataOffset, individualLength, this.walker.array[individualReadOffset])
                // // this.dataListeners.forEach((l) => l)
                dataSent += individualLength;

                dataSent += 1;
                rowFilterBytesSkipped++;
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