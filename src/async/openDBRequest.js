zone("nigiri").factory("#MyOpenDBRequest", [ "EventWrapper", "MyRequest", "MyTransaction", "MyDatabase", "addEventHandlerProperty" ],
        function(EventWrapper, RequestBaseClass, Transaction, Database, addEventHandlerProperty) {
            "use strict"

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
        });
