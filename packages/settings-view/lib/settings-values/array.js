const BaseSettingValue = require("./base.js");

module.exports =
class ArraySettingValue {
  constructor(namespace, name, value, opts) {
    super(namespace, name, value, ops);
  }

  render() {
    let type = _.isNumber(this.value) ? "number" : "string";

    const fragment = document.createDocumentFragment();

    const label = document.createElement("label");
    label.classList.add("control-label");

    const titleDiv = this.createTitleDiv();
    label.appendChild(titleDiv);

    const descriptionDiv = this.createDescriptionDiv();
    label.appendChild(descriptionDiv);
    fragment.appendChild(label);

    const controls = document.createElement("div");
    controls.classList.add("controls");

    const editorContainer = document.createElement("div");
    editorContainer.classList.add("editor-container");

    const editor = new TextEditor({ mini: true });
    editor.element.id = this.keyPath;
    editor.element.setAttribute("type", type);
    editorContaienr.appendChild(editor.element);
    controls.appendChild(editorContainer);
    fragment.appendChild(controls);

    this.element = fragment;
    return this.element;
  }

  bindInput() {
    const editorElement = this.element.querySelector("atom-text-editor");

    let editor = editorElement.getModel();
    let name = editorElement.id;
    let type = editorElement.getAttribute("type");
    let defaultValue = this.valueToString(this.getDefault(name));

    if (defaultValue != null) {
      editor.setPlaceholderText(`Default: ${defaultValue}`);
    }

    const subscriptions = new CompositeDisposable();

    const focusHandler = () => {
      if (this.isDefault(name)) {
        editor.setText(this.valueToString(this.getDefault(name)) || "");
      }
    };
    editorElement.addEventListener("focus", focusHandler);
    subscriptions.add(new Disposable(() => editorElement.removeEventListener("focus", focusHandler)));

    const blurHandler = () => {
      if (this.isDefault(name)) {
        editor.setText("");
      }
    };
    editorElement.addEventListener("blur", blurHandler);
    subscriptions.add(new Disposable(() => editorElement.removeEventListener("blur", blurHandler)));

    this.observe(name, (value) => {
      this.setText(editor, name, type, value);
      // TODO difficult to update override message here
    });

    subscriptions.add(editor.onDidStopChanging(() => {
      const { minimum, maximum } = atom.config.getSchema(name);
      const value = this.parseValue(type, editor.getText());
      if (minimum != null && value < minimum) {
        this.set(name, minimum);
        this.setText(editor, name, type, minimum);
      } else if (maximum != null && value > maximum) {
        this.set(name, maximum);
        this.setText(editor, name, type, maximum);
      } else if (!this.set(name, value)) {
        this.setText(editor, name, type, atom.config.get(name));
      }
    }));

    // add editorElement to disposables
    subscriptions.add(editorElement);

    return subscriptions;
  }
}
