const { Point, Task } = require('atom');
const util = require('util');
const ctags = require('ctags');
const getTagsFile = require('./get-tags-file');
const _ = require('underscore-plus');

let handlerPath = require.resolve('./load-tags-handler');

let findTagsWithPromise = util.promisify(ctags.findTags).bind(ctags);

function wordAtCursor(text, cursorIndex, wordSeparator, noStripBefore) {
  const beforeCursor = text.slice(0, cursorIndex);
  const afterCursor = text.slice(cursorIndex);

  const beforeCursorWordBegins = noStripBefore ? 0 :
    beforeCursor.lastIndexOf(wordSeparator) + 1;
  let afterCursorWordEnds = afterCursor.indexOf(wordSeparator);
  if (afterCursorWordEnds === -1) {
    afterCursorWordEnds = afterCursor.length;
  }

  return beforeCursor.slice(beforeCursorWordBegins) +
    afterCursor.slice(0, afterCursorWordEnds);
}

module.exports = {
  async find(editor) {
    let symbol = editor.getSelectedText();
    let symbols = [];

    if (symbol) symbols.push(symbol);

    if (!symbols.length) {
      let nonWordCharacters;
      let cursor = editor.getLastCursor();
      let cursorPosition = cursor.getBufferPosition();
      let scope = cursor.getScopeDescriptor();
      const rubyScopes = scope.getScopesArray().filter(s => /^source\.ruby($|\.)/.test(s));

      let hasRubyScope = rubyScopes.length > 0;

      let wordRegExp = cursor.wordRegExp();
      if (hasRubyScope) {
        nonWordCharacters = atom.config.get('editor.nonWordCharacters', { scope });
        nonWordCharacters = nonWordCharacters.replace(/:/g, '');
        wordRegExp = new RegExp(
          `[^\\s${_.escapeRegExp(nonWordCharacters)}]+([!?]|\\s*=>?)?|[<=>]+`,
          'g'
        );
      }

      let addSymbol = (symbol) => {
        if (hasRubyScope) {
          // Normalize assignment syntax
          if (/\s+=?$/.test(symbol)) {
            symbols.push(symbol.replace(/\s+=$/, '='));
          }
          // Strip away assignment & hashrocket syntax
          symbols.push(symbol.replace(/\s+=>?$/, ''));
        } else {
          symbols.push(symbol);
        }
      };

      // Can't use `getCurrentWordBufferRange` here because we want to select
      // the last match of the potential 2 matches under cursor.
      editor.scanInBufferRange(wordRegExp, cursor.getCurrentLineBufferRange(), ({range, match}) => {
        if (range.containsPoint(cursorPosition)) {
          symbol = match[0];
          if (rubyScopes.length && symbol.indexOf(':') > -1) {
            const cursorWithinSymbol = cursorPosition.column - range.start.column;
            // Add fully-qualified ruby constant up until the cursor position
            addSymbol(wordAtCursor(symbol, cursorWithinSymbol, ':', true));
            // Additionally, also look up the bare word under cursor
            addSymbol(wordAtCursor(symbol, cursorWithinSymbol, ':'));
          } else {
            addSymbol(symbol);
          }
        }
      });
    }

    if (symbols.length === 0) return [];

    let results = [];
    for (let projectPath of atom.project.getPaths()) {
      let tagsFile = getTagsFile(projectPath);
      if (!tagsFile) continue;

      for (let symbol of symbols) {
        let tags;
        try {
          tags = await findTagsWithPromise(tagsFile, symbol);
          if (!tags) tags = [];
        } catch (err) {
          continue;
        }
        if (tags.length === 0) continue;

        for (let tag of [...tags]) {
          tag.directory = projectPath;
        }

        results.push(...tags);
      }
    }
    return results;
  },

  getAllTags() {
    let projectTags = [];
    return new Promise(resolve => {
      let task = Task.once(
        handlerPath,
        atom.project.getPaths(),
        () => {
          resolve(projectTags);
        }
      );

      task.on('tags', tags => {
        for (let tag of tags) {
          if (tag.lineNumber) {
            tag.position = new Point(tag.lineNumber - 1, 0);
          }
        }
        projectTags.push(...tags);
      });
    });
  },
};
