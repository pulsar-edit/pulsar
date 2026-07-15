const configSchema = {
  core: {
    type: "object",
    properties: {
      ignoredNames: {
        order: 1,
        title: "Ignored Names",
        description:
          "List of [glob patterns](https://en.wikipedia.org/wiki/Glob_%28programming%29). Files and directories matching these patterns will be ignored by some packages, such as the fuzzy finder and tree view. Individual packages might have additional config settings for ignoring names.",
        type: "array",
        items: {
          type: "string",
        },
        default: [".git", ".hg", ".svn", ".DS_Store", "._*", "Thumbs.db", "desktop.ini"],
      },
      excludeVcsIgnoredPaths: {
        order: 2,
        title: "Exclude VCS Ignored Paths",
        description:
          "Files and directories ignored by the current project's VCS will be ignored by some packages, such as the fuzzy finder and find and replace. For example, projects using Git have these paths defined in the .gitignore file. Individual packages might have additional config settings for ignoring VCS ignored files and folders.",
        type: "boolean",
        default: true,
      },
      followSymlinks: {
        order: 3,
        title: "Follow Symlinks",
        description:
          "Follow symbolic links when searching files and when opening files with the fuzzy finder.",
        type: "boolean",
        default: true,
      },
      disabledPackages: {
        order: 4,
        title: "Disabled Packages",
        description: "List of names of installed packages which are not loaded at startup.",
        type: "array",
        items: {
          type: "string",
        },
        default: [],
      },
      customFileTypes: {
        order: 5,
        title: "Custom File Types",
        description:
          'Associates scope names (e.g. `"source.js"`) with arrays of file extensions and file names (e.g. `["Somefile", ".js2"]`)',
        type: "object",
        additionalProperties: {
          type: "array",
          items: {
            type: "string",
          },
        },
        default: {},
      },
      uriHandlerRegistration: {
        order: 6,
        title: "URI Handler Registration",
        description: "When should Lumine register itself as the default handler for atom:// URIs",
        type: "string",
        enum: [
          {
            value: "prompt",
            description: "Prompt to register Lumine as the default atom:// URI handler",
          },
          {
            value: "always",
            description: "Always become the default atom:// URI handler automatically",
          },
          {
            value: "never",
            description: "Never become the default atom:// URI handler",
          },
        ],
        default: "prompt",
      },
      closeDeletedFileTabs: {
        order: 8,
        title: "Close Deleted File Tabs",
        description: "Close corresponding editors when a file is deleted outside Lumine.",
        type: "boolean",
        default: false,
      },
      destroyEmptyPanes: {
        order: 9,
        title: "Remove Empty Panes",
        description: "When the last tab of a pane is closed, remove that pane as well.",
        type: "boolean",
        default: true,
      },
      closeEmptyWindows: {
        order: 10,
        title: "Close Empty Windows",
        description:
          "When a window with no open tabs or panes is given the 'Close Tab' command, close that window.",
        type: "boolean",
        default: true,
      },
      promptOnConflict: {
        order: 11,
        title: "Experimental: Prompt on Conflict",
        description:
          "Prompt before saving a file in a conflicted state, as happens when a file’s contents on disk are changed by another program while edits are pending.",
        type: "boolean",
        default: false,
      },
      fileEncoding: {
        order: 12,
        title: "File Encoding",
        description: "Default character set encoding to use when reading and writing files.",
        type: "string",
        enum: [
          {
            value: "iso88596",
            description: "Arabic (ISO 8859-6)",
          },
          {
            value: "windows1256",
            description: "Arabic (Windows 1256)",
          },
          {
            value: "iso88594",
            description: "Baltic (ISO 8859-4)",
          },
          {
            value: "windows1257",
            description: "Baltic (Windows 1257)",
          },
          {
            value: "iso885914",
            description: "Celtic (ISO 8859-14)",
          },
          {
            value: "iso88592",
            description: "Central European (ISO 8859-2)",
          },
          {
            value: "windows1250",
            description: "Central European (Windows 1250)",
          },
          {
            value: "gb18030",
            description: "Chinese (GB18030)",
          },
          {
            value: "gbk",
            description: "Chinese (GBK)",
          },
          {
            value: "cp950",
            description: "Traditional Chinese (Big5)",
          },
          {
            value: "big5hkscs",
            description: "Traditional Chinese (Big5-HKSCS)",
          },
          {
            value: "cp866",
            description: "Cyrillic (CP 866)",
          },
          {
            value: "iso88595",
            description: "Cyrillic (ISO 8859-5)",
          },
          {
            value: "koi8r",
            description: "Cyrillic (KOI8-R)",
          },
          {
            value: "koi8u",
            description: "Cyrillic (KOI8-U)",
          },
          {
            value: "windows1251",
            description: "Cyrillic (Windows 1251)",
          },
          {
            value: "cp437",
            description: "DOS (CP 437)",
          },
          {
            value: "cp850",
            description: "DOS (CP 850)",
          },
          {
            value: "iso885913",
            description: "Estonian (ISO 8859-13)",
          },
          {
            value: "iso88597",
            description: "Greek (ISO 8859-7)",
          },
          {
            value: "windows1253",
            description: "Greek (Windows 1253)",
          },
          {
            value: "iso88598",
            description: "Hebrew (ISO 8859-8)",
          },
          {
            value: "windows1255",
            description: "Hebrew (Windows 1255)",
          },
          {
            value: "cp932",
            description: "Japanese (CP 932)",
          },
          {
            value: "eucjp",
            description: "Japanese (EUC-JP)",
          },
          {
            value: "shiftjis",
            description: "Japanese (Shift JIS)",
          },
          {
            value: "euckr",
            description: "Korean (EUC-KR)",
          },
          {
            value: "iso885910",
            description: "Nordic (ISO 8859-10)",
          },
          {
            value: "iso885916",
            description: "Romanian (ISO 8859-16)",
          },
          {
            value: "iso88599",
            description: "Turkish (ISO 8859-9)",
          },
          {
            value: "windows1254",
            description: "Turkish (Windows 1254)",
          },
          {
            value: "utf8",
            description: "Unicode (UTF-8)",
          },
          {
            value: "utf16le",
            description: "Unicode (UTF-16 LE)",
          },
          {
            value: "utf16be",
            description: "Unicode (UTF-16 BE)",
          },
          {
            value: "windows1258",
            description: "Vietnamese (Windows 1258)",
          },
          {
            value: "iso88591",
            description: "Western (ISO 8859-1)",
          },
          {
            value: "iso88593",
            description: "Western (ISO 8859-3)",
          },
          {
            value: "iso885915",
            description: "Western (ISO 8859-15)",
          },
          {
            value: "macroman",
            description: "Western (Mac Roman)",
          },
          {
            value: "windows1252",
            description: "Western (Windows 1252)",
          },
        ],
        default: "utf8",
      },
      openEmptyEditorOnStart: {
        order: 13,
        title: "Open Empty Editor On Start",
        description:
          'When checked opens an untitled editor when loading a blank environment (such as with _File > New Window_ or when "Restore Previous Windows On Start" is unchecked); otherwise no editor is opened when loading a blank environment. This setting has no effect when restoring a previous state.',
        type: "boolean",
        default: true,
      },
      restorePreviousWindowsOnStart: {
        order: 14,
        title: "Restore Previous Windows On Start",
        description:
          "When selected 'no', a blank environment is loaded. When selected 'yes' and Lumine is started from the icon or `lumine` by itself from the command line, restores the last state of all Lumine windows; otherwise a blank environment is loaded. When selected 'always', restores the last state of all Lumine windows always, no matter how Lumine is started.",
        type: "string",
        enum: ["no", "yes", "always"],
        default: "yes",
      },
      allowPendingPaneItems: {
        order: 15,
        title: "Allow Pending Pane Items",
        description:
          "Allow items to be previewed without adding them to a pane permanently, such as when single clicking files in the tree view.",
        type: "boolean",
        default: true,
      },
      warnOnLargeFileLimit: {
        order: 16,
        title: "Warn On Large File Limit",
        description: "Warn before opening files larger than this number of megabytes.",
        type: "number",
        default: 40,
      },
      fileSystemWatcher: {
        order: 17,
        title: "File System Watcher",
        description:
          "Choose the underlying implementation used to watch for filesystem changes. It’s usually best to let Lumine handle this, but if you have issues with filesystem events, you can opt into a specific watcher that may work better for your platform.",
        type: "string",
        enum: [
          {
            value: "default",
            description: "Default (let Lumine decide)",
          },
          {
            value: "nsfw",
            description: "Node Sentinel File Watcher",
          },
          {
            value: "parcel",
            description: "@parcel/watcher",
          },
        ],
        default: "default",
      },
      repositoryScanDepth: {
        order: 18,
        title: "Repository Scan Depth",
        description:
          "Automatically scan this many directory levels below each project root for nested Git repositories. Repositories containing a project root and repositories resolved from open files are always detected.",
        type: "integer",
        minimum: 0,
        maximum: 10,
        default: 1,
      },
      repositoryWatchDiscovery: {
        order: 19,
        title: "Watch For Repositories",
        description:
          "Detect Git repositories created or removed below project roots. Disable this on very large directory trees and use the repository rescan command instead.",
        type: "boolean",
        default: false,
      },
      repositoryWatchDepth: {
        order: 20,
        title: "Repository Watch Depth",
        description:
          "Process repository discovery events at this many directory levels below each project root when repository watching is enabled.",
        type: "integer",
        minimum: 0,
        maximum: 10,
        default: 1,
      },
      repositoryMaxCount: {
        order: 21,
        title: "Maximum Repository Count",
        description:
          "Maximum number of repositories that automatic project scanning may add to a window. Manually opened repositories are not rejected by this limit.",
        type: "integer",
        minimum: 1,
        maximum: 1000,
        default: 100,
      },
      repositoryExcludedDirectories: {
        order: 22,
        title: "Repository Scan Exclusions",
        description:
          "Directory names to skip while scanning project roots for nested Git repositories. The .git and node_modules directories are always skipped.",
        type: "array",
        items: {
          type: "string",
        },
        default: [],
      },
      colorProfile: {
        order: 23,
        title: "Color Profile",
        description:
          "Specify whether Lumine should use the operating system's color profile (recommended) or an alternative color profile.<br>Changing this setting will require a relaunch of Lumine to take effect.",
        type: "string",
        enum: [
          {
            value: "default",
            description: "Use color profile configured in the operating system",
          },
          {
            value: "srgb",
            description: "Use sRGB color profile",
          },
        ],
        default: "default",
      },
      transformDeprecatedStyleSheetSelectors: {
        order: 24,
        title: "Transform Deprecated Style Sheet Selectors",
        description:
          "Whether Lumine should transform deprecated DOM Selectors in community package style sheets. Increases compatibility, as well as startup time.",
        type: "boolean",
        default: true,
      },
      transformDeprecatedStyleSheetMathExpressions: {
        order: 25,
        title: "Transform Deprecated Style Sheet Math Expressions",
        description:
          "Whether Lumine should transform deprecated Mathematical Expressions in community package style sheets. Increases compatibility, as well as startup time.",
        type: "boolean",
        default: true,
      },
    },
  },
  theme: {
    type: "object",
    properties: {
      mode: {
        order: 1,
        title: "Mode",
        description:
          "Which theme pair to use: follow the operating system's light/dark preference, or force one.",
        type: "string",
        default: "system",
        enum: [
          { value: "system", description: "Follow system" },
          { value: "light", description: "Light" },
          { value: "dark", description: "Dark" },
        ],
      },
      light: {
        order: 2,
        title: "Light Themes",
        description: "Names of the UI and syntax themes used when the light mode is in effect.",
        type: "array",
        items: {
          type: "string",
        },
        default: ["one-day-ui", "one-day-syntax"],
      },
      dark: {
        order: 3,
        title: "Dark Themes",
        description: "Names of the UI and syntax themes used when the dark mode is in effect.",
        type: "array",
        items: {
          type: "string",
        },
        default: ["one-night-ui", "one-night-syntax"],
      },
    },
  },
  editor: {
    type: "object",
    properties: {
      fontFamily: {
        order: 1,
        title: "Font Family",
        description: "The name of the font family used for editor text.",
        type: "string",
        default: "Menlo, Consolas, DejaVu Sans Mono, monospace",
      },
      fontSize: {
        order: 2,
        title: "Font Size",
        description: "Height in pixels of editor text.",
        type: "integer",
        minimum: 1,
        maximum: 100,
        default: 14,
      },
      defaultFontSize: {
        order: 3,
        title: "Default Font Size",
        description: "Default height in pixels of the editor text. Useful when resetting font size",
        type: "integer",
        minimum: 1,
        maximum: 100,
        default: 14,
      },
      lineHeight: {
        order: 4,
        title: "Line Height",
        description: "Height of editor lines, as a multiplier of font size.",
        type: ["string", "number"],
        default: 1.5,
      },
      showLineNumbers: {
        order: 5,
        title: "Show Line Numbers",
        description: "Show line numbers in the editor's gutter.",
        type: "boolean",
        default: true,
      },
      maxScreenLineLength: {
        order: 6,
        title: "Max Screen Line Length",
        description:
          "Defines the maximum width of the editor window before soft wrapping is enforced, in number of characters.",
        type: "integer",
        minimum: 500,
        default: 500,
      },
      softWrapDebounceInterval: {
        order: 7,
        title: "Soft Wrap Debounce Interval",
        description:
          "When soft wrap is enabled, delays re-wrapping while the editor width is changing (for example during a pane resize) until the width has been stable for this many milliseconds. `0` re-wraps immediately. Higher values reduce CPU usage while resizing large files, at the cost of briefly showing stale wrapping.",
        type: "integer",
        minimum: 0,
        maximum: 1000,
        default: 100,
      },
      scrollSensitivity: {
        order: 8,
        title: "Scroll Sensitivity",
        description: "Determines how fast the editor scrolls when using a mouse or trackpad.",
        type: "integer",
        minimum: 10,
        maximum: 200,
        default: 40,
      },
      scrollPastEnd: {
        order: 9,
        title: "Scroll Past End",
        description: "Allow the editor to be scrolled past the end of the last line.",
        type: "boolean",
        default: false,
      },
      smoothScrolling: {
        order: 10,
        title: "Smooth Scrolling",
        description: "Animated scrolling of text editors.",
        type: "object",
        properties: {
          enabled: {
            order: 1,
            title: "Enabled",
            description:
              "Animate mouse wheel and scroll command movements instead of jumping instantly.",
            type: "boolean",
            default: true,
          },
          wheelSmoothness: {
            order: 2,
            title: "Wheel Smoothness",
            description:
              "How gradually the editor glides toward the target position when scrolling with the mouse wheel. Higher values feel floatier.",
            type: "integer",
            minimum: 1,
            maximum: 20,
            default: 8,
          },
          commandSmoothness: {
            order: 3,
            title: "Command Smoothness",
            description:
              "How gradually the editor glides when scrolling via the `editor:scroll-up` and `editor:scroll-down` commands.",
            type: "integer",
            minimum: 1,
            maximum: 50,
            default: 12,
          },
        },
      },
      altWheelMultiplier: {
        order: 11,
        title: "Alt Wheel Multiplier",
        description:
          "Speed multiplier applied to wheel scrolling while holding `alt`. Set to `1` to disable.",
        type: "number",
        minimum: 1,
        maximum: 100,
        default: 7.5,
      },
      scrollCommandDistance: {
        order: 12,
        title: "Scroll Command Distance",
        description:
          "Distance scrolled by `editor:scroll-up` and `editor:scroll-down`, as a fraction of the editor height. `editor:increase-scroll-distance` and `editor:decrease-scroll-distance` double or halve it per editor without changing this setting.",
        type: "number",
        minimum: 0.015625,
        maximum: 64,
        default: 1,
      },
      ctrlWheelScrollsAllPanes: {
        order: 13,
        title: "Ctrl Wheel Scrolls All Panes",
        description:
          "Holding `ctrl` while wheel scrolling over a text editor scrolls every visible center pane editor together.",
        type: "boolean",
        default: true,
      },
      undoGroupingInterval: {
        order: 14,
        title: "Undo Grouping Interval",
        description:
          "Time interval in milliseconds within which text editing operations will be grouped together in the undo history.",
        type: "integer",
        minimum: 0,
        default: 300,
      },
      confirmCheckoutHeadRevision: {
        order: 15,
        title: "Confirm Checkout HEAD Revision",
        description:
          "Show confirmation dialog when checking out the HEAD revision and discarding changes to current file since last commit.",
        type: "boolean",
        default: true,
      },
      invisibles: {
        order: 16,
        title: "Invisibles",
        description:
          "A hash of characters Lumine will use to render whitespace characters. Keys are whitespace character types, values are rendered characters (use value false to turn off individual whitespace character types).",
        type: "object",
        properties: {
          eol: {
            order: 1,
            title: "End of Line",
            description:
              "Character used to render newline characters (\\n) when the `Show Invisibles` setting is enabled. ",
            type: ["boolean", "string"],
            maximumLength: 1,
            default: "¬",
          },
          space: {
            order: 2,
            title: "Space",
            description:
              "Character used to render leading and trailing space characters when the `Show Invisibles` setting is enabled.",
            type: ["boolean", "string"],
            maximumLength: 1,
            default: "·",
          },
          tab: {
            order: 3,
            title: "Tab",
            description:
              "Character used to render hard tab characters (\\t) when the `Show Invisibles` setting is enabled.",
            type: ["boolean", "string"],
            maximumLength: 1,
            default: "»",
          },
          cr: {
            order: 4,
            title: "Carriage Return",
            description:
              "Character used to render carriage return characters (for Microsoft-style line endings) when the `Show Invisibles` setting is enabled.",
            type: ["boolean", "string"],
            maximumLength: 1,
            default: "¤",
          },
        },
      },
      multiCursorOnClick: {
        order: 17,
        title: "Multi Cursor On Click",
        description:
          "Add multiple cursors when pressing the Ctrl key (Command key on macOS) and clicking the editor.",
        type: "boolean",
        default: true,
      },
    },
  },
  language: {
    type: "object",
    properties: {
      tabLength: {
        order: 1,
        title: "Tab Length",
        description: "Number of spaces used to represent a tab.",
        type: "integer",
        minimum: 1,
        default: 2,
      },
      tabType: {
        order: 2,
        title: "Tab Type",
        description:
          'Determine character inserted when Tab key is pressed. Possible values: "auto", "soft" and "hard". When set to "soft" or "hard", soft tabs (spaces) or hard tabs (tab characters) are used. When set to "auto", the editor auto-detects the tab type based on the contents of the buffer (it uses the first leading whitespace on a non-comment line), or uses the value of the Soft Tabs config setting if auto-detection fails.',
        type: "string",
        enum: ["auto", "soft", "hard"],
        default: "auto",
      },
      softTabs: {
        order: 3,
        title: "Soft Tabs",
        description:
          'If the `Tab Type` config setting is set to "auto" and autodetection of tab type from buffer content fails, then this config setting determines whether a soft tab or a hard tab will be inserted when the Tab key is pressed.',
        type: "boolean",
        default: true,
      },
      atomicSoftTabs: {
        order: 4,
        title: "Atomic Soft Tabs",
        description: "Skip over tab-length runs of leading whitespace when moving the cursor.",
        type: "boolean",
        default: true,
      },
      autoIndent: {
        order: 5,
        title: "Auto Indent",
        description: "Automatically indent the cursor when inserting a newline.",
        type: "boolean",
        default: true,
      },
      autoIndentOnPaste: {
        order: 6,
        title: "Auto Indent On Paste",
        description:
          "Automatically indent pasted text based on the indentation of the previous line.",
        type: "boolean",
        default: true,
      },
      nonWordCharacters: {
        order: 7,
        title: "Non Word Characters",
        description: "A string of non-word characters to define word boundaries.",
        type: "string",
        default: "/\\()\"':,.;<>~!@#$%^&*|+=[]{}`?-…",
      },
      softWrap: {
        order: 8,
        title: "Soft Wrap",
        description:
          "Wraps lines that exceed the width of the window. When `Soft Wrap At Preferred Line Length` is set, it will wrap to the number of characters defined by the `Preferred Line Length` setting.",
        type: "boolean",
        default: false,
      },
      softWrapAtPreferredLineLength: {
        order: 9,
        title: "Soft Wrap At Preferred Line Length",
        description:
          "Instead of wrapping lines to the window's width, wrap lines to the number of characters defined by the `Preferred Line Length` setting. This will only take effect when the soft wrap config setting is enabled globally or for the current language. **Note:** If you want to hide the wrap guide (the vertical line) you can disable the `wrap-guide` package.",
        type: "boolean",
        default: false,
      },
      preferredLineLength: {
        order: 10,
        title: "Preferred Line Length",
        description:
          "Identifies the length of a line which is used when wrapping text with the `Soft Wrap At Preferred Line Length` setting enabled, in number of characters.",
        type: "integer",
        minimum: 1,
        default: 80,
      },
      softWrapHangingIndent: {
        order: 11,
        title: "Soft Wrap Hanging Indent",
        description:
          "When soft wrap is enabled, defines length of additional indentation applied to wrapped lines, in number of characters.",
        type: "integer",
        minimum: 0,
        default: 0,
      },
      showIndentGuide: {
        order: 12,
        title: "Show Indent Guide",
        description: "Show indentation indicators in the editor.",
        type: "boolean",
        default: false,
      },
      showInvisibles: {
        order: 13,
        title: "Show Invisibles",
        description:
          "Render placeholders for invisible characters, such as tabs, spaces and newlines.",
        type: "boolean",
        default: false,
      },
      useTreeSitterParsers: {
        order: 14,
        title: "Use Tree-sitter Parsers",
        description: "Use Tree-sitter parsers for supported languages.",
        type: "boolean",
        default: true,
      },
      largeFileThreshold: {
        order: 15,
        title: "Large File Threshold",
        description:
          "Files larger than this size in megabytes will open in large file mode with syntax highlighting disabled. Only applies to TextMate grammars; Tree-sitter grammars handle large files efficiently without this limitation. Set to 0 to always enable syntax highlighting regardless of file size.",
        type: "number",
        minimum: 0,
        default: 2,
      },
      commentStart: {
        order: 16,
        title: "Comment Start",
        description:
          "Scope-specific string that begins a line comment. Set by language packages; not intended to be configured directly.",
        type: ["string", "null"],
      },
      commentEnd: {
        order: 17,
        title: "Comment End",
        description:
          "Scope-specific string that ends a block comment. Set by language packages; not intended to be configured directly.",
        type: ["string", "null"],
      },
      increaseIndentPattern: {
        order: 18,
        title: "Increase Indent Pattern",
        description:
          "Scope-specific regular expression; a line matching it increases the indentation of the following line.",
        type: ["string", "null"],
      },
      decreaseIndentPattern: {
        order: 19,
        title: "Decrease Indent Pattern",
        description:
          "Scope-specific regular expression; a line matching it decreases its own indentation.",
        type: ["string", "null"],
      },
      foldEndPattern: {
        order: 20,
        title: "Fold End Pattern",
        description: "Scope-specific regular expression that marks the end of a foldable region.",
        type: ["string", "null"],
      },
    },
  },
};

if (process.platform === "darwin") {
  configSchema.core.properties.simpleFullScreenWindows = {
    order: 21,
    title: "Simple Full Screen Windows",
    description:
      "Use pre-Lion fullscreen on macOS. This does not create a new desktop space for Lumine on fullscreen mode.",
    type: "boolean",
    default: false,
  };
}

if (process.platform === "linux") {
  configSchema.editor.properties.selectionClipboard = {
    order: 18,
    title: "Selection Clipboard",
    description: "Enable pasting on middle mouse button click.",
    type: "boolean",
    default: true,
  };
}

module.exports = configSchema;
