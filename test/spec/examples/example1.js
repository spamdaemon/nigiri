describe("Example 1", function() {
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

    async.it("should enumerate 2 items in reverse order", zone.inject(["#done","nigiri.Nigiri"], function(done,Nigiri) {
        var INTEGERS = setup.db.transaction([ "store" ], "readwrite").objectStore("store");
        var req = INTEGERS.openCursor(IDBKeyRange.bound(0, 10), new Nigiri.Options({
            offset : 3,
            limit : 2,
            direction : "prev",
            filter : function(cursor) {
                return (cursor.key % 2) === 0;
            }
        }));

        var found = [];
        req.onsuccess = function(e) {
            if (e.currentTarget.result) {
                found.push(e.currentTarget.result.key);
                e.currentTarget.result["continue"]();
            } else {
                expect(found[0]).toBe(4);
                expect(found[1]).toBe(2);
                expect(found.length).toBe(2);
                done();
            }
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));


});
