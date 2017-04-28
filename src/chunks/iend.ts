import { ArrayBufferWalker } from '../util/arraybuffer-walker';

const identifier = "IEND";

export function write(walker: ArrayBufferWalker) {

    walker.writeUint32(0);
    walker.startCRC();
    walker.writeString(identifier);
    walker.writeCRC();

}

export const length = identifier.length // identifier
    + 4                 // CRC
    + 4                 // length