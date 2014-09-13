zone("nigiri.extension").factory("-addPutAll", [ "MyRequest" ], function(TheRequest) {
    "use strict"

    var addPutAll = function(store, method, xarray) {

        var array = [ null ];
        if (xarray.length === 2) {
            array.push(xarray[1]);
        }

        var objectGenerator = xarray[0];
        if (typeof objectGenerator !== 'function') {

            objectGenerator = (function(objects) {
                var i = 0;
                return function() {
                    if (i < objects.length) {
                        return objects[i++];
                    }
                    return null;
                };
            })(xarray[0]);
        }

        var request = new TheRequest(null, store, store.transaction);
        var i, n, addRequest;
        var nOutstanding = 0;

        var result = {
            total : 0,
            successes : 0,
            errors : 0
        };

        var notifyWhenDone = function() {
            if (--nOutstanding === 0) {
                request.__notifyOnSuccess(result);
            }
            if (nOutstanding < 0) {
                throw new Error("Internal error; mismatched calls");
            }
        };

        var onsuccess = function(e) {
            ++result.successes;
            notifyWhenDone();
        };

        var onerror = function(e) {
            // if the user provides an error handler for a batch request,
            // we need to invoke it to all the user to cancel the transaction
            // if will be aborted, then we return immediately
            if (request.__notifyOnError("Update failed", e)) {

                if (!e.defaultPrevented) {
                    // drop out at this point
                    return;
                }
            }

            e.preventDefault();
            e.stopPropagation();

            ++result.errors;
            notifyWhenDone();
        };

        // TODO: we may want to be even more special here and do things in batches
        var updateFN = store[method];
        var object;
        while ((object = objectGenerator()) !== null) {
            array[0] = object;
            try {
                addRequest = updateFN.apply(store, array);
                ++nOutstanding;
                addRequest.onsuccess = onsuccess;
                addRequest.onerror = onerror;
            } catch (error) {
                console.log(error.stack);
                // the the request for now
                ++result.errors;
                throw request;
            }
        }
        result.total = nOutstanding;

        return request;
    };
    return addPutAll;
});

zone("nigiri.extension").interceptor("nigiri.MyObjectStore", [ "addPutAll" ], function(addPutAll) {

    return function(ObjectStore) {
        ObjectStore.prototype.addAll = function() {
            return addPutAll(this, "add", arguments);
        };

        ObjectStore.prototype.putAll = function() {
            return addPutAll(this, "put", arguments);
        };

        return ObjectStore;
    };
});
