const getSuggestionsWithTreeSitter = require('./tree-sitter-provider')
const getSuggestionsWithTextMate = require('./text-mate-provider')

const provider = {
  selector: '.text.html',
  disableForSelector: '.text.html .comment',
  priority: 1,
  filterSuggestions: true,

  getSuggestions (request) {
    try {
      let languageMode = request.editor.getBuffer().getLanguageMode();
      if (languageMode.constructor.name === 'TreeSitterLanguageMode') {
        return getSuggestionsWithTreeSitter(request)
      } else {
        return getSuggestionsWithTextMate(request)
      }
    } catch(err) {
      // We avoid creating any actual error messages, as this is intended to fix
      // the case when providing completions for EJS that multiple continious
      // errors are created rapidly.
      // https://github.com/pulsar-edit/pulsar/issues/649
      console.error(err);
      return [];
    }
  },

  onDidInsertSuggestion ({editor, suggestion}) {
    if (suggestion.type === 'attribute') {
      setTimeout(this.triggerAutocomplete.bind(this, editor), 1)
    }
  },

  triggerAutocomplete (editor) {
    atom.commands.dispatch(
      editor.getElement(),
      'autocomplete-plus:activate',
      {activatedManually: false}
    )
  }
}

module.exports = {
  activate () {},
  getProvider () { return provider }
}
