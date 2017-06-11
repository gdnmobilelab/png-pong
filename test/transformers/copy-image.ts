import { PngPongTransformer, PngPongImageCopier } from '../../src';
import { createWithMetadata } from '../../src/writer';
import { PNG } from 'pngjs';
import * as expect from 'expect';

describe("Image Copier", () => {

    it("should copy an image successfully", (done) => {

        let sourcePNG = createWithMetadata(20, 20, 2, [255, 0, 0]);
        let targetPNG = createWithMetadata(60, 60, 3, [255, 255, 255]);

        let transformer = new PngPongTransformer(targetPNG);
        let imageCopier = new PngPongImageCopier(sourcePNG, transformer);

        imageCopier.copy(5, 5, 15, 15, 10, 10);

        transformer.transform();

        // let b = new Buffer(new Uint8Array(targetPNG));
        // require('fs').writeFileSync('/tmp/copy-out.png', b);


        let arr = new Uint8Array(targetPNG);
        let buff = new Buffer(arr);

        new PNG({ filterType: 4 }).parse(buff, (err, png) => {

            let resultArray = new Uint8Array(png.data);
            expect(resultArray[0]).toEqual(255);
            expect(resultArray[1]).toEqual(255);
            expect(resultArray[2]).toEqual(255);

            let imageStart = ((60 * 10) + 10) * 4;

            expect(resultArray[imageStart]).toEqual(255);
            expect(resultArray[imageStart + 1]).toEqual(0);
            expect(resultArray[imageStart + 2]).toEqual(0);

            done();
        })

    })

})