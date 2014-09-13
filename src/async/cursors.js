zone("nigiri").service("-cursors", [ "MyRequest", "MyCursor", "MyCursorWithValues" ], function(MyRequest, MyCursor, MyCursorWithValues) {
    "use strict"
    this.createCursorRequest = function(implSource, source, transaction, withValues, args) {
        var req = null;
        var result = null;

        if (withValues || !implSource.openKeyCursor) {
            req = implSource.openCursor.apply(implSource, args);
            result = function(r) {
                new MyCursor(r, source, transaction);
            };
        } else {
            req = implSource.openKeyCursor.apply(implSource, args);
            result = function(r) {
                new MyCursorWithValues(r, source, transaction);
            };
        }
        req = new MyRequest(req, source, transaction, result);
        return req;
    };

    this.createCountByCursorRequest = function(implSource, source, transaction, args) {
        var req = implSource.count.apply(implSource, args);
        req = new MyRequest(req, source, transaction);
        return req;
    };

    this.createDeleteByCursorRequest = function(implSource, source, transaction, args) {
        var req = implSource["delete"].apply(implSource, args);
        req = new MyRequest(req, source, transaction);
        return req;
    };

    this.createGetByCursorRequest = function(implSource, source, transaction, args) {
        var req = implSource.get.apply(implSource, args);
        req = new MyRequest(req, source, transaction);
        return req;
    };

    this.createGetKeyByCursorRequest = function(implSource, source, transaction, args) {
        var req = implSource.getKey.apply(implSource, args);
        req = new MyRequest(req, source, transaction);
        return req;
    };

    this.createObjectStoreCursorRequest = function(source, args) {
        return this.createCursorRequest(source.__impl, source, source.transaction, true, args);
    };

    this.createObjectStoreCountByCursorRequest = function(store, args) {
        var req = store.__impl.count.apply(store.__impl, args);
        req = new MyRequest(req, store, store.transaction);
        return req;
    };

    this.createObjectStoreDeleteByCursorRequest = function(store, args) {
        var req = store.__impl["delete"].apply(store.__impl, args);
        req = new MyRequest(req, store, store.transaction);
        return req;
    };

    this.createObjectStoreGetByCursorRequest = function(store, args) {
        var req = store.__impl.get.apply(store.__impl, args);
        req = new MyRequest(req, store, store.transaction);
        return req;
    };
});
