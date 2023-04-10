const {CompositeDisposable} = require('atom')
const AutocompleteManager = require('./autocomplete-manager')

module.exports = {
  subscriptions: null,
  autocompleteManager: new AutocompleteManager(),

  // Public: Creates AutocompleteManager instances for all active and future editors (soon, just a single AutocompleteManager)
  activate () {
    this.subscriptions = new CompositeDisposable()
    if (!this.autocompleteManager) this.autocompleteManager = new AutocompleteManager()
    this.subscriptions.add(this.autocompleteManager)
    this.autocompleteManager.initialize()
  },

  // Public: Cleans everything up, removes all AutocompleteManager instances
  deactivate () {
    if (this.subscriptions) {
      this.subscriptions.dispose()
    }
    this.subscriptions = null
    this.autocompleteManager = null
  },

  provideWatchEditor () {
    return this.autocompleteManager.watchEditor.bind(this.autocompleteManager)
  },

  consumeSnippets (snippetsManager) {
    this.autocompleteManager.setSnippetsManager(snippetsManager)
  },

  /*
  Section: Provider API
  */

  // 1.0.0 API
  // service - {provider: provider1}
  consumeProvider_1 (service) {
    if (!service || !service.provider) {
      return
    }
    return this.consumeProvider([service.provider], 1)
  },

  // 1.1.0 API
  // service - {providers: [provider1, provider2, ...]}
  consumeProvider_1_1 (service) {
    if (!service || !service.providers) {
      return
    }
    return this.consumeProvider(service.providers, 1)
  },

  // 2.0.0 API
  consumeProvider_2 (providers) {
    return this.consumeProvider(providers, 2)
  },

  // 3.0.0 API
  consumeProvider_3 (providers) {
    return this.consumeProvider(providers, 3)
  },

  // 4.0.0 API – Simplifies prefix computation
  consumeProvider_4 (providers) {
    return this.consumeProvider(providers, 4)
  },

  consumeProvider (providers, apiVersion = 3) {
    if (!providers) {
      return
    }
    if (providers && !Array.isArray(providers)) {
      providers = [providers]
    }
    if (!providers.length > 0) {
      return
    }

    const registrations = new CompositeDisposable()
    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i]
      registrations.add(this.autocompleteManager.providerManager.registerProvider(provider, apiVersion))
    }
    return registrations
  }
}
