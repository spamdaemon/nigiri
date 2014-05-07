describe("getAllKeys", function() {
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

    async.it("get all keys in the index", zone.inject(["#done","nigiri.Nigiri"], function(done,Nigiri) {

        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var theIndex = theStore.index("value");
        var req = theIndex.getAllKeys(new Nigiri.KeySet([ "a", "c", "e", "g", "i", "k" ]));

        req.onsuccess = function(e) {
            expect(req.result[0]).toEqual('a');
            expect(req.result[1]).toEqual('c');
            expect(req.result[2]).toEqual('e');
            expect(req.result[3]).toEqual('g');
            expect(req.result[4]).toEqual('i');
            expect(req.result[5]).toEqual('k');
            done();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));

    async.it("get all keys in an object store", zone.inject(["#done","nigiri.Nigiri"], function(done,Nigiri) {

        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var req = theStore.getAllKeys(new Nigiri.KeySet([ 0, 2, 4, 6, 8, 10 ]));

        req.onsuccess = function(e) {
            expect(req.result[0]).toEqual(0);
            expect(req.result[1]).toEqual(2);
            expect(req.result[2]).toEqual(4);
            expect(req.result[3]).toEqual(6);
            expect(req.result[4]).toEqual(8);
            expect(req.result[5]).toEqual(10);
            done();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));

});
