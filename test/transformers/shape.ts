import { PngPongTransformer, PngPongShapeTransformer } from '../../src';
import { createBlankPNG } from '../util/blank-png';
import { PNG } from 'pngjs';
import * as expect from 'expect';

describe("Shape transformer", () => {
    it("should draw a rectangle", (done) => {

        let png = createBlankPNG(200, 200, [255, 255, 255, 255], 1);

        let transformer = new PngPongTransformer(png);

        let shape = new PngPongShapeTransformer(transformer);
        shape.drawRect(10, 10, 20, 20, [255, 0, 0]);

        transformer.transform();

        let arr = new Uint8Array(png);
        let buff = new Buffer(arr);

        new PNG({ filterType: 4 }).parse(buff, (err, png) => {

            let resultArray = new Uint8Array(png.data);
            expect(resultArray[0]).toEqual(255);
            expect(resultArray[1]).toEqual(255);
            expect(resultArray[2]).toEqual(255);

            let squareStart = ((200 * 10) + 10) * 4;

            expect(resultArray[squareStart]).toEqual(255);
            expect(resultArray[squareStart + 1]).toEqual(0);
            expect(resultArray[squareStart + 2]).toEqual(0);

            expect(resultArray[squareStart + 4]).toEqual(255);
            expect(resultArray[squareStart + 5]).toEqual(0);
            expect(resultArray[squareStart + 6]).toEqual(0);

            let squareEnd = ((200 * 29) + 29) * 4;

            expect(resultArray[squareEnd]).toEqual(255);
            expect(resultArray[squareEnd + 1]).toEqual(0);
            expect(resultArray[squareEnd + 2]).toEqual(0);

            expect(resultArray[squareEnd + 4]).toEqual(255);
            expect(resultArray[squareEnd + 5]).toEqual(255);
            expect(resultArray[squareEnd + 6]).toEqual(255);

            done();
        })


    })
})