const path = require("path");
const fs = require("fs-plus");
const CSON = require("season");
const keyPathHelpers = require("key-path-helpers");
const IntlMessageFormat = require("intl-messageformat").default;

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
  // Provides LocaleNegotiation in accordance to RFC4647 Lookup Filtering Fallback Pattern
  // Provided a priorityList, primary language, and default language.
  static LocaleNegotiation(
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

  // Determines if the provided locale should be loaded. Based on the user's
  // current settings.
  static ShouldIncludeLocale(locale, primary, priorityList, fallback) {
    const localeList = I18n.LocaleNegotiation(primary, priorityList, fallback);

    for (const localeListItem of localeList) {
      if (I18n.DoLocalesMatch(localeListItem, locale)) {
        return true;
      }
    }

    return false;
  }

  // Takes a wanted locale, and the locale you have, to determine if they match
  static DoLocalesMatch(want, have) {
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
  }

  // Helps along with initial setup
  initialize({ resourcePath }) {
    this.localeFallbackList = I18n.LocaleNegotiation(
      this.config.get("core.language.primary"),
      this.config.get("core.language.priorityList")
    );

    // Load Pulsar Core Locales
    const localesPath = path.join(resourcePath, "locales");
    const localesPaths = fs.listSync(localesPath, ["cson", "json"]);

    for (const localePath of localesPaths) {
      const localeFilePath = localePath.split(".");
      // `pulsar.en-US.json` => `en-US`
      const locale = localeFilePath[localeFilePath.length - 2] ?? "";
      if (I18n.ShouldIncludeLocale(locale)) {
        this.addStrings(CSON.readFileSync(localePath) || {}, locale);
      }
    }
  }

  shouldIncludeLocale(locale) {
    return I18n.ShouldIncludeLocale(locale);
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
    const stringLocales = keyPathHelpers.getValueAtKeyPath(this.strings, keyPath);

    if (typeof stringLocales !== "object") {
      // If the keypath requested doesn't exist, return null
      return null;
    }

    let bestLocale;

    if (this.localeFallbackList == null) {
      this.localeFallbackList = I18n.LocaleNegotiation(
        this.config.get("core.language.primary"),
        this.config.get("core.language.priorityList")
      );
    }

    // Find the first match for a locale available within the string
    localeFallbackListLoop:
    for (const localeListItem of this.localeFallbackList) {
      for (const possibleLocale in stringLocales) {
        if (I18n.DoLocalesMatch(localeListItem, possibleLocale)) {
          bestLocale = possibleLocale;
          break localeFallbackListLoop;
        }
      }
    }

    if (!stringLocales[bestLocale]) {
      // If we couldn't find any way to read the string, return null
      return null;
    }

    const msg = new IntlMessageFormat(stringLocales[bestLocale], bestLocale);

    return msg.format(opts);
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
    return this.translate(label.replace(/%/g, "")) ?? label;
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
