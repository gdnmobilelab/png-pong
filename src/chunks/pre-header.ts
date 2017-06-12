import { ArrayBufferWalker } from '../util/arraybuffer-walker';

const PRE_HEADER = '\x89PNG\r\n\x1A\n';


/**
 * PNG files have a very basic header that identifies the PNG
 * file as... a PNG file. We need to write that out.
 * 
 * @export
 * @param {ArrayBufferWalker} walker 
 */
export function writePreheader(walker: ArrayBufferWalker) {
    walker.writeString(PRE_HEADER);
}


/**
 * Make sure that we're dealing with a PNG file. Throws an error
 * if the file does not start with the standard PNG header.
 * 
 * @export
 * @param {ArrayBufferWalker} walker 
 */
export function checkPreheader(walker: ArrayBufferWalker) {
    let value = walker.readString(PRE_HEADER.length);
    if (value !== PRE_HEADER) {
        throw new Error("Buffer does not have a PNG file header.");
    }
}

export const length = PRE_HEADER.length;