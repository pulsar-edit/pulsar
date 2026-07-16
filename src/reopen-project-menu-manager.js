const { CompositeDisposable } = require("event-kit");
const path = require("path");

// Populates the 'File > Reopen Project' menu with the most recent projects
// from the {HistoryManager}.
module.exports = class ReopenProjectMenuManager {
  constructor({ menu, commands, history, config, open }) {
    this.menuManager = menu;
    this.historyManager = history;
    this.config = config;
    this.open = open;
    this.projects = [];

    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(
      history.onDidChangeProjects(this.update.bind(this)),
      config.onDidChange("core.reopenProjectMenuCount", () => {
        this.update();
      }),
      commands.add("atom-workspace", {
        "application:reopen-project": {
          didDispatch: this.reopenProjectCommand.bind(this),
          hiddenInCommandPalette: true,
        },
      }),
    );
  }

  reopenProjectCommand(e) {
    if (e.detail == null) return;
    if (e.detail.index != null && this.projects[e.detail.index] != null) {
      this.open(this.projects[e.detail.index].paths);
    } else if (e.detail.paths != null) {
      this.open(e.detail.paths);
    }
  }

  update() {
    this.disposeProjectMenu();
    this.projects = this.historyManager
      .getProjects()
      .slice(0, this.config.get("core.reopenProjectMenuCount"));
    const newMenu = ReopenProjectMenuManager.createProjectsMenu(this.projects);
    this.lastProjectMenu = this.menuManager.add([newMenu]);
  }

  dispose() {
    this.subscriptions.dispose();
    this.disposeProjectMenu();
  }

  disposeProjectMenu() {
    if (this.lastProjectMenu) {
      this.lastProjectMenu.dispose();
      this.lastProjectMenu = null;
    }
  }

  static createProjectsMenu(projects) {
    return {
      label: "File",
      id: "File",
      submenu: [
        {
          label: "Reopen Project",
          id: "Reopen Project",
          submenu: projects.map((project, index) => ({
            label: this.createLabel(project),
            command: "application:reopen-project",
            commandDetail: { index: index, paths: project.paths },
          })),
        },
      ],
    };
  }

  static createLabel(project) {
    return project.paths.length === 1
      ? project.paths[0]
      : project.paths.map(this.betterBaseName).join(", ");
  }

  static betterBaseName(directory) {
    // Handles Windows roots better than path.basename which returns '' for 'd:' and 'd:\'
    const match = directory.match(/^([a-z]:)[\\]?$/i);
    return match ? match[1] + "\\" : path.basename(directory);
  }
};
