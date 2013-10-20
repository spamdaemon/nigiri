var MyDatabase = function(idbDatabase) {
    MyDBEventTarget.call(this, idbDatabase, this);
};

// inheritance
MyDatabase.prototype = Object.create(MyDBEventTarget.prototype);
MyDatabase.prototype.constructor = MyDatabase;

MyDatabase.prototype.createObjectStore = function() {
    var store = this.__impl.createObjectStore.apply(this.__impl, arguments);
    return new MyObjectStore(store, new MyTransaction(store.transaction));
};

MyDatabase.prototype.deleteObjectStore = function() {
    this.__impl.deleteObjectStore.apply(this.__impl, arguments);
};

MyDatabase.prototype.transaction = function() {
    var tx = this.__impl.transaction.apply(this.__impl, arguments);
    return new MyTransaction(tx, this);
};

MyDatabase.prototype.close = function() {
    this.__impl.close.apply(this.__impl, arguments);
};

// attributes
addConstAttribute(MyDatabase.prototype, "name");
addConstAttribute(MyDatabase.prototype, "version");
addConstAttribute(MyDatabase.prototype, "objectStoreNames");
