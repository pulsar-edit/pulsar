const { Disposable, CompositeDisposable } = require("atom");
const { SelectListView, highlightMatches, removeDiacritics } = require("@lumine-code/select-list");
const path = require("path");
const fs = require("fs");

class RecentList {
  constructor() {
    this.items = [];
    this.restart = true;
    this.selectList = new SelectListView({
      className: "recent-list",
      maxResults: 50,
      emptyMessage: "No matches found",
      helpMarkdown:
        "Available commands:\n" +
        "- **Enter**: Open in new window\n" +
        "- **Alt+Enter**: Swap current window\n" +
        "- **Ctrl+Enter**: Switch in same window\n" +
        "- **Shift+Enter**: Append to current window\n" +
        "- **Alt+V**: Insert path\n" +
        "- **Alt+D**: Open in new window in dev mode\n" +
        "- **Alt+S**: Open in new window in safe mode\n" +
        "- **Alt+F12**: Open external (via open-external)\n" +
        "- **Ctrl+F12**: Show in explorer (via open-external)\n" +
        "- **F5**: Refresh list\n" +
        "- **Alt+Delete**: Remove from history",
      removeDiacritics: true,
      elementForItem: (item, options) => this.elementForItem(item, options),
      didConfirmSelection: () => this.performAction("open"),
      didCancelSelection: () => this.didCancelSelection(),
      willShow: () => this.onWillShow(),
      filter: (items, query) => this.filter(items, query),
    });
    this.disposables = new CompositeDisposable();
    this.disposables.add(
      atom.history.onDidChangeProjects(() => {
        this.restart = true;
      }),
      atom.commands.add("atom-workspace", {
        "recent-list:toggle": () => this.toggle(),
      }),
      atom.commands.add(this.selectList.element, {
        "select-list:open": () => this.performAction("open"),
        "select-list:swap": () => this.performAction("swap"),
        "select-list:switch": () => this.performAction("switch"),
        "select-list:append": () => this.performAction("append"),
        "select-list:paste": () => this.performAction("paste"),
        "select-list:dev": () => this.performAction("dev"),
        "select-list:safe": () => this.performAction("safe"),
        "select-list:update": () => this.refresh(),
        "select-list:external": () => this.performAction("external"),
        "select-list:show": () => this.performAction("show"),
        "select-list:delete": () => this.deleteSelected(),
      }),
    );
  }

  setOpenExternalService(service) {
    this.openExternalService = service;
  }

  destroy() {
    this.disposables.dispose();
    this.selectList.destroy();
  }

  toggle() {
    this.selectList.toggle();
  }

  updateItems() {
    this.selectList.update({
      items: this.items,
      loadingMessage: null,
    });
  }

  updateLoadingMessage() {
    this.selectList.update({
      items: [],
      loadingMessage: "Indexing project\u2026",
    });
  }

  onWillShow() {
    if (this.restart) {
      this.restart = false;
      this.items = [];
      this.updateLoadingMessage();
      this.cache().then(() => {
        this.updateItems();
      });
    }
  }

  refresh() {
    this.restart = true;
    this.onWillShow();
  }

  cache() {
    return new Promise((resolve) => {
      for (let project of atom.history.getProjects()) {
        this.items.push({
          paths: project.paths.map((ppath) => {
            return (
              ppath
                .replace(/[\\/]+$/, "")
                .split(/[\\/]/g)
                .join(path.sep) + path.sep
            );
          }),
          texts: project.paths.map((ppath) => {
            return removeDiacritics(
              ppath
                .replace(/[\\/]+$/, "")
                .split(/[\\/]/g)
                .join(path.sep) + path.sep,
            );
          }),
          originalPaths: project.paths,
        });
      }
      resolve();
    });
  }

  filter(items, query) {
    query = removeDiacritics(query);
    if (query.length === 0) {
      return items;
    }
    const scoredItems = [];
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      item.score = 0;
      item.matchIndices = null;
      for (let i = 0; i < item.texts.length; i++) {
        const result = atom.ui.fuzzyMatcher.match(item.texts[i], query, {
          recordMatchIndexes: true,
          algorithm: "command-t", // Path-aware matching
        });
        if (result && result.score > item.score) {
          item.score = result.score;
          item.ibest = i;
          item.matchIndices = result.matchIndexes;
        }
      }
      if (item.score > 0) {
        // Recency bonus: earlier items in history are more recent
        const recencyBonus = 1 + (items.length - idx) / (items.length * 10);
        // Depth bonus: shallower paths are often more important
        const bestPath = item.paths[item.ibest] || item.paths[0];
        const depth = (bestPath.match(/[\\/]/g) || []).length;
        const depthBonus = 1 / Math.sqrt(depth || 1);
        item.score *= recencyBonus * depthBonus;
        scoredItems.push(item);
      }
    }
    return scoredItems.sort((a, b) => b.score - a.score);
  }

  elementForItem(item) {
    const indices = item.matchIndices || [];
    const li = document.createElement("li");

    for (let i = 0; i < item.paths.length; i++) {
      const line = document.createElement("div");
      line.classList.add("primary-line", "icon", "icon-file-directory");
      if (i > 0) {
        line.classList.add("icon-line");
      }
      if (i === item.ibest && indices.length > 0) {
        line.appendChild(highlightMatches(item.paths[i], indices));
      } else {
        line.textContent = item.paths[i];
      }
      li.appendChild(line);
    }

    return li;
  }

  performAction(mode) {
    if (!mode) {
      mode = "open";
    }
    let item = this.selectList.getSelectedItem();
    if (!item) {
      return;
    } else {
      this.selectList.hide();
    }
    const data = this.prepareData(item);
    if (!data.pathsToOpen.length) {
      return;
    }
    if (mode === "open") {
      atom.open(data);
    } else if (mode === "dev") {
      atom.open({ ...data, devMode: true });
    } else if (mode === "safe") {
      atom.open({ ...data, safeMode: true });
    } else if (mode === "swap") {
      let closed = atom.project.getPaths().length ? true : false;
      atom.open(data);
      if (closed) {
        atom.close();
      }
    } else if (mode === "switch") {
      atom.project.setPaths(data.pathsToOpen);
    } else if (mode === "append") {
      for (let projectPath of data.pathsToOpen) {
        atom.project.addPath(projectPath, { mustExist: true });
      }
    } else if (mode === "external") {
      if (!this.openExternalService) {
        atom.notifications.addWarning("The `open-external` package is not available");
        return;
      }
      for (let projectPath of data.pathsToOpen) {
        this.openExternalService.openExternal(projectPath);
      }
    } else if (mode === "show") {
      if (!this.openExternalService) {
        atom.notifications.addWarning("The `open-external` package is not available");
        return;
      }
      for (let projectPath of data.pathsToOpen) {
        this.openExternalService.showInFolder(projectPath);
      }
    } else if (mode === "paste") {
      const editor = atom.workspace.getActiveTextEditor();
      if (!editor) {
        atom.notifications.addError("Cannot insert path, because there is no active text editor");
        return;
      }
      editor.insertText(data.pathsToOpen.join("\n"), { selection: true });
    }
  }

  async deleteSelected() {
    const item = this.selectList.getSelectedItem();
    if (!item) return;
    const currentIdx = this.selectList.selectionIndex ?? 0;
    const scrollEl = this.selectList.refs.items;
    const scrollTop = scrollEl?.scrollTop ?? 0;
    const newFilteredLength = this.selectList.items.length - 1;
    const clampedIdx = newFilteredLength > 0 ? Math.min(currentIdx, newFilteredLength - 1) : 0;
    const idx = this.items.indexOf(item);
    if (idx !== -1) {
      this.items.splice(idx, 1);
    }
    await this.selectList.update({
      items: this.items,
      loadingMessage: null,
      initialSelectionIndex: clampedIdx,
    });
    if (scrollEl) scrollEl.scrollTop = scrollTop;
    atom.history.removeProject(item.originalPaths);
  }

  didCancelSelection() {
    this.selectList.hide();
  }

  prepareData(item) {
    const pathsToOpen = [];
    const errs = [];
    for (let projectPath of item.paths) {
      if (fs.existsSync(projectPath) && fs.lstatSync(projectPath).isDirectory()) {
        pathsToOpen.push(projectPath.replace(/[\\/]+$/, ""));
      } else {
        errs.push(projectPath);
      }
    }
    if (errs.length) {
      atom.notifications.addError("Directory does not exist", {
        detail: errs.join("\n"),
      });
    }
    return { pathsToOpen };
  }
}

module.exports = {
  activate() {
    this.recentList = new RecentList();
  },

  deactivate() {
    this.recentList.destroy();
  },

  provideRecentList() {
    return {
      toggle: () => this.recentList.toggle(),
    };
  },

  consumeOpenExternalService(service) {
    this.recentList.setOpenExternalService(service);
    return new Disposable(() => {
      this.recentList.setOpenExternalService(null);
    });
  },
};
