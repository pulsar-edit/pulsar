const _ = require('underscore-plus');
const StartDotRegex = /^\.?/;

// Represents a single unit of text as selected by a grammar.
module.exports = class Token {

  constructor(properties) {
    this.value = properties.value;
    this.scopes = properties.scopes;
  }

  isEqual(other) {
    // TODO: scopes is deprecated. This is here for the sake of lang package tests
    return this.value === other.value && _.isEqual(this.scopes, other.scopes);
  }

  isBracket() {
    return /^meta\.brace\b/.test(_.last(this.scopes));
  }

  matchesScopeSelector(selector) {
    let targetClasses = selector.replace(StartDotRegex, '').split('.');
    return _.any(this.scopes, (scope) => {
      let scopeClasses = scope.split('.');
      return _.isSubset(targetClasses, scopeClasses);
    });
  }

};
