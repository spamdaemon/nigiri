describe("addAll", function() {
    // set up the async spec
    var async = new AsyncSpec(this);
    var setup = new db_setup({
        data : [ {
            key : 0,
            value : "@"
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

    async.it("should add multiple new elements", function(done) {
        var theStore = setup.db.transaction([ "store" ], "readwrite").objectStore("store");

        var req = theStore.addAll([ {
            key : 1,
            value : "a"
        }, {
            key : 2,
            value : "b"
        }, {
            key : 3,
            value : "c"
        }, {
            key : 4,
            value : "d"
        }, {
            key : 5,
            value : "e"
        }, {
            key : 6,
            value : "f"
        }, {
            key : 7,
            value : "g"
        }, {
            key : 8,
            value : "h"
        }, {
            key : 9,
            value : "i"
        }, {
            key : 10,
            value : "j"
        } ]);

        req.onsuccess = function(e) {
            expect(e.currentTarget.result.successes).toBe(10);
            done();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should fail to add due to a duplicate key", function(done) {
        var theStore = setup.db.transaction([ "store" ], "readwrite").objectStore("store");

        var req = theStore.addAll([ {
            key : 1,
            value : "a"
        }, {
            key : 2,
            value : "b"
        }, {
            key : 3,
            value : "c"
        }, {
            key : 4,
            value : "d"
        }, {
            key : 5,
            value : "e"
        }, {
            key : 6,
            value : "f"
        }, {
            key : 7,
            value : "g"
        }, {
            key : 8,
            value : "h"
        }, {
            key : 9,
            value : "i"
        }, {
            key : 0,
            value : "j"
        } ]);

        var errorCalled = false;
        
        req.onsuccess = function(e) {
            expect(e.currentTarget.result.successes).toBe(9);
            expect(e.currentTarget.result.errors).toBe(1);
            expect(errorCalled).toBe(true);
            done();
        };
        req.onerror = function(e) {
            errorCalled = true;
            e.preventDefault();
        };
        
        theStore.transaction.onerror = function(e) {
            console.log("ABORTED TRANSACTION");
            e.preventDefault();
        };
    });

});
