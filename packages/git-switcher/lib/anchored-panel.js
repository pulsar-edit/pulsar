// A lightweight popover container that satisfies the panel contract of
// SelectListView (show/hide/isVisible/destroy), so a select list can open as a
// compact overlay anchored to a status bar tile instead of the centered modal.
// Without an anchor it falls back to a centered presentation.
module.exports = class AnchoredPanel {
  constructor({ className } = {}) {
    this.element = document.createElement("div");
    this.element.classList.add("git-switcher-popover");
    if (className) {
      this.element.classList.add(className);
    }
    this.element.style.display = "none";
    this.visible = false;
    this.anchor = null;
    this.previouslyFocused = null;
    this.onDidDismiss = null;

    this.handleWindowMousedown = (event) => {
      if (!this.visible) {
        return;
      }
      if (this.element.contains(event.target)) {
        return;
      }
      if (this.anchor && this.anchor.contains(event.target)) {
        return;
      }
      if (this.onDidDismiss) {
        this.onDidDismiss();
      }
    };
    window.addEventListener("mousedown", this.handleWindowMousedown, true);

    document.body.appendChild(this.element);
  }

  setItem(item) {
    this.element.appendChild(item);
  }

  setAnchor(anchor) {
    this.anchor = anchor || null;
  }

  show() {
    this.previouslyFocused = document.activeElement;
    this.element.style.display = "";
    this.visible = true;
    this.position();
  }

  position() {
    const rect = this.anchor?.getBoundingClientRect();
    if (rect && rect.width > 0) {
      // The status bar sits at the bottom of the window; open upward from the
      // anchor tile and keep the popover inside the window horizontally.
      this.element.classList.remove("git-switcher-popover--centered");
      const width = this.element.offsetWidth;
      const left = Math.max(4, Math.min(rect.left, window.innerWidth - width - 4));
      this.element.style.left = `${left}px`;
      this.element.style.bottom = `${window.innerHeight - rect.top + 4}px`;
    } else {
      this.element.classList.add("git-switcher-popover--centered");
      this.element.style.left = "";
      this.element.style.bottom = "";
    }
  }

  hide() {
    if (!this.visible) {
      return;
    }
    this.element.style.display = "none";
    this.visible = false;
    if (this.previouslyFocused && document.contains(this.previouslyFocused)) {
      this.previouslyFocused.focus?.();
    }
    this.previouslyFocused = null;
  }

  isVisible() {
    return this.visible;
  }

  destroy() {
    window.removeEventListener("mousedown", this.handleWindowMousedown, true);
    this.element.remove();
  }
};
