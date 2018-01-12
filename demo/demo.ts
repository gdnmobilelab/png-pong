// Really simple demo that draws a square inside a square.

import { createWithMetadata, PngPong } from "../src";
import * as base64 from "base64-js";

// The size of our image

let width = 300;
let height = 300;

// The start and end points where we want to draw our inner square

let drawSquareX = [100, 200];
let drawSquareY = [100, 200];

// Create an image with space in the palette for 3 colors (RGBA(0,0,0,0) must be one of them)
// Add red as the first colour in the palette

let buffer = createWithMetadata(width, height, 3, [255, 0, 0]);

// Now that we have our base ArrayBuffer, we can create a PngPong editor for it:

let transformer = new PngPong(buffer);

// We need to store the index of the colour we add to the palette (in this instance
// we know the index will be 2, but this is a demo after all)

let colorIndex: number | undefined = undefined;

// Now we add an onPalette listener, where we add blue to our palette and store the
// index in the variable above.

transformer.onPalette(palette => {
  colorIndex = palette.addColor([0, 0, 255]);
});

// Now set the listener for the actual image processing. Very simple, just checks
// the X and Y of the pixels being sent in and colours them if they're within the
// bounds of our square.

transformer.onData((arr, readOffset, x, y, length) => {
  if (y < drawSquareY[0] || y > drawSquareY[1]) {
    return;
  }

  if (!colorIndex) {
    throw new Error("colorIndex was not set, did the onPalette call run?");
  }

  for (
    let i = Math.max(x, drawSquareX[0]);
    i < Math.min(length, drawSquareX[1]);
    i++
  ) {
    arr[readOffset + i] = colorIndex;
  }
});

// We can also use this page to quickly check how fast this transform runs,
// using a console timer:

console.time("Transform PNG");
transformer.run();
console.timeEnd("Transform PNG");

// Then convert the image into something that can be used in the browser
// (i.e. a base64-encoded image) and add it to the page.
let b642 = base64.fromByteArray(new Uint8Array(buffer));

let img2 = new Image();
img2.src = "data:image/png;base64," + b642;
document.body.appendChild(img2);
