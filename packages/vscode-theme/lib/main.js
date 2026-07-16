let subscriptions = null;

module.exports = {
  activate() {
    // Selects the VSCode themes for both modes; the active pair follows
    // theme.mode as usual.
    subscriptions = atom.commands.add("atom-workspace", "vscode-theme:select", () => {
      atom.config.set("theme.light", ["vscode-day-ui", "vscode-day-syntax"]);
      atom.config.set("theme.dark", ["vscode-night-ui", "vscode-night-syntax"]);
    });
  },

  deactivate() {
    subscriptions?.dispose();
    subscriptions = null;
  },
};
