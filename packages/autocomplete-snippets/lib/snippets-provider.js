module.exports =
class SnippetsProvider {
  constructor() {
    this.selector = '*'
    this.inclusionPriority = 1
    this.suggestionPriority = 2
    this.filterSuggestions = true

    this.showIcon = true
    this.snippetsSource = {
      snippetsForScopes(scopeDescriptor) {
        return atom.config.get('snippets', {scope: scopeDescriptor})
      }
    }
  }

  setSnippetsSource(snippetsSource) {
    if (typeof (snippetsSource != null ? snippetsSource.snippetsForScopes : undefined) === "function") {
      return this.snippetsSource = snippetsSource
    }
  }

  getSuggestions({scopeDescriptor, prefix}) {
    if (!(prefix != null ? prefix.length : undefined)) { return }
    const scopeSnippets = this.snippetsSource.snippetsForScopes(scopeDescriptor)
    return this.findSuggestionsForPrefix(scopeSnippets, prefix)
  }

  findSuggestionsForPrefix(snippets, prefix) {
    if (snippets == null) { return [] }

    const suggestions = []
    for (let snippetPrefix in snippets) {
      const snippet = snippets[snippetPrefix]
      if (!snippet || !snippetPrefix || !prefix || !firstCharsEqual(snippetPrefix, prefix)) { continue }
      suggestions.push({
        iconHTML: this.showIcon ? undefined : false,
        type: 'snippet',
        text: snippet.prefix,
        replacementPrefix: prefix,
        rightLabel: snippet.name,
        rightLabelHTML: snippet.rightLabelHTML,
        leftLabel: snippet.leftLabel,
        leftLabelHTML: snippet.leftLabelHTML,
        description: snippet.description,
        descriptionMoreURL: snippet.descriptionMoreURL
      })
    }

    suggestions.sort(ascendingPrefixComparator)
    return suggestions
  }

  onDidInsertSuggestion({editor}) {
    return atom.commands.dispatch(atom.views.getView(editor), 'snippets:expand')
  }
}

const ascendingPrefixComparator = (a, b) => a.text.localeCompare(b.text)

const firstCharsEqual = (str1, str2) => str1[0].toLowerCase() === str2[0].toLowerCase()
