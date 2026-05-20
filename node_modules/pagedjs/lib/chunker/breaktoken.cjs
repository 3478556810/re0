"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _dom = require("../utils/dom.cjs");
/**
 * BreakToken
 * @class
 */
var BreakToken = /*#__PURE__*/function () {
  function BreakToken(node, offset) {
    (0, _classCallCheck2["default"])(this, BreakToken);
    this.node = node;
    this.offset = offset;
  }
  (0, _createClass2["default"])(BreakToken, [{
    key: "equals",
    value: function equals(otherBreakToken) {
      if (!otherBreakToken) {
        return false;
      }
      if (this["node"] && otherBreakToken["node"] && this["node"] !== otherBreakToken["node"]) {
        return false;
      }
      if (this["offset"] && otherBreakToken["offset"] && this["offset"] !== otherBreakToken["offset"]) {
        return false;
      }
      return true;
    }
  }, {
    key: "toJSON",
    value: function toJSON(hash) {
      var node;
      var index = 0;
      if (!this.node) {
        return {};
      }
      if ((0, _dom.isElement)(this.node) && this.node.dataset.ref) {
        node = this.node.dataset.ref;
      } else if (hash) {
        node = this.node.parentElement.dataset.ref;
      }
      if (this.node.parentElement) {
        var children = Array.from(this.node.parentElement.childNodes);
        index = children.indexOf(this.node);
      }
      return JSON.stringify({
        "node": node,
        "index": index,
        "offset": this.offset
      });
    }
  }]);
  return BreakToken;
}();
var _default = BreakToken;
exports["default"] = _default;