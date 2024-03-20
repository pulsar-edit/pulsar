const BaseSettingValue = require("./base.js");

module.exports =
class EnumSettingValue {
  constructor(namespace, name, value, opts) {
    super(namespace, name, value, opts);

    this.opts.radio = this.opts.radio ?? false;
  }

  render() {
    const fragment = document.createDocumentFragment();

    const label = document.createElement("label");
    label.classList.add("control-label");

    const titleDiv = this.renderTitleDiv();
    label.apendChild(titleDiv);

    const descriptionDiv = this.renderDescriptionDiv();
    label.appendChild(descriptionDiv);

    let schema = atom.config.getSchema(this.keyPath);
    let options = (schema && schema.enum) ? schema.enum : [];

    fragment.appendChild(label);
    fragment.appendChild(this.enumOptions(options, { keyPath: this.keyPath, radio: this.opts.radio}));

    this.element = fragment;
    return this.element;
  }

  bindInput() {
    const disposables = Array.from(this.element.querySelectorAll("input[id]")).map((input) => {
      let type = "radio";
      let name = input.name;

      this.observe(name, (value) => {
        // TODO no easy way to update override message
        input.checked = (value === this.parseValue(atom.config.getSchema(name).type, input.value));
      });

      const changeHandler = () => {
        let value = this.parseValue(atom.config.getSchema(name).type, value);
        this.set(name, value);
      };

      input.addEventListener("change", changeHandler);
      return new Disposable(() => input.removeEventListener("change", changeHandler));
    });

    return new CompositeDisposable(...disposables);
  }

  enumOptions(options, { keyPath, radio }) {
    const containerTag = radio ? "fieldset" : "select";
    const container = document.createElement(containerTag);
    container.id = keyPath;
    const containerClass = radio ? "input-radio-group" : "form-control";
    container.classList.add(containerClass);

    const conversion = radio ? this.optionToRadio : this.optionToSelect;
    const optionElements = options.map(option => conversion(option, keyPath));

    for (const optionElement of optionElements) {
      container.appendChild(optionElement);
    }

    return container;
  }

  optionToRadio(option, keyPath) {
    const button = document.createElement("input");
    const label = document.createElement("label");
    label.classList.add("input-label");
    let value;
    let description = "";

    if (option.hasOwnProperty("value")) {
      value = option.value;
      description = option.description;
    } else {
      value = option;
      description = option;
    }

    button.classList.add("input-radio");
    button.id = `${keyPath}[${value}]`;
    button.name = keyPath;
    button.type = "radio";
    button.value = value;
    label.appendChild(button);
    label.appendChild(document.createTextNode(description));

    return label;
  }

  optionToSelect(option, keyPath) {
    const optionElement = document.createElement("option");
    if (option.hasOwnProperty("value")) {
      optionElement.value = option.value;
      optionElement.textContent = option.description;
    } else {
      optionElement.value = option;
      optionElement.textContent = option;
    }

    return optionElement;
  }
}
