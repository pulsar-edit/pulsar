const Parser = require('./web-tree-sitter');
const TokenIterator = require('./token-iterator');
const { Point, Range, spliceArray } = require('text-buffer');
const { Patch } = require('superstring');
const { CompositeDisposable, Emitter } = require('event-kit');
const ScopeDescriptor = require('./scope-descriptor');
const ScopeResolver = require('./scope-resolver');
const Token = require('./token');
const TokenizedLine = require('./tokenized-line');
const { matcherForSelector } = require('./selectors');
const { commentStringsFromDelimiters, getDelimitersForScope } = require('./comment-utils.js');

const createTree = require('./rb-tree');

const FEATURE_ASYNC_INDENT = true;
const FEATURE_ASYNC_PARSE = true;

const LINE_LENGTH_LIMIT_FOR_HIGHLIGHTING = 10000;

// How many milliseconds we can spend on synchronous re-parses (for indentation
// purposes) in a given transaction before we fall back to asynchronous
// indentation instead. Only comes into play when async indentation is enabled.
const REPARSE_BUDGET_PER_TRANSACTION_MILLIS = 10

const PARSE_JOB_LIMIT_MICROS = 3000;
const PARSERS_IN_USE = new Set();

const FUNCTION_TRUE = () => true;

function isParseTimeout(err) {
  return err.message.includes('Parsing failed');
}

function last(array) {
  return array[array.length - 1];
}

function removeLastOccurrenceOf(array, item) {
  return array.splice(array.lastIndexOf(item), 1);
}

function clamp(value, min, max) {
  if (value < min) { return min; }
  if (value > max) { return max; }
  return value;
}

function rangeForNode(node) {
  return new Range(node.startPosition, node.endPosition);
}

function nodeBreadth(node) {
  return node.endIndex - node.startIndex;
}

function rangeToTreeSitterRangeSpec(range, buffer) {
  let startIndex = buffer.characterIndexForPosition(range.start);
  let endIndex = buffer.characterIndexForPosition(range.end);
  let startPosition = { row: range.start.row, column: range.start.column };
  let endPosition = { row: range.end.row, column: range.end.column };

  return { startIndex, startPosition, endIndex, endPosition };
}

function resolveNodeDescriptor(node, descriptor) {
  let parts = descriptor.split('.');
  let result = node;
  while (result !== null && parts.length > 0) {
    let part = parts.shift();
    if (!result[part]) { return null; }
    result = result[part];
  }
  return result;
}

function resolveNodePosition(node, descriptor) {
  let parts = descriptor.split('.');
  let lastPart = parts.pop();
  let result = parts.length === 0 ?
    node :
    resolveNodeDescriptor(node, parts.join('.'));

  return result[lastPart];
}

// Patch tree-sitter syntax nodes the same way `TreeSitterLanguageMode` did so
// that we don't break anything that relied on `range` being present.
function ensureNodeIsPatched(node) {
  let done = node.range && node.range instanceof Range;
  if (done) { return; }
  let proto = Object.getPrototypeOf(node);

  Object.defineProperty(proto, 'range', {
    get() { return rangeForNode(this); }
  });

  // autocomplete-html expects a `closest` function to exist on nodes.
  Object.defineProperty(proto, 'closest', {
    value: function closest(types) {
      if (!Array.isArray(types)) { types = [types]; }
      let node = this;
      while (node) {
        if (types.includes(node.type)) { return node; }
        node = node.parent;
      }
      return null;
    }
  });
}

// Compares “informal” points like the ones in a tree-sitter tree; saves us
// from having to convert them to actual `Point`s.
function comparePoints(a, b) {
  const rows = a.row - b.row;
  if (rows === 0) {
    return a.column - b.column;
  } else {
    return rows;
  }
}

// Acts like `comparePoints`, but treats starting and ending boundaries
// differently, making it so that ending boundaries are visited before starting
// boundaries.
function compareBoundaries(a, b) {
  if (!a.position) {
    a = { position: a, boundary: 'end' };
  }
  if (!b.position) {
    b = { position: b, boundary: 'end' };
  }
  let result = comparePoints(a.position, b.position);
  if (result !== 0) { return result; }
  if (a.boundary === b.boundary) { return 0; }
  return a.boundary === 'end' ? -1 : 1;
}

function isBetweenPoints(point, a, b) {
  let comp = comparePoints(a, b);
  let lesser = comp > 0 ? b : a;
  let greater = comp > 0 ? a : b;
  return comparePoints(point, lesser) >= 0 &&
    comparePoints(point, greater) <= 0;
}

// eslint-disable-next-line no-unused-vars
let totalBufferChanges = 0;
let nextTransactionId = 1;
let nextLanguageModeId = 0;
const COMMENT_MATCHER = matcherForSelector('comment');
const MAX_RANGE = new Range(Point.ZERO, Point.INFINITY).freeze();

class WASMTreeSitterLanguageMode {
  constructor({ buffer, grammar, config, grammars, syncTimeoutMicros }) {
    this.id = nextLanguageModeId++;
    this.buffer = buffer;
    this.grammar = grammar;
    this.config = config ?? atom.config;
    this.grammarRegistry = grammars;

    this.syncTimeoutMicros = syncTimeoutMicros ?? PARSE_JOB_LIMIT_MICROS;
    this.useAsyncParsing = FEATURE_ASYNC_PARSE;
    this.useAsyncIndent = FEATURE_ASYNC_INDENT;
    this.transactionReparseBudgetMs = REPARSE_BUDGET_PER_TRANSACTION_MILLIS;
    this.currentTransactionReparseBudgetMs = undefined;

    this.injectionsMarkerLayer = buffer.addMarkerLayer();

    this.rootScopeDescriptor = new ScopeDescriptor({
      scopes: [grammar.scopeName]
    });
    this.rootScopeId = this.grammar.idForScope(this.grammar.scopeName);

    this.emitter = new Emitter();
    this.isFoldableCache = [];

    this.tokenized = false;

    this.subscriptions = new CompositeDisposable;
    this.subscriptions.add(
      this.onDidTokenize(() => this.tokenized = true)
    );

    this.rootLanguage = null;
    this.rootLanguageLayer = null;

    this.grammarForLanguageString = this.grammarForLanguageString.bind(this);

    this.parsersByLanguage = new Index();
    this.tokenIterator = new TokenIterator(this);

    this.autoIndentRequests = 0;

    // For our purposes, the “transaction” life cycle exposed by this promise
    // is a lot like the buffer's own concept of transactions, with one
    // exception: if transaction 2 finishes before transaction 1 is done
    // parsing, then the transaction 1 life cycle “adopts” all the changes of
    // transaction 2. That means that the `atTransactionEnd` method won't
    // resolve until the tree is clean and all outstanding updates are
    // performed and injections are populated.
    this.resolveNextTransactionPromise();

    this.ready = this.grammar.getLanguage()
      .then(language => {
        this.rootLanguage = language;
        this.rootLanguageLayer = new LanguageLayer(null, this, grammar, 0);
        return this.getOrCreateParserForLanguage(language);
      })
      .then(() => this.rootLanguageLayer.update(null, { id: 0 }))
      .then(() => this.emitter.emit('did-tokenize'));
  }

  destroy() {
    let layers = this.getAllLanguageLayers();
    for (let layer of layers) {
      layer?.destroy();
    }
    this.injectionsMarkerLayer?.destroy();
    this.rootLanguageLayer = null;
    this.subscriptions?.dispose();
  }

  getGrammar() {
    return this.grammar;
  }

  getLanguageId() {
    return this.grammar.scopeName;
  }

  getNonWordCharacters(position) {
    const scope = this.scopeDescriptorForPosition(position);
    return this.config.get('editor.nonWordCharacters', { scope });
  }

  getRootParser() {
    return this.getOrCreateParserForLanguage(this.rootLanguage);
  }

  getOrCreateParserForLanguage(language) {
    let pool = this.parsersByLanguage.get(language);
    let parser;
    if (pool) {
      parser = pool.find(p => !PARSERS_IN_USE.has(p));
    }

    if (!parser) {
      parser = new Parser();
      parser.setLanguage(language);
      this.parsersByLanguage.add(language, parser);
    }
    return parser;
  }

  bufferDidChange(change) {
    if (!this.rootLanguageLayer) { return; }

    let { oldRange, newRange, oldText, newText } = change;

    const startIndex = this.buffer.characterIndexForPosition(
      change.newRange.start
    );

    // Mark edits in the tree, but don't actually reparse until
    // `bufferDidFinishTransaction`.
    let edit = {
      startIndex,
      oldEndIndex: startIndex + oldText.length,
      newEndIndex: startIndex + newText.length,
      startPosition: oldRange.start,
      oldEndPosition: oldRange.end,
      newEndPosition: newRange.end
    };

    if (!this.resolveNextTransaction) {
      // This is the first change after the last transaction finished, so we
      // need to create a new promise that will resolve when the next
      // transaction is finished.
      totalBufferChanges++;
      this.transactionChangeCount = 1;
      this.refreshNextTransactionPromise();
      this.didAutoIndentAfterTransaction = false;
    } else {
      // We have a different definition of "changes" than what we get from
      // `bufferDidFinishTransaction`. Even when multiple calls to `insertText`
      // happen within a transaction, `TextBuffer` will attempt to consolidate
      // them into a single "change" — but what we care about is how many
      // atomic operations have taken place. So we keep track on our own.
      this.transactionChangeCount++;
      totalBufferChanges++;
    }

    this.rootLanguageLayer.handleTextChange(edit, oldText, newText);

    for (const marker of this.injectionsMarkerLayer.getMarkers()) {
      marker.languageLayer.handleTextChange(edit, oldText, newText);
    }
    this.cachedCurrentBufferText = this.buffer.getText();
  }

  bufferDidFinishTransaction({ changes }) {
    let id = nextTransactionId++;
    if (!this.rootLanguageLayer) { return; }
    for (let i = 0, { length } = changes; i < length; i++) {
      const { oldRange, newRange } = changes[i];
      spliceArray(
        this.isFoldableCache,
        newRange.start.row,
        oldRange.end.row - oldRange.start.row,
        { length: newRange.end.row - newRange.start.row }
      );
    }

    this.rootLanguageLayer.update(null, { id }).then(shouldEndTransaction => {
      if (shouldEndTransaction) {
        this.lastTransactionEditedRange = this.rootLanguageLayer?.lastTransactionEditedRange;
        this.lastTransactionChangeCount = this.transactionChangeCount;
        this.lastTransactionAutoIndentRequests = this.autoIndentRequests;
      }

      // The editor is going to ask if a number of on-screen lines are now
      // foldable. This would ordinarly trigger a number of `folds.scm` queries
      // — one per line. But since we know they're coming, we can run a single
      // capture query over the whole range.
      for (let { newRange } of changes) {
        this.prefillFoldCache(newRange);
      }

      let allLayers = this.getAllInjectionLayers();
      for (let layer of allLayers) {
        // Either the tree got re-parsed — and it's now up-to-date — or it
        // didn't, which means that the edits in the tree did not affect the
        // layer's contents. Either way, the tree is safe to use. (This is part
        // of why we keep a separate boolean instead of checking the tree
        // directly — we have a looser definition of "clean.")
        layer.treeIsDirty = false;

        // If this layer didn't get updated, then it didn't need to, and the
        // edits made in the last transaction are no longer relevant.
        layer.editedRange = null;
      }

      // At this point, all trees are safely re-parsed, including those of
      // injection layers. So we can proceed with any actions that were waiting
      // on a clean tree.
      if (shouldEndTransaction) {
        this.resolveNextTransactionPromise();
        this.transactionChangeCount = 0;
        this.autoIndentRequests = 0;
        // Since a new transaction is starting, we can reset our reparse
        // budget.
        this.currentTransactionReparseBudgetMs = this.transactionReparseBudgetMs;
      }
    });
  }

  // Invalidate fold caches for the rows touched by the given range.
  //
  // Invalidating syntax highlighting also invalidates fold caches for the same
  // range, but this method allows us to invalidate parts of the fold cache
  // without affecting syntax highlighting.
  emitFoldUpdate(range) {
    const startRow = range.start.row;
    const endRow = range.end.row;
    for (let row = startRow; row < endRow; row++) {
      this.isFoldableCache[row] = undefined;
    }
    this.prefillFoldCache(range);
  }

  emitRangeUpdate(range) {
    this.emitFoldUpdate(range);
    this.emitter.emit('did-change-highlighting', range);
  }

  // Resolve the promise that was created when we reacted to the first change
  // in a given transaction. We resolve it with the number of changes in the
  // transaction so that we can react differently to batches of changes than to
  // single changes.
  resolveNextTransactionPromise() {
    if (this.resolveNextTransaction) {
      this.resolveNextTransaction();
      this.resolveNextTransaction = null;
    }

    // These transaction IDs are useful to have around, but we don't want them
    // to grow indefinitely. If we reach this point, then all outstanding
    // transactions are settled, and it's safe to reset our numbering scheme.
    if (nextTransactionId > 100) {
      nextTransactionId = 1;
    }

    if (!this.nextTransaction) {
      // No edits have happened yet, so we should put this here as a
      // placeholder until the user edits the buffer for the first time.
      this.nextTransaction = Promise.resolve();
    }
  }

  // Create a promise that will resolve when the next transaction is done and
  // all its side effects are handled. When this promise resolves, all parse
  // trees will be clean and up to date. This promise cannot reject — only
  // resolve.
  refreshNextTransactionPromise() {
    if (this.resolveNextTransaction) { return false; }
    this.nextTransaction = new Promise((resolve) => {
      this.resolveNextTransaction = (changes) => {
        resolve(changes);
      };
    });
    return true;
  }

  // Resolves the next time that all tree-sitter trees are clean — or
  // immediately, if they're clean at the time of invocation.
  //
  // Resolves with metadata about the previous transaction that may be useful
  // for the caller to know:
  //
  // * How many atomic changes have been made since the last clean tree.
  // * The range that represents the extent of the changes made since the last
  //   clean tree.
  // * How many times Pulsar requested auto-indent actions that this language
  //   mode couldn't fulfill (see `suggestedIndentForLineAtBufferRow`).
  //
  async atTransactionEnd() {
    if (!this.tokenized) { return this.ready; }
    if (this.atTransactionEndPromise) {
      return this.atTransactionEndPromise;
    }
    let prerequisite = this.nextTransaction || Promise.resolve();
    this.atTransactionEndPromise = prerequisite.then(() => {
      let result = {
        changeCount: this.lastTransactionChangeCount ?? 0,
        range: this.lastTransactionEditedRange ?? null,
        autoIndentRequests: this.lastTransactionAutoIndentRequests ?? 0
      };
      return result;
    }).finally(() => {
      this.atTransactionEndPromise = null;
    });
    return this.atTransactionEndPromise;
  }

  // Alias for `atTransactionEnd` for packages that used the implementation
  // details of the legacy tree-sitter system.
  parseCompletePromise() {
    return this.atTransactionEnd();
  }

  prefillFoldCache(range) {
    this.rootLanguageLayer?.foldResolver?.prefillFoldCache(range);

    let markers = this.injectionsMarkerLayer.findMarkers({
      intersectsRange: range
    });

    for (let marker of markers) {
      let { foldResolver } = marker.languageLayer;
      if (!foldResolver) { continue; }
      foldResolver.reset();
      foldResolver.prefillFoldCache(range);
    }
  }

  grammarForLanguageString(languageString) {
    let result =  this.grammarRegistry.treeSitterGrammarForLanguageString(
      languageString,
      'wasm'
    );
    return result;
  }

  // Called when any grammar is added or changed, on the off chance that it
  // affects an injection of ours.
  updateForInjection(grammar) {
    if (!this.rootLanguageLayer) { return; }
    if (!grammar.injectionRegex && !grammar.injectionRegExp) { return; }
    if (grammar.type !== 'modern-tree-sitter') { return; }

    let layers = this.getAllLanguageLayers();
    for (let layer of layers) {
      if (!layer.tree) continue;
      layer._populateInjections(MAX_RANGE, null);
    }
  }

  /*
  Section - Highlighting
  */

  onDidTokenize(callback) {
    return this.emitter.on('did-tokenize', callback);
  }

  onDidChangeHighlighting(callback) {
    return this.emitter.on('did-change-highlighting', callback);
  }

  buildHighlightIterator() {
    if (!this.rootLanguageLayer) {
      return new NullLanguageModeHighlightIterator();
    }
    return new HighlightIterator(this);
  }

  classNameForScopeId(scopeId) {
    return this.grammar.classNameForScopeId(scopeId);
  }

  scopeNameForScopeId(scopeId) {
    return this.grammar.scopeNameForScopeId(scopeId);
  }

  idForScope(name, text) {
    return this.grammar.idForScope(name, text);
  }

  // Behaves like `scopeDescriptorForPosition`, but returns a list of
  // tree-sitter node names. Useful for understanding tree-sitter parsing or
  // for writing syntax highlighting query files.
  syntaxTreeScopeDescriptorForPosition(point) {
    point = this.normalizePointForPositionQuery(point);
    let index = this.buffer.characterIndexForPosition(point);

    let layers = this.languageLayersAtPoint(point);
    let matches = [];

    for (let layer of layers) {
      if (!layer.tree) { continue; }
      let layerMatches = [];

      let root = layer.tree.rootNode;
      let current = root.descendantForIndex(index);

      while (current) {
        // Keep track of layer depth as well so we can use it to break ties
        // later.
        layerMatches.unshift({ node: current, depth: layer.depth });
        current = current.parent;
      }

      matches.push(...layerMatches);
    }

    // The nodes are mostly already sorted from smallest to largest,
    // but for files with multiple syntax trees (e.g. ERB), each tree's
    // nodes are separate. Sort the nodes from largest to smallest.
    matches.sort(
      (a, b) => (
        a.node.startIndex - b.node.startIndex ||
        b.node.endIndex - a.node.endIndex ||
        a.depth - b.depth
      )
    );

    let scopes = matches.map(({ node }) => (
      node.isNamed() ? node.type : `"${node.type}"`
    ));
    scopes.unshift(this.grammar.scopeName);

    return new ScopeDescriptor({ scopes });
  }

  // Returns the buffer range for the first scope to match the given scope
  // selector, starting with the smallest scope and moving outward.
  bufferRangeForScopeAtPosition(selector, point) {
    point = this.normalizePointForPositionQuery(point);

    if (typeof selector === 'function') {
      // We've been given a node-matching function instead of a scope name.
      let node = this.getSyntaxNodeAtPosition(point, selector);
      return node?.range;
    }
    // Results returned from `scopeMapAtPosition` lack the context to know
    // whether they've been covered by deeper scopes. Keep a scope descriptor
    // around so that we can compare results with reality.
    let scopeDescriptor = this.scopeDescriptorForPosition(point)
      .getScopesArray();

    let match = selector ? matcherForSelector(selector) : FUNCTION_TRUE;

    if (!this.rootLanguageLayer) {
      return match('text') ? this.buffer.getRange() : null;
    }

    let layers = this.languageLayersAtPoint(point);
    let results = [];
    for (let layer of layers) {
      if (layer.grammar.scopeName === selector) {
        return layer.getExtent();
      }
      let items = layer.scopeMapAtPosition(point);
      for (let { capture, adjustedRange } of items) {
        let range = rangeForNode(adjustedRange);
        if (!range.containsPoint(point)) { continue; }
        // If this scope name isn't present in the scope descriptor, assume
        // it's been covered by an injection layer. This isn't perfect but
        // it'll be good enough for now.
        if (!scopeDescriptor.includes(capture.name)) { continue; }
        results.push({ capture, adjustedRange, range });
      }
    }

    // We need the results sorted from smallest to biggest.
    results = results.sort((a, b) => {
      return nodeBreadth(a.adjustedRange) - nodeBreadth(b.adjustedRange);
    });

    for (let { capture, range } of results) {
      if (match(capture.name)) { return range; }
    }
  }

  // Given a point, return all scopes active at that point.
  scopeDescriptorForPosition(point) {
    if (!this.rootLanguageLayer) {
      return new ScopeDescriptor({ scopes: [this.grammar.scopeName, 'text'] });
    }
    point = this.normalizePointForPositionQuery(point);

    // The most accurate way to do this is to reconstruct the results from the
    // highlight iterator itself.
    const iterator = this.buildHighlightIterator();
    const scopes = [];

    // Add scopes that were open already at this point.
    for (const scope of iterator.seek(point, point.row + 1)) {
      scopes.push(this.grammar.scopeNameForScopeId(scope));
    }

    while (point.isEqual(iterator.getPosition())) {
      for (const scope of iterator.getOpenScopeIds()) {
        scopes.push(this.grammar.scopeNameForScopeId(scope));
      }
      // Don't count anything that ends at this point.
      for (const scope of iterator.getCloseScopeIds()) {
        removeLastOccurrenceOf(scopes, this.grammar.scopeNameForScopeId(scope));
      }
      iterator.moveToSuccessor();
    }

    if (scopes.length === 0 || scopes[0] !== this.grammar.scopeName) {
      scopes.unshift(this.grammar.scopeName);
    }
    return new ScopeDescriptor({ scopes });
  }

  normalizePointForPositionQuery(point) {
    // Convert bare arrays to points.
    if (Array.isArray(point)) { point = new Point(...point); }

    // Convert bare objects to points and ensure we're dealing with a copy.
    if (!('copy' in point)) {
      point = Point.fromObject(point, true);
    } else {
      point = point.copy();
    }

    // Constrain the point to the buffer range.
    point = this.buffer.clipPosition(point);

    // If the position is the end of a line, get scope of left character
    // instead of newline. This is to match TextMate behavior; see
    // https://github.com/atom/atom/issues/18463.
    if (
      point.column > 0 &&
      point.column === this.buffer.lineLengthForRow(point.row)
    ) {
      point.column--;
    }

    return point;
  }

  parseAsync(language, oldTree, includedRanges, { tag = null } = {}) {
    let devMode = atom.inDevMode();
    let parser = this.getOrCreateParserForLanguage(language);
    parser.reset();
    parser.setTimeoutMicros(this.syncTimeoutMicros);
    PARSERS_IN_USE.add(parser);

    // When you edit a tree, the positions of nodes in the tree are adjusted
    // accordingly. But if you had passed a string into `parse`, all those
    // nodes' `text` properties will now fail to reflect reality, because
    // they're doing those lookups on a stale string. This makes it unsafe to
    // perform captures on a dirty tree, because lots of `#match?` predicates
    // will fail incorrectly.
    //
    // Instead, we can pass a callback that will look up the relevant ranges of
    // text as needed. This callback works exactly like the default callback
    // within web-tree-sitter, except that we'll update the text as the buffer
    // changes. This lets us safely perform captures against dirty trees.
    //
    // In practice, captures against dirty trees will only happen on injection
    // layers, and only when the edits that have been made since the last clean
    // parse _could not possibly_ have affected the tree because they happened
    // nowhere near the injection layer's extent. This lets us get away with
    // deferring the re-parsing of such layers until much later.
    //
    // There's one catch, though: the buffer text being parsed should not
    // change _during the parse job_. Since parsing can go async, we must keep
    // the value constant until the parse is done, at which point we can
    // consult the latest version of the buffer text for the purpose of
    // accurate captures.
    let parseDone = false;
    let text = this.buffer.getText();
    this.cachedCurrentBufferText = text;
    let callback = (index, _, endIndex) => {
      // Stick with a frozen copy of the text at parse time… until parsing is
      // done, at which point we should use the latest buffer text.
      let currentText = parseDone ? this.cachedCurrentBufferText : text;
      return currentText.slice(index, endIndex);
    };

    let tree;
    // eslint-disable-next-line no-unused-vars
    let batchCount = 0;

    const cleanup = () => {
      parseDone = true;
      if (devMode && tag) {
        console.timeEnd(tag);
        if (batchCount > 0) {
          console.log(`(async: ${batchCount} batches)`);
        }
      }
      parser.setTimeoutMicros(null);
      PARSERS_IN_USE.delete(parser);
    };

    if (devMode && tag) { console.time(tag); }

    try {
      // Attempt a synchronous parse.
      tree = parser.parse(callback, oldTree, { includedRanges });
    } catch (err) {
      if (!isParseTimeout(err)) { throw err; }

      // The parse couldn't be completed in the allotted time, so we'll go
      // async and return a promise.
      return new Promise((resolve, reject) => {
        const parseJob = () => {
          try {
            batchCount++;
            tree = parser.parse(callback, oldTree, { includedRanges });
          } catch (err) {
            if (!isParseTimeout(err)) { return reject(err); }
            setImmediate(parseJob);
            return;
          }

          cleanup();
          resolve(tree);
        };
        setImmediate(parseJob);
      });
    }

    // If we get this far, the synchronous parse was a success.
    cleanup();
    return tree;
  }

  parse(language, oldTree, includedRanges, { tag = null } = {}) {
    let devMode = atom.inDevMode();
    let parser = this.getOrCreateParserForLanguage(language);
    parser.reset();
    parser.setTimeoutMicros(null);

    let text = this.buffer.getText();
    this.cachedCurrentBufferText = text;
    let callback = (index, _, endIndex) => {
      let currentText = this.cachedCurrentBufferText;
      return currentText.slice(index, endIndex);
    };

    if (devMode && tag) { console.time(tag); }
    const result = parser.parse(callback, oldTree, { includedRanges });
    if (devMode && tag) { console.timeEnd(tag); }

    return result;
  }

  get tree() {
    return this.rootLanguageLayer?.tree
  }

  /*
  Section - Syntax Tree APIs
  */

  getSyntaxNodeContainingRange(range, where = FUNCTION_TRUE) {
    if (!this.rootLanguageLayer) { return null; }
    return this.getSyntaxNodeAndGrammarContainingRange(range, where)?.node;
  }

  getSyntaxNodeAndGrammarContainingRange(range, where = FUNCTION_TRUE) {
    if (!this.rootLanguageLayer) { return { node: null, grammar: null }; }

    let layersAtStart = this.languageLayersAtPoint(range.start, { exact: true });
    let layersAtEnd = this.languageLayersAtPoint(range.end, { exact: true });
    let sharedLayers = layersAtStart.filter(
      layer => layersAtEnd.includes(layer)
    );
    let indexStart = this.buffer.characterIndexForPosition(range.start);
    let indexEnd = this.buffer.characterIndexForPosition(range.end);
    let rangeBreadth = indexEnd - indexStart;

    sharedLayers.reverse();
    let results = [];
    for (let layer of sharedLayers) {
      if (!layer.tree) { continue; }
      let { grammar, depth } = layer;
      let rootNode = layer.tree.rootNode;

      if (!rootNode.range.containsRange(range)) {
        // There's often a difference between (a) the areas that we consider to
        // be our canonical content ranges for a layer and (b) the range
        // covered by the layer's root node. Root tree nodes usually ignore any
        // whitespace that occurs before the first meaningful content of the
        // node, but we consider that space to be under the purview of the
        // layer all the same.
        //
        // If we've gotten this far, we've already decided that this layer
        // includes this range. So let's just pretend that the root node covers
        // this area.
        results.push({ node: rootNode, grammar, depth });
        continue;
      }

      let node = this.getSyntaxNodeAtPosition(
        range.start,
        (node, nodeGrammar) => {
          // This node can touch either of our boundaries, but it must be
          // bigger than we are.
          //
          // We aren't checking against the predicate yet because passing the
          // predicate won't end our search. Users will reasonably expect that
          // returning `true` from the predicate will mean that the predicate
          // won't run any more. Since the predicate can have side effects, we
          // should keep this contract. That means throwing all nodes into the
          // bucket and not sifting through them until later.
          //
          // TODO: If we need to optimize performance here, we could compromise
          // by re-running the predicate at the end even though we already know
          // it's going to match.
          let breadth = node.endIndex - node.startIndex;
          return node.startIndex <= indexEnd &&
            node.endIndex >= indexEnd &&
            breadth > rangeBreadth &&
            nodeGrammar === grammar;
        }
      );

      if (node) {
        results.push({ node, grammar, depth });
      }
    }

    results.sort((a, b) => {
      return (
        // Favor smaller nodes first…
        nodeBreadth(a.node) - nodeBreadth(b.node) ||
        // …but deeper grammars in case of ties.
        b.depth - a.depth
      );
    });

    for (let { node, grammar } of results) {
      if (where(node, grammar)) {
        return { node, grammar };
      }
    }

    return { node: null, grammar: null };
  }

  getRangeForSyntaxNodeContainingRange(range, where = FUNCTION_TRUE) {
    if (!this.rootLanguageLayer) { return null; }
    let node = this.getSyntaxNodeContainingRange(range, where);
    return node && rangeForNode(node);
  }

  // Return the smallest syntax node at the given position, or the smallest
  // node that matches the optional `where` predicate. The `where` predicate is
  // given the node and the associated grammar as arguments.
  getSyntaxNodeAtPosition(position, where = FUNCTION_TRUE) {
    if (!this.rootLanguageLayer) { return null; }
    let allLayers = this.languageLayersAtPoint(position);

    // We start with the deepest layer and move outward.
    //
    // TODO: Instead of sorting all candidates at the end, let's just keep
    // track of the smallest we've seen and then return it after all the
    // looping.
    allLayers.reverse();
    let results = [];
    for (let layer of allLayers) {
      if (!layer.tree) { continue; }
      let { depth, grammar } = layer;
      let rootNode = layer.tree.rootNode;
      if (!rootNode.range.containsPoint(position)) {
        // There's often a difference between (a) the areas that we consider to
        // be our canonical content ranges for a layer and (b) the range
        // covered by the layer's root node. Root tree nodes usually ignore any
        // whitespace that occurs before the first meaningful content of the
        // node, but we consider that space to be under the purview of the
        // layer all the same.
        //
        // If we've gotten this far, we've already decided that this layer
        // includes this point. So let's just pretend that the root node covers
        // this area.
        if (where(rootNode, grammar)) {
          results.push({ rootNode: node, depth });
        }
        continue;
      }

      let index = this.buffer.characterIndexForPosition(position);
      let node = rootNode.descendantForIndex(index);
      while (node) {
        // We aren't checking against the predicate yet because passing the
        // predicate won't end our search. Users will reasonably expect that
        // returning `true` from the predicate will mean that the predicate
        // won't run any more. Since the predicate can have side effects, we
        // should keep this contract. That means throwing all nodes into the
        // bucket and not sifting through them until later.
        //
        // TODO: If we need to optimize performance here, we could compromise
        // by re-running the predicate at the end even though we already know
        // it's going to match.
        results.push({ node, depth, grammar });
        node = node.parent;
      }
    }

    // Sort results from smallest to largest.
    results.sort((a, b) => {
      return (
        // Favor smaller nodes first…
        nodeBreadth(a.node) - nodeBreadth(b.node) ||
        // …but deeper grammars in case of ties.
        b.depth - a.depth
      );
    });

    for (let { node, grammar } of results) {
      if (where(node, grammar)) { return node; }
    }
    return null;
  }

  /*
  Section - Folds
  */
  getFoldableRangeContainingPoint(point) {
    point = this.buffer.clipPosition(point);
    if (point.column >= this.buffer.lineLengthForRow(point.row)) {
      let fold = this.getFoldRangeForRow(point.row);
      if (fold) { return fold; }
    }

    // Move backwards until we find a fold range containing this row.
    for (let row = point.row - 1; row >= 0; row--) {
      let range = this.getFoldRangeForRow(row);
      if (range && range.containsPoint(point)) { return range; }
    }

    return null;
  }

  getFoldableRanges() {
    if (!this.tokenized) { return []; }

    let layers = this.getAllLanguageLayers();
    let allFolds = [];
    for (let layer of layers) {
      let folds = layer.foldResolver.getAllFoldRanges();
      allFolds.push(...folds);
    }
    return allFolds;
  }

  // This method is improperly named, and is based on an assumption that every
  // nesting of folds carries an extra level of indentation. Several languages
  // violate that — perhaps most notably the C grammar in its use of nested
  // folds within `#ifdef` and its siblings.
  //
  // Instead, a level of `0` means “all folds,” a level of `1` means “all folds
  // that are contained by exactly one other fold,” and so on. This happens to
  // work as expected if you're working in a language where nested folds are
  // always indented relative to their enclosing fold, but it doesn't require
  // it.
  //
  getFoldableRangesAtIndentLevel(goalLevel) {
    if (!this.tokenized) { return []; }

    let rangeTree = createTree(comparePoints);

    // No easy way around this. The way to pull it off is to get _all_ folds in
    // the document on all language layers, then place their boundaries into a
    // red-black tree so we can iterate through them later in the proper order
    // while keeping track of nesting level.
    let layers = this.getAllLanguageLayers();
    for (let layer of layers) {
      let folds = layer.foldResolver.getAllFoldRanges();

      for (let fold of folds) {
        rangeTree = rangeTree.insert(fold.start, { start: fold });
        rangeTree = rangeTree.insert(fold.end, { end: fold });
      }
    }

    let foldsByLevel = new Index();
    let currentLevel = 0;
    let iterator = rangeTree.begin;

    // Whatever `currentLevel` is at when we reach a given `@fold.start` marker
    // is the depth of that marker.
    while (iterator.key) {
      let { start, end } = iterator.value;
      if (start) {
        foldsByLevel.add(currentLevel, start);
        currentLevel++;
      } else if (end) {
        currentLevel--;
      }
      iterator.next();
    }

    return foldsByLevel.get(goalLevel) || [];
  }

  // Adjusts a buffer position by a fixed number of characters.
  adjustPositionByOffset(position, offset) {
    let { buffer } = this;
    let index = buffer.characterIndexForPosition(position);
    index += offset;
    return buffer.positionForCharacterIndex(index);
  }

  isFoldableAtRow(row) {
    if (this.isFoldableCache[row] != null) {
      return !!this.isFoldableCache[row];
    }

    let range = this.getFoldRangeForRow(row);

    // Don't bother to cache this result before we're able to load the folds
    // query.
    if (this.tokenized) {
      // We can easily keep track of _if_ this row is foldable, even if edits
      // to the buffer end up moving this row around. But we don't bother to
      // cache the actual _range_ because it'd just get stale once the buffer
      // is edited. Better to wait and look it up when it's needed.
      this.isFoldableCache[row] = !!range;
    }
    return !!range;
  }

  getFoldRangeForRow(row) {
    if (!this.tokenized) { return null; }

    let rowEnd = this.buffer.lineLengthForRow(row);
    let point = new Point(row, rowEnd);
    let layers = this.languageLayersAtPoint(point);

    let leadingCandidate = null;
    // Multiple language layers may want to claim a fold for a given row.
    // Prefer deeper layers over shallower ones.
    for (let layer of layers) {
      let { depth } = layer;
      let candidateFold = layer.foldResolver?.getFoldRangeForRow(row);
      if (!candidateFold) { continue; }
      if (!leadingCandidate || depth > leadingCandidate.depth) {
        leadingCandidate = { fold: candidateFold, depth };
      }
    }

    return leadingCandidate?.fold ?? null;
  }

  /*
  Section - Comments
  */

  // Returns the correct comment delimiters for the given buffer position. This
  // may be defined on the grammar itself, but it can also be defined as a
  // scope-specific setting for scenarios where a language has different
  // comment delimiters for different contexts.
  //
  // Returns `commentStartString` and (sometimes) `commentEndString`
  // properties. If only the former is a {String}, then “Toggle Line Comments”
  // will insert a line comment; if both are {String}s, it'll insert a block
  // comment.
  //
  // NOTE: This method also returns a `commentDelimiters` property with
  // metadata about the comment delimiters at the given position. Since the
  // main purpose of this method, historically, has been to determine which
  // delimiter(s) to use for the “Toggle Line Comment” command, we adjust the
  // position we're given to cover the first non-whitespace content on the line
  // for more accurate results. But `commentDelimiters` contains unadjusted
  // data wherever possible because we don't make assumptions about how the
  // caller will use the data.
  //
  // This might produce surprising results sometimes — like `commentDelimiters`
  // containing delimiters from a different language than the delimiters in the
  // other returned properties. But that's OK. Consumers of this function will
  // know why those properties disagree and which one they're most interested
  // in, and it still makes sense for these different use cases to share code.
  //
  // TODO: When toggling comments on a line or buffer range, our understanding
  // of the correct delimiters for a given buffer position is only as granular
  // as the entire buffer row. This can bite us in edge cases like JSX. It's
  // the right decision if the user toggles a comment with an empty selection,
  // but if specific buffer text is selected, we should look up the right
  // delimiters for that specific range. This will require a new branch in the
  // “Editor: Toggle Line Comments” command.
  commentStringsForPosition(position) {
    const range = this.firstNonWhitespaceRange(position.row) ||
      new Range(position, position);

    // Ask the config system if it has a setting for this scope. This allows
    // for overrides from the grammar default.
    const scope = this.scopeDescriptorForPosition(range.start);
    const commentStartEntries = this.config.getAll(
      'editor.commentStart', { scope });
    const commentEndEntries = this.config.getAll(
      'editor.commentEnd', { scope });

    // If a `commentDelimiters` setting exists, attach it to the return object.
    // This can contain more comprehensive delimiter metadata for snippets and
    // other purposes.
    //
    // This is just general metadata. We don't know the user's intended use
    // case. So we should look up the scope descriptor of the _original_
    // position, not the one at the beginning of the line.
    const originalScope = this.scopeDescriptorForPosition(position);
    const commentDelimiters = getDelimitersForScope(originalScope);

    // The two config entries are separate, but if they're paired, then we need
    // to make sure we're reading them from the same layer. Otherwise we could
    // wind up with, say, `<!--` and `*/` as “paired” delimiters.
    const commentStartEntry = commentStartEntries.find(entry => !!entry);
    const commentEndEntry = commentEndEntries.find(entry => {
      return entry.scopeSelector === commentStartEntry?.scopeSelector
    });

    if (commentStartEntry) {
      return {
        commentStartString: commentStartEntry && commentStartEntry.value,
        commentEndString: commentEndEntry && commentEndEntry.value,
        commentDelimiters: commentDelimiters
      };
    } else {
      // If we have only comment delimiter data, rather than the legacy
      // `comment(Start|End)` settings, we can still construct the expected
      // output.
      let adjustedDelimiters = getDelimitersForScope(scope);
      if (adjustedDelimiters) {
        let result = commentStringsFromDelimiters(adjustedDelimiters);
        if (commentDelimiters) {
          result.commentDelimiters = commentDelimiters;
        }
        return result;
      }
    }

    // Fall back to looking up this information on the grammar. (This is better
    // than just returning `commentDelimiters` data because we still want to
    // take the adjusted range into account if we can.)
    const { grammar } = this.getSyntaxNodeAndGrammarContainingRange(range);
    const { grammar: originalPositionGrammar } = this.getSyntaxNodeAndGrammarContainingRange(new Range(position, position));

    if (grammar && grammar.getCommentDelimiters) {
      let delimiters = grammar.getCommentDelimiters();
      let result = commentStringsFromDelimiters(delimiters);
      if (originalPositionGrammar !== grammar) {
        let originalPositionDelimiters = originalPositionGrammar.getCommentDelimiters();
        result = {
          ...result,
          commentDelimiters: originalPositionDelimiters
        }
      }
      return result;
    } else if (commentDelimiters) {
      // This is an unusual case, and it's the one case that doesn't take into
      // account the difference between the original position and our adjusted
      // position — which is why we've tried other techniques first. But it's
      // better than nothing!
      return commentStringsFromDelimiters(commentDelimiters);
    }
    return {
      commentStartString: undefined,
      commentEndString: undefined,
      commentDelimiters: { line: undefined, block: undefined }
    }
  }

  isRowCommented(row) {
    const range = this.firstNonWhitespaceRange(row);
    if (range) {
      let descriptor = this.scopeDescriptorForPosition(range.start);
      return descriptor.getScopesArray().some(
        scope => COMMENT_MATCHER(scope)
      );
    }
    return false;
  }

  /*
  Section - auto-indent
  */

  indentLevelForLine(line, tabLength) {
    let indentLength = 0;
    for (let i = 0, { length } = line; i < length; i++) {
      const char = line[i];
      if (char === '\t') {
        indentLength += tabLength - (indentLength % tabLength);
      } else if (char === ' ') {
        indentLength++;
      } else {
        break;
      }
    }
    return indentLength / tabLength
  }

  // In an ideal world, we would use synchronous indentation all the time. It's
  // feature-equivalent to TextMate-style indentation.
  //
  // But it requires us to be able to tell the editor, at an arbitrary point in
  // time, what the suggested indentation for a buffer row is. We might get
  // asked this question only once in a transaction — or 100 times. We don't
  // know ahead of time. And if we want to be able to answer the question
  // synchronously, we must reparse the buffer synchronously _each time_.
  //
  // That's fine in the only-one-edit case, but unacceptable in the
  // 100-edits-in-one-transaction case. The problem isn't the extra work; it's
  // the extra _lag_. We don't want the editor to freeze because we're doing
  // 100 buffer parses in a row.
  //
  // In order to do synchronous indentation most of the time while still
  // guarding against this edge case, we'll
  //
  // * start out each transaction preferring synchronous indentation, but
  // * switch to async indentation if our time budget is exceeded in any one
  //   transaction.
  //
  shouldUseAsyncIndent() {
    let result = true;
    if (!this.useAsyncParsing || !this.useAsyncIndent) result = false;
    if (this.currentTransactionReparseBudgetMs > 0) {
      result = false;
    }
    return result;
  }

  // Get the suggested indentation level for an existing line in the buffer.
  //
  // * `bufferRow` - A {Number} indicating the buffer row.
  // * `tabLength` - A {Number} signifying the length of a tab, in spaces,
  //   according to the current settings of the buffer.
  // * `options` (optional) - An {Object} will the following properties,all of
  //   which are optional:
  // * `options.skipBlankLines`: {Boolean} indicating whether to ignore blank
  //   lines when determining which row to use as a reference row. Default is
  //   `true`. Irrelevant if `options.comparisonRow` is specified.
  // * `options.skipDedentCheck`: {Boolean} indicationg whether to skip the
  //   second phase of the check and determine only if the current row should
  //   _start out_ indented from the reference row.
  // * `options.preserveLeadingWhitespace`: {Boolean} indicating whether to
  //   adjust the returned number to account for the indentation level of any
  //   whitespace that may already be on the row. Defaults to `false`.
  // * `options.forceTreeParse`: {Boolean} indicating whether to force this
  //   method to synchronously parse the buffer into a tree, even if it
  //   otherwise would not. Defaults to `false`.
  // * `options.comparisonRow`: A {Number} specifying the row to use as a
  //   reference row. Must be a valid row that occurs earlier in the buffer
  //   than `row`. If omitted, this method will determine the reference row on
  //   its own.
  //
  // Will return either an immediate result or a {Promise}, depending on
  // whether it can make a synchronous decision.
  //
  // When acting synchronously, this method returns a {Number}, or {null} if
  // this method cannot make a suggestion. It will return a synchronous result
  // if (a) the tree is clean, (b) the language mode decides it can afford to
  // do a synchronous re-parse of the buffer, or (c) `options.forceTreeParse`
  // is `true`. Otherwise, this method will wait until the end of the current
  // buffer transaction.
  //
  // When acting asynchronously, this method may or may not be able to give an
  // answer. If it can, it will return a {Promise} that resolves with a
  // {Number} signifying the suggested indentation level. If it can't — because
  // it thinks the content has been altered too much for it to make a
  // suggestion — it will return a {Promise} that resolves with {undefined},
  // signalling that a fallback style of indentation adjustment should take
  // place.
  //
  suggestedIndentForBufferRow(row, tabLength, rawOptions = {}) {
    // NOTE: This method is hundreds of lines long, but so much of that total
    // consists of comments like this one — because this is a hard thing to
    // intuit. This code needs lots of explanation, but that doesn't mean
    // that the logic is impossibly complex.
    let root = this.rootLanguageLayer;
    if (row === 0) { return 0; }
    if (!root || !root.tree || !root.ready) { return null; }

    let options = {
      skipBlankLines: true,
      skipDedentCheck: false,
      preserveLeadingWhitespace: false,
      indentationLevels: null,
      forceTreeParse: false,
      ...rawOptions
    };

    let originalControllingLayer = options.controllingLayer;

    let comparisonRow = options.comparisonRow;
    if (comparisonRow === undefined) {
      comparisonRow = row - 1;
      if (options.skipBlankLines) {
        // It usually makes no sense to compare to a blank row, so we'll move
        // upward until we find a line with text on it.
        while (this.buffer.isRowBlank(comparisonRow) && comparisonRow > 0) {
          comparisonRow--;
        }
      }
    }

    let existingIndent = 0;
    if (options.preserveLeadingWhitespace) {
      // When this option is true, the indent level we return will be _added
      // to_ however much indentation is already present on the line. Whatever
      // the purpose of this option, we can't just pretend it isn't there,
      // because it will produce silly outcomes. Instead, let's account for
      // that level of indentation and try to subtract it from whatever level
      // we return later on.
      //
      // Sadly, if the row is _more_ indented than we need it to be, we won't
      // be able to dedent it into the correct position. This option probably
      // needs to be revisited.
      existingIndent = this.indentLevelForLine(
        this.buffer.lineForRow(row), tabLength);
    }
    let comparisonRowIndent = options.comparisonRowIndent;
    if (comparisonRowIndent === undefined) {
      comparisonRowIndent = this.indentLevelForLine(
        this.buffer.lineForRow(comparisonRow), tabLength);
    }

    // What's the right place to measure from? Often we're here because the
    // user just hit Enter, which means we'd run before injection layers have
    // been re-parsed. Hence the injection's language layer might not know
    // whether it controls the point at the cursor. So instead we look for the
    // layer that controls the point at the end of the comparison row. This may
    // not always be correct, but we'll find out.
    let comparisonRowEnd = new Point(
      comparisonRow,
      this.buffer.lineLengthForRow(comparisonRow)
    );

    // Find the deepest layer that actually has an indents query. (Layers that
    // don't define one, such as specialized injection grammars, are telling us
    // they don't care about indentation. If a grammar wants to _prevent_ a
    // shallower layer from controlling indentation, it should define an empty
    // `indents.scm`, perhaps with an explanatory comment.)
    let controllingLayer = this.controllingLayerAtPoint(
      comparisonRowEnd,
      (layer) => {
        if (!layer.indentsQuery) return false;
        // We want to exclude layers with a content range that _begins at_ the
        // cursor position. Why? Because the content that starts at the cursor
        // is about to shift down to the next line. It'd be odd if that layer
        // was in charge of the indentation hint if it didn't have any content
        // on the preceding line.
        //
        // So first we test for containment exclusive of endpoints…
        if (layer.containsPoint(comparisonRowEnd, true)) {
          return true;
        }

        // …but we'll still accept layers that have a content range which
        // _ends_ at the cursor position.
        return layer.getCurrentRanges()?.some(r => {
          return r.end.compare(comparisonRowEnd) === 0;
        });
      }
    );

    if (!controllingLayer) {
      // There's no layer with an indents query to help us out. The default
      // behavior in this situation with any grammar — even plain text — is to
      // match the previous line's indentation.
      return comparisonRowIndent - existingIndent;
    }

    let { indentsQuery, scopeResolver } = controllingLayer;

    // TODO: We use `ScopeResolver` here so that we can use its tests. Maybe we
    // need a way to share those tests across different kinds of capture
    // resolvers.
    scopeResolver.reset();

    let indentTree = null;
    if (options.tree && originalControllingLayer === controllingLayer) {
      // Make sure this tree belongs to the layer we expect it to.
      indentTree = options.tree;
    }

    if (!indentTree) {
      if (!controllingLayer.treeIsDirty || options.forceTreeParse || !this.shouldUseAsyncIndent()) {
        // If we're in this code path, it either means the tree is clean (the
        // `get` path) or that we're willing to spend the time to do a
        // synchronous reparse (the `parse` path). Either way, we'll be able to
        // deliver a synchronous answer to the question.
        indentTree = controllingLayer.getOrParseTree();
      } else {
        // We can't answer this yet because we don't yet have a new syntax
        // tree, and are unwilling to spend time doing a synchronous re-parse.
        // Return a promise that will fulfill once the transaction is over.
        //
        // TODO: For async, we might need an approach where we suggest a
        // preliminary indent level and then follow up later with a more
        // accurate one. It's a bit disorienting that the editor falls back to
        // an indent level of `0` when a newline is inserted.
        let comparisonRowText = this.buffer.lineForRow(comparisonRow)
        let rowText = this.buffer.lineForRow(row)
        return this.atTransactionEnd().then(({ changeCount }) => {
          let shouldFallback = false;
          // If this was the only change in the transaction, then we can
          // definitely adjust the indentation level after the fact. If not,
          // then we might still be able to make indentation decisions in cases
          // where they do not affect one another.
          //
          // Hence if neither the comparison row nor the current row has had
          // its contents change in any way since we were first called, we will
          // assume it's safe to adjust the indentation level after the fact.
          // Otherwise we'll fall back to a single transaction-wide indentation
          // adjustment — fewer tree parses, but more likely to produce unusual
          // results.
          if (changeCount > 1) {
            if (comparisonRowText !== this.buffer.lineForRow(comparisonRow)) {
              shouldFallback = true;
            }
            if (rowText !== this.buffer.lineForRow(row)) {
              shouldFallback = true;
            }
          }
          if (shouldFallback) {
            // We're now revisiting this indentation question at the end of the
            // transaction. Other changes may have taken place since we were
            // first asked what the indent level should be for this line. So
            // how do we know if the question is still relevant? After all, the
            // text that was on this row earlier might be on some other row
            // now.
            //
            // So we compare the text that was on the row when we were first
            // called… to the text that is on the row now that the transaction
            // is over. If they're the same, that's a _strong_ indicator that
            // the result we return will still be relevant.
            //
            // If not, as is the case in this code path, we return `undefined`,
            // signalling to the `TextEditor` that its only recourse is to
            // auto-indent the whole extent of the transaction instead.
            return undefined;
          }

          // If we get this far, it's safe to auto-indent this line. Either it
          // was the only change in its transaction or the other changes
          // happened on different lines. But we've retained the original
          // values for `comparisonRow` and `comparisonRowIndent` because
          // that's the proper basis from which to determine the given row's
          // indent level.
          let result = this.suggestedIndentForBufferRow(row, tabLength, {
            ...rawOptions,
            comparisonRow: comparisonRow,
            comparisonRowIndent: comparisonRowIndent,
            tree: controllingLayer.tree,
            controllingLayer
          });
          return result;
        });
      }
    }

    let positionSet = new Set;

    // Capture in two phases. The first phase covers any captures from the
    // comparison row that can cause the _following_ row to be indented.
    let indentCaptures = indentsQuery.captures(
      indentTree.rootNode,
      { row: comparisonRow, column: 0 },
      { row: row, column: 0 }
    );

    let indentCapturePosition = null;
    let indentDelta = 0;
    let dedentNextDelta = 0;

    for (let capture of indentCaptures) {
      let { node, name, setProperties: props = {} } = capture;

      // Ignore “phantom” nodes that aren't present in the buffer.
      if (node.text === '' && !props['indent.allowEmpty']) {
        continue;
      }

      // Ignore anything that isn't actually on the row.
      if (node.endPosition.row < comparisonRow) { continue; }
      if (node.startPosition.row > comparisonRow) { continue; }

      // Ignore anything that fails a scope test.
      if (!scopeResolver.store(capture)) { continue; }

      // Only consider a given combination of capture name and buffer range
      // once, even if it's captured more than once in `indents.scm`.
      let key = `${name}/${node.startIndex}/${node.endIndex}`;
      if (positionSet.has(key)) { continue; }
      positionSet.add(key);

      if (name === 'indent') {
        if (indentCapturePosition === null) {
          indentCapturePosition = node.endPosition;
        }
        indentDelta++;
      } else if (name === 'dedent.next') {
        // This isn't often needed, but it's a way for the current line to
        // signal that the _next_ line should be dedented no matter what its
        // content is.
        dedentNextDelta++;
      } else if (name === 'dedent') {
        // `dedent` tokens don't count for anything unless they happen
        // after the first `indent` token. They only tell us whether an indent
        // that _seems_ like it should happen is cancelled out.
        //
        // Consider:
        //
        // } else if (foo) {
        //
        // We should still indent the succeeding line because the initial `}`
        // does not cancel out the `{` at the end of the line. On the other
        // hand:
        //
        // } else if (foo) {}
        //
        // The second `}` _does_ cancel out the first occurrence of `{` because
        // it comes later.
        if (!indentCapturePosition || comparePoints(node.startPosition, indentCapturePosition) < 0) {
          // This capture either happened before the first indent capture on
          // the row or is _the same node_ as the indent capture, in which case
          // we should construe the dedent as happening _before_ the indent.
          //
          // For example: the "elsif" node in Ruby triggers a dedent on its own
          // line, but also signals an indent on the next line. The dedent
          // shouldn't cancel out the indent.
          continue;
        }
        indentDelta--;
        if (indentDelta < 0) {
          // In the _indent_ phase, the delta won't ever go lower than `0`.
          // This is because we assume that the previous line is correctly
          // indented! The only function that `dedent` serves for us in this
          // phase is canceling out an earlier `indent` and preventing false
          // positives.
          //
          // So no matter how many `dedent` tokens we see on a particular line…
          // if the _last_ token we see is an `indent` token, then it hints
          // that the next line should be indented by one level.
          indentDelta = 0;
        }

      }
    }

    // `@indent` and `@dedent` can increase the next line's indent level by one
    // at most, and can't decrease the next line's indent level at all on their
    // own.
    //
    // Why? There are few coding patterns in the wild that would cause us to
    // indent more than one level based on tokens found on the _previous_ line.
    // And there are also few scenarios in which we'd want to dedent a certain
    // line before we even know the content of that line.
    //
    // Hence we distill the results above into a net indentation level change
    // of either 1 or 0, depending on whether we saw more `@indent`s than
    // `@dedent`s.
    //
    // If there's a genuine need to dedent the current row based solely on the
    // content of the comparison row, then `@dedent.next` can be used.
    //
    // And if a language needs to indent more than one level from one line to
    // the next, then `@match` captures can be used to specify an exact level
    // of indentation relative to another specific node. If a `@match` capture
    // exists, we'll catch it in the dedent captures phase, and these
    // heuristics will be ignored.
    //
    indentDelta = clamp(indentDelta, 0, 1);

    // Process `@dedent.next` captures as a last step; they act as a strong
    // hint about the next line's indentation.
    indentDelta -= clamp(dedentNextDelta, 0, 1);

    let dedentDelta = 0;

    if (!options.skipDedentCheck) {
      scopeResolver.reset();

      // The controlling layer on the previous line gets to decide what our
      // starting indent is on the current line. But it might not extend to the
      // current line, so we should determine which layer is in charge of the
      // second phase.
      let rowStart = new Point(row, 0);
      let dedentControllingLayer = this.controllingLayerAtPoint(
        rowStart,
        (layer) => {
          if (!layer.indentsQuery) return false;
          // We're inverting the logic from above: now we want to allow layers
          // that _begin_ at the cursor and exclude layers that _end_ at the
          // cursor. Because we'll be analyzing content that comes _after_ the
          // cursor to understand whether to dedent!
          //
          // So first we test for containment exclusive of endpoints…
          if (layer.containsPoint(rowStart, true)) {
            return true;
          }

          // …but we'll still accept layers that have a content range which
          // _starts_ at the cursor position.
          return layer.getCurrentRanges()?.some(r => {
            return r.start.compare(rowStart) === 0;
          });
        }
      );

      if (dedentControllingLayer && dedentControllingLayer !== controllingLayer) {
        // If this layer is different from the one we used above, then we
        // should run this layer's indents query against its own tree. (If _no_
        // layers qualify at this position, we won't hit this code path, so
        // we'll reluctantly still use the original layer and tree.)
        indentsQuery = dedentControllingLayer.indentsQuery;
        indentTree = dedentControllingLayer.getOrParseTree();
      }

      // The second phase covers any captures on the current line that can
      // cause the current line to be indented or dedented.
      let dedentCaptures = indentsQuery.captures(
        indentTree.rootNode,
        { row: row, column: 0 },
        { row: row + 1, column: 0 }
      );

      let currentRowText = this.buffer.lineForRow(row);
      currentRowText = currentRowText.trim();
      positionSet.clear();

      for (let capture of dedentCaptures) {
        let { name, node, setProperties: props = {} } = capture;
        let { text } = node;

        // Ignore “phantom” nodes that aren't present in the buffer.
        if (text === '' && !props['indent.allowEmpty']) { continue; }

        // Ignore anything that isn't actually on the row.
        if (node.endPosition.row < row) { continue; }
        if (node.startPosition.row > row) { continue; }

        // Ignore anything that fails a scope test.
        if (!scopeResolver.store(capture)) { continue; }

        // Imagine you've got:
        //
        // { ^foo, bar } = something
        //
        // and the caret represents the cursor. Pressing Enter will move
        // everything after the cursor to a new line and _should_ indent the
        // line, even though there's a closing brace on the new line that would
        // otherwise mark a dedent.
        //
        // Thus we don't want to honor a `@dedent` or `@match` capture unless
        // it's the first non-whitespace content in the line. We'll use similar
        // logic for `suggestedIndentForEditedBufferRow`.
        //
        // If a capture is confident it knows what it's doing, it can opt out
        // of this behavior with `(#set! indent.force true)`.
        if (!props['indent.force'] && !currentRowText.startsWith(text)) { continue; }

        // The '@match' capture short-circuits a lot of this logic by pointing
        // us to a different node and asking us to match the indentation of
        // whatever row that node starts on.
        if (name === 'match') {
          let matchIndentLevel = this.resolveIndentMatchCapture(
            capture, row, tabLength, options.indentationLevels);
          if (typeof matchIndentLevel === 'number') {
            scopeResolver.reset();
            return Math.max(matchIndentLevel - existingIndent, 0);
          }
        } else if (name === 'none') {
          scopeResolver.reset();
          return 0;
        }

        // Only `@dedent` or `@match` captures can change this line's
        // indentation. We handled `@match` above, so we'll filter out all non-
        // `@dedent`s now.
        if (name !== 'dedent') { continue; }

        // Only consider a given range once, even if it's marked with multiple
        // captures.
        let key = `${node.startIndex}/${node.endIndex}`;
        if (positionSet.has(key)) { continue; }
        positionSet.add(key);
        dedentDelta--;
      }

      // `@indent`/`@dedent` captures, no matter how many there are, can
      // dedent the current line by one level at most. To indent more than
      // that, one must use a `@match` capture.
      dedentDelta = clamp(dedentDelta, -1, 0);
    }

    scopeResolver.reset();
    let finalIndent = comparisonRowIndent + indentDelta + dedentDelta + existingIndent;
    // console.log('score:', comparisonRowIndent, '+', indentDelta, '-', ((dedentDelta < 0) ? -dedentDelta : dedentDelta), '=', finalIndent);

    return Math.max(finalIndent - existingIndent, 0);
  }

  // Given a range of buffer rows, retrieves the suggested indent for each one
  // while re-using the same tree. Prevents a tree re-parse after each
  // individual line adjustment when auto-indenting.
  //
  // * startRow - The row {Number} to start at
  // * endRow - The row {Number} to end at
  //
  // Returns a {Map} whose keys are rows and whose values are desired
  // indentation levels. May not return the entire range of requested rows, in
  // which case the caller should auto-indent the remaining rows through
  // another means. May also return {null} to signify that no auto-indent
  // should be attempted at all for the given range.
  suggestedIndentForBufferRows(startRow, endRow, tabLength, options = {}) {
    let root = this.rootLanguageLayer;
    if (!root || !root.tree) {
      let results = new Map();
      for (let row = startRow; row <= endRow; row++) {
        results.set(row, null);
      }
      return results;
    }

    let results = new Map();
    let comparisonRow = null;
    let comparisonRowIndent = null;

    let { isPastedText = false } = options;
    let indentDelta;

    for (let row = startRow; row <= endRow; row++) {
      // If this row were being indented by `suggestedIndentForBufferRow`, it'd
      // look at the end of the previous row to find the controlling layer,
      // because we start at the previous row to find the suggested indent for
      // the current row.
      let controllingLayer = this.controllingLayerAtPoint(
        this.buffer.clipPosition(new Point(row - 1, Infinity)),
        // This query isn't as precise as the one we end up making later, but
        // that's OK. This is just a first pass.
        (layer) => !!layer.indentsQuery && !!layer.tree
      );
      if (isPastedText) {
        // In this mode, we're not trying to auto-indent every line; instead,
        // we're trying to auto-indent the _first_ line of a region of text
        // that's just been pasted, while trying to preserve the relative
        // levels of indentation within the pasted region. So if the
        // auto-indent of the first line increases its indent by one level,
        // all other lines should also be increased by one level — without even
        // consulting their own suggested indent levels.
        if (row === startRow) {
          // The only time we consult the indents query is for the first row,
          // so we're not going to insist that the _entire range_ fall under
          // the control of a layer with an indents query — just the row we
          // need.
          if (!controllingLayer) { return null; }
          let tree = controllingLayer.getOrParseTree();

          let firstLineCurrentIndent = this.indentLevelForLine(
            this.buffer.lineForRow(row), tabLength);

          let firstLineIdealIndent = this.suggestedIndentForBufferRow(
            row,
            tabLength,
            {
              ...options,
              controllingLayer,
              tree
            }
          );

          if (firstLineIdealIndent == null) {
            // If we decline to suggest an indent level for the first line,
            // then there's no change to be made here. Keep the whole region
            // the way it is.
            return null;
          } else {
            indentDelta = firstLineIdealIndent - firstLineCurrentIndent;
            if (indentDelta === 0) {
              // If the first row doesn't have to be adjusted, neither do any
              // others.
              return null;
            }
            results.set(row, firstLineIdealIndent);
          }
          continue;
        }

        // All rows other than the first are easy — just apply the delta.
        let actualIndent = this.indentLevelForLine(
          this.buffer.lineForRow(row), tabLength);

        results.set(row, actualIndent + indentDelta);
        continue;
      }

      // For line X to know its appropriate indentation level, it needs row X-1,
      // if it exists, to be indented properly. That's why `TextEditor` wants to
      // indent each line atomically. Instead, we'll determine the right level
      // for the first row, then supply the result for the previous row when we
      // call `suggestedIndentForBufferRow` for the _next_ row, and so on, so
      // that `suggestedIndentForBufferRow` doesn't try to look up the comparison
      // row itself and find out we haven't actually fixed any of the previous
      // rows' indentations yet.
      let indent;
      if (controllingLayer) {
        let tree = controllingLayer.getOrParseTree();
        let rowOptions = {
          ...options,
          tree,
          comparisonRow: comparisonRow ?? undefined,
          comparisonRowIndent: comparisonRowIndent ?? undefined,
          indentationLevels: results
        };
        indent = this.suggestedIndentForBufferRow(row, tabLength, rowOptions);
        if (indent === null) {
          // We could not retrieve the correct indentation level for this row
          // without re-parsing the tree. We should give up and return what we
          // have so that `TextEditor` can finish the job through a less
          // efficient means.
          return results;
        }
      } else {
        // We could not retrieve the correct indentation level for this row
        // because it isn't governed by any layer that has an indents query.
        return results;
      }
      results.set(row, indent);
      comparisonRow = row;
      comparisonRowIndent = indent;
    }

    return results;
  }

  // Get the suggested indentation level for a line in the buffer on which the
  // user is currently typing. This may return a different result from
  // {::suggestedIndentForBufferRow} in order to avoid unexpected changes in
  // indentation. It may also return undefined if no change should be made.
  //
  // * row - The row {Number}
  //
  // Returns a {Number}.
  suggestedIndentForEditedBufferRow(row, tabLength, options = {}) {
    const line = this.buffer.lineForRow(row);
    const currentRowIndent = this.indentLevelForLine(line, tabLength);

    // If the row is not indented at all, we have nothing to do, because we can
    // only dedent a line at this phase.
    if (currentRowIndent === 0) { return; }

    // If we're on the first row, we have no preceding line to compare
    // ourselves to. We should do nothing.
    if (row === 0) { return; }

    // By the time this function runs, we probably know enough to be sure of
    // which layer controls the beginning of this row, even if we don't know
    // which one owns the position at the cursor.
    let controllingLayer = this.controllingLayerAtPoint(
      new Point(row, 0),
      (layer) => !!layer.indentsQuery
    );

    if (!controllingLayer) { return undefined; }

    let { indentsQuery, scopeResolver } = controllingLayer;
    if (!indentsQuery) { return undefined; }

    // TODO: We use `ScopeResolver` here so that we can use its tests. Maybe we
    // need a way to share those tests across different kinds of capture
    // resolvers.
    scopeResolver.reset();

    // Ideally, we're running when the tree is clean, but if not, we must
    // re-parse the tree in order to make an accurate indents query.
    let indentTree = options.tree;
    if (!indentTree) {
      if (!controllingLayer.treeIsDirty || options.forceTreeParse || !this.useAsyncIndent || !this.useAsyncParsing) {
        indentTree = controllingLayer.getOrParseTree();
      } else {
        return this.atTransactionEnd().then(({ changeCount }) => {
          if (changeCount > 1) {
            // Unlike `suggestedIndentForBufferRow`, we should not return
            // `undefined` here and implicitly tell `TextEditor` to handle the
            // auto-indent itself. If there were several changes in this
            // transaction, we missed our chance to dedent this row, and should
            // return `null` to signal that `TextEditor` should do nothing
            // about it.
            return null;
          }
          let result = this.suggestedIndentForEditedBufferRow(row, tabLength, {
            ...options,
            tree: controllingLayer.tree
          });
          if (currentRowIndent === result) {
            // Return `null` here so that `TextEditor` realizes that no work
            // needs to be done.
            return null;
          }
          return result;
        });
      }
    }

    if (!indentTree) {
      console.error(`No indent tree!`, controllingLayer.inspect());
      return undefined;
    }

    const indents = indentsQuery.captures(
      indentTree.rootNode,
      { row: row, column: 0 },
      { row: row + 1, column: 0 }
    );

    let lineText = this.buffer.lineForRow(row).trim();

    // This is the indent level that is suggested from context — the level we'd
    // have if this row were completely blank. We won't alter the indent level
    // of the current row — even if it's “wrong” — unless typing triggers a
    // dedent. But once a dedent is triggered, we should dedent one level from
    // this value, not from the current row indent.
    //
    // If more than one level of dedent is needed, a `@match` capture must be
    // used so that indent level can be expressed in absolute terms.
    const originalRowIndent = this.suggestedIndentForBufferRow(row, tabLength, {
      skipBlankLines: true,
      skipDedentCheck: true,
      tree: indentTree
    });

    let seenDedent = false;
    for (let indent of indents) {
      let { node, setProperties: props = {} } = indent;
      // Ignore captures that aren't on this row.
      if (node.startPosition.row !== row) { continue; }
      // Ignore captures that fail their scope tests.
      if (!scopeResolver.store(indent)) { continue; }

      // For all captures — even `@match` captures — we get one bite at the
      // apple, and it's when the text of the capture is the only
      // non-whitespace text on the line.
      //
      // Otherwise, this capture will assert itself after every keystroke, and
      // the user has no way to opt out of the correction.
      //
      // If the capture is confident it knows what it's doing, and is using
      // some other mechanism to ensure the adjustment will happen exactly
      // once, it can bypass this behavior with `(#set! indent.force true)`.
      //
      if (!props['indent.force'] && node.text !== lineText) { continue; }

      // `@match` is authoritative; honor the first one we see and ignore other
      // captures.
      if (indent.name === 'match') {
        let matchIndentLevel = this.resolveIndentMatchCapture(indent, row, tabLength);
        if (typeof matchIndentLevel === 'number') {
          scopeResolver.reset();
          return matchIndentLevel;
        }
      } else if (indent.name === 'none') {
        scopeResolver.reset();
        return 0;
      }

      if (indent.name !== 'dedent') { continue; }

      // Even after we've seen a `@dedent`, we allow the loop to continue,
      // because we'd prefer a `@match` capture over this `@dedent` capture
      // even if it happened to come later in the loop.
      seenDedent = true;
    }

    scopeResolver.reset();

    if (seenDedent) {
      return Math.max(0, originalRowIndent - 1);
    }

    return currentRowIndent;
  }

  // Get the suggested indentation level for a given line of text, if it were
  // inserted at the given row in the buffer.
  //
  // * bufferRow - A {Number} indicating the buffer row
  //
  // Returns a {Number}.
  suggestedIndentForLineAtBufferRow(row, line, tabLength) {
    // We can't answer this question accurately for text that isn't yet in the
    // tree, so instead we'll just note that this request was made and try to
    // correct indentation when the transaction is over.
    this.autoIndentRequests++;
    return this.suggestedIndentForBufferRow(row, tabLength);
  }

  // Private

  // Given a `@match` capture, attempts to resolve it to an absolute
  // indentation level.
  resolveIndentMatchCapture(capture, currentRow, tabLength, indentationLevels = null) {
    let { node, setProperties: props = {} } = capture;

    // A `@match` capture must specify
    //
    //  (#set! indent.matchIndentOf foo)
    //
    // where "foo" is a node descriptor. It may optionally specify
    //
    //  (#set! indent.offsetIndent X)
    //
    // where "X" is a number, positive or negative.
    //
    if (!props['indent.matchIndentOf']) { return undefined; }
    let offsetIndent = props['indent.offsetIndent'] ?? "0";
    offsetIndent = Number(offsetIndent);
    if (isNaN(offsetIndent)) { offsetIndent = 0; }

    // Follow a node descriptor to a target node.
    let targetPosition = resolveNodePosition(node, props['indent.matchIndentOf']);

    // That node must start on a row earlier than ours.
    let targetRow = targetPosition?.row;
    if (typeof targetRow !== 'number' || targetRow >= currentRow) {
      return undefined;
    }

    let baseIndent;
    if (indentationLevels) {
      // If we were given this table of indentation levels, it means we're in a
      // “batch” mode where we're trying to cut down on the number of tree
      // re-parses. In this scenario, if the row we want is represented in the
      // table, we should use the level indicated by the table. If it isn't,
      // that's a sign that the line is outside of the range being
      // batch-indented, which would mean that it's safe to look up its level
      // directly.
      baseIndent = indentationLevels.get(targetRow);
    }
    if (!baseIndent) {
      baseIndent = this.indentLevelForLine(
        this.buffer.lineForRow(targetRow), tabLength);
    }

    // An offset can optionally be applied to the target.
    let result = baseIndent + offsetIndent;

    return Math.max(result, 0);
  }

  getAllInjectionLayers() {
    let markers =  this.injectionsMarkerLayer.getMarkers();
    return markers.map(m => m.languageLayer);
  }

  getAllLanguageLayers(where = null) {
    let layers = [
      this.rootLanguageLayer,
      ...this.getAllInjectionLayers()
    ];
    if (!where) return layers;

    let results = [];
    for (let layer of layers) {
      if (!where(layer)) continue;
      results.push(layer);
    }

    return results;
  }

  // Given a {Point}, returns all injection {LanguageLayer}s whose extent
  // includes that point. Does not include the root language layer.
  //
  // A {LanguageLayer} can have multiple content ranges. Its “extent” is a
  // single contiguous {Range} that includes all of its content ranges. To
  // return only layers with a content range that spans the given point, pass
  // `{ exact: true }` as the second argument.
  //
  // * point - A {Point} representing a buffer position.
  // * options - An {Object} containing these keys:
  //   * exact - {Boolean} that checks content ranges instead of extent.
  injectionLayersAtPoint(point, { exact = false } = {}) {
    let injectionMarkers = this.injectionsMarkerLayer.findMarkers({
      containsPosition: point
    });

    injectionMarkers.sort((a, b) => {
      return a.getRange().compare(b.getRange()) ||
        b.depth - a.depth;
    });

    let results = injectionMarkers.map(m => m.languageLayer);

    if (exact) {
      results = results.filter(l => l.containsPoint(point));
    }
    return results;
  }

  // Given a {Point}, returns all {LanguageLayer}s whose extent includes that
  // point.
  //
  // A {LanguageLayer} can have multiple content ranges. Its “extent” is a
  // single contiguous {Range} that includes all of its content ranges. To
  // return only layers with a content range that spans the given point, pass
  // `{ exact: true }` as the second argument.
  //
  // * point - A {Point} representing a buffer position.
  // * options - An {Object} containing these keys:
  //   * exact - {Boolean} that checks content ranges instead of extent.
  languageLayersAtPoint(point, { exact = false } = {}) {
    let injectionLayers = this.injectionLayersAtPoint(point, { exact });
    return [
      this.rootLanguageLayer,
      ...injectionLayers
    ];
  }

  // Returns the deepest language layer at a given point, or optionally the
  // deepest layer to fulfill a criterion.
  //
  // Will ignore any layer whose content ranges do not include the point, even if
  // the point is within its extent.
  controllingLayerAtPoint(point, where = FUNCTION_TRUE) {
    let layers = this.languageLayersAtPoint(point, { exact: true });

    // Deeper layers go first.
    layers.sort((a, b) => b.depth - a.depth);
    return layers.find(layer => where(layer)) ?? null;
  }

  firstNonWhitespaceRange(row) {
    return this.buffer.findInRangeSync(
      /\S/,
      new Range(new Point(row, 0), new Point(row, Infinity))
    );
  }

  // DEPRECATED

  tokenizedLineForRow(row) {
    const lineText = this.buffer.lineForRow(row);
    const tokens = [];

    const iterator = this.buildHighlightIterator();
    let start = { row, column: 0 };

    const scopes = iterator.seek(start, row) || [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const end = { ...iterator.getPosition() };
      if (end.row > row) {
        end.row = row;
        end.column = lineText.length;
      }

      if (end.column > start.column) {
        tokens.push(
          new Token({
            value: lineText.substring(start.column, end.column),
            scopes: scopes.map(s => this.scopeNameForScopeId(s))
          })
        );
      }

      if (end.column < lineText.length) {
        const closeScopeCount = iterator.getCloseScopeIds().length;
        for (let i = 0; i < closeScopeCount; i++) {
          scopes.pop();
        }
        scopes.push(...iterator.getOpenScopeIds());
        start = end;
        iterator.moveToSuccessor();
      } else {
        break;
      }
    }

    return new TokenizedLine({
      openScopes: [],
      text: lineText,
      tokens,
      tags: [],
      ruleStack: [],
      lineEnding: this.buffer.lineEndingForRow(row),
      tokenIterator: this.tokenIterator,
      grammar: this.grammar
    });
  }

  tokenForPosition(point) {
    if (Array.isArray(point)) {
      point = new Point(...point);
    }
    const scopes = this.scopeDescriptorForPosition(point).getScopesArray();
    let range = this.bufferRangeForScopeAtPosition(
      last(scopes),
      point
    );
    return new Token({
      scopes,
      value: this.buffer.getTextInRange(range)
    });
  }
}

// Responsible for deciding the ranges of folds on a given language layer.
//
// Understands two kinds of folds:
//
// * A “simple” fold is one with a capture name of `@fold` in a folds query. It
//   can be described with only one capture. It starts at the end of the row
//   that the captured node starts on, and ends at a configurable position
//   controlled by the `fold.endAt` adjustment (which defaults to
//   `lastChild.startPosition`).
//
//   Simple folds should be used whenever you're able to predict the end of a
//   fold range simply from holding a reference to its starting node.
//
// * A “divided” fold is one where the two ends of the fold must be described
//   in two separate query captures. It starts at the end of the row of a node
//   captured with the name of `@fold.start`, and it ends at the very next
//   `@fold.end` that it encounters in the document.
//
//   When determining the end of a fold that is marked with `@fold.start`,
//   Pulsar will search the buffer for the next “balanced” occurrence of
//   `@fold.end`. For instance, when trying to find a match for a `@fold.start`
//   on row 9, Pulsar might encounter another `@fold.start` on row 10,
//   and would then understand that the next `@fold.end` it sees will end
//   _that_ fold and not the one we're looking for. If Pulsar _does not_ find a
//   matching `@fold.end`, the given line will not be considered to be
//   foldable.
//
//   Because they can trigger a buffer-wide search, divided folds are
//   not recommended to use unless they're truly needed. Use them only when the
//   structure of the syntax tree doesn't allow you to determine the end of the
//   fold without applying your own heuristic.
//
class FoldResolver {
  constructor(buffer, layer) {
    this.buffer = buffer;
    this.layer = layer;

    this.boundaries = null;
    this.boundariesStartingPosition = null;
  }

  // Retrieve the first valid fold range for this row in this language layer —
  // that is, the first fold range that spans more than one row.
  getFoldRangeForRow(row) {
    if (!this.layer.tree || !this.layer.foldsQuery) { return null; }
    let start = Point.fromObject({ row, column: 0 });
    let end = Point.fromObject({ row: row + 1, column: 0 });

    let tree = this.layer.getOrParseTree({ force: false });
    let iterator = this.getOrCreateBoundariesIterator(tree.rootNode, start, end);

    while (iterator.key) {
      if (comparePoints(iterator.key.position, end) >= 0) { break; }
      let capture = iterator.value;
      let { name } = capture;
      if (name === 'fold') {
        let range = this.resolveRangeForSimpleFold(capture);
        if (this.isValidFold(range)) { return range; }
      } else if (name === 'fold.start') {
        let range = this.resolveRangeForDividedFold(capture);
        if (this.isValidFold(range)) { return range; }
      }
      iterator.next();
    }

    return null;
  }

  isValidFold(range) {
    return range && range.end.row > range.start.row;
  }

  // Returns all valid fold ranges in this language layer.
  getAllFoldRanges() {
    if (!this.layer.tree || !this.layer.foldsQuery) { return []; }
    let range = this.layer.getExtent();
    let iterator = this.getOrCreateBoundariesIterator(
      this.layer.tree.rootNode, range.start, range.end);

    let results = [];
    while (iterator.key) {
      let capture = iterator.value;
      let { name } = capture;
      if (name === 'fold') {
        let range = this.resolveRangeForSimpleFold(capture);
        if (this.isValidFold(range)) { results.push(range); }
      } else if (name === 'fold.start') {
        let range = this.resolveRangeForDividedFold(capture);
        if (this.isValidFold(range)) { results.push(range); }
      }
      iterator.next();
    }

    return results;
  }

  // Invalidates the fold resolver's cached boundary data in response to a
  // change in the document.
  reset() {
    this.boundaries = null;
    this.boundariesRange = null;
  }

  canReuseBoundaries(start, end) {
    if (!this.boundariesRange) { return false; }
    return this.boundariesRange.containsRange(
      new Range(start, end)
    );
  }

  prefillFoldCache(range) {
    if (!this.layer.tree || !this.layer.foldsQuery) { return; }
    this.getOrCreateBoundariesIterator(
      this.layer.tree.rootNode,
      range.start,
      range.end
    );
  }

  getOrCreateBoundariesIterator(rootNode, start, end) {
    if (!this.layer.tree || !this.layer.foldsQuery) { return null; }
    if (this.canReuseBoundaries(start, end)) {
      let result = this.boundaries.ge(start);
      return result;
    }

    let scopeResolver = this.layer.scopeResolver;
    scopeResolver.reset();

    // Instead of keying off of a plain buffer position, this tree also
    // considers whether the boundary is a fold start or a fold end. If one
    // boundary ends at the same point that another one starts, the ending
    // boundary will be visited first.
    let boundaries = createTree(compareBoundaries);
    let captures = this.layer.foldsQuery.captures(rootNode, start, end);

    for (let capture of captures) {
      // NOTE: Currently, the first fold to match for a given starting position
      // is the only one considered. That's because we use a version of a
      // red-black tree in which we silently ignore any attempts to add a key
      // that is equivalent in value to that of a previously added key.
      //
      // Attempts to use `capture.final` and `capture.shy` won't harm anything,
      // but they'll be redundant. Other types of custom predicates, however,
      // should work just fine.
      let result = scopeResolver.store(capture);
      if (!result) { continue; }

      // Some folds are unusual enough that they can flip from valid to
      // invalid, or vice versa, based on edits to rows other than their
      // starting row. We need to keep track of these nodes so that we can
      // invalidate the fold cache properly when edits happen inside of them.
      if (scopeResolver.shouldInvalidateFoldOnChange(capture)) {
        this.layer.foldNodesToInvalidateOnChange.add(capture.node.id);
      }

      if (capture.node.startPosition.row < start.row) {
        // This fold starts before the range we're interested in. We needed to
        // run these nodes through the scope resolver for various reasons, but
        // they're not relevant to our iterator.
        continue;
      }
      if (capture.name === 'fold') {
        boundaries = boundaries.insert({
          position: capture.node.startPosition,
          boundary: 'start'
        }, capture);
      } else if (capture.name.startsWith('fold.')) {
        let key = this.keyForDividedFold(capture);
        boundaries = boundaries.insert(key, capture);
      }
    }

    scopeResolver.reset();

    this.boundaries = boundaries;
    this.boundariesRange = new Range(start, end);

    return boundaries.ge(start);
  }

  // Given a `@fold.start` capture, queries the rest of the layer's extent to
  // find a matching `@fold.end`.
  resolveRangeForDividedFold(capture) {
    let { name } = capture;
    let key = this.keyForDividedFold(capture);
    if (name !== 'fold.start') { return null; }

    let extent = this.layer.getExtent();

    let iterator = this.getOrCreateBoundariesIterator(
      this.layer.tree.rootNode,
      key.position,
      extent.end
    );

    let depth = 0;
    let matchedEndCapture = null;

    while (iterator.key && comparePoints(iterator.key.position, extent.end) <= 0) {
      let { name, node } = iterator.value;
      let isSelf = node.id === capture.node.id;
      if (name === 'fold.end' && !isSelf) {
        if (depth === 0) {
          matchedEndCapture = iterator.value;
          break;
        } else {
          depth--;
        }
      } else if (name === 'fold.start' && !isSelf) {
        // A later `fold.start` has occurred, so the next `fold.end` will pair
        // with it, not with ours.
        depth++;
      }
      iterator.next();
    }

    // There's no guarantee that a matching `@fold.end` will even appear, so if
    // it doesn't, then this row does not contain a valid fold.
    if (!matchedEndCapture) { return null; }

    return new Range(
      this.resolvePositionForDividedFold(capture),
      this.resolvePositionForDividedFold(matchedEndCapture)
    );
  }

  keyForDividedFold(capture) {
    let { name, node } = capture;
    if (name === 'fold.start') {
      // Eventually we'll alter this position to occur at the end of the given
      // row, but we keep the original value around for a while because we want
      // to honor whichever fold technically happens “earliest” on a given row.
      return { position: node.startPosition, boundary: 'start' };
    } else if (name === 'fold.end') {
      return { position: node.startPosition, boundary: 'end' };
    } else {
      return null;
    }
  }

  // Returns `true` if there is no non-whitespace content on this position's
  // row before this position's column.
  positionIsNotPrecededByTextOnLine(position) {
    let textForRow = this.buffer.lineForRow(position.row)
    let precedingText = textForRow.substring(0, position.column)
    return !(/\S/.test(precedingText))
  }

  resolvePositionForDividedFold(capture) {
    let { name, node } = capture;
    if (name === 'fold.start') {
      return new Point(node.startPosition.row, Infinity);
    } else if (name === 'fold.end') {
      let end = node.startPosition;
      if (end.column === 0 || this.positionIsNotPrecededByTextOnLine(end)) {
        // If the fold ends at the start of the line, adjust it so that it
        // actually ends at the end of the previous line. This behavior is
        // implied in the existing specs.
        return new Point(end.row - 1, Infinity);
      } else {
        return new Point.fromObject(end, true);
      }
    } else {
      return null;
    }
  }

  normalizeFoldProperty(prop) {
    if (prop.startsWith('fold.')) {
      prop = prop.replace(/^fold./, '');
    }
    return prop;
  }

  capturePropertyIsFoldAdjustment(prop) {
    prop = this.normalizeFoldProperty(prop);
    return prop in FoldResolver.ADJUSTMENTS;
  }

  applyFoldAdjustment(prop, ...args) {
    prop = this.normalizeFoldProperty(prop);
    return FoldResolver.ADJUSTMENTS[prop](...args);
  }

  resolveRangeForSimpleFold(capture) {
    let { node, setProperties: props } = capture;
    if (node.type === 'ERROR') { return null; }
    let start = new Point(node.startPosition.row, Infinity);
    let end = node.endPosition;

    let defaultOptions = { 'fold.endAt': 'lastChild.startPosition' };
    let options = { ...defaultOptions, ...props };

    try {
      for (let key in options) {
        if (!this.capturePropertyIsFoldAdjustment(key)) { continue; }
        let value = options[key];
        end = this.applyFoldAdjustment(key, end, node, value, props, this.layer);
      }

      end = Point.fromObject(end, true);
      end = this.buffer.clipPosition(end);

      if (end.row <= start.row) { return null; }
      return new Range(start, end);
    } catch (error) {
      // If any of our assumptions are violated, fall back to an end point that we know can't fail: the end of the captured node itself.
      console.warn("Error resolving fold range:");
      console.warn(error.message);
      return new Range(start, node.range.end);
    }
  }
}

FoldResolver.ADJUSTMENTS = {
  // Use a node position descriptor to describe where the fold should end.
  // Overrides the default descriptor of `lastChild.startPosition`.
  endAt(end, node, value) {
    end = resolveNodePosition(node, value);
    return end;
  },

  // Adjust the end point by a fixed number of characters in either direction.
  // Will cross rows if necessary.
  offsetEnd(end, node, value, props, layer) {
    let { languageMode } = layer;
    value = Number(value);
    if (isNaN(value)) { return end; }
    return languageMode.adjustPositionByOffset(end, value);
  },

  // Adjust the column of the fold's end point. Use `0` to end the fold at the
  // start of the line.
  adjustEndColumn(end, node, value, props, layer) {
    let column = Number(value);
    if (isNaN(column)) { return end; }
    let newEnd = Point.fromObject({ column, row: end.row });
    return layer.buffer.clipPosition(newEnd);
  },

  // Adjust the end point to be immediately before the current line begins.
  // Useful if the end line also contains the start of a fold and thus should
  // stay on a separate screen line.
  adjustToEndOfPreviousRow(end) {
    return new Point(end.row - 1, Infinity);
  }
};

class NullLanguageModeHighlightIterator {
  seek() {
    return [];
  }
  compare() {
    return 1;
  }
  moveToSuccessor() {}
  getPosition() {
    return Point.INFINITY;
  }
  getOpenScopeIds() {
    return [];
  }
  getCloseScopeIds() {
    return [];
  }
}

class NullLayerHighlightIterator {
  seek() {
    return [false, new OpenScopeMap];
  }
  compare() {
    return 1;
  }
  moveToSuccessor() {}
  getPosition() {
    return Point.INFINITY;
  }
  getOpenScopeIds() {
    return [];
  }
  getCloseScopeIds() {
    return [];
  }
}

let lastIteratorId = 0;

// An iterator for marking boundaries in the buffer to apply syntax
// highlighting.
//
// Manages a collection of `LayerHighlightIterators`, which are the classes
// doing the real work of marking boundaries. `HighlightIterator` is in charge
// of understanding, at any given point, which of the iterators needs to be
// advanced next.
class HighlightIterator {
  constructor(languageMode) {
    this.id = lastIteratorId++;
    this.languageMode = languageMode;
    this.iterators = null;
  }

  inspect() {
    return `[HighlightIterator id=${this.id} iterators=${this.iterators?.length ?? 0}]`;
  }

  seek(start, endRow) {
    if (!(start instanceof Point)) {
      start = Point.fromObject(start, true);
    }
    let { buffer, rootLanguageLayer } = this.languageMode;
    if (!rootLanguageLayer) { return []; }

    let end = {
      row: endRow,
      column: buffer.lineLengthForRow(endRow)
    };

    this.end = end;
    this.iterators = [];

    if (Math.max(start.column, end.column) > LINE_LENGTH_LIMIT_FOR_HIGHLIGHTING) {
      return [];
    }

    let injectionMarkers = this.languageMode.injectionsMarkerLayer.findMarkers(
      {
        intersectsRange: new Range(
          start,
          new Point(endRow + 1, 0)
        )
      }
    );

    injectionMarkers.sort((a, b) => {
      // Shallower injections get visited first.
      return a.languageLayer.depth - b.languageLayer.depth;
    });

    const iterator = rootLanguageLayer.buildHighlightIterator();

    // We need to know which open scopes were contributed by which language
    // layer so that we know which ones to “cover” if we see an injection with
    // the `coverShallowerScopes` option.
    //
    // What's worse is that we need to know _where_ each of those open scopes
    // would've been added, because that open scope shouldn't truly be added
    // _if_ it would've been suppressed by a deeper layer.
    let openScopesByLayer = new Map();

    // The contract of `LayerHighlightIterator#seek` is different from the
    // contract of `HighlightIterator#seek`. Instead of an array of open
    // scopes, we have it return an two-item array.
    //
    // The first item is a boolean that indicates whether the iterator needs to
    // mark anything _within_ the range that will be highlighted. If not, it
    // doesn't need to go into the list of iterators.
    //
    // The second item is an `OpenScopeMap` (rather than just an array of
    // already open scopes) that retains information about where each open
    // scope was opened, because we'll need that information in a moment.
    //
    let [result, openScopes] = iterator.seek(start, endRow);

    if (rootLanguageLayer?.tree?.rootNode.hasChanges()) {
      // The tree is dirty. We should keep going — if we stop now, then the
      // user will see a flash of unhighlighted text over this whole range. But
      // we should also schedule a re-highlight at the end of the transaction,
      // once the tree will be clean again.
      let range = new Range(start, iterator._getEndPosition(endRow));
      this.languageMode.atTransactionEnd().then(() => {
        this.languageMode.emitRangeUpdate(range);
      });
    }

    // An iterator can contribute to the list of already open scopes even if it
    // has no boundaries to mark within the range of this highlighting job.
    openScopesByLayer.set(iterator, openScopes);

    if (result) {
      this.iterators.push(iterator);
    }

    // The logic that we use for `coverShallowerScopes` needs to be respected
    // here. As we build these iterators, if we find that any of them cover
    // their parent iterator at this position, we need to revisit the list of
    // open scopes, removing any that aren't their layer's base language scope.
    for (const marker of injectionMarkers) {
      const iterator = marker.languageLayer.buildHighlightIterator();
      let [result, openScopes] = iterator.seek(start, endRow);

      // Just as with the root layer, any injection layer may need to add to
      // the list of open scopes whether or not they need to mark anything
      // within this range.
      if (result) { this.iterators.push(iterator); }

      if (iterator?.languageLayer?.injectionPoint?.coverShallowerScopes) {
        // The procedure we follow for covering scopes in the _middle_ of a
        // highlighting task needs to be emulated when deciding which scopes
        // are already open at the _start_ of the task. This layer wants to
        // cover shallower scopes, so we need to re-assess our list of already
        // open scopes to see if any of them _would've_ been covered at the
        // point when they were opened.
        let ranges = iterator.languageLayer.getCurrentRanges();
        for (let [earlierIterator, earlierOpenScopes] of openScopesByLayer) {
          // It's possible, though uncommon, for injections to overlap, because
          // there's no mechanism that prevents it. Since we sorted the layers
          // by depth earlier, this iterator won't have a lower depth than the
          // previous one. But it may have _the same_ depth, so we need to
          // account for that.
          if (earlierIterator.depth >= iterator.depth) { continue; }

          // For each of the open scopes that an earlier iterator gave us, we
          // need to look at the point at which that scope would've been added.
          // If that point falls within the purview of our newer iterator, then
          // we should suppress that scope unless it's the layer's base
          // language scope.
          let languageScopeId = earlierIterator.languageLayer.languageScopeId;
          for (let [point, scopes] of earlierOpenScopes) {
            let pointIsCoveredByNewIterator = ranges.some(r => r.containsPoint(point));
            if (!pointIsCoveredByNewIterator) { continue; }
            earlierOpenScopes.set(point, scopes.filter(id => id === languageScopeId));
          }
        }
      }
      openScopesByLayer.set(iterator, openScopes);
    }

    // Sort the iterators so that the last one in the array is the earliest
    // in the document, and represents the current position.
    this.iterators.sort((a, b) => b.compare(a));

    this.detectCoveredScope();

    // Our nightmare is almost over, but one chore remains. The ordering of
    // already open scopes should be consistent; scopes added earlier in the
    // buffer should appear in the list before scopes added later. This ensures
    // that, e.g., `scopeDescriptorForPosition` returns scopes in the proper
    // hierarchy.
    let sortedOpenScopes = [];

    // First we'll gather all the point/scope-list pairs into a flat list…
    let unsortedScopeBundles = [];
    for (let [iterator, layerOpenScopeMap] of openScopesByLayer) {
      for (let [point, scopes] of layerOpenScopeMap) {
        unsortedScopeBundles.push({ point, scopes, iterator });
      }
    }

    // …then sort them by buffer position, with shallower layers first in case
    // of ties.
    unsortedScopeBundles.sort((a, b) => (
      a.point.compare(b.point) || a.iterator.depth - b.iterator.depth
    ));

    // Now we can flatten all the scopes themselves, preserving order.
    for (let { scopes } of unsortedScopeBundles) {
      sortedOpenScopes.push(...scopes);
    }

    return sortedOpenScopes;
  }

  moveToSuccessor() {
    // `this.iterators` is _always_ sorted from farthest position to nearest
    // position, so the last item in the collection is always the next one to
    // act.
    let leader = last(this.iterators);
    if (!leader) { return; }

    if (leader.moveToSuccessor()) {
      // It was able to move to a successor, so now we have to "file" it into
      // the right place in `this.iterators` so that the sorting is correct.
      const leaderIndex = this.iterators.length - 1;
      let i = leaderIndex;
      while (i > 0 && this.iterators[i - 1].compare(leader) < 0) {
        i--;
      }
      if (i < leaderIndex) {
        this.iterators.splice(i, 0, this.iterators.pop());
      }
    } else {
      // It was not able to move to a successor, so it must be done. Remove it
      // from the collection.
      this.iterators.pop();
    }

    this.detectCoveredScope();
  }

  getPosition() {
    let iterator = last(this.iterators || []);
    if (iterator) {
      // this.logPosition();
      return iterator.getPosition();
    } else {
      return Point.INFINITY;
    }
  }

  getCloseScopeIds() {
    let iterator = last(this.iterators);
    // if (this.currentIteratorIsCovered === true || this.currentIteratorIsCovered === 'close') {
    //   console.log(
    //     iterator.name,
    //     iterator.depth,
    //     'would close',
    //     iterator._inspectScopes(
    //       iterator.getCloseScopeIds()
    //     ),
    //     'at',
    //     iterator.getPosition().toString(),
    //     'but scope is covered!'
    //   );
    // } else {
    //   console.log(
    //     iterator.name,
    //     iterator.depth,
    //     'CLOSING',
    //     iterator.getPosition().toString(),
    //     iterator._inspectScopes(
    //       iterator.getCloseScopeIds()
    //     )
    //   );
    // }
    if (iterator) {
      // If this iterator is covered completely, or if it's covered in a
      // position that prevents us from closing scopes…
      if (this.currentIteratorIsCovered === true || this.currentIteratorIsCovered === 'close') {
        // …then the only closing scope we're allowed to apply is one that ends
        // the base scope of an injection range.
        return iterator.getCloseScopeIds().filter(id => {
          return iterator.languageLayer.languageScopeId === id;
        });
      } else {
        return iterator.getCloseScopeIds();
      }
    }
    return [];
  }

  getOpenScopeIds() {
    let iterator = last(this.iterators);
    // let ids = iterator.getOpenScopeIds();
    // if (this.currentIteratorIsCovered === true || this.currentIteratorIsCovered === 'open') {
    //   console.log(
    //     iterator.name,
    //     iterator.depth,
    //     'would open',
    //     iterator._inspectScopes(
    //       iterator.getOpenScopeIds()
    //     ),
    //     'at',
    //     iterator.getPosition().toString(),
    //     'but scope is covered!'
    //   );
    // } else {
    //   console.log(
    //     iterator.name,
    //     iterator.depth,
    //     'OPENING',
    //     iterator.getPosition().toString(),
    //     iterator._inspectScopes(
    //       iterator.getOpenScopeIds()
    //     )
    //   );
    // }
    if (iterator) {
      // If this iterator is covered completely, or if it's covered in a
      // position that prevents us from opening scopes…
      if (this.currentIteratorIsCovered === true || this.currentIteratorIsCovered === 'open') {
        // …then the only opening scope we're allowed to apply is one that ends
        // the base scope of an injection range.
        return iterator.getOpenScopeIds().filter(id => {
          return iterator.languageLayer.languageScopeId === id;
        });
      } else {
        return iterator.getOpenScopeIds();
      }
    }
    return [];
  }

  // Detect whether the iterator that's about to act has its scopes covered by
  // a different iterator asserting a `coverShallowerScopes` option.
  detectCoveredScope() {
    const layerCount = this.iterators.length;
    if (layerCount > 1) {
      const rest = [...this.iterators];
      const leader = rest.pop();
      let covers = false;
      for (let it of rest) {
        let iteratorCovers = it.coversIteratorAtPosition(leader, leader.getPosition());
        if (iteratorCovers !== false) {
          covers = iteratorCovers;
          break;
        }
      }

      if (covers) {
        this.currentIteratorIsCovered = covers;
        return;
      }
    }

    this.currentIteratorIsCovered = false;
  }

  logPosition() {
    let iterator = last(this.iterators);
    iterator?.logPosition();
  }
}

const EMPTY_SCOPES = Object.freeze([]);

// Iterates through everything that a `LanguageLayer` is responsible for,
// marking boundaries for scope insertion.
class LayerHighlightIterator {
  constructor(languageLayer) {
    this.languageLayer = languageLayer;
    this.name = languageLayer.grammar.scopeName;
    this.depth = languageLayer.depth;

    let { injectionPoint } = this.languageLayer;

    this.coverShallowerScopes = injectionPoint?.coverShallowerScopes ?? false
  }

  // If this isn't the root language layer, we need to make sure this iterator
  // doesn't try to go past its marker boundary.
  _getEndPosition(endRow) {
    let { marker } = this.languageLayer;
    let { buffer } = this.languageLayer.languageMode;
    let naiveEndPoint = new Point(
      endRow,
      buffer.lineLengthForRow(endRow)
    );

    if (marker) {
      return Point.min(marker.getRange().end, naiveEndPoint)
    } else {
      return buffer.clipPosition(naiveEndPoint);
    }
  }

  // TODO: This still doesn't make much sense, so I suppose it's good that
  // we've now made it an opt-in feature.
  //
  // The main problem with this logic is that it runs the risk of covering only
  // one half of a pair of boundaries. If a scope range from the root layer is
  // coterminous with a scope range from an injection layer, that's easy to
  // detect and handle; but what if the root layer's range starts at the same
  // point but ends later? We'd prevent the root layer from opening the scope
  // but not closing it.
  //
  // I still don't fully understand the use cases for `detectCoveredScope`,
  // though I assume there are at least a few. I am quite sure, however, that
  // if we want an injection layer to veto a shallower layer's scope, it ought
  // to happen in a way that either prevents _both_ boundaries or allows _both_
  // boundaries. I'm not sure how to pull that off at this point, though.
  //
  // https://github.com/atom/atom/pull/19556 has good discussion about the
  // impetus for this feature.
  coversIteratorAtPosition(iterator, position) {
    // When does a layer prevent another layer from applying scopes?

    // When the option is asserted…
    if (!this.coverShallowerScopes) { return false; }

    // …and this iterator is deeper than the other…
    if (iterator.depth > this.depth) { return false; }

    // …and one of this iterator's content ranges actually includes this
    // position. (With caveats!)
    let ranges = this.languageLayer.getCurrentRanges();
    if (ranges) {
      // A given layer's content ranges aren't allowed to overlap each other.
      // So only a single range from this list can possibly match.
      let overlappingRange = ranges.find(range => range.containsPoint(position))
      if (!overlappingRange) return false;

      // If the current position is right in the middle of an injection's
      // range, then it should cover all attempts to apply scopes. But what if
      // we're on one of its edges? Since closing scopes act before opening
      // scopes,
      //
      // * if this iterator _starts_ a range at position X, it doesn't get to
      //   prevent another iterator from _ending_ a scope at position X;
      // * if this iterator _ends_ a range at position X, it doesn't get to
      //   prevent another iterator from _starting_ a scope at position X.
      //
      // So at a given position, `currentIteratorIsCovered` can be `true` (all
      // scopes suppressed), `false` (none suppressed), `"close"` (only closing
      // scopes suppressed), or `"open"` (only opening scopes suppressed).
      if (overlappingRange.end.compare(position) === 0) {
        // We're at the right edge of the injection range. We want to prevent
        // iterators from closing scopes, but not from opening them.
        return 'close';
      } else if (overlappingRange.start.compare(position) === 0) {
        // We're at the left edge of the injection range. We want to prevent
        // iterators from opening scopes, but not from closing them.
        return 'open';
      } else {
        return true;
      }
    }
  }

  seek(start, endRow) {
    let end = this._getEndPosition(endRow);
    // let isDevMode = atom.inDevMode();

    // let timeKey;
    // if (isDevMode) {
    //   timeKey = `${this.name} getSyntaxBoundaries`;
    //   console.time(timeKey);
    // }
    let [boundaries, openScopes] = this.languageLayer.getSyntaxBoundaries(
      start, end);

    this.iterator = boundaries?.begin;
    if (!this.iterator?.key) {
      return [false, openScopes];
    }

    this.start = Point.fromObject(start, true);
    this.end = end;
    // if (isDevMode) { console.timeEnd(timeKey); }
    return [true, openScopes];
  }

  isAtInjectionBoundary() {
    let position = Point.fromObject(this.iterator.key.position);
    return position.isEqual(this.start) || position.isEqual(this.end);
  }

  _inspectScopes(ids) {
    if (Array.isArray(ids)) {
      return ids.map(id => this._inspectScopes(id)).join(', ')
    }
    return this.languageLayer.languageMode.scopeNameForScopeId(ids);
  }

  getOpenScopeIds() {
    let { key, value } = this.iterator;
    return key.boundary === 'end' ? EMPTY_SCOPES : [...value.scopeIds];
  }

  getCloseScopeIds() {
    let { key, value } = this.iterator;
    return key.boundary === 'start' ? EMPTY_SCOPES : [...value.scopeIds];
  }

  opensScopes() {
    return this.iterator?.key?.boundary === 'start';
  }

  closesScopes() {
    return this.iterator?.key?.boundary === 'end';
  }

  getPosition() {
    return this.iterator?.key?.position ?? Point.INFINITY;
  }

  logPosition() {
    let pos = this.getPosition();
    let { key, value } = this.iterator;

    let { languageMode } = this.languageLayer;
    let verb = key.boundary === 'end' ? 'close' : 'open';

    console.log(
      `[highlight] (${pos.row}, ${pos.column})`,
      verb,
      value.scopeIds.map(id => languageMode.scopeNameForScopeId(id)),
      'next?',
      this.iterator.hasNext
    );
  }

  compare(other) {
    // First, favor the one whose current position is earlier.
    const result = comparePoints(
      this.iterator.key.position,
      other.iterator.key.position
    );
    if (result !== 0) { return result; }

    // Failing that, favor iterators that need to close scopes over those that
    // don't.
    let ourBoundary = this.iterator.key.boundary;
    let theirBoundary = other.iterator.key.boundary;
    let bothClosing = ourBoundary === 'end' && theirBoundary === 'end';

    if (ourBoundary === 'end' && !bothClosing) {
      return -1;
    } else if (theirBoundary === 'end' && !bothClosing) {
      return 1;
    }

    if (bothClosing) {
      // When both iterators are closing scopes, the deeper layer should act
      // first.
      return other.languageLayer.depth - this.languageLayer.depth;
    } else {
      // When both iterators are opening scopes, the shallower layer should act
      // first.
      return this.languageLayer.depth - other.languageLayer.depth;
    }
  }

  moveToSuccessor() {
    if (!this.iterator.hasNext || this.done) {
      return false;
    }
    this.iterator.next();
    this.done = this.isDone();
    return true;
  }

  peekAtSuccessor() {
    if (!this.iterator.hasNext) { return null; }
    this.iterator.next();
    let key = this.iterator.key;
    this.iterator.prev();
    return key;
  }

  isDone() {
    if (!this.iterator.hasNext) { return true; }
    if (!this.end) { return false; }

    let next = this.peekAtSuccessor();
    return comparePoints(next.position, this.end) > 0;
  }
}

class GrammarLoadError extends Error {
  constructor(grammar, queryType) {
    super(`Grammar ${grammar.scopeName} failed to load its ${queryType}. Please fix this error or contact the maintainer.`);
    this.name = 'GrammarLoadError';
    this.queryType = queryType;
  }
}

// Manages all aspects of a given language's parsing duties over a given region
// of the buffer.
//
// The base `LanguageLayer` that's in charge of the entire buffer is the "root"
// `LanguageLayer`. Other `LanguageLayer`s are created when injections are
// required. Those injected languages may require injections themselves,
// meaning a layer could be of arbitrary depth.
//
// For example: a PHP file could inject an HTML grammar, which in turn injects
// a JavaScript grammar for `SCRIPT` blocks, which in turn injects a regex
// grammar for regular expressions.
//
// Thus, for many editor-related tasks that depend on the context of the
// cursor, we should figure out how many different `LanguageLayer`s are
// operating in that particular region, and either (a) compose their output or
// (b) choose the output of the most specific layer that meets our needs,
// depending on the task.
//
class LanguageLayer {
  constructor(marker, languageMode, grammar, depth, injectionPoint) {
    this.marker = marker;
    this.languageMode = languageMode;
    this.buffer = this.languageMode.buffer;
    this.grammar = grammar;
    this.depth = depth;
    this.injectionPoint = injectionPoint;
    this.rangeList = new RangeList();

    this.nodesToInvalidateOnChange = new Set();
    this.foldNodesToInvalidateOnChange = new Set();

    this.tree = null;
    this.lastSyntaxTree = null;
    this.temporaryTrees = [];
    this.patchSinceCurrentParseStarted = null;

    this.subscriptions = new CompositeDisposable;

    this.currentRangesLayer = this.buffer.addMarkerLayer();
    this.ready = false;

    // A constructor can't go async, so all our async administrative tasks hang
    // off this promise. We can `await this.languageLoaded` later on.
    this.languageLoaded = this.grammar.getLanguage().then(language => {
      this.language = language;
      // All queries are optional. Regular expression language layers, for
      // instance, don't really have a need for any queries other than
      // `highlightsQuery`, and some kinds of layers don't even need
      // `highlightsQuery`.
      let queries = ['highlightsQuery', 'foldsQuery', 'indentsQuery', 'localsQuery', 'tagsQuery'];
      let promises = [];

      for (let queryType of queries) {
        if (grammar[queryType]) {
          let promise = this.grammar.getQuery(queryType).then(query => {
            this[queryType] = query;
          }).catch(() => {
            throw new GrammarLoadError(grammar, queryType);
          });
          promises.push(promise);
        }
      }
      return Promise.all(promises);
    }).catch((err) => {
      if (err.name === 'GrammarLoadError') {
        console.warn(err.message);
        if (err.queryType === 'highlightsQuery') {
          // Recover by setting an empty `highlightsQuery` so that we don't
          // propagate errors.
          //
          // TODO: Warning?
          grammar.highlightsQuery = grammar.setQueryForTest(
            'highlightsQuery',
            `; (placeholder)`
          );
        }
      } else {
        throw err;
      }
    }).then(() => {
      if (atom.inDevMode()) {
        // In dev mode, changes to query files should be applied in real time.
        // This allows someone to save, e.g., `highlights.scm` and immediately
        // see the impact of their change.
        this.observeQueryFileChanges();
      }

      this.tree = null;
      this.scopeResolver = new ScopeResolver(
        this,
        (name, text) => this.languageMode.idForScope(name, text)
      );
      this.foldResolver = new FoldResolver(this.buffer, this);

      // What should our language scope name be? Should we even have one?
      let languageScope;
      if (depth === 0) {
        languageScope = this.grammar.scopeName;
      } else {
        // Injections can control the base scope name of the grammar being
        // injected.
        languageScope = injectionPoint.languageScope;

        // The `languageScope` parameter can be a function. That means we won't
        // decide now; we'll decide later on a range-by-range basis.

        // Honor an explicit `null`, but fall back to the default scope name
        // otherwise.
        if (languageScope === undefined) {
          languageScope = this.grammar.scopeName;
        }
      }

      this.languageScope = languageScope;
      if (languageScope === null || typeof languageScope === 'function') {
        // If `languageScope` is a function, we'll still often end up with a
        // `languageScopeId` (or several); we just won't be able to compute it
        // ahead of time.
        this.languageScopeId = null;
      } else {
        this.languageScopeId = this.languageMode.idForScope(languageScope);
      }
      this.ready = true;
    });
  }

  isDirty() {
    if (!this.tree) { return false; }
    return this.tree.rootNode.hasChanges();
  }

  inspect() {
    let { scopeName } = this.grammar;
    return `[LanguageLayer ${scopeName || '(anonymous)'} depth=${this.depth} file=${this.buffer.getPath()}]`;
  }

  destroy() {
    if (this.destroyed) { return; }
    this.destroyed = true;

    // Clean up all tree-sitter trees.
    let temporaryTrees = this.temporaryTrees ?? [];
    let trees = new Set([this.tree, this.lastSyntaxTree, ...temporaryTrees]);
    trees = [...trees];

    this.tree = null;
    this.lastSyntaxTree = null;
    this.temporaryTrees = [];

    while (trees.length > 0) {
      let tree = trees.pop();
      if (!tree) { continue; }
      tree.delete();
    }

    this.marker?.destroy();
    this.currentRangesLayer?.destroy();
    this.foldResolver?.reset();
    this.scopeResolver?.destroy();
    this.subscriptions.dispose();

    for (const marker of this.languageMode.injectionsMarkerLayer.getMarkers()) {
      if (marker.parentLanguageLayer === this) {
        marker.languageLayer.destroy();
      }
    }
  }

  observeQueryFileChanges() {
    this.subscriptions.add(
      this.grammar.onDidChangeQueryFile(async ({ queryType }) => {
        if (this._pendingQueryFileChange) { return; }
        this._pendingQueryFileChange = true;

        try {
          if (!this[queryType]) { return; }

          let query = await this.grammar.getQuery(queryType);
          this[queryType] = query;

          // Force a re-highlight of this layer's entire region.
          let range = this.getExtent();
          this.languageMode.emitRangeUpdate(range);
          this.nodesToInvalidateOnChange.clear();
          this.foldNodesToInvalidateOnChange.clear();
          this._pendingQueryFileChange = false;
        } catch (error) {
          console.error(`Error parsing query file: ${queryType}`);
          console.error(error);
          this._pendingQueryFileChange = false;
        }
      })
    );
  }

  getExtent() {
    return this.marker?.getRange() ?? this.languageMode.buffer.getRange();
  }

  // Run a highlights query for the given range and process the raw captures
  // through a `ScopeResolver`.
  getSyntaxBoundaries(from, to) {
    let { buffer } = this.languageMode;
    if (!(this.language && this.tree)) {
      return [[], new OpenScopeMap()];
    }

    from = buffer.clipPosition(Point.fromObject(from, true));
    to = buffer.clipPosition(Point.fromObject(to, true));

    let boundaries = createTree(compareBoundaries);
    let extent = this.getExtent();

    let captures = this.highlightsQuery?.captures(this.tree.rootNode, from, to) ?? [];
    this.scopeResolver.reset();

    for (let capture of captures) {
      let { node } = capture;
      if (this.scopeResolver.shouldInvalidateOnChange(capture)) {
        // This node wants to be invalidated in its entirety whenever a change
        // happens within it. This setting should be added to a query whenever
        // (a) a certain node's scope name can change just from its contents
        // changing, and (b) that node can possibly span more than one line.
        //
        // Without this setting, we're liable to invalidate only the line that
        // a change happened on, because we have no other way of knowing how
        // significant of a change it is. If we were able to do so, we'd set
        // this property automatically on any capture that (a) involved a
        // `#match?` predicate, and (b) started and ended on different lines.
        this.nodesToInvalidateOnChange.add(node.id);
      }
      // Phantom nodes invented by the parse tree. Indentation captures can use
      // `allowEmpty` to force these to be considered, but for marking scopes,
      // there's no need for it; it'd just cause us to open and close a scope
      // in the same position.
      if (node.childCount === 0 && node.text === '') { continue; }

      // Ask the `ScopeResolver` to process each capture in turn. Some captures
      // will be ignored if they fail certain tests, and some will have their
      // original range altered.
      this.scopeResolver.store(capture);
    }

    // A `HighlightIterator` will want to know which scopes were already open
    // when this range began. Sadly, we also have to keep track of the point in
    // the buffer at which each of those scopes would've been added, because
    // it's possible that later we'll find out that a deeper iterator has
    // suppressed the application of that scope boundary at that position.
    let alreadyOpenScopes = new OpenScopeMap();

    // How do we add a layer's root scope? There's no easy answer.
    //
    // If we rely on the grammar author to map the tree's root node to the
    // language's root scope, they could forget to do it, or map a scope that
    // isn't the same as the one given in the grammar's config file. We'd also
    // limit the ability of that `highlights.scm` to be used in multiple
    // contexts — for example, the HTML grammar would always carry around a
    // `text.html.basic` scope name no matter where we put it.
    //
    // If we manage it ourselves, we invite the complexity of _manually_
    // applying a root scope — plus knowing when it actually _shouldn't_ be
    // applied, and making sure that `scopeDescriptorForPosition` returns
    // results that agree with reality.
    //
    // Option B is the one we reluctantly choose because it gives us more
    // control. Here's roughly how this works:
    //
    // * The base language scope on the root layer will always be applied.
    // * The base language scope on an injection layer will be applied in areas
    //   where that injection is active, unless we were told otherwise in
    //   `addInjectionPoint`. That method's `languageScope` property can
    //   define another scope name to use instead… or pass `null`, signaling
    //   that we should skip the root scope altogether. (This is the best
    //   approach for special-purpose injections like `todo` and `hyperlink`.)
    // * A grammar can still opt to place a root scope conditionally based on
    //   whether it's on an injection layer. This also allows a grammar to
    //   apply that root scope more selectively in injection contexts if
    //   desired.

    // Ensure the whole source file (or whole bounds of the injection) is
    // annotated with the language's base scope name. We _do not_ want to leave
    // this up to the grammar author; it's too important. Also ensure that the
    // base scope name of an injection covers the true boundaries of where that
    // injection is active.
    //
    // NOTE: If an injection is active over a number of disjoint ranges, this
    // may have some surprising effects. For instance, areas where PHP is
    // injected into HTML…
    //
    //    <h1><?php echo "foo" ?></h1>
    //
    // …will include `<?php`, `echo`, `"foo"`, and `?>`, but may exclude the
    // spaces between those tokens. This is a consequence of the design of
    // a particular tree-sitter parser and should be mitigated with the
    // `includeAdjacentWhitespace` option of `addInjectionPoint`.
    //
    let includedRanges = this.depth === 0 ? [extent] : this.getCurrentRanges();

    let languageScopeIdForRange = () => this.languageScopeId;
    if (typeof this.languageScope === 'function') {
      languageScopeIdForRange = (range) => {
        let scopeName = this.languageScope(this.grammar, this.languageMode.buffer, range);
        if (Array.isArray(scopeName)) {
          return scopeName.map(s => this.languageMode.idForScope(s));
        } else {
          return this.languageMode.idForScope(scopeName);
        }
      };
    }

    if (this.languageScopeId || typeof this.languageScope === 'function') {
      for (let range of includedRanges) {
        // Filter out ranges that have no intersection with ours.
        if (range.end.isLessThanOrEqual(from)) { continue; }
        if (range.start.isGreaterThanOrEqual(to)) { continue; }

        let languageScopeIds = languageScopeIdForRange(range);
        if (!languageScopeIds) continue;

        if (!Array.isArray(languageScopeIds)) {
          languageScopeIds = [languageScopeIds];
        }

        if (range.start.isLessThan(from)) {
          // If we get this far, we know that the base language scope was open
          // when our range began.
          alreadyOpenScopes.set(
            range.start,
            languageScopeIds
          );
        } else {
          // Range start must be between `from` and `to`, or else equal `from`
          // exactly.
          for (let id of languageScopeIds) {
            this.scopeResolver.setBoundary(
              range.start,
              id,
              'open',
              { root: true, length: Infinity }
            );
          }
        }

        if (range.end.isGreaterThan(to)) {
          // Do nothing; we don't need to set this boundary.
        } else {
          // The range must end somewhere within our range.
          //
          // Close the boundaries in the opposite order of how we opened them.
          for (let i = languageScopeIds.length - 1; i >= 0; i--) {
            this.scopeResolver.setBoundary(
              range.end,
              languageScopeIds[i],
              'close',
              { root: true, length: Infinity }
            );
          }
        }
      }
    }

    // `ScopeResolver` ensures that these points will be iterated in buffer
    // order.
    for (let [point, data] of this.scopeResolver) {
      // The boundaries that occur before the start of our range will tell us
      // which scopes should already be open when our range starts.
      if (point.isLessThan(from)) {
        alreadyOpenScopes.set(point, data.open);
        for (let c of data.close) {
          alreadyOpenScopes.removeLastOccurrenceOf(c);
        }
        continue;
      } else if (point.isGreaterThan(to)) {
        continue;
      }

      let OPEN_KEY = { position: point, boundary: 'start' };
      let CLOSE_KEY = { position: point, boundary: 'end' };

      if (data.close.length > 0) {
        boundaries = boundaries.insert(CLOSE_KEY, {
          scopeIds: Object.freeze(data.close)
        });
      }

      if (data.open.length > 0) {
        boundaries = boundaries.insert(OPEN_KEY, {
          scopeIds: Object.freeze(data.open)
        });
      }
    }

    return [boundaries, alreadyOpenScopes];
  }

  buildHighlightIterator() {
    if (this.tree) {
      return new LayerHighlightIterator(this, this.tree);
    } else {
      return new NullLayerHighlightIterator();
    }
  }

  handleTextChange(edit, oldText, newText) {
    // Any text change within the layer invalidates our cached fold boundary
    // tree. This usually isn't a big deal because the language mode's own cache
    // is able to adjust when content shifts up and down, so typically only the
    // ranges that actually change will have fold data re-queried.
    if (this.foldResolver) { this.foldResolver.reset(); }

    const {
      startPosition,
      oldEndPosition,
      newEndPosition
    } = edit;

    if (this.tree) {
      this.tree.edit(edit);
      if (this.lastSyntaxTree && this.tree !== this.lastSyntaxTree) {
        // This happens after an off-schedule parse that we've decided we can
        // re-use at the end of the current transaction. But when that happens,
        // we'll call `getChangedRanges` between `lastSyntaxTree` and the new
        // tree, so `lastSyntaxTree` needs to receive the same tree edits.
        this.lastSyntaxTree.edit(edit);
      }
      // We're tentatively marking this tree as dirty; we won't know if it
      // needs to be reparsed until the transaction is done. If it doesn't,
      // that means that the edits didn't encroach on the contents of the
      // layer, and we'll mark those trees as clean at the end of the
      // transaction.
      this.treeIsDirty = true;
      if (this.editedRange) {
        if (startPosition.isLessThan(this.editedRange.start)) {
          this.editedRange.start = startPosition;
        } if (oldEndPosition.isLessThan(this.editedRange.end)) {
          this.editedRange.end = newEndPosition.traverse(
            this.editedRange.end.traversalFrom(oldEndPosition)
          );
        } else {
          this.editedRange.end = newEndPosition;
        }
      } else {
        this.editedRange = new Range(startPosition, newEndPosition);
      }
    }

    if (this.patchSinceCurrentParseStarted) {
      this.patchSinceCurrentParseStarted.splice(
        startPosition,
        oldEndPosition.traversalFrom(startPosition),
        newEndPosition.traversalFrom(startPosition),
        oldText,
        newText
      )
    }
  }

  async update(nodeRangeSet, params = {}) {
    if (!this.languageMode.useAsyncParsing) {
      // Practically speaking, updates that affect _only this layer_ will happen
      // synchronously, because we've made sure not to call this method until the
      // root grammar's tree-sitter parser has been loaded. But we can't load any
      // potential injection layers' languages because we don't know which ones
      // we'll need _until_ we parse this layer's tree for the first time.
      //
      // Thus the first call to `_populateInjections` will probably go async
      // while we wait for the injections' parsers to load, and the user might
      // notice the delay. But once that happens, all subsequent updates _should_
      // be synchronous, except for a case where a change in the buffer causes us
      // to need a new kind of injection whose parser hasn't yet been loaded.
      if (!this.ready) { await this.languageLoaded; }
      await this._performUpdate(nodeRangeSet);
      return true;
    }

    if (!this.currentParsePromise) {
      do {
        params = { ...params, async: false };
        if (!this.ready) {
          params.async = true;
          await this.languageLoaded;
        }
        this.currentParsePromise = this._performUpdate(nodeRangeSet, params);
        if (!params.async) { break; }
        await this.currentParsePromise;
      } while (
        !this.destroyed &&
        (!this.tree || this.tree.rootNode.hasChanges())
      );

      this.currentParsePromise = null;
      // `true` means that this update occurs in its own distinct transaction.
      return true;
    } else {
      // `false` means that the previous transaction isn't done, so this
      // transaction's work will be subsumed into it.
      return false;
    }
  }

  getLocalReferencesAtPoint(point) {
    if (!this.localsQuery) { return []; }
    let captures = this.localsQuery.captures(
      this.tree.rootNode,
      point,
      point + 1
    );

    captures = captures.filter(cap => {
      if (cap.name !== 'local.reference') { return false; }
      if (!rangeForNode(cap.node).containsPoint(point)) {
        return false;
      }
      return true;
    });

    let nodes = captures.map(cap => cap.node);
    nodes = nodes.sort((a, b) => b.range.compare(a.range));

    return nodes;
  }

  // EXPERIMENTAL: Given a local reference node, tries to find the node that
  // defines it.
  findDefinitionForLocalReference(node, captures = null) {
    if (!this.localsQuery) { return []; }
    let name = node.text;
    if (!name) { return []; }
    let localRange = rangeForNode(node);
    let globalScope = this.tree.rootNode;

    if (!captures) {
      captures = this.groupLocalsCaptures(
        this.localsQuery.captures(
          globalScope,
          globalScope.startPosition,
          globalScope.endPosition
        )
      );
    }

    let { scopes, definitions } = captures;

    // Consider only the scopes that can influence our local node.
    let relevantScopes = scopes.filter((scope) => {
      let range = rangeForNode(scope);
      return range.containsRange(localRange);
    }).sort((a, b) => {
      a.range.compare(b.range)
    });

    relevantScopes.push(globalScope);

    // Consider only the definitions whose names match the target's.
    let relevantDefinitions = definitions.filter(
      (def) => def.text === name
    );
    if (relevantDefinitions.length === 0) { return []; }

    let definitionsByBaseScope = new Index();
    for (let rDef of relevantDefinitions) {
      // Find all the scopes that include this definition. The largest of those
      // scopes will be its "base" scope. If there are no scopes that include
      // this definition, it must have been defined globally.
      let rDefScopes = scopes.filter(s => {
        return isBetweenPoints(
          rDef.startPosition,
          s.startPosition,
          s.endPosition
        );
      }).sort((a, b) => {
        return rangeForNode(b).compare(rangeForNode(a));
      });

      let baseScope = rDefScopes[0] ?? globalScope;

      // Group each definition by its scope. Since any variable can be
      // redefined an arbitrary number of times, each scope might include
      // multiple definitions of this identifier.
      definitionsByBaseScope.add(baseScope, rDef);
    }

    // Moving from smallest to largest scope, get definitions that were made in
    // that scope, and return the closest one to the reference.
    for (let scope of relevantScopes) {
      let definitionsInScope = definitionsByBaseScope.get(scope) ?? [];
      let { length } = definitionsInScope;
      if (length === 0) { continue; }
      if (length === 1) { return definitionsInScope[0]; }

      // Here's how we want to sort these candidates:
      //
      // * In each scope, look for a definitions that happen before the local's
      //   position. The closest such definition in the narrowest scope is our
      //   ideal target.
      // * Failing that, take note of all the definitions that happened _after_
      //   the local's position in all relevant scopes. Choose the closest to
      //   the local.
      //
      let definitionsBeforeLocal = [];
      let definitionsAfterLocal = [];

      for (let def of definitionsInScope) {
        let result = comparePoints(def.startPosition, localRange.start);

        let bucket = result < 0 ?
          definitionsBeforeLocal :
          definitionsAfterLocal;

        bucket.push(def);
      }

      if (definitionsBeforeLocal.length > 0) {
        let maxBeforeLocal;
        for (let def of definitionsBeforeLocal) {
          if (!maxBeforeLocal) {
            maxBeforeLocal = def;
            continue;
          }

          let result = comparePoints(def, maxBeforeLocal);
          if (result > 0) {
            maxBeforeLocal = def;
          }
        }
        return maxBeforeLocal;
      }

      // TODO: For definitions that happen after the local in the buffer, it's
      // not 100% clear what the right answer should be. I imagine it varies by
      // language. Best guess for now is the one that's closest to the local
      // reference.
      let minAfterLocal;
      for (let def of definitionsAfterLocal) {
        if (!minAfterLocal) {
          minAfterLocal = def;
          continue;
        }

        let result = comparePoints(def, minAfterLocal);
        if (result < 0) {
          minAfterLocal = def;
        }
      }

      return minAfterLocal;
    }
  }

  groupLocalsCaptures(captures) {
    let scopes = [];
    let definitions = [];
    let references = [];

    for (let capture of captures) {
      let { name, node } = capture;
      switch (name) {
        case 'local.scope':
          scopes.push(node);
          break;
        case 'local.definition':
          definitions.push(node);
          break;
        case 'local.reference':
          references.push(node);
          break;
      }
    }

    return { scopes, definitions, references };
  }

  // Given a range and a `Set` of node IDs, test if any of those nodes' ranges
  // overlap with the given range.
  //
  // We use this to test if a given edit should trigger the behavior indicated
  // by `(fold|highlight).invalidateOnChange`.
  searchForNodesInRange(range, nodeIdSet) {
    let node = this.getSyntaxNodeContainingRange(
      range,
      n => nodeIdSet.has(n.id)
    );

    if (node) {
      // One of this node's ancestors might also be in our list, so we'll
      // traverse upwards and find out.
      let ancestor = node.parent;
      while (ancestor) {
        if (nodeIdSet.has(ancestor.id)) {
          node = ancestor;
        }
        ancestor = ancestor.parent;
      }
      return node;
    }
    return null;
  }

  async _performUpdate(nodeRangeSet, params = {}) {
    // It's much more common in specs than in real life, but it's always
    // possible for a layer to get destroyed during the async period between
    // layer updates.
    if (this.destroyed) return;

    let includedRanges = null;
    this.rangeList.clear();

    if (nodeRangeSet) {
      includedRanges = nodeRangeSet.getRanges(this.languageMode.buffer);
      if (includedRanges.length === 0) {
        // We have no ranges to inject into. This layer should no longer exist.
        const range = this.marker.getRange();
        this.destroy();
        this.languageMode.emitRangeUpdate(range);
        return;
      }
    }

    this.patchSinceCurrentParseStarted = new Patch();
    let language = this.grammar.getLanguageSync();
    let tree;
    if (this.languageMode.useAsyncParsing) {
      tree = this.languageMode.parseAsync(
        language,
        this.tree,
        includedRanges,
        // { tag: `Parsing ${this.inspect()} (async) ${params.id}` }
      );
      if (tree.then) {
        params.async = true;
        tree = await tree;
      }
    } else {
      tree = this.languageMode.parse(
        language,
        this.tree,
        includedRanges,
        // { tag: `Parsing ${this.inspect()} (sync) ${params.id}` }
      );
    }

    let changes = this.patchSinceCurrentParseStarted.getChanges();
    this.patchSinceCurrentParseStarted = null;

    for (let change of changes) {
      let newExtent = Point.fromObject(change.newEnd).traversalFrom(change.newStart);
      tree.edit(
        this._treeEditForBufferChange(
          change.newStart,
          change.oldEnd,
          Point.fromObject(change.oldStart).traverse(newExtent),
          change.oldText,
          change.newText
        )
      );
    }

    if (includedRanges) {
      this.setCurrentRanges(includedRanges);
    }

    let affectedRange = this.editedRange;
    this.lastTransactionEditedRange = this.editedRange;
    this.editedRange = null;

    let foldRangeList = new RangeList();

    // Look for a node that was marked with `invalidateOnChange`. If we find
    // one, we should invalidate that node's entire buffer region.
    if (affectedRange) {

      // First look for nodes that were previously marked with
      // `highlight.invalidateOnChange`; those will specify ranges for which
      // we'll need to force a re-highlight.
      let node = this.searchForNodesInRange(
        affectedRange,
        this.nodesToInvalidateOnChange
      );
      if (node) {
        this.rangeList.add(node.range);
      }

      // Now look for nodes that were previously marked with
      // `fold.invalidateOnChange`; those will specify ranges that need their
      // fold cache updated even when highlighting is unaffected.
      let foldNode = this.searchForNodesInRange(
        affectedRange,
        this.foldNodesToInvalidateOnChange
      );
      if (foldNode) {
        foldRangeList.add(foldNode.range);
      }
    }

    this.nodesToInvalidateOnChange.clear();
    this.foldNodesToInvalidateOnChange.clear();

    if (this.lastSyntaxTree) {
      const rangesWithSyntaxChanges = this.lastSyntaxTree.getChangedRanges(tree);

      let oldSyntaxTree = this.lastSyntaxTree;
      this.lastSyntaxTree = tree;

      let oldTree = this.tree;
      this.tree = tree;
      this.treeIsDirty = false;

      oldTree?.delete();
      oldSyntaxTree?.delete();

      while (this.temporaryTrees.length > 0) {
        let tree = this.temporaryTrees.pop();
        tree.delete();
      }

      if (rangesWithSyntaxChanges.length > 0) {
        for (const range of rangesWithSyntaxChanges) {
          this.rangeList.add(rangeForNode(range));
        }

        const combinedRangeWithSyntaxChange = new Range(
          rangesWithSyntaxChanges[0].startPosition,
          last(rangesWithSyntaxChanges).endPosition
        );

        if (affectedRange) {
          this.rangeList.add(affectedRange);
          affectedRange = affectedRange.union(combinedRangeWithSyntaxChange);
        } else {
          affectedRange = combinedRangeWithSyntaxChange;
        }
      }
    } else {
      this.tree = tree;
      this.treeIsDirty = false;

      // Store a reference to this tree so we can compare it with the next
      // transaction's tree later on.
      this.lastSyntaxTree = tree;

      // Like legacy tree-sitter, we're patching syntax nodes so that they have
      // a `range` property that returns a `Range`. We're doing this for
      // compatibility, but we can't get a reference to the node class itself;
      // we have to wait until we have an instance and grab the prototype from
      // there.
      //
      // This is the earliest place in the editor lifecycle where we're
      // guaranteed to be holding an instance of `Node`. Once we patch it here,
      // we're good to go.
      //
      ensureNodeIsPatched(tree.rootNode);

      this.rangeList.add(rangeForNode(tree.rootNode));
      if (includedRanges) {
        affectedRange = new Range(
          includedRanges[0].startPosition,
          last(includedRanges).endPosition
        );
      } else {
        affectedRange = MAX_RANGE;
      }
    }

    // Now that we've assembled and coalesced all the ranges that need
    // invalidating, we'll invalidate them in buffer order.
    for (let range of this.rangeList) {
      this.languageMode.emitRangeUpdate(range);
    }

    for (let range of foldRangeList) {
      // The fold cache is automatically cleared for any range that needs
      // re-highlighting. But sometimes we need to go further and invalidate
      // rows that don't even need highlighting changes.
      this.languageMode.emitFoldUpdate(range);
    }

    if (affectedRange) {
      let injectionPromise = this._populateInjections(affectedRange, nodeRangeSet);
      if (injectionPromise) {
        params.async = true;
        return injectionPromise;
      }
    }
  }

  setCurrentRanges(includedRanges) {
    if (this.depth === 0) { return; }
    let oldRangeMarkers = this.currentRangesLayer.getMarkers();
    for (let marker of oldRangeMarkers) {
      marker.destroy();
    }

    // These are the “official” ranges, received right after the parent layer's
    // tree parse. We'll get a new set of official ranges at the end of the
    // next transaction, but until then, we should try our best to adapt to
    // buffer changes, and to allow each range to shift or grow or shrink so
    // that off-schedule parses are more likely to be accurate.
    for (let range of includedRanges) {
      range = rangeForNode(range);
      this.currentRangesLayer.markRange(range);
    }
  }

  getCurrentRanges() {
    let markers = this.currentRangesLayer?.getMarkers();
    if (!markers || markers.length === 0) { return null; }
    return markers.map(m => m.getRange());
  }

  // Checks whether a given {Point} lies within one of this layer's content
  // ranges — not just its extent. The optional `exclusive` flag will return
  // `false` if the point lies on a boundary of a content range.
  containsPoint(point, exclusive = false) {
    let ranges = this.getCurrentRanges() ?? [this.getExtent()];
    return ranges.some(r => r.containsPoint(point, exclusive));
  }

  // Returns a syntax tree for the current buffer.
  //
  // By default, this method will either return the current tree (if it's up to
  // date) or synchronously parse the buffer into a new tree (if it isn't).
  //
  // If you don't want to force a re-parse and don't mind that the current tree
  // might be stale, pass `force: false` as an option.
  //
  // In certain circumstances, the new tree might be promoted to the canonical
  // tree for this layer. To prevent this, pass `anonymous: false` as an option.
  //
  // All trees returned by this method are managed by this language layer and
  // will be deleted when the next transaction is complete. Retaining a
  // reference to the returned tree will not prevent this from happening. To
  // opt into managing the life cycle of the returned tree, copy it immediately
  // when you receive it.
  //
  getOrParseTree({ force = true, anonymous = false } = {}) {
    if (this.tree && (!this.treeIsDirty || !force)) { return this.tree; }

    // Eventually we'll take this out, but for now it serves as an indicator of
    // how often we have to manually re-parse in between transactions —
    // something we'd like to do as little as possible.
    if (atom.inDevMode()) {
      console.warn('Re-parsing tree!', this.inspect(), this.treeIsDirty);
    }

    let ranges = null;
    if (this.depth > 0) {
      ranges = this.getCurrentRanges().map(r => {
        return rangeToTreeSitterRangeSpec(r, this.buffer);
      });
    }

    // The goal here is that, if a re-parse is needed in between transactions,
    // we assign the result back to `this.tree` so that we can at least cut
    // down on the incremental amount of work that the end-of-transaction parse
    // has to do — it can pick up where we left off. So for the root language
    // layer, this represents more of a shifting of work than a duplication.
    //
    // But this isn't safe to do for injection layers because `ranges` may be
    // stale, despite our efforts to keep them fresh through markers. The
    // stakes are low enough for indents that we can attempt a tree parse and
    // act on the results even if we're not certain they're accurate — but when
    // we do another scheduled incremental parse, we have to be 100% sure that
    // we're working from an accurate tree.
    //
    // Re-parsing of an injection layer can only safely happen when we know its
    // true ranges, and that cannot be determined except through the process
    // that an injection layer's parent goes through during the
    // end-of-transaction update, unless we're willing to do an off-schedule
    // parse of _all_ language layers in this layer's ancestry. That's not
    // completely out of the question for the future — but, failing that, there
    // probably isn't a way to “fix” this for injection layers except through
    // cutting down on off-schedule parses.
    //
    let then = performance.now()
    let tree = this.languageMode.parse(
      this.language,
      this.tree,
      ranges,
      // { tag: `Re-parsing ${this.inspect()}` }
    );
    let now = performance.now()

    let parseTime = now - then;

    // Since we can't look into the future, we don't know how many times during
    // this transaction we'll be asked to make indentation sugestions. If we
    // knew ahead of time, we'd be able to decide at the beginning of a
    // transaction whether we could afford to do synchronous indentation.
    //
    // Instead, we do the next best thing: we start out doing synchronous
    // indentation, then fall back to asynchronous indentation once we've
    // exceeded our time budget. So we keep track of how long each reparse
    // takes and subtract it from our budget.
    this.languageMode.currentTransactionReparseBudgetMs -= parseTime;

    if (this.depth === 0 && !anonymous) {
      this.tree = tree;
      this.treeIsDirty = false;
    } else {
      // Keep track of any off-schedule trees we generate so that we can GC them
      // when the next transaction is done.
      this.temporaryTrees.push(tree);
    }
    return tree;
  }

  getText() {
    let { buffer } = this.languageMode;
    if (!this.marker) {
      return buffer.getText();
    } else {
      return buffer.getTextInRange(this.marker.getRange());
    }
  }

  // Given a point, return all syntax captures that are active at that point.
  // Used by `bufferRangeForScopeAtPosition`.
  scopeMapAtPosition(point) {
    if (!this.language || !this.tree) { return []; }
    let { scopeResolver } = this;
    scopeResolver.reset();

    // If the cursor is resting before column X, we want all scopes that cover
    // the character in column X.
    let captures = this.highlightsQuery?.captures(
      this.tree.rootNode,
      point,
      { row: point.row, column: point.column + 1 }
    ) ?? [];

    let results = [];
    for (let capture of captures) {
      // Storing the capture will return its range (after any potential
      // adjustments) — or `false`, to signify that the capture was ignored.
      let range = scopeResolver.store(capture);
      if (!range) { continue; }

      // Since the range might have been adjusted, we wait until after
      // resolution.
      if (comparePoints(range.endPosition, point) === 0) { continue; }
      if (isBetweenPoints(point, range.startPosition, range.endPosition)) {
        results.push({ capture, adjustedRange: range });
      }
    }

    scopeResolver.reset();

    // Sort from biggest to smallest.
    results = results.sort((a, b) => {
      return nodeBreadth(b.adjustedRange) - nodeBreadth(a.adjustedRange);
    });

    return results;
  }

  // Like `WASMTreeSitterLanguageMode#getSyntaxNodeAtPosition`, but for just this
  // layer.
  getSyntaxNodeAtPosition(position, where = FUNCTION_TRUE) {
    if (!this.language || !this.tree) { return null; }
    let { buffer } = this.languageMode;

    let index = buffer.characterIndexForPosition(position);
    let node = this.tree.rootNode.descendantForIndex(index);

    while (node) {
      if (where(node, this.grammar)) {
        return node;
      }
      node = node.parent;
    }

    return null;
  }

  // Used to find the most specific node affected by an edited range.
  getSyntaxNodeContainingRange(range, where = FUNCTION_TRUE) {
    if (!this.language || !this.tree) { return null; }
    let { buffer } = this.languageMode;

    if (range.start.isEqual(range.end)) {
      return this.getSyntaxNodeAtPosition(range.start, where);
    }

    let indexStart = buffer.characterIndexForPosition(range.start);
    let indexEnd = buffer.characterIndexForPosition(range.end);

    let rangeBreadth = indexEnd - indexStart;
    let node = this.getSyntaxNodeAtPosition(
      range.start,
      (node) => {
        let breadth = node.endIndex - node.startIndex;
        let qualifies = node.startIndex <= indexEnd &&
          node.endIndex >= indexEnd &&
          breadth >= rangeBreadth;
        return qualifies && where(node);
      }
    );

    return node ?? null;
  }

  _populateInjections(range, nodeRangeSet) {
    if (!this.tree) { return; }
    const promises = [];

    // We won't touch _all_ injections, but we will touch any injection that
    // could possibly have been affected by this layer's update.
    let existingInjectionMarkers = this.languageMode.injectionsMarkerLayer
      .findMarkers({ intersectsRange: range })
      .filter(marker => marker.parentLanguageLayer === this);

    if (existingInjectionMarkers.length > 0) {
      // Enlarge our range to contain all of the injection zones in the
      // affected buffer range.
      let earliest = range.start, latest = range.end;
      for (let marker of existingInjectionMarkers) {
        range = marker.getRange();
        if (range.start.compare(earliest) === -1) {
          earliest = range.start;
        }
        if (range.end.compare(latest) === 1) {
          latest = range.end;
        }
      }

      range = range.union(new Range(earliest, latest));
    }

    // Why do we have to do this explicitly? Because `descendantsOfType` will
    // incorrectly return nodes if the range runs from (0, 0) to (0, 0). All
    // other empty ranges seem not to have this problem. Upon cursory
    // inspection, this bug doesn't seem to be limited to `web-tree-sitter`.
    if (range.isEmpty()) { return; }

    // Now that we've enlarged the range, we might have more existing injection
    // markers to consider. But check for containment rather than intersection
    // so that we don't have to enlarge it again.
    existingInjectionMarkers = this.languageMode.injectionsMarkerLayer
      .findMarkers({ startsInRange: range, endsInRange: range })
      .filter(marker => marker.parentLanguageLayer === this);

    const markersToUpdate = new Map();

    // Query for all the nodes that could possibly prompt the creation of
    // injection points.
    const nodes = this.tree.rootNode.descendantsOfType(
      Object.keys(this.grammar.injectionPointsByType),
      range.start,
      range.end
    );

    let existingInjectionMarkerIndex = 0;
    let newLanguageLayers = 0;
    for (const node of nodes) {
      // A given node can be the basis for an arbitrary number of injection
      // points, but first it has to pass our gauntlet of tests:
      for (const injectionPoint of this.grammar.injectionPointsByType[node.type]) {
        // Does it give us a language string?
        const languageName = injectionPoint.language(node);
        if (!languageName) { continue; }

        // Does that string match up with a grammar that we recognize?
        const grammar = this.languageMode.grammarForLanguageString(
          languageName);
        if (!grammar) { continue; }

        // Does it offer us a node, or array of nodes, which a new injection
        // layer should use for its content?
        const contentNodes = injectionPoint.content(node, this.buffer);
        if (!contentNodes) { continue; }

        const injectionNodes = [].concat(contentNodes);
        if (!injectionNodes.length) continue;

        const injectionRange = node.range;

        let marker;

        // It's surprisingly hard to match up the injection point that we now
        // know we need… with the one that may already exist that was created
        // or updated based on the state of the tree from the last keystroke.
        // There is no continuity between the previous tree and the new tree
        // that we can rely on. Unless the marker and the base node of the
        // injection point agree on an exact range, we can't be sure enough to
        // re-use an existing layer.
        //
        // This isn't a huge deal because (a) markers are good at adapting to
        // changes, so those two things will agree more often than you think;
        // (b) even when they don't agree, it's not very costly to destroy and
        // recreate another `LanguageLayer`.
        //
        // Since both `existingInjectionMarkers` and `nodes` are guaranteed to
        // be sorted in buffer order, we can take shortcuts in how we pair them
        // up.
        //
        for (
          let i = existingInjectionMarkerIndex,
            n = existingInjectionMarkers.length;
          i < n;
          i++
        ) {
          const existingMarker = existingInjectionMarkers[i];
          const comparison = existingMarker.getRange().compare(injectionRange);
          if (comparison > 0) {
            // This marker seems to occur after the range we want to inject
            // into, meaning there's a good chance it's not ours. And it means
            // that none of the remaining markers will likely be our candidate,
            // either; so we should give up and create a new one.
            break;
          } else if (comparison === 0) {
            // Luckily, the range matches up exactly, so this is almost
            // certainly a previous version of the same intended injection. It
            // also means that any markers before this point in the list have
            // either already matched with candidate injection points or cannot
            // possibly match up; thus we can ignore them for the rest of the
            // matching process.
            existingInjectionMarkerIndex = i;
            if (existingMarker.languageLayer.grammar === grammar) {
              marker = existingMarker;
              break;
            }
          } else {
            // This marker occurs before our range. Since all injection
            // candidates from this point forward are guaranteed to be of an
            // equal or later range, there's no chance of this marker matching
            // any candidates from this point forward. We can ignore it, and
            // anything before it, in subsequent trips through the loop.
            existingInjectionMarkerIndex = i;
          }
        }

        if (!marker) {
          // If we didn't match up with an existing marker/layer, we'll have to
          // create them.
          marker = this.languageMode.injectionsMarkerLayer.markRange(
            injectionRange);

          marker.languageLayer = new LanguageLayer(
            marker,
            this.languageMode,
            grammar,
            this.depth + 1,
            injectionPoint
          );

          marker.parentLanguageLayer = this;
          // eslint-disable-next-line no-unused-vars
          newLanguageLayers++;
        }

        markersToUpdate.set(
          marker,
          new NodeRangeSet(
            nodeRangeSet,
            injectionNodes,
            injectionPoint
          )
        );
      }
    }

    let staleLanguageLayers = 0;
    for (const marker of existingInjectionMarkers) {
      // Any markers that didn't get matched up with injection points are now
      // stale and should be destroyed.
      if (!markersToUpdate.has(marker)) {
        this.languageMode.emitRangeUpdate(marker.getRange());
        marker.languageLayer.destroy();
        // eslint-disable-next-line no-unused-vars
        staleLanguageLayers++;
      }
    }

    if (markersToUpdate.size > 0) {
      for (const [marker, nodeRangeSet] of markersToUpdate) {
        promises.push(marker.languageLayer.update(nodeRangeSet));
      }
    }

    return Promise.all(promises);
  }

  _treeEditForBufferChange(start, oldEnd, newEnd, oldText, newText) {
    let startIndex = this.buffer.characterIndexForPosition(start);
    return {
      startIndex,
      oldEndIndex: startIndex + oldText.length,
      newEndIndex: startIndex + newText.length,
      startPosition: start,
      oldEndPosition: oldEnd,
      newEndPosition: newEnd
    };
  }
}

// An injection `LanguageLayer` may need to parse and highlight a strange
// subset of its stated range — for instance, all the descendants within a
// parent that are of a particular type. A `NodeRangeSet` is how that strange
// subset is expressed.
class NodeRangeSet {
  constructor(previous, nodes, injectionPoint) {
    this.previous = previous;
    this.newlinesBetween = injectionPoint.newlinesBetween;
    this.includeAdjacentWhitespace = injectionPoint.includeAdjacentWhitespace;
    this.includeChildren = injectionPoint.includeChildren;

    // We shouldn't retain references to nodes here because the tree might get
    // disposed of layer. Let's compile the information we need now while we're
    // sure the tree is fresh.
    this.nodeSpecs = [];
    for (let node of nodes) {
      this.nodeSpecs.push(this.getNodeSpec(node, true));
    }
  }

  getNodeSpec(node, getChildren) {
    let { startIndex, endIndex, startPosition, endPosition, id } = node;
    let result = { startIndex, endIndex, startPosition, endPosition, id };
    if (node.children && getChildren) {
      result.children = [];
      for (let child of node.children) {
        result.children.push(this.getNodeSpec(child, false));
      }
    }
    return result;
  }

  getRanges(buffer) {
    const previousRanges = this.previous?.getRanges(buffer);
    let result = [];

    for (let node of this.nodeSpecs) {
      // An injection point isn't given the point at which the buffer ends, so
      // it's free to return an `endIndex` of `Infinity` here and rely on us to
      // clip it to the boundary of the buffer.
      if (node.endIndex === Infinity) {
        node = this._clipRange(node, buffer);
      }
      let position = node.startPosition, index = node.startIndex;

      if (node.children && !this.includeChildren) {
        // If `includeChildren` is `false`, we're effectively collecting all
        // the disjoint text nodes that are direct descendants of this node.
        for (const child of node.children) {
          const nextIndex = child.startIndex;
          if (nextIndex > index) {
            this._pushRange(buffer, previousRanges, result, {
              startIndex: index,
              endIndex: nextIndex,
              startPosition: position,
              endPosition: child.startPosition
            });
          }
          position = child.endPosition;
          index = child.endIndex;
        }
      }

      if (node.endIndex > index) {
        this._pushRange(buffer, previousRanges, result, {
          startIndex: index,
          endIndex: node.endIndex,
          startPosition: position,
          endPosition: node.endPosition
        });
      }
    }

    let whitespaceRanges = [];
    if (this.includeAdjacentWhitespace && result.length > 1) {
      // Look at the region between each pair of results. If it's entirely
      // whitespace, include it in the range.
      for (let i = 1; i < result.length; i++) {
        let current = result[i], previous = result[i - 1];
        if (current.startIndex === previous.endIndex) { continue; }
        let pseudoRange = {
          startPosition: previous.endPosition,
          startIndex: previous.endIndex,
          endPosition: current.startPosition,
          endIndex: current.startIndex
        };
        let rangeText = buffer.getTextInRange(rangeForNode(pseudoRange));
        if (!/\S/.test(rangeText)) {
          whitespaceRanges.push(pseudoRange);
        }
      }
      result.push(...whitespaceRanges);
      result = result.sort((a, b) => {
        return a.startIndex - b.startIndex ||
          a.endIndex - b.endIndex;
      });
    }
    return this._consolidateRanges(result);
  }

  _clipRange(range, buffer) {
    // Convert this range spec to an actual `Range`, clip it, then convert it
    // back to a range spec with accurate `startIndex` and `endIndex` values.
    let clippedRange = buffer.clipRange(rangeForNode(range));
    return rangeToTreeSitterRangeSpec(clippedRange, buffer);
  }

  // Combine adjacent ranges to minimize the number of boundaries.
  _consolidateRanges(ranges) {
    if (ranges.length === 1) { return ranges; }
    let consolidated = [];
    let candidate;
    let lastIndex = ranges.length - 1;
    for (let i = 0; i < ranges.length; i++) {
      let range = ranges[i];
      if (!candidate) {
        candidate = range;
        continue;
      }
      if (candidate.endIndex === range.startIndex) {
        // Keep enlarging the last node for as long as subsequent nodes are
        // adjacent to it.
        candidate = {
          startIndex: candidate.startIndex,
          startPosition: candidate.startPosition,
          endIndex: range.endIndex,
          endPosition: range.endPosition
        };
        if (i === lastIndex) {
          consolidated.push(candidate);
        }
      } else {
        // We found a disjoint range, so push our candidate into the result set
        // and promote a new candidate (unless we're at the end).
        consolidated.push(candidate);
        if (i === lastIndex) {
          consolidated.push(range);
        } else {
          candidate = range;
        }
      }
    }

    return consolidated;
  }

  coversRange(candidateRange) {
    let ranges = this.getRanges().map(r => rangeForNode(r));
    return ranges.some(range => {
      return range.containsRange(candidateRange);
    });
  }

  _pushRange(buffer, previousRanges, newRanges, newRange) {
    if (!previousRanges) {
      if (this.newlinesBetween) {
        const { startIndex, startPosition } = newRange;
        this._ensureNewline(buffer, newRanges, startIndex, startPosition);
      }
      newRanges.push(newRange);
      return;
    }

    for (const previousRange of previousRanges) {
      if (previousRange.endIndex <= newRange.startIndex) continue;
      if (previousRange.startIndex >= newRange.endIndex) break;
      const startIndex = Math.max(
        previousRange.startIndex,
        newRange.startIndex
      );
      const endIndex = Math.min(previousRange.endIndex, newRange.endIndex);
      const startPosition = Point.max(
        previousRange.startPosition,
        newRange.startPosition
      );
      const endPosition = Point.min(
        previousRange.endPosition,
        newRange.endPosition
      );
      if (this.newlinesBetween) {
        this._ensureNewline(buffer, newRanges, startIndex, startPosition);
      }
      newRanges.push({ startIndex, endIndex, startPosition, endPosition });
    }
  }

  // For injection points with `newlinesBetween` enabled, ensure that a
  // newline is included between each disjoint range.
  _ensureNewline(buffer, newRanges, startIndex, startPosition) {
    const lastRange = last(newRanges);
    if (lastRange && lastRange.endPosition.row < startPosition.row) {
      newRanges.push({
        startPosition: new Point(
          startPosition.row - 1,
          buffer.lineLengthForRow(startPosition.row - 1)
        ),
        endPosition: new Point(startPosition.row, 0),
        startIndex: startIndex - startPosition.column - 1,
        endIndex: startIndex - startPosition.column
      });
    }
  }
}

class OpenScopeMap extends Map {
  constructor() {
    super();
  }

  getScopesArray() {
    let results = [];
    let keys = [...this.keys()];
    keys.sort(comparePoints);
    for (let key of keys) {
      let value = this.get(key);
      results.push(...value);
    }
    return results;
  }

  removeLastOccurrenceOf(scopeId) {
    let keys = [...this.keys()];
    keys.reverse();
    for (let key of keys) {
      let value = this.get(key);
      if (value.includes(scopeId)) {
        removeLastOccurrenceOf(value, scopeId);
        return true;
      }
    }
    return false;
  }
}

// Like a map, but expects each key to have multiple values.
class Index extends Map {
  constructor() {
    super();
  }

  add(key, ...values) {
    let existing = this.get(key);
    if (!existing) {
      existing = [];
      this.set(key, existing);
    }
    existing.push(...values);
  }
}


// A class designed to aggregate and normalize a set of ranges. Each time a
// buffer range is added, it's compared to the existing list; if there are
// intersections with range already in the list, those intersections are
// combined into one larger range.
//
// Assumes all ranges are instances of `Range` rather than tree-sitter range
// specs.
class RangeList {
  constructor() {
    this.ranges = [];
  }

  clear() {
    this.ranges.length = 0;
  }

  add(newRange) {
    let intersecting = [];
    for (let range of this.ranges) {
      if (newRange.intersectsWith(range)) {
        intersecting.push(range);
      }
    }

    for (let i = intersecting.length - 1; i >= 0; i--) {
      let index = this.ranges.indexOf(intersecting[i]);
      this.ranges.splice(index, 1);
    }
    while (intersecting.length > 0) {
      newRange = newRange.union(intersecting.shift());
    }
    this.insertOrdered(newRange);
  }

  insertOrdered(newRange) {
    let index = this.ranges.findIndex(r => {
      return r.start.compare(newRange.start) > 0;
    });
    this.ranges.splice(index, 0, newRange);
  }

  inspect() {
    let ranges = this.ranges.map(r => r.toString());
    return `[RangeList: ${ranges.join(', ')}]`;
  }

  *[Symbol.iterator]() {
    for (let range of this.ranges) {
      yield range;
    }
  }
}

module.exports = WASMTreeSitterLanguageMode;
