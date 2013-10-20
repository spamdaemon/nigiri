var MyTransaction = function(idbTransaction, db) {
    MyDBEventTarget.call(this, idbTransaction);
    this.__impl = idbTransaction;
    this.__db = db;
};

// inheritance
MyTransaction.prototype = Object.create(MyDBEventTarget.prototype);
MyTransaction.prototype.constructor = MyTransaction;

MyTransaction.prototype.abort = function() {
    this.__impl.abort.apply(this.__impl, arguments);
};

MyTransaction.prototype.objectStore = function() {
    var store = this.__impl.objectStore.apply(this.__impl, arguments);
    return new MyObjectStore(store, this);
};

// attributes
addConstProperty(MyTransaction.prototype, "db");
addConstAttribute(MyTransaction.prototype, "mode");
addConstAttribute(MyTransaction.prototype, "error");
addEventHandlerProperty(MyTransaction.prototype, "onabort");
addEventHandlerProperty(MyTransaction.prototype, "oncomplete");
addEventHandlerProperty(MyTransaction.prototype, "onerror");
