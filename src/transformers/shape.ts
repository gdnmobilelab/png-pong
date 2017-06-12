import { PngPong, Palette } from '../';
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
    private imageWidth: number;

    constructor(private baseTransformer: PngPong) {

        baseTransformer.onHeader((h) => {
            this.imageWidth = h.width;
        })
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

        for (let idx = 0; idx < this.operations.length; idx++) {
            let o = this.operations[idx];
            if (y < o.y1 || y >= o.y2) {
                continue;
            }

            for (let i = Math.max(x, o.x1); i < Math.min(o.x2, x + length); i++) {
                array[readOffset - x + i] = this.operationPaletteIndexes[idx];
            }
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