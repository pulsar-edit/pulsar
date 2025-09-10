const path = require("path");
const fs = require("fs-plus");
const CSON = require("season");
const keyPathHelpers = require("key-path-helpers");
const IntlMessageFormat = require("intl-messageformat").default;
const { memoize } = require("@formatjs/fast-memoize");

// Truncate trailing subtag, as well as single letter or digit subtags
// which introduce private-use sequences, and extensions, and are not valid
// locale selectors alone.
const LOCALE_LOOKUP_FILTER_TRUNCATE = /(-\w){0,1}-[\w*]*?$/g;

const AUTO_TRANSLATE_LABEL = /^%.+%$/;

function generateLocaleFallback(list, lang) {
  // Breakdown a lang provided into the fallback options
  let locale = lang;
  while(locale.length > 0) {
    if (!locale.includes("-")) {
      // If we have no more subtags to remove
      locale = "";
      break;
    }
    locale = locale.replace(LOCALE_LOOKUP_FILTER_TRUNCATE, "");
    list.add(locale);
  }
  return;
}

module.exports =
class I18n {
  // Provides localeNegotiation in accordance to RFC4647 Lookup Filtering Fallback Pattern
  // Provided a priorityList, primary language, and default language.
  static localeNegotiation(
    primary,
    priorityList,
    fallback = "en" // Hardcoding to ensure we can always fallback to something
  ) {
    // First create the lookup list
    const lookupList = new Set();

    if (typeof primary === "string") {
      // The first entry should be the primary language
      lookupList.add(primary);
      // Provide fallback options from the primary language
      generateLocaleFallback(lookupList, primary);
    }

    if (Array.isArray(priorityList)) {
      for (const lang of priorityList) {
        // Since the first entry should be fully formed, we will add it directly
        lookupList.add(lang);
        // Then we breakdown the lang provided into the fallback options
        generateLocaleFallback(lookupList, lang);
      }
    }

    // After adding all items in the priority list, lets add the default
    lookupList.add(fallback);

    return lookupList;
  }

  // Determines if the provided locale should be loaded. Based on manually
  // provided settings.
  static shouldIncludeLocaleParameterized(locale, opts = {} ) {
    let localeList;

    if (opts.localeList) {
      localeList = opts.localeList;
    } else {
      localeList = I18n.localeNegotiation(opts.primary, opts.priorityList, opts.fallback);
    }

    for (const localeListItem of localeList) {
      if (I18n.doLocalesMatch(localeListItem, locale)) {
        return true;
      }
    }

    return false;
  }

  // Takes a wanted locale, and the locale you have, to determine if they match
  static doLocalesMatch(want, have) {
    if (want == have) {
      return true;
    }
    if (want.endsWith("-*") && have.includes("-")) {
      // Attempt to match with wildcard
      let wantArr = want.split("-");
      let haveArr = have.split("-");
      for (let i = 0; i < wantArr.length; i++) {
        if (wantArr[i] == "*") {
          // wants contains a wildcard match, doesn't matter what the have is
          return true;
        } else if (wantArr[i] != haveArr[i]) {
          return false;
        } // else they equal, and we let the loop continue to check the next place
      }
    } else {
      // As we don't do any fallback behavior here, we can safely say these do
      // not match.
      return false;
    }
  }

  constructor({ config }) {
    this.config = config;
    this.strings = {};
    this.localeFallbackList = null;

    this.preloadComplete = false;

    // Generate our INTL formatters first to speed up later calls to `IntlMessageFormat`
    this.formatters = {
      getNumberFormat: memoize(
        (locale, opts) => new Intl.NumberFormat(locale, opts)
      ),
      getDateTimeFormat: memoize(
        (locale, opts) => new Intl.DateTimeFormat(locale, opts)
      ),
      getPluralRules: memoize(
        (locale, opts) => new Intl.PluralRules(locale, opts)
      )
    };
    console.log("I18n: Constructor completed.");
  }

  preload() {
    // Needed because the built Pulsar version attempts to preload packages, and
    // quickly bootstrap the Pulsar window. Meaning it all happens before our
    // initial `this.initialize()` method is called. And before our config file
    // has actually been read.
    // So we need to attempt to load locales for Pulsar without knowing what
    // languages we should actually support. And we need to ensure bundled/cached
    // packages that are preloaded in a second will succeed in finding the locales
    // they actually should be loading, since otherwise the preload process will
    // ask if they should include a locale from a `null` `this.localeFallbackList`
    // So they won't ever actually load any locales.
    // The best bet here may be to load all locales, and if Pulsar's locales are
    // loaded when initialize is actually called, we attempt a prune task to remove
    // unused strings and lower memory usage of Pulsar.
    // But in the meantime until pruning is implemented, we should instead at least
    // ensure our fallback locale is included. But in the future maybe we should
    // consider setting this value to "*" to match any locale? Will have to check
    // if that even works.
    // As for the initial preload of Pulsar locales before we even have our `resourcePath`
    // We will copy the methodology that `./src/main-process/atom-window.js` uses
    // to determine our 'resourcePath'
    console.log("I18n: preload started");
    this.localeFallbackList = [ "en" ]; // Hardcode our default fallback value
    // ^^^ For now, we may consider a "*" in the future to load all locales, and prune as needed
    let tempPulsarLocalePath = path.resolve(process.resourcesPath, "app.asar", "locales");
    if (!fs.existsSync(tempPulsarLocalePath)) {
      tempPulsarLocalePath = path.resolve(__dirname, "..", "locales"); // `yarn start` CLI run
    }
    if (!fs.existsSync(tempPulsarLocalePath)) {
      tempPulsarLocalePath = path.resolve(__dirname, "..", "..", "resources", "app.asar", "locales");
    }
    console.log(`I18n: preload: tempPulsarLocalePath: '${tempPulsarLocalePath}'`);
    const localesPaths = fs.listSync(tempPulsarLocalePath, ["cson", "json"]);

    for (const localePath of localesPaths) {
      const localeFilePath = localePath.split(".");
      // `pulsar.en-US.json` => `en-US`
      const locale = localeFilePath[localeFilePath.length - 2] ?? "";
      console.log(`I18n: preload: Adding strings for file '${localePath}'`);
      // During preload we load all available locales, and MUST prune them later
      this.addStrings(CSON.readFileSync(localePath) || {}, locale);
    }
    console.log("I18n: preload complete");
    this.preloadComplete = true;
  }

  // Helps along with initial setup
  initialize({ resourcePath }) {
    console.log("I18n: initialize started");
    this.localeFallbackList = I18n.localeNegotiation(
      this.config.get("core.language.primary"),
      this.config.get("core.language.priorityList")
    );

    if (this.preloadComplete == false) {
      // Load Pulsar Core Locales
      const localesPath = path.join(resourcePath, "locales");
      const localesPaths = fs.listSync(localesPath, ["cson", "json"]);

      for (const localePath of localesPaths) {
        const localeFilePath = localePath.split(".");
        // `pulsar.en-US.json` => `en-US`
        const locale = localeFilePath[localeFilePath.length - 2] ?? "";
        if (this.shouldIncludeLocale(locale)) {
          console.log(`I18n: Adding strings for file '${localePath}'`);
          this.addStrings(CSON.readFileSync(localePath) || {}, locale);
        }
      }
    }
    console.log("I18n: Initialization complete");
  }

  shouldIncludeLocale(locale) {
    return I18n.shouldIncludeLocaleParameterized(locale, { localeList: this.localeFallbackList });
  }

  addStrings(newObj, locale, stringObj = this.strings) {
    if (typeof newObj === "object") {
      for (const key in newObj) {
        if (typeof stringObj[key] !== "object") {
          // We only want to initialize an empty object, if this doesn't
          // already exist on the string tree
          stringObj[key] = {};
        }
        stringObj[key] = this.addStrings(newObj[key], locale, stringObj[key]);
      }
    } else if (typeof newObj === "string") {
      // We have hit the final entry in the object, and it is that of a string
      // Meaning this value is the translated string itself, so we will add it
      // within a final key of the locale
      stringObj[locale] = newObj;
    }
    return stringObj;
  }

  addString(keyPath, str, locale) {
    keyPathHelpers.setValueAtKeyPath(this.strings, `${keyPath}.${locale}`, str);
  }

  t(keyPath, opts) {
    return this.translate(keyPath, opts);
  }

  translate(keyPath, opts = {}) {
    console.log(`I18n: translate hit: keyPath: '${keyPath}'`);
    const stringLocales = keyPathHelpers.getValueAtKeyPath(this.strings, keyPath);

    if (typeof stringLocales !== "object") {
      // If the keypath requested doesn't exist, return the original keyPath
      // TODO Should we emit an event? Or append to the string why it coudln't be translated?
      console.log(`I18n: '${keyPath}' couldn't find keypath in strings.`);
      console.log(this.strings);
      return keyPath;
    }

    let bestLocale;

    if (this.localeFallbackList == null) {
      this.localeFallbackList = I18n.localeNegotiation(
        this.config.get("core.language.primary"),
        this.config.get("core.language.priorityList")
      );
    }

    // Find the first match for a locale available within the string
    localeFallbackListLoop:
    for (const localeListItem of this.localeFallbackList) {
      for (const possibleLocale in stringLocales) {
        if (I18n.doLocalesMatch(localeListItem, possibleLocale)) {
          bestLocale = possibleLocale;
          break localeFallbackListLoop;
        }
      }
    }

    if (!stringLocales[bestLocale]) {
      // If we couldn't find any way to read the string, return the original keyPath
      // TODO Should we emit an event? Or append to the string why it couldn't be translated?
      console.log(`I18n: '${keyPath}' couldn't find an appropriate locale for our string.`);
      return keyPath;
    }

    try {
      const msg = new IntlMessageFormat(stringLocales[bestLocale], bestLocale, undefined, { formatters: this.formatters });
      console.log(`I18n: keyPath: '${keyPath}'; string: '${stringLocales[bestLocale]}'; bestLocale: '${bestLocale}'`);
      const msgFormatted = msg.format(opts);
      return msgFormatted ?? keyPath;
    } catch(err) {
      console.log(`I18n: '${keyPath}' error when attempting to format string.`);
      console.error(err);
      // We failed to translate the string with IntlMessageFormat, lets return
      // the original keyPath.
      return keyPath;
    }
  }

  getT(namespace) {
    return this.getTranslate(namespace);
  }

  getTranslate(namespace) {
    return new NamespaceI18n(namespace, this);
  }

  // === Helper Methods
  isAutoTranslateLabel(value) {
    return AUTO_TRANSLATE_LABEL.test(value);
  }

  // Used in the menu and context-menu when auto-translating labels
  translateLabel(label) {
    // Since failing to translate menus could crash Pulsar
    // We must ensure to fallback to the raw label value
    // But `I18n.translate()` now returns the keyPath on failure
    // So we don't have to protect against it here.
    return this.translate(label.replace(/%/g, ""));
  }
}

class NamespaceI18n {
  constructor(namespace, i18n) {
    this.namespace = namespace;
    this.i18n = i18n;
  }

  t(keyPath, opts) {
    return this.translate(keyPath, opts);
  }

  translate(keyPath, opts) {
    return this.i18n.translate(`${this.namespace}.${keyPath}`, opts);
  }
}
