const { assert, expect } = require('chai');
import PartitionedBuffer from './PartitionedBuffer';

describe('PartitionedBuffer', function(){
	it('should properly construct', function(){
		const parbuf = new PartitionedBuffer(Int32Array, 120);
		expect(parbuf).instanceOf(PartitionedBuffer);
	});
	it('should correctly calculate length', function(){
		const parbuf = new PartitionedBuffer(Int32Array, 120);
		parbuf[0] = 42;
		parbuf[1] = 24;

		expect(parbuf.length).to.equal(2);
	});
	it('should allow access to elements by index', function(){
		const parbuf = new PartitionedBuffer(Int32Array, 120);
		parbuf[0] = 42;
		expect(parbuf[0]).equal(42);
	});
	it('should iterate over elements', function(){
		const parbuf = new PartitionedBuffer(Int32Array, 120);
		parbuf[0] = 42;
		parbuf[1] = 24;

		const result = Array.from(parbuf);
		expect(result).deep.equal([42, 24]);
	});
	it('should allow pushing elements', function(){
		const parbuf = new PartitionedBuffer(Int32Array, 120);
		parbuf.push(42);
		parbuf.push(24);
		parbuf.push(16, 32);
		parbuf.push([1, 2]);

		const result = Array.from(parbuf);
		expect(result).deep.equal([42, 24, 16, 32, 1, 2]);
	});
	it('should allow mapping over elements', async function(){
		const parbuf = new PartitionedBuffer(Int32Array, 120);
		parbuf.push(42, 24, 16, 32);

		await parbuf.map((e) => e * 2);
		expect(Array.from(parbuf)).deep.equal([84, 48, 32, 64]);
	});
	it('should be faster than non-concurrent map', async function(){
		this.timeout(10000);
		const maxInt = 2**31 - 1;
		const size = 10000*navigator.hardwareConcurrency;
		const min = Math.floor(maxInt/10);
		const max = min*2;

		console.log(`Comparing performance for ${size.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} random integers`);
		// console.debug(`in range (${min}, ${max})`);
		const elem = Array.from(Array(size).keys()).map(_i => Math.round(Math.random()*(max-min)+(min)));

		let start = performance.now();
		const parbuf = new PartitionedBuffer(Int32Array, size);
		parbuf.push(elem);
		// const setup = performance.now()-start;
		// console.debug(`setup: ${Math.round(setup)}ms`);

		function work(x){
			let result = 0;
			const iterations = 25;
			for(let i = 0; i < iterations; i++){
				for(let j = 0; j < iterations; j++){
					result = x * (Math.sin(result * i) + Math.cos(result * j)) + x;
				}
			}
			return Math.floor(result);
		}

		// console.debug('starting non-concurrent test');
		start = performance.now();
		const result = elem.map(work);
		const nonConcurrent = performance.now()-start;
		console.info(`non-concurrent: ${Math.round(nonConcurrent)}ms`);

		// console.debug('starting concurrent test');
		start = performance.now();
		await parbuf.map(work);
		const concurrent = performance.now()-start;
		console.info(`concurrent: ${Math.round(concurrent)}ms`);
		console.info(`speed up: ${(nonConcurrent/concurrent).toFixed(2)}`);

		assert(concurrent < nonConcurrent);
		for(let i=0; i<100; ++i){
			const spotCheck = Math.floor(Math.random() * size);
			// console.debug(`\n array: ${result[i]}\nparbuf: ${parbuf[i]}`);
			assert(result[spotCheck] === parbuf[spotCheck]);
		}
	});
});
