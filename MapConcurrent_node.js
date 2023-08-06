const {Worker} = require('worker_threads');

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

	const subarraySize = Math.round(work.length/threads);
	const workers = [];

	const workerTemplate = `
		const { parentPort, workerData } = require ( 'worker_threads' );
		try{
			parentPort.postMessage(${transform.toString()}).call(...workerData);
		}catch(e){
			console.log(e);
		}
	`;

	let cur = 0;
	while(cur <= work.length){
		const next = cur + subarraySize;
		let subArray = work.slice(cur, next);
		if(objMode){
			payload.partition = subArray;
		}else{
			payload = subArray;
		}
		workers.push(new Promise((res, rej) => {
			const worker = new Worker(workerTemplate, {eval: true, workerData: payload});
			worker.on('message', function(msg){
				res(msg.data);
			});
			worker.on('error', function(err){
				rej(err);
			});
			// worker.postMessage(payload);
		}));
		cur = next;
	}

	// return Promise.all(workers).then(result => result.reduce((acc, cur) => acc.concat(cur), []));
	return Promise.all(workers).then(result => result.flat());
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

	const subarraySize = Math.round(this.length/threads);
	const workers = [];

	const workerTemplate = `
		const { parentPort } = require ( 'worker_threads' );
		onmessage=${transform.toString()}
	`;

	let cur = 0;
	while(cur <= this.length){
		const next = cur + subarraySize;
		const subArray = this.slice(cur, next);
		if(objMode){
			payload.partition = subArray;
		}else{
			payload = subArray;
		}
		workers.push(new Promise((res, rej) => {
			const worker = new Worker(workerTemplate, {eval: true});
			worker.on('message', function(msg){
				res(msg.data);
			});
			worker.on('error', function(err){
				rej(err);
			});
			// worker.postMessage(payload);
		}));
		cur = next;
	}

	// return Promise.all(workers).then(result => result.reduce((acc, cur) => acc.concat(cur), []));
	return Promise.all(workers).then(result => result.flat());
};

module.exports = MapConcurrent;
