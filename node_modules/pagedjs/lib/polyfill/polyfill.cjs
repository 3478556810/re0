"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _typeof = require("@babel/runtime/helpers/typeof");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _previewer = _interopRequireDefault(require("./previewer.cjs"));
var Paged = _interopRequireWildcard(require("../index.cjs"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
window.Paged = Paged;
var ready = new Promise(function (resolve, reject) {
  if (document.readyState === "interactive" || document.readyState === "complete") {
    resolve(document.readyState);
    return;
  }
  document.onreadystatechange = function ($) {
    if (document.readyState === "interactive") {
      resolve(document.readyState);
    }
  };
});
var config = window.PagedConfig || {
  auto: true,
  before: undefined,
  after: undefined,
  content: undefined,
  stylesheets: undefined,
  renderTo: undefined,
  settings: undefined
};
var previewer = new _previewer["default"](config.settings);
ready.then( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
  var done;
  return _regenerator["default"].wrap(function _callee$(_context) {
    while (1) switch (_context.prev = _context.next) {
      case 0:
        if (!config.before) {
          _context.next = 3;
          break;
        }
        _context.next = 3;
        return config.before();
      case 3:
        if (!(config.auto !== false)) {
          _context.next = 7;
          break;
        }
        _context.next = 6;
        return previewer.preview(config.content, config.stylesheets, config.renderTo);
      case 6:
        done = _context.sent;
      case 7:
        if (!config.after) {
          _context.next = 10;
          break;
        }
        _context.next = 10;
        return config.after(done);
      case 10:
      case "end":
        return _context.stop();
    }
  }, _callee);
})));
var _default = previewer;
exports["default"] = _default;