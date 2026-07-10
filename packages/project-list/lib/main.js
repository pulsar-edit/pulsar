const { CompositeDisposable, Disposable, Emitter, File, Task } = require("atom");
const { SelectListView, highlightMatches } = require("select-list");
// glob >=9 exports named functions; older hoisted versions expose the callable module
const globPkg = require("glob");
const glob = typeof globPkg === "function" ? require("util").promisify(globPkg) : globPkg.glob;
const fs = require("fs");
const path = require("path");
const CSON = require("season");

const CACHE_UPDATED_CHANNEL = "project-list:cache-updated";

class ProjectList {
  constructor() {
    // initialize
    this.items = [];
    this.restart = true;
    this.restarting = false;
    this.currentProject = null;
    this.cacheFingerprint = null;
    this.emitter = new Emitter();

    // config file
    this.configFile = new File(this.getConfigPath());

    // create select-list
    this.selectList = new SelectListView({
      className: "project-list",
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
        "- **F5**: Refresh list",
      removeDiacritics: true,
      algorithm: "fuzzaldrin",
      elementForItem: (item, options) => this.elementForItem(item, options),
      didConfirmSelection: () => this.performAction("open"),
      didCancelSelection: () => this.didCancelSelection(),
      willShow: () => this.onWillShow(),
      filterKeyForItem: (item) => item.text,
      filterScoreModifier: (score, item) => {
        // Bonus for shorter titles (common/important projects)
        const titleBonus = 1 / Math.sqrt(item.title.length);
        // Bonus for fewer tags (general projects)
        const tagBonus = 1 / Math.sqrt((item.tags?.length || 0) + 1);
        return score * titleBonus * tagBonus;
      },
    });

    // create disposables
    this.disposables = new CompositeDisposable();

    // watch required config
    this.disposables.add(
      atom.config.observe("project-list.useCache", (value) => {
        this.useCache = value;
      }),
      atom.config.observe("project-list.checkExists", (value) => {
        this.checkExists = value;
      }),
      atom.config.observe("project-list.parseTitleTags", (value) => {
        this.parseTitleTagsEnabled = value;
        this.restart = true;
      }),
    );

    // track the project matching the current window
    this.disposables.add(
      atom.project.onDidChangePaths(() => {
        this.findCurrentProject();
      }),
    );

    // sync cache updates from other windows
    this.disposables.add(
      atom.applicationDelegate.onDidReceiveWindowEvent(
        CACHE_UPDATED_CHANNEL,
        (cacheFingerprint) => {
          this.handleCacheUpdate(cacheFingerprint);
        },
      ),
    );

    // add global & local shortcuts
    this.disposables.add(
      atom.commands.add("atom-workspace", {
        "project-list:toggle": () => this.selectList.toggle(),
        "project-list:update": () => this.updateView(false),
        "project-list:edit": () => this.editConfig(),
      }),
      atom.commands.add(this.selectList.element, {
        "select-list:open": () => this.performAction("open"),
        "select-list:swap": () => this.performAction("swap"),
        "select-list:switch": () => this.performAction("switch"),
        "select-list:append": () => this.performAction("append"),
        "select-list:paste": () => this.performAction("paste"),
        "select-list:dev": () => this.performAction("dev"),
        "select-list:safe": () => this.performAction("safe"),
        "select-list:update": () => this.updateView(false),
        "select-list:external": () => this.performAction("external"),
        "select-list:show": () => this.performAction("show"),
      }),
    );

    // watch config file
    this.observeConfigFile();
  }

  setOpenExternalService(service) {
    this.openExternalService = service;
  }

  destroy() {
    this.disposables.dispose();
    this.emitter.dispose();
    this.selectList.destroy();
  }

  getConfigPath() {
    return path.join(atom.getConfigDirPath(), "projects.cson");
  }

  getCachePath() {
    return path.join(this.getCacheDirectoryPath(), "projects.json");
  }

  getCacheDirectoryPath() {
    return path.join(atom.getConfigDirPath(), "compile-cache");
  }

  ensureCacheDirectory() {
    const cacheDir = this.getCacheDirectoryPath();
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    return cacheDir;
  }

  getCacheFingerprint() {
    try {
      const stat = fs.statSync(this.getCachePath());
      return `${stat.mtimeMs}:${stat.size}`;
    } catch {
      return null;
    }
  }

  onWillShow() {
    if (this.restart) {
      this.updateView();
    }
  }

  async updateView(loadCache = true) {
    // prevent new updates by .show
    this.restart = false;

    // prevent multiscans
    if (this.restarting) {
      return;
    }
    this.restarting = true;

    // update element
    this.selectList.update({
      items: [],
      loadingMessage: "Indexing projects…",
      loadingBadge: null,
      errorMessage: null,
    });

    // initialize
    this.items = null;
    const errors = [];

    // try load cache if needed
    if (loadCache && this.useCache && !this.items) {
      try {
        this.loadCache();
      } catch (err) {
        errors.push(`loadCache: ${err}`);
      }
    }

    // try build cache if needed
    if (!this.items) {
      try {
        await this.buildCache();
      } catch (err) {
        errors.push(`buildCache: ${err}`);
      }
    }

    // if nothing works then...
    if (!this.items) {
      this.items = [];
    }

    // track current project
    this.findCurrentProject();

    // update element
    this.selectList.update({
      items: this.items,
      loadingMessage: null,
      errorMessage: errors.length ? errors.join("\n") : null,
    });

    // release
    this.restarting = false;
  }

  async updateViewSchedule() {
    this.restart = true;
    if (this.selectList.isVisible()) {
      await this.updateView();
    }
  }

  updateLoading() {
    this.selectList.update({
      items: this.items,
      loadingBadge: this.items.length,
    });
  }

  async observeConfigFile() {
    if (!(await this.configFile.exists())) {
      await this.configFile.create();
      await this.configFile.write("[]");
    }
    this.disposables.add(
      this.configFile.onDidChange(
        debounce(async () => {
          this.clearCache();
          await this.updateViewSchedule();
        }, 100),
      ),
    );
  }

  handleCacheUpdate(cacheFingerprint) {
    if (this.restarting) {
      return;
    }
    if (!this.useCache) {
      return;
    }
    if (cacheFingerprint === this.cacheFingerprint) {
      return;
    }
    try {
      if (this.loadCache()) {
        this.findCurrentProject();
        this.selectList.update({ items: this.items });
      }
    } catch {
      // a stale or malformed cache is rebuilt on the next update
    }
  }

  elementForItem(item, { matchIndices }) {
    // Text format: "Title #tag1 #tag2"
    let li = document.createElement("li");
    li.classList.add("two-lines");
    let e1 = document.createElement("div");
    e1.classList.add("primary-line");
    const indices = matchIndices || [];

    // Render tags first (visual order) - offset: 0 (tags are first in text)
    let tagOffset = 0;
    if (item.tags) {
      for (let tag of item.tags) {
        let et = document.createElement("span");
        et.classList.add("tag");
        tagOffset += 1; // for #
        et.appendChild(
          highlightMatches(
            tag,
            indices.map((x) => x - tagOffset),
          ),
        );
        tagOffset += tag.length + 1; // tag + space
        e1.appendChild(et);
      }
    }

    // Parse and render [tag] patterns from title (if enabled) - offset: after tags
    if (this.parseTitleTagsEnabled) {
      let titleOffset = tagOffset;
      const titleParts = this.parseTitleTags(item.title);
      for (let part of titleParts) {
        if (part.isTag) {
          let et = document.createElement("span");
          et.classList.add("square");
          let text = "[" + part.text + "]";
          et.appendChild(
            highlightMatches(
              text,
              indices.map((x) => x - titleOffset),
            ),
          );
          titleOffset += text.length;
          e1.appendChild(et);
        } else {
          e1.appendChild(
            highlightMatches(
              part.text,
              indices.map((x) => x - titleOffset),
            ),
          );
          titleOffset += part.text.length;
        }
      }
    } else {
      // Render title as-is - offset: after tags
      e1.appendChild(
        highlightMatches(
          item.title,
          indices.map((x) => x - tagOffset),
        ),
      );
    }

    li.appendChild(e1);
    for (let dirPath of item.paths) {
      let ep = document.createElement("div");
      ep.classList.add("secondary-line");
      const icon = item.devMode
        ? "icon-beaker"
        : item.safeMode
          ? "icon-shield"
          : item.icon
            ? item.icon
            : "icon-file-directory";
      ep.classList.add("icon", "icon-line", icon);
      let ei = document.createElement("span");
      ei.textContent = dirPath;
      ep.appendChild(ei);
      li.appendChild(ep);
    }
    return li;
  }

  performAction(mode) {
    if (!mode) {
      mode = "open";
    }
    const item = this.selectList.getSelectedItem();
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
      atom.open({ ...data, newWindow: true });
    } else if (mode === "dev") {
      atom.open({ ...data, newWindow: true, devMode: true });
    } else if (mode === "safe") {
      atom.open({ ...data, newWindow: true, safeMode: true });
    } else if (mode === "swap") {
      let closed = atom.project.getPaths().length ? true : false;
      atom.open({ ...data, newWindow: true });
      if (closed) {
        atom.close();
      }
    } else if (mode === "switch") {
      if (item.devMode || item.safeMode) {
        atom.notifications.addWarning(
          "Cannot switch in same window with devMode or safeMode enabled",
          { detail: "Use 'Open' (Enter) to open in a new window instead." },
        );
        return;
      }
      atom.project.setPaths(data.pathsToOpen);
    } else if (mode === "append") {
      atom.project.addPaths(data.pathsToOpen, { mustExist: true });
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

  didCancelSelection() {
    this.selectList.hide();
  }

  saveCache() {
    const cachePath = this.getCachePath();
    const cacheDir = this.ensureCacheDirectory();
    const tempPath = path.join(
      cacheDir,
      `projects-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.json.tmp`,
    );
    fs.writeFileSync(tempPath, JSON.stringify(this.items));
    fs.renameSync(tempPath, cachePath);
    this.cacheFingerprint = this.getCacheFingerprint();
    atom.applicationDelegate.emitToOtherWindows(CACHE_UPDATED_CHANNEL, this.cacheFingerprint);
  }

  loadCache() {
    const cachePath = this.getCachePath();
    if (!fs.existsSync(cachePath)) {
      return false;
    }
    const items = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    if (!Array.isArray(items)) {
      return false;
    }
    this.items = items;
    this.cacheFingerprint = this.getCacheFingerprint();
    return true;
  }

  clearCache() {
    try {
      fs.rmSync(this.getCachePath(), { force: true });
    } catch {
      // cache file may be gone already
    }
    this.cacheFingerprint = null;
  }

  async buildCache() {
    if (!(await this.configFile.exists())) {
      throw new Error("Config file does not exists");
    }
    const configData = CSON.parse(await this.configFile.read());
    if (configData instanceof Error) {
      throw new Error(configData.message);
    }
    this.items = [];
    for (const item of configData) {
      try {
        item.paths = await this.expandGlobPaths(item.paths);
        if (this.checkExists) {
          let paths = [];
          for (let ppath of item.paths) {
            try {
              await fs.promises.access(ppath);
              paths.push(ppath);
            } catch {
              // skip paths that do not exist
            }
          }
          if (paths.length === 0) {
            continue;
          }
          item.paths = paths;
        }
        this.items.push(this.prepareItem(item));
      } catch {
        // skip malformed config entries
      }
    }
    this.updateLoading();
    const tasks = [];
    for (let item of this.items) {
      if (item.scan) {
        for (let dirPath of item.paths) {
          if (dirPath in tasks) {
            continue;
          }
          tasks[dirPath] = this.scanDir(dirPath, item.tags, item.scan);
        }
      }
    }
    await Promise.all(Object.values(tasks));
    if (this.useCache) {
      this.saveCache();
    }
  }

  scanDir(dirPath, tags, scanList) {
    return new Promise((resolve) => {
      if (scanList == true) {
        scanList = "*/";
      }
      const workerPath = path.join(__dirname, "scan.js");
      const task = Task.once(workerPath, dirPath, scanList);
      task.on("project-list:entries", (entries) => {
        for (let entry of entries) {
          const item = {
            title: entry,
            tags: tags,
            paths: [path.join(dirPath, entry)],
          };
          this.items.push(this.prepareItem(item));
        }
        this.updateLoading();
        resolve();
      });
    });
  }

  findCurrentProject() {
    let current = null;
    if (this.items) {
      const proPaths = atom.project.getPaths().map((proPath) => proPath + path.sep);
      for (let item of this.items) {
        if (item.paths.length !== proPaths.length) {
          continue;
        }
        if (proPaths.every((proPath) => item.paths.includes(proPath))) {
          current = item;
          break;
        }
      }
    }
    const projectKey = (item) => (item ? [item.title, ...item.paths].join("\n") : null);
    const changed = projectKey(current) !== projectKey(this.currentProject);
    this.currentProject = current;
    if (changed) {
      this.emitter.emit("did-change-current-project", current);
    }
    return current;
  }

  getCurrentProject() {
    return this.currentProject;
  }

  onDidChangeCurrentProject(callback) {
    return this.emitter.on("did-change-current-project", callback);
  }

  parseTitleTags(title) {
    const parts = [];
    let lastIndex = 0;
    const regex = /\[([^\]]+)\]/g;
    let match;

    while ((match = regex.exec(title)) !== null) {
      // Add text before the tag
      if (match.index > lastIndex) {
        parts.push({
          text: title.substring(lastIndex, match.index),
          isTag: false,
        });
      }

      // Add the tag content
      parts.push({
        text: match[1],
        isTag: true,
      });

      lastIndex = regex.lastIndex;
    }

    // Add remaining text after the last tag
    if (lastIndex < title.length) {
      parts.push({
        text: title.substring(lastIndex),
        isTag: false,
      });
    }

    return parts;
  }

  async expandGlobPaths(paths) {
    const expanded = await Promise.all(
      paths.map((p) =>
        /[*?{[]/.test(p)
          ? glob(p.split(/[\\/]/g).join("/").replace(/\/?$/, "/"), { absolute: true })
          : Promise.resolve([p]),
      ),
    );
    return expanded.flat().sort();
  }

  editConfig() {
    atom.workspace.open(this.getConfigPath());
  }

  prepareItem(item) {
    // Format: "#tag1 #tag2 Title" - tags first for better fuzzy matching
    item.text = (item.tags ? item.tags.map((x) => `#${x}`).join(" ") + " " : "") + item.title;
    item.paths = item.paths.map((ppath) => {
      return (
        ppath
          .replace(/[\\/]+$/, "")
          .split(/[\\/]/g)
          .join(path.sep) + path.sep
      );
    });
    return item;
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
    let params = { pathsToOpen: pathsToOpen, errs: errs };
    if (item.devMode) {
      params.devMode = true;
    }
    if (item.safeMode) {
      params.safeMode = true;
    }
    return params;
  }
}

function debounce(func, timeout) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

module.exports = {
  activate() {
    this.projectList = new ProjectList();
  },

  deactivate() {
    this.projectList.destroy();
  },

  provideProjectList() {
    return this.projectList;
  },

  consumeOpenExternalService(service) {
    this.projectList.setOpenExternalService(service);
    return new Disposable(() => {
      this.projectList.setOpenExternalService(null);
    });
  },
};
