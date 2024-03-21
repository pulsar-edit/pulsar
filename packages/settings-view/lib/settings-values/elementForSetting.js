// Creates an HTML element for a given setting
const _ = require("underscore-plus");

const ArraySettingValue = require("./array.js");
const CheckboxSettingValue = require("./checkbox.js");
const ColorSettingValue = require("./color.js");
const ElementSettingValue = require("./element.js");
const EnumSettingValue = require("./enum.js");
const ObjectSettingValue = require("./object.js");


module.exports =
function elementForSetting(namespace, name, value, opts = {}) {
  let hasOverride = opts.settingHasProjectOverride(`${namespace}.${name}`);

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
    settingsClass = new EnumSettingValue(namespace, name, value, { radio: schema.radio, ...opts });
  } else if (schema && schema.type === 'color') {
    settingsClass = new ColorSettingValue(namespace, name, value, opts);
  } else if (_.isBoolean(value) || (schema && schema.type === 'boolean')) {
    settingsClass = new CheckboxSettingValue(namespace, name, value, opts);
  } else if (_.isArray(value) || (schema && schema.type === 'array')) {
    if (isEditableArray(value)) {
      settingsClass = new ArraySettingValue(namespace, name, value, opts);
    }
  } else if (_.isObject(value) || (schema && schema.type === 'object')) {
    settingsClass = new ObjectSettingValue(namespace, name, value, opts);
  } else {
    settingsClass = new ElementSettingValue(namespace, name, value, opts);
  }

  if (settingsClass === undefined) {
    console.log(`Unknown SettingValue Class for: '${namespace}:${name}.${value}'`);
    return controlGroup;
  }

  controls.appendChild(settingsClass.render());
  
  let bindTooltips = settingsClass.bindTooltips();
  if (bindTooltips) {
    opts.compositeDisposable.add(bindTooltips);
  }

  let bindInput = settingsClass.bindInput();
  if (bindInput) {
    // Since these classes may return unexpected data we guard against it here
    opts.compositeDisposable.add(bindInput);
  }

  return controlGroup;
}

/*
 * Space Pen Helpers
*/
function isEditableArray(array) {
  for (let item of array) {
    if (!_.isString(item)) {
      return false;
    }
  }
  return true;
}

function addOverrideWarning (name, element) {
  let div = document.createElement('div')
  div.classList.add('text-warning', 'setting-override-warning')
  div.textContent = `This global setting has been overridden by a project-specific setting. Changing it will affect your global config file, but may not have any effect in this window.`
  div.dataset.settingKey = name

  element.appendChild(div)
  return div
}
