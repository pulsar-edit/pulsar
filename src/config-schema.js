// This is loaded by atom-environment.coffee. See
// https://atom.io/docs/api/latest/Config for more information about config TODO: Link to Pulsar API site when documented
// schemas.
const configSchema = {
  core: {
    type: 'object',
    properties: {
      ignoredNames: {
        type: 'array',
        default: [
          '.git',
          '.hg',
          '.svn',
          '.DS_Store',
          '._*',
          'Thumbs.db',
          'desktop.ini'
        ],
        items: {
          type: 'string'
        },
        description:
          '%pulsar.config.ignoredNames.description%'
      },
      excludeVcsIgnoredPaths: {
        type: 'boolean',
        default: true,
        title: '%pulsar.config.excludeVcsIgnoredPaths.title%',
        description: '%pulsar.config.excludeVcsIgnoredPaths.description%'
      },
      followSymlinks: {
        type: 'boolean',
        default: true,
        description:
          '%pulsar.config.followSymlinks.description%'
      },
      disabledPackages: {
        type: 'array',
        default: [],

        items: {
          type: 'string'
        },

        description:
          '%pulsar.config.disabledPackages.description%'
      },
      titleBar: {
        type: 'string',
        default: 'native',
        enum: ['native', 'hidden'],
        description:
          '%pulsar.config.titleBar.description%'
      },
      versionPinnedPackages: {
        type: 'array',
        default: [],

        items: {
          type: 'string'
        },

        description:
          '%pulsar.config.versionPinnedPackages.description%'
      },
      customFileTypes: {
        type: 'object',
        default: {},
        description:
          '%pulsar.config.customFileTypes.description%',
        additionalProperties: {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      },
      uriHandlerRegistration: {
        type: 'string',
        default: 'prompt',
        description:
          '%pulsar.config.uriHandlerRegistration.description%',
        enum: [
          {
            value: 'prompt',
            description:
              '%pulsar.config.uriHandlerRegistration.prompt.description%'
          },
          {
            value: 'always',
            description:
              '%pulsar.config.uriHandlerRegistration.always.description%'
          },
          {
            value: 'never',
            description: '%pulsar.config.uriHandlerRegistration.never.description%'
          }
        ]
      },
      themes: {
        type: 'array',
        default: ['one-dark-ui', 'one-dark-syntax'],
        items: {
          type: 'string'
        },
        description:
          '%pulsar.config.themes.description%'
      },
      audioBeep: {
        type: 'boolean',
        default: true,
        description: '%pulsar.config.audioBeep.description%'
      },
      closeDeletedFileTabs: {
        type: 'boolean',
        default: false,
        title: '%pulsar.config.closeDeletedFileTabs.title%',
        description:
          '%pulsar.config.closeDeletedFileTabs.description%'
      },
      destroyEmptyPanes: {
        type: 'boolean',
        default: true,
        title: '%pulsar.config.destroyEmptyPanes.title%',
        description:
          '%pulsar.config.destroyEmptyPanes.description%'
      },
      closeEmptyWindows: {
        type: 'boolean',
        default: true,
        description: '%pulsar.config.closeEmptyWindows.description%'
      },
      fileEncoding: {
        description:
          '%pulsar.config.fileEncoding.description%',
        type: 'string',
        default: 'utf8',
        enum: [
          {
            value: 'iso88596',
            description: 'Arabic (ISO 8859-6)'
          },
          {
            value: 'windows1256',
            description: 'Arabic (Windows 1256)'
          },
          {
            value: 'iso88594',
            description: 'Baltic (ISO 8859-4)'
          },
          {
            value: 'windows1257',
            description: 'Baltic (Windows 1257)'
          },
          {
            value: 'iso885914',
            description: 'Celtic (ISO 8859-14)'
          },
          {
            value: 'iso88592',
            description: 'Central European (ISO 8859-2)'
          },
          {
            value: 'windows1250',
            description: 'Central European (Windows 1250)'
          },
          {
            value: 'gb18030',
            description: 'Chinese (GB18030)'
          },
          {
            value: 'gbk',
            description: 'Chinese (GBK)'
          },
          {
            value: 'cp950',
            description: 'Traditional Chinese (Big5)'
          },
          {
            value: 'big5hkscs',
            description: 'Traditional Chinese (Big5-HKSCS)'
          },
          {
            value: 'cp866',
            description: 'Cyrillic (CP 866)'
          },
          {
            value: 'iso88595',
            description: 'Cyrillic (ISO 8859-5)'
          },
          {
            value: 'koi8r',
            description: 'Cyrillic (KOI8-R)'
          },
          {
            value: 'koi8u',
            description: 'Cyrillic (KOI8-U)'
          },
          {
            value: 'windows1251',
            description: 'Cyrillic (Windows 1251)'
          },
          {
            value: 'cp437',
            description: 'DOS (CP 437)'
          },
          {
            value: 'cp850',
            description: 'DOS (CP 850)'
          },
          {
            value: 'iso885913',
            description: 'Estonian (ISO 8859-13)'
          },
          {
            value: 'iso88597',
            description: 'Greek (ISO 8859-7)'
          },
          {
            value: 'windows1253',
            description: 'Greek (Windows 1253)'
          },
          {
            value: 'iso88598',
            description: 'Hebrew (ISO 8859-8)'
          },
          {
            value: 'windows1255',
            description: 'Hebrew (Windows 1255)'
          },
          {
            value: 'cp932',
            description: 'Japanese (CP 932)'
          },
          {
            value: 'eucjp',
            description: 'Japanese (EUC-JP)'
          },
          {
            value: 'shiftjis',
            description: 'Japanese (Shift JIS)'
          },
          {
            value: 'euckr',
            description: 'Korean (EUC-KR)'
          },
          {
            value: 'iso885910',
            description: 'Nordic (ISO 8859-10)'
          },
          {
            value: 'iso885916',
            description: 'Romanian (ISO 8859-16)'
          },
          {
            value: 'iso88599',
            description: 'Turkish (ISO 8859-9)'
          },
          {
            value: 'windows1254',
            description: 'Turkish (Windows 1254)'
          },
          {
            value: 'utf8',
            description: 'Unicode (UTF-8)'
          },
          {
            value: 'utf16le',
            description: 'Unicode (UTF-16 LE)'
          },
          {
            value: 'utf16be',
            description: 'Unicode (UTF-16 BE)'
          },
          {
            value: 'windows1258',
            description: 'Vietnamese (Windows 1258)'
          },
          {
            value: 'iso88591',
            description: 'Western (ISO 8859-1)'
          },
          {
            value: 'iso88593',
            description: 'Western (ISO 8859-3)'
          },
          {
            value: 'iso885915',
            description: 'Western (ISO 8859-15)'
          },
          {
            value: 'macroman',
            description: 'Western (Mac Roman)'
          },
          {
            value: 'windows1252',
            description: 'Western (Windows 1252)'
          }
        ]
      },
      openEmptyEditorOnStart: {
        description:
          '%pulsar.config.openEmptyEditorOnStart.description%',
        type: 'boolean',
        default: true
      },
      restorePreviousWindowsOnStart: {
        type: 'string',
        enum: ['no', 'yes', 'always'],
        default: 'yes',
        description:
          "%pulsar.config.restorePreviousWindowsOnStart.description%"
      },
      reopenProjectMenuCount: {
        description:
          '%pulsar.config.reopenProjectMenuCount.description%',
        type: 'integer',
        default: 15
      },
      automaticallyUpdate: {
        description:
          '%pulsar.config.automaticallyUpdate.description%',
        type: 'boolean',
        default: false
      },
      useProxySettingsWhenCallingApm: {
        title: 'Use Proxy Settings When Calling PPM',
        description:
          '%pulsar.config.useProxySettingsWhenCallingApm.description%',
        type: 'boolean',
        default: true
      },
      allowPendingPaneItems: {
        description:
          '%pulsar.config.allowPendingPaneItems.description%',
        type: 'boolean',
        default: true
      },
      warnOnLargeFileLimit: {
        description:
          '%pulsar.config.warnOnLargeFileLimit.description%',
        type: 'number',
        default: 40
      },
      fileSystemWatcher: {
        description:
          '%pulsar.config.fileSystemWatcher.description%',
        type: 'string',
        default: 'native',
        enum: [
          {
            value: 'native',
            description: '%pulsar.config.fileSystemWatcher.native.description%'
          }
        ]
      },
      useTreeSitterParsers: {
        type: 'boolean',
        default: true,
        title: '%pulsar.config.useTreeSitterParsers.title%',
        description: '%pulsar.config.useTreeSitterParsers.description%'
      },
      useLegacyTreeSitter: {
        type: 'boolean',
        default: false,
        title: '%pulsar.config.useLegacyTreeSitter.title%',
        description: '%pulsar.config.useLegacyTreeSitter.description%'
      },
      useLegacySessionStore: {
        type: 'boolean',
        default: true,
        title: '%pulsar.config.useLegacySessionStore.title%',
        description: '%pulsar.config.useLegacySessionStore.description%.'
      },
      colorProfile: {
        description:
          "Specify whether Pulsar should use the operating system's color profile (recommended) or an alternative color profile.<br>Changing this setting will require a relaunch of Pulsar to take effect.",
        type: 'string',
        default: 'default',
        enum: [
          {
            value: 'default',
            description: 'Use color profile configured in the operating system'
          },
          {
            value: 'srgb',
            description: 'Use sRGB color profile'
          }
        ]
      },
      transformDeprecatedStyleSheetSelectors: {
        description: 'Whether Pulsar should transform deprecated DOM Selectors in community package style sheets. Increases compatibility, as well as startup time.',
        type: 'boolean',
        default: true
      },
      transformDeprecatedStyleSheetMathExpressions: {
        description: 'Whether Pulsar should transform deprecated Mathematical Expressions in community package style sheets. Increases compatibility, as well as startup time.',
        type: 'boolean',
        default: true
      },
      addCurrentTabToWindowTitle: {
        description: 'Add the current tab title to the Pulsar Window title.',
        type: 'boolean',
        default: true
      },
      syncWindowThemeWithPulsarTheme: {
        description: 'When changing the theme within Pulsar also change the theme of the window on the operating system.',
        type: 'boolean',
        default: false
      },
      language: {
        type: "object",
        description: "EXPERIMENTAL: (Minimal effect until stable) Language and locale options. Requires a restart of Pulsar to take effect.",
        properties: {
          primary: {
            type: "string",
            order: 1,
            default: "en-US",
            description: "The primary language/locale you prefer."
          },
          priorityList: {
            type: "array",
            order: 2,
            description: "List of alternative languages to load. Highest priority to lowest. Use the most specific locale selectors possible.",
            default: [],
            items: {
              type: "string",
              // TODO consider enum options, maybe?
            }
          }
        }
      }
    }
  },
  editor: {
    type: 'object',
    // These settings are used in scoped fashion only. No defaults.
    properties: {
      commentStart: {
        type: ['string', 'null']
      },
      commentEnd: {
        type: ['string', 'null']
      },
      increaseIndentPattern: {
        type: ['string', 'null']
      },
      decreaseIndentPattern: {
        type: ['string', 'null']
      },
      foldEndPattern: {
        type: ['string', 'null']
      },
      // These can be used as globals or scoped, thus defaults.
      fontFamily: {
        type: 'string',
        default: 'Menlo, Consolas, DejaVu Sans Mono, monospace',
        description: 'The name of the font family used for editor text.'
      },
      fontSize: {
        type: 'integer',
        default: 14,
        minimum: 1,
        maximum: 100,
        description: 'Height in pixels of editor text.'
      },
      defaultFontSize: {
        type: 'integer',
        default: 14,
        minimum: 1,
        maximum: 100,
        description:
          'Default height in pixels of the editor text. Useful when resetting font size'
      },
      lineHeight: {
        type: ['string', 'number'],
        default: 1.5,
        description: 'Height of editor lines, as a multiplier of font size.'
      },
      showCursorOnSelection: {
        type: 'boolean',
        default: true,
        description: 'Show cursor while there is a selection.'
      },
      showInvisibles: {
        type: 'boolean',
        default: false,
        description:
          'Render placeholders for invisible characters, such as tabs, spaces and newlines.'
      },
      showIndentGuide: {
        type: 'boolean',
        default: false,
        description: 'Show indentation indicators in the editor.'
      },
      showLineNumbers: {
        type: 'boolean',
        default: true,
        description: "Show line numbers in the editor's gutter."
      },
      atomicSoftTabs: {
        type: 'boolean',
        default: true,
        description:
          'Skip over tab-length runs of leading whitespace when moving the cursor.'
      },
      autoIndent: {
        type: 'boolean',
        default: true,
        description: 'Automatically indent the cursor when inserting a newline.'
      },
      autoIndentOnPaste: {
        type: 'boolean',
        default: true,
        description:
          'Automatically indent pasted text based on the indentation of the previous line.'
      },
      nonWordCharacters: {
        type: 'string',
        default: '/\\()"\':,.;<>~!@#$%^&*|+=[]{}`?-…',
        description:
          'A string of non-word characters to define word boundaries.'
      },
      preferredLineLength: {
        type: 'integer',
        default: 80,
        minimum: 1,
        description:
          'Identifies the length of a line which is used when wrapping text with the `Soft Wrap At Preferred Line Length` setting enabled, in number of characters.'
      },
      maxScreenLineLength: {
        type: 'integer',
        default: 500,
        minimum: 500,
        description:
          'Defines the maximum width of the editor window before soft wrapping is enforced, in number of characters.'
      },
      tabLength: {
        type: 'integer',
        default: 2,
        minimum: 1,
        description: 'Number of spaces used to represent a tab.'
      },
      softWrap: {
        type: 'boolean',
        default: false,
        description:
          'Wraps lines that exceed the width of the window. When `Soft Wrap At Preferred Line Length` is set, it will wrap to the number of characters defined by the `Preferred Line Length` setting.'
      },
      softTabs: {
        type: 'boolean',
        default: true,
        description:
          'If the `Tab Type` config setting is set to "auto" and autodetection of tab type from buffer content fails, then this config setting determines whether a soft tab or a hard tab will be inserted when the Tab key is pressed.'
      },
      tabType: {
        type: 'string',
        default: 'auto',
        enum: ['auto', 'soft', 'hard'],
        description:
          'Determine character inserted when Tab key is pressed. Possible values: "auto", "soft" and "hard". When set to "soft" or "hard", soft tabs (spaces) or hard tabs (tab characters) are used. When set to "auto", the editor auto-detects the tab type based on the contents of the buffer (it uses the first leading whitespace on a non-comment line), or uses the value of the Soft Tabs config setting if auto-detection fails.'
      },
      softWrapAtPreferredLineLength: {
        type: 'boolean',
        default: false,
        description:
          "Instead of wrapping lines to the window's width, wrap lines to the number of characters defined by the `Preferred Line Length` setting. This will only take effect when the soft wrap config setting is enabled globally or for the current language. **Note:** If you want to hide the wrap guide (the vertical line) you can disable the `wrap-guide` package."
      },
      softWrapHangingIndent: {
        type: 'integer',
        default: 0,
        minimum: 0,
        description:
          'When soft wrap is enabled, defines length of additional indentation applied to wrapped lines, in number of characters.'
      },
      scrollSensitivity: {
        type: 'integer',
        default: 40,
        minimum: 10,
        maximum: 200,
        description:
          'Determines how fast the editor scrolls when using a mouse or trackpad.'
      },
      scrollPastEnd: {
        type: 'boolean',
        default: false,
        description:
          'Allow the editor to be scrolled past the end of the last line.'
      },
      undoGroupingInterval: {
        type: 'integer',
        default: 300,
        minimum: 0,
        description:
          'Time interval in milliseconds within which text editing operations will be grouped together in the undo history.'
      },
      confirmCheckoutHeadRevision: {
        type: 'boolean',
        default: true,
        title: 'Confirm Checkout HEAD Revision',
        description:
          'Show confirmation dialog when checking out the HEAD revision and discarding changes to current file since last commit.'
      },
      invisibles: {
        type: 'object',
        description:
          'A hash of characters Pulsar will use to render whitespace characters. Keys are whitespace character types, values are rendered characters (use value false to turn off individual whitespace character types).',
        properties: {
          eol: {
            type: ['boolean', 'string'],
            default: '¬',
            maximumLength: 1,
            description:
              'Character used to render newline characters (\\n) when the `Show Invisibles` setting is enabled. '
          },
          space: {
            type: ['boolean', 'string'],
            default: '·',
            maximumLength: 1,
            description:
              'Character used to render leading and trailing space characters when the `Show Invisibles` setting is enabled.'
          },
          tab: {
            type: ['boolean', 'string'],
            default: '»',
            maximumLength: 1,
            description:
              'Character used to render hard tab characters (\\t) when the `Show Invisibles` setting is enabled.'
          },
          cr: {
            type: ['boolean', 'string'],
            default: '¤',
            maximumLength: 1,
            description:
              'Character used to render carriage return characters (for Microsoft-style line endings) when the `Show Invisibles` setting is enabled.'
          }
        }
      },
      zoomFontWhenCtrlScrolling: {
        type: 'boolean',
        default: process.platform !== 'darwin',
        description:
          'Change the editor font size when pressing the Ctrl key and scrolling the mouse up/down.'
      },
      multiCursorOnClick: {
        type: 'boolean',
        default: true,
        description:
          'Add multiple cursors when pressing the Ctrl key (Command key on macOS) and clicking the editor.'
      }
    }
  }
};

if (['win32', 'linux'].includes(process.platform)) {
  configSchema.core.properties.autoHideMenuBar = {
    type: 'boolean',
    default: false,
    description:
      'Automatically hide the menu bar and toggle it by pressing Alt. This is only supported on Windows & Linux.'
  };
}

if (process.platform === 'darwin') {
  configSchema.core.properties.titleBar = {
    type: 'string',
    default: 'native',
    enum: ['native', 'custom', 'custom-inset', 'hidden'],
    description:
      'Experimental: A `custom` title bar adapts to theme colors. Choosing `custom-inset` adds a bit more padding. The title bar can also be completely `hidden`.<br>Note: Switching to a custom or hidden title bar will compromise some functionality.<br>This setting will require a relaunch of Pulsar to take effect.'
  };
  configSchema.core.properties.simpleFullScreenWindows = {
    type: 'boolean',
    default: false,
    description:
      'Use pre-Lion fullscreen on macOS. This does not create a new desktop space for Pulsar on fullscreen mode.'
  };
}

if (process.platform === 'linux') {
  configSchema.editor.properties.selectionClipboard = {
    type: 'boolean',
    default: true,
    description: 'Enable pasting on middle mouse button click'
  };
}

module.exports = configSchema;
