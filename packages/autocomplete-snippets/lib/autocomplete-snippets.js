module.exports = {
  provider: null,

  activate() {},

  deactivate() {
    this.provider = null
  },

  provide() {
    if (this.provider == null) {
      const SnippetsProvider = require('./snippets-provider')
      this.provider = new SnippetsProvider()
      if (this.snippets != null) {
        this.provider.setSnippetsSource(this.snippets)
      }
    }

    return this.provider
  },

  consumeSnippets(snippets) {
    this.snippets = snippets
    return (this.provider != null ? this.provider.setSnippetsSource(this.snippets) : undefined)
  }
}
