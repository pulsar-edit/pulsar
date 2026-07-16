const { CompositeDisposable, Disposable } = require("atom");
const { Liquid } = require("liquidjs");
const path = require("path");

const templateEngine = new Liquid({ jsTruthy: true });
const modeSuffix = "{% if devMode %} [Dev]{% endif %}{% if safeMode %} [Safe]{% endif %}";
const presetTemplates = Object.freeze({
  Project:
    "{% if projectTitle %}{{ projectTitle }}{% else %}{{ projectName }}{% endif %}" + modeSuffix,
  File: "{{ fileName }}" + modeSuffix,
  "Project and File":
    "{% if projectTitle %}{{ projectTitle }}{% else %}{{ projectName }}{% endif %}{% if fileName %} — {{ fileName }}{% endif %}" +
    modeSuffix,
  "Full Path": "{{ filePath }}" + modeSuffix,
});

module.exports = {
  activate() {
    this.active = true;
    this.templateSelection = "";
    this.customTemplate = "";
    this.template = "";
    this.parsedTemplate = null;
    this.projectList = null;
    this.indexRequested = false;

    this.disposables = new CompositeDisposable(
      atom.config.observe("window-title.template", (value) => {
        this.templateSelection = value || "";
        this.updateTemplate();
      }),
      atom.config.observe("window-title.custom", (value) => {
        this.customTemplate = value || "";
        this.updateTemplate();
      }),
      atom.project.onDidChangePaths(() => this.updateTitle()),
      atom.workspace.onDidChangeActivePaneItem(() => this.subscribeToActiveItem()),
    );
    this.subscribeToActiveItem();
  },

  updateTemplate() {
    this.template =
      presetTemplates[this.templateSelection] ||
      (this.templateSelection === "Custom" ? this.customTemplate : this.templateSelection);
    this.parsedTemplate = null;
    if (this.template.trim()) {
      try {
        this.parsedTemplate = templateEngine.parse(this.template);
      } catch (error) {
        atom.notifications.addWarning("window-title: invalid template", {
          detail: error.message || String(error),
        });
      }
    }
    this.requestProjectListIndex();
    this.updateTitle();
  },

  deactivate() {
    this.active = false;
    this.disposables.dispose();
    this.activeItemSubscription?.dispose();
    this.activeItemSubscription = null;
    this.setDefaultTitle();
  },

  consumeProjectList(projectList) {
    this.projectList = projectList;
    const subscription = projectList.onDidChangeCurrentProject(() => {
      this.updateTitle();
    });
    this.requestProjectListIndex();
    this.updateTitle();
    return new Disposable(() => {
      subscription.dispose();
      this.projectList = null;
      this.indexRequested = false;
      this.updateTitle();
    });
  },

  subscribeToActiveItem() {
    this.activeItemSubscription?.dispose();
    this.activeItemSubscription = null;

    const activeItem = atom.workspace.getActivePaneItem();
    if (activeItem && typeof activeItem.onDidChangeTitle === "function") {
      this.activeItemSubscription = activeItem.onDidChangeTitle(() => this.updateTitle());
    } else if (activeItem && typeof activeItem.on === "function") {
      const updateTitle = () => this.updateTitle();
      const subscription = activeItem.on("title-changed", updateTitle);
      if (subscription && typeof subscription.dispose === "function") {
        this.activeItemSubscription = subscription;
      } else if (typeof activeItem.off === "function") {
        this.activeItemSubscription = new Disposable(() => {
          activeItem.off("title-changed", updateTitle);
        });
      }
    }

    this.updateTitle();
  },

  updateTitle() {
    if (!this.active) {
      this.setDefaultTitle();
      return;
    }
    document.title = this.render() || "Lumine";
    atom.applicationDelegate?.setRepresentedFilename?.(this.representedFilename());
  },

  setDefaultTitle() {
    document.title = "Lumine";
    atom.applicationDelegate?.setRepresentedFilename?.("");
  },

  representedFilename() {
    const activeItem = atom.workspace.getActivePaneItem();
    const itemPath = activeItem?.getPath?.();
    return itemPath || atom.project.getPaths()[0] || "";
  },

  // the project list indexes lazily; trigger it only when the template needs it
  requestProjectListIndex() {
    if (this.indexRequested || !this.projectList) {
      return;
    }
    if (this.template.includes("projectTitle")) {
      this.indexRequested = true;
      this.projectList.updateView();
    }
  },

  render() {
    if (!this.parsedTemplate) {
      return null;
    }
    let title;
    try {
      title = templateEngine.renderSync(this.parsedTemplate, this.variables());
    } catch {
      // a template that fails at render time falls back to the application title
      return null;
    }
    title = title
      .replace(/\[\s*\]|\(\s*\)/g, "")
      .replace(/\s{2,}/g, " ")
      .replace(/^[\s\-–—|:·]+|[\s\-–—|:·]+$/g, "");
    return title || null;
  },

  variables() {
    const activeItem = atom.workspace.getActivePaneItem();
    const itemPath =
      activeItem && typeof activeItem.getPath === "function" ? activeItem.getPath() : null;
    const itemTitle =
      activeItem && typeof activeItem.getTitle === "function" ? activeItem.getTitle() : "";
    const projectPaths = atom.project.getPaths();
    const projectPath = projectPaths[0];
    const repository =
      atom.repositories.getForPath(itemPath) ||
      atom.repositories.getForPath(projectPath) ||
      atom.repositories.getRepositories()[0] ||
      null;
    const currentProject = this.projectList ? this.projectList.getCurrentProject() : null;
    const relativeFilePath = itemPath ? atom.project.relativizePath(itemPath)[1] : null;
    return {
      projectTitle: currentProject ? currentProject.title : "",
      projectPaths: projectPaths.join(", "),
      projectCount: projectPaths.length,
      projectName: projectPath ? path.basename(projectPath) : "",
      projectPath: projectPath || "",
      fileName: itemPath ? path.basename(itemPath) : itemTitle || "",
      filePath: itemPath || "",
      relativeFilePath: relativeFilePath || "",
      gitHead:
        repository && typeof repository.getShortHead === "function"
          ? repository.getShortHead() || ""
          : "",
      appName: atom.getAppName(),
      devMode: atom.inDevMode(),
      safeMode: atom.inSafeMode(),
    };
  },
};
