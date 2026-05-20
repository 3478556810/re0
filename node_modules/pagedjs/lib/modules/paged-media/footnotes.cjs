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
var _dom = require("../../utils/dom.cjs");
var _layout = _interopRequireDefault(require("../../chunker/layout.cjs"));
var _cssTree = _interopRequireDefault(require("css-tree"));
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var Footnotes = /*#__PURE__*/function (_Handler) {
  (0, _inherits2["default"])(Footnotes, _Handler);
  var _super = _createSuper(Footnotes);
  function Footnotes(chunker, polisher, caller) {
    var _this;
    (0, _classCallCheck2["default"])(this, Footnotes);
    _this = _super.call(this, chunker, polisher, caller);
    _this.footnotes = {};
    _this.needsLayout = [];
    return _this;
  }
  (0, _createClass2["default"])(Footnotes, [{
    key: "onDeclaration",
    value: function onDeclaration(declaration, dItem, dList, rule) {
      var property = declaration.property;
      if (property === "float") {
        var identifier = declaration.value.children && declaration.value.children.first();
        var location = identifier && identifier.name;
        if (location === "footnote") {
          var selector = _cssTree["default"].generate(rule.ruleNode.prelude);
          this.footnotes[selector] = {
            selector: selector,
            policy: "auto",
            display: "block"
          };
          dList.remove(dItem);
        }
      }
      if (property === "footnote-policy") {
        var _identifier = declaration.value.children && declaration.value.children.first();
        var policy = _identifier && _identifier.name;
        if (policy) {
          var _selector = _cssTree["default"].generate(rule.ruleNode.prelude);
          var note = this.footnotes[_selector];
          if (note) {
            note.policy = policy;
          }
        }
      }
      if (property === "footnote-display") {
        var _identifier2 = declaration.value.children && declaration.value.children.first();
        var display = _identifier2 && _identifier2.name;
        var _selector2 = _cssTree["default"].generate(rule.ruleNode.prelude);
        if (display && this.footnotes[_selector2]) {
          var _note = this.footnotes[_selector2];
          if (_note) {
            _note.display = display;
          }
        }
      }
    }
  }, {
    key: "onPseudoSelector",
    value: function onPseudoSelector(pseudoNode, pItem, pList, selector, rule) {
      var name = pseudoNode.name;
      if (name === "footnote-marker") {
        // switch ::footnote-marker to [data-footnote-marker]::before
        var prelude = rule.ruleNode.prelude;
        var newPrelude = new _cssTree["default"].List();

        // Can't get remove to work, so just copying everything else
        prelude.children.first().children.each(function (node) {
          if (node.type !== "PseudoElementSelector") {
            newPrelude.appendData(node);
          }
        });

        // Add our data call
        newPrelude.appendData({
          type: "AttributeSelector",
          name: {
            type: "Identifier",
            name: "data-footnote-marker"
          },
          flags: null,
          loc: null,
          matcher: null,
          value: null
        });

        // Add new pseudo element
        newPrelude.appendData({
          type: "PseudoElementSelector",
          name: "marker",
          loc: null,
          children: null
        });
        prelude.children.first().children = newPrelude;
      }
      if (name === "footnote-call") {
        // switch ::footnote-call to [data-footnote-call]::after

        var _prelude = rule.ruleNode.prelude;
        var _newPrelude = new _cssTree["default"].List();

        // Can't get remove to work, so just copying everything else
        _prelude.children.first().children.each(function (node) {
          if (node.type !== "PseudoElementSelector") {
            _newPrelude.appendData(node);
          }
        });

        // Add our data call
        _newPrelude.appendData({
          type: "AttributeSelector",
          name: {
            type: "Identifier",
            name: "data-footnote-call"
          },
          flags: null,
          loc: null,
          matcher: null,
          value: null
        });

        // Add new pseudo element
        _newPrelude.appendData({
          type: "PseudoElementSelector",
          name: "after",
          loc: null,
          children: null
        });
        _prelude.children.first().children = _newPrelude;
      }
    }
  }, {
    key: "afterParsed",
    value: function afterParsed(parsed) {
      this.processFootnotes(parsed, this.footnotes);
    }
  }, {
    key: "processFootnotes",
    value: function processFootnotes(parsed, notes) {
      for (var n in notes) {
        // Find elements
        var elements = parsed.querySelectorAll(n);
        var element = void 0;
        var note = notes[n];
        for (var i = 0; i < elements.length; i++) {
          element = elements[i];
          // Add note type
          element.setAttribute("data-note", "footnote");
          element.setAttribute("data-break-before", "avoid");
          element.setAttribute("data-note-policy", note.policy || "auto");
          element.setAttribute("data-note-display", note.display || "block");
          // Mark all parents
          this.processFootnoteContainer(element);
        }
      }
    }
  }, {
    key: "processFootnoteContainer",
    value: function processFootnoteContainer(node) {
      // Find the container
      var element = node.parentElement;
      var prevElement = element;
      // Walk up the dom until we find a container element
      while (element) {
        if ((0, _dom.isContainer)(element)) {
          // Add flag to the previous non-container element that will render with children
          prevElement.setAttribute("data-has-notes", "true");
          break;
        }
        prevElement = element;
        element = element.parentElement;

        // If no containers were found and there are no further parents flag the last element
        if (!element) {
          prevElement.setAttribute("data-has-notes", "true");
        }
      }
    }
  }, {
    key: "renderNode",
    value: function renderNode(node) {
      if (node.nodeType == 1) {
        // Get all notes
        var notes;

        // Ingnore html element nodes, like mathml
        if (!node.dataset) {
          return;
        }
        if (node.dataset.note === "footnote") {
          notes = [node];
        } else if (node.dataset.hasNotes || node.querySelectorAll("[data-note='footnote']")) {
          notes = node.querySelectorAll("[data-note='footnote']");
        }
        if (notes && notes.length) {
          this.findVisibleFootnotes(notes, node);
        }
      }
    }
  }, {
    key: "findVisibleFootnotes",
    value: function findVisibleFootnotes(notes, node) {
      var area, size, right;
      area = node.closest(".pagedjs_page_content");
      size = area.getBoundingClientRect();
      right = size.left + size.width;
      for (var i = 0; i < notes.length; ++i) {
        var currentNote = notes[i];
        var bounds = currentNote.getBoundingClientRect();
        var left = bounds.left;
        if (left < right) {
          // Add call for the note
          this.moveFootnote(currentNote, node.closest(".pagedjs_area"), true);
        }
      }
    }
  }, {
    key: "moveFootnote",
    value: function moveFootnote(node, pageArea, needsNoteCall) {
      // let pageArea = node.closest(".pagedjs_area");
      var noteArea = pageArea.querySelector(".pagedjs_footnote_area");
      var noteContent = noteArea.querySelector(".pagedjs_footnote_content");
      var noteInnerContent = noteContent.querySelector(".pagedjs_footnote_inner_content");
      if (!(0, _dom.isElement)(node)) {
        return;
      }

      // Add call for the note
      var noteCall;
      if (needsNoteCall) {
        noteCall = this.createFootnoteCall(node);
      }

      // Remove the break before attribute for future layout
      node.removeAttribute("data-break-before");

      // Check if note already exists for overflow
      var existing = noteInnerContent.querySelector("[data-ref=\"".concat(node.dataset.ref, "\"]"));
      if (existing) {
        // Remove the note from the flow but no need to render it again
        node.remove();
        return;
      }

      // Add the note node
      noteInnerContent.appendChild(node);

      // Remove empty class
      if (noteContent.classList.contains("pagedjs_footnote_empty")) {
        noteContent.classList.remove("pagedjs_footnote_empty");
      }

      // Add marker
      node.dataset.footnoteMarker = node.dataset.ref;

      // Add Id
      node.id = "note-".concat(node.dataset.ref);

      // Get note content size
      var height = noteContent.scrollHeight;

      // Check the noteCall is still on screen
      var area = pageArea.querySelector(".pagedjs_page_content");
      var size = area.getBoundingClientRect();
      var right = size.left + size.width;

      // TODO: add a max height in CSS

      // Check element sizes
      var noteCallBounds = noteCall && noteCall.getBoundingClientRect();
      var noteAreaBounds = noteArea.getBoundingClientRect();

      // Get the @footnote margins
      var noteContentMargins = this.marginsHeight(noteContent);
      var noteContentPadding = this.paddingHeight(noteContent);
      var noteContentBorders = this.borderHeight(noteContent);
      var total = noteContentMargins + noteContentPadding + noteContentBorders;

      // Get the top of the @footnote area
      var notAreaTop = Math.floor(noteAreaBounds.top);
      // If the height isn't set yet, remove the margins from the top
      if (noteAreaBounds.height === 0) {
        notAreaTop -= this.marginsHeight(noteContent, false);
        notAreaTop -= this.paddingHeight(noteContent, false);
        notAreaTop -= this.borderHeight(noteContent, false);
      }
      // Determine the note call position and offset per policy
      var notePolicy = node.dataset.notePolicy;
      var noteCallPosition = 0;
      var noteCallOffset = 0;
      if (noteCall) {
        // Get the correct line bottom for super or sub styled callouts
        var prevSibling = noteCall.previousSibling;
        var range = new Range();
        if (prevSibling) {
          range.setStartBefore(prevSibling);
        } else {
          range.setStartBefore(noteCall);
        }
        range.setEndAfter(noteCall);
        var rangeBounds = range.getBoundingClientRect();
        noteCallPosition = rangeBounds.bottom;
        if (!notePolicy || notePolicy === "auto") {
          noteCallOffset = Math.ceil(rangeBounds.bottom);
        } else if (notePolicy === "line") {
          noteCallOffset = Math.ceil(rangeBounds.top);
        } else if (notePolicy === "block") {
          // Check that there is a previous element on the page
          var parentParagraph = noteCall.closest("p").previousElementSibling;
          if (parentParagraph) {
            noteCallOffset = Math.ceil(parentParagraph.getBoundingClientRect().bottom);
          } else {
            noteCallOffset = Math.ceil(rangeBounds.bottom);
          }
        }
      }
      var contentDelta = height + total - noteAreaBounds.height;
      // Space between the top of the footnotes area and the bottom of the footnote call
      var noteDelta = noteCallPosition ? notAreaTop - noteCallPosition : 0;
      // Space needed for the force a break for the policy of the footnote
      var notePolicyDelta = noteCallPosition ? Math.floor(noteAreaBounds.top) - noteCallOffset : 0;
      var hasNotes = noteArea.querySelector("[data-note='footnote']");
      if (needsNoteCall && noteCallBounds.left > right) {
        // Note is offscreen and will be chunked to the next page on overflow
        node.remove();
      } else if (!hasNotes && needsNoteCall && total > noteDelta) {
        // No space to add even the footnote area
        pageArea.style.setProperty("--pagedjs-footnotes-height", "0px");
        // Add a wrapper as this div is removed later
        var wrapperDiv = document.createElement("div");
        wrapperDiv.appendChild(node);
        // Push to the layout queue for the next page
        this.needsLayout.push(wrapperDiv);
      } else if (!needsNoteCall) {
        // Call was previously added, force adding footnote
        pageArea.style.setProperty("--pagedjs-footnotes-height", "".concat(height + total, "px"));
      } else if (noteCallPosition < noteAreaBounds.top - contentDelta) {
        // the current note content will fit without pushing the call to the next page
        pageArea.style.setProperty("--pagedjs-footnotes-height", "".concat(height + noteContentMargins + noteContentBorders, "px"));
      } else {
        // set height to just before note call
        pageArea.style.setProperty("--pagedjs-footnotes-height", "".concat(noteAreaBounds.height + notePolicyDelta, "px"));
        noteInnerContent.style.height = noteAreaBounds.height + notePolicyDelta - total + "px";
      }
    }
  }, {
    key: "createFootnoteCall",
    value: function createFootnoteCall(node) {
      var parentElement = node.parentElement;
      var footnoteCall = document.createElement("a");
      var _iterator = _createForOfIteratorHelper(node.classList),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var className = _step.value;
          footnoteCall.classList.add("".concat(className));
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      footnoteCall.dataset.footnoteCall = node.dataset.ref;
      footnoteCall.dataset.ref = node.dataset.ref;

      // Increment for counters
      footnoteCall.dataset.dataCounterFootnoteIncrement = 1;

      // Add link
      footnoteCall.href = "#note-".concat(node.dataset.ref);
      parentElement.insertBefore(footnoteCall, node);
      return footnoteCall;
    }
  }, {
    key: "afterPageLayout",
    value: function afterPageLayout(pageElement, page, breakToken, chunker) {
      var pageArea = pageElement.querySelector(".pagedjs_area");
      var noteArea = page.footnotesArea;
      var noteContent = noteArea.querySelector(".pagedjs_footnote_content");
      var noteInnerContent = noteArea.querySelector(".pagedjs_footnote_inner_content");
      var noteContentBounds = noteContent.getBoundingClientRect();
      var width = noteContentBounds.width;
      noteInnerContent.style.columnWidth = Math.round(width) + "px";
      noteInnerContent.style.columnGap = "calc(var(--pagedjs-margin-right) + var(--pagedjs-margin-left))";

      // Get overflow
      var layout = new _layout["default"](noteArea, undefined, chunker.settings);
      var overflow = layout.findOverflow(noteInnerContent, noteContentBounds);
      if (overflow) {
        var startContainer = overflow.startContainer,
          startOffset = overflow.startOffset;
        var startIsNode;
        if ((0, _dom.isElement)(startContainer)) {
          var start = startContainer.childNodes[startOffset];
          startIsNode = (0, _dom.isElement)(start) && start.hasAttribute("data-footnote-marker");
        }
        var extracted = overflow.extractContents();
        if (!startIsNode) {
          var splitChild = extracted.firstElementChild;
          splitChild.dataset.splitFrom = splitChild.dataset.ref;
          this.handleAlignment(noteInnerContent.lastElementChild);
        }
        this.needsLayout.push(extracted);
        noteContent.style.removeProperty("height");
        noteInnerContent.style.removeProperty("height");
        var noteInnerContentBounds = noteInnerContent.getBoundingClientRect();
        var height = noteInnerContentBounds.height;

        // Get the @footnote margins
        var noteContentMargins = this.marginsHeight(noteContent);
        var noteContentPadding = this.paddingHeight(noteContent);
        var noteContentBorders = this.borderHeight(noteContent);
        pageArea.style.setProperty("--pagedjs-footnotes-height", "".concat(height + noteContentMargins + noteContentBorders + noteContentPadding, "px"));

        // Hide footnote content if empty
        if (noteInnerContent.childNodes.length === 0) {
          noteContent.classList.add("pagedjs_footnote_empty");
        }
        if (!breakToken) {
          chunker.clonePage(page);
        } else {
          var breakBefore, previousBreakAfter;
          if (breakToken.node && typeof breakToken.node.dataset !== "undefined" && typeof breakToken.node.dataset.previousBreakAfter !== "undefined") {
            previousBreakAfter = breakToken.node.dataset.previousBreakAfter;
          }
          if (breakToken.node && typeof breakToken.node.dataset !== "undefined" && typeof breakToken.node.dataset.breakBefore !== "undefined") {
            breakBefore = breakToken.node.dataset.breakBefore;
          }
          if (breakBefore || previousBreakAfter) {
            chunker.clonePage(page);
          }
        }
      }
      noteInnerContent.style.height = "auto";
    }
  }, {
    key: "handleAlignment",
    value: function handleAlignment(node) {
      var styles = window.getComputedStyle(node);
      var alignLast = styles["text-align-last"];
      node.dataset.lastSplitElement = "true";
      if (alignLast === "auto") {
        node.dataset.alignLastSplitElement = "justify";
      } else {
        node.dataset.alignLastSplitElement = alignLast;
      }
    }
  }, {
    key: "beforePageLayout",
    value: function beforePageLayout(page) {
      var _this2 = this;
      while (this.needsLayout.length) {
        var fragment = this.needsLayout.shift();
        Array.from(fragment.childNodes).forEach(function (node) {
          _this2.moveFootnote(node, page.element.querySelector(".pagedjs_area"), false);
        });
      }
    }
  }, {
    key: "afterOverflowRemoved",
    value: function afterOverflowRemoved(removed, rendered) {
      // Find the page area
      var area = rendered.closest(".pagedjs_area");
      // Get any rendered footnotes
      var notes = area.querySelectorAll(".pagedjs_footnote_area [data-note='footnote']");
      for (var n = 0; n < notes.length; n++) {
        var note = notes[n];
        // Check if the call for that footnote has been removed with the overflow
        var call = removed.querySelector("[data-footnote-call=\"".concat(note.dataset.ref, "\"]"));
        if (call) {
          note.remove();
        }
      }
      // Hide footnote content if empty
      var noteInnerContent = area.querySelector(".pagedjs_footnote_inner_content");
      if (noteInnerContent && noteInnerContent.childNodes.length === 0) {
        noteInnerContent.parentElement.classList.add("pagedjs_footnote_empty");
      }
    }
  }, {
    key: "marginsHeight",
    value: function marginsHeight(element) {
      var total = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var styles = window.getComputedStyle(element);
      var marginTop = parseInt(styles.marginTop);
      var marginBottom = parseInt(styles.marginBottom);
      var margin = 0;
      if (marginTop) {
        margin += marginTop;
      }
      if (marginBottom && total) {
        margin += marginBottom;
      }
      return margin;
    }
  }, {
    key: "paddingHeight",
    value: function paddingHeight(element) {
      var total = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var styles = window.getComputedStyle(element);
      var paddingTop = parseInt(styles.paddingTop);
      var paddingBottom = parseInt(styles.paddingBottom);
      var padding = 0;
      if (paddingTop) {
        padding += paddingTop;
      }
      if (paddingBottom && total) {
        padding += paddingBottom;
      }
      return padding;
    }
  }, {
    key: "borderHeight",
    value: function borderHeight(element) {
      var total = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var styles = window.getComputedStyle(element);
      var borderTop = parseInt(styles.borderTop);
      var borderBottom = parseInt(styles.borderBottom);
      var borders = 0;
      if (borderTop) {
        borders += borderTop;
      }
      if (borderBottom && total) {
        borders += borderBottom;
      }
      return borders;
    }
  }]);
  return Footnotes;
}(_handler["default"]);
var _default = Footnotes;
exports["default"] = _default;