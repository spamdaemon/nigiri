zone("nigiri.extension").factory("-MyMultiKey", [ "nigiri.cmp", "MyEnumerableKeyRange", "Utils" ], function(compareKeys, MyEnumerableKeyRange, Utils) {
    "use strict"

    var TheMultiKey = function(keys, verified) {

        var i = 0, n = keys.length;
        var lo = [];
        var hi = [];
        var key;
        if (n===0) {
            throw new Error("Empty MultiKey");
        }
        for (; i < n; ++i) {
            if (!(keys[i] instanceof MyEnumerableKeyRange)) {
                throw new Error("Not an emumerable key range " + keys[i]);
            }
            key = keys[i];
            if (i > 0 && !key.bounded) {
                throw new Error("Key " + i + " is not bounded");
            }
            lo.push(key.lower);
            hi.push(key.upper);
        }

        this.__keys = Object.freeze(keys.slice(0));

        MyEnumerableKeyRange.call(this, lo, hi);
    };

    TheMultiKey.prototype = Object.create(MyEnumerableKeyRange.prototype);
    TheMultiKey.prototype.constructor = TheMultiKey;

    TheMultiKey.prototype.next = function(keys) {
        var i, key, nextKey;
        var result = null;
        keys = keys.slice();

        for (i = this.__keys.length; --i > 0;) {
            key = this.__keys[i];
            nextKey = key.next(keys[i]);
            if (nextKey !== undefined) {
                keys[i] = nextKey;
                if (this.contains(keys)) {
                    result = keys;
                    break;
                }
            }
            keys[i] = key.lower;
        }
        if (result === null) {
            keys[0] = this.__keys[0].next(keys[0]);
            if (keys[0] !== undefined) {
                result = keys;
            }
        }
        if (result === null || !this.contains(result)) {
            return undefined;
        }
        return result;
    };

    TheMultiKey.prototype.pred = function(keys) {
        var i, key, nextKey;
        var result = null;
        keys = keys.slice();

        for (i = this.__keys.length; --i > 0;) {
            key = this.__keys[i];
            nextKey = key.pred(keys[i]);
            if (nextKey !== undefined) {
                keys[i] = nextKey;
                if (this.contains(keys)) {
                    result = keys;
                    break;
                }
            }
            keys[i] = key.upper;
        }
        if (result === null) {
            keys[0] = this.__keys[0].pred(keys[0]);
            if (keys[0] !== undefined) {
                result = keys;
            }
        }
        if (result === null || !this.contains(result)) {
            return undefined;
        }
        return result;
    };

    TheMultiKey.prototype.contains = function(v) {
        var i, n;
        for (i = 0, n = this.__keys.length; i < n; ++i) {
            if (!this.__keys[i].contains(v[i])) {
                return false;
            }
        }
        return true;
    };

    return TheMultiKey;
});
