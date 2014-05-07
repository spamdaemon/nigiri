zone("nigiri").protectedFactory("MyRequest", [ "MyDBEventTarget", "addEventHandlerProperty", "createSuccessEvent", "createErrorEvent", "Utils" ],
        function(EventTargetImpl, addEventHandlerProperty, createSuccessEvent, createErrorEvent, Utils) {

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

                this.__wrapResult = resultWrapper || Utils.IDENTITY_FUNCTION;

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
        });