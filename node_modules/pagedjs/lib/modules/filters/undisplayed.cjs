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
var _clearCut = require("clear-cut");
var _css = require("../../utils/css.cjs");
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var UndisplayedFilter = /*#__PURE__*/function (_Handler) {
  (0, _inherits2["default"])(UndisplayedFilter, _Handler);
  var _super = _createSuper(UndisplayedFilter);
  function UndisplayedFilter(chunker, polisher, caller) {
    var _this;
    (0, _classCallCheck2["default"])(this, UndisplayedFilter);
    _this = _super.call(this, chunker, polisher, caller);
    _this.displayRules = {};
    return _this;
  }
  (0, _createClass2["default"])(UndisplayedFilter, [{
    key: "onDeclaration",
    value: function onDeclaration(declaration, dItem, dList, rule) {
      var _this2 = this;
      if (declaration.property === "display") {
        var selector = _cssTree["default"].generate(rule.ruleNode.prelude);
        var value = declaration.value.children.first().name;
        selector.split(",").forEach(function (s) {
          _this2.displayRules[s] = {
            value: value,
            selector: s,
            specificity: (0, _clearCut.calculateSpecificity)(s),
            important: declaration.important
          };
        });
      }
    }
  }, {
    key: "filter",
    value: function filter(content) {
      var _this$sortDisplayedSe = this.sortDisplayedSelectors(content, this.displayRules),
        matches = _this$sortDisplayedSe.matches,
        selectors = _this$sortDisplayedSe.selectors;

      // Find matching elements that have display styles
      for (var i = 0; i < matches.length; i++) {
        var element = matches[i];
        var selector = selectors[i];
        var displayValue = selector[selector.length - 1].value;
        if (this.removable(element) && displayValue === "none") {
          element.dataset.undisplayed = "undisplayed";
        }
      }

      // Find elements that have inline styles
      var styledElements = content.querySelectorAll("[style]");
      for (var _i = 0; _i < styledElements.length; _i++) {
        var _element = styledElements[_i];
        if (this.removable(_element)) {
          _element.dataset.undisplayed = "undisplayed";
        }
      }
    }
  }, {
    key: "sorter",
    value: function sorter(a, b) {
      if (a.important && !b.important) {
        return 1;
      }
      if (b.important && !a.important) {
        return -1;
      }
      return a.specificity - b.specificity;
    }
  }, {
    key: "sortDisplayedSelectors",
    value: function sortDisplayedSelectors(content) {
      var displayRules = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
      var matches = [];
      var selectors = [];
      for (var d in displayRules) {
        var displayItem = displayRules[d];
        var selector = displayItem.selector;
        var query = [];
        try {
          try {
            query = content.querySelectorAll(selector);
          } catch (e) {
            query = content.querySelectorAll((0, _css.cleanSelector)(selector));
          }
        } catch (e) {
          query = [];
        }
        var elements = Array.from(query);
        for (var _i2 = 0, _elements = elements; _i2 < _elements.length; _i2++) {
          var e = _elements[_i2];
          if (matches.includes(e)) {
            var index = matches.indexOf(e);
            selectors[index].push(displayItem);
            selectors[index] = selectors[index].sort(this.sorter);
          } else {
            matches.push(e);
            selectors.push([displayItem]);
          }
        }
      }
      return {
        matches: matches,
        selectors: selectors
      };
    }
  }, {
    key: "removable",
    value: function removable(element) {
      if (element.style && element.style.display !== "" && element.style.display !== "none") {
        return false;
      }
      return true;
    }
  }]);
  return UndisplayedFilter;
}(_handler["default"]);
var _default = UndisplayedFilter;
exports["default"] = _default;