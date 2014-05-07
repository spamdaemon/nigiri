zone("nigiri").protectedFactory("MyEnvironment",["Utils"], function(Utils) {

    var MyEnvironment = function(idbEnvironment, indexDB) {
        this.__impl = idbEnvironment;
        this.__indexedDB = indexedDB;
    };

    // attributes
    Utils. addConstProperty(MyEnvironment.prototype, "indexedDB");
    return MyEnvironment;
});
