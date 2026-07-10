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
    this.logoStyle = "Default";
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

function resolveLogoStyle(style, controlTheme) {
  if (style !== "Default") return style;

  return resolveControlTheme(controlTheme) === "Windows 11" ? "Filled" : "None";
}

const logoStyles = {
  Filled: `<svg viewBox="0 0 128 128">
    <defs>
      <radialGradient id="title-bar-lumine-gold-gradient" cx="36%" cy="24%" r="74%">
        <stop offset="0%" stop-color="#f6c952"/>
        <stop offset="58%" stop-color="#cf9723"/>
        <stop offset="100%" stop-color="#9a6214"/>
      </radialGradient>
    </defs>
    <circle class="title-bar-logo-disc" cx="64" cy="64" r="60" fill="url(#title-bar-lumine-gold-gradient)"/>
    <circle cx="64" cy="64" r="9.6" fill="#fff"/>
    <path d="M53.1,72.3c-.6,0-1.3.3-1.8.8-.8.8-1,1.9-.6,2.8l-5.2,2-21.4,25.5.5.5,25.5-21.4,2-5.2c.3.1.6.2,1,.2.6,0,1.3-.3,1.8-.8,1-1,1-2.6,0-3.6-.5-.5-1.1-.7-1.8-.7h0Z" fill="#fff"/>
    <path d="M49,100.3c2.4,0,5-.3,7.7-.9,9.4-2.1,18.9-7.7,27-15.8,5.4-5.4,9.8-11.6,12.7-18l-2.5-2.4-.2.5v.3c-2.9,6.1-7,12.1-12.3,17.3-7.6,7.6-16.7,12.9-25.4,14.9-6.5,1.5-12.3,1-16.7-1.5l-2.6,2.2c3.5,2.2,7.6,3.3,12.4,3.3h0Z" fill="#fff"/>
    <path d="M58.8,90.9c-3-1.7-5.3-3.4-8-5.7l-2.5,2.1c2.2,1.9,4.5,3.6,6.9,5.2.9-.3,2.8-1.1,3.6-1.6h0Z" fill="#fff"/>
    <path d="M77.8,45.6l-2,5.2c-.3-.1-.6-.2-1-.2-.6,0-1.3.3-1.8.8-1,1-1,2.6,0,3.6.5.5,1.1.8,1.8.8s1.3-.3,1.8-.8c.8-.8,1-1.9.6-2.8l5.2-2,21.4-25.5-.5-.5-25.6,21.4Z" fill="#fff"/>
    <path d="M49.5,71.2c.2-.2.3-.3.5-.4-1-2.1-1.6-4.3-1.6-6.8,0-8.6,7-15.5,15.5-15.5s4.7.6,6.8,1.6c.2-.2.3-.4.4-.5.8-.8,1.8-1.3,2.9-1.4l.4-1.1c-3.1-1.9-6.7-3-10.5-3-11.1,0-20.1,9-20.1,20.1s1.1,7.5,3,10.5l1.1-.4c.2-1.1.7-2.2,1.5-3h0Z" fill="#fff"/>
    <path d="M78.5,56.7c-.2.2-.3.3-.5.4,1,2.1,1.6,4.3,1.6,6.8,0,8.6-7,15.5-15.5,15.5s-4.7-.6-6.8-1.6c-.2.2-.3.4-.4.5-.8.8-1.8,1.3-2.9,1.4l-.4,1.1c3.1,1.9,6.7,3,10.5,3,11.1,0,20.1-9,20.1-20.1s-1.1-7.5-3-10.5l-1.1.4c-.2,1.1-.7,2.2-1.5,3h0Z" fill="#fff"/>
    <path d="M33.5,33.5c-5.4,5.4-7.1,13.6-5,23.2,1.8,7.9,6,15.9,12.1,23l2.1-2.5c-5.6-6.7-9.4-14-11.1-21.2-1.9-8.5-.5-15.7,4.1-20.2,8.8-8.8,26.6-5.5,41.5,7l2.5-2.1c-16.2-13.8-36.2-17.2-46.2-7.2Z" fill="#fff"/>
    <path d="M87.3,48.2l-2.1,2.5c12.5,14.9,15.8,32.7,7,41.5-4.1,4.1-10.7,5.7-18.2,4.5-1.4.9-2.9,1.7-4.3,2.4,3.2.8,6.2,1.3,9.1,1.3,6.3,0,11.8-2,15.6-5.9,10-10.1,6.7-30.1-7.2-46.3h0Z" fill="#fff"/>
    <path d="M71.2,28.5c-9.4,2.1-18.9,7.7-27,15.8-15.3,15.3-20.7,35.3-13.4,47l2.2-2.6c-5.8-10.5-.4-28.3,13.4-42.1,7.6-7.6,16.7-12.9,25.4-14.9,6.5-1.5,12.3-1,16.7,1.4l2.6-2.2c-5.2-3.3-12.2-4.2-20.1-2.4Z" fill="#fff"/>
    <path d="M97,36.7l-2.2,2.6c1.8,3.3,2.5,7.5,2.1,12.3,1,1.5,1.8,3,2.6,4.5,1.6-7.6.7-14.3-2.5-19.4Z" fill="#fff"/>
    <path d="M64 10l1.9 5.1L71 17l-5.1 1.9L64 24l-1.9-5.1L57 17l5.1-1.9Z" fill="#fff"/>
    <path d="M111 57l1.9 5.1L118 64l-5.1 1.9L111 71l-1.9-5.1L104 64l5.1-1.9Z" fill="#fff"/>
    <path d="M64 104l1.9 5.1L71 111l-5.1 1.9L64 118l-1.9-5.1L57 111l5.1-1.9Z" fill="#fff"/>
    <path d="M17 57l1.9 5.1L24 64l-5.1 1.9L17 71l-1.9-5.1L10 64l5.1-1.9Z" fill="#fff"/>
  </svg>`,
  Unfilled: `<svg viewBox="0 0 128 128" fill="currentColor">
    <circle cx="64" cy="64" r="9.6"/>
    <path d="M53.1,72.3c-.6,0-1.3.3-1.8.8-.8.8-1,1.9-.6,2.8l-5.2,2-21.4,25.5.5.5,25.5-21.4,2-5.2c.3.1.6.2,1,.2.6,0,1.3-.3,1.8-.8,1-1,1-2.6,0-3.6-.5-.5-1.1-.7-1.8-.7h0Z"/>
    <path d="M49,100.3c2.4,0,5-.3,7.7-.9,9.4-2.1,18.9-7.7,27-15.8,5.4-5.4,9.8-11.6,12.7-18l-2.5-2.4-.2.5v.3c-2.9,6.1-7,12.1-12.3,17.3-7.6,7.6-16.7,12.9-25.4,14.9-6.5,1.5-12.3,1-16.7-1.5l-2.6,2.2c3.5,2.2,7.6,3.3,12.4,3.3h0Z"/>
    <path d="M58.8,90.9c-3-1.7-5.3-3.4-8-5.7l-2.5,2.1c2.2,1.9,4.5,3.6,6.9,5.2.9-.3,2.8-1.1,3.6-1.6h0Z"/>
    <path d="M77.8,45.6l-2,5.2c-.3-.1-.6-.2-1-.2-.6,0-1.3.3-1.8.8-1,1-1,2.6,0,3.6.5.5,1.1.8,1.8.8s1.3-.3,1.8-.8c.8-.8,1-1.9.6-2.8l5.2-2,21.4-25.5-.5-.5-25.6,21.4Z"/>
    <path d="M49.5,71.2c.2-.2.3-.3.5-.4-1-2.1-1.6-4.3-1.6-6.8,0-8.6,7-15.5,15.5-15.5s4.7.6,6.8,1.6c.2-.2.3-.4.4-.5.8-.8,1.8-1.3,2.9-1.4l.4-1.1c-3.1-1.9-6.7-3-10.5-3-11.1,0-20.1,9-20.1,20.1s1.1,7.5,3,10.5l1.1-.4c.2-1.1.7-2.2,1.5-3h0Z"/>
    <path d="M78.5,56.7c-.2.2-.3.3-.5.4,1,2.1,1.6,4.3,1.6,6.8,0,8.6-7,15.5-15.5,15.5s-4.7-.6-6.8-1.6c-.2.2-.3.4-.4.5-.8.8-1.8,1.3-2.9,1.4l-.4,1.1c3.1,1.9,6.7,3,10.5,3,11.1,0,20.1-9,20.1-20.1s-1.1-7.5-3-10.5l-1.1.4c-.2,1.1-.7,2.2-1.5,3h0Z"/>
    <path d="M33.5,33.5c-5.4,5.4-7.1,13.6-5,23.2,1.8,7.9,6,15.9,12.1,23l2.1-2.5c-5.6-6.7-9.4-14-11.1-21.2-1.9-8.5-.5-15.7,4.1-20.2,8.8-8.8,26.6-5.5,41.5,7l2.5-2.1c-16.2-13.8-36.2-17.2-46.2-7.2Z"/>
    <path d="M87.3,48.2l-2.1,2.5c12.5,14.9,15.8,32.7,7,41.5-4.1,4.1-10.7,5.7-18.2,4.5-1.4.9-2.9,1.7-4.3,2.4,3.2.8,6.2,1.3,9.1,1.3,6.3,0,11.8-2,15.6-5.9,10-10.1,6.7-30.1-7.2-46.3h0Z"/>
    <path d="M71.2,28.5c-9.4,2.1-18.9,7.7-27,15.8-15.3,15.3-20.7,35.3-13.4,47l2.2-2.6c-5.8-10.5-.4-28.3,13.4-42.1,7.6-7.6,16.7-12.9,25.4-14.9,6.5-1.5,12.3-1,16.7,1.4l2.6-2.2c-5.2-3.3-12.2-4.2-20.1-2.4Z"/>
    <path d="M97,36.7l-2.2,2.6c1.8,3.3,2.5,7.5,2.1,12.3,1,1.5,1.8,3,2.6,4.5,1.6-7.6.7-14.3-2.5-19.4Z"/>
    <path d="M64 10l1.9 5.1L71 17l-5.1 1.9L64 24l-1.9-5.1L57 17l5.1-1.9Z"/>
    <path d="M111 57l1.9 5.1L118 64l-5.1 1.9L111 71l-1.9-5.1L104 64l5.1-1.9Z"/>
    <path d="M64 104l1.9 5.1L71 111l-5.1 1.9L64 118l-1.9-5.1L57 111l5.1-1.9Z"/>
    <path d="M17 57l1.9 5.1L24 64l-5.1 1.9L17 71l-1.9-5.1L10 64l5.1-1.9Z"/>
  </svg>`,
  None: "",
};

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
  resolveLogoStyle,
  logoStyles,
  exceptionCommands,
};
