describe("ObjectStore", function() {
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

    async.it("should open a cursor", function(done) {
        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var req = theStore.openCursor(new Nigiri.KeySet([ 4, 5, 6.5, 9, 10 ]));
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
    });

    async.it("should count all entries within a key range", function(done) {

        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var req = theStore.count(new Nigiri.KeySet([ 4, 5, 6.5, 9, 10 ]));
        req.onsuccess = function(e) {
            expect(e.currentTarget.result).toBe(4);
            expect(req).toBe(e.currentTarget);
            done();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("get the first value in a sequence", function(done) {

        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var req = theStore.get(new Nigiri.KeySet([ 4.5, 5.5, 6.5, 9, 10 ]));
        req.onsuccess = function(e) {
            expect(e.currentTarget.result.value).toEqual('w');
            expect(req.result.value).toEqual(e.currentTarget.result.value);
            done();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should return undefined for a value that doesn't exist", function(done) {

        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var req = theStore.get(new Nigiri.KeySet([ 4.5, 7.5 ]));
        req.onsuccess = function(e) {
            expect(e.currentTarget.result).toBeUndefined();
            done();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    });

    async.it("should delete a range of values", function(done) {

        var theStore = setup.db.transaction([ "store" ], "readwrite").objectStore("store");
        var req = theStore["delete"](new Nigiri.KeySet([ 4, 5, 6.5, 9, 10 ]));
        req.onsuccess = function(e) {
            var remaining = [];
            req = theStore.openCursor();
            req.onsuccess = function(e) {
                if (e.currentTarget.result) {
                    remaining.push(e.currentTarget.result.key);
                    e.currentTarget.result["continue"]();
                } else {
                    expect(remaining[0]).toBe(0);
                    expect(remaining[1]).toBe(1);
                    expect(remaining[2]).toBe(2);
                    expect(remaining[3]).toBe(3);
                    expect(remaining[4]).toBe(6);
                    expect(remaining[5]).toBe(7);
                    expect(remaining[6]).toBe(8);
                    done();
                }
            };
            req.onerror = function() {
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
