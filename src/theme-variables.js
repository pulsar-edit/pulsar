// Single source of truth for the theme variable contract.
//
// Each name exists in two forms:
//   - CSS custom property `--<name>` — the source of truth, defined by modern
//     ("dual") themes in styles/variables.css and by the fallbacks in
//     static/variables/base-variables.css.
//   - Less variable `@<name>` — the legacy contract consumed by community
//     packages and provided by legacy ui/syntax themes. The two are bridged
//     automatically by the theme manager (see theme-variable-shim.js and the
//     custom-properties bridge in theme-manager.js).
//
// UI_VARIABLES and SYNTAX_VARIABLES mirror the legacy Less contracts in
// static/variables/ui-variables.less and syntax-variables.less name for name.
// UI_VARIABLES_EXTENDED exists only on the CSS side: fallback values in
// base-variables.css derive them from the core contract, so legacy themes get
// them for free while modern themes may override them with exact values.

const UI_VARIABLES = [
  // Text
  "text-color",
  "text-color-subtle",
  "text-color-highlight",
  "text-color-selected",
  "text-color-info",
  "text-color-success",
  "text-color-warning",
  "text-color-error",

  // Background
  "background-color-info",
  "background-color-success",
  "background-color-warning",
  "background-color-error",
  "background-color-highlight",
  "background-color-selected",
  "app-background-color",

  // Base
  "base-background-color",
  "base-border-color",

  // Components
  "pane-item-background-color",
  "pane-item-border-color",
  "input-background-color",
  "input-border-color",
  "tool-panel-background-color",
  "tool-panel-border-color",
  "inset-panel-background-color",
  "inset-panel-border-color",
  "panel-heading-background-color",
  "panel-heading-border-color",
  "overlay-background-color",
  "overlay-border-color",
  "button-background-color",
  "button-background-color-hover",
  "button-background-color-selected",
  "button-border-color",
  "tab-bar-background-color",
  "tab-bar-border-color",
  "tab-background-color",
  "tab-background-color-active",
  "tab-border-color",
  "tree-view-background-color",
  "tree-view-border-color",
  "scrollbar-color",
  "scrollbar-background-color",

  // Site colors
  "ui-site-color-1",
  "ui-site-color-2",
  "ui-site-color-3",
  "ui-site-color-4",
  "ui-site-color-5",

  // Sizes
  "font-size",
  "input-font-size",
  "disclosure-arrow-size",
  "component-padding",
  "component-icon-padding",
  "component-icon-size",
  "component-line-height",
  "component-border-radius",
  "tab-height",

  // Other
  "font-family",
  "use-custom-controls",
];

const UI_VARIABLES_EXTENDED = [
  // Text
  "text-color-faded",
  "text-color-added",
  "text-color-ignored",
  "text-color-modified",
  "text-color-removed",
  "text-color-renamed",

  // Readable text on colored backgrounds (replaces Less contrast())
  "text-color-on-info",
  "text-color-on-success",
  "text-color-on-warning",
  "text-color-on-error",

  // Background levels
  "level-1-color",
  "level-2-color",
  "level-3-color",
  "level-3-color-hover",
  "level-3-color-active",

  // Accent
  "accent-color",
  "accent-text-color",
  "accent-bg-color",
  "accent-bg-text-color",
  "accent-only-text-color",

  // Components
  "badge-background-color",
  "button-text-color-selected",
  "button-border-color-selected",
  "checkbox-background-color",
  "input-background-color-focus",
  "input-selection-color",
  "input-selection-color-focus",
  "overlay-backdrop-color",
  "overlay-backdrop-opacity",
  "progress-background-color",
  "scrollbar-color-editor",
  "scrollbar-background-color-editor",
  "tab-text-color",
  "tab-text-color-active",
  "tab-text-color-editor",
  "tab-background-color-editor",
  "tab-inactive-status-added",
  "tab-inactive-status-modified",
  "tooltip-background-color",
  "tooltip-text-color",
  "tooltip-text-key-color",
  "tooltip-background-key-color",

  // Sizes
  "ui-size",
  "ui-input-size",
  "ui-padding",
  "ui-padding-pane",
  "ui-padding-icon",
  "ui-line-height",
  "ui-tab-height",

  // Package overrides
  "settings-list-background-color",
  "theme-config-box-shadow",
  "theme-config-box-shadow-selected",
  "theme-config-border-selected",
];

const SYNTAX_VARIABLES = [
  // General
  "syntax-text-color",
  "syntax-cursor-color",
  "syntax-selection-color",
  "syntax-selection-flash-color",
  "syntax-background-color",

  // Guides
  "syntax-wrap-guide-color",
  "syntax-indent-guide-color",
  "syntax-invisible-character-color",

  // Find and replace markers
  "syntax-result-marker-color",
  "syntax-result-marker-color-selected",

  // Gutter
  "syntax-gutter-text-color",
  "syntax-gutter-text-color-selected",
  "syntax-gutter-background-color",
  "syntax-gutter-background-color-selected",

  // Git diff
  "syntax-color-added",
  "syntax-color-modified",
  "syntax-color-removed",
  "syntax-color-renamed",

  // Language entities
  "syntax-color-variable",
  "syntax-color-constant",
  "syntax-color-property",
  "syntax-color-value",
  "syntax-color-function",
  "syntax-color-method",
  "syntax-color-class",
  "syntax-color-keyword",
  "syntax-color-tag",
  "syntax-color-attribute",
  "syntax-color-import",
  "syntax-color-snippet",
  "syntax-color-string",
  "syntax-color-comment",

  // Terminal
  "terminal-text-color",
  "terminal-background-color",
  "terminal-selection-background-color",
  "terminal-selection-text-color",
  "terminal-cursor-color",
  "terminal-result-marker-color",
  "terminal-result-marker-color-selected",
  "terminal-color-black",
  "terminal-color-red",
  "terminal-color-green",
  "terminal-color-yellow",
  "terminal-color-blue",
  "terminal-color-magenta",
  "terminal-color-cyan",
  "terminal-color-white",
  "terminal-color-bright-black",
  "terminal-color-bright-red",
  "terminal-color-bright-green",
  "terminal-color-bright-yellow",
  "terminal-color-bright-blue",
  "terminal-color-bright-magenta",
  "terminal-color-bright-cyan",
  "terminal-color-bright-white",
];

module.exports = { UI_VARIABLES, UI_VARIABLES_EXTENDED, SYNTAX_VARIABLES };
