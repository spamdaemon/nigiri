zone("nigiri").factory("#MyTransaction", [ "MyDBEventTarget", "MyObjectStore", "addEventHandlerProperty", "Utils" ],
        function(MyDBEventTarget, MyObjectStore, addEventHandlerProperty, Utils) {
            "use strict"

            var MyTransaction = function(idbTransaction, db) {
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
            Utils.addConstProperty(MyTransaction.prototype, "db");
            Utils.addConstAttribute(MyTransaction.prototype, "mode");
            Utils.addConstAttribute(MyTransaction.prototype, "error");
            addEventHandlerProperty(MyTransaction.prototype, "onabort");
            addEventHandlerProperty(MyTransaction.prototype, "oncomplete");
            addEventHandlerProperty(MyTransaction.prototype, "onerror");

            return MyTransaction;
        });
