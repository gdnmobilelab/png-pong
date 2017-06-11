import { createFromRGBArray, createWithMetadata } from '../src/writer';

describe("PNG Writer", () => {
    it("Should write a valid PNG file from RGBA array", (done) => {

        let rgbaArray = new Uint8ClampedArray(300 * 200 * 4);

        for (let i = 0; i < rgbaArray.length; i = i + 4) {
            rgbaArray[i] = 255;
            rgbaArray[i + 3] = 100;
        }

        let buffer = createFromRGBArray(300, 200, rgbaArray);
        let nodeBuffer = new Buffer(new Uint8Array(buffer));
        const fs = require('fs');
        const exec = require('child_process').exec;
        fs.writeFileSync('/tmp/test.png', nodeBuffer);

        let pngcheck = exec("pngcheck -vv /tmp/test.png", (err, stdout, stderr) => {
            if (err) {
                done(new Error(stdout));
            } else {
                // console.log(stdout)
                done();
            }
        });
    })

    it("Should write a valid PNG file from metadata", (done) => {



        let buffer = createWithMetadata(300, 200, 2, [255, 0, 0]);
        let nodeBuffer = new Buffer(new Uint8Array(buffer));
        const fs = require('fs');
        const exec = require('child_process').exec;
        fs.writeFileSync('/tmp/test-red.png', nodeBuffer);

        let pngcheck = exec("pngcheck -vv /tmp/test.png", (err, stdout, stderr) => {
            if (err) {
                done(new Error(stdout));
            } else {
                // console.log(stdout)
                done();
            }
        });
    })
})