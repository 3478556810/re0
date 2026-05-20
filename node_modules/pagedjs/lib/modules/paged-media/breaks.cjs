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
var _dom = require("../../utils/dom.cjs");
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var Breaks = /*#__PURE__*/function (_Handler) {
  (0, _inherits2["default"])(Breaks, _Handler);
  var _super = _createSuper(Breaks);
  function Breaks(chunker, polisher, caller) {
    var _this;
    (0, _classCallCheck2["default"])(this, Breaks);
    _this = _super.call(this, chunker, polisher, caller);
    _this.breaks = {};
    return _this;
  }
  (0, _createClass2["default"])(Breaks, [{
    key: "onDeclaration",
    value: function onDeclaration(declaration, dItem, dList, rule) {
      var _this2 = this;
      var property = declaration.property;
      if (property === "page") {
        var children = declaration.value.children.first();
        var value = children.name;
        var selector = _cssTree["default"].generate(rule.ruleNode.prelude);
        var name = value;
        var breaker = {
          property: property,
          value: value,
          selector: selector,
          name: name
        };
        selector.split(",").forEach(function (s) {
          if (!_this2.breaks[s]) {
            _this2.breaks[s] = [breaker];
          } else {
            _this2.breaks[s].push(breaker);
          }
        });
        dList.remove(dItem);
      }
      if (property === "break-before" || property === "break-after" || property === "page-break-before" || property === "page-break-after") {
        var child = declaration.value.children.first();
        var _value = child.name;
        var _selector = _cssTree["default"].generate(rule.ruleNode.prelude);
        if (property === "page-break-before") {
          property = "break-before";
        } else if (property === "page-break-after") {
          property = "break-after";
        }
        var _breaker = {
          property: property,
          value: _value,
          selector: _selector
        };
        _selector.split(",").forEach(function (s) {
          if (!_this2.breaks[s]) {
            _this2.breaks[s] = [_breaker];
          } else {
            _this2.breaks[s].push(_breaker);
          }
        });

        // Remove from CSS -- handle right / left in module
        dList.remove(dItem);
      }
    }
  }, {
    key: "afterParsed",
    value: function afterParsed(parsed) {
      this.processBreaks(parsed, this.breaks);
    }
  }, {
    key: "processBreaks",
    value: function processBreaks(parsed, breaks) {
      for (var b in breaks) {
        // Find elements
        var elements = parsed.querySelectorAll(b);
        // Add break data
        for (var i = 0; i < elements.length; i++) {
          var _iterator = _createForOfIteratorHelper(breaks[b]),
            _step;
          try {
            for (_iterator.s(); !(_step = _iterator.n()).done;) {
              var prop = _step.value;
              if (prop.property === "break-after") {
                var nodeAfter = (0, _dom.displayedElementAfter)(elements[i], parsed);
                elements[i].setAttribute("data-break-after", prop.value);
                if (nodeAfter) {
                  nodeAfter.setAttribute("data-previous-break-after", prop.value);
                }
              } else if (prop.property === "break-before") {
                var nodeBefore = (0, _dom.displayedElementBefore)(elements[i], parsed);

                // Breaks are only allowed between siblings, not between a box and its container.
                // If we cannot find a node before we should not break!
                // https://drafts.csswg.org/css-break-3/#break-propagation
                if (nodeBefore) {
                  if (prop.value === "page" && (0, _dom.needsPageBreak)(elements[i], nodeBefore)) {
                    // we ignore this explicit page break because an implicit page break is already needed
                    continue;
                  }
                  elements[i].setAttribute("data-break-before", prop.value);
                  nodeBefore.setAttribute("data-next-break-before", prop.value);
                }
              } else if (prop.property === "page") {
                elements[i].setAttribute("data-page", prop.value);
                var _nodeAfter = (0, _dom.displayedElementAfter)(elements[i], parsed);
                if (_nodeAfter) {
                  _nodeAfter.setAttribute("data-after-page", prop.value);
                }
              } else {
                elements[i].setAttribute("data-" + prop.property, prop.value);
              }
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }
        }
      }
    }
  }, {
    key: "mergeBreaks",
    value: function mergeBreaks(pageBreaks, newBreaks) {
      for (var b in newBreaks) {
        if (b in pageBreaks) {
          pageBreaks[b] = pageBreaks[b].concat(newBreaks[b]);
        } else {
          pageBreaks[b] = newBreaks[b];
        }
      }
      return pageBreaks;
    }
  }, {
    key: "addBreakAttributes",
    value: function addBreakAttributes(pageElement, page) {
      var before = pageElement.querySelector("[data-break-before]");
      var after = pageElement.querySelector("[data-break-after]");
      var previousBreakAfter = pageElement.querySelector("[data-previous-break-after]");
      if (before) {
        if (before.dataset.splitFrom) {
          page.splitFrom = before.dataset.splitFrom;
          pageElement.setAttribute("data-split-from", before.dataset.splitFrom);
        } else if (before.dataset.breakBefore && before.dataset.breakBefore !== "avoid") {
          page.breakBefore = before.dataset.breakBefore;
          pageElement.setAttribute("data-break-before", before.dataset.breakBefore);
        }
      }
      if (after && after.dataset) {
        if (after.dataset.splitTo) {
          page.splitTo = after.dataset.splitTo;
          pageElement.setAttribute("data-split-to", after.dataset.splitTo);
        } else if (after.dataset.breakAfter && after.dataset.breakAfter !== "avoid") {
          page.breakAfter = after.dataset.breakAfter;
          pageElement.setAttribute("data-break-after", after.dataset.breakAfter);
        }
      }
      if (previousBreakAfter && previousBreakAfter.dataset) {
        if (previousBreakAfter.dataset.previousBreakAfter && previousBreakAfter.dataset.previousBreakAfter !== "avoid") {
          page.previousBreakAfter = previousBreakAfter.dataset.previousBreakAfter;
        }
      }
    }
  }, {
    key: "afterPageLayout",
    value: function afterPageLayout(pageElement, page) {
      this.addBreakAttributes(pageElement, page);
    }
  }]);
  return Breaks;
}(_handler["default"]);
var _default = Breaks;
exports["default"] = _default;