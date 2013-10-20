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
