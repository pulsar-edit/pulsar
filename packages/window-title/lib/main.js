const { CompositeDisposable, Disposable } = require("atom");
const path = require("path");

module.exports = {
  activate() {
    this.template = "";
    this.projectList = null;
    this.indexRequested = false;

    // wrap the core title renderer; the original is a pre-bound instance property
    this.originalUpdateWindowTitle = atom.workspace.updateWindowTitle;
    atom.workspace.updateWindowTitle = () => {
      this.originalUpdateWindowTitle();
      const title = this.render();
      if (title) {
        document.title = title;
      }
    };

    this.disposables = new CompositeDisposable(
      atom.config.observe("window-title.template", (value) => {
        this.template = value || "";
        this.requestProjectListIndex();
        atom.workspace.updateWindowTitle();
      }),
    );
  },

  deactivate() {
    this.disposables.dispose();
    if (this.originalUpdateWindowTitle) {
      atom.workspace.updateWindowTitle = this.originalUpdateWindowTitle;
      this.originalUpdateWindowTitle = null;
      atom.workspace.updateWindowTitle();
    }
  },

  consumeProjectList(projectList) {
    this.projectList = projectList;
    const subscription = projectList.onDidChangeCurrentProject(() => {
      atom.workspace.updateWindowTitle();
    });
    this.requestProjectListIndex();
    atom.workspace.updateWindowTitle();
    return new Disposable(() => {
      subscription.dispose();
      this.projectList = null;
      this.indexRequested = false;
      atom.workspace.updateWindowTitle();
    });
  },

  // the project list indexes lazily; trigger it only when the template needs it
  requestProjectListIndex() {
    if (this.indexRequested || !this.projectList) {
      return;
    }
    if (/\{projectTitle\}/.test(this.template)) {
      this.indexRequested = true;
      this.projectList.updateView();
    }
  },

  render() {
    if (!this.template.trim()) {
      return null;
    }
    const variables = this.variables();
    let title = this.template.replace(/\{([a-zA-Z]+)\}/g, (match, name) =>
      Object.prototype.hasOwnProperty.call(variables, name) ? variables[name] : "",
    );
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
    const projectPath = atom.project.getPaths()[0];
    const repository = atom.project.getRepositories().find(Boolean);
    const currentProject = this.projectList ? this.projectList.getCurrentProject() : null;
    const relativeFilePath = itemPath ? atom.project.relativizePath(itemPath)[1] : null;
    return {
      projectTitle: currentProject ? currentProject.title : "",
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
      devMode: atom.inDevMode() ? "dev" : "",
      safeMode: atom.inSafeMode() ? "safe" : "",
    };
  },
};
