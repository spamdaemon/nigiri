(function(window) {

    var dbFind = function(db) {
        var tx = db.transaction("books", "readonly");
        var store = tx.objectStore("books");
        var index = store.index("by_author");

        // var request = index.openCursor(IDBKeyRange.only("Fred"));
        var request = index.openCursor(null);
        request.onsuccess = function() {
            var cursor = request.result;
            if (cursor) {
                // Called for each matching record.
                console.log("dbFind: Found " + cursor.value.isbn + ", " + cursor.value.title + ", " + cursor.value.author);
                cursor["continue"]();
            } else {
                // No more matching records.
                console.log("dbFind: Nothing found");
            }
        };
    };

    var dbGet = function(db) {
        var tx = db.transaction("books", "readonly");
        var store = tx.objectStore("books");
        var index = store.index("by_title");

        var readRequest = index.get("Bedrock Nights");
        readRequest.onsuccess = function() {
            var matching = readRequest.result;
            if (matching !== undefined) {
                // A match was found.
                console.log("dbGet: Found " + matching.isbn + ", " + matching.title + ", " + matching.author);
            } else {
                // No match was found.
                console.log("dbGet: Nothing found");
            }
        };
        tx.oncomplete = function(e) {
            console.log("Transaction complete");
        };

    };

    req = window.Nigiri.IndexedDB.deleteDatabase("testdb");
    req.onsuccess = function() {
        console.log("Database deleted");
        var req = window.Nigiri.IndexedDB.open("testdb", 1);

        req.onupgradeneeded = function(e) {
            var newVersion = e.newVersion;
            var db = e.target.result;
            console.log("Upgrade needed callback");
            try {
                db.deleteObjectStore("books");
            } catch (ex) {

            }
            var store = db.createObjectStore("books", {
                keyPath : "isbn"
            });

            store.createIndex("by_title", "title", {
                unique : true
            });
            store.createIndex("by_author", "author");

            // Populate with initial data.
            store.putAll([ {
                title : "Quarry Memories",
                author : "Fred",
                isbn : 123456
            }, {
                title : "Water Buffaloes",
                author : "Fred",
                isbn : 234567
            }, {
                title : "Bedrock Nights",
                author : "Barney",
                isbn : 345678
            } ]).onsuccess = function(e) {
                console.log("Updated or added " + e.currentTarget.result.successes + " objects");
            };
        };
        req.onsuccess = function(e) {
            var db = e.target.result;
            console.log("Database opened");
            dbGet(db);
            dbFind(db);
        };

        req.onerror = function(e) {
            console.log("Failed to open the database");
        };
        req.onblocked = function(e) {
            console.log("Database access blocked");
        };
    };
})(window);