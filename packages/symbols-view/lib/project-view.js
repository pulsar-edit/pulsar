// const { Point } = require('atom');

const SymbolsView = require('./symbols-view');
const { isIterable, timeout } = require('./util');

module.exports = class ProjectView extends SymbolsView {
  constructor(stack, broker) {
    // TODO: Do these defaults make sense? Should we allow a provider to
    // override them?
    super(stack, broker, {
      emptyMessage: 'Project has no symbols or is empty',
      maxResults: 20,
      isDynamic: true
    });

    this.shouldReload = true;
  }

  destroy() {
    return super.destroy();
  }

  toggle(filterTerm = '') {
    if (this.panel.isVisible()) {
      this.cancel();
    } else {
      this.populate();
      this.attach();
      this.selectListView.update({ query: filterTerm, selectQuery: true });
    }
  }

  didCancelSelection() {
    this.abortController?.abort();
    super.didCancelSelection();
  }

  didConfirmEmptySelection() {
    this.abortController?.abort();
    super.didConfirmEmptySelection();
  }

  isValidSymbol(symbol) {
    if (!super.isValidSymbol(symbol)) return false;
    if (
      !(typeof symbol.file === 'string' && typeof symbol.directory === 'string') &&
      !(typeof symbol.path === 'string')
    ) {
      return false;
    }
    return true;
  }

  shouldUseCache() {
    let query = this.selectListView?.getQuery();
    if (query && query.length > 0) return false;
    if (this.shouldReload) return false;
    return !!this.cachedSymbols;
  }

  didChangeQuery() {
    this.populate({ retain: true });
  }

  clear() {

  }

  async populate({ retain = false } = {}) {
    if (this.shouldUseCache()) {
      await this.updateView({ items: this.cachedSymbols });
      return true;
    }

    let query = this.selectListView?.getQuery();

    let listViewOptions = {
      loadingMessage: this.cachedSymbols ?
        `Reloading project symbols\u2026` :
        `Loading project symbols\u2026`
    };

    if (!this.cachedSymbols) {
      listViewOptions.loadingBadge = 0;
    }

    // await this.updateView(listViewOptions);
    let editor = atom.workspace.getActiveTextEditor();

    let start = performance.now();
    this._lastTimestamp = start;
    let anySymbolsLoaded = false;
    let result = this.generateSymbols(editor, query, (symbols) => {
      anySymbolsLoaded = symbols.length > 0;

      // TODO: Should we sort by buffer position? Should we leave it up to the
      // provider? Should we make it configurable?
      let options = {
        ...listViewOptions,
        items: symbols,
        loadingMessage: null
      };
      this.updateView(options);
    });

    let loadingTimeout;
    if (retain) {
      loadingTimeout = setTimeout((timestamp) => {
        if (timestamp !== this._lastTimestamp) return;
        if (anySymbolsLoaded) return;
        this.updateView({ loadingMessage: `Reloading project symbols\u2026` });
      }, 500, start);
    }

    if (result?.then) result = await result;
    clearTimeout(loadingTimeout);
    if (result == null) {
      result = [];
    }

    this.cachedSymbols = result;

    // TODO: We assume that project-wide symbol search will involve re-querying
    // the language server whenever the user types another character. This
    // distinguishes it from searching within one buffer — where typing in the
    // query field just filters a static list.
    //
    // This is a safe assumption to make, but we could at least make it
    // possible for a provider to return a static list and somehow indicate
    // that it’s static so that we don’t have to keep re-querying.
    this.shouldReload = true;
    return true;
  }

  async generateSymbols(editor, query = '', callback) {
    this.abortController?.abort();
    this.abortController = new AbortController();

    let meta = { type: 'project', editor, query };

    // The signal is how a provider can stop doing work if it's going async,
    // since it'll be able to tell if we've cancelled this command and no
    // longer need the symbols we asked for.
    let signal = this.abortController.signal;

    let providers = await this.broker.select(meta);
    if (providers?.length === 0) {
      console.warn('No providers found!');
      return null;
    }

    let allSymbols = [];
    let done = (symbols, provider) => {
      if (signal.aborted) return;
      if (!isIterable(symbols)) {
        error(`Provider did not return a list of symbols`, provider);
        return;
      }
      this.addSymbols(allSymbols, symbols, provider);
      callback(allSymbols);
    };

    let error = (err, provider) => {
      if (signal.aborted) return;
      let message = typeof err === 'string' ? err : err.message;
      console.error(`Error in retrieving symbols from provider ${provider.name}: ${message}`);
    };

    let tasks = [];
    for (let provider of providers) {
      try {
        let symbols = this.getSymbolsFromProvider(provider, signal, meta);
        if (symbols?.then) {
          let task = symbols
            .then((result) => done(result, provider))
            .catch(err => error(err, provider));
          tasks.push(task);
        } else if (isIterable(symbols)) {
          done(symbols, provider);
        } else {
          error(`Provider did not return a list of symbols`, provider);
        }
      } catch (err) {
        error(err, provider);
      }
    }

    if (tasks.length > 0) {
      await Promise.race([Promise.allSettled(tasks), timeout(this.timeoutMs)]);
    }

    // Since we might've gone async here, we should check our own signal. If
    // it's aborted, that means the user has cancelled.
    if (signal.aborted) return null;

    this.cachedSymbols = allSymbols;
    return allSymbols;
  }
};
