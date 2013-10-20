(function(TheRequest, ObjectStore) {

    var addPutAll = function(store, method, xarray) {

        var array = [ null ];
        if (xarray.length == 2) {
            array.push(xarray[1]);
        }

        var objects = xarray[0];

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
        for (i = 0, n = objects.length; i < n; ++i) {
            array[0] = objects[i];
            try {
                addRequest = updateFN.apply(store, array);
                ++nOutstanding;
                addRequest.onsuccess = onsuccess;
                addRequest.onerror = onerror;
            } catch (error) {
                // the the request for now
                ++result.errors;
                throw request;
            }
        }
        result.total = nOutstanding;

        return request;
    };

    ObjectStore.prototype.addAll = function() {
        return addPutAll(this, "add", arguments);
    };

    ObjectStore.prototype.putAll = function() {
        return addPutAll(this, "put", arguments);
    };

})(MyRequest, MyObjectStore);
