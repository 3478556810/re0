"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _chunker = _interopRequireDefault(require("./chunker.cjs"));
describe("Chunker", function () {
  it("should create a page area", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
    var chunker;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          chunker = new _chunker["default"]();
          chunker.setup();
          expect(chunker.pagesArea.classList).toContain("pagedjs_pages");
        case 3:
        case "end":
          return _context.stop();
      }
    }, _callee);
  })));
});