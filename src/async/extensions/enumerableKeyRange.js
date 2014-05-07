zone("nigiri").protectedFactory("MyEnumerableKeyRange", [ "Utils", "nigiri.cmp", "MyKeyRange" ], function(Utils, compareKeys, MyKeyRange) {

    var unimplemented = function() {
        throw new Error("Unimplemented operation");
    };

    /**
     * @constructor
     */
    var MyEnumerableKeyRange = function(lo, hi, pred, next) {
        MyKeyRange.call(this, IDBKeyRange.bound(lo, hi, false, false));
        this.__pred = this.__next = unimplemented;
        if (pred) {
            this.__pred = pred;
        }
        if (next) {
            this.__next = next;
        }
        this.__bounded = (hi !== undefined && lo !== undefined);
    };

    MyEnumerableKeyRange.prototype = Object.create(MyKeyRange.prototype);
    MyEnumerableKeyRange.prototype.constructor = MyEnumerableKeyRange;

    Utils.addConstProperty(MyEnumerableKeyRange.prototype, "bounded");

    MyEnumerableKeyRange.prototype.next = function(key) {
        key = this.__next(key);
        if (key===undefined || this.upper !== null && compareKeys(key, this.upper) > 0) {
            return undefined;
        }
        return key;
    };

    MyEnumerableKeyRange.prototype.pred = function(key) {
        key = this.__pred(key);
        if (key===undefined || this.lower !== null && compareKeys(key, this.lower) < 0) {
            return undefined;
        }
        return key;
    };

    MyEnumerableKeyRange.prototype.ceiling = function(key) {
        if (this.contains(key)) {
            return key;
        }
        if (this.lower !== null && compareKeys(key, this.lower) < 0) {
            return this.lower;
        }
        return this.next(key);
    };

    MyEnumerableKeyRange.prototype.floor = function(key) {
        if (this.contains(key)) {
            return key;
        }
        if (this.upper !== null && compareKeys(key, this.upper) > 0) {
            return this.upper;
        }
        return this.pred(key);
    };

    return MyEnumerableKeyRange;
});
