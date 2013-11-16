/*
# leap.coffee
a flow-control tool
(c) 2013 Vladimir Tarasov

Leap is unspired by:
- [invoke.js](https://github.com/repeatingbeats/invoke) by Steve Lloyd
- [first](https://github.com/DanielBaulig/first) by Daniel Baulig
- [async.js](https://github.com/caolan/async) by Caolan McMahon

Leap is freely distributable under the terms of the [MIT license](http://en.wikipedia.org/wiki/MIT_License).
All merit is dedicated to the benefit of all beings.
*/


(function() {
  var __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  !(function(name, definition) {
    if (typeof module !== "undefined" && module !== null ? module.exports : void 0) {
      return typeof module !== "undefined" && module !== null ? module.exports = definition() : void 0;
    } else if (typeof define !== "undefined" && define !== null ? define.amd : void 0) {
      return define(name, definition);
    } else {
      return this[name] = definition();
    }
  })('leap', function() {
    var Flow, FlowWithManualStart, Step, defer, leap, _ref;
    defer = (typeof process !== "undefined" && process !== null ? process.nextTick : void 0) || function(f) {
      return setTimeout(f, 1);
    };
    Flow = (function() {
      function Flow() {
        var fns,
          _this = this;
        fns = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        this.current = this.root = new Step(this._wrap_first(fns));
        this.then.flow = this;
        this.and.flow = this;
        if (!this.manual_start) {
          defer(function() {
            return _this.yeah();
          });
        }
      }

      Flow.prototype.then = function() {
        var fn;
        fn = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        this.current = this.current.child(fn);
        return this;
      };

      Flow.prototype.and = function(fn) {
        if (this.current === this.root) {
          fn = this._wrap_first(fn);
        }
        this.current.sibling(fn);
        return this;
      };

      Flow.prototype.rescue = function(fn) {
        this._rescue = fn;
        return this;
      };

      Flow.prototype.yeah = function() {
        return this.root.run(null, this._rescue);
      };

      Flow.prototype._wrap_first = function(fn) {
        var addF, f, res, _i, _len;
        if (Array.isArray(fn)) {
          res = [];
          addF = function(fun) {
            return res.push(function(___, next) {
              return fun.call(next, next);
            });
          };
          for (_i = 0, _len = fn.length; _i < _len; _i++) {
            f = fn[_i];
            addF(f);
          }
          return res;
        } else {
          return function(___, next) {
            return fn.call(next, next);
          };
        }
      };

      return Flow;

    })();
    Step = (function() {
      Step.prototype.functions = [];

      function Step(fn) {
        this._next = this._err = null;
        if (Array.isArray(fn)) {
          this.functions = fn;
        } else if (fn && fn.call && fn.apply) {
          this.functions = [fn];
        }
      }

      Step.prototype.child = function(fn) {
        return this._next = new Step(fn);
      };

      Step.prototype.sibling = function(fn) {
        return this.functions.push(fn);
      };

      Step.prototype.run = function(passed, rescue) {
        var completed, f, i, len, parallel, results, _i, _len, _ref, _results,
          _this = this;
        len = this.functions.length;
        results = [];
        completed = 0;
        parallel = function(index, fn) {
          var callback;
          callback = function(err, res) {
            if (_this.err) {
              return;
            }
            if (err) {
              _this.err = err;
              return rescue(err);
            }
            if (len === 1) {
              results = res;
            } else {
              results[index] = res;
            }
            if (_this._next && ++completed === len) {
              return _this._next.run(results, rescue);
            }
          };
          callback.next = callback.cb = function(res) {
            var arg;
            arg = Array.prototype.slice.call(arguments);
            arg.unshift(null);
            return callback.apply(this, arg);
          };
          if (typeof Backbone !== 'undefined') {
            callback.bb = {
              success: function() {
                var arg;
                arg = Array.prototype.slice.call(arguments);
                arg.unshift(null);
                return callback.call(this, arg);
              },
              error: function() {
                return callback.call(this, Array.prototype.slice.call(arguments));
              }
            };
          }
          return fn.apply(callback, [passed, callback]);
        };
        _ref = this.functions;
        _results = [];
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          f = _ref[i];
          _results.push(parallel(i, f));
        }
        return _results;
      };

      return Step;

    })();
    leap = function() {
      var fn;
      fn = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Flow, fn, function(){});
    };
    FlowWithManualStart = (function(_super) {
      __extends(FlowWithManualStart, _super);

      function FlowWithManualStart() {
        _ref = FlowWithManualStart.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      FlowWithManualStart.prototype.manual_start = true;

      return FlowWithManualStart;

    })(Flow);
    leap["export"] = function() {
      var fn;
      fn = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(FlowWithManualStart, fn, function(){});
    };
    leap.map = function(collection, iterator, next) {
      var flow, i, _fn, _i, _len;
      flow = new Flow;
      _fn = function(param) {
        return flow.and(function() {
          return iterator.call(this, param, this);
        });
      };
      for (_i = 0, _len = collection.length; _i < _len; _i++) {
        i = collection[_i];
        _fn(i);
      }
      if (next) {
        flow.then(function(res) {
          return next(null, res);
        });
        flow.rescue(next);
      }
      return flow;
    };
    Flow.prototype.then.map = function(fn) {
      return this.flow.then(function(arr, cb) {
        return leap.map(arr, fn, cb);
      });
    };
    Flow.prototype.and.map = function(fn) {
      return this.flow.and(function(arr, cb) {
        return leap.map(arr, fn, cb);
      });
    };
    leap.reduce = function(collection, iterator, next) {
      var flow, i, _fn, _i, _len;
      flow = new Flow(function() {
        return this();
      });
      _fn = function(param) {
        return flow.then(function(memo) {
          return iterator.call(this, param, memo, this);
        });
      };
      for (_i = 0, _len = collection.length; _i < _len; _i++) {
        i = collection[_i];
        _fn(i);
      }
      if (next) {
        flow.then(function(res) {
          return next(null, res);
        });
        flow.rescue(next);
      }
      return flow;
    };
    Flow.prototype.then.reduce = function(fn) {
      return this.flow.then(function(arr, cb) {
        return leap.reduce(arr, fn, cb);
      });
    };
    Flow.prototype.and.reduce = function(fn) {
      return this.flow.and(function(arr, cb) {
        return leap.reduce(arr, fn, cb);
      });
    };
    leap.filter = function(collection, iterator, next) {
      return leap.map(collection, iterator).then(function(arr) {
        var i, res, val, _i, _len;
        res = [];
        for (i = _i = 0, _len = arr.length; _i < _len; i = ++_i) {
          val = arr[i];
          if (val) {
            res.push(collection[i]);
          }
        }
        if (next) {
          return next(null, res);
        }
        return this.next(res);
      });
    };
    Flow.prototype.then.filter = function(fn) {
      return this.flow.then(function(arr, cb) {
        return leap.filter(arr, fn, cb);
      });
    };
    Flow.prototype.and.filter = function(fn) {
      return this.flow.and(function(arr, cb) {
        return leap.filter(arr, fn, cb);
      });
    };
    leap.reject = function(collection, iterator, next) {
      return leap.map(collection, iterator).then(function(arr) {
        var i, res, val, _i, _len;
        res = [];
        for (i = _i = 0, _len = arr.length; _i < _len; i = ++_i) {
          val = arr[i];
          if (!val) {
            res.push(collection[i]);
          }
        }
        if (next) {
          return next(null, res);
        }
        return this.next(res);
      });
    };
    Flow.prototype.then.reject = function(fn) {
      return this.flow.then(function(arr, cb) {
        return leap.reject(arr, fn, cb);
      });
    };
    Flow.prototype.and.reject = function(fn) {
      return this.flow.and(function(arr, cb) {
        return leap.reject(arr, fn, cb);
      });
    };
    leap.of = {
      faith: leap
    };
    leap.VERSION = "0.1.0";
    return leap;
  });

}).call(this);
