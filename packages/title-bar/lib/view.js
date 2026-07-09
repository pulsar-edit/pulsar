const { ApplicationMenu } = require("./app-menu.js");
const { Utils } = require("./utils.js");
const { ThemeManager } = require("./theme.js");
const { MenuUpdater } = require("./updater.js");
const { ContextMenuInterceptor } = require("./context-menu-interceptor.js");
const { logoStyles, resolveLogoStyle } = require("./types.js");
const { ControlTiles } = require("./control-tiles.js");

// Debounce helper
function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Throttle helper
function throttle(fn, limit) {
  let inThrottle = false;
  let lastArgs = null;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        // Execute trailing call if there was one
        if (lastArgs !== null) {
          const trailingArgs = lastArgs;
          lastArgs = null;
          fn.apply(this, trailingArgs);
        }
      }, limit);
    } else {
      // Queue the latest call for trailing execution
      lastArgs = args;
    }
  };
}

class TitleBarView {
  constructor(configState) {
    this.configState = configState;
    this.themeManager = new ThemeManager(this);
    this.contextMenuInterceptor = new ContextMenuInterceptor(configState);
    [
      this.element,
      this.titleElement,
      this.windowControls,
      this.appIcon,
      this.controlTilesElement,
    ] = this.createElement();
    this.controlTiles = new ControlTiles(this.controlTilesElement);
    this.titleBarVisible = true;
    this.menuBarVisible = true;
    this.windowState = this.readWindowState();
    this.originalMenuUpdateFn = undefined;
    this.menuUpdatePending = false;
    this.setLogoStyle(configState.logoStyle);

    // Bind debounced/throttled methods
    this.debouncedCheckTitleCollision = debounce(() => this.checkTitleCollision(), 150);
    this.debouncedWindowStateSync = debounce(() => this.syncWindowState(), 50);
    this.throttledMenuUpdate = throttle(() => this.updateMenuImmediate(), 100);
    this.debouncedMenuUpdate = debounce(() => this.updateMenuImmediate(), 10);

    this.initWindowControls();
    this.handleTitleBarDoubleClick = this.handleTitleBarDoubleClick.bind(this);
    this.element.addEventListener("dblclick", this.handleTitleBarDoubleClick);

    this.titleObserver = new MutationObserver((mutations) => {
      mutations.forEach((o) => {
        if (o.type === "childList") {
          this.setTitleText(o.target.textContent || "Lumine");
        }
      });
    });

    const realTitle = document.querySelector("title");
    if (realTitle !== null) {
      this.titleObserver.observe(realTitle, { childList: true });
    }

    const menuTemplate = MenuUpdater.getTemplate();
    this.appMenu = ApplicationMenu.createApplicationMenu(menuTemplate, this);
    this.element.appendChild(this.appMenu.getElement());
    this.updateTitleText();

    // Create submenu portal for scroll support (must be before attachMenuUpdater)
    this.submenuPortal = document.createElement("div");
    this.submenuPortal.classList.add("app-menu-submenu-portal");
    this.element.appendChild(this.submenuPortal);

    // Move submenus to portal for scroll support
    this.appMenu.setupSubmenuPortals(this.submenuPortal);

    this.attachMenuUpdater(false);

    // Show menu bar on the app icon hover when autoHide is enabled
    this.appIcon.addEventListener("mouseenter", () => {
      if (this.configState.autoHide) {
        this.setMenuBarVisible(true);
      }
    });

    atom.themes.onDidChangeActiveThemes(() => {
      this.updateTransforms();
    });

    // Activate custom context menus if enabled
    if (this.configState.customContextMenus) {
      this.contextMenuInterceptor.activate();
    }
  }

  createElement() {
    const element = document.createElement("div");
    element.classList.add("title-bar");
    element.classList.add(`platform-${process.platform}`);

    // App icon at leftmost position
    const appIcon = document.createElement("div");
    appIcon.classList.add("app-icon");
    appIcon.addEventListener("click", () => {
      atom.commands.dispatch(atom.views.getView(atom.workspace), "application:about");
    });
    element.appendChild(appIcon);

    const titleSpan = document.createElement("span");
    titleSpan.classList.add("custom-title");
    titleSpan.textContent = "Lumine";
    element.appendChild(titleSpan);

    // Control tiles container (for external packages to add items)
    const controlTilesWrap = document.createElement("div");
    controlTilesWrap.classList.add("control-tiles");
    element.appendChild(controlTilesWrap);

    // Window control buttons container
    const windowButtonsWrap = document.createElement("div");
    windowButtonsWrap.classList.add("window-buttons");

    const controlMinimize = document.createElement("button");
    controlMinimize.classList.add("btn-minimize");
    controlMinimize.innerHTML =
      '<svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 5h10" stroke="currentColor" stroke-width="1"/></svg>';
    windowButtonsWrap.appendChild(controlMinimize);

    const controlMaximize = document.createElement("button");
    controlMaximize.classList.add("btn-maximize");
    controlMaximize.innerHTML =
      '<svg width="10" height="10" viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1"/></svg>';
    windowButtonsWrap.appendChild(controlMaximize);

    const controlClose = document.createElement("button");
    controlClose.classList.add("btn-close");
    controlClose.innerHTML =
      '<svg width="10" height="10" viewBox="0 0 10 10"><path d="M0 0l10 10M10 0L0 10" stroke="currentColor" stroke-width="1"/></svg>';
    windowButtonsWrap.appendChild(controlClose);

    element.appendChild(windowButtonsWrap);

    return [
      element,
      titleSpan,
      {
        minimize: controlMinimize,
        maximize: controlMaximize,
        close: controlClose,
      },
      appIcon,
      controlTilesWrap,
    ];
  }

  async updateTransforms() {
    this.element.querySelectorAll(".menu-box.menu-item-submenu").forEach((o) => {
      const parentRect = o.parentElement?.getBoundingClientRect();
      o.style.transform = `translate(${parentRect.width}px, -3px)`;
    });
  }

  attachMenuUpdater(updateImmediately = true) {
    if (this.originalMenuUpdateFn === undefined) {
      this.originalMenuUpdateFn = atom.menu.update;
    }

    atom.menu.update = (...args) => {
      this.originalMenuUpdateFn?.apply(atom.menu, args);
      this.debouncedMenuUpdate();
    };

    if (updateImmediately) {
      this.updateMenuImmediate();
    }
  }

  detachMenuUpdater() {
    if (this.originalMenuUpdateFn !== undefined) {
      atom.menu.update = this.originalMenuUpdateFn;
    }
  }

  updateMenu() {
    this.throttledMenuUpdate();
  }

  updateMenuImmediate() {
    const edits = MenuUpdater.run(this.appMenu);
    if (edits > 0) {
      // Re-setup portals for any new submenu items
      if (this.submenuPortal) {
        this.appMenu.setupSubmenuPortals(this.submenuPortal);
      }
      this.updateTransforms();
      this.debouncedCheckTitleCollision();
    }
  }

  rebuildApplicationMenu() {
    this.appMenu.getElement().parentElement?.removeChild(this.appMenu.getElement());

    // Clear portal
    this.submenuPortal.innerHTML = "";

    let menuTemplate = MenuUpdater.getTemplate();
    this.appMenu = ApplicationMenu.createApplicationMenu(menuTemplate, this);
    this.element.appendChild(this.appMenu.getElement());

    // Re-setup portals
    this.appMenu.setupSubmenuPortals(this.submenuPortal);

    this.updateTransforms();
  }

  initWindowControls() {
    this.windowSubscriptions = [
      atom.applicationDelegate.onDidMaximizeWindow(() => {
        this.windowState.maximized = true;
        this.updateMaximizeControl();
      }),
      atom.applicationDelegate.onDidUnmaximizeWindow(() => {
        this.windowState.maximized = false;
        this.updateMaximizeControl();
      }),
      atom.applicationDelegate.onDidEnterFullScreen(() => {
        this.windowState.fullscreen = true;
        this.updateFullscreenState();
      }),
      atom.applicationDelegate.onDidLeaveFullScreen(() => {
        this.windowState.fullscreen = false;
        this.updateFullscreenState();
      }),
      atom.applicationDelegate.onDidBlurWindow(() => {
        document.body.click();
      }),
      atom.applicationDelegate.onDidFocusWindow(() => {
        this.syncWindowState();
      }),
    ];

    this.handleWindowResize = () => {
      this.debouncedCheckTitleCollision();
      this.debouncedWindowStateSync();
    };
    window.addEventListener("resize", this.handleWindowResize);

    this.windowControls.minimize.addEventListener("click", () => {
      atom.applicationDelegate.minimizeWindow();
    });

    this.windowControls.maximize.addEventListener("click", () => {
      this.toggleMaximized();
    });

    this.windowControls.close.addEventListener("click", () => {
      atom.close();
    });

    this.updateMaximizeControl();
    this.updateFullscreenState();
  }

  readWindowState() {
    return {
      fullscreen: atom.applicationDelegate.isWindowFullScreen(),
      maximized: atom.applicationDelegate.isWindowMaximized(),
    };
  }

  syncWindowState() {
    this.windowState = this.readWindowState();
    this.updateMaximizeControl();
    this.updateFullscreenState();
  }

  scheduleWindowStateSync() {
    clearTimeout(this.windowStateSyncTimeout);
    this.windowStateSyncTimeout = setTimeout(() => {
      this.windowStateSyncTimeout = null;
      this.syncWindowState();
    }, 100);
  }

  captureRestoreBounds() {
    this.restoreBounds = {
      ...atom.applicationDelegate.getWindowPosition(),
      ...atom.applicationDelegate.getWindowSize(),
    };
  }

  restoreCapturedBounds() {
    if (!this.restoreBounds) return Promise.resolve();

    const { x, y, width, height } = this.restoreBounds;
    return Promise.all([
      atom.applicationDelegate.setWindowPosition(x, y),
      atom.applicationDelegate.setWindowSize(width, height),
    ]);
  }

  updateMaximizeControl() {
    this.windowControls.maximize.innerHTML = this.windowState.maximized
      ? '<svg width="10" height="10" viewBox="0 0 10 10"><rect x="0.5" y="2.5" width="7" height="7" fill="none" stroke="currentColor" stroke-width="1"/><path d="M2.5 2.5V0.5h7v7h-2" fill="none" stroke="currentColor" stroke-width="1"/></svg>'
      : '<svg width="10" height="10" viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1"/></svg>';
  }

  updateFullscreenState() {
    if (this.windowState.fullscreen) {
      this.windowControls.maximize.classList.add("disabled");
      if (process.platform !== "darwin" || this.configState.hideFullscreenTitle) {
        this.setTitleBarVisible(false);
      }
    } else {
      this.windowControls.maximize.classList.remove("disabled");
      if (this.configState.displayTitleBar) {
        this.setTitleBarVisible(true);
      }
    }
  }

  async toggleMaximized() {
    if (this.windowState.fullscreen) return;

    const isMaximized = atom.applicationDelegate.isWindowMaximized();
    const shouldMaximize = !isMaximized;

    if (shouldMaximize) {
      this.captureRestoreBounds();
    }

    this.windowState.maximized = shouldMaximize;
    this.updateMaximizeControl();

    if (shouldMaximize) {
      await atom.applicationDelegate.maximizeWindow();
    } else {
      await atom.applicationDelegate.unmaximizeWindow();
      if (!atom.applicationDelegate.isWindowMaximized()) {
        await this.restoreCapturedBounds();
      }
      this.restoreBounds = null;
    }

    this.scheduleWindowStateSync();
  }

  handleTitleBarDoubleClick(event) {
    if (
      event.target.closest(
        ".app-icon, .app-menu, .control-tiles, .window-buttons, button, input, select",
      )
    ) {
      return;
    }

    if (process.platform === "darwin") {
      const action = atom.applicationDelegate?.getUserDefault(
        "AppleActionOnDoubleClick",
        "string",
      );

      if (action === "Minimize") {
        atom.applicationDelegate.minimizeWindow();
        return;
      }

      if (action && action !== "Maximize") return;
    }

    this.toggleMaximized();
  }

  setTitleBarVisible(flag) {
    this.titleBarVisible = flag;
    Utils.setToggleClass(this.element, "no-title-bar", !flag);
    this.debouncedCheckTitleCollision();
  }

  setMenuBarVisible(flag) {
    this.menuBarVisible = flag;
    Utils.setToggleClass(this.appMenu.getElement(), "no-menu-bar", !flag);
  }

  setTitleText(title) {
    this.titleElement.textContent = title;
    this.debouncedCheckTitleCollision();
  }

  updateTitleText() {
    const realTitle = document.querySelector("title");
    if (realTitle !== null) {
      this.titleElement.textContent = realTitle.textContent || "Lumine";
      this.debouncedCheckTitleCollision();
    }
  }

  checkTitleCollision() {
    requestAnimationFrame(() => {
      const menuRect = this.appMenu.getElement().getBoundingClientRect();
      const titleRect = this.titleElement.getBoundingClientRect();

      if (Utils.domRectIntersects(menuRect, titleRect)) {
        this.titleElement.style.visibility = "hidden";
      } else {
        this.titleElement.style.visibility = "visible";
      }
    });
  }

  deactivate() {
    this.titleObserver?.disconnect();
    this.element.removeEventListener("dblclick", this.handleTitleBarDoubleClick);
    this.appMenu?.destroy();
    this.element.parentElement?.removeChild(this.element);
    this.submenuPortal.parentElement?.removeChild(this.submenuPortal);
    this.detachMenuUpdater();
    this.contextMenuInterceptor.deactivate();

    clearTimeout(this.windowStateSyncTimeout);
    window.removeEventListener("resize", this.handleWindowResize);
    this.windowSubscriptions?.forEach((subscription) => subscription.dispose());
    this.windowSubscriptions = null;
  }

  getSubmenuPortal() {
    return this.submenuPortal;
  }

  getConfigState() {
    return this.configState;
  }

  getThemeManager() {
    return this.themeManager;
  }

  getElement() {
    return this.element;
  }

  getApplicationMenu() {
    return this.appMenu;
  }

  getContextMenuInterceptor() {
    return this.contextMenuInterceptor;
  }

  getControlTiles() {
    return this.controlTiles;
  }

  setLogoStyle(style) {
    const resolvedStyle = resolveLogoStyle(style, this.configState.windowControlTheme);
    const svg = logoStyles[resolvedStyle];

    if (svg !== undefined) {
      this.appIcon.innerHTML = svg;
      this.appIcon.style.display = svg ? "" : "none";
    }
  }

  isTitleBarVisible() {
    return this.titleBarVisible;
  }

  isMenuBarVisible() {
    return this.menuBarVisible;
  }
}

module.exports = { TitleBarView };
