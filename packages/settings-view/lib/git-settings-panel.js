/** @babel */
/** @jsx etch.dom */

import { CompositeDisposable } from "atom";
import etch from "etch";
import SettingsPanel from "./settings-panel";

export default class GitSettingsPanel {
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
      <div tabIndex="0" className="panels-item">
        <SettingsPanel
          namespace="git"
          icon="git-branch"
          note={`<div class="text icon icon-question" id="git-settings-note" tabindex="-1">These settings control Lumine's built-in Git integration: the git executable it runs, repository discovery, and related prompts.</div>`}
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
