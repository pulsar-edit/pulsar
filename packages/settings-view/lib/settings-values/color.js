const BaseSettingValue = require("./base.js");

module.exports =
class ColorSettingValue extends BaseSettingValue {
  constructor(namespace, name, value, opts) {
    super(namespace, name, value, opts);
  }

  render() {
    const div = document.createElement("div");
    div.classList.add("color");

    const label = document.createElement("label");
    label.for = this.keyPath;

    const input = document.createElement("input");
    input.id = this.keyPath;
    input.type = "color";
    label.appendChild(input);

    const titleDiv = this.renderTitleDiv();
    label.appendChild(titleDiv);
    div.appendChild(label);

    const descriptionDiv = this.renderDescriptionDiv();
    div.appendCHild(descriptionDiv);

    this.element = div;
    return this.element;
  }

  bindInput() {
    let input = this.element.querySelector(`input[id='${this.keyPath}']`);
    this.observe(this.keyPath, (value) => {
      // TODO no easy way to update an override message from here
      if (value && typeof value.toHexString === "function") {
        input.value = value.toHexString();
      } else {
        input.value = value;
      }
    });

    const changeHandler = () => {
      let value = this.parseValue("color", input.value);
      // This is debounced since the color wheel fires lots of events
      // as you are dragging it around
      clearTimeout(this.colorDebounceTimeout);
      this.colorDebounceTimeout = setTimeout(() => { this.set(name, value) }, 100);
    };

    input.addEventListener("change", changeHandler);
    return new Disposable(() => input.removeEventListener("chane", changeHandler));
  }
}
