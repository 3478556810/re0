"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cleanPseudoContent = cleanPseudoContent;
exports.cleanSelector = cleanSelector;
function cleanPseudoContent(el) {
  var trim = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "\"' ";
  if (el == null) return;
  return el.replace(new RegExp("^[".concat(trim, "]+")), "").replace(new RegExp("[".concat(trim, "]+$")), "").replace(/["']/g, function (match) {
    return "\\" + match;
  }).replace(/[\n]/g, function (match) {
    return "\\00000A";
  });
}
function cleanSelector(el) {
  if (el == null) return;
  return el.replace(new RegExp("::footnote-call", "g"), "").replace(new RegExp("::footnote-marker", "g"), "");
}