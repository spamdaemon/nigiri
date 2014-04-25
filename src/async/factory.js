var FACTORY = (function(REQUEST, INDEXEDDB_PROVIDER) {
    "use strict";

    if (!INDEXEDDB_PROVIDER) {
        INDEXEDDB_PROVIDER = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;
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

})(MyOpenDBRequest);
