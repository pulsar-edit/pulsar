const { splitKeyPath } = require("key-path-helpers");
const fs = require("fs-plus");
const path = require("path");
const { default: IntlMessageFormat } = require("intl-messageformat");
const {
  I18nCacheHelper,
  walkStrings,
  travelDownObjectPath,
  optionalTravelDownObjectPath
} = require("./i18n-helpers");

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

    /** registeredStrings[ns][lang] = string objs */
    this.registeredStrings = { core: {} };

    this.cachedFormatters = {};

    this.cacheHelper = new I18nCacheHelper();

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
      const en_fallback = this.tSingleLanguage("en", path, opts);
      if (en_fallback) return en_fallback;

      // key fallback
      let string_opts = opts
        ? `: { ${
          Object.entries(opts)
            .map(o => `"${o[0]}": "${o[1]}"`)
            .join(", ")
          } }`
        : "";
      return `${key}${string_opts}`;
    }
  }

  initialize({ configDirPath, packages, resourcePath }) {
    /** @type {string} */
    this.configDirPath = configDirPath;
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
  // TODO could be improved: nove string fetching logic into fetch function
  // so the fetch function takes a langobj and a path, and we can then delegate
  // that to the cache too (don't fetch the string if theres already something in the cache)
  tSingleLanguage(lang, _path, opts) {
    let path = [..._path];

    const ns = path.shift();
    if (!ns) throw new Error(`key path seems invalid: [${_path.map(p => `"${p}"`).join(", ")}]`);

    const languageObj = this.getLanguageObj(ns, lang);
    if (!languageObj) return undefined;

    const str = optionalTravelDownObjectPath(languageObj, path);
    if (str) {
      return this.format(ns, path, str, lang, opts);
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
  format(ns, path, str, lang, opts) {
    let ast = this.cacheHelper.fetchAST(ns, path, str, lang);
    let formatter = new IntlMessageFormat(ast, lang);
    return formatter.format(opts);
  }
}

module.exports = I18n;
