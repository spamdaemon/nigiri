zone("nigiri.extension").factory("-MyOptions", [ "Utils" ], function(Utils) {
    "use strict"

    var arrayOrNull = function(array) {
        return array === null || array.length === 0 ? null : array;
    };

    var TheOptions = function(opts) {
        var i, n;
        Utils.extend(this, Utils.shallow_copy(opts || {}));

        this.isDefault = true;
        this.isStandard = true;

        if (!this.hasOwnProperty("unique") || !this.unique) {
            this.unique = false;
        }
        this.isDefault = this.isDefault && this.unique === false;
        this.isStandard = this.isStandard && this.unique === false;

        if (!this.hasOwnProperty("filter")) {
            this.filter = null;
        }
        this.isDefault = this.isDefault && this.filter === null;
        this.isStandard = this.isStandard && this.filter === null;

        if (!this.hasOwnProperty("terminate")) {
            this.terminate = null;
        }
        this.isDefault = this.isDefault && this.terminate === null;
        this.isStandard = this.isStandard && this.terminate === null;

        if (!this.hasOwnProperty("limit")) {
            this.limit = -1;
        }
        this.isDefault = this.isDefault && this.limit < 0;
        this.isStandard = this.isStandard && this.limit < 0;
        if (!this.hasOwnProperty("offset")) {
            this.offset = 0;
        }
        this.isDefault = this.isDefault && this.offset === 0;
        this.isStandard = this.isStandard && this.offset === 0;
        if (!this.hasOwnProperty("direction")) {
            this.direction = "next";
        }
        this.isDefault = this.isDefault && this.direction === "next";
        if (!this.hasOwnProperty("withValues")) {
            this.withValues = true;
        }

        if (!this.hasOwnProperty("excludedPrimaryKeys")) {
            this.excludedPrimaryKeys = null;
        }
        this.excludedPrimaryKeys = arrayOrNull(this.excludedPrimaryKeys);

        this.isDefault = this.isDefault && this.excludedPrimaryKeys === null;
        this.isStandard = this.isStandard && this.excludedPrimaryKeys === null;

        if (!this.hasOwnProperty("excludedKeys")) {
            this.excludedKeys = null;
        }
        this.excludedKeys = arrayOrNull(this.excludedKeys);
        this.isDefault = this.isDefault && this.excludedKeys === null;
        this.isStandard = this.isStandard && this.excludedKeys === null;

        if (!this.hasOwnProperty("includedPrimaryKeys")) {
            this.includedPrimaryKeys = null;
        }
        this.includedPrimaryKeys = arrayOrNull(this.includedPrimaryKeys);
        this.isDefault = this.isDefault && this.includedPrimaryKeys === null;
        this.isStandard = this.isStandard && this.includedPrimaryKeys === null;

        if (!this.hasOwnProperty("includedKeys")) {
            this.includedKeys = null;
        }
        this.includedKeys = arrayOrNull(this.includedKeys);
        this.isDefault = this.isDefault && this.includedKeys === null;
        this.isStandard = this.isStandard && this.includedKeys === null;

        Object.freeze(this);
    };

    TheOptions.prototype.getOptions = function() {
        return Utils.shallow_copy(this);
    };

    return TheOptions;
});
