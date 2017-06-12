import { PngPong, Palette } from '../'
import { RGB } from '../util/color-types';

interface CopyOperation {
    sourceX: number;
    sourceWidth: number;
    sourceY: number;
    sourceHeight: number;
    targetX: number;
    targetY: number;
    pixels: Uint8Array;
    mask?: ColorMaskOptions;
}


/**
 * If you want to replace all of the RGB values in the source image with
 * a mask color and just use alpha values, you must provide both the
 * color you want to draw and the background color you want to multiply
 * the alpha with.
 * 
 * @export
 * @interface ColorMaskOptions
 */
export interface ColorMaskOptions {
    maskColor: RGB;
    backgroundColor: RGB;
}

function alphaBlend(color1: RGB, color2: RGB, alpha: number) {

    let alphaMultiply = alpha / 255;

    let redDiff = color1[0] - color2[0];
    let greenDiff = color1[1] - color2[1];
    let blueDiff = color1[2] - color2[2];

    let newColor = [
        color1[0] - Math.round(redDiff * alphaMultiply),
        color1[1] - Math.round(greenDiff * alphaMultiply),
        color1[2] - Math.round(blueDiff * alphaMultiply)
    ]

    return newColor

}


/**
 * A transformer to copy one or more sections of an image onto another.
 * 
 * @export
 * @class PngPongImageCopyTransformer
 */
export class PngPongImageCopyTransformer {

    private operations: CopyOperation[] = [];


    /**
     * Creates an instance of PngPongImageCopyTransformer.
     * @param {ArrayBuffer} sourceImage - the source PNG ArrayBuffer to read from. Must be
     * a PngPong suitable PNG.
     * @param {PngPong} targetTransformer - the transformer to add this image to.
     * 
     * @memberof PngPongImageCopyTransformer
     */
    constructor(private sourceImage: ArrayBuffer, private targetTransformer: PngPong) {
        this.targetTransformer.onPalette(this.onPalette.bind(this));
        this.targetTransformer.onData(this.onData.bind(this));
    }


    /**
     * Add a copy operation to the transformer. Must be done before running PngPong.run().
     * 
     * @param {number} sourceX 
     * @param {number} sourceY 
     * @param {number} sourceWidth 
     * @param {number} sourceHeight 
     * @param {number} targetX 
     * @param {number} targetY 
     * @param {ColorMaskOptions} [mask] - Optional argument to ignore the RGB value of the source image
     * and instead apply a color mask.
     * 
     * @memberof PngPongImageCopyTransformer
     */
    copy(sourceX: number, sourceY: number, sourceWidth: number, sourceHeight: number, targetX: number, targetY: number, mask?: ColorMaskOptions) {

        let pixelsRequired = sourceWidth * sourceHeight;

        let pixels = new Uint8Array(pixelsRequired);

        this.operations.push({
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            targetX,
            targetY,
            pixels,
            mask
        });
    }

    private onPalette(targetPalette: Palette) {

        // We need to grab our source image and add the new colors to the palette. At the same time
        // we record the new data arrays, to insert into the data later.

        let sourceTransformer = new PngPong(this.sourceImage);

        // grab the palette to do lookups
        let sourcePalette: Palette;
        sourceTransformer.onPalette((p) => sourcePalette = p);

        sourceTransformer.onData((array, readOffset, x, y, length) => {

            for (let i = 0; i < length; i++) {

                this.operations.forEach((operation) => {

                    if (y < operation.sourceY || y >= (operation.sourceY + operation.sourceHeight) || x < operation.sourceX || x >= (operation.sourceX + operation.sourceWidth)) {
                        return;
                    }

                    let relativeX = x - operation.sourceX;
                    let relativeY = y - operation.sourceY;

                    let sourcePixel = sourcePalette.getColorAtIndex(array[readOffset + i]);

                    if (operation.mask) {

                        let maskColor = alphaBlend(operation.mask.backgroundColor, operation.mask.maskColor, sourcePixel[3])


                        sourcePixel[0] = maskColor[0];
                        sourcePixel[1] = maskColor[1];
                        sourcePixel[2] = maskColor[2];
                    }


                    let targetPaletteIndex = targetPalette.getColorIndex(sourcePixel);

                    if (targetPaletteIndex === -1) {
                        targetPaletteIndex = targetPalette.addColor(sourcePixel);
                    }

                    let arrayIndex = (relativeY * operation.sourceWidth) + relativeX;

                    operation.pixels[arrayIndex] = targetPaletteIndex;

                })


                x++;
            }

        })

        sourceTransformer.run();

    }

    private onData(array: Uint8Array, readOffset: number, x: number, y: number, length: number) {

        for (let i = 0; i < length; i++) {

            this.operations.forEach((operation) => {

                if (y < operation.targetY || y >= (operation.targetY + operation.sourceHeight) || x < operation.targetX || x >= (operation.targetX + operation.sourceWidth)) {
                    return;
                }

                let relativeX = x - operation.targetX;
                let relativeY = y - operation.targetY;

                let sourcePixel = operation.pixels[(relativeY * operation.sourceWidth) + relativeX];

                array[readOffset + i] = sourcePixel;

            })

            x++;
        }

    }


}