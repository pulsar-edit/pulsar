const { default: IntlMessageFormat } = require("intl-messageformat");
const { parse: parseString } = require("@formatjs/icu-messageformat-parser");


class Localisations {}

/**
 * manages strings of all languages for a single package
 * (in other words, manages `PackageLocalisations` instances)
 */
class PackageLocalisations {
  /**
   * @param {object} opts
   * @param {string} opts.pkgName
   * @param {PackageStrings} opts.strings
   * @param {PackageASTCache} [opts.asts]
   */
  constructor({}) {}
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
  constructor({}) {}
}

/**
 * "basic" types
 * @typedef {import("@formatjs/icu-messageformat-parser").MessageFormatElement} MessageFormatElement
 * @typedef {{ ast: Array<MessageFormatElement> }} AST
 * @typedef {{ items: { [k: string]: OneOrManyASTs } }} ManyASTs
 * @typedef {AST | ManyASTs} OneOrManyASTs
 */
/**
 * types for `Localisations`
 * @typedef {{ [k: string]: PackageASTCache }} AllAstCache
 * @typedef {{ [k: string]: PackageStrings }} AllStrings
 * @typedef {{ [k: string]: PackageFormatterCache }} AllFormatterCache
 */
/**
 * types for `PackageLocalisations`
 * @typedef {{ [k: string]: ASTCache }} PackageASTCache
 * @typedef {{ [k: string]: Strings }} PackageStrings
 * @typedef {{ [k: string]: FormatterCache }} PackageFormatterCache
 */
/**
 * used in `SingleLanguageLocalisations`
 * @typedef {{ [k: string]: OneOrManyASTs }} ASTCache
 * @typedef {{ [k: string]: string | Strings }} Strings
 * @typedef {{ [k: string]: IntlMessageFormat | FormatterCache }} FormatterCache
 */
