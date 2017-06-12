declare var navigator: any;

let isNode = typeof navigator === 'undefined';

export function nodeOnly(desc, test) {
    if (isNode) {
        it(desc, test);
    } else {
        xit("(Node only) " + desc, test);
    }
}

export function webOnly(desc, test) {
    if (!isNode) {
        it(desc, test);
    } else {
        xit("(Web only) " + desc, test);
    }
}