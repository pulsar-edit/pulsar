class CssUtils {
  static defaultId = "title-bar-style";

  static createStyleSheet(id = CssUtils.defaultId, domClass) {
    const style = document.createElement("style");
    style.id = id.replace(/[.#]/, "");

    if (domClass) {
      style.classList.add(domClass);
    }

    style.appendChild(document.createTextNode(""));

    if (document.head) {
      document.head.appendChild(style);
    }

    return style.sheet;
  }

  static styleExists(selector = `#${CssUtils.defaultId}`) {
    return document.querySelector(selector) !== null;
  }

  static getStyleSheet(selector = `#${CssUtils.defaultId}`, domClass) {
    if (!this.styleExists(selector)) return this.createStyleSheet(selector, domClass);

    let query = selector;

    if (domClass) {
      query += "." + domClass;
    }

    let result = document.querySelector(query);
    let sheet = null;

    if (result) {
      sheet = result.sheet;
    }

    return sheet;
  }

  static clearRule(selector, id = `#${CssUtils.defaultId}`) {
    const sheet = this.getStyleSheet(id);
    if (!sheet) {
      return;
    }

    for (let i = 0; i < sheet.cssRules.length; i++) {
      if (sheet.cssRules[i].selectorText == selector) {
        sheet.removeRule(i);
      }
    }
    return sheet;
  }
}

module.exports = { CssUtils };
