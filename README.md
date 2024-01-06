PartitionedBuffer
=================

## A multithreaded array.map

[Original idea](http://jsfiddle.net/stupid_genius/kucQ7/)

This object is meant to implement a threading pattern common in Java, but that I've not seen in JavaScript.  The interface is the same as a standard array (and can be extended to implement any missing Array features), but internally the data is stored in typed arrays, striped across multiple ArrayBuffers which are created during object construction.

The entire point of all of this is so that it is possible to call .map() and have it run concurrently.  Data is striped across the internal buffers which are then transferred to Web Workers to be processed and then transferred back to the main thread.  This is the magic sauce that makes parallel processing faster.
