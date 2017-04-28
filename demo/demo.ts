import { PngPongWriter } from '../src/writer';
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


let writer = new PngPongWriter(300, 300, data);
console.time("Draw PNG");
console.profile("PNG draw");
let buffer = writer.write();
console.profileEnd("PNG draw");
console.timeEnd("Draw PNG");
console.time("Base64 encode")
let b64 = base64.fromByteArray(new Uint8Array(buffer));
console.timeEnd("Base64 encode")

let img = new Image();
img.src = "data:image/png;base64," + b64;
document.body.appendChild(img)
