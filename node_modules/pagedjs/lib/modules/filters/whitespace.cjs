"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _handler = _interopRequireDefault(require("../handler.cjs"));
var _dom = require("../../utils/dom.cjs");
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var WhiteSpaceFilter = /*#__PURE__*/function (_Handler) {
  (0, _inherits2["default"])(WhiteSpaceFilter, _Handler);
  var _super = _createSuper(WhiteSpaceFilter);
  function WhiteSpaceFilter(chunker, polisher, caller) {
    (0, _classCallCheck2["default"])(this, WhiteSpaceFilter);
    return _super.call(this, chunker, polisher, caller);
  }
  (0, _createClass2["default"])(WhiteSpaceFilter, [{
    key: "filter",
    value: function filter(content) {
      var _this = this;
      (0, _dom.filterTree)(content, function (node) {
        return _this.filterEmpty(node);
      }, NodeFilter.SHOW_TEXT);
    }
  }, {
    key: "filterEmpty",
    value: function filterEmpty(node) {
      if (node.textContent.length > 1 && (0, _dom.isIgnorable)(node)) {
        // Do not touch the content if text is pre-formatted
        var parent = node.parentNode;
        var pre = (0, _dom.isElement)(parent) && parent.closest("pre");
        if (pre) {
          return NodeFilter.FILTER_REJECT;
        }
        var previousSibling = (0, _dom.previousSignificantNode)(node);
        var nextSibling = (0, _dom.nextSignificantNode)(node);
        if (nextSibling === null && previousSibling === null) {
          // we should not remove a Node that does not have any siblings.
          node.textContent = " ";
          return NodeFilter.FILTER_REJECT;
        }
        if (nextSibling === null) {
          // we can safely remove this node
          return NodeFilter.FILTER_ACCEPT;
        }
        if (previousSibling === null) {
          // we can safely remove this node
          return NodeFilter.FILTER_ACCEPT;
        }

        // replace the content with a single space
        node.textContent = " ";

        // TODO: we also need to preserve sequences of white spaces when the parent has "white-space" rule:
        // pre
        // Sequences of white space are preserved. Lines are only broken at newline characters in the source and at <br> elements.
        //
        // pre-wrap
        // Sequences of white space are preserved. Lines are broken at newline characters, at <br>, and as necessary to fill line boxes.
        //
        // pre-line
        // Sequences of white space are collapsed. Lines are broken at newline characters, at <br>, and as necessary to fill line boxes.
        //
        // break-spaces
        // The behavior is identical to that of pre-wrap, except that:
        // - Any sequence of preserved white space always takes up space, including at the end of the line.
        // - A line breaking opportunity exists after every preserved white space character, including between white space characters.
        // - Such preserved spaces take up space and do not hang, and thus affect the box’s intrinsic sizes (min-content size and max-content size).
        //
        // See: https://developer.mozilla.org/en-US/docs/Web/CSS/white-space#Values

        return NodeFilter.FILTER_REJECT;
      } else {
        return NodeFilter.FILTER_REJECT;
      }
    }
  }]);
  return WhiteSpaceFilter;
}(_handler["default"]);
var _default = WhiteSpaceFilter;
exports["default"] = _default;