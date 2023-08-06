function MapConcurrent(work, transform, threads){
	const objMode = arguments.length === 1 && typeof arguments[0] === 'object';

	let payload = {};
	if(objMode){
		payload.context = arguments[0].context;
		threads = arguments[0].threads;
		transform = arguments[0].transform;
		work = arguments[0].partition;
	}
	console.log(`Partitioning work using ${threads} threads`);

	// const subarraySize = Math.round(work.length/threads);
	const subarraySize = 100000;
	const workers = [];

	const blob = new Blob([`self.onmessage=${transform.toString()}`], {type: 'application/javascript'});
	const blobURL = URL.createObjectURL(blob)

	let cur = 0;
	while(cur <= work.length){
		const next = cur + subarraySize;
		let subArray = work.slice(cur, next);
		if(objMode){
			payload.partition = subArray
		}else{
			payload = subArray;
		}
		workers.push(new Promise((res, rej) => {
			const worker = new Worker(blobURL);
			worker.onmessage = function(msg){
				res(msg.data);
			};
			worker.postMessage(payload);
		}));
		cur = next;
	}

	// return Promise.all(workers).then(result => result.reduce((acc, cur) => acc.concat(cur), []));
	return Promise.all(workers).then(result => result.flat());
	// return Promise.all(workers).then(result => [].concat.apply([], ...result));
}

Array.prototype.mapConcurrent = function(transform, threads){
	const objMode = arguments.length === 1 && typeof arguments[0] === 'object';

	let payload = {};
	if(objMode){
		payload.context = arguments[0].context;
		threads = arguments[0].threads;
		transform = arguments[0].transform;
	}
	console.log(`Partitioning work using ${threads} threads`);

	// const subarraySize = Math.round(this.length/threads);
	const subarraySize = 100000;
	const workers = [];

	const blob = new Blob([`self.onmessage=${transform.toString()}`], {type: 'application/javascript'});
	const blobURL = URL.createObjectURL(blob)

	let cur = 0;
	while(cur <= this.length){
		const next = cur + subarraySize;
		let subArray = this.slice(cur, next);
		if(objMode){
			payload.partition = subArray
		}else{
			payload = subArray;
		}
		workers.push(new Promise((res, rej) => {
			const worker = new Worker(blobURL);
			worker.onmessage = function(msg){
				res(msg.data);
			};
			worker.postMessage(payload);
		}));
		cur = next;
	}

	// return Promise.all(workers).then(result => result.reduce((acc, cur) => acc.concat(cur), []));
	return Promise.all(workers).then(result => result.flat());
	// return Promise.all(workers).then(result => [].concat.apply([], ...result));
};

export default MapConcurrent;
