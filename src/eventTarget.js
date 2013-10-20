var MyGenericEventListener = function(type, listener, useCapture) {
    this.__type = type;
    this.__listener = listener;
    this.__useCapture = useCapture;
    this.__actualListener = listener;
    if (listener.handleEvent) {
        this.__actualListener = function(e) {
            return listener.handleEvent(e);
        };
    }
};

var MyGenericEventTarget = function(impl) {
    WrapperObject.call(this,impl);
    this.__listeners = [];
};

MyGenericEventTarget.prototype = Object.create(WrapperObject.prototype);
MyGenericEventTarget.prototype.constructor = MyGenericEventTarget;

MyGenericEventTarget.prototype.addEventListener = function(type, listener, useCapture) {

    var i, n = this.__listeners.length;
    var l;

    for (i = 0; i < n; ++i) {
        l = this.__listeners[i];
        if (l.__type === type && l.__listener === listener && useCapture == l.__useCapture) {
            // already added the listener
            return;
        }
    }

    this.__listeners.push(new MyGenericEventListener(type, listener, useCapture));
};

MyGenericEventTarget.prototype.removeEventListener = function(type, listener, useCapture) {
    var i, n = this.__listeners.length;
    var l;

    for (i = 0; i < n; ++i) {
        l = this.__listeners[i];
        if (l.__type === type && l.__listener === listener && useCapture == l.__useCapture) {
            this.__listeners.splice(i, 1);
            return;
        }
    }
};

MyGenericEventTarget.prototype.dispatchEvent = function(event) {
    var i, n = this.__listeners.length;
    var listeners;

    if (n === 0) {
        return;
    }
    listeners = this.__listeners.slice(0);
    for (i = 0; i < n; ++i) {
        listeners[i].call(this, event);
    }
    return !event.__doNotPreventDefault;
};

var MyDBEventTarget = function(impl) {
    MyGenericEventTarget.call(this,impl);
    this.__handlers = {};

    // implementation handlers store the callback for the implementation until
    // such time that the implemntation becomes available.
    this.__implHandlers = impl ? null : {};
};

MyDBEventTarget.prototype = Object.create(MyGenericEventTarget.prototype);
MyDBEventTarget.prototype.constructor = MyDBEventTarget;


MyDBEventTarget.prototype.__setImpl = function(impl) {
    WrapperObject.prototype.__setImpl.call(this,impl);
    
    var name = null;
    if (this.__implHandlers !== null) {
        for (name in this.__implHandlers) {
            if (this.__implHandlers.hasOwnProperty(name)) {
                impl[name] = this.__implHandlers[name];
            }
        }
    }
    this.__implHandlers = null;
};

MyDBEventTarget.prototype.__wrapEvent = function(event)
{
    return new EventWrapper(event);
};


MyDBEventTarget.prototype.__getCallback = function(name) {
    return this.__handlers[name] || null;
};

MyDBEventTarget.prototype.__clearCallback = function(name) {
    delete this.__handlers[name];
    if (this.__impl) {
        this.__impl[name] = null;
    } else {
        delete this.__implHandlers[name];
    }
};

MyDBEventTarget.prototype.__setCallback = function(name, cb, implCB) {

    var target = this;
    if (!implCB) {
        implCB = cb;
    }

    var registeredCB = function(e) {
        var event = target.__wrapEvent(e);
        implCB(event);
        target.dispatchEvent(event);
    };

    if (this.__impl) {
        this.__impl[name] = registeredCB;
    } else {
        this.__implHandlers[name] = registeredCB;
    }
    this.__handlers[name] = cb;
};

var addEventHandlerProperty = function(prototype, name) {
    Object.defineProperty(prototype, name, {
        get : function() {
            return this.__getCallback(name);
        },
        set : function(fn) {
            if (fn) {
                this.__setCallback(name, fn);
            } else {
                this.__clearCallback(name);
            }
        }
    });
};
