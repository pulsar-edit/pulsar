const { CompositeDisposable } = require("atom");
const _ = require("underscore-plus");
const BaseSettingValue = require("./base.js");
const elementForSetting = require("./elementForSetting.js");
const { getSettingTitle } = require("../rich-title.js");

module.exports =
class ElementSettingValue extends BaseSettingValue {
  constructor(namespace, name, value, opts) {
    super(namespace, name, value, opts);
    this.opts.compositeDisposable = this.opts.compositeDisposable ?? new compositeDisposable();
  }

  render() {
    if (_.keys(this.value).length === 0) {
      this.element = document.createDocumentFragment();
      return this.element;
    } else {
      let schema = atom.config.getSchema(this.keyPath);
      let isCollapsed = schema.collapsed === true;

      const section = document.createElement("section");
      section.classList.add("sub-section");
      if (isCollapsed) {
        section.classList.add("collapsed");
      }

      const h3 = document.createElement("h3");
      h3.classList.add("sub-section-heading", "has-items");
      h3.textContent = getSettingTitle(this.keyPath, this.name);
      section.appendChild(h3);

      const descriptionDiv = this.renderDescriptionDiv();
      section.appendChild(descriptionDiv);

      const div = document.createElement("div");
      div.classList.add("sub-section-body");

      for (const key of this.opts.sortSettings(this.keyPath, this.value)) {
        div.appendChild(elementForSetting(namespace, `${name}.${key}`, value[key], this.opts.compositeDisposable));
      }
      section.appendChild(div);

      this.element = section;
      return this.element;
    }
  }

  bindInput() {
    // no input to bind on this specific element, since all inner elements
    // should already have that handled.
  }

  bindTooltips() {
    // override the existing method
  }
}
