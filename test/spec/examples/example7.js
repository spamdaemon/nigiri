describe("Example 7", function() {
    // set up the async spec
    var async = new AsyncSpec(this);
    var setup = new db_setup({
        data : [ {
            key : "isbn:978-0596517748",
            title : "JavaScript : The Good Parts",
            author : "Crockford",
            year : 2008,
            unread : true
        }, {
            key : "B00CA5USBY8",
            title : "Javascript for Beginners",
            author : "Lassoff",
            year : 2013,
            unread : false
        }, {
            key : "isbn:978-1449399023",
            title : "JavaScript & jQuery: The Missing Manual",
            author : "McFarland",
            year : 2011,
            unread : true
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

    async.it("get objects", function(done) {
        var BOOKS = setup.db.transaction([ "store" ]).objectStore("store");

        var req = BOOKS.getAll(new Nigiri.Query({
            year : IDBKeyRange.upperBound(2012)
        }), new Nigiri.Options({
            direction : "prev"
        }));

        req.onsuccess = function(e) {
            expect(req.result.length).toBe(2);
            expect(req.result[0].title).toEqual("JavaScript & jQuery: The Missing Manual");
            expect(req.result[1].title).toEqual("JavaScript : The Good Parts");
            done();
        };
    });

});
