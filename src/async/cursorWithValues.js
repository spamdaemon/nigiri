var MyCursorWithValues = function(idbCursor, source, transaction) {
    MyCursor.call(this, idbCursor, source, transaction);
    this.__impl = idbCursor;
    this.__source = source;
};

MyCursorWithValues.prototype = Object.create(MyCursor.prototype);
MyCursorWithValues.prototype.constructor = MyCursorWithValues;

addConstAttribute(MyCursorWithValues.prototype, "value");
