var createGenericCursorRequest = (function(MyRequest, MyCursor, MyOptions, findByBinarySearch, compare) {

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
})(MyRequest, MyCursor, MyOptions, findByBinarySearch, FACTORY.cmp);