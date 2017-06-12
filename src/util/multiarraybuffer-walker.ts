import { ArrayBufferWalker } from './arraybuffer-walker';

interface Segment {
    array: Uint8Array,
    offset: number,
    length: number
}

export class MultiArrayBufferWalker extends ArrayBufferWalker {

    private allSegments: Segment[] = [];
    private currentSegment: Segment;

    // allBufferArrays: Uint8Array[];
    currentSegmentIndex: number;

    public get offset() {

        let offsetValue = this._offset;
        for (let i = 0; i < this.currentSegmentIndex; i++) {
            offsetValue += this.allSegments[i].length;
        }
        return offsetValue;

    }

    public set offset(value) {

        let arrayIndex = 0;
        console.log(this)
        let currentSegment = this.allSegments[0];
        let currentSegmentIndex = 0;

        while (value > currentSegment.length) {
            value -= currentSegment.length;
            currentSegmentIndex++;
            currentSegment = this.allSegments[currentSegmentIndex];
        }

        this._offset = value;
        this.currentSegmentIndex = currentSegmentIndex;
        this.array = currentSegment.array;
        this.currentSegment = currentSegment;
    }

    constructor(array: Uint8Array, offset = 0, length = -1) {

        super(array, offset, length);
        console.log("HELLO", this.allSegments)
        this.add(array)
        this.currentSegmentIndex = 0;

    }

    add(array: Uint8Array, offset = 0, length = -1) {

        let segment = {
            array: array,
            offset: offset,
            length: length === -1 ? array.length : length
        };

        this.allSegments.push(segment);
        if (!this.currentSegment) {
            this.currentSegment = segment;
        }
    }

    protected advanceOffset() {

        let toReturn = this._offset++;

        if (this._offset >= this.currentSegment.length) {
            this.currentSegmentIndex++;
            this.currentSegment = this.allSegments[this.currentSegmentIndex];
            this.array = this.currentSegment.array;
            this._offset = 0;
        }

        return toReturn;
    }

}