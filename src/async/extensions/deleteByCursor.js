zone("nigiri.extension").factory("-deleteByCursor", [ "MyRequest", "updateByCursor" ], function(TheRequest, updateByCursor) {
    "use strict"

    var updateFN = function() {
        return undefined;
    };

    return function(cursorRequest) {
        return updateByCursor(cursorRequest, updateFN);
    };

});
