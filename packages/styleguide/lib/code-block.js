const {TextEditor} = require('atom')

const PROMISES_BY_SCOPE_NAME = new Map();

module.exports =
class CodeBlock {
  constructor(props) {
    this.editor = new TextEditor({readonly: true, keyboardInputEnabled: false})
    this.element = document.createElement('div')
    this.element.appendChild(this.editor.getElement())
    this.update(props)
    this.whenGrammarAdded(props.grammarScopeName)
      .then(() => {
        // We don't use the returned grammar here; instead we trigger logic
        // that matches up the grammars present right now with the user's
        // stated preferences for language mode (TextMate vs Tree-sitter).
        //
        // In other words: “Once any grammar for language X loads, wait another
        // second, then pick the language X grammar that best fits our needs.”
        atom.grammars.assignLanguageMode(this.editor, props.grammarScopeName)
      })
  }

  update({cssClass, code}) {
    this.editor.setText(code)
    this.element.classList.add(cssClass)
  }

  whenGrammarAdded(scopeName) {
    // Lots of these will fire at once for the same scope name; we want them
    // all to use the same promise.
    if (PROMISES_BY_SCOPE_NAME.has(scopeName)) {
      return PROMISES_BY_SCOPE_NAME.get(scopeName)
    }

    let grammar = atom.grammars.grammarForId(scopeName);
    if (grammar) return Promise.resolve(grammar);

    let promise = new Promise(resolve => {
      let disposable = atom.grammars.onDidAddGrammar(grammar => {
        if (grammar?.scopeName !== scopeName) return
        disposable.dispose()

        // If we resolve immediately, we might not get the right grammar for
        // the user's preferred language mode setting. A short pause will allow
        // all the grammars of a given language time to activate.
        //
        // This is how we balance assigning the grammar for the “wrong”
        // language mode… versus waiting for another one that may never arrive.
        setTimeout(resolve(grammar), 1000)
      })
    })

    PROMISES_BY_SCOPE_NAME.set(scopeName, promise)
    return promise
  }
}
