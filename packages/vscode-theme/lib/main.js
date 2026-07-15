const { CompositeDisposable } = require("atom");

// Applies the VSCode themes' appearance settings to the document root as
// attributes that the theme stylesheets (styles/ui/26-config.css) key off of.
// The attributes are vscode-prefixed because every theme package's main
// module is active at the same time, so shared attribute names would collide.
const root = document.documentElement;

let subscriptions = null;

module.exports = {
  activate() {
    subscriptions = new CompositeDisposable(
      atom.config.observe("vscode-theme.tabSizing", (tabSizing) => {
        root.setAttribute("vscode-tabsizing", tabSizing.toLowerCase());
      }),
      atom.config.observe("vscode-theme.tabCloseButton", (tabCloseButton) => {
        if (tabCloseButton === "Left") {
          root.setAttribute("vscode-tab-close-button", "left");
        } else {
          root.removeAttribute("vscode-tab-close-button");
        }
      }),
      atom.config.observe("vscode-theme.hideDockButtons", (hideDockButtons) => {
        if (hideDockButtons) {
          root.setAttribute("vscode-dock-buttons", "hidden");
        } else {
          root.removeAttribute("vscode-dock-buttons");
        }
      }),
      atom.config.observe("vscode-theme.stickyHeaders", (stickyHeaders) => {
        if (stickyHeaders) {
          root.setAttribute("vscode-sticky-headers", "sticky");
        } else {
          root.removeAttribute("vscode-sticky-headers");
        }
      }),
      // Selects the VSCode themes for both modes; the active pair follows
      // theme.mode as usual.
      atom.commands.add("atom-workspace", "vscode-theme:select", () => {
        atom.config.set("theme.light", ["vscode-day-ui", "vscode-day-syntax"]);
        atom.config.set("theme.dark", ["vscode-night-ui", "vscode-night-syntax"]);
      }),
    );
  },

  deactivate() {
    subscriptions?.dispose();
    subscriptions = null;
    root.removeAttribute("vscode-tabsizing");
    root.removeAttribute("vscode-tab-close-button");
    root.removeAttribute("vscode-dock-buttons");
    root.removeAttribute("vscode-sticky-headers");
  },
};
