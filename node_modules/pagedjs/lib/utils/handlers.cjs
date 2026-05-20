"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Handlers = void 0;
exports.initializeHandlers = initializeHandlers;
exports.registerHandlers = registerHandlers;
exports.registeredHandlers = void 0;
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _index = _interopRequireDefault(require("../modules/paged-media/index.cjs"));
var _index2 = _interopRequireDefault(require("../modules/generated-content/index.cjs"));
var _index3 = _interopRequireDefault(require("../modules/filters/index.cjs"));
var _eventEmitter = _interopRequireDefault(require("event-emitter"));
var _pipe = _interopRequireDefault(require("event-emitter/pipe.js"));
var registeredHandlers = [].concat((0, _toConsumableArray2["default"])(_index["default"]), (0, _toConsumableArray2["default"])(_index2["default"]), (0, _toConsumableArray2["default"])(_index3["default"]));
exports.registeredHandlers = registeredHandlers;
var Handlers = /*#__PURE__*/(0, _createClass2["default"])(function Handlers(chunker, polisher, caller) {
  var _this = this;
  (0, _classCallCheck2["default"])(this, Handlers);
  var handlers = [];
  registeredHandlers.forEach(function (Handler) {
    var handler = new Handler(chunker, polisher, caller);
    handlers.push(handler);
    (0, _pipe["default"])(handler, _this);
  });
});
exports.Handlers = Handlers;
(0, _eventEmitter["default"])(Handlers.prototype);
function registerHandlers() {
  for (var i = 0; i < arguments.length; i++) {
    registeredHandlers.push(arguments[i]);
  }
}
function initializeHandlers(chunker, polisher, caller) {
  var handlers = new Handlers(chunker, polisher, caller);
  return handlers;
}