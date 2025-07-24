const { CompositeDisposable } = require('atom');

let SpellCheckView = null;
let spellCheckViews = {};

const LARGE_FILE_SIZE = 2 * 1024 * 1024;

let debug;
let log = (_str) => {};

module.exports = {
  activate() {
    if (atom.config.get('spell-check.enableDebug')) {
      debug ??= require('debug');
      log = debug('spell-check');
    }

    log('initializing');

    this.subs = new CompositeDisposable();

    // Since the spell-checking is done on another process, we gather up all the
    // arguments and pass them into the task. Whenever these change, we'll update
    // the object with the parameters and resend it to the task.
    this.globalArgs = {
      // These are the settings that are part of the main `spell-check` package.
      locales: atom.config.get('spell-check.locales'),
      localePaths: atom.config.get('spell-check.localePaths'),
      useSystem: atom.config.get('spell-check.useSystem'),
      useLocales: atom.config.get('spell-check.useLocales'),
      knownWords: atom.config.get('spell-check.knownWords'),
      addKnownWords: atom.config.get('spell-check.addKnownWords'),

      // Collection of all the absolute paths to checkers which will be
      // `require`d on the process side to load the checker. We have to do this
      // because we can't pass the actual objects from the main Pulsar process
      // to the background safely.
      checkerPaths: [],
    };

    const manager = this.getInstance(this.globalArgs);

    // Hook up changes to the configuration settings.
    this.excludedScopeRegexLists = [];
    this.subs.add(
      atom.config.onDidChange('spell-check.excludedScopes', () => {
        return this.updateViews();
      })
    );

    this.subs.add(
      atom.config.onDidChange('spell-check.locales', ({ newValue }) => {
        this.globalArgs.locales = newValue;
        manager.setGlobalArgs(this.globalArgs);
      }),
      atom.config.onDidChange('spell-check.localePaths', ({ newValue }) => {
        this.globalArgs.localePaths = newValue;
        manager.setGlobalArgs(this.globalArgs);
      }),
      atom.config.onDidChange('spell-check.useSystem', ({ newValue }) => {
        this.globalArgs.useSystem = newValue;
        manager.setGlobalArgs(this.globalArgs);
      }),
      atom.config.onDidChange('spell-check.useLocales', ({ newValue }) => {
        this.globalArgs.useLocales = newValue;
        manager.setGlobalArgs(this.globalArgs);
      }),
      atom.config.onDidChange('spell-check.knownWords', ({ newValue }) => {
        this.globalArgs.knownWords = newValue;
        manager.setGlobalArgs(this.globalArgs);
      }),
      atom.config.onDidChange('spell-check.addKnownWords', ({ newValue }) => {
        this.globalArgs.addKnownWords = newValue;
        manager.setGlobalArgs(this.globalArgs);
      }),
      // Hook up the UI and processing.
      atom.commands.add('atom-workspace', {
        'spell-check:toggle': () => this.toggle(),
      })
    );

    this.viewsByEditor = new WeakMap();
    this.contextMenuEntries = [];

    this.subs.add(
      atom.workspace.observeTextEditors((editor) => {
        if (this.viewsByEditor.has(editor)) {
          return;
        }

        // For now, just don't spell check large files.
        if (editor.getBuffer().getLength() > LARGE_FILE_SIZE) {
          return;
        }

        // Defer loading the spell check view until we actually need it. This
        // also avoids slowing down Pulsar's startup by getting it loaded on
        // demand.
        SpellCheckView ??= require('./spell-check-view');

        // The SpellCheckView needs _both_ a handle for the task to handle the
        // background checking _and_ a cached view of the in-process manager
        // for getting corrections. We used a function to a function because
        // scope wasn't working properly.
        //
        // Each view also needs the list of added context menu entries so that
        // they can dispose old corrections which were not created by the
        // current active editor. A reference to this entire module is passed
        // right now because a direct reference to `contextMenuEntries` wasn't
        // updating properly between different `SpellCheckView`s.
        const spellCheckView = new SpellCheckView(editor, this, manager);

        // Save the editor into a map.
        const editorId = editor.id;
        spellCheckViews[editorId] = {
          view: spellCheckView,
          active: true,
          editor,
        };

        // Make sure that the view is cleaned up on editor destruction.
        let destroySub = editor.onDidDestroy(() => {
          spellCheckView.destroy();
          delete spellCheckViews[editorId];
          this.subs.remove(destroySub);
        });
        this.subs.add(destroySub);

        this.viewsByEditor.set(editor, spellCheckView);
      })
    );
  },

  deactivate() {
    this.instance?.deactivate();
    this.instance &&= null;

    // Clear out the known views.
    for (let editorId in spellCheckViews) {
      const { view } = spellCheckViews[editorId];
      view.destroy();
    }
    spellCheckViews = {};

    this.viewsByEditor = new WeakMap();

    // Finish up by disposing everything else associated with the plugin.
    return this.subs.dispose();
  },

  // Registers any Pulsar packages that provide our service.
  consumeSpellCheckers(checkerPaths) {
    // Normalize it so we always have an array.
    if (!Array.isArray(checkerPaths)) {
      checkerPaths = [checkerPaths];
    }

    for (let checkerPath of checkerPaths) {
      if (!this.globalArgs.checkerPaths.includes(checkerPath)) {
        this.instance?.addCheckerPath(checkerPath);
        this.globalArgs.checkerPaths.push(checkerPath);
      }
    }
  },

  misspellingMarkersForEditor(editor) {
    return this.viewsByEditor.get(editor).markerLayer.getMarkers();
  },

  updateViews() {
    let bundles = Object.values(spellCheckViews);
    for (let bundle of bundles) {
      if (bundle.active) {
        bundle.view.updateMisspellings();
      }
    }
    return bundles;
  },

  // Retrieves, creating if required, the single SpellingManager instance.
  getInstance(globalArgs) {
    if (!this.instance) {
      this.instance = require('./spell-check-manager');
      this.instance.setGlobalArgs(globalArgs);

      for (let checkerPath of globalArgs.checkerPaths) {
        this.instance.addCheckerPath(checkerPath);
      }
    }

    return this.instance;
  },

  // Internal: Toggles the spell-check activation state.
  toggle() {
    let activeEditor = atom.workspace.getActiveTextEditor();
    if (!activeEditor) return;
    const editorId = activeEditor.id;

    // eslint-disable-next-line no-prototype-builtins
    if (!spellCheckViews.hasOwnProperty(editorId)) {
      // The editor was never registered with a view, so ignore it.
      return;
    }

    let bundle = spellCheckViews[editorId];

    if (bundle.active) {
      // Deactivate spell check for this editor.
      bundle.active = false;
      bundle.view.unsubscribeFromBuffer();
    } else {
      // Activate spell check for this editor.
      bundle.active = true;
      bundle.view.subscribeToBuffer();
    }
  },
};
