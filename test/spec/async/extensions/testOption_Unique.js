describe("The Unique Option", function() {

    // set up the async spec
    var async = new AsyncSpec(this);
    var setup = new db_setup({
        data : [ {
            key : 0,
            value : [ "a", "b", "c" ]
        }, {
            key : 'a',
            value : [ 'z' ]
        }, {
            key : 'z',
            value : [ 'z' ]
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

    async.it("should enumerate the same key three times", zone.inject([ "#done", "nigiri.Nigiri" ], function(done, Nigiri) {
        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var req = theStore.index("value").openCursor(null, new Nigiri.Options({
            unique : false
        }));
        var results = {};

        req.onsuccess = function() {
            if (!req.result) {
                expect(results[0]).toBe(3);
                done();
                return;
            }
            expect(req.source.name).toEqual("value");
            results[req.result.primaryKey] = 1 + (results[req.result.primaryKey] || 0);
            req.result["continue"]();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));

    async.it("should find 2 items", zone.inject([ "#done", "nigiri.Nigiri" ], function(done, Nigiri) {
        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var req = theStore.index("value").openCursor(null, new Nigiri.Options({
            unique : true
        }));
        var results = {};

        req.onsuccess = function() {
            if (!req.result) {
                expect(results['a']).toBe(1);
                expect(results['z']).toBe(1);
                done();
                return;
            }
            expect(req.source.name).toEqual("value");
            results[req.result.primaryKey] = 1 + (results[req.result.primaryKey] || 0);
            req.result["continue"]();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));

});
