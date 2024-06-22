const path = require('path');
const temp = require('temp').track();
const Snippets = require('../lib/snippets');
const {TextEditor} = require('atom');
const crypto = require('crypto');

const SUPPORTS_UUID = ('randomUUID' in crypto) && (typeof crypto.randomUUID === 'function');

describe("Snippets extension", () => {
  let editorElement, editor, languageMode;
  let modernTreeSitterIsDefault = null;

  const simulateTabKeyEvent = (param) => {
    if (param == null) {
      param = {};
    }
    const {shift} = param;
    const event = atom.keymaps.constructor.buildKeydownEvent('tab', {shift, target: editorElement});
    atom.keymaps.handleKeyboardEvent(event);
  };

  beforeEach(async () => {
    if (modernTreeSitterIsDefault === null) {
      let oldSetting = atom.config.getSchema('core.useExperimentalModernTreeSitter');
      if (oldSetting?.type === 'boolean') {
        modernTreeSitterIsDefault = false;
      }
    }
    if (!modernTreeSitterIsDefault) {
      atom.config.set('core.useExperimentalModernTreeSitter', true);
    }
    if (atom.notifications != null) { spyOn(atom.notifications, 'addError'); }
    spyOn(Snippets, 'loadAll');
    spyOn(Snippets, 'getUserSnippetsPath').andReturn('');

    await atom.workspace.open(path.join(__dirname, 'fixtures', 'sample.js'));
    await atom.packages.activatePackage('language-javascript');
    await atom.packages.activatePackage('language-python');
    await atom.packages.activatePackage('language-html');
    await atom.packages.activatePackage('snippets');

    editor = atom.workspace.getActiveTextEditor();
    editorElement = atom.views.getView(editor);
    languageMode = editor.getBuffer().getLanguageMode();
    await languageMode.ready;
    languageMode.useAsyncParsing = false;
  });

  afterEach(async () => {
    if (languageMode) {
      await languageMode.atTransactionEnd();
    }
    await atom.packages.deactivatePackage('snippets');
  });

  describe("provideSnippets interface", () => {
    let snippetsInterface = null;

    beforeEach(() => {
      snippetsInterface = Snippets.provideSnippets();
    });

    describe("bundledSnippetsLoaded", () => {
      it("indicates the loaded state of the bundled snippets", () => {
        expect(snippetsInterface.bundledSnippetsLoaded()).toBe(false);
        Snippets.doneLoading();
        expect(snippetsInterface.bundledSnippetsLoaded()).toBe(true);
      });

      it("resets the loaded state after snippets is deactivated", async () => {
        expect(snippetsInterface.bundledSnippetsLoaded()).toBe(false);
        Snippets.doneLoading();
        expect(snippetsInterface.bundledSnippetsLoaded()).toBe(true);

        await atom.packages.deactivatePackage('snippets');
        await atom.packages.activatePackage('snippets');

        runs(() => {
          expect(snippetsInterface.bundledSnippetsLoaded()).toBe(false);
          Snippets.doneLoading();
          expect(snippetsInterface.bundledSnippetsLoaded()).toBe(true);
        });
      });
    });

    describe("insertSnippet", () => {
      it("can insert a snippet", () => {
        editor.setSelectedBufferRange([[0, 4], [0, 13]]);
        snippetsInterface.insertSnippet("hello ${1:world}", editor);
        expect(editor.lineTextForBufferRow(0)).toBe("var hello world = function () {");
      });
    });
  });

  it("returns false for snippetToExpandUnderCursor if getSnippets returns {}", () => {
    const snippets = atom.packages.getActivePackage('snippets').mainModule;
    expect(snippets.snippetToExpandUnderCursor(editor)).toEqual(false);
  });

  it("ignores invalid snippets in the config", () => {
    const snippets = atom.packages.getActivePackage('snippets').mainModule;

    let invalidSnippets = null;
    spyOn(snippets.scopedPropertyStore, 'getPropertyValue').andCallFake(() => invalidSnippets);
    expect(snippets.getSnippets(editor)).toEqual({});

    invalidSnippets = 'test';
    expect(snippets.getSnippets(editor)).toEqual({});

    invalidSnippets = [];
    expect(snippets.getSnippets(editor)).toEqual({});

    invalidSnippets = 3;
    expect(snippets.getSnippets(editor)).toEqual({});

    invalidSnippets = {a: null};
    expect(snippets.getSnippets(editor)).toEqual({});
  });

  describe("when null snippets are present", () => {
    beforeEach(() => Snippets.add(__filename, {
      ".source.js": {
        "some snippet": {
          prefix: "t1",
          body: "this is a test"
        }
      },

      ".source.js .nope": {
        "some snippet": {
          prefix: "t1",
          body: null
        }
      }
    }));

    it("overrides the less-specific defined snippet", () => {
      const snippets = Snippets.provideSnippets();
      expect(snippets.snippetsForScopes(['.source.js'])['t1']).toBeTruthy();
      expect(snippets.snippetsForScopes(['.source.js .nope.not-today'])['t1']).toBeFalsy();
    });
  });

  describe("when 'tab' is triggered on the editor", () => {
    beforeEach(() => {
      Snippets.add(__filename, {
        ".source.js": {
          "without tab stops": {
            prefix: "t1",
            body: "this is a test"
          },

          "with only an end tab stop": {
            prefix: "t1a",
            body: "something $0 strange"
          },

          "overlapping prefix": {
            prefix: "tt1",
            body: "this is another test"
          },

          "special chars": {
            prefix: "@unique",
            body: "@unique see"
          },

          "tab stops": {
            prefix: "t2",
            body: `\
go here next:($2) and finally go here:($0)
go here first:($1)
\
`
          },

          "indented second line": {
            prefix: "t3",
            body: `\
line 1
\tline 2$1
$2\
`
          },

          "multiline with indented placeholder tabstop": {
            prefix: "t4",
            body: `\
line \${1:1}
  \${2:body...}\
`
          },

          "multiline starting with tabstop": {
            prefix: "t4b",
            body: `\
$1 = line 1 {
  line 2
}\
`
          },

          "nested tab stops": {
            prefix: "t5",
            body: '${1:"${2:key}"}: ${3:value}'
          },

          "caused problems with undo": {
            prefix: "t6",
            body: `\
first line$1
\${2:placeholder ending second line}\
`
          },

          "tab stops at beginning and then end of snippet": {
            prefix: "t6b",
            body: "$1expanded$0"
          },

          "tab stops at end and then beginning of snippet": {
            prefix: "t6c",
            body: "$0expanded$1"
          },

          "contains empty lines": {
            prefix: "t7",
            body: `\
first line $1


fourth line after blanks $2\
`
          },
          "with/without placeholder": {
            prefix: "t8",
            body: `\
with placeholder \${1:test}
without placeholder \${2}\
`
          },

          "multi-caret": {
            prefix: "t9",
            body: `\
with placeholder \${1:test}
without placeholder $1\
`
          },

          "multi-caret-multi-tabstop": {
            prefix: "t9b",
            body: `\
with placeholder \${1:test}
without placeholder $1
second tabstop $2
third tabstop $3\
`
          },

          "large indices": {
            prefix: "t10",
            body: "hello${10} ${11:large} indices${1}"
          },

          "no body": {
            prefix: "bad1"
          },

          "number body": {
            prefix: "bad2",
            body: 100
          },

          "many tabstops": {
            prefix: "t11",
            body: "$0one${1} ${2:two} three${3}"
          },

          "simple transform": {
            prefix: "t12",
            body: "[${1:b}][/${1/[ ]+.*$//}]"
          },
          "transform with non-transforming mirrors": {
            prefix: "t13",
            body: "${1:placeholder}\n${1/(.)/\\u$1/g}\n$1"
          },
          "multiple tab stops, some with transforms and some without": {
            prefix: "t14",
            body: "${1:placeholder} ${1/(.)/\\u$1/g} $1 ${2:ANOTHER} ${2/^(.*)$/\\L$1/} $2"
          },
          "has a transformed tab stop without a corresponding ordinary tab stop": {
            prefix: 't15',
            body: "${1/(.)/\\u$1/g} & $2"
          },
          "has a transformed tab stop that occurs before the corresponding ordinary tab stop": {
            prefix: 't16',
            body: "& ${1/(.)/\\u$1/g} & ${1:q}"
          },
          "has a placeholder that mirrors another tab stop's content": {
            prefix: 't17',
            body: "$4console.${3:log}('${2:uh $1}', $1);$0"
          },
          "has a transformed tab stop such that it is possible to move the cursor between the ordinary tab stop and its transformed version without an intermediate step": {
            prefix: 't18',
            body: '// $1\n// ${1/./=/g}'
          },
          "has two tab stops adjacent to one another": {
            prefix: 't19',
            body: '${2:bar}${3:baz}'
          },
          "has several adjacent tab stops, one of which has a placeholder with reference to another tab stop at its edge": {
            prefix: 't20',
            body: '${1:foo}${2:bar}${3:baz $1}$4'
          },
          "banner without global flag": {
            prefix: "bannerWrong",
            body: "// $1\n// ${1/./=/}"
          },
          "banner with globalFlag": {
            prefix: "bannerCorrect",
            body: "// $1\n// ${1/./=/g}"
          },
          "transform with simple flag on replacement (upcase)": {
            prefix: 't_simple_upcase',
            body: "$1 ${1/(.*)/${1:/upcase}/}"
          },
          "transform with simple flag on replacement (downcase)": {
            prefix: 't_simple_downcase',
            body: "$1 ${1/(.*)/${1:/downcase}/}"
          },
          "transform with simple flag on replacement (capitalize)": {
            prefix: 't_simple_capitalize',
            body: "$1 ${1/(.*)/${1:/capitalize}/}"
          },
          "transform with simple flag on replacement (camelcase)": {
            prefix: 't_simple_camelcase',
            body: "$1 ${1/(.*)/${1:/camelcase}/}"
          },
          "transform with simple flag on replacement (pascalcase)": {
            prefix: 't_simple_pascalcase',
            body: "$1 ${1/(.*)/${1:/pascalcase}/}"
          },
          "transform with simple flag on replacement (snakecase)": {
            prefix: 't_simple_snakecase',
            body: "$1 ${1/(.*)/${1:/snakecase}/}"
          },
          "transform with simple flag on replacement (kebabcase)": {
            prefix: 't_simple_kebabcase',
            body: "$1 ${1/(.*)/${1:/kebabcase}/}"
          },
          "variable reference with simple flag on replacement (upcase)": {
            prefix: 'v_simple_upcase',
            body: "$CLIPBOARD ${CLIPBOARD/(\\S*)(.*)/${1}${2:/upcase}/}$0"
          },
          "variable reference with simple flag on replacement (pascal)": {
            prefix: 'v_simple_pascalcase',
            body: "$CLIPBOARD ${CLIPBOARD/(\\S*)(.*)/${1} ${2:/pascalcase}/}$0"
          },
          "variable reference with simple flag on replacement (snakecase)": {
            prefix: 'v_simple_snakecase',
            body: "$CLIPBOARD ${CLIPBOARD/(\\S*)(.*)/${1} ${2:/snakecase}/}$0"
          },
          'TM iftext but no elsetext': {
            prefix: 'ifelse1',
            body: '$1 ${1/(wat)/(?1:hey:)/}'
          },
          'TM elsetext but no iftext': {
            prefix: 'ifelse2',
            body: '$1 ${1/(?:(wat)|^.*$)$/(?1::hey)/}'
          },
          'TM both iftext and elsetext': {
            prefix: 'ifelse3',
            body: '$1 ${1/^\\w+\\s(?:(wat)|\\w*?)$/(?1:Y:N)/}'
          },
          'VS iftext but no elsetext': {
            prefix: 'vsifelse1',
            body: '$1 ${1/(?:(wat)|^.*?$)/${1:+WAT}/}'
          },
          'VS elsetext but no iftext': {
            prefix: 'vsifelse2',
            body: '$1 ${1/(?:(wat)|^.*?$)/${1:-nah}/}'
          },
          'VS elsetext but no iftext (alt)': {
            prefix: 'vsifelse2a',
            body: '$1 ${1/(?:(wat)|^.*?$)/${1:nah}/}'
          },
          'VS both iftext and elsetext': {
            prefix: 'vsifelse3',
            body: '$1 ${1/(?:(wat)|^.*?$)/${1:?WAT:nah}/}'
          },
          'choice syntax': {
            prefix: 'choice',
            body: '${1|one, two, three|}'
          }
        }
      });

      Snippets.add(__filename, {
        ".source, .text": {
          "banner with generic comment delimiters": {
            prefix: "bannerGeneric",
            body: "$LINE_COMMENT $1\n$LINE_COMMENT ${1/./=/g}"
          }
        }
      });
    });

    it("parses snippets once, reusing cached ones on subsequent queries", () => {
      spyOn(Snippets, "getBodyParser").andCallThrough();

      editor.insertText("t1");
      simulateTabKeyEvent();

      expect(Snippets.getBodyParser).toHaveBeenCalled();
      expect(editor.lineTextForBufferRow(0)).toBe("this is a testvar quicksort = function () {");
      expect(editor.getCursorScreenPosition()).toEqual([0, 14]);

      Snippets.getBodyParser.reset();

      editor.setText("");
      editor.insertText("t1");
      simulateTabKeyEvent();

      expect(Snippets.getBodyParser).not.toHaveBeenCalled();
      expect(editor.lineTextForBufferRow(0)).toBe("this is a test");
      expect(editor.getCursorScreenPosition()).toEqual([0, 14]);

      Snippets.getBodyParser.reset();

      Snippets.add(__filename, {
        ".source.js": {
          "invalidate previous snippet": {
            prefix: "t1",
            body: "new snippet"
          }
        }
      });

      editor.setText("");
      editor.insertText("t1");
      simulateTabKeyEvent();

      expect(Snippets.getBodyParser).toHaveBeenCalled();
      expect(editor.lineTextForBufferRow(0)).toBe("new snippet");
      expect(editor.getCursorScreenPosition()).toEqual([0, 11]);
    });

    describe("when the snippet body is invalid or missing", () => {
      it("does not register the snippet", () => {
        editor.setText('');
        editor.insertText('bad1');
        atom.commands.dispatch(editorElement, 'snippets:expand');
        expect(editor.getText()).toBe('bad1');

        editor.setText('');
        editor.setText('bad2');
        atom.commands.dispatch(editorElement, 'snippets:expand');
        expect(editor.getText()).toBe('bad2');
      });
    });

    describe("when the letters preceding the cursor trigger a snippet", () => {
      describe("when the snippet contains no tab stops", () => {
        it("replaces the prefix with the snippet text and places the cursor at its end", () => {
          editor.insertText("t1");
          expect(editor.getCursorScreenPosition()).toEqual([0, 2]);

          simulateTabKeyEvent();
          expect(editor.lineTextForBufferRow(0)).toBe("this is a testvar quicksort = function () {");
          expect(editor.getCursorScreenPosition()).toEqual([0, 14]);
        });

        it("inserts a real tab the next time a tab is pressed after the snippet is expanded", () => {
          editor.insertText("t1");
          simulateTabKeyEvent();
          expect(editor.lineTextForBufferRow(0)).toBe("this is a testvar quicksort = function () {");
          simulateTabKeyEvent();
          expect(editor.lineTextForBufferRow(0)).toBe("this is a test  var quicksort = function () {");
        });
      });

      describe("when the snippet contains tab stops", () => {
        it("places the cursor at the first tab-stop, and moves the cursor in response to 'next-tab-stop' events", () => {
          const markerCountBefore = editor.getMarkerCount();
          editor.setCursorScreenPosition([2, 0]);
          editor.insertText('t2');
          simulateTabKeyEvent();
          expect(editor.lineTextForBufferRow(2)).toBe("go here next:() and finally go here:()");
          expect(editor.lineTextForBufferRow(3)).toBe("go here first:()");
          expect(editor.lineTextForBufferRow(4)).toBe("    if (items.length <= 1) return items;");
          expect(editor.getSelectedBufferRange()).toEqual([[3, 15], [3, 15]]);

          simulateTabKeyEvent();
          expect(editor.getSelectedBufferRange()).toEqual([[2, 14], [2, 14]]);
          editor.insertText('abc');

          simulateTabKeyEvent();
          expect(editor.getSelectedBufferRange()).toEqual([[2, 40], [2, 40]]);

          // tab backwards
          simulateTabKeyEvent({shift: true});
          expect(editor.getSelectedBufferRange()).toEqual([[2, 14], [2, 17]]); // should highlight text typed at tab stop

          simulateTabKeyEvent({shift: true});
          expect(editor.getSelectedBufferRange()).toEqual([[3, 15], [3, 15]]);

          // shift-tab on first tab-stop does nothing
          simulateTabKeyEvent({shift: true});
          expect(editor.getCursorScreenPosition()).toEqual([3, 15]);

          // tab through all tab stops, then tab on last stop to terminate snippet
          simulateTabKeyEvent();
          simulateTabKeyEvent();
          simulateTabKeyEvent();
          expect(editor.lineTextForBufferRow(2)).toBe("go here next:(abc) and finally go here:(  )");
          expect(editor.getMarkerCount()).toBe(markerCountBefore);
        });

        describe("when tab stops are nested", () => {
          it("destroys the inner tab stop if the outer tab stop is modified", () => {
            editor.setText('');
            editor.insertText('t5');
            atom.commands.dispatch(editorElement, 'snippets:expand');
            expect(editor.lineTextForBufferRow(0)).toBe('"key": value');
            expect(editor.getSelectedBufferRange()).toEqual([[0, 0], [0, 5]]);
            editor.insertText("foo");
            simulateTabKeyEvent();
            expect(editor.getSelectedBufferRange()).toEqual([[0, 5], [0, 10]]);
          });
        });

        describe("when the only tab stop is an end stop", () => {
          it("terminates the snippet immediately after moving the cursor to the end stop", () => {
            editor.setText('');
            editor.insertText('t1a');
            simulateTabKeyEvent();

            expect(editor.lineTextForBufferRow(0)).toBe("something  strange");
            expect(editor.getCursorBufferPosition()).toEqual([0, 10]);

            simulateTabKeyEvent();
            expect(editor.lineTextForBufferRow(0)).toBe("something    strange");
            expect(editor.getCursorBufferPosition()).toEqual([0, 12]);
          });
        });

        describe("when tab stops are separated by blank lines", () => {
          it("correctly places the tab stops (regression)", () => {
            editor.setText('');
            editor.insertText('t7');
            atom.commands.dispatch(editorElement, 'snippets:expand');
            atom.commands.dispatch(editorElement, 'snippets:next-tab-stop');
            expect(editor.getCursorBufferPosition()).toEqual([3, 25]);
          });
        });

        describe("when the cursor is moved beyond the bounds of the current tab stop", () => {
          it("terminates the snippet", () => {
            editor.setCursorScreenPosition([2, 0]);
            editor.insertText('t2');
            simulateTabKeyEvent();

            editor.moveUp();
            editor.moveLeft();
            simulateTabKeyEvent();

            expect(editor.lineTextForBufferRow(2)).toBe("go here next:(  ) and finally go here:()");
            expect(editor.getCursorBufferPosition()).toEqual([2, 16]);

            // test we can terminate with shift-tab
            editor.setCursorScreenPosition([4, 0]);
            editor.insertText('t2');
            simulateTabKeyEvent();
            simulateTabKeyEvent();

            editor.moveRight();
            simulateTabKeyEvent({shift: true});
            expect(editor.getCursorBufferPosition()).toEqual([4, 15]);
          });
        });

        describe("when the cursor is moved within the bounds of the current tab stop", () => {
          it("should not terminate the snippet", () => {
            editor.setCursorScreenPosition([0, 0]);
            editor.insertText('t8');
            simulateTabKeyEvent();

            expect(editor.lineTextForBufferRow(0)).toBe("with placeholder test");
            editor.moveRight();
            editor.moveLeft();
            editor.insertText("foo");
            expect(editor.lineTextForBufferRow(0)).toBe("with placeholder tesfoot");

            simulateTabKeyEvent();
            expect(editor.lineTextForBufferRow(1)).toBe("without placeholder var quicksort = function () {");
            editor.insertText("test");
            expect(editor.lineTextForBufferRow(1)).toBe("without placeholder testvar quicksort = function () {");
            editor.moveLeft();
            editor.insertText("foo");
            expect(editor.lineTextForBufferRow(1)).toBe("without placeholder tesfootvar quicksort = function () {");
          });
        });

        describe("when the backspace is press within the bounds of the current tab stop", () => {
          it("should not terminate the snippet", () => {
            editor.setCursorScreenPosition([0, 0]);
            editor.insertText('t8');
            simulateTabKeyEvent();

            expect(editor.lineTextForBufferRow(0)).toBe("with placeholder test");
            editor.moveRight();
            editor.backspace();
            editor.insertText("foo");
            expect(editor.lineTextForBufferRow(0)).toBe("with placeholder tesfoo");

            simulateTabKeyEvent();
            expect(editor.lineTextForBufferRow(1)).toBe("without placeholder var quicksort = function () {");
            editor.insertText("test");
            expect(editor.lineTextForBufferRow(1)).toBe("without placeholder testvar quicksort = function () {");
            editor.backspace();
            editor.insertText("foo");
            expect(editor.lineTextForBufferRow(1)).toBe("without placeholder tesfoovar quicksort = function () {");
          });
        });
      });

      describe("when the snippet contains hard tabs", () => {
        describe("when the edit session is in soft-tabs mode", () => {
          it("translates hard tabs in the snippet to the appropriate number of spaces", () => {
            expect(editor.getSoftTabs()).toBeTruthy();
            editor.insertText("t3");
            simulateTabKeyEvent();
            expect(editor.lineTextForBufferRow(1)).toBe("  line 2");
            expect(editor.getCursorBufferPosition()).toEqual([1, 8]);
          });
        });

        describe("when the edit session is in hard-tabs mode", () => {
          it("inserts hard tabs in the snippet directly", () => {
            editor.setSoftTabs(false);
            editor.insertText("t3");
            simulateTabKeyEvent();
            expect(editor.lineTextForBufferRow(1)).toBe("\tline 2");
            expect(editor.getCursorBufferPosition()).toEqual([1, 7]);
          });
        });
      });

      describe("when the snippet prefix is indented", () => {
        describe("when the snippet spans a single line", () => {
          it("does not indent the next line", () => {
            editor.setCursorScreenPosition([2, Infinity]);
            editor.insertText(' t1');
            atom.commands.dispatch(editorElement, 'snippets:expand');
            expect(editor.lineTextForBufferRow(3)).toBe("    var pivot = items.shift(), current, left = [], right = [];");
          });
        });

        describe("when the snippet spans multiple lines", () => {
          it("indents the subsequent lines of the snippet to be even with the start of the first line", () => {
            expect(editor.getSoftTabs()).toBeTruthy();
            editor.setCursorScreenPosition([2, Infinity]);
            editor.insertText(' t3');
            atom.commands.dispatch(editorElement, 'snippets:expand');
            expect(editor.lineTextForBufferRow(2)).toBe("    if (items.length <= 1) return items; line 1");
            expect(editor.lineTextForBufferRow(3)).toBe("      line 2");
            expect(editor.getCursorBufferPosition()).toEqual([3, 12]);
          });
        });
      });

      describe("when the snippet spans multiple lines", () => {
        beforeEach(async () => {
          editor.update({autoIndent: true});
          // editor.update() returns a Promise that never gets resolved, so we
          // need to return undefined to avoid a timeout in the spec.
          // TODO: Figure out why `editor.update({autoIndent: true})` never gets resolved.
        });

        it("places tab stops correctly", () => {
          expect(editor.getSoftTabs()).toBeTruthy();
          editor.setCursorScreenPosition([2, Infinity]);
          editor.insertText(' t3');
          atom.commands.dispatch(editorElement, 'snippets:expand');
          expect(editor.getCursorBufferPosition()).toEqual([3, 12]);
          atom.commands.dispatch(editorElement, 'snippets:next-tab-stop');
          expect(editor.getCursorBufferPosition()).toEqual([4, 4]);
        });

        it("indents the subsequent lines of the snippet based on the indent level before the snippet is inserted", async () => {
          editor.setCursorScreenPosition([2, Infinity]);
          editor.insertNewline();
          await languageMode.atTransactionEnd();
          editor.insertText('t4b');
          await languageMode.atTransactionEnd();
          atom.commands.dispatch(editorElement, 'snippets:expand');

          expect(editor.lineTextForBufferRow(3)).toBe("     = line 1 {"); // 4 + 1 spaces (because the tab stop is invisible)
          expect(editor.lineTextForBufferRow(4)).toBe("      line 2");
          expect(editor.lineTextForBufferRow(5)).toBe("    }");
          expect(editor.getCursorBufferPosition()).toEqual([3, 4]);
        });

        it("does not change the relative positioning of the tab stops when inserted multiple times", async () => {
          editor.setCursorScreenPosition([2, Infinity]);
          editor.insertNewline();
          await languageMode.atTransactionEnd();
          editor.insertText('t4');
          await languageMode.atTransactionEnd();
          atom.commands.dispatch(editorElement, 'snippets:expand');

          expect(editor.getSelectedBufferRange()).toEqual([[3, 9], [3, 10]]);
          atom.commands.dispatch(editorElement, 'snippets:next-tab-stop');
          expect(editor.getSelectedBufferRange()).toEqual([[4, 6], [4, 13]]);

          editor.insertText('t4');
          await languageMode.atTransactionEnd();
          atom.commands.dispatch(editorElement, 'snippets:expand');

          expect(editor.getSelectedBufferRange()).toEqual([[4, 11], [4, 12]]);
          atom.commands.dispatch(editorElement, 'snippets:next-tab-stop');
          expect(editor.getSelectedBufferRange()).toEqual([[5, 8], [5, 15]]);

          editor.setText(''); // Clear editor
          await languageMode.atTransactionEnd();
          editor.insertText('t4');
          await languageMode.atTransactionEnd();
          atom.commands.dispatch(editorElement, 'snippets:expand');

          expect(editor.getSelectedBufferRange()).toEqual([[0, 5], [0, 6]]);
          atom.commands.dispatch(editorElement, 'snippets:next-tab-stop');
          expect(editor.getSelectedBufferRange()).toEqual([[1, 2], [1, 9]]);
        });
      });

      describe("when multiple snippets match the prefix", () => {
        it("expands the snippet that is the longest match for the prefix", async () => {
          editor.insertText('t113');
          await languageMode.atTransactionEnd();
          expect(editor.getCursorScreenPosition()).toEqual([0, 4]);

          simulateTabKeyEvent();
          expect(editor.lineTextForBufferRow(0)).toBe("t113  var quicksort = function () {");
          expect(editor.getCursorScreenPosition()).toEqual([0, 6]);

          editor.undo();
          editor.undo();

          editor.insertText("tt1");
          await languageMode.atTransactionEnd();
          expect(editor.getCursorScreenPosition()).toEqual([0, 3]);

          simulateTabKeyEvent();
          expect(editor.lineTextForBufferRow(0)).toBe("this is another testvar quicksort = function () {");
          expect(editor.getCursorScreenPosition()).toEqual([0, 20]);

          editor.undo();
          editor.undo();
          await languageMode.atTransactionEnd();

          editor.insertText("@t1");
          await languageMode.atTransactionEnd();
          expect(editor.getCursorScreenPosition()).toEqual([0, 3]);

          simulateTabKeyEvent();
          expect(editor.lineTextForBufferRow(0)).toBe("@this is a testvar quicksort = function () {");
          expect(editor.getCursorScreenPosition()).toEqual([0, 15]);
        });
      });
    });

    describe("when the word preceding the cursor ends with a snippet prefix", () => {
      it("inserts a tab as normal", () => {
        editor.insertText("t1t1t1");
        simulateTabKeyEvent();
        expect(editor.lineTextForBufferRow(0)).toBe("t1t1t1  var quicksort = function () {");
      });
    });

    describe("when the letters preceding the cursor don't match a snippet", () => {
      it("inserts a tab as normal", () => {
        editor.insertText("xxte");
        expect(editor.getCursorScreenPosition()).toEqual([0, 4]);

        simulateTabKeyEvent();
        expect(editor.lineTextForBufferRow(0)).toBe("xxte  var quicksort = function () {");
        expect(editor.getCursorScreenPosition()).toEqual([0, 6]);
      });
    });

    describe("when text is selected", () => {
      it("inserts a tab as normal", () => {
        editor.insertText("t1");
        editor.setSelectedBufferRange([[0, 0], [0, 2]]);

        simulateTabKeyEvent();
        expect(editor.lineTextForBufferRow(0)).toBe("  t1var quicksort = function () {");
        expect(editor.getSelectedBufferRange()).toEqual([[0, 0], [0, 4]]);
      });
    });

    describe("when a previous snippet expansion has just been undone", () => {
      describe("when the tab stops appear in the middle of the snippet", () => {
        it("expands the snippet based on the current prefix rather than jumping to the old snippet's tab stop", () => {
          editor.insertText('t6\n');
          editor.setCursorBufferPosition([0, 2]);
          simulateTabKeyEvent();
          expect(editor.lineTextForBufferRow(0)).toBe("first line");
          editor.undo();
          expect(editor.lineTextForBufferRow(0)).toBe("t6");
          simulateTabKeyEvent();
          expect(editor.lineTextForBufferRow(0)).toBe("first line");
        });
      });

      describe("when the tab stops appear at the beginning and then the end of snippet", () => {
        it("expands the snippet based on the current prefix rather than jumping to the old snippet's tab stop", () => {
          editor.insertText('t6b\n');
          editor.setCursorBufferPosition([0, 3]);
          simulateTabKeyEvent();
          expect(editor.lineTextForBufferRow(0)).toBe("expanded");
          editor.undo();
          expect(editor.lineTextForBufferRow(0)).toBe("t6b");
          simulateTabKeyEvent();
          expect(editor.lineTextForBufferRow(0)).toBe("expanded");
          expect(editor.getCursorBufferPosition()).toEqual([0, 0]);
        });
      });

      describe("when the tab stops appear at the end and then the beginning of snippet", () => {
        it("expands the snippet based on the current prefix rather than jumping to the old snippet's tab stop", () => {
          editor.insertText('t6c\n');
          editor.setCursorBufferPosition([0, 3]);
          simulateTabKeyEvent();
          expect(editor.lineTextForBufferRow(0)).toBe("expanded");
          editor.undo();
          expect(editor.lineTextForBufferRow(0)).toBe("t6c");
          simulateTabKeyEvent();
          expect(editor.lineTextForBufferRow(0)).toBe("expanded");
          expect(editor.getCursorBufferPosition()).toEqual([0, 8]);
        });
      });
    });

    describe("when the prefix contains non-word characters", () => {
      it("selects the non-word characters as part of the prefix", () => {
        editor.insertText("@unique");
        expect(editor.getCursorScreenPosition()).toEqual([0, 7]);

        simulateTabKeyEvent();
        expect(editor.lineTextForBufferRow(0)).toBe("@unique seevar quicksort = function () {");
        expect(editor.getCursorScreenPosition()).toEqual([0, 11]);

        editor.setCursorBufferPosition([10, 0]);
        editor.insertText("'@unique");

        simulateTabKeyEvent();
        expect(editor.lineTextForBufferRow(10)).toBe("'@unique see");
        expect(editor.getCursorScreenPosition()).toEqual([10, 12]);
      });

      it("does not select the whitespace before the prefix", () => {
        editor.insertText("a; @unique");
        expect(editor.getCursorScreenPosition()).toEqual([0, 10]);

        simulateTabKeyEvent();
        expect(editor.lineTextForBufferRow(0)).toBe("a; @unique seevar quicksort = function () {");
        expect(editor.getCursorScreenPosition()).toEqual([0, 14]);
      });
    });

    describe("when snippet contains tabstops with or without placeholder", () => {
      it("should create two markers", () => {
        editor.setCursorScreenPosition([0, 0]);
        editor.insertText('t8');
        simulateTabKeyEvent();
        expect(editor.lineTextForBufferRow(0)).toBe("with placeholder test");
        expect(editor.lineTextForBufferRow(1)).toBe("without placeholder var quicksort = function () {");

        expect(editor.getSelectedBufferRange()).toEqual([[0, 17], [0, 21]]);

        simulateTabKeyEvent();
        expect(editor.getSelectedBufferRange()).toEqual([[1, 20], [1, 20]]);
      });
    });

    describe("when snippet contains multi-caret tabstops with or without placeholder", () => {
      it("should create two markers", () => {
        editor.setCursorScreenPosition([0, 0]);
        editor.insertText('t9');
        simulateTabKeyEvent();
        expect(editor.lineTextForBufferRow(0)).toBe("with placeholder test");
        expect(editor.lineTextForBufferRow(1)).toBe("without placeholder var quicksort = function () {");
        editor.insertText('hello');
        expect(editor.lineTextForBufferRow(0)).toBe("with placeholder hello");
        expect(editor.lineTextForBufferRow(1)).toBe("without placeholder hellovar quicksort = function () {");
      });

      it("terminates the snippet when cursors are destroyed", () => {
        editor.setCursorScreenPosition([0, 0]);
        editor.insertText('t9b');
        simulateTabKeyEvent();
        editor.getCursors()[0].destroy();
        editor.getCursorBufferPosition();
        simulateTabKeyEvent();

        expect(editor.lineTextForBufferRow(1)).toEqual("without placeholder   ");
      });

      it("terminates the snippet expansion if a new cursor moves outside the bounds of the tab stops", () => {
        editor.setCursorScreenPosition([0, 0]);
        editor.insertText('t9b');
        simulateTabKeyEvent();
        editor.insertText('test');

        editor.getCursors()[0].destroy();
        editor.moveDown(); // this should destroy the previous expansion
        editor.moveToBeginningOfLine();

        // this should insert whitespace instead of going through tabstops of the previous destroyed snippet
        simulateTabKeyEvent();
        expect(editor.lineTextForBufferRow(2).indexOf("  second")).toBe(0);
      });

      it("moves to the second tabstop after a multi-caret tabstop", () => {
        editor.setCursorScreenPosition([0, 0]);
        editor.insertText('t9b');
        simulateTabKeyEvent();
        editor.insertText('line 1');

        simulateTabKeyEvent();
        editor.insertText('line 2');

        simulateTabKeyEvent();
        editor.insertText('line 3');

        expect(editor.lineTextForBufferRow(2).indexOf("line 2 ")).toBe(-1);
      });

      it("mirrors input properly when a tabstop's placeholder refers to another tabstop", () => {
        editor.setText('t17');
        editor.setCursorScreenPosition([0, 3]);
        simulateTabKeyEvent();
        editor.insertText("foo");
        expect(editor.getText()).toBe("console.log('uh foo', foo);");
        simulateTabKeyEvent();
        editor.insertText("bar");
        expect(editor.getText()).toBe("console.log('bar', foo);");
      });
    });

    describe("when the snippet contains tab stops with transformations", () => {
      it("transforms the text typed into the first tab stop before setting it in the transformed tab stop", async () => {
        editor.setText('t12');
        editor.setCursorScreenPosition([0, 3]);
        simulateTabKeyEvent();
        expect(editor.getText()).toBe("[b][/b]");
        await languageMode.atTransactionEnd();
        editor.insertText('img src');
        expect(editor.getText()).toBe("[img src][/img]");
      });

      it("bundles the transform mutations along with the original manual mutation for the purposes of undo and redo", async () => {
        editor.setText('t12');
        editor.setCursorScreenPosition([0, 3]);
        simulateTabKeyEvent();
        editor.insertText('i');
        expect(editor.getText()).toBe("[i][/i]");

        editor.insertText('mg src');
        expect(editor.getText()).toBe("[img src][/img]");

        editor.undo();
        expect(editor.getText()).toBe("[i][/i]");

        editor.redo();
        expect(editor.getText()).toBe("[img src][/img]");
      });

      it("can pick the right insertion to use as the primary even if a transformed insertion occurs first in the snippet", () => {
        editor.setText('t16');
        editor.setCursorScreenPosition([0, 3]);
        simulateTabKeyEvent();
        expect(editor.lineTextForBufferRow(0)).toBe("& Q & q");
        expect(editor.getCursorBufferPosition()).toEqual([0, 7]);

        editor.insertText('rst');
        expect(editor.lineTextForBufferRow(0)).toBe("& RST & rst");
      });

      it("silently ignores a tab stop without a non-transformed insertion to use as the primary", () => {
        editor.setText('t15');
        editor.setCursorScreenPosition([0, 3]);
        simulateTabKeyEvent();
        editor.insertText('a');
        expect(editor.lineTextForBufferRow(0)).toBe(" & a");
        expect(editor.getCursorBufferPosition()).toEqual([0, 4]);
      });
    });

    describe("when the snippet contains mirrored tab stops and tab stops with transformations", () => {
      it("adds cursors for the mirrors but not the transformations", () => {
        editor.setText('t13');
        editor.setCursorScreenPosition([0, 3]);
        simulateTabKeyEvent();
        expect(editor.getCursors().length).toBe(2);
        expect(editor.getText()).toBe(`\
placeholder
PLACEHOLDER
\
`
        );

        editor.insertText('foo');

        expect(editor.getText()).toBe(`\
foo
FOO
foo\
`
        );
      });
    });

    describe("when the snippet contains a transformation without a global flag", () => {
      it("should transform only the first character", () => {
        editor.setText('bannerWrong');
        editor.setCursorScreenPosition([0, 11]);
        simulateTabKeyEvent();
        expect(editor.getText()).toBe("// \n// ");
        editor.insertText('TEST');
        expect(editor.getText()).toBe("// TEST\n// =EST");
      });
    });

    describe("when the snippet contains a transformation with a global flag", () => {
      it("should transform all characters", () => {
        editor.setText('bannerCorrect');
        editor.setCursorScreenPosition([0, 13]);
        simulateTabKeyEvent();
        expect(editor.getText()).toBe("// \n// ");
        editor.insertText('TEST');
        expect(editor.getText()).toBe("// TEST\n// ====");
      });
    });

    describe("when the snippet contains generic line comment delimiter variables", () => {
      describe("and the document is JavaScript", () => {
        it("uses the right delimiters", () => {
          editor.setText('bannerGeneric');
          editor.setCursorScreenPosition([0, 13]);
          simulateTabKeyEvent();
          expect(editor.getText()).toBe("// \n// ");
          editor.insertText('TEST');
          expect(editor.getText()).toBe("// TEST\n// ====");
        });
      });

      describe("and the document is HTML", () => {
        beforeEach(() => {
          atom.grammars.assignLanguageMode(editor, 'text.html.basic');
          editor.setText('');
        });

        it("falls back to an empty string, for HTML has no line comment", () => {
          editor.setText('bannerGeneric');
          editor.setCursorScreenPosition([0, 13]);
          simulateTabKeyEvent();
          expect(editor.getText()).toBe(" \n ");
          editor.insertText('TEST');
          expect(editor.getText()).toBe(" TEST\n ====");
        });
      });

      describe("and the document is Python", () => {
        beforeEach(() => {
          atom.grammars.assignLanguageMode(editor, 'source.python');
          editor.setText('');
        });
        it("uses the right delimiters", () => {
          editor.setText('bannerGeneric');
          editor.setCursorScreenPosition([0, 13]);
          simulateTabKeyEvent();
          expect(editor.getText()).toBe("# \n# ");
          editor.insertText('TEST');
          expect(editor.getText()).toBe("# TEST\n# ====");
        });
      });
    });

    describe("when the snippet contains a transformation with a simple transform flag on a substitution", () => {
      let expectations = {
        upcase: `LOREM IPSUM DOLOR`,
        downcase: `lorem ipsum dolor`,
        capitalize: `Lorem Ipsum Dolor`,
        camelcase: 'loremIpsumDolor',
        pascalcase: 'LoremIpsumDolor',
        snakecase: 'lorem_ipsum_dolor',
        kebabcase: 'lorem-ipsum-dolor'
      };
      for (let [flag, expected] of Object.entries(expectations)) {
        it(`should transform ${flag} correctly`, () => {
          let trigger = `t_simple_${flag}`;
          editor.setText(trigger);
          editor.setCursorScreenPosition([0, trigger.length]);
          simulateTabKeyEvent();
          editor.insertText('lorem Ipsum Dolor');
          expect(editor.getText()).toBe(`lorem Ipsum Dolor ${expected}`);
        });
      }
    });

    describe("when the snippet contains a variable with a simple transform flag within a sed-style substitution", () => {
      let expectations = {
        upcase: 'lorem IPSUM DOLOR',
        pascalcase: 'lorem IpsumDolor',
        snakecase: 'lorem ipsum_dolor',
      };
      for (let [flag, expected] of Object.entries(expectations)) {
        it(`should transform ${flag} correctly`, () => {
          atom.clipboard.write('lorem Ipsum Dolor');
          let trigger = `v_simple_${flag}`;
          console.log('expanding:', trigger);
          editor.setText(trigger);
          editor.setCursorScreenPosition([0, trigger.length]);
          simulateTabKeyEvent();
          console.log('TEXT:', editor.getText());
          expect(editor.getText()).toBe(`lorem Ipsum Dolor ${expected}`);
        });
      }
    });

    describe("when the snippet contains multiple tab stops, some with transformations and some without", () => {
      it("does not get confused", () => {
        editor.setText('t14');
        editor.setCursorScreenPosition([0, 3]);
        simulateTabKeyEvent();
        expect(editor.getCursors().length).toBe(2);
        expect(editor.getText()).toBe("placeholder PLACEHOLDER  ANOTHER another ");
        simulateTabKeyEvent();
        expect(editor.getCursors().length).toBe(2);
        editor.insertText('FOO');
        expect(editor.getText()).toBe("placeholder PLACEHOLDER  FOO foo FOO");
      });
    });

    describe("when the snippet contains a tab stop with choices", () => {
      it("uses the first option as the placeholder", () => {
        editor.setText('');
        editor.insertText('choice');
        simulateTabKeyEvent();

        expect(editor.getText()).toBe('one');
      });
    });

    describe("when the snippet contains VSCode-style if-else syntax", () => {

      it('understands if but no else', () => {
        editor.setText('');
        editor.insertText('vsifelse1');
        simulateTabKeyEvent();

        editor.insertText('wat');
        expect(editor.getText()).toEqual('wat WAT');
        simulateTabKeyEvent();

        editor.setText('');
        editor.insertText('vsifelse1');
        simulateTabKeyEvent();

        editor.insertText('foo');
        expect(editor.getText()).toEqual('foo ');
      });

      it('understands else but no if', () => {
        editor.setText('');
        editor.insertText('vsifelse2');
        simulateTabKeyEvent();

        editor.insertText('wat');
        expect(editor.getText()).toEqual('wat ');
        simulateTabKeyEvent();

        editor.setText('');
        editor.insertText('vsifelse2');
        simulateTabKeyEvent();

        editor.insertText('foo');
        expect(editor.getText()).toEqual('foo nah');
        simulateTabKeyEvent();

        // There are two syntaxes for this.
        editor.setText('');
        editor.insertText('vsifelse2a');
        simulateTabKeyEvent();

        editor.insertText('wat');
        expect(editor.getText()).toEqual('wat ');
        simulateTabKeyEvent();

        editor.setText('');
        editor.insertText('vsifelse2a');
        simulateTabKeyEvent();

        editor.insertText('foo');
        expect(editor.getText()).toEqual('foo nah');
      });

      it('understands both if and else', () => {
        editor.setText('');
        editor.insertText('vsifelse3');
        simulateTabKeyEvent();

        editor.insertText('wat');
        expect(editor.getText()).toEqual('wat WAT');
        simulateTabKeyEvent();

        editor.setText('');
        editor.insertText('vsifelse3');
        simulateTabKeyEvent();

        editor.insertText('foo');
        expect(editor.getText()).toEqual('foo nah');
      });
    });

    describe("when the snippet contains TextMate-style if-else syntax", () => {

      it('understands if but no else', () => {
        editor.setText('');
        editor.insertText('ifelse1');
        simulateTabKeyEvent();

        editor.insertText('wat');
        expect(editor.getText()).toEqual('wat hey');
        simulateTabKeyEvent();

        editor.setText('');
        editor.insertText('ifelse1');
        simulateTabKeyEvent();

        editor.insertText('foo');
        expect(editor.getText()).toEqual('foo foo');
      });

      it('understands else but no if', () => {
        editor.setText('');
        editor.insertText('ifelse2');
        simulateTabKeyEvent();

        editor.insertText('wat');
        expect(editor.getText()).toEqual('wat ');
        simulateTabKeyEvent();

        editor.setText('');
        editor.insertText('ifelse2');
        simulateTabKeyEvent();

        editor.insertText('foo');
        expect(editor.getText()).toEqual('foo hey');
      });

      it('understands both if and else', () => {
        editor.setText('');
        editor.insertText('ifelse3');
        simulateTabKeyEvent();

        editor.insertText('something wat');
        expect(editor.getText()).toEqual('something wat Y');
        simulateTabKeyEvent();

        editor.setText('');
        editor.insertText('ifelse3');
        simulateTabKeyEvent();

        editor.insertText('something foo');
        expect(editor.getText()).toEqual('something foo N');
      });
    });

    describe("when the snippet has a transformed tab stop such that it is possible to move the cursor between the ordinary tab stop and its transformed version without an intermediate step", () => {
      it("terminates the snippet upon such a cursor move", () => {
        editor.setText('t18');
        editor.setCursorScreenPosition([0, 3]);
        simulateTabKeyEvent();
        expect(editor.getText()).toBe("// \n// ");
        expect(editor.getCursorBufferPosition()).toEqual([0, 3]);
        editor.insertText('wat');
        expect(editor.getText()).toBe("// wat\n// ===");
        // Move the cursor down one line, then up one line. This puts the cursor
        // back in its previous position, but the snippet should no longer be
        // active, so when we type more text, it should not be mirrored.
        editor.setCursorScreenPosition([1, 6]);
        editor.setCursorScreenPosition([0, 6]);
        editor.insertText('wat');
        expect(editor.getText()).toBe("// watwat\n// ===");
      });
    });

    describe("when the snippet has two adjacent tab stops", () => {
      it("ensures insertions are treated as part of the active tab stop", () => {
        editor.setText('t19');
        editor.setCursorScreenPosition([0, 3]);
        simulateTabKeyEvent();
        expect(editor.getText()).toBe('barbaz');
        expect(
          editor.getSelectedBufferRange()
        ).toEqual([
          [0, 0],
          [0, 3]
        ]);
        editor.insertText('w');
        expect(editor.getText()).toBe('wbaz');
        editor.insertText('at');
        expect(editor.getText()).toBe('watbaz');
        simulateTabKeyEvent();
        expect(
          editor.getSelectedBufferRange()
        ).toEqual([
          [0, 3],
          [0, 6]
        ]);
        editor.insertText('foo');
        expect(editor.getText()).toBe('watfoo');
      });
    });

    describe("when the snippet has a placeholder with a tabstop mirror at its edge", () => {
      it("allows the associated marker to include the inserted text", () => {
        editor.setText('t20');
        editor.setCursorScreenPosition([0, 3]);
        simulateTabKeyEvent();
        expect(editor.getText()).toBe('foobarbaz ');
        expect(editor.getCursors().length).toBe(2);
        let selections = editor.getSelections();
        expect(selections[0].getBufferRange()).toEqual([[0, 0], [0, 3]]);
        expect(selections[1].getBufferRange()).toEqual([[0, 10], [0, 10]]);
        editor.insertText('nah');
        expect(editor.getText()).toBe('nahbarbaz nah');
        simulateTabKeyEvent();
        editor.insertText('meh');
        simulateTabKeyEvent();
        editor.insertText('yea');
        expect(editor.getText()).toBe('nahmehyea');
      });
    });

    describe("when the snippet contains tab stops with an index >= 10", () => {
      it("parses and orders the indices correctly", () => {
        editor.setText('t10');
        editor.setCursorScreenPosition([0, 3]);
        simulateTabKeyEvent();
        expect(editor.getText()).toBe("hello large indices");
        expect(editor.getCursorBufferPosition()).toEqual([0, 19]);
        simulateTabKeyEvent();
        expect(editor.getCursorBufferPosition()).toEqual([0, 5]);
        simulateTabKeyEvent();
        expect(editor.getSelectedBufferRange()).toEqual([[0, 6], [0, 11]]);
      });
    });

    describe("when there are multiple cursors", () => {
      describe("when the cursors share a common snippet prefix", () => {
        it("expands the snippet for all cursors and allows simultaneous editing", () => {
          editor.insertText('t9');
          editor.setCursorBufferPosition([12, 2]);
          editor.insertText(' t9');
          editor.addCursorAtBufferPosition([0, 2]);
          simulateTabKeyEvent();

          expect(editor.lineTextForBufferRow(0)).toBe("with placeholder test");
          expect(editor.lineTextForBufferRow(1)).toBe("without placeholder var quicksort = function () {");
          expect(editor.lineTextForBufferRow(13)).toBe("}; with placeholder test");
          expect(editor.lineTextForBufferRow(14)).toBe("without placeholder ");

          editor.insertText('hello');
          expect(editor.lineTextForBufferRow(0)).toBe("with placeholder hello");
          expect(editor.lineTextForBufferRow(1)).toBe("without placeholder hellovar quicksort = function () {");
          expect(editor.lineTextForBufferRow(13)).toBe("}; with placeholder hello");
          expect(editor.lineTextForBufferRow(14)).toBe("without placeholder hello");
        });

        it("applies transformations identically to single-expansion mode", () => {
          editor.setText('t14\nt14');
          editor.setCursorBufferPosition([1, 3]);
          editor.addCursorAtBufferPosition([0, 3]);
          simulateTabKeyEvent();

          expect(editor.lineTextForBufferRow(0)).toBe("placeholder PLACEHOLDER  ANOTHER another ");
          expect(editor.lineTextForBufferRow(1)).toBe("placeholder PLACEHOLDER  ANOTHER another ");

          editor.insertText("testing");

          expect(editor.lineTextForBufferRow(0)).toBe("testing TESTING testing ANOTHER another ");
          expect(editor.lineTextForBufferRow(1)).toBe("testing TESTING testing ANOTHER another ");

          simulateTabKeyEvent();
          editor.insertText("AGAIN");

          expect(editor.lineTextForBufferRow(0)).toBe("testing TESTING testing AGAIN again AGAIN");
          expect(editor.lineTextForBufferRow(1)).toBe("testing TESTING testing AGAIN again AGAIN");
        });

        it("bundles transform-induced mutations into a single history entry along with their triggering edit, even across multiple snippets", () => {
          editor.setText('t14\nt14');
          editor.setCursorBufferPosition([1, 3]);
          editor.addCursorAtBufferPosition([0, 3]);
          simulateTabKeyEvent();

          expect(editor.lineTextForBufferRow(0)).toBe("placeholder PLACEHOLDER  ANOTHER another ");
          expect(editor.lineTextForBufferRow(1)).toBe("placeholder PLACEHOLDER  ANOTHER another ");

          editor.insertText("testing");

          expect(editor.lineTextForBufferRow(0)).toBe("testing TESTING testing ANOTHER another ");
          expect(editor.lineTextForBufferRow(1)).toBe("testing TESTING testing ANOTHER another ");

          simulateTabKeyEvent();
          editor.insertText("AGAIN");

          expect(editor.lineTextForBufferRow(0)).toBe("testing TESTING testing AGAIN again AGAIN");
          expect(editor.lineTextForBufferRow(1)).toBe("testing TESTING testing AGAIN again AGAIN");

          editor.undo();
          expect(editor.lineTextForBufferRow(0)).toBe("testing TESTING testing ANOTHER another ");
          expect(editor.lineTextForBufferRow(1)).toBe("testing TESTING testing ANOTHER another ");

          editor.undo();
          expect(editor.lineTextForBufferRow(0)).toBe("placeholder PLACEHOLDER  ANOTHER another ");
          expect(editor.lineTextForBufferRow(1)).toBe("placeholder PLACEHOLDER  ANOTHER another ");

          editor.redo();
          expect(editor.lineTextForBufferRow(0)).toBe("testing TESTING testing ANOTHER another ");
          expect(editor.lineTextForBufferRow(1)).toBe("testing TESTING testing ANOTHER another ");

          editor.redo();
          expect(editor.lineTextForBufferRow(0)).toBe("testing TESTING testing AGAIN again AGAIN");
          expect(editor.lineTextForBufferRow(1)).toBe("testing TESTING testing AGAIN again AGAIN");
        });

        describe("when there are many tabstops", () => {
          it("moves the cursors between the tab stops for their corresponding snippet when tab and shift-tab are pressed", () => {
            editor.addCursorAtBufferPosition([7, 5]);
            editor.addCursorAtBufferPosition([12, 2]);
            editor.insertText('t11');
            simulateTabKeyEvent();

            const cursors = editor.getCursors();
            expect(cursors.length).toEqual(3);

            expect(cursors[0].getBufferPosition()).toEqual([0, 3]);
            expect(cursors[1].getBufferPosition()).toEqual([7, 8]);
            expect(cursors[2].getBufferPosition()).toEqual([12, 5]);
            expect(cursors[0].selection.isEmpty()).toBe(true);
            expect(cursors[1].selection.isEmpty()).toBe(true);
            expect(cursors[2].selection.isEmpty()).toBe(true);

            simulateTabKeyEvent();
            expect(cursors[0].getBufferPosition()).toEqual([0, 7]);
            expect(cursors[1].getBufferPosition()).toEqual([7, 12]);
            expect(cursors[2].getBufferPosition()).toEqual([12, 9]);
            expect(cursors[0].selection.isEmpty()).toBe(false);
            expect(cursors[1].selection.isEmpty()).toBe(false);
            expect(cursors[2].selection.isEmpty()).toBe(false);
            expect(cursors[0].selection.getText()).toEqual('two');
            expect(cursors[1].selection.getText()).toEqual('two');
            expect(cursors[2].selection.getText()).toEqual('two');

            simulateTabKeyEvent();
            expect(cursors[0].getBufferPosition()).toEqual([0, 13]);
            expect(cursors[1].getBufferPosition()).toEqual([7, 18]);
            expect(cursors[2].getBufferPosition()).toEqual([12, 15]);
            expect(cursors[0].selection.isEmpty()).toBe(true);
            expect(cursors[1].selection.isEmpty()).toBe(true);
            expect(cursors[2].selection.isEmpty()).toBe(true);

            simulateTabKeyEvent();
            expect(cursors[0].getBufferPosition()).toEqual([0, 0]);
            expect(cursors[1].getBufferPosition()).toEqual([7, 5]);
            expect(cursors[2].getBufferPosition()).toEqual([12, 2]);
            expect(cursors[0].selection.isEmpty()).toBe(true);
            expect(cursors[1].selection.isEmpty()).toBe(true);
            expect(cursors[2].selection.isEmpty()).toBe(true);
          });
        });
      });

      describe("when the cursors do not share common snippet prefixes", () => {
        it("inserts tabs as normal", () => {
          editor.insertText('t9');
          editor.setCursorBufferPosition([12, 2]);
          editor.insertText(' t8');
          editor.addCursorAtBufferPosition([0, 2]);
          simulateTabKeyEvent();
          expect(editor.lineTextForBufferRow(0)).toBe("t9  var quicksort = function () {");
          expect(editor.lineTextForBufferRow(12)).toBe("}; t8 ");
        });
      });

      describe("when a snippet is triggered within an existing snippet expansion", () => {
        it("ignores the snippet expansion and goes to the next tab stop", () => {
          editor.addCursorAtBufferPosition([7, 5]);
          editor.addCursorAtBufferPosition([12, 2]);
          editor.insertText('t11');
          simulateTabKeyEvent();
          simulateTabKeyEvent();

          editor.insertText('t1');
          simulateTabKeyEvent();

          const cursors = editor.getCursors();
          expect(cursors.length).toEqual(3);

          expect(cursors[0].getBufferPosition()).toEqual([0, 12]);
          expect(cursors[1].getBufferPosition()).toEqual([7, 17]);
          expect(cursors[2].getBufferPosition()).toEqual([12, 14]);
          expect(cursors[0].selection.isEmpty()).toBe(true);
          expect(cursors[1].selection.isEmpty()).toBe(true);
          expect(cursors[2].selection.isEmpty()).toBe(true);
          expect(editor.lineTextForBufferRow(0)).toBe("one t1 threevar quicksort = function () {");
          expect(editor.lineTextForBufferRow(7)).toBe("    }one t1 three");
          expect(editor.lineTextForBufferRow(12)).toBe("};one t1 three");
        });
      });
    });

    describe("when the editor is not a pane item (regression)", () => {
      it("handles tab stops correctly", async () => {
        editor = new TextEditor();
        atom.grammars.assignLanguageMode(editor, 'source.js');
        let languageMode = editor.getBuffer().getLanguageMode();
        editorElement = editor.getElement();
        await languageMode.ready;

        editor.insertText('t2');
        await languageMode.atTransactionEnd();
        simulateTabKeyEvent();
        editor.insertText('ABC');
        await languageMode.atTransactionEnd();
        expect(editor.getText()).toContain('go here first:(ABC)');

        editor.undo();
        editor.undo();
        await languageMode.atTransactionEnd();
        expect(editor.getText()).toBe('t2');
        simulateTabKeyEvent();
        editor.insertText('ABC');
        expect(editor.getText()).toContain('go here first:(ABC)');
      });
    });
  });

  describe("when atom://.pulsar/snippets is opened", () => {
    it("opens ~/.pulsar/snippets.cson", () => {
      jasmine.unspy(Snippets, 'getUserSnippetsPath');
      atom.workspace.destroyActivePaneItem();
      const configDirPath = temp.mkdirSync('atom-config-dir-');
      spyOn(atom, 'getConfigDirPath').andReturn(configDirPath);
      atom.workspace.open('atom://.pulsar/snippets');

      waitsFor(() => atom.workspace.getActiveTextEditor() != null);

      runs(() => {
        expect(atom.workspace.getActiveTextEditor().getURI()).toBe(path.join(configDirPath, 'snippets.cson'));
      });
    });
  });

  describe("snippet insertion API", () => {
    it("will automatically parse snippet definition and replace selection", () => {
      editor.setSelectedBufferRange([[0, 4], [0, 13]]);
      Snippets.insert("hello ${1:world}", editor);

      expect(editor.lineTextForBufferRow(0)).toBe("var hello world = function () {");
      expect(editor.getSelectedBufferRange()).toEqual([[0, 10], [0, 15]]);
    });
  });

  describe("when a user snippet maps to a command", () => {
    beforeEach(() => {
      editor.setText('');
      Snippets.add(
        __filename, {
          ".source.js": {
            "some command snippet": {
              body: "lorem ipsum dolor $1 sit ${2:amet}$0",
              command: "some-command-snippet"
            },
            "another command snippet with a prefix": {
              prefix: 'prfx',
              command: 'command-with-prefix',
              body: 'this had $0 a prefix'
            },
            "another snippet with neither command nor prefix": {
              body: 'useless'
            },
            "another snippet with a malformed command name": {
              command: 'i flout the RULES',
              body: 'inconsiderate'
            }
          },
          ".source.python": {
            "some python command snippet": {
              body: "consecuetur $0 adipiscing",
              command: "some-python-command-snippet"
            }
          },
          ".source, .text": {
            "wrap in block comment": {
              body: "$BLOCK_COMMENT_START $TM_SELECTED_TEXT ${BLOCK_COMMENT_END}${0}",
              command: 'wrap-in-block-comment'
            }
          },
          ".text.html": {
            "wrap in tag": {
              "command": "wrap-in-html-tag",
              "body": "<${1:div}>$0</${1/[ ]+.*$//}>"
            }
          }
        },
        'snippets'
      );
    });

    afterEach(() => {
      Snippets.clearSnippetsForPath(__filename);
    });

    it("registers the command", () => {
      expect(
        "snippets:some-command-snippet" in atom.commands.registeredCommands
      ).toBe(true);
    });

    it("complains about a malformed command name", () => {
      const expectedMessage = `Cannot register \`i flout the RULES\` for snippet “another snippet with a malformed command name” because the command name isn’t valid. Command names must be all lowercase and use hyphens between words instead of spaces.`;
      expect(atom.notifications.addError).toHaveBeenCalledWith(
        `Snippets error`,
        {
          description: expectedMessage,
          dismissable: true
        }
      );
    });

    describe("and the command is invoked", () => {
      beforeEach(() => {
        editor.setText('');
      });

      it("expands the snippet when the scope matches", () => {
        atom.commands.dispatch(editor.element, 'snippets:some-command-snippet');
        let cursor = editor.getLastCursor();
        let pos = cursor.getBufferPosition();
        expect(cursor.getBufferPosition()).toEqual([0, 18]);

        expect(editor.getText()).toBe('lorem ipsum dolor  sit amet');
        editor.insertText("virus");
        expect(editor.getText()).toBe('lorem ipsum dolor virus sit amet');

        simulateTabKeyEvent();
        expect(editor.getSelectedBufferRange()).toEqual([[0, 28], [0, 32]]);
      });

      it("expands the snippet even when a prefix is defined", () => {
        atom.commands.dispatch(editor.element, 'snippets:command-with-prefix');
        let cursor = editor.getLastCursor();
        let pos = cursor.getBufferPosition();
        expect(pos.toArray().join(',')).toBe('0,9');
        expect(editor.getText()).toBe('this had  a prefix');
      });

      it("does nothing when the scope does not match", () => {
        atom.commands.dispatch(editor.element, 'snippets:some-python-command-snippet');
        expect(editor.getText()).toBe("");
      });

      it("uses language-specific comment delimiters", () => {
        editor.setText("something");
        editor.selectAll();
        atom.commands.dispatch(editor.element, 'snippets:wrap-in-block-comment');
        expect(editor.getText()).toBe("/* something */");
      });

    });

    describe("and the command is invoked in an HTML document", () => {
      beforeEach(() => {
        atom.grammars.assignLanguageMode(editor, 'text.html.basic');
        editor.setText('');
      });

      it("expands tab stops correctly", () => {
        atom.commands.dispatch(editor.element, 'snippets:wrap-in-html-tag');
        let cursor = editor.getLastCursor();
        expect(cursor.getBufferPosition()).toEqual([0, 4]);
        expect(editor.getSelectedText()).toEqual('div');

        editor.insertText("aside class=\"wat\"");

        expect(editor.getText()).toBe("<aside class=\"wat\"></aside>");

        simulateTabKeyEvent();
        expect(cursor.getBufferPosition()).toEqual([0, 19]);
      });

      it("uses language-specific comment delimiters", () => {
        editor.setText("something");
        editor.selectAll();
        atom.commands.dispatch(editor.element, 'snippets:wrap-in-block-comment');
        expect(editor.getText()).toBe("<!-- something -->");
      });

    });

    describe("and the command is invoked in a Python document", () => {
      beforeEach(() => {
        atom.grammars.assignLanguageMode(editor, 'source.python');
        editor.setText('');
      });

      it("uses language-specific comment delimiters, or empty strings if those delimiters don't exist in Python", () => {
        editor.setText("something");
        editor.selectAll();
        atom.commands.dispatch(editor.element, 'snippets:wrap-in-block-comment');
        expect(editor.getText()).toBe(" something ");
      });

    });
  });

  describe("when a snippet contains variables", () => {

    beforeEach(() => {
      atom.grammars.assignLanguageMode(editor, 'source.js');
      Snippets.add(
        __filename, {
          ".source.js": {
            "Uses TM_SELECTED_TEXT": {
              body: 'lorem ipsum $TM_SELECTED_TEXT dolor sit amet',
              command: 'test-command-tm-selected-text',
              prefix: 'tmSelectedText'
            },
            "Uses CLIPBOARD": {
              body: 'lorem ipsum $CLIPBOARD dolor sit amet',
              command: 'test-command-clipboard'
            },
            "Transforms CLIPBOARD removing digits": {
              body: 'lorem ipsum ${CLIPBOARD/\\d//g} dolor sit amet',
              command: 'test-command-clipboard-transformed'
            },
            "Transforms CLIPBOARD with casing flags": {
              body: 'lorem ipsum ${CLIPBOARD:/upcase} dolor sit amet\n${CLIPBOARD:/downcase}\n${CLIPBOARD:/camelcase}\n${CLIPBOARD:/pascalcase}\n${CLIPBOARD:/capitalize}',
              command: 'test-command-clipboard-upcased'
            },
            "Transforms day, month, year": {
              body: 'Today is $CURRENT_MONTH $CURRENT_DATE, $CURRENT_YEAR',
              command: 'test-command-date'
            },
            "Transforms line numbers": {
              prefix: 'ln',
              body: 'line is $TM_LINE_NUMBER and index is $TM_LINE_INDEX'
            },
            "Transforms workspace name": {
              prefix: 'wn',
              body: 'the name of this project is $WORKSPACE_NAME'
            },
            "Gives random value": {
              prefix: 'rndm',
              body: 'random number is:\n$RANDOM'
            },
            "Gives random hex vallue": {
              prefix: 'rndmhex',
              body: 'random hex is:\n$RANDOM_HEX'
            },
            "Gives random UUID": {
              prefix: 'rndmuuid',
              body: 'random UUID is:\n$UUID'
            },
            "Gives file paths": {
              prefix: 'fpath',
              body: 'file paths:\n$TM_FILEPATH\n$TM_FILENAME\n$TM_FILENAME_BASE'
            },
          },
          ".text.html": {
            "wrap in tag": {
              "command": "wrap-in-html-tag",
              "body": "<${1:div}>${2:$TM_SELECTED_TEXT}</${1/[ ]+.*$//}>$0"
            }
          }
        },
        'test-package'
      );

      editor.setText('');
    });

    it("interpolates the variables into the snippet expansion", () => {
      editor.insertText('(selected text)');
      editor.selectToBeginningOfLine();

      expect(editor.getSelectedText()).toBe('(selected text)');
      atom.commands.dispatch(editor.element, 'test-package:test-command-tm-selected-text');
      expect(editor.getText()).toBe('lorem ipsum (selected text) dolor sit amet');
    });

    it("does not consider the tab trigger to be part of $TM_SELECTED_TEXT when a snippet is invoked via tab trigger", () => {
      editor.insertText('tmSelectedText');
      simulateTabKeyEvent();

      expect(editor.getText()).toBe('lorem ipsum  dolor sit amet');
    });

    it("interpolates line number variables correctly", () => {
      editor.insertText('ln');
      simulateTabKeyEvent();
      expect(editor.getText()).toBe('line is 1 and index is 0');
      editor.setText('');
      editor.insertText("\n\n\nln");
      simulateTabKeyEvent();
      let cursor = editor.getLastCursor();
      let lineText = editor.lineTextForBufferRow(cursor.getBufferRow());
      expect(lineText).toBe('line is 4 and index is 3');
    });

    it("interpolates WORKSPACE_NAME correctly", () => {
      editor.insertText('wn');
      simulateTabKeyEvent();
      expect(editor.getText()).toBe('the name of this project is fixtures');
    });

    it("interpolates date variables correctly", () => {
      function pad (val) {
        let str = String(val);
        return str.length === 1 ? `0${str}` : str;
      }
      let now = new Date();
      let month = pad(now.getMonth() + 1);
      let day = pad(now.getDate());
      let year = now.getFullYear();

      let expected = `Today is ${month} ${day}, ${year}`;

      atom.commands.dispatch(editor.element, 'test-package:test-command-date');
      expect(editor.getText()).toBe(expected);
    });

    it("interpolates a CLIPBOARD variable into the snippet expansion", () => {
      atom.clipboard.write('(clipboard text)');
      atom.commands.dispatch(editor.element, 'test-package:test-command-clipboard');
      expect(editor.getText()).toBe('lorem ipsum (clipboard text) dolor sit amet');
    });

    it("interpolates a transformed variable into the snippet expansion", () => {
      atom.clipboard.write('(clipboard 19283 text)');
      atom.commands.dispatch(editor.element, 'test-package:test-command-clipboard-transformed');
      expect(editor.getText()).toBe('lorem ipsum (clipboard  text) dolor sit amet');
    });

    it("interpolates an upcased variable", () => {
      atom.clipboard.write('(clipboard Text is Multiple words)');
      atom.commands.dispatch(editor.element, 'test-package:test-command-clipboard-upcased');
      expect(editor.lineTextForBufferRow(0)).toBe('lorem ipsum (CLIPBOARD TEXT IS MULTIPLE WORDS) dolor sit amet');
      expect(editor.lineTextForBufferRow(1)).toBe('(clipboard text is multiple words)');
      expect(editor.lineTextForBufferRow(2)).toBe('clipboardTextIsMultipleWords');
      expect(editor.lineTextForBufferRow(3)).toBe('ClipboardTextIsMultipleWords');
      // The /capitalize flag will only uppercase the first character, so none
      // of this clipboard value will be changed.
      expect(editor.lineTextForBufferRow(4)).toBe('(clipboard Text is Multiple words)');
    });

    it("interpolates file path variables", () => {
      editor.insertText('fpath');
      simulateTabKeyEvent();
      let filePath = editor.getPath();

      expect(editor.lineTextForBufferRow(0)).toEqual("file paths:");
      expect(editor.lineTextForBufferRow(1)).toEqual(filePath);
      expect(editor.lineTextForBufferRow(2)).toEqual('sample.js');
      expect(editor.lineTextForBufferRow(3)).toEqual('sample');
    });

    it("generates truly random values for RANDOM, RANDOM_HEX, and UUID", () => {
      let reUUID = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;
      let reRandom = /^\d{6}$/;
      let reRandomHex = /^[0-9a-f]{6}$/;

      editor.insertText('rndm');
      simulateTabKeyEvent();
      expect(editor.lineTextForBufferRow(0)).toEqual("random number is:");
      let randomFirst = editor.lineTextForBufferRow(1);
      expect(reRandom.test(randomFirst)).toBe(true);

      editor.setText('');
      editor.insertText('rndm');
      simulateTabKeyEvent();

      let randomSecond = editor.lineTextForBufferRow(1);
      expect(reRandom.test(randomSecond)).toBe(true);
      expect(randomSecond).not.toEqual(randomFirst);

      editor.setText('');
      editor.insertText('rndmhex');
      simulateTabKeyEvent();
      let randomHex1 = editor.lineTextForBufferRow(1);
      expect(reRandomHex.test(randomHex1)).toBe(true);

      editor.setText('');
      editor.insertText('rndmhex');
      simulateTabKeyEvent();
      let randomHex2 = editor.lineTextForBufferRow(1);
      expect(reRandomHex.test(randomHex2)).toBe(true);
      expect(randomHex2).not.toEqual(randomHex1);

      // TODO: These tests will start running when we use a version of Electron
      // that supports `crypto.randomUUID`.
      if (SUPPORTS_UUID) {
        editor.setText('');
        editor.insertText('rndmuuid');
        simulateTabKeyEvent();
        let randomUUID1 = editor.lineTextForBufferRow(1);
        expect(reUUID.test(randomUUID1)).toBe(true);

        editor.setText('');
        editor.insertText('rndmuuid');
        simulateTabKeyEvent();
        let randomUUID2 = editor.lineTextForBufferRow(1);
        expect(reUUID.test(randomUUID2)).toBe(true);
        expect(randomUUID2).not.toEqual(randomUUID1);
      }
    });

    describe("and the command is invoked in an HTML document", () => {
      beforeEach(() => {
        atom.grammars.assignLanguageMode(editor, 'text.html.basic');
        editor.setText('');
      });

      it("combines transformations and variable references", () => {
        editor.insertText('lorem');
        editor.selectToBeginningOfLine();

        atom.commands.dispatch(editor.element, 'test-package:wrap-in-html-tag');

        expect(editor.getText()).toBe(
          `<div>lorem</div>`
        );

        editor.insertText("aside class=\"wat\"");

        expect(editor.getText()).toBe("<aside class=\"wat\">lorem</aside>");

        simulateTabKeyEvent();
        expect(editor.getSelectedText()).toEqual('lorem');
      });
    });

  });

  describe("when the 'snippets:available' command is triggered", () => {
    let availableSnippetsView = null;

    beforeEach(() => {
      atom.grammars.assignLanguageMode(editor, 'source.js');
      Snippets.add(__filename, {
        ".source.js": {
          "test": {
            prefix: "test",
            body: "${1:Test pass you will}, young "
          },

          "challenge": {
            prefix: "chal",
            body: "$1: ${2:To pass this challenge}"
          }
        }
      });

      delete Snippets.availableSnippetsView;

      atom.commands.dispatch(editorElement, "snippets:available");

      waitsFor(() => atom.workspace.getModalPanels().length === 1);

      runs(() => {
        availableSnippetsView = atom.workspace.getModalPanels()[0].getItem();
      });
    });

    it("renders a select list of all available snippets", () => {
      expect(availableSnippetsView.selectListView.getSelectedItem().prefix).toBe('test');
      expect(availableSnippetsView.selectListView.getSelectedItem().name).toBe('test');
      expect(availableSnippetsView.selectListView.getSelectedItem().bodyText).toBe('${1:Test pass you will}, young ');

      availableSnippetsView.selectListView.selectNext();

      expect(availableSnippetsView.selectListView.getSelectedItem().prefix).toBe('chal');
      expect(availableSnippetsView.selectListView.getSelectedItem().name).toBe('challenge');
      expect(availableSnippetsView.selectListView.getSelectedItem().bodyText).toBe('$1: ${2:To pass this challenge}');
    });

    it("writes the selected snippet to the editor as snippet", () => {
      availableSnippetsView.selectListView.confirmSelection();

      expect(editor.getCursorScreenPosition()).toEqual([0, 18]);
      expect(editor.getSelectedText()).toBe('Test pass you will');
      expect(editor.lineTextForBufferRow(0)).toBe('Test pass you will, young var quicksort = function () {');
    });

    it("closes the dialog when triggered again", () => {
      atom.commands.dispatch(availableSnippetsView.selectListView.refs.queryEditor.element, 'snippets:available');
      expect(atom.workspace.getModalPanels().length).toBe(0);
    });
  });
});
