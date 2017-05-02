import { ArrayBufferWalker } from '../util/arraybuffer-walker';

const PRE_HEADER = '\x89PNG\r\n\x1A\n';

export function write(walker: ArrayBufferWalker) {
    walker.writeString(PRE_HEADER);
}

export function check(walker: ArrayBufferWalker) {
    let value = walker.readString(PRE_HEADER.length);
    if (value !== PRE_HEADER) {
        throw new Error("Buffer does not have a PNG file header.");
    }
}

export const length = PRE_HEADER.length;