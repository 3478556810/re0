"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _cssTree = _interopRequireDefault(require("css-tree"));
var _utils = require("../utils/utils.cjs");
var _hook = _interopRequireDefault(require("../utils/hook.cjs"));
var Sheet = /*#__PURE__*/function () {
  function Sheet(url, hooks) {
    (0, _classCallCheck2["default"])(this, Sheet);
    if (hooks) {
      this.hooks = hooks;
    } else {
      this.hooks = {};
      this.hooks.onUrl = new _hook["default"](this);
      this.hooks.onAtPage = new _hook["default"](this);
      this.hooks.onAtMedia = new _hook["default"](this);
      this.hooks.onRule = new _hook["default"](this);
      this.hooks.onDeclaration = new _hook["default"](this);
      this.hooks.onSelector = new _hook["default"](this);
      this.hooks.onPseudoSelector = new _hook["default"](this);
      this.hooks.onContent = new _hook["default"](this);
      this.hooks.onImport = new _hook["default"](this);
      this.hooks.beforeTreeParse = new _hook["default"](this);
      this.hooks.beforeTreeWalk = new _hook["default"](this);
      this.hooks.afterTreeWalk = new _hook["default"](this);
    }
    try {
      this.url = new URL(url, window.location.href);
    } catch (e) {
      this.url = new URL(window.location.href);
    }
  }

  // parse
  (0, _createClass2["default"])(Sheet, [{
    key: "parse",
    value: function () {
      var _parse = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(text) {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              this.text = text;
              _context.next = 3;
              return this.hooks.beforeTreeParse.trigger(this.text, this);
            case 3:
              // send to csstree
              this.ast = _cssTree["default"].parse(this._text);
              _context.next = 6;
              return this.hooks.beforeTreeWalk.trigger(this.ast);
            case 6:
              // Replace urls
              this.replaceUrls(this.ast);

              // Scope
              this.id = (0, _utils.UUID)();
              // this.addScope(this.ast, this.uuid);

              // Replace IDs with data-id
              this.replaceIds(this.ast);
              this.imported = [];

              // Trigger Hooks
              this.urls(this.ast);
              this.rules(this.ast);
              this.atrules(this.ast);
              _context.next = 15;
              return this.hooks.afterTreeWalk.trigger(this.ast, this);
            case 15:
              return _context.abrupt("return", this.ast);
            case 16:
            case "end":
              return _context.stop();
          }
        }, _callee, this);
      }));
      function parse(_x) {
        return _parse.apply(this, arguments);
      }
      return parse;
    }()
  }, {
    key: "insertRule",
    value: function insertRule(rule) {
      var inserted = this.ast.children.appendData(rule);
      this.declarations(rule);
      return inserted;
    }
  }, {
    key: "urls",
    value: function urls(ast) {
      var _this = this;
      _cssTree["default"].walk(ast, {
        visit: "Url",
        enter: function enter(node, item, list) {
          _this.hooks.onUrl.trigger(node, item, list);
        }
      });
    }
  }, {
    key: "atrules",
    value: function atrules(ast) {
      var _this2 = this;
      _cssTree["default"].walk(ast, {
        visit: "Atrule",
        enter: function enter(node, item, list) {
          var basename = _cssTree["default"].keyword(node.name).basename;
          if (basename === "page") {
            _this2.hooks.onAtPage.trigger(node, item, list);
            _this2.declarations(node, item, list);
          }
          if (basename === "media") {
            _this2.hooks.onAtMedia.trigger(node, item, list);
            _this2.declarations(node, item, list);
          }
          if (basename === "import") {
            _this2.hooks.onImport.trigger(node, item, list);
            _this2.imports(node, item, list);
          }
        }
      });
    }
  }, {
    key: "rules",
    value: function rules(ast) {
      var _this3 = this;
      _cssTree["default"].walk(ast, {
        visit: "Rule",
        enter: function enter(ruleNode, ruleItem, rulelist) {
          _this3.hooks.onRule.trigger(ruleNode, ruleItem, rulelist);
          _this3.declarations(ruleNode, ruleItem, rulelist);
          _this3.onSelector(ruleNode, ruleItem, rulelist);
        }
      });
    }
  }, {
    key: "declarations",
    value: function declarations(ruleNode, ruleItem, rulelist) {
      var _this4 = this;
      _cssTree["default"].walk(ruleNode, {
        visit: "Declaration",
        enter: function enter(declarationNode, dItem, dList) {
          _this4.hooks.onDeclaration.trigger(declarationNode, dItem, dList, {
            ruleNode: ruleNode,
            ruleItem: ruleItem,
            rulelist: rulelist
          });
          if (declarationNode.property === "content") {
            _cssTree["default"].walk(declarationNode, {
              visit: "Function",
              enter: function enter(funcNode, fItem, fList) {
                _this4.hooks.onContent.trigger(funcNode, fItem, fList, {
                  declarationNode: declarationNode,
                  dItem: dItem,
                  dList: dList
                }, {
                  ruleNode: ruleNode,
                  ruleItem: ruleItem,
                  rulelist: rulelist
                });
              }
            });
          }
        }
      });
    }

    // add pseudo elements to parser
  }, {
    key: "onSelector",
    value: function onSelector(ruleNode, ruleItem, rulelist) {
      var _this5 = this;
      _cssTree["default"].walk(ruleNode, {
        visit: "Selector",
        enter: function enter(selectNode, selectItem, selectList) {
          _this5.hooks.onSelector.trigger(selectNode, selectItem, selectList, {
            ruleNode: ruleNode,
            ruleItem: ruleItem,
            rulelist: rulelist
          });
          if (selectNode.children.forEach(function (node) {
            if (node.type === "PseudoElementSelector") {
              _cssTree["default"].walk(node, {
                visit: "PseudoElementSelector",
                enter: function enter(pseudoNode, pItem, pList) {
                  _this5.hooks.onPseudoSelector.trigger(pseudoNode, pItem, pList, {
                    selectNode: selectNode,
                    selectItem: selectItem,
                    selectList: selectList
                  }, {
                    ruleNode: ruleNode,
                    ruleItem: ruleItem,
                    rulelist: rulelist
                  });
                }
              });
            }
          })) ;
        }
      });
    }
  }, {
    key: "replaceUrls",
    value: function replaceUrls(ast) {
      var _this6 = this;
      _cssTree["default"].walk(ast, {
        visit: "Url",
        enter: function enter(node, item, list) {
          var content = node.value.value;
          if (node.value.type === "Raw" && content.startsWith("data:") || node.value.type === "String" && (content.startsWith("\"data:") || content.startsWith("'data:"))) {
            // data-uri should not be parsed using the URL interface.
          } else {
            var href = content.replace(/["']/g, "");
            var url = new URL(href, _this6.url);
            node.value.value = url.toString();
          }
        }
      });
    }
  }, {
    key: "addScope",
    value: function addScope(ast, id) {
      // Get all selector lists
      // add an id
      _cssTree["default"].walk(ast, {
        visit: "Selector",
        enter: function enter(node, item, list) {
          var children = node.children;
          children.prepend(children.createItem({
            type: "WhiteSpace",
            value: " "
          }));
          children.prepend(children.createItem({
            type: "IdSelector",
            name: id,
            loc: null,
            children: null
          }));
        }
      });
    }
  }, {
    key: "getNamedPageSelectors",
    value: function getNamedPageSelectors(ast) {
      var namedPageSelectors = {};
      _cssTree["default"].walk(ast, {
        visit: "Rule",
        enter: function enter(node, item, list) {
          _cssTree["default"].walk(node, {
            visit: "Declaration",
            enter: function enter(declaration, dItem, dList) {
              if (declaration.property === "page") {
                var value = declaration.value.children.first();
                var name = value.name;
                var selector = _cssTree["default"].generate(node.prelude);
                namedPageSelectors[name] = {
                  name: name,
                  selector: selector
                };

                // dList.remove(dItem);

                // Add in page break
                declaration.property = "break-before";
                value.type = "Identifier";
                value.name = "always";
              }
            }
          });
        }
      });
      return namedPageSelectors;
    }
  }, {
    key: "replaceIds",
    value: function replaceIds(ast) {
      _cssTree["default"].walk(ast, {
        visit: "Rule",
        enter: function enter(node, item, list) {
          _cssTree["default"].walk(node, {
            visit: "IdSelector",
            enter: function enter(idNode, idItem, idList) {
              var name = idNode.name;
              idNode.flags = null;
              idNode.matcher = "=";
              idNode.name = {
                type: "Identifier",
                loc: null,
                name: "data-id"
              };
              idNode.type = "AttributeSelector";
              idNode.value = {
                type: "String",
                loc: null,
                value: "\"".concat(name, "\"")
              };
            }
          });
        }
      });
    }
  }, {
    key: "imports",
    value: function imports(node, item, list) {
      var _this7 = this;
      // console.log("import", node, item, list);
      var queries = [];
      _cssTree["default"].walk(node, {
        visit: "MediaQuery",
        enter: function enter(mqNode, mqItem, mqList) {
          _cssTree["default"].walk(mqNode, {
            visit: "Identifier",
            enter: function enter(identNode, identItem, identList) {
              queries.push(identNode.name);
            }
          });
        }
      });

      // Just basic media query support for now
      var shouldNotApply = queries.some(function (query, index) {
        var q = query;
        if (q === "not") {
          q = queries[index + 1];
          return !(q === "screen" || q === "speech");
        } else {
          return q === "screen" || q === "speech";
        }
      });
      if (shouldNotApply) {
        return;
      }
      _cssTree["default"].walk(node, {
        visit: "String",
        enter: function enter(urlNode, urlItem, urlList) {
          var href = urlNode.value.replace(/["']/g, "");
          var url = new URL(href, _this7.url);
          var value = url.toString();
          _this7.imported.push(value);

          // Remove the original
          list.remove(item);
        }
      });
    }
  }, {
    key: "text",
    get: function get() {
      return this._text;
    }

    // generate string
    ,
    set: function set(t) {
      this._text = t;
    }
  }, {
    key: "toString",
    value: function toString(ast) {
      return _cssTree["default"].generate(ast || this.ast);
    }
  }]);
  return Sheet;
}();
var _default = Sheet;
exports["default"] = _default;