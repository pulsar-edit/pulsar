let SpellCheckView;
const _ = require('underscore-plus');
const { CompositeDisposable } = require('atom');
const SpellCheckTask = require('./spell-check-task');
const { scopeDescriptorMatchesSelector } = require('./scope-helper');

// Tests whether a grammar's root scope matches a scope specified in the
// `grammars` setting. Allows for a more generic name in the setting (e.g.,
// `source` to match all `source.[x]` grammars).
function topLevelScopeMatches(grammar, scope) {
    if (scope === grammar) return true;
    if (grammar.startsWith(`${scope}.`)) {
        return true;
    }
    return false;
}

let CorrectionsView = null;

module.exports = SpellCheckView = class SpellCheckView {
    constructor(editor, spellCheckModule, manager) {
        this.addContextMenuEntries = this.addContextMenuEntries.bind(this);
        this.makeCorrection = this.makeCorrection.bind(this);
        this.editor = editor;
        this.spellCheckModule = spellCheckModule;
        this.manager = manager;
        this.disposables = new CompositeDisposable();
        this.initializeMarkerLayer();

        this.taskWrapper = new SpellCheckTask(this.manager);

        this.correctMisspellingCommand = atom.commands.add(
            atom.views.getView(this.editor),
            'spell-check:correct-misspelling',
            () => {
                let marker;
                if (
                    (marker = this.markerLayer.findMarkers({
                        containsBufferPosition: this.editor.getCursorBufferPosition(),
                    })[0])
                ) {
                    if (CorrectionsView == null) {
                        CorrectionsView = require('./corrections-view');
                    }
                    if (this.correctionsView != null) {
                        this.correctionsView.destroy();
                    }
                    this.correctionsView = new CorrectionsView(
                        this.editor,
                        this.getCorrections(marker),
                        marker,
                        this,
                        this.updateMisspellings
                    );
                    return this.correctionsView.attach();
                }
            }
        );

        atom.views
            .getView(this.editor)
            .addEventListener('contextmenu', this.addContextMenuEntries);

        this.disposables.add(
            this.editor.onDidChangePath(() => {
                return this.subscribeToBuffer();
            })
        );

        this.disposables.add(
            this.editor.onDidChangeGrammar(() => {
                return this.subscribeToBuffer();
            })
        );

        this.disposables.add(
            atom.config.onDidChange('editor.fontSize', () => {
                return this.subscribeToBuffer();
            })
        );

        this.disposables.add(
            atom.config.onDidChange('spell-check.grammars', () => {
                return this.subscribeToBuffer();
            })
        );

        this.disposables.add(
            atom.config.observe(
                'spell-check.excludedScopes',
                (excludedScopes) => {
                    this.excludedScopes = excludedScopes;
                }
            )
        );

        this.subscribeToBuffer();

        this.disposables.add(this.editor.onDidDestroy(this.destroy.bind(this)));
    }

    initializeMarkerLayer() {
        this.markerLayer = this.editor.addMarkerLayer({
            maintainHistory: false,
        });
        return (this.markerLayerDecoration = this.editor.decorateMarkerLayer(
            this.markerLayer,
            {
                type: 'highlight',
                class: 'spell-check-misspelling',
                deprecatedRegionClass: 'misspelling',
            }
        ));
    }

    destroy() {
        this.unsubscribeFromBuffer();
        this.disposables.dispose();
        this.taskWrapper.terminate();
        this.markerLayer.destroy();
        this.markerLayerDecoration.destroy();
        this.correctMisspellingCommand.dispose();
        if (this.correctionsView != null) {
            this.correctionsView.destroy();
        }
        return this.clearContextMenuEntries();
    }

    unsubscribeFromBuffer() {
        this.destroyMarkers();

        if (this.buffer != null) {
            this.bufferDisposable.dispose();
            return (this.buffer = null);
        }
    }

    subscribeToBuffer() {
        this.unsubscribeFromBuffer();

        if (this.spellCheckCurrentGrammar()) {
            this.scopesToSpellCheck = this.getSpellCheckScopesForCurrentGrammar();
            this.buffer = this.editor.getBuffer();
            this.bufferDisposable = new CompositeDisposable(
                this.buffer.onDidStopChanging(
                    () => this.updateMisspellings(),
                    this.editor.onDidTokenize(() => this.updateMisspellings())
                )
            );
            return this.updateMisspellings();
        }
    }

    spellCheckCurrentGrammar() {
        const grammar = this.editor.getGrammar().scopeName;
        let grammars = atom.config.get('spell-check.grammars');
        let topLevelScopes = grammars.map((rawScope) => {
            if (!rawScope.includes(' ')) return rawScope;
            return rawScope.substring(0, rawScope.indexOf(' '));
        });
        return topLevelScopes.some((scope) => {
            return topLevelScopeMatches(grammar, scope);
        });
        // return topLevelScopes.includes(grammar);
    }

    // Returns:
    //
    // * `true` if the entire buffer should be checked;
    // * `false` if none of the buffer should be checked; or, if only certain
    //   parts of the buffer should be checked,
    // * an {Array} of scope names matching regions of the buffer that should
    //   be checked.
    getSpellCheckScopesForCurrentGrammar() {
        const grammar = this.editor.getGrammar().scopeName;
        let grammars = atom.config.get('spell-check.grammars');
        let scopeList = [];
        // Despite the name of this setting, spell-checking is no longer all or
        // nothing on a per-grammar basis; we now allow users to opt into
        // checking subsections of a buffer by adding descendant scopes. Each
        // segment must begin with all or part of a root scope name (e.g.,
        // `source.js`, `text.html`, but otherwise any valid scope selector is
        // accepted here.)
        //
        // Examples:
        //
        // * `source.js comment.block`
        // * `source comment, source string.quoted`
        // * `text`
        //
        // The first example targets just JS block comments; the second targets
        // all comments and quoted strings in _all_ source files; and the third
        // targets any text format, whether HTML or Markdown or plaintext.
        //
        // This allows for more granular spell-checking than was possible
        // before, even if the `excludeScopes` setting was utilized.
        for (let rawScope of grammars) {
            if (!rawScope.includes(' ')) {
                // Any value that's just the bare root scope of the language
                // (like `source.python`) means that we're spell-checking the
                // entire buffer. This applies even if there's a later match
                // for this grammar that's more restrictive.
                if (topLevelScopeMatches(grammar, rawScope)) {
                    return true;
                }
            } else {
                // If the value also includes a descendant scope, it means we're
                // spell-checking some subset of the buffer.
                let index = rawScope.indexOf(' ');
                let rootScope = rawScope.substring(0, index);
                if (topLevelScopeMatches(grammar, rootScope)) {
                    // There could be multiple of these — e.g., `source.python string,
                    // source.python comment` — so we won't return early.
                    scopeList.push(rawScope);
                }
            }
        }
        return scopeList.length > 0 ? scopeList : false;
    }

    destroyMarkers() {
        this.markerLayer.destroy();
        this.markerLayerDecoration.destroy();
        return this.initializeMarkerLayer();
    }

    addMarkers(misspellings) {
        return (() => {
            const result = [];
            for (let misspelling of misspellings) {
                const scope = this.editor.scopeDescriptorForBufferPosition(
                    misspelling[0]
                );
                // Under the hood, we spell-check the entire document; but we
                // might end up ignoring some of the misspellings based on
                // their scope descriptor.
                if (!this.scopeIsExcluded(scope)) {
                    result.push(
                        this.markerLayer.markBufferRange(misspelling, {
                            invalidate: 'touch',
                        })
                    );
                } else {
                    result.push(undefined);
                }
            }
            return result;
        })();
    }

    updateMisspellings() {
        return this.taskWrapper.start(this.editor, (misspellings) => {
            this.destroyMarkers();
            if (this.buffer != null) {
                return this.addMarkers(misspellings);
            }
        });
    }

    getCorrections(marker) {
        // Build up the arguments object for this buffer and text.
        let projectPath = null;
        let relativePath = null;

        if (this.buffer != null && this.buffer.file && this.buffer.file.path) {
            [projectPath, relativePath] = atom.project.relativizePath(
                this.buffer.file.path
            );
        }

        const args = {
            projectPath,
            relativePath,
        };

        // Get the misspelled word and then request corrections.
        const misspelling = this.editor.getTextInBufferRange(
            marker.getBufferRange()
        );
        return this.manager.suggest(args, misspelling);
    }

    addContextMenuEntries(mouseEvent) {
        let marker;
        this.clearContextMenuEntries();
        // Get buffer position of the right click event. If the click happens outside
        // the boundaries of any text, the method defaults to the buffer position of
        // the last character in the editor.
        const currentScreenPosition = atom.views
            .getView(this.editor)
            .component.screenPositionForMouseEvent(mouseEvent);
        const currentBufferPosition = this.editor.bufferPositionForScreenPosition(
            currentScreenPosition
        );

        // Check to see if the selected word is incorrect.
        if (
            (marker = this.markerLayer.findMarkers({
                containsBufferPosition: currentBufferPosition,
            })[0])
        ) {
            const corrections = this.getCorrections(marker);
            if (corrections.length > 0) {
                this.spellCheckModule.contextMenuEntries.push({
                    menuItem: atom.contextMenu.add({
                        'atom-text-editor': [{ type: 'separator' }],
                    }),
                });

                let correctionIndex = 0;
                for (let correction of corrections) {
                    const contextMenuEntry = {};
                    // Register new command for correction.
                    var commandName =
                        'spell-check:correct-misspelling-' + correctionIndex;
                    contextMenuEntry.command = ((
                        correction,
                        contextMenuEntry
                    ) => {
                        return atom.commands.add(
                            atom.views.getView(this.editor),
                            commandName,
                            () => {
                                this.makeCorrection(correction, marker);
                                return this.clearContextMenuEntries();
                            }
                        );
                    })(correction, contextMenuEntry);

                    // Add new menu item for correction.
                    contextMenuEntry.menuItem = atom.contextMenu.add({
                        'atom-text-editor': [
                            { label: correction.label, command: commandName },
                        ],
                    });
                    this.spellCheckModule.contextMenuEntries.push(
                        contextMenuEntry
                    );
                    correctionIndex++;
                }

                return this.spellCheckModule.contextMenuEntries.push({
                    menuItem: atom.contextMenu.add({
                        'atom-text-editor': [{ type: 'separator' }],
                    }),
                });
            }
        }
    }

    makeCorrection(correction, marker) {
        if (correction.isSuggestion) {
            // Update the buffer with the correction.
            this.editor.setSelectedBufferRange(marker.getBufferRange());
            return this.editor.insertText(correction.suggestion);
        } else {
            // Build up the arguments object for this buffer and text.
            let projectPath = null;
            let relativePath = null;

            if (
                this.editor.buffer != null &&
                this.editor.buffer.file &&
                this.editor.buffer.file.path
            ) {
                [projectPath, relativePath] = atom.project.relativizePath(
                    this.editor.buffer.file.path
                );
            }

            const args = {
                id: this.id,
                projectPath,
                relativePath,
            };

            // Send the "add" request to the plugin.
            correction.plugin.add(args, correction);

            // Update the buffer to handle the corrections.
            return this.updateMisspellings.bind(this)();
        }
    }

    clearContextMenuEntries() {
        for (let entry of this.spellCheckModule.contextMenuEntries) {
            if (entry.command != null) {
                entry.command.dispose();
            }
            if (entry.menuItem != null) {
                entry.menuItem.dispose();
            }
        }

        return (this.spellCheckModule.contextMenuEntries = []);
    }

    scopeIsExcluded(scopeDescriptor) {
        // Practically speaking, `this.scopesToSpellCheck` will either be `true`
        // or an array of scope selectors. If it's the latter, then we should
        // apply whitelisting and exclude anything that doesn't match.
        if (Array.isArray(this.scopesToSpellCheck)) {
            // If we know none of the subscopes match this region, we can
            // exclude it even before we get to the `excludedScopes` setting.
            let someMatch = this.scopesToSpellCheck.some(
                (scopeToSpellCheck) => {
                    return scopeDescriptorMatchesSelector(
                        scopeDescriptor,
                        scopeToSpellCheck
                    );
                }
            );
            if (!someMatch) return true;
        }
        // Whether or not we applied whitelisting above, excluded scopes take
        // precedence; anything that doesn't make it through this gauntlet
        // gets excluded.
        return this.excludedScopes.some((excludedScope) => {
            return scopeDescriptorMatchesSelector(
                scopeDescriptor,
                excludedScope
            );
        });
    }
};
