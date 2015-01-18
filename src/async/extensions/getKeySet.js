zone("nigiri.extension").factory("-getKeySet", [ "MyKeySet", "MyRequest" ], function(KeySet, TheRequest) {
    "use strict"

    var getKeySet = function(source, transaction) {
        var request = new TheRequest(null, source, transaction);

        // get all the keys
        var req = source.getAllKeys(null,"nextunique");

        req.onsuccess = function(e) {
            var ks = null;
            if (req.result.length > 0) {
                ks = new KeySet(req.result);
            }
            request.__notifyOnSuccess(ks);
        };

        req.onerror = function(e) {
            request.__notifyOnError(req.error);
        };

        request.__setOwnerOf(req);

        return request;
    };

    return getKeySet;
});

zone("nigiri.extension").interceptor("nigiri.MyObjectStore", [ "getKeySet" ], function(getKeySet) {

    return function(ObjectStore) {

        ObjectStore().prototype.getKeySet = function() {
            return getKeySet(this, this.transaction);
        };
        return ObjectStore();
    };
});

zone("nigiri.extension").interceptor("nigiri.MyIndex", [ "getKeySet" ], function(getKeySet) {

    return function(Index) {

        Index().prototype.getKeySet = function() {
            return getKeySet(this, this.transaction);
        };
        return Index();
    };
});
