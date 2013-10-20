var MyQuery = (function(copy, extend, TheRequest, Factory, KeyPath, KeySet, createKeyRange) {
    var compareKeys = Factory.cmp;

    // collect the indexes for the store and build a structure that we can more easily query
    var createIndexes = function(store) {
        var res = [];
        var i, n, names = store.indexNames, tmp;

        for (i = 0, n = names.length; i < n; ++i) {
            tmp = {
                name : names.item(i),
                conditions : null,
                keyValue : null
            };
            tmp.index = store.index(tmp.name);
            tmp.keyPath = new KeyPath(tmp.index.keyPath);
            tmp.nPaths = tmp.keyPath.paths.length;

            if (tmp.nPaths > 1) {
                console.log("Warning : multi-indexes not really supported at this time");
                continue;
            }

            res.push(tmp);
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
    var startIndexQueries = function(store, indexes, initialKeys) {

        var nOutstanding = 0;
        var allKeys = initialKeys === null ? null : initialKeys.keys;
        var firstError = false;

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
                req = index.index.getAllPrimaryKeys(index.keyValue);
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
        this.__primaryKeys = options.primaryKeys || null;
    };

    var openCursor = function(store, query, range, options) {
        return store.openCursor(range, options);
    };

    TheQuery.prototype.__openCursor = function(store, options) {
        var indexes = createIndexes(store);
        var unassigned = assignConditions(indexes, this.__conditions);
        var filter = createFilter(unassigned, this.__filter);
        var primaryKeys = startIndexQueries(store, indexes, this.__primaryKeys);
        var request = null;
        var range = null;

        if (filter) {
            if (options.filter) {
                var optFilter = options.filter;
                filter = function(x) {
                    return filter(x) && optFilter(x);
                };
            }
            // create new options
            options = new MyOptions(extend({}, options, {
                filter : filter
            }));
        }

        if (primaryKeys === null) {
            request = openCursor(store, this, range, options);
        } else {
            request = new TheRequest(null, store, store.transaction);
            request.__setOwnerOf(primaryKeys);

            primaryKeys.onsuccess = function(e) {
                var allKeys = primaryKeys.result;
                if (allKeys.length === 0) {
                    request.__readyState = "done";
                    request.__notifyOnSuccess(null);
                } else {
                    var range = new KeySet(allKeys);
                    request.__setImpl(openCursor(store, this, range, options));
                }
            };
            primaryKeys.onError = function(e) {
                request.__notifyOnError(primaryKeys.request, e);
            };
        }

        return request;
    };

    return TheQuery;

})(shallow_copy, extend, MyRequest, FACTORY, MyKeyPath, MyKeySet, createKeyRange);
