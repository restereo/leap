
/*
 * leap.coffee
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
  var slice = [].slice,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  !(function(name, definition) {
    if (typeof module !== "undefined" && module !== null ? module.exports : void 0) {
      return typeof module !== "undefined" && module !== null ? module.exports = definition() : void 0;
    } else if (typeof define !== "undefined" && define !== null ? define.amd : void 0) {
      return define(name, definition);
    } else {
      return this[name] = definition();
    }
  })('leap', function() {
    var Flow, FlowWithManualStart, Step, _property, defer, identity, leap;
    defer = (typeof process !== "undefined" && process !== null ? process.nextTick : void 0) || function(f) {
      return setTimeout(f, 1);
    };
    identity = function(x, cb) {
      return cb(null, x);
    };
    Flow = (function() {
      function Flow() {
        var fns;
        fns = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        this.current = this.root = new Step(this._wrap_first(fns));
        this.then.flow = this;
        this.and.flow = this;
        if (!this.manual_start) {
          defer((function(_this) {
            return function() {
              return _this.yeah();
            };
          })(this));
        }
      }

      Flow.prototype.then = function() {
        var fn;
        fn = 1 <= arguments.length ? slice.call(arguments, 0) : [];
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

      Flow.prototype.identity = function() {
        if (this.current === this.root) {
          this.then(identity);
        }
        return this.and(identity);
      };

      Flow.prototype.rescue = function(fn) {
        this._rescue = fn;
        return this;
      };

      Flow.prototype._rescue = function(err) {
        throw Error(err);
      };

      Flow.prototype.yeah = function() {
        return this.root.run(null, this._rescue);
      };

      Flow.prototype.back = function(fn) {
        this.then(function(x) {
          return fn(null, x);
        });
        return this.rescue(fn);
      };

      Flow.prototype._wrap_first = function(fn) {
        var addF, f, j, len1, res;
        if (Array.isArray(fn)) {
          res = [];
          addF = function(fun) {
            return res.push(function(___, next) {
              return fun.call(next, next);
            });
          };
          for (j = 0, len1 = fn.length; j < len1; j++) {
            f = fn[j];
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

      function Step(actions) {
        this._next = this._err = null;
        if (Array.isArray(actions)) {
          this.functions = actions;
        } else if (typeof actions === 'function') {
          this.functions = [actions];
        }
      }

      Step.prototype.child = function(fn) {
        return this._next = new Step(fn);
      };

      Step.prototype.sibling = function(fn) {
        return this.functions.push(fn);
      };

      Step.prototype.run = function(passed, rescue) {
        var completed, f, i, j, len, len1, parallel, ref, results, results1;
        len = this.functions.length;
        results = [];
        completed = 0;
        parallel = (function(_this) {
          return function(index, fn) {
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
        })(this);
        ref = this.functions;
        results1 = [];
        for (i = j = 0, len1 = ref.length; j < len1; i = ++j) {
          f = ref[i];
          results1.push(parallel(i, f));
        }
        return results1;
      };

      return Step;

    })();
    leap = function() {
      var fn;
      fn = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Flow, fn, function(){});
    };
    FlowWithManualStart = (function(superClass) {
      extend(FlowWithManualStart, superClass);

      function FlowWithManualStart() {
        return FlowWithManualStart.__super__.constructor.apply(this, arguments);
      }

      FlowWithManualStart.prototype.manual_start = true;

      return FlowWithManualStart;

    })(Flow);
    leap["export"] = function() {
      var fn;
      fn = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(FlowWithManualStart, fn, function(){});
    };
    leap.map = function(collection, iterator, next) {
      var flow, fn1, i, j, len1;
      flow = new Flow;
      if (!collection || collection.length === 0) {
        flow.and(function() {
          return this();
        }).then(function() {
          return this.next([]);
        });
      } else {
        fn1 = function(param) {
          return flow.and(function() {
            return iterator.call(this, param, this);
          });
        };
        for (j = 0, len1 = collection.length; j < len1; j++) {
          i = collection[j];
          fn1(i);
        }
        if (collection.length === 1) {
          flow.then(function(res) {
            return this.next([res]);
          });
        }
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
      var flow, fn1, i, j, len1;
      flow = new Flow(function() {
        return this();
      });
      fn1 = function(param) {
        return flow.then(function(memo) {
          return iterator.call(this, param, memo, this);
        });
      };
      for (j = 0, len1 = collection.length; j < len1; j++) {
        i = collection[j];
        fn1(i);
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
        var i, j, len1, res, val;
        res = [];
        for (i = j = 0, len1 = arr.length; j < len1; i = ++j) {
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
        var i, j, len1, res, val;
        res = [];
        for (i = j = 0, len1 = arr.length; j < len1; i = ++j) {
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
    _property = function(key) {
      return function(obj) {
        return obj[key];
      };
    };
    leap.pluck = function(key) {
      return function(collection, next) {
        return this(null, collection.map(_property(key)));
      };
    };
    Flow.prototype.then.pluck = function(key) {
      return this.flow.then(leap.pluck(key));
    };
    leap.I = identity;
    leap.of = {
      faith: leap
    };
    leap.VERSION = "0.1.3";
    return leap;
  });

}).call(this);
