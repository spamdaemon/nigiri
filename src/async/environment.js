var MyEnvironment = function(idbEnvironment, indexDB) {
    this.__impl = idbEnvironment;
    this.__indexedDB = indexedDB;
};

// attributes
addConstProperty(MyEnvironment.prototype, "indexedDB");
