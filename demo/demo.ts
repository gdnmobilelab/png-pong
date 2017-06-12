import { PngPongWriter } from '../src/writer';
import { PngPong } from '../src/transformer';
import * as base64 from 'base64-js';

let width = 300;
let height = 300;

let drawSquareX = [100, 200];
let drawSquareY = [100, 200];

let data = new Uint8ClampedArray(width * height * 4);

for (let i = 0; i < data.length; i = i + 4) {

    let x = (i / 4) % width;
    let y = ((i / 4) - x) / width;



    if (x >= drawSquareX[0] && x <= drawSquareX[1] && y >= drawSquareY[0] && y <= drawSquareY[1]) {
        data[i] = 255;
        // data[i + 1] = 100;
        // data[i + 2] = 100;
        data[i + 3] = 255;
    }

    // console.log(x, y)

}


let writer = new PngPongWriter(300, 300, data, 1);
console.time("Draw PNG");
console.profile("PNG draw");
let buffer = writer.write();
(console as any).profileEnd("PNG draw");
console.timeEnd("Draw PNG");
console.time("Base64 encode")
let b64 = base64.fromByteArray(new Uint8Array(buffer));
console.timeEnd("Base64 encode")

let img = new Image();
img.src = "data:image/png;base64," + b64;
document.body.appendChild(img);


let transformer = new PngPong(buffer);

let colorIndex = -1;

let secondSquare = [125, 175];

transformer.onPalette((palette) => {
    colorIndex = palette.addColor([0, 0, 255]);
})

transformer.onData((arr, readOffset, dataOffset, length) => {

    let x = (dataOffset) % width;
    let y = ((dataOffset) - x) / width;

    if (y < secondSquare[0] || y > secondSquare[1]) {
        return;
    }

    let startWritingAt = readOffset + (secondSquare[0] - x);
    let writeUntil = startWritingAt + (secondSquare[1] - secondSquare[0]);

    for (let i = startWritingAt; i < writeUntil; i++) {

        arr[i] = colorIndex;
    }
})
console.time("Transform PNG");
let transformed = transformer.transform();
console.timeEnd("Transform PNG");
let b642 = base64.fromByteArray(new Uint8Array(transformed));


let img2 = new Image();
img2.src = "data:image/png;base64," + b642;
document.body.appendChild(img2);


