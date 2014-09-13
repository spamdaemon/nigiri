/**
 * A private object that maintains and creates modules.
 * 
 */
(function() {
    'use strict';

    if (this.zone) {
        console.log('Zone has already been defined');
        return this.zone;
    }

    var VERSION = '1.0';

    /** @const */
    var PRIVATE_ACCESS = 2;
    /** @const */
    var PROTECTED_ACCESS = 1;
    /** @const */
    var PUBLIC_ACCESS = 0;

    // all modules
    var MODULES = {};

    /**
     * Given a name, determine the access and type values.
     * 
     * @param {!string}
     *            name
     * @return {*} an object indicating the protected level and type
     */
    var parseName = function(name) {
        var result = {};
        switch (name[0]) {
        case '-':
            result.access = PRIVATE_ACCESS;
            result.name = name.substr(1);
            break;
        case '+':
            result.access = PUBLIC_ACCESS;
            result.name = name.substr(1);
            break;
        case '#':
            result.access = PROTECTED_ACCESS;
            result.name = name.substr(1);
            break;
        default:
            result.access = PUBLIC_ACCESS;
            result.name = name;
        }
        return result;
    };

    /**
     * Ensure that there is a minimum number of arguments.
     * 
     * @param {!Array|!Arguments}
     *            args
     * @param {!number}
     *            min the minimum number of arguments.
     */
    var ensureMinArgs = function(args, min) {
        if (!(args.length >= min)) {
            throw new Error('Expected at least ' + min + ' arguments, but got ' + args.length);
        }
    };

    /**
     * Check the argument length.
     * 
     * @param {!Array|!Arguments}
     *            args the arguments
     * @param {!number}
     *            min the minimum number of arguments
     * @param {!number}
     *            max the maximum number of arguments
     */
    var checkArguments = function(args, min, max) {
        ensureMinArgs(args, min);
        if (!(args.length <= max)) {
            throw new Error('Expected at most ' + max + ' arguments, but got ' + args.length);
        }
    };

    /**
     * Validate the name of an injectable function.
     * 
     * @param {!string}
     *            name a prefix
     * @param {!string}
     *            allowed the allowed characters
     * @param {!string}
     *            notAllowed the allowed characters
     * @throws error
     *             if the string is not a valid injection name
     */
    var validateInjectionParameterName = function(name, allowed, notAllowed) {
        var i, j, n, x = 0;
        for (i = 0, n = allowed.length; i < n; ++i) {
            j = name.indexOf(allowed[i]);

            if (j > 0) {
                throw new Error('Invalid injection parameter ' + name);
            }
            if (j === 0) {
                ++x;
                if (x > 1) {
                    throw new Error('Invalid injection parameter ' + name);
                }
            }
        }
        for (i = 0, n = notAllowed.length; i < n; ++i) {
            if (name.indexOf(notAllowed[i]) >= 0) {
                throw new Error('Invalid injection parameter ' + name);
            }
        }
    };

    /**
     * Create a fullname.
     * 
     * @param {!string}
     *            prefix a prefix
     * @param {!string}
     *            suffix a suffix
     * @return {!string} the concatenated name
     */
    var makeFullName = function(prefix, suffix) {
        if (prefix === '') {
            return suffix;
        }
        return prefix + '.' + suffix;
    };

    /**
     * Determine if an object is an array
     * 
     * @param {*}
     *            obj an object
     * @return {boolean} true if obj is an array
     */
    var isArray = Array['isArray'];

    if (!isArray) {
        // the built-in array isn't supported, so check for length only
        isArray = function(x) {
            return x.length >= 0;
        };
    }

    /**
     * Ensure that a name is a valid name for binding.
     * 
     * @param {!string}
     *            name a name
     * @throws {Error}
     *             if the name is already bound
     */
    var ensureValidName = function(name) {
        if (name.length === 0 || name.indexOf('.') >= 0) {
            throw new Error('Invalid name to bind ' + name);
        }
    };

    /**
     * Parse the formal parameters of a function. TODO: use AngularJS function here instead
     * 
     * @param {function(...[*])}
     *            f a function taking an variable number of parameters
     * @return {Array.<string>} a an array with the names of the formal parameters
     */
    var parseFormalParameters = function(f) {
        if (typeof f !== 'function') {
            throw new Error('Not a function: ' + f);
        }

        // find the argument names
        var fnString = f.toString();
        var args = fnString.match(/^\s*function\s*(?:\w*\s*)?\(([\s\S]*?)\)/);
        args = args ? (args[1] ? args[1].trim().split(/\s*,\s*/) : []) : null;

        if (args === null) {
            console.log('Failed to parse the function (perhaps it is too long?) : ' + fnString);
        }

        return args;
    };

    /**
     * The Module constructor function.
     * 
     * @constructor
     * @final
     * @param {!string}
     *            name the name of the module within the parent
     * @param {?Module}
     *            parent module
     * @param {Array=}
     *            opt_imports the imported modules
     */
    var Module = function(name, parent, opt_imports) {
        this.__children = {};
        this.__parent = parent;
        this.__imports = opt_imports;
        this.__sealed = false;
        this.__values = {};
        this.__interceptors = {};

        this.__fullName = name;

        if (parent) {
            if (parent.__children[name]) {
                throw new Error('Module ' + this.__fullName + ' already contains a module ' + name);
            }
            this.__fullName = makeFullName(parent.__fullName, name);
            parent.__children[name] = this;
        }
        MODULES[this.__fullName] = this;
    };

    var ROOT = new Module('', null, []);

    /**
     * Get the access that a module has with respect to another module.
     * 
     * @param {Module}
     *            source a module that needs access to the target module
     * @param {Module}
     *            target a module
     * @return {!number} an access level between two modules
     */
    var getAccess = function(source, target) {
        if (source === target) {
            return PRIVATE_ACCESS;
        }
        while (source && source !== target) {
            source = source.__parent;
        }
        return source === null ? PUBLIC_ACCESS : PROTECTED_ACCESS;
    };

    /**
     * Ensure that a modules does not already have a defined value.
     * 
     * @param {!Module}
     *            m a module
     * @param {!string}
     *            name a name
     * @throws {Error}
     *             if the name is already bound
     */
    var ensureNotExists = function(m, name) {
        if (m.__values[name]) {
            throw new Error('Name ' + name + ' already bound in ' + m.__fullName);
        }
    };

    /**
     * Ensure that the module is unsealed.
     * 
     * @param {!Module}
     *            m a module
     * @throws {Error}
     *             if the module is already sealed
     */
    var ensureUnsealed = function(m) {
        if (m.__sealed) {
            throw new Error('Module ' + m.__fullName + ' is sealed');
        }
    };

    /**
     * Find a module by searching either from the start or the root. A search is performed from the root if the name is
     * an absolute name, i.e. contains .
     * 
     * @param {!string}
     *            name the name of the module
     * @param {boolean}
     *            createIfNotFound
     * @return {Module} the module or null
     */
    var findModule = function(name, createIfNotFound) {
        var m = MODULES[name], names, i, n;
        m = m || null;
        if (!m && createIfNotFound) {
            names = name.split(/\./);
            m = ROOT;
            for (i = 0, n = names.length; i < n; ++i) {
                m = m.create(names[i], null);
            }
        }
        return m;
    };

    /**
     * Ensure that the formals and the actuals of a function match up.
     * 
     * @param {!Array}
     *            names the function names
     * @param {!Function}
     *            func the function
     */
    var checkFormals = function(names, func) {
        var formals = parseFormalParameters(func);
        if (formals !== null && formals.length !== names.length) {
            throw new Error('Formals and parameter names do not match');
        }
    };

    /**
     * Create the function description.
     * 
     * @constructor
     * @final
     * @param {Array|Arguments}
     *            args an array of arguments
     */
    var FunctionDescriptor = function(args) {
        var n;
        this.isConstructor = false;

        if (args.length === 1 && isArray(args[0])) {
            // using AngularJS notation
            n = args[0].length;
            this.names = args[0].slice(0, n - 1);
            this.func = args[0][n - 1];
            checkFormals(this.names, this.func);
        } else if (args.length === 2) {
            this.names = args[0].slice();
            this.func = args[1];
            checkFormals(this.names, this.func);
        } else if (typeof args[0] === 'function') {
            this.func = args[0];
            this.names = parseFormalParameters(this.func);
            if (this.names === null) {
                throw new Error('Failed to determine function signature');
            }
        } else {
            throw new Error('Invalid function description');
        }
    };

    /**
     * Validate injection parameters for this descriptor.
     * 
     * @param {!string}
     *            allowed the allowed characters
     * @param {!string}
     *            notAllowed the characters that are not allowed
     */
    FunctionDescriptor.prototype.validateInjectionParameterNames = function(allowed, notAllowed) {
        var n = this.names.length, i;
        for (i = 0; i < n; ++i) {
            validateInjectionParameterName(this.names[i], allowed, notAllowed);
        }
    };

    /**
     * An interceptor.
     * 
     * @constructor
     * @final
     * @param {!Module}
     *            module the module in which the interceptor will resolve
     * @param {!FunctionDescriptor}
     *            descriptor the function used to create the interceptor
     */
    var Interceptor = function(module, descriptor) {
        this.module = module;
        this.descriptor = descriptor;
    };

    /**
     * A descriptor for a value.
     * 
     * @constructor
     * @final
     * @param {*}
     *            value a value
     */
    var ValueDescriptor = function(value) {
        this.value = value;
    };

    /**
     * Create the new value descriptor.
     * 
     * @param {*|ValueDescriptor}
     *            value a value
     * 
     * @return {!ValueDescriptor} a value descriptor
     */
    var createValueDescriptor = function(value) {
        var descriptor;
        if (value instanceof ValueDescriptor) {
            descriptor = value;
        } else {
            descriptor = new ValueDescriptor(value);
        }
        return descriptor;
    };

    /**
     * Create the function description.
     * 
     * @param {!Array|!Arguments|!FunctionDescriptor}
     *            args an array of arguments
     * @return {!FunctionDescriptor} a function descriptor
     */
    var createFunctionDescriptor = function(args) {
        var descriptor;
        if (args instanceof FunctionDescriptor) {
            descriptor = args;
        } else if (args.length === 1 && args[0] instanceof FunctionDescriptor) {
            descriptor = args[0];
        } else {
            descriptor = new FunctionDescriptor(args);
        }
        return descriptor;
    };

    /**
     * Create a constructor function.
     * 
     * @param {!Array|!Arguments|!FunctionDescriptor}
     *            args a function or a descriptor
     * @return {FunctionDescriptor} a function descriptor
     */
    var createConstructorDescriptor = function(args) {

        // get the descriptor for the actual function; later we will use
        // that function and replace it with a wrapper function which will
        // instantiate the original function
        var desc = createFunctionDescriptor(args);
        desc.isConstructor = true;
        return desc;
    };

    /**
     * Create a descriptor.
     * 
     * @param {Array|ValueDescriptor|FunctionDescriptor}
     *            args an argument array
     * @return {!FunctionDescriptor|!ValueDescriptor}
     */
    var guessDescriptor = function(args) {
        if (args instanceof ValueDescriptor || args instanceof FunctionDescriptor) {
            return args;
        }
        if ((args.length === 1) && (typeof args[0] !== 'function') && !(args[0] instanceof FunctionDescriptor)) {
            return createValueDescriptor(args[0]);
        }
        return createFunctionDescriptor(args);
    };

    /**
     * Create a resolve for the specified module.
     * 
     * @constructor
     * @final
     * @param {!Module}
     *            module the module where this resolvable will live
     * @param {!string}
     *            name the name of the resolvable
     * @param {number}
     *            access the access for this resolvable
     * @param {!FunctionDescriptor|!ValueDescriptor}
     *            descriptor a function or value descriptor
     */
    var Resolvable = function(module, name, access, descriptor) {

        this.module = module;
        this.name = name;
        this.fullName = makeFullName(module.__fullName, name);
        this.descriptor = descriptor;
        this.resolving = false;

        switch (access) {
        case PUBLIC_ACCESS:
        case PRIVATE_ACCESS:
        case PROTECTED_ACCESS:
            this.access = access;
            break;
        default:
            throw new Error('Invalid access ' + access);
        }
    };

    /**
     * Check the access level of this resolvable against a given level.
     * 
     * @param {!number}
     *            access a access level
     * @return {boolean} true if this resolvable has at an access level of 'access'
     */
    Resolvable.prototype.isAccessible = function(access) {
        return this.access <= access;
    };

    /**
     * Define a private object which is only accessible to functions defined in the provided module.
     * 
     * @param {!Module}
     *            module the module in which to bind a new object
     * @param {!string}
     *            name the name of the object to be bound
     * @param {!number}
     *            access the access level
     * @param {!Array}
     *            args objects to bind or a function descriptor
     * @return {!Module} the module
     */
    var define = function(module, name, access, args) {
        checkArguments(args, 1, 2);
        ensureValidName(name);
        ensureNotExists(module, name);
        ensureUnsealed(module);
        var desc, R;

        desc = guessDescriptor(args);
        if (desc instanceof FunctionDescriptor) {
            desc.validateInjectionParameterNames("?", "#");
        }
        R = new Resolvable(module, name, access, desc);
        module.__values[name] = R;
        return module;
    };

    /**
     * Split a name into a module and local name part.
     * 
     * @constructor
     * @final
     * @param {!string}
     *            path a path name to parse
     * @param {!Module}
     *            module the default module
     */
    var Path = function(path, module) {
        this.module = module;
        this.local = path;
        this.modulePath = '.';

        var i;
        i = path.lastIndexOf('.');
        if (i >= 0) {
            this.modulePath = path.substring(0, i);
            this.module = findModule(this.modulePath, false);
            this.local = path.substr(i + 1);
        }
    };

    /**
     * Search for a resolvable object starting at a given module.
     * 
     * @param {!string}
     *            name the simple or absolute name of the resolvable
     * @param {!Module}
     *            start the module in which to start searching
     * @param {number}
     *            access the type access granted to the module's resolvables
     * @param {!Object}
     *            recursionGuard the recursion guard is necessary to detect cyclic dependencies
     * @return {?Resolvable} a resolvable object or null if not found
     */
    var findResolvable = function(name, start, access, recursionGuard) {
        var i, n, local, depends;
        var current, resolvable, imports;
        var path = new Path(name, start);
        current = path.module;
        local = path.local;

        if (current !== start) {
            access = Math.min(access, getAccess(start, current));
        }

        recursionGuard = recursionGuard || {};

        resolvable = null;
        while (!resolvable && current) {

            // first, check the module's locally defined resolvables
            // mark this module as seal, since we've started resolution
            current.__sealed = true;

            resolvable = current.__values[local];
            if (resolvable && resolvable.isAccessible(access)) {
                break;
            }
            resolvable = null;

            // finish the loop if we've found a locally define object
            if (!resolvable) {
                // not found
                if (recursionGuard[current.__fullName] === true) {
                    throw new Error('Cyclic dependency : ' + current.__fullName);
                }

                try {
                    recursionGuard[current.__fullName] = true;

                    imports = current.__imports || [];

                    // prevent imports later from being overridden
                    current.__imports = imports;

                    // check the imports
                    for (i = 0, n = imports.length; i < n && !resolvable; ++i) {
                        depends = findModule(imports[i], false);
                        if (depends === null) {
                            throw new Error('Invalid dependency : ' + imports[i]);
                        }
                        resolvable = findResolvable(local, depends, PUBLIC_ACCESS, recursionGuard);
                    }
                } finally {
                    recursionGuard[current.__fullName] = false;
                }

                // check the parent using protected access
                access = PROTECTED_ACCESS;
                current = current.__parent;
            }
        }
        return resolvable;
    };

    /**
     * Inject a function with objects from the specified module. The this pointer will be mapped to the module.
     * 
     * @param {!Module}
     *            module the module
     * @param {number}
     *            access the access
     * @param {FunctionDescriptor}
     *            descriptor the descriptor for the function
     * @param {boolean}
     *            allowFreeArguments true to allow free arguments
     * @return {function()|null} a function that calls the specified function with the appropriately injected values or
     *         null if the injection failed
     * @throws Error
     *             if a cyclic dependency was detected
     */
    var injectFunction = function(module, access, descriptor, allowFreeArguments) {
        var i, n, isConstructor, freeArgs, args, r;
        var name, value, optional, names, func;

        names = descriptor.names;
        func = descriptor.func;
        isConstructor = descriptor.isConstructor;

        freeArgs = [];

        // loop over each argument name and instantiate it as well
        args = [ module ];

        for (i = 0, n = names.length; i < n; ++i) {
            name = names[i];
            if (name[0] === '#') {
                if (!allowFreeArguments) {
                    throw new Error('Free arguments are not allowed');
                }
                freeArgs.push(args.length);
                args.push(undefined);
            } else {
                optional = false;
                if (name[0] === '?') {
                    optional = true;
                    name = name.substr(1);
                }
                // we can use PRIVATE access, since we're resolving locally
                r = findResolvable(name, module, access, {});

                if (r) {
                    try {
                        value = resolveValue(r);
                    } catch (error) {
                        console.log('Injection failed: ' + name);
                        throw error;
                    }
                    args.push(value);
                } else if (optional) {
                    args.push(undefined);
                } else {
                    console.log('Injectable not found: ' + name);
                    return null;
                }
            }
        }
        n = freeArgs.length;

        return function() {
            // copy free arguments over
            for (i = 0; i < n; ++i) {
                args[freeArgs[i]] = arguments[i];
            }

            // create a new function
            var FN = Function.prototype.bind.apply(func, args);

            if (isConstructor) {
                // found this on <a
                // href='http://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible'>
                return new FN();
            } else {
                return FN();
            }
        };
    };

    /**
     * Resolve the value of a resolvable object.
     * 
     * @param {!Resolvable}
     *            R the resolve to be instantiated
     * @return {Object} a value for the resolvable
     * @throws Error
     *             if a cyclic dependency was detected
     */
    var resolveValue = function(R) {
        var fn, interceptors, interceptor, interceptFN, value, i, n;

        if (R.hasOwnProperty('value')) {
            return R['value'];
        }

        if (R.resolving === true) {
            throw new Error('Cyclic dependency detected with ' + R.fullName);
        }

        R.resolving = true;
        if (R.descriptor instanceof ValueDescriptor) {
            value = R.descriptor.value;
        } else {

            try {
                try {
                    fn = injectFunction(R.module, PRIVATE_ACCESS, R.descriptor, false);
                } catch (error) {
                    console.log('Failed to resolve ' + R.fullName);
                    throw error;
                }
                if (fn === null) {
                    console.log('Failed to resolve ' + R.fullName);
                    throw new Error('Failed to resolve ' + R.fullName);
                }
            } finally {
                R.resolving = false;
            }

            try {
                value = fn();
            } catch (error) {
                throw new Error('Failed to resolve ' + R.fullName + '\n' + error.toString());
            }
        }

        interceptors = R.module.__interceptors[R.name] || [];

        // apply all interceptors, which is in arbitrary order
        for (i = 0, n = interceptors.length; i < n; ++i) {
            interceptor = interceptors[i];
            try {
                interceptFN = injectFunction(interceptor.module, PRIVATE_ACCESS, interceptor.descriptor, false);
            } catch (error) {
                console.log('Interceptor for ' + R.fullName + ' failed');
                throw error;
            }
            if (interceptFN === null) {
                throw new Error('Failed to resolve interceptor for ' + R.name);
            }
            value = interceptFN()(value);
        }

        R['value'] = value;
        // the descriptor isn't needed anymore, so clean up
        delete R.descriptor;

        return R['value'];
    };

    /**
     * Inject a function with values from this module. The this pointer will be bound to this module.
     * 
     * @expose
     * @param {...}
     *            var_args a function descriptor
     * @return {Function} a function
     */
    Module.prototype.inject = function(var_args) {
        var descriptor = createFunctionDescriptor(arguments);
        descriptor.validateInjectionParameterNames("#?", "");
        var fn = injectFunction(this, PUBLIC_ACCESS, descriptor, true);
        if (fn === null) {
            throw new Error('Failed to create injected function');
        }
        return fn;
    };

    /**
     * Create a new module that is nested within the current module. If the modules has already been created with
     * imports, then this method throws an exception.
     * 
     * @expose
     * @param {!string}
     *            name the name of this module within the parent module
     */
    Module.prototype.create = function(name) {
        var m;
        if (name.length === 0 || name.indexOf('.') >= 0) {
            throw new Error('Invalid name ' + name);
        }
        m = this.__children[name];
        if (!m) {
            m = new Module(name, this, null);
        }
        return m;
    };

    /**
     * Configure this module.
     * 
     * @expose
     * @param {Array=}
     *            opt_imports direct imports of this module
     */
    Module.prototype.configure = function(opt_imports) {
        if (!isArray(opt_imports)) {
            throw new Error('Imports are not an array');
        }
        if (this.__imports) {
            throw new Error('Module has already been configured ' + this.__fullName);
        }
        ensureUnsealed(this);
        this.__imports = opt_imports.slice();
        return this;
    };

    /**
     * Get the value of a property by its local or absolute path. Only public values can be retrieved.
     * 
     * @expose
     * @param {!string}
     *            name the name of the object to be resolved.
     * @return {*} a value
     * @throws Exception
     *             if the value could not be created
     */
    Module.prototype.get = function(name) {
        var R = findResolvable(name, this, PUBLIC_ACCESS, {});
        if (R) {
            return resolveValue(R);
        }
        throw new Error('Not found ' + name);
    };

    /**
     * Define a factory object. The name starts with modifier characters, such as, '#', '+', '-' then the value will
     * accessible as protected, public, or private respectively. If no access modier is provided, then access default to
     * public access.
     * 
     * @expose
     * @param {!string}
     *            name the name of the object to be bound
     * @param {...*}
     *            var_args
     * @return {!Module} this module
     */
    Module.prototype.factory = function(name, var_args) {
        ensureMinArgs(arguments, 2);
        var desc = createFunctionDescriptor(Array.prototype.slice.call(arguments, 1));
        var parsedName = parseName(name);
        return define(this, parsedName.name, parsedName.access, [ desc ]);
    };

    /**
     * Define a service. The name starts with modifier characters, such as, '#', '+', '-' then the value will accessible
     * as protected, public, or private respectively. If no access modier is provided, then access default to public
     * access.
     * 
     * @expose
     * @param {!string}
     *            name the name of the object to be bound
     * @param {...*}
     *            var_args
     * @return {!Module} this module
     */
    Module.prototype.service = function(name, var_args) {
        ensureMinArgs(arguments, 2);
        var desc = createConstructorDescriptor(Array.prototype.slice.call(arguments, 1));
        var parsedName = parseName(name);
        return define(this, parsedName.name, parsedName.access, [ desc ]);
    };

    /**
     * Define a value. The name starts with modifier characters, such as, '#', '+', '-' then the value will accessible
     * as protected, public, or private respectively. If no access modier is provided, then access default to public
     * access.
     * 
     * @expose
     * @param {!string}
     *            name the name of the object to be bound
     * @param {*}
     *            value a value
     * @return {!Module} this module
     */
    Module.prototype.value = function(name, value) {
        ensureMinArgs(arguments, 2);
        var desc = createValueDescriptor(value);
        var parsedName = parseName(name);
        return define(this, parsedName.name, parsedName.access, [ desc ]);
    };

    /**
     * Define a constant value. The name starts with modifier characters, such as, '#', '+', '-' then the value will
     * accessible as protected, public, or private respectively. If no access modier is provided, then access default to
     * public access.
     * <p>
     * This method will freeze and seal the provided constant value.
     * 
     * @expose
     * @param {!string}
     *            name the name of the object to be bound
     * @param {*}
     *            value a value
     * @return {!Module} this module
     */
    Module.prototype.constant = function(name, value) {
        ensureMinArgs(arguments, 2);
        if (value !== null) {
            var type = typeof value;
            // only objects can be frozen
            if (type === 'object' || type === 'function') {
                Object.freeze(value);
                Object.seal(value);
            }
        }
        var desc = createValueDescriptor(value);
        var parsedName = parseName(name);
        return define(this, parsedName.name, parsedName.access, [ desc ]);
    };

    /**
     * Define an interceptor for values, factories, and services. The interceptor is invoked when the named object in
     * this module is resolved for the first time. The interception function can be injected and must return a function
     * that can be used to inject.
     * 
     * @expose
     * @param {!string}
     *            name the name of the object to be intercepted
     * @param {...}
     *            var_args an injectable function that produce a function that takes a value and returns a value
     * @return {!Module} this module
     */
    Module.prototype.interceptor = function(name, var_args) {

        // find the module in which we want
        var path = new Path(name, this);
        var module = path.module;
        if (module === null) {
            module = findModule(path.modulePath, true);
        }
        var args = Array.prototype.slice.call(arguments, 1);
        var descriptor = createFunctionDescriptor(args);
        descriptor.validateInjectionParameterNames("?", "#");
        var interceptor = new Interceptor(this, descriptor);
        var list = module.__interceptors[path.local];
        if (!list) {
            module.__interceptors[path.local] = list = [];
        }
        list.push(interceptor);
        return this;
    };

    /**
     * Find a module. If no module is specified, then returns the root module.
     * 
     * @expose
     * @param {!string=}
     *            opt_path the optional path
     * @param {boolean=}
     *            opt_preventImplicitModule true to prevent the module from being created implicitly
     * @return {!Module}
     */
    this.zone = function(opt_path, opt_preventImplicitModule) {
        if (!opt_path) {
            return ROOT;
        }
        var m = findModule(opt_path, !opt_preventImplicitModule);
        if (m) {
            return m;
        }
        throw new Error('Module not found ' + opt_path);
    };

    /**
     * Create a function descriptor. This value may be passed to any of the define functions or the inject function.
     * 
     * @expose
     * @param {...*}
     *            var_args
     * @return {FunctionDescriptor} a function descriptor
     */
    this.zone.asFunction = function(var_args) {
        checkArguments(arguments, 1, 2);
        return createFunctionDescriptor(arguments);
    };

    /**
     * Create a descriptor for a constructor function. Functions defined as constructors will be instantiated using the
     * new operator during injection time.
     * 
     * @expose
     * @param {...*}
     *            var_args
     * @return {FunctionDescriptor} a function descriptor
     */
    this.zone.asConstructor = function(var_args) {
        checkArguments(arguments, 1, 2);
        return createConstructorDescriptor(arguments);
    };

    /**
     * Create a descriptor for a value. This function can be used in some circumstances to disambiguate different
     * function representations.
     * 
     * @expose
     * @param {Object}
     *            value a value
     * @return {ValueDescriptor} a value descriptor
     */
    this.zone.asValue = function(value) {
        checkArguments(arguments, 1, 1);
        return createValueDescriptor(value);
    };

    /**
     * An injection function. This works much like zone(name).inject(...). It's very useful to this use this during
     * testing.
     * 
     * @expose
     * @param {!string=}
     *            opt_name the name of optional module which to use for injection
     * @param {...}
     *            var_args the arguments
     * @return {function()} a function
     */
    this.zone.inject = function(opt_name, var_args) {
        checkArguments(arguments, 1, 3);

        var module = '';
        var args = arguments;
        if (typeof arguments[0] === 'string') {
            module = opt_name;
            args = Array.prototype.slice.call(args, 1);
        }

        var descriptor = createFunctionDescriptor(args);

        return function() {
            var m = zone(module, true);
            var fn = m.inject(descriptor);
            return fn.apply(null, arguments);
        };
    };

    /**
     * Get a public value by its global name.
     * 
     * @expose
     * @param {!string}
     *            name the name of the object to get
     * @return {*} an object
     */
    this.zone.get = function(name) {
        checkArguments(arguments, 1, 1);

        var path = new Path(name, ROOT);
        if (path.module === null) {
            throw new Error('Not found ' + name);
        }
        return path.module.get(path.local);
    };

    /**
     * A function that can be used to complete reset the zone.
     * 
     * @expose
     */
    this.zone.reset = function() {
        ROOT = new Module('', null, []);
        MODULES = {};
    };

    /**
     * Get the version of zone.
     * 
     * @expose
     * @return {!string} the current version of zone
     */
    this.zone.version = function() {
        return VERSION;
    };

    return this.zone;
}).call(this);
zone("nigiri").factory("#MyKeyRange", [ "Utils" ], function(Utils) {
    "use strict"

    var MyKeyRange = function(idbKeyRange) {
        this.__impl = idbKeyRange;
    };

    MyKeyRange.bound = function(lower, upper, lowerOpen, upperOpen) {
        var impl = IDBKeyRange.bound(lower, upper, lowerOpen, upperOpen);
        return new MyKeyRange(impl);
    };

    MyKeyRange.only = function(value) {
        var impl = IDBKeyRange.only(value);
        return new MyKeyRange(impl);
    };

    MyKeyRange.lowerBound = function(bound, open) {
        var impl = IDBKeyRange.lowerBound(bound, open);
        return new MyKeyRange(impl);
    };

    MyKeyRange.upperBound = function(bound, open) {
        var impl = IDBKeyRange.upperBound(bound, open);
        return new MyKeyRange(impl);
    };

    // attributes
    Utils.addConstAttribute(MyKeyRange.prototype, "lower");
    Utils.addConstAttribute(MyKeyRange.prototype, "upper");
    Utils.addConstAttribute(MyKeyRange.prototype, "lowerOpen");
    Utils.addConstAttribute(MyKeyRange.prototype, "upperOpen");

    return MyKeyRange;
});
zone("nigiri").factory("#MyObjectStore", [ "MyRequest", "MyIndex", "Utils", "cursors" ], function(MyRequest, MyIndex, Utils, cursors) {
    "use strict"

    var MyObjectStore = function(idbObjectStore, transaction) {
        this.__impl = idbObjectStore;
        this.__transaction = transaction;
    };

    MyObjectStore.prototype.add = function() {
        var req = this.__impl.add.apply(this.__impl, arguments);
        return new MyRequest(req, this, this.__transaction);
    };

    MyObjectStore.prototype.clear = function() {
        var req = this.__impl.clear.apply(this.__impl, arguments);
        return new MyRequest(req, this, this.__transaction);
    };

    MyObjectStore.prototype.count = function() {
        return cursors.createObjectStoreCountByCursorRequest(this, arguments);
    };

    MyObjectStore.prototype.createIndex = function() {
        var req = this.__impl.createIndex.apply(this.__impl, arguments);
        return new MyIndex(req, this);
    };

    MyObjectStore.prototype["delete"] = function() {
        return cursors.createObjectStoreDeleteByCursorRequest(this, arguments);
    };

    MyObjectStore.prototype.deleteIndex = function() {
        this.__impl.deleteIndex.apply(this.__impl, arguments);
    };

    MyObjectStore.prototype.get = function() {
        return cursors.createObjectStoreGetByCursorRequest(this, arguments);
    };

    MyObjectStore.prototype.index = function() {
        var res = this.__impl.index.apply(this.__impl, arguments);
        return new MyIndex(res, this);
    };

    MyObjectStore.prototype.openCursor = function() {
        return cursors.createObjectStoreCursorRequest(this, arguments);
    };

    MyObjectStore.prototype.put = function(value, key) {
        var req = this.__impl.put.apply(this.__impl, arguments);
        return new MyRequest(req, this, this.__transaction);
    };

    // attributes
    Utils.addConstAttribute(MyObjectStore.prototype, "indexNames");
    Utils.addConstAttribute(MyObjectStore.prototype, "keyPath");
    Utils.addConstAttribute(MyObjectStore.prototype, "name");
    Utils.addConstProperty(MyObjectStore.prototype, "transaction");
    Utils.addConstAttribute(MyObjectStore.prototype, "autoIncrement");

    return MyObjectStore;
});zone("nigiri").factory("#MyRequest", [ "MyDBEventTarget", "addEventHandlerProperty", "createSuccessEvent", "createErrorEvent", "Utils" ],
        function(EventTargetImpl, addEventHandlerProperty, createSuccessEvent, createErrorEvent, Utils) {
            "use strict"

            var isValidResult = function(result) {
                return result !== null && result !== undefined;
            };

            var TheRequest = function(impl, source, transaction, resultWrapper) {
                EventTargetImpl.call(this, impl);
                this.__source = source;
                this.__transaction = transaction;

                this.__resultOverride = false;
                this.__result = undefined;
                this.__readyStateOverride = false;
                this.__readyState = "pending";
                this.__error = null;

                this.__wrapResult = resultWrapper || Utils.IDENTITY_FUNCTION;

            };

            TheRequest.__invalidResult = function(req) {
                return !isValidResult(req.result);
            };

            TheRequest.__resultValid = function(req) {
                return isValidResult(req.result);
            };

            TheRequest.prototype = Object.create(EventTargetImpl.prototype);
            TheRequest.prototype.constructor = TheRequest;

            TheRequest.prototype.__notifyOnSuccess = function(result, event) {
                this.__result = result;
                if (this.onsuccess) {
                    this.onsuccess(event || createSuccessEvent(this));
                    return true;
                }
                return false;
            };

            TheRequest.prototype.__notifyOnError = function(error, event) {
                this.__error = error;
                if (this.onerror) {
                    this.onerror(event || createErrorEvent(this));
                    return true;
                }
                return false;
            };

            TheRequest.prototype.__setImpl = function(impl) {
                if (this.__result || this.__readyState !== "pending" || this.__error !== null) {
                    throw new Error("Invalid state; cannot set implementation");
                }
                EventTargetImpl.prototype.__setImpl.call(this, impl);
            };

            Object.defineProperty(TheRequest.prototype, "transaction", {
                get : function() {
                    return this.__transaction;
                }
            });
            Object.defineProperty(TheRequest.prototype, "source", {
                get : function() {
                    return this.__source;
                }
            });
            Object.defineProperty(TheRequest.prototype, "result", {
                get : function() {
                    if (!this.__resultOverride && !isValidResult(this.__result) && this.__impl && isValidResult(this.__impl.result)) {
                        return this.__wrapResult(this.__impl.result, this);
                    }
                    return this.__result;
                }
            });

            Object.defineProperty(TheRequest.prototype, "error", {
                get : function() {
                    if (this.__impl) {
                        return this.__impl.error;
                    }
                    return this.__error;
                }
            });
            Object.defineProperty(TheRequest.prototype, "readyState", {
                get : function() {
                    if (!this.__readyStateOverride && this.__impl) {
                        return this.__impl.readyState;
                    }
                    return this.__readyState;
                }
            });

            addEventHandlerProperty(TheRequest.prototype, "onsuccess");
            addEventHandlerProperty(TheRequest.prototype, "onerror");

            return TheRequest;
        });zone("nigiri").factory("#MyIndex", [ "Utils" ,"cursors"], function(Utils,cursors) {
    "use strict"

    var MyIndex = function(idbIndex, objectStore) {
        this.__impl = idbIndex;
        this.__objectStore = objectStore;
    };

    MyIndex.prototype.get = function() {
        return cursors.createGetByCursorRequest(this.__impl, this, this.__objectStore.transaction, arguments);
    };

    MyIndex.prototype.getKey = function() {
        return cursors.createGetKeyByCursorRequest(this.__impl, this, this.__objectStore.transaction, arguments);
    };

    MyIndex.prototype.count = function() {
        return cursors.createCountByCursorRequest(this.__impl, this, this.__objectStore.transaction, arguments);
    };

    MyIndex.prototype.openCursor = function() {
        return cursors.createCursorRequest(this.__impl, this, this.__objectStore.transaction, true, arguments);
    };

    MyIndex.prototype.openKeyCursor = function() {
        return cursors.createCursorRequest(this.__impl, this, this.__objectStore.transaction, false, arguments);
    };

    // attributes
    Utils.addConstAttribute(MyIndex.prototype, "name");
    Utils.addConstProperty(MyIndex.prototype, "objectStore");
    Utils.addConstAttribute(MyIndex.prototype, "keyPath");
    Utils.addConstAttribute(MyIndex.prototype, "multiEntry");
    Utils.addConstAttribute(MyIndex.prototype, "unique");

    return MyIndex;
});
zone("nigiri").factory("#MyTransaction", [ "MyDBEventTarget", "MyObjectStore", "addEventHandlerProperty", "Utils" ],
        function(MyDBEventTarget, MyObjectStore, addEventHandlerProperty, Utils) {
            "use strict"

            var MyTransaction = function(idbTransaction, db) {
                MyDBEventTarget.call(this, idbTransaction);
                this.__impl = idbTransaction;
                this.__db = db;
            };

            // inheritance
            MyTransaction.prototype = Object.create(MyDBEventTarget.prototype);
            MyTransaction.prototype.constructor = MyTransaction;

            MyTransaction.prototype.abort = function() {
                this.__impl.abort.apply(this.__impl, arguments);
            };

            MyTransaction.prototype.objectStore = function() {
                var store = this.__impl.objectStore.apply(this.__impl, arguments);
                return new MyObjectStore(store, this);
            };

            // attributes
            Utils.addConstProperty(MyTransaction.prototype, "db");
            Utils.addConstAttribute(MyTransaction.prototype, "mode");
            Utils.addConstAttribute(MyTransaction.prototype, "error");
            addEventHandlerProperty(MyTransaction.prototype, "onabort");
            addEventHandlerProperty(MyTransaction.prototype, "oncomplete");
            addEventHandlerProperty(MyTransaction.prototype, "onerror");

            return MyTransaction;
        });
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
zone("nigiri").factory("-IndexDBProvider", [], function() {
    "use strict"
    return window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;
});
zone("nigiri").factory("#cmp", [ "IndexDBProvider" ], function(provider) {
    "use strict"
    return function(a, b) {
        return provider.cmp(a, b);
    };
});

zone("nigiri").factory("#FACTORY", [ "MyOpenDBRequest", "IndexDBProvider" ], function(REQUEST, INDEXEDDB_PROVIDER) {
    "use strict";

    if (!INDEXEDDB_PROVIDER) {
        INDEXEDDB_PROVIDER = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;
    }

    if (!INDEXEDDB_PROVIDER) {
        throw new Error("Failed to create indexed DB");
    }

    var provider = function() {
        this.open = function() {
            var req = INDEXEDDB_PROVIDER.open.apply(INDEXEDDB_PROVIDER, arguments);
            return new REQUEST(req);
        };
        this.deleteDatabase = function() {
            var req = INDEXEDDB_PROVIDER.deleteDatabase.apply(INDEXEDDB_PROVIDER, arguments);
            return new REQUEST(req);
        };

        this.cmp = function(a, b) {
            return INDEXEDDB_PROVIDER.cmp(a, b);
        };
    };

    return new provider();

});
zone("nigiri").factory("#MyCursor", [ "MyRequest", "Utils" ], function(MyRequest, Utils) {
    "use strict"
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
    Utils.addConstProperty(MyCursor.prototype, "source");
    Utils.addConstAttribute(MyCursor.prototype, "direction");
    Utils.addConstAttribute(MyCursor.prototype, "key");
    Utils.addConstAttribute(MyCursor.prototype, "primaryKey");

    return MyCursor;
});
zone("nigiri").factory("#MyOpenDBRequest", [ "EventWrapper", "MyRequest", "MyTransaction", "MyDatabase", "addEventHandlerProperty" ],
        function(EventWrapper, RequestBaseClass, Transaction, Database, addEventHandlerProperty) {
            "use strict"

            var TheEvent = function(e) {
                EventWrapper.call(this, e);
            };

            TheEvent.prototype = Object.create(EventWrapper.prototype);
            TheEvent.prototype.constructor = TheEvent;

            Object.defineProperty(TheEvent.prototype, "oldVersion", {
                get : function() {
                    return this.__getNativeImpl().oldVersion;
                }
            });

            Object.defineProperty(TheEvent.prototype, "newVersion", {
                get : function() {
                    return this.__getNativeImpl().newVersion;
                }
            });

            var TheRequest = function(idbRequest) {
                RequestBaseClass.call(this, idbRequest, null, null);
            };

            // inheritance
            TheRequest.prototype = Object.create(RequestBaseClass.prototype);
            TheRequest.prototype.constructor = TheRequest;

            TheRequest.prototype.__wrapEvent = function(event) {
                if (event instanceof IDBVersionChangeEvent) {
                    return new TheEvent(event);
                } else {
                    return RequestBaseClass.prototype.__wrapEvent.call(this, event);
                }
            };

            // attributes

            Object.defineProperty(TheRequest.prototype, "transaction", {
                get : function() {
                    if (!this.__transaction && this.result) {
                        this.__transaction = new Transaction(this.__impl.transaction, this.__result);
                    }
                    return this.__transaction;
                }
            });

            Object.defineProperty(TheRequest.prototype, "result", {
                get : function() {
                    if (!this.__result && this.__impl.result) {
                        this.__result = new Database(this.__impl.result);
                    }
                    return this.__result;
                }
            });

            addEventHandlerProperty(TheRequest.prototype, "onblocked");
            addEventHandlerProperty(TheRequest.prototype, "onupgradeneeded");

            return TheRequest;
        });
zone("nigiri").service("-cursors", [ "MyRequest", "MyCursor", "MyCursorWithValues" ], function(MyRequest, MyCursor, MyCursorWithValues) {
    "use strict"
    this.createCursorRequest = function(implSource, source, transaction, withValues, args) {
        var req = null;
        var result = null;

        if (withValues || !implSource.openKeyCursor) {
            req = implSource.openCursor.apply(implSource, args);
            result = function(r) {
                new MyCursor(r, source, transaction);
            };
        } else {
            req = implSource.openKeyCursor.apply(implSource, args);
            result = function(r) {
                new MyCursorWithValues(r, source, transaction);
            };
        }
        req = new MyRequest(req, source, transaction, result);
        return req;
    };

    this.createCountByCursorRequest = function(implSource, source, transaction, args) {
        var req = implSource.count.apply(implSource, args);
        req = new MyRequest(req, source, transaction);
        return req;
    };

    this.createDeleteByCursorRequest = function(implSource, source, transaction, args) {
        var req = implSource["delete"].apply(implSource, args);
        req = new MyRequest(req, source, transaction);
        return req;
    };

    this.createGetByCursorRequest = function(implSource, source, transaction, args) {
        var req = implSource.get.apply(implSource, args);
        req = new MyRequest(req, source, transaction);
        return req;
    };

    this.createGetKeyByCursorRequest = function(implSource, source, transaction, args) {
        var req = implSource.getKey.apply(implSource, args);
        req = new MyRequest(req, source, transaction);
        return req;
    };

    this.createObjectStoreCursorRequest = function(source, args) {
        return this.createCursorRequest(source.__impl, source, source.transaction, true, args);
    };

    this.createObjectStoreCountByCursorRequest = function(store, args) {
        var req = store.__impl.count.apply(store.__impl, args);
        req = new MyRequest(req, store, store.transaction);
        return req;
    };

    this.createObjectStoreDeleteByCursorRequest = function(store, args) {
        var req = store.__impl["delete"].apply(store.__impl, args);
        req = new MyRequest(req, store, store.transaction);
        return req;
    };

    this.createObjectStoreGetByCursorRequest = function(store, args) {
        var req = store.__impl.get.apply(store.__impl, args);
        req = new MyRequest(req, store, store.transaction);
        return req;
    };
});
zone("nigiri").factory("#MyDatabase", [ "MyDBEventTarget", "MyTransaction", "MyObjectStore", "Utils" ],
        function(MyDBEventTarget, MyTransaction, MyObjectStore, Utils) {
            "use strict"

            var MyDatabase = function(idbDatabase) {
                MyDBEventTarget.call(this, idbDatabase, this);
            };

            // inheritance
            MyDatabase.prototype = Object.create(MyDBEventTarget.prototype);
            MyDatabase.prototype.constructor = MyDatabase;

            MyDatabase.prototype.createObjectStore = function() {
                var store = this.__impl.createObjectStore.apply(this.__impl, arguments);
                return new MyObjectStore(store, new MyTransaction(store.transaction));
            };

            MyDatabase.prototype.deleteObjectStore = function() {
                this.__impl.deleteObjectStore.apply(this.__impl, arguments);
            };

            MyDatabase.prototype.transaction = function() {
                var tx = this.__impl.transaction.apply(this.__impl, arguments);
                return new MyTransaction(tx, this);
            };

            MyDatabase.prototype.close = function() {
                this.__impl.close.apply(this.__impl, arguments);
            };

            // attributes
            Utils.addConstAttribute(MyDatabase.prototype, "name");
            Utils.addConstAttribute(MyDatabase.prototype, "version");
            Utils.addConstAttribute(MyDatabase.prototype, "objectStoreNames");

            return MyDatabase;
        });
zone("nigiri").factory("#MyEnvironment", [ "Utils" ], function(Utils) {
    "use strict"

    var MyEnvironment = function(idbEnvironment, indexDB) {
        this.__impl = idbEnvironment;
        this.__indexedDB = indexedDB;
    };

    // attributes
    Utils.addConstProperty(MyEnvironment.prototype, "indexedDB");
    return MyEnvironment;
});
zone("nigiri.extension").factory("#createMultiKeyCursorRequest", [ "Utils", "createGenericCursorRequest", "MyOptions", "nigiri.cmp" ],
        function(Utils, createGenericCursorRequest, MyOptions, compareKeys) {
    "use strict"

            var createState = function(multikey, direction) {
                var state = {
                    key : multikey
                };

                if (direction === 'prev' || direction === 'prevunique') {
                    state.next = function(key) {
                        return multikey.floor(key);
                    };
                } else {
                    state.next = function(key) {
                        return multikey.ceiling(key);
                    };
                }
                return state;
            };

            var syncWithMultiKey = function(cursor, state) {

                var actualKey, expectedKey;

                actualKey = cursor.key;

                // check if we need to emit this key
                if (state.key.contains(actualKey)) {
                    return true;
                }

                // get the expected key
                expectedKey = state.next(actualKey);

                if (expectedKey !== undefined) {
                    cursor["continue"]( expectedKey );
                }
                return false;
            };

            return function(impl, source, transaction, multikey, opts) {
                var options = new MyOptions(opts).getOptions();
                options.iterationState = createState(multikey, opts.direction);
                options.sync = syncWithMultiKey;

                return createGenericCursorRequest(impl, source, transaction, new MyOptions(options));
            };

        });zone("nigiri.extension").factory("-getKeyRange", [ "MyKeyRange", "MyRequest" ], function(KeyRange, TheRequest) {
    "use strict"

    var getKeyRange = function(loReq, hiReq, transaction) {
        var request = new TheRequest(null, loReq.source, transaction);
        var range = {};

        var notifyOnSuccess = function(e) {
            if (range && range.hasOwnProperty("lo") && range.hasOwnProperty("hi")) {
                request.__notifyOnSuccess(KeyRange.bound(range.lo, range.hi), e);
            }
        };

        loReq.onsuccess = function(e) {
            if (TheRequest.__invalidResult(loReq)) {
                request.__notifyOnSuccess(null, e);
            } else {
                range.lo = loReq.result.key;
                notifyOnSuccess(e);
            }
        };

        hiReq.onsuccess = function(e) {
            if (TheRequest.__invalidResult(hiReq)) {
                request.__notifyOnSuccess(null, e);
            } else {
                range.hi = hiReq.result.key;
                notifyOnSuccess(e);
            }
        };
        loReq.onerror = function(e) {
            // ensure that only one notification goes out
            if (range) {
                range = null;
                request.__notifyOnError(loReq.error);
            }
        };
        hiReq.onerror = function(e) {
            if (range) {
                range = null;
                request.__notifyOnError(hiReq.error);
            }
        };

        request.__setOwnerOf(hiReq);
        request.__setOwnerOf(loReq);

        return request;
    };

    return getKeyRange;
});

zone("nigiri.extension").interceptor("nigiri.MyObjectStore", [ "getKeyRange" ], function(getKeyRange) {

    return function(ObjectStore) {

        ObjectStore.prototype.getKeyRange = function() {
            var loReq = this.openCursor(null, "next");
            var hiReq = this.openCursor(null, "prev");
            return getKeyRange(loReq, hiReq, this.transaction);
        };
        return ObjectStore;
    };
});
zone("nigiri.extension").interceptor("nigiri.MyIndex", [ "getKeyRange" ], function(getKeyRange) {

    return function(Index) {

        Index.prototype.getKeyRange = function() {
            var loReq = this.openCursor(null, "next");
            var hiReq = this.openCursor(null, "prev");
            return getKeyRange(loReq, hiReq, this.__objectStore.transaction);
        };
        return Index;
    };
});
zone("nigiri.extension").factory("-addPutAll", [ "MyRequest" ], function(TheRequest) {
    "use strict"

    var addPutAll = function(store, method, xarray) {

        var array = [ null ];
        if (xarray.length === 2) {
            array.push(xarray[1]);
        }

        var objectGenerator = xarray[0];
        if (typeof objectGenerator !== 'function') {

            objectGenerator = (function(objects) {
                var i = 0;
                return function() {
                    if (i < objects.length) {
                        return objects[i++];
                    }
                    return null;
                };
            })(xarray[0]);
        }

        var request = new TheRequest(null, store, store.transaction);
        var i, n, addRequest;
        var nOutstanding = 0;

        var result = {
            total : 0,
            successes : 0,
            errors : 0
        };

        var notifyWhenDone = function() {
            if (--nOutstanding === 0) {
                request.__notifyOnSuccess(result);
            }
            if (nOutstanding < 0) {
                throw new Error("Internal error; mismatched calls");
            }
        };

        var onsuccess = function(e) {
            ++result.successes;
            notifyWhenDone();
        };

        var onerror = function(e) {
            // if the user provides an error handler for a batch request,
            // we need to invoke it to all the user to cancel the transaction
            // if will be aborted, then we return immediately
            if (request.__notifyOnError("Update failed", e)) {

                if (!e.defaultPrevented) {
                    // drop out at this point
                    return;
                }
            }

            e.preventDefault();
            e.stopPropagation();

            ++result.errors;
            notifyWhenDone();
        };

        // TODO: we may want to be even more special here and do things in batches
        var updateFN = store[method];
        var object;
        while ((object = objectGenerator()) !== null) {
            array[0] = object;
            try {
                addRequest = updateFN.apply(store, array);
                ++nOutstanding;
                addRequest.onsuccess = onsuccess;
                addRequest.onerror = onerror;
            } catch (error) {
                console.log(error.stack);
                // the the request for now
                ++result.errors;
                throw request;
            }
        }
        result.total = nOutstanding;

        return request;
    };
    return addPutAll;
});

zone("nigiri.extension").interceptor("nigiri.MyObjectStore", [ "addPutAll" ], function(addPutAll) {

    return function(ObjectStore) {
        ObjectStore.prototype.addAll = function() {
            return addPutAll(this, "add", arguments);
        };

        ObjectStore.prototype.putAll = function() {
            return addPutAll(this, "put", arguments);
        };

        return ObjectStore;
    };
});
zone("nigiri.extension").factory("#getByCursor", [ "MyRequest" ], function(TheRequest) {
    "use strict"

    return function(cursorRequest) {

        var request = new TheRequest(null, cursorRequest.source, cursorRequest.transaction);

        cursorRequest.onsuccess = function(e) {
            if (TheRequest.__resultValid(cursorRequest)) {
                request.__notifyOnSuccess(cursorRequest.result.value, e);
            } else {
                request.__notifyOnSuccess(undefined, e);
            }
        };
        cursorRequest.onerror = function(e) {
            request.__notifyOnError(cursorRequest.error, e);
        };

        request.__setOwnerOf(cursorRequest);

        return request;
    };

});
zone("nigiri.extension")
        .factory(
                "#createGenericCursorRequest",
                [ "MyRequest", "MyDBEventTarget", "MyCursor", "MyOptions", "Utils", "nigiri.cmp" ],
                function(MyRequest, MyDBEventTarget, MyCursor, MyOptions, Utils, compare) {
                    "use strict"

                    var isExcludedKey = function(keys, key) {
                        return keys !== null && Utils.findByBinarySearch(keys, compare, 0, key) >= 0;
                    };

                    var isIncludedKey = function(keys, key) {
                        return keys === null || Utils.findByBinarySearch(keys, compare, 0, key) >= 0;
                    };

                    var createUniqueFilter = function(request, filter) {
                        var keys = {};
                        return function(cursor) {
                            if (keys[cursor.primaryKey] === true) {
                                return false;
                            }
                            keys[cursor.key] = true;
                            return filter(cursor);
                        };

                    };

                    var createKeyFilter = function(request, filter) {
                        return function(cursor) {
                            // check that the key and primary keys are not excluded
                            if (isExcludedKey(request.__excludedKeys, cursor.key)) {
                                return false;
                            }
                            if (isExcludedKey(request.__excludedPrimaryKeys, cursor.primaryKey)) {
                                return false;
                            }
                            if (!isIncludedKey(request.__includedKeys, cursor.key)) {
                                return false;
                            }
                            if (!isIncludedKey(request.__includedPrimaryKeys, cursor.primaryKey)) {
                                return false;
                            }
                            return filter(cursor);
                        };
                    };

                    /**
                     * This function creates an iterator. We need to pass the original request, because the event object
                     * may point at the wrong request object when chaining requests:
                     * 
                     * <pre>
                     *  
                     *    OuterCursor
                     *     -&gt; InnerCursor
                     *      -&gt; NativeCursor
                     * </pre>
                     * 
                     * When the native cursor invokes the callback, the inner cursor will receive it, but but the owner
                     * of the native cursor is really the outer cursor; this means, we won't be able to access the state
                     * variable.
                     */
                    var createIterator = function(request, callback) {

                        return function(e) {
                            var state = request.__iterationState;

                            var cursor = request.result;
                            if (!MyRequest.__resultValid(request)) {
                                callback(e);
                                return;
                            }

                            if (!cursor.__impl) {
                                throw new Error("Cursor is not defined");
                            }

                            // if we've reached the end of the iteration then we just bail out
                            if (state.__limit === 0 || request.__terminate(cursor)) {
                                request.__readyState = "done";
                                request.__result = null;
                                // need to override the result
                                request.__resultOverride = request.__readyStateOverride = true;
                                callback(e);
                                return;
                            }

                            // try to sync up the cursor such that the current
                            // is a key to be returned by the cursor
                            if (!request.__sync(cursor.__impl, state.__callerState)) {
                                // it is expected that the cursor has finished
                                return;
                            }

                            // the cursor was successfully sync'ed to an element
                            if (!request.__filter(cursor)) {
                                cursor.__impl.advance(1);
                            } else if (state.__skip > 0) {
                                --state.__skip;
                                // move the source cursor forward
                                cursor.__impl.advance(1);
                            } else {
                                if (state.__limit > 0) {
                                    --state.__limit;
                                }
                                // invoke the real callback and leave it up the client to call continue or advance
                                callback(e);
                            }
                        };
                    };

                    /**
                     * The cursor class.
                     */
                    var TheCursor = function(cursor, source, transaction) {
                        MyCursor.call(this, cursor, source, transaction);
                        this.__state = null;
                    };

                    TheCursor.prototype = Object.create(MyCursor.prototype);
                    TheCursor.prototype.constructor = TheCursor;

                    TheCursor.prototype["continue"] = function() {
                        this.__impl["continue"].apply(this.__impl, arguments);
                        if (this.__state !== null) {
                            this.__state.__skip = 0;
                        }
                    };

                    TheCursor.prototype.advance = function(count) {
                        if (this.__state !== null) {
                            this.__impl.advance(1);
                            this.__state.__skip = count - 1;
                        } else {
                            this.__impl.advance(count);
                        }
                    };

                    /**
                     * The cursor class.
                     */
                    var TheCursorWithValues = function(cursor, source, transaction) {
                        TheCursor.call(this, cursor, source, transaction);
                    };

                    TheCursorWithValues.prototype = Object.create(TheCursor.prototype);
                    TheCursorWithValues.prototype.constructor = TheCursorWithValues;

                    Object.defineProperty(TheCursorWithValues.prototype, "value", {
                        get : function() {
                            return this.__impl ? this.__impl.value : undefined;
                        }
                    });

                    /**
                     * The Request class. The purpose of the sync function is to synchronize a cursor with the current
                     * iteration state.
                     * 
                     * @param idbRequest
                     *            the request to be wrapped
                     * @param source
                     *            the source object for the new request
                     * @param transaction
                     *            the transaction associated with the request
                     * @param syncFN
                     *            a synchronization function (takes a cursor and an iteration state)
                     * @param initialIterationState
                     *            the initial iteration state
                     */
                    var TheRequest = function(idbRequest, source, transaction, options) {
                        if (!source) {
                            throw new Error("No source specified");
                        }
                        if (!transaction) {
                            throw new Error("No transaction specified");
                        }

                        var self = this;
                        MyRequest.call(self, idbRequest, source, transaction, function(r) {
                            return self.__createCursor(r, source, transaction);
                        });
                        this.__cursorWithValues = options.withValues || false;
                        this.__sync = options.sync || Utils.TRUE_FUNCTION;

                        this.__excludedKeys = options.excludedKeys || null;
                        this.__excludedPrimaryKeys = options.excludedPrimaryKeys || null;
                        this.__includedKeys = options.includedKeys || null;
                        this.__includedPrimaryKeys = options.includedPrimaryKeys || null;
                        this.__unique = options.unique || false;

                        this.__terminate = options.terminate || Utils.FALSE_FUNCTION;

                        this.__filter = options.filter || Utils.TRUE_FUNCTION;
                        if (this.__excludedKeys !== null || this.__excludedPrimaryKeys !== null || this.__includedKeys !== null ||
                                this.__includedPrimaryKeys !== null) {
                            this.__filter = createKeyFilter(this, this.__filter);
                        }
                        if (this.__unique === true) {
                            this.__filter = createUniqueFilter(this, this.__filter);
                        }

                        this.__iterationState = {
                            __skip : options.offset > 0 ? options.offset : 0,
                            __limit : options.limit >= 0 ? options.limit : -1,
                            __callerState : options.iterationState || {}
                        };

                        // check the iteration state is the default state, in which case we don't need to do any sort of
                        // filtering.
                        if (this.__sync === Utils.TRUE_FUNCTION && this.__iterationState.__skip === 0 && this.__iterationState.__limit < 0 &&
                                this.__filter === Utils.TRUE_FUNCTION && this.__terminate === Utils.FALSE_FUNCTION) {
                            this.__iterationState = null;
                        }

                    };

                    TheRequest.prototype = Object.create(MyRequest.prototype);
                    TheRequest.prototype.constructor = TheRequest;

                    TheRequest.prototype.__createCursor = function(impl, source, transaction) {
                        var res = null;
                        if (this.__cursorWithValues) {
                            res = new TheCursorWithValues(impl, source, transaction);
                        } else {
                            res = new TheCursor(impl, source, transaction);
                        }
                        res.__state = this.__iterationState;
                        return res;
                    };

                    TheRequest.prototype.__setCallback = function(name, callback) {
                        var implCB = null;
                        if (name === 'onsuccess' && this.__iterationState !== null) {
                            implCB = createIterator(this, callback);
                        }
                        // call's SUPER!
                        MyDBEventTarget.prototype.__setCallback.call(this, name, callback, implCB);
                    };

                    return function(idbRequest, source, transaction, options) {
                        var req = new TheRequest(idbRequest, source, transaction, new MyOptions(options));
                        return req;
                    };
                });zone("nigiri.extension").factory("-MyOptions", [ "Utils" ], function(Utils) {
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
zone("nigiri.extension").factory("#createKeySetCursorRequest", [ "nigiri.cmp", "Utils", "createGenericCursorRequest", "MyOptions" ],
        function(compare, Utils, createGenericCursorRequest, MyOptions) {
    "use strict"

            var prevSort = function(a, b) {
                return compare(b, a);
            };

            var createState = function(keyset, direction) {
                var state = {
                    keys : keyset.__keys,
                    pos : 0,
                    nextKey : 0,
                    compare : compare
                };

                if (direction === 'prev' || direction === 'prevunique') {
                    state.compare = prevSort;
                    state.keys = state.keys.slice(0).sort(prevSort);
                }
                return state;
            };

            var setPosition = function(state, key) {
                state.pos = Utils.binarySearch(state.keys, state.compare, state.pos, key);
                return state.pos < state.keys.length;
            };

            var syncWithKeyset = function(cursor, state) {

                var actualKey, expectedKey, cmp;

                actualKey = cursor.key;

                expectedKey = state.keys[state.pos];
                cmp = state.compare(actualKey, expectedKey);

                // if the actual is greater than the actual key, then we just need to find the closest key
                // in the key set
                if (cmp > 0) {
                    // this is an assertion:
                    // there must at least be one other larger key in the keyset, otherwise the actual key would
                    // exceed the range of the of keyset!
                    if (!setPosition(state, actualKey)) {
                        throw new Error("Actual key exceeds the range of the keyset " + actualKey);
                    }

                    // we need to do another comparison, to see if the current actual key matches
                    // the new expected key
                    expectedKey = state.keys[state.pos];
                    cmp = state.compare(actualKey, expectedKey);

                    // at this point, the comparison must be <= 0
                    if (cmp > 0) {
                        throw new Error("Assertion failed; actual key still exceeds the expected key");
                    }
                }
                // if the two keys match, we notify the callback, provided we're not supposed to advance some more
                if (cmp === 0) {
                    return true;
                } 
                cursor["continue"](expectedKey);
                return false;
            };

            return function(impl, source, transaction, keyset, opts) {

                var options = new MyOptions(opts).getOptions();
                options.iterationState = createState(keyset, opts.direction);
                options.sync = syncWithKeyset;

                return createGenericCursorRequest(impl, source, transaction, new MyOptions(options));
            };

        });zone("nigiri.extension").factory("-deleteByCursor", [ "MyRequest", "updateByCursor" ], function(TheRequest, updateByCursor) {
    "use strict"

    var updateFN = function() {
        return undefined;
    };

    return function(cursorRequest) {
        return updateByCursor(cursorRequest, updateFN);
    };

});
zone("nigiri.extension").interceptor("nigiri.Nigiri", [ "MyKeyPath", "MyMultiKey", "MyKeySet", "MyEnumerableKeyRange", "MyQuery", "MyOptions" ],
        function(MyKeyPath, MyMultiKey, MyKeySet, MyEnumerableKeyRange, MyQuery, MyOptions) {
            "use strict"

            return function(Nigiri) {
                Nigiri.KeyPath = MyKeyPath;
                Nigiri.KeySet = MyKeySet;
                Nigiri.MultiKey = MyMultiKey;
                Nigiri.EnumerableKeyRange = MyEnumerableKeyRange;
                Nigiri.Query = MyQuery;
                Nigiri.Options = MyOptions;

                return Nigiri;
            };
        });
zone("nigiri.extension").factory("#getKeyByCursor", [ "MyRequest" ], function(TheRequest) {
    "use strict"

    return function(cursorRequest) {

        var request = new TheRequest(null, cursorRequest.source, cursorRequest.transaction);

        cursorRequest.onsuccess = function(e) {
            if (TheRequest.__resultValid(cursorRequest)) {
                request.__notifyOnSuccess(cursorRequest.result.primaryKey, e);
            } else {
                request.__notifyOnSuccess(undefined, e);
            }
        };
        cursorRequest.onerror = function(e) {
            request.__notifyOnError(cursorRequest.error, e);
        };

        request.__setOwnerOf(cursorRequest);
        return request;
    };

});
zone("nigiri.extension").factory("-getAllPrimaryKeysByCursor", [ "MyRequest", "nigiri.cmp" ], function(TheRequest, compare) {
    "use strict"

    var objectToArray = function(obj) {
        var res = [];
        var key = null;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                res.push(obj[key]);
            }
        }
        res.sort(compare);
        return res;
    };

    var getAll = function(cursorRequest) {

        var request = new TheRequest(null, cursorRequest.source, cursorRequest.transaction);
        var result = {};

        cursorRequest.onsuccess = function(e) {
            var key;
            if (TheRequest.__invalidResult(cursorRequest)) {
                request.__notifyOnSuccess(objectToArray(result), e);
            } else {
                key = cursorRequest.result.primaryKey;
                if (!result.hasOwnProperty(key)) {
                    result[key] = key;
                }
                cursorRequest.result["continue"]();
            }
        };
        cursorRequest.onerror = function(e) {
            request.__notifyOnError(cursorRequest.error, e);
        };

        request.__setOwnerOf(cursorRequest);
        return request;
    };
    return getAll;
});

zone("nigiri.extension").interceptor("nigiri.MyObjectStore", [ "getAllPrimaryKeysByCursor" ], function(getAll) {
    return function(ObjectStore) {
        ObjectStore.prototype.getAllPrimaryKeys = function() {
            var req = this.openCursor.apply(this, arguments);
            return getAll(req);
        };
        return ObjectStore;
    };
});

zone("nigiri.extension").interceptor("nigiri.MyIndex", [ "getAllPrimaryKeysByCursor" ], function(getAll) {
    return function(Index) {
        Index.prototype.getAllPrimaryKeys = function() {
            var req = this.openCursor.apply(this, arguments);
            return getAll(req);
        };
        return Index;
    };
});
zone("nigiri.extension").factory("-getAll", [ "MyRequest" ], function(TheRequest) {
    "use strict"

    var getAll = function(cursorRequest) {

        var request = new TheRequest(null, cursorRequest.source, cursorRequest.transaction);
        var result = [];

        cursorRequest.onsuccess = function(e) {
            if (TheRequest.__invalidResult(cursorRequest)) {
                request.__notifyOnSuccess(result, e);
            } else {
                result.push(cursorRequest.result.value);
                cursorRequest.result["continue"]();
            }
        };
        cursorRequest.onerror = function(e) {
            request.__notifyOnError(cursorRequest.error, e);
        };

        request.__setOwnerOf(cursorRequest);

        return request;
    };

    var get = function() {
        var req = this.openCursor.apply(this, arguments);
        return getAll(req);
    };

    return get;
});

zone("nigiri.extension").interceptor("nigiri.MyObjectStore", [ "getAll" ], function(getAll) {

    return function(ObjectStore) {
        ObjectStore.prototype.getAll = getAll;
        return ObjectStore;
    };
});
zone("nigiri.extension").interceptor("nigiri.MyIndex", [ "getAll" ], function(getAll) {

    return function(Index) {
        Index.prototype.getAll = getAll;
        return Index;
    };
});
zone("nigiri.extension").interceptor(
        "nigiri.cursors",
        [ "MyRequest", "MyKeySet", "MyMultiKey", "MyKeyRange", "MyOptions", "countByCursor", "getByCursor", "getKeyByCursor", "deleteByCursor",
                "createKeySetCursorRequest", "createGenericCursorRequest", "createMultiKeyCursorRequest", "MyQuery", "Utils" ],
        function(MyRequest, MyKeySet, MyMultiKey, MyKeyRange, MyOptions, countByCursor, getByCursor, getKeyByCursor, deleteByCursor, createKeySetCursorRequest,
                createGenericCursorRequest, createMultiKeyCursorRequest, MyQuery, Utils) {
            "use strict";

            var parseKeyArgs = function(array, withQuerySupport, withValues) {

                var options = {
                    withValues : withValues
                };

                var result = {
                    standard : true,
                    arguments : []
                };

                var i, n;
                for (i = 0, n = array.length; i < n; ++i) {
                    result.arguments.push(array[i]);
                }
                array = result.arguments;

                if (array.length === 0) {
                    // it's a range by default
                    result.range = null;
                } else {
                    if (withQuerySupport && array[0] instanceof MyQuery) {
                        result.query = array[0];
                        result.standard = false;
                    } else {
                        if (array[0] instanceof MyMultiKey) {
                            result.multikey = array[0];
                            array[0] = array[0];
                            result.standard = false;
                        } else if (array[0] instanceof MyKeySet) {
                            // if we have a keyset, then we need to use the range of the keyset
                            result.keyset = array[0];
                            array[0] = array[0];
                            result.standard = false;
                        }
                        // if the range is a key range, then need to get its implementaion
                        if (array[0] instanceof MyKeyRange) {
                            array[0] = array[0].__impl;
                        }

                        if (!(array[0] instanceof IDBKeyRange)) {
                            if (withQuerySupport && array[0] !== null && !Utils.is_array(array[0]) && (typeof array[0]) === "object") {
                                result.query = new MyQuery(array[0]);
                                result.standard = false;
                            } else {
                                result.range = array[0];
                            }
                        } else {
                            result.range = array[0];
                        }
                    }

                    if (array.length === 2) {
                        if (typeof array[1] === "string") {
                            options.direction = array[1];
                        } else {
                            if (!(array[1] instanceof MyOptions)) {
                                array[1] = new MyOptions(array[1]);
                            }
                            options.withValues = array[1].withValues || options.withValues;
                            options = Utils.extend({}, array[1].getOptions(), options);

                            // options always has a valid direction value!
                            array[1] = options.direction;
                        }
                    }
                }

                result.options = new MyOptions(options);

                result.standard = result.standard && result.options.isStandard;
                return result;
            };

            return function(Cursors) {

                Cursors.createCursorRequest = function(implSource, source, transaction, withValues, args) {

                    var req = null;
                    var parsedArgs = parseKeyArgs(args, true, withValues);

                    if (parsedArgs.options.withValues || !implSource.openKeyCursor) {
                        req = implSource.openCursor.apply(implSource, parsedArgs.arguments);
                    } else {
                        req = implSource.openKeyCursor.apply(implSource, parsedArgs.arguments);
                    }

                    if (parsedArgs.multikey) {
                        req = createMultiKeyCursorRequest(req, source, transaction, parsedArgs.multikey, parsedArgs.options);
                    } else if (parsedArgs.keyset) {
                        req = createKeySetCursorRequest(req, source, transaction, parsedArgs.keyset, parsedArgs.options);
                    } else {
                        req = createGenericCursorRequest(req, source, transaction, parsedArgs.options);
                    }
                    return req;
                };

                Cursors.createCountByCursorRequest = function(implSource, source, transaction, args) {
                    var parsedArgs = parseKeyArgs(args);
                    var req = null;

                    if (parsedArgs.standard) {
                        req = implSource.count.apply(implSource, parsedArgs.arguments);
                        req = new MyRequest(req, source, transaction);
                    } else {
                        req = Cursors.createCursorRequest(implSource, source, transaction, parsedArgs.options.withValues, args);
                        req = countByCursor(req);
                    }
                    return req;
                };

                Cursors.createDeleteByCursorRequest = function(implSource, source, transaction, args) {
                    var parsedArgs = parseKeyArgs(args);
                    var req = null;

                    if (parsedArgs.standard) {
                        req = implSource["delete"].apply(implSource, parsedArgs.arguments);
                        req = new MyRequest(req, source, transaction);
                    } else {
                        req = Cursors.createCursorRequest(implSource, source, transaction, parsedArgs.options.withValues, args);
                        req = deleteByCursor(req);
                    }
                    return req;
                };

                Cursors.createGetByCursorRequest = function(implSource, source, transaction, args) {
                    var parsedArgs = parseKeyArgs(args);
                    parsedArgs.withValues = true;
                    var req = null;
                    if (parsedArgs.standard) {
                        req = implSource.get.apply(implSource, parsedArgs.arguments);
                        req = new MyRequest(req, source, transaction);
                    } else {
                        req = Cursors.createCursorRequest(implSource, source, transaction, true, args);
                        req = getByCursor(req);
                    }
                    return req;
                };

                Cursors.createGetKeyByCursorRequest = function(implSource, source, transaction, args) {
                    var parsedArgs = parseKeyArgs(args);
                    var req = null;
                    if (parsedArgs.standard) {
                        req = implSource.getKey.apply(implSource, parsedArgs.arguments);
                        req = new MyRequest(req, source, transaction);
                    } else {
                        req = Cursors.createCursorRequest(implSource, source, transaction, parsedArgs.options.withValues, args);
                        req = getKeyByCursor(req);
                    }
                    return req;
                };

                //
                // //////////////////////////////
                //
                Cursors.createObjectStoreCursorRequest = function(store, args) {
                    var parsedArgs = parseKeyArgs(args, true, true);
                    var req = null;
                    if (parsedArgs.query) {
                        req = parsedArgs.query.__openCursor(store, parsedArgs.options);
                    } else {
                        req = Cursors.createCursorRequest(store.__impl, store, store.transaction, true, args);
                    }
                    return req;
                };

                Cursors.createObjectStoreCountByCursorRequest = function(store, args) {
                    var parsedArgs = parseKeyArgs(args, true);
                    var req = null;

                    if (parsedArgs.standard) {
                        req = store.__impl.count.apply(store.__impl, parsedArgs.arguments);
                        req = new MyRequest(req, store, store.transaction);
                    } else {
                        req = Cursors.createObjectStoreCursorRequest(store, args);
                        req = countByCursor(req);
                    }
                    return req;
                };

                Cursors.createObjectStoreDeleteByCursorRequest = function(store, args) {
                    var parsedArgs = parseKeyArgs(args, true);
                    var req = null;

                    if (parsedArgs.standard) {
                        req = store.__impl["delete"].apply(store.__impl, parsedArgs.arguments);
                        req = new MyRequest(req, store, store.transaction);
                    } else {
                        req = Cursors.createObjectStoreCursorRequest(store, args);
                        req = deleteByCursor(req);
                    }
                    return req;
                };

                Cursors.createObjectStoreGetByCursorRequest = function(store, args) {
                    var parsedArgs = parseKeyArgs(args, true, true);
                    var req = null;
                    if (parsedArgs.standard) {
                        req = store.__impl.get.apply(store.__impl, parsedArgs.arguments);
                        req = new MyRequest(req, store, store.transaction);
                    } else {
                        req = Cursors.createObjectStoreCursorRequest(store, args);
                        req = getByCursor(req);
                    }
                    return req;
                };

                return Cursors;
            };
        });zone("nigiri.extension").factory("#createKeyRange", [ "MyKeyRange", "MyKeySet", "MyEnumerableKeyRange", "MyMultiKey", "nigiri.cmp", "Utils" ],
        function(KeyRange, KeySet, EnumerableKeyRange, MultiKey, compareKeys, Utils) {
            "use strict"

            return function(values) {

                if (values instanceof EnumerableKeyRange) {
                    return values;
                }
                if (values instanceof KeyRange) {
                    return values;
                }
                if (values instanceof IDBKeyRange) {
                    return new KeyRange(values);
                }

                if (Utils.is_array(values)) {
                    if (values.length === 1) {
                        return KeyRange.only(values);
                    } else {
                        return new KeySet(values);
                    }
                }
                if (values === true) {
                    return {
                        contains : function(x) {
                            return x === true;
                        }
                    };
                } else if (values === false) {
                    return {
                        contains : function(x) {
                            return x === false;
                        }
                    };
                }

                if (Utils.is_function(values)) {
                    return {
                        contains : values
                    };
                }

                var res = KeyRange.only(values);
                return res;
            };
        });

zone("nigiri.extension").interceptor("nigiri.MyKeyRange", [ "nigiri.cmp" ], function(compareKeys) {
    return function(KeyRange) {

        Object.defineProperty(KeyRange.prototype, "range", {
            get : function() {
                return this;
            }
        });

        KeyRange.prototype.contains = function(x) {

            var cmpUpper = -1;
            var cmpLower = 1;

            if (this.upper !== null) {
                cmpUpper = compareKeys(x, this.upper);
                if (cmpUpper > 0 || (cmpUpper === 0 && this.upperOpen)) {
                    return false;
                }
            }

            if (this.lower !== null) {
                cmpLower = compareKeys(x, this.lower);
                if (cmpLower < 0 || (cmpLower === 0 && this.lowerOpen)) {
                    return false;
                }
            }

            return true;
        };

        KeyRange.prototype.ceiling = function(key) {

            // if the value is above outside the upper bound,
            // then we're done with the range
            var cmp;
            if (this.upper !== null) {
                cmp = compareKeys(this.upper, key);
                if (cmp < 0 || (cmp === 0 && this.upperOpen)) {
                    return undefined;
                }
            }
            if (this.lower !== null) {
                // if the value is definitely lower than the lower bound,
                // then we return the lower bound even if the lower end is open
                cmp = compareKeys(this.lower, key);
                if (cmp > 0) {
                    return this.lower;
                }
            }
            return key;
        };

        KeyRange.prototype.floor = function(key) {

            // if the value is above outside the upper bound,
            // then we're done with the range
            var cmp = compareKeys(key, this.lower);
            if (cmp < 0 || (cmp === 0 && this.lowerOpen)) {
                return undefined;
            }

            // if the value is definitely lower than the lower bound,
            // then we return the lower bound even if the lower end is open
            cmp = compareKeys(key, this.upper);
            if (cmp > 0) {
                return this.upper;
            }
            return key;
        };

        return KeyRange;
    };

});
zone("nigiri.extension").factory("-getAllKeysByCursor", [ "MyRequest", "nigiri.cmp" ], function(TheRequest, compare) {
    "use strict"

    var getAll = function(cursorRequest) {

        var request = new TheRequest(null, cursorRequest.source, cursorRequest.transaction);
        var result = [];

        cursorRequest.onsuccess = function(e) {
            var n = result.length;
            var key;
            if (TheRequest.__invalidResult(cursorRequest)) {
                request.__notifyOnSuccess(result, e);
            } else {
                key = cursorRequest.result.key;
                if (n === 0 || compare(result[n - 1], key) !== 0) {
                    result.push(key);
                }
                cursorRequest.result["continue"]();
            }
        };
        cursorRequest.onerror = function(e) {
            request.__notifyOnError(cursorRequest.error, e);
        };

        request.__setOwnerOf(cursorRequest);

        return request;
    };
    return getAll;
});

zone("nigiri.extension").interceptor("nigiri.MyObjectStore", [ "getAllKeysByCursor" ], function(getAllKeysByCursor) {

    return function(ObjectStore) {
        ObjectStore.prototype.getAllKeys = function() {
            var req = this.openCursor.apply(this, arguments);
            return getAllKeysByCursor(req);
        };
        return ObjectStore;
    };
});

zone("nigiri.extension").interceptor("nigiri.MyIndex", [ "getAllKeysByCursor" ], function(getAllKeysByCursor) {
    return function(Index) {
        Index.prototype.getAllKeys = function() {
            var req = this.openKeyCursor.apply(this, arguments);
            return getAllKeysByCursor(req);
        };
        return Index;
    };
});
zone("nigiri.extension").factory("-MyMultiKey", [ "nigiri.cmp", "MyEnumerableKeyRange", "Utils" ], function(compareKeys, MyEnumerableKeyRange, Utils) {
    "use strict"

    var TheMultiKey = function(keys, verified) {

        var i = 0, n = keys.length;
        var lo = [];
        var hi = [];
        var key;
        if (n===0) {
            throw new Error("Empty MultiKey");
        }
        for (; i < n; ++i) {
            if (!(keys[i] instanceof MyEnumerableKeyRange)) {
                throw new Error("Not an emumerable key range " + keys[i]);
            }
            key = keys[i];
            if (i > 0 && !key.bounded) {
                throw new Error("Key " + i + " is not bounded");
            }
            lo.push(key.lower);
            hi.push(key.upper);
        }

        this.__keys = Object.freeze(keys.slice(0));

        MyEnumerableKeyRange.call(this, lo, hi);
    };

    TheMultiKey.prototype = Object.create(MyEnumerableKeyRange.prototype);
    TheMultiKey.prototype.constructor = TheMultiKey;

    TheMultiKey.prototype.next = function(keys) {
        var i, key, nextKey;
        var result = null;
        keys = keys.slice();

        for (i = this.__keys.length; --i > 0;) {
            key = this.__keys[i];
            nextKey = key.next(keys[i]);
            if (nextKey !== undefined) {
                keys[i] = nextKey;
                if (this.contains(keys)) {
                    result = keys;
                    break;
                }
            }
            keys[i] = key.lower;
        }
        if (result === null) {
            keys[0] = this.__keys[0].next(keys[0]);
            if (keys[0] !== undefined) {
                result = keys;
            }
        }
        if (result === null || !this.contains(result)) {
            return undefined;
        }
        return result;
    };

    TheMultiKey.prototype.pred = function(keys) {
        var i, key, nextKey;
        var result = null;
        keys = keys.slice();

        for (i = this.__keys.length; --i > 0;) {
            key = this.__keys[i];
            nextKey = key.pred(keys[i]);
            if (nextKey !== undefined) {
                keys[i] = nextKey;
                if (this.contains(keys)) {
                    result = keys;
                    break;
                }
            }
            keys[i] = key.upper;
        }
        if (result === null) {
            keys[0] = this.__keys[0].pred(keys[0]);
            if (keys[0] !== undefined) {
                result = keys;
            }
        }
        if (result === null || !this.contains(result)) {
            return undefined;
        }
        return result;
    };

    TheMultiKey.prototype.contains = function(v) {
        var i, n;
        for (i = 0, n = this.__keys.length; i < n; ++i) {
            if (!this.__keys[i].contains(v[i])) {
                return false;
            }
        }
        return true;
    };

    return TheMultiKey;
});
zone("nigiri.extension").factory("-countByCursor", [ "MyRequest" ], function(TheRequest) {
    "use strict"

    return function(cursorRequest) {
        var request = new TheRequest(null, cursorRequest.source, cursorRequest.transaction);
        var count = 0;
        cursorRequest.onsuccess = function(e) {
            if (TheRequest.__resultValid(cursorRequest)) {
                ++count;
                cursorRequest.result["continue"]();
            } else {
                request.__notifyOnSuccess(count, e);
            }
        };
        cursorRequest.onerror = function(e) {
            request.__notifyOnError(cursorRequest.error, e);
        };
        request.__setOwnerOf(cursorRequest);
        return request;
    };

});
zone("nigiri.extension").factory("-updateByCursor", [ "MyRequest" ], function(TheRequest) {
    "use strict"

    /**
     * Create a new update function. The update function takes a value
     * 
     * @param cursorRequest
     *            an existing cursor request
     * @param updateFN
     *            the update function
     */
    var updateAll = function(cursorRequest, updateFN) {

        var request = new TheRequest(null, cursorRequest.source, cursorRequest.transaction);

        var nOutstanding = 1; // init to 1 to account for the cursor
        var result = {
            successes : 0,
            errors : 0
        };

        var notifyWhenDone = function() {
            if (--nOutstanding === 0) {
                request.__notifyOnSuccess(result);
            }
            if (nOutstanding < 0) {
                throw new Error("Internal error; mismatched calls");
            }
        };

        var onsuccess = function(e) {
            ++result.successes;
            notifyWhenDone();
        };

        var onerror = function(e) {
            // if the user provides an error handler for a batch request,
            // we need to invoke it to all the user to cancel the transaction
            // if will be aborted, then we return immediately
            if (request.__notifyOnError("update failed", e)) {

                if (!e.defaultPrevented) {
                    // drop out at this point
                    return;
                }
            }

            e.preventDefault();
            e.stopPropagation();
            ++result.errors;
            notifyWhenDone();
        };

        cursorRequest.onsuccess = function(e) {
            var updateRequest;
            if (TheRequest.__invalidResult(cursorRequest)) {
                notifyWhenDone();
                return;
            }

            try {
                var value = cursorRequest.result.value;
                if (value === undefined) {
                    console.log("Not a cursor with values");
                    ++result.errors;

                    // we do not continue beyond here since this isn't a cursor with values
                    notifyWhenDone();
                    return;
                }

                var newValue = updateFN(value);
                if (newValue === undefined) {
                    // console.log("DELETE "+cursorRequest.result.primaryKey);
                    updateRequest = cursorRequest.result["delete"]();
                } else if (newValue !== null) {
                    // console.log("UPDATE "+cursorRequest.result.primaryKey);
                    updateRequest = cursorRequest.result.update(newValue);
                } else {
                    updateRequest = null;
                }

                if (updateRequest !== null) {
                    updateRequest.onsuccess = onsuccess;
                    updateRequest.onerror = onerror;
                    ++nOutstanding;
                }
                cursorRequest.result["continue"]();
            } catch (error) {
                console.log(error.stack);
                ++result.errors;
                notifyWhenDone();
            }

        };
        cursorRequest.onerror = function(e) {
            request.__notifyOnError("Cursor Failed", e);
        };

        request.__setOwnerOf(cursorRequest);
        return request;
    };

    return updateAll;
});

zone("nigiri.extension").interceptor("nigiri.MyObjectStore", [ "updateByCursor" ], function(updateAll) {

    var update = function() {
        var fn = [].shift.call(arguments);
        var req = this.openCursor.apply(this, arguments);
        return updateAll(req, fn);
    };

    return function(ObjectStore) {
        ObjectStore.prototype.update = update;
        return ObjectStore;
    };
});
zone("nigiri.extension").interceptor("nigiri.MyIndex", [ "updateByCursor" ], function(updateAll) {

    var update = function() {
        var fn = [].shift.call(arguments);
        var req = this.openCursor.apply(this, arguments);
        return updateAll(req, fn);
    };

    return function(Index) {
        Index.prototype.update = update;
        return Index;
    };
});
zone("nigiri.extension").factory("-getKeySet", [ "MyKeySet", "MyRequest" ], function(KeySet, TheRequest) {
    "use strict"

    var getKeySet = function(source, transaction) {
        var request = new TheRequest(null, source, transaction);

        // get all the keys
        var req = source.getAllKeys(null,"nextunique");

        req.onsuccess = function(e) {
            var ks = null;
            if (req.result.length > 0) {
                ks = new KeySet(req.result);
            }
            request.__notifyOnSuccess(ks);
        };

        req.onerror = function(e) {
            request.__notifyOnError(req.error);
        };

        request.__setOwnerOf(req);

        return request;
    };

    return getKeySet;
});

zone("nigiri.extension").interceptor("nigiri.MyObjectStore", [ "getKeySet" ], function(getKeySet) {

    return function(ObjectStore) {

        ObjectStore.prototype.getKeySet = function() {
            return getKeySet(this, this.transaction);
        };
        return ObjectStore;
    };
});

zone("nigiri.extension").interceptor("nigiri.MyIndex", [ "getKeySet" ], function(getKeySet) {

    return function(Index) {

        Index.prototype.getKeySet = function() {
            return getKeySet(this, this.transaction);
        };
        return Index;
    };
});
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
zone("nigiri.extension").factory("-MyKeySet", [ "nigiri.cmp", "MyKeyRange", "MyEnumerableKeyRange", "Utils" ],
        function(compareKeys, TheKeyRange, MyEnumerableKeyRange, Utils) {
            "use strict"

            var intersectArrays = function(a, b) {
                var res = [];
                var i = 0, j = 0, nA = a.length, nB = b.length, outcome;
                while (i < nA && j < nB) {
                    outcome = compareKeys(a[i], b[j]);
                    if (outcome === 0) {
                        res.push(a[i]);
                        ++i;
                        ++j;
                    } else if (outcome < 0) {
                        ++i;
                    } else if (outcome > 0) {
                        ++j;
                    }
                }

                return res;
            };

            var mergeArrays = function(a, b) {
                var ai = 0, bi = 0, outcome, val;
                var res = [];
                while (ai < a.length && bi < b.length) {
                    outcome = compareKeys(a[ai], b[bi]);
                    if (outcome === 0) {
                        val = a[ai];
                        ++ai;
                        ++bi;
                    } else if (outcome < 0) {
                        val = a[ai++];
                    } else {
                        val = b[bi++];
                    }
                    res.push(val);
                }
                while (ai < a.length) {
                    res.push(a[ai++]);
                }
                while (bi < b.length) {
                    res.push(b[bi++]);
                }
                return res;
            };

            var TheKeySet = function(keys, verified) {
                var n = keys.length;
                if (n === 0) {
                    throw new Error("Empty KeySet");
                }
                keys = keys.slice();
                if (!verified) {
                    for (var i = 1; i < n; ++i) {
                        if (compareKeys(keys[i - 1], keys[i]) >= 0) {
                            throw new Error("Keyset is not sorted");
                        }
                    }
                }

                this.__keys = Object.freeze(keys);
                this.__range = TheKeyRange.bound(keys[0], keys[n - 1]);
                MyEnumerableKeyRange.call(this, keys[0], keys[n - 1]);
            };

            TheKeySet.prototype = Object.create(MyEnumerableKeyRange.prototype);
            TheKeySet.prototype.constructor = TheKeySet;

            TheKeySet.prototype.next = function(key) {
                var i = Utils.binarySearch(this.__keys, compareKeys, 0, key);
                if (i < this.__keys.length) {
                    if (compareKeys(this.__keys[i], key) !== 0) {
                        return this.__keys[i];
                    }
                    ++i;
                }
                if (i === this.__keys.length) {
                    return undefined;
                }
                return this.__keys[i];
            };

            TheKeySet.prototype.pred = function(key) {
                var i = Utils.binarySearch(this.__keys, compareKeys, 0, key);
                if (i === this.__keys.length) {
                    return undefined;
                }
                --i;
                if (i < 0) {
                    return undefined;
                }
                return this.__keys[i];
            };

            TheKeySet.prototype.indexOf = function(key) {
                return Utils.findByBinarySearch(this.__keys, compareKeys, 0, key);
            };

            TheKeySet.prototype.contains = function(v) {
                return this.indexOf(v) !== -1;
            };

            TheKeySet.prototype.intersect = function(ks) {
                var res = intersectArrays(this.__keys, ks.__keys);
                if (res.length === 0) {
                    return null;
                }
                return new TheKeySet(res, true);
            };

            TheKeySet.prototype.merge = function(ks) {
                var res = mergeArrays(this.__keys, ks.__keys);
                return new TheKeySet(res, true);
            };

            Utils.addConstProperty(TheKeySet.prototype, "keys");

            return TheKeySet;
        });
zone("nigiri.extension").factory("-MyQuery", [ "Utils", "MyRequest", "nigiri.cmp", "MyOptions", "MyKeyPath", "MyKeyRange", "MyKeySet", "createKeyRange" ],
        function(Utils, TheRequest, compareKeys, Options, KeyPath, MyKeyRange, KeySet, createKeyRange) {
            "use strict"

            var createIndex = function(obj, name) {
                var tmp = {
                    name : name,
                    conditions : null,
                    keyValue : null,
                };
                tmp.index = obj;
                tmp.keyPath = new KeyPath(obj.keyPath);
                tmp.nPaths = tmp.keyPath.paths.length;

                if (tmp.nPaths > 1) {
                    console.log("Warning : multi-indexes not really supported at this time");
                    return null;
                }
                return tmp;
            };

            // collect the indexes for the store and build a structure that we can more easily query
            var createIndexes = function(store) {
                var res = [];
                var i, n, name, names = store.indexNames, tmp;

                for (i = 0, n = names.length; i < n; ++i) {
                    name = names.item(i);
                    tmp = createIndex(store.index(name), name);
                    if (tmp !== null) {
                        res.push(tmp);
                    }
                }

                res.sort(function(a, b) {
                    return a.nPaths > b.nPaths ? -1 : (a.nPaths < b.nPaths ? 1 : 0);
                });

                return res;
            };

            var createKeyValue = function(index, conditions) {
                var kp = null, value = null;
                for (kp in conditions) {
                    if (conditions.hasOwnProperty(kp)) {
                        value = conditions[kp];
                    }
                }
                return value;
            };

            // assign conditions to indexes;
            var assignIndex = function(index, allConditions, unassigned) {
                var i, p, atLeast1Unassigned = false;
                var range;
                var res = [];
                for (i = 0; i < index.nPaths; ++i) {
                    p = index.keyPath.paths[i];
                    range = allConditions[p];
                    if (range instanceof KeySet || range instanceof MyKeyRange) {
                        res.push(index.keyPath.paths[i]);
                    } else {
                        // not a usable condition
                        return;
                    }
                }

                // check that at least one of the assigned conditions is still unassigned overall
                for (i = 0; i < res.length; ++i) {
                    if (unassigned[res[i]]) {
                        atLeast1Unassigned = true;
                        break;
                    }
                }

                // one of the conditions is still unassigned, so we might as well use it here
                if (atLeast1Unassigned) {
                    // first, collect all conditions
                    index.conditions = {};
                    for (i = 0; i < res.length; ++i) {
                        // this needs to be done in the right order for multi-indexes
                        index.conditions[res[i]] = allConditions[res[i]];
                    }
                    // create a key that we can use for the actual quer
                    index.keyValue = createKeyValue(index, index.conditions);

                    // and upon a successful query creation we can mark the conditions as unassigned
                    if (index.keyValue !== null) {
                        for (i = 0; i < res.length; ++i) {
                            delete unassigned[res[i]];
                        }
                    }
                }
            };

            // assign conditions to indexes in a somewhat optimal way
            // returns conditions that cannot be satisfied by an index query
            var assignConditions = function(indexes, allConditions) {
                var unassigned = {};
                var key = null, i;

                // mark all conditions are unassigned
                for (key in allConditions) {
                    if (allConditions.hasOwnProperty(key)) {
                        unassigned[key] = true;
                    }
                }
                for (i = 0; i < indexes.length; ++i) {
                    assignIndex(indexes[i], allConditions, unassigned);
                }

                for (key in unassigned) {
                    if (unassigned.hasOwnProperty(key)) {
                        unassigned[key] = allConditions[key];
                    }
                }
                return unassigned;
            };

            var assignStoreQuery = function(store, allConditions) {
                if (store.keyPath === null) {
                    return null;
                }
                var range = allConditions[store.keyPath];
                if (range) {
                    delete allConditions[store.keyPath];
                    return range;
                }
                return null;
            };

            var intersectArrays = function(a, b) {
                var res = [];
                var i = 0, j = 0, nA = a.length, nB = b.length, cmp;
                while (i < nA && j < nB) {
                    cmp = compareKeys(a[i], b[j]);
                    if (cmp === 0) {
                        res.push(a[i]);
                        ++i;
                        ++j;
                    } else if (cmp < 0) {
                        ++i;
                    } else if (cmp > 0) {
                        ++j;
                    }
                }

                return res;
            };

            // start executing requests against the individual indexes
            var startIndexQueries = function(store, indexes, includedKeys, excludedKeys) {

                var nOutstanding = 0;
                var allKeys = includedKeys === null ? null : includedKeys.keys;
                var firstError = false;

                var opts = new Options({
                    includedPrimaryKeys : includedKeys || null,
                    excludedPrimaryKeys : excludedKeys || null
                });

                var request = null;

                var onsuccess = function(req) {
                    return function(e) {
                        if (firstError) {
                            // an error has already been returned
                            return;
                        }

                        if (allKeys === null) {
                            allKeys = req.result;
                        } else {
                            allKeys = intersectArrays(allKeys, req.result);
                        }
                        if (--nOutstanding === 0) {
                            request.__notifyOnSuccess(allKeys);
                        }
                    };
                };

                var onerror = function(req) {
                    return function(e) {

                        allKeys = [];
                        --nOutstanding;
                        if (firstError === false) {
                            firstError = true;
                            request.__notifyOnError(req.error, e);
                        } else {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    };
                };

                var i, req, index;
                for (i = 0; i < indexes.length; ++i) {
                    index = indexes[i];
                    if (index.keyValue !== null) {
                        if (request === null) {
                            request = new TheRequest(null, store, store.transaction);
                        }
                        req = index.index.getAllPrimaryKeys(index.keyValue, opts);
                        request.__setOwnerOf(req);
                        req.onsuccess = onsuccess(req);
                        req.onerror = onerror(req);
                        ++nOutstanding;
                    }
                }

                return request;
            };

            var createFilterFunction = function(keypath, range, otherFilterFN) {
                keypath = new KeyPath(keypath);

                if (keypath.paths.length !== 1) {
                    throw new Error("No a simple keypath");
                }

                var p = keypath.paths[0];

                // create a range from a values objects

                if (otherFilterFN) {
                    return function(cursor) {
                        var v;
                        if (!otherFilterFN(cursor)) {
                            return false;
                        }
                        v = keypath.applyPath(cursor.value);
                        return v.hasOwnProperty(p) && range.contains(v[p]);
                    };
                } else {
                    return function(cursor) {
                        var v = keypath.applyPath(cursor.value);
                        return v.hasOwnProperty(p) && range.contains(v[p]);
                    };
                }
            };

            var createFilter = function(unassigned, fn) {
                fn = fn || null;
                var keypath = null;
                for (keypath in unassigned) {
                    if (unassigned.hasOwnProperty(keypath)) {
                        fn = createFilterFunction(keypath, unassigned[keypath], fn);
                    }
                }
                return fn;
            };

            var TheQuery = function(conditions, options) {
                var kp = null, cond = null;
                this.__conditions = {};
                for (kp in conditions) {
                    if (conditions.hasOwnProperty(kp)) {
                        cond = conditions[kp];
                        this.__conditions[kp] = createKeyRange(cond);
                    }
                }
                options = options || {};
                this.__includedPrimaryKeys = options.includedPrimaryKeys || null;
                this.__excludedPrimaryKeys = options.excludedPrimaryKeys || null;
            };

            var openCursor = function(store, query, range, options) {
                return store.openCursor(range, options);
            };

            TheQuery.prototype.__openCursor = function(store, options) {
                var indexes = createIndexes(store);
                var xrange = assignStoreQuery(store, this.__conditions);
                var unassigned = assignConditions(indexes, this.__conditions);
                var filter = createFilter(unassigned, this.__filter);
                var primaryKeys = startIndexQueries(store, indexes, this.__includedPrimaryKeys, this.__excludedPrimaryKeys);
                var request = null;

                if (filter) {
                    if (options.filter) {
                        var optFilter = options.filter;
                        filter = function(x) {
                            return filter(x) && optFilter(x);
                        };
                    }
                    // create new options
                    options = new Options(Utils.extend({}, options, {
                        filter : filter
                    }));
                }

                if (primaryKeys === null) {
                    request = openCursor(store, this, xrange, options);
                } else {

                    request = new TheRequest(null, store, store.transaction);
                    request.__setOwnerOf(primaryKeys);

                    primaryKeys.onsuccess = function(e) {
                        var allKeys = primaryKeys.result;
                        var range = xrange;
                        if (allKeys.length === 0) {
                            request.__readyState = "done";
                            request.__notifyOnSuccess(null);
                            return;
                        }
                        if (range === null) {
                            range = new KeySet(allKeys);
                            allKeys = null;
                        } else {
                            options = new Options(Utils.extend({}, options, {
                                includedPrimaryKeys : allKeys
                            }));
                        }
                        request.__setImpl(openCursor(store, this, range, options));
                    };
                    primaryKeys.onError = function(e) {
                        request.__notifyOnError(primaryKeys.request, e);
                    };
                }

                return request;
            };

            return TheQuery;

        });
zone("nigiri").factory("#MyEnumerableKeyRange", [ "Utils", "nigiri.cmp", "MyKeyRange" ], function(Utils, compareKeys, MyKeyRange) {
    "use strict"

    var unimplemented = function() {
        throw new Error("Unimplemented operation");
    };

    /**
     * @constructor
     */
    var MyEnumerableKeyRange = function(lo, hi, pred, next) {
        MyKeyRange.call(this, IDBKeyRange.bound(lo, hi, false, false));
        this.__pred = this.__next = unimplemented;
        if (pred) {
            this.__pred = pred;
        }
        if (next) {
            this.__next = next;
        }
        this.__bounded = (hi !== undefined && lo !== undefined);
    };

    MyEnumerableKeyRange.prototype = Object.create(MyKeyRange.prototype);
    MyEnumerableKeyRange.prototype.constructor = MyEnumerableKeyRange;

    Utils.addConstProperty(MyEnumerableKeyRange.prototype, "bounded");

    MyEnumerableKeyRange.prototype.next = function(key) {
        key = this.__next(key);
        if (key===undefined || this.upper !== null && compareKeys(key, this.upper) > 0) {
            return undefined;
        }
        return key;
    };

    MyEnumerableKeyRange.prototype.pred = function(key) {
        key = this.__pred(key);
        if (key===undefined || this.lower !== null && compareKeys(key, this.lower) < 0) {
            return undefined;
        }
        return key;
    };

    MyEnumerableKeyRange.prototype.ceiling = function(key) {
        if (this.contains(key)) {
            return key;
        }
        if (this.lower !== null && compareKeys(key, this.lower) < 0) {
            return this.lower;
        }
        return this.next(key);
    };

    MyEnumerableKeyRange.prototype.floor = function(key) {
        if (this.contains(key)) {
            return key;
        }
        if (this.upper !== null && compareKeys(key, this.upper) > 0) {
            return this.upper;
        }
        return this.pred(key);
    };

    return MyEnumerableKeyRange;
});
/**
 * This object is used for objects that wrap a native object.
 */
zone("nigiri").factory("-WrapperObject",function() {
    "use strict"
    
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
zone("nigiri").service("Nigiri", [ "FACTORY", "MyKeyRange" ], function(IDB, KeyRange) {
    "use strict"

    this.IndexedDB = IDB;
    this.KeyRange = KeyRange;
});
zone("nigiri").factory("#EventWrapper", [ "WrapperObject" ], function(WrapperObject) {
    "use strict"

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

zone("nigiri").factory("#createSuccessEvent", function() {

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

zone("nigiri").factory("#createErrorEvent", function() {

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
zone("nigiri").service("#Utils", function() {
    "use strict"
    var undefinedAsNull = function(x) {
        return typeof x === 'undefined' ? null : x;
    };

    this.TRUE_FUNCTION = function() {
        return true;
    };

    this.FALSE_FUNCTION = function() {
        return false;
    };

    this.IDENTITY_FUNCTION = function(a) {
        return a;
    };

    // from jQuery
    this.is_array = function(o) {
        if (o !== null && typeof o == "object") {
            return (typeof o.push == "undefined") ? false : true;
        } else {
            return false;
        }
    };

    this.is_function = function(o) {
        return o !== null && typeof o === 'function';
    };

    this.extend = function(obj) {

        var i, n = arguments.length;
        var p = null, arg;
        for (i = 1; i < n; ++i) {
            arg = arguments[i];
            for (p in arg) {
                if (arg.hasOwnProperty(p)) {
                    obj[p] = arg[p];
                }
            }
        }
        return obj;
    };

    this.shallow_copy = function(obj) {
        var i, n, res, name;
        obj = obj || {};
        if (this.is_array(obj)) {
            res = [];
            for (i = 0, n = obj.length; i < n; ++i) {
                res[i] = obj[i];
            }
        } else {
            res = {};
            name = null;
            obj = obj || {};
            for (name in obj) {
                if (obj.hasOwnProperty(name)) {
                    res[name] = obj[name];
                }
            }
        }
        return res;
    };

    this.addConstProperty = function(prototype, name) {
        var pname = "__" + name;
        Object.defineProperty(prototype, name, {
            get : function() {
                return this[pname];
            }
        });
    };

    this.addProperty = function(prototype, name) {
        var pname = "__" + name;
        Object.defineProperty(prototype, name, {
            get : function() {
                return this[pname];
            },
            set : function(x) {
                this[pname] = x;
            }
        });
    };

    this.addConstAttribute = function(prototype, name, transform) {
        var getter;

        if (transform) {
            getter = function() {
                return transform(this.__impl[name]);
            };
        } else {
            getter = function() {
                var pv = this.__impl[name];
                if (pv !== null && this.__propertyMapper && this.__propertyMapper[name]) {
                    pv = this.__propertyMapper[name](pv);
                }
                return pv;
            };
        }

        Object.defineProperty(prototype, name, {
            get : getter
        });
    };

    this.addAttribute = function(prototype, name, getTransform, setTransform) {
        var setter, getter;
        if (setTransform) {
            setter = function(x) {
                this.__impl[name] = setTransform(x);
            };
            getter = function() {
                return getTransform(this.__impl[name]);
            };
        } else {
            setter = function(x) {
                this.__impl[name] = x;
            };
            getter = function() {
                return this.__impl[name];
            };
        }

        Object.defineProperty(prototype, name, {
            get : getter,
            set : setter
        });
    };

    /**
     * Perform a binary search on array.
     * 
     * @param keys
     *            an sorted array of values to search
     * @param compareKeys
     *            a compare keys function
     * @param pos
     *            a starting position in the array
     * @param key
     *            a key to search for
     * @return the index at which the key is found or the smallest position whose value is larger than the key
     */
    this.binarySearch = function(keys, compareKeys, pos, key) {
        // simple function for now
        var i = pos, j = keys.length - 1, k, cmp;

        // defensive programming here, should not really ever happen
        if (pos > j) {
            console.log("Error " + pos + " already at the end");
            return keys.length;
        }

        while (i < j) {
            // due to floor, k !== j, but it might be ===i
            k = Math.floor((i + j) / 2);
            cmp = compareKeys(key, keys[k]);
            if (cmp === 0) {
                return k;
            }
            if (cmp < 0) {
                // need to use k, because we might need to return k
                j = k;
            } else {
                // since key[k] is less k, will never be a valid answer
                // so we can safely increase by 1
                i = k + 1;
            }
        }

        // assert i===j
        if (compareKeys(key, keys[i]) <= 0) {
            return i;
        }
        return keys.length;
    };

    /**
     * Perform a binary search on array.
     * 
     * @param keys
     *            an sorted array of values to search
     * @param compareKeys
     *            a compare keys function
     * @param pos
     *            a starting position in the array
     * @param key
     *            a key to search for
     * @return the index at which the key is found or -1 if not found
     */
    this.findByBinarySearch = function(keys, compareKeys, pos, key) {
        // simple function for now
        var i = pos, j = keys.length - 1, k, cmp;

        // defensive programming here, should not really ever happen
        if (pos > j) {
            console.log("Error " + pos + " already at the end");
            return -1;
        }

        while (i < j) {
            // due to floor, k !== j, but it might be ===i
            k = Math.floor((i + j) / 2);
            cmp = compareKeys(key, keys[k]);
            if (cmp === 0) {
                return k;
            }
            if (cmp < 0) {
                // need to use k, because we might need to return k
                j = k;
            } else {
                // since key[k] is less k, will never be a valid answer
                // so we can safely increase by 1
                i = k + 1;
            }
        }

        // assert i===j
        if (compareKeys(key, keys[i]) === 0) {
            return i;
        }
        return -1;
    };
});zone("nigiri").factory("#MyGenericEventTarget", [ "WrapperObject" ], function(WrapperObject) {
    "use strict"

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
        WrapperObject.call(this, impl);
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

    return MyGenericEventTarget;
});

zone("nigiri").factory("#MyDBEventTarget", [ "WrapperObject", "MyGenericEventTarget", "EventWrapper" ],
        function(WrapperObject, MyGenericEventTarget, EventWrapper) {

            var MyDBEventTarget = function(impl) {
                MyGenericEventTarget.call(this, impl);
                this.__handlers = {};

                // implementation handlers store the callback for the implementation until
                // such time that the implemntation becomes available.
                this.__implHandlers = impl ? null : {};
            };

            MyDBEventTarget.prototype = Object.create(MyGenericEventTarget.prototype);
            MyDBEventTarget.prototype.constructor = MyDBEventTarget;

            MyDBEventTarget.prototype.__setImpl = function(impl) {
                WrapperObject.prototype.__setImpl.call(this, impl);

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

            MyDBEventTarget.prototype.__wrapEvent = function(event) {
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

            return MyDBEventTarget;
        });

zone("nigiri").factory("#addEventHandlerProperty", function() {
    return function(prototype, name) {
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
});
"use strict";
