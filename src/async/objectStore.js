zone("nigiri").protectedFactory("MyObjectStore", [ "MyRequest", "MyIndex", "Utils", "cursors" ], function(MyRequest, MyIndex, Utils, cursors) {

    var MyObjectStore = function(idbObjectStore, transaction) {
        this.__impl = idbObjectStore;
        this.__transaction = transaction;
    };

    MyObjectStore.prototype.add = function() {
        var req = this.__impl.add.apply(this.__impl, arguments);
        return new MyRequest(req, this, this.__transaction);
    };

    MyObjectStore.prototype.clear = function() {
        var req = this.__impl.clear.apply(this.__impl, arguments);
        return new MyRequest(req, this, this.__transaction);
    };

    MyObjectStore.prototype.count = function() {
        return cursors.createObjectStoreCountByCursorRequest(this, arguments);
    };

    MyObjectStore.prototype.createIndex = function() {
        var req = this.__impl.createIndex.apply(this.__impl, arguments);
        return new MyIndex(req, this);
    };

    MyObjectStore.prototype["delete"] = function() {
        return cursors.createObjectStoreDeleteByCursorRequest(this, arguments);
    };

    MyObjectStore.prototype.deleteIndex = function() {
        this.__impl.deleteIndex.apply(this.__impl, arguments);
    };

    MyObjectStore.prototype.get = function() {
        return cursors.createObjectStoreGetByCursorRequest(this, arguments);
    };

    MyObjectStore.prototype.index = function() {
        var res = this.__impl.index.apply(this.__impl, arguments);
        return new MyIndex(res, this);
    };

    MyObjectStore.prototype.openCursor = function() {
        return cursors.createObjectStoreCursorRequest(this, arguments);
    };

    MyObjectStore.prototype.put = function(value, key) {
        var req = this.__impl.put.apply(this.__impl, arguments);
        return new MyRequest(req, this, this.__transaction);
    };

    // attributes
    Utils.addConstAttribute(MyObjectStore.prototype, "indexNames");
    Utils.addConstAttribute(MyObjectStore.prototype, "keyPath");
    Utils.addConstAttribute(MyObjectStore.prototype, "name");
    Utils.addConstProperty(MyObjectStore.prototype, "transaction");
    Utils.addConstAttribute(MyObjectStore.prototype, "autoIncrement");

    return MyObjectStore;
});