# PngPong

An image manipulation library with a very specific set of skills. Take a look at [a writeup of how we used it](https://medium.com/the-guardian-mobile-innovation-lab/generating-images-in-javascript-without-using-the-canvas-api-77f3f4355fad).

## What is it?

PngPong is a very, very basic replacement for the Canvas API in environments
that do not support it - primarily, service workers. Instead, it manually
manipulates the bytes of a PNG file to copy the contents of another image, or
draw basic shapes (currently only rectangles).

This leads to a *lot* of restrictions. Although PngPong does use PNG files, it
requires that they be a very specific kind of PNG file:

- Indexed-color type ([type 3](https://www.w3.org/TR/PNG/#6Colour-values)) with an optional tRNS chunk for alpha transparency
- Compressed at ZLib compression level 0 (i.e. not actually compressed at all)

To ensure your users don't incur a massive bandwidth cost, I recommend GZipping
any PNG assets you pre-create for use with PngPong - although it normally
doesn't make a difference with PNGs, it will compress the final file size
considerably.

### Why these restrictions?

- **Indexed-color:** to try to reign in the amount of memory PngPong uses. Right now
  it has to load the entire image into memory in order to edit it, and the data
  for Truecolor with Alpha (type 6) images take up nearly 4x as much space.
- **Compression level 0:**
  - Because the JS to decompress ZLib is not insigificant.
  - The file has to be uncompressed anyway to edit raw data, and that will mean
    even more memory usage (compressed file + uncompressed data)
  - Browsers can handle uncompression of anything that we GZip without
    needing any extra client code, so the bandwidth requirement does not increase.

## How do I use it?

You can create a base PNG file using one of two methods, [`createFromRGBAArray`](https://gdnmobilelab.github.io/png-pong/globals.html#createfromrgbarray) or [`createWithMetadata`](https://gdnmobilelab.github.io/png-pong/globals.html#createwithmetadata). Both methods are available from the package directly:

    import { createFromRGBAArray, createWithMetadata } from 'png-pong';

*Tip: to convert an existing PNG image into one PngPong can process client-side, use a library like PNGJS to get the RGBA array, then run `createfromRGBAArray`.*

Once you have your source image ArrayBuffer, create a new instance of PngPong
with it:

    import { PngPong } from 'png-pong';
    const pngPong = new PngPong(imageArrayBuffer);

PngPong currently has two transformers available:

### [ShapeTransformer](https://gdnmobilelab.github.io/png-pong/classes/pngpongshapetransformer.html)

The shape transformer allows you to draw rectangles onto an image. Like so:

    import { PngPongShapeTransformer } from 'png-pong';

    const shape = new PngPongShapeTransformer(pngPong);

    // draw a 30px red square 10px from the top and 10px from the left
    shape.drawRect(10, 10, 30, 30, [255, 0, 0])

### [ImageCopyTransformer](https://gdnmobilelab.github.io/png-pong/classes/pngpongimagecopytransformer.html)

The image copy transformer allows you take portions of one image, and draw them
onto another. Like so:

    import { PngPongImageCopyTransformer } from './src';

    const toCopyFrom = new ArrayBuffer();

    const imageCopy = new PngPongImageCopyTransformer(toCopyFrom, pngPong);

    // copy a 50x50 image 10px from the top left of the source image,
    // and draw it 30px into our target image. 
    imageCopy.copy(10, 10, 50, 50, 30, 30);

The ImageCopyTransformer also has a [color mask](https://gdnmobilelab.github.io/png-pong/interfaces/colormaskoptions.html) option to allow you to recolour the source image.

### Running the transforms

Once you have your transforms set, just run:

    pngPong.run();

and the source `ArrayBuffer` will be modified.

## Making your own transformer

An instance of PngPong has a series of hooks available to transformers - [onHeader](https://gdnmobilelab.github.io/png-pong/classes/pngpong.html#onheader), [onPalette](https://gdnmobilelab.github.io/png-pong/classes/pngpong.html#onpalette) and [onData](https://gdnmobilelab.github.io/png-pong/classes/pngpong.html#ondata).

An example of a custom transformer that draws a blue line across an image at
10px high, 10px from both the left and right edges of the image.

    const pngPong = new PngPong(arrayBuffer);

    let lineStartX, lineEndX;
    let paletteIndex;

    pngPong.onHeader((header) => {
        lineStartX = 10;
        lineEndX = header.width - 10;
    })

    pngPong.onPalette((palette) => {
        paletteIndex = palette.addColor([0, 0, 255]);
    })

    pngPong.onData((array, readOffset, x, y, length) => {
        if (y != 10) return;
        for (let i = Math.max(lineStartX, x); i < Math.min(lineEndX, length); i++) {
            array[readOffset + i] = paletteIndex;
        }
    })

**Important:** the data callback specifies an offset and a length. Do not edit
the data beyond that length, as you will overwrite block headers or something 
else that will result in an invalid PNG file.

Also, while the data callback will usually start with an X of zero, it won't
always. So be sure you are calculating the correct start position.

## Running tests/demos

To spin up a server showing you the demo page at demo/demo.ts just run:

    npm run demo

And go to http://localhost:8080. To run the test suite in Node, run

    npm run tests-node

, and in the browser:

    npm run tests-web

And go to http://localhost:8080 again.

## What's next

Loading the ArrayBuffer of an entire image is still very memory intensive. I'm
working on a version that uses ReadableStreams (currently available in Chrome)
to reduce the amount of memory being used at once.
