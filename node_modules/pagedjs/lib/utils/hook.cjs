"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
/**
 * Hooks allow for injecting functions that must all complete in order before finishing
 * They will execute in parallel but all must finish before continuing
 * Functions may return a promise if they are asycn.
 * From epubjs/src/utils/hooks
 * @param {any} context scope of this
 * @example this.content = new Hook(this);
 */
var Hook = /*#__PURE__*/function () {
  function Hook(context) {
    (0, _classCallCheck2["default"])(this, Hook);
    this.context = context || this;
    this.hooks = [];
  }

  /**
   * Adds a function to be run before a hook completes
   * @example this.content.register(function(){...});
   * @return {undefined} void
   */
  (0, _createClass2["default"])(Hook, [{
    key: "register",
    value: function register() {
      for (var i = 0; i < arguments.length; ++i) {
        if (typeof arguments[i] === "function") {
          this.hooks.push(arguments[i]);
        } else {
          // unpack array
          for (var j = 0; j < arguments[i].length; ++j) {
            this.hooks.push(arguments[i][j]);
          }
        }
      }
    }

    /**
     * Triggers a hook to run all functions
     * @example this.content.trigger(args).then(function(){...});
     * @return {Promise} results
     */
  }, {
    key: "trigger",
    value: function trigger() {
      var args = arguments;
      var context = this.context;
      var promises = [];
      this.hooks.forEach(function (task) {
        var executing = task.apply(context, args);
        if (executing && typeof executing["then"] === "function") {
          // Task is a function that returns a promise
          promises.push(executing);
        } else {
          // Otherwise Task resolves immediately, add resolved promise with result
          promises.push(new Promise(function (resolve, reject) {
            resolve(executing);
          }));
        }
      });
      return Promise.all(promises);
    }

    /**
      * Triggers a hook to run all functions synchronously
      * @example this.content.trigger(args).then(function(){...});
      * @return {Array} results
      */
  }, {
    key: "triggerSync",
    value: function triggerSync() {
      var args = arguments;
      var context = this.context;
      var results = [];
      this.hooks.forEach(function (task) {
        var executing = task.apply(context, args);
        results.push(executing);
      });
      return results;
    }

    // Adds a function to be run before a hook completes
  }, {
    key: "list",
    value: function list() {
      return this.hooks;
    }
  }, {
    key: "clear",
    value: function clear() {
      return this.hooks = [];
    }
  }]);
  return Hook;
}();
var _default = Hook;
exports["default"] = _default;