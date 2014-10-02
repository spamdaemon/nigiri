zone("nigiri").factory("-IndexDBProvider", [ "$indexedDB" ], function(db) {
    "use strict"
    return db;
});
zone("nigiri").factory("#cmp", [ "IndexDBProvider" ], function(provider) {
    "use strict"
    return function(a, b) {
        return provider.cmp(a, b);
    };
});

zone("nigiri").factory("#FACTORY", [ "MyOpenDBRequest", "IndexDBProvider", "$indexedDB" ], function(REQUEST, INDEXEDDB_PROVIDER,nativeDB) {
    "use strict";

    if (!INDEXEDDB_PROVIDER) {
        INDEXEDDB_PROVIDER = nativeDB;
    }

    if (!INDEXEDDB_PROVIDER) {
        throw new Error("Failed to create indexed DB");
    }

    var provider = function() {
        this.open = function() {
            var req = INDEXEDDB_PROVIDER.open.apply(INDEXEDDB_PROVIDER, arguments);
            return new REQUEST(req);
        };
        this.deleteDatabase = function() {
            var req = INDEXEDDB_PROVIDER.deleteDatabase.apply(INDEXEDDB_PROVIDER, arguments);
            return new REQUEST(req);
        };

        this.cmp = function(a, b) {
            return INDEXEDDB_PROVIDER.cmp(a, b);
        };
    };

    return new provider();

});
