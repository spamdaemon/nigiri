zone("nigiri").exportService("Nigiri", [ "FACTORY", "MyKeyRange" ], function(IDB, KeyRange) {

    this.IndexedDB = IDB;
    this.KeyRange = KeyRange;
});
