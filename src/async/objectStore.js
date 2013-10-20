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
    return createObjectStoreCountByCursorRequest(this, arguments);
};

MyObjectStore.prototype.createIndex = function() {
    var req = this.__impl.createIndex.apply(this.__impl, arguments);
    return new MyIndex(req, this);
};

MyObjectStore.prototype["delete"] = function() {
    return createObjectStoreDeleteByCursorRequest(this, arguments);
};

MyObjectStore.prototype.deleteIndex = function() {
    this.__impl.deleteIndex.apply(this.__impl, arguments);
};

MyObjectStore.prototype.get = function() {
    return createObjectStoreGetByCursorRequest(this, arguments);
};

MyObjectStore.prototype.index = function() {
    var res = this.__impl.index.apply(this.__impl, arguments);
    return new MyIndex(res, this);
};

MyObjectStore.prototype.openCursor = function() {
    return createObjectStoreCursorRequest(this, arguments);
};

MyObjectStore.prototype.put = function(value, key) {
    var req = this.__impl.put.apply(this.__impl, arguments);
    return new MyRequest(req, this, this.__transaction);
};

// attributes
addConstAttribute(MyObjectStore.prototype, "indexNames");
addConstAttribute(MyObjectStore.prototype, "keyPath");
addConstAttribute(MyObjectStore.prototype, "name");
addConstProperty(MyObjectStore.prototype, "transaction");
addConstAttribute(MyObjectStore.prototype, "autoIncrement");
