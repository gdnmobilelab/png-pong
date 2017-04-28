import { ArrayBufferWalker } from '../util/arraybuffer-walker';

const PRE_HEADER = '\x89PNG\r\n\x1A\n';

export function write(walker: ArrayBufferWalker) {
    walker.writeString(PRE_HEADER);
}

export const length = PRE_HEADER.length;