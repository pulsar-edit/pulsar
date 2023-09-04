/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS104: Avoid inline assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
let IgnoredNames;
let Minimatch = null;  // Defer requiring until actually needed

module.exports =
(IgnoredNames = class IgnoredNames {
  constructor() {
    let left;
    this.ignoredPatterns = [];

    if (Minimatch == null) { ({
      Minimatch
    } = require('minimatch')); }

    let ignoredNames = (left = atom.config.get('core.ignoredNames')) != null ? left : [];
    if (typeof ignoredNames === 'string') { ignoredNames = [ignoredNames]; }
    for (let ignoredName of Array.from(ignoredNames)) {
      if (ignoredName) {
        try {
          this.ignoredPatterns.push(new Minimatch(ignoredName, {matchBase: true, dot: true}));
        } catch (error) {
          atom.notifications.addWarning(`Error parsing ignore pattern (${ignoredName})`, {detail: error.message});
        }
      }
    }
  }

  matches(filePath) {
    for (let ignoredPattern of Array.from(this.ignoredPatterns)) {
      if (ignoredPattern.match(filePath)) { return true; }
    }

    return false;
  }
});
