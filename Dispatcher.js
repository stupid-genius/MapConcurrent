function Dispatcher(numWorkers, numSlices){
	var workers = [];
	var slices = [];
	for(var i=0;i<numWorkers;++i){
		workers[i] =
		{
			id: i,
			sid: null,
			thread: {},
			active: false,
			task: function(work){
				this.active = true;
				work.dispatched = true;
				this.sid = work.id;
				this.thread.postMessage(work.slice, [work.slice]);
				//console.log('thread '+this.id+' dispatched');
			}
		};
	}
	for(var i=0;i<numSlices;++i){
		slices[i] =
		{
			id: i,
			slice: {},
			dispatched: false,
			processed: false,
			load: function(data){
				this.slice = new ArrayBuffer(data.length*4);
				var view = new Int32Array(this.slice);
				for(var i in data){
					view[i] = data[i];
				}
			},
			read: function(){
				var view = new Int32Array(this.slice);
				/*for(var i=0;i<view.length;++i){
				}*/
				return view;
			}
		};
	}

	var onComplete;
	function handlerFactory(obj){
		var workerRef = obj;
		function handler(e){
			slices[workerRef.sid].slice = e.data;
			slices[workerRef.sid].processed = true;
			workerRef.active = false;
			if(doWork()){
				var result = [];
				for(var s in slices){
					var slice = slices[s].read();
					for(var d in slice){
						result.push(slice[d]);
					}
				}
				onComplete(result);
			}
		}
		return handler;
	}
	function initWorkers(fn){
		var blob;
		try{
			blob = new Blob(['self.onmessage='+fn], {type: 'application/javascript'});
		}
		catch(e){ // Backwards-compatibility
			window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
			blob = new BlobBuilder();
			blob.append(response);
			blob = blob.getBlob();
		}
		for(var w in workers){
			workers[w].thread = new Worker(URL.createObjectURL(blob));
			workers[w].thread.onmessage = handlerFactory(workers[w]);
		}
	}
	function initSlices(workArray){
		var residue = workArray.length%slices.length;
		var sliceSize = (workArray.length-residue)/slices.length;
		var tail = workArray.slice((slices.length-1)*sliceSize, workArray.length);
		for(var s=0;s<slices.length;++s){
			if(s==slices.length-1)
				slices[s].load(tail);
			else
				slices[s].load(workArray.slice(s*sliceSize, (s+1)*sliceSize));
		}
	}
	function doWork(){
		var allWorkComplete = false;
		var newWork = false;
		for(var i in slices){
			if(!slices[i].dispatched){
				for(var j in workers){
					if(!workers[j].active){
						workers[j].task(slices[i]);
						newWork = true;
						break;
					}
				}
			}
		}
		if(!newWork){
			var remainingWork = false;
			for(var i in slices){
				if(!slices[i].processed) remainingWork = true;
			}
			allWorkComplete = !remainingWork;
			if(!allWorkComplete)  // if no new work and not all done then check again soon
				setTimeout(doWork, 10);
		}
		return allWorkComplete;
	}

	this.mapConcurrent = function(workArray, mapFn, cb){
		onComplete = cb;
		initWorkers(mapFn);
		initSlices(workArray);
		doWork();
	};
	this.multiMapConcurrent = function(){
	};
}
