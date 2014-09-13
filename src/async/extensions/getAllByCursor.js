zone("nigiri.extension").factory("-getAll", [ "MyRequest" ], function(TheRequest) {
    "use strict"

    var getAll = function(cursorRequest) {

        var request = new TheRequest(null, cursorRequest.source, cursorRequest.transaction);
        var result = [];

        cursorRequest.onsuccess = function(e) {
            if (TheRequest.__invalidResult(cursorRequest)) {
                request.__notifyOnSuccess(result, e);
            } else {
                result.push(cursorRequest.result.value);
                cursorRequest.result["continue"]();
            }
        };
        cursorRequest.onerror = function(e) {
            request.__notifyOnError(cursorRequest.error, e);
        };

        request.__setOwnerOf(cursorRequest);

        return request;
    };

    var get = function() {
        var req = this.openCursor.apply(this, arguments);
        return getAll(req);
    };

    return get;
});

zone("nigiri.extension").interceptor("nigiri.MyObjectStore", [ "getAll" ], function(getAll) {

    return function(ObjectStore) {
        ObjectStore.prototype.getAll = getAll;
        return ObjectStore;
    };
});
zone("nigiri.extension").interceptor("nigiri.MyIndex", [ "getAll" ], function(getAll) {

    return function(Index) {
        Index.prototype.getAll = getAll;
        return Index;
    };
});
