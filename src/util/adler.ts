

/**
 * Calculate the ADLER32 checksum of a section of a buffer. Code largely taken from:
 * https://github.com/SheetJS/js-adler32
 * 
 * @export
 * @param {(Uint8Array | Uint8ClampedArray)} buf 
 * @param {number} offset 
 * @param {number} length 
 * @param {number} [seed] 
 * @returns 
 */
export function adler32_buf(buf: Uint8Array | Uint8ClampedArray, offset: number, length: number, seed?: number) {
    var a = 1, b = 0, L = offset + length, M = 0;
    if (typeof seed === 'number') { a = seed & 0xFFFF; b = (seed >>> 16) & 0xFFFF; }
    for (var i = offset; i < L;) {
        M = Math.min(L - i, 3850) + i;
        for (; i < M; i++) {
            a += buf[i] & 0xFF;
            b += a;
        }
        a = (15 * (a >>> 16) + (a & 65535));
        b = (15 * (b >>> 16) + (b & 65535));
    }
    return ((b % 65521) << 16) | (a % 65521);
}