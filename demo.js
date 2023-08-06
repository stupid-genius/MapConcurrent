import MapConcurrent from './MapConcurrent.js';

const min = Number.MAX_SAFE_INTEGER/100;
const max = min*2;
const elem = Array.from(Array(100000000).keys()).map(i => BigInt(Math.round(Math.random()*(max-min)+(min))));
// const elem = [20, 21, 22, 23, 24, 25, 26, 27, 28];

// MapConcurrent(elem, (msg) => {
// 	importScripts('http://localhost:8080/powerset.js');
// 	console.log(`Worker called on ${msg.data}`);
// 	const work = Array.from(Array(msg.data[0]).keys()).map(i => i+1);
// 	// console.log(msg.data, work);
// 	console.log(`Calculating power set of ${work}`);
// 	const ps = new PowerSet(work);
// 	let i = 0;
// 	for(const s of ps){
// 		i++;
// 	}
// 	console.log(`PowerSet(${msg.data}) has ${i} elements`);
// }, navigator.hardwareConcurrency-1);

let start, result;
start = performance.now();
result = await elem.mapConcurrent((msg) => {
	postMessage(msg.data.map(e => e**10n));
}, 1);
console.log(`done: ${performance.now()-start}ms`);
console.log(result.length)
result = null;

start = performance.now();
result = await elem.mapConcurrent((msg) => {
	postMessage(msg.data.map(e => e**10n));
}, navigator.hardwareConcurrency-1);
console.log(`done: ${performance.now()-start}ms`);
console.log(result.length)

// const partition = Array.from(Array(2**elem.length).keys()).map(i => i+1);
// const start = performance.now();
// const result = await MapConcurrent({partition, context: elem} , (msg) => {
// 	importScripts('http://localhost:8080/powerset.js');
// 	const ps = new PowerSet(msg.data.context);
// 	const result = msg.data.partition.map(i => ps.get(i));
// 	postMessage(result);
// }, navigator.hardwareConcurrency-1);
// console.log(`done: ${performance.now()-start}`);
// const finRes = result.reduce((acc, cur) => acc.concat(cur), []);
// console.log(finRes);
