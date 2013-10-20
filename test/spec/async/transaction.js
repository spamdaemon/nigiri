describe("transaction", function() {
    // set up the async spec
    var async = new AsyncSpec(this);
    var setup = new db_setup({
        name : "transactiontest",

        data : [ {
            key : 1,
            value : "foo"
        } ]
    });

    async.beforeEach(setup.setup());
    async.afterEach(setup.teardown());

    it("should have a database attribute", function() {
        var tx = setup.db.transaction([ "store" ], "readwrite");
        expect(tx.db.name).toEqual("transactiontest");
    });

    it("should be a readwrite transaction", function() {
        var tx = setup.db.transaction([ "store" ], "readwrite");
        expect(tx.mode).toEqual("readwrite");
    });

    async.it("should return null if the transaction completes", function(done) {
        var tx = setup.db.transaction([ "store" ], "readwrite");
        tx.oncomplete = function() {
            expect(tx.error).toBeNull();
            done();
        };
    });

    async.it("should return null if the transaction aborts", function(done) {
        var tx = setup.db.transaction([ "store" ], "readwrite");
        tx.onabort = function() {
            expect(tx.error).toBeNull();
            done();
        };
        tx.abort();
    });

    async.it("should return null if the transaction fails", function(done) {
        var tx = setup.db.transaction([ "store" ], "readwrite");
        var theStore = tx.objectStore("store");
        var req = theStore.add({
            key : 1,
            value : "duplicate"
        });
        tx.onerror = function(e) {
            e.preventDefault();
            expect(tx).toBe(e.currentTarget);
            expect(req).toBe(e.target);
            done();
        };
    });

});
