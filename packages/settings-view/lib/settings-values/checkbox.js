const BaseSettingValue = require("./base.js");

module.exports =
class CheckboxSettingValue extends BaseSettingValue {
  constructor(namespace, name, value, opts) {
    super(namespace, name, value, opts);
  }

  render() {
    const div = document.createElement("div");
    div.classList.add("checkbox");

    const label = document.createElement("label");
    label.for = this.keyPath;

    const input = document.createElement("input");
    input.id = this.keyPath;
    input.type = "checkbox";
    input.classList.add("input-checkbox");
    label.appendChild(input);

    const titleDiv = this.renderTitleDiv();
    label.appendChild(titleDiv);
    div.appendChild(label);

    const descriptionDiv = this.renderDescriptionDiv();
    div.appendChild(descriptionDiv);

    this.element = div;
    return this.element;
  }

  bindInput() {
    let input = this.element.querySelector(`input[id='${this.keyPath}']`);
    this.observe(this.keyPath, (value) => {
      // TODO no easy way to update an override message from here
      input.checked = value;
    });

    const changeHandler = () => {
      let value = input.checked;

      this.set(this.keyPath, value);
    };

    input.addEventListener("change", changeHandler);
    return new Disposable(() => input.removeEventListener("change", changeHandler));
  }
}
