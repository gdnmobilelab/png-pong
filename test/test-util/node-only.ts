
export function nodeOnly(desc,test) {
    if (typeof navigator === 'undefined') {
        it(desc,test);
    } else {
        xit("(Node only) " + desc, test);
    }
}