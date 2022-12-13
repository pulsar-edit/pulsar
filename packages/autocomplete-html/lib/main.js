const getSuggestionsWithTreeSitter = require('./tree-sitter-provider')
const getSuggestionsWithTextMate = require('./text-mate-provider')

const provider = {
  selector: '.text.html',
  disableForSelector: '.text.html .comment',
  priority: 1,
  filterSuggestions: true,

  getSuggestions (request) {
    if (request.editor.getBuffer().getLanguageMode().tree) {
      return getSuggestionsWithTreeSitter(request)
    } else {
      return getSuggestionsWithTextMate(request)
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
