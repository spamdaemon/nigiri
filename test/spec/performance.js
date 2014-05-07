describe("performance test", function() {

    var nItems = 3600;

    // set up the async spec
    var async = new AsyncSpec(this, {
        timeout : 18000
    });
    var setup = new db_setup({
        options : {
            keyPath : "key"
        },
        index : {
            "cos" : {
                unique : false,
                multiEntry : true
            },
            "sin" : {
                unique : false,
                multiEntry : true
            },
            "tan" : {
                unique : false,
                multiEntry : true
            }
        }
    });

    async.beforeEach(setup.setup());
    // async.afterEach(setup.teardown());

    async.it("should populate the database with " + nItems + " items", zone.inject([ "#done", "nigiri.Nigiri" ], function(done, Nigiri) {

        console.log("Executing performance test");

        var QUERY = function() {
            var store = setup.db.transaction([ "store" ], "readonly").objectStore("store");
            var i = 0;
            var queryFN;
            var found = false;
            var delta = 2 * Math.PI / nItems;
            var onSuccess = function(e) {
                if (e.currentTarget.result) {
                    e.currentTarget.result["continue"]();
                    found = true;
                } else {
                    expect(found).toBe(true);
                    ++i;
                    if (i < nItems) {
                        found = false;
                        queryFN();
                    } else {
                        done();
                    }
                }
            };

            queryFN = function() {
                var phi = 2 * Math.PI * Math.random();
                var sin = Math.sin(phi);
                var sin0 = Math.sin(phi - delta);
                var sin1 = Math.sin(phi + delta);
                var x = 0;
                if (sin0 > sin1) {
                    x = sin0;
                    sin0 = sin1;
                    sin1 = x;
                }
                var cos0 = Math.sqrt(Math.max(0, 1 - sin * sin - delta / 2));
                var cos1 = Math.sqrt(Math.max(0, 1 - sin * sin + delta / 2));
                if (cos0 > cos1) {
                    x = cos0;
                    cos0 = cos1;
                    cos1 = x;
                }
                var query = {
                    sin : Nigiri.KeyRange.bound(sin0, sin1),
                    cos : Nigiri.KeyRange.bound(cos0, cos1)
                };

                var req = store.openCursor(query);
                req.onsuccess = onSuccess;
            };
            queryFN();
        };

        var INSERT = function() {
            var store = setup.db.transaction([ "store" ], "readwrite").objectStore("store");
            var delta = 2 * Math.PI / nItems;
            var phi = 0;
            var putFN;

            store.transaction.oncomplete = QUERY;

            var onSuccess = function() {
                phi += delta;
                if (phi < 2 * Math.PI) {
                    putFN();
                }
            };

            putFN = function() {
                var req = store.put({
                    key : phi,
                    cos : Math.cos(phi),
                    sin : Math.sin(phi),
                    tan : Math.tan(phi)
                });
                req.onsuccess = onSuccess;
            };

            putFN();
        };

        INSERT();

    }));

});
