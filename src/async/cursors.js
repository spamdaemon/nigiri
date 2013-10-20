var createCursorRequest = function(implSource, source, transaction, withValues, args) {
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

var createCountByCursorRequest = function(implSource, source, transaction, args) {
    var req = implSource.count.apply(implSource, args);
    req = new MyRequest(req, source, transaction);
    return req;
};

var createDeleteByCursorRequest = function(implSource, source, transaction, args) {
    var req = implSource["delete"].apply(implSource, args);
    req = new MyRequest(req, source, transaction);
    return req;
};

var createGetByCursorRequest = function(implSource, source, transaction, args) {
    var req = implSource.get.apply(implSource, args);
    req = new MyRequest(req, source, transaction);
    return req;
};

var createGetKeyByCursorRequest = function(implSource, source, transaction, args) {
    var req = implSource.getKey.apply(implSource, args);
    req = new MyRequest(req, source, transaction);
    return req;
};

var createObjectStoreCursorRequest = function(source, args) {
    return createCursorRequest(source.__impl, source, source.transaction, true, args);
};

var createObjectStoreCountByCursorRequest = function(store, args) {
    var req = store.__impl.count.apply(store.__impl, args);
    req = new MyRequest(req, store, store.transaction);
    return req;
};

var createObjectStoreDeleteByCursorRequest = function(store, args) {
    var req = store.__impl["delete"].apply(store.__impl, args);
    req = new MyRequest(req, store, store.transaction);
    return req;
};

var createObjectStoreGetByCursorRequest = function(store, args) {
    var req = store.__impl.get.apply(store.__impl, args);
    req = new MyRequest(req, store, store.transaction);
    return req;
};
