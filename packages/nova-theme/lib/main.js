const { CompositeDisposable } = require("atom");

// Applies the Nova themes' appearance settings to the document root as
// attributes that the theme stylesheets (styles/ui/26-config.css) key off of.
// The attributes are nova-prefixed because every theme package's main module
// is active at the same time, so shared attribute names would collide.
const root = document.documentElement;

let subscriptions = null;

module.exports = {
  activate() {
    subscriptions = new CompositeDisposable(
      atom.config.observe("nova-theme.tabSizing", (tabSizing) => {
        root.setAttribute("nova-tabsizing", tabSizing.toLowerCase());
      }),
      atom.config.observe("nova-theme.tabCloseButton", (tabCloseButton) => {
        if (tabCloseButton === "Left") {
          root.setAttribute("nova-tab-close-button", "left");
        } else {
          root.removeAttribute("nova-tab-close-button");
        }
      }),
      atom.config.observe("nova-theme.hideDockButtons", (hideDockButtons) => {
        if (hideDockButtons) {
          root.setAttribute("nova-dock-buttons", "hidden");
        } else {
          root.removeAttribute("nova-dock-buttons");
        }
      }),
      atom.config.observe("nova-theme.stickyHeaders", (stickyHeaders) => {
        if (stickyHeaders) {
          root.setAttribute("nova-sticky-headers", "sticky");
        } else {
          root.removeAttribute("nova-sticky-headers");
        }
      }),
      // Selects the Nova themes for both modes; the active pair follows
      // theme.mode as usual.
      atom.commands.add("atom-workspace", "nova-theme:select", () => {
        atom.config.set("theme.light", ["nova-day-ui", "nova-day-syntax"]);
        atom.config.set("theme.dark", ["nova-night-ui", "nova-night-syntax"]);
      }),
    );
  },

  deactivate() {
    subscriptions?.dispose();
    subscriptions = null;
    root.removeAttribute("nova-tabsizing");
    root.removeAttribute("nova-tab-close-button");
    root.removeAttribute("nova-dock-buttons");
    root.removeAttribute("nova-sticky-headers");
  },
};
