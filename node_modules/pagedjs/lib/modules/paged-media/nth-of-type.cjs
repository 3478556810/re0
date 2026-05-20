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
var _cssTree = _interopRequireDefault(require("css-tree"));
var _utils = require("../../utils/utils.cjs");
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var NthOfType = /*#__PURE__*/function (_Handler) {
  (0, _inherits2["default"])(NthOfType, _Handler);
  var _super = _createSuper(NthOfType);
  function NthOfType(chunker, polisher, caller) {
    var _this;
    (0, _classCallCheck2["default"])(this, NthOfType);
    _this = _super.call(this, chunker, polisher, caller);
    _this.styleSheet = polisher.styleSheet;
    _this.selectors = {};
    return _this;
  }
  (0, _createClass2["default"])(NthOfType, [{
    key: "onRule",
    value: function onRule(ruleNode, ruleItem, rulelist) {
      var _this2 = this;
      var selector = _cssTree["default"].generate(ruleNode.prelude);
      if (selector.match(/:(first|last|nth)-of-type/)) {
        var declarations = _cssTree["default"].generate(ruleNode.block);
        declarations = declarations.replace(/[{}]/g, "");
        var uuid = "nth-of-type-" + (0, _utils.UUID)();
        selector.split(",").forEach(function (s) {
          if (!_this2.selectors[s]) {
            _this2.selectors[s] = [uuid, declarations];
          } else {
            _this2.selectors[s][1] = "".concat(_this2.selectors[s][1], ";").concat(declarations);
          }
        });
        rulelist.remove(ruleItem);
      }
    }
  }, {
    key: "afterParsed",
    value: function afterParsed(parsed) {
      this.processSelectors(parsed, this.selectors);
    }
  }, {
    key: "processSelectors",
    value: function processSelectors(parsed, selectors) {
      // add the new attributes to matching elements
      for (var s in selectors) {
        var elements = parsed.querySelectorAll(s);
        for (var i = 0; i < elements.length; i++) {
          var dataNthOfType = elements[i].getAttribute("data-nth-of-type");
          if (dataNthOfType && dataNthOfType != "") {
            dataNthOfType = "".concat(dataNthOfType, ",").concat(selectors[s][0]);
            elements[i].setAttribute("data-nth-of-type", dataNthOfType);
          } else {
            elements[i].setAttribute("data-nth-of-type", selectors[s][0]);
          }
        }
        var rule = "*[data-nth-of-type*='".concat(selectors[s][0], "'] { ").concat(selectors[s][1], "; }");
        this.styleSheet.insertRule(rule, this.styleSheet.cssRules.length);
      }
    }
  }]);
  return NthOfType;
}(_handler["default"]);
var _default = NthOfType;
exports["default"] = _default;