"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.Task = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _utils = require("./utils.cjs");
/**
 * Queue for handling tasks one at a time
 * @class
 * @param {scope} context what this will resolve to in the tasks
 */
var Queue = /*#__PURE__*/function () {
  function Queue(context) {
    (0, _classCallCheck2["default"])(this, Queue);
    this._q = [];
    this.context = context;
    this.tick = requestAnimationFrame;
    this.running = false;
    this.paused = false;
  }

  /**
   * Add an item to the queue
   * @return {Promise} enqueued
   */
  (0, _createClass2["default"])(Queue, [{
    key: "enqueue",
    value: function enqueue() {
      var deferred, promise;
      var queued;
      var task = [].shift.call(arguments);
      var args = arguments;

      // Handle single args without context
      // if(args && !Array.isArray(args)) {
      //   args = [args];
      // }
      if (!task) {
        throw new Error("No Task Provided");
      }
      if (typeof task === "function") {
        deferred = new _utils.defer();
        promise = deferred.promise;
        queued = {
          "task": task,
          "args": args,
          //"context"  : context,
          "deferred": deferred,
          "promise": promise
        };
      } else {
        // Task is a promise
        queued = {
          "promise": task
        };
      }
      this._q.push(queued);

      // Wait to start queue flush
      if (this.paused == false && !this.running) {
        this.run();
      }
      return queued.promise;
    }

    /**
     * Run one item
     * @return {Promise} dequeued
     */
  }, {
    key: "dequeue",
    value: function dequeue() {
      var inwait, task, result;
      if (this._q.length && !this.paused) {
        inwait = this._q.shift();
        task = inwait.task;
        if (task) {
          // console.log(task)

          result = task.apply(this.context, inwait.args);
          if (result && typeof result["then"] === "function") {
            // Task is a function that returns a promise
            return result.then(function () {
              inwait.deferred.resolve.apply(this.context, arguments);
            }.bind(this), function () {
              inwait.deferred.reject.apply(this.context, arguments);
            }.bind(this));
          } else {
            // Task resolves immediately
            inwait.deferred.resolve.apply(this.context, result);
            return inwait.promise;
          }
        } else if (inwait.promise) {
          // Task is a promise
          return inwait.promise;
        }
      } else {
        inwait = new _utils.defer();
        inwait.deferred.resolve();
        return inwait.promise;
      }
    }

    // Run All Immediately
  }, {
    key: "dump",
    value: function dump() {
      while (this._q.length) {
        this.dequeue();
      }
    }

    /**
     * Run all tasks sequentially, at convince
     * @return {Promise} all run
     */
  }, {
    key: "run",
    value: function run() {
      var _this = this;
      if (!this.running) {
        this.running = true;
        this.defered = new _utils.defer();
      }
      this.tick.call(window, function () {
        if (_this._q.length) {
          _this.dequeue().then(function () {
            this.run();
          }.bind(_this));
        } else {
          _this.defered.resolve();
          _this.running = undefined;
        }
      });

      // Unpause
      if (this.paused == true) {
        this.paused = false;
      }
      return this.defered.promise;
    }

    /**
     * Flush all, as quickly as possible
     * @return {Promise} ran
     */
  }, {
    key: "flush",
    value: function flush() {
      if (this.running) {
        return this.running;
      }
      if (this._q.length) {
        this.running = this.dequeue().then(function () {
          this.running = undefined;
          return this.flush();
        }.bind(this));
        return this.running;
      }
    }

    /**
     * Clear all items in wait
     * @return {void}
     */
  }, {
    key: "clear",
    value: function clear() {
      this._q = [];
    }

    /**
     * Get the number of tasks in the queue
     * @return {number} tasks
     */
  }, {
    key: "length",
    value: function length() {
      return this._q.length;
    }

    /**
     * Pause a running queue
     * @return {void}
     */
  }, {
    key: "pause",
    value: function pause() {
      this.paused = true;
    }

    /**
     * End the queue
     * @return {void}
     */
  }, {
    key: "stop",
    value: function stop() {
      this._q = [];
      this.running = false;
      this.paused = true;
    }
  }]);
  return Queue;
}();
/**
 * Create a new task from a callback
 * @class
 * @private
 * @param {function} task task to complete
 * @param {array} args arguments for the task
 * @param {scope} context scope of the task
 * @return {function} task
 */
var Task = /*#__PURE__*/(0, _createClass2["default"])(function Task(task, args, context) {
  (0, _classCallCheck2["default"])(this, Task);
  return function () {
    var _this2 = this;
    var toApply = arguments || [];
    return new Promise(function (resolve, reject) {
      var callback = function callback(value, err) {
        if (!value && err) {
          reject(err);
        } else {
          resolve(value);
        }
      };
      // Add the callback to the arguments list
      toApply.push(callback);

      // Apply all arguments to the functions
      task.apply(context || _this2, toApply);
    });
  };
});
exports.Task = Task;
var _default = Queue;
exports["default"] = _default;