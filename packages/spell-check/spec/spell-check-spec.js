const SpellCheckTask = require('../lib/spell-check-task');
const env = require('../lib/checker-env');
const { sep } = require('path');
const {
    it,
    fit,
    ffit,
    beforeEach,
    afterEach,
    conditionPromise,
    timeoutPromise,
} = require('./async-spec-helpers');

describe('Spell check', function () {
    let workspaceElement, editor, editorElement, spellCheckModule;

    const textForMarker = (marker) =>
        editor.getTextInBufferRange(marker.getBufferRange());

    const getMisspellingMarkers = () =>
        spellCheckModule.misspellingMarkersForEditor(editor);

    beforeEach(async function () {
        jasmine.useRealClock();

        workspaceElement = atom.views.getView(atom.workspace);
        await atom.packages.activatePackage('language-text');
        await atom.packages.activatePackage('language-javascript');
        await atom.workspace.open(`${__dirname}${sep}sample.js`);
        const pack = await atom.packages.activatePackage('spell-check');
        spellCheckModule = pack.mainModule;

        // Disable the grammers so nothing is done until we turn it back on.
        atom.config.set('spell-check.grammars', []);

        // Set the settings to a specific setting to avoid side effects.
        atom.config.set('spell-check.useSystem', false);
        atom.config.set('spell-check.useLocales', false);
        atom.config.set('spell-check.locales', ['en-US']);

        // Attach everything and ready to test.
        jasmine.attachToDOM(workspaceElement);
        editor = atom.workspace.getActiveTextEditor();
        editorElement = atom.views.getView(editor);
    });

    afterEach(() => SpellCheckTask.clear());

    it('decorates all misspelled words', async function () {
        atom.config.set('spell-check.useLocales', true);
        editor.insertText(
            'This middle of thiss\nsentencts\n\nhas issues and the "edn" \'dsoe\' too'
        );
        atom.config.set('spell-check.grammars', ['source.js']);

        await conditionPromise(() => getMisspellingMarkers().length === 4);
        const misspellingMarkers = getMisspellingMarkers();
        expect(textForMarker(misspellingMarkers[0])).toEqual('thiss');
        expect(textForMarker(misspellingMarkers[1])).toEqual('sentencts');
        expect(textForMarker(misspellingMarkers[2])).toEqual('edn');
        expect(textForMarker(misspellingMarkers[3])).toEqual('dsoe');
    });

    it('decorates misspelled words with a leading space', async function () {
        atom.config.set('spell-check.useLocales', true);
        editor.setText('\nchok bok');
        atom.config.set('spell-check.grammars', ['source.js']);

        await conditionPromise(() => getMisspellingMarkers().length === 2);
        const misspellingMarkers = getMisspellingMarkers();
        expect(textForMarker(misspellingMarkers[0])).toEqual('chok');
        expect(textForMarker(misspellingMarkers[1])).toEqual('bok');
    });

    it('allows certains scopes to be excluded from spell checking', async function () {
        editor.setText(
            'speledWrong = 5;\n' +
                'function speledWrong() {}\n' +
                'class SpeledWrong {}'
        );
        atom.config.set('spell-check.useLocales', true);
        atom.config.set('spell-check.grammars', [
            'source.js',
            'text.plain.null-grammar',
        ]);
        atom.config.set('spell-check.excludedScopes', ['.function.entity']);

        {
            await conditionPromise(() => getMisspellingMarkers().length > 0);
            const markers = getMisspellingMarkers();
            expect(markers.map((marker) => marker.getBufferRange())).toEqual([
                [
                    [0, 0],
                    [0, 11],
                ],
                [
                    [2, 6],
                    [2, 17],
                ],
            ]);
        }

        {
            atom.config.set('spell-check.excludedScopes', ['.functio.entity']);
            await conditionPromise(() => getMisspellingMarkers().length === 3);
            const markers = getMisspellingMarkers();
            expect(markers.map((marker) => marker.getBufferRange())).toEqual([
                [
                    [0, 0],
                    [0, 11],
                ],
                [
                    [1, 9],
                    [1, 20],
                ],
                [
                    [2, 6],
                    [2, 17],
                ],
            ]);
        }

        {
            atom.config.set('spell-check.excludedScopes', ['.meta.class']);
            await conditionPromise(() => getMisspellingMarkers().length === 2);
            const markers = getMisspellingMarkers();
            expect(markers.map((marker) => marker.getBufferRange())).toEqual([
                [
                    [0, 0],
                    [0, 11],
                ],
                [
                    [1, 9],
                    [1, 20],
                ],
            ]);
        }

        {
            atom.grammars.assignLanguageMode(editor, null);
            await conditionPromise(() => getMisspellingMarkers().length === 3);
            const markers = getMisspellingMarkers();
            expect(markers.map((marker) => marker.getBufferRange())).toEqual([
                [
                    [0, 0],
                    [0, 11],
                ],
                [
                    [1, 9],
                    [1, 20],
                ],
                [
                    [2, 6],
                    [2, 17],
                ],
            ]);
        }
    });

    it('allow entering of known words', async function () {
        atom.config.set('spell-check.knownWords', [
            'GitHub',
            '!github',
            'codez',
        ]);
        atom.config.set('spell-check.useLocales', true);
        editor.setText('GitHub (aka github): Where codez are builz.');
        atom.config.set('spell-check.grammars', ['source.js']);

        await conditionPromise(() => getMisspellingMarkers().length === 1);
        const misspellingMarkers = getMisspellingMarkers();
        expect(textForMarker(misspellingMarkers[0])).toBe('builz');
    });

    it('hides decorations when a misspelled word is edited', async function () {
        editor.setText('notaword');
        advanceClock(editor.getBuffer().getStoppedChangingDelay());
        atom.config.set('spell-check.useLocales', true);
        atom.config.set('spell-check.grammars', ['source.js']);
        await conditionPromise(() => getMisspellingMarkers().length === 1);

        editor.moveToEndOfLine();
        editor.insertText('a');
        await conditionPromise(() => {
            const misspellingMarkers = getMisspellingMarkers();
            return (
                misspellingMarkers.length === 1 &&
                !misspellingMarkers[0].isValid()
            );
        });
    });

    describe('when spell checking for a grammar is removed', () =>
        it('removes all the misspellings', async function () {
            atom.config.set('spell-check.useLocales', true);
            editor.setText('notaword');
            atom.config.set('spell-check.grammars', ['source.js']);
            await conditionPromise(() => getMisspellingMarkers().length === 1);

            atom.config.set('spell-check.grammars', []);
            expect(getMisspellingMarkers().length).toBe(0);
        }));

    describe('when spell checking for a grammar is toggled off', () =>
        it('removes all the misspellings', async function () {
            atom.config.set('spell-check.useLocales', true);
            editor.setText('notaword');
            atom.config.set('spell-check.grammars', ['source.js']);
            await conditionPromise(() => getMisspellingMarkers().length === 1);

            atom.commands.dispatch(workspaceElement, 'spell-check:toggle');
            expect(getMisspellingMarkers().length).toBe(0);
        }));

    describe("when the editor's grammar changes to one that does not have spell check enabled", () =>
        it('removes all the misspellings', async function () {
            atom.config.set('spell-check.useLocales', true);
            editor.setText('notaword');
            atom.config.set('spell-check.grammars', ['source.js']);

            await conditionPromise(() => getMisspellingMarkers().length === 1);
            const misspellingMarkers = getMisspellingMarkers();
            editor.setGrammar(atom.grammars.selectGrammar('.txt'));
            expect(getMisspellingMarkers().length).toBe(0);
        }));

    describe("when 'spell-check:correct-misspelling' is triggered on the editor", function () {
        describe('when the cursor touches a misspelling that has corrections', () =>
            it('displays the corrections for the misspelling and replaces the misspelling when a correction is selected', async function () {
                atom.config.set('spell-check.useLocales', true);
                editor.setText('tofether');
                atom.config.set('spell-check.grammars', ['source.js']);
                let correctionsElement = null;

                await conditionPromise(
                    () => getMisspellingMarkers().length === 1
                );
                expect(getMisspellingMarkers()[0].isValid()).toBe(true);

                atom.commands.dispatch(
                    editorElement,
                    'spell-check:correct-misspelling'
                );
                correctionsElement = editorElement.querySelector(
                    '.corrections'
                );
                expect(correctionsElement).toBeDefined();
                expect(
                    correctionsElement.querySelectorAll('li').length
                ).toBeGreaterThan(0);
                expect(
                    correctionsElement.querySelectorAll('li')[0].textContent
                ).toBe('together');

                atom.commands.dispatch(correctionsElement, 'core:confirm');
                expect(editor.getText()).toBe('together');
                expect(editor.getCursorBufferPosition()).toEqual([0, 8]);

                expect(getMisspellingMarkers()[0].isValid()).toBe(false);
                expect(editorElement.querySelector('.corrections')).toBeNull();
            }));

        describe('when the cursor touches a misspelling that has no corrections', () =>
            it('displays a message saying no corrections found', async function () {
                atom.config.set('spell-check.useLocales', true);
                editor.setText('zxcasdfysyadfyasdyfasdfyasdfyasdfyasydfasdf');
                atom.config.set('spell-check.grammars', ['source.js']);
                await conditionPromise(
                    () => getMisspellingMarkers().length > 0
                );

                atom.commands.dispatch(
                    editorElement,
                    'spell-check:correct-misspelling'
                );
                expect(
                    editorElement.querySelectorAll('.corrections').length
                ).toBe(1);
                expect(
                    editorElement.querySelectorAll('.corrections li').length
                ).toBe(0);
                expect(
                    editorElement.querySelector('.corrections').textContent
                ).toMatch(/No corrections/);
            }));
    });

    describe('when a right mouse click is triggered on the editor', function () {
        describe('when the cursor touches a misspelling that has corrections', () =>
            it('displays the context menu items for the misspelling and replaces the misspelling when a correction is selected', async function () {
                atom.config.set('spell-check.useLocales', true);
                editor.setText('tofether');
                advanceClock(editor.getBuffer().getStoppedChangingDelay());
                atom.config.set('spell-check.grammars', ['source.js']);
                await conditionPromise(
                    () => getMisspellingMarkers().length === 1
                );

                expect(getMisspellingMarkers()[0].isValid()).toBe(true);
                editorElement.dispatchEvent(new MouseEvent('contextmenu'));

                // Check that the proper context menu entries are created for the misspelling.
                // A misspelling will have atleast 2 context menu items for the lines separating
                // the corrections.
                expect(
                    spellCheckModule.contextMenuEntries.length
                ).toBeGreaterThan(2);
                const commandName = 'spell-check:correct-misspelling-0';
                const menuItemLabel = 'together';

                {
                    const editorCommands = atom.commands.findCommands({
                        target: editorElement,
                    });
                    const correctionCommand = editorCommands.filter(
                        (command) => command.name === commandName
                    )[0];
                    const correctionMenuItem = atom.contextMenu.itemSets.filter(
                        (item) => item.items[0].label === menuItemLabel
                    )[0];
                    expect(correctionCommand).toBeDefined();
                    expect(correctionMenuItem).toBeDefined();
                }

                atom.commands.dispatch(editorElement, commandName);
                // Check that the misspelling is corrected and the context menu entries are properly disposed.
                expect(editor.getText()).toBe('together');
                expect(editor.getCursorBufferPosition()).toEqual([0, 8]);
                expect(getMisspellingMarkers()[0].isValid()).toBe(false);
                expect(spellCheckModule.contextMenuEntries.length).toBe(0);

                {
                    const editorCommands = atom.commands.findCommands({
                        target: editorElement,
                    });
                    const correctionCommand = editorCommands.filter(
                        (command) => command.name === commandName
                    )[0];
                    const correctionMenuItem = atom.contextMenu.itemSets.filter(
                        (item) => item.items[0].label === menuItemLabel
                    )[0];
                    expect(correctionCommand).toBeUndefined();
                    expect(correctionMenuItem).toBeUndefined();
                }
            }));

        describe('when the cursor touches a misspelling and adding known words is enabled', () =>
            it("displays the 'Add to Known Words' option and adds that word when the option is selected", async function () {
                atom.config.set('spell-check.useLocales', true);
                editor.setText('zxcasdfysyadfyasdyfasdfyasdfyasdfyasydfasdf');
                advanceClock(editor.getBuffer().getStoppedChangingDelay());
                atom.config.set('spell-check.grammars', ['source.js']);
                atom.config.set('spell-check.addKnownWords', true);

                expect(atom.config.get('spell-check.knownWords').length).toBe(
                    0
                );

                await conditionPromise(
                    () => getMisspellingMarkers().length === 1
                );

                expect(getMisspellingMarkers()[0].isValid()).toBe(true);
                editorElement.dispatchEvent(new MouseEvent('contextmenu'));

                // Check that the 'Add to Known Words' entry is added to the context menu.
                // There should be 1 entry for 'Add to Known Words' and 2 entries for the line separators.
                expect(spellCheckModule.contextMenuEntries.length).toBe(3);
                const commandName = 'spell-check:correct-misspelling-0';
                const menuItemLabel = 'together';

                {
                    const editorCommands = atom.commands.findCommands({
                        target: editorElement,
                    });
                    const correctionCommand = editorCommands.filter(
                        (command) => command.name === commandName
                    )[0];

                    const correctionMenuItem = atom.contextMenu.itemSets.filter(
                        (item) => item.items[0].label === menuItemLabel
                    )[0];
                    expect(correctionCommand).toBeDefined;
                    expect(correctionMenuItem).toBeDefined;
                }

                atom.commands.dispatch(editorElement, commandName);
                // Check that the misspelling is added as a known word, that there are no more misspelling
                // markers in the editor, and that the context menu entries are properly disposed.
                waitsFor(() => getMisspellingMarkers().length === 0);
                expect(atom.config.get('spell-check.knownWords').length).toBe(
                    1
                );
                expect(spellCheckModule.contextMenuEntries.length).toBe(0);

                {
                    const editorCommands = atom.commands.findCommands({
                        target: editorElement,
                    });
                    const correctionCommand = editorCommands.filter(
                        (command) => command.name === commandName
                    )[0];
                    const correctionMenuItem = atom.contextMenu.itemSets.filter(
                        (item) => item.items[0].label === menuItemLabel
                    )[0];
                    expect(correctionCommand).toBeUndefined();
                    expect(correctionMenuItem).toBeUndefined();
                }
            }));
    });

    describe('when the editor is destroyed', () =>
        it('destroys all misspelling markers', async function () {
            atom.config.set('spell-check.useLocales', true);
            editor.setText('mispelling');
            atom.config.set('spell-check.grammars', ['source.js']);

            await conditionPromise(() => getMisspellingMarkers().length > 0);
            editor.destroy();
            expect(getMisspellingMarkers().length).toBe(0);
            // Check that all the views have been cleaned up.
            expect(spellCheckModule.updateViews().length).toBe(0);
        }));

    describe('when using checker plugins', function () {
        it('no opinion on input means correctly spells', async function () {
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-1-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-2-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-3-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-4-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./eot-spec-checker')
            );
            editor.setText('eot');
            atom.config.set('spell-check.grammars', ['source.js']);

            await conditionPromise(() => getMisspellingMarkers().length === 1);
            editor.destroy();
            expect(getMisspellingMarkers().length).toBe(0);
        });

        it('correctly spelling k1a', async function () {
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-1-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-2-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-3-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-4-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./eot-spec-checker')
            );
            editor.setText('k1a eot');
            atom.config.set('spell-check.grammars', ['source.js']);
            await conditionPromise(() => getMisspellingMarkers().length === 1);
            editor.destroy();
            expect(getMisspellingMarkers().length).toBe(0);
        });

        it('correctly mispelling k2a', async function () {
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-1-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-2-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-3-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-4-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./eot-spec-checker')
            );
            editor.setText('k2a eot');
            atom.config.set('spell-check.grammars', ['source.js']);

            await conditionPromise(() => getMisspellingMarkers().length === 2);
            editor.destroy();
            expect(getMisspellingMarkers().length).toBe(0);
        });

        it('correctly mispelling k2a with text in middle', async function () {
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-1-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-2-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-3-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-4-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./eot-spec-checker')
            );
            editor.setText('k2a good eot');
            atom.config.set('spell-check.grammars', ['source.js']);

            await conditionPromise(() => getMisspellingMarkers().length === 2);
            editor.destroy();
            expect(getMisspellingMarkers().length).toBe(0);
        });

        it('word is both correct and incorrect is correct', async function () {
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-1-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-2-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-3-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-4-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./eot-spec-checker')
            );
            editor.setText('k0a eot');
            atom.config.set('spell-check.grammars', ['source.js']);

            await conditionPromise(() => getMisspellingMarkers().length === 1);
            editor.destroy();
            expect(getMisspellingMarkers().length).toBe(0);
        });

        it('word is correct twice is correct', async function () {
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-1-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-2-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-3-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-4-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./eot-spec-checker')
            );
            editor.setText('k0b eot');
            atom.config.set('spell-check.grammars', ['source.js']);

            await conditionPromise(() => getMisspellingMarkers().length === 1);
            editor.destroy();
            expect(getMisspellingMarkers().length).toBe(0);
        });

        it('word is incorrect twice is incorrect', async function () {
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-1-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-2-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-3-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-4-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./eot-spec-checker')
            );
            editor.setText('k0c eot');
            atom.config.set('spell-check.grammars', ['source.js']);

            await conditionPromise(() => getMisspellingMarkers().length === 2);
            editor.destroy();
            expect(getMisspellingMarkers().length).toBe(0);
        });

        it('treats unknown Unicode words as incorrect', async function () {
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./eot-spec-checker')
            );
            editor.setText('абырг eot');
            atom.config.set('spell-check.grammars', ['source.js']);
            expect(atom.config.get('spell-check.knownWords').length).toBe(0);

            await conditionPromise(() => getMisspellingMarkers().length > 0);
            const markers = getMisspellingMarkers();
            expect(markers[0].getBufferRange()).toEqual({
                start: { row: 0, column: 6 },
                end: { row: 0, column: 9 },
            });

            editor.destroy();
            expect(getMisspellingMarkers().length).toBe(0);
        });

        it('treats known Unicode words as correct', async function () {
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./known-unicode-spec-checker')
            );
            spellCheckModule.consumeSpellCheckers(
                require.resolve('./eot-spec-checker')
            );
            editor.setText('абырг eot');
            atom.config.set('spell-check.grammars', ['source.js']);
            expect(atom.config.get('spell-check.knownWords').length).toBe(0);

            await conditionPromise(() => getMisspellingMarkers().length === 1);
            editor.destroy();
            expect(getMisspellingMarkers().length).toBe(0);
        });
    });

    // These tests are only run on Macs because the CI for Windows doesn't have
    // spelling provided.
    if (env.isSystemSupported() && env.isDarwin()) {
        describe('when using system checker plugin', function () {
            it('marks chzz as not a valid word but cheese is', async function () {
                atom.config.set('spell-check.useSystem', true);
                editor.setText('cheese chzz');
                atom.config.set('spell-check.grammars', ['source.js']);

                await conditionPromise(() => {
                    markers = getMisspellingMarkers();
                    console.log(markers);
                    return (
                        markers.length === 1 &&
                        markers[0].getBufferRange().start.column === 7 &&
                        markers[0].getBufferRange().end.column === 11
                    );
                });

                editor.destroy();
                expect(getMisspellingMarkers().length).toBe(0);
            });

            it('marks multiple words as wrong', async function () {
                atom.config.set('spell-check.useSystem', true);
                editor.setText('cheese chz chzz chzzz');
                atom.config.set('spell-check.grammars', ['source.js']);

                await conditionPromise(() => {
                    markers = getMisspellingMarkers();
                    return (
                        markers.length === 3 &&
                        markers[0].getBufferRange().start.column === 7 &&
                        markers[0].getBufferRange().end.column === 10 &&
                        markers[1].getBufferRange().start.column === 11 &&
                        markers[1].getBufferRange().end.column === 15 &&
                        markers[2].getBufferRange().start.column === 16 &&
                        markers[2].getBufferRange().end.column === 21
                    );
                });

                editor.destroy();
                expect(getMisspellingMarkers().length).toBe(0);
            });
        });
    } else {
        console.log(
            "Skipping system checker tests because they don't run on Windows CI or Linux"
        );
    }
});
