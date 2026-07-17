const MenuEvent = Object.freeze({
  MOUSE_CLICK: Symbol(),
  MOUSE_ENTER: Symbol(),
});

class Config {
  constructor() {
    // Fixed values (not configurable)
    this.displayTitleBar = true;
    this.displayMenuBar = true;
    this.openAdjacent = true;
    this.hideFullscreenTitle = false;
    this.menuBarMnemonics = true;
    this.contextMenuCloseOnBlur = true;

    // Configurable
    this.autoHide = false;
    this.altGivesFocus = false;
    this.windowControlTheme = "Default";
    this.customContextMenus = true;
  }
}

const controlThemes = {
  "Windows 11": {
    cssClass: "theme-windows-11",
    reverseControls: false,
  },
  "macOS Tahoe": {
    cssClass: "theme-macos-tahoe",
    reverseControls: true,
  },
  GNOME: {
    cssClass: "theme-gnome",
    reverseControls: false,
  },
};

function resolveDefaultControlTheme() {
  switch (process.platform) {
    case "darwin":
      return "macOS Tahoe";
    case "linux":
      return "GNOME";
    default:
      return "Windows 11";
  }
}

function resolveControlTheme(theme) {
  return theme === "Default" ? resolveDefaultControlTheme() : theme;
}

const exceptionCommands = new Set([
  "application:open-terms-of-use",
  "application:open-documentation",
  "application:open-faq",
  "application:open-discussions",
  "application:report-issue",
  "application:search-issues",
]);

module.exports = {
  MenuEvent,
  Config,
  controlThemes,
  resolveControlTheme,
  exceptionCommands,
};
