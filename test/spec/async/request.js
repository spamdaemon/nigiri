describe("request tests", function() {
    // set up the async spec
    var async = new AsyncSpec(this);
    var setup = new db_setup({
        data : [ {
            key : 1,
            value : "foo"
        }, {
            key : 2,
            value : "bar"
        }, {
            key : 3,
            value : "baz"
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

    async.it("should be a valid index request", function(done) {
        var theIndex = setup.db.transaction([ "store" ], "readwrite").objectStore("store").index("value");
        var req = theIndex.openCursor("bar");
        expect(req.source.name).toEqual("value");
        expect(req.transaction.mode).toEqual("readwrite");
        expect(req.readyState).toEqual("pending");

        req.onsuccess = function(e) {
            expect(req.result).not.toBeNull();
            req.transaction.abort();
        };

        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
        req.transaction.onabort = function() {
            expect(req.readyState).toEqual("done");
            done();
        };
    });

    async.it("should be a valid objectstore request", function(done) {
        var theStore = setup.db.transaction([ "store" ], "readwrite").objectStore("store");
        var req = theStore.openCursor(2);
        expect(req.source.name).toEqual("store");
        expect(req.transaction.mode).toEqual("readwrite");
        expect(req.readyState).toEqual("pending");

        req.onsuccess = function(e) {
            expect(req.result).not.toBeNull();
            req.transaction.abort();
        };

        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
        req.transaction.onabort = function() {
            expect(req.readyState).toEqual("done");
            done();
        };
    });

    async.it("should be a valid cursor request", function(done) {
        var theStore = setup.db.transaction([ "store" ], "readwrite").objectStore("store");
        var xreq = theStore.openCursor(2);
        xreq.onsuccess = function() {
            var req = xreq.result["delete"]();
            expect(req.source.direction).toEqual("next");
            expect(req.transaction.mode).toEqual("readwrite");
            expect(req.readyState).toEqual("pending");

            req.onsuccess = function(e) {
                expect(req.result).not.toBeNull();
                req.transaction.abort();
            };

            req.onerror = function() {
                expect(true).toBe(false);
                done();
            };
        };
        xreq.onerror = function() {
            expect(true).toBe(false);
            done();
        };
        xreq.transaction.onabort = function() {
            expect(xreq.readyState).toEqual("done");
            done();
        };
    });
});
