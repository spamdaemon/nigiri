var createKeyRange = (function(KeyRange, KeySet, Factory, isArray, isFunction) {

    var compareKeys = Factory.cmp;

    KeyRange.prototype.contains = function(x) {

        var cmpUpper = -1;
        var cmpLower = 1;

        if (this.upper !== undefined) {
            cmpUpper = compareKeys(x, this.upper);
            if (cmpUpper > 0 || (cmpUpper === 0 && this.upperOpen)) {
                return false;
            }
        }

        if (this.lower !== undefined) {
            cmpLower = compareKeys(x, this.lower);
            if (cmpLower < 0 || (cmpLower === 0 && this.lowerOpen)) {
                return false;
            }
        }

        return true;
    };

    return function(values) {

        if (values instanceof KeySet) {
            return values;
        }
        if (values instanceof KeyRange) {
            return values;
        }
        if (values instanceof IDBKeyRange) {
            return new KeyRange(values);
        }

        if (isArray(values)) {
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

        if (isFunction(values)) {
            return {
                contains : values
            };
        }

        var res = KeyRange.only(values);
        return res;
    };

})(MyKeyRange, MyKeySet, FACTORY, is_array, is_function);