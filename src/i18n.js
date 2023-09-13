const { default: IntlMessageFormat } = require("intl-messageformat");
const { parse: parseString } = require("@formatjs/icu-messageformat-parser");

class Language {
  /**
   * @param {object} opts
   * @param {string} opts.locale
   * @param {{ [k: string]: LanguageStrings }} opts.strings
   * @param {{ [k: string]: LanguageASTCache }} [opts.cachedASTs]
   */
  constructor({ locale, strings, cachedASTs }) {
    this.strings = strings;
    this.locale = locale;
    this.cachedASTs = cachedASTs || {};
    /** @type {{ [k: string]: SinglePackageLanguage }} */
    this.packageLanguages = {};
  }

  /**
   * @param {string} keystr
   * @param {{ [k: string]: string }} opts
   * @return {string | undefined}
   */
  tMaybe(keystr, opts = {}) {
    const nsIndex = keystr.indexOf(".");
    if (nsIndex < 0) return;

    const pkgName = keystr.substring(0, nsIndex);
    const keystrWithoutPkgName = keystr.substring(nsIndex + 1);

    const pkg = this._getPackageObj(pkgName);
    return pkg?.tMaybe(keystrWithoutPkgName, opts);
  }

  /**
   * @param {string} pkgName
   */
  _getPackageObj(pkgName) {
    if (this.packageLanguages[pkgName]) return this.packageLanguages[pkgName];
    if (!this.strings[pkgName]) return;

    this.cachedASTs[pkgName] ??= { keys: {} };

    this.packageLanguages[pkgName] = new SinglePackageLanguage({
      locale: this.locale,
      strings: this.strings[pkgName],
      cachedASTs: this.cachedASTs[pkgName]
    });

    return this.packageLanguages[pkgName];
  }

  /**
   * @param {object} opts
   * @param {string} opts.pkgName
   * @param {LanguageStrings} opts.strings
   * @param {LanguageASTCache} [opts.cachedASTs]
   */
  addOrReplaceStringsForPackage({ pkgName, strings, cachedASTs }) {
    this.strings[pkgName] = strings;
    this.cachedASTs[pkgName] = cachedASTs || { keys: {} };
    delete this.packageLanguages[pkgName];
    // side effect: `this.packageLanguages[pkgName]` gets remade
    this._getPackageObj(pkgName);
  }
}

class SinglePackageLanguage {
  /**
   * @param {object} opts
   * @param {string} opts.locale
   * @param {LanguageStrings} opts.strings
   * @param {LanguageASTCache} [opts.cachedASTs]
   */
  constructor({ locale, strings, cachedASTs }) {
    this.strings = strings;
    this.locale = locale;
    this.cachedASTs = cachedASTs || { keys: {} };
    /** @type {LanguageFormatterCache} */
    this.cachedFormatters = {};
  }

  /**
   * @param {string} keystr
   * @param {{ [k: string]: string }} opts
   * @return {string | undefined}
   */
  tMaybe(keystr, opts = {}) {
    const key = keystr.split(".");
    guardPrototypePollution(key);

    const formatter = this._getFormatterMaybe(key);
    if (formatter) {
      const formatted = /** @type {string} */ (formatter.format(opts));
      return formatted;
    }
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

      /** @type {AST} */
      const ast = {
        ast: parseString(string)
      };

      value.keys[last] = ast;
      return ast;
    }

    const v = value.keys[last];
    if (isAST(v)) {
      return v;
    }
  }

  /**
   * @param {Array<string>} key
   * @return {string | undefined}
   */
  _getStringMaybe(key) {
    let value = this.strings;

    const lastKeyPos = key.length - 1;
    for (let i = 0; i < lastKeyPos; i++) {
      const k = key[i];
      const v = value[k];
      if (!v || typeof v === "string") {
        return;
      }
      value = v;
    }

    const last = key[lastKeyPos]
    const v = value[last];
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
