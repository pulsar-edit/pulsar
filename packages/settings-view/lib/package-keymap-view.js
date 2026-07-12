/** @babel */
/** @jsx etch.dom */

import path from "path";
import _ from "underscore-plus";
import { Disposable, CompositeDisposable } from "atom";
import etch from "etch";

// Displays the keybindings for a package namespace
export default class PackageKeymapView {
  constructor(pack) {
    this.pack = pack;
    this.namespace = this.pack.name;
    this.disposables = new CompositeDisposable();
    this.copyFeedbackTimeouts = new Set();
    etch.initialize(this);

    const packagesWithKeymapsDisabled = atom.config.get("core.packagesWithKeymapsDisabled") || [];
    this.refs.keybindingToggle.checked = !packagesWithKeymapsDisabled.includes(this.namespace);

    const changeHandler = (event) => {
      event.stopPropagation();
      const value = this.refs.keybindingToggle.checked;
      if (value) {
        atom.config.removeAtKeyPath("core.packagesWithKeymapsDisabled", this.namespace);
      } else {
        atom.config.pushAtKeyPath("core.packagesWithKeymapsDisabled", this.namespace);
      }

      this.updateKeyBindingView();
    };
    this.refs.keybindingToggle.addEventListener("change", changeHandler);
    this.disposables.add(
      new Disposable(() => {
        this.refs.keybindingToggle.removeEventListener("change", changeHandler);
      }),
    );

    const copyButtonClickHandler = (event) => {
      const target = event.target.closest(".copy-keybinding");
      if (target) {
        event.preventDefault();
        event.stopPropagation();
        this.writeKeyBindingToClipboard(target.closest("tr").dataset);
        this.showCopyFeedback(target);
      }
    };
    this.element.addEventListener("click", copyButtonClickHandler);
    this.disposables.add(
      new Disposable(() => {
        this.element.removeEventListener("click", copyButtonClickHandler);
      }),
    );

    this.updateKeyBindingView();

    let hasKeymaps = false;
    // eslint-disable-next-line no-unused-vars
    for (let [packageKeymapsPath, keymap] of atom.packages.getLoadedPackage(this.namespace)
      .keymaps) {
      if (Object.keys(keymap || {}).length > 0) {
        hasKeymaps = true;
        break;
      }
    }

    if (this.refs.keybindingItems.children.length === 0 && !hasKeymaps) {
      this.element.style.display = "none";
    }
  }

  update() {}

  destroy() {
    for (const timeout of this.copyFeedbackTimeouts) clearTimeout(timeout);
    this.copyFeedbackTimeouts.clear();
    this.disposables.dispose();
    return etch.destroy(this);
  }

  render() {
    return (
      <section className="section package-keymap-section">
        <div className="section-container">
          <div className="section-heading icon icon-keyboard">Keybindings</div>
          <div className="checkbox">
            <label for="toggleKeybindings">
              <input
                id="toggleKeybindings"
                className="input-checkbox"
                type="checkbox"
                ref="keybindingToggle"
              />
              <div className="setting-title">Enable</div>
            </label>
            <div className="setting-description">
              {
                "Disable this if you want to bind your own keystrokes for this package's commands in your keymap."
              }
            </div>
          </div>
          <table className="package-keymap-table table native-key-bindings text">
            <caption className="sr-only">Package keybindings</caption>
            <col className="keystroke" />
            <col className="command" />
            <col className="selector" />
            <col className="actions" />
            <thead>
              <tr>
                <th scope="col">Shortcut</th>
                <th scope="col">Command</th>
                <th scope="col">Context</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody ref="keybindingItems" />
          </table>
        </div>
      </section>
    );
  }

  updateKeyBindingView() {
    this.refs.keybindingItems.innerHTML = "";

    const packagesWithKeymapsDisabled = atom.config.get("core.packagesWithKeymapsDisabled") || [];
    const keybindingsDisabled = packagesWithKeymapsDisabled.includes(this.namespace);
    if (keybindingsDisabled) {
      this.refs.keybindingItems.classList.add("text-subtle");
    } else {
      this.refs.keybindingItems.classList.remove("text-subtle");
    }

    const keyBindings = [];
    if (atom.keymaps.build) {
      // eslint-disable-next-line no-unused-vars
      for (const [keymapPath, keymap] of atom.packages.getLoadedPackage(this.namespace).keymaps) {
        keyBindings.push(...atom.keymaps.build(this.namespace, keymap, 0, false));
      }
    } else {
      // Backwards compatibility for Atom <= 1.19
      for (const keyBinding of atom.keymaps.getKeyBindings()) {
        const { command } = keyBinding;
        if (command && command.indexOf && command.indexOf(`${this.namespace}:`) === 0) {
          keyBindings.push(keyBinding);
        }
      }
    }

    const visibleBindings = keyBindings
      .filter(({ command, selector }) => command && this.selectorIsCompatibleWithPlatform(selector))
      .sort((a, b) => {
        return (
          String(a.keystrokes).localeCompare(String(b.keystrokes)) ||
          String(a.command).localeCompare(String(b.command)) ||
          String(a.selector).localeCompare(String(b.selector))
        );
      });
    const groupCounts = visibleBindings.reduce((counts, binding) => {
      counts.set(binding.keystrokes, (counts.get(binding.keystrokes) || 0) + 1);
      return counts;
    }, new Map());
    const renderedShortcuts = new Set();
    const fragment = document.createDocumentFragment();
    for (const keyBinding of visibleBindings) {
      const renderShortcut = !renderedShortcuts.has(keyBinding.keystrokes);
      renderedShortcuts.add(keyBinding.keystrokes);
      fragment.appendChild(
        this.elementForKeyBinding(keyBinding, {
          renderShortcut,
          shortcutRowSpan: groupCounts.get(keyBinding.keystrokes),
        }),
      );
    }
    this.refs.keybindingItems.appendChild(fragment);
  }

  elementForKeyBinding(keyBinding, { renderShortcut, shortcutRowSpan }) {
    const { command, keystrokes, selector } = keyBinding;
    const row = document.createElement("tr");
    row.dataset.selector = selector;
    row.dataset.keystrokes = keystrokes;
    row.dataset.command = command;

    const shortcutCell = this.createCell("keystroke", "Shortcut");
    const shortcut = document.createElement("kbd");
    shortcut.textContent = keystrokes;
    shortcutCell.appendChild(shortcut);
    if (renderShortcut) {
      shortcutCell.rowSpan = shortcutRowSpan;
    } else {
      shortcutCell.classList.add("keybinding-mobile-shortcut");
    }
    row.appendChild(shortcutCell);

    const commandCell = this.createCell("command", "Command");
    commandCell.textContent = command;
    commandCell.title = command;
    row.appendChild(commandCell);

    const selectorCell = this.createCell("selector", "Context");
    selectorCell.textContent = selector;
    selectorCell.title = selector;
    row.appendChild(selectorCell);

    const actionsCell = this.createCell("actions", "Actions");
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.classList.add("btn", "btn-xs", "icon", "icon-clippy", "copy-keybinding");
    copyButton.textContent = "Copy";
    copyButton.setAttribute("aria-label", `Copy override for ${keystrokes}`);
    actionsCell.appendChild(copyButton);
    row.appendChild(actionsCell);
    return row;
  }

  createCell(className, label) {
    const cell = document.createElement("td");
    cell.classList.add(className);
    cell.dataset.label = label;
    return cell;
  }

  writeKeyBindingToClipboard({ selector, keystrokes, command }) {
    const keymapExtension = path.extname(atom.keymaps.getUserKeymapPath());
    const escapeCSON = (input) => {
      return JSON.stringify(input).slice(1, -1).replace(/\\"/g, '"').replace(/'/g, "\\'");
    };
    const content =
      keymapExtension === ".cson"
        ? `'${escapeCSON(selector)}':\n  '${escapeCSON(keystrokes)}': '${escapeCSON(command)}'`
        : `${JSON.stringify(selector)}: {\n  ${JSON.stringify(keystrokes)}: ${JSON.stringify(command)}\n}`;

    atom.clipboard.write(content);
  }

  showCopyFeedback(button) {
    button.textContent = "Copied";
    button.classList.add("copied");
    const timeout = setTimeout(() => {
      this.copyFeedbackTimeouts.delete(timeout);
      if (button.isConnected) {
        button.textContent = "Copy";
        button.classList.remove("copied");
      }
    }, 1200);
    this.copyFeedbackTimeouts.add(timeout);
  }

  selectorIsCompatibleWithPlatform(selector, platform = process.platform) {
    const otherPlatformPattern = new RegExp(`\\.platform-(?!${_.escapeRegExp(platform)}\\b)`);
    const currentPlatformPattern = new RegExp(`\\.platform-(${_.escapeRegExp(platform)}\\b)`);

    return !(otherPlatformPattern.test(selector) && !currentPlatformPattern.test(selector));
  }
}
