const path = require("path");
const { CompositeDisposable, Disposable } = require("atom");
const { shell } = require("electron");

const PACKAGE_NAME = "open-external";

module.exports = {
  activate() {
    this.handlers = [];
    this.treeView = null;
    this.disposables = new CompositeDisposable(
      atom.commands.add("atom-workspace", {
        "open-external:toggle": () => this.toggle(),
      }),
      atom.commands.add("atom-text-editor:not([mini]), .image-view, .image-editor, .pdf-viewer", {
        "open-external:open": () => this.openActiveItem(),
        "open-external:show": () => this.showActiveItem(),
      }),
      atom.commands.add(".tree-view", {
        "open-external:open": () => this.openTreeSelection(),
        "open-external:show": () => this.showTreeSelection(),
      }),
      atom.config.observe(`${PACKAGE_NAME}.flag`, (enabled) => {
        this.enabled = enabled;
      }),
      atom.config.observe(`${PACKAGE_NAME}.list`, (extensions) => {
        this.extensions = new Set(
          (Array.isArray(extensions) ? extensions : [])
            .map((extension) => String(extension).replace(/^\./, "").toLowerCase())
            .filter(Boolean),
        );
      }),
      atom.workspace.addOpener((uri) => {
        if (this.shouldOpenExternally(uri)) return this.openExternal(uri);
      }),
    );
  },

  deactivate() {
    this.disposables?.dispose();
    this.disposables = null;
    this.handlers = [];
    this.treeView = null;
  },

  shouldOpenExternally(uri) {
    if (!this.enabled || typeof uri !== "string") return false;
    const extension = path.extname(uri).slice(1).toLowerCase();
    return extension !== "" && this.extensions.has(extension);
  },

  toggle() {
    const enabled = !atom.config.get(`${PACKAGE_NAME}.flag`);
    atom.config.set(`${PACKAGE_NAME}.flag`, enabled);
    atom.notifications.addInfo(
      `External file opening has been ${enabled ? "enabled" : "disabled"}`,
    );
  },

  provideOpenExternalService() {
    return {
      registerHandler: (handler) => this.registerHandler(handler),
      openExternal: (filePath) => this.openExternal(filePath),
      showInFolder: (filePath) => this.showInFolder(filePath),
    };
  },

  registerHandler(handler) {
    const hasOperation =
      typeof handler?.openExternal === "function" || typeof handler?.showInFolder === "function";
    if (
      !hasOperation ||
      typeof handler.priority !== "number" ||
      !Number.isFinite(handler.priority)
    ) {
      throw new TypeError(
        "An external handler must have a finite priority and at least one operation",
      );
    }

    const index = this.handlers.findIndex((current) => handler.priority > current.priority);
    this.handlers.splice(index === -1 ? this.handlers.length : index, 0, handler);

    return new Disposable(() => {
      const handlerIndex = this.handlers.indexOf(handler);
      if (handlerIndex !== -1) this.handlers.splice(handlerIndex, 1);
    });
  },

  async runHandlers(operation, filePath) {
    for (const handler of this.handlers) {
      if (typeof handler[operation] !== "function") continue;
      try {
        const handled = await handler[operation](filePath);
        if (handled != null) return true;
      } catch (error) {
        console.error(`Error in open-external ${operation} handler:`, error);
      }
    }
    return false;
  },

  async openExternal(filePath) {
    if (typeof filePath !== "string" || filePath.length === 0) return;
    if (await this.runHandlers("openExternal", filePath)) return "";
    return shell.openPath(filePath);
  },

  async showInFolder(filePath) {
    if (typeof filePath !== "string" || filePath.length === 0) return;
    if (await this.runHandlers("showInFolder", filePath)) return "";
    shell.showItemInFolder(filePath);
    return "";
  },

  getActiveItemPath() {
    const item = atom.workspace.getActivePaneItem();
    return typeof item?.getPath === "function" ? item.getPath() : undefined;
  },

  openActiveItem() {
    return this.openExternal(this.getActiveItemPath());
  },

  showActiveItem() {
    return this.showInFolder(this.getActiveItemPath());
  },

  consumeTreeView(treeView) {
    this.treeView = treeView;
    return new Disposable(() => {
      if (this.treeView === treeView) this.treeView = null;
    });
  },

  getSelectedTreePaths() {
    if (typeof this.treeView?.selectedPaths !== "function") return [];
    const selectedPaths = this.treeView.selectedPaths();
    return Array.isArray(selectedPaths) ? selectedPaths : [];
  },

  openTreeSelection() {
    return Promise.all(this.getSelectedTreePaths().map((filePath) => this.openExternal(filePath)));
  },

  showTreeSelection() {
    return Promise.all(this.getSelectedTreePaths().map((filePath) => this.showInFolder(filePath)));
  },
};
