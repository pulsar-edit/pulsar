const MatchManager = require("./match-manager");
const BracketMatcherView = require("./bracket-matcher-view");
const BracketMatcher = require("./bracket-matcher");
const { Emitter } = require("atom");

const editorViews = new WeakMap();

module.exports = {
  activate() {
    this.matchEmitter = new Emitter();

    // Observe every registered text editor, not just workspace panes, so
    // brackets match in editors embedded in docks, panels, and dialogs.
    atom.textEditors.observe((editor) => {
      const editorElement = atom.views.getView(editor);
      const matchManager = new MatchManager(editor, editorElement);
      const view = new BracketMatcherView(editor, editorElement, matchManager);
      editorViews.set(editor, view);
      view.onDidChangeMatch(() => this.matchEmitter.emit("did-change-match", editor));
      new BracketMatcher(editor, editorElement, matchManager);
    });
  },

  deactivate() {
    this.matchEmitter.dispose();
  },

  provideBracketMatcher() {
    const api = {
      getMatchRanges(editor) {
        const view = editorViews.get(editor);
        if (!view || !view.pairHighlighted) return null;
        if (view.bracket1Range && view.bracket2Range) {
          return { range1: view.bracket1Range, range2: view.bracket2Range };
        }
        if (view.startMarker) {
          return {
            range1: view.startMarker.getBufferRange(),
            range2: view.endMarker.getBufferRange(),
          };
        }
        return null;
      },
      observe: (callback) => {
        return this.matchEmitter.on("did-change-match", (editor) => {
          callback(editor, api.getMatchRanges(editor));
        });
      },
    };
    return api;
  },
};
