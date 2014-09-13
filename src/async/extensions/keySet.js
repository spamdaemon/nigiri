zone("nigiri.extension").factory("-MyKeySet", [ "nigiri.cmp", "MyKeyRange", "MyEnumerableKeyRange", "Utils" ],
        function(compareKeys, TheKeyRange, MyEnumerableKeyRange, Utils) {
            "use strict"

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
                var n = keys.length;
                if (n === 0) {
                    throw new Error("Empty KeySet");
                }
                keys = keys.slice();
                if (!verified) {
                    for (var i = 1; i < n; ++i) {
                        if (compareKeys(keys[i - 1], keys[i]) >= 0) {
                            throw new Error("Keyset is not sorted");
                        }
                    }
                }

                this.__keys = Object.freeze(keys);
                this.__range = TheKeyRange.bound(keys[0], keys[n - 1]);
                MyEnumerableKeyRange.call(this, keys[0], keys[n - 1]);
            };

            TheKeySet.prototype = Object.create(MyEnumerableKeyRange.prototype);
            TheKeySet.prototype.constructor = TheKeySet;

            TheKeySet.prototype.next = function(key) {
                var i = Utils.binarySearch(this.__keys, compareKeys, 0, key);
                if (i < this.__keys.length) {
                    if (compareKeys(this.__keys[i], key) !== 0) {
                        return this.__keys[i];
                    }
                    ++i;
                }
                if (i === this.__keys.length) {
                    return undefined;
                }
                return this.__keys[i];
            };

            TheKeySet.prototype.pred = function(key) {
                var i = Utils.binarySearch(this.__keys, compareKeys, 0, key);
                if (i === this.__keys.length) {
                    return undefined;
                }
                --i;
                if (i < 0) {
                    return undefined;
                }
                return this.__keys[i];
            };

            TheKeySet.prototype.indexOf = function(key) {
                return Utils.findByBinarySearch(this.__keys, compareKeys, 0, key);
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

            Utils.addConstProperty(TheKeySet.prototype, "keys");

            return TheKeySet;
        });
