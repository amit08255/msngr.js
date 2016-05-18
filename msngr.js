/*
	./src/main.js

	The main entry point for msngr.js. Covers internal and external interface generation,
	versioning (for programmatic access) and the core extend method.
*/
var msngr = msngr || (function() {
    "use strict";

    // The internal object for holding the internal API
    var internal = { };

    // The external function that holds all external APIs
    var external = function () {
        var inputs = Array.prototype.slice.call(arguments, 0);

        this.input = inputs;
    };

    // Built version of msngr.js for programatic access; this is auto generated
    external.version = "5.0.0";

    // Takes a function, executes it passing in the external and internal interfaces
    external.extend = function (fn) {
        if (fn === undefined || fn === null) {
            return undefined;
        }

        var fnType = Object.prototype.toString.call(fn);
        if (fnType !== "[object Function]") {
            return undefined;
        }

        return fn.apply(this, [external, internal]);
    };

    // Create a debug property to allow explicit exposure to the internal object structure.
    // This should only be used during unit test runs and debugging.
    Object.defineProperty(external, "debug", {
        set: function(value) {
            if (value === true) {
                external.internal = internal;
            } else if (value === false) {
                delete external.internal;
            }
        },
        get: function() {
            return (external.internal !== undefined)
        }
    });

    return external;
}());

/*
    ./src/validators/is.js

    The is function used for validation
*/

msngr.extend(function (external, internal) {
    "use strict";

    // A list of built-in JavaScript types and their string representation
    var simpleTypes = {
        // ECMAScript 5 Types
        arguments: "[object Arguments]",
        string: "[object String]",
        date: "[object Date]",
        array: "[object Array]",
        number: "[object Number]",
        object: "[object Object]",
        function: "[object Function]",

        // ECMAScript 6 Types
        symbol: "[object Symbol]",
        promise: "[object Promise]", // node.js 4.x returns [object Object] for promises :( so limited testing possible

        // HTML DOM Types
        nodelist: "[object NodeList]"
    };

    // Harder type checking here; requires custom methods
    var harderTypes = {
        // HTML DOM Types
        htmlElement: function (type) {
            return (type.indexOf("[object HTML") === 0) || (type.indexOf("[object global]") === 0);
        }
    };

    // Check a type against an input
    var check = function (type, item, hard) {
        if (hard) {
            return harderTypes[type](Object.prototype.toString.call(item));
        }
        return (Object.prototype.toString.call(item) === simpleTypes[type]);
    }

    // Bulld the properties that the is function returns for testing values
    var buildProps = function (inputs) {
        var props = { };

        // Create a function to call with simple and hard types
        // This is done so simple types don't need to check for hard types
        var iterateTypes = function (types, hard) {
            for (var t in types) {
                if (types.hasOwnProperty(t)) {
                    (function (prop) {
                        Object.defineProperty(props, prop, {
                            get: function() {
                                for (var i = 0; i < inputs.length; ++i) {
                                    if (!check(prop, inputs[i], hard)) {
                                        return false;
                                    }
                                }
                                return true;
                            }
                        });
                    }(t));
                }
            }
        };

        iterateTypes(simpleTypes);
        iterateTypes(harderTypes);

        return props;
    };

    // The external is interface that supports N number of arguments.
    external.is = function () {
        var inputs = Array.prototype.slice.call(arguments, 0);

        var props = buildProps(inputs);

        // Returns the first input's type
        props.getType = function () {
            return Object.prototype.toString.call(inputs[0]);
        };

        // Returns the types for all inputs, in order
        props.getTypes = function () {
            var result = [];
            for (var i = 0; i < inputs.length; ++i) {
                result.push(Object.prototype.toString.call(inputs[i]));
            }

            return result;
        };

        return props;
    };

    // Returns whether we're in a browser or not
    Object.defineProperty(external.is, "browser", {
        get: function () {
            return (typeof XMLHttpRequest !== "undefined");
        }
    });

});

/*
	module.exports.js

	If we're running in a node.js.
*/
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    module.exports = msngr;
}
