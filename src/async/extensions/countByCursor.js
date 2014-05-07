zone("nigiri.extension").factory("countByCursor", [ "MyRequest" ], function(TheRequest) {

    return function(cursorRequest) {
        var request = new TheRequest(null, cursorRequest.source, cursorRequest.transaction);
        var count = 0;
        cursorRequest.onsuccess = function(e) {
            if (TheRequest.__resultValid(cursorRequest)) {
                ++count;
                cursorRequest.result["continue"]();
            } else {
                request.__notifyOnSuccess(count, e);
            }
        };
        cursorRequest.onerror = function(e) {
            request.__notifyOnError(cursorRequest.error, e);
        };
        request.__setOwnerOf(cursorRequest);
        return request;
    };

});
