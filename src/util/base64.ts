

/**
 * Quick function to convert a string to Base64, that works in both
 * Node and the browser
 * 
 * @export
 * @param {string} str 
 * @returns 
 */
export function toBase64(str: string) {
    if (typeof btoa === "undefined") {
        return new Buffer(str, 'binary').toString('base64');
    } else {
        return btoa(str);
    }
}


/**
 * Quick function to convert from Base64, works in both Node and browser.
 * 
 * @export
 * @param {string} str 
 * @returns 
 */
export function fromBase64(str: string) {
    if (typeof atob === "undefined") {
        return new Buffer(str, 'base64').toString('binary');
    } else {
        return atob(str);
    }
}