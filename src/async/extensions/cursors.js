var parseKeyArgs = function(array, withQuerySupport, withValues) {

    var options = {
        withValues : withValues
    };

    var result = {
        standard : true,
        arguments : []
    };

    var i, n;
    for (i = 0, n = array.length; i < n; ++i) {
        result.arguments.push(array[i]);
    }
    array = result.arguments;

    if (array.length === 0) {
        // it's a range by default
        result.range = null;
    } else {
        if (withQuerySupport && array[0] instanceof MyQuery) {
            result.query = array[0];
            result.standard = false;
        } else {

            // if we have a keyset, then we need to use the range of the keyset
            if (array[0] instanceof MyKeySet) {
                result.keyset = array[0];
                array[0] = array[0].range;
                result.standard = false;
            }
            // if the range is a key range, then need to get its implementaion
            if (array[0] instanceof MyKeyRange) {
                array[0] = array[0].__impl;
            }

            if (!(array[0] instanceof IDBKeyRange)) {
                if (withQuerySupport && array[0] !== null && !is_array(array[0]) && (typeof array[0]) === "object") {
                    result.query = new MyQuery(array[0]);
                    result.standard = false;
                } else {
                    result.range = array[0];
                }
            } else {
                result.range = array[0];
            }
        }

        if (array.length === 2) {
            if (typeof array[1] === "string") {
                options.direction = array[1];
            } else {
                if (!(array[1] instanceof MyOptions)) {
                    array[1] = new MyOptions(array[1]);
                }
                options.withValues = array[1].withValues || options.withValues;
                options = extend({}, array[1].getOptions(), options);

                // options always has a valid direction value!
                array[1] = options.direction;
            }
        }
    }

    result.options = new MyOptions(options);

    result.standard = result.standard && result.options.isStandard;
    return result;
};

createCursorRequest = function(implSource, source, transaction, withValues, args) {

    var req = null;
    var parsedArgs = parseKeyArgs(args, true, withValues);

    if (parsedArgs.options.withValues || !implSource.openKeyCursor) {
        req = implSource.openCursor.apply(implSource, parsedArgs.arguments);
    } else {
        req = implSource.openKeyCursor.apply(implSource, parsedArgs.arguments);
    }

    if (parsedArgs.keyset) {
        req = createKeySetCursorRequest(req, source, transaction, parsedArgs.keyset, parsedArgs.options);
    } else {
        req = createGenericCursorRequest(req, source, transaction, parsedArgs.options);
    }
    return req;
};

createCountByCursorRequest = function(implSource, source, transaction, args) {
    var parsedArgs = parseKeyArgs(args);
    var req = null;

    if (parsedArgs.standard) {
        req = implSource.count.apply(implSource, parsedArgs.arguments);
        req = new MyRequest(req, source, transaction);
    } else {
        req = createCursorRequest(implSource, source, transaction, parsedArgs.options.withValues, args);
        req = countByCursor(req);
    }
    return req;
};

createDeleteByCursorRequest = function(implSource, source, transaction, args) {
    var parsedArgs = parseKeyArgs(args);
    var req = null;

    if (parsedArgs.standard) {
        req = implSource["delete"].apply(implSource, parsedArgs.arguments);
        req = new MyRequest(req, source, transaction);
    } else {
        req = createCursorRequest(implSource, source, transaction, parsedArgs.options.withValues, args);
        req = deleteByCursor(req);
    }
    return req;
};

createGetByCursorRequest = function(implSource, source, transaction, args) {
    var parsedArgs = parseKeyArgs(args);
    parsedArgs.withValues = true;
    var req = null;
    if (parsedArgs.standard) {
        req = implSource.get.apply(implSource, parsedArgs.arguments);
        req = new MyRequest(req, source, transaction);
    } else {
        req = createCursorRequest(implSource, source, transaction, true, args);
        req = getByCursor(req);
    }
    return req;
};

createGetKeyByCursorRequest = function(implSource, source, transaction, args) {
    var parsedArgs = parseKeyArgs(args);
    var req = null;
    if (parsedArgs.standard) {
        req = implSource.getKey.apply(implSource, parsedArgs.arguments);
        req = new MyRequest(req, source, transaction);
    } else {
        req = createCursorRequest(implSource, source, transaction, parsedArgs.options.withValues, args);
        req = getKeyByCursor(req);
    }
    return req;
};

//
// //////////////////////////////
//
createObjectStoreCursorRequest = function(store, args) {
    var parsedArgs = parseKeyArgs(args, true, true);
    var req = null;
    if (parsedArgs.query) {
        req = parsedArgs.query.__openCursor(store, parsedArgs.options);
    } else {
        req = createCursorRequest(store.__impl, store, store.transaction, true, args);
    }
    return req;
};

createObjectStoreCountByCursorRequest = function(store, args) {
    var parsedArgs = parseKeyArgs(args, true);
    var req = null;

    if (parsedArgs.standard) {
        req = store.__impl.count.apply(store.__impl, parsedArgs.arguments);
        req = new MyRequest(req, store, store.transaction);
    } else {
        req = createObjectStoreCursorRequest(store, args);
        req = countByCursor(req);
    }
    return req;
};

createObjectStoreDeleteByCursorRequest = function(store, args) {
    var parsedArgs = parseKeyArgs(args, true);
    var req = null;

    if (parsedArgs.standard) {
        req = store.__impl["delete"].apply(store.__impl, parsedArgs.arguments);
        req = new MyRequest(req, store, store.transaction);
    } else {
        req = createObjectStoreCursorRequest(store, args);
        req = deleteByCursor(req);
    }
    return req;
};

createObjectStoreGetByCursorRequest = function(store, args) {
    var parsedArgs = parseKeyArgs(args, true, true);
    var req = null;
    if (parsedArgs.standard) {
        req = store.__impl.get.apply(store.__impl, parsedArgs.arguments);
        req = new MyRequest(req, store, store.transaction);
    } else {
        req = createObjectStoreCursorRequest(store, args);
        req = getByCursor(req);
    }
    return req;
};
