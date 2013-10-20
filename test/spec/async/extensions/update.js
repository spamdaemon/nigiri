describe("Index", function() {
    // set up the async spec
    var async = new AsyncSpec(this);
    var setup = new db_setup({
        data : [ {
            key : 0,
            value : "a"
        }, {
            key : 1,
            value : "b"
        }, {
            key : 2,
            value : "c"
        }, {
            key : 3,
            value : "d"
        }, {
            key : 4,
            value : "e"
        }, {
            key : 5,
            value : "f"
        }, {
            key : 6,
            value : "g"
        }, {
            key : 7,
            value : "h"
        }, {
            key : 8,
            value : "i"
        }, {
            key : 9,
            value : "j"
        }, {
            key : 10,
            value : "k"
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

    async.it("should update and delete objects", function(done) {

        var theStore = setup.db.transaction([ "store" ], "readwrite").objectStore("store");
        var theIndex = theStore.index("value");
        var req = theIndex.update(function(v) {
            if (v.value == "j") {
                return null;
            }
            if ((v.key % 2) === 0) {
                // delete this key
                return undefined;
            } else {
                v.value = v.value.toUpperCase();
                return v;
            }
        });

        req.onsuccess = function(e) {
            req = theStore.getAll();
            req.onsuccess = function(e) {
                expect(req.result[0].value).toEqual('B');
                expect(req.result[1].value).toEqual('D');
                expect(req.result[2].value).toEqual('F');
                expect(req.result[3].value).toEqual('H');
                expect(req.result[4].value).toEqual('j');
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

});
