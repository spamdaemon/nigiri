/**
 * This object is used for objects that wrap a native object.
 */
zone("nigiri").factory("WrapperObject",function() {

    var setImpl = function(object, impl) {
        if (!impl) {
            throw new Error("No implementation provided");
        }
        if (object.__impl) {
            throw new Error("Implementation already set");
        }
        // set the implementation to the wrapped object
        object.__impl = impl;
        object.__nativeImpl = impl;

        // get the native object that is ultimately being wrapped
        if (impl instanceof TheWrapper) {
            object.__nativeImpl = impl.__nativeImpl;
        }
        if (!object.__nativeImpl) {
            throw new Error("No native object being wrapped");
        }
        // reset the owner of the native object
        object.__nativeImpl.__owner = object;

        // if the object itself has an owner, then make the owned object the owner
        if (object.__owner) {
            setImpl(object.__owner, object.__nativeImpl);
        }
    };

    var setOwnerOf = function(object, impl) {
        if (!impl) {
            throw new Error("No implementation provided");
        }

        if (impl instanceof TheWrapper && impl.__nativeImpl) {
            impl = impl.__nativeImpl;
        }

        impl.__owner = object;
    };

    var TheWrapper = function(impl) {

        this.__impl = null;
        if (impl) {
            setImpl(this, impl);
        }
    };

    TheWrapper.prototype.__setImpl = function(impl) {
        setImpl(this, impl);
    };

    TheWrapper.prototype.__setOwnerOf = function(impl) {
        setOwnerOf(this, impl);
    };

    TheWrapper.prototype.__getNativeImpl = function() {
        if (this.__nativeImpl) {
            return this.__nativeImpl;
        } else {
            throw new Error("No native implementation set");
        }
    };

    /**
     * Get the owner of the native implementation object.
     * 
     * @returns a wrapper
     */
    TheWrapper.__getOwner = function(nativeObject) {
        if (nativeObject.__owner) {
            return nativeObject.__owner;
        }

        throw new Error("Owner of the native implementation has not been set");
    };

    return TheWrapper;
});
