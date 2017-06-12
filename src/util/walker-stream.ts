import { ArrayBufferWalker } from './arraybuffer-walker';
import { MultiArrayBufferWalker } from './multiarraybuffer-walker';

interface PartiallyUsedArrayBuffer {
    array: Uint8Array;
    offset: number;
}

export class ArrayBufferWalkerStream {

    private pending: PartiallyUsedArrayBuffer[] = [];

    constructor(private reader: StreamReader<ArrayBuffer>) {

    }

    private readIntoPending() {
        return this.reader.read()
            .then((read) => {
                if (read.done === true) {
                    return undefined;
                }
                this.pending.push({
                    array: new Uint8Array(read.value!),
                    offset: 0
                })

                return read.value!.byteLength;
            })
    }

    private readUntilReachedLength(untilLength: number, currentLength: number = -1): Promise<number | undefined> {

        if (currentLength === -1) {
            currentLength = this.pending.reduce((a, b) => a + b.array.length - b.offset, 0);
        }

        if (currentLength >= untilLength) {
            // If we already have enough data in our pending store
            // then there's no need to run a read.
            return Promise.resolve(currentLength);
        }

        return this.readIntoPending()
            .then((length) => {
                if (!length) {
                    return undefined;
                }
                currentLength += length;

                if (currentLength >= untilLength) {
                    return currentLength;
                }

                return this.readUntilReachedLength(untilLength, currentLength);
            })

    }

    readExact(byteLength: number) {

        return this.readUntilReachedLength(byteLength)
            .then((finalLength) => {

                if (finalLength === undefined) {
                    throw new Error("There was not enough data left");
                }

                if (this.pending.length === 1) {
                    // If there is only one then we need to do our length adjustment
                    // before creating the walker.

                    let lengthDiff = finalLength - byteLength;

                    let pendingLength = this.pending[0].array.length - this.pending[0].offset;

                    let currentOffset = this.pending[0].offset;
                    let newOffset = currentOffset + pendingLength - lengthDiff;
                    console.log('l?', lengthDiff, pendingLength, newOffset, currentOffset)
                    this.pending[0].offset = newOffset;
                    return {
                        done: false,
                        value: new MultiArrayBufferWalker(this.pending[0].array, currentOffset, currentOffset)
                    }

                }

                let first = this.pending.shift()!;
                let last = this.pending.pop();

                let walker = new MultiArrayBufferWalker(first.array, first.offset);

                while (this.pending.length > 0) {
                    let { array, offset } = this.pending.shift()!;
                    walker.add(array, offset);
                }

                if (last) {

                    let lastLength = last.array.length - last.offset;
                    let lengthToSend = finalLength - byteLength;
                    console.log('to send', lengthToSend)

                    walker.add(last.array, last.offset);
                }


                this.pending = [];

                return {
                    done: false,
                    value: walker
                };



            })


    }

    // read(byteLength?: number): Promise<StreamRead<ArrayBufferWalker>> {

    // if (this.partiallyUsedArrayBuffer) {

    //     let { arrayBuffer, offset } = this.partiallyUsedArrayBuffer;

    //     if (!byteLength) {

    //         // If we haven't requested a specific byte length, then just throw out
    //         // the entire partial array 

    //         this.partiallyUsedArrayBuffer = undefined;
    //         return Promise.resolve({
    //             done: false,
    //             value: new ArrayBufferWalker(arrayBuffer, offset)
    //         })
    //     }

    //     if (arrayBuffer.byteLength - offset === byteLength) {
    //         // If the request is for the exact remaining length of the array,
    //         // then send it and clear.
    //         this.partiallyUsedArrayBuffer = undefined;
    //         return Promise.resolve({
    //             done: false,
    //             value: new ArrayBufferWalker(arrayBuffer, offset, arrayBuffer.byteLength - offset)
    //         })
    //     }

    // }


    // return this.reader.read()
    //     .then((read) => {

    //         if (read.done) {
    //             return {
    //                 done: true,
    //                 value: undefined
    //             }
    //         }

    //         if (read.value!.byteLength == byteLength) {
    //             return {
    //                 done: false,
    //                 value: new ArrayBufferWalker(read.value!)
    //             }
    //         } else if (read.value!.byteLength > byteLength) {

    //             this.partiallyUsedArrayBuffer = {
    //                 arrayBuffer: read.value!,
    //                 offset: byteLength
    //             };

    //             return {
    //                 done: false,
    //                 value: new ArrayBufferWalker(read.value!, 0, byteLength)
    //             }

    //         }

    //         throw new Error("no");


    //     })
    // }

}