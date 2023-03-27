const { CompositeDisposable } = require('atom');
const { splitKeyPath } = require("key-path-helpers");
const fs = require("fs-plus");
const path = require("path");
const { default: IntlMessageFormat } = require("intl-messageformat");

class I18n {
  /**
   * @param {{
   *   notificationManager: import("./notification-manager");
   * }}
   */
  constructor({ notificationManager, config }) {
    this.notificationManager = notificationManager;
    this.config = config;
    this.initialized = false;

    /**
     * {
     *   [ns (package id)]: {
     *     [language id]: {
     *       string objects without core ns
     *     }
     *   }
     * }
     *
     * @type {object}
     */
    this.registeredStrings = { core: {} };

    this.cachedFormatters = {};

    // TODO string parse cache (load on init, save on destroy too)

    // TODO atom.packages.onDidDeactivatePackage

    this.t = (key, opts) => {
      const path = splitKeyPath(key);

      // primary
      const str = this.tSingleLanguage(this.primaryLanguage, path, opts);
      if (str) return str;

      // fallbacks
      for (const lang of this.fallbackLanguages) {
        const str = this.tSingleLanguage(lang, path, opts);
        if (str) return str;
      }

      // `en` fallback
      return this.tSingleLanguage("en", path, opts);
    }
  }

  initialize({ packages, resourcePath }) {
    this.packages = packages;
    /** @type {string} */
    this.resourcePath = resourcePath;

    const ext = ".json";
    const extlen = ext.length;
    const dirpath = path.join(resourcePath, "i18n");
    const dircontents = fs.readdirSync(dirpath);

    this.config.setSchema("core.languageSettings.primaryLanguage", {
      type: "string",
      order: 1,
      default: "en",
      enum: dircontents.filter(p => p.endsWith(ext))
        .map(p => p.substring(0, p.length - extlen))
        .map(p => ({
          value: p,
          description: `${new Intl.DisplayNames(p, { type: "language" }).of(p)} (${p})`
        }))
    });

    this.updateConfigs();
    this.initialized = true;
  }

  updateConfigs() {
    /** @type {string} */
    this.primaryLanguage = this.config.get("core.languageSettings.primaryLanguage");
    /** @type {Array<string>} */
    this.fallbackLanguages = this.config.get("core.languageSettings.fallbackLanguages");
  }

  registerStrings(packageId, strings) {
    walkStrings(strings, (path, string, isString) => {
      let last = path.pop();

      if (!this.registeredStrings[packageId]) this.registeredStrings[packageId] = {};
      let obj = travelDownObjectPath(this.registeredStrings[packageId], path);

      if (isString) {
        obj[last] = string;
      } else if (!obj[last]) {
        obj[last] = {};
      }
    });
  }

  getT(ns) {
    if (!ns) return this.t;
    return (key, formats) => this.t(`${ns}.${key}`, formats);
  }

  /**
   * attempts to translate for a single language, given a preparsed path array.
   * @return undefined if the language or string cannot be found,
   *   and throws an error if the path isn't right.
   */
  tSingleLanguage(lang, path, opts) {
    path = [...path];

    const ns = path.shift();
    if (!ns) throw new Error(`key path seems invalid: [${path.map(p => `"${p}"`).join(", ")}]`);

    const languageObj = this.getLanguageObj(ns, lang);
    if (!languageObj) return undefined;

    const str = optionalTravelDownObjectPath(languageObj, path);
    if (str) {
      return this.format(path, str, lang, opts);
    } else {
      return undefined;
    }
  }

  /**
   * gets a language object from a specified namespace
   * @return undefined if it can't be found
   */
  getLanguageObj(ns, lang) {
    return ns === "core"
      ? this.getCoreLanguage(lang)
      : this.getPkgLanguage(ns, lang);
  }

  /**
   * gets a language for `core`
   * @return undefined if it can't be found
   */
  getCoreLanguage(lang) {
    const loaded = this.registeredStrings.core[lang]
    if (loaded) return loaded;

    const fetched = this.fetchCoreLanguageFile(lang);
    if (!fetched) return undefined;

    this.registeredStrings.core[lang] = fetched;
    return fetched;
  }

  /**
   * gets a language for a specific namespace
   * @return undefined if it can't be found
   */
  getPkgLanguage(ns, lang) {
    const loaded = this.registeredStrings[ns]?.[lang];
    if (loaded) return loaded;

    const fetched = this.fetchPkgLanguageFile(ns, lang);
    if (!fetched) return fetched;

    if (!this.registeredStrings[ns]) this.registeredStrings[ns] = {};
    this.registeredStrings[ns][lang] = fetched;
  }

  /**
   * fetches a core language from the disk
   * @return undefined if it can't be found
   */
  fetchCoreLanguageFile(lang) {
    let filepath = path.join(this.resourcePath, "i18n", `${lang}.json`);
    let contents = JSON.parse(fs.readFileSync(filepath));

    return contents;
  }

  /**
   * fetches a language for a specific namespace
   * @return undefined if it can't be found
   */
  fetchPkgLanguageFile(ns, lang) {
    // TODO this could probably be optimised
    let packages = this.packages.getAvailablePackages();
    // let package = packages.find(p => p.name === ns);
    let foundPackage = packages.find(p => p.name === ns);

    const i18nDir = path.join(foundPackage.path, "i18n");
    const langfile = path.join(i18nDir, `${lang}.json`);

    if (!(fs.isDirectorySync(i18nDir) && fs.existsSync(langfile))) return;

    let contents = JSON.parse(fs.readFileSync(langfile));

    return contents;
  }

  /**
   * formats a string with opts,
   * and caches the message formatter for the provided path.
   */
  format(path, str, locale, opts) {
    // TODO caching
    let formatter = new IntlMessageFormat(str, locale, null, {
      // requiresOtherClause
    });
    return formatter.format(opts);
  }
}

module.exports = I18n;

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
