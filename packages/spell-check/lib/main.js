const { CompositeDisposable } = require('atom');

let SpellCheckView = null;
let spellCheckViews = {};

const LARGE_FILE_SIZE = 2 * 1024 * 1024;

let log = (str) => {};

module.exports = {
    activate() {
        if (atom.config.get('spell-check.enableDebug')) {
            debug = require('debug');
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
            // `require` on the process side to load the checker. We have to do this
            // because we can't pass the actual objects from the main Atom process to
            // the background safely.
            checkerPaths: [],
        };

        const manager = this.getInstance(this.globalArgs);

        // Hook up changes to the configuration settings.
        this.excludedScopeRegexLists = [];
        this.subs.add(
            atom.config.observe(
                'spell-check.excludedScopes',
                (excludedScopes) => {
                    this.excludedScopeRegexLists = excludedScopes.map(
                        (excludedScope) =>
                            excludedScope
                                .split(/\s+/)[0]
                                .split('.')
                                .filter((className) => className)
                                .map(
                                    (className) =>
                                        new RegExp(`\\b${className}\\b`)
                                )
                    );
                    return this.updateViews();
                }
            )
        );

        this.subs.add(
            atom.config.onDidChange(
                'spell-check.locales',
                ({ newValue, oldValue }) => {
                    this.globalArgs.locales = newValue;
                    return manager.setGlobalArgs(this.globalArgs);
                }
            )
        );
        this.subs.add(
            atom.config.onDidChange(
                'spell-check.localePaths',
                ({ newValue, oldValue }) => {
                    this.globalArgs.localePaths = newValue;
                    return manager.setGlobalArgs(this.globalArgs);
                }
            )
        );
        this.subs.add(
            atom.config.onDidChange(
                'spell-check.useSystem',
                ({ newValue, oldValue }) => {
                    this.globalArgs.useSystem = newValue;
                    return manager.setGlobalArgs(this.globalArgs);
                }
            )
        );
        this.subs.add(
            atom.config.onDidChange(
                'spell-check.useLocales',
                ({ newValue, oldValue }) => {
                    this.globalArgs.useLocales = newValue;
                    return manager.setGlobalArgs(this.globalArgs);
                }
            )
        );
        this.subs.add(
            atom.config.onDidChange(
                'spell-check.knownWords',
                ({ newValue, oldValue }) => {
                    this.globalArgs.knownWords = newValue;
                    return manager.setGlobalArgs(this.globalArgs);
                }
            )
        );
        this.subs.add(
            atom.config.onDidChange(
                'spell-check.addKnownWords',
                ({ newValue, oldValue }) => {
                    this.globalArgs.addKnownWords = newValue;
                    return manager.setGlobalArgs(this.globalArgs);
                }
            )
        );

        // Hook up the UI and processing.
        this.subs.add(
            atom.commands.add('atom-workspace', {
                'spell-check:toggle': () => this.toggle(),
            })
        );
        this.viewsByEditor = new WeakMap();
        this.contextMenuEntries = [];
        return this.subs.add(
            atom.workspace.observeTextEditors((editor) => {
                if (this.viewsByEditor.has(editor)) {
                    return;
                }

                // For now, just don't spell check large files.
                if (editor.getBuffer().getLength() > LARGE_FILE_SIZE) {
                    return;
                }

                // Defer loading the spell check view if we actually need it. This also
                // avoids slowing down Atom's startup by getting it loaded on demand.
                if (SpellCheckView == null) {
                    SpellCheckView = require('./spell-check-view');
                }

                // The SpellCheckView needs both a handle for the task to handle the
                // background checking and a cached view of the in-process manager for
                // getting corrections. We used a function to a function because scope
                // wasn't working properly.
                // Each view also needs the list of added context menu entries so that
                // they can dispose old corrections which were not created by the current
                // active editor. A reference to this entire module is passed right now
                // because a direct reference to @contextMenuEntries wasn't updating
                // properly between different SpellCheckView's.
                const spellCheckView = new SpellCheckView(
                    editor,
                    this,
                    manager
                );

                // save the {editor} into a map
                const editorId = editor.id;
                spellCheckViews[editorId] = {
                    view: spellCheckView,
                    active: true,
                    editor,
                };

                // Make sure that the view is cleaned up on editor destruction.
                var destroySub = editor.onDidDestroy(() => {
                    spellCheckView.destroy();
                    delete spellCheckViews[editorId];
                    return this.subs.remove(destroySub);
                });
                this.subs.add(destroySub);

                return this.viewsByEditor.set(editor, spellCheckView);
            })
        );
    },

    deactivate() {
        if (this.instance != null) {
            this.instance.deactivate();
        }
        this.instance = null;

        // Clear out the known views.
        for (let editorId in spellCheckViews) {
            const { view } = spellCheckViews[editorId];
            view.destroy();
        }
        spellCheckViews = {};

        // While we have WeakMap.clear, it isn't a function available in ES6. So, we
        // just replace the WeakMap entirely and let the system release the objects.
        this.viewsByEditor = new WeakMap();

        // Finish up by disposing everything else associated with the plugin.
        return this.subs.dispose();
    },

    // Registers any Atom packages that provide our service.
    consumeSpellCheckers(checkerPaths) {
        // Normalize it so we always have an array.
        if (!(checkerPaths instanceof Array)) {
            checkerPaths = [checkerPaths];
        }

        // Go through and add any new plugins to the list.
        return (() => {
            const result = [];
            for (let checkerPath of checkerPaths) {
                if (!this.globalArgs.checkerPaths.includes(checkerPath)) {
                    if (this.instance != null) {
                        this.instance.addCheckerPath(checkerPath);
                    }
                    result.push(this.globalArgs.checkerPaths.push(checkerPath));
                } else {
                    result.push(undefined);
                }
            }
            return result;
        })();
    },

    misspellingMarkersForEditor(editor) {
        return this.viewsByEditor.get(editor).markerLayer.getMarkers();
    },

    updateViews() {
        return (() => {
            const result = [];
            for (let editorId in spellCheckViews) {
                const view = spellCheckViews[editorId];
                if (view['active']) {
                    result.push(view['view'].updateMisspellings());
                } else {
                    result.push(undefined);
                }
            }
            return result;
        })();
    },

    // Retrieves, creating if required, the single SpellingManager instance.
    getInstance(globalArgs) {
        if (!this.instance) {
            const SpellCheckerManager = require('./spell-check-manager');
            this.instance = SpellCheckerManager;
            this.instance.setGlobalArgs(globalArgs);

            for (let checkerPath of globalArgs.checkerPaths) {
                this.instance.addCheckerPath(checkerPath);
            }
        }

        return this.instance;
    },

    // Internal: Toggles the spell-check activation state.
    toggle() {
        if (!atom.workspace.getActiveTextEditor()) {
            return;
        }
        const editorId = atom.workspace.getActiveTextEditor().id;

        if (!spellCheckViews.hasOwnProperty(editorId)) {
            // The editor was never registered with a view, ignore it
            return;
        }

        if (spellCheckViews[editorId]['active']) {
            // deactivate spell check for this {editor}
            spellCheckViews[editorId]['active'] = false;
            return spellCheckViews[editorId]['view'].unsubscribeFromBuffer();
        } else {
            // activate spell check for this {editor}
            spellCheckViews[editorId]['active'] = true;
            return spellCheckViews[editorId]['view'].subscribeToBuffer();
        }
    },
};
