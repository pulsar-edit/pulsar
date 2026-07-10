const { pluralize } = require("./helpers");

let escapeNode = null;

function escapeHtml(str) {
  if (!escapeNode) {
    escapeNode = document.createElement("div");
  }
  escapeNode.innerText = str;
  return escapeNode.innerHTML;
}

function escapeRegex(str) {
  return str.replace(/[.?*+^$[\]\\(){}|-]/g, (match) => "\\" + match);
}

function sanitizePattern(pattern) {
  pattern = escapeHtml(pattern);
  return pattern.replace(/\n/g, "\\n").replace(/\t/g, "\\t");
}

function getReplacementResultsMessage({
  findPattern,
  replacePattern,
  replacedPathCount,
  replacementCount,
}) {
  if (replacedPathCount) {
    return `<span class="text-highlight">Replaced <span class="highlight-error">${sanitizePattern(
      findPattern,
    )}</span> with <span class="highlight-success">${sanitizePattern(
      replacePattern,
    )}</span> ${replacementCount} ${pluralize(
      replacementCount,
      "time",
    )} in ${replacedPathCount} ${pluralize(replacedPathCount, "file")}</span>`;
  } else {
    return '<span class="text-highlight">Nothing replaced</span>';
  }
}

function getSearchResultsMessage(results) {
  if (results?.findPattern != null) {
    const { findPattern, matchCount, pathCount, replacedPathCount } = results;
    if (matchCount) {
      return `${matchCount} ${pluralize(
        matchCount,
        "result",
      )} found in ${pathCount} ${pluralize(pathCount, "file")}`;
    } else {
      return `No ${
        replacedPathCount != null ? "more " : ""
      }results found for '${sanitizePattern(findPattern)}'`;
    }
  } else {
    return "";
  }
}

function showIf(condition) {
  if (condition) {
    return null;
  } else {
    return { display: "none" };
  }
}

function capitalize(str) {
  if (str === "") return "";
  return str[0].toUpperCase() + str.toLowerCase().slice(1);
}

function titleize(str) {
  return str.toLowerCase().replace(/(?:^|\s)\S/g, (capital) => capital.toUpperCase());
}

function preserveCase(text, reference) {
  // If replaced text is capitalized (strict) like a sentence, capitalize replacement
  if (reference === capitalize(reference.toLowerCase())) {
    return capitalize(text);
  }
  // If replaced text is titleized (i.e., each word start with an uppercase), titleize replacement
  else if (reference === titleize(reference.toLowerCase())) {
    return titleize(text);
  }
  // If replaced text is uppercase, uppercase replacement
  else if (reference === reference.toUpperCase()) {
    return text.toUpperCase();
  }
  // If replaced text is lowercase, lowercase replacement
  else if (reference === reference.toLowerCase()) {
    return text.toLowerCase();
  } else {
    return text;
  }
}

module.exports = {
  escapeHtml,
  escapeRegex,
  sanitizePattern,
  getReplacementResultsMessage,
  getSearchResultsMessage,
  showIf,
  preserveCase,
};
