const I18n = require("../src/i18n.js");

describe("I18n", () => {
  let i18n;

  beforeEach(() => {
    const { resourcePath } = atom.getLoadSettings();
    i18n = new I18n({
      config: atom.config
    });
    i18n.initialize({ resourcePath });
  });

  describe("Handles Locales logic", () => {
    it("Locale Lookup Filtering Fallback Pattern Array: Follows RFC4647", () => {
      const primaryLocale = "es-MX";
      const priorityListLocale = [
        "zh-Hant-CN-x-private1-private2",
        "en-US"
      ];
      const fallbackSet = I18n.LocaleNegotiation(primaryLocale, priorityListLocale);

      expect(Array.from(fallbackSet)).toEqual([
        "es-MX",
        "es",
        "zh-Hant-CN-x-private1-private2",
        "zh-Hant-CN-x-private1",
        "zh-Hant-CN",
        "zh-Hant",
        "zh",
        "en-US",
        "en"
      ]);
    });

    it("Locale Lookup Filtering Fallback Pattern Array: Excludes duplicates from hardcoded fallback", () => {
      const primaryLocale = "en-US";
      const priorityListLocale = [ "es-MX" ];
      const fallbackSet = I18n.LocaleNegotiation(primaryLocale, priorityListLocale);

      expect(Array.from(fallbackSet)).toEqual([
        "en-US",
        "en",
        "es-MX",
        "es"
      ]);
    });

    it("Accurately determines if Locale Should be included when it should", () => {
      const primaryLocale = "en-US";
      const priorityListLocale = [ "es-MX" ];
      const questionedLocale = "en";
      const shouldBeIncluded = I18n.ShouldIncludeLocale(questionedLocale, primaryLocale, priorityListLocale);
      expect(shouldBeIncluded).toEqual(true);
    });

    it("Accurately determines if Locale Should be included when it shoudln't", () => {
      const primaryLocale = "zh-Hant";
      const priorityListLocale = [ "es-MX" ];
      const questionedLocale = "ja-JP";
      const shouldBeIncluded = I18n.ShouldIncludeLocale(questionedLocale, primaryLocale, priorityListLocale);
      expect(shouldBeIncluded).toEqual(false);
    });

    it("Accurately determines if Locale should be included when the locale is the hardcoded fallback", () => {
      const primaryLocale = "zh-Hant";
      const priorityListLocale = [ "es-MX" ];
      const questionedLocale = "en";
      const shouldBeIncluded = I18n.ShouldIncludeLocale(questionedLocale, primaryLocale, priorityListLocale);
      expect(shouldBeIncluded).toEqual(true);
    });

    it("Can determine if basic locales match", () => {
      const want = "en-US";
      const have = "en-US";
      expect(I18n.DoLocalesMatch(want, have)).toEqual(true);
    });

    it("Can determine if wildcard locales match", () => {
      const want = "en-*";
      const have = "en-US";
      expect(I18n.DoLocalesMatch(want, have)).toEqual(true);
    });

    it("Can determine if locales do not match", () => {
      const want = "en-US";
      const have = "ja-JP";
      expect(I18n.DoLocalesMatch(want, have)).toEqual(false);
    });
  });

  describe("Crafts strings object correctly", () => {
    it("Properly adds locale key", () => {
      i18n.addStrings({
        example: {
          stringKey: "String Value"
        }
      }, "en-US");

      expect(i18n.strings.example.stringKey).toEqual({
        "en-US": "String Value"
      });
    });

    it("Handles deep objects", () => {
      i18n.addStrings({
        example: {
          deepExampleKey: {
            stringKey: "String Value"
          }
        }
      }, "en-US");

      expect(i18n.strings.example.deepExampleKey.stringKey).toEqual({
        "en-US": "String Value"
      });
    });

    it("Adds new locales to existing objects", () => {
      i18n.addStrings({
        example: {
          stringKey: "Hello Pulsar"
        }
      }, "en-US");
      i18n.addStrings({
        example: {
          stringKey: "Hola Pulsar"
        }
      }, "es-MX");

      expect(i18n.strings.example.stringKey).toEqual({
        "en-US": "Hello Pulsar",
        "es-MX": "Hola Pulsar"
      });
    });

    it("Adds new locale to object", () => {
      i18n.addStrings({
        example: {
          stringKey: "Hello Pulsar"
        }
      }, "en-US");

      i18n.addString("example.stringKey", "Hola Pulsar", "es-MX");

      expect(i18n.strings.example.stringKey).toEqual({
        "en-US": "Hello Pulsar",
        "es-MX": "Hola Pulsar"
      });
    });
  });

  describe("Is able to translate properly", () => {

    beforeEach(() => {
      const primary = "es-MX";
      const priorityListLocale = [ "zh-Hant" ];
      i18n.localeFallbackList = I18n.LocaleNegotiation(primary, priorityListLocale);
    });

    it("Returns the proper string based on user setting", () => {
      i18n.addStrings({
        example: {
          stringKey: "Hello Pulsar"
        }
      }, "en");

      i18n.addStrings({
        example: {
          stringKey: "Hola Pulsar"
        }
      }, "es-MX");

      expect(i18n.t("example.stringKey")).toEqual("Hola Pulsar");
    });

    it("Handles ICU MessageFormat Replacements", () => {
      i18n.addStrings({
        example: {
          stringKey: "Hello {value}"
        }
      }, "en");

      expect(i18n.t("example.stringKey", { value: "confused-Techie" })).toEqual(
        "Hello confused-Techie"
      );
    });

    it("Handles namespace translations", () => {
      i18n.addStrings({
        example: {
          stringKey: "Hello Pulsar"
        }
      }, "en");

      const t = i18n.getT("example");

      expect(t.t("stringKey")).toEqual("Hello Pulsar");
    });
  });

  describe("Translates LocaleLabels", () => {
    it("Identifies a LocaleLabel", () => {
      const str1 = "%this-is-a-locale-label%";
      const str2 = "this-is-not-a-locale-label";
      const str3 = "%nor-is-this";
      const str4 = "%or-%this";

      expect(i18n.isAutoTranslateLabel(str1)).toEqual(true);
      expect(i18n.isAutoTranslateLabel(str2)).toEqual(false);
      expect(i18n.isAutoTranslateLabel(str3)).toEqual(false);
      expect(i18n.isAutoTranslateLabel(str4)).toEqual(false);
    });

    it("Successfully translates a LocaleLabel", () => {
      const primary = "es-MX";
      const priorityListLocale = [ "zh-Hant" ];
      i18n.localeFallbackList = I18n.LocaleNegotiation(primary, priorityListLocale);

      i18n.addStrings({
        example: {
          stringKey: "Hello Pulsar"
        }
      }, "en");

      const localeLabel = "%example.stringKey%";

      expect(i18n.translateLabel(localeLabel)).toEqual("Hello Pulsar");
    });

    it("Falls back to the original label if unable to translate", () => {
      const primary = "es-MX";
      const priorityListLocale = [ "zh-Hant" ];
      i18n.localeFallbackList = I18n.LocaleNegotiation(primary, priorityListLocale);

      const localeLabel = "%example.stringKey%";

      expect(i18n.translateLabel(localeLabel)).toEqual("%example.stringKey%");
    });
  });
});
