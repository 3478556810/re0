"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _handler = _interopRequireDefault(require("../handler.cjs"));
var _cssTree = _interopRequireDefault(require("css-tree"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var Counters = /*#__PURE__*/function (_Handler) {
  (0, _inherits2["default"])(Counters, _Handler);
  var _super = _createSuper(Counters);
  function Counters(chunker, polisher, caller) {
    var _this;
    (0, _classCallCheck2["default"])(this, Counters);
    _this = _super.call(this, chunker, polisher, caller);
    _this.styleSheet = polisher.styleSheet;
    _this.counters = {};
    _this.resetCountersMap = new Map();
    return _this;
  }
  (0, _createClass2["default"])(Counters, [{
    key: "onDeclaration",
    value: function onDeclaration(declaration, dItem, dList, rule) {
      var property = declaration.property;
      if (property === "counter-increment") {
        this.handleIncrement(declaration, rule);
        // clean up empty declaration
        var hasProperities = false;
        declaration.value.children.forEach(function (data) {
          if (data.type && data.type !== "WhiteSpace") {
            hasProperities = true;
          }
        });
        if (!hasProperities) {
          dList.remove(dItem);
        }
      } else if (property === "counter-reset") {
        this.handleReset(declaration, rule);
        // clean up empty declaration
        var _hasProperities = false;
        declaration.value.children.forEach(function (data) {
          if (data.type && data.type !== "WhiteSpace") {
            _hasProperities = true;
          }
        });
        if (!_hasProperities) {
          dList.remove(dItem);
        }
      }
    }
  }, {
    key: "afterParsed",
    value: function afterParsed(parsed) {
      this.processCounters(parsed, this.counters);
      this.scopeCounters(this.counters);
    }
  }, {
    key: "addCounter",
    value: function addCounter(name) {
      if (name in this.counters) {
        return this.counters[name];
      }
      this.counters[name] = {
        name: name,
        increments: {},
        resets: {}
      };
      return this.counters[name];
    }
  }, {
    key: "handleIncrement",
    value: function handleIncrement(declaration, rule) {
      var _this2 = this;
      var increments = [];
      var children = declaration.value.children;
      children.forEach(function (data, item) {
        if (data.type && data.type === "Identifier") {
          var name = data.name;
          if (name === "page" || name.indexOf("target-counter-") === 0) {
            return;
          }
          var whitespace, number, value;
          if (item.next && item.next.data.type === "WhiteSpace") {
            whitespace = item.next;
          }
          if (whitespace && whitespace.next && whitespace.next.data.type === "Number") {
            number = whitespace.next;
            value = parseInt(number.data.value);
          }
          var selector = _cssTree["default"].generate(rule.ruleNode.prelude);
          var counter;
          if (!(name in _this2.counters)) {
            counter = _this2.addCounter(name);
          } else {
            counter = _this2.counters[name];
          }
          var increment = {
            selector: selector,
            number: value || 1
          };
          counter.increments[selector] = increment;
          increments.push(increment);

          // Remove the parsed resets
          children.remove(item);
          if (whitespace) {
            children.remove(whitespace);
          }
          if (number) {
            children.remove(number);
          }
        }
      });
      return increments;
    }
  }, {
    key: "handleReset",
    value: function handleReset(declaration, rule) {
      var _this3 = this;
      var children = declaration.value.children;
      children.forEach(function (data, item) {
        if (data.type && data.type === "Identifier") {
          var name = data.name;
          var whitespace, number, value;
          if (item.next && item.next.data.type === "WhiteSpace") {
            whitespace = item.next;
          }
          if (whitespace && whitespace.next) {
            if (whitespace.next.data.type === "Number") {
              // The counter reset value is specified using a number. E.g. counter-reset: c2 5;
              number = whitespace.next;
              value = parseInt(number.data.value);
            } else if (whitespace.next.data.type === "Function" && whitespace.next.data.name === "var") {
              // The counter reset value is specified using a CSS variable (custom property).
              // E.g. counter-reset: c2 var(--my-variable);
              // See https://developer.mozilla.org/en-US/docs/Web/CSS/var
              number = whitespace.next;
              // Use the variable name (e.g. '--my-variable') as value for now. The actual value is resolved later by the
              // processCounterResets function.
              value = whitespace.next.data.children.head.data.name;
            }
          }
          var counter;
          var selector;
          var prelude = rule.ruleNode.prelude;
          if (rule.ruleNode.type === "Atrule" && rule.ruleNode.name === "page") {
            selector = ".pagedjs_page";
          } else {
            selector = _cssTree["default"].generate(prelude || rule.ruleNode);
          }
          if (name === "footnote") {
            _this3.addFootnoteMarkerCounter(declaration.value.children);
          }
          if (!(name in _this3.counters)) {
            counter = _this3.addCounter(name);
          } else {
            counter = _this3.counters[name];
          }
          var reset = {
            selector: selector,
            number: value || 0
          };
          counter.resets[selector] = reset;
          if (selector !== ".pagedjs_page") {
            // Remove the parsed resets
            children.remove(item);
            if (whitespace) {
              children.remove(whitespace);
            }
            if (number) {
              children.remove(number);
            }
          }
        }
      });
    }
  }, {
    key: "processCounters",
    value: function processCounters(parsed, counters) {
      var counter;
      for (var c in counters) {
        counter = this.counters[c];
        this.processCounterIncrements(parsed, counter);
        this.processCounterResets(parsed, counter);
        if (c !== "page") {
          this.addCounterValues(parsed, counter);
        }
      }
    }
  }, {
    key: "scopeCounters",
    value: function scopeCounters(counters) {
      var countersArray = [];
      for (var c in counters) {
        if (c !== "page") {
          countersArray.push("".concat(counters[c].name, " 0"));
        }
      }
      // Add to pages to allow cross page scope
      this.insertRule(".pagedjs_pages { counter-reset: ".concat(countersArray.join(" "), " page 0 pages var(--pagedjs-page-count) footnote var(--pagedjs-footnotes-count) footnote-marker var(--pagedjs-footnotes-count)}"));
    }
  }, {
    key: "insertRule",
    value: function insertRule(rule) {
      this.styleSheet.insertRule(rule, this.styleSheet.cssRules.length);
    }
  }, {
    key: "processCounterIncrements",
    value: function processCounterIncrements(parsed, counter) {
      var increment;
      for (var inc in counter.increments) {
        increment = counter.increments[inc];
        // Find elements for increments
        var incrementElements = parsed.querySelectorAll(increment.selector);
        // Add counter data
        for (var i = 0; i < incrementElements.length; i++) {
          incrementElements[i].setAttribute("data-counter-" + counter.name + "-increment", increment.number);
          if (incrementElements[i].getAttribute("data-counter-increment")) {
            incrementElements[i].setAttribute("data-counter-increment", incrementElements[i].getAttribute("data-counter-increment") + " " + counter.name);
          } else {
            incrementElements[i].setAttribute("data-counter-increment", counter.name);
          }
        }
      }
    }
  }, {
    key: "processCounterResets",
    value: function processCounterResets(parsed, counter) {
      var reset;
      for (var r in counter.resets) {
        reset = counter.resets[r];
        // Find elements for resets
        var resetElements = parsed.querySelectorAll(reset.selector);
        // Add counter data
        for (var i = 0; i < resetElements.length; i++) {
          var value = reset.number;
          if (typeof value === "string" && value.startsWith("--")) {
            // The value is specified using a CSS variable (custom property).
            // FIXME: We get the variable value only from the inline style of the element because at this point the
            // element is detached and thus using:
            //
            //		getComputedStyle(resetElements[i]).getPropertyValue(value)
            //
            // always returns an empty string. We could try to temporarily attach the element to get its computed style,
            // but for now using the inline style is enough for us.
            value = resetElements[i].style.getPropertyValue(value) || 0;
          }
          resetElements[i].setAttribute("data-counter-" + counter.name + "-reset", value);
          if (resetElements[i].getAttribute("data-counter-reset")) {
            resetElements[i].setAttribute("data-counter-reset", resetElements[i].getAttribute("data-counter-reset") + " " + counter.name);
          } else {
            resetElements[i].setAttribute("data-counter-reset", counter.name);
          }
        }
      }
    }
  }, {
    key: "addCounterValues",
    value: function addCounterValues(parsed, counter) {
      var counterName = counter.name;
      if (counterName === "page" || counterName === "footnote") {
        return;
      }
      var elements = parsed.querySelectorAll("[data-counter-" + counterName + "-reset], [data-counter-" + counterName + "-increment]");
      var count = 0;
      var element;
      var increment, reset;
      var resetValue, incrementValue, resetDelta;
      var incrementArray;
      for (var i = 0; i < elements.length; i++) {
        element = elements[i];
        resetDelta = 0;
        incrementArray = [];
        if (element.hasAttribute("data-counter-" + counterName + "-reset")) {
          reset = element.getAttribute("data-counter-" + counterName + "-reset");
          resetValue = parseInt(reset);

          // Use negative increment value inplace of reset
          resetDelta = resetValue - count;
          incrementArray.push("".concat(counterName, " ").concat(resetDelta));
          count = resetValue;
        }
        if (element.hasAttribute("data-counter-" + counterName + "-increment")) {
          increment = element.getAttribute("data-counter-" + counterName + "-increment");
          incrementValue = parseInt(increment);
          count += incrementValue;
          element.setAttribute("data-counter-" + counterName + "-value", count);
          incrementArray.push("".concat(counterName, " ").concat(incrementValue));
        }
        if (incrementArray.length > 0) {
          this.incrementCounterForElement(element, incrementArray);
        }
      }
    }
  }, {
    key: "addFootnoteMarkerCounter",
    value: function addFootnoteMarkerCounter(list) {
      var markers = [];
      _cssTree["default"].walk(list, {
        visit: "Identifier",
        enter: function enter(identNode, iItem, iList) {
          markers.push(identNode.name);
        }
      });

      // Already added
      if (markers.includes("footnote-maker")) {
        return;
      }
      list.insertData({
        type: "WhiteSpace",
        value: " "
      });
      list.insertData({
        type: "Identifier",
        name: "footnote-marker"
      });
      list.insertData({
        type: "WhiteSpace",
        value: " "
      });
      list.insertData({
        type: "Number",
        value: 0
      });
    }
  }, {
    key: "incrementCounterForElement",
    value: function incrementCounterForElement(element, incrementArray) {
      if (!element || !incrementArray || incrementArray.length === 0) return;
      var ref = element.dataset.ref;
      var increments = Array.from(this.styleSheet.cssRules).filter(function (rule) {
        return rule.selectorText === "[data-ref=\"".concat(element.dataset.ref, "\"]:not([data-split-from])") && rule.style[0] === "counter-increment";
      }).map(function (rule) {
        return rule.style.counterIncrement;
      });

      // Merge the current increments by summing the values because we generate both a decrement and an increment when the
      // element resets and increments the counter at the same time. E.g. ['c1 -7', 'c1 1'] should lead to 'c1 -6'.
      increments.push(this.mergeIncrements(incrementArray, function (prev, next) {
        return (parseInt(prev) || 0) + (parseInt(next) || 0);
      }));

      // Keep the last value for each counter when merging with the previous increments. E.g. ['c1 -7 c2 3', 'c1 1']
      // should lead to 'c1 1 c2 3'.
      var counterIncrement = this.mergeIncrements(increments, function (prev, next) {
        return next;
      });
      this.insertRule("[data-ref=\"".concat(ref, "\"]:not([data-split-from]) { counter-increment: ").concat(counterIncrement, " }"));
    }

    /**
     * Merge multiple values of a counter-increment CSS rule, using the specified operator.
     *
     * @param {Array} incrementArray the values to merge, e.g. ['c1 1', 'c1 -7 c2 1']
     * @param {Function} operator the function used to merge counter values (e.g. keep the last value of a counter or sum
     *					the counter values)
     * @return {string} the merged value of the counter-increment CSS rule
     */
  }, {
    key: "mergeIncrements",
    value: function mergeIncrements(incrementArray, operator) {
      var increments = {};
      incrementArray.forEach(function (increment) {
        var values = increment.split(" ");
        for (var i = 0; i < values.length; i += 2) {
          increments[values[i]] = operator(increments[values[i]], values[i + 1]);
        }
      });
      return Object.entries(increments).map(function (_ref) {
        var _ref2 = (0, _slicedToArray2["default"])(_ref, 2),
          key = _ref2[0],
          value = _ref2[1];
        return "".concat(key, " ").concat(value);
      }).join(" ");
    }
  }, {
    key: "afterPageLayout",
    value: function afterPageLayout(pageElement, page) {
      var _this4 = this;
      var resets = [];
      var pgreset = pageElement.querySelectorAll("[data-counter-page-reset]:not([data-split-from])");
      pgreset.forEach(function (reset) {
        var ref = reset.dataset && reset.dataset.ref;
        if (ref && _this4.resetCountersMap.has(ref)) {
          // ignoring, the counter-reset directive has already been taken into account.
        } else {
          if (ref) {
            _this4.resetCountersMap.set(ref, "");
          }
          var value = reset.dataset.counterPageReset;
          resets.push("page ".concat(value));
        }
      });
      var notereset = pageElement.querySelectorAll("[data-counter-footnote-reset]:not([data-split-from])");
      notereset.forEach(function (reset) {
        var value = reset.dataset.counterFootnoteReset;
        resets.push("footnote ".concat(value));
        resets.push("footnote-marker ".concat(value));
      });
      if (resets.length) {
        this.styleSheet.insertRule("[data-page-number=\"".concat(pageElement.dataset.pageNumber, "\"] { counter-increment: none; counter-reset: ").concat(resets.join(" "), " }"), this.styleSheet.cssRules.length);
      }
    }
  }]);
  return Counters;
}(_handler["default"]);
var _default = Counters;
exports["default"] = _default;