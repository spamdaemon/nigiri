zone("nigiri").protectedFactory("MyKeyRange", [ "Utils" ], function(Utils) {

    var MyKeyRange = function(idbKeyRange) {
        this.__impl = idbKeyRange;
    };

    MyKeyRange.bound = function(lower, upper, lowerOpen, upperOpen) {
        var impl = IDBKeyRange.bound(lower, upper, lowerOpen, upperOpen);
        return new MyKeyRange(impl);
    };

    MyKeyRange.only = function(value) {
        var impl = IDBKeyRange.only(value);
        return new MyKeyRange(impl);
    };

    MyKeyRange.lowerBound = function(bound, open) {
        var impl = IDBKeyRange.lowerBound(bound, open);
        return new MyKeyRange(impl);
    };

    MyKeyRange.upperBound = function(bound, open) {
        var impl = IDBKeyRange.upperBound(bound, open);
        return new MyKeyRange(impl);
    };

    // attributes
    Utils.addConstAttribute(MyKeyRange.prototype, "lower");
    Utils.addConstAttribute(MyKeyRange.prototype, "upper");
    Utils.addConstAttribute(MyKeyRange.prototype, "lowerOpen");
    Utils.addConstAttribute(MyKeyRange.prototype, "upperOpen");

    return MyKeyRange;
});
