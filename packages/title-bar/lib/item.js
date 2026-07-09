const { MalformedTemplateError } = require("./error.js");
const { exceptionCommands } = require("./types.js");
const { Utils } = require("./utils.js");
const { Submenu } = require("./submenu.js");
const SubmenuParent = require("./submenu-parent.js");

let ipcRenderer;

function getIpcRenderer() {
  if (!ipcRenderer) {
    ipcRenderer = require("electron").ipcRenderer;
  }
  return ipcRenderer;
}

class MenuItem {
  constructor(element) {
    this.element = element;
    this.menuBox = null;
    this.labelText = undefined;
    this.separator = false;
    this.enabled = true;
    this.visible = true;
    this.selected = false;
    this.open = false;
    this.command = undefined;
    this.commandDetail = undefined;
    this.altTrigger = undefined;
    this.submenu = undefined;
    this.parent = undefined;
    this.targetElement = undefined;
    SubmenuParent.initSubmenuParent(this);

    // Portal support for scroll
    this.portalElement = null;
    this.portalContainer = null;
    this.positionPending = false;
    this.scrollPending = false;

    this.element.addEventListener("mousedown", (e) => this.onMouseDown(e));
    this.element.addEventListener("click", (e) => this.onMouseClick(e));
    this.element.addEventListener("mouseenter", (e) => this.onMouseEnter(e));
    this.element.addEventListener("mousemove", (e) => this.onMouseMove(e));
    this.element.addEventListener("mouseup", (e) => this.onMouseUp(e));
  }

  static createMenuItem(menuItem) {
    if (menuItem.type == "separator") {
      const self = new MenuItem(document.createElement("hr"));
      self.separator = true;
      return self;
    }
    if (menuItem.label === undefined) {
      throw new MalformedTemplateError("Menu item template is malformed!");
    }

    const itemEl = document.createElement("div");
    itemEl.classList.add("menu-item");
    const self = new MenuItem(itemEl);

    if (menuItem.enabled === false) {
      self.enabled = false;
      itemEl.classList.add("disabled");
    }

    if (menuItem.visible === false) {
      self.visible = false;
      itemEl.classList.add("invisible");
    }

    const altKeyData = Utils.formatAltKey(menuItem.label);
    itemEl.setAttribute("alt-trigger", altKeyData.key);
    self.altTrigger = altKeyData.key || undefined;

    // Exception for the VERSION item
    if (menuItem.label === "VERSION") {
      altKeyData.html = "Version " + atom.getVersion();
    }

    const menuItemName = document.createElement("span");
    menuItemName.classList.add("menu-item-name");
    menuItemName.innerHTML = altKeyData.html;
    self.labelText = menuItem.label;

    const menuItemKeystroke = document.createElement("span");
    menuItemKeystroke.classList.add("menu-item-keystroke");
    self.keystrokeElement = menuItemKeystroke;
    self.keystrokeResolved = false;

    itemEl.appendChild(menuItemName);
    itemEl.appendChild(menuItemKeystroke);

    if (menuItem.command !== undefined) {
      self.command = menuItem.command;
      self.commandDetail = menuItem.commandDetail;
    }

    if (
      menuItem.command === "application:reopen-project" &&
      menuItem.commandDetail?.paths?.length
    ) {
      const paths = menuItem.commandDetail.paths;
      itemEl.addEventListener("contextmenu", (e) => {
        e.stopPropagation();
        e.preventDefault();
        atom.history.removeProject(paths);
      });
      if (paths.length > 1) {
        menuItemName.innerHTML = "";
        for (const p of paths) {
          const line = document.createElement("div");
          line.classList.add("menu-item-path-line");
          line.textContent = p;
          menuItemName.appendChild(line);
        }
        itemEl.classList.add("menu-item-multipath");
      }
    }

    if (menuItem.submenu instanceof Array) {
      if (menuItem.submenu.length === 0) {
        // Create empty submenu container for dynamic population
        self.submenu = new Submenu();
        self.element.classList.add("has-sub");
        self.menuBox = document.createElement("div");
        self.menuBox.classList.add("menu-box", "menu-item-submenu");
        self.element.appendChild(self.menuBox);
      } else {
        menuItem.submenu.forEach((o) => {
          try {
            self.addChild(MenuItem.createMenuItem(o));
          } catch (e) {
            console.error(e);
          }
        });
      }
    }

    return self;
  }

  static createContextMenuItem(template, targetElement) {
    // Clean up labels for context menus
    const cleanedTemplate = MenuItem.cleanTemplateLabels(template);
    const item = MenuItem.createMenuItem(cleanedTemplate);
    item.targetElement = targetElement;

    // Recursively set targetElement on submenu items
    if (item.hasSubmenu()) {
      MenuItem.setTargetElementRecursive(item, targetElement);
    }

    return item;
  }

  static cleanTemplateLabels(template) {
    if (!template) return template;

    const cleaned = { ...template };

    // Clean the label if present
    if (cleaned.label) {
      cleaned.label = Utils.cleanContextMenuLabel(cleaned.label);
    }

    // Recursively clean submenu items
    if (cleaned.submenu && Array.isArray(cleaned.submenu)) {
      cleaned.submenu = cleaned.submenu.map((item) => MenuItem.cleanTemplateLabels(item));
    }

    return cleaned;
  }

  static setTargetElementRecursive(item, targetElement) {
    if (item.hasSubmenu()) {
      item.getSubmenu().forEach((subitem) => {
        if (subitem instanceof MenuItem) {
          subitem.targetElement = targetElement;
          MenuItem.setTargetElementRecursive(subitem, targetElement);
        }
      });
    }
  }

  serialize() {
    return {
      label: this.labelText,
      command: this.command,
      commandDetail: this.commandDetail,
      submenu: this.submenu?.map((o) => {
        return o.serialize();
      }),
    };
  }

  onMouseClick(e) {
    e.stopPropagation();
    const root = this.getAppMenuRoot();
    const isContextMenu = root?.isContextMenu?.();
    if (isContextMenu) {
      e.preventDefault();
    }

    if (MenuItem.mouseDragState?.handled) {
      MenuItem.mouseDragState = null;
      e.preventDefault();
      return;
    }
    this.parent?.onChildClick?.(this, e);
    if (this.isExecutable()) {
      this.execCommandAfterClosing();
    }
  }

  onMouseDown(e) {
    const root = this.getAppMenuRoot();
    const isContextMenu = root?.isContextMenu?.();
    if (isContextMenu) {
      e.preventDefault();
    }

    if (e.button !== 0 || !this.isEnabled() || this.isSeparator()) {
      return;
    }

    MenuItem.mouseDragState = {
      origin: this,
      startX: e.clientX,
      startY: e.clientY,
      dragged: false,
      handled: false,
    };

    window.addEventListener("mousemove", MenuItem.onGlobalMouseMove, true);
    window.addEventListener("mouseup", MenuItem.onGlobalMouseUp, true);
  }

  onMouseEnter(e) {
    e.stopPropagation();
    this.parent?.onChildMouseEnter?.(this, e);
  }

  onMouseMove(e) {
    e.stopPropagation();
    const dragState = MenuItem.mouseDragState;
    if (dragState) {
      const deltaX = Math.abs(e.clientX - dragState.startX);
      const deltaY = Math.abs(e.clientY - dragState.startY);
      if (deltaX > 3 || deltaY > 3) {
        dragState.dragged = true;
      }
    }
    this.parent?.onChildMouseMove?.(this, e);
  }

  onMouseUp(e) {
    MenuItem.handleMouseRelease(e);
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

  async execCommand() {
    if (this.command === undefined) {
      return;
    }

    if (this.isReopenProjectCommand()) {
      return this.reopenProjectInNewWindow();
    }

    if (exceptionCommands.has(this.command)) {
      getIpcRenderer().send("command", this.command);
      return;
    }

    // Context menu: dispatch to the element that was right-clicked
    // Application menu: dispatch to active editor/pane
    let target =
      this.targetElement ||
      atom.workspace.getActiveTextEditor()?.getElement() ||
      atom.workspace.getActivePane().getElement();

    await atom.commands.dispatch(target, this.command, this.commandDetail);
  }

  execCommandAfterClosing() {
    const command = this.command;
    const commandDetail = this.commandDetail;
    const target =
      this.targetElement ||
      atom.workspace.getActiveTextEditor()?.getElement() ||
      atom.workspace.getActivePane().getElement();
    const root = this.getAppMenuRoot();
    const restoreSourceFocus = root?.restoreSourceFocus?.bind(root);

    restoreSourceFocus?.({ force: true });
    root?.close();

    setTimeout(() => {
      let result;
      if (command !== undefined) {
        if (MenuItem.isReopenProjectCommand(command, commandDetail)) {
          result = MenuItem.reopenProjectInNewWindow(commandDetail);
        } else if (exceptionCommands.has(command)) {
          result = getIpcRenderer().send("command", command);
        } else {
          result = atom.commands.dispatch(target, command, commandDetail);
        }
      }
      Promise.resolve(result).then(
        () => restoreSourceFocus?.(),
        () => restoreSourceFocus?.(),
      );
    }, 10);
  }

  async execCommandWith(command, commandDetail, targetElement) {
    if (command === undefined) {
      return;
    }

    if (MenuItem.isReopenProjectCommand(command, commandDetail)) {
      return MenuItem.reopenProjectInNewWindow(commandDetail);
    }

    if (exceptionCommands.has(command)) {
      getIpcRenderer().send("command", command);
      return;
    }

    // Context menu: dispatch to the element that was right-clicked
    // Application menu: dispatch to active editor/pane
    let target =
      targetElement ||
      atom.workspace.getActiveTextEditor()?.getElement() ||
      atom.workspace.getActivePane().getElement();

    await atom.commands.dispatch(target, command, commandDetail);
  }

  isReopenProjectCommand() {
    return MenuItem.isReopenProjectCommand(this.command, this.commandDetail);
  }

  reopenProjectInNewWindow() {
    return MenuItem.reopenProjectInNewWindow(this.commandDetail);
  }

  static isReopenProjectCommand(command, commandDetail) {
    return command === "application:reopen-project" && commandDetail?.paths?.length;
  }

  static reopenProjectInNewWindow(commandDetail) {
    return atom.open({
      pathsToOpen: commandDetail.paths,
      newWindow: true,
      safeMode: atom.inSafeMode?.(),
      devMode: atom.inDevMode?.(),
    });
  }

  addChild(item) {
    if (!this.hasSubmenu()) {
      this.submenu = new Submenu();
      this.element.classList.add("has-sub");

      this.menuBox = document.createElement("div");
      this.menuBox.classList.add("menu-box", "menu-item-submenu");
      this.element.appendChild(this.menuBox);
    }

    item.setParent(this);
    item.setPortalContainer?.(this.portalContainer);
    this.submenu?.push(item);

    // If submenu is portaled, add to portal element instead of hidden menuBox
    const container = this.portalElement || this.menuBox;
    container?.appendChild(item.getElement());
  }

  insertChild(item, index) {
    if (!this.hasSubmenu()) {
      this.submenu = new Submenu();
      this.element.classList.add("has-sub");

      this.menuBox = document.createElement("div");
      this.menuBox.classList.add("menu-box", "menu-item-submenu");
      this.element.appendChild(this.menuBox);
    }

    item.setParent(this);
    item.setPortalContainer?.(this.portalContainer);
    this.submenu?.splice(index, 0, item);

    // If submenu is portaled, insert into portal element instead of hidden menuBox
    const container = this.portalElement || this.menuBox;
    container?.insertBefore(item.getElement(), container.children[index] || null);
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

  getAppMenuRoot() {
    const { ApplicationMenu } = require("./app-menu.js");
    const { ContextMenu } = require("./context-menu.js");
    let result = this.parent;
    while (result && !(result instanceof ApplicationMenu) && !(result instanceof ContextMenu)) {
      result = result.getParent();
    }

    if (result instanceof ApplicationMenu || result instanceof ContextMenu) {
      return result;
    }

    return null;
  }

  bounce() {
    this.element.classList.add("bounce");
    // Animation duration is 0.15s as defined in CSS
    setTimeout(() => {
      this.element.classList.remove("bounce");
    }, 150);
  }

  getElement() {
    return this.element;
  }

  ensureKeystroke() {
    if (this.keystrokeResolved) {
      return;
    }

    this.keystrokeResolved = true;

    if (this.command === undefined || !this.keystrokeElement) {
      return;
    }

    const keyStrokes = atom.keymaps.findKeyBindings({
      command: this.command,
    });
    if (keyStrokes.length > 0) {
      this.keystrokeElement.innerHTML = Utils.formatKeystroke(
        keyStrokes[keyStrokes.length - 1].keystrokes,
      );
    }
  }

  getLabelText() {
    return this.labelText;
  }

  isSeparator() {
    return this.separator;
  }

  isEnabled() {
    return this.enabled;
  }

  isVisible() {
    return this.visible;
  }

  isSelected() {
    return this.selected;
  }

  isOpen() {
    return this.open;
  }

  getCommand() {
    return this.command;
  }

  getCommandDetail() {
    return this.commandDetail;
  }

  getAltTrigger() {
    return this.altTrigger;
  }

  getSubmenu() {
    return this.submenu;
  }

  hasSubmenu() {
    return this.submenu !== undefined;
  }

  getParent() {
    return this.parent;
  }

  isExecutable() {
    return this.enabled && !this.separator && !this.hasSubmenu();
  }

  setSelected(flag) {
    this.selected = flag;
    this.element.classList.toggle("selected", flag);
    if (!flag && !this.open) {
      this.element.classList.remove("open");
    }
  }

  setOpen(flag) {
    this.open = flag;

    // Clear any pending submenu timer when closing
    if (!flag && this.submenuTimer) {
      clearTimeout(this.submenuTimer);
      this.submenuTimer = null;
    }

    // Handle portaled submenu visibility
    if (flag && this.portalContainer && !this.portalElement) {
      this.moveSubmenuToPortal(this.portalContainer);
    }

    if (this.portalElement) {
      if (flag) {
        this.positionPortaledSubmenu();
        this.portalElement.classList.add("visible");
      } else {
        this.portalElement.classList.remove("visible");
      }
    }

    if (!flag) {
      this.submenu?.forEach((o) => {
        o.setOpen(false);
        o.setSelected(false);
      });
    }

    // When opening submenu, clear own selection
    if (flag && this.hasSubmenu()) {
      this.setSelected(false);
      this.submenu?.forEach((o) => o.ensureKeystroke?.());
    }

    Utils.setToggleClass(this.element, "open", flag);
  }

  setParent(parent) {
    this.parent = parent;
  }

  static fromElement(element) {
    const menuItemElement = element?.closest?.(".menu-item");
    if (!menuItemElement) {
      return null;
    }

    return MenuItem.findInParent(
      MenuItem.mouseDragState?.origin?.getAppMenuRoot(),
      menuItemElement,
    );
  }

  static onGlobalMouseMove(e) {
    const dragState = MenuItem.mouseDragState;
    if (!dragState) {
      return;
    }

    const deltaX = Math.abs(e.clientX - dragState.startX);
    const deltaY = Math.abs(e.clientY - dragState.startY);
    if (deltaX > 3 || deltaY > 3) {
      dragState.dragged = true;
    }
  }

  static onGlobalMouseUp(e) {
    MenuItem.handleMouseRelease(e);
  }

  static handleMouseRelease(e) {
    const dragState = MenuItem.mouseDragState;
    if (!dragState || dragState.handled || e.button !== 0) {
      return;
    }

    window.removeEventListener("mousemove", MenuItem.onGlobalMouseMove, true);
    window.removeEventListener("mouseup", MenuItem.onGlobalMouseUp, true);

    if (!dragState.dragged) {
      MenuItem.mouseDragState = null;
      return;
    }

    e.stopPropagation();
    e.preventDefault();
    dragState.handled = true;

    const dropTarget = MenuItem.fromElement(document.elementFromPoint(e.clientX, e.clientY));
    if (dropTarget?.isExecutable()) {
      dropTarget.bounce();
      dropTarget.execCommandAfterClosing();
    } else if (dropTarget?.hasSubmenu()) {
      window.addEventListener("click", MenuItem.onGlobalClickAfterDrop, true);
      dropTarget.openSubmenuFromDrop();
    } else {
      dragState.origin.getAppMenuRoot()?.close();
    }
  }

  openSubmenuFromDrop() {
    const parentItems = this.parent?.getSubmenu?.() || this.parent?.items;
    parentItems?.forEach((item) => {
      if (item !== this) {
        item.setOpen(false);
        item.setSelected(false);
      }
    });

    this.setOpen(true);
    this.parent?.positionSubmenu?.(this);
  }

  static onGlobalClickAfterDrop(e) {
    window.removeEventListener("click", MenuItem.onGlobalClickAfterDrop, true);
    if (MenuItem.mouseDragState?.handled) {
      MenuItem.mouseDragState = null;
      e.stopPropagation();
      e.preventDefault();
    }
  }

  static findInParent(parent, element) {
    const items = parent?.getSubmenu?.() || parent?.items || parent?.getLabels?.();
    if (!items) {
      return null;
    }

    for (const item of items) {
      if (item instanceof MenuItem && item.getElement() === element) {
        return item;
      }

      const found = MenuItem.findInParent(item, element);
      if (found) {
        return found;
      }
    }

    return null;
  }

  setPortalContainer(portalContainer) {
    this.portalContainer = portalContainer;
    if (this.menuBox && !this.portalElement) {
      this.menuBox.style.display = "none";
    }
    this.submenu?.forEach((item) => item.setPortalContainer?.(portalContainer));
  }

  // Portal methods for scroll support
  moveSubmenuToPortal(portalContainer) {
    if (!this.hasSubmenu() || !this.menuBox || this.portalElement || !portalContainer) return;

    this.portalContainer = portalContainer;

    // Create portal element
    this.portalElement = document.createElement("div");
    this.portalElement.classList.add("menu-box", "menu-item-submenu");

    // Move children to portal element
    while (this.menuBox.firstChild) {
      this.portalElement.appendChild(this.menuBox.firstChild);
    }

    // Add to portal container
    portalContainer.appendChild(this.portalElement);

    // Hide original menu-box
    this.menuBox.style.display = "none";

    // Set up event delegation for portal element
    this.portalElement.addEventListener("click", (e) => e.stopPropagation());
    this.portalElement.addEventListener("mouseenter", (e) => e.stopPropagation());
    this.portalElement.addEventListener("mouseleave", () => this.clearFocus());

    // Add RAF-throttled scroll handler to reposition nested submenus
    this.portalElement.addEventListener("scroll", () => {
      if (this.scrollPending) return;
      this.scrollPending = true;
      requestAnimationFrame(() => {
        this.scrollPending = false;
        this.submenu?.forEach((item) => {
          if (item.isOpen() && item.isPortaled()) {
            item.positionPortaledSubmenu();
          }
        });
      });
    });
  }

  positionPortaledSubmenu() {
    if (!this.portalElement) return;
    if (this.positionPending) return;
    this.positionPending = true;

    requestAnimationFrame(() => {
      this.positionPending = false;
      if (!this.portalElement) return;

      // Batch all DOM reads first
      const itemRect = this.element.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Positioning constants
      const horizontalOverlap = -1; // Align submenu border with parent menu border
      const verticalOffset = 6; // Offset from item top (accounts for menu padding)
      const edgePadding = 8; // Minimum distance from viewport edges
      const minHeight = 100;

      // Temporarily make visible to measure
      const wasHidden = !this.portalElement.classList.contains("visible");
      if (wasHidden) {
        this.portalElement.style.visibility = "hidden";
        this.portalElement.style.maxHeight = ""; // Reset for measurement
        this.portalElement.classList.add("visible");
      }

      const submenuRect = this.portalElement.getBoundingClientRect();

      if (wasHidden) {
        this.portalElement.classList.remove("visible");
        this.portalElement.style.visibility = "";
      }

      // Calculate horizontal position
      let left;
      let flipToLeft = false;

      // Check if submenu fits on the right
      const rightPosition = itemRect.right - horizontalOverlap;
      if (rightPosition + submenuRect.width <= viewportWidth - edgePadding) {
        left = rightPosition;
      } else {
        // Flip to left side
        flipToLeft = true;
        left = itemRect.left - submenuRect.width + horizontalOverlap;
      }

      // Ensure left doesn't go off-screen
      left = Math.max(edgePadding, left);
      if (!flipToLeft && left + submenuRect.width > viewportWidth - edgePadding) {
        left = viewportWidth - submenuRect.width - edgePadding;
      }

      // Calculate vertical position - align with parent item
      let top = itemRect.top - verticalOffset;

      // Calculate available heights
      const availableHeightBelow = viewportHeight - top - edgePadding;
      const availableHeightAbove = itemRect.bottom - edgePadding;

      let maxHeight;
      const actualHeight = Math.min(submenuRect.height, viewportHeight - 2 * edgePadding);

      if (actualHeight <= availableHeightBelow) {
        // Fits below - use default position
        maxHeight = availableHeightBelow;
      } else if (
        availableHeightAbove > availableHeightBelow &&
        actualHeight <= availableHeightAbove
      ) {
        // Fits above - align bottom of submenu with bottom of item
        top = itemRect.bottom - actualHeight + verticalOffset;
        maxHeight = availableHeightAbove;
      } else {
        // Doesn't fit either way - use larger space with scroll
        if (availableHeightAbove > availableHeightBelow) {
          maxHeight = Math.max(minHeight, availableHeightAbove);
          top = itemRect.bottom - Math.min(submenuRect.height, maxHeight) + verticalOffset;
        } else {
          maxHeight = Math.max(minHeight, availableHeightBelow);
        }
      }

      // Final bounds check
      top = Math.max(edgePadding, top);
      const effectiveHeight = Math.min(submenuRect.height, maxHeight);
      if (top + effectiveHeight > viewportHeight - edgePadding) {
        top = viewportHeight - effectiveHeight - edgePadding;
        top = Math.max(edgePadding, top);
      }

      // Batch all DOM writes
      this.portalElement.style.left = `${left}px`;
      this.portalElement.style.top = `${top}px`;
      this.portalElement.style.maxHeight = `${maxHeight}px`;
    });
  }

  isPortaled() {
    return this.portalElement !== null;
  }

  getPortalElement() {
    return this.portalElement;
  }
}

MenuItem.mouseDragState = null;

module.exports = { MenuItem };
