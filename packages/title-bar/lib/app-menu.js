const { MenuLabel } = require("./label.js");
const { MenuItem } = require("./item.js");
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
    this.overflowStartIndex = this.labels.length;
    this.portalContainer = null;

    this.overflowLabel = MenuLabel.createMenuLabel({ label: "...", submenu: [] });
    this.overflowLabel.setParent(this);
    this.overflowLabel.getElement().classList.add("overflow-menu-label", "overflowed");
    this.overflowLabel.getElement().setAttribute("aria-label", "More application menus");
    this.element.appendChild(this.overflowLabel.getElement());

    // Store handler references for cleanup
    this.clickHandler = () => this.blur();
    this.keydownHandler = (e) => this.onKeyDown(e);
    this.keyupHandler = (e) => this.onKeyUp(e);
    this.wheelHandler = (e) => this.onWheel(e);

    window.addEventListener("click", this.clickHandler);
    // Capture phase so an alt-scroll gesture cancels menu activation no matter
    // where it originates or whether an inner handler stops propagation.
    window.addEventListener("wheel", this.wheelHandler, { capture: true, passive: true });
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
    this.getAllLabels().forEach((o) => {
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

        this.labels.some((o, index) => {
          if (o.getAltTrigger() !== undefined && o.getAltTrigger() === e.key.toLowerCase()) {
            if (focusedLabel) {
              focusedLabel.setFocused(false);
            }
            if (index < this.overflowStartIndex) {
              o.setOpen(true);
            } else {
              const overflowItem = this.overflowLabel.getSubmenu()[index - this.overflowStartIndex];
              this.overflowLabel.setOpen(true);
              overflowItem?.setOpen(true);
              overflowItem?.getSubmenu()?.selectFirstItem();
            }
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

  onWheel(e) {
    // An alt-scroll gesture cancels the pending "Alt activates the menu"
    // action, mirroring native menu-bar behavior where any intervening action
    // during the Alt hold aborts activation. Only act while an Alt hold is
    // actually pending so ordinary scrolling stays a no-op.
    if (!e.altKey || !(this.attentive || this.showingAltKeys)) {
      return;
    }
    // Gate on the same state the editor uses to amplify alt-wheel scrolling
    // (`editor.altWheelMultiplier !== 1`). When the multiplier is disabled the
    // alt+wheel is not an alt-scroll gesture, so leave menu activation intact.
    if (atom.config.get("editor.altWheelMultiplier") === 1) {
      return;
    }
    this.attentive = false;
    this.showAltKeys(false);
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
    this.getAllLabels().forEach((o) => {
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
    this.getNavigableLabels()[0]?.setOpen(true);
  }

  openLastLabel() {
    const labels = this.getNavigableLabels();
    labels[labels.length - 1]?.setOpen(true);
  }

  openNextLabel() {
    let label = this.getOpenLabel();
    if (label) {
      const labels = this.getNavigableLabels();
      label.setOpen(false);
      labels[Utils.mod(labels.indexOf(label) + 1, labels.length)]?.setOpen(true);
    }
  }

  openPreviousLabel() {
    let label = this.getOpenLabel();
    if (label) {
      const labels = this.getNavigableLabels();
      label.setOpen(false);
      labels[Utils.mod(labels.indexOf(label) - 1, labels.length)]?.setOpen(true);
    }
  }

  focusFirstLabel() {
    const labels = this.getNavigableLabels();
    this.getAllLabels().forEach((o) => {
      o.setFocused(false);
    });
    labels[0]?.setFocused(true);
  }

  focusLastLabel() {
    const labels = this.getNavigableLabels();
    this.getAllLabels().forEach((o) => {
      o.setFocused(false);
    });
    labels[labels.length - 1]?.setFocused(true);
  }

  focusNextLabel() {
    let label = this.getFocusedLabel();
    if (label) {
      const labels = this.getNavigableLabels();
      label.setFocused(false);
      labels[Utils.mod(labels.indexOf(label) + 1, labels.length)]?.setFocused(true);
    }
  }

  focusPreviousLabel() {
    let label = this.getFocusedLabel();
    if (label) {
      const labels = this.getNavigableLabels();
      label.setFocused(false);
      labels[Utils.mod(labels.indexOf(label) - 1, labels.length)]?.setFocused(true);
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

    this.getNavigableLabels().some((o) => {
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

    this.getNavigableLabels().some((o) => {
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
    return this.getNavigableLabels().find((o) => o.isOpen()) || null;
  }

  getFocusedLabel() {
    return this.getNavigableLabels().find((o) => o.isFocused()) || null;
  }

  getElement() {
    return this.element;
  }

  getLabels() {
    return this.labels;
  }

  getAllLabels() {
    return [...this.labels, this.overflowLabel];
  }

  getNavigableLabels() {
    return this.getAllLabels().filter(
      (label) => !label.getElement().classList.contains("overflowed"),
    );
  }

  getOverflowStartIndex() {
    return this.overflowStartIndex;
  }

  setOverflowStartIndex(index, force = false) {
    const overflowStartIndex = Math.max(0, Math.min(index, this.labels.length));
    if (!force && overflowStartIndex === this.overflowStartIndex) {
      return;
    }

    this.cachedOpenLeaf = null;
    this.overflowLabel.setOpen(false);
    this.overflowLabel.setFocused(false);
    this.clearOverflowItems();
    this.overflowStartIndex = overflowStartIndex;

    this.labels.forEach((label, labelIndex) => {
      const overflowed = labelIndex >= overflowStartIndex;
      label.getElement().classList.toggle("overflowed", overflowed);
      if (overflowed) {
        label.setOpen(false);
        label.setFocused(false);
        this.overflowLabel.addChild(
          MenuItem.createMenuItem({
            label: label.getLabelText(),
            submenu: label.getSubmenu().map((item) => item.serialize()),
          }),
        );
      }
    });

    const hasOverflow = overflowStartIndex < this.labels.length;
    this.overflowLabel.getElement().classList.toggle("overflowed", !hasOverflow);
    if (hasOverflow && this.portalContainer) {
      this.overflowLabel.moveSubmenusToPortal(this.portalContainer);
    }
  }

  measureOverflowLabelWidth() {
    const element = this.overflowLabel.getElement();
    const wasOverflowed = element.classList.contains("overflowed");
    const previousVisibility = element.style.visibility;

    element.classList.remove("overflowed");
    element.style.visibility = "hidden";
    const width = element.getBoundingClientRect().width;
    element.style.visibility = previousVisibility;
    element.classList.toggle("overflowed", wasOverflowed);

    return width;
  }

  clearOverflowItems() {
    [...this.overflowLabel.getSubmenu()].forEach((item) => {
      this.removePortaledSubmenus(item);
      this.overflowLabel.removeChild(item);
    });
  }

  removePortaledSubmenus(item) {
    item.getSubmenu()?.forEach((child) => this.removePortaledSubmenus(child));
    item.portalElement?.remove();
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
    this.element.insertBefore(labelItem.getElement(), this.overflowLabel.getElement());
    this.overflowStartIndex = this.labels.length;
  }

  insertLabel(item, index) {
    const referenceElement = this.labels[index]?.getElement() || this.overflowLabel.getElement();
    item.setParent(this);
    this.labels.splice(index, 0, item);
    this.element.insertBefore(item.getElement(), referenceElement);
    this.setOverflowStartIndex(this.labels.length, true);
  }

  removeLabel(x) {
    if (x instanceof MenuLabel) {
      this.labels.splice(this.labels.indexOf(x), 1);
      x.getElement().parentElement?.removeChild(x.getElement());
      this.setOverflowStartIndex(this.labels.length, true);
      return;
    }

    const item = this.labels.splice(x, 1)[0];
    item?.getElement().parentElement?.removeChild(item?.getElement());
    this.setOverflowStartIndex(this.labels.length, true);
  }

  setupSubmenuPortals(portalContainer) {
    this.portalContainer = portalContainer;
    this.labels.forEach((label) => {
      label.moveSubmenusToPortal(portalContainer);
    });
    this.overflowLabel.moveSubmenusToPortal(portalContainer);
  }

  destroy() {
    window.removeEventListener("click", this.clickHandler);
    window.removeEventListener("wheel", this.wheelHandler, { capture: true });
    document.body.removeEventListener("keydown", this.keydownHandler);
    document.body.removeEventListener("keyup", this.keyupHandler);
    this.paneItemDisposable?.dispose();
    this.clearOverflowItems();
  }
}

module.exports = { ApplicationMenu };
