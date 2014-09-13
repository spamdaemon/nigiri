zone("nigiri").factory("#MyIndex", [ "Utils" ,"cursors"], function(Utils,cursors) {
    "use strict"

    var MyIndex = function(idbIndex, objectStore) {
        this.__impl = idbIndex;
        this.__objectStore = objectStore;
    };

    MyIndex.prototype.get = function() {
        return cursors.createGetByCursorRequest(this.__impl, this, this.__objectStore.transaction, arguments);
    };

    MyIndex.prototype.getKey = function() {
        return cursors.createGetKeyByCursorRequest(this.__impl, this, this.__objectStore.transaction, arguments);
    };

    MyIndex.prototype.count = function() {
        return cursors.createCountByCursorRequest(this.__impl, this, this.__objectStore.transaction, arguments);
    };

    MyIndex.prototype.openCursor = function() {
        return cursors.createCursorRequest(this.__impl, this, this.__objectStore.transaction, true, arguments);
    };

    MyIndex.prototype.openKeyCursor = function() {
        return cursors.createCursorRequest(this.__impl, this, this.__objectStore.transaction, false, arguments);
    };

    // attributes
    Utils.addConstAttribute(MyIndex.prototype, "name");
    Utils.addConstProperty(MyIndex.prototype, "objectStore");
    Utils.addConstAttribute(MyIndex.prototype, "keyPath");
    Utils.addConstAttribute(MyIndex.prototype, "multiEntry");
    Utils.addConstAttribute(MyIndex.prototype, "unique");

    return MyIndex;
});
