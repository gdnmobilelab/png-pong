import { ArrayBufferWalkerStream } from '../../src/util/walker-stream';
import '../test-util/readable-stream-shim';
import * as expect from 'expect';

describe.only("ArrayBufferWalker stream", () => {
    it("Should return a regular walker when given enough data", () => {

        let stream = new ReadableStream<ArrayBuffer, ArrayBuffer>({
            start(c) {

                let arr = new Uint8Array(10);
                arr.forEach((i, idx) => arr[idx] = idx);
                c.enqueue(arr.buffer);
            },
            pull() { },
            cancel() { }
        });

        let reader = stream.getReader();

        let walk = new ArrayBufferWalkerStream(reader);

        return walk.readExact(8)
            .then((read) => {
                expect(read!.value!.length).toEqual(8);
                expect(read!.value!.readUint8()).toEqual(0);
                expect(read!.value!.readUint8()).toEqual(1);
                return walk.readExact(2);
            })
            .then((read) => {
                expect(read!.value!.length).toEqual(8);
                expect(read!.value!.readUint8()).toEqual(0);
            })



    })
})