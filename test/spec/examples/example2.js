describe("Example 2", function() {
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

    async.it("should execute a query over multiple indexes", zone.inject(["#done","nigiri.Nigiri"], function(done,Nigiri) {
        var BOOKS = setup.db.transaction([ "store" ]).objectStore("store");
        var req = BOOKS.openCursor(new Nigiri.Query({
            author : new Nigiri.KeySet([ "Crockford", "McFarland" ]),
            year : Nigiri.KeyRange.bound(2010, 2013),
        }), new Nigiri.Options());

        var books = [];
        req.onsuccess = function(e) {
            if (e.currentTarget.result) {
                books.push(e.currentTarget.result.value);
                e.currentTarget.result["continue"]();
            } else {
                expect(books.length).toBe(1);
                expect(books[0].title).toEqual("JavaScript & jQuery: The Missing Manual");
                done();
            }
        };
        req.onerror = function() {
            expect(true).toBe(false);
            done();
        };
    }));

});
