"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.breakInsideAvoidParentNode = breakInsideAvoidParentNode;
exports.child = child;
exports.cloneNode = cloneNode;
exports.displayedElementAfter = displayedElementAfter;
exports.displayedElementBefore = displayedElementBefore;
exports.elementAfter = elementAfter;
exports.elementBefore = elementBefore;
exports.filterTree = filterTree;
exports.findElement = findElement;
exports.findRef = findRef;
exports.hasContent = hasContent;
exports.hasTextContent = hasTextContent;
exports.indexOf = indexOf;
exports.indexOfTextNode = indexOfTextNode;
exports.isAllWhitespace = isAllWhitespace;
exports.isContainer = isContainer;
exports.isElement = isElement;
exports.isIgnorable = isIgnorable;
exports.isText = isText;
exports.isVisible = isVisible;
exports.letters = letters;
exports.needsBreakAfter = needsBreakAfter;
exports.needsBreakBefore = needsBreakBefore;
exports.needsPageBreak = needsPageBreak;
exports.needsPreviousBreakAfter = needsPreviousBreakAfter;
exports.nextSignificantNode = nextSignificantNode;
exports.nextValidNode = nextValidNode;
exports.nodeAfter = nodeAfter;
exports.nodeBefore = nodeBefore;
exports.parentOf = parentOf;
exports.prevValidNode = prevValidNode;
exports.previousSignificantNode = previousSignificantNode;
exports.rebuildAncestors = rebuildAncestors;
exports.stackChildren = stackChildren;
exports.validNode = validNode;
exports.walk = walk;
exports.words = words;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _marked = /*#__PURE__*/_regenerator["default"].mark(walk),
  _marked2 = /*#__PURE__*/_regenerator["default"].mark(words),
  _marked3 = /*#__PURE__*/_regenerator["default"].mark(letters);
function isElement(node) {
  return node && node.nodeType === 1;
}
function isText(node) {
  return node && node.nodeType === 3;
}
function walk(start, limiter) {
  var node;
  return _regenerator["default"].wrap(function walk$(_context) {
    while (1) switch (_context.prev = _context.next) {
      case 0:
        node = start;
      case 1:
        if (!node) {
          _context.next = 27;
          break;
        }
        _context.next = 4;
        return node;
      case 4:
        if (!node.childNodes.length) {
          _context.next = 8;
          break;
        }
        node = node.firstChild;
        _context.next = 25;
        break;
      case 8:
        if (!node.nextSibling) {
          _context.next = 15;
          break;
        }
        if (!(limiter && node === limiter)) {
          _context.next = 12;
          break;
        }
        node = undefined;
        return _context.abrupt("break", 27);
      case 12:
        node = node.nextSibling;
        _context.next = 25;
        break;
      case 15:
        if (!node) {
          _context.next = 25;
          break;
        }
        node = node.parentNode;
        if (!(limiter && node === limiter)) {
          _context.next = 20;
          break;
        }
        node = undefined;
        return _context.abrupt("break", 25);
      case 20:
        if (!(node && node.nextSibling)) {
          _context.next = 23;
          break;
        }
        node = node.nextSibling;
        return _context.abrupt("break", 25);
      case 23:
        _context.next = 15;
        break;
      case 25:
        _context.next = 1;
        break;
      case 27:
      case "end":
        return _context.stop();
    }
  }, _marked);
}
function nodeAfter(node, limiter) {
  if (limiter && node === limiter) {
    return;
  }
  var significantNode = nextSignificantNode(node);
  if (significantNode) {
    return significantNode;
  }
  if (node.parentNode) {
    while (node = node.parentNode) {
      if (limiter && node === limiter) {
        return;
      }
      significantNode = nextSignificantNode(node);
      if (significantNode) {
        return significantNode;
      }
    }
  }
}
function nodeBefore(node, limiter) {
  if (limiter && node === limiter) {
    return;
  }
  var significantNode = previousSignificantNode(node);
  if (significantNode) {
    return significantNode;
  }
  if (node.parentNode) {
    while (node = node.parentNode) {
      if (limiter && node === limiter) {
        return;
      }
      significantNode = previousSignificantNode(node);
      if (significantNode) {
        return significantNode;
      }
    }
  }
}
function elementAfter(node, limiter) {
  var after = nodeAfter(node, limiter);
  while (after && after.nodeType !== 1) {
    after = nodeAfter(after, limiter);
  }
  return after;
}
function elementBefore(node, limiter) {
  var before = nodeBefore(node, limiter);
  while (before && before.nodeType !== 1) {
    before = nodeBefore(before, limiter);
  }
  return before;
}
function displayedElementAfter(node, limiter) {
  var after = elementAfter(node, limiter);
  while (after && after.dataset.undisplayed) {
    after = elementAfter(after, limiter);
  }
  return after;
}
function displayedElementBefore(node, limiter) {
  var before = elementBefore(node, limiter);
  while (before && before.dataset.undisplayed) {
    before = elementBefore(before, limiter);
  }
  return before;
}
function stackChildren(currentNode, stacked) {
  var stack = stacked || [];
  stack.unshift(currentNode);
  var children = currentNode.children;
  for (var i = 0, length = children.length; i < length; i++) {
    stackChildren(children[i], stack);
  }
  return stack;
}
function rebuildAncestors(node) {
  var parent, ancestor;
  var ancestors = [];
  var added = [];
  var fragment = document.createDocumentFragment();

  // Handle rowspan on table
  if (node.nodeName === "TR") {
    var previousRow = node.previousElementSibling;
    var previousRowDistance = 1;
    while (previousRow) {
      // previous row has more columns, might indicate a rowspan.
      if (previousRow.childElementCount > node.childElementCount) {
        var initialColumns = Array.from(node.children);
        while (node.firstChild) {
          node.firstChild.remove();
        }
        var k = 0;
        for (var j = 0; j < previousRow.children.length; j++) {
          var column = previousRow.children[j];
          if (column.rowSpan && column.rowSpan > previousRowDistance) {
            var duplicatedColumn = column.cloneNode(true);
            // Adjust rowspan value
            duplicatedColumn.rowSpan = column.rowSpan - previousRowDistance;
            // Add the column to the row
            node.appendChild(duplicatedColumn);
          } else {
            // Fill the gap with the initial columns (if exists)
            var initialColumn = initialColumns[k++];
            // The initial column can be undefined if the newly created table has less columns than the original table
            if (initialColumn) {
              node.appendChild(initialColumn);
            }
          }
        }
      }
      previousRow = previousRow.previousElementSibling;
      previousRowDistance++;
    }
  }

  // Gather all ancestors
  var element = node;
  while (element.parentNode && element.parentNode.nodeType === 1) {
    ancestors.unshift(element.parentNode);
    element = element.parentNode;
  }
  for (var i = 0; i < ancestors.length; i++) {
    ancestor = ancestors[i];
    parent = ancestor.cloneNode(false);
    parent.setAttribute("data-split-from", parent.getAttribute("data-ref"));
    // ancestor.setAttribute("data-split-to", parent.getAttribute("data-ref"));

    if (parent.hasAttribute("id")) {
      var dataID = parent.getAttribute("id");
      parent.setAttribute("data-id", dataID);
      parent.removeAttribute("id");
    }

    // This is handled by css :not, but also tidied up here
    if (parent.hasAttribute("data-break-before")) {
      parent.removeAttribute("data-break-before");
    }
    if (parent.hasAttribute("data-previous-break-after")) {
      parent.removeAttribute("data-previous-break-after");
    }
    if (added.length) {
      var container = added[added.length - 1];
      container.appendChild(parent);
    } else {
      fragment.appendChild(parent);
    }
    added.push(parent);

    // rebuild table rows
    if (parent.nodeName === "TD" && ancestor.parentElement.contains(ancestor)) {
      var td = ancestor;
      var prev = parent;
      while (td = td.previousElementSibling) {
        var sib = td.cloneNode(false);
        parent.parentElement.insertBefore(sib, prev);
        prev = sib;
      }
    }
  }
  added = undefined;
  return fragment;
}
/*
export function split(bound, cutElement, breakAfter) {
		let needsRemoval = [];
		let index = indexOf(cutElement);

		if (!breakAfter && index === 0) {
			return;
		}

		if (breakAfter && index === (cutElement.parentNode.children.length - 1)) {
			return;
		}

		// Create a fragment with rebuilt ancestors
		let fragment = rebuildAncestors(cutElement);

		// Clone cut
		if (!breakAfter) {
			let clone = cutElement.cloneNode(true);
			let ref = cutElement.parentNode.getAttribute('data-ref');
			let parent = fragment.querySelector("[data-ref='" + ref + "']");
			parent.appendChild(clone);
			needsRemoval.push(cutElement);
		}

		// Remove all after cut
		let next = nodeAfter(cutElement, bound);
		while (next) {
			let clone = next.cloneNode(true);
			let ref = next.parentNode.getAttribute('data-ref');
			let parent = fragment.querySelector("[data-ref='" + ref + "']");
			parent.appendChild(clone);
			needsRemoval.push(next);
			next = nodeAfter(next, bound);
		}

		// Remove originals
		needsRemoval.forEach((node) => {
			if (node) {
				node.remove();
			}
		});

		// Insert after bounds
		bound.parentNode.insertBefore(fragment, bound.nextSibling);
		return [bound, bound.nextSibling];
}
*/

function needsBreakBefore(node) {
  if (typeof node !== "undefined" && typeof node.dataset !== "undefined" && typeof node.dataset.breakBefore !== "undefined" && (node.dataset.breakBefore === "always" || node.dataset.breakBefore === "page" || node.dataset.breakBefore === "left" || node.dataset.breakBefore === "right" || node.dataset.breakBefore === "recto" || node.dataset.breakBefore === "verso")) {
    return true;
  }
  return false;
}
function needsBreakAfter(node) {
  if (typeof node !== "undefined" && typeof node.dataset !== "undefined" && typeof node.dataset.breakAfter !== "undefined" && (node.dataset.breakAfter === "always" || node.dataset.breakAfter === "page" || node.dataset.breakAfter === "left" || node.dataset.breakAfter === "right" || node.dataset.breakAfter === "recto" || node.dataset.breakAfter === "verso")) {
    return true;
  }
  return false;
}
function needsPreviousBreakAfter(node) {
  if (typeof node !== "undefined" && typeof node.dataset !== "undefined" && typeof node.dataset.previousBreakAfter !== "undefined" && (node.dataset.previousBreakAfter === "always" || node.dataset.previousBreakAfter === "page" || node.dataset.previousBreakAfter === "left" || node.dataset.previousBreakAfter === "right" || node.dataset.previousBreakAfter === "recto" || node.dataset.previousBreakAfter === "verso")) {
    return true;
  }
  return false;
}
function needsPageBreak(node, previousSignificantNode) {
  if (typeof node === "undefined" || !previousSignificantNode || isIgnorable(node)) {
    return false;
  }
  if (node.dataset && node.dataset.undisplayed) {
    return false;
  }
  var previousSignificantNodePage = previousSignificantNode.dataset ? previousSignificantNode.dataset.page : undefined;
  if (typeof previousSignificantNodePage === "undefined") {
    var nodeWithNamedPage = getNodeWithNamedPage(previousSignificantNode);
    if (nodeWithNamedPage) {
      previousSignificantNodePage = nodeWithNamedPage.dataset.page;
    }
  }
  var currentNodePage = node.dataset ? node.dataset.page : undefined;
  if (typeof currentNodePage === "undefined") {
    var _nodeWithNamedPage = getNodeWithNamedPage(node, previousSignificantNode);
    if (_nodeWithNamedPage) {
      currentNodePage = _nodeWithNamedPage.dataset.page;
    }
  }
  return currentNodePage !== previousSignificantNodePage;
}
function words(node) {
  var currentText, max, currentOffset, currentLetter, range, significantWhitespaces;
  return _regenerator["default"].wrap(function words$(_context2) {
    while (1) switch (_context2.prev = _context2.next) {
      case 0:
        currentText = node.nodeValue;
        max = currentText.length;
        currentOffset = 0;
        significantWhitespaces = node.parentElement && node.parentElement.nodeName === "PRE";
      case 4:
        if (!(currentOffset < max)) {
          _context2.next = 18;
          break;
        }
        currentLetter = currentText[currentOffset];
        if (!(/^[\S\u202F\u00A0]$/.test(currentLetter) || significantWhitespaces)) {
          _context2.next = 10;
          break;
        }
        if (!range) {
          range = document.createRange();
          range.setStart(node, currentOffset);
        }
        _context2.next = 15;
        break;
      case 10:
        if (!range) {
          _context2.next = 15;
          break;
        }
        range.setEnd(node, currentOffset);
        _context2.next = 14;
        return range;
      case 14:
        range = undefined;
      case 15:
        currentOffset += 1;
        _context2.next = 4;
        break;
      case 18:
        if (!range) {
          _context2.next = 22;
          break;
        }
        range.setEnd(node, currentOffset);
        _context2.next = 22;
        return range;
      case 22:
      case "end":
        return _context2.stop();
    }
  }, _marked2);
}
function letters(wordRange) {
  var currentText, max, currentOffset, range;
  return _regenerator["default"].wrap(function letters$(_context3) {
    while (1) switch (_context3.prev = _context3.next) {
      case 0:
        currentText = wordRange.startContainer;
        max = currentText.length;
        currentOffset = wordRange.startOffset; // let currentLetter;
      case 3:
        if (!(currentOffset < max)) {
          _context3.next = 12;
          break;
        }
        // currentLetter = currentText[currentOffset];
        range = document.createRange();
        range.setStart(currentText, currentOffset);
        range.setEnd(currentText, currentOffset + 1);
        _context3.next = 9;
        return range;
      case 9:
        currentOffset += 1;
        _context3.next = 3;
        break;
      case 12:
      case "end":
        return _context3.stop();
    }
  }, _marked3);
}
function isContainer(node) {
  var container;
  if (typeof node.tagName === "undefined") {
    return true;
  }
  if (node.style && node.style.display === "none") {
    return false;
  }
  switch (node.tagName) {
    // Inline
    case "A":
    case "ABBR":
    case "ACRONYM":
    case "B":
    case "BDO":
    case "BIG":
    case "BR":
    case "BUTTON":
    case "CITE":
    case "CODE":
    case "DFN":
    case "EM":
    case "I":
    case "IMG":
    case "INPUT":
    case "KBD":
    case "LABEL":
    case "MAP":
    case "OBJECT":
    case "Q":
    case "SAMP":
    case "SCRIPT":
    case "SELECT":
    case "SMALL":
    case "SPAN":
    case "STRONG":
    case "SUB":
    case "SUP":
    case "TEXTAREA":
    case "TIME":
    case "TT":
    case "VAR":
    case "P":
    case "H1":
    case "H2":
    case "H3":
    case "H4":
    case "H5":
    case "H6":
    case "FIGCAPTION":
    case "BLOCKQUOTE":
    case "PRE":
    case "LI":
    case "TD":
    case "DT":
    case "DD":
    case "VIDEO":
    case "CANVAS":
      container = false;
      break;
    default:
      container = true;
  }
  return container;
}
function cloneNode(n) {
  var deep = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  return n.cloneNode(deep);
}
function findElement(node, doc, forceQuery) {
  var ref = node.getAttribute("data-ref");
  return findRef(ref, doc, forceQuery);
}
function findRef(ref, doc, forceQuery) {
  if (!forceQuery && doc.indexOfRefs && doc.indexOfRefs[ref]) {
    return doc.indexOfRefs[ref];
  } else {
    return doc.querySelector("[data-ref='".concat(ref, "']"));
  }
}
function validNode(node) {
  if (isText(node)) {
    return true;
  }
  if (isElement(node) && node.dataset.ref) {
    return true;
  }
  return false;
}
function prevValidNode(node) {
  while (!validNode(node)) {
    if (node.previousSibling) {
      node = node.previousSibling;
    } else {
      node = node.parentNode;
    }
    if (!node) {
      break;
    }
  }
  return node;
}
function nextValidNode(node) {
  while (!validNode(node)) {
    if (node.nextSibling) {
      node = node.nextSibling;
    } else {
      node = node.parentNode.nextSibling;
    }
    if (!node) {
      break;
    }
  }
  return node;
}
function indexOf(node) {
  var parent = node.parentNode;
  if (!parent) {
    return 0;
  }
  return Array.prototype.indexOf.call(parent.childNodes, node);
}
function child(node, index) {
  return node.childNodes[index];
}
function isVisible(node) {
  if (isElement(node) && window.getComputedStyle(node).display !== "none") {
    return true;
  } else if (isText(node) && hasTextContent(node) && window.getComputedStyle(node.parentNode).display !== "none") {
    return true;
  }
  return false;
}
function hasContent(node) {
  if (isElement(node)) {
    return true;
  } else if (isText(node) && node.textContent.trim().length) {
    return true;
  }
  return false;
}
function hasTextContent(node) {
  if (isElement(node)) {
    var _child;
    for (var i = 0; i < node.childNodes.length; i++) {
      _child = node.childNodes[i];
      if (_child && isText(_child) && _child.textContent.trim().length) {
        return true;
      }
    }
  } else if (isText(node) && node.textContent.trim().length) {
    return true;
  }
  return false;
}
function indexOfTextNode(node, parent) {
  if (!isText(node)) {
    return -1;
  }
  var nodeTextContent = node.textContent;
  var child;
  var index = -1;
  for (var i = 0; i < parent.childNodes.length; i++) {
    child = parent.childNodes[i];
    if (child.nodeType === 3) {
      var text = parent.childNodes[i].textContent;
      if (text.includes(nodeTextContent)) {
        index = i;
        break;
      }
    }
  }
  return index;
}

/**
 * Throughout, whitespace is defined as one of the characters
 *  "\t" TAB \u0009
 *  "\n" LF  \u000A
 *  "\r" CR  \u000D
 *  " "  SPC \u0020
 *
 * This does not use Javascript's "\s" because that includes non-breaking
 * spaces (and also some other characters).
 */

/**
 * Determine if a node should be ignored by the iterator functions.
 * taken from https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Whitespace#Whitespace_helper_functions
 *
 * @param {Node} node An object implementing the DOM1 |Node| interface.
 * @return {boolean} true if the node is:
 *  1) A |Text| node that is all whitespace
 *  2) A |Comment| node
 *  and otherwise false.
 */
function isIgnorable(node) {
  return node.nodeType === 8 ||
  // A comment node
  node.nodeType === 3 && isAllWhitespace(node); // a text node, all whitespace
}

/**
 * Determine whether a node's text content is entirely whitespace.
 *
 * @param {Node} node  A node implementing the |CharacterData| interface (i.e., a |Text|, |Comment|, or |CDATASection| node
 * @return {boolean} true if all of the text content of |nod| is whitespace, otherwise false.
 */
function isAllWhitespace(node) {
  return !/[^\t\n\r ]/.test(node.textContent);
}

/**
 * Version of |previousSibling| that skips nodes that are entirely
 * whitespace or comments.  (Normally |previousSibling| is a property
 * of all DOM nodes that gives the sibling node, the node that is
 * a child of the same parent, that occurs immediately before the
 * reference node.)
 *
 * @param {ChildNode} sib  The reference node.
 * @return {Node|null} Either:
 *  1) The closest previous sibling to |sib| that is not ignorable according to |is_ignorable|, or
 *  2) null if no such node exists.
 */
function previousSignificantNode(sib) {
  while (sib = sib.previousSibling) {
    if (!isIgnorable(sib)) return sib;
  }
  return null;
}
function getNodeWithNamedPage(node, limiter) {
  if (node && node.dataset && node.dataset.page) {
    return node;
  }
  if (node.parentNode) {
    while (node = node.parentNode) {
      if (limiter && node === limiter) {
        return;
      }
      if (node.dataset && node.dataset.page) {
        return node;
      }
    }
  }
  return null;
}
function breakInsideAvoidParentNode(node) {
  while (node = node.parentNode) {
    if (node && node.dataset && node.dataset.breakInside === "avoid") {
      return node;
    }
  }
  return null;
}

/**
 * Find a parent with a given node name.
 * @param {Node} node - initial Node
 * @param {string} nodeName - node name (eg. "TD", "TABLE", "STRONG"...)
 * @param {Node} limiter - go up to the parent until there's no more parent or the current node is equals to the limiter
 * @returns {Node|undefined} - Either:
 *  1) The closest parent for a the given node name, or
 *  2) undefined if no such node exists.
 */
function parentOf(node, nodeName, limiter) {
  if (limiter && node === limiter) {
    return;
  }
  if (node.parentNode) {
    while (node = node.parentNode) {
      if (limiter && node === limiter) {
        return;
      }
      if (node.nodeName === nodeName) {
        return node;
      }
    }
  }
}

/**
 * Version of |nextSibling| that skips nodes that are entirely
 * whitespace or comments.
 *
 * @param {ChildNode} sib  The reference node.
 * @return {Node|null} Either:
 *  1) The closest next sibling to |sib| that is not ignorable according to |is_ignorable|, or
 *  2) null if no such node exists.
 */
function nextSignificantNode(sib) {
  while (sib = sib.nextSibling) {
    if (!isIgnorable(sib)) return sib;
  }
  return null;
}
function filterTree(content, func, what) {
  var treeWalker = document.createTreeWalker(content || this.dom, what || NodeFilter.SHOW_ALL, func ? {
    acceptNode: func
  } : null, false);
  var node;
  var current;
  node = treeWalker.nextNode();
  while (node) {
    current = node;
    node = treeWalker.nextNode();
    current.parentNode.removeChild(current);
  }
}