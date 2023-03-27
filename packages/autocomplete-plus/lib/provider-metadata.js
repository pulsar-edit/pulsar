'use babel'

import { Selector } from 'selector-kit'
import { selectorForScopeChain, selectorsMatchScopeChain } from './scope-helpers'

export default class ProviderMetadata {
  constructor (provider, apiVersion) {
    this.provider = provider
    this.apiVersion = apiVersion

    // TODO API: remove this when 2.0 support is removed
    if (this.provider.selector != null) {
      this.scopeSelectors = Selector.create(this.provider.selector)
    } else {
      this.scopeSelectors = Selector.create(this.provider.scopeSelector)
    }

    // TODO API: remove this when 2.0 support is removed
    if (this.provider.disableForSelector != null) {
      this.disableForScopeSelectors = Selector.create(this.provider.disableForSelector)
    } else if (this.provider.disableForScopeSelector != null) {
      this.disableForScopeSelectors = Selector.create(this.provider.disableForScopeSelector)
    }

    // TODO API: remove this when 1.0 support is removed
    let providerBlacklist
    if (this.provider.providerblacklist && this.provider.providerblacklist['autocomplete-plus-fuzzyprovider']) {
      providerBlacklist = this.provider.providerblacklist['autocomplete-plus-fuzzyprovider']
    }
    if (providerBlacklist) {
      this.disableDefaultProviderSelectors = Selector.create(providerBlacklist)
    }
  }

  getLabels () {
    // The default label will let the provider be used for
    // the main text editors of the workspace.
    return this.provider.labels || ['workspace-center']
  }

  matchesScopeChain (scopeChain) {
    if (this.disableForScopeSelectors != null) {
      if (selectorsMatchScopeChain(this.disableForScopeSelectors, scopeChain)) { return false }
    }

    if (selectorsMatchScopeChain(this.scopeSelectors, scopeChain)) {
      return true
    } else {
      return false
    }
  }

  shouldDisableDefaultProvider (scopeChain) {
    if (this.disableDefaultProviderSelectors != null) {
      return selectorsMatchScopeChain(this.disableDefaultProviderSelectors, scopeChain)
    } else {
      return false
    }
  }

  getSpecificity (scopeChain) {
    const selector = selectorForScopeChain(this.scopeSelectors, scopeChain)
    if (selector) {
      return selector.getSpecificity()
    } else {
      return 0
    }
  }
}
