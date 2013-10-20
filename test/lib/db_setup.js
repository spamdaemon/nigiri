this.db_setup = (function(global) {

    var nextDB = 0;

    function is_array(o) {
        if (o != null && typeof o == "object") {
            return (typeof o.push == "undefined") ? false : true;
        } else {
            return false;
        }
    }

    var DBSetup = function(options) {
        options = options || {};
        this.__version = options.version || 1;
        this.__store = options.store || "store";
        this.__name = options.name || ("testDB" + (nextDB++));
        this.__options = options.options || null;
        this.__index = options.index || null;
        this.__data = options.data || [];
        if (options.data) {
            if (this.__options === null) {
                this.__options = {
                    keyPath : "key"
                };
                // console.log("Using default key for pre-populated data : key");
            } else if (!this.__options.keyPath) {
                this.__options[keyPath] = "key";
                // console.log("Using default key for pre-populated data : key");
            }
        }
        this.db = null;
    };

    DBSetup.prototype.setup = function() {
        var self = this;
        return function(done) {
            console.log(jasmine.getEnv().currentSpec.description);
            var db = Nigiri.IndexedDB;
            var req = db.deleteDatabase(self.__name);
            req.onsuccess = function() {
                req = db.open(self.__name, self.__version);
                req.onupgradeneeded = function() {
                    var store, i;
                    if (self.__options) {
                        store = req.result.createObjectStore(self.__store, self.__options);
                    } else {
                        store = req.result.createObjectStore(self.__store);
                    }
                    if (self.__index) {
                        for (i in self.__index) {
                            if (self.__index.hasOwnProperty(i)) {
                                index = store.createIndex(i, i, self.__index[i]);
                            }
                        }
                    }
                    if (is_array(self.__data)) {
                        for (i = 0; i < self.__data.length; ++i) {
                            if (self.__data[i]) {
                                // console.log("Populate " + i + " : " + JSON.stringify(self.__data[i]));
                                store.add(self.__data[i]);
                            }
                        }
                    } else if (self.__data) {
                        store.add(self.__data);
                    }
                };

                req.onsuccess = function() {
                    self.db = req.result;
                    // console.log("Setup " + self.__name + " : OK; stores="+JSON.stringify(self.db.objectStoreNames));
                    done();
                };
                req.onerror = function() {
                    // console.log("Setup " + self.__name + " : Open FAIL");
                    expect(true).toBe(false);
                    done();
                };
            };
            req.onerror = function() {
                // console.log("Setup " + self.__name + " : DeleteDB FAIL");
                expect(true).toBe(false);
                done();
            };
        };
    };

    DBSetup.prototype.teardown = function() {
        var self = this;
        return function(done) {
            if (self.db) {
                self.db.close();
                self.db = null;
            }
            var req = Nigiri.IndexedDB.deleteDatabase(self.__name);
            req.onsuccess = function() {
                // console.log("Teardown " + self.__name + " : OK");
                done();
            };
            req.onerror = function() {
                // console.log("Teardown " + self.__name + " : FAIL");
                done();
            };
        };
    };

    return DBSetup;
})(this);