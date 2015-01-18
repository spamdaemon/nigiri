zone("nigiri.extension").factory("-getAllKeysByCursor", [ "MyRequest", "nigiri.cmp" ], function(TheRequest, compare) {
    "use strict"

    var getAll = function(cursorRequest) {

        var request = new TheRequest(null, cursorRequest.source, cursorRequest.transaction);
        var result = [];

        cursorRequest.onsuccess = function(e) {
            var n = result.length;
            var key;
            if (TheRequest.__invalidResult(cursorRequest)) {
                request.__notifyOnSuccess(result, e);
            } else {
                key = cursorRequest.result.key;
                if (n === 0 || compare(result[n - 1], key) !== 0) {
                    result.push(key);
                }
                cursorRequest.result["continue"]();
            }
        };
        cursorRequest.onerror = function(e) {
            request.__notifyOnError(cursorRequest.error, e);
        };

        request.__setOwnerOf(cursorRequest);

        return request;
    };
    return getAll;
});

zone("nigiri.extension").interceptor("nigiri.MyObjectStore", [ "getAllKeysByCursor" ], function(getAllKeysByCursor) {

    return function(ObjectStore) {
        ObjectStore().prototype.getAllKeys = function() {
            var req = this.openCursor.apply(this, arguments);
            return getAllKeysByCursor(req);
        };
        return ObjectStore();
    };
});

zone("nigiri.extension").interceptor("nigiri.MyIndex", [ "getAllKeysByCursor" ], function(getAllKeysByCursor) {
    return function(Index) {
        Index().prototype.getAllKeys = function() {
            var req = this.openKeyCursor.apply(this, arguments);
            return getAllKeysByCursor(req);
        };
        return Index();
    };
});
