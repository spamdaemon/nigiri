describe("Index", function() {
    // set up the async spec
    var async = new AsyncSpec(this);
    var setup = new db_setup({
        data : [ {
            key : 0,
            value : "a"
        }, {
            key : 1,
            value : "a"
        }, {
            key : 2,
            value : "b"
        }, {
            key : 3,
            value : "b"
        }, {
            key : 4,
            value : "c"
        }, {
            key : 5,
            value : "d"
        }, {
            key : 6,
            value : "d"
        }, {
            key : 7,
            value : "e"
        }, {
            key : 8,
            value : "f"
        }, {
            key : 9,
            value : "w"
        }, {
            key : 10,
            value : "z"
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

    async.it("get the first value in a sequence", zone.inject([ "#done", "nigiri.Nigiri" ], function(done, Nigiri) {

        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.get(new Nigiri.KeySet([ "k", "r", "w", "z" ]));
        req.onsuccess = function(e) {
            expect(e.currentTarget.result).not.toBe(null);
            expect(e.currentTarget.result.value).toEqual("w");
            expect(req.result.value).toEqual(e.currentTarget.result.value);
            done();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));

    async.it("should open a keyvaluecursor", zone.inject([ "#done", "nigiri.Nigiri" ], function(done, Nigiri) {

        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.openCursor(new Nigiri.KeySet([ "c", "d", "k", "z" ]));
        var count = 0;
        req.onsuccess = function(e) {
            if (e.currentTarget.result) {
                ++count;
                e.currentTarget.result.advance(1);
            } else {
                expect(count).toBe(4);
                done();
            }
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));

    async.it("should open a key cursor", zone.inject([ "#done", "nigiri.Nigiri" ], function(done, Nigiri) {

        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.openKeyCursor(new Nigiri.KeySet([ "c", "d", "k", "z" ]));
        var count = 0;
        req.onsuccess = function(e) {
            if (e.currentTarget.result) {
                ++count;
                e.currentTarget.result.advance(1);
            } else {
                expect(count).toBe(4);
                done();
            }
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));

    async.it("should count all entries within a keyset", zone.inject([ "#done", "nigiri.Nigiri" ], function(done, Nigiri) {

        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.count(new Nigiri.KeySet([ "c", "d", "k", "z" ]));
        req.onsuccess = function(e) {
            expect(e.currentTarget.result).toBe(4);
            expect(req).toBe(e.currentTarget);
            done();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));

    async.it("get the first key in a sequence", zone.inject([ "#done", "nigiri.Nigiri" ], function(done, Nigiri) {

        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.getKey(new Nigiri.KeySet([ "k", "r", "w", "z" ]));
        req.onsuccess = function(e) {
            expect(e.currentTarget.result).toBe(9);
            done();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));

    async.it("should return undefined for a primary key that does not exist", zone.inject([ "#done", "nigiri.Nigiri" ], function(done, Nigiri) {

        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.getKey(new Nigiri.KeySet([ "k", "r" ]));
        req.onsuccess = function(e) {
            expect(e.currentTarget.result).toBeUndefined();
            done();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));

    async.it("should return undefined for a value that doesn't exist", zone.inject([ "#done", "nigiri.Nigiri" ], function(done, Nigiri) {

        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.get(new Nigiri.KeySet([ "k", "r" ]));
        req.onsuccess = function(e) {
            expect(e.currentTarget.result).toBeUndefined();
            done();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));

    async.it("should consider excluded/included keys and primary keys", zone.inject([ "#done", "nigiri.Nigiri" ], function(done, Nigiri) {
        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var options = {
            includedKeys : [ "c", "d", "e", "f" ],
            excludedKeys : [ "e" ],
            includedPrimaryKeys : [ 5, 6 ],
            excludedPrimaryKeys : [ 4, 5 ]
        };
        var req = theIndex.openCursor(null, options);
        var results = [];

        req.onsuccess = function(e) {
            if (!req.result) {
                expect(results.length).toBe(1);
                expect(results[0]).toBe(6);
                done();
            } else {
                results.push(req.result.primaryKey);
                req.result.advance(1);
            }
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));

    async.it("should get a value by its key", zone.inject([ "#done", "nigiri.Nigiri" ], function(done, Nigiri) {

        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.get("f", new Nigiri.Options({
            limit : 100
        }));
        req.onsuccess = function(e) {
            expect(e.currentTarget.result.value).toEqual("f");
            expect(req.result.value).toEqual(e.currentTarget.result.value);
            done();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));

    async.it("should get a primary key by its indexed key", zone.inject([ "#done", "nigiri.Nigiri" ], function(done, Nigiri) {

        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.getKey("f", new Nigiri.Options({
            limit : 100
        }));
        req.onsuccess = function(e) {
            expect(e.currentTarget.result).toBe(8);
            done();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));

});
