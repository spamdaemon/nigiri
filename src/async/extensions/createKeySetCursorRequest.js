zone("nigiri.extension").protectedFactory("createKeySetCursorRequest", [ "nigiri.cmp", "Utils", "createGenericCursorRequest", "MyOptions" ],
        function(compare, Utils, createGenericCursorRequest, MyOptions) {

            var prevSort = function(a, b) {
                return compare(b, a);
            };

            var createState = function(keyset, direction) {
                var state = {
                    keys : keyset.__keys,
                    pos : 0,
                    nextKey : 0,
                    compare : compare
                };

                if (direction === 'prev' || direction === 'prevunique') {
                    state.compare = prevSort;
                    state.keys = state.keys.slice(0).sort(prevSort);
                }
                return state;
            };

            var setPosition = function(state, key) {
                state.pos = Utils.binarySearch(state.keys, state.compare, state.pos, key);
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
                        throw new Error("Actual key exceeds the range of the keyset " + actualKey);
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
                return false;
            };

            return function(impl, source, transaction, keyset, opts) {

                var options = new MyOptions(opts).getOptions();
                options.iterationState = createState(keyset, opts.direction);
                options.sync = syncWithKeyset;

                return createGenericCursorRequest(impl, source, transaction, new MyOptions(options));
            };

        });