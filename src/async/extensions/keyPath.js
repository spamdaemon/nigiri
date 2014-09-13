zone("nigiri.extension").factory("-MyKeyPath", [ "Utils" ], function(Utils) {
    "use strict"

    var applyKeyPath = function(path, object) {
        var i, n = path.length;
        for (i = 0; i < n; ++i) {
            object = object[path[i]];
            if (object === undefined) {
                throw "Incomplete path";
            }
        }
        return object;
    };

    var splitKeyPath = function(path) {
        // FIXME: needs to do a proper split on properties
        return path.split(".");
    };

    var MyKeyPath = function(paths) {

        var i, n, p, ps;
        if (!Utils.is_array(paths)) {
            paths = [ paths ];
        }
        this.__paths = Object.freeze(paths.slice(0));

        n = this.__paths.length;
        this.__parsedPaths = {};

        for (i = 0; i < n; ++i) {
            p = paths[i];
            ps = splitKeyPath(p);
            this.__parsedPaths[p] = ps;
        }
    };

    Utils.addConstProperty(MyKeyPath.prototype, "paths");

    MyKeyPath.prototype.applyPath = function(object) {
        var i, n = this.__paths.length, path, result = {};
        for (i = 0; i < n; ++i) {
            path = this.__paths[i];
            try {
                result[path] = applyKeyPath(this.__parsedPaths[path], object);
            } catch (incompletePath) {
                // ignore
            }
        }
        return result;
    };

    MyKeyPath.applyPath = function(stringOrArray, object) {
        var i, n, res;
        if (Utils.is_array(stringOrArray)) {
            res = [];
            for (i = 0, n = stringOrArray.length; i < n; ++i) {
                try {
                    res.push(applyKeyPath(splitKeyPath(stringOrArray[i])));
                } catch (undefinedPath) {
                    res.push(undefined);
                }
            }
        } else {
            try {
                res = applyKeyPath(splitKeyPath(stringOrArray));
            } catch (undefinedPath) {
                return undefined;
            }
        }
        return res;
    };
    return MyKeyPath;
});
