describe("Example 3", function() {
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

    async.it("count using a complex query", zone.inject(["#done","nigiri.Nigiri"], function(done,Nigiri) {
        var BOOKS = setup.db.transaction([ "store" ]).objectStore("store");
        var req = BOOKS.count(new Nigiri.Query({
            year : Nigiri.KeyRange.upperBound(2011)
        }));
        req.onsuccess = function(e) {
            var count = e.currentTarget.result;
            expect(count).toBe(2);
            done();
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));

});
