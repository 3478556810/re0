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
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var PositionFixed = /*#__PURE__*/function (_Handler) {
  (0, _inherits2["default"])(PositionFixed, _Handler);
  var _super = _createSuper(PositionFixed);
  function PositionFixed(chunker, polisher, caller) {
    var _this;
    (0, _classCallCheck2["default"])(this, PositionFixed);
    _this = _super.call(this, chunker, polisher, caller);
    _this.styleSheet = polisher.styleSheet;
    _this.fixedElementsSelector = [];
    _this.fixedElements = [];
    return _this;
  }
  (0, _createClass2["default"])(PositionFixed, [{
    key: "onDeclaration",
    value: function onDeclaration(declaration, dItem, dList, rule) {
      if (declaration.property === "position" && declaration.value.children.first().name === "fixed") {
        var selector = _cssTree["default"].generate(rule.ruleNode.prelude);
        this.fixedElementsSelector.push(selector);
        dList.remove(dItem);
      }
    }
  }, {
    key: "afterParsed",
    value: function afterParsed(fragment) {
      var _this2 = this;
      this.fixedElementsSelector.forEach(function (fixedEl) {
        fragment.querySelectorAll("".concat(fixedEl)).forEach(function (el) {
          el.style.setProperty("position", "absolute");
          _this2.fixedElements.push(el);
          el.remove();
        });
      });
    }
  }, {
    key: "afterPageLayout",
    value: function afterPageLayout(pageElement, page, breakToken) {
      this.fixedElements.forEach(function (el) {
        var clone = el.cloneNode(true);
        pageElement.querySelector(".pagedjs_pagebox").insertAdjacentElement("afterbegin", clone);
      });
    }
  }]);
  return PositionFixed;
}(_handler["default"]);
var _default = PositionFixed;
exports["default"] = _default;