zone("nigiri").protectedFactory("EventWrapper",["WrapperObject"], function(WrapperObject) {

    var TheWrapper = function(event) {
        WrapperObject.call(this, event);
        if (!event) {
            throw new Error("No event specified");
        }

    };

    TheWrapper.prototype = Object.create(WrapperObject.prototype);
    TheWrapper.prototype.constructor = TheWrapper;

    TheWrapper.prototype.stopPropagation = function() {
        this.__getNativeImpl().stopPropagation();
    };

    TheWrapper.prototype.stopPropagation = function() {
        this.__getNativeImpl().stopImmediatePropagation();
    };

    TheWrapper.prototype.preventDefault = function() {
        this.__getNativeImpl().preventDefault();
    };

    Object.defineProperty(TheWrapper.prototype, "type", {
        get : function() {
            return this.__getNativeImpl().type;
        }
    });

    Object.defineProperty(TheWrapper.prototype, "eventPhase", {
        get : function() {
            return this.__getNativeImpl().eventPhase;
        }
    });

    Object.defineProperty(TheWrapper.prototype, "bubbles", {
        get : function() {
            return this.__getNativeImpl().bubbles;
        }
    });

    Object.defineProperty(TheWrapper.prototype, "cancelable", {
        get : function() {
            return this.__getNativeImpl().cancelable;
        }
    });

    Object.defineProperty(TheWrapper.prototype, "defaultPrevented", {
        get : function() {
            return this.__getNativeImpl().defaultPrevented;
        }
    });

    Object.defineProperty(TheWrapper.prototype, "isTrusted", {
        get : function() {
            return this.__getNativeImpl().isTrusted;
        }
    });

    Object.defineProperty(TheWrapper.prototype, "timeStamp", {
        get : function() {
            return this.__getNativeImpl().timeStamp;
        }
    });

    Object.defineProperty(TheWrapper.prototype, "target", {
        get : function() {
            return WrapperObject.__getOwner(this.__getNativeImpl().target);
        }
    });

    Object.defineProperty(TheWrapper.prototype, "currentTarget", {
        get : function() {
            return WrapperObject.__getOwner(this.__getNativeImpl().currentTarget);
        }
    });

    return TheWrapper;

});

zone("nigiri").protectedFactory("createSuccessEvent", function() {

    var TheEvent = function(target) {
        var event = new CustomEvent("success", {
            bubbles : false,
            cancelable : false
        });

        this.__target = target;
        this.__currentTarget = target;
        this.__timeStamp = event.timeStamp;
        this.__defaultPrevented = false;
    };

    TheEvent.prototype.preventDefault = function() {
        this.__defaultPrevented = true;
    };
    TheEvent.prototype.stopPropagation = function() {
    };
    TheEvent.prototype.stopImmediatePropagation = function() {
    };

    Object.defineProperty(TheEvent.prototype, "type", {
        get : function() {
            return "success";
        }
    });

    Object.defineProperty(TheEvent.prototype, "eventPhase", {
        get : function() {
            return 0;
        }
    });

    Object.defineProperty(TheEvent.prototype, "bubbles", {
        get : function() {
            return false;
        }
    });

    Object.defineProperty(TheEvent.prototype, "cancelable", {
        get : function() {
            return false;
        }
    });

    Object.defineProperty(TheEvent.prototype, "defaultPrevented", {
        get : function() {
            return this.__defaultPrevented;
        }
    });

    Object.defineProperty(TheEvent.prototype, "isTrusted", {
        get : function() {
            return true;
        }
    });

    Object.defineProperty(TheEvent.prototype, "timeStamp", {
        get : function() {
            return this.__timeStamp;
        }
    });

    Object.defineProperty(TheEvent.prototype, "target", {
        get : function() {
            return this.__target;
        }
    });

    Object.defineProperty(TheEvent.prototype, "currentTarget", {
        get : function() {
            return this.__currentTarget;
        }
    });

    return function(target) {
        return new TheEvent(target);
    };
});

zone("nigiri").protectedFactory("createErrorEvent", function() {

    var TheEvent = function(target) {
        var event = new CustomEvent("error", {
            bubbles : false,
            cancelable : false
        });

        this.__target = target;
        this.__currentTarget = target;
        this.__timeStamp = event.timeStamp;
        this.__defaultPrevented = false;
    };

    TheEvent.prototype.preventDefault = function() {
        this.__defaultPrevented = true;
    };
    TheEvent.prototype.stopPropagation = function() {
    };
    TheEvent.prototype.stopImmediatePropagation = function() {
    };

    Object.defineProperty(TheEvent.prototype, "type", {
        get : function() {
            return "error";
        }
    });

    Object.defineProperty(TheEvent.prototype, "eventPhase", {
        get : function() {
            return 0;
        }
    });

    Object.defineProperty(TheEvent.prototype, "bubbles", {
        get : function() {
            return true;
        }
    });

    Object.defineProperty(TheEvent.prototype, "cancelable", {
        get : function() {
            return true;
        }
    });

    Object.defineProperty(TheEvent.prototype, "defaultPrevented", {
        get : function() {
            return this.__defaultPrevented;
        }
    });

    Object.defineProperty(TheEvent.prototype, "isTrusted", {
        get : function() {
            return true;
        }
    });

    Object.defineProperty(TheEvent.prototype, "timeStamp", {
        get : function() {
            return this.__timeStamp;
        }
    });

    Object.defineProperty(TheEvent.prototype, "target", {
        get : function() {
            return this.__target;
        }
    });

    Object.defineProperty(TheEvent.prototype, "currentTarget", {
        get : function() {
            return this.__currentTarget;
        }
    });

    return function(target) {
        return new TheEvent(target);
    };
});
