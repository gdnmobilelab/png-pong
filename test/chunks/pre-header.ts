import * as PreHeader from '../../src/chunks/pre-header';
import { ArrayBufferWalker } from '../../src/util/arraybuffer-walker';

const PRE_HEADER = '\x89PNG\r\n\x1A\n';

// describe("PNG Preheader Chunk", () => {
//     it("Should write correctly", () => {

//         let walker = new ArrayBufferWalker(PRE_HEADER.length);
//         PreHeader.write(walker);
//         walk

//     })
// });