describe("CursorWithValues", function() {
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
            baz : false,
            foo : false,
            bar : false
        };

        theCursor.onsuccess = function() {
            if (!theCursor.result) {
                done();
                expect(results.baz).toBe(3);
                expect(results.foo).toBe(1);
                expect(results.bar).toBe(2);
                return;
            }
            results[theCursor.result.value.value] = theCursor.result.primaryKey;
            theCursor.result["continue"]();
        };
        theCursor.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should iterate over one value",zone.inject(["#done","nigiri.Nigiri"], function(done,Nigiri) {
        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var theCursor = theStore.openCursor(Nigiri.KeyRange.only(2));
        var results = {
            baz : false,
            foo : false,
            bar : false
        };

        theCursor.onsuccess = function() {
            if (!theCursor.result) {
                done();
                expect(results.baz).toBe(false);
                expect(results.foo).toBe(false);
                expect(results.bar).toBe(true);
                return;
            }
            results[theCursor.result.value.value] = true;
            theCursor.result["continue"]();
        };
        theCursor.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));

    async.it("should advance by 2", function(done) {
        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var theCursor = theStore.openCursor();
        var results = {
            baz : false,
            foo : false,
            bar : false
        };

        theCursor.onsuccess = function() {
            if (!theCursor.result) {
                done();
                expect(results.baz).toBe(true);
                expect(results.foo).toBe(true);
                expect(results.bar).toBe(false);
                return;
            }
            results[theCursor.result.value.value] = true;
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
            baz : false,
            foo : false,
            bar : false
        };

        theCursor.onsuccess = function() {
            if (!theCursor.result) {
                done();
                expect(results.baz).toBe(true);
                expect(results.foo).toBe(true);
                expect(results.bar).toBe(false);
                return;
            }
            results[theCursor.result.value.value] = true;
            theCursor.result["continue"](theCursor.result.primaryKey + 2);
        };
        theCursor.onerror = function() {
            expect(true).toBe(false);
            done();
        };

    });

    async.it("should be a valid cursor", function(done) {
        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.openCursor("bar");
        req.onsuccess = function(e) {
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
