let Minimatch = null;  // Defer requiring until actually needed

module.exports =
class IgnoredNames {
  constructor() {
    this.ignoredPatterns = [];

    if (Minimatch == null) { ({
      Minimatch
    } = require('minimatch')); }

    let ignoredNames = atom.config.get('core.ignoredNames') ?? [];

    if (typeof ignoredNames === 'string') { ignoredNames = [ignoredNames]; }
    for (let ignoredName of ignoredNames) {
      if (ignoredName) {
        try {
          this.ignoredPatterns.push(new Minimatch(ignoredName, {matchBase: true, dot: true}));
        } catch (error) {
          atom.notifications.addWarning(atom.i18n.t("tree-view.src.error-parsing-ignore-pattern", { name: ignoredName }), { detail: error.message });
        }
      }
    }
  }

  matches(filePath) {
    for (let ignoredPattern of this.ignoredPatterns) {
      if (ignoredPattern.match(filePath)) { return true; }
    }

    return false;
  }
}
