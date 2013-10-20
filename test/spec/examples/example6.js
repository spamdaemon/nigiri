describe("Example 6", function() {
    // set up the async spec
    var async = new AsyncSpec(this);
    var setup = new db_setup({
        data : [],
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

    async.it("add multiple objects", function(done) {
        var BOOKS = setup.db.transaction([ "store" ], "readwrite").objectStore("store");

        var req = BOOKS.addAll([ {
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
            unread : true
        }, {
            key : "isbn:978-1449399023",
            title : "JavaScript & jQuery: The Missing Manual",
            author : "McFarland",
            year : 2011,
            unread : true
        } ]);

        req.onsuccess = function() {

            req = BOOKS.count();
            req.onsuccess = function() {
                expect(req.result).toBe(3);
                done();
            };
        };
        req.onerror = function(e) {
            // choose to prevent or continue the operation (if possible)
            e.preventDefault();
            expect(true).toBe(false);
            done();
       };

    });

});
