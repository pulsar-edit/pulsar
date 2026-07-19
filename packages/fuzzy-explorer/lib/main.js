const { CompositeDisposable, Disposable, Task } = require("atom");
const { SelectListView, createTwoLineItem, highlightMatches } = require("@lumine-code/select-list");
const { clipboard, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const CSON = require("@lumine-code/season");

const CACHE_UPDATED_CHANNEL = "fuzzy-explorer:cache-updated";

module.exports = {
  fileIconsService: null,
  openExternalService: null,
  claudeChatService: null,
  ignores: [],
  Ignores: [],
  items: [],
  pending: false,
  building: false,
  separator: 0,
  selectList: null,
  disposables: null,
  cacheUpdateSubscription: null,
  cacheFingerprint: null,

  activate() {
    this.cacheUpdateSubscription = new Disposable();

    this.selectList = new SelectListView({
      className: "fuzzy-explorer",
      maxResults: 50,
      emptyMessage: "No matches found",
      removeDiacritics: true,
      algorithm: "command-t",
      loadingSpinner: true,
      elementForItem: (item, options) => this.elementForItem(item, options),
      didConfirmSelection: () => this.performAction("open"),
      didCancelSelection: () => this.selectList.hide(),
      willShow: () => this.updateView(true),
    });

    this.disposables = new CompositeDisposable(
      atom.config.observe("fuzzy-explorer.separator", (value) => {
        this.separator = value;
      }),
      atom.commands.add("atom-workspace", {
        "fuzzy-explorer:toggle": () => this.selectList.toggle(),
        "fuzzy-explorer:refresh": () => this.build(),
        "fuzzy-explorer:edit": () => this.editConfig(),
      }),
      atom.commands.add(this.selectList.element, {
        "select-list:query-selected-path": () => {
          this.updateQueryFromItem();
        },
        "select-list:open": () => {
          this.performAction("open");
        },
        "select-list:open-external": () => {
          this.performAction("open-external");
        },
        "select-list:show-in-folder": () => {
          this.performAction("show-in-folder");
        },
        "select-list:split-left": () => {
          this.performAction("split", { side: "left" });
        },
        "select-list:split-right": () => {
          this.performAction("split", { side: "right" });
        },
        "select-list:split-up": () => {
          this.performAction("split", { side: "up" });
        },
        "select-list:split-down": () => {
          this.performAction("split", { side: "down" });
        },
        "select-list:insert-absolute-path": () => {
          this.performAction("path", { op: "insert", rel: "a" });
        },
        "select-list:insert-relative-path": () => {
          this.performAction("path", { op: "insert", rel: "r" });
        },
        "select-list:insert-file-name": () => {
          this.performAction("path", { op: "insert", rel: "n" });
        },
        "select-list:copy-absolute-path": () => {
          this.performAction("path", { op: "copy", rel: "a" });
        },
        "select-list:copy-relative-path": () => {
          this.performAction("path", { op: "copy", rel: "r" });
        },
        "select-list:copy-file-name": () => {
          this.performAction("path", { op: "copy", rel: "n" });
        },
        "select-list:refresh-index": () => {
          this.update();
        },
        "select-list:claude-chat": () => {
          this.performAction("claude-chat");
        },
        "select-list:query-selection": () => {
          this.selectList.setQueryFromSelection();
        },
        "select-list:use-default-separator": () => {
          atom.config.set("fuzzy-explorer.separator", 0);
          atom.notifications.addSuccess("Separator has been changed to default");
        },
        "select-list:use-forward-slashes": () => {
          atom.config.set("fuzzy-explorer.separator", 1);
          atom.notifications.addSuccess("Separator has been changed to forward slash");
        },
        "select-list:use-backslashes": () => {
          atom.config.set("fuzzy-explorer.separator", 2);
          atom.notifications.addSuccess("Separator has been changed to backslash");
        },
      }),
    );

    this.observeCacheUpdates();
    if (this.loadCache()) {
      this.pending = true;
    }
  },

  deactivate() {
    this.cacheUpdateSubscription.dispose();
    this.disposables.dispose();
    this.selectList.destroy();
  },

  getConfigPath() {
    return (
      CSON.resolve(path.join(atom.getConfigDirPath(), "explorer")) ||
      path.join(atom.getConfigDirPath(), "explorer.json")
    );
  },

  getCachePath() {
    return path.join(this.getCacheDirectoryPath(), "explorer.json");
  },

  getCacheDirectoryPath() {
    return path.join(atom.getConfigDirPath(), "compile-cache");
  },

  ensureCacheDirectory() {
    const cacheDir = this.getCacheDirectoryPath();
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    return cacheDir;
  },

  getCacheFingerprint() {
    try {
      const stat = fs.statSync(this.getCachePath());
      return `${stat.mtimeMs}:${stat.size}`;
    } catch {
      return null;
    }
  },

  observeCacheUpdates() {
    this.cacheUpdateSubscription.dispose();
    this.cacheUpdateSubscription = atom.applicationDelegate.onDidReceiveWindowEvent(
      CACHE_UPDATED_CHANNEL,
      (cacheFingerprint) => {
        this.handleCacheUpdate(cacheFingerprint);
      },
    );
  },

  handleCacheUpdate(cacheFingerprint) {
    if (this.building) return;
    if (cacheFingerprint === this.cacheFingerprint) return;
    if (this.loadCache()) {
      this.pending = true;
      this.updateView();
    }
  },

  notifyCacheUpdate() {
    atom.applicationDelegate.emitToOtherWindows(CACHE_UPDATED_CHANNEL, this.cacheFingerprint);
  },

  editConfig() {
    const configPath = this.getConfigPath();
    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(
        configPath,
        '[\n  // Add glob patterns here\n  // "C:/Projects/**/*.js"\n]\n',
      );
    }
    atom.workspace.open(configPath);
  },

  loadConfig() {
    const configPath = this.getConfigPath();
    if (!fs.existsSync(configPath)) return [];
    try {
      const patterns = CSON.readFileSync(configPath);
      if (!Array.isArray(patterns)) return [];
      return patterns.filter((p) => typeof p === "string" && p.length > 0);
    } catch {
      return [];
    }
  },

  loadCache() {
    const cachePath = this.getCachePath();
    if (!fs.existsSync(cachePath)) return false;
    const cacheFingerprint = this.getCacheFingerprint();
    if (cacheFingerprint === this.cacheFingerprint) return false;
    try {
      const content = fs.readFileSync(cachePath, "utf8");
      const items = JSON.parse(content);
      if (!Array.isArray(items)) return false;
      this.items = items;
      this.cacheFingerprint = cacheFingerprint;
      return true;
    } catch {
      return false;
    }
  },

  saveCache() {
    const cachePath = this.getCachePath();
    const cacheDir = this.ensureCacheDirectory();
    const tempPath = path.join(
      cacheDir,
      `explorer-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.json.tmp`,
    );

    fs.writeFileSync(tempPath, JSON.stringify(this.items));
    fs.renameSync(tempPath, cachePath);
    this.cacheFingerprint = this.getCacheFingerprint();
    this.notifyCacheUpdate();
  },

  parseIgnores() {
    this.ignores = [];
    for (let ignore of atom.config.get("core.ignoredNames") || []) {
      this.ignores.push(ignore);
      this.ignores.push("**/" + ignore);
      this.ignores.push("**/" + ignore + "/**");
    }
    for (let ignore of atom.config.get("fuzzy-explorer.ignoredNames") || []) {
      this.ignores.push(ignore);
      this.ignores.push("**/" + ignore);
      this.ignores.push("**/" + ignore + "/**");
    }
  },

  build() {
    if (this.building) return;
    this.building = true;
    this.parseIgnores();
    const patterns = this.loadConfig();
    const itemSet = new Set();
    if (patterns.length === 0) {
      this.items = [];
      this.saveCache();
      this.finishBuild();
      return;
    }
    Promise.all(patterns.map((pattern) => this.searchPromise(pattern, itemSet))).then(() => {
      this.items = [...itemSet];
      this.saveCache();
      this.finishBuild();
    });
  },

  finishBuild() {
    this.building = false;
    this.pending = true;
    this.updateView();
  },

  updateView(visible) {
    if (this.pending && (visible || this.selectList.isVisible())) {
      this.pending = false;
      this.selectList.update({
        items: this.items,
        loadingMessage: null,
        helpMarkdown: this.getHelpMarkdown(),
      });
    }
  },

  searchPromise(pattern, itemSet) {
    return new Promise((resolve) => {
      const task = Task.once(
        require.resolve("./scan"),
        pattern,
        this.ignores,
        atom.config.get("core.followSymlinks"),
        atom.config.get("core.excludeVcsIgnoredPaths"),
      );
      task.on("fuzzy-explorer:entries", (entries) => {
        for (const filePath of entries) {
          itemSet.add(path.normalize(filePath));
        }
        resolve();
      });
    });
  },

  getHelpMarkdown() {
    const summary = this.items ? `\n\n**${this.items.length}** files indexed` : "";
    return (
      "Available commands:\n" +
      "- **Enter**: Open file\n" +
      "- **Alt+Enter**: Open externally\n" +
      "- **Ctrl+Enter**: Show in folder\n" +
      "- **Alt+Left|Right|Up|Down**: Split pane\n" +
      "- **Alt+C A|R|N**: Copy path\n" +
      "- **Alt+V A|R|N**: Insert path\n" +
      "- **Alt+Q**: Query from item\n" +
      "- **Alt+S**: Query from selection\n" +
      "- **Alt+0|/|\\\\**: Set separator\n" +
      "- **Alt+F**: Attach to claude-chat\n" +
      "- **F5**: Refresh index" +
      summary
    );
  },

  elementForItem(item, { matchIndices }) {
    const li = createTwoLineItem({
      primary: highlightMatches(item, matchIndices || []),
      icon: this.iconClassForPath(item),
    });
    li.firstChild.dataset.name = path.basename(item);
    return li;
  },

  update() {
    this.selectList.update({
      items: [],
      loadingMessage: "Indexing files\u2026",
    });
    this.build();
  },

  updateQueryFromItem() {
    let text = this.selectList.getSelectedItem() + path.sep;
    this.selectList.refs.queryEditor.setText(text);
    this.selectList.refs.queryEditor.moveToEndOfLine();
  },

  performAction(mode, params) {
    const item = this.selectList.getSelectedItem();
    if (!item) return;

    let editor, itemPath, text;

    if (mode === "open") {
      itemPath = item;
      try {
        if (!fs.lstatSync(itemPath).isFile()) {
          return this.updateQueryFromItem();
        }
      } catch (error) {
        atom.notifications.addError(error.message || String(error), {
          detail: itemPath,
        });
      }
    }

    this.selectList.hide();

    if (mode === "open") {
      atom.workspace.open(item, { pending: atom.config.get("core.allowPendingPaneItems") });
    } else if (mode === "open-external") {
      if (this.openExternalService) {
        this.openExternalService.openExternal(item);
      } else {
        shell.openPath(item);
      }
    } else if (mode === "show-in-folder") {
      if (this.openExternalService) {
        this.openExternalService.showInFolder(item);
      } else {
        shell.showItemInFolder(item);
      }
    } else if (mode === "split") {
      itemPath = item;
      try {
        if (fs.lstatSync(itemPath).isFile()) {
          atom.workspace.open(itemPath, { split: params.side });
        } else {
          atom.notifications.addError("Cannot open path, because it's a dir", {
            detail: itemPath,
          });
        }
      } catch (error) {
        atom.notifications.addError(error.message || String(error), {
          detail: itemPath,
        });
      }
    } else if (mode === "path") {
      if (params.rel === "a") {
        text = item;
      } else if (params.rel === "r") {
        editor = atom.workspace.getActiveTextEditor();
        if (!editor) {
          atom.notifications.addError("Cannot insert path, because there is no active text editor");
          return;
        }
        const editorPath = editor.getPath();
        text = editorPath ? path.relative(path.dirname(editorPath), item) : item;
      } else if (params.rel === "n") {
        text = path.basename(item);
      }
      if (this.separator === 1) {
        text = text.replace(/\\/g, "/");
      } else if (this.separator === 2) {
        text = text.replace(/\//g, "\\");
      }
      if (params.op === "insert") {
        if (!editor) editor = atom.workspace.getActiveTextEditor();
        if (!editor) {
          atom.notifications.addError("Cannot insert path, because there is no active text editor");
          return;
        }
        editor.insertText(text, { select: true });
      } else if (params.op === "copy") {
        clipboard.writeText(text);
      }
    } else if (mode === "claude-chat") {
      if (!this.claudeChatService) {
        atom.notifications.addWarning("claude-chat service not available");
        return;
      }
      const [, relativePath] = atom.project.relativizePath(item);
      const context = {
        type: "paths",
        paths: [item],
        label: relativePath || item,
        icon: "file",
      };
      this.claudeChatService.setAttachContext(context);
    }
  },

  iconClassForPath(filePath) {
    return (this.fileIconsService || atom.ui.iconClassForPath)(filePath);
  },

  consumeClassIcons(object) {
    this.fileIconsService = object.iconClassForPath;
  },

  consumeOpenExternalService(service) {
    this.openExternalService = service;
    return new Disposable(() => {
      this.openExternalService = null;
    });
  },

  consumeClaudeChat(service) {
    this.claudeChatService = service;
    return new Disposable(() => {
      this.claudeChatService = null;
    });
  },
};
