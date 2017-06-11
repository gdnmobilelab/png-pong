import { ArrayBufferWalker } from './arraybuffer-walker';

export class MultiArrayBufferWalker extends ArrayBufferWalker {

    allBufferArrays: Uint8Array[];
    currentArrayIndex: number;

    public get offset() {

        let offsetValue = this._offset;
        for (let i = 0; i < this.currentArrayIndex; i++) {
            offsetValue += this.allBufferArrays[i].length;
        }
        return offsetValue;

    }

    public set offset(value) {

        let arrayIndex = 0;
        let currentArray = this.allBufferArrays[0];
        let currentArrayIndex = 0;

        while (value > currentArray.length) {
            value -= currentArray.length;
            currentArrayIndex++;
            currentArray = this.allBufferArrays[currentArrayIndex];
        }

        this._offset = value;
        this.currentArrayIndex = currentArrayIndex;
        this.array = currentArray;

    }

    constructor(buffers: ArrayBuffer[]) {

        let arrays = buffers.map((b) => new Uint8Array(b));
        super(arrays[0]);
        this.allBufferArrays = arrays;
        this.currentArrayIndex = 0;
    }

    protected advanceOffset() {

        let toReturn = this._offset++;

        if (this._offset >= this.array.length) {
            this.currentArrayIndex++;
            this.array = this.allBufferArrays[this.currentArrayIndex];
            this._offset = 0;
        }

        return toReturn;
    }

}