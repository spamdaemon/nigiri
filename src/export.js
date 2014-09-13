zone("nigiri").service("Nigiri", [ "FACTORY", "MyKeyRange" ], function(IDB, KeyRange) {
    "use strict"

    this.IndexedDB = IDB;
    this.KeyRange = KeyRange;
});
