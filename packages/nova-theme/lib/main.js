let subscriptions = null;

module.exports = {
  activate() {
    // Selects the Nova themes for both modes; the active pair follows
    // theme.mode as usual.
    subscriptions = atom.commands.add("atom-workspace", "nova-theme:select", () => {
      atom.config.set("theme.light", ["nova-day-ui", "nova-day-syntax"]);
      atom.config.set("theme.dark", ["nova-night-ui", "nova-night-syntax"]);
    });
  },

  deactivate() {
    subscriptions?.dispose();
    subscriptions = null;
  },
};
