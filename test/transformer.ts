import { PngPongTransformer } from '../src/transformer';
import { createWithMetadata } from '../src/writer';
import { PNGColorType } from '../src/chunks/ihdr';
import * as expect from 'expect';
import { PNG } from 'pngjs';

describe("PNG Transformer", () => {
    it("should successfully parse a PNG header", (done) => {

        let source = createWithMetadata(200, 200, 2, [255, 0, 0]);

        let transformer = new PngPongTransformer(source);

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

        let source = createWithMetadata(200, 200, 2, [255, 0, 0, 100]);

        let transformer = new PngPongTransformer(source);

        transformer.onPalette((palette) => {
            let getIndex = palette.getColorIndex([255, 0, 0, 100]);
            expect(getIndex).toEqual(1);
            done();
        })

        transformer.transform();

    })

    it("should successfully write to a PNG palette", (done) => {

        let source = createWithMetadata(200, 200, 3, [255, 0, 0, 100]);

        let transformer = new PngPongTransformer(source);

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

        let source = createWithMetadata(200, 200, 2, [255, 0, 0, 100]);

        let transformer = new PngPongTransformer(source);

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

        let source = createWithMetadata(20, 20, 3, [255, 0, 0]);

        let transformer = new PngPongTransformer(source);

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