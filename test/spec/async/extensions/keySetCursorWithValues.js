describe("KeySetCursorWithValues", function() {

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

    async.it("should iterate over a given key (forward)",zone.inject(["#done","nigiri.Nigiri"], function(done,Nigiri) {
        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var req = theStore.openCursor(new Nigiri.KeySet([ 2, 4, 6, 12 ]));
        var results = [];
        while (results.length < 11) {
            results.push(false);
        }

        req.onsuccess = function() {
            if (!req.result) {
                expect(results[0]).toBe(false);
                expect(results[1]).toBe(false);
                expect(results[2]).toBe(true);
                expect(results[3]).toBe(false);
                expect(results[4]).toBe(true);
                expect(results[5]).toBe(false);
                expect(results[6]).toBe(true);
                expect(results[7]).toBe(false);
                expect(results[8]).toBe(false);
                expect(results[9]).toBe(false);
                expect(results[10]).toBe(false);
                done();
                return;
            }
            expect(req.source.name).toEqual("store");
            results[req.result.primaryKey] = true;
            req.result["continue"]();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));

    async.it("should iterate in the reverse order", zone.inject(["#done","nigiri.Nigiri"], function(done,Nigiri) {
        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var req = theStore.openCursor(new Nigiri.KeySet([ 2, 4, 6, 12 ]), "prev");
        var results = [];

        req.onsuccess = function() {
            if (!req.result) {
                expect(results[0]).toEqual(6);
                expect(results[1]).toEqual(4);
                expect(results[2]).toEqual(2);
                expect(results.length).toBe(3);
                done();
                return;
            }
            expect(req.source.name).toEqual("store");
            results.push(req.result.key);
            req.result["continue"]();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));

    async.it("should skip over keys with advance", zone.inject(["#done","nigiri.Nigiri"], function(done,Nigiri) {
        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var req = theStore.openCursor(new Nigiri.KeySet([ 4, 5, 6, 7 ]));
        var results = [];

        req.onsuccess = function() {
            if (!req.result) {
                expect(results[0]).toEqual(4);
                expect(results[1]).toEqual(7);
                expect(results.length).toBe(2);
                done();
                return;
            }
            expect(req.source.name).toEqual("store");
            results.push(req.result.key);
            req.result.advance(3);
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));
});
