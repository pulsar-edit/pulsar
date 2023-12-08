const CaptureOrganizer = require('./capture-organizer');
const { Emitter } = require('atom');

class TreeSitterProvider {
  constructor () {
    this.packageName = 'symbol-provider-tree-sitter';
    this.name = 'Tree-sitter';
    this.isExclusive = true;
    this.captureOrganizer = new CaptureOrganizer();
    this.emitter = new Emitter();
    this.disposable = atom.config.onDidChange('symbol-provider-tree-sitter', () => {
      // Signal the consumer to clear its cache whenever we change the package
      // config.
      this.emitter.emit('should-clear-cache', { provider: this });
    });
  }

  destroy () {
    this.captureOrganizer.destroy();
    this.disposable.dispose();
  }

  onShouldClearCache (callback) {
    return this.emitter.on('should-clear-cache', callback);
  }

  canProvideSymbols (meta) {
    let { editor, type } = meta;

    // This provider can't crawl the whole project.
    if (type === 'project' || type === 'project-find') return false;

    // This provider works only for editors with Tree-sitter grammars.
    let languageMode = editor?.getBuffer()?.getLanguageMode();
    if (!languageMode?.atTransactionEnd) {
      return false;
    }

    // This provider needs at least one layer to have a tags query.
    let layers = languageMode.getAllLanguageLayers(l => !!l.tagsQuery);
    if (layers.length === 0) {
      return false;
    }

    return true;
  }

  async getSymbols (meta) {
    let { editor, signal } = meta;
    let languageMode = editor?.getBuffer()?.getLanguageMode();
    if (!languageMode) return null;

    let scopeResolver = languageMode?.rootLanguageLayer?.scopeResolver;
    if (!scopeResolver) return null;

    let results = [];

    // Wait for the buffer to be at rest so we know we're capturing against
    // clean trees.
    await languageMode.atTransactionEnd();

    // The symbols-view package might've cancelled us in the interim.
    if (signal.aborted) return null;

    let layers = languageMode.getAllLanguageLayers(l => !!l.tagsQuery);
    if (layers.length === 0) return null;

    for (let layer of layers) {
      let extent = layer.getExtent();

      let captures = layer.tagsQuery.captures(
        layer.tree.rootNode,
        extent.start,
        extent.end
      );

      results.push(
        ...this.captureOrganizer.process(captures, scopeResolver)
      );
    }
    results.sort((a, b) => a.position.compare(b.position));
    return results;
  }
}

module.exports = TreeSitterProvider;
