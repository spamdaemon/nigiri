describe("The Terminate Option", function() {

    // set up the async spec
    var async = new AsyncSpec(this);
    var setup = new db_setup({
        data : [ {
            key : 0,
            value : [ "a", "b", "c" ]
        }, ],
        index : {
            "value" : {
                unique : false,
                multiEntry : true
            }
        }
    });

    async.beforeEach(setup.setup());
    async.afterEach(setup.teardown());

    async.it("should terminate after 1 call", zone.inject([ "#done", "nigiri.Nigiri" ], function(done, Nigiri) {
        var theStore = setup.db.transaction([ "store" ]).objectStore("store");
        var req = theStore.index("value").openCursor(null, new Nigiri.Options({
            terminate : function(cursor) {
                console.log("TERMINATE :"+cursor.key);
                return cursor.key === "b";
            }
        }));
        var results = {
            'a' : false,
            'b' : false,
            'c' : false
        };

        req.onsuccess = function() {
            if (!req.result) {
                expect(results['a']).toBe(true);
                expect(results['b']).toBe(false);
                expect(results['c']).toBe(false);
                done();
                return;
            }
            expect(req.source.name).toEqual("value");
            results[req.result.key] = true;
            req.result["continue"]();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));

});
