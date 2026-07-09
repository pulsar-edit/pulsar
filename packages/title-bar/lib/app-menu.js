const { MenuLabel } = require("./label.js");
const { Utils } = require("./utils.js");

// Lazy require to avoid circular dependency
let TitleBar = null;
function getTitleBar() {
  if (!TitleBar) {
    TitleBar = require("./replacer.js").TitleBar;
  }
  return TitleBar;
}

class ApplicationMenu {
  constructor(element, parent) {
    this.element = element;
    this.labels = [];
    this.attentive = false;
    this.showingAltKeys = false;
    this.parent = parent;
    this.cachedOpenLeaf = null;
    this._skipBlurCount = 0;

    // Store handler references for cleanup
    this.clickHandler = () => this.blur();
    this.keydownHandler = (e) => this.onKeyDown(e);
    this.keyupHandler = (e) => this.onKeyUp(e);

    window.addEventListener("click", this.clickHandler);
    this.paneItemDisposable = atom.workspace.onDidChangeActivePaneItem(() => this.blur());

    document.body.addEventListener("keydown", this.keydownHandler);
    document.body.addEventListener("keyup", this.keyupHandler);
  }

  static createApplicationMenu(menuTemplate, parent) {
    const menuElement = document.createElement("div");
    menuElement.classList.add("app-menu");

    const self = new ApplicationMenu(menuElement, parent);

    self.labels = [];
    menuTemplate.forEach((o) => {
      try {
        self.addLabel(MenuLabel.createMenuLabel(o));
      } catch (e) {
        console.error(e);
      }
    });

    return self;
  }

  serialize() {
    return this.labels.map((o) => {
      return o.serialize();
    });
  }

  onLabelClicked(target) {
    this.cachedOpenLeaf = null; // Invalidate cache
    if (target.isOpen()) {
      target.setOpen(false);
      return;
    }
    this.labels.forEach((o) => {
      o.setOpen(false);
    });
    target.setOpen(true);
  }

  onLabelMouseEnter(target, e) {
    const bar = getTitleBar();
    if (this.isOpen() && !target.isOpen() && bar.configState.openAdjacent) {
      this.onLabelClicked(target, e);
    }
  }

  onKeyDown(e) {
    const bar = getTitleBar();
    // Only Escape closes the menu (not Alt) - Alt toggle is handled separately
    if (
      !e.repeat &&
      e.key === "Escape" &&
      (this.showingAltKeys || this.isOpen() || this.isFocused())
    ) {
      this.close();
      this.getFocusedLabel()?.setFocused(false);
      this.attentive = false;
      this.showAltKeys(false);
      return;
    }

    if (e.key === "Alt") {
      if (e.repeat) {
        return;
      }
      // Don't handle Alt if title bar is hidden
      if (!this.parent?.isTitleBarVisible()) {
        return;
      }
      // Only handle Alt if altGivesFocus is enabled
      if (!bar.configState.altGivesFocus) {
        return;
      }
      // Don't toggle attentive if menu is already open or focused
      if (!this.isOpen() && !this.isFocused()) {
        this.attentive = !this.attentive;
      }
      // Only show mnemonics if menuBarMnemonics is enabled
      if (bar.configState.menuBarMnemonics) {
        // Only toggle alt keys if menu is not open
        if (!this.isOpen() && !this.isFocused()) {
          this.showAltKeys(!this.showingAltKeys);
        }
      }
      return;
    }

    const openLabel = this.getOpenLabel();
    const focusedLabel = this.getFocusedLabel();
    if (openLabel) {
      let selected = this.getSelectedLeaf();
      switch (e.key) {
        case "ArrowUp": {
          this.cachedOpenLeaf = null; // Invalidate cache (submenu may have opened via hover)
          const openLeaf = this.getOpenLeaf();
          // If there's an open submenu deeper than the main menu, navigate there
          if (openLeaf && !(openLeaf instanceof MenuLabel)) {
            const submenu = openLeaf.getSubmenu();
            const submenuSelected = submenu.getSelected();
            if (submenuSelected) {
              submenu.selectPreviousItem(true); // wrap=true for submenus
            } else {
              submenu.selectLastItem();
            }
          } else if (!selected) {
            openLeaf.getSubmenu().selectLastItem();
          } else {
            // Wrap only in nested submenus (parent is MenuItem, not MenuLabel)
            const wrapUp = !(selected.getParent() instanceof MenuLabel);
            selected.getParent()?.getSubmenu()?.selectPreviousItem(wrapUp);
          }
          Utils.stopEvent(e);
          return;
        }

        case "ArrowDown": {
          this.cachedOpenLeaf = null; // Invalidate cache (submenu may have opened via hover)
          const openLeaf = this.getOpenLeaf();
          // If there's an open submenu deeper than the main menu, navigate there
          if (openLeaf && !(openLeaf instanceof MenuLabel)) {
            const submenu = openLeaf.getSubmenu();
            const submenuSelected = submenu.getSelected();
            if (submenuSelected) {
              submenu.selectNextItem(true); // wrap=true for submenus
            } else {
              submenu.selectFirstItem();
            }
          } else if (!selected) {
            openLeaf.getSubmenu().selectFirstItem();
          } else {
            // Wrap only in nested submenus (parent is MenuItem, not MenuLabel)
            const wrapDown = !(selected.getParent() instanceof MenuLabel);
            selected.getParent()?.getSubmenu()?.selectNextItem(wrapDown);
          }
          Utils.stopEvent(e);
          return;
        }

        case "ArrowLeft":
          this.cachedOpenLeaf = null; // Invalidate cache
          if (!selected || selected.getParent() instanceof MenuLabel) {
            this.openPreviousLabel();
          } else {
            selected.getParent()?.setOpen(false);
            selected.getParent()?.setSelected(true);
          }
          Utils.stopEvent(e);
          return;

        case "ArrowRight":
          this.cachedOpenLeaf = null; // Invalidate cache
          if (!selected || !selected.hasSubmenu()) {
            this.openNextLabel();
          } else {
            // Close sibling submenus before opening this one
            selected
              .getParent()
              ?.getSubmenu()
              ?.forEach((o) => {
                if (o !== selected) {
                  o.setOpen(false);
                }
              });
            selected.setOpen(true);
            selected.getSubmenu()?.selectFirstItem();
          }
          Utils.stopEvent(e);
          return;

        case "Enter":
          if (selected && !selected.hasSubmenu()) {
            selected.execCommand();
            this.close();
            this.attentive = false;
            this.showAltKeys(false);
            Utils.stopEvent(e);
            return;
          }
          break;

        case " ": // Space
          if (selected && !selected.hasSubmenu()) {
            selected.bounce();
            selected.execCommand();
            Utils.stopEvent(e);
            return;
          }
          break;
      }

      if (this.showingAltKeys && !e.repeat) {
        let target = this.getOpenLeaf();
        if (target) {
          let handled = false;

          target
            .getSubmenu()
            ?.getSelectable()
            .some((o) => {
              if (o.getAltTrigger() !== undefined && o.getAltTrigger() === e.key.toLowerCase()) {
                o.execCommand();
                this.close();
                this.attentive = false;
                this.showAltKeys(false);
                Utils.stopEvent(e);
                handled = true;
                return true;
              }
              return false;
            });

          if (handled) {
            return;
          }
        }
      }
    } else {
      if (focusedLabel) {
        switch (e.key) {
          case "Enter":
          case "ArrowDown":
            focusedLabel.setOpen(true);
            focusedLabel.getSubmenu()?.selectFirstItem();
            Utils.stopEvent(e);
            return;

          case "ArrowUp":
            // Just stop event, nothing to navigate up to when focused
            Utils.stopEvent(e);
            return;

          case "ArrowLeft":
            this.focusPreviousLabel();
            Utils.stopEvent(e);
            return;

          case "ArrowRight":
            this.focusNextLabel();
            Utils.stopEvent(e);
            return;
        }
      }
      // Only handle label mnemonics if menu bar is visible
      if (this.showingAltKeys && !e.repeat && this.parent?.isMenuBarVisible()) {
        let handled = false;

        this.labels.some((o) => {
          if (o.getAltTrigger() !== undefined && o.getAltTrigger() === e.key.toLowerCase()) {
            if (focusedLabel) {
              focusedLabel.setFocused(false);
            }
            o.setOpen(true);
            Utils.stopEvent(e);
            handled = true;
            return true;
          }
          return false;
        });

        if (handled) {
          return;
        }
      }
    }

    if (this.shouldCloseOnUnhandledKey(e)) {
      this.close();
      this.getFocusedLabel()?.setFocused(false);
      this.attentive = false;
      this.showAltKeys(false);
      return;
    }

    this.attentive = false;
    this.showAltKeys(false);
  }

  shouldCloseOnUnhandledKey(e) {
    if (!this.showingAltKeys && !this.isOpen() && !this.isFocused()) {
      return false;
    }

    if (this.isStandaloneModifierKeyEvent(e)) {
      return false;
    }

    return true;
  }

  isStandaloneModifierKeyEvent(e) {
    switch (e.key) {
      case "Control":
      case "Alt":
      case "Shift":
      case "Meta":
        return true;
      default:
        return false;
    }
  }

  onKeyUp(e) {
    const bar = getTitleBar();
    if (e.key === "Alt" && !this.isFocused() && !this.isOpen()) {
      // Don't handle Alt if title bar is hidden
      if (!this.parent?.isTitleBarVisible()) {
        this.attentive = false;
        return;
      }

      if (this.showingAltKeys) {
        if (!bar.configState.altGivesFocus && !bar.configState.autoHide) {
          this.showAltKeys(false);
        }
      }

      if (this.attentive) {
        if (bar.configState.autoHide) {
          this.parent?.setMenuBarVisible(true);
        }

        if (bar.configState.altGivesFocus) {
          this.focusFirstLabel();
        }
      }

      this.attentive = false;
    }
  }

  blur() {
    if (this._skipBlurCount > 0) {
      this._skipBlurCount--;
      return;
    }
    this.close();
    this.getFocusedLabel()?.setFocused(false);
    this.attentive = false;
    this.showAltKeys(false);
  }

  focusMenuCommand() {
    this._skipBlurCount = 2;
    setTimeout(() => this.focusFirstLabel(), 0);
  }

  close() {
    this.cachedOpenLeaf = null; // Invalidate cache
    const bar = getTitleBar();
    this.labels.forEach((o) => {
      if (o.isOpen()) {
        o.setOpen(false);
      }
    });

    if (bar.configState.autoHide) {
      this.parent?.setMenuBarVisible(false);
    }

    if (!bar.configState.menuBarMnemonics) {
      this.attentive = true;
    }
  }

  showAltKeys(flag) {
    Utils.setToggleClass(this.element, "alt-down", flag);
    this.showingAltKeys = flag;
  }

  openFirstLabel() {
    this.labels[0]?.setOpen(true);
  }

  openLastLabel() {
    this.labels[this.labels.length - 1]?.setOpen(true);
  }

  openNextLabel() {
    let label = this.getOpenLabel();
    if (label) {
      label.setOpen(false);
      this.labels[Utils.mod(this.labels.indexOf(label) + 1, this.labels.length)].setOpen(true);
    }
  }

  openPreviousLabel() {
    let label = this.getOpenLabel();
    if (label) {
      label.setOpen(false);
      this.labels[Utils.mod(this.labels.indexOf(label) - 1, this.labels.length)].setOpen(true);
    }
  }

  focusFirstLabel() {
    this.labels.forEach((o) => {
      o.setFocused(false);
    });
    this.labels[0]?.setFocused(true);
  }

  focusLastLabel() {
    this.labels.forEach((o) => {
      o.setFocused(false);
    });
    this.labels[this.labels.length - 1]?.setFocused(true);
  }

  focusNextLabel() {
    let label = this.getFocusedLabel();
    if (label) {
      label.setFocused(false);
      this.labels[Utils.mod(this.labels.indexOf(label) + 1, this.labels.length)].setFocused(true);
    }
  }

  focusPreviousLabel() {
    let label = this.getFocusedLabel();
    if (label) {
      label.setFocused(false);
      this.labels[Utils.mod(this.labels.indexOf(label) - 1, this.labels.length)].setFocused(true);
    }
  }

  getOpenLeaf() {
    if (this.cachedOpenLeaf !== null) {
      return this.cachedOpenLeaf;
    }

    let result = null;

    const recurseItem = (item) => {
      let curr = null;
      item.getSubmenu()?.some((o) => {
        if (o.hasSubmenu() && o.isOpen()) {
          curr = o;
          let tmp = recurseItem(o);
          if (tmp !== null) {
            curr = tmp;
          }
          return true;
        }
        return false;
      });
      return curr;
    };

    this.labels.some((o) => {
      if (o.isOpen()) {
        result = o;
        let tmp = recurseItem(o);
        if (tmp !== null) {
          result = tmp;
        }
        return true;
      }
      return false;
    });

    this.cachedOpenLeaf = result;
    return result;
  }

  getSelectedLeaf() {
    let result = null;

    const recurseItem = (item) => {
      let curr = null;
      item.getSubmenu()?.some((o) => {
        if (o.isSelected()) {
          curr = o;
        }
        // Recurse into open submenus even if parent not selected
        if (o.hasSubmenu() && o.isOpen()) {
          let tmp = recurseItem(o);
          if (tmp !== null) {
            curr = tmp;
          }
          return true;
        }
        return false;
      });
      return curr;
    };

    this.labels.some((o) => {
      if (o.isOpen()) {
        let tmp = recurseItem(o);
        if (tmp !== null) {
          result = tmp;
        }
        return true;
      }
      return false;
    });

    return result;
  }

  getOpenLabel() {
    return this.labels.find((o) => o.isOpen()) || null;
  }

  getFocusedLabel() {
    return this.labels.find((o) => o.isFocused()) || null;
  }

  getElement() {
    return this.element;
  }

  getLabels() {
    return this.labels;
  }

  isOpen() {
    return this.getOpenLabel() !== null;
  }

  isFocused() {
    return this.getFocusedLabel() !== null;
  }

  addLabel(labelItem) {
    labelItem.setParent(this);
    this.labels.push(labelItem);
    this.element.appendChild(labelItem.getElement());
  }

  insertLabel(item, index) {
    item.setParent(this);
    this.labels.splice(index, 0, item);
    this.element.insertBefore(
      item.getElement(),
      item.getElement().parentElement?.children[index] || null,
    );
  }

  removeLabel(x) {
    if (x instanceof MenuLabel) {
      this.labels.splice(this.labels.indexOf(x), 1);
      x.getElement().parentElement?.removeChild(x.getElement());
      return;
    }

    const item = this.labels.splice(x, 1)[0];
    item?.getElement().parentElement?.removeChild(item?.getElement());
  }

  setupSubmenuPortals(portalContainer) {
    this.labels.forEach((label) => {
      label.moveSubmenusToPortal(portalContainer);
    });
  }

  destroy() {
    window.removeEventListener("click", this.clickHandler);
    document.body.removeEventListener("keydown", this.keydownHandler);
    document.body.removeEventListener("keyup", this.keyupHandler);
    this.paneItemDisposable?.dispose();
  }
}

module.exports = { ApplicationMenu };
