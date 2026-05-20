"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _eventEmitter = _interopRequireDefault(require("event-emitter"));
var Handler = /*#__PURE__*/(0, _createClass2["default"])(function Handler(chunker, polisher, caller) {
  (0, _classCallCheck2["default"])(this, Handler);
  var hooks = Object.assign({}, chunker && chunker.hooks, polisher && polisher.hooks, caller && caller.hooks);
  this.chunker = chunker;
  this.polisher = polisher;
  this.caller = caller;
  for (var name in hooks) {
    if (name in this) {
      var hook = hooks[name];
      hook.register(this[name].bind(this));
    }
  }
});
(0, _eventEmitter["default"])(Handler.prototype);
var _default = Handler;
exports["default"] = _default;