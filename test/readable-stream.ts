import './test-util/readable-stream-shim';
import * as expect from 'expect';


describe("Readable Stream Shim", () => {
    it("should allow us to stream contents", () => {
        let numberOfPulls = 0;
        let testStream = new ReadableStream<ArrayBuffer, ArrayBuffer>({
            start(c) {
                c.enqueue(new ArrayBuffer(4));
            },
            pull(c) {
                numberOfPulls++;
                if (numberOfPulls > 1) {
                    return c.close();
                }
                c.enqueue(new ArrayBuffer(5));

            },
            cancel() {

            }
        });

        let reader = testStream.getReader();

        return reader.read()
            .then((read) => {
                expect(read.value!.byteLength).toEqual(4);
                return reader.read();
            })
            .then((read) => {
                expect(read.value!.byteLength).toEqual(5);
                return reader.read();
            })
            .then((read) => {
                expect(read.done).toEqual(true);
                expect(read.value).toEqual(undefined);
            })



    })
})