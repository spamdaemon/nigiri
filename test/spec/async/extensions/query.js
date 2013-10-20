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
            unindexed0 : "u1"

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
        }
    });

    async.beforeEach(setup.setup());
    async.afterEach(setup.teardown());

    async.it("should find an item", function(done) {
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
    });

    async.it("should find an unindexed", function(done) {
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
    });

    async.it("should find no item", function(done) {

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
    });

});