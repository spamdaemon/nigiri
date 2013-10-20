describe("KeySetCursor", function() {

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

    async.it("should iterate over a given key (forward)", function(done) {
      var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.openKeyCursor(new Nigiri.KeySet([ "b", "c", "d", "h" ]));
        var results = [];
        while (results.length < 11) {
            results.push(false);
        }

        req.onsuccess = function() {
            if (!req.result) {
                expect(results[0]).toBe(false);
                expect(results[1]).toBe(false);
                expect(results[2]).toBe(true);
                expect(results[3]).toBe(true);
                expect(results[4]).toBe(true);
                expect(results[5]).toBe(true);
                expect(results[6]).toBe(true);
                expect(results[7]).toBe(false);
                expect(results[8]).toBe(false);
                expect(results[9]).toBe(false);
                expect(results[10]).toBe(false);
                done();
                return;
            }
            expect(req.source.name).toEqual("value");
            results[req.result.primaryKey] = true;
           // console.log("Setting result " + req.result.primaryKey);
            req.result["continue"]();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should iterate in the reverse order", function(done) {
     var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.openKeyCursor(new Nigiri.KeySet([ "b", "c", "d", "h" ]), "prev");
        var results = [];

        req.onsuccess = function() {
            if (!req.result) {
                expect(results[0]).toEqual('d');
                expect(results[1]).toEqual('d');
                expect(results[2]).toEqual('c');
                expect(results[3]).toEqual('b');
                expect(results[4]).toEqual('b');
                expect(results.length === 5);
                done();
                return;
            }
           // console.log("Key : "+req.result.key);
            expect(req.source.name).toEqual("value");
            results.push(req.result.key);
            req.result["continue"]();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should iterate in the reverse order and ignore duplicates", function(done) {
    var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.openKeyCursor(new Nigiri.KeySet([ "b", "c", "d", "h" ]), "prevunique");
        var results = [];

        req.onsuccess = function() {
            if (!req.result) {
                expect(results[0]).toEqual('d');
                expect(results[1]).toEqual('c');
                expect(results[2]).toEqual('b');
                expect(results.length === 3);
                done();
                return;
            }
            expect(req.source.name).toEqual("value");
            results.push(req.result.key);
            req.result["continue"]();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should skip over keys with advance", function(done) {
      var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.openKeyCursor(new Nigiri.KeySet([ "c", "d", "e" ]));
        var results = [];

        req.onsuccess = function() {
            if (!req.result) {
                expect(results[0]).toEqual('c');
                expect(results[1]).toEqual('e');
                expect(results.length === 2);
                done();
                return;
            }
            expect(req.source.name).toEqual("value");
            results.push(req.result.key);
            req.result.advance(3);
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should skip over keys with advance", function(done) {
        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.openKeyCursor(new Nigiri.KeySet([ "b", "d", "e", "f" ]), "nextunique");
        var results = [];

        req.onsuccess = function() {
            if (!req.result) {
                expect(results[0]).toEqual('b');
                expect(results[1]).toEqual('f');
                expect(results.length === 2);
                done();
                return;
            }
            expect(req.source.name).toEqual("value");
            results.push(req.result.key);
            req.result.advance(3);
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

});
