describe("ObjectStore", function() {
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
            key : 4,
            value : "baz"
        } ],
        index : {
            "value" : {
                unique : false
            }
        }
    });

    async.beforeEach(setup.setup());
    async.afterEach(setup.teardown());

    async.it("should count all entries", function(done) {

        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var req = theStore.count();
        req.onsuccess = function(e) {
            expect(e.currentTarget.result).toBe(3);
            expect(req.result).toBe(3);
            done();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should count all entries within a key range", function(done) {

        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var req = theStore.count(Nigiri.KeyRange.bound(2, 5));
        req.onsuccess = function(e) {
            expect(e.currentTarget.result).toBe(2);
            expect(req.result).toBe(2);
            done();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should get a value by its key", function(done) {

        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var req = theStore.get(2);
        req.onsuccess = function(e) {

            expect(e.currentTarget.result.value).toBe("bar");
            expect(req.result.value).toBe(e.currentTarget.result.value);
            done();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should get a value by a keyrange", function(done) {

        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var req = theStore.get(Nigiri.KeyRange.only(2));
        req.onsuccess = function(e) {

            expect(e.currentTarget.result.value).toBe("bar");
            expect(req.result.value).toBe(e.currentTarget.result.value);
            done();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should return undefined for a value that doesn't exist", function(done) {

        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var req = theStore.get(3);
        req.onsuccess = function(e) {
            expect(e.currentTarget.result).toBeUndefined();
            done();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should update an existing value", function(done) {

        var newValue = {
            key : 2,
            value : "new"
        };
        var theStore = setup.db.transaction([ "store" ], "readwrite").objectStore("store");
        var req = theStore.put(newValue);
        req.onsuccess = function(e) {

            req = theStore.count();
            req.onsuccess = function(e) {
                expect(e.currentTarget.result).toBe(3);
                expect(req.result).toBe(3);
                done();
            };
            req.onerror = function() {
                expect(true).toBe(false);
                done();
            };

        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should update an non-existent value", function(done) {

        var newValue = {
            key : 3,
            value : "new"
        };
        var theStore = setup.db.transaction([ "store" ], "readwrite").objectStore("store");
        var req = theStore.put(newValue);
        req.onsuccess = function(e) {

            req = theStore.count();
            req.onsuccess = function(e) {
                expect(e.currentTarget.result).toBe(4);
                expect(req.result).toBe(4);
                done();
            };
            req.onerror = function() {
                expect(true).toBe(false);
                done();
            };

        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should add an new value", function(done) {

        var newValue = {
            key : 3,
            value : "new"
        };
        var theStore = setup.db.transaction([ "store" ], "readwrite").objectStore("store");
        var req = theStore.add(newValue);
        req.onsuccess = function(e) {

            req = theStore.count();
            req.onsuccess = function(e) {
                expect(e.currentTarget.result).toBe(4);
                expect(req.result).toBe(4);
                done();
            };
            req.onerror = function() {
                expect(true).toBe(false);
                done();
            };

        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should not allow duplicates to be added", function(done) {

        var newValue = {
            key : 2,
            value : "new"
        };
        var theStore = setup.db.transaction([ "store" ], "readwrite").objectStore("store");
        var req = theStore.add(newValue);
        req.onsuccess = function(e) {
            expect(true).toBe(false);
            done();
        };
        req.onerror = function(e) {
            e.preventDefault();
            done();
        };
    });

    async.it("should delete a value", function(done) {

        var theStore = setup.db.transaction([ "store" ], "readwrite").objectStore("store");
        var req = theStore["delete"](2);
        req.onsuccess = function(e) {

            req = theStore.count();
            req.onsuccess = function(e) {
                expect(e.currentTarget.result).toBe(2);
                expect(req.result).toBe(2);
                done();
            };
            req.onerror = function() {
                expect(true).toBe(false);
                done();
            };

        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should delete a range of values", function(done) {

        var theStore = setup.db.transaction([ "store" ], "readwrite").objectStore("store");
        var req = theStore["delete"](Nigiri.KeyRange.bound(1.5, 6));
        req.onsuccess = function(e) {

            req = theStore.count();
            req.onsuccess = function(e) {
                expect(e.currentTarget.result).toBe(1);
                expect(req.result).toBe(1);
                done();
            };
            req.onerror = function() {
                expect(true).toBe(false);
                done();
            };

        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should open a cursor", function(done) {
        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var req = theStore.openCursor(Nigiri.KeyRange.bound(1.5, 6));
        var count = 0;
        req.onsuccess = function(e) {
            console.log("Iterate");
            if (e.currentTarget.result) {
                ++count;
                e.currentTarget.result.advance(1);
            } else {
                expect(count).toBe(2);
                done();
            }
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("find things in an index", function(done) {

        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var theIndex = theStore.index("value");
        var req = theIndex.openKeyCursor(Nigiri.KeyRange.only("bar"));
        var count = 0;
        req.onsuccess = function(e) {
            if (e.currentTarget.result) {
                ++count;
                e.currentTarget.result.advance(1);
            } else {
                expect(count).toBe(1);
                done();
            }
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should clear the store", function(done) {

        var theStore = setup.db.transaction([ "store" ], "readwrite").objectStore("store");
        var req = theStore.clear();
        req.onsuccess = function(e) {

            req = theStore.count();
            req.onsuccess = function() {
                console.log("Counted " + req.result);
                expect(req.result).toBe(0);
                done();
            };
            req.onerror = function() {
                expect(false).toBe(true);
                done();
            };
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    it("should have no auto-increment", function() {
        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        expect(theStore.autoIncrement).toBe(false);
    });

    it("should have a single index", function() {
        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        expect(theStore.indexNames.contains("value")).toBe(true);
    });

    it("should have a known keypath", function() {
        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        expect(theStore.keyPath).toEqual("key");
    });

    it("should have a name", function() {
        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        expect(theStore.name).toEqual("store");
    });

    it("should have a valid transaction", function() {
        var theStore = setup.db.transaction([ "store" ], "readwrite").objectStore("store");
        expect(theStore.transaction.mode).toEqual("readwrite");
    });

    async.it("should given an error when updating without a valid key", function(done) {

        var newValue = {
            value : "new"
        };
        var theStore = setup.db.transaction([ "store" ], "readwrite").objectStore("store");
        try {
            var req = theStore.put(newValue);
            req.onsuccess = function(e) {
                expect(true).toBe(false);
                done();
            };
            req.onerror = function(e) {
                e.preventDefault();
                expect(true).toBe(true);
                done();
            };
        } catch (x) {
            console.log("Caught error "+x);
            done();
        }
    });

});
