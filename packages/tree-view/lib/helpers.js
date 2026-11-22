const path = require("path");

let DEBUG = false;

module.exports = {
  repoForPath(goalPath) {
    const iterable = atom.project.getPaths();
    for (let i = 0; i < iterable.length; i++) {
      const projectPath = iterable[i];
      if ((goalPath === projectPath) || (goalPath.indexOf(projectPath + path.sep) === 0)) {
        return atom.project.getRepositories()[i];
      }
    }
    return null;
  },

  getStyleObject(el) {
    const styleProperties = window.getComputedStyle(el);
    const styleObject = {};
    for (let property in styleProperties) {
      const value = styleProperties.getPropertyValue(property);
      const camelizedAttr = property.replace(/\-([a-z])/g, (a, b) => b.toUpperCase());
      styleObject[camelizedAttr] = value;
    }
    return styleObject;
  },

  getFullExtension(filePath) {
    const basename = path.basename(filePath);
    const position = basename.indexOf('.');
    if (position > 0) { return basename.slice(position); } else { return ''; }
  },

  isDebug() {
    return DEBUG;
  },

  setDebug(newValue) {
    DEBUG = newValue;
  },

  // Public: Remove any path whose ancestor is also in the list, along with
  // exact duplicates.
  //
  // When the user selects a folder _and_ something inside it, acting on the
  // folder already covers its contents; acting on both would copy the child
  // twice, move it out of its folder, or try to trash it after it's already
  // gone.
  //
  // * `paths` An {Array} of absolute paths.
  //
  withoutDescendants (paths) {
    let unique = [...new Set(paths)];
    return unique.filter((candidate) => {
      return !unique.some((other) => {
        if (other === candidate) return false;
        let relative = path.relative(other, candidate);
        // `candidate` is inside `other` if getting there from `other` doesn't
        // require going up or switching drives.
        return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
      });
    });
  },
};
