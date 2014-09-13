zone("nigiri.extension").factory("-getKeyRange", [ "MyKeyRange", "MyRequest" ], function(KeyRange, TheRequest) {
    "use strict"

    var getKeyRange = function(loReq, hiReq, transaction) {
        var request = new TheRequest(null, loReq.source, transaction);
        var range = {};

        var notifyOnSuccess = function(e) {
            if (range && range.hasOwnProperty("lo") && range.hasOwnProperty("hi")) {
                request.__notifyOnSuccess(KeyRange.bound(range.lo, range.hi), e);
            }
        };

        loReq.onsuccess = function(e) {
            if (TheRequest.__invalidResult(loReq)) {
                request.__notifyOnSuccess(null, e);
            } else {
                range.lo = loReq.result.key;
                notifyOnSuccess(e);
            }
        };

        hiReq.onsuccess = function(e) {
            if (TheRequest.__invalidResult(hiReq)) {
                request.__notifyOnSuccess(null, e);
            } else {
                range.hi = hiReq.result.key;
                notifyOnSuccess(e);
            }
        };
        loReq.onerror = function(e) {
            // ensure that only one notification goes out
            if (range) {
                range = null;
                request.__notifyOnError(loReq.error);
            }
        };
        hiReq.onerror = function(e) {
            if (range) {
                range = null;
                request.__notifyOnError(hiReq.error);
            }
        };

        request.__setOwnerOf(hiReq);
        request.__setOwnerOf(loReq);

        return request;
    };

    return getKeyRange;
});

zone("nigiri.extension").interceptor("nigiri.MyObjectStore", [ "getKeyRange" ], function(getKeyRange) {

    return function(ObjectStore) {

        ObjectStore.prototype.getKeyRange = function() {
            var loReq = this.openCursor(null, "next");
            var hiReq = this.openCursor(null, "prev");
            return getKeyRange(loReq, hiReq, this.transaction);
        };
        return ObjectStore;
    };
});
zone("nigiri.extension").interceptor("nigiri.MyIndex", [ "getKeyRange" ], function(getKeyRange) {

    return function(Index) {

        Index.prototype.getKeyRange = function() {
            var loReq = this.openCursor(null, "next");
            var hiReq = this.openCursor(null, "prev");
            return getKeyRange(loReq, hiReq, this.__objectStore.transaction);
        };
        return Index;
    };
});
