"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _eventEmitter = _interopRequireDefault(require("event-emitter"));
var _hook = _interopRequireDefault(require("../utils/hook.cjs"));
var _chunker = _interopRequireDefault(require("../chunker/chunker.cjs"));
var _polisher = _interopRequireDefault(require("../polisher/polisher.cjs"));
var _handlers = require("../utils/handlers.cjs");
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
var Previewer = /*#__PURE__*/function () {
  function Previewer(options) {
    var _this = this;
    (0, _classCallCheck2["default"])(this, Previewer);
    // this.preview = this.getParams("preview") !== "false";

    this.settings = options || {};

    // Process styles
    this.polisher = new _polisher["default"](false);

    // Chunk contents
    this.chunker = new _chunker["default"](undefined, undefined, this.settings);

    // Hooks
    this.hooks = {};
    this.hooks.beforePreview = new _hook["default"](this);
    this.hooks.afterPreview = new _hook["default"](this);

    // default size
    this.size = {
      width: {
        value: 8.5,
        unit: "in"
      },
      height: {
        value: 11,
        unit: "in"
      },
      format: undefined,
      orientation: undefined
    };
    this.chunker.on("page", function (page) {
      _this.emit("page", page);
    });
    this.chunker.on("rendering", function () {
      _this.emit("rendering", _this.chunker);
    });
  }
  (0, _createClass2["default"])(Previewer, [{
    key: "initializeHandlers",
    value: function initializeHandlers() {
      var _this2 = this;
      var handlers = (0, _handlers.initializeHandlers)(this.chunker, this.polisher, this);
      handlers.on("size", function (size) {
        _this2.size = size;
        _this2.emit("size", size);
      });
      handlers.on("atpages", function (pages) {
        _this2.atpages = pages;
        _this2.emit("atpages", pages);
      });
      return handlers;
    }
  }, {
    key: "registerHandlers",
    value: function registerHandlers() {
      return _handlers.registerHandlers.apply(_handlers.registerHandlers, arguments);
    }
  }, {
    key: "getParams",
    value: function getParams(name) {
      var param;
      var url = new URL(window.location);
      var params = new URLSearchParams(url.search);
      var _iterator = _createForOfIteratorHelper(params.entries()),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var pair = _step.value;
          if (pair[0] === name) {
            param = pair[1];
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      return param;
    }
  }, {
    key: "wrapContent",
    value: function wrapContent() {
      // Wrap body in template tag
      var body = document.querySelector("body");

      // Check if a template exists
      var template;
      template = body.querySelector(":scope > template[data-ref='pagedjs-content']");
      if (!template) {
        // Otherwise create one
        template = document.createElement("template");
        template.dataset.ref = "pagedjs-content";
        template.innerHTML = body.innerHTML;
        body.innerHTML = "";
        body.appendChild(template);
      }
      return template.content;
    }
  }, {
    key: "removeStyles",
    value: function removeStyles() {
      var doc = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document;
      // Get all stylesheets
      var stylesheets = Array.from(doc.querySelectorAll("link[rel='stylesheet']:not([data-pagedjs-ignore], [media~='screen'])"));
      // Get inline styles
      var inlineStyles = Array.from(doc.querySelectorAll("style:not([data-pagedjs-inserted-styles], [data-pagedjs-ignore], [media~='screen'])"));
      var elements = [].concat(stylesheets, inlineStyles);
      return elements
      // preserve order
      .sort(function (element1, element2) {
        var position = element1.compareDocumentPosition(element2);
        if (position === Node.DOCUMENT_POSITION_PRECEDING) {
          return 1;
        } else if (position === Node.DOCUMENT_POSITION_FOLLOWING) {
          return -1;
        }
        return 0;
      })
      // extract the href
      .map(function (element) {
        if (element.nodeName === "STYLE") {
          var obj = {};
          obj[window.location.href] = element.textContent;
          element.remove();
          return obj;
        }
        if (element.nodeName === "LINK") {
          element.remove();
          return element.href;
        }
        // ignore
        console.warn("Unable to process: ".concat(element, ", ignoring."));
      });
    }
  }, {
    key: "preview",
    value: function () {
      var _preview = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(content, stylesheets, renderTo) {
        var _this$polisher;
        var startTime, flow, endTime;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return this.hooks.beforePreview.trigger(content, renderTo);
            case 2:
              if (!content) {
                content = this.wrapContent();
              }
              if (!stylesheets) {
                stylesheets = this.removeStyles();
              }
              this.polisher.setup();
              this.handlers = this.initializeHandlers();
              _context.next = 8;
              return (_this$polisher = this.polisher).add.apply(_this$polisher, (0, _toConsumableArray2["default"])(stylesheets));
            case 8:
              startTime = performance.now(); // Render flow
              _context.next = 11;
              return this.chunker.flow(content, renderTo);
            case 11:
              flow = _context.sent;
              endTime = performance.now();
              flow.performance = endTime - startTime;
              flow.size = this.size;
              this.emit("rendered", flow);
              _context.next = 18;
              return this.hooks.afterPreview.trigger(flow.pages);
            case 18:
              return _context.abrupt("return", flow);
            case 19:
            case "end":
              return _context.stop();
          }
        }, _callee, this);
      }));
      function preview(_x, _x2, _x3) {
        return _preview.apply(this, arguments);
      }
      return preview;
    }()
  }]);
  return Previewer;
}();
(0, _eventEmitter["default"])(Previewer.prototype);
var _default = Previewer;
exports["default"] = _default;