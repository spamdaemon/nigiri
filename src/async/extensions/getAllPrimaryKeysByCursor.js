(function(TheRequest, Factory, ObjectStore, Index) {

    var objectToArray = function(obj) {
        var res = [];
        var key = null;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                res.push(obj[key]);
            }
        }
        res.sort(Factory.cmp);
        return res;
    };

    var getAll = function(cursorRequest) {

        var request = new TheRequest(null, cursorRequest.source, cursorRequest.transaction);
        var result = {};

        cursorRequest.onsuccess = function(e) {
            var key;
            if (TheRequest.__invalidResult(cursorRequest)) {
                request.__notifyOnSuccess(objectToArray(result), e);
            } else {
                key = cursorRequest.result.primaryKey;
                if (!result.hasOwnProperty(key)) {
                    result[key] = key;
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

    ObjectStore.prototype.getAllPrimaryKeys = function() {
        var req = this.openCursor.apply(this, arguments);
        return getAll(req);
    };

    Index.prototype.getAllPrimaryKeys = function() {
        var req = this.openKeyCursor.apply(this, arguments);
        return getAll(req);
    };

})(MyRequest, FACTORY, MyObjectStore, MyIndex);
