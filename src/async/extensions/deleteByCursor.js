var deleteByCursor = (function(TheRequest) {

    var updateFN = function() {
        return undefined;
    };

    return function(cursorRequest) {
        return updateByCursor(cursorRequest, updateFN);
    };

})(MyRequest);
