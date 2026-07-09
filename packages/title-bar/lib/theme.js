const { controlThemes, resolveControlTheme } = require("./types.js");
const { Utils } = require("./utils.js");

class ThemeManager {
  constructor(view) {
    this.view = view;
    this.controlTheme = undefined;
  }

  setWindowControlTheme(theme) {
    const resolved = resolveControlTheme(theme);
    const newTheme = controlThemes[resolved];
    if (!newTheme) {
      return;
    }

    if (this.controlTheme) {
      this.view.getElement().classList.remove(this.controlTheme.cssClass);
    }

    this.view.getElement().classList.add(newTheme.cssClass);
    this.controlTheme = newTheme;

    // Auto-set control position based on theme
    Utils.setToggleClass(this.view.getElement(), "reverse-controls", newTheme.reverseControls);
  }
}

module.exports = { ThemeManager };
