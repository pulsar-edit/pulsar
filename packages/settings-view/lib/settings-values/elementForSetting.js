// Creates an HTML element for a given setting
const CheckboxSettingValue = require("./checkbox.js");
const ColorSettingValue = require("./color.js");
const EnumSettingValue = require("./enum.js");
const ArraySettingValue = require("./array.js");

module.exports =
function elementForSetting(namespace, name, value, compositeDisposable) {
  let hasOverride = settingHasProjectOverride(`${namespace}.${name}`);

  if (namespace === "core") {
    if ([
      "themes", // Hanlded in the Themes panel
      "disabledPackages", // Hanlded in the Packages panel
      "customFileTypes",
      "uriHandlerRegistration" // Handled in the URI Hanlder panel
    ].includes(name)) {
      return document.createDocumentFragment();
    }
  }
  if (namespace === "editor") {
    // There's no global default for these, they are defined by language packages
    if (["commentStart", "commentEnd", "increaseIndentPattern", "decreaseIndentPattern", "foldEndPatten"].includes(name)) {
      return document.createDocumentFragment();
    }
  }

  const controlGroup = document.createElement('div');
  controlGroup.classList.add('control-group');

  const controls = document.createElement('div');
  controls.classList.add('controls');
  controlGroup.appendChild(controls);

  let el = addOverrideWarning(`${namespace}.${name}`, controlGroup);
  el.style.display = hasOverride ? 'block' : 'none';

  let schema = atom.config.getSchema(`${namespace}.${name}`);
  let settingsClass;

  if (schema && schema.enum) {
    settingsClass = new EnumSettingValue(namespace, name, value, { radio: schema.radio });
  } else if (schema && schema.type === 'color') {
    settingsClass = new ColorSettingValue(namespace, name, value);
  } else if (_.isBoolean(value) || (schema && schema.type === 'boolean')) {
    settingsClass = new CheckboxSettingValue(namespace, name, value);
  } else if (_.isArray(value) || (schema && schema.type === 'array')) {
    if (isEditableArray(value)) {
      settingsClass = new ArraySettingValue(namespace, name, value);
    }
  } else if (_.isObject(value) || (schema && schema.type === 'object')) {
    controls.appendChild(elementForObject(namespace, name, value))
  } else {
    controls.appendChild(elementForEditor(namespace, name, value))
  }

  controls.appendChild(settingsClass.render());
  compositeDisposable.add(settingsClass.bindTooltips());
  compositeDisposable.add(settingsClass.bindInput());

  return controlGroup;
}
