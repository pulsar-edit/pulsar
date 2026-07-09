const { MalformedTemplateError } = require("./error.js");
const { MenuItem } = require("./item.js");
const { Utils } = require("./utils.js");
const { Submenu } = require("./submenu.js");
const SubmenuParent = require("./submenu-parent.js");

class MenuLabel {
  constructor(element) {
    this.element = element;
    this.menuBox = null;
    this.labelText = undefined;
    this.submenu = new Submenu();
    this.open = false;
    this.focused = false;
    this.altTrigger = undefined;
    this.parent = undefined;
    this.scrollHandler = null;
    this.scrollPending = false;
    SubmenuParent.initSubmenuParent(this);
    this.menuLeaveHandler = null;

    this.element.addEventListener("click", (e) => this.onMouseClick(e));
    this.element.addEventListener("mouseenter", (e) => this.onMouseEnter(e));
  }

  static createMenuLabel(labelItem) {
    if (labelItem.label === undefined || !labelItem.submenu) {
      throw new MalformedTemplateError("Label template is malformed!");
    }

    const labelEl = document.createElement("span");
    labelEl.classList.add("menu-label");
    const labelData = Utils.formatAltKey(labelItem.label);
    labelEl.setAttribute("label", labelData.name);
    labelEl.setAttribute("alt-trigger", labelData.key);
    labelEl.innerHTML = labelData.html;

    const self = new MenuLabel(labelEl);
    self.labelText = labelItem.label;
    self.altTrigger = labelData.key || undefined;

    const submenuEl = document.createElement("div");
    submenuEl.classList.add("menu-box");
    labelEl.appendChild(submenuEl);
    self.menuBox = submenuEl;

    labelItem.submenu.forEach((o) => {
      try {
        const cleanedItem = MenuItem.cleanTemplateLabels(o);
        self.addChild(MenuItem.createMenuItem(cleanedItem));
      } catch (e) {
        console.error(e);
      }
    });

    return self;
  }

  serialize() {
    return {
      label: this.labelText,
      submenu: this.submenu.map((o) => {
        return o.serialize();
      }),
    };
  }

  onMouseClick(e) {
    e.stopPropagation();
    this.parent?.onLabelClicked?.(this, e);
  }

  onMouseEnter(e) {
    e.stopPropagation();
    this.parent?.onLabelMouseEnter?.(this, e);
  }

  onChildClick() {}

  onChildMouseEnter(target, e) {
    SubmenuParent.onChildMouseEnter(this, target, e);
  }

  onChildMouseMove(target, e) {
    SubmenuParent.onChildMouseMove(this, target, e);
  }

  clearFocus() {
    SubmenuParent.clearFocus(this);
  }

  getElement() {
    return this.element;
  }

  getLabelText() {
    return this.labelText;
  }

  getSubmenu() {
    return this.submenu;
  }

  isOpen() {
    return this.open;
  }

  isFocused() {
    return this.focused;
  }

  getAltTrigger() {
    return this.altTrigger;
  }

  getParent() {
    return this.parent;
  }

  setOpen(flag) {
    this.open = flag;

    // Clear any pending submenu timer when closing
    if (!flag && this.submenuTimer) {
      clearTimeout(this.submenuTimer);
      this.submenuTimer = null;
    }

    if (flag) {
      this.setFocused(false);
      this.submenu.forEach((o) => o.ensureKeystroke?.());
      this.setupScrolling();
    } else {
      this.cleanupScrolling();
    }
    this.submenu.forEach((o) => {
      o.setOpen(false);
      if (!flag) o.setSelected(false);
    });
    Utils.setToggleClass(this.element, "open", flag);
  }

  setupScrolling() {
    if (!this.menuBox) return;

    this.positionMenuBox();

    // Add RAF-throttled scroll listener to reposition open submenus
    if (!this.scrollHandler) {
      this.scrollHandler = () => {
        if (this.scrollPending) return;
        this.scrollPending = true;
        requestAnimationFrame(() => {
          this.scrollPending = false;
          this.submenu.forEach((item) => {
            if (item.isOpen() && item.isPortaled()) {
              item.positionPortaledSubmenu();
            }
          });
        });
      };
      this.menuBox.addEventListener("scroll", this.scrollHandler);
    }

    // Add mouseleave listener to clear focus when leaving menu
    if (!this.menuLeaveHandler) {
      this.menuLeaveHandler = () => this.clearFocus();
      this.menuBox.addEventListener("mouseleave", this.menuLeaveHandler);
    }
  }

  positionMenuBox() {
    if (!this.menuBox) return;

    const labelRect = this.element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const edgePadding = 8;

    this.menuBox.style.left = "0px";
    this.menuBox.style.transform = "none";
    this.menuBox.style.maxHeight = "";

    const menuRect = this.menuBox.getBoundingClientRect();
    const menuWidth = menuRect.width;
    let left = labelRect.left;

    if (left + menuWidth > viewportWidth - edgePadding) {
      left = viewportWidth - menuWidth - edgePadding;
    }
    if (left < edgePadding) {
      left = edgePadding;
    }

    const availableHeight = viewportHeight - labelRect.bottom - edgePadding;

    this.menuBox.style.left = `${left - labelRect.left}px`;
    this.menuBox.style.maxHeight = `${Math.max(1, availableHeight)}px`;
  }

  cleanupScrolling() {
    if (!this.menuBox) return;

    // Reset scroll position
    this.menuBox.scrollTop = 0;
    this.scrollPending = false;

    // Remove scroll handler
    if (this.scrollHandler) {
      this.menuBox.removeEventListener("scroll", this.scrollHandler);
      this.scrollHandler = null;
    }

    // Remove mouseleave handler
    if (this.menuLeaveHandler) {
      this.menuBox.removeEventListener("mouseleave", this.menuLeaveHandler);
      this.menuLeaveHandler = null;
    }
  }

  moveSubmenusToPortal(portalContainer) {
    this.portalContainer = portalContainer;
    this.submenu.forEach((item) => {
      if (item.hasSubmenu()) {
        item.setPortalContainer?.(portalContainer);
      }
    });
  }

  setFocused(flag) {
    this.focused = flag;
    Utils.setToggleClass(this.element, "focused", flag);
  }

  setParent(parent) {
    this.parent = parent;
  }

  addChild(item) {
    item.setParent(this);
    item.setPortalContainer?.(this.portalContainer);
    this.submenu.push(item);
    this.menuBox?.appendChild(item.getElement());
  }

  insertChild(item, index) {
    item.setParent(this);
    item.setPortalContainer?.(this.portalContainer);
    this.submenu?.splice(index, 0, item);
    this.menuBox?.insertBefore(item.getElement(), this.menuBox.children[index] || null);
  }

  removeChild(x) {
    if (x instanceof MenuItem) {
      this.submenu?.splice(this.submenu?.indexOf(x), 1);
      x.getElement().parentElement?.removeChild(x.getElement());
      return;
    }

    const item = this.submenu?.splice(x, 1)[0];
    item?.getElement().parentElement?.removeChild(item?.getElement());
  }
}

module.exports = { MenuLabel };
