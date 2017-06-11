import { ArrayBufferWalker } from '../src/util/arraybuffer-walker';

let testArray = new Uint8Array(3000 * 3000);

let walk = new ArrayBufferWalker(testArray.buffer);
console.time("Write array");
while (walk.offset <= testArray.length) {
    walk.writeUint8(1);
}
console.timeEnd("Write array");

// let arr: number[][] = [[1], [2]];

// declare var Proxy: any;

// let handler = {
//     get: function (target: number[][], targetIdx: number) {

//         let startIdx = targetIdx;

//         for (let idx = 0; idx < target.length; idx++) {
//             if (target[idx][startIdx]) {
//                 return target[idx][startIdx];
//             }
//             startIdx -= target[idx].length;
//         }
//     }
// }

// let proxy = new Proxy(arr, handler);

// class IntProxyTest {
//     constructor(private arr: Uint8Array[]) {

//     }

//     get(i: number) {
//         // if (arr.length === 1) {
//         return this.arr[0][i];
//         // }
//     }
//     set(i: number, val: number) {
//         // if (arr.length === 1) {
//         this.arr[0][i] = val;
//         // }
//     }
// }

// function geta(arr: Uint8Array[] | Uint8Array, idx: number) {
//     if (arr.length) {
//         return arr[0];
//     } else {
//         return arr[0][idx];
//     }
// }


// let testArray = new Uint8Array(3000 * 200);
// console.time("using Uint8Arrays");
// let tempVariable = 0;
// for (let y = 0; y < 200; y++) {
//     let newArray = new Uint8Array(testArray.buffer, y * 3000, 3000);

//     for (let x = 0; x < 3000; x++) {
//         tempVariable = newArray[x];
//     }

// }
// (console as any).timeEnd("using Uint8Arrays");

// console.time("using IntProxy");

// let arrarr = [testArray]
// for (let y = 0; y < 200; y++) {
//     // let newArray = new IntProxyTest([testArray]);

//     for (let x = 0; x < 3000; x++) {
//         tempVariable = geta(testArray, y + x);;
//     }

// }

// (console as any).timeEnd("using IntProxy");


// let proxyTest = new Proxy(testArray, handler);

// for (let y = 0; y < 200; y++) {

//     for (let x = 0; x < 300; x++) {
//         proxyTest = proxy[y + x];
//     }

// }
// (console as any).timeEnd("using Proxy");


// console.log(proxy[1]);