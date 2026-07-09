const { MenuItem } = require("./item.js");
const { Submenu } = require("./submenu.js");
const { Utils } = require("./utils.js");
const SubmenuParent = require("./submenu-parent.js");

class ContextMenu {
  constructor(element, targetElement) {
    this.element = element;
    this.targetElement = targetElement;
    this.previouslyFocusedElement = document.activeElement;
    this.menuBox = null;
    this.items = new Submenu();
    this.destroyed = false;

    this.clickHandler = null;
    this.keydownHandler = null;
    this.blurHandler = null;
    this.scrollHandler = null;
    this.wheelHandler = null;
    this.menuScrollHandler = null;
    this.submenuPortal = null;
    SubmenuParent.initSubmenuParent(this);
    this.menuLeaveHandler = null;
  }

  static createContextMenu(menuTemplate, options) {
    const { x, y, targetElement, configState } = options;

    const element = document.createElement("div");
    element.classList.add("context-menu-container");

    const self = new ContextMenu(element, targetElement);
    self.configState = configState;

    const menuBox = document.createElement("div");
    menuBox.classList.add("menu-box", "context-menu-box");
    element.appendChild(menuBox);
    self.menuBox = menuBox;

    menuTemplate.forEach((item) => {
      try {
        const menuItem = MenuItem.createContextMenuItem(item, targetElement);
        menuItem.setParent(self);
        menuItem.ensureKeystroke();
        self.items.push(menuItem);
        menuBox.appendChild(menuItem.getElement());
      } catch (e) {
        console.error("Failed to create context menu item:", e);
      }
    });

    document.body.appendChild(element);

    // Create submenu portal for scroll support
    self.submenuPortal = document.createElement("div");
    self.submenuPortal.classList.add("context-menu-submenu-portal");
    document.body.appendChild(self.submenuPortal);

    // Move submenus to portal
    self.moveSubmenusToPortal();

    requestAnimationFrame(() => {
      self.positionAt(x, y);
      self.setupScrolling();
      self.initEventHandlers();
    });

    return self;
  }

  initEventHandlers() {
    this.clickHandler = (e) => {
      // Check if click is inside main menu or portal
      const inMenu = this.element.contains(e.target);
      const inPortal = this.submenuPortal?.contains(e.target);
      if (!inMenu && !inPortal) {
        this.destroy();
      }
    };

    this.keydownHandler = (e) => this.onKeyDown(e);

    this.blurHandler = () => {
      if (this.configState?.contextMenuCloseOnBlur !== false) {
        this.destroy();
      }
    };

    this.scrollHandler = (e) => {
      // Don't close if scrolling inside the menu or portal
      const inMenu = this.element.contains(e.target);
      const inPortal = this.submenuPortal?.contains(e.target);
      if (!inMenu && !inPortal) {
        this.destroy();
      }
    };

    this.wheelHandler = (e) => {
      // Allow wheel scrolling inside the menu and portal
      const inMenu = this.element.contains(e.target);
      const inPortal = this.submenuPortal?.contains(e.target);
      if (!inMenu && !inPortal) {
        // Wheel outside menu - close it
        this.destroy();
      }
      // Don't prevent default - allow natural scrolling inside menu
    };

    setTimeout(() => {
      if (this.destroyed) return;
      window.addEventListener("mousedown", this.clickHandler, true);
      document.addEventListener("keydown", this.keydownHandler, true);
      window.addEventListener("blur", this.blurHandler);
      window.addEventListener("scroll", this.scrollHandler, true);
      window.addEventListener("wheel", this.wheelHandler, true);
    }, 0);
  }

  onKeyDown(e) {
    if (this.destroyed) return;

    if (this.isStandaloneModifierKeyEvent(e)) {
      return;
    }

    if (!this.isMenuKeyEvent(e)) {
      this.destroy();
      return;
    }

    switch (e.key) {
      case "Escape":
        this.destroy();
        Utils.stopEvent(e);
        return;

      case "ArrowUp":
        this.navigateUp();
        Utils.stopEvent(e);
        return;

      case "ArrowDown":
        this.navigateDown();
        Utils.stopEvent(e);
        return;

      case "ArrowLeft":
        this.navigateLeft();
        Utils.stopEvent(e);
        return;

      case "ArrowRight":
        this.navigateRight();
        Utils.stopEvent(e);
        return;

      case "Enter":
      case " ":
        this.executeSelected();
        Utils.stopEvent(e);
        return;
    }
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

  isMenuKeyEvent(e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) {
      return false;
    }

    switch (e.key) {
      case "Escape":
      case "ArrowUp":
      case "ArrowDown":
      case "ArrowLeft":
      case "ArrowRight":
      case "Enter":
      case " ":
        return true;
      default:
        return false;
    }
  }

  navigateUp() {
    const openLeaf = this.getOpenLeaf();
    // If there's an open submenu, navigate there
    if (openLeaf) {
      const submenu = openLeaf.getSubmenu();
      const submenuSelected = submenu.getSelected();
      if (submenuSelected) {
        submenu.selectPreviousItem(true); // wrap=true for submenus
      } else {
        submenu.selectLastItem();
      }
      return;
    }

    const selected = this.getSelectedLeaf();
    if (!selected) {
      this.items.selectLastItem();
    } else {
      const parent = selected.getParent();
      const submenu = parent?.getSubmenu?.() || parent?.items;
      // Wrap only in nested submenus (parent is MenuItem, not ContextMenu)
      const wrap = !(parent instanceof ContextMenu);
      submenu?.selectPreviousItem(wrap);
    }
  }

  navigateDown() {
    const openLeaf = this.getOpenLeaf();
    // If there's an open submenu, navigate there
    if (openLeaf) {
      const submenu = openLeaf.getSubmenu();
      const submenuSelected = submenu.getSelected();
      if (submenuSelected) {
        submenu.selectNextItem(true); // wrap=true for submenus
      } else {
        submenu.selectFirstItem();
      }
      return;
    }

    const selected = this.getSelectedLeaf();
    if (!selected) {
      this.items.selectFirstItem();
    } else {
      const parent = selected.getParent();
      const submenu = parent?.getSubmenu?.() || parent?.items;
      // Wrap only in nested submenus (parent is MenuItem, not ContextMenu)
      const wrap = !(parent instanceof ContextMenu);
      submenu?.selectNextItem(wrap);
    }
  }

  navigateLeft() {
    // First check if there's an open submenu to close
    const openLeaf = this.getOpenLeaf();
    if (openLeaf) {
      openLeaf.setOpen(false);
      openLeaf.setSelected(true);
      return;
    }

    const selected = this.getSelectedLeaf();
    if (selected) {
      const parent = selected.getParent();
      if (parent && !(parent instanceof ContextMenu)) {
        parent.setOpen(false);
        parent.setSelected(true);
      }
    }
  }

  navigateRight() {
    const selected = this.getSelectedLeaf();
    if (selected?.hasSubmenu()) {
      selected.setOpen(true);
      selected.getSubmenu()?.selectFirstItem();
    }
  }

  executeSelected() {
    const selected = this.getSelectedLeaf();
    if (selected && !selected.hasSubmenu() && selected.isExecutable()) {
      selected.bounce();
      this.restoreSourceFocus({ force: true });
      selected.execCommand().then(
        () => this.restoreSourceFocus(),
        () => this.restoreSourceFocus(),
      );
      this.destroy();
    } else if (selected?.hasSubmenu()) {
      selected.setOpen(true);
      selected.getSubmenu()?.selectFirstItem();
    }
  }

  isContextMenu() {
    return true;
  }

  restoreSourceFocus(options = {}) {
    const { force = false } = options;
    const activeElement = document.activeElement;
    const focusIsInMenu =
      this.element.contains(activeElement) || this.submenuPortal?.contains(activeElement);

    if (!force && activeElement && activeElement !== document.body && !focusIsInMenu) {
      return;
    }

    const focusTarget = this.getFocusRestoreElement();
    if (!focusTarget || typeof focusTarget.focus !== "function" || !focusTarget.isConnected) {
      return;
    }

    try {
      focusTarget.focus({ preventScroll: true });
    } catch {
      focusTarget.focus();
    }
  }

  getFocusRestoreElement() {
    if (
      this.previouslyFocusedElement?.isConnected &&
      this.previouslyFocusedElement !== document.body
    ) {
      return this.previouslyFocusedElement;
    }

    const targetEditor = this.targetElement?.closest?.("atom-text-editor");
    if (targetEditor?.isConnected) {
      return targetEditor;
    }

    return this.targetElement?.isConnected ? this.targetElement : null;
  }

  getSelectedLeaf() {
    const recurseItem = (item) => {
      let curr = null;
      const submenu = item.getSubmenu?.() || item.items;
      submenu?.some((o) => {
        if (o.isSelected?.()) {
          curr = o;
          if (o.hasSubmenu?.() && o.isOpen?.()) {
            const tmp = recurseItem(o);
            if (tmp !== null) {
              curr = tmp;
            }
          }
          return true;
        }
        // Recurse into open submenus even if parent isn't selected
        // (setOpen clears parent selection for visual reasons)
        if (o.hasSubmenu?.() && o.isOpen?.()) {
          const tmp = recurseItem(o);
          if (tmp !== null) {
            curr = tmp;
            return true;
          }
        }
        return false;
      });
      return curr;
    };

    return recurseItem(this);
  }

  getOpenLeaf() {
    const recurseItem = (item) => {
      let curr = null;
      const submenu = item.getSubmenu?.() || item.items;
      submenu?.some((o) => {
        if (o.hasSubmenu?.() && o.isOpen?.()) {
          curr = o;
          const tmp = recurseItem(o);
          if (tmp !== null) {
            curr = tmp;
          }
          return true;
        }
        return false;
      });
      return curr;
    };

    return recurseItem(this);
  }

  onChildClick() {
    // Item clicked - handled by item's execCommand
  }

  onChildMouseEnter(target, e) {
    SubmenuParent.onChildMouseEnter(this, target, e);
  }

  onChildMouseMove(target, e) {
    SubmenuParent.onChildMouseMove(this, target, e);
  }

  clearFocus() {
    SubmenuParent.clearFocus(this);
  }

  positionAt(x, y) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const edgePadding = 8;
    const maxAvailableHeight = viewportHeight - 2 * edgePadding;

    // First, measure natural height without max-height constraint
    this.menuBox.style.maxHeight = "";
    const naturalRect = this.element.getBoundingClientRect();
    const menuHeight = naturalRect.height;
    const menuWidth = naturalRect.width;

    let left = x;
    let top = y;
    let needsScroll = false;

    // Priority 1: Try to fit menu without scrolling
    if (menuHeight <= maxAvailableHeight) {
      // Menu can fit without scrolling - find best position

      // Check if it fits below click point
      if (y + menuHeight <= viewportHeight - edgePadding) {
        // Fits below - use click position
        top = y;
      }
      // Check if it fits above click point
      else if (y - menuHeight >= edgePadding) {
        // Fits above
        top = y - menuHeight;
      }
      // Doesn't fit above or below at click point - shift vertically
      else {
        // Position so menu fits within viewport
        top = viewportHeight - menuHeight - edgePadding;
        // Make sure we don't go above top edge
        top = Math.max(edgePadding, top);
      }
    } else {
      // Priority 2: Menu is too tall - needs scrolling
      needsScroll = true;
      this.menuBox.style.maxHeight = `${maxAvailableHeight}px`;
      top = edgePadding;
    }

    // Horizontal positioning
    if (left + menuWidth > viewportWidth - edgePadding) {
      left = viewportWidth - menuWidth - edgePadding;
    }
    if (left < edgePadding) {
      left = edgePadding;
    }

    // Final bounds check for top
    if (!needsScroll) {
      if (top < edgePadding) {
        top = edgePadding;
      }
      if (top + menuHeight > viewportHeight - edgePadding) {
        top = viewportHeight - menuHeight - edgePadding;
      }
    }

    this.element.style.left = `${left}px`;
    this.element.style.top = `${top}px`;

    // Position all submenus
    this.positionAllSubmenus();
  }

  setupScrolling() {
    if (!this.menuBox) return;

    // Add scroll listener to reposition open submenus
    this.menuScrollHandler = () => {
      this.items.forEach((item) => {
        if (item.isOpen() && item.isPortaled()) {
          item.positionPortaledSubmenu();
        }
      });
    };
    this.menuBox.addEventListener("scroll", this.menuScrollHandler);

    // Add mouseleave listener to clear focus when leaving menu
    this.menuLeaveHandler = () => this.clearFocus();
    this.menuBox.addEventListener("mouseleave", this.menuLeaveHandler);
  }

  moveSubmenusToPortal() {
    if (!this.submenuPortal) return;

    this.items.forEach((item) => {
      if (item.hasSubmenu()) {
        item.moveSubmenuToPortal(this.submenuPortal);
        SubmenuParent.moveNestedSubmenusToPortal(item, this.submenuPortal);
      }
    });
  }

  positionAllSubmenus() {
    this.items.forEach((item) => {
      if (item.hasSubmenu()) {
        this.positionSubmenu(item);
        this.positionNestedSubmenus(item);
      }
    });
  }

  positionNestedSubmenus(item) {
    if (!item.hasSubmenu()) return;
    item.getSubmenu().forEach((subitem) => {
      if (subitem.hasSubmenu()) {
        this.positionSubmenu(subitem);
        this.positionNestedSubmenus(subitem);
      }
    });
  }

  positionSubmenu(item) {
    // Use portaled submenu positioning if available
    if (item.isPortaled()) {
      item.positionPortaledSubmenu();
      return;
    }

    // Fallback for non-portaled submenus
    const submenuEl = item.getElement().querySelector(".menu-item-submenu");
    if (!submenuEl) return;

    const itemRect = item.getElement().getBoundingClientRect();
    const submenuRect = submenuEl.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Positioning constants
    const horizontalOverlap = 4;
    const verticalOffset = 6;
    const edgePadding = 8;

    // Horizontal positioning
    let left = itemRect.width - horizontalOverlap;

    // Check if submenu would overflow right edge
    if (itemRect.right - horizontalOverlap + submenuRect.width > viewportWidth - edgePadding) {
      // Flip to left side
      left = -submenuRect.width + horizontalOverlap;
    }

    // Vertical positioning - align with item top
    let top = -verticalOffset;

    // Check vertical overflow
    const absoluteTop = itemRect.top + top;
    if (absoluteTop + submenuRect.height > viewportHeight - edgePadding) {
      // Adjust to fit within viewport
      top = viewportHeight - edgePadding - itemRect.top - submenuRect.height;
      // Don't go above the item
      top = Math.max(-verticalOffset, top);
    }

    // Check if submenu would go above viewport
    if (itemRect.top + top < edgePadding) {
      top = edgePadding - itemRect.top;
    }

    submenuEl.style.left = `${left}px`;
    submenuEl.style.top = `${top}px`;
  }

  getSubmenu() {
    return this.items;
  }

  getParent() {
    return undefined;
  }

  close() {
    this.destroy();
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;

    // Clear submenu timer
    if (this.submenuTimer) {
      clearTimeout(this.submenuTimer);
      this.submenuTimer = null;
    }

    // Remove menu scroll handler
    if (this.menuScrollHandler && this.menuBox) {
      this.menuBox.removeEventListener("scroll", this.menuScrollHandler);
      this.menuScrollHandler = null;
    }

    // Remove menu leave handler
    if (this.menuLeaveHandler && this.menuBox) {
      this.menuBox.removeEventListener("mouseleave", this.menuLeaveHandler);
      this.menuLeaveHandler = null;
    }

    window.removeEventListener("mousedown", this.clickHandler, true);
    document.removeEventListener("keydown", this.keydownHandler, true);
    window.removeEventListener("blur", this.blurHandler);
    window.removeEventListener("scroll", this.scrollHandler, true);
    window.removeEventListener("wheel", this.wheelHandler, true);

    this.element.parentElement?.removeChild(this.element);

    // Remove portal
    if (this.submenuPortal) {
      this.submenuPortal.parentElement?.removeChild(this.submenuPortal);
      this.submenuPortal = null;
    }
  }

  getElement() {
    return this.element;
  }
}

module.exports = { ContextMenu };
