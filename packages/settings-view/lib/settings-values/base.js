// The BaseSettingValue is the base class from which all other *SettingValue
// classes should extend.

module.exports =
class BaseSettingValue {
  constructor(namespace, name, value, opts) {
    this.namespace = namespace;
    this.name = name;
    this.value = value;
    this.opts = opts ?? {};

    this.keyPath = `${namespace}.${name}`;

    this.element = document.createDocumentFragment();
  }

  renderTitleDiv() {
    const titleDiv = document.createElement("div");
    titleDiv.classList.add("setting-title");
    titleDiv.textContent = getSettingTitle(this.keyPath, this.name);

    return titleDiv;
  }

  renderDescriptionDiv() {
    const descriptionDiv = document.createElement("div");
    descriptionDiv.classList.add("setting-description");
    descriptionDiv.innerHTML = getSettingDescription(keyPath);

    return descriptionDiv;
  }

  bindTooltips() {
    const disposables = Array.from(this.element.querySelectorAll('input[id], select[id], atom-text-editor[id]')).map((element) => {
      const schema = atom.config.getSchema(element.id);
      let defaultValue = this.valueToString(this.getDefault(element.id));
      if (defaultValue != null) {
        if (schema.enum && _.findWhere(schema.enum, {value: defaultValue})) {
          defaultValue = _.findWhere(schema.enum, {value: defaultValue}).description;
        }
        return atom.tooltips.add(element, {
          title: `Default: ${defaultValue}`,
          delay: {show: 100},
          placement: 'auto left'
        });
      } else {
        return new Disposable(() => {}); // no-op
      }
    });

    return new CompositeDisposable(...disposables);
  }

  bindInput() {
    // no-op
    // should be overridden by extendng classes
  }
}
