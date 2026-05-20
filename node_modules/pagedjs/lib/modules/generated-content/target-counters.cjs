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
var _utils = require("../../utils/utils.cjs");
var _cssTree = _interopRequireDefault(require("css-tree"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var TargetCounters = /*#__PURE__*/function (_Handler) {
  (0, _inherits2["default"])(TargetCounters, _Handler);
  var _super = _createSuper(TargetCounters);
  function TargetCounters(chunker, polisher, caller) {
    var _this;
    (0, _classCallCheck2["default"])(this, TargetCounters);
    _this = _super.call(this, chunker, polisher, caller);
    _this.styleSheet = polisher.styleSheet;
    _this.counterTargets = {};
    return _this;
  }
  (0, _createClass2["default"])(TargetCounters, [{
    key: "onContent",
    value: function onContent(funcNode, fItem, fList, declaration, rule) {
      var _this2 = this;
      if (funcNode.name === "target-counter") {
        var selector = _cssTree["default"].generate(rule.ruleNode.prelude);
        var first = funcNode.children.first();
        var func = first.name;
        var value = _cssTree["default"].generate(funcNode);
        var args = [];
        first.children.forEach(function (child) {
          if (child.type === "Identifier") {
            args.push(child.name);
          }
        });
        var counter;
        var style;
        var styleIdentifier;
        funcNode.children.forEach(function (child) {
          if (child.type === "Identifier") {
            if (!counter) {
              counter = child.name;
            } else if (!style) {
              styleIdentifier = _cssTree["default"].clone(child);
              style = child.name;
            }
          }
        });
        var variable = "target-counter-" + (0, _utils.UUID)();
        selector.split(",").forEach(function (s) {
          _this2.counterTargets[s] = {
            func: func,
            args: args,
            value: value,
            counter: counter,
            style: style,
            selector: s,
            fullSelector: selector,
            variable: variable
          };
        });

        // Replace with counter
        funcNode.name = "counter";
        funcNode.children = new _cssTree["default"].List();
        funcNode.children.appendData({
          type: "Identifier",
          loc: 0,
          name: variable
        });
        if (styleIdentifier) {
          funcNode.children.appendData({
            type: "Operator",
            loc: null,
            value: ","
          });
          funcNode.children.appendData(styleIdentifier);
        }
      }
    }
  }, {
    key: "afterPageLayout",
    value: function afterPageLayout(fragment, page, breakToken, chunker) {
      var _this3 = this;
      Object.keys(this.counterTargets).forEach(function (name) {
        var target = _this3.counterTargets[name];
        var split = target.selector.split(/::?/g);
        var query = split[0];
        var queried = chunker.pagesArea.querySelectorAll(query + ":not([data-" + target.variable + "])");
        queried.forEach(function (selected, index) {
          // TODO: handle func other than attr
          if (target.func !== "attr") {
            return;
          }
          var val = (0, _utils.attr)(selected, target.args);
          var element = chunker.pagesArea.querySelector((0, _utils.querySelectorEscape)(val));
          if (element) {
            var selector = (0, _utils.UUID)();
            selected.setAttribute("data-" + target.variable, selector);
            // TODO: handle other counter types (by query)
            var pseudo = "";
            if (split.length > 1) {
              pseudo += "::" + split[1];
            }
            if (target.counter === "page") {
              var pages = chunker.pagesArea.querySelectorAll(".pagedjs_page");
              var pg = 0;
              for (var i = 0; i < pages.length; i++) {
                var _page = pages[i];
                var styles = window.getComputedStyle(_page);
                var reset = styles["counter-reset"].replace("page", "").trim();
                var increment = styles["counter-increment"].replace("page", "").trim();
                if (reset !== "none") {
                  pg = parseInt(reset);
                }
                if (increment !== "none") {
                  pg += parseInt(increment);
                }
                if (_page.contains(element)) {
                  break;
                }
              }
              _this3.styleSheet.insertRule("[data-".concat(target.variable, "=\"").concat(selector, "\"]").concat(pseudo, " { counter-reset: ").concat(target.variable, " ").concat(pg, "; }"), _this3.styleSheet.cssRules.length);
            } else {
              var value = element.getAttribute("data-counter-".concat(target.counter, "-value"));
              if (value) {
                _this3.styleSheet.insertRule("[data-".concat(target.variable, "=\"").concat(selector, "\"]").concat(pseudo, " { counter-reset: ").concat(target.variable, " ").concat(target.variable, " ").concat(parseInt(value), "; }"), _this3.styleSheet.cssRules.length);
              }
            }

            // force redraw
            var el = document.querySelector("[data-".concat(target.variable, "=\"").concat(selector, "\"]"));
            if (el) {
              el.style.display = "none";
              el.clientHeight;
              el.style.removeProperty("display");
            }
          }
        });
      });
    }
  }]);
  return TargetCounters;
}(_handler["default"]);
var _default = TargetCounters;
exports["default"] = _default;