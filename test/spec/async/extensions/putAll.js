describe("putAllS", function() {
    // set up the async spec
    var async = new AsyncSpec(this);
    var setup = new db_setup({
        data : [ {
            key : 0,
            value : "@"
        }, {
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

    async.it("should update multiple new elements", function(done) {
        var theStore = setup.db.transaction([ "store" ], "readwrite").objectStore("store");

        var req = theStore.putAll([ {
            key : 1,
            value : "A"
        }, {
            key : 2,
            value : "B"
        }, {
            key : 3,
            value : "C"
        }, {
            key : 4,
            value : "D"
        }, {
            key : 5,
            value : "E"
        }, {
            key : 6,
            value : "F"
        }, {
            key : 7,
            value : "G"
        }, {
            key : 8,
            value : "H"
        }, {
            key : 9,
            value : "J"
        }, {
            key : 10,
            value : "K"
        } ]);

        req.onsuccess = function(e) {
            req = theStore.index("value").count(IDBKeyRange.bound('A', 'Z'));
            req.onsuccess = function(e) {
                expect(e.currentTarget.result).toBe(10);
                done();
            };
            req.onerror = function(e) {
                expect(true).toBe(false);
                done();
            };
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should fail to update due to missing key", function(done) {
        var theStore = setup.db.transaction([ "store" ], "readwrite").objectStore("store");

        var req;
        var errorCalled = false;

        try {
            req = theStore.putAll([ {
                key : 1,
                value : "A"
            }, {
                key : 2,
                value : "B"
            }, {
                key : 3,
                value : "C"
            }, {
                key : 4,
                value : "D"
            }, {
                key : 5,
                value : "E"
            }, {
                value : "F"
            }, {
                key : 7,
                value : "G"
            }, {
                key : 8,
                value : "H"
            }, {
                key : 9,
                value : "J"
            }, {
                key : 10,
                value : "K"
            } ]);
        } catch (partialRequest) {
            errorCalled = true;
            req = partialRequest;
        }
        req.onsuccess = function(e) {
            expect(e.currentTarget.result.errors).toBe(1);
            expect(e.currentTarget.result.successes).toBe(5);
            expect(errorCalled).toBe(true);
            done();
        };
        req.onerror = function(e) {
            expect(false).toBe(true);
            done();
        };

    });

});
