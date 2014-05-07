zone("nigiri.extension").protectedFactory("getKeyByCursor", [ "MyRequest" ], function(TheRequest) {

    return function(cursorRequest) {

        var request = new TheRequest(null, cursorRequest.source, cursorRequest.transaction);

        cursorRequest.onsuccess = function(e) {
            if (TheRequest.__resultValid(cursorRequest)) {
                request.__notifyOnSuccess(cursorRequest.result.primaryKey, e);
            } else {
                request.__notifyOnSuccess(undefined, e);
            }
        };
        cursorRequest.onerror = function(e) {
            request.__notifyOnError(cursorRequest.error, e);
        };

        request.__setOwnerOf(cursorRequest);
        return request;
    };

});
