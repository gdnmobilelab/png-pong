import { PngPong } from '../src';
import { createBlankPNG } from './util/blank-png';
import { PNGColorType } from '../src/chunks/ihdr';
import * as expect from 'expect';
import { PNG } from 'pngjs';

describe("PNG Transformer", () => {
    it("should successfully parse a PNG header", (done) => {

        let source = createBlankPNG(200, 200, [255, 0, 0]);

        let transformer = new PngPong(source);

        transformer.onHeader((header) => {
            expect(header.width).toEqual(200);
            expect(header.height).toEqual(200);
            expect(header.bitDepth).toEqual(8);
            expect(header.colorType).toEqual(PNGColorType.Palette);
            done();
        })

        transformer.transform();

    });
    it("should successfully parse a PNG palette", (done) => {

        let source = createBlankPNG(200, 200, [255, 0, 0, 100]);

        let transformer = new PngPong(source);

        transformer.onPalette((palette) => {
            let getIndex = palette.getColorIndex([255, 0, 0, 100]);
            expect(getIndex).toEqual(1);
            done();
        })

        transformer.transform();

    })

    it("should successfully write to a PNG palette", (done) => {

        let source = createBlankPNG(200, 200, [255, 0, 0, 100], 1);

        let transformer = new PngPong(source);

        transformer.onPalette((palette) => {
            let newIndex = palette.addColor([0, 255, 0]);
            expect(newIndex).toEqual(2);

            let check = palette.getColorIndex([0, 255, 0]);
            expect(check).toEqual(newIndex);
            done();
        })

        transformer.transform();

    })

    it("should emit data events", (done) => {

        let source = createBlankPNG(200, 200, [255, 0, 0, 100]);

        let transformer = new PngPong(source);

        let numRowsEmitted = 0;
        transformer.onData((array, readOffset, dataOffset, length) => {
            numRowsEmitted++;
            if (numRowsEmitted === 200) {
                done();
            }
        })

        transformer.transform();

    })

    it("should transform an image and the PNG still be valid", (done) => {

        let source = createBlankPNG(20, 20, [255, 0, 0], 1);

        let transformer = new PngPong(source);

        let colorIndex = -1;
        transformer.onPalette((palette) => {
            colorIndex = palette.addColor([0, 255, 0]);
        })

        transformer.onData((arr, readOffset, dataOffset, length) => {
            for (let i = readOffset; i < readOffset + length; i++) {
                arr[i] = colorIndex;
            }
        })

        transformer.transform();

        let asBuffer = new Buffer(new Uint8Array(source));

        new PNG().parse(asBuffer, (err, data) => {
            // console.log(err, data)
            done(err);
        })
    })
})