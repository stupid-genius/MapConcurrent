/**
 *	PartitionedBuffer
 *	@param {TypedArrayConstructor} type - The type of the typed array (e.g., Int32Array).
 *	@param {number} size - The total number of elements that the buffer will hold.
 *	@constructor
 *
 * @fileOverview PartitionedBuffer module.
 * @module PartitionedBuffer
 * @version 1.0.0
 * @description A Striped Array of Concurrent Buffers (SACB)
 * @author <accounts@stupid-genius.com>
 * @license GPL-3.0
 * @since 2024-01-06
 */
function PartitionedBuffer(type, size){
	if(!new.target){
		return new PartitionedBuffer(...arguments);
	}
	/**
	 * Validates if the type is a valid typed array.
	 * @throws {Error} Throws an error if the type is not a valid typed array.
	 */
	if(!['Int32Array'].includes(type.name)){
		throw new Error(`${type} is not a valid typed array`);
	}

	const segments = [];
	const threads = navigator.hardwareConcurrency;
	const bufSize = Math.ceil(size/threads * type.BYTES_PER_ELEMENT);
	const indexes = new Set();
	let nextIndex = 0;
	for(let i=0; i<threads; i++){
		const buffer = new ArrayBuffer(bufSize);
		segments.push(new type(buffer));
	}

	/**
	 * Returns the buffer and offset corresponding to the given index.
	 * @param {number} i - The index to convert to coordinates.
	 * @returns {number[]} The buffer and offset [buf, off].
	 */
	function indexToCoord(i){
		return [i%threads, Math.floor(i/threads)];
	}

	Object.defineProperties(this, {
		/**
		 * Iterator for the PartitionedBuffer.
		 * @returns {Generator} A generator for iterating over the buffer.
		 */
		[Symbol.iterator]: {
			value: function*(){
				for(const index of Array.from(indexes).sort((a, b) => a - b)){
					yield this[index];
				}
			}
		},
		length: {
			get: function(){
				return indexes.size;
			}
		},
		/**
		 * Maps each element in the buffer using a transform function.  This is a volatile operation that modifies the
		 * data in this object.
		 * @param {Function} transform - The transform function applied to each element.
		 * @returns {Promise} A promise that resolves to the returned values from the individual buffers.  This can be
		 * used for communication with the main thread.
		 */
		map: {
			value: function(transform){
				const blob = new Blob([`self.onmessage=function(msg){
					const response = msg.data.map(${transform.toString()});
					postMessage(response, [msg.data.buffer]);
				}`], {type: 'application/javascript'});
				const blobURL = URL.createObjectURL(blob)

				const workers = segments.map((segment, i) => {
					return new Promise((res) => {
						const worker = new Worker(blobURL);
						worker.onmessage = function(msg){
							segments[i] = new type(msg.data.buffer);
							res(msg.data);
						};
						worker.postMessage(segment, [segment.buffer]);
					});
				});
				return Promise.all(workers).then(result => result.flat());
			}
		},
		/**
		 * Adds elements to the end of the buffer.
		 * @param {...*|Array} elements - The elements to add to the buffer.
		 * @returns {number} The new size of the buffer.
		 */
		push: {
			value: function(...elements){
				if(Array.isArray(elements[0])){
					elements = elements[0];
				}
				elements.forEach(element => {
					const newIndex = nextIndex++;
					indexes.add(newIndex);

					const [buf, off] = indexToCoord(newIndex);
					// console.debug('push', buf, off, element);
					segments[buf][off] = element;
				});

				return indexes.size;
			}
		}
	});

	/**
	 * Proxy for accessing elements in the buffer by index.
	 * @type {Proxy}
	 */
	const indexProxy = new Proxy(this, {
		get: function(target, prop){
			if(typeof prop === 'string' && !isNaN(prop)){
				const index = +prop;
				if(Number.isInteger(index) && index >= 0 && index < size) {
					const [buf, off] = indexToCoord(index);
					// console.debug('get', buf, off, segments[buf][off]);
					return segments[buf][off];
				}
			}else{
				// console.debug(prop);
				return target[prop];
			}
		},
		set: function(_target, prop, value){
			const index = +prop;

			if(!Number.isInteger(index) || index < 0 || index >= size){
				console.error(`Invalid (set) index ${prop}`);
				return false;
			}

			if(indexes.has(index)){
				console.warn(`Element at index ${index} already exists. Overwriting.`);
			}else{
				indexes.add(index);
				nextIndex = Math.max(nextIndex, index+1);
			}
			const [buf, off] = indexToCoord(index);
			// console.debug('set', buf, off, value);
			segments[buf][off] = value;
			return true;
		}
	});
	return indexProxy;
}

export default PartitionedBuffer;
