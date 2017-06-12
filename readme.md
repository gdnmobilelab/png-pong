# PngPong

An image manipulation library with a very specific set of skills.

## What is it?

PngPong is a very, very basic replacement for the `<canvas>` tag in elements
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

You can create a base PNG file using one of two methods.