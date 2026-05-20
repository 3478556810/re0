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
var PrintMedia = /*#__PURE__*/function (_Handler) {
  (0, _inherits2["default"])(PrintMedia, _Handler);
  var _super = _createSuper(PrintMedia);
  function PrintMedia(chunker, polisher, caller) {
    (0, _classCallCheck2["default"])(this, PrintMedia);
    return _super.call(this, chunker, polisher, caller);
  }
  (0, _createClass2["default"])(PrintMedia, [{
    key: "onAtMedia",
    value: function onAtMedia(node, item, list) {
      var media = this.getMediaName(node);
      var rules;
      if (media.includes("print")) {
        rules = node.block.children;

        // Append rules to the end of main rules list
        // TODO: this isn't working right, needs to check what is in the prelude
        /*
        rules.forEach((selectList) => {
        	if (selectList.prelude) {
        		selectList.prelude.children.forEach((rule) => {
        				rule.children.prependData({
        				type: "Combinator",
        				name: " "
        			});
        					rule.children.prependData({
        				type: "ClassSelector",
        				name: "pagedjs_page"
        			});
        		});	
        	}
        });
        	list.insertList(rules, item);
        */

        // Append rules to the end of main rules list
        list.appendList(rules);

        // Remove rules from the @media block
        list.remove(item);
      } else if (!media.includes("all") && !media.includes("pagedjs-ignore")) {
        list.remove(item);
      }
    }
  }, {
    key: "getMediaName",
    value: function getMediaName(node) {
      var media = [];
      if (typeof node.prelude === "undefined" || node.prelude.type !== "AtrulePrelude") {
        return;
      }
      _cssTree["default"].walk(node.prelude, {
        visit: "Identifier",
        enter: function enter(identNode, iItem, iList) {
          media.push(identNode.name);
        }
      });
      return media;
    }
  }]);
  return PrintMedia;
}(_handler["default"]);
var _default = PrintMedia;
exports["default"] = _default;