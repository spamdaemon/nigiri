var MyKeyRange = (function() {

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
    addConstAttribute(MyKeyRange.prototype, "lower");
    addConstAttribute(MyKeyRange.prototype, "upper");
    addConstAttribute(MyKeyRange.prototype, "lowerOpen");
    addConstAttribute(MyKeyRange.prototype, "upperOpen");

    return MyKeyRange;
})();
