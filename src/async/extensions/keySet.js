var MyKeySet = (function(MyFactory, MyKeyRange, findByBinarySearch) {
    var compareKeys = MyFactory.cmp;

    var MyKeySet = function(keys, verified) {

        if (!verified) {
            if (keys.length === 0) {
                throw new Error("Keyset is empty");
            }
            for (var i = 1; i < keys.length; ++i) {
                if (compareKeys(keys[i - 1], keys[i]) >= 0) {
                    throw new Error("Keyset is not sorted");
                }
            }
        }

        this.__keys = Object.freeze(keys.slice(0));
        this.__range = MyKeyRange.bound(keys[0], keys[keys.length - 1]);
    };

    MyKeySet.prototype.indexOf = function(key) {
        return findByBinarySearch(this.__keys,compareKeys,0,key);
    };

    MyKeySet.prototype.contains = function(v) {
        return this.indexOf(v) !== -1;
    };

    addConstProperty(MyKeySet.prototype, "keys");
    addConstProperty(MyKeySet.prototype, "range");

    return MyKeySet;
})(FACTORY, MyKeyRange, findByBinarySearch);
