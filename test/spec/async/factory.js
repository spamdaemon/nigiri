describe("factory test", function() {
    // set up the async spec
    var async = new AsyncSpec(this);
    var dbName = "ftestdb";

    var deleteDatabase = function(message) {
        return function(done) {
            console.log(message);
            var db = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;
            var req = db.deleteDatabase(dbName);
            req.onsuccess = function() {
                done();
                console.log("Database deleted");
            };
            req.onerror = function() {
                console.log("Failed to delete database");
                done();
                expect(false).toBe(true);
            };
        };
    };

    async.beforeEach(deleteDatabase("BEFORE EACH"));
    async.afterEach(deleteDatabase("AFTER EACH"));

    async.it("should create a database", function(done) {
        var upgraded = false;
        var req = Nigiri.IndexedDB.open(dbName, 1);
        expect(req.readyState).toEqual("pending");

        req.onupgradeneeded = function(e) {
            expect(e.newVersion).toBe(1);

            expect(req.transaction.mode).toEqual("versionchange");
            expect(req.source).toBeNull();
            expect(req.error).toBeNull();
            expect(req.readyState).toEqual("done");
            expect(req.result.version).toBe(1);
            
            console.log("Upgrade needed");
            upgraded = true;
        };
        req.onsuccess = function() {
            console.log("Success");
            done();
            req.result.close();
            expect(upgraded).toBe(true);
        };
        req.onerror = function() {
            console.log("Error");
            status = false;
            done();
            req.result.close();
            expect(false).toBe(true);
        };
    });
    
    

});
