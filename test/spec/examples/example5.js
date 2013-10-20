describe("Example 5", function() {
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
            unread : true
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

    async.it("update objects", function(done) {
        var BOOKS = setup.db.transaction([ "store" ], "readwrite").objectStore("store");
        var now = 2013;

        var req = BOOKS.update(function(book) {
            if (book.year < 2009) {
                return undefined; // return undefined to delete the book
            }
            if ((now - book.year) < 1) {
                return null; // don't update this item
            }

            book.unread = false;
            return book; // return the item (or a new item) to update the entry in the database
        }, new Nigiri.Query({
            unread : true
        }), new Nigiri.Options());

        req.onsuccess = function(e) {

            BOOKS.get("isbn:978-1449399023").onsuccess = function(e) {
                expect(e.currentTarget.result.unread).toBe(false);

                BOOKS.get("B00CA5USBY8").onsuccess = function(e) {
                    expect(e.currentTarget.result.unread).toBe(true);
                    done();
                };
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
