describe("Cursor", function() {

    // set up the async spec
    var async = new AsyncSpec(this);
    var setup = new db_setup({
        data : [ {
            key : 1,
            value : "foo"
        }, {
            key : 2,
            value : "bar"
        }, {
            key : 3,
            value : "baz"
        } ],
        index : {
            "value" : {
                unique : false,
                multiEntry : true
            }
        }
    });

    async.beforeEach(setup.setup());
    async.afterEach(setup.teardown());

    async.it("should iterate over all values", function(done) {
        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var theCursor = theStore.openCursor();
        var results = {
            1 : false,
            2 : false,
            3 : false
        };

        theCursor.onsuccess = function() {
            if (!theCursor.result) {
                done();
                expect(results[3]).toBe(3);
                expect(results[1]).toBe(1);
                expect(results[2]).toBe(2);
                return;
            }
            expect(theCursor.source.name).toEqual("store");
            results[theCursor.result.primaryKey] = theCursor.result.primaryKey;
            theCursor.result["continue"]();
        };
        theCursor.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should iterate over one value", function(done) {
        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var theCursor = theStore.openCursor(Nigiri.KeyRange.only(2));
        var results = {
            1 : false,
            2 : false,
            3 : false
        };

        theCursor.onsuccess = function() {
            if (!theCursor.result) {
                done();
                expect(results[3]).toBe(false);
                expect(results[1]).toBe(false);
                expect(results[2]).toBe(true);
                return;
            }
            results[theCursor.result.primaryKey] = true;
            theCursor.result["continue"]();
        };
        theCursor.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should advance by 2", function(done) {
        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var theCursor = theStore.openCursor();
        var results = {
            1 : false,
            2 : false,
            3 : false
        };

        theCursor.onsuccess = function() {
            if (!theCursor.result) {
                done();
                expect(results[3]).toBe(true);
                expect(results[1]).toBe(true);
                expect(results[2]).toBe(false);
                return;
            }
            results[theCursor.result.primaryKey] = true;
            theCursor.result.advance(2);
        };
        theCursor.onerror = function() {
            expect(true).toBe(false);
            done();
        };

    });
    async.it("should advance to another key", function(done) {
        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var theCursor = theStore.openCursor();
        var results = {
            1 : false,
            2 : false,
            3 : false
        };

        theCursor.onsuccess = function() {
            if (!theCursor.result) {
                done();
                expect(results[3]).toBe(true);
                expect(results[1]).toBe(true);
                expect(results[2]).toBe(false);
                return;
            }
            results[theCursor.result.primaryKey] = true;
            theCursor.result["continue"](theCursor.result.primaryKey + 2);
        };
        theCursor.onerror = function() {
            expect(true).toBe(false);
            done();
        };

    });

    async.it("should be a valid cursor", function(done) {
        var theIndex = setup.db.transaction([ "store" ],"readwrite").objectStore("store").index("value");
        var req = theIndex.openCursor("bar");
        expect(req.source.name).toEqual("value");
        expect(req.transaction.mode).toEqual("readwrite");
        expect(req.readyState).toEqual("pending");
        
        req.onsuccess = function(e) {
            expect(e.currentTarget.result.source.name).toEqual("value");
            expect(e.currentTarget.result.primaryKey).toBe(2);
            expect(e.currentTarget.result.key).toBe("bar");
            done();
        };

        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

});
