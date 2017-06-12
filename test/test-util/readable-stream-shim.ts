interface PendingReadPromise<T> {
    fulfill: (T) => void;
    reject: (Error) => void;
}

class NodeReadableStream<I, O>  {

    closed = false;

    pendingBlocks: StreamRead<O>[] = [];
    pendingPromises: PendingReadPromise<O>[] = [];

    constructor(private handler: ReadableStreamHandler<I, O>) {

        this.read = this.read.bind(this);
        this._enqueue = this._enqueue.bind(this);
        this._close = this._close.bind(this);

        handler.start({
            enqueue: this._enqueue,
            close: this._close,
            error: () => { }
        })

    }

    pushPendingBlock(block: StreamRead<O>) {
        this.pendingBlocks.push(block);
        this.pendingPromises.forEach(({ fulfill }) => {
            fulfill(block);
        })
        this.pendingPromises = [];
    }

    _enqueue(block: O) {
        this.pushPendingBlock({
            done: false,
            value: block
        })
    }

    _close() {
        this.closed = true;
        this.pushPendingBlock({
            done: true
        })
    }

    doPull() {

        if (!this.handler.pull) {
            return Promise.resolve();
        }

        return Promise.resolve(this.handler.pull({
            enqueue: this._enqueue,
            close: this._close,
            error: () => { }
        }));
    }

    read() {
        return Promise.resolve()
            .then(() => {

                if (this.closed && this.pendingBlocks.length[0]) {
                    return {
                        done: true
                    }
                }


                let oldest = this.pendingBlocks.shift();
                if (oldest) {
                    return Promise.resolve(oldest);
                } else {

                    return this.doPull()
                        .then(() => {
                            if (this.pendingBlocks.length === 0) {
                                throw new Error("Still no data after running pull")
                            }
                        })
                        .then(() => this.read())


                }
            })
            .then((result) => {
                // to match the behaviour of browser streams, we should have another chunk
                // waiting and ready.
                return Promise.resolve()
                    .then(() => {
                        if (this.pendingBlocks.length === 0 && this.closed === false) {
                            return this.doPull();
                        }
                    })
                    .then(() => {
                        return result;
                    })


            })

    }

    getReader(): StreamReader<O> {
        return {
            read: this.read
        }
    }
}

let g = global as any;

if (!g.ReadableStream) {
    g.ReadableStream = NodeReadableStream;
}
