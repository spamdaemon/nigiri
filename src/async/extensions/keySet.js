var MyKeySet = (function(TheFactory, TheKeyRange, findByBinarySearch) {
    var compareKeys = TheFactory.cmp;

    var intersectArrays = function(a, b) {
        var res = [];
        var i = 0, j = 0, nA = a.length, nB = b.length, outcome;
        while (i < nA && j < nB) {
            outcome = compareKeys(a[i], b[j]);
            if (outcome === 0) {
                res.push(a[i]);
                ++i;
                ++j;
            } else if (outcome < 0) {
                ++i;
            } else if (outcome > 0) {
                ++j;
            }
        }

        return res;
    };

    var mergeArrays = function(a, b) {
        var ai = 0, bi = 0, outcome, val;
        var res = [];
        while (ai < a.length && bi < b.length) {
            outcome = compareKeys(a[ai], b[bi]);
            if (outcome === 0) {
                val = a[ai];
                ++ai;
                ++bi;
            } else if (outcome < 0) {
                val = a[ai++];
            } else {
                val = b[bi++];
            }
            res.push(val);
        }
        while (ai < a.length) {
            res.push(a[ai++]);
        }
        while (bi < b.length) {
            res.push(b[bi++]);
        }
        return res;
    };

    var TheKeySet = function(keys, verified) {

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
        this.__range = TheKeyRange.bound(keys[0], keys[keys.length - 1]);
    };

    TheKeySet.prototype.indexOf = function(key) {
        return findByBinarySearch(this.__keys, compareKeys, 0, key);
    };

    TheKeySet.prototype.contains = function(v) {
        return this.indexOf(v) !== -1;
    };

    TheKeySet.prototype.intersect = function(ks) {
        var res = intersectArrays(this.__keys, ks.__keys);
        if (res.length === 0) {
            return null;
        }
        return new TheKeySet(res, true);
    };

    TheKeySet.prototype.merge = function(ks) {
        var res = mergeArrays(this.__keys, ks.__keys);
        return new TheKeySet(res, true);
    };
    
    addConstProperty(TheKeySet.prototype, "keys");
    addConstProperty(TheKeySet.prototype, "range");

    return TheKeySet;
})(FACTORY, MyKeyRange, findByBinarySearch);
