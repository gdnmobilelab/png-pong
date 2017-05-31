import { PngPongTransformer, Palette } from '../'

interface CopyOperation {
    sourceX: number;
    sourceWidth: number;
    sourceY: number;
    sourceHeight: number;
    targetX: number;
    targetY: number;
    pixels: Uint8Array;
}

export class PngPongImageCopier {

    private operations: CopyOperation[] = [];

    constructor(private sourceImage: ArrayBuffer, private targetTransformer: PngPongTransformer) {
        this.targetTransformer.onPalette(this.onPalette.bind(this));
        this.targetTransformer.onData(this.onData.bind(this));
    }


    copy(sourceX: number, sourceY: number, sourceWidth: number, sourceHeight: number, targetX: number, targetY: number) {

        let pixelsRequired = sourceWidth * sourceHeight;

        let pixels = new Uint8Array(pixelsRequired);

        this.operations.push({
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            targetX,
            targetY,
            pixels
        });
    }

    onPalette(targetPalette: Palette) {

        // We need to grab our source image and add the new colors to the palette. At the same time
        // we record the new data arrays, to insert into the data later.

        let sourceTransformer = new PngPongTransformer(this.sourceImage);

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

        sourceTransformer.transform();

    }

    onData(array: Uint8Array, readOffset: number, x: number, y: number, length: number) {

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