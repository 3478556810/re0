"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _utils = require("../utils/utils.cjs");
/**
 * Render a flow of text offscreen
 * @class
 */
var ContentParser = /*#__PURE__*/function () {
  function ContentParser(content, cb) {
    (0, _classCallCheck2["default"])(this, ContentParser);
    if (content && content.nodeType) {
      // handle dom
      this.dom = this.add(content);
    } else if (typeof content === "string") {
      this.dom = this.parse(content);
    }
    return this.dom;
  }
  (0, _createClass2["default"])(ContentParser, [{
    key: "parse",
    value: function parse(markup, mime) {
      var range = document.createRange();
      var fragment = range.createContextualFragment(markup);
      this.addRefs(fragment);
      return fragment;
    }
  }, {
    key: "add",
    value: function add(contents) {
      // let fragment = document.createDocumentFragment();
      //
      // let children = [...contents.childNodes];
      // for (let child of children) {
      // 	let clone = child.cloneNode(true);
      // 	fragment.appendChild(clone);
      // }

      this.addRefs(contents);
      return contents;
    }
  }, {
    key: "addRefs",
    value: function addRefs(content) {
      var treeWalker = document.createTreeWalker(content, NodeFilter.SHOW_ELEMENT, null, false);
      var node = treeWalker.nextNode();
      while (node) {
        if (!node.hasAttribute("data-ref")) {
          var uuid = (0, _utils.UUID)();
          node.setAttribute("data-ref", uuid);
        }
        if (node.id) {
          node.setAttribute("data-id", node.id);
        }

        // node.setAttribute("data-children", node.childNodes.length);

        // node.setAttribute("data-text", node.textContent.trim().length);
        node = treeWalker.nextNode();
      }
    }
  }, {
    key: "find",
    value: function find(ref) {
      return this.refs[ref];
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.refs = undefined;
      this.dom = undefined;
    }
  }]);
  return ContentParser;
}();
var _default = ContentParser;
exports["default"] = _default;