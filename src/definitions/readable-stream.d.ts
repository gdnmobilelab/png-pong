declare interface ReadableStreamController<T> {
    enqueue(val: T);
    close();
    error(Error);
}

declare interface ReadableStreamHandler<I, O> {

    start(c: ReadableStreamController<O>): void
    pull(c: ReadableStreamController<O>): Promise<any> | void
    cancel(any): void

}

declare interface StreamRead<T> {
    done: boolean;
    value?: T;
}

declare interface StreamReaderInterface<T> {
    read: () => Promise<StreamRead<T>>
}

declare class StreamReader<T> implements StreamReaderInterface<T> {
    read: () => Promise<StreamRead<T>>
}

declare class ReadableStream<I, O> {
    constructor(opts: ReadableStreamHandler<I, O>);
    getReader(): StreamReader<O>;
}