zone("nigiri").factory("#MyEnvironment", [ "Utils" ], function(Utils) {
    "use strict"

    var MyEnvironment = function(idbEnvironment, indexDB) {
        this.__impl = idbEnvironment;
        this.__indexedDB = indexedDB;
    };

    // attributes
    Utils.addConstProperty(MyEnvironment.prototype, "indexedDB");
    return MyEnvironment;
});
