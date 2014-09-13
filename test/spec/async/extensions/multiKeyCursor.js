describe("MultiKey Cursor", function() {

    // set up the async spec
    var async = new AsyncSpec(this);
    var setup = new db_setup({
        data : [ {
            key : 0,
            value : [ "a", 0 ]
        }, {
            key : 1,
            value : [ "a", 0 ]
        }, {
            key : 2,
            value : [ "b", 2 ]
        }, {
            key : 3,
            value : [ "b", 2 ]
        }, {
            key : 4,
            value : [ "c", 4 ]
        }, {
            key : 5,
            value : [ "d", 5 ]
        }, {
            key : 6,
            value : [ "d", 5 ]
        }, {
            key : 7,
            value : [ "e", 7 ]
        }, {
            key : 8,
            value : [ "f", 8 ]
        }, {
            key : 9,
            value : [ "w", 9 ]
        }, {
            key : 10,
            value : [ "z", 10 ]
        } ],
        index : {
            "value" : {
                unique : false,
                multiEntry : false
            }
        }
    });

    async.beforeEach(setup.setup());
    async.afterEach(setup.teardown());

    async.it("should iterate over a given key (forward)", zone.inject([ "#done", "nigiri.Nigiri" ], function(done, Nigiri) {
        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.openKeyCursor(new Nigiri.MultiKey([ new Nigiri.KeySet([ "b", "c", "d", "h" ]),
                new Nigiri.KeySet([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ]) ]));
        var results = [];
        while (results.length < 11) {
            results.push(false);
        }

        req.onsuccess = function() {
            expect(results.length < 20).toBe(true);
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
    }));

    async.it("should iterate  and ignore duplicates", zone.inject([ "#done", "nigiri.Nigiri" ], function(done, Nigiri) {
        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.openKeyCursor(new Nigiri.MultiKey([ new Nigiri.KeySet([ "b", "c", "d", "h" ]),
                new Nigiri.KeySet([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ]) ]), "nextunique");
        var results = [];

        req.onsuccess = function() {
            expect(results.length < 20).toBe(true);
            if (!req.result) {
                expect(results[0]).toEqual([ 'b', 2 ]);
                expect(results[1]).toEqual([ 'c', 4 ]);
                expect(results[2]).toEqual([ 'd', 5 ]);
                expect(results.length).toBe(3);
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
    }));

    async.it("should iterate in the reverse order", zone.inject([ "#done", "nigiri.Nigiri" ], function(done, Nigiri) {
        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.openKeyCursor(new Nigiri.MultiKey([ new Nigiri.KeySet([ "b", "c", "d", "h" ]),
                new Nigiri.KeySet([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ]) ]), "prev");
        var results = [];

        req.onsuccess = function() {
            expect(results.length < 20).toBe(true);
            if (!req.result) {
                expect(results[0]).toEqual([ 'd', 5 ]);
                expect(results[1]).toEqual([ 'd', 5 ]);
                expect(results[2]).toEqual([ 'c', 4 ]);
                expect(results[3]).toEqual([ 'b', 2 ]);
                expect(results[4]).toEqual([ 'b', 2 ]);
                expect(results.length).toBe(5);
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
    }));

    async.it("should iterate in the reverse order and ignore duplicates", zone.inject([ "#done", "nigiri.Nigiri" ], function(done, Nigiri) {
        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");

        if (navigator.userAgent.indexOf('Chrome/') >= 0) {
            expect("This test does not work on chrome").toBe("https://code.google.com/p/chromium/issues/detail?id=372103");
            done();
            return;
        }

        var req = theIndex.openKeyCursor(new Nigiri.MultiKey([ new Nigiri.KeySet([ "b", "c", "d", "h" ]),
                new Nigiri.KeySet([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ]) ]), "prevunique");

        var results = [];

        req.onsuccess = function() {
            expect(results.length < 20).toBe(true);
            if (!req.result) {
                expect(results[0]).toEqual([ 'd', 5 ]);
                expect(results[1]).toEqual([ 'c', 4 ]);
                expect(results[2]).toEqual([ 'b', 2 ]);
                expect(results.length).toBe(3);
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
    }));

    async.it("should skip over keys with advance", zone.inject([ "#done", "nigiri.Nigiri" ], function(done, Nigiri) {
        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.openKeyCursor(new Nigiri.MultiKey([ new Nigiri.KeySet([ "c", "d", "e" ]),
                new Nigiri.KeySet([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ]) ]));
        var results = [];

        req.onsuccess = function() {
            expect(results.length < 20).toBe(true);
            if (!req.result) {
                expect(results[0]).toEqual([ 'c', 4 ]);
                expect(results[1]).toEqual([ 'e', 7 ]);
                expect(results.length).toBe(2);
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
    }));

    async.it("should skip over keys with advance and nextunique", zone.inject([ "#done", "nigiri.Nigiri" ], function(done, Nigiri) {
        var theIndex = setup.db.transaction([ "store" ]).objectStore("store").index("value");
        var req = theIndex.openKeyCursor(new Nigiri.MultiKey([ new Nigiri.KeySet([ "b", "d", "e", "f" ]),
                new Nigiri.KeySet([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ]) ]), "nextunique");
        var results = [];

        req.onsuccess = function() {
            expect(results.length < 20).toBe(true);
            if (!req.result) {
                expect(results[0]).toEqual([ 'b', 2 ]);
                expect(results[1]).toEqual([ 'f', 8 ]);
                expect(results.length).toBe(2);
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
    }));

});
