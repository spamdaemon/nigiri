 (function(window) {
"use strict";
var undefinedAsNull = function(x) {
    return typeof x === 'undefined' ? null : x;
};

var TRUE_FUNCTION = function() {
    return true;
};

var FALSE_FUNCTION = function() {
    return false;
};

var IDENTITY_FUNCTION = function(a) {
    return a;
};

// from jQuery
function is_array(o) {
    if (o !== null && typeof o == "object") {
        return (typeof o.push == "undefined") ? false : true;
    } else {
        return false;
    }
}

function is_function(o) {
    return o !== null && typeof o === 'function';
}

function extend(obj) {

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
}

function shallow_copy(obj) {
    var res = {};
    var name = null;
    obj = obj || {};
    for (name in obj) {
        if (obj.hasOwnProperty(name)) {
            res[name] = obj[name];
        }
    }
    return res;
}

var addConstProperty = function(prototype, name) {
    var pname = "__" + name;
    Object.defineProperty(prototype, name, {
        get : function() {
            return this[pname];
        }
    });
};

var addProperty = function(prototype, name) {
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

var addConstAttribute = function(prototype, name, transform) {
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

var addAttribute = function(prototype, name, getTransform, setTransform) {
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
var binarySearch = function(keys, compareKeys, pos, key) {
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
var findByBinarySearch = function(keys, compareKeys, pos, key) {
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
/**
 * This object is used for objects that wrap a native object.
 */
var WrapperObject = (function() {

    var setImpl = function(object, impl) {
        if (!impl) {
            throw new Error("No implementation provided");
        }
        if (object.__impl) {
            throw new Error("Implementation already set");
        }
        // set the implementation to the wrapped object
        object.__impl = impl;
        object.__nativeImpl = impl;

        // get the native object that is ultimately being wrapped
        if (impl instanceof TheWrapper) {
            object.__nativeImpl = impl.__nativeImpl;
        }
        if (!object.__nativeImpl) {
            throw new Error("No native object being wrapped");
        }
        // reset the owner of the native object
        object.__nativeImpl.__owner = object;

        // if the object itself has an owner, then make the owned object the owner
        if (object.__owner) {
            setImpl(object.__owner, object.__nativeImpl);
        }
    };

    var setOwnerOf = function(object, impl) {
        if (!impl) {
            throw new Error("No implementation provided");
        }

        if (impl instanceof TheWrapper && impl.__nativeImpl) {
            impl = impl.__nativeImpl;
        }

        impl.__owner = object;
    };

    var TheWrapper = function(impl) {

        this.__impl = null;
        if (impl) {
            setImpl(this, impl);
        }
    };

    TheWrapper.prototype.__setImpl = function(impl) {
        setImpl(this, impl);
    };

    TheWrapper.prototype.__setOwnerOf = function(impl) {
        setOwnerOf(this, impl);
    };

    TheWrapper.prototype.__getNativeImpl = function() {
        if (this.__nativeImpl) {
            return this.__nativeImpl;
        } else {
            throw new Error("No native implementation set");
        }
    };

    /**
     * Get the owner of the native implementation object.
     * 
     * @returns a wrapper
     */
    TheWrapper.__getOwner = function(nativeObject) {
        if (nativeObject.__owner) {
            return nativeObject.__owner;
        }

        throw new Error("Owner of the native implementation has not been set");
    };

    return TheWrapper;

})();
var EventWrapper = (function(WrapperObject) {

    var TheWrapper = function(event) {
        WrapperObject.call(this, event);
        if (!event) {
            throw new Error("No event specified");
        }

    };

    TheWrapper.prototype = Object.create(WrapperObject.prototype);
    TheWrapper.prototype.constructor = TheWrapper;

    TheWrapper.prototype.stopPropagation = function() {
        this.__getNativeImpl().stopPropagation();
    };

    TheWrapper.prototype.stopPropagation = function() {
        this.__getNativeImpl().stopImmediatePropagation();
    };

    TheWrapper.prototype.preventDefault = function() {
        this.__getNativeImpl().preventDefault();
    };

    Object.defineProperty(TheWrapper.prototype, "type", {
        get : function() {
            return this.__getNativeImpl().type;
        }
    });

    Object.defineProperty(TheWrapper.prototype, "eventPhase", {
        get : function() {
            return this.__getNativeImpl().eventPhase;
        }
    });

    Object.defineProperty(TheWrapper.prototype, "bubbles", {
        get : function() {
            return this.__getNativeImpl().bubbles;
        }
    });

    Object.defineProperty(TheWrapper.prototype, "cancelable", {
        get : function() {
            return this.__getNativeImpl().cancelable;
        }
    });

    Object.defineProperty(TheWrapper.prototype, "defaultPrevented", {
        get : function() {
            return this.__getNativeImpl().defaultPrevented;
        }
    });

    Object.defineProperty(TheWrapper.prototype, "isTrusted", {
        get : function() {
            return this.__getNativeImpl().isTrusted;
        }
    });

    Object.defineProperty(TheWrapper.prototype, "timeStamp", {
        get : function() {
            return this.__getNativeImpl().timeStamp;
        }
    });

    Object.defineProperty(TheWrapper.prototype, "target", {
        get : function() {
            return WrapperObject.__getOwner(this.__getNativeImpl().target);
        }
    });

    Object.defineProperty(TheWrapper.prototype, "currentTarget", {
        get : function() {
            return WrapperObject.__getOwner(this.__getNativeImpl().currentTarget);
        }
    });
    
    return TheWrapper;

})(WrapperObject);

var createSuccessEvent = (function() {

    var TheEvent = function(target) {
        var event = new CustomEvent("success", {
            bubbles : false,
            cancelable : false
        });

        this.__target = target;
        this.__currentTarget = target;
        this.__timeStamp = event.timeStamp;
        this.__defaultPrevented = false;
    };

    TheEvent.prototype.preventDefault = function() {
        this.__defaultPrevented = true;
    };
    TheEvent.prototype.stopPropagation = function() {
    };
    TheEvent.prototype.stopImmediatePropagation = function() {
    };

    Object.defineProperty(TheEvent.prototype, "type", {
        get : function() {
            return "success";
        }
    });

    Object.defineProperty(TheEvent.prototype, "eventPhase", {
        get : function() {
            return 0;
        }
    });

    Object.defineProperty(TheEvent.prototype, "bubbles", {
        get : function() {
            return false;
        }
    });

    Object.defineProperty(TheEvent.prototype, "cancelable", {
        get : function() {
            return false;
        }
    });

    Object.defineProperty(TheEvent.prototype, "defaultPrevented", {
        get : function() {
            return this.__defaultPrevented;
        }
    });

    Object.defineProperty(TheEvent.prototype, "isTrusted", {
        get : function() {
            return true;
        }
    });

    Object.defineProperty(TheEvent.prototype, "timeStamp", {
        get : function() {
            return this.__timeStamp;
        }
    });

    Object.defineProperty(TheEvent.prototype, "target", {
        get : function() {
            return this.__target;
        }
    });

    Object.defineProperty(TheEvent.prototype, "currentTarget", {
        get : function() {
            return this.__currentTarget;
        }
    });

    return function(target) {
        return new TheEvent(target);
    };
})();

var createErrorEvent = (function() {

    var TheEvent = function(target) {
        var event = new CustomEvent("error", {
            bubbles : false,
            cancelable : false
        });

        this.__target = target;
        this.__currentTarget = target;
        this.__timeStamp = event.timeStamp;
        this.__defaultPrevented = false;
    };

    TheEvent.prototype.preventDefault = function() {
        this.__defaultPrevented = true;
    };
    TheEvent.prototype.stopPropagation = function() {
    };
    TheEvent.prototype.stopImmediatePropagation = function() {
    };

    Object.defineProperty(TheEvent.prototype, "type", {
        get : function() {
            return "error";
        }
    });

    Object.defineProperty(TheEvent.prototype, "eventPhase", {
        get : function() {
            return 0;
        }
    });

    Object.defineProperty(TheEvent.prototype, "bubbles", {
        get : function() {
            return true;
        }
    });

    Object.defineProperty(TheEvent.prototype, "cancelable", {
        get : function() {
            return true;
        }
    });

    Object.defineProperty(TheEvent.prototype, "defaultPrevented", {
        get : function() {
            return this.__defaultPrevented;
        }
    });

    Object.defineProperty(TheEvent.prototype, "isTrusted", {
        get : function() {
            return true;
        }
    });

    Object.defineProperty(TheEvent.prototype, "timeStamp", {
        get : function() {
            return this.__timeStamp;
        }
    });

    Object.defineProperty(TheEvent.prototype, "target", {
        get : function() {
            return this.__target;
        }
    });

    Object.defineProperty(TheEvent.prototype, "currentTarget", {
        get : function() {
            return this.__currentTarget;
        }
    });

    return function(target) {
        return new TheEvent(target);
    };
})();
var MyGenericEventListener = function(type, listener, useCapture) {
    this.__type = type;
    this.__listener = listener;
    this.__useCapture = useCapture;
    this.__actualListener = listener;
    if (listener.handleEvent) {
        this.__actualListener = function(e) {
            return listener.handleEvent(e);
        };
    }
};

var MyGenericEventTarget = function(impl) {
    WrapperObject.call(this,impl);
    this.__listeners = [];
};

MyGenericEventTarget.prototype = Object.create(WrapperObject.prototype);
MyGenericEventTarget.prototype.constructor = MyGenericEventTarget;

MyGenericEventTarget.prototype.addEventListener = function(type, listener, useCapture) {

    var i, n = this.__listeners.length;
    var l;

    for (i = 0; i < n; ++i) {
        l = this.__listeners[i];
        if (l.__type === type && l.__listener === listener && useCapture == l.__useCapture) {
            // already added the listener
            return;
        }
    }

    this.__listeners.push(new MyGenericEventListener(type, listener, useCapture));
};

MyGenericEventTarget.prototype.removeEventListener = function(type, listener, useCapture) {
    var i, n = this.__listeners.length;
    var l;

    for (i = 0; i < n; ++i) {
        l = this.__listeners[i];
        if (l.__type === type && l.__listener === listener && useCapture == l.__useCapture) {
            this.__listeners.splice(i, 1);
            return;
        }
    }
};

MyGenericEventTarget.prototype.dispatchEvent = function(event) {
    var i, n = this.__listeners.length;
    var listeners;

    if (n === 0) {
        return;
    }
    listeners = this.__listeners.slice(0);
    for (i = 0; i < n; ++i) {
        listeners[i].call(this, event);
    }
    return !event.__doNotPreventDefault;
};

var MyDBEventTarget = function(impl) {
    MyGenericEventTarget.call(this,impl);
    this.__handlers = {};

    // implementation handlers store the callback for the implementation until
    // such time that the implemntation becomes available.
    this.__implHandlers = impl ? null : {};
};

MyDBEventTarget.prototype = Object.create(MyGenericEventTarget.prototype);
MyDBEventTarget.prototype.constructor = MyDBEventTarget;


MyDBEventTarget.prototype.__setImpl = function(impl) {
    WrapperObject.prototype.__setImpl.call(this,impl);
    
    var name = null;
    if (this.__implHandlers !== null) {
        for (name in this.__implHandlers) {
            if (this.__implHandlers.hasOwnProperty(name)) {
                impl[name] = this.__implHandlers[name];
            }
        }
    }
    this.__implHandlers = null;
};

MyDBEventTarget.prototype.__wrapEvent = function(event)
{
    return new EventWrapper(event);
};


MyDBEventTarget.prototype.__getCallback = function(name) {
    return this.__handlers[name] || null;
};

MyDBEventTarget.prototype.__clearCallback = function(name) {
    delete this.__handlers[name];
    if (this.__impl) {
        this.__impl[name] = null;
    } else {
        delete this.__implHandlers[name];
    }
};

MyDBEventTarget.prototype.__setCallback = function(name, cb, implCB) {

    var target = this;
    if (!implCB) {
        implCB = cb;
    }

    var registeredCB = function(e) {
        var event = target.__wrapEvent(e);
        implCB(event);
        target.dispatchEvent(event);
    };

    if (this.__impl) {
        this.__impl[name] = registeredCB;
    } else {
        this.__implHandlers[name] = registeredCB;
    }
    this.__handlers[name] = cb;
};

var addEventHandlerProperty = function(prototype, name) {
    Object.defineProperty(prototype, name, {
        get : function() {
            return this.__getCallback(name);
        },
        set : function(fn) {
            if (fn) {
                this.__setCallback(name, fn);
            } else {
                this.__clearCallback(name);
            }
        }
    });
};
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
var MyRequest = (function(EventTargetImpl, addEventHandlerProperty) {

    var isValidResult = function(result) {
        return result !== null && result !== undefined;
    };

    var TheRequest = function(impl, source, transaction, resultWrapper) {
        EventTargetImpl.call(this, impl);
        this.__source = source;
        this.__transaction = transaction;

        this.__resultOverride = false;
        this.__result = undefined;
        this.__readyStateOverride = false;
        this.__readyState = "pending";
        this.__error = null;

        this.__wrapResult = resultWrapper || IDENTITY_FUNCTION;

    };

    TheRequest.__invalidResult = function(req) {
        return !isValidResult(req.result);
    };

    TheRequest.__resultValid = function(req) {
        return isValidResult(req.result);
    };

    TheRequest.prototype = Object.create(EventTargetImpl.prototype);
    TheRequest.prototype.constructor = TheRequest;

    TheRequest.prototype.__notifyOnSuccess = function(result, event) {
        this.__result = result;
        if (this.onsuccess) {
            this.onsuccess(event || createSuccessEvent(this));
            return true;
        }
        return false;
    };

    TheRequest.prototype.__notifyOnError = function(error, event) {
        this.__error = error;
        if (this.onerror) {
            this.onerror(event || createErrorEvent(this));
            return true;
        }
        return false;
    };

    TheRequest.prototype.__setImpl = function(impl) {
        if (this.__result || this.__readyState !== "pending" || this.__error !== null) {
            throw new Error("Invalid state; cannot set implementation");
        }
        EventTargetImpl.prototype.__setImpl.call(this, impl);
    };

    Object.defineProperty(TheRequest.prototype, "transaction", {
        get : function() {
            return this.__transaction;
        }
    });
    Object.defineProperty(TheRequest.prototype, "source", {
        get : function() {
            return this.__source;
        }
    });
    Object.defineProperty(TheRequest.prototype, "result", {
        get : function() {
            if (!this.__resultOverride && !isValidResult(this.__result) && this.__impl && isValidResult(this.__impl.result)) {
                return this.__wrapResult(this.__impl.result, this);
            }
            return this.__result;
        }
    });

    Object.defineProperty(TheRequest.prototype, "error", {
        get : function() {
            if (this.__impl) {
                return this.__impl.error;
            }
            return this.__error;
        }
    });
    Object.defineProperty(TheRequest.prototype, "readyState", {
        get : function() {
            if (!this.__readyStateOverride && this.__impl) {
                return this.__impl.readyState;
            }
            return this.__readyState;
        }
    });

    addEventHandlerProperty(TheRequest.prototype, "onsuccess");
    addEventHandlerProperty(TheRequest.prototype, "onerror");

    return TheRequest;
})(MyDBEventTarget, addEventHandlerProperty);var MyTransaction = function(idbTransaction, db) {
    MyDBEventTarget.call(this, idbTransaction);
    this.__impl = idbTransaction;
    this.__db = db;
};

// inheritance
MyTransaction.prototype = Object.create(MyDBEventTarget.prototype);
MyTransaction.prototype.constructor = MyTransaction;

MyTransaction.prototype.abort = function() {
    this.__impl.abort.apply(this.__impl, arguments);
};

MyTransaction.prototype.objectStore = function() {
    var store = this.__impl.objectStore.apply(this.__impl, arguments);
    return new MyObjectStore(store, this);
};

// attributes
addConstProperty(MyTransaction.prototype, "db");
addConstAttribute(MyTransaction.prototype, "mode");
addConstAttribute(MyTransaction.prototype, "error");
addEventHandlerProperty(MyTransaction.prototype, "onabort");
addEventHandlerProperty(MyTransaction.prototype, "oncomplete");
addEventHandlerProperty(MyTransaction.prototype, "onerror");
var MyDatabase = function(idbDatabase) {
    MyDBEventTarget.call(this, idbDatabase, this);
};

// inheritance
MyDatabase.prototype = Object.create(MyDBEventTarget.prototype);
MyDatabase.prototype.constructor = MyDatabase;

MyDatabase.prototype.createObjectStore = function() {
    var store = this.__impl.createObjectStore.apply(this.__impl, arguments);
    return new MyObjectStore(store, new MyTransaction(store.transaction));
};

MyDatabase.prototype.deleteObjectStore = function() {
    this.__impl.deleteObjectStore.apply(this.__impl, arguments);
};

MyDatabase.prototype.transaction = function() {
    var tx = this.__impl.transaction.apply(this.__impl, arguments);
    return new MyTransaction(tx, this);
};

MyDatabase.prototype.close = function() {
    this.__impl.close.apply(this.__impl, arguments);
};

// attributes
addConstAttribute(MyDatabase.prototype, "name");
addConstAttribute(MyDatabase.prototype, "version");
addConstAttribute(MyDatabase.prototype, "objectStoreNames");
var MyOpenDBRequest = (function(EventWrapper, RequestBaseClass, Transaction, Database, addEventHandlerProperty) {

    var TheEvent = function(e) {
        EventWrapper.call(this, e);
    };

    TheEvent.prototype = Object.create(EventWrapper.prototype);
    TheEvent.prototype.constructor = TheEvent;

    Object.defineProperty(TheEvent.prototype, "oldVersion", {
        get : function() {
            return this.__getNativeImpl().oldVersion;
        }
    });

    Object.defineProperty(TheEvent.prototype, "newVersion", {
        get : function() {
            return this.__getNativeImpl().newVersion;
        }
    });

    var TheRequest = function(idbRequest) {
        RequestBaseClass.call(this, idbRequest, null, null);
    };

    // inheritance
    TheRequest.prototype = Object.create(RequestBaseClass.prototype);
    TheRequest.prototype.constructor = TheRequest;

    TheRequest.prototype.__wrapEvent = function(event) {
        if (event instanceof IDBVersionChangeEvent) {
            return new TheEvent(event);
        } else {
            return RequestBaseClass.prototype.__wrapEvent.call(this, event);
        }
    };

    // attributes

    Object.defineProperty(TheRequest.prototype, "transaction", {
        get : function() {
            if (!this.__transaction && this.result) {
                this.__transaction = new Transaction(this.__impl.transaction, this.__result);
            }
            return this.__transaction;
        }
    });

    Object.defineProperty(TheRequest.prototype, "result", {
        get : function() {
            if (!this.__result && this.__impl.result) {
                this.__result = new Database(this.__impl.result);
            }
            return this.__result;
        }
    });

    addEventHandlerProperty(TheRequest.prototype, "onblocked");
    addEventHandlerProperty(TheRequest.prototype, "onupgradeneeded");

    return TheRequest;
})(EventWrapper, MyRequest, MyTransaction, MyDatabase, addEventHandlerProperty);
var FACTORY = (function(REQUEST, INDEXEDDB_PROVIDER) {

    if (!INDEXEDDB_PROVIDER) {
        INDEXEDDB_PROVIDER = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;
    }

    if (!INDEXEDDB_PROVIDER) {
        throw new Error("Failed to create indexed DB");
    }

    return {
        open : function() {
            var req = INDEXEDDB_PROVIDER.open.apply(INDEXEDDB_PROVIDER, arguments);
            return new REQUEST(req);
        },

        deleteDatabase : function() {
            var req = INDEXEDDB_PROVIDER.deleteDatabase.apply(INDEXEDDB_PROVIDER, arguments);
            return new REQUEST(req);
        },

        cmp : function(a, b) {
            return INDEXEDDB_PROVIDER.cmp(a, b);
        }
    };
})(MyOpenDBRequest);
var MyCursor = function(idbCursor, source, transaction) {
    this.__impl = idbCursor;
    this.__source = source;
    this.__transaction = transaction;
};

MyCursor.prototype.update = function() {

    var req = this.__impl.update.apply(this.__impl, arguments);
    return new MyRequest(req, this, this.__transaction);
};

MyCursor.prototype.advance = function() {
    this.__impl.advance.apply(this.__impl, arguments);
};

MyCursor.prototype["continue"] = function() {
    this.__impl["continue"].apply(this.__impl, arguments);
};

MyCursor.prototype["delete"] = function() {
    var req = this.__impl["delete"].apply(this.__impl, arguments);
    return new MyRequest(req, this, this.__transaction);
};

// attributes
addConstProperty(MyCursor.prototype, "source");
addConstAttribute(MyCursor.prototype, "direction");
addConstAttribute(MyCursor.prototype, "key");
addConstAttribute(MyCursor.prototype, "primaryKey");
var MyCursorWithValues = function(idbCursor, source, transaction) {
    MyCursor.call(this, idbCursor, source, transaction);
    this.__impl = idbCursor;
    this.__source = source;
};

MyCursorWithValues.prototype = Object.create(MyCursor.prototype);
MyCursorWithValues.prototype.constructor = MyCursorWithValues;

addConstAttribute(MyCursorWithValues.prototype, "value");
var createCursorRequest = function(implSource, source, transaction, withValues, args) {
    var req = null;
    var result = null;

    if (withValues || !implSource.openKeyCursor) {
        req = implSource.openCursor.apply(implSource, args);
        result = function(r) {
            new MyCursor(r, source, transaction);
        };
    } else {
        req = implSource.openKeyCursor.apply(implSource, args);
        result = function(r) {
            new MyCursorWithValues(r, source, transaction);
        };
    }
    req = new MyRequest(req, source, transaction, result);
    return req;
};

var createCountByCursorRequest = function(implSource, source, transaction, args) {
    var req = implSource.count.apply(implSource, args);
    req = new MyRequest(req, source, transaction);
    return req;
};

var createDeleteByCursorRequest = function(implSource, source, transaction, args) {
    var req = implSource["delete"].apply(implSource, args);
    req = new MyRequest(req, source, transaction);
    return req;
};

var createGetByCursorRequest = function(implSource, source, transaction, args) {
    var req = implSource.get.apply(implSource, args);
    req = new MyRequest(req, source, transaction);
    return req;
};

var createGetKeyByCursorRequest = function(implSource, source, transaction, args) {
    var req = implSource.getKey.apply(implSource, args);
    req = new MyRequest(req, source, transaction);
    return req;
};

var createObjectStoreCursorRequest = function(source, args) {
    return createCursorRequest(source.__impl, source, source.transaction, true, args);
};

var createObjectStoreCountByCursorRequest = function(store, args) {
    var req = store.__impl.count.apply(store.__impl, args);
    req = new MyRequest(req, store, store.transaction);
    return req;
};

var createObjectStoreDeleteByCursorRequest = function(store, args) {
    var req = store.__impl["delete"].apply(store.__impl, args);
    req = new MyRequest(req, store, store.transaction);
    return req;
};

var createObjectStoreGetByCursorRequest = function(store, args) {
    var req = store.__impl.get.apply(store.__impl, args);
    req = new MyRequest(req, store, store.transaction);
    return req;
};
var MyObjectStore = function(idbObjectStore, transaction) {
    this.__impl = idbObjectStore;
    this.__transaction = transaction;
};

MyObjectStore.prototype.add = function() {
    var req = this.__impl.add.apply(this.__impl, arguments);
    return new MyRequest(req, this, this.__transaction);
};

MyObjectStore.prototype.clear = function() {
    var req = this.__impl.clear.apply(this.__impl, arguments);
    return new MyRequest(req, this, this.__transaction);
};

MyObjectStore.prototype.count = function() {
    return createObjectStoreCountByCursorRequest(this, arguments);
};

MyObjectStore.prototype.createIndex = function() {
    var req = this.__impl.createIndex.apply(this.__impl, arguments);
    return new MyIndex(req, this);
};

MyObjectStore.prototype["delete"] = function() {
    return createObjectStoreDeleteByCursorRequest(this, arguments);
};

MyObjectStore.prototype.deleteIndex = function() {
    this.__impl.deleteIndex.apply(this.__impl, arguments);
};

MyObjectStore.prototype.get = function() {
    return createObjectStoreGetByCursorRequest(this, arguments);
};

MyObjectStore.prototype.index = function() {
    var res = this.__impl.index.apply(this.__impl, arguments);
    return new MyIndex(res, this);
};

MyObjectStore.prototype.openCursor = function() {
    return createObjectStoreCursorRequest(this, arguments);
};

MyObjectStore.prototype.put = function(value, key) {
    var req = this.__impl.put.apply(this.__impl, arguments);
    return new MyRequest(req, this, this.__transaction);
};

// attributes
addConstAttribute(MyObjectStore.prototype, "indexNames");
addConstAttribute(MyObjectStore.prototype, "keyPath");
addConstAttribute(MyObjectStore.prototype, "name");
addConstProperty(MyObjectStore.prototype, "transaction");
addConstAttribute(MyObjectStore.prototype, "autoIncrement");
var MyIndex = function(idbIndex, objectStore) {
    this.__impl = idbIndex;
    this.__objectStore = objectStore;
};

MyIndex.prototype.get = function() {
    return createGetByCursorRequest(this.__impl, this, this.__objectStore.transaction, arguments);
};

MyIndex.prototype.getKey = function() {
    return createGetKeyByCursorRequest(this.__impl, this, this.__objectStore.transaction, arguments);
};

MyIndex.prototype.count = function() {
    return createCountByCursorRequest(this.__impl, this, this.__objectStore.transaction, arguments);
};

MyIndex.prototype.openCursor = function() {
    return createCursorRequest(this.__impl, this, this.__objectStore.transaction, true, arguments);
};

MyIndex.prototype.openKeyCursor = function() {
    return createCursorRequest(this.__impl, this, this.__objectStore.transaction, false, arguments);
};

// attributes
addConstAttribute(MyIndex.prototype, "name");
addConstProperty(MyIndex.prototype, "objectStore");
addConstAttribute(MyIndex.prototype, "keyPath");
addConstAttribute(MyIndex.prototype, "multiEntry");
addConstAttribute(MyIndex.prototype, "unique");
var MyEnvironment = function(idbEnvironment, indexDB) {
    this.__impl = idbEnvironment;
    this.__indexedDB = indexedDB;
};

// attributes
addConstProperty(MyEnvironment.prototype, "indexedDB");
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
var MyKeyPath = (function(isArray) {

    var applyKeyPath = function(path, object) {
        var i, n = path.length;
        for (i = 0; i < n; ++i) {
            object = object[path[i]];
            if (object === undefined) {
                throw "Incomplete path";
            }
        }
        return object;
    };

    var splitKeyPath = function(path) {
        // FIXME: needs to do a proper split on properties
        return path.split(".");
    };

    var MyKeyPath = function(paths) {

        var i, n, p, ps;
        if (!isArray(paths)) {
            paths = [ paths ];
        }
        this.__paths = Object.freeze(paths.slice(0));

        n = this.__paths.length;
        this.__parsedPaths = {};

        for (i = 0; i < n; ++i) {
            p = paths[i];
            ps = splitKeyPath(p);
            this.__parsedPaths[p] = ps;
        }
    };

    addConstProperty(MyKeyPath.prototype, "paths");

    MyKeyPath.prototype.applyPath = function(object) {
        var i, n = this.__paths.length, path, result = {};
        for (i = 0; i < n; ++i) {
            path = this.__paths[i];
            try {
                result[path] = applyKeyPath(this.__parsedPaths[path], object);
            } catch (incompletePath) {
                // ignore
            }
        }
        return result;
    };

    MyKeyPath.applyPath = function(stringOrArray, object) {
        var i, n, res;
        if (isArray(stringOrArray)) {
            res = [];
            for (i = 0, n = stringOrArray.length; i < n; ++i) {
                try {
                    res.push(applyKeyPath(splitKeyPath(stringOrArray[i])));
                } catch (undefinedPath) {
                    res.push(undefined);
                }
            }
        } else {
            try {
                res = applyKeyPath(splitKeyPath(stringOrArray));
            } catch (undefinedPath) {
                return undefined;
            }
        }
        return res;
    };
    return MyKeyPath;
})(is_array);
var MyOptions = (function(copy, extend) {

    var arrayOrNull = function(array)
    {
        return array===null || array.length===0 ? null : array;
    };
    
    var TheOptions = function(opts) {
        var i, n;
        extend(this, copy(opts || {}));

        this.isDefault = true;
        this.isStandard = true;

        if (!this.hasOwnProperty("filter")) {
            this.filter = null;
        }
        this.isDefault = this.isDefault && this.filter === null;
        this.isStandard = this.isStandard && this.filter === null;

        if (!this.hasOwnProperty("limit")) {
            this.limit = -1;
        }
        this.isDefault = this.isDefault && this.limit < 0;
        this.isStandard = this.isStandard && this.limit < 0;
        if (!this.hasOwnProperty("offset")) {
            this.offset = 0;
        }
        this.isDefault = this.isDefault && this.offset === 0;
        this.isStandard = this.isStandard && this.offset === 0;
        if (!this.hasOwnProperty("direction")) {
            this.direction = "next";
        }
        this.isDefault = this.isDefault && this.direction === "next";
        if (!this.hasOwnProperty("withValues")) {
            this.withValues = true;
        }

        if (!this.hasOwnProperty("excludedPrimaryKeys")) {
            this.excludedPrimaryKeys = null;
        }
        this.excludedPrimaryKeys = arrayOrNull(this.excludedPrimaryKeys);
        
        this.isDefault = this.isDefault && this.excludedPrimaryKeys===null;
        this.isStandard = this.isStandard && this.excludedPrimaryKeys===null;

        if (!this.hasOwnProperty("excludedKeys")) {
            this.excludedKeys = null;
        }
        this.excludedKeys = arrayOrNull(this.excludedKeys);
        this.isDefault = this.isDefault && this.excludedKeys===null;
        this.isStandard = this.isStandard && this.excludedKeys===null;

        if (!this.hasOwnProperty("includedPrimaryKeys")) {
            this.includedPrimaryKeys = null;
        }
        this.includedPrimaryKeys = arrayOrNull(this.includedPrimaryKeys);
        this.isDefault = this.isDefault && this.includedPrimaryKeys===null;
        this.isStandard = this.isStandard && this.includedPrimaryKeys===null;

        if (!this.hasOwnProperty("includedKeys")) {
            this.includedKeys = null;
        }
        this.includedKeys = arrayOrNull(this.includedKeys);
        this.isDefault = this.isDefault && this.includedKeys===null;
        this.isStandard = this.isStandard && this.includedKeys===null;

        Object.freeze(this);
    };

    TheOptions.prototype.getOptions = function() {
        return copy(this);
    };

    return TheOptions;
})(shallow_copy, extend);
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

})(MyKeyRange, MyKeySet, FACTORY, is_array, is_function);var createGenericCursorRequest = (function(MyRequest, MyCursor, MyOptions, findByBinarySearch, compare) {

    var isExcludedKey = function(keys, key) {
        return keys !== null && findByBinarySearch(keys, compare, 0, key) >= 0;
    };

    var isIncludedKey = function(keys, key) {
        return keys === null || findByBinarySearch(keys, compare, 0, key) >= 0;
    };

    var createKeyFilter = function(request, filter) {
        return function(cursor) {
            // check that the key and primary keys are not excluded
            if (isExcludedKey(request.__excludedKeys, cursor.key)) {
                return false;
            }
            if (isExcludedKey(request.__excludedPrimaryKeys, cursor.primaryKey)) {
                return false;
            }
            if (!isIncludedKey(request.__includedKeys, cursor.key)) {
                return false;
            }
            if (!isIncludedKey(request.__includedPrimaryKeys, cursor.primaryKey)) {
                return false;
            }
            return filter(cursor);
        };
    };

    /**
     * This function creates an iterator. We need to pass the original request, because the event object may point at
     * the wrong request object when chaining requests:
     * 
     * <pre>
     *  
     *    OuterCursor
     *     -&gt; InnerCursor
     *      -&gt; NativeCursor
     * </pre>
     * 
     * When the native cursor invokes the callback, the inner cursor will receive it, but but the owner of the native
     * cursor is really the outer cursor; this means, we won't be able to access the state variable.
     */
    var createIterator = function(request, callback) {

        return function(e) {
            var state = request.__iterationState;

            var cursor = request.result;
            if (!MyRequest.__resultValid(request)) {
                callback(e);
                return;
            }

            if (!cursor.__impl) {
                throw new Error("Cursor is not defined");
            }

            // if we've reached the end of the iteration then we just bail out
            if (state.__limit === 0) {
                request.__readyState = "done";
                request.__result = null;
                // need to override the result
                request.__resultOverride = request.__readyStateOverride = true;
                callback(e);
                return;
            }

            // try to sync up the cursor such that the current
            // is a key to be returned by the cursor
            if (!request.__sync(cursor.__impl, state.__callerState)) {
                // it is expected that the cursor has finished
                return;
            }

            // the cursor was successfully sync'ed to an element

            if (!request.__filter(cursor)) {
                cursor.__impl.advance(1);
            } else if (state.__skip > 0) {
                --state.__skip;
                // move the source cursor forward
                cursor.__impl.advance(1);
            } else {
                if (state.__limit > 0) {
                    --state.__limit;
                }
                // invoke the real callback and leave it up the client to call continue or advance
                callback(e);
            }
        };
    };

    /**
     * The cursor class.
     */
    var TheCursor = function(cursor, source, transaction) {
        MyCursor.call(this, cursor, source, transaction);
        this.__state = null;
    };

    TheCursor.prototype = Object.create(MyCursor.prototype);
    TheCursor.prototype.constructor = TheCursor;

    TheCursor.prototype["continue"] = function() {
        this.__impl["continue"].apply(this.__impl, arguments);
        if (this.__state !== null) {
            this.__state.__skip = 0;
        }
    };

    TheCursor.prototype.advance = function(count) {
        if (this.__state !== null) {
            this.__impl.advance(1);
            this.__state.__skip = count - 1;
        } else {
            this.__impl.advance(count);
        }
    };

    /**
     * The cursor class.
     */
    var TheCursorWithValues = function(cursor, source, transaction) {
        TheCursor.call(this, cursor, source, transaction);
    };

    TheCursorWithValues.prototype = Object.create(TheCursor.prototype);
    TheCursorWithValues.prototype.constructor = TheCursorWithValues;

    Object.defineProperty(TheCursorWithValues.prototype, "value", {
        get : function() {
            return this.__impl ? this.__impl.value : undefined;
        }
    });

    /**
     * The Request class. The purpose of the sync function is to synchronize a cursor with the current iteration state.
     * 
     * @param idbRequest
     *            the request to be wrapped
     * @param source
     *            the source object for the new request
     * @param transaction
     *            the transaction associated with the request
     * @param syncFN
     *            a synchronization function (takes a cursor and an iteration state)
     * @param initialIterationState
     *            the initial iteration state
     */
    var TheRequest = function(idbRequest, source, transaction, options) {
        if (!source) {
            throw new Error("No source specified");
        }
        if (!transaction) {
            throw new Error("No transaction specified");
        }

        var self = this;
        MyRequest.call(self, idbRequest, source, transaction, function(r) {
            return self.__createCursor(r, source, transaction);
        });
        this.__cursorWithValues = options.withValues || false;
        this.__sync = options.sync || TRUE_FUNCTION;

        this.__excludedKeys = options.excludedKeys || null;
        this.__excludedPrimaryKeys = options.excludedPrimaryKeys || null;
        this.__includedKeys = options.includedKeys || null;
        this.__includedPrimaryKeys = options.includedPrimaryKeys || null;

        this.__filter = options.filter || TRUE_FUNCTION;
        if (this.__excludedKeys !== null || this.__excludedPrimaryKeys !== null || this.__includedKeys !== null || this.__includedPrimaryKeys !== null) {
            this.__filter = createKeyFilter(this, this.__filter);
        }

        this.__iterationState = {
            __skip : options.offset > 0 ? options.offset : 0,
            __limit : options.limit >= 0 ? options.limit : -1,
            __callerState : options.iterationState || {}
        };

        // check the iteration state is the default state, in which case we don't need to do any sort of filtering.
        if (this.__sync === TRUE_FUNCTION && this.__iterationState.__skip === 0 && this.__iterationState.__limit < 0 && this.__filter === TRUE_FUNCTION) {
            this.__iterationState = null;
        }

    };

    TheRequest.prototype = Object.create(MyRequest.prototype);
    TheRequest.prototype.constructor = TheRequest;

    TheRequest.prototype.__createCursor = function(impl, source, transaction) {
        var res = null;
        if (this.__cursorWithValues) {
            res = new TheCursorWithValues(impl, source, transaction);
        } else {
            res = new TheCursor(impl, source, transaction);
        }
        res.__state = this.__iterationState;
        return res;
    };

    TheRequest.prototype.__setCallback = function(name, callback) {
        var implCB = null;
        if (name === 'onsuccess' && this.__iterationState !== null) {
            implCB = createIterator(this, callback);
        }
        // call's SUPER!
        MyDBEventTarget.prototype.__setCallback.call(this, name, callback, implCB);
    };

    return function(idbRequest, source, transaction, options) {
        var req = new TheRequest(idbRequest, source, transaction, new MyOptions(options));
        return req;
    };
})(MyRequest, MyCursor, MyOptions, findByBinarySearch, FACTORY.cmp);var createKeySetCursorRequest = (function(FACTORY, isFunction, findKeyIndex, createGenericCursorRequest, MyOptions) {

    var prevSort = function(a, b) {
        return FACTORY.cmp(b, a);
    };

    var createState = function(keyset, direction) {
        var state = {
            keys : keyset.__keys,
            pos : 0,
            nextKey : 0,
            compare : FACTORY.cmp
        };

        if (direction === 'prev' || direction === 'prevunique') {
            state.compare = prevSort;
            state.keys = state.keys.slice(0).sort(prevSort);
        }
        return state;
    };

    var setPosition = function(state, key) {
        state.pos = findKeyIndex(state.keys, state.compare, state.pos, key);
        return state.pos < state.keys.length;
    };

    var syncWithKeyset = function(cursor, state) {

        var actualKey, expectedKey, cmp;

        actualKey = cursor.key;

        expectedKey = state.keys[state.pos];
        cmp = state.compare(actualKey, expectedKey);

        // if the actual is greater than the actual key, then we just need to find the closest key
        // in the key set
        if (cmp > 0) {
            // this is an assertion:
            // there must at least be one other larger key in the keyset, otherwise the actual key would
            // exceed the range of the of keyset!
            if (!setPosition(state, actualKey)) {
                throw new Error("Actual key exceeds the range of the keyset "+actualKey);
            }

            // we need to do another comparison, to see if the current actual key matches
            // the new expected key
            expectedKey = state.keys[state.pos];
            cmp = state.compare(actualKey, expectedKey);

            // at this point, the comparison must be <= 0
            if (cmp > 0) {
                throw new Error("Assertion failed; actual key still exceeds the expected key");
            }
        }
        // if the two keys match, we notify the callback, provided we're not supposed to advance some more
        if (cmp === 0) {
            return true;
        }
        cursor["continue"](expectedKey);
    };

    return function(impl, source, transaction, keyset, opts) {

        var options = new MyOptions(opts).getOptions();
        options.iterationState = createState(keyset, opts.direction);
        options.sync = syncWithKeyset;

        return createGenericCursorRequest(impl, source, transaction, new MyOptions(options));
    };

})(FACTORY, is_function, binarySearch, createGenericCursorRequest, MyOptions);var countByCursor = (function(TheRequest) {

    return function(cursorRequest) {
        var request = new TheRequest(null, cursorRequest.source, cursorRequest.transaction);
        var count = 0;

        cursorRequest.onsuccess = function(e) {
            if (TheRequest.__resultValid(cursorRequest)) {
                ++count;
                cursorRequest.result["continue"]();
            } else {
                request.__notifyOnSuccess(count,e);
            }
        };
        cursorRequest.onerror = function(e) {
            request.__notifyOnError(cursorRequest.error,e);
        };
        request.__setOwnerOf(cursorRequest);
        return request;
    };

})(MyRequest);
var updateByCursor = (function(TheRequest, ObjectStore, Index) {

    /**
     * Create a new update function. The update function takes a value
     * 
     * @param cursorRequest
     *            an existing cursor request
     * @param updateFN
     *            the update function
     */
    var updateAll = function(cursorRequest, updateFN) {

        var request = new TheRequest(null, cursorRequest.source, cursorRequest.transaction);

        var nOutstanding = 1; // init to 1 to account for the cursor
        var result = {
            successes : 0,
            errors : 0
        };

        var notifyWhenDone = function() {
            if (--nOutstanding === 0) {
                request.__notifyOnSuccess(result);
            }
            if (nOutstanding < 0) {
                throw new Error("Internal error; mismatched calls");
            }
        };

        var onsuccess = function(e) {
            ++result.successes;
            notifyWhenDone();
        };

        var onerror = function(e) {
            // if the user provides an error handler for a batch request,
            // we need to invoke it to all the user to cancel the transaction
            // if will be aborted, then we return immediately
            if (request.__notifyOnError("update failed", e)) {

                if (!e.defaultPrevented) {
                    // drop out at this point
                    return;
                }
            }

            e.preventDefault();
            e.stopPropagation();
            ++result.errors;
            notifyWhenDone();
        };

        cursorRequest.onsuccess = function(e) {
            var updateRequest;
            if (TheRequest.__invalidResult(cursorRequest)) {
                notifyWhenDone();
                return;
            }

            try {
                var value = cursorRequest.result.value;
                if (value === undefined) {
                    console.log("Not a cursor with values");
                    ++result.errors;

                    // we do not continue beyond here since this isn't a cursor with values
                    notifyWhenDone();
                    return;
                }

                var newValue = updateFN(value);
                if (newValue === undefined) {
                    // console.log("DELETE "+cursorRequest.result.primaryKey);
                    updateRequest = cursorRequest.result["delete"]();
                } else if (newValue !== null) {
                    // console.log("UPDATE "+cursorRequest.result.primaryKey);
                    updateRequest = cursorRequest.result.update(newValue);
                } else {
                    updateRequest = null;
                }

                if (updateRequest !== null) {
                    updateRequest.onsuccess = onsuccess;
                    updateRequest.onerror = onerror;
                    ++nOutstanding;
                }
                cursorRequest.result["continue"]();
            } catch (error) {
                console.log(error);
                ++result.errors;
                notifyWhenDone();
            }

        };
        cursorRequest.onerror = function(e) {
            request.__notifyOnError("Cursor Failed", e);
        };

        request.__setOwnerOf(cursorRequest);
        return request;
    };

    var update = function() {
        var fn = [].shift.call(arguments);
        var req = this.openCursor.apply(this, arguments);
        return updateAll(req, fn);
    };

    ObjectStore.prototype.update = update;
    Index.prototype.update = update;

    return updateAll;

})(MyRequest, MyObjectStore, MyIndex);
var deleteByCursor = (function(TheRequest) {

    var updateFN = function() {
        return undefined;
    };

    return function(cursorRequest) {
        return updateByCursor(cursorRequest, updateFN);
    };

})(MyRequest);
var getByCursor = (function(TheRequest) {

    return function(cursorRequest) {

        var request = new TheRequest(null, cursorRequest.source, cursorRequest.transaction);

        cursorRequest.onsuccess = function(e) {
            if (TheRequest.__resultValid(cursorRequest)) {
                request.__notifyOnSuccess(cursorRequest.result.value,e);
            } else {
                request.__notifyOnSuccess(undefined,e);
            }
        };
        cursorRequest.onerror = function(e) {
            request.__notifyOnError(cursorRequest.error,e);
        };
        
        request.__setOwnerOf(cursorRequest);

        return request;
    };

})(MyRequest);
var getKeyByCursor = (function(TheRequest) {

    return function(cursorRequest) {

        var request = new TheRequest(null, cursorRequest.source, cursorRequest.transaction);

        cursorRequest.onsuccess = function(e) {
            if (TheRequest.__resultValid(cursorRequest)) {
                request.__notifyOnSuccess(cursorRequest.result.key,e);
            } else {
                request.__notifyOnSuccess(undefined,e);
            }
        };
        cursorRequest.onerror = function(e) {
            request.__notifyOnError(cursorRequest.error,e);
        };

        request.__setOwnerOf(cursorRequest);
        return request;
    };

})(MyRequest);
(function(TheRequest, ObjectStore) {

    var addPutAll = function(store, method, xarray) {

        var array = [ null ];
        if (xarray.length == 2) {
            array.push(xarray[1]);
        }

        var objects = xarray[0];

        var request = new TheRequest(null, store, store.transaction);
        var i, n, addRequest;
        var nOutstanding = 0;

        var result = {
            total : 0,
            successes : 0,
            errors : 0
        };

        var notifyWhenDone = function() {
            if (--nOutstanding === 0) {
                request.__notifyOnSuccess(result);
            }
            if (nOutstanding < 0) {
                throw new Error("Internal error; mismatched calls");
            }
        };

        var onsuccess = function(e) {
            ++result.successes;
            notifyWhenDone();
        };

        var onerror = function(e) {
            // if the user provides an error handler for a batch request,
            // we need to invoke it to all the user to cancel the transaction
            // if will be aborted, then we return immediately
            if (request.__notifyOnError("Update failed", e)) {

                if (!e.defaultPrevented) {
                    // drop out at this point
                    return;
                }
            }

            e.preventDefault();
            e.stopPropagation();

            ++result.errors;
            notifyWhenDone();
        };

        // TODO: we may want to be even more special here and do things in batches
        var updateFN = store[method];
        for (i = 0, n = objects.length; i < n; ++i) {
            array[0] = objects[i];
            try {
                addRequest = updateFN.apply(store, array);
                ++nOutstanding;
                addRequest.onsuccess = onsuccess;
                addRequest.onerror = onerror;
            } catch (error) {
                // the the request for now
                ++result.errors;
                throw request;
            }
        }
        result.total = nOutstanding;

        return request;
    };

    ObjectStore.prototype.addAll = function() {
        return addPutAll(this, "add", arguments);
    };

    ObjectStore.prototype.putAll = function() {
        return addPutAll(this, "put", arguments);
    };

})(MyRequest, MyObjectStore);
(function(TheRequest,ObjectStore,Index) {

    var getAll = function(cursorRequest) {

        var request = new TheRequest(null, cursorRequest.source, cursorRequest.transaction);
        var result = [];

        cursorRequest.onsuccess = function(e) {
            if (TheRequest.__invalidResult(cursorRequest)) {
                request.__notifyOnSuccess(result,e);
            } else {
                result.push(cursorRequest.result.value);
                cursorRequest.result["continue"]();
            }
        };
        cursorRequest.onerror = function(e) {
            request.__notifyOnError(cursorRequest.error,e);
        };

        request.__setOwnerOf(cursorRequest);
        
        return request;
    };

    var get = function() {
        var req = this.openCursor.apply(this, arguments);
        return getAll(req);
    };

    ObjectStore.prototype.getAll = get;
    Index.prototype.getAll = get;

})(MyRequest,MyObjectStore,MyIndex);
(function(TheRequest, Factory, ObjectStore, Index) {

    var getAll = function(cursorRequest) {

        var request = new TheRequest(null, cursorRequest.source, cursorRequest.transaction);
        var result = [];

        cursorRequest.onsuccess = function(e) {
            var n = result.length;
            var key;
            if (TheRequest.__invalidResult(cursorRequest)) {
                request.__notifyOnSuccess(result, e);
            } else {
                key = cursorRequest.result.key;
                if (n === 0 || Factory.cmp(result[n - 1], key) !== 0) {
                    result.push(key);
                }
                cursorRequest.result["continue"]();
            }
        };
        cursorRequest.onerror = function(e) {
            request.__notifyOnError(cursorRequest.error, e);
        };

        request.__setOwnerOf(cursorRequest);

        return request;
    };

    ObjectStore.prototype.getAllKeys = function() {
        var req = this.openCursor.apply(this, arguments);
        return getAll(req);
    };

    Index.prototype.getAllKeys = function() {
        var req = this.openKeyCursor.apply(this, arguments);
        return getAll(req);
    };

})(MyRequest, FACTORY, MyObjectStore, MyIndex);
(function(TheRequest, Factory, ObjectStore, Index) {

    var objectToArray = function(obj) {
        var res = [];
        var key = null;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                res.push(obj[key]);
            }
        }
        res.sort(Factory.cmp);
        return res;
    };

    var getAll = function(cursorRequest) {

        var request = new TheRequest(null, cursorRequest.source, cursorRequest.transaction);
        var result = {};

        cursorRequest.onsuccess = function(e) {
            var key;
            if (TheRequest.__invalidResult(cursorRequest)) {
                request.__notifyOnSuccess(objectToArray(result), e);
            } else {
                key = cursorRequest.result.primaryKey;
                if (!result.hasOwnProperty(key)) {
                    result[key] = key;
                }
                cursorRequest.result["continue"]();
            }
        };
        cursorRequest.onerror = function(e) {
            request.__notifyOnError(cursorRequest.error, e);
        };

        request.__setOwnerOf(cursorRequest);
        return request;
    };

    ObjectStore.prototype.getAllPrimaryKeys = function() {
        var req = this.openCursor.apply(this, arguments);
        return getAll(req);
    };

    Index.prototype.getAllPrimaryKeys = function() {
        var req = this.openKeyCursor.apply(this, arguments);
        return getAll(req);
    };

})(MyRequest, FACTORY, MyObjectStore, MyIndex);
var MyQuery = (function(copy, extend, TheRequest, Factory, Options, KeyPath, KeySet, createKeyRange) {
    var compareKeys = Factory.cmp;

    var createIndex = function(obj, name) {
        var tmp = {
            name : name,
            conditions : null,
            keyValue : null,
        };
        tmp.index = obj;
        tmp.keyPath = new KeyPath(obj.keyPath);
        tmp.nPaths = tmp.keyPath.paths.length;

        if (tmp.nPaths > 1) {
            console.log("Warning : multi-indexes not really supported at this time");
            return null;
        }
        return tmp;
    };

    // collect the indexes for the store and build a structure that we can more easily query
    var createIndexes = function(store) {
        var res = [];
        var i, n, name, names = store.indexNames, tmp;

        for (i = 0, n = names.length; i < n; ++i) {
            name = names.item(i);
            tmp = createIndex(store.index(name), name);
            if (tmp !== null) {
                res.push(tmp);
            }
        }

        res.sort(function(a, b) {
            return a.nPaths > b.nPaths ? -1 : (a.nPaths < b.nPaths ? 1 : 0);
        });

        return res;
    };

    var createKeyValue = function(index, conditions) {
        var kp = null, value = null;
        for (kp in conditions) {
            if (conditions.hasOwnProperty(kp)) {
                value = conditions[kp];
            }
        }
        return value;
    };

    // assign conditions to indexes;
    var assignIndex = function(index, allConditions, unassigned) {
        var i, p, atLeast1Unassigned = false;
        var range;
        var res = [];
        for (i = 0; i < index.nPaths; ++i) {
            p = index.keyPath.paths[i];
            range = allConditions[p];
            if (range instanceof MyKeySet || range instanceof MyKeyRange) {
                res.push(index.keyPath.paths[i]);
            } else {
                // not a usable condition
                return;
            }
        }

        // check that at least one of the assigned conditions is still unassigned overall
        for (i = 0; i < res.length; ++i) {
            if (unassigned[res[i]]) {
                atLeast1Unassigned = true;
                break;
            }
        }

        // one of the conditions is still unassigned, so we might as well use it here
        if (atLeast1Unassigned) {
            // first, collect all conditions
            index.conditions = {};
            for (i = 0; i < res.length; ++i) {
                // this needs to be done in the right order for multi-indexes
                index.conditions[res[i]] = allConditions[res[i]];
            }
            // create a key that we can use for the actual quer
            index.keyValue = createKeyValue(index, index.conditions);

            // and upon a successful query creation we can mark the conditions as unassigned
            if (index.keyValue !== null) {
                for (i = 0; i < res.length; ++i) {
                    delete unassigned[res[i]];
                }
            }
        }
    };

    // assign conditions to indexes in a somewhat optimal way
    // returns conditions that cannot be satisfied by an index query
    var assignConditions = function(indexes, allConditions) {
        var unassigned = {};
        var key = null, i;

        // mark all conditions are unassigned
        for (key in allConditions) {
            if (allConditions.hasOwnProperty(key)) {
                unassigned[key] = true;
            }
        }
        for (i = 0; i < indexes.length; ++i) {
            assignIndex(indexes[i], allConditions, unassigned);
        }

        for (key in unassigned) {
            if (unassigned.hasOwnProperty(key)) {
                unassigned[key] = allConditions[key];
            }
        }
        return unassigned;
    };

    var assignStoreQuery = function(store, allConditions) {
        if (store.keyPath === null) {
            return null;
        }
        var range = allConditions[store.keyPath];
        if (range) {
            delete allConditions[store.keyPath];
            return range;
        }
        return null;
    };

    var intersectArrays = function(a, b) {
        var res = [];
        var i = 0, j = 0, nA = a.length, nB = b.length, cmp;
        while (i < nA && j < nB) {
            cmp = compareKeys(a[i], b[j]);
            if (cmp === 0) {
                res.push(a[i]);
                ++i;
                ++j;
            } else if (cmp < 0) {
                ++i;
            } else if (cmp > 0) {
                ++j;
            }
        }

        return res;
    };

    // start executing requests against the individual indexes
    var startIndexQueries = function(store, indexes, includedKeys, excludedKeys) {

        var nOutstanding = 0;
        var allKeys = includedKeys === null ? null : includedKeys.keys;
        var firstError = false;

        var opts = new Options({
            includedPrimaryKeys : includedKeys || null,
            excludedPrimaryKeys : excludedKeys || null
        });

        var request = null;

        var onsuccess = function(req) {
            return function(e) {
                if (firstError) {
                    // an error has already been returned
                    return;
                }

                if (allKeys === null) {
                    allKeys = req.result;
                } else {
                    allKeys = intersectArrays(allKeys, req.result);
                }
                if (--nOutstanding === 0) {
                    request.__notifyOnSuccess(allKeys);
                }
            };
        };

        var onerror = function(req) {
            return function(e) {

                allKeys = [];
                --nOutstanding;
                if (firstError === false) {
                    firstError = true;
                    request.__notifyOnError(req.error, e);
                } else {
                    e.preventDefault();
                    e.stopPropagation();
                }
            };
        };

        var i, req, index;
        for (i = 0; i < indexes.length; ++i) {
            index = indexes[i];
            if (index.keyValue !== null) {
                if (request === null) {
                    request = new TheRequest(null, store, store.transaction);
                }
                req = index.index.getAllPrimaryKeys(index.keyValue, opts);
                request.__setOwnerOf(req);
                req.onsuccess = onsuccess(req);
                req.onerror = onerror(req);
                ++nOutstanding;
            }
        }

        return request;
    };

    var createFilterFunction = function(keypath, range, otherFilterFN) {
        keypath = new KeyPath(keypath);

        if (keypath.paths.length !== 1) {
            throw new Error("No a simple keypath");
        }

        var p = keypath.paths[0];

        // create a range from a values objects

        if (otherFilterFN) {
            return function(cursor) {
                var v;
                if (!otherFilterFN(cursor)) {
                    return false;
                }
                v = keypath.applyPath(cursor.value);
                return v.hasOwnProperty(p) && range.contains(v[p]);
            };
        } else {
            return function(cursor) {
                var v = keypath.applyPath(cursor.value);
                return v.hasOwnProperty(p) && range.contains(v[p]);
            };
        }
    };

    var createFilter = function(unassigned, fn) {
        fn = fn || null;
        var keypath = null;
        for (keypath in unassigned) {
            if (unassigned.hasOwnProperty(keypath)) {
                fn = createFilterFunction(keypath, unassigned[keypath], fn);
            }
        }
        return fn;
    };

    var TheQuery = function(conditions, options) {
        var kp = null, cond = null;
        this.__conditions = {};
        for (kp in conditions) {
            if (conditions.hasOwnProperty(kp)) {
                cond = conditions[kp];
                this.__conditions[kp] = createKeyRange(cond);
            }
        }
        options = options || {};
        this.__includedPrimaryKeys = options.includedPrimaryKeys || null;
        this.__excludedPrimaryKeys = options.excludedPrimaryKeys || null;
    };

    var openCursor = function(store, query, range, options) {
        return store.openCursor(range, options);
    };

    TheQuery.prototype.__openCursor = function(store, options) {
        var indexes = createIndexes(store);
        var xrange = assignStoreQuery(store, this.__conditions);
        var unassigned = assignConditions(indexes, this.__conditions);
        var filter = createFilter(unassigned, this.__filter);
        var primaryKeys = startIndexQueries(store, indexes, this.__includedPrimaryKeys, this.__excludedPrimaryKeys);
        var request = null;

        if (filter) {
            if (options.filter) {
                var optFilter = options.filter;
                filter = function(x) {
                    return filter(x) && optFilter(x);
                };
            }
            // create new options
            options = new Options(extend({}, options, {
                filter : filter
            }));
        }

        if (primaryKeys === null) {
            request = openCursor(store, this, xrange, options);
        } else {

            request = new TheRequest(null, store, store.transaction);
            request.__setOwnerOf(primaryKeys);

            primaryKeys.onsuccess = function(e) {
                var allKeys = primaryKeys.result;
                var range = xrange;
                if (allKeys.length === 0) {
                    request.__readyState = "done";
                    request.__notifyOnSuccess(null);
                    return;
                }
                if (range === null) {
                    range = new KeySet(allKeys);
                    allKeys = null;
                } else {
                    options = new Options(extend({}, options, {
                        includedPrimaryKeys : allKeys
                    }));
                }
                request.__setImpl(openCursor(store, this, range, options));
            };
            primaryKeys.onError = function(e) {
                request.__notifyOnError(primaryKeys.request, e);
            };
        }

        return request;
    };

    return TheQuery;

})(shallow_copy, extend, MyRequest, FACTORY, MyOptions, MyKeyPath, MyKeySet, createKeyRange);
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
window.Nigiri = {
    IndexedDB : FACTORY,
    KeyRange : MyKeyRange,
    KeyPath : MyKeyPath,
    KeySet : MyKeySet,
    Query : MyQuery,
    Options : MyOptions
};
 })(window);