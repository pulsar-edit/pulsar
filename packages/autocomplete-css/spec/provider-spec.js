/* global waitsForPromise */
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const packagesToTest = {
  CSS: {
    name: 'language-css',
    file: 'test.css'
  },
  'CSS (tree-sitter)': {
    name: 'language-css',
    file: 'test.css',
    useTreeSitter: true
  },
  SCSS: {
    name: 'language-sass',
    file: 'test.scss'
  },
  Less: {
    name: 'language-less',
    file: 'test.less'
  },
  PostCSS: {
    name: 'language-postcss',
    file: 'test.postcss'
  }
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const whenEditorReady = function (editor) {
  const languageMode = editor.getBuffer().getLanguageMode();
  if (!languageMode.constructor.name.includes('TreeSitter')) {
    return Promise.resolve();
  }
  if (languageMode.tokenized) {
    return languageMode.atTransactionEnd();
  } else {
    return languageMode.ready;
  }
};

// Throughout the entirety of this test document there are many places that the
// original Atom tests would check for exact values of returned items such as
// matching properties or matching tags. But as the web changes this is
// combersome to maintain, to do Pulsar's best to avoid regressions in this aspect
// these locations will now check for more than the last good value.
// This of course assumes that the web won't start removing matching items faster
// than adding. But locations of this behavior will be marked accordingly with: #398
// https://github.com/pulsar-edit/pulsar/pull/398

Object.keys(packagesToTest).forEach(packageLabel => {
  if (!atom.packages.getAvailablePackageNames().includes(packagesToTest[packageLabel].name)) {
    console.warn(`Skipping tests for ${packageLabel} because it is not installed`);
    delete packagesToTest[packageLabel];
  }
});

describe("CSS property name and value autocompletions", async () => {
  let editor, provider;

  const getCompletions = (options = {}) => {
    const cursor = editor.getLastCursor();
    const start = cursor.getBeginningOfCurrentWordBufferPosition();
    const end = cursor.getBufferPosition();
    const prefix = editor.getTextInRange([start, end]);
    const request = {
      editor,
      bufferPosition: end,
      scopeDescriptor: cursor.getScopeDescriptor(),
      prefix,
      activatedManually: options.activatedManually != null ? options.activatedManually : true
    };
    return provider.getSuggestions(request);
  };

  const isValueInCompletions = (value, completions) => {
    const completionsNodesText = [];
    for (var completion of completions) {
      completionsNodesText.push(completion.text);
    }
    return completionsNodesText.includes(value);
  };

  beforeEach(() => {
    jasmine.useRealClock();
    waitsForPromise(() => atom.packages.activatePackage('autocomplete-css'));
    waitsForPromise(() => atom.packages.activatePackage('language-css')); // Used in all CSS languages

    runs(() => provider = atom.packages.getActivePackage('autocomplete-css').mainModule.getProvider());

    return waitsFor(() => Object.keys(provider.properties).length > 0);
  });

  Object.keys(packagesToTest).forEach(packageLabel =>
    describe(`${packageLabel} files`, async () => {
      let meta = packagesToTest[packageLabel];
      beforeEach(async () => {
        await atom.packages.activatePackage(packagesToTest[packageLabel].name);
        await atom.workspace.open(packagesToTest[packageLabel].file);
        editor = atom.workspace.getActiveTextEditor();
        await whenEditorReady(editor);
        atom.config.set('core.useTreeSitterParsers', meta.useTreeSitter ?? false);
      });

      it("returns tag completions when not in a property list", async () => {
        editor.setText('');
        expect(getCompletions()).toBe(null);

        editor.setText('d');
        editor.setCursorBufferPosition([0, 0]);
        expect(getCompletions()).toBe(null);

        editor.setCursorBufferPosition([0, 1]);
        const completions = getCompletions();
        expect(completions.length).toBeGreaterThan(9);  // #398
        for (let completion of completions) {
          expect(completion.text.length).toBeGreaterThan(0);
          expect(completion.type).toBe('tag');
        }
      });

      it("autocompletes property names without a prefix when activated manually", async () => {
        editor.setText(`\
body {

}\
`
        );
        editor.setCursorBufferPosition([1, 0]);
        await whenEditorReady(editor);
        console.warn('HERE', packageLabel);
        const completions = getCompletions({activatedManually: true});
        expect(completions.length).toBeGreaterThan(237);  // #398 Fun Fact last check this was 673
        for (let completion of completions) {
          expect(completion.text.length).toBeGreaterThan(0);
          expect(completion.type).toBe('property');
          expect(completion.descriptionMoreURL.length).toBeGreaterThan(0);
        }
      });

      it("does not autocomplete property names without a prefix when not activated manually", async () => {
        editor.setText(`\
body {

}\
`
        );
        editor.setCursorBufferPosition([1, 0]);
        await whenEditorReady(editor);
        const completions = getCompletions({activatedManually: false});
        expect(completions).toEqual([]);
    });

      it("autocompletes property names with a prefix", async () => {
        editor.setText(`\
body {
  d
}\
`
        );
        editor.setCursorBufferPosition([1, 3]);
        await whenEditorReady(editor);
        let completions = getCompletions();
        expect(isValueInCompletions('display: ', completions)).toBe(true);
        expect(isValueInCompletions('direction: ', completions)).toBe(true);

        // Then no matter what the top results are there's still some we can expect of them.
        expect(completions[0].type).toBe('property');
        expect(completions[0].replacementPrefix).toBe('d');
        expect(completions[0].description.length).toBeGreaterThan(0);
        expect(completions[0].descriptionMoreURL.length).toBeGreaterThan(0);
        expect(completions[1].type).toBe('property');
        expect(completions[1].replacementPrefix).toBe('d');

        editor.setText(`\
body {
  D
}\
`
        );
        editor.setCursorBufferPosition([1, 3]);
        await whenEditorReady(editor);
        completions = getCompletions();
        expect(completions.length).toBeGreaterThan(2);  // #398
        expect(isValueInCompletions('display: ', completions)).toBe(true);
        expect(isValueInCompletions('direction: ', completions)).toBe(true);

        expect(completions[1].replacementPrefix).toBe('D');

        editor.setText(`\
body {
  d:
}\
`
        );
        editor.setCursorBufferPosition([1, 3]);
        await whenEditorReady(editor);
        completions = getCompletions();
        expect(isValueInCompletions('display: ', completions)).toBe(true);
        expect(isValueInCompletions('direction: ', completions)).toBe(true);

        editor.setText(`\
body {
  bord
}\
`
        );
        editor.setCursorBufferPosition([1, 6]);
        await whenEditorReady(editor);
        completions = getCompletions();
        expect(isValueInCompletions('border: ', completions)).toBe(true);
        expect(completions[0].replacementPrefix).toBe('bord');
      });

      it("does not autocomplete when at a terminator", async () => {
        editor.setText(`\
body {
  .somemixin();
}\
`
        );
        editor.setCursorBufferPosition([1, 15]);
        await whenEditorReady(editor);
        const completions = getCompletions();
        expect(completions).toBe(null);
      });

      it("does not autocomplete property names when preceding a {", async () => {
        editor.setText(`\
body,{
}\
`
        );
        editor.setCursorBufferPosition([0, 5]);
        await whenEditorReady(editor);
        let completions = getCompletions();
        expect(completions).toBe(null);

        editor.setText(`\
body,{}\
`
        );
        editor.setCursorBufferPosition([0, 5]);
        await whenEditorReady(editor);
        completions = getCompletions();
        expect(completions).toBe(null);

        editor.setText(`\
body
{
}\
`
        );
        editor.setCursorBufferPosition([1, 0]);
        await whenEditorReady(editor);
        completions = getCompletions();
        expect(completions).toBe(null);
      });

      it("does not autocomplete property names when immediately after a }", async () => {
        editor.setText(`\
body{}\
`
        );
        editor.setCursorBufferPosition([0, 6]);
        await whenEditorReady(editor);
        let completions = getCompletions();
        expect(completions).toBe(null);

        editor.setText(`\
body{
}\
`
        );
        editor.setCursorBufferPosition([1, 1]);
        await whenEditorReady(editor);
        completions = getCompletions();
        expect(completions).toBe(null);
      });

      it("autocompletes property names when the cursor is up against the punctuation inside the property list", async () => {
        editor.setText(`\
body {
}\
`
        );
        editor.setCursorBufferPosition([0, 6]);
        await whenEditorReady(editor);
        let completions = getCompletions();
        expect(isValueInCompletions('width: ', completions)).toBe(true);

        editor.setText(`\
body {
}\
`
        );
        editor.setCursorBufferPosition([1, 0]);
        await whenEditorReady(editor);
        completions = getCompletions();
        expect(isValueInCompletions('width: ', completions)).toBe(true);

        editor.setText(`\
body { }\
`
        );
        editor.setCursorBufferPosition([0, 6]);
        await whenEditorReady(editor);
        completions = getCompletions();
        expect(isValueInCompletions('width: ', completions)).toBe(true);

        editor.setText(`\
body { }\
`
        );
        editor.setCursorBufferPosition([0, 7]);
        await whenEditorReady(editor);
        completions = getCompletions();
        expect(isValueInCompletions('width: ', completions)).toBe(true);
      });

      it("triggers autocomplete when an property name has been inserted", async () => {
        spyOn(atom.commands, 'dispatch');
        const suggestion = {type: 'property', text: 'whatever'};
        provider.onDidInsertSuggestion({editor, suggestion});
        await wait(10);
        // advanceClock(1);
        expect(atom.commands.dispatch).toHaveBeenCalled();

        const { args } = atom.commands.dispatch.mostRecentCall;
        expect(args[0].tagName.toLowerCase()).toBe('atom-text-editor');
        expect(args[1]).toBe('autocomplete-plus:activate');
      });

      it("autocompletes property values without a prefix", async () => {
        editor.setText(`\
body {
  display:
}\
`
        );
        editor.setCursorBufferPosition([1, 10]);
        await whenEditorReady(editor);
        let completions = getCompletions();
        expect(completions.length).toBeGreaterThan(24);  // #398
        for (var completion of Array.from(completions)) {
          expect(completion.text.length).toBeGreaterThan(0);
          expect(completion.description.length).toBeGreaterThan(0);
          expect(completion.descriptionMoreURL.length).toBeGreaterThan(0);
        }

        editor.setText(`\
body {
  display:

}\
`
        );
        editor.setCursorBufferPosition([2, 0]);
        await whenEditorReady(editor);
        completions = getCompletions();
        expect(completions.length).toBeGreaterThan(24);  // #398
        return (() => {
          const result = [];
          for (completion of Array.from(completions)) {
            result.push(expect(completion.text.length).toBeGreaterThan(0));
          }
          return result;
        })();
      });

      it("autocompletes property values with a prefix", async () => {
        editor.setText(`\
body {
  display: i
}\
`
        );
        editor.setCursorBufferPosition([1, 12]);
        await whenEditorReady(editor);
        let completions = getCompletions();
        expect(isValueInCompletions('inline;', completions)).toBe(true);
        expect(isValueInCompletions('inline-block;', completions)).toBe(true);
        expect(isValueInCompletions('inline-flex;', completions)).toBe(true);
        expect(isValueInCompletions('inline-grid;', completions)).toBe(true);
        expect(isValueInCompletions('inline-table;', completions)).toBe(true);
        expect(isValueInCompletions('inherit;', completions)).toBe(true);
        expect(completions[0].description.length).toBeGreaterThan(0);
        expect(completions[0].descriptionMoreURL.length).toBeGreaterThan(0);

        editor.setText(`\
body {
  display: I
}\
`
        );
        editor.setCursorBufferPosition([1, 12]);
        await whenEditorReady(editor);
        completions = getCompletions();
        expect(completions.length).toBeGreaterThan(6); // #398
        expect(isValueInCompletions('inline;', completions)).toBe(true);
        expect(isValueInCompletions('inline-block;', completions)).toBe(true);
        expect(isValueInCompletions('inline-flex;', completions)).toBe(true);
        expect(isValueInCompletions('inline-grid;', completions)).toBe(true);
        expect(isValueInCompletions('inline-table;', completions)).toBe(true);
        expect(isValueInCompletions('inherit;', completions)).toBe(true);

        editor.setText(`\
body {
  display:
    i
}\
`
        );
        editor.setCursorBufferPosition([2, 5]);
        await whenEditorReady(editor);
        completions = getCompletions();
        expect(isValueInCompletions('inline;', completions)).toBe(true);
        expect(isValueInCompletions('inline-block;', completions)).toBe(true);
        expect(isValueInCompletions('inline-flex;', completions)).toBe(true);
        expect(isValueInCompletions('inline-grid;', completions)).toBe(true);
        expect(isValueInCompletions('inline-table;', completions)).toBe(true);
        expect(isValueInCompletions('inherit;', completions)).toBe(true);

        editor.setText(`\
body {
  text-align:
}\
`
        );
        editor.setCursorBufferPosition([1, 13]);
        await whenEditorReady(editor);
        completions = getCompletions();
        expect(completions.length).toBeGreaterThan(5); // #398
        expect(isValueInCompletions('center;', completions)).toBe(true);
        expect(isValueInCompletions('left;', completions)).toBe(true);
        expect(isValueInCompletions('justify;', completions)).toBe(true);
        expect(isValueInCompletions('right;', completions)).toBe(true);
        expect(isValueInCompletions('inherit;', completions)).toBe(true);

        editor.setText(`\
body {
  text-align: c
}\
`
        );
        editor.setCursorBufferPosition([1, 15]);
        await whenEditorReady(editor);
        completions = getCompletions();
        expect(completions).toHaveLength(1);
        expect(completions[0].text).toBe('center;');
      });

      it("does not complete property values after percentage signs", async () => {
        editor.setText(`\
body {
  width: 100%
}\
`
        );
        editor.setCursorBufferPosition([1, 13]);
        await whenEditorReady(editor);
        const completions = getCompletions();
        expect(completions).toHaveLength(0);
      });

      it("it doesn't add semicolon after a property if one is already present", async () => {
        editor.setText(`\
body {
  display: i;
}\
`
        );
        editor.setCursorBufferPosition([1, 12]);
        await whenEditorReady(editor);
        const completions = getCompletions();
        completions.forEach(completion => expect(completion.text).not.toMatch(/;\s*$/));
      });

      it("autocompletes inline property values", async () => {
        editor.setText("body { display: }");
        editor.setCursorBufferPosition([0, 16]);
        await whenEditorReady(editor);
        let completions = getCompletions();
        expect(completions.length).toBeGreaterThan(24);  // #398
        expect(isValueInCompletions('block;', completions)).toBe(true);

        editor.setText(`\
body {
  display: block; float:
}\
`
        );
        editor.setCursorBufferPosition([1, 24]);
        await whenEditorReady(editor);
        completions = getCompletions();
        expect(completions.length).toBeGreaterThan(4);  // #398
        expect(isValueInCompletions('left;', completions)).toBe(true);
      });

      it("autocompletes more than one inline property value", async () => {
        editor.setText("body { display: block; float: }");
        editor.setCursorBufferPosition([0, 30]);
        await whenEditorReady(editor);
        let completions = getCompletions();
        expect(completions.length).toBeGreaterThan(4); // #398
        expect(isValueInCompletions('left;', completions)).toBe(true);

        editor.setText("body { display: block; float: left; cursor: alias; text-decoration: }");
        editor.setCursorBufferPosition([0, 68]);
        completions = getCompletions();
        await whenEditorReady(editor);
        expect(completions.length).toBeGreaterThan(5);  // #398
        expect(isValueInCompletions('line-through;', completions)).toBe(true);
      });

      it("autocompletes inline property values with a prefix", async () => {
        editor.setText("body { display: i }");
        editor.setCursorBufferPosition([0, 17]);
        await whenEditorReady(editor);
        let completions = getCompletions();
        expect(completions.length).toBeGreaterThan(6);  // #398
        expect(isValueInCompletions('inline;', completions)).toBe(true);
        expect(isValueInCompletions('inline-block;', completions)).toBe(true);
        expect(isValueInCompletions('inline-flex;', completions)).toBe(true);
        expect(isValueInCompletions('inline-grid;', completions)).toBe(true);
        expect(isValueInCompletions('inline-table;', completions)).toBe(true);
        expect(isValueInCompletions('inherit;', completions)).toBe(true);

        editor.setText("body { display: i}");
        editor.setCursorBufferPosition([0, 17]);
        await whenEditorReady(editor);
        completions = getCompletions();
        expect(completions.length).toBeGreaterThan(6); // #398
        expect(isValueInCompletions('inline;', completions)).toBe(true);
        expect(isValueInCompletions('inline-block;', completions)).toBe(true);
        expect(isValueInCompletions('inline-flex;', completions)).toBe(true);
        expect(isValueInCompletions('inline-grid;', completions)).toBe(true);
        expect(isValueInCompletions('inline-table;', completions)).toBe(true);
        expect(isValueInCompletions('inherit;', completions)).toBe(true);
      });

      it("autocompletes inline property values that aren't at the end of the line", async () => {
        editor.setText("body { float: display: inline; font-weight: bold; }");
        editor.setCursorBufferPosition([0, 14]); // right before display
        await whenEditorReady(editor);
        const completions = getCompletions();
        expect(completions.length).toBeGreaterThan(4);  // #398
        expect(isValueInCompletions('left;', completions)).toBe(true);
        expect(isValueInCompletions('right;', completions)).toBe(true);
        expect(isValueInCompletions('none;', completions)).toBe(true);
        expect(isValueInCompletions('inherit;', completions)).toBe(true);
      });

      it("autocompletes !important in property-value scope", async () => {
        editor.setText(`\
body {
  display: inherit !im
}\
`
        );
        editor.setCursorBufferPosition([1, 22]);
        await whenEditorReady(editor);
        const completions = getCompletions();

        let important = null;
        for (var c of Array.from(completions)) {
          if (c.displayText === '!important') { important = c; }
        }

        expect(important.displayText).toBe('!important');
      });

      it("does not autocomplete !important in property-name scope", async () => {
        editor.setText(`\
body {
  !im
}\
`
        );
        editor.setCursorBufferPosition([1, 5]);
        await whenEditorReady(editor);
        const completions = getCompletions();

        let important = null;
        for (var c of completions) {
          if (c.displayText === '!important') { important = c; }
        }

        expect(important).toBe(null);
      });

      describe("tags", async () => {
        it("autocompletes with a prefix", async () => {
          editor.setText(`\
ca {
}\
`
          );
          editor.setCursorBufferPosition([0, 2]);
          await whenEditorReady(editor);
          let completions = getCompletions();
          expect(completions.length).toBeGreaterThan(7); // #398
          expect(isValueInCompletions('canvas', completions)).toBe(true);
          expect(isValueInCompletions('code', completions)).toBe(true);

          expect(completions[0].type).toBe('tag');
          expect(completions[0].description.length).toBeGreaterThan(0);

          editor.setText(`\
canvas,ca {
}\
`
          );
          editor.setCursorBufferPosition([0, 9]);
          await whenEditorReady(editor);
          completions = getCompletions();
          expect(completions.length).toBeGreaterThan(7); // #398
          expect(completions[0].text).toBe('canvas');

          editor.setText(`\
canvas ca {
}\
`
          );
          editor.setCursorBufferPosition([0, 9]);
          await whenEditorReady(editor);
          completions = getCompletions();
          expect(completions.length).toBeGreaterThan(7); // #398
          expect(completions[0].text).toBe('canvas');

          editor.setText(`\
canvas, ca {
}\
`
          );
          editor.setCursorBufferPosition([0, 10]);
          await whenEditorReady(editor);
          completions = getCompletions();
          expect(completions.length).toBeGreaterThan(7); // #398
          expect(completions[0].text).toBe('canvas');
        });

        it("does not autocompletes when prefix is preceded by class or id char", async () => {
          editor.setText(`\
.ca {
}\
`
          );
          editor.setCursorBufferPosition([0, 3]);
          await whenEditorReady(editor);
          let completions = getCompletions();
          expect(completions).toBe(null);

          editor.setText(`\
#ca {
}\
`
          );
          editor.setCursorBufferPosition([0, 3]);
          completions = getCompletions();
          expect(completions).toBe(null);
        });
      });

      describe("pseudo selectors", async () => {
        it("autocompletes without a prefix", async () => {
          editor.setText(`\
div: {
}\
`
          );
          editor.setCursorBufferPosition([0, 4]);
          await whenEditorReady(editor);
          const completions = getCompletions();
          expect(completions.length).toBe(43);
          for (var completion of Array.from(completions)) {
            var text = (completion.text || completion.snippet);
            expect(text.length).toBeGreaterThan(0);
            expect(completion.type).toBe('pseudo-selector');
          }
        });

        // TODO: Enable these tests when we can enable autocomplete and test the
        // entire path.
        xit("autocompletes with a prefix", async () => {
          editor.setText(`\
div:f {
}\
`
          );
          editor.setCursorBufferPosition([0, 5]);
          await whenEditorReady(editor);
          const completions = getCompletions();
          expect(completions.length).toBeGreaterThan(5); // #398
          expect(completions[0].text).toBe(':first');
          expect(completions[0].type).toBe('pseudo-selector');
          expect(completions[0].description.length).toBeGreaterThan(0);
          expect(completions[0].descriptionMoreURL.length).toBeGreaterThan(0);
        });

        xit("autocompletes with arguments", async () => {
          editor.setText(`\
div:nth {
}\
`
          );
          editor.setCursorBufferPosition([0, 7]);
          await whenEditorReady(editor);
          const completions = getCompletions();
          expect(completions.length).toBeGreaterThan(4); // #398
          expect(completions[0].snippet).toBe(':nth-child(${1:an+b})');
          expect(completions[0].type).toBe('pseudo-selector');
          expect(completions[0].description.length).toBeGreaterThan(0);
          expect(completions[0].descriptionMoreURL.length).toBeGreaterThan(0);
        });

        xit("autocompletes when nothing precedes the colon", async () => {
          editor.setText(`\
:f {
}\
`
          );
          editor.setCursorBufferPosition([0, 2]);
          await whenEditorReady(editor);
          const completions = getCompletions();
          expect(completions.length).toBe(5);
          expect(completions[0].text).toBe(':first');
        });
      });
    })
  );

  Object.keys(packagesToTest).forEach(function (packageLabel) {
    if (packagesToTest[packageLabel].name !== 'language-css') {
      describe(`${packageLabel} files`, async () => {
        beforeEach(async () => {
          await atom.packages.activatePackage(packagesToTest[packageLabel].name);
          await atom.workspace.open(packagesToTest[packageLabel].file);
          editor = atom.workspace.getActiveTextEditor();
          // waitsForPromise(() => atom.packages.activatePackage(packagesToTest[packageLabel].name));
          // waitsForPromise(() => atom.workspace.open(packagesToTest[packageLabel].file));
          // return runs(() => editor = atom.workspace.getActiveTextEditor());
        });

        it("autocompletes tags and properties when nesting inside the property list", async () => {
          editor.setText(`\
.ca {
  di
}\
`
          );
          editor.setCursorBufferPosition([1, 4]);
          await whenEditorReady(editor);
          const completions = getCompletions();
          expect(isValueInCompletions('display: ', completions)).toBe(true);
          expect(isValueInCompletions('direction: ', completions)).toBe(true);
          expect(isValueInCompletions('div', completions)).toBe(true);
        });

        // FIXME: This is an issue with the grammar. It thinks nested
        // pseudo-selectors are meta.property-value.scss/less
        xit("autocompletes pseudo selectors when nested in LESS and SCSS files", async () => {
          editor.setText(`\
.some-class {
  .a:f
}\
`
          );
          editor.setCursorBufferPosition([1, 6]);
          await whenEditorReady(editor);
          const completions = getCompletions();
          expect(completions.length).toBe(5);
          expect(completions[0].text).toBe(':first');
        });

        it("does not show property names when in a class selector", async () => {
          editor.setText(`\
body {
  .a
}\
`
          );
          editor.setCursorBufferPosition([1, 4]);
          await whenEditorReady(editor);
          const completions = getCompletions();
          expect(completions).toBe(null);
        });

        it("does not show property names when in an id selector", async () => {
          editor.setText(`\
body {
  #a
}\
`
          );
          editor.setCursorBufferPosition([1, 4]);
          await whenEditorReady(editor);
          const completions = getCompletions();
          expect(completions).toBe(null);
        });

        it("does not show property names when in a parent selector", async () => {
          editor.setText(`\
body {
  &
}\
`
          );
          editor.setCursorBufferPosition([1, 4]);
          await whenEditorReady(editor);
          const completions = getCompletions();
          expect(completions).toBe(null);
        });

        it("does not show property names when in a parent selector with a prefix", async () => {
          editor.setText(`\
body {
  &a
}\
`
          );
          editor.setCursorBufferPosition([1, 4]);
          await whenEditorReady(editor);
          const completions = getCompletions();
          expect(completions).toBe(null);
        });
      });
    }
  });

  describe("SASS files", async () => {
    beforeEach(async () => {
      await atom.packages.activatePackage('language-sass');
      await atom.workspace.open('test.sass');
      editor = atom.workspace.getActiveTextEditor();
      // waitsForPromise(() => atom.packages.activatePackage('language-sass'));
      // waitsForPromise(() => atom.workspace.open('test.sass'));
      // return runs(() => editor = atom.workspace.getActiveTextEditor());
    });

    it("autocompletes property names with a prefix", async () => {
      editor.setText(`\
body
  d\
`
      );
      editor.setCursorBufferPosition([1, 3]);
      await whenEditorReady(editor);
      let completions = getCompletions();
      expect(isValueInCompletions('display: ', completions)).toBe(true);
      expect(isValueInCompletions('direction: ', completions)).toBe(true);

      expect(completions[0].type).toBe('property');
      expect(completions[0].replacementPrefix).toBe('d');
      expect(completions[0].description.length).toBeGreaterThan(0);
      expect(completions[0].descriptionMoreURL.length).toBeGreaterThan(0);

      expect(completions[1].type).toBe('property');
      expect(completions[1].replacementPrefix).toBe('d');

      editor.setText(`\
body
  D\
`
      );
      editor.setCursorBufferPosition([1, 3]);
      await whenEditorReady(editor);
      completions = getCompletions();
      expect(completions.length).toBeGreaterThan(11); // #398
      expect(isValueInCompletions('display: ', completions)).toBe(true);
      expect(isValueInCompletions('direction: ', completions)).toBe(true);

      expect(completions[1].replacementPrefix).toBe('D');

      editor.setText(`\
body
  d:\
`
      );
      editor.setCursorBufferPosition([1, 3]);
      await whenEditorReady(editor);
      completions = getCompletions();
      expect(isValueInCompletions('display: ', completions)).toBe(true);
      expect(isValueInCompletions('direction: ', completions)).toBe(true);

      editor.setText(`\
body
  bord\
`
      );
      editor.setCursorBufferPosition([1, 6]);
      await whenEditorReady(editor);
      completions = getCompletions();
      expect(isValueInCompletions('border: ', completions)).toBe(true);

      expect(completions[0].replacementPrefix).toBe('bord');
    });

    it("triggers autocomplete when an property name has been inserted", async () => {
      spyOn(atom.commands, 'dispatch');
      const suggestion = {type: 'property', text: 'whatever'};
      provider.onDidInsertSuggestion({editor, suggestion});

      await wait(10);
      // advanceClock(1);
      expect(atom.commands.dispatch).toHaveBeenCalled();

      const { args } = atom.commands.dispatch.mostRecentCall;
      expect(args[0].tagName.toLowerCase()).toBe('atom-text-editor');
      expect(args[1]).toBe('autocomplete-plus:activate');
    });

    it("autocompletes property values without a prefix", async () => {
      editor.setText(`\
body
  display:\
`
      );
      editor.setCursorBufferPosition([1, 10]);
      await whenEditorReady(editor);
      let completions = getCompletions();
      expect(completions.length).toBeGreaterThan(24);  // #398
      for (var completion of Array.from(completions)) {
        expect(completion.text.length).toBeGreaterThan(0);
        expect(completion.description.length).toBeGreaterThan(0);
        expect(completion.descriptionMoreURL.length).toBeGreaterThan(0);
      }

      editor.setText(`\
body
  display:\
`
      );
      editor.setCursorBufferPosition([2, 0]);
      await whenEditorReady(editor);
      completions = getCompletions();
      expect(completions.length).toBeGreaterThan(24);  // #398
      return (() => {
        const result = [];
        for (completion of Array.from(completions)) {
          result.push(expect(completion.text.length).toBeGreaterThan(0));
        }
        return result;
      })();
    });

    it("autocompletes property values with a prefix", async () => {
      editor.setText(`\
body
  display: i\
`
      );
      editor.setCursorBufferPosition([1, 12]);
      await whenEditorReady(editor);
      let completions = getCompletions();

      expect(isValueInCompletions('inline', completions)).toBe(true);
      expect(isValueInCompletions('inline-block', completions)).toBe(true);
      expect(isValueInCompletions('inline-flex', completions)).toBe(true);
      expect(isValueInCompletions('inline-grid', completions)).toBe(true);
      expect(isValueInCompletions('inline-table', completions)).toBe(true);
      expect(isValueInCompletions('inherit', completions)).toBe(true);

      expect(completions[0].description.length).toBeGreaterThan(0);
      expect(completions[0].descriptionMoreURL.length).toBeGreaterThan(0);

      editor.setText(`\
body
  display: I\
`
      );
      editor.setCursorBufferPosition([1, 12]);
      await whenEditorReady(editor);
      completions = getCompletions();
      expect(completions.length).toBeGreaterThan(6); // #398

      expect(isValueInCompletions('inline', completions)).toBe(true);
      expect(isValueInCompletions('inline-block', completions)).toBe(true);
      expect(isValueInCompletions('inline-flex', completions)).toBe(true);
      expect(isValueInCompletions('inline-grid', completions)).toBe(true);
      expect(isValueInCompletions('inline-table', completions)).toBe(true);
      expect(isValueInCompletions('inherit', completions)).toBe(true);
    });

    it("autocompletes !important in property-value scope", async () => {
      editor.setText(`\
body
  display: inherit !im\
`
      );
      editor.setCursorBufferPosition([1, 22]);
      await whenEditorReady(editor);
      const completions = getCompletions();

      let important = null;
      for (var c of Array.from(completions)) {
        if (c.displayText === '!important') { important = c; }
      }

      expect(important.displayText).toBe('!important');
    });

    it("does not autocomplete when indented and prefix is not a char", async () => {
      editor.setText(`\
body
  .\
`
      );
      editor.setCursorBufferPosition([1, 3]);
      await whenEditorReady(editor);
      let completions = getCompletions({activatedManually: false});
      expect(completions).toBe(null);

      editor.setText(`\
body
  #\
`
      );
      editor.setCursorBufferPosition([1, 3]);
      await whenEditorReady(editor);
      completions = getCompletions({activatedManually: false});
      expect(completions).toBe(null);

      editor.setText(`\
body
  .foo,\
`
      );
      editor.setCursorBufferPosition([1, 7]);
      await whenEditorReady(editor);
      completions = getCompletions({activatedManually: false});
      expect(completions).toBe(null);

      editor.setText(`\
body
  foo -\
`
      );
      editor.setCursorBufferPosition([1, 8]);
      await whenEditorReady(editor);
      completions = getCompletions({activatedManually: false});
      expect(completions).toBe(null);

      // As spaces at end of line will be removed, we'll test with a char
      // after the space and with the cursor before that char.
      editor.setCursorBufferPosition([1, 7]);
      await whenEditorReady(editor);
      completions = getCompletions({activatedManually: false});
      expect(completions).toBe(null);
    });

    it('does not autocomplete when inside a nth-child selector', async () => {
      editor.setText(`\
body
  &:nth-child(4\
`
      );
      editor.setCursorBufferPosition([1, 15]);
      await whenEditorReady(editor);
      const completions = getCompletions({activatedManually: false});
      expect(completions).toBe(null);
    });

    it('autocompletes a property name with a dash', async () => {
      editor.setText(`\
body
  border-\
`
      );
      editor.setCursorBufferPosition([1, 9]);
      await whenEditorReady(editor);
      const completions = getCompletions({activatedManually: false});
      expect(completions).not.toBe(null);

      expect(isValueInCompletions('border: ', completions)).toBe(true);
      expect(isValueInCompletions('border-radius: ', completions)).toBe(true);

      expect(completions[0].replacementPrefix).toBe('border-');

      expect(completions[1].replacementPrefix).toBe('border-');
    });

    it("does not autocomplete !important in property-name scope", async () => {
      editor.setText(`\
body {
  !im
}\
`
      );
      editor.setCursorBufferPosition([1, 5]);
      await whenEditorReady(editor);
      const completions = getCompletions();

      let important = null;
      for (let c of Array.from(completions)) {
        if (c.displayText === '!important') { important = c; }
      }

      expect(important).toBe(null);
    });

    describe("tags", async () => {
      it("autocompletes with a prefix", async () => {
        editor.setText(`\
ca\
`
        );
        editor.setCursorBufferPosition([0, 2]);
        await whenEditorReady(editor);
        let completions = getCompletions();
        expect(completions.length).toBeGreaterThan(7); // #398
        expect(isValueInCompletions('canvas', completions)).toBe(true);
        expect(isValueInCompletions('code', completions)).toBe(true);

        expect(completions[0].type).toBe('tag');
        expect(completions[0].description.length).toBeGreaterThan(0);

        editor.setText(`\
canvas,ca\
`
        );
        editor.setCursorBufferPosition([0, 9]);
        await whenEditorReady(editor);
        completions = getCompletions();
        expect(completions.length).toBeGreaterThan(7); // #398
        expect(completions[0].text).toBe('canvas');

        editor.setText(`\
canvas ca\
`
        );
        editor.setCursorBufferPosition([0, 9]);
        await whenEditorReady(editor);
        completions = getCompletions();
        expect(completions.length).toBeGreaterThan(7); // #398
        expect(completions[0].text).toBe('canvas');

        editor.setText(`\
canvas, ca\
`
        );
        editor.setCursorBufferPosition([0, 10]);
        await whenEditorReady(editor);
        completions = getCompletions();
        expect(completions.length).toBeGreaterThan(7); // #398
        expect(completions[0].text).toBe('canvas');
      });

      it("does not autocomplete when prefix is preceded by class or id char", async () => {
        editor.setText(`\
.ca\
`
        );
        editor.setCursorBufferPosition([0, 3]);
        await whenEditorReady(editor);
        let completions = getCompletions();
        expect(completions).toBe(null);

        editor.setText(`\
#ca\
`
        );
        editor.setCursorBufferPosition([0, 3]);
        await whenEditorReady(editor);
        completions = getCompletions();
        expect(completions).toBe(null);
      });
    });

    describe("pseudo selectors", () => {
      it("autocompletes without a prefix", async () => {
        editor.setText(`\
div:\
`
        );
        editor.setCursorBufferPosition([0, 4]);
        await whenEditorReady(editor);
        const completions = getCompletions();
        expect(completions.length).toBe(43);
        for (var completion of Array.from(completions)) {
          var text = (completion.text || completion.snippet);
          expect(text.length).toBeGreaterThan(0);
          expect(completion.type).toBe('pseudo-selector');
        }
      });
    });
  });
});
