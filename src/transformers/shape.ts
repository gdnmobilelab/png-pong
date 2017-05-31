import { PngPongTransformer, Palette } from '../';
import { RGB } from '../util/color-types';

interface RectangleDraw {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    color: RGB;
}

export class PngPongShapeTransformer {

    private operations: RectangleDraw[] = [];
    private operationPaletteIndexes: number[] = [];

    constructor(private baseTransformer: PngPongTransformer) {

        baseTransformer.onPalette(this.onPalette.bind(this));
        baseTransformer.onData(this.onData.bind(this));

    }

    private onPalette(palette: Palette) {

        this.operationPaletteIndexes = this.operations.map((o) => {

            let idx = palette.getColorIndex(o.color);

            if (idx === -1) {
                idx = palette.addColor(o.color);
            }

            return idx;
        })

    }

    private onData(array: Uint8Array, readOffset: number, x: number, y: number, length: number) {

        for (let i = 0; i < length; i++) {
            this.operations.forEach((o, idx) => {

                if (x < o.x1 || x >= o.x2 || y < o.y1 || y >= o.y2) {
                    return;
                }

                array[readOffset + i] = this.operationPaletteIndexes[idx];

            })

            x++;

        }

    }


    drawRect(x: number, y: number, width: number, height: number, color: RGB) {

        let x2 = x + width;
        let y2 = y + height;

        this.operations.push({
            x1: x,
            x2,
            y1: y,
            y2,
            color
        });

    }

}