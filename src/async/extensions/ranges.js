zone("nigiri.extension").factory("#createKeyRange", [ "MyKeyRange", "MyKeySet", "MyEnumerableKeyRange", "MyMultiKey", "nigiri.cmp", "Utils" ],
        function(KeyRange, KeySet, EnumerableKeyRange, MultiKey, compareKeys, Utils) {
            "use strict"

            return function(values) {

                if (values instanceof EnumerableKeyRange) {
                    return values;
                }
                if (values instanceof KeyRange) {
                    return values;
                }
                if (values instanceof IDBKeyRange) {
                    return new KeyRange(values);
                }

                if (Utils.is_array(values)) {
                    if (values.length === 1) {
                        return KeyRange.only(values);
                    } else {
                        return new KeySet(values);
                    }
                }
                if (values === true) {
                    return {
                        contains : function(x) {
                            return x === true;
                        }
                    };
                } else if (values === false) {
                    return {
                        contains : function(x) {
                            return x === false;
                        }
                    };
                }

                if (Utils.is_function(values)) {
                    return {
                        contains : values
                    };
                }

                var res = KeyRange.only(values);
                return res;
            };
        });

zone("nigiri.extension").interceptor("nigiri.MyKeyRange", [ "nigiri.cmp" ], function(compareKeys) {
    return function(KeyRangeFN) {
        var KeyRange = KeyRangeFN();
        
        Object.defineProperty(KeyRange.prototype, "range", {
            get : function() {
                return this;
            }
        });

        KeyRange.prototype.contains = function(x) {

            var cmpUpper = -1;
            var cmpLower = 1;

            if (this.upper !== null) {
                cmpUpper = compareKeys(x, this.upper);
                if (cmpUpper > 0 || (cmpUpper === 0 && this.upperOpen)) {
                    return false;
                }
            }

            if (this.lower !== null) {
                cmpLower = compareKeys(x, this.lower);
                if (cmpLower < 0 || (cmpLower === 0 && this.lowerOpen)) {
                    return false;
                }
            }

            return true;
        };

        KeyRange.prototype.ceiling = function(key) {

            // if the value is above outside the upper bound,
            // then we're done with the range
            var cmp;
            if (this.upper !== null) {
                cmp = compareKeys(this.upper, key);
                if (cmp < 0 || (cmp === 0 && this.upperOpen)) {
                    return undefined;
                }
            }
            if (this.lower !== null) {
                // if the value is definitely lower than the lower bound,
                // then we return the lower bound even if the lower end is open
                cmp = compareKeys(this.lower, key);
                if (cmp > 0) {
                    return this.lower;
                }
            }
            return key;
        };

        KeyRange.prototype.floor = function(key) {

            // if the value is above outside the upper bound,
            // then we're done with the range
            var cmp = compareKeys(key, this.lower);
            if (cmp < 0 || (cmp === 0 && this.lowerOpen)) {
                return undefined;
            }

            // if the value is definitely lower than the lower bound,
            // then we return the lower bound even if the lower end is open
            cmp = compareKeys(key, this.upper);
            if (cmp > 0) {
                return this.upper;
            }
            return key;
        };

        return KeyRange;
    };

});
