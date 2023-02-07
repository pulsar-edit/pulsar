const {CompositeDisposable, Disposable} = require('atom')
const {isFunction, isString} = require('./type-helpers')
const {Selector} = require('selector-kit')
const stableSort = require('stable')
const grim = require('grim')
const {selectorsMatchScopeChain} = require('./scope-helpers')
const {API_VERSION} = require('./private-symbols')
const SubsequenceProvider = require('./subsequence-provider')
const ProviderMetadata = require('./provider-metadata')

module.exports =
class ProviderManager {
  constructor () {
    this.defaultProvider = null
    this.defaultProviderRegistration = null
    this.providers = new Map()
    this.store = null
    this.subscriptions = null
    this.globalBlacklist = null
    this.applicableProviders = this.applicableProviders.bind(this)
    this.toggleDefaultProvider = this.toggleDefaultProvider.bind(this)
    this.setGlobalBlacklist = this.setGlobalBlacklist.bind(this)
    this.metadataForProvider = this.metadataForProvider.bind(this)
    this.apiVersionForProvider = this.apiVersionForProvider.bind(this)
    this.addProvider = this.addProvider.bind(this)
    this.removeProvider = this.removeProvider.bind(this)
    this.registerProvider = this.registerProvider.bind(this)
  }

  initialize () {
    this.subscriptions = new CompositeDisposable()
    this.globalBlacklist = new CompositeDisposable()
    this.subscriptions.add(this.globalBlacklist)

    this.subscriptions.add(atom.config.observe('autocomplete-plus.enableBuiltinProvider', value => this.toggleDefaultProvider(value)))
    this.subscriptions.add(atom.config.observe('autocomplete-plus.scopeBlacklist', value => this.setGlobalBlacklist(value)))
  }

  dispose () {
    this.toggleDefaultProvider(false)
    if (this.subscriptions && this.subscriptions.dispose) {
      this.subscriptions.dispose()
    }
    this.subscriptions = null
    this.globalBlacklist = null
    this.providers = null
  }

  applicableProviders (labels, scopeDescriptor) {
    let providers = this.getProvidersForLabels(labels)
    providers = this.filterProvidersByScopeDescriptor(providers, scopeDescriptor)
    providers = this.sortProviders(providers, scopeDescriptor)
    providers = this.filterProvidersByExcludeLowerPriority(providers)
    return this.removeMetadata(providers)
  }

  getProvidersForLabels (labels) {
    let result = new Set()
    for (let label of labels) {
      if (this.providers.has(label)) {
        this.providers.get(label).forEach(result.add.bind(result))
      }
    }
    return Array.from(result)
  }

  filterProvidersByScopeDescriptor (providers, scopeDescriptor) {
    const scopeChain = scopeChainForScopeDescriptor(scopeDescriptor)
    if (!scopeChain) { return [] }
    if ((this.globalBlacklistSelectors != null) && selectorsMatchScopeChain(this.globalBlacklistSelectors, scopeChain)) { return [] }

    const matchingProviders = []
    let disableDefaultProvider = false
    let defaultProviderMetadata = null
    for (let i = 0; i < providers.length; i++) {
      const providerMetadata = providers[i]
      const {provider} = providerMetadata
      if (provider === this.defaultProvider) {
        defaultProviderMetadata = providerMetadata
      }
      if (providerMetadata.matchesScopeChain(scopeChain)) {
        matchingProviders.push(providerMetadata)
        if (providerMetadata.shouldDisableDefaultProvider(scopeChain)) {
          disableDefaultProvider = true
        }
      }
    }

    if (disableDefaultProvider) {
      const index = matchingProviders.indexOf(defaultProviderMetadata)
      if (index > -1) { matchingProviders.splice(index, 1) }
    }
    return matchingProviders
  }

  sortProviders (providers, scopeDescriptor) {
    const scopeChain = scopeChainForScopeDescriptor(scopeDescriptor)
    return stableSort(providers, (providerA, providerB) => {
      const priorityA = providerA.provider.suggestionPriority != null ? providerA.provider.suggestionPriority : 1
      const priorityB = providerB.provider.suggestionPriority != null ? providerB.provider.suggestionPriority : 1
      let difference = priorityB - priorityA
      if (difference === 0) {
        const specificityA = providerA.getSpecificity(scopeChain)
        const specificityB = providerB.getSpecificity(scopeChain)
        difference = specificityB - specificityA
      }
      return difference
    }
    )
  }

  filterProvidersByExcludeLowerPriority (providers) {
    let lowestAllowedPriority = 0
    for (let i = 0; i < providers.length; i++) {
      const providerMetadata = providers[i]
      const {provider} = providerMetadata
      if (provider.excludeLowerPriority) {
        lowestAllowedPriority = Math.max(lowestAllowedPriority, provider.inclusionPriority != null ? provider.inclusionPriority : 0)
      }
    }
    return providers.filter((providerMetadata) => (providerMetadata.provider.inclusionPriority != null ? providerMetadata.provider.inclusionPriority : 0) >= lowestAllowedPriority).map((providerMetadata) => providerMetadata)
  }

  removeMetadata (providers) {
    return providers.map(providerMetadata => providerMetadata.provider)
  }

  toggleDefaultProvider (enabled) {
    if (enabled == null) return

    if (enabled) {
      if (this.defaultProvider != null || this.defaultProviderRegistration != null) return
      this.defaultProvider = new SubsequenceProvider()
      this.defaultProviderRegistration = this.registerProvider(this.defaultProvider, this.defaultProvider.apiVersion)
    } else {
      if (this.defaultProviderRegistration) this.defaultProviderRegistration.dispose()
      if (this.defaultProvider) this.defaultProvider.dispose()
      this.defaultProviderRegistration = null
      this.defaultProvider = null
    }
  }

  setGlobalBlacklist (globalBlacklist) {
    this.globalBlacklistSelectors = null
    if (globalBlacklist && globalBlacklist.length) {
      this.globalBlacklistSelectors = Selector.create(globalBlacklist)
    }
  }

  isValidProvider (provider, apiVersion) {
    if (apiVersion >= 2) {
      return (provider != null) &&
      isFunction(provider.getSuggestions) &&
      ((isString(provider.selector) && !!provider.selector.length) ||
       (isString(provider.scopeSelector) && !!provider.scopeSelector.length))
    } else {
      return (provider != null) && isFunction(provider.requestHandler) && isString(provider.selector) && !!provider.selector.length
    }
  }

  metadataForProvider (provider) {
    for (let providers of this.providers.values()) {
      for (let i = 0; i < providers.length; i++) {
        const providerMetadata = providers[i]
        if (providerMetadata.provider === provider) { return providerMetadata }
      }
    }
    return null
  }

  apiVersionForProvider (provider) {
    if (this.metadataForProvider(provider) && this.metadataForProvider(provider).apiVersion) {
      return this.metadataForProvider(provider).apiVersion
    }
  }

  isProviderRegistered (provider) {
    return (this.metadataForProvider(provider) != null)
  }

  addProvider (provider, apiVersion = 3) {
    if (this.isProviderRegistered(provider)) { return }
    let providerMetadata = new ProviderMetadata(provider, apiVersion)
    let labels = providerMetadata.getLabels()
    for (var label of labels) {
      if (!this.providers.has(label)) {
        this.providers.set(label, [])
      }
      this.providers.get(label).push(providerMetadata)
    }
    if (provider.dispose != null) { return this.subscriptions.add(provider) }
  }

  removeProvider (provider) {
    if (!this.providers) { return }
    for (let providers of this.providers.values()) {
      for (let i = 0; i < providers.length; i++) {
        const providerMetadata = providers[i]
        if (providerMetadata.provider === provider) {
          providers.splice(i, 1)
          break
        }
      }
    }
    if (provider.dispose != null) {
      if (this.subscriptions) {
        this.subscriptions.remove(provider)
      }
    }
  }

  registerProvider (provider, apiVersion = 3) {
    if (provider == null) { return }

    provider[API_VERSION] = apiVersion

    switch (apiVersion) {
      case 2:
        if ((provider.id != null) && provider !== this.defaultProvider) {
          grim.deprecate(`Autocomplete provider '${provider.constructor.name}(${provider.id})'
  contains an \`id\` property.
  An \`id\` attribute on your provider is no longer necessary.
  See https://github.com/atom/autocomplete-plus/wiki/Provider-API`
          )
        }
        if (provider.requestHandler != null) {
          grim.deprecate(`Autocomplete provider '${provider.constructor.name}(${provider.id})'
  contains a \`requestHandler\` property.
  \`requestHandler\` has been renamed to \`getSuggestions\`.
  See https://github.com/atom/autocomplete-plus/wiki/Provider-API`
          )
        }
        if (provider.blacklist != null) {
          grim.deprecate(`Autocomplete provider '${provider.constructor.name}(${provider.id})'
  contains a \`blacklist\` property.
  \`blacklist\` has been renamed to \`disableForScopeSelector\`.
  See https://github.com/atom/autocomplete-plus/wiki/Provider-API`
          )
        }
        break
      case 3:
        if (provider.selector != null) {
          throw new Error(`Autocomplete provider '${provider.constructor.name}(${provider.id})'
  specifies \`selector\` instead of the \`scopeSelector\` attribute.
  See https://github.com/atom/autocomplete-plus/wiki/Provider-API.`)
        }

        if (provider.disableForSelector != null) {
          throw new Error(`Autocomplete provider '${provider.constructor.name}(${provider.id})'
  specifies \`disableForSelector\` instead of the \`disableForScopeSelector\`
  attribute.
  See https://github.com/atom/autocomplete-plus/wiki/Provider-API.`)
        }
        break
    }

    if (!this.isValidProvider(provider, apiVersion)) {
      console.warn(`Provider ${provider.constructor.name} is not valid`, provider)
      return new Disposable()
    }

    if (this.isProviderRegistered(provider)) { return }

    this.addProvider(provider, apiVersion)

    const disposable = new Disposable(() => {
      this.removeProvider(provider)
    })

    // When the provider is disposed, remove its registration
    const originalDispose = provider.dispose
    if (originalDispose) {
      provider.dispose = () => {
        originalDispose.call(provider)
        disposable.dispose()
      }
    }

    return disposable
  }
}

const scopeChainForScopeDescriptor = (scopeDescriptor) => {
  // TODO: most of this is temp code to understand #308
  const type = typeof scopeDescriptor
  let hasScopeChain = false
  if (type === 'object' && scopeDescriptor && scopeDescriptor.getScopeChain) {
    hasScopeChain = true
  }
  if (type === 'string') {
    return scopeDescriptor
  } else if (type === 'object' && hasScopeChain) {
    const scopeChain = scopeDescriptor.getScopeChain()
    if ((scopeChain != null) && (scopeChain.replace == null)) {
      const json = JSON.stringify(scopeDescriptor)
      throw new Error(`01: ScopeChain is not correct type: ${type}; ${json}`)
    }
    return scopeChain
  } else {
    const json = JSON.stringify(scopeDescriptor)
    throw new Error(`02: ScopeChain is not correct type: ${type}; ${json}`)
  }
}
