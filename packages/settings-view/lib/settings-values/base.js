const { CompositeDisposable, Disposable } = require("atom");
const { getSettingDescription } = require("../rich-description.js");
const { getSettingTitle } = require("../rich-title.js");
const _ = require("underscore-plus");
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
    descriptionDiv.innerHTML = getSettingDescription(this.keyPath);

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

  valueToString(value) {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return null;
      }
      return value.map((val) => val.toString().replace(/,/g, "\\,")).join(", ");
    } else if (value != null) {
      return value.toString();
    } else {
      return null;
    }
  }

  isDefault(name) {
    let params = { sources: [atom.config.getUserConfigPath()] };
    if (this.opts.scopeName != null) {
      params.scope = [this.opts.scopeName];
    }
    let defaultValue = this.getDefault(name);
    let value = atom.config.get(name, params);
    return (value == null) || (defaultValue === value);
  }

  getDefault(name) {
    let params = { excludeSources: [ atom.config.getUserConfigPath() ] };
    if (this.opts.scopeName != null) {
      params.scope = [ this.opts.scopeName ];
    }

    let defaultValue = atom.config.get(name, params);
    if (this.opts.scopeName != null) {
      // If the unscoped default is the same as the scoped default, check the actual config.cson
      // to make sure that there isn't a non-default value that is overriding the scoped value
      // For example: the default editor.tabLength is 2, but if someone sets it to 4
      // the above check still returns 2 and not 4 for a scoped editor.tabLength,
      // because it bypasses config.cson.
      if (atom.config.get(name, { excludeSources: [ atom.config.getUserConfigPath() ] } ) === defaultValue) {
        defaultValue = atom.config.get(name);
      }
    }

    return defaultValue;
  }

  observe(name, callback) {
    let params = { sources: [atom.config.getUserConfigPath() ]};
    if (atom.config.projectFile) {
      params.excludeSources = [atom.config.projectFile];
    }
    if (this.opts.scopeName != null) {
      params.scope = [this.opts.scopeName];
    }

    // We need to be sure that project-specific config overrides are never
    // reflected in the settings panel. We use `observe` to hook into any
    // possible changes to our value, but we double-check it by looking up the
    // value ourselves.
    let wrappedCallback = (nv) => {
      let params = {};
      if (this.opts.scopeName != null) {
        params.scope = [this.opts.scopeName];
      }
      callback(this.opts.getWithoutProjectOverride(name, params));
    }

    this.opts.compositeDisposable.add(atom.config.observe(name, params, wrappedCallback));
  }

  parseValue(type, value) {
    if (value === "") {
      return undefined;
    } else if (type === "number") {
      let floatValue = parseFloat(value);
      if (isNaN(floatValue)) {
        return value;
      } else {
        return floatValue;
      }
    } else if (type === "integer") {
      let intValue = parseInt(value);
      if (isNaN(intValue)) {
        return value;
      } else {
        return intValue;
      }
    } else if (type === "array") {
      let arrayValue = (value || "").split(",");
      arrayValue = arrayValue.reduce((values, val) => {
        const last = values.length - 1;
        if (last >= 0 && values[last].endsWith("\\")) {
          values[last] = values[last].replace(/\\$/, ",") + val;
        } else {
          values.push(val);
        }
        return values;
      }, []);
      return arrayValue.filter((val) => val).map((val) => val.trim());
    } else {
      return value;
    }
  }

  set(name, value) {
    if (this.opts.scopeName) {
      if (value === undefined) {
        atom.config.unset(name, { scopeSelecotr: this.opts.scopeName });
        return true;
      } else {
        return atom.config.set(name, value, { scopeSelector: this.opts.scopeName });
      }
    } else {
      return atom.config.set(name, value);
    }
  }
}
