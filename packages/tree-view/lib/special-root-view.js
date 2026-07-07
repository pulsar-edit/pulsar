const path = require("path");
const fs = require("./fs-compat");
const getIconServices = require("./get-icon-services");
const { CompositeDisposable } = require("atom");

class SpecialRootEntry {
  constructor(filePath, entryClassName) {
    this.filePath = filePath;
    this.subscriptions = new CompositeDisposable();
    this.isDirectory = fs.isDirectorySync(filePath);

    this.element = document.createElement("li");
    this.element.setAttribute("is", "tree-view-special-entry");
    this.element.classList.add(
      entryClassName,
      "tree-view-special-entry",
      this.isDirectory ? "directory" : "file",
      "entry",
      "list-item",
    );

    this.fileName = document.createElement("span");
    this.fileName.classList.add("name", "icon");
    this.element.appendChild(this.fileName);

    const name = path.basename(filePath);
    this.fileName.textContent = name;
    this.fileName.title = filePath;
    this.fileName.dataset.name = name;
    this.fileName.dataset.path = filePath;

    this.file = { path: filePath };

    this.element.getPath = () => this.filePath;
    this.element.isPathEqual = (p) =>
      this.filePath === p || this.filePath === atom.project.resolve(p);
    this.element.file = this.file;
    this.element.fileName = this.fileName;

    if (this.isDirectory) {
      this.directory = { path: filePath, contains: () => false };
      this.directoryName = this.fileName;
      this.element.directory = this.directory;
      this.element.directoryName = this.directoryName;
      this.element.expand = () => Promise.resolve();
      this.element.collapse = () => {};
      this.element.toggleExpansion = () => {};
    }

    this.updateIcon();
    this.subscriptions.add(getIconServices().onDidChange(() => this.updateIcon()));
    this.checkExists();
  }

  updateIcon() {
    if (this.isDirectory) {
      getIconServices().updateDirectoryIcon(this);
    } else {
      getIconServices().updateFileIcon(this);
    }
  }

  checkExists() {
    if (!fs.existsSync(this.filePath)) {
      this.element.classList.add("status-removed");
    } else {
      this.element.classList.remove("status-removed");
    }
  }

  destroy() {
    this.subscriptions.dispose();
    this.element.remove();
  }
}

class SpecialRootSection {
  constructor(config) {
    this.config = config;
    this.isExpanded = true;
    this.isVisible = true;
    this.entryViews = [];

    // Root container
    this.element = document.createElement("ol");
    this.element.classList.add(
      config.className,
      "tree-view-special",
      "list-tree",
      "has-collapsable-children",
    );

    // Header entry (looks like a project root)
    this.headerEntry = document.createElement("li");
    this.headerEntry.classList.add(
      `${config.className}-root`,
      "tree-view-special-root",
      "directory",
      "entry",
      "list-nested-item",
      "project-root",
    );

    this.header = document.createElement("div");
    this.header.classList.add("header", "list-item", "project-root-header");

    this.headerName = document.createElement("span");
    this.headerName.classList.add("name", "icon", config.iconClass);
    this.headerName.textContent = config.name;
    this.headerName.title = config.name;

    this.entriesList = document.createElement("ol");
    this.entriesList.classList.add("entries", "list-tree");

    this.header.appendChild(this.headerName);
    this.headerEntry.appendChild(this.header);
    this.headerEntry.appendChild(this.entriesList);
    this.element.appendChild(this.headerEntry);

    // Synthetic path for tree-view compatibility
    const syntheticPath = `special-root://${config.name.toLowerCase().replace(/\s+/g, "-")}`;
    this.headerEntry.getPath = () => syntheticPath;
    this.headerEntry.isPathEqual = (p) => p === syntheticPath;
    this.headerEntry.collapse = this.collapse.bind(this);
    this.headerEntry.expand = this.expand.bind(this);
    this.headerEntry.toggleExpansion = this.toggleExpansion.bind(this);
    this.headerEntry.header = this.header;
    this.headerEntry.entries = this.entriesList;
    this.headerEntry.directoryName = this.headerName;
    this.headerEntry.directory = {
      path: syntheticPath,
      contains: () => false,
      getEntries: () => config.getEntries(),
    };

    // Start expanded
    this.headerEntry.classList.add("expanded");
    this.headerEntry.classList.remove("collapsed");
    this.headerEntry.isExpanded = true;
    this.buildEntries();
    this.updateVisibility();
  }

  expand() {
    this.isExpanded = true;
    this.headerEntry.isExpanded = true;
    this.headerEntry.classList.add("expanded");
    this.headerEntry.classList.remove("collapsed");
    this.buildEntries();
    return Promise.resolve();
  }

  collapse() {
    this.isExpanded = false;
    this.headerEntry.isExpanded = false;
    this.headerEntry.classList.remove("expanded");
    this.headerEntry.classList.add("collapsed");
    this.clearEntries();
  }

  toggleExpansion() {
    if (this.isExpanded) {
      this.collapse();
    } else {
      this.expand();
    }
  }

  refresh() {
    if (this.isExpanded) {
      this.buildEntries();
    }
    this.updateVisibility();
  }

  buildEntries() {
    this.clearEntries();
    const paths = this.config.getEntries();
    for (const filePath of paths) {
      const view = new SpecialRootEntry(filePath, this.config.entryClassName);
      this.entryViews.push(view);
      this.entriesList.appendChild(view.element);
    }
  }

  clearEntries() {
    for (const view of this.entryViews) {
      view.destroy();
    }
    this.entryViews = [];
    this.entriesList.innerHTML = "";
  }

  toggleVisible() {
    this.isVisible = !this.isVisible;
    this.updateVisibility();
  }

  updateVisibility() {
    const entries = this.config.getEntries();
    if (!this.isVisible || entries.length === 0) {
      this.element.style.display = "none";
    } else {
      this.element.style.display = "";
    }
  }

  destroy() {
    this.clearEntries();
    this.element.remove();
  }
}

module.exports = { SpecialRootSection, SpecialRootEntry };
