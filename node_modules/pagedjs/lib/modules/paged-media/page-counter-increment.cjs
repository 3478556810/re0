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
var PageCounterIncrement = /*#__PURE__*/function (_Handler) {
  (0, _inherits2["default"])(PageCounterIncrement, _Handler);
  var _super = _createSuper(PageCounterIncrement);
  function PageCounterIncrement(chunker, polisher, caller) {
    var _this;
    (0, _classCallCheck2["default"])(this, PageCounterIncrement);
    _this = _super.call(this, chunker, polisher, caller);
    _this.styleSheet = polisher.styleSheet;
    _this.pageCounter = {
      name: "page",
      increments: {},
      resets: {}
    };
    return _this;
  }
  (0, _createClass2["default"])(PageCounterIncrement, [{
    key: "onDeclaration",
    value: function onDeclaration(declaration, dItem, dList, rule) {
      var property = declaration.property;
      if (property === "counter-increment") {
        var inc = this.handleIncrement(declaration, rule);
        if (inc) {
          dList.remove(dItem);
        }
      }
    }
  }, {
    key: "afterParsed",
    value: function afterParsed(_) {
      for (var inc in this.pageCounter.increments) {
        var increment = this.pageCounter.increments[inc];
        this.insertRule("".concat(increment.selector, " { --pagedjs-page-counter-increment: ").concat(increment.number, " }"));
      }
    }
  }, {
    key: "handleIncrement",
    value: function handleIncrement(declaration, rule) {
      var identifier = declaration.value.children.first();
      var number = declaration.value.children.getSize() > 1 ? declaration.value.children.last().value : 1;
      var name = identifier && identifier.name;
      if (name && name.indexOf("target-counter-") === 0) {
        return;
      }
      // A counter named page is automatically created and incremented by 1 on every page of the document,
      // unless the counter-increment property in the page context explicitly specifies a different increment for the page counter.
      // https://www.w3.org/TR/css-page-3/#page-based-counters
      if (name !== "page") {
        return;
      }
      // the counter-increment property is not defined on the page context (i.e. @page rule), ignoring...
      if (rule.ruleNode.name === "page" && rule.ruleNode.type === "Atrule") {
        return;
      }
      var selector = _cssTree["default"].generate(rule.ruleNode.prelude);
      return this.pageCounter.increments[selector] = {
        selector: selector,
        number: number
      };
    }
  }, {
    key: "insertRule",
    value: function insertRule(rule) {
      this.styleSheet.insertRule(rule, this.styleSheet.cssRules.length);
    }
  }]);
  return PageCounterIncrement;
}(_handler["default"]);
var _default = PageCounterIncrement;
exports["default"] = _default;