const { CompositeDisposable } = require("atom");

// Applies the One themes' appearance settings to the document root as
// attributes that the theme stylesheets (styles/ui/26-config.css) key off of.
const root = document.documentElement;

let subscriptions = null;

module.exports = {
  activate() {
    subscriptions = new CompositeDisposable(
      atom.config.observe("one-theme.variant", (variant) => {
        if (variant === "Pure") {
          root.setAttribute("ui-variant", "pure");
        } else {
          root.removeAttribute("ui-variant");
        }
      }),
      atom.config.observe("one-theme.tabSizing", (tabSizing) => {
        root.setAttribute("ui-tabsizing", tabSizing.toLowerCase());
      }),
      atom.config.observe("one-theme.tabCloseButton", (tabCloseButton) => {
        if (tabCloseButton === "Left") {
          root.setAttribute("ui-tab-close-button", "left");
        } else {
          root.removeAttribute("ui-tab-close-button");
        }
      }),
      atom.config.observe("one-theme.hideDockButtons", (hideDockButtons) => {
        if (hideDockButtons) {
          root.setAttribute("ui-dock-buttons", "hidden");
        } else {
          root.removeAttribute("ui-dock-buttons");
        }
      }),
      atom.config.observe("one-theme.stickyHeaders", (stickyHeaders) => {
        if (stickyHeaders) {
          root.setAttribute("ui-sticky-headers", "sticky");
        } else {
          root.removeAttribute("ui-sticky-headers");
        }
      }),
      // Selects the One themes for both modes; the active pair follows
      // theme.mode as usual.
      atom.commands.add("atom-workspace", "one-theme:select", () => {
        atom.config.set("theme.light", ["one-day-ui", "one-day-syntax"]);
        atom.config.set("theme.dark", ["one-night-ui", "one-night-syntax"]);
      }),
    );
  },

  deactivate() {
    subscriptions?.dispose();
    subscriptions = null;
    root.removeAttribute("ui-variant");
    root.removeAttribute("ui-tabsizing");
    root.removeAttribute("ui-tab-close-button");
    root.removeAttribute("ui-dock-buttons");
    root.removeAttribute("ui-sticky-headers");
  },
};
