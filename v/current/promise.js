/*!
Copyright (c) 2012, C J Wainwright, http://cjwainwright.co.uk

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

(function (exports) {

    exports.exportTo = function (o) {
        for (var key in exports) {
            if (exports.hasOwnProperty(key)) {
                o[key] = exports[key];
            }
        }
    };

/////////////////////////////////////////////////////

function errorFunc(message) {
    return function(){
        throw new Error(message);
    }
}

exports.errorFunc = errorFunc;

/////////////////////////////////////////////////////

var error = exports.error = {
    promiseBreakingAlreadyResolved: "Attempting to break a resolved promise", 
    promiseKeepingAlreadyResolved: "Attempting to keep a resolved promise", 
    collectionIndexBrokenPromise: "Can't use broken promise as collection index",
    collectionSetValueOnBrokenPromise: "Trying to set a value on a broken promise",
    conditionalBrokenPromise: "Can't use broken promise as conditional",
    queueNothingToDequeue: "Nothing to dequeue"
};

/////////////////////////////////////////////////////

/////////////////////////////////////////////////////
// Utility functions
/////////////////////////////////////////////////////

var slice = Array.prototype.slice;

/////////////////////////////////////////////////////

if(typeof(Object.create) !== 'function')
{
    Object.create = function(o){
        function F(){}
        F.prototype = o;
        return new F();
    };
}

/////////////////////////////////////////////////////

function derive(Child, Parent) {
    Child.prototype = Object.create(Parent.prototype);
    Child.prototype.constructor = Child;
    Child.Parent = Parent;
}

/////////////////////////////////////////////////////

function extend(target) {
    var sources = slice.call(arguments, 1);
    for (var i = 0, length = sources.length; i < length; i++) {
        var source = sources[i];
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }
    }
}

/////////////////////////////////////////////////////

/////////////////////////////////////////////////////
// Event class
/////////////////////////////////////////////////////

function Event() {
    this._listeners = [];
}

extend(Event.prototype, {
    add: function (listener) {
        this._listeners.push(listener);
    },
    notify: function (context, args) {
        var count = this._listeners.length;
        for (var i = 0; i < count; i++) {
            this._listeners[i].apply(context, args);
        }
    },
    clear: function () {
        this._listeners = [];
    }
});

/////////////////////////////////////////////////////

/////////////////////////////////////////////////////
// Promise class
/////////////////////////////////////////////////////

var waiting = "waiting",
    kept = "kept",
    broken = "broken";

/////////////////////////////////////////////////////

function Promise() {
    this.state = waiting;
    this.data;
    this._onkept = new Event();
    this._onbroken = new Event();
}

extend(Promise.prototype, {
    kept: function (callback) {
        if (this.state == waiting) {
            this._onkept.add(callback);
        } else if (this.state == kept) {
            callback(this.data);
        }
        return this;
    },
    broken: function (callback) {
        if (this.state == waiting) {
            this._onbroken.add(callback);
        } else if (this.state == broken) {
            callback();
        }
        return this;
    },
    setBroken: function () {
        if (this.state != waiting) {
            errorFunc(error.promiseBreakingAlreadyResolved)();
        }
        this.state = broken;
        this._onbroken.notify(this);
        this._onkept.clear();
        this._onbroken.clear();
    },
    setData: function (data) {
        if (this.state != waiting) {
            errorFunc(error.promiseKeepingAlreadyResolved)();
        }
        this.data = data;
        this.state = kept;
        this._onkept.notify(this, [this.data]);
        this._onkept.clear();
        this._onbroken.clear();
    },
    bindTo: function (promise) {
        this.kept(function (data) {
            promise.setData(data);
        }).broken(function () {
            promise.setBroken();
        });
    },
    then: function (action) {
        // equiv of Monad bind operation, action must return a promise
        var ret = new Promise();
        this.kept(function (data) {
            action(data).bindTo(ret);
        }).broken(function () {
            ret.setBroken();
        });
        return ret;
    },
    thenData: function (action) {
        // action must return a value
        // equivalent of:
        // return this.then(function (data) { return unit(action(data)); });
        var ret = new Promise();
        this.kept(function (data) {
            ret.setData(action(data));
        }).broken(function () {
            ret.setBroken();
        });
        return ret;
    }
});

/////////////////////////////////////////////////////

function unit(data) {
    var promise = new Promise();
    promise.setData(data);
    return promise;
}

function all(args) {
    // returns a promise that is either kept (with the data of args) when all args have been kept, or broken when any of args is broken
    var ret = new Promise();
    
    function onKept() {
        // don't care about subsequent events coming in
        if (ret.state != waiting) {
            return;
        }

        // see if all promises have been kept
        var allKept = true;
        for (var j = 0; j < args.length; j++) {
            if (args[j].state != kept) {
                allKept = false;
                break;
            }
        }

        // merge the data and pass to the returned promise
        if (allKept) {
            var argsData = [];
            for (var i = 0; i < args.length; i++) {
                argsData[i] = args[i].data;
            }
            ret.setData(argsData);
        }
    }
    
    function onBroken() {
        // don't care about subsequent events coming in
        if (ret.state != waiting) {
            return;
        }
        
        ret.setBroken();
    }
    
    if (args.length > 0) {
        for (var i = 0; i < args.length; i++) {
            args[i].kept(onKept).broken(onBroken);
        }
    } else {
        onKept();
    }
    
    return ret;
}

function fmap(f) {
    // maps a function to it's promise based equivalent. 
    // fmap(f) is a function that returns a promise, it waits for all it's arguments to be resolved before using them to evaluate f and resolving the returned promise with the result.
    return function () {
        return all(arguments).thenData(function (data) {
            return f.apply(null, data);
        });
    };
}

/////////////////////////////////////////////////////

exports.Promise = Promise;
exports.unit = unit;
exports.fmap = fmap;

/////////////////////////////////////////////////////

/////////////////////////////////////////////////////
// Collection class
/////////////////////////////////////////////////////

function Collection() {
    this._queue = [];
}

extend(Collection.prototype, {
    _currentVersion: function () {
    },
    _increaseVersion: function () {
    },
    _get: function (index, version) {
    },
    _set: function (index, value) {
    },
    _delete: function (index) {
    },
    get: function (index) {
        // make a promise of the return value
        var ret = new Promise();
        var that = this;
        this._enqueue(function () {
            var version = that._currentVersion(); // needs to use version of values at moment of 'call'
            index.kept(function (i) {
                var val = that._get(i, version);
                // bind the retrieved promise to the returned promise, or null if there is no value specified
                if (val == null) {
                    ret.setData(val);
                } else {
                    val.bindTo(ret);
                }
            }).broken(function (){
                ret.setBroken();
            });
            that._dequeue(); // can be dequeued immediately
        });

        return ret;
    },
    set: function (index, value) {
        var that = this;
        this._enqueue(function () {
            index.kept(function (i) {
                that._set(i, value);
                that._increaseVersion();
                that._dequeue(); // can only be dequeued once the index is resolved
            }).broken(errorFunc(error.collectionIndexBrokenPromise));
        });
        return value;
    },
    'delete': function (index, value) {
        var that = this;
        this._enqueue(function () {
            index.kept(function (i) {
                that._delete(i);
                that._increaseVersion();
                that._dequeue(); // can only be dequeued once the index is resolved
            }).broken(errorFunc(error.collectionIndexBrokenPromise));
        });
        return value;
    },
    _enqueue: function (fn) {
        this._queue.push(fn);
        if (this._queue.length == 1) {
            this._queue[0]();
        }
    },
    _dequeue: function () {
        if (this._queue.length == 0) {
            errorFunc(error.queueNothingToDequeue)();
        } else {
            this._queue.shift();
            if (this._queue.length > 0) {
                this._queue[0]();
            }
        }
    }
});

/////////////////////////////////////////////////////

function get(collection, index) {
    var ret = new Promise();
    collection.kept(function (data){
        data.get(index).bindTo(ret);
    }).broken(function () {
        ret.setBroken();
    });
    return ret;
}

function set(collection, index, value) {
    collection.kept(function (data){
        data.set(index, value);
    }).broken(errorFunc(error.collectionSetValueOnBrokenPromise));
    return value;
}

function getMember(collection, index) {
    var member = {
        get val() {
            var ret = new Promise();
            collection.kept(function (data){
                data.get(index).bindTo(ret);
            }).broken(function () {
                ret.setBroken();
            });
            return ret;
        },
        set val(value) {
            var ret = new Promise();
            collection.kept(function (data){
                data.set(index, value).bindTo(ret);
            }).broken(function () {
                ret.setBroken();
            });
            return ret;
        }
    };

    return member;
}

/////////////////////////////////////////////////////

exports.getMember = getMember;
exports.get = get;
exports.set = set;

/////////////////////////////////////////////////////

/////////////////////////////////////////////////////
// DynamicArray class
/////////////////////////////////////////////////////

function DynamicArray(init) {
    DynamicArray.Parent.call(this);
    this.currents = init || [];
}

derive(DynamicArray, Collection);

extend(DynamicArray.prototype, {
    _currentVersion: function () {
        return this.currents.slice();
    },
    _increaseVersion: function () {
    },
    _get: function (index, version) {
        return version[index];
    },
    _set: function (index, value) {
        this.currents[index] = value;
    },
    _delete: function (index) {
        delete this.currents[index];
    },
    length: function () {
        // make a promise of the return value
        var ret = new Promise();
        var that = this;
        this._enqueue(function () {
            // needs to use copy of values at moment of 'call'
            ret.setData(that.currents.length);
            that._dequeue(); // can be dequeued immediately
        });
        return ret;
    }
});

/////////////////////////////////////////////////////

function length(array) {
    var ret = new Promise();
    array.kept(function (data){
        data.length().bindTo(ret);
    }).broken(function () {
        ret.setBroken();
    });
    return ret;
}

/////////////////////////////////////////////////////

exports.DynamicArray = DynamicArray;
exports.length = length;

/////////////////////////////////////////////////////

/////////////////////////////////////////////////////
// DynamicObject class
/////////////////////////////////////////////////////

function DynamicObject(init) {
    DynamicObject.Parent.call(this);
    this._currents = init || {};
    this._snapshot = null;
}

derive(DynamicObject, Collection);

extend(DynamicObject.prototype, {
    _currentVersion: function () {
        if (this._snapshot == null) {
            this._snapshot = {};
            for (var key in this._currents) {
                this._snapshot[key] = this._currents[key];
            }
        }
        return this._snapshot;
    },
    _increaseVersion: function () {
        this._snapshot = null;
    },
    _get: function (index, version) {
        return version[index];
    },
    _set: function (index, value) {
        this._currents[index] = value;
    },
    _delete: function (index) {
        delete this._currents[index];
    }
});

/////////////////////////////////////////////////////

exports.DynamicObject = DynamicObject;

/////////////////////////////////////////////////////

/////////////////////////////////////////////////////
// Comparison
/////////////////////////////////////////////////////

var eq = fmap(function (u, v) {
    return u == v;
});

var neq = fmap(function (u, v) {
    return u != v;
});

var lt = fmap(function (u, v) {
    return u < v;
});

var lteq = fmap(function (u, v) {
    return u <= v;
});

var gt = fmap(function (u, v) {
    return u > v;
});

var gteq = fmap(function (u, v) {
    return u >= v;
});

/////////////////////////////////////////////////////

exports.eq = eq;
exports.neq = neq;
exports.lt = lt;
exports.lteq = lteq;
exports.gt = gt;
exports.gteq = gteq;

/////////////////////////////////////////////////////
// Arithmetic
/////////////////////////////////////////////////////

var add = fmap(function () {
    var ret = arguments[0];
    for (var i = 1; i < arguments.length; i++) {
        ret += arguments[i];
    }
    return ret;
});

var mult = fmap(function () {
    var ret = arguments[0];
    for (var i = 1; i < arguments.length; i++) {
        ret *= arguments[i];
    }
    return ret;
});

/////////////////////////////////////////////////////

exports.add = add;
exports.mult = mult;

/////////////////////////////////////////////////////
// Unary
/////////////////////////////////////////////////////

var not = fmap(function (a) {
    return !a;
});

var inc = fmap(function (a) {
    return ++a;
});

var dec = fmap(function (a) {
    return --a;
});

/////////////////////////////////////////////////////

exports.not = not;
exports.inc = inc;
exports.dec = dec;

/////////////////////////////////////////////////////

/////////////////////////////////////////////////////
// Data provider functions
/////////////////////////////////////////////////////

function nowData(data) {
    var promise = new Promise();
    promise.setData(data);
    return promise;
}

function nowBreak() {
    var promise = new Promise();
    promise.setBroken();
    return promise;
}

function laterData(data, delay) {
    var promise = new Promise();
    setTimeout(function(){promise.setData(data);}, delay);
    return promise;
}

function laterBreak(delay) {
    var promise = new Promise();
    setTimeout(function(){promise.setBroken();}, delay);
    return promise;
}

function inputData(key, parser) {
    var ret = new Promise();
 
    var div = document.createElement('DIV');

    var input = document.createElement('INPUT');
    input.type = 'text';
    div.appendChild(input);

    var button = document.createElement('BUTTON');
    button.appendChild(document.createTextNode('>'));
    div.appendChild(button);

    var text = document.createTextNode('...');
    key.kept(function(data){
        text.data = data;
    }).broken(function(){
        text.data = '!!';
    });
    div.appendChild(text);
    
    document.body.appendChild(div);
    input.focus();
    
    button.addEventListener('click', function click() {
        ret.setData(parser ? parser(input.value) : input.value);
        input.disabled = true;
        button.disabled = true;
        button.removeEventListener('click', click);
    });
    return ret;
};

/////////////////////////////////////////////////////

exports.nowData = nowData;
exports.nowBreak = nowBreak;
exports.laterData = laterData;
exports.laterBreak = laterBreak;
exports.inputData = inputData;

/////////////////////////////////////////////////////


})(typeof exports === 'undefined' ? (promise = {}) : exports);

/* TODOs 
 * Clarify when we throw exceptions and when we set values as broken
 * When apply-ing functions what context should we be using
 * Can we make the variable/promise proxy all method calls to the underlying value data?
 */
