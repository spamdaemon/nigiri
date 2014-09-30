zone("nigiri").service("#Utils", ['console'] ,function(console) {
    "use strict"
    var undefinedAsNull = function(x) {
        return typeof x === 'undefined' ? null : x;
    };

    this.TRUE_FUNCTION = function() {
        return true;
    };

    this.FALSE_FUNCTION = function() {
        return false;
    };

    this.IDENTITY_FUNCTION = function(a) {
        return a;
    };

    // from jQuery
    this.is_array = function(o) {
        if (o !== null && typeof o == "object") {
            return (typeof o.push == "undefined") ? false : true;
        } else {
            return false;
        }
    };

    this.is_function = function(o) {
        return o !== null && typeof o === 'function';
    };

    this.extend = function(obj) {

        var i, n = arguments.length;
        var p = null, arg;
        for (i = 1; i < n; ++i) {
            arg = arguments[i];
            for (p in arg) {
                if (arg.hasOwnProperty(p)) {
                    obj[p] = arg[p];
                }
            }
        }
        return obj;
    };

    this.shallow_copy = function(obj) {
        var i, n, res, name;
        obj = obj || {};
        if (this.is_array(obj)) {
            res = [];
            for (i = 0, n = obj.length; i < n; ++i) {
                res[i] = obj[i];
            }
        } else {
            res = {};
            name = null;
            obj = obj || {};
            for (name in obj) {
                if (obj.hasOwnProperty(name)) {
                    res[name] = obj[name];
                }
            }
        }
        return res;
    };

    this.addConstProperty = function(prototype, name) {
        var pname = "__" + name;
        Object.defineProperty(prototype, name, {
            get : function() {
                return this[pname];
            }
        });
    };

    this.addProperty = function(prototype, name) {
        var pname = "__" + name;
        Object.defineProperty(prototype, name, {
            get : function() {
                return this[pname];
            },
            set : function(x) {
                this[pname] = x;
            }
        });
    };

    this.addConstAttribute = function(prototype, name, transform) {
        var getter;

        if (transform) {
            getter = function() {
                return transform(this.__impl[name]);
            };
        } else {
            getter = function() {
                var pv = this.__impl[name];
                if (pv !== null && this.__propertyMapper && this.__propertyMapper[name]) {
                    pv = this.__propertyMapper[name](pv);
                }
                return pv;
            };
        }

        Object.defineProperty(prototype, name, {
            get : getter
        });
    };

    this.addAttribute = function(prototype, name, getTransform, setTransform) {
        var setter, getter;
        if (setTransform) {
            setter = function(x) {
                this.__impl[name] = setTransform(x);
            };
            getter = function() {
                return getTransform(this.__impl[name]);
            };
        } else {
            setter = function(x) {
                this.__impl[name] = x;
            };
            getter = function() {
                return this.__impl[name];
            };
        }

        Object.defineProperty(prototype, name, {
            get : getter,
            set : setter
        });
    };

    /**
     * Perform a binary search on array.
     * 
     * @param keys
     *            an sorted array of values to search
     * @param compareKeys
     *            a compare keys function
     * @param pos
     *            a starting position in the array
     * @param key
     *            a key to search for
     * @return the index at which the key is found or the smallest position whose value is larger than the key
     */
    this.binarySearch = function(keys, compareKeys, pos, key) {
        // simple function for now
        var i = pos, j = keys.length - 1, k, cmp;

        // defensive programming here, should not really ever happen
        if (pos > j) {
            console.log("Error " + pos + " already at the end");
            return keys.length;
        }

        while (i < j) {
            // due to floor, k !== j, but it might be ===i
            k = Math.floor((i + j) / 2);
            cmp = compareKeys(key, keys[k]);
            if (cmp === 0) {
                return k;
            }
            if (cmp < 0) {
                // need to use k, because we might need to return k
                j = k;
            } else {
                // since key[k] is less k, will never be a valid answer
                // so we can safely increase by 1
                i = k + 1;
            }
        }

        // assert i===j
        if (compareKeys(key, keys[i]) <= 0) {
            return i;
        }
        return keys.length;
    };

    /**
     * Perform a binary search on array.
     * 
     * @param keys
     *            an sorted array of values to search
     * @param compareKeys
     *            a compare keys function
     * @param pos
     *            a starting position in the array
     * @param key
     *            a key to search for
     * @return the index at which the key is found or -1 if not found
     */
    this.findByBinarySearch = function(keys, compareKeys, pos, key) {
        // simple function for now
        var i = pos, j = keys.length - 1, k, cmp;

        // defensive programming here, should not really ever happen
        if (pos > j) {
            console.log("Error " + pos + " already at the end");
            return -1;
        }

        while (i < j) {
            // due to floor, k !== j, but it might be ===i
            k = Math.floor((i + j) / 2);
            cmp = compareKeys(key, keys[k]);
            if (cmp === 0) {
                return k;
            }
            if (cmp < 0) {
                // need to use k, because we might need to return k
                j = k;
            } else {
                // since key[k] is less k, will never be a valid answer
                // so we can safely increase by 1
                i = k + 1;
            }
        }

        // assert i===j
        if (compareKeys(key, keys[i]) === 0) {
            return i;
        }
        return -1;
    };
});