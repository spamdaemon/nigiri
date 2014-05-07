describe("objectStoreQuery", function() {

    // set up the async spec
    var async = new AsyncSpec(this);
    var setup = new db_setup({
        data : [ {
            key : 0,
            indexed0 : "a0",
            indexed1 : "a1",
            indexed2 : "a2",
            unindexed0 : "u0"
        }, {
            key : 2,
            indexed0 : "a0",
            indexed1 : "c1",
            indexed2 : "a2"
        }, {
            key : 1,
            indexed0 : "a0",
            indexed1 : "b1",
            indexed2 : "a2",
            unindexed0 : "u1",
            $group : {
                $indexed : [ 'a' ]
            }
        } ],
        index : {
            "indexed0" : {
                unique : false,
                multiEntry : true
            },
            "indexed1" : {
                unique : false,
                multiEntry : true
            },
            "indexed2" : {
                unique : false,
                multiEntry : true
            },
            "$group.$indexed" : {
                unique : false,
                multiEntry : true
            }
        }
    });

    async.beforeEach(setup.setup());
    async.afterEach(setup.teardown());

    async.it("should find an item", zone.inject(["#done","nigiri.Nigiri"], function(done,Nigiri) {
        var query = {
            indexed0 : "a0",
            indexed1 : new Nigiri.KeySet([ "a1", "b1" ]),
            indexed2 : "a2",
            unindexed0 : new Nigiri.KeySet([ "u0", "u1" ])
        };

        var theQuery = new Nigiri.Query(query);

        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var req = theStore.openCursor(theQuery);
        var i = 0;
        req.onsuccess = function(e) {
            if (!e.currentTarget.result) {
                expect(i).toBe(2);
                done();
                return;
            }
            expect(e.currentTarget.result.primaryKey).toBe(i);
            ++i;
            e.currentTarget.result["continue"]();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));

    async.it("should find an item with the nested path", zone.inject(["#done","nigiri.Nigiri"], function(done,Nigiri) {
        var query = {
            "$group.$indexed" : "a",
        };

        var theQuery = new Nigiri.Query(query);

        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var req = theStore.openCursor(theQuery);
        var i = 0;
        req.onsuccess = function(e) {
            if (!e.currentTarget.result) {
                expect(i).toBe(1);
                done();
                return;
            }
            expect(e.currentTarget.result.primaryKey).toBe(1);
            ++i;
            e.currentTarget.result["continue"]();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));

    async.it("should find an unindexed", zone.inject(["#done","nigiri.Nigiri"], function(done,Nigiri) {
        var query = {
            unindexed0 : new Nigiri.KeySet([ "u0", "u1" ])
        };

        var theQuery = new Nigiri.Query(query);

        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var req = theStore.openCursor(theQuery);
        var i = 0;
        req.onsuccess = function(e) {
            if (!e.currentTarget.result) {
                expect(i).toBe(2);
                done();
                return;
            }
            expect(e.currentTarget.result.primaryKey).toBe(i);
            ++i;
            e.currentTarget.result["continue"]();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));

    async.it("should find no item", zone.inject(["#done","nigiri.Nigiri"], function(done,Nigiri) {

        var query = {
            indexed0 : "x0",
            indexed1 : new Nigiri.KeySet([ "a1", "b1" ]),
            indexed2 : "a2"
        };
        var theQuery = query;

        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var req = theStore.openCursor(theQuery);
        req.onsuccess = function(e) {
            expect(e.currentTarget.result).toBeNull();
            done();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));

    async.it("should use included and excluded primary keys", function(done) {

        var query = {
            indexed0 : "a0",
        };

        var options = {
            excludedPrimaryKeys : [ 0 ],
            includedPrimaryKeys : [ 1 ]
        };

        var theQuery = query;

        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var req = theStore.openCursor(theQuery, options);
        var res = [];
        req.onsuccess = function(e) {
            if (e.currentTarget.result) {
                res.push(req.result.primaryKey);
                req.result.advance(1);
            } else {
                expect(res[0]).toBe(1);
                expect(res.length).toBe(1);
                done();
            }
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should not fail this unit test", zone.inject(["#done","nigiri.Nigiri"], function(done,Nigiri) {

        var query = {
            "key" : new Nigiri.KeySet([ 2 ]),
        };

        var options = {};

        var theQuery = new Nigiri.Query(query);

        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var req = theStore.openCursor(theQuery, options);
        var res = [];
        req.onsuccess = function(e) {
            if (e.currentTarget.result) {
                res.push(req.result.primaryKey);
                req.result.advance(1);
            } else {
                expect(res.length).toBe(1);
                expect(res[0]).toBe(2);
                done();
            }
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));

});
