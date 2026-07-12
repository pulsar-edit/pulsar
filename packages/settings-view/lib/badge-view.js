/** @babel */
/** @jsx etch.dom */

import { CompositeDisposable, Disposable } from "atom";
import etch from "etch";

// Renders a package badge (e.g. Pulsar's "Outdated" / "Made for Pulsar") as a
// small colored dot. The badge title and text are shown in a hover tooltip, and
// clicking a badge that carries a link opens it in the browser.
export default class BadgeView {
  constructor(badge) {
    this.badge = badge;
    this.disposables = new CompositeDisposable();

    etch.initialize(this);

    const tooltip = this.tooltipText();
    if (tooltip) {
      this.disposables.add(atom.tooltips.add(this.element, { title: tooltip }));
    }

    if (this.hasLink()) {
      const clickHandler = (event) => {
        event.stopPropagation();
        event.preventDefault();
        atom.openExternal(this.badge.link);
      };
      this.element.addEventListener("click", clickHandler);
      this.disposables.add(
        new Disposable(() => this.element.removeEventListener("click", clickHandler)),
      );
    }
  }

  destroy() {
    this.disposables.dispose();
    return etch.destroy(this);
  }

  update() {}

  render() {
    const classes = `package-badge-dot ${this.dotClass()}${this.hasLink() ? " has-link" : ""}`;
    return <span className={classes} />;
  }

  tooltipText() {
    return [this.badge.title, this.badge.text]
      .filter((part) => typeof part === "string")
      .join(": ");
  }

  hasLink() {
    return typeof this.badge.link === "string";
  }

  dotClass() {
    switch (this.badge.type) {
      case "warn":
        return "badge-dot-warn";
      case "success":
        return "badge-dot-success";
      case "info":
        return "badge-dot-info";
      case "error":
        return "badge-dot-error";
      default:
        return "badge-dot-default";
    }
  }
}
