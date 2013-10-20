var FACTORY = (function(REQUEST, INDEXEDDB_PROVIDER) {

    if (!INDEXEDDB_PROVIDER) {
        INDEXEDDB_PROVIDER = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;
    }

    if (!INDEXEDDB_PROVIDER) {
        throw new Error("Failed to create indexed DB");
    }

    return {
        open : function() {
            var req = INDEXEDDB_PROVIDER.open.apply(INDEXEDDB_PROVIDER, arguments);
            return new REQUEST(req);
        },

        deleteDatabase : function() {
            var req = INDEXEDDB_PROVIDER.deleteDatabase.apply(INDEXEDDB_PROVIDER, arguments);
            return new REQUEST(req);
        },

        cmp : function(a, b) {
            return INDEXEDDB_PROVIDER.cmp(a, b);
        }
    };
})(MyOpenDBRequest);
