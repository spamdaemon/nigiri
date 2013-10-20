(function(TheRequest, Factory, ObjectStore, Index) {

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
                if (n === 0 || Factory.cmp(result[n - 1], key) !== 0) {
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

    ObjectStore.prototype.getAllKeys = function() {
        var req = this.openCursor.apply(this, arguments);
        return getAll(req);
    };

    Index.prototype.getAllKeys = function() {
        var req = this.openKeyCursor.apply(this, arguments);
        return getAll(req);
    };

})(MyRequest, FACTORY, MyObjectStore, MyIndex);
