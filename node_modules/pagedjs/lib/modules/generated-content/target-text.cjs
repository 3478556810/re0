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
var _css = require("../../utils/css.cjs");
var _cssTree = _interopRequireDefault(require("css-tree"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
// import { nodeAfter } from "../../utils/dom";
var TargetText = /*#__PURE__*/function (_Handler) {
  (0, _inherits2["default"])(TargetText, _Handler);
  var _super = _createSuper(TargetText);
  function TargetText(chunker, polisher, caller) {
    var _this;
    (0, _classCallCheck2["default"])(this, TargetText);
    _this = _super.call(this, chunker, polisher, caller);
    _this.styleSheet = polisher.styleSheet;
    _this.textTargets = {};
    _this.beforeContent = "";
    _this.afterContent = "";
    _this.selector = {};
    return _this;
  }
  (0, _createClass2["default"])(TargetText, [{
    key: "onContent",
    value: function onContent(funcNode, fItem, fList, declaration, rule) {
      var _this2 = this;
      if (funcNode.name === "target-text") {
        this.selector = _cssTree["default"].generate(rule.ruleNode.prelude);
        var first = funcNode.children.first();
        var last = funcNode.children.last();
        var func = first.name;
        var value = _cssTree["default"].generate(funcNode);
        var args = [];
        first.children.forEach(function (child) {
          if (child.type === "Identifier") {
            args.push(child.name);
          }
        });
        var style;
        if (last !== first) {
          style = last.name;
        }
        var variable = "--pagedjs-" + (0, _utils.UUID)();
        this.selector.split(",").forEach(function (s) {
          _this2.textTargets[s] = {
            func: func,
            args: args,
            value: value,
            style: style || "content",
            selector: s,
            fullSelector: _this2.selector,
            variable: variable
          };
        });

        // Replace with variable
        funcNode.name = "var";
        funcNode.children = new _cssTree["default"].List();
        funcNode.children.appendData({
          type: "Identifier",
          loc: 0,
          name: variable
        });
      }
    }

    //   parse this on the ONCONTENT : get all before and after and replace the value with a variable
  }, {
    key: "onPseudoSelector",
    value: function onPseudoSelector(pseudoNode, pItem, pList, selector, rule) {
      var _this3 = this;
      // console.log(pseudoNode);
      // console.log(rule);

      rule.ruleNode.block.children.forEach(function (properties) {
        if (pseudoNode.name === "before" && properties.property === "content") {
          // let beforeVariable = "--pagedjs-" + UUID();

          var contenu = properties.value.children;
          contenu.forEach(function (prop) {
            if (prop.type === "String") {
              _this3.beforeContent = prop.value;
            }
          });
        } else if (pseudoNode.name === "after" && properties.property === "content") {
          properties.value.children.forEach(function (prop) {
            if (prop.type === "String") {
              _this3.afterContent = prop.value;
            }
          });
        }
      });
    }
  }, {
    key: "afterParsed",
    value: function afterParsed(fragment) {
      var _this4 = this;
      Object.keys(this.textTargets).forEach(function (name) {
        var target = _this4.textTargets[name];
        var split = target.selector.split("::");
        var query = split[0];
        var queried = fragment.querySelectorAll(query);
        var textContent;
        queried.forEach(function (selected, index) {
          var val = (0, _utils.attr)(selected, target.args);
          var element = fragment.querySelector((0, _utils.querySelectorEscape)(val));
          if (element) {
            // content & first-letter & before & after refactorized
            if (target.style) {
              _this4.selector = (0, _utils.UUID)();
              selected.setAttribute("data-target-text", _this4.selector);
              var psuedo = "";
              if (split.length > 1) {
                psuedo += "::" + split[1];
              }
              if (target.style === "before" || target.style === "after") {
                var pseudoType = "".concat(target.style, "Content");
                textContent = (0, _css.cleanPseudoContent)(_this4[pseudoType]);
              } else {
                textContent = (0, _css.cleanPseudoContent)(element.textContent, " ");
              }
              textContent = target.style === "first-letter" ? textContent.charAt(0) : textContent;
              _this4.styleSheet.insertRule("[data-target-text=\"".concat(_this4.selector, "\"]").concat(psuedo, " { ").concat(target.variable, ": \"").concat(textContent, "\" }"));
            } else {
              console.warn("missed target", val);
            }
          }
        });
      });
    }
  }]);
  return TargetText;
}(_handler["default"]);
var _default = TargetText;
exports["default"] = _default;