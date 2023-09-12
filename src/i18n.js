const { default: IntlMessageFormat } = require("intl-messageformat");
const { parse: parseString } = require("@formatjs/icu-messageformat-parser");

class Language {
  constructor({ langStrings, locale, cachedASTs }) {
    /** @type {LanguageStrings} */
    this.langStrings = langStrings || {};
    /** @type {string} */
    this.locale = locale;
    /** @type {LanguageASTCache} */
    this.cachedASTs = cachedASTs || {};
    /** @type {LanguageFormatterCache} */
    this.cachedFormatters = {};
  }

  /**
   * @param {string} keystr
   * @param {{ [k: string]: string }} opts
   * @return {string}
   */
  t(keystr, opts = {}) {
    const key = keystr.split(".");
    guardPrototypePollution(key);

    const formatter = this._getFormatterMaybe(key);
    if (formatter) {
      const formatted = /** @type {string} */ (formatter.format(opts));
      return formatted;
    }
    return keystr;
  }

  /**
   * @param {Array<string>} key
   * @return {IntlMessageFormat | undefined}
   */
  _getFormatterMaybe(key) {
    let value = this.cachedFormatters;

    // iterate through all parts of the key except the last
    // we shall check that manually
    const lastKeyPos = key.length - 1;
    for (let i = 0; i < lastKeyPos; i++) {
      // value should always be LanguageFormatterCache at the start of this block
      const k = key[i];
      const v = value[k];

      if (!v) {
        /** @type {LanguageFormatterCache} */
        const cache = {};
        value[k] = cache;
        value = cache;
        continue;
      }

      if (v instanceof IntlMessageFormat) {
        return;
      }

      value = v;
    }

    const last = key[lastKeyPos];

    if (!value[last]) {
      const ast = this._getASTMaybe(key);
      if (!ast) return;

      const formatter = new IntlMessageFormat(ast.ast, this.locale);
      value[last] = formatter;
      return formatter;
    }

    const v = value[last];
    if (v instanceof IntlMessageFormat) {
      return v;
    }

    return;
  }

  /**
   * @param {Array<string>} key
   * @return {AST | undefined}
   */
  _getASTMaybe(key) {
    let value = this.cachedASTs;

    const lastKeyPos = key.length - 1;
    for (let i = 0; i < lastKeyPos; i++) {
      const k = key[i];
      const v = value.keys[k];

      if (!v) {
        /** @type {LanguageASTCache} */
        const cache = { keys: {} };
        value.keys[k] = cache;
        value = cache;
        continue;
      }

      if (isAST(v)) {
        return;
      }

      value = v;
    }

    const last = key[lastKeyPos];

    if (!value.keys[last]) {
      const string = this._getStringMaybe(key);
      if (!string) return;

      const ast = parseString(string);
      return { ast };
    }

    const v = value.keys[last]
    if (isAST(v)) {
      return v;
    }

    return;
  }

  /**
   * @param {Array<string>} key
   * @return {string | undefined}
   */
  _getStringMaybe(key) {
    let value = this.langStrings;

    const lastKeyPos = key.length - 1;
    for (let i = 0; i < lastKeyPos; i++) {
      const k = key[i];
      const v = value[k];
      if (!v || typeof v === "string") {
        return;
      }
      value = v;
    }

    const v = value[lastKeyPos];
    if (typeof v === "string") return v;
  }
}

/**
 * @param {CacheOrAST} obj
 * @return {obj is AST}
 */
function isAST(obj) {
  return "ast" in obj;
}

/**
 * @param {Array<string>} key
 */
function guardPrototypePollution(key) {
  if (key.indexOf("__proto__") >= 0) {
    throw new Error(`prototype pollution in key "${key.join(".")}" was detected and prevented`);
  }
}

/**
 * @typedef {import("@formatjs/icu-messageformat-parser").MessageFormatElement} MessageFormatElement
 * @typedef {{ ast: Array<MessageFormatElement> }} AST
 * @typedef {{ keys: { [x: string]: CacheOrAST } }} LanguageASTCache
 * @typedef {AST | LanguageASTCache} CacheOrAST
 *
 * @typedef {{ [x: string]: LanguageStrings | string }} LanguageStrings
 * @typedef {{ [x: string]: LanguageFormatterCache | IntlMessageFormat }} LanguageFormatterCache
 */
