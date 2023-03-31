const { parse } = require("@formatjs/icu-messageformat-parser");

class I18nCacheHelper {
  constructor() {
    /** cachedASTs[ns][lang] = string objs */
    this.cachedASTs = {};
  }

  fetchAST(ns, _path, str, lang) {
    let path = [ns, lang, ..._path];

    let ast = optionalTravelDownObjectPath(
      this.cachedASTs,
      path
    );
    if (ast) return ast;

    ast = parse(str, {
      // requiresOtherClause
    });

    let lastBit = path.pop();
    let cachePath = travelDownOrMakePath(this.cachedASTs, path);
    cachePath[lastBit] = ast;

    return ast;
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
