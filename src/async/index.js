var MyIndex = function(idbIndex, objectStore) {
    this.__impl = idbIndex;
    this.__objectStore = objectStore;
};

MyIndex.prototype.get = function() {
    return createGetByCursorRequest(this.__impl, this, this.__objectStore.transaction, arguments);
};

MyIndex.prototype.getKey = function() {
    return createGetKeyByCursorRequest(this.__impl, this, this.__objectStore.transaction, arguments);
};

MyIndex.prototype.count = function() {
    return createCountByCursorRequest(this.__impl, this, this.__objectStore.transaction, arguments);
};

MyIndex.prototype.openCursor = function() {
    return createCursorRequest(this.__impl, this, this.__objectStore.transaction, true, arguments);
};

MyIndex.prototype.openKeyCursor = function() {
    return createCursorRequest(this.__impl, this, this.__objectStore.transaction, false, arguments);
};

// attributes
addConstAttribute(MyIndex.prototype, "name");
addConstProperty(MyIndex.prototype, "objectStore");
addConstAttribute(MyIndex.prototype, "keyPath");
addConstAttribute(MyIndex.prototype, "multiEntry");
addConstAttribute(MyIndex.prototype, "unique");
