const { CompositeDisposable, Emitter } = require('atom');
const Config = require('./config');

/**
 * An error thrown when a newly added symbol provider does not conform to its
 * contract.
 *
 * @extends Error
 */
class InvalidProviderError extends Error {
  constructor(faults, provider) {
    let packageName = provider.packageName ?
      `the ${provider.packageName} provider`
      : 'a symbol provider';
    let message = `symbols-view failed to consume ${packageName} because certain properties are invalid: ${faults.join(', ')}. Please fix these faults or contact the package author.`;
    super(message);
    this.name = 'InvalidProviderError';
  }
}

/**
 * A class that keeps track of various symbol providers and selects which ones
 * should respond for a given request.
 *
 * @type {ProviderBroker}
 * @class
 */
module.exports = class ProviderBroker {
  constructor() {
    this.providers = [];
    this.providerSubscriptions = new Map();
    this.subscriptions = new CompositeDisposable();
    this.emitter = new Emitter();
  }

  /**
   * Add one or more symbol providers.
   *
   * @param {SymbolProvider[]} providers Any number of symbol providers.
   */
  add(...providers) {
    for (let provider of providers) {
      try {
        this.validateSymbolProvider(provider);
      } catch (err) {
        console.warn(err.message);
        continue;
      }
      this.providers.push(provider);
      this.emitter.emit('did-add-provider', provider);
      this.observeProvider(provider);
    }
  }

  /**
   * Remove one or more symbol providers.
   *
   * @param {SymbolProvider[]} providers Any number of symbol providers.
   */
  remove(...providers) {
    for (let provider of providers) {
      let index = this.providers.indexOf(provider);
      // Providers that were invalid may not have been added. Not a problem.
      if (index === -1) continue;

      this.providers.splice(index, 1);
      this.emitter.emit('did-remove-provider', provider);
      this.stopObservingProvider(provider);
    }
  }

  /**
   * Ensure a symbol provider abides by the contract.
   *
   * @param {SymbolProvider} provider A symbol provider to validate.
   */
  validateSymbolProvider(provider) {
    let faults = [];
    if (typeof provider.name !== 'string') faults.push('name');
    if (typeof provider.packageName !== 'string') faults.push('packageName');
    if (typeof provider.canProvideSymbols !== 'function')
      faults.push('canProvideSymbols');
    if (typeof provider.getSymbols !== 'function')
      faults.push('getSymbols');

    if (faults.length > 0) {
      throw new InvalidProviderError(faults, provider);
    }
  }

  /**
   * Observe a symbol provider so that we can clear our symbol cache if needed.
   *
   * @param {SymbolProvider} provider A symbol provider.
   */
  observeProvider(provider) {
    let disposable = new CompositeDisposable();
    this.providerSubscriptions.set(provider, disposable);

    // Providers can implement `onShouldClearCache` when they want to control
    // when symbols they provide are no longer valid.
    if (!provider.onShouldClearCache) return;

    disposable.add(
      provider.onShouldClearCache((bundle) => {
        this.emitter.emit('should-clear-cache', { ...bundle, provider });
      })
    );
  }

  /**
   * Stop observing a symbol provider.
   *
   * @param {SymbolProvider} provider A symbol provider.
   */
  stopObservingProvider(provider) {
    let disposable = this.providerSubscriptions.get(provider);
    this.providerSubscriptions.delete(provider);
    disposable?.dispose;
  }

  destroy() {
    for (let provider of this.providers) {
      provider?.destroy?.();
      this.emitter.emit('did-remove-provider', provider);
    }
  }

  onDidAddProvider(callback) {
    return this.emitter.on('did-add-provider', callback);
  }

  onDidRemoveProvider(callback) {
    return this.emitter.on('did-remove-provider', callback);
  }

  onShouldClearCache(callback) {
    return this.emitter.on('should-clear-cache', callback);
  }

  /**
   * Boost the relevance score of certain providers based on their position in
   * the settings value. If there are 5 providers listed, the first one gets a
   * five-point boost; the second a four-point boost; and so on.
   *
   * @param {String} name The provider's name.
   * @param {String} packageName The provider's package name.
   * @param {Array}  preferredProviders A list of preferred providers from
   *   configuration; each entry can refer to a provider's name or its package
   *   name.
   *
   * @returns {Number} The amount by which to boost the provider's relevance
   *   score.
   */
  getScoreBoost(name, packageName, preferredProviders = []) {
    let shouldLog = Config.get('enableDebugLogging');
    if (packageName === 'unknown') return 0;
    let index = preferredProviders.indexOf(packageName);
    if (index === -1) {
      index = preferredProviders.indexOf(name);
    }
    if (index === -1) return 0;
    let scoreBoost = preferredProviders.length - index;
    if (shouldLog)
      console.log('Score boost for provider', name, packageName, 'is', scoreBoost);
    return scoreBoost;
  }

  /**
   * Given metadata about a symbol request, choose the best provider(s) for the
   * job.
   *
   * @param {SymbolMeta} meta Metadata about the symbol request.
   *
   * @returns {Promise<SymbolProvider[]>} A promise that resolves with a list
   *   of symbol providers.
   */
  async select(meta) {
    let shouldLog = Config.get('enableDebugLogging');
    let exclusivesByScore = [];
    let results = [];

    let preferredProviders = Config.getForEditor(meta.editor, 'preferCertainProviders');

    if (shouldLog) {
      console.debug(`Provider broker choosing among ${this.providers.length} candidates:`, this.providers);
      console.debug('Metadata is:', meta);
    }

    let answers = this.providers.map(provider => {
      // TODO: This method can reluctantly go async because language clients
      // might have to ask their servers about capabilities. We must introduce
      // a timeout value here so that we don't wait indefinitely for providers
      // to respond.
      if (shouldLog)
        console.debug(`Asking provider:`, provider.name, provider);
      return provider.canProvideSymbols(meta);
      // return timeout(provider.canProvideSymbols(meta), 500);
    });

    let outcomes = await Promise.allSettled(answers);

    for (let [index, provider] of this.providers.entries()) {
      let outcome = outcomes[index];

      if (shouldLog)
        console.debug(`Outcome for provider`, provider.name, 'is', outcome);

      if (outcome.status === 'rejected') continue;
      let { value: score } = outcome;
      let name = provider.name ?? 'unknown';
      let packageName = provider?.packageName ?? 'unknown';
      let isExclusive = provider?.isExclusive ?? false;

      if (shouldLog)
        console.debug('Score for', provider.name, 'is:', score);

      if (!score) continue;
      if (score === true) score = 1;
      score += this.getScoreBoost(name, packageName, preferredProviders);

      if (isExclusive) {
        // “Exclusive” providers get put aside until the end. We'll pick the
        // _one_ that has the highest score.
        exclusivesByScore.push({ provider, score });
      } else {
        // Non-exclusive providers go into the pile because we know we'll be
        // using them all.
        results.push(provider);
      }
    }

    if (exclusivesByScore.length > 0) {
      exclusivesByScore.sort((a, b) => b.score - a.score);
      let exclusive = exclusivesByScore[0].provider;
      results.unshift(exclusive);
    }

    if (shouldLog)
      console.debug('Returned providers:', results);

    return results;
  }
};
