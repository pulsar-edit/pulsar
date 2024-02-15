const { CompositeDisposable, Point } = require('atom');
const { match } = require('fuzzaldrin');

const Config = require('./config');
const SymbolsView = require('./symbols-view');
const el = require('./element-builder');
const { badge, isIterable, timeout } = require('./util');

class FileView extends SymbolsView {
  constructor(stack, broker) {
    super(stack, broker);
    this.cachedResults = new Map();
    // Cached results can be partially invalidated. If a provider wants to
    // clear only its own cached results, keep track of it so that we know to
    // ask it for new symbols in spite of the presence of other results in the
    // cache.
    this.providersWithInvalidatedCaches = new Map();
    this.watchedEditors = new WeakSet();

    this.editorsSubscription = atom.workspace.observeTextEditors(editor => {
      if (this.watchedEditors.has(editor)) return;

      const removeFromCache = (provider = null) => {
        if (!provider) {
          this.cachedResults.delete(editor);
          this.providersWithInvalidatedCaches.delete(editor);
          return;
        }
        let results = this.cachedResults.get(editor);
        if (!results || results.length === 0) return;
        results = results.filter(sym => {
          return sym.providerId !== provider.packageName;
        });
        if (results.length === 0) {
          // No other providers had cached any symbols, so we can do the simple
          // thing here.
          this.cachedResults.delete(editor);
          this.providersWithInvalidatedCaches.delete(editor);
          return;
        }
        // There's at least one remaining cached symbol. When we fetch this
        // cache result, we need a way of knowing whether this cache entry is
        // comprehensive. So we'll add this provider to a list of providers
        // that will need re-querying.
        this.cachedResults.set(editor, results);
        let providers = this.providersWithInvalidatedCaches.get(editor);
        if (!providers) {
          providers = new Set();
          this.providersWithInvalidatedCaches.set(editor, providers);
        }
        providers.add(provider);
      };
      const removeAllFromCache = () => removeFromCache(null);

      const editorSubscriptions = new CompositeDisposable();
      let buffer = editor.getBuffer();

      // All the core actions that can invalidate the symbol cache.
      editorSubscriptions.add(
        // Some of them invalidate the entire cache…
        editor.onDidChangeGrammar(removeAllFromCache),
        editor.onDidSave(removeAllFromCache),
        editor.onDidChangePath(removeAllFromCache),
        buffer.onDidReload(removeAllFromCache),
        buffer.onDidDestroy(removeAllFromCache),
        buffer.onDidStopChanging(removeAllFromCache),
        Config.onDidChange(removeAllFromCache),

        // …and others invalidate only the cache for one specific provider.
        this.broker.onDidAddProvider(removeFromCache),
        this.broker.onDidRemoveProvider(removeFromCache),
        this.broker.onShouldClearCache((bundle = {}) => {
          let { provider = null, editor: someEditor = null } = bundle;
          if (someEditor && editor.id !== someEditor.id) return;
          removeFromCache(provider);
        })
      );

      editorSubscriptions.add(
        editor.onDidDestroy(() => {
          this.watchedEditors.delete(editor);
          editorSubscriptions.dispose();
        })
      );

      this.watchedEditors.add(editor);
    });
  }

  destroy() {
    this.editorsSubscription.dispose();
    return super.destroy();
  }

  elementForItem({ position, name, tag, icon, context, providerName }) {
    // Style matched characters in search results.
    const matches = match(name, this.selectListView.getFilterQuery());

    let badges = [];
    if (providerName && this.shouldShowProviderName) {
      badges.push(providerName);
    }
    if (tag) {
      badges.push(tag);
    }

    let primaryLineClasses = ['primary-line'];
    if (this.showIconsInSymbolsView) {
      if (icon) {
        primaryLineClasses.push('icon', icon);
      } else {
        primaryLineClasses.push('no-icon');
      }
    }

    // The “primary” results line shows the symbol's name and its tag, if any.
    let primary = el(`div.${primaryLineClasses.join('.')}`,
      el('div.name',
        SymbolsView.highlightMatches(this, name, matches)
      ),
      badges && el('div.badge-container',
        ...badges.map(b => badge(b, { variant: this.useBadgeColors }))
      )
    );

    // The “secondary” results line shows the symbol’s row number and its
    // context, if any.
    let secondaryLineClasses = ['secondary-line'];
    if (this.showIconsInSymbolsView) {
      secondaryLineClasses.push('no-icon');
    }
    let secondary = el(`div.${secondaryLineClasses.join('.')}`,
      el('span.location', `Line ${position.row + 1}`),
      context && el('span.context', context)
    );

    return el('li.two-lines', primary, secondary);
  }

  didChangeSelection(item) {
    let quickJump = Config.get('quickJumpToFileSymbol');
    if (quickJump && item) this.openTag(item);
  }

  async didCancelSelection() {
    this.abortController?.abort();
    await this.cancel();
    let editor = this.getEditor();
    if (editor && this.initialState) {
      this.deserializeEditorState(editor, this.initialState);
    }
    this.initialState = null;
  }

  didConfirmEmptySelection() {
    this.abortController?.abort();
    super.didConfirmEmptySelection();
  }

  async toggle(filterTerm = '') {
    if (this.panel.isVisible()) await this.cancel();
    let editor = this.getEditor();
    // Remember exactly where the editor is so that we can restore that state
    // if the user cancels.
    let quickJump = Config.get('quickJumpToFileSymbol');
    if (quickJump && editor) {
      this.initialState = this.serializeEditorState(editor);
    }

    let populated = this.populate(editor);
    if (!populated) return;
    this.attach();
    this.selectListView.update({ query: filterTerm });
  }

  serializeEditorState(editor) {
    let editorElement = atom.views.getView(editor);
    let scrollTop = editorElement.getScrollTop();

    return {
      bufferRanges: editor.getSelectedBufferRanges(),
      scrollTop
    };
  }

  deserializeEditorState(editor, { bufferRanges, scrollTop }) {
    let editorElement = atom.views.getView(editor);

    editor.setSelectedBufferRanges(bufferRanges);
    editorElement.setScrollTop(scrollTop);
  }

  getEditor() {
    return atom.workspace.getActiveTextEditor();
  }

  getPath() {
    return this.getEditor()?.getPath();
  }

  getScopeName() {
    return this.getEditor()?.getGrammar()?.scopeName;
  }

  isValidSymbol(symbol) {
    if (!symbol.position || !(symbol.position instanceof Point)) return false;
    if (typeof symbol.name !== 'string') return false;
    return true;
  }

  async populate(editor) {
    let result = this.cachedResults.get(editor);
    let providersToQuery = this.providersWithInvalidatedCaches.get(editor);
    if (result && !providersToQuery?.size) {
      let symbols = result;
      await this.updateView({
        items: symbols
      });
      return true;
    } else {
      await this.updateView({
        items: [],
        loadingMessage: 'Generating symbols\u2026'
      });
      result = this.generateSymbols(editor, result, providersToQuery);
      if (result?.then) result = await result;
      this.providersWithInvalidatedCaches.delete(editor);

      if (result == null) {
        this.cancel();
        return false;
      }
      result.sort((a, b) => a.position.compare(b.position));
      await this.updateView({
        items: result,
        loadingMessage: null
      });
      return true;
    }
  }

  async generateSymbols(editor, existingSymbols = null, onlyProviders = null) {
    this.abortController?.abort();
    this.abortController = new AbortController();

    let meta = { type: 'file', editor, timeout: this.timeoutMs };

    // The signal is how a provider can stop doing work if it's going async,
    // since it'll be able to tell if we've cancelled this command and no
    // longer need the symbols we asked for.
    let signal = this.abortController.signal;

    let providers = await this.broker.select(meta);
    // If our last cache result was only partially invalidated, `onlyProviders`
    // will be a `Set` of providers that need re-querying — but only if the
    // broker selected them again in the first place.
    //
    // When re-using a cache result that was preserved in its entirety, we
    // don't give the broker a chance to assemble another list of providers. We
    // should act similarly in the event of partial invalidation, and ignore
    // any providers _except_ the ones whose caches were invalidated.
    if (onlyProviders) {
      providers = providers.filter(p => onlyProviders.has(p));
    }

    if (providers?.length === 0) {
      // TODO: Either show the user a notification or just log a warning to the
      // console, depending on the user's settings and whether we've notified
      // about this already during this session.
      return existingSymbols;
    }

    let done = (symbols, provider) => {
      if (signal.aborted) return;
      // If these don't match up, our results are stale.
      if (signal !== this.abortController.signal) return;
      if (!isIterable(symbols)) {
        error(`Provider did not return a list of symbols`, provider);
        return;
      }
      this.addSymbols(allSymbols, symbols, provider);
    };

    let error = (err, provider) => {
      if (signal.aborted) return;
      let message = typeof err === 'string' ? err : err.message;
      console.error(`Error in retrieving symbols from provider ${provider.name}: ${message}`);
    };

    let tasks = [];
    let allSymbols = existingSymbols ? [...existingSymbols] : [];
    for (let provider of providers) {
      try {
        // Each provider can return a list of symbols directly or a promise.
        let symbols = this.getSymbolsFromProvider(provider, signal, meta);
        if (symbols?.then) {
          // This is a promise, so we'll add it to the list of tasks that we
          // need to wait for.
          let task = symbols
            .then((result) => done(result, provider))
            .catch(err => error(err, provider));
          tasks.push(task);
        } else if (isIterable(symbols)) {
          // This is a valid list of symbols, so the provider acted
          // synchronously. Add it to the results list.
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

    await this.updateView({ loadingMessage: null });

    if (signal.aborted) {
      // This means the user cancelled the task. No cleanup necessary; the
      // `didCancelSelection` handler would've taken care of that.
      return null;
    }

    if (allSymbols.length > 0) {
      // Only cache non-empty results.
      this.cachedResults.set(editor, allSymbols);
    }
    return allSymbols;
  }
}

module.exports = FileView;
