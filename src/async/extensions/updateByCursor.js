zone("nigiri.extension").factory("updateByCursor", [ "MyRequest" ], function(TheRequest) {

    /**
     * Create a new update function. The update function takes a value
     * 
     * @param cursorRequest
     *            an existing cursor request
     * @param updateFN
     *            the update function
     */
    var updateAll = function(cursorRequest, updateFN) {

        var request = new TheRequest(null, cursorRequest.source, cursorRequest.transaction);

        var nOutstanding = 1; // init to 1 to account for the cursor
        var result = {
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
            if (request.__notifyOnError("update failed", e)) {

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

        cursorRequest.onsuccess = function(e) {
            var updateRequest;
            if (TheRequest.__invalidResult(cursorRequest)) {
                notifyWhenDone();
                return;
            }

            try {
                var value = cursorRequest.result.value;
                if (value === undefined) {
                    console.log("Not a cursor with values");
                    ++result.errors;

                    // we do not continue beyond here since this isn't a cursor with values
                    notifyWhenDone();
                    return;
                }

                var newValue = updateFN(value);
                if (newValue === undefined) {
                    // console.log("DELETE "+cursorRequest.result.primaryKey);
                    updateRequest = cursorRequest.result["delete"]();
                } else if (newValue !== null) {
                    // console.log("UPDATE "+cursorRequest.result.primaryKey);
                    updateRequest = cursorRequest.result.update(newValue);
                } else {
                    updateRequest = null;
                }

                if (updateRequest !== null) {
                    updateRequest.onsuccess = onsuccess;
                    updateRequest.onerror = onerror;
                    ++nOutstanding;
                }
                cursorRequest.result["continue"]();
            } catch (error) {
                console.log(error.stack);
                ++result.errors;
                notifyWhenDone();
            }

        };
        cursorRequest.onerror = function(e) {
            request.__notifyOnError("Cursor Failed", e);
        };

        request.__setOwnerOf(cursorRequest);
        return request;
    };

    return updateAll;
});

zone("nigiri.extension").interceptor("nigiri.MyObjectStore", [ "updateByCursor" ], function(updateAll) {

    var update = function() {
        var fn = [].shift.call(arguments);
        var req = this.openCursor.apply(this, arguments);
        return updateAll(req, fn);
    };

    return function(ObjectStore) {
        ObjectStore.prototype.update = update;
        return ObjectStore;
    };
});
zone("nigiri.extension").interceptor("nigiri.MyIndex", [ "updateByCursor" ], function(updateAll) {

    var update = function() {
        var fn = [].shift.call(arguments);
        var req = this.openCursor.apply(this, arguments);
        return updateAll(req, fn);
    };

    return function(Index) {
        Index.prototype.update = update;
        return Index;
    };
});
