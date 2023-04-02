const { splitKeyPath } = require("key-path-helpers");
const fs = require("fs-plus");
const path = require("path");
const { default: IntlMessageFormat } = require("intl-messageformat");
const {
  I18nCacheHelper,
  walkStrings,
  travelDownObjectPath,
  optionalTravelDownObjectPath,
  travelDownOrMakePath
} = require("./i18n-helpers");

class I18n {
  constructor({ notificationManager, config }) {
    this.notificationManager = notificationManager;
    this.config = config;
    this.initialized = false;

    /** registeredStrings[ns][lang] = string objs */
    this.registeredStrings = { core: {} };
    this.cachedFormatters = {};
  }

  initialize({ configDirPath, packages, resourcePath }) {
    /** @type {string} */
    this.configDirPath = configDirPath;
    this.packages = packages;
    /** @type {string} */
    this.resourcePath = resourcePath;
    /** @type {I18nCacheHelper} */
    this.cacheHelper = new I18nCacheHelper({ configDirPath, i18n: this });

    const ext = ".json";
    const extlen = ext.length;
    const dirpath = path.join(resourcePath, "i18n");
    const dircontents = fs.readdirSync(dirpath);

    let languageTypes = dircontents.filter(p => p.endsWith(ext))
      .map(p => p.substring(0, p.length - extlen))
      .map(p => ({
        value: p,
        description: `${new Intl.DisplayNames(p, { type: "language" }).of(p)} (${p})`
      }));

    this.config.setSchema("core.languageSettings", {
      type: "object",
      description: "These settings currently require a full restart of Pulsar to take effect.",
      properties: {
        primaryLanguage: {
          type: "string",
          order: 1,
          default: "en",
          enum: languageTypes
        },
        fallbackLanguages: {
          type: "array",
          order: 2,
          description: "List of fallback languages, if something can't be found in the primary language. Note; `en` is always the last fallback language, to ensure that things at least show up.",
          default: [],
          items: {
            // Array enum is meh, if you pause for the briefest moment and you
            // didn't stop at a valid enum value, the entry you just typed gets yeeted
            type: "string"
          }
        }
      }
    });

    this.updateConfigs();

    atom.packages.onDidDeactivatePackage(pkg => {
      if (pkg.name in this.registeredStrings) {
        delete this.registeredStrings[pkg.name];
      }
    });

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

    this.initialized = true;
  }

  updateConfigs() {
    this.primaryLanguage = this.config.get("core.languageSettings.primaryLanguage");
    this.fallbackLanguages = this.config.get("core.languageSettings.fallbackLanguages");
  }

  registerStrings(packageId, strings) {
    if (!this.registeredStrings[packageId]) this.registeredStrings[packageId] = {};

    walkStrings(strings, (path, string, isString) => {
      let last = path.pop();

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
  format(ns, _path, str, lang, opts) {
    let path = [ns, lang, ..._path];

    let cachedFormatter = optionalTravelDownObjectPath(this.cachedFormatters, path);
    if (cachedFormatter) return cachedFormatter.format(opts);

    let ast = this.cacheHelper.fetchAST(ns, _path, str, lang);
    let formatter = new IntlMessageFormat(ast, lang);

    let last = path.pop();
    let cachePath = travelDownOrMakePath(this.cachedFormatters, path);
    cachePath[last] = formatter;
    return formatter.format(opts);
  }
}

module.exports = I18n;
