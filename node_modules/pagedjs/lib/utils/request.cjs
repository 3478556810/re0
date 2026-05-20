"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = request;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
function request(_x) {
  return _request.apply(this, arguments);
}
function _request() {
  _request = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(url) {
    var options,
      _args = arguments;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          options = _args.length > 1 && _args[1] !== undefined ? _args[1] : {};
          return _context.abrupt("return", new Promise(function (resolve, reject) {
            var request = new XMLHttpRequest();
            request.open(options.method || "get", url, true);
            for (var i in options.headers) {
              request.setRequestHeader(i, options.headers[i]);
            }
            request.withCredentials = options.credentials === "include";
            request.onload = function () {
              // Chrome returns a status code of 0 for local files
              var status = request.status === 0 && url.startsWith("file://") ? 200 : request.status;
              resolve(new Response(request.responseText, {
                status: status
              }));
            };
            request.onerror = reject;
            request.send(options.body || null);
          }));
        case 2:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return _request.apply(this, arguments);
}