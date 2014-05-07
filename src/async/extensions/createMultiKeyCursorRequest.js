zone("nigiri.extension").protectedFactory("createMultiKeyCursorRequest", [ "Utils", "createGenericCursorRequest", "MyOptions", "nigiri.cmp" ],
        function(Utils, createGenericCursorRequest, MyOptions, compareKeys) {

            var createState = function(multikey, direction) {
                var state = {
                    key : multikey
                };

                if (direction === 'prev' || direction === 'prevunique') {
                    state.next = function(key) {
                        return multikey.floor(key);
                    };
                } else {
                    state.next = function(key) {
                        return multikey.ceiling(key);
                    };
                }
                return state;
            };

            var syncWithMultiKey = function(cursor, state) {

                var actualKey, expectedKey;

                actualKey = cursor.key;

                // check if we need to emit this key
                if (state.key.contains(actualKey)) {
                    return true;
                }

                // get the expected key
                expectedKey = state.next(actualKey);

                if (expectedKey !== undefined) {
                    cursor["continue"]( expectedKey );
                }
                return false;
            };

            return function(impl, source, transaction, multikey, opts) {
                var options = new MyOptions(opts).getOptions();
                options.iterationState = createState(multikey, opts.direction);
                options.sync = syncWithMultiKey;

                return createGenericCursorRequest(impl, source, transaction, new MyOptions(options));
            };

        });