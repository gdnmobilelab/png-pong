import { createWithMetadata, PngPong } from '../src';
import * as base64 from 'base64-js';

let width = 300;
let height = 300;

let drawSquareX = [100, 200];
let drawSquareY = [100, 200];


let buffer = createWithMetadata(300, 300, 3, [255, 0, 0]);

let transformer = new PngPong(buffer);

let colorIndex = -1;

transformer.onPalette((palette) => {
    colorIndex = palette.addColor([0, 0, 255]);
})

transformer.onData((arr, readOffset, x, y, length) => {


    if (y < drawSquareY[0] || y > drawSquareY[1]) {
        return;
    }

    for (let i = Math.max(x, drawSquareX[0]); i < Math.min(length, drawSquareX[1]); i++) {
        arr[readOffset + i] = colorIndex;
    }


})
console.time("Transform PNG");
transformer.run();
console.timeEnd("Transform PNG");
let b642 = base64.fromByteArray(new Uint8Array(buffer));

let img2 = new Image();
img2.src = "data:image/png;base64," + b642;
document.body.appendChild(img2);


