
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
    // Defer require for all language id files. First call for an given one will
    // be expensive, but due to the module cache, should be fine afterwards
    // plus only requiring the one needed, should result in less wasted memory
    case "chroma":
      languageIds = require("./language-ids/chroma.js");
      break;
    case "highlightjs":
      languageIds = require("./language-ids/highlightjs.js");
      break;
    case "rouge":
      languageIds = require("./language-ids/rouge.js");
      break;
    case "linguist":
    default:
      languageIds = require("./language-ids/linguist.js");
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
  scopeForFenceName(fenceName) {
    fenceName = fenceName.toLowerCase()

    let scopesByFenceName = getLanguageIds();

    return scopesByFenceName.hasOwnProperty(fenceName)
      ? scopesByFenceName[fenceName]
      : `source.${fenceName}`
  }
}
