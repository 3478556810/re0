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
var _sizes = _interopRequireDefault(require("../../polisher/sizes.cjs"));
var _dom = require("../../utils/dom.cjs");
var _utils = require("../../utils/utils.cjs");
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var AtPage = /*#__PURE__*/function (_Handler) {
  (0, _inherits2["default"])(AtPage, _Handler);
  var _super = _createSuper(AtPage);
  function AtPage(chunker, polisher, caller) {
    var _this;
    (0, _classCallCheck2["default"])(this, AtPage);
    _this = _super.call(this, chunker, polisher, caller);
    _this.pages = {};
    _this.width = undefined;
    _this.height = undefined;
    _this.orientation = undefined;
    _this.marginalia = {};
    return _this;
  }
  (0, _createClass2["default"])(AtPage, [{
    key: "pageModel",
    value: function pageModel(selector) {
      return {
        selector: selector,
        name: undefined,
        psuedo: undefined,
        nth: undefined,
        marginalia: {},
        width: undefined,
        height: undefined,
        orientation: undefined,
        margin: {
          top: {},
          right: {},
          left: {},
          bottom: {}
        },
        padding: {
          top: {},
          right: {},
          left: {},
          bottom: {}
        },
        border: {
          top: {},
          right: {},
          left: {},
          bottom: {}
        },
        backgroundOrigin: undefined,
        block: {},
        marks: undefined,
        notes: undefined,
        added: false
      };
    }

    // Find and Remove @page rules
  }, {
    key: "onAtPage",
    value: function onAtPage(node, item, list) {
      var page, marginalia;
      var selector = "";
      var named, psuedo, nth;
      var needsMerge = false;
      if (node.prelude) {
        named = this.getTypeSelector(node);
        psuedo = this.getPsuedoSelector(node);
        nth = this.getNthSelector(node);
        selector = _cssTree["default"].generate(node.prelude);
      } else {
        selector = "*";
      }
      if (selector in this.pages) {
        // this.pages[selector] = Object.assign(this.pages[selector], page);
        // console.log("after", selector, this.pages[selector]);

        // this.pages[selector].added = false;
        page = this.pages[selector];
        marginalia = this.replaceMarginalia(node);
        needsMerge = true;
        // Mark page for getting classes added again
        page.added = false;
      } else {
        page = this.pageModel(selector);
        marginalia = this.replaceMarginalia(node);
        this.pages[selector] = page;
      }
      page.name = named;
      page.psuedo = psuedo;
      page.nth = nth;
      if (needsMerge) {
        page.marginalia = Object.assign(page.marginalia, marginalia);
      } else {
        page.marginalia = marginalia;
      }
      var notes = this.replaceNotes(node);
      page.notes = notes;
      var declarations = this.replaceDeclarations(node);
      if (declarations.size) {
        page.size = declarations.size;
        page.width = declarations.size.width;
        page.height = declarations.size.height;
        page.orientation = declarations.size.orientation;
        page.format = declarations.size.format;
      }
      if (declarations.bleed && declarations.bleed[0] != "auto") {
        switch (declarations.bleed.length) {
          case 4:
            // top right bottom left
            page.bleed = {
              top: declarations.bleed[0],
              right: declarations.bleed[1],
              bottom: declarations.bleed[2],
              left: declarations.bleed[3]
            };
            break;
          case 3:
            // top right bottom right
            page.bleed = {
              top: declarations.bleed[0],
              right: declarations.bleed[1],
              bottom: declarations.bleed[2],
              left: declarations.bleed[1]
            };
            break;
          case 2:
            // top right top right
            page.bleed = {
              top: declarations.bleed[0],
              right: declarations.bleed[1],
              bottom: declarations.bleed[0],
              left: declarations.bleed[1]
            };
            break;
          default:
            page.bleed = {
              top: declarations.bleed[0],
              right: declarations.bleed[0],
              bottom: declarations.bleed[0],
              left: declarations.bleed[0]
            };
        }
      }
      if (declarations.marks) {
        if (!declarations.bleed || declarations.bleed && declarations.bleed[0] === "auto") {
          // Spec say 6pt, but needs more space for marks
          page.bleed = {
            top: {
              value: 6,
              unit: "mm"
            },
            right: {
              value: 6,
              unit: "mm"
            },
            bottom: {
              value: 6,
              unit: "mm"
            },
            left: {
              value: 6,
              unit: "mm"
            }
          };
        }
        page.marks = declarations.marks;
      }
      if (declarations.margin) {
        page.margin = declarations.margin;
      }
      if (declarations.padding) {
        page.padding = declarations.padding;
      }
      if (declarations.border) {
        page.border = declarations.border;
      }
      if (declarations.marks) {
        page.marks = declarations.marks;
      }
      if (needsMerge) {
        page.block.children.appendList(node.block.children);
      } else {
        page.block = node.block;
      }

      // Remove the rule
      list.remove(item);
    }

    /* Handled in breaks */
    /*
    afterParsed(parsed) {
    	for (let b in this.named) {
    		// Find elements
    		let elements = parsed.querySelectorAll(b);
    		// Add break data
    		for (var i = 0; i < elements.length; i++) {
    			elements[i].setAttribute("data-page", this.named[b]);
    		}
    	}
    }
    */
  }, {
    key: "afterTreeWalk",
    value: function afterTreeWalk(ast, sheet) {
      var dirtyPage = "*" in this.pages && this.pages["*"].added === false;
      this.addPageClasses(this.pages, ast, sheet);
      if (dirtyPage) {
        var width = this.pages["*"].width;
        var height = this.pages["*"].height;
        var format = this.pages["*"].format;
        var orientation = this.pages["*"].orientation;
        var bleed = this.pages["*"].bleed;
        var marks = this.pages["*"].marks;
        var bleedverso = undefined;
        var bleedrecto = undefined;
        if (":left" in this.pages) {
          bleedverso = this.pages[":left"].bleed;
        }
        if (":right" in this.pages) {
          bleedrecto = this.pages[":right"].bleed;
        }
        if (width && height && (this.width !== width || this.height !== height)) {
          this.width = width;
          this.height = height;
          this.format = format;
          this.orientation = orientation;
          this.addRootVars(ast, width, height, orientation, bleed, bleedrecto, bleedverso, marks);
          this.addRootPage(ast, this.pages["*"].size, bleed, bleedrecto, bleedverso);
          this.emit("size", {
            width: width,
            height: height,
            orientation: orientation,
            format: format,
            bleed: bleed
          });
          this.emit("atpages", this.pages);
        }
      }
    }
  }, {
    key: "getTypeSelector",
    value: function getTypeSelector(ast) {
      // Find page name
      var name;
      _cssTree["default"].walk(ast, {
        visit: "TypeSelector",
        enter: function enter(node, item, list) {
          name = node.name;
        }
      });
      return name;
    }
  }, {
    key: "getPsuedoSelector",
    value: function getPsuedoSelector(ast) {
      // Find if it has :left & :right & :black & :first
      var name;
      _cssTree["default"].walk(ast, {
        visit: "PseudoClassSelector",
        enter: function enter(node, item, list) {
          if (node.name !== "nth") {
            name = node.name;
          }
        }
      });
      return name;
    }
  }, {
    key: "getNthSelector",
    value: function getNthSelector(ast) {
      // Find if it has :nth
      var nth;
      _cssTree["default"].walk(ast, {
        visit: "PseudoClassSelector",
        enter: function enter(node, item, list) {
          if (node.name === "nth" && node.children) {
            var raw = node.children.first();
            nth = raw.value;
          }
        }
      });
      return nth;
    }
  }, {
    key: "replaceMarginalia",
    value: function replaceMarginalia(ast) {
      var parsed = {};
      var MARGINS = ["top-left-corner", "top-left", "top", "top-center", "top-right", "top-right-corner", "bottom-left-corner", "bottom-left", "bottom", "bottom-center", "bottom-right", "bottom-right-corner", "left-top", "left-middle", "left", "left-bottom", "top-right-corner", "right-top", "right-middle", "right", "right-bottom", "right-right-corner"];
      _cssTree["default"].walk(ast.block, {
        visit: "Atrule",
        enter: function enter(node, item, list) {
          var name = node.name;
          if (MARGINS.includes(name)) {
            if (name === "top") {
              name = "top-center";
            }
            if (name === "right") {
              name = "right-middle";
            }
            if (name === "left") {
              name = "left-middle";
            }
            if (name === "bottom") {
              name = "bottom-center";
            }
            parsed[name] = node.block;
            list.remove(item);
          }
        }
      });
      return parsed;
    }
  }, {
    key: "replaceNotes",
    value: function replaceNotes(ast) {
      var parsed = {};
      _cssTree["default"].walk(ast.block, {
        visit: "Atrule",
        enter: function enter(node, item, list) {
          var name = node.name;
          if (name === "footnote") {
            parsed[name] = node.block;
            list.remove(item);
          }
        }
      });
      return parsed;
    }
  }, {
    key: "replaceDeclarations",
    value: function replaceDeclarations(ast) {
      var _this2 = this;
      var parsed = {};
      _cssTree["default"].walk(ast.block, {
        visit: "Declaration",
        enter: function enter(declaration, dItem, dList) {
          var prop = _cssTree["default"].property(declaration.property).name;
          // let value = declaration.value;

          if (prop === "marks") {
            parsed.marks = [];
            _cssTree["default"].walk(declaration, {
              visit: "Identifier",
              enter: function enter(ident) {
                parsed.marks.push(ident.name);
              }
            });
            dList.remove(dItem);
          } else if (prop === "margin") {
            parsed.margin = _this2.getMargins(declaration);
            dList.remove(dItem);
          } else if (prop.indexOf("margin-") === 0) {
            var m = prop.substring("margin-".length);
            if (!parsed.margin) {
              parsed.margin = {
                top: {},
                right: {},
                left: {},
                bottom: {}
              };
            }
            parsed.margin[m] = declaration.value.children.first();
            dList.remove(dItem);
          } else if (prop === "padding") {
            parsed.padding = _this2.getPaddings(declaration.value);
            dList.remove(dItem);
          } else if (prop.indexOf("padding-") === 0) {
            var p = prop.substring("padding-".length);
            if (!parsed.padding) {
              parsed.padding = {
                top: {},
                right: {},
                left: {},
                bottom: {}
              };
            }
            parsed.padding[p] = declaration.value.children.first();
            dList.remove(dItem);
          } else if (prop === "border") {
            if (!parsed.border) {
              parsed.border = {
                top: {},
                right: {},
                left: {},
                bottom: {}
              };
            }
            parsed.border.top = _cssTree["default"].generate(declaration.value);
            parsed.border.right = _cssTree["default"].generate(declaration.value);
            parsed.border.left = _cssTree["default"].generate(declaration.value);
            parsed.border.bottom = _cssTree["default"].generate(declaration.value);
            dList.remove(dItem);
          } else if (prop.indexOf("border-") === 0) {
            if (!parsed.border) {
              parsed.border = {
                top: {},
                right: {},
                left: {},
                bottom: {}
              };
            }
            var _p = prop.substring("border-".length);
            parsed.border[_p] = _cssTree["default"].generate(declaration.value);
            dList.remove(dItem);
          } else if (prop === "size") {
            parsed.size = _this2.getSize(declaration);
            dList.remove(dItem);
          } else if (prop === "bleed") {
            parsed.bleed = [];
            _cssTree["default"].walk(declaration, {
              enter: function enter(subNode) {
                switch (subNode.type) {
                  case "String":
                    // bleed: "auto"
                    if (subNode.value.indexOf("auto") > -1) {
                      parsed.bleed.push("auto");
                    }
                    break;
                  case "Dimension":
                    // bleed: 1in 2in, bleed: 20px ect.
                    parsed.bleed.push({
                      value: subNode.value,
                      unit: subNode.unit
                    });
                    break;
                  case "Number":
                    parsed.bleed.push({
                      value: subNode.value,
                      unit: "px"
                    });
                    break;
                  default:
                  // ignore
                }
              }
            });

            dList.remove(dItem);
          }
        }
      });
      return parsed;
    }
  }, {
    key: "getSize",
    value: function getSize(declaration) {
      var width, height, orientation, format;

      // Get size: Xmm Ymm
      _cssTree["default"].walk(declaration, {
        visit: "Dimension",
        enter: function enter(node, item, list) {
          var value = node.value,
            unit = node.unit;
          if (typeof width === "undefined") {
            width = {
              value: value,
              unit: unit
            };
          } else if (typeof height === "undefined") {
            height = {
              value: value,
              unit: unit
            };
          }
        }
      });

      // Get size: "A4"
      _cssTree["default"].walk(declaration, {
        visit: "String",
        enter: function enter(node, item, list) {
          var name = node.value.replace(/["|']/g, "");
          var s = _sizes["default"][name];
          if (s) {
            width = s.width;
            height = s.height;
          }
        }
      });

      // Get Format or Landscape or Portrait
      _cssTree["default"].walk(declaration, {
        visit: "Identifier",
        enter: function enter(node, item, list) {
          var name = node.name;
          if (name === "landscape" || name === "portrait") {
            orientation = node.name;
          } else if (name !== "auto") {
            var s = _sizes["default"][name];
            if (s) {
              width = s.width;
              height = s.height;
            }
            format = name;
          }
        }
      });
      return {
        width: width,
        height: height,
        orientation: orientation,
        format: format
      };
    }
  }, {
    key: "getMargins",
    value: function getMargins(declaration) {
      var margins = [];
      var margin = {
        top: {},
        right: {},
        left: {},
        bottom: {}
      };
      _cssTree["default"].walk(declaration, {
        enter: function enter(node) {
          switch (node.type) {
            case "Dimension":
              // margin: 1in 2in, margin: 20px, etc...
              margins.push(node);
              break;
            case "Number":
              // margin: 0
              margins.push({
                value: node.value,
                unit: "px"
              });
              break;
            default:
            // ignore
          }
        }
      });

      if (margins.length === 1) {
        for (var m in margin) {
          margin[m] = margins[0];
        }
      } else if (margins.length === 2) {
        margin.top = margins[0];
        margin.right = margins[1];
        margin.bottom = margins[0];
        margin.left = margins[1];
      } else if (margins.length === 3) {
        margin.top = margins[0];
        margin.right = margins[1];
        margin.bottom = margins[2];
        margin.left = margins[1];
      } else if (margins.length === 4) {
        margin.top = margins[0];
        margin.right = margins[1];
        margin.bottom = margins[2];
        margin.left = margins[3];
      }
      return margin;
    }
  }, {
    key: "getPaddings",
    value: function getPaddings(declaration) {
      var paddings = [];
      var padding = {
        top: {},
        right: {},
        left: {},
        bottom: {}
      };
      _cssTree["default"].walk(declaration, {
        enter: function enter(node) {
          switch (node.type) {
            case "Dimension":
              // padding: 1in 2in, padding: 20px, etc...
              paddings.push(node);
              break;
            case "Number":
              // padding: 0
              paddings.push({
                value: node.value,
                unit: "px"
              });
              break;
            default:
            // ignore
          }
        }
      });

      if (paddings.length === 1) {
        for (var p in padding) {
          padding[p] = paddings[0];
        }
      } else if (paddings.length === 2) {
        padding.top = paddings[0];
        padding.right = paddings[1];
        padding.bottom = paddings[0];
        padding.left = paddings[1];
      } else if (paddings.length === 3) {
        padding.top = paddings[0];
        padding.right = paddings[1];
        padding.bottom = paddings[2];
        padding.left = paddings[1];
      } else if (paddings.length === 4) {
        padding.top = paddings[0];
        padding.right = paddings[1];
        padding.bottom = paddings[2];
        padding.left = paddings[3];
      }
      return padding;
    }

    // get values for the border on the @page to pass them to the element with the .pagedjs_area class
  }, {
    key: "getBorders",
    value: function getBorders(declaration) {
      var border = {
        top: {},
        right: {},
        left: {},
        bottom: {}
      };
      if (declaration.prop == "border") {
        border.top = _cssTree["default"].generate(declaration.value);
        border.right = _cssTree["default"].generate(declaration.value);
        border.bottom = _cssTree["default"].generate(declaration.value);
        border.left = _cssTree["default"].generate(declaration.value);
      } else if (declaration.prop == "border-top") {
        border.top = _cssTree["default"].generate(declaration.value);
      } else if (declaration.prop == "border-right") {
        border.right = _cssTree["default"].generate(declaration.value);
      } else if (declaration.prop == "border-bottom") {
        border.bottom = _cssTree["default"].generate(declaration.value);
      } else if (declaration.prop == "border-left") {
        border.left = _cssTree["default"].generate(declaration.value);
      }
      return border;
    }
  }, {
    key: "addPageClasses",
    value: function addPageClasses(pages, ast, sheet) {
      // First add * page
      if ("*" in pages && pages["*"].added === false) {
        var p = this.createPage(pages["*"], ast.children, sheet);
        sheet.insertRule(p);
        pages["*"].added = true;
      }
      // Add :left & :right
      if (":left" in pages && pages[":left"].added === false) {
        var left = this.createPage(pages[":left"], ast.children, sheet);
        sheet.insertRule(left);
        pages[":left"].added = true;
      }
      if (":right" in pages && pages[":right"].added === false) {
        var right = this.createPage(pages[":right"], ast.children, sheet);
        sheet.insertRule(right);
        pages[":right"].added = true;
      }
      // Add :first & :blank
      if (":first" in pages && pages[":first"].added === false) {
        var first = this.createPage(pages[":first"], ast.children, sheet);
        sheet.insertRule(first);
        pages[":first"].added = true;
      }
      if (":blank" in pages && pages[":blank"].added === false) {
        var blank = this.createPage(pages[":blank"], ast.children, sheet);
        sheet.insertRule(blank);
        pages[":blank"].added = true;
      }
      // Add nth pages
      for (var pg in pages) {
        if (pages[pg].nth && pages[pg].added === false) {
          var nth = this.createPage(pages[pg], ast.children, sheet);
          sheet.insertRule(nth);
          pages[pg].added = true;
        }
      }

      // Add named pages
      for (var _pg in pages) {
        if (pages[_pg].name && pages[_pg].added === false) {
          var named = this.createPage(pages[_pg], ast.children, sheet);
          sheet.insertRule(named);
          pages[_pg].added = true;
        }
      }
    }
  }, {
    key: "createPage",
    value: function createPage(page, ruleList, sheet) {
      var selectors = this.selectorsForPage(page);
      var children = page.block.children.copy();
      var block = {
        type: "Block",
        loc: 0,
        children: children
      };
      var rule = this.createRule(selectors, block);
      this.addMarginVars(page.margin, children, children.first());
      this.addPaddingVars(page.padding, children, children.first());
      this.addBorderVars(page.border, children, children.first());
      if (page.width) {
        this.addDimensions(page.width, page.height, page.orientation, children, children.first());
      }
      if (page.marginalia) {
        this.addMarginaliaStyles(page, ruleList, rule, sheet);
        this.addMarginaliaContent(page, ruleList, rule, sheet);
      }
      if (page.notes) {
        this.addNotesStyles(page.notes, page, ruleList, rule, sheet);
      }
      return rule;
    }
  }, {
    key: "addMarginVars",
    value: function addMarginVars(margin, list, item) {
      // variables for margins
      for (var m in margin) {
        if (typeof margin[m].value !== "undefined") {
          var value = margin[m].value + (margin[m].unit || "");
          var mVar = list.createItem({
            type: "Declaration",
            property: "--pagedjs-margin-" + m,
            value: {
              type: "Raw",
              value: value
            }
          });
          list.append(mVar, item);
        }
      }
    }
  }, {
    key: "addPaddingVars",
    value: function addPaddingVars(padding, list, item) {
      // variables for padding
      for (var p in padding) {
        if (typeof padding[p].value !== "undefined") {
          var value = padding[p].value + (padding[p].unit || "");
          var pVar = list.createItem({
            type: "Declaration",
            property: "--pagedjs-padding-" + p,
            value: {
              type: "Raw",
              value: value
            }
          });
          list.append(pVar, item);
        }
      }
    }
  }, {
    key: "addBorderVars",
    value: function addBorderVars(border, list, item) {
      // variables for borders
      for (var _i = 0, _Object$keys = Object.keys(border); _i < _Object$keys.length; _i++) {
        var name = _Object$keys[_i];
        var value = border[name];
        // value is an empty object when undefined
        if (typeof value === "string") {
          var borderItem = list.createItem({
            type: "Declaration",
            property: "--pagedjs-border-" + name,
            value: {
              type: "Raw",
              value: value
            }
          });
          list.append(borderItem, item);
        }
      }
    }
  }, {
    key: "addDimensions",
    value: function addDimensions(width, height, orientation, list, item) {
      var widthString, heightString;
      widthString = (0, _utils.CSSValueToString)(width);
      heightString = (0, _utils.CSSValueToString)(height);
      if (orientation && orientation !== "portrait") {
        // reverse for orientation
        var _ref = [heightString, widthString];
        widthString = _ref[0];
        heightString = _ref[1];
      }

      // width variable
      var wVar = this.createVariable("--pagedjs-pagebox-width", widthString);
      list.appendData(wVar);

      // height variable
      var hVar = this.createVariable("--pagedjs-pagebox-height", heightString);
      list.appendData(hVar);

      // let w = this.createDimension("width", width);
      // let h = this.createDimension("height", height);
      // list.appendData(w);
      // list.appendData(h);
    }
  }, {
    key: "addMarginaliaStyles",
    value: function addMarginaliaStyles(page, list, item, sheet) {
      var _this3 = this;
      var _loop = function _loop(loc) {
        var block = _cssTree["default"].clone(page.marginalia[loc]);
        var hasContent = false;
        if (block.children.isEmpty()) {
          return "continue";
        }
        _cssTree["default"].walk(block, {
          visit: "Declaration",
          enter: function enter(node, item, list) {
            if (node.property === "content") {
              if (node.value.children && node.value.children.first().name === "none") {
                hasContent = false;
              } else {
                hasContent = true;
              }
              list.remove(item);
            }
            if (node.property === "vertical-align") {
              _cssTree["default"].walk(node, {
                visit: "Identifier",
                enter: function enter(identNode, identItem, identlist) {
                  var name = identNode.name;
                  if (name === "top") {
                    identNode.name = "flex-start";
                  } else if (name === "middle") {
                    identNode.name = "center";
                  } else if (name === "bottom") {
                    identNode.name = "flex-end";
                  }
                }
              });
              node.property = "align-items";
            }
            if (node.property === "width" && (loc === "top-left" || loc === "top-center" || loc === "top-right" || loc === "bottom-left" || loc === "bottom-center" || loc === "bottom-right")) {
              var c = _cssTree["default"].clone(node);
              c.property = "max-width";
              list.appendData(c);
            }
            if (node.property === "height" && (loc === "left-top" || loc === "left-middle" || loc === "left-bottom" || loc === "right-top" || loc === "right-middle" || loc === "right-bottom")) {
              var _c = _cssTree["default"].clone(node);
              _c.property = "max-height";
              list.appendData(_c);
            }
          }
        });
        var marginSelectors = _this3.selectorsForPageMargin(page, loc);
        var marginRule = _this3.createRule(marginSelectors, block);
        list.appendData(marginRule);
        var sel = _cssTree["default"].generate({
          type: "Selector",
          children: marginSelectors
        });
        _this3.marginalia[sel] = {
          page: page,
          selector: sel,
          block: page.marginalia[loc],
          hasContent: hasContent
        };
      };
      for (var loc in page.marginalia) {
        var _ret = _loop(loc);
        if (_ret === "continue") continue;
      }
    }
  }, {
    key: "addMarginaliaContent",
    value: function addMarginaliaContent(page, list, item, sheet) {
      var displayNone;
      // Just content
      for (var loc in page.marginalia) {
        var content = _cssTree["default"].clone(page.marginalia[loc]);
        _cssTree["default"].walk(content, {
          visit: "Declaration",
          enter: function enter(node, item, list) {
            if (node.property !== "content") {
              list.remove(item);
            }
            if (node.value.children && node.value.children.first().name === "none") {
              displayNone = true;
            }
          }
        });
        if (content.children.isEmpty()) {
          continue;
        }
        var displaySelectors = this.selectorsForPageMargin(page, loc);
        var displayDeclaration = void 0;
        displaySelectors.insertData({
          type: "Combinator",
          name: ">"
        });
        displaySelectors.insertData({
          type: "ClassSelector",
          name: "pagedjs_margin-content"
        });
        displaySelectors.insertData({
          type: "Combinator",
          name: ">"
        });
        displaySelectors.insertData({
          type: "TypeSelector",
          name: "*"
        });
        if (displayNone) {
          displayDeclaration = this.createDeclaration("display", "none");
        } else {
          displayDeclaration = this.createDeclaration("display", "block");
        }
        var displayRule = this.createRule(displaySelectors, [displayDeclaration]);
        sheet.insertRule(displayRule);

        // insert content rule
        var contentSelectors = this.selectorsForPageMargin(page, loc);
        contentSelectors.insertData({
          type: "Combinator",
          name: ">"
        });
        contentSelectors.insertData({
          type: "ClassSelector",
          name: "pagedjs_margin-content"
        });
        contentSelectors.insertData({
          type: "PseudoElementSelector",
          name: "after",
          children: null
        });
        var contentRule = this.createRule(contentSelectors, content);
        sheet.insertRule(contentRule);
      }
    }
  }, {
    key: "addRootVars",
    value: function addRootVars(ast, width, height, orientation, bleed, bleedrecto, bleedverso, marks) {
      var _this4 = this;
      var rules = [];
      var selectors = new _cssTree["default"].List();
      selectors.insertData({
        type: "PseudoClassSelector",
        name: "root",
        children: null
      });
      var widthString, heightString;
      var widthStringRight, heightStringRight;
      var widthStringLeft, heightStringLeft;
      if (!bleed) {
        widthString = (0, _utils.CSSValueToString)(width);
        heightString = (0, _utils.CSSValueToString)(height);
        widthStringRight = (0, _utils.CSSValueToString)(width);
        heightStringRight = (0, _utils.CSSValueToString)(height);
        widthStringLeft = (0, _utils.CSSValueToString)(width);
        heightStringLeft = (0, _utils.CSSValueToString)(height);
      } else {
        widthString = "calc( ".concat((0, _utils.CSSValueToString)(width), " + ").concat((0, _utils.CSSValueToString)(bleed.left), " + ").concat((0, _utils.CSSValueToString)(bleed.right), " )");
        heightString = "calc( ".concat((0, _utils.CSSValueToString)(height), " + ").concat((0, _utils.CSSValueToString)(bleed.top), " + ").concat((0, _utils.CSSValueToString)(bleed.bottom), " )");
        widthStringRight = "calc( ".concat((0, _utils.CSSValueToString)(width), " + ").concat((0, _utils.CSSValueToString)(bleed.left), " + ").concat((0, _utils.CSSValueToString)(bleed.right), " )");
        heightStringRight = "calc( ".concat((0, _utils.CSSValueToString)(height), " + ").concat((0, _utils.CSSValueToString)(bleed.top), " + ").concat((0, _utils.CSSValueToString)(bleed.bottom), " )");
        widthStringLeft = "calc( ".concat((0, _utils.CSSValueToString)(width), " + ").concat((0, _utils.CSSValueToString)(bleed.left), " + ").concat((0, _utils.CSSValueToString)(bleed.right), " )");
        heightStringLeft = "calc( ".concat((0, _utils.CSSValueToString)(height), " + ").concat((0, _utils.CSSValueToString)(bleed.top), " + ").concat((0, _utils.CSSValueToString)(bleed.bottom), " )");
        var bleedTop = this.createVariable("--pagedjs-bleed-top", (0, _utils.CSSValueToString)(bleed.top));
        var bleedRight = this.createVariable("--pagedjs-bleed-right", (0, _utils.CSSValueToString)(bleed.right));
        var bleedBottom = this.createVariable("--pagedjs-bleed-bottom", (0, _utils.CSSValueToString)(bleed.bottom));
        var bleedLeft = this.createVariable("--pagedjs-bleed-left", (0, _utils.CSSValueToString)(bleed.left));
        var bleedTopRecto = this.createVariable("--pagedjs-bleed-right-top", (0, _utils.CSSValueToString)(bleed.top));
        var bleedRightRecto = this.createVariable("--pagedjs-bleed-right-right", (0, _utils.CSSValueToString)(bleed.right));
        var bleedBottomRecto = this.createVariable("--pagedjs-bleed-right-bottom", (0, _utils.CSSValueToString)(bleed.bottom));
        var bleedLeftRecto = this.createVariable("--pagedjs-bleed-right-left", (0, _utils.CSSValueToString)(bleed.left));
        var bleedTopVerso = this.createVariable("--pagedjs-bleed-left-top", (0, _utils.CSSValueToString)(bleed.top));
        var bleedRightVerso = this.createVariable("--pagedjs-bleed-left-right", (0, _utils.CSSValueToString)(bleed.right));
        var bleedBottomVerso = this.createVariable("--pagedjs-bleed-left-bottom", (0, _utils.CSSValueToString)(bleed.bottom));
        var bleedLeftVerso = this.createVariable("--pagedjs-bleed-left-left", (0, _utils.CSSValueToString)(bleed.left));
        if (bleedrecto) {
          bleedTopRecto = this.createVariable("--pagedjs-bleed-right-top", (0, _utils.CSSValueToString)(bleedrecto.top));
          bleedRightRecto = this.createVariable("--pagedjs-bleed-right-right", (0, _utils.CSSValueToString)(bleedrecto.right));
          bleedBottomRecto = this.createVariable("--pagedjs-bleed-right-bottom", (0, _utils.CSSValueToString)(bleedrecto.bottom));
          bleedLeftRecto = this.createVariable("--pagedjs-bleed-right-left", (0, _utils.CSSValueToString)(bleedrecto.left));
          widthStringRight = "calc( ".concat((0, _utils.CSSValueToString)(width), " + ").concat((0, _utils.CSSValueToString)(bleedrecto.left), " + ").concat((0, _utils.CSSValueToString)(bleedrecto.right), " )");
          heightStringRight = "calc( ".concat((0, _utils.CSSValueToString)(height), " + ").concat((0, _utils.CSSValueToString)(bleedrecto.top), " + ").concat((0, _utils.CSSValueToString)(bleedrecto.bottom), " )");
        }
        if (bleedverso) {
          bleedTopVerso = this.createVariable("--pagedjs-bleed-left-top", (0, _utils.CSSValueToString)(bleedverso.top));
          bleedRightVerso = this.createVariable("--pagedjs-bleed-left-right", (0, _utils.CSSValueToString)(bleedverso.right));
          bleedBottomVerso = this.createVariable("--pagedjs-bleed-left-bottom", (0, _utils.CSSValueToString)(bleedverso.bottom));
          bleedLeftVerso = this.createVariable("--pagedjs-bleed-left-left", (0, _utils.CSSValueToString)(bleedverso.left));
          widthStringLeft = "calc( ".concat((0, _utils.CSSValueToString)(width), " + ").concat((0, _utils.CSSValueToString)(bleedverso.left), " + ").concat((0, _utils.CSSValueToString)(bleedverso.right), " )");
          heightStringLeft = "calc( ".concat((0, _utils.CSSValueToString)(height), " + ").concat((0, _utils.CSSValueToString)(bleedverso.top), " + ").concat((0, _utils.CSSValueToString)(bleedverso.bottom), " )");
        }
        var pageWidthVar = this.createVariable("--pagedjs-width", (0, _utils.CSSValueToString)(width));
        var pageHeightVar = this.createVariable("--pagedjs-height", (0, _utils.CSSValueToString)(height));
        rules.push(bleedTop, bleedRight, bleedBottom, bleedLeft, bleedTopRecto, bleedRightRecto, bleedBottomRecto, bleedLeftRecto, bleedTopVerso, bleedRightVerso, bleedBottomVerso, bleedLeftVerso, pageWidthVar, pageHeightVar);
      }
      if (marks) {
        marks.forEach(function (mark) {
          var markDisplay = _this4.createVariable("--pagedjs-mark-" + mark + "-display", "block");
          rules.push(markDisplay);
        });
      }

      // orientation variable
      if (orientation) {
        var oVar = this.createVariable("--pagedjs-orientation", orientation);
        rules.push(oVar);
        if (orientation !== "portrait") {
          // reverse for orientation
          var _ref2 = [heightString, widthString];
          widthString = _ref2[0];
          heightString = _ref2[1];
          var _ref3 = [heightStringRight, widthStringRight];
          widthStringRight = _ref3[0];
          heightStringRight = _ref3[1];
          var _ref4 = [heightStringLeft, widthStringLeft];
          widthStringLeft = _ref4[0];
          heightStringLeft = _ref4[1];
        }
      }
      var wVar = this.createVariable("--pagedjs-width", widthString);
      var hVar = this.createVariable("--pagedjs-height", heightString);
      var wVarR = this.createVariable("--pagedjs-width-right", widthStringRight);
      var hVarR = this.createVariable("--pagedjs-height-right", heightStringRight);
      var wVarL = this.createVariable("--pagedjs-width-left", widthStringLeft);
      var hVarL = this.createVariable("--pagedjs-height-left", heightStringLeft);
      rules.push(wVar, hVar, wVarR, hVarR, wVarL, hVarL);
      var rule = this.createRule(selectors, rules);
      ast.children.appendData(rule);
    }
  }, {
    key: "addNotesStyles",
    value: function addNotesStyles(notes, page, list, item, sheet) {
      for (var note in notes) {
        var selectors = this.selectorsForPage(page);
        selectors.insertData({
          type: "Combinator",
          name: " "
        });
        selectors.insertData({
          type: "ClassSelector",
          name: "pagedjs_" + note + "_content"
        });
        var notesRule = this.createRule(selectors, notes[note]);
        list.appendData(notesRule);
      }
    }

    /*
    @page {
    	size: var(--pagedjs-width) var(--pagedjs-height);
    	margin: 0;
    	padding: 0;
    }
    */
  }, {
    key: "addRootPage",
    value: function addRootPage(ast, size, bleed, bleedrecto, bleedverso) {
      var width = size.width,
        height = size.height,
        orientation = size.orientation,
        format = size.format;
      var children = new _cssTree["default"].List();
      var childrenLeft = new _cssTree["default"].List();
      var childrenRight = new _cssTree["default"].List();
      var dimensions = new _cssTree["default"].List();
      var dimensionsLeft = new _cssTree["default"].List();
      var dimensionsRight = new _cssTree["default"].List();
      if (bleed) {
        var widthCalculations = new _cssTree["default"].List();
        var heightCalculations = new _cssTree["default"].List();

        // width
        widthCalculations.appendData({
          type: "Dimension",
          unit: width.unit,
          value: width.value
        });
        widthCalculations.appendData({
          type: "WhiteSpace",
          value: " "
        });
        widthCalculations.appendData({
          type: "Operator",
          value: "+"
        });
        widthCalculations.appendData({
          type: "WhiteSpace",
          value: " "
        });
        widthCalculations.appendData({
          type: "Dimension",
          unit: bleed.left.unit,
          value: bleed.left.value
        });
        widthCalculations.appendData({
          type: "WhiteSpace",
          value: " "
        });
        widthCalculations.appendData({
          type: "Operator",
          value: "+"
        });
        widthCalculations.appendData({
          type: "WhiteSpace",
          value: " "
        });
        widthCalculations.appendData({
          type: "Dimension",
          unit: bleed.right.unit,
          value: bleed.right.value
        });

        // height
        heightCalculations.appendData({
          type: "Dimension",
          unit: height.unit,
          value: height.value
        });
        heightCalculations.appendData({
          type: "WhiteSpace",
          value: " "
        });
        heightCalculations.appendData({
          type: "Operator",
          value: "+"
        });
        heightCalculations.appendData({
          type: "WhiteSpace",
          value: " "
        });
        heightCalculations.appendData({
          type: "Dimension",
          unit: bleed.top.unit,
          value: bleed.top.value
        });
        heightCalculations.appendData({
          type: "WhiteSpace",
          value: " "
        });
        heightCalculations.appendData({
          type: "Operator",
          value: "+"
        });
        heightCalculations.appendData({
          type: "WhiteSpace",
          value: " "
        });
        heightCalculations.appendData({
          type: "Dimension",
          unit: bleed.bottom.unit,
          value: bleed.bottom.value
        });
        dimensions.appendData({
          type: "Function",
          name: "calc",
          children: widthCalculations
        });
        dimensions.appendData({
          type: "WhiteSpace",
          value: " "
        });
        dimensions.appendData({
          type: "Function",
          name: "calc",
          children: heightCalculations
        });
      } else if (format) {
        dimensions.appendData({
          type: "Identifier",
          name: format
        });
        if (orientation) {
          dimensions.appendData({
            type: "WhiteSpace",
            value: " "
          });
          dimensions.appendData({
            type: "Identifier",
            name: orientation
          });
        }
      } else {
        dimensions.appendData({
          type: "Dimension",
          unit: width.unit,
          value: width.value
        });
        dimensions.appendData({
          type: "WhiteSpace",
          value: " "
        });
        dimensions.appendData({
          type: "Dimension",
          unit: height.unit,
          value: height.value
        });
      }
      children.appendData({
        type: "Declaration",
        property: "size",
        loc: null,
        value: {
          type: "Value",
          children: dimensions
        }
      });
      children.appendData({
        type: "Declaration",
        property: "margin",
        loc: null,
        value: {
          type: "Value",
          children: [{
            type: "Dimension",
            unit: "px",
            value: 0
          }]
        }
      });
      children.appendData({
        type: "Declaration",
        property: "padding",
        loc: null,
        value: {
          type: "Value",
          children: [{
            type: "Dimension",
            unit: "px",
            value: 0
          }]
        }
      });
      children.appendData({
        type: "Declaration",
        property: "padding",
        loc: null,
        value: {
          type: "Value",
          children: [{
            type: "Dimension",
            unit: "px",
            value: 0
          }]
        }
      });
      var rule = ast.children.createItem({
        type: "Atrule",
        prelude: null,
        name: "page",
        block: {
          type: "Block",
          loc: null,
          children: children
        }
      });
      ast.children.append(rule);
      if (bleedverso) {
        var widthCalculationsLeft = new _cssTree["default"].List();
        var heightCalculationsLeft = new _cssTree["default"].List();

        // width
        widthCalculationsLeft.appendData({
          type: "Dimension",
          unit: width.unit,
          value: width.value
        });
        widthCalculationsLeft.appendData({
          type: "WhiteSpace",
          value: " "
        });
        widthCalculationsLeft.appendData({
          type: "Operator",
          value: "+"
        });
        widthCalculationsLeft.appendData({
          type: "WhiteSpace",
          value: " "
        });
        widthCalculationsLeft.appendData({
          type: "Dimension",
          unit: bleedverso.left.unit,
          value: bleedverso.left.value
        });
        widthCalculationsLeft.appendData({
          type: "WhiteSpace",
          value: " "
        });
        widthCalculationsLeft.appendData({
          type: "Operator",
          value: "+"
        });
        widthCalculationsLeft.appendData({
          type: "WhiteSpace",
          value: " "
        });
        widthCalculationsLeft.appendData({
          type: "Dimension",
          unit: bleedverso.right.unit,
          value: bleedverso.right.value
        });

        // height
        heightCalculationsLeft.appendData({
          type: "Dimension",
          unit: height.unit,
          value: height.value
        });
        heightCalculationsLeft.appendData({
          type: "WhiteSpace",
          value: " "
        });
        heightCalculationsLeft.appendData({
          type: "Operator",
          value: "+"
        });
        heightCalculationsLeft.appendData({
          type: "WhiteSpace",
          value: " "
        });
        heightCalculationsLeft.appendData({
          type: "Dimension",
          unit: bleedverso.top.unit,
          value: bleedverso.top.value
        });
        heightCalculationsLeft.appendData({
          type: "WhiteSpace",
          value: " "
        });
        heightCalculationsLeft.appendData({
          type: "Operator",
          value: "+"
        });
        heightCalculationsLeft.appendData({
          type: "WhiteSpace",
          value: " "
        });
        heightCalculationsLeft.appendData({
          type: "Dimension",
          unit: bleedverso.bottom.unit,
          value: bleedverso.bottom.value
        });
        dimensionsLeft.appendData({
          type: "Function",
          name: "calc",
          children: widthCalculationsLeft
        });
        dimensionsLeft.appendData({
          type: "WhiteSpace",
          value: " "
        });
        dimensionsLeft.appendData({
          type: "Function",
          name: "calc",
          children: heightCalculationsLeft
        });
        childrenLeft.appendData({
          type: "Declaration",
          property: "size",
          loc: null,
          value: {
            type: "Value",
            children: dimensionsLeft
          }
        });
        var ruleLeft = ast.children.createItem({
          type: "Atrule",
          prelude: null,
          name: "page :left",
          block: {
            type: "Block",
            loc: null,
            children: childrenLeft
          }
        });
        ast.children.append(ruleLeft);
      }
      if (bleedrecto) {
        var widthCalculationsRight = new _cssTree["default"].List();
        var heightCalculationsRight = new _cssTree["default"].List();

        // width
        widthCalculationsRight.appendData({
          type: "Dimension",
          unit: width.unit,
          value: width.value
        });
        widthCalculationsRight.appendData({
          type: "WhiteSpace",
          value: " "
        });
        widthCalculationsRight.appendData({
          type: "Operator",
          value: "+"
        });
        widthCalculationsRight.appendData({
          type: "WhiteSpace",
          value: " "
        });
        widthCalculationsRight.appendData({
          type: "Dimension",
          unit: bleedrecto.left.unit,
          value: bleedrecto.left.value
        });
        widthCalculationsRight.appendData({
          type: "WhiteSpace",
          value: " "
        });
        widthCalculationsRight.appendData({
          type: "Operator",
          value: "+"
        });
        widthCalculationsRight.appendData({
          type: "WhiteSpace",
          value: " "
        });
        widthCalculationsRight.appendData({
          type: "Dimension",
          unit: bleedrecto.right.unit,
          value: bleedrecto.right.value
        });

        // height
        heightCalculationsRight.appendData({
          type: "Dimension",
          unit: height.unit,
          value: height.value
        });
        heightCalculationsRight.appendData({
          type: "WhiteSpace",
          value: " "
        });
        heightCalculationsRight.appendData({
          type: "Operator",
          value: "+"
        });
        heightCalculationsRight.appendData({
          type: "WhiteSpace",
          value: " "
        });
        heightCalculationsRight.appendData({
          type: "Dimension",
          unit: bleedrecto.top.unit,
          value: bleedrecto.top.value
        });
        heightCalculationsRight.appendData({
          type: "WhiteSpace",
          value: " "
        });
        heightCalculationsRight.appendData({
          type: "Operator",
          value: "+"
        });
        heightCalculationsRight.appendData({
          type: "WhiteSpace",
          value: " "
        });
        heightCalculationsRight.appendData({
          type: "Dimension",
          unit: bleedrecto.bottom.unit,
          value: bleedrecto.bottom.value
        });
        dimensionsRight.appendData({
          type: "Function",
          name: "calc",
          children: widthCalculationsRight
        });
        dimensionsRight.appendData({
          type: "WhiteSpace",
          value: " "
        });
        dimensionsRight.appendData({
          type: "Function",
          name: "calc",
          children: heightCalculationsRight
        });
        childrenRight.appendData({
          type: "Declaration",
          property: "size",
          loc: null,
          value: {
            type: "Value",
            children: dimensionsRight
          }
        });
        var ruleRight = ast.children.createItem({
          type: "Atrule",
          prelude: null,
          name: "page :right",
          block: {
            type: "Block",
            loc: null,
            children: childrenRight
          }
        });
        ast.children.append(ruleRight);
      }
    }
  }, {
    key: "getNth",
    value: function getNth(nth) {
      var n = nth.indexOf("n");
      var plus = nth.indexOf("+");
      var splitN = nth.split("n");
      var splitP = nth.split("+");
      var a = null;
      var b = null;
      if (n > -1) {
        a = splitN[0];
        if (plus > -1) {
          b = splitP[1];
        }
      } else {
        b = nth;
      }
      return {
        type: "Nth",
        loc: null,
        selector: null,
        nth: {
          type: "AnPlusB",
          loc: null,
          a: a,
          b: b
        }
      };
    }
  }, {
    key: "addPageAttributes",
    value: function addPageAttributes(page, start, pages) {
      var namedPages = [start.dataset.page];
      if (namedPages && namedPages.length) {
        var _iterator = _createForOfIteratorHelper(namedPages),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var named = _step.value;
            if (!named) {
              continue;
            }
            page.name = named;
            page.element.classList.add("pagedjs_named_page");
            page.element.classList.add("pagedjs_" + named + "_page");
            if (!start.dataset.splitFrom) {
              page.element.classList.add("pagedjs_" + named + "_first_page");
            }
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }
    }
  }, {
    key: "getStartElement",
    value: function getStartElement(content, breakToken) {
      var node = breakToken && breakToken.node;
      if (!content && !breakToken) {
        return;
      }

      // No break
      if (!node) {
        return content.children[0];
      }

      // Top level element
      if (node.nodeType === 1 && node.parentNode.nodeType === 11) {
        return node;
      }

      // Named page
      if (node.nodeType === 1 && node.dataset.page) {
        return node;
      }

      // Get top level Named parent
      var fragment = (0, _dom.rebuildAncestors)(node);
      var pages = fragment.querySelectorAll("[data-page]");
      if (pages.length) {
        return pages[pages.length - 1];
      } else {
        return fragment.children[0];
      }
    }
  }, {
    key: "beforePageLayout",
    value: function beforePageLayout(page, contents, breakToken, chunker) {
      var start = this.getStartElement(contents, breakToken);
      if (start) {
        this.addPageAttributes(page, start, chunker.pages);
      }
      // page.element.querySelector('.paged_area').style.color = red;
    }
  }, {
    key: "finalizePage",
    value: function finalizePage(fragment, page, breakToken, chunker) {
      for (var m in this.marginalia) {
        var margin = this.marginalia[m];
        var sels = m.split(" ");
        var content = void 0;
        if (page.element.matches(sels[0]) && margin.hasContent) {
          content = page.element.querySelector(sels[1]);
          content.classList.add("hasContent");
        }
      }

      // check center
      ["top", "bottom"].forEach(function (loc) {
        var marginGroup = page.element.querySelector(".pagedjs_margin-" + loc);
        var center = page.element.querySelector(".pagedjs_margin-" + loc + "-center");
        var left = page.element.querySelector(".pagedjs_margin-" + loc + "-left");
        var right = page.element.querySelector(".pagedjs_margin-" + loc + "-right");
        var centerContent = center.classList.contains("hasContent");
        var leftContent = left.classList.contains("hasContent");
        var rightContent = right.classList.contains("hasContent");
        var centerWidth, leftWidth, rightWidth;
        if (leftContent) {
          leftWidth = window.getComputedStyle(left)["max-width"];
        }
        if (rightContent) {
          rightWidth = window.getComputedStyle(right)["max-width"];
        }
        if (centerContent) {
          centerWidth = window.getComputedStyle(center)["max-width"];
          if (centerWidth === "none" || centerWidth === "auto") {
            if (!leftContent && !rightContent) {
              marginGroup.style["grid-template-columns"] = "0 1fr 0";
            } else if (leftContent) {
              if (!rightContent) {
                if (leftWidth !== "none" && leftWidth !== "auto") {
                  marginGroup.style["grid-template-columns"] = leftWidth + " 1fr " + leftWidth;
                } else {
                  marginGroup.style["grid-template-columns"] = "auto auto 1fr";
                  left.style["white-space"] = "nowrap";
                  center.style["white-space"] = "nowrap";
                  var leftOuterWidth = left.offsetWidth;
                  var centerOuterWidth = center.offsetWidth;
                  var outerwidths = leftOuterWidth + centerOuterWidth;
                  var newcenterWidth = centerOuterWidth * 100 / outerwidths;
                  marginGroup.style["grid-template-columns"] = "minmax(16.66%, 1fr) minmax(33%, " + newcenterWidth + "%) minmax(16.66%, 1fr)";
                  left.style["white-space"] = "normal";
                  center.style["white-space"] = "normal";
                }
              } else {
                if (leftWidth !== "none" && leftWidth !== "auto") {
                  if (rightWidth !== "none" && rightWidth !== "auto") {
                    marginGroup.style["grid-template-columns"] = leftWidth + " 1fr " + rightWidth;
                  } else {
                    marginGroup.style["grid-template-columns"] = leftWidth + " 1fr " + leftWidth;
                  }
                } else {
                  if (rightWidth !== "none" && rightWidth !== "auto") {
                    marginGroup.style["grid-template-columns"] = rightWidth + " 1fr " + rightWidth;
                  } else {
                    marginGroup.style["grid-template-columns"] = "auto auto 1fr";
                    left.style["white-space"] = "nowrap";
                    center.style["white-space"] = "nowrap";
                    right.style["white-space"] = "nowrap";
                    var _leftOuterWidth = left.offsetWidth;
                    var _centerOuterWidth = center.offsetWidth;
                    var rightOuterWidth = right.offsetWidth;
                    var _outerwidths = _leftOuterWidth + _centerOuterWidth + rightOuterWidth;
                    var _newcenterWidth = _centerOuterWidth * 100 / _outerwidths;
                    if (_newcenterWidth > 40) {
                      marginGroup.style["grid-template-columns"] = "minmax(16.66%, 1fr) minmax(33%, " + _newcenterWidth + "%) minmax(16.66%, 1fr)";
                    } else {
                      marginGroup.style["grid-template-columns"] = "repeat(3, 1fr)";
                    }
                    left.style["white-space"] = "normal";
                    center.style["white-space"] = "normal";
                    right.style["white-space"] = "normal";
                  }
                }
              }
            } else {
              if (rightWidth !== "none" && rightWidth !== "auto") {
                marginGroup.style["grid-template-columns"] = rightWidth + " 1fr " + rightWidth;
              } else {
                marginGroup.style["grid-template-columns"] = "auto auto 1fr";
                right.style["white-space"] = "nowrap";
                center.style["white-space"] = "nowrap";
                var _rightOuterWidth = right.offsetWidth;
                var _centerOuterWidth2 = center.offsetWidth;
                var _outerwidths2 = _rightOuterWidth + _centerOuterWidth2;
                var _newcenterWidth2 = _centerOuterWidth2 * 100 / _outerwidths2;
                marginGroup.style["grid-template-columns"] = "minmax(16.66%, 1fr) minmax(33%, " + _newcenterWidth2 + "%) minmax(16.66%, 1fr)";
                right.style["white-space"] = "normal";
                center.style["white-space"] = "normal";
              }
            }
          } else if (centerWidth !== "none" && centerWidth !== "auto") {
            if (leftContent && leftWidth !== "none" && leftWidth !== "auto") {
              marginGroup.style["grid-template-columns"] = leftWidth + " " + centerWidth + " 1fr";
            } else if (rightContent && rightWidth !== "none" && rightWidth !== "auto") {
              marginGroup.style["grid-template-columns"] = "1fr " + centerWidth + " " + rightWidth;
            } else {
              marginGroup.style["grid-template-columns"] = "1fr " + centerWidth + " 1fr";
            }
          }
        } else {
          if (leftContent) {
            if (!rightContent) {
              marginGroup.style["grid-template-columns"] = "1fr 0 0";
            } else {
              if (leftWidth !== "none" && leftWidth !== "auto") {
                if (rightWidth !== "none" && rightWidth !== "auto") {
                  marginGroup.style["grid-template-columns"] = leftWidth + " 1fr " + rightWidth;
                } else {
                  marginGroup.style["grid-template-columns"] = leftWidth + " 0 1fr";
                }
              } else {
                if (rightWidth !== "none" && rightWidth !== "auto") {
                  marginGroup.style["grid-template-columns"] = "1fr 0 " + rightWidth;
                } else {
                  marginGroup.style["grid-template-columns"] = "auto 1fr auto";
                  left.style["white-space"] = "nowrap";
                  right.style["white-space"] = "nowrap";
                  var _leftOuterWidth2 = left.offsetWidth;
                  var _rightOuterWidth2 = right.offsetWidth;
                  var _outerwidths3 = _leftOuterWidth2 + _rightOuterWidth2;
                  var newLeftWidth = _leftOuterWidth2 * 100 / _outerwidths3;
                  marginGroup.style["grid-template-columns"] = "minmax(16.66%, " + newLeftWidth + "%) 0 1fr";
                  left.style["white-space"] = "normal";
                  right.style["white-space"] = "normal";
                }
              }
            }
          } else {
            if (rightWidth !== "none" && rightWidth !== "auto") {
              marginGroup.style["grid-template-columns"] = "1fr 0 " + rightWidth;
            } else {
              marginGroup.style["grid-template-columns"] = "0 0 1fr";
            }
          }
        }
      });

      // check middle
      ["left", "right"].forEach(function (loc) {
        var middle = page.element.querySelector(".pagedjs_margin-" + loc + "-middle.hasContent");
        var marginGroup = page.element.querySelector(".pagedjs_margin-" + loc);
        var top = page.element.querySelector(".pagedjs_margin-" + loc + "-top");
        var bottom = page.element.querySelector(".pagedjs_margin-" + loc + "-bottom");
        var topContent = top.classList.contains("hasContent");
        var bottomContent = bottom.classList.contains("hasContent");
        var middleHeight, topHeight, bottomHeight;
        if (topContent) {
          topHeight = window.getComputedStyle(top)["max-height"];
        }
        if (bottomContent) {
          bottomHeight = window.getComputedStyle(bottom)["max-height"];
        }
        if (middle) {
          middleHeight = window.getComputedStyle(middle)["max-height"];
          if (middleHeight === "none" || middleHeight === "auto") {
            if (!topContent && !bottomContent) {
              marginGroup.style["grid-template-rows"] = "0 1fr 0";
            } else if (topContent) {
              if (!bottomContent) {
                if (topHeight !== "none" && topHeight !== "auto") {
                  marginGroup.style["grid-template-rows"] = topHeight + " calc(100% - " + topHeight + "*2) " + topHeight;
                }
              } else {
                if (topHeight !== "none" && topHeight !== "auto") {
                  if (bottomHeight !== "none" && bottomHeight !== "auto") {
                    marginGroup.style["grid-template-rows"] = topHeight + " calc(100% - " + topHeight + " - " + bottomHeight + ") " + bottomHeight;
                  } else {
                    marginGroup.style["grid-template-rows"] = topHeight + " calc(100% - " + topHeight + "*2) " + topHeight;
                  }
                } else {
                  if (bottomHeight !== "none" && bottomHeight !== "auto") {
                    marginGroup.style["grid-template-rows"] = bottomHeight + " calc(100% - " + bottomHeight + "*2) " + bottomHeight;
                  }
                }
              }
            } else {
              if (bottomHeight !== "none" && bottomHeight !== "auto") {
                marginGroup.style["grid-template-rows"] = bottomHeight + " calc(100% - " + bottomHeight + "*2) " + bottomHeight;
              }
            }
          } else {
            if (topContent && topHeight !== "none" && topHeight !== "auto") {
              marginGroup.style["grid-template-rows"] = topHeight + " " + middleHeight + " calc(100% - (" + topHeight + " + " + middleHeight + "))";
            } else if (bottomContent && bottomHeight !== "none" && bottomHeight !== "auto") {
              marginGroup.style["grid-template-rows"] = "1fr " + middleHeight + " " + bottomHeight;
            } else {
              marginGroup.style["grid-template-rows"] = "calc((100% - " + middleHeight + ")/2) " + middleHeight + " calc((100% - " + middleHeight + ")/2)";
            }
          }
        } else {
          if (topContent) {
            if (!bottomContent) {
              marginGroup.style["grid-template-rows"] = "1fr 0 0";
            } else {
              if (topHeight !== "none" && topHeight !== "auto") {
                if (bottomHeight !== "none" && bottomHeight !== "auto") {
                  marginGroup.style["grid-template-rows"] = topHeight + " 1fr " + bottomHeight;
                } else {
                  marginGroup.style["grid-template-rows"] = topHeight + " 0 1fr";
                }
              } else {
                if (bottomHeight !== "none" && bottomHeight !== "auto") {
                  marginGroup.style["grid-template-rows"] = "1fr 0 " + bottomHeight;
                } else {
                  marginGroup.style["grid-template-rows"] = "1fr 0 1fr";
                }
              }
            }
          } else {
            if (bottomHeight !== "none" && bottomHeight !== "auto") {
              marginGroup.style["grid-template-rows"] = "1fr 0 " + bottomHeight;
            } else {
              marginGroup.style["grid-template-rows"] = "0 0 1fr";
            }
          }
        }
      });
    }

    // CSS Tree Helpers
  }, {
    key: "selectorsForPage",
    value: function selectorsForPage(page) {
      var nthlist;
      var nth;
      var selectors = new _cssTree["default"].List();
      selectors.insertData({
        type: "ClassSelector",
        name: "pagedjs_page"
      });

      // Named page
      if (page.name) {
        selectors.insertData({
          type: "ClassSelector",
          name: "pagedjs_named_page"
        });
        selectors.insertData({
          type: "ClassSelector",
          name: "pagedjs_" + page.name + "_page"
        });
      }

      // PsuedoSelector
      if (page.psuedo && !(page.name && page.psuedo === "first")) {
        selectors.insertData({
          type: "ClassSelector",
          name: "pagedjs_" + page.psuedo + "_page"
        });
      }
      if (page.name && page.psuedo === "first") {
        selectors.insertData({
          type: "ClassSelector",
          name: "pagedjs_" + page.name + "_" + page.psuedo + "_page"
        });
      }

      // Nth
      if (page.nth) {
        nthlist = new _cssTree["default"].List();
        nth = this.getNth(page.nth);
        nthlist.insertData(nth);
        selectors.insertData({
          type: "PseudoClassSelector",
          name: "nth-of-type",
          children: nthlist
        });
      }
      return selectors;
    }
  }, {
    key: "selectorsForPageMargin",
    value: function selectorsForPageMargin(page, margin) {
      var selectors = this.selectorsForPage(page);
      selectors.insertData({
        type: "Combinator",
        name: " "
      });
      selectors.insertData({
        type: "ClassSelector",
        name: "pagedjs_margin-" + margin
      });
      return selectors;
    }
  }, {
    key: "createDeclaration",
    value: function createDeclaration(property, value, important) {
      var children = new _cssTree["default"].List();
      children.insertData({
        type: "Identifier",
        loc: null,
        name: value
      });
      return {
        type: "Declaration",
        loc: null,
        important: important,
        property: property,
        value: {
          type: "Value",
          loc: null,
          children: children
        }
      };
    }
  }, {
    key: "createVariable",
    value: function createVariable(property, value) {
      return {
        type: "Declaration",
        loc: null,
        property: property,
        value: {
          type: "Raw",
          value: value
        }
      };
    }
  }, {
    key: "createCalculatedDimension",
    value: function createCalculatedDimension(property, items, important) {
      var operator = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "+";
      var children = new _cssTree["default"].List();
      var calculations = new _cssTree["default"].List();
      items.forEach(function (item, index) {
        calculations.appendData({
          type: "Dimension",
          unit: item.unit,
          value: item.value
        });
        calculations.appendData({
          type: "WhiteSpace",
          value: " "
        });
        if (index + 1 < items.length) {
          calculations.appendData({
            type: "Operator",
            value: operator
          });
          calculations.appendData({
            type: "WhiteSpace",
            value: " "
          });
        }
      });
      children.insertData({
        type: "Function",
        loc: null,
        name: "calc",
        children: calculations
      });
      return {
        type: "Declaration",
        loc: null,
        important: important,
        property: property,
        value: {
          type: "Value",
          loc: null,
          children: children
        }
      };
    }
  }, {
    key: "createDimension",
    value: function createDimension(property, cssValue, important) {
      var children = new _cssTree["default"].List();
      children.insertData({
        type: "Dimension",
        loc: null,
        value: cssValue.value,
        unit: cssValue.unit
      });
      return {
        type: "Declaration",
        loc: null,
        important: important,
        property: property,
        value: {
          type: "Value",
          loc: null,
          children: children
        }
      };
    }
  }, {
    key: "createBlock",
    value: function createBlock(declarations) {
      var block = new _cssTree["default"].List();
      declarations.forEach(function (declaration) {
        block.insertData(declaration);
      });
      return {
        type: "Block",
        loc: null,
        children: block
      };
    }
  }, {
    key: "createRule",
    value: function createRule(selectors, block) {
      var selectorList = new _cssTree["default"].List();
      selectorList.insertData({
        type: "Selector",
        children: selectors
      });
      if (Array.isArray(block)) {
        block = this.createBlock(block);
      }
      return {
        type: "Rule",
        prelude: {
          type: "SelectorList",
          children: selectorList
        },
        block: block
      };
    }
  }]);
  return AtPage;
}(_handler["default"]);
var _default = AtPage;
exports["default"] = _default;