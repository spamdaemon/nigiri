describe("Example 4", function() {
    // set up the async spec
    var async = new AsyncSpec(this);
    var setup = new db_setup({
        data : [ {
            key : "isbn:978-0596517748",
            title : "JavaScript : The Good Parts",
            author : "Crockford",
            year : 2008
        }, {
            key : "B00CA5USBY8",
            title : "Javascript for Beginners",
            author : "Lassoff",
            year : 2013
        }, {
            key : "isbn:978-1449399023",
            title : "JavaScript & jQuery: The Missing Manual",
            author : "McFarland",
            year : 2011
        } ],
        index : {
            "author" : {
                unique : false,
                multiEntry : true
            },
            "year" : {
                unique : false,
                multiEntry : true
            }
        }
    });

    async.beforeEach(setup.setup());
    async.afterEach(setup.teardown());

    async.it("delete objects older than 2010", function(done) {
        var BOOKS = setup.db.transaction([ "store" ], "readwrite").objectStore("store");
        var req = BOOKS["delete"](new Nigiri.Query({
            year : Nigiri.KeyRange.upperBound(2010)
        }));
        req.onsuccess = function(e) {
            expect(req.result.successes).toBe(1);
            req = BOOKS.get({
                author : "Crockford"
            });
            req.onsuccess = function() {
                expect(req.result).toBeUndefined();
                done();
            };
            req.onerror = function() {
                expect(true).toBe(false);
                done();
            };
        };
        req.onerror = function(e) {
            expect(true).toBe(false);
            done();
        };
    });

});
