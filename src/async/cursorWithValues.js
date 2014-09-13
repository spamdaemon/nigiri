zone("nigiri").factory("#MyCursorWithValues", [ "MyCursor", "Utils" ], function(MyCursor, Utils) {
    "use strict"
    var MyCursorWithValues = function(idbCursor, source, transaction) {
        MyCursor.call(this, idbCursor, source, transaction);
        this.__impl = idbCursor;
        this.__source = source;
    };

    MyCursorWithValues.prototype = Object.create(MyCursor.prototype);
    MyCursorWithValues.prototype.constructor = MyCursorWithValues;

    Utils.addConstAttribute(MyCursorWithValues.prototype, "value");

    return MyCursorWithValues;
});
