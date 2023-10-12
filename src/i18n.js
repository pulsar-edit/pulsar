const fs = require("fs-plus");
const path = require("path");
const season = require("season");
const { default: IntlMessageFormat } = require("intl-messageformat");
const { parse: parseToAST } = require("@formatjs/icu-messageformat-parser");

/**
 * @type {Array<{
 *   ext: string;
 *   parse: (s: string) => any
 * }>}
 */
const supportedFileExts = [
  {
    ext: "cson",
    parse: str => season.parse(str)
  },
  {
    ext: "json",
    parse: str => JSON.parse(str)
  }
];

module.exports = class I18n {
  /**
   * @param {object} opts
   * @param {import("./config")} opts.config
   */
  constructor({ config }) {
    this.config = config;
    /** @type {Array<string>} */
    this.locales = [];
    this.localisations = new Localisations();
    this.resourcePath = "";

    this.config.setSchema("core.languageSettings", {
      type: "object",
      description: "These settings currently require a full restart to take effect",
      properties: {
        primaryLanguage: {
          type: "string",
          order: 1,
          default: "en",
          // TODO get available languages for enum purposes
        },
        fallbackLanguages: {
          type: "array",
          order: 2,
          description: "List of fallback languages in case something is not translated in your primary language. Note: `en` is always the last fallback language, to ensure that things at least show up.",
          default: [],
          items: {
            type: "string"
            // TODO consider array enum when enum array options are improved in settings UI?
          }
        }
      }
    });
  }

  /**
   * @param {object} opts
   * @param {string} opts.resourcePath
   */
  initialise({ resourcePath }) {
    this.locales = [
      this.config.get("core.languageSettings.primaryLanguage"),
      ...this.config.get("core.languageSettings.fallbackLanguages"),
      "en"
    ].map(l => l.toLowerCase());
    this.resourcePath = resourcePath;

    this.localisations.initialise({ locales: this.locales }); // TODO ast cache

    this._loadStringsForCore();
  }

  /**
   * @param {Key} keystr
   * @param {Opts} opts
   */
  t(keystr, opts = {}) {
    return this.localisations.t(keystr, opts);
  }

  /**
   * @param {string} ns
   */
  getT(ns) {
    /**
     * @param {Key} keystr
     * @param {Opts} opts
     */
    return (keystr, opts = {}) => this.t(`${ns}.${keystr}`, opts);
  }

  _loadStringsForCore() {
    this._loadStringsAt("core", path.join(this.resourcePath, "i18n"));
  }

  /**
   * @param {object} obj
   * @param {string} obj.pkgName
   * @param {string} obj.pkgPath
   */
  loadStringsForPackage({ pkgName, pkgPath }) {
    this._loadStringsAt(pkgName, path.join(pkgPath, "i18n"));
  }

  /**
   * @param {string} pkgName
   * @param {string} i18nDirPath path to the i18n dir with the files in it
   */
  _loadStringsAt(pkgName, i18nDirPath) {
    if (!fs.existsSync(i18nDirPath)) return;

    /** @type {Array<string>} */
    const filesArray = fs.readdirSync(i18nDirPath);
    // set search performance is supposed to be better than array
    const files = new Set(filesArray.map(f => f.toLowerCase()));

    /** @type {PackageStrings} */
    const packageStrings = {};
    this.locales.forEach(locale => {
      const ext = supportedFileExts.find(({ ext }) => files.has(`${locale}.${ext}`));
      if (!ext) return;

      const filename = `${locale}.${ext.ext}`;
      const filepath = path.join(i18nDirPath, filename);

      const strings = fs.readFileSync(filepath, "utf8");
      packageStrings[locale] = ext.parse(strings);
    });
    this.localisations.addPackage({
      pkgName,
      strings: packageStrings
    });
  }
}

class Localisations {
  constructor() {
    /** @type {Array<string>} */
    this.locales = [];
    /** @type {{ [k: string]: PackageLocalisations }} */
    this.packages = {};
  }

  /**
   * @param {object} opts
   * @param {Array<string>} opts.locales
   * @param {AllAstCache} [opts.asts]
   */
  initialise({ locales, asts }) {
    this.locales = locales;
    this.asts = asts;
  }

  /**
   * @param {Key} keystr
   * @param {Opts} opts
   */
  t(keystr, opts = {}) {
    let key = keystr.split(".");
    if (key.length < 2) return fallback(keystr, opts);

    guardPrototypePollution(key);

    const pkgName = key[0];
    key = key.slice(1);
    return this.packages[pkgName]?.t(key, opts) ?? fallback(keystr, opts);
  }

  /**
   * @param {object} opts
   * @param {string} opts.pkgName
   * @param {PackageStrings} opts.strings
   */
  addPackage({ pkgName, strings }) {
    this.packages[pkgName] = new PackageLocalisations({
      locales: this.locales,
      strings,
      asts: this.asts?.[pkgName]
    });
  }
}

/**
 * manages strings of all languages for a single package
 * (in other words, manages `PackageLocalisations` instances)
 */
class PackageLocalisations {
  /**
   * @param {object} opts
   * @param {Array<string>} opts.locales
   * @param {PackageStrings} opts.strings
   * @param {PackageASTCache} [opts.asts]
   */
  constructor({ locales, strings: _strings, asts }) {
    this.locales = locales;
    /** @type {PackageASTCache} */
    this.asts = asts ?? {};
    /** @type {{ [k: string]: SingleLanguageLocalisations }} */
    this.localeObjs = {};

    for (const [locale, strings] of Object.entries(_strings)) {
      this.localeObjs[locale] = new SingleLanguageLocalisations({
        locale,
        strings,
        asts: (this.asts[locale] = this.asts[locale] ?? { items: {} })
      });
    }
  }

  /**
   * @param {SplitKey} key
   * @param {Opts} opts
   */
  t(key, opts = {}) {
    for (const locale of this.locales) {
      const localised = this.localeObjs[locale]?.t(key, opts);
      if (localised) return localised;
    }
  }
}

/**
 * manages strings for a single locale of a single package
 */
// TODO someone please help me find a better name ~meadowsys
class SingleLanguageLocalisations {
  /**
   * @param {object} opts
   * @param {string} opts.locale
   * @param {Strings} opts.strings
   * @param {ASTCache} [opts.asts]
   */
  constructor({ locale, strings, asts }) {
    this.locale = locale;
    this.strings = strings;
    /** @type {ASTCache} */
    this.asts = asts ?? { items: {} };
    /** @type {FormatterCache} */
    this.formatters = {};
  }

  /**
   * @param {SplitKey} key
   * @param {Opts} opts
   */
  t(key, opts = {}) {
    const formatter = this._getFormatter(key);
    if (formatter) {
      const formatted = /** @type {string} */ (formatter.format(opts));
      return formatted;
    }
  }

  /**
   * @param {SplitKey} key
   */
  _getFormatter(key) {
    let value = this.formatters;

    const lastKeyPos = key.length - 1;
    for (let i = 0; i < lastKeyPos; i++) {
      const k = key[i];
      const v = value[k];

      if (!v) {
        /** @type {FormatterCache} */
        const cache = {};
        value[k] = cache;
        value = cache;
        continue;
      }
      if (v instanceof IntlMessageFormat) return;
      value = v;
    }

    const k = key[lastKeyPos];
    const v = value[k];

    if (!v) {
      const ast = this._getAST(key);
      if (!ast) return;

      const formatter = new IntlMessageFormat(ast.ast, this.locale);
      value[k] = formatter;
      return formatter;
    }

    if (v instanceof IntlMessageFormat) return v;
  }

  /**
   * @param {SplitKey} key
   */
  _getAST(key) {
    let value = this.asts;

    const lastKeyPos = key.length - 1;
    for (let i = 0; i < lastKeyPos; i++) {
      const k = key[i];
      const v = value.items[k];

      if (!v) {
        /** @type {ManyASTs} */
        const cache = { items: {} };
        value[k] = cache;
        value = cache;
        continue;
      }
      if (isAST(v)) return;
      value = v;
    }

    const k = key[lastKeyPos];
    const v = value.items[k];

    if (!v) {
      const string = this._getString(key);
      if (!string) return;

      /** @type {AST} */
      const ast = {
        ast: parseToAST(string)
      };

      value.items[k] = ast;
      return ast;
    }

    if (isAST(v)) return v;
  }

  /**
   * @param {SplitKey} key
   */
  _getString(key) {
    let value = this.strings;

    const lastKeyPos = key.length - 1;
    for (let i = 0; i < lastKeyPos; i++) {
      const k = key[i];
      const v = value[k];

      if (!v || typeof v === "string") return;
      value = v;
    }

    const k = key[lastKeyPos];
    const v = value[k];
    if (typeof v === "string") return v;
  }
}

/**
 * @param {OneOrManyASTs} obj
 * @return {obj is AST}
 */
function isAST(obj) {
  return "ast" in obj;
}

/**
 * @param {SplitKey} key
 */
function guardPrototypePollution(key) {
  if (key.includes("__proto__")) {
    throw new Error(`prototype pollution in key "${key.join(".")}" was detected and prevented`);
  }
}

/**
 * @param {Key} keystr
 * @param {Opts} opts
 */
function fallback(keystr, opts) {
  const optsArray = Object.entries(opts);
  if (optsArray.length === 0) return keystr;

  return `${keystr}: { ${
    optsArray
      .map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`)
      .join(", ")
  } }`;
}

/**
 * "basic" types
 * @typedef {import("@formatjs/icu-messageformat-parser").MessageFormatElement} MessageFormatElement
 * @typedef {{ ast: Array<MessageFormatElement> }} AST
 * @typedef {{ items: { [k: string]: OneOrManyASTs } }} ManyASTs
 * @typedef {AST | ManyASTs} OneOrManyASTs
 *
 * @typedef {string} Key
 * @typedef {Array<string>} SplitKey
 * @typedef {{ [k: string]: string }} Opts
 */
/**
 * types for `Localisations`
 * @typedef {{ [k: string]: PackageStrings }} AllStrings
 * @typedef {{ [k: string]: PackageASTCache }} AllAstCache
 */
/**
 * types for `PackageLocalisations`
 * @typedef {{ [k: string]: Strings }} PackageStrings
 * @typedef {{ [k: string]: ASTCache }} PackageASTCache
 */
/**
 * used in `SingleLanguageLocalisations`
 * @typedef {{ [k: string]: string | Strings }} Strings
 * @typedef {ManyASTs} ASTCache
 * @typedef {{ [k: string]: IntlMessageFormat | FormatterCache }} FormatterCache
 */
