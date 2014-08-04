var dispatcher = new Dispatcher(4, 4);
console.log('building work');
var workArray = [];
for(var i=0;i<1000000;++i){
	workArray[i]=i+1;
}
console.log('starting work');
var start = new Date();
dispatcher.mapConcurrent(workArray, function(e){
	var typed = new Int32Array(e.data);
	/*var working = Array.apply([], typed);    // doesn't work when slice.length == 1
	working.map(function(v,i,a){typed[i]=Math.pow(v,2);});*/
	for(var i=0;i<typed.length;++i){
		typed[i] = Math.pow(typed[i],2);
	}
	postMessage(e.data, [e.data]);
}, function(resultArray){
	console.log(resultArray.slice(0,50));
	console.log(resultArray.slice(-50));
	console.log('%d calculations performed in %d', resultArray.length, (new Date())-start);
});
