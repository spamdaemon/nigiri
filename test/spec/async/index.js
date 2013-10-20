describe("Index", function() {
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
                unique : false,
                multiEntry : true
            }
        }
    });

    async.beforeEach(setup.setup());
    async.afterEach(setup.teardown());

    async.it("should count all entries", function(done) {

        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.count();
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

        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.count(Nigiri.KeyRange.bound("a","c"));
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

        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.get("bar");
        req.onsuccess = function(e) {
            expect(e.currentTarget.result.value).toEqual("bar");
            expect(req.result.value).toEqual(e.currentTarget.result.value);
            done();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should get a value by a keyrange", function(done) {

        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.get(Nigiri.KeyRange.bound("a","c"));
        req.onsuccess = function(e) {
            expect(e.currentTarget.result.value).toEqual("bar");
            expect(req.result.value).toEqual(e.currentTarget.result.value);
            done();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should get a primary key by its indexed key", function(done) {

        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.getKey("bar");
        req.onsuccess = function(e) {
            expect(e.currentTarget.result).toBe(2);
            done();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should get a primary key by a indexed keyrange", function(done) {

        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.getKey(Nigiri.KeyRange.bound("a","c"));
        req.onsuccess = function(e) {

            expect(e.currentTarget.result).toBe(2);
            done();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should return undefined for a value that doesn't exist", function(done) {

        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.get("bay");
        req.onsuccess = function(e) {
            expect(e.currentTarget.result).toBeUndefined();
            done();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should return undefined for a primary key that does not exist", function(done) {

        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.getKey("bay");
        req.onsuccess = function(e) {
            expect(e.currentTarget.result).toBeUndefined();
            done();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should open a keyvaluecursor", function(done) {

        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.openCursor(Nigiri.KeyRange.bound("a","c"));
        var count = 0;
        req.onsuccess = function(e) {
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

    async.it("should open a key cursor", function(done) {

        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.openKeyCursor(Nigiri.KeyRange.bound("a","c"));
        var count = 0;
        req.onsuccess = function(e) {
            if (e.currentTarget.result) {
                expect(e.currentTarget.result.value).toBeUndefined();
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

    it("should have a name", function() {
        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        expect(theIndex.name).toEqual("value");
    });

    it("should have a known keypath", function() {
        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        expect(theIndex.keyPath).toEqual("value");
    });

    it("should be multi entry index", function() {
        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        expect(theIndex.multiEntry).toBe(true);
    });

    it("should not have unique keys", function() {
        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        expect(theIndex.unique).toBe(false);
    });

    it("should have a valid object store", function() {
        var theIndex = setup.db.transaction([ "store" ], "readwrite").objectStore("store").index("value");
        expect(theIndex.objectStore.transaction.mode).toEqual("readwrite");
    });

});
