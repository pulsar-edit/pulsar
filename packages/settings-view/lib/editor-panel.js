/** @babel */
/** @jsx etch.dom */

import { CompositeDisposable } from "atom";
import etch from "etch";
import SettingsPanel from "./settings-panel";

export default class EditorPanel {
  constructor() {
    etch.initialize(this);
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(
      atom.commands.add(this.element, {
        "core:move-up": () => {
          this.scrollUp();
        },
        "core:move-down": () => {
          this.scrollDown();
        },
        "core:page-up": () => {
          this.pageUp();
        },
        "core:page-down": () => {
          this.pageDown();
        },
        "core:move-to-top": () => {
          this.scrollToTop();
        },
        "core:move-to-bottom": () => {
          this.scrollToBottom();
        },
      }),
    );
  }

  destroy() {
    this.subscriptions.dispose();
    return etch.destroy(this);
  }

  update() {}

  render() {
    return (
      <div tabIndex="0" className="panels-item" onclick={this.didClick}>
        <SettingsPanel
          namespace="editor"
          icon="code"
          note={`<div class="text icon icon-question" id="editor-settings-note" tabindex="-1">These settings apply to every text editor. Settings that can differ per language, such as indentation and soft wrap, live in the <a class="link languages-open">Languages panel</a>.</div>`}
        />
      </div>
    );
  }

  focus() {
    this.element.focus();
  }

  show() {
    this.element.style.display = "";
  }

  didClick(event) {
    const target = event.target.closest(".languages-open");
    if (target) {
      atom.workspace.open("atom://config/languages");
    }
  }

  scrollUp() {
    this.element.scrollTop -= document.body.offsetHeight / 20;
  }

  scrollDown() {
    this.element.scrollTop += document.body.offsetHeight / 20;
  }

  pageUp() {
    this.element.scrollTop -= this.element.offsetHeight;
  }

  pageDown() {
    this.element.scrollTop += this.element.offsetHeight;
  }

  scrollToTop() {
    this.element.scrollTop = 0;
  }

  scrollToBottom() {
    this.element.scrollTop = this.element.scrollHeight;
  }
}
