const linguist = require("./language-ids/linguist.js");
const chroma = require("./language-ids/chroma.js");
const highlightjs = require("./language-ids/highlightjs.js");
const rouge = require("./language-ids/rouge.js");

function getUserLanguageIds() {
  try {
    let usersLanguageIDs = atom.config.get("markdown-preview.customSyntaxHighlightingLanguageIdentifiers");

    let obj = {};

    // Bail early if empty
    if (usersLanguageIDs.length === 0) {
      return obj;
    }

    let pairs = usersLanguageIDs.split(",");

    for (let i = 0; i < pairs.length; i++) {
     let split = pairs[i].split(":");
    obj[split[0].trim()] = split[1].trim();
    }

    return obj;

  } catch(err) {
    atom.notifications.addError(`Unable to load Markdown Preview Custom Syntax Highlighting Language Identifiers\n${err.toString()}`);
    return {};
  }
}

function getLanguageIds() {

  let preferredLanguageID = atom.config.get("markdown-preview.syntaxHighlightingLanguageIdentifier");
  let usersLanguageIDs = getUserLanguageIds();

  let languageIds;

  switch(preferredLanguageID) {
    case "chroma":
      languageIds = chroma;
      break;
    case "highlightjs":
      languageIds = highlightjs;
      break;
    case "rouge":
      languageIds = rouge;
      break;
    case "linguist":
    default:
      languageIds = linguist;
      break;
  }

  if (Object.keys(usersLanguageIDs).length > 0) {
    for (let key in usersLanguageIDs) {
      languageIds[key] = usersLanguageIDs[key];
    }
  }

  return languageIds;
}

module.exports = {
  scopeForFenceName (fenceName) {
    fenceName = fenceName.toLowerCase()

    let scopesByFenceName = getLanguageIds();

    return scopesByFenceName.hasOwnProperty(fenceName)
      ? scopesByFenceName[fenceName]
      : `source.${fenceName}`
  }
}
