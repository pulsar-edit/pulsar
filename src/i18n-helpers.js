const _ = require('underscore-plus');
const fs = require("fs");
const path = require("path");
const { parse } = require("@formatjs/icu-messageformat-parser");

class I18nCacheHelper {
  constructor({ configDirPath, i18n }) {
    /**
     * cachedASTs[ns][lang] = string objs
     * (same shape as registeredStrings but with ASTs instead of strings)
     */
    this.cachedASTs = {};
    /** @type {string} */
    this.configDirPath = configDirPath;
    this.i18n = i18n;

    this.loadCaches();

    this.debouncedCleanAndSave = _.debounce(() => {
      this.cleanCaches(this.i18n.registeredStrings);
      this.saveCaches();
    }, 5_000);
  }

  fetchAST(ns, _path, str, lang) {
    let path = [ns, lang, ..._path];

    let ast = optionalTravelDownObjectPath(
      this.cachedASTs,
      path
    );
    if (ast && "_AST" in ast) return ast._AST;

    ast = parse(str, {
      // requiresOtherClause
    });

    let lastBit = path.pop();
    let cachePath = travelDownOrMakePath(this.cachedASTs, path);
    cachePath[lastBit] = { _AST: ast };

    this.debouncedCleanAndSave();

    return ast;
  }

  /**
   * go through `this.cachedASTs`, find stuff that doesn't exist in `registeredStrings`,
   * then yeet them
   */
  cleanCaches(registeredStrings, cachedASTs) {
    if (!cachedASTs) cachedASTs = this.cachedASTs;

    Object.entries(cachedASTs).forEach(([k, cachedValue]) => {
      let registeredValue = registeredStrings[k];

      // path doesn't exist
      if (!registeredValue) return delete cachedASTs[k];

      // path is an object
      if (typeof registeredValue === "object") {
        // cached is not AST (plain obj) (good)
        if (
          typeof cachedValue === "object"
          && !("_AST" in cachedValue)
        ) return this.cleanCaches(registeredValue, cachedValue);
        // cached is AST (bad)
        return delete cachedASTs[k];
      }

      // path is a string
      if (typeof registeredValue === "string") {
        // cached is AST (good)
        if ("_AST" in cachedValue) return;
        // cached is not AST (bad)
        return delete cachedASTs[k];
      }
    });
  }

  saveCaches() {
    let cachedir = path.join(
      this.configDirPath,
      "compile-cache",
      "i18n"
    );
    fs.mkdirSync(cachedir, { recursive: true });

    let cachefile = path.join(cachedir, "strings.json");
    fs.writeFileSync(cachefile, JSON.stringify(this.cachedASTs));
  }

  loadCaches() {
    let cachefile = path.join(
      this.configDirPath,
      "compile-cache",
      "i18n",
      "strings.json"
    );
    if (fs.existsSync(cachefile)) {
      this.cachedASTs = JSON.parse(fs.readFileSync(cachefile, "utf-8"));
    }
  }
}

function walkStrings(strings, cb, accum = []) {
  Object.entries(strings).forEach(([k, v]) => {
    if (typeof v === "string") cb([...accum, k], v, true);
    else if (typeof v === "object") {
      cb([...accum, k], null, false);
      walkStrings(v, cb, [...accum, k]);
    }
  });
}

function travelDownObjectPath(obj, path) {
  for (const pathFragment of path) {
    obj = obj[pathFragment];
  }
  return obj;
}

function optionalTravelDownObjectPath(obj, path) {
  for (const pathFragment of path) {
    obj = obj[pathFragment];
    if (!obj) return undefined;
  }
  return obj;
}

function travelDownOrMakePath(obj, path) {
  for (const pathFragment of path) {
    if (!obj[pathFragment]) obj[pathFragment] = {};
    obj = obj[pathFragment];
  }
  return obj;
}

module.exports = {
  I18nCacheHelper,
  walkStrings,
  travelDownObjectPath,
  optionalTravelDownObjectPath
};
