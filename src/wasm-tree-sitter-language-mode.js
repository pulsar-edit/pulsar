const Parser = require('web-tree-sitter');
const TokenIterator = require('./token-iterator');
const { Point, Range, spliceArray } = require('text-buffer');
const { CompositeDisposable, Emitter } = require('event-kit');
const ScopeDescriptor = require('./scope-descriptor');
const ScopeResolver = require('./scope-resolver');
const Token = require('./token');
const TokenizedLine = require('./tokenized-line');
const { matcherForSelector } = require('./selectors');

const createTree = require('./rb-tree');

const FUNCTION_TRUE = () => true;

function last(array) {
  return array[array.length - 1];
}

function removeLastOccurrenceOf(array, item) {
  return array.splice(array.lastIndexOf(item), 1);
}

function clamp (value, min, max) {
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

function resolveNodeDescriptor (node, descriptor) {
  let parts = descriptor.split('.');
  let result = node;
  while (result !== null && parts.length > 0) {
    let part = parts.shift();
    if (!result[part]) { return null; }
    result = result[part];
  }
  return result;
}

function resolveNodePosition (node, descriptor) {
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
    get () { return rangeForNode(this); }
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
    return a.column - b.column
  } else {
    return rows;
  }
}

// Acts like `comparePoints`, but treats starting and ending boundaries
// differently, making it so that ending boundaries are visited before starting
// boundaries.
function compareBoundaries (a, b) {
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

function isBetweenPoints (point, a, b) {
  let comp = comparePoints(a, b);
  let lesser = comp > 0 ? b : a;
  let greater = comp > 0 ? a : b;
  return comparePoints(point, lesser) >= 0 &&
    comparePoints(point, greater) <= 0;
}

let nextId = 0;
const COMMENT_MATCHER = matcherForSelector('comment');
const MAX_RANGE = new Range(Point.ZERO, Point.INFINITY).freeze();

class WASMTreeSitterLanguageMode {
  constructor({ buffer, grammar, config, grammars }) {
    this.id = nextId++;
    this.buffer = buffer;
    this.grammar = grammar;
    this.config = config;
    this.grammarRegistry = grammars;

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

    this.parsersByLanguage = new Map();
    this.tokenIterator = new TokenIterator(this);

    this.resolveNextTransactionPromise();

    this.ready = this.grammar.getLanguage()
      .then(language => {
        this.rootLanguage = language;
        this.rootLanguageLayer = new LanguageLayer(null, this, grammar, 0);
        return this.getOrCreateParserForLanguage(language);
      })
      .then(() => this.rootLanguageLayer.update(null))
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
    let existing = this.parsersByLanguage.get(language);
    if (existing) { return existing; }

    let parser = new Parser();
    parser.setLanguage(language);
    this.parsersByLanguage.set(language, parser);
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

    if (!this.rootLanguageLayer.treeIsDirty) {
      // This is the first change after the last transaction finished, so we
      // need to create a new promise that will resolve when the next
      // transaction is finished.
      this.refreshNextTransactionPromise();
    }

    this.rootLanguageLayer.handleTextChange(edit, oldText, newText);

    for (const marker of this.injectionsMarkerLayer.getMarkers()) {
      marker.languageLayer.handleTextChange(edit, oldText, newText);
    }
  }

  bufferDidFinishTransaction({ changes }) {
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

    this.rootLanguageLayer.update(null).then(() => {
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
        // layer's contents. Either way, the tree is safe to use.
        layer.treeIsDirty = false;

        // If this layer didn't get updated, then it didn't need to, and the
        // edits made in the last transaction are no longer relevant.
        layer.editedRange = null;
      }

      // At this point, all trees are safely re-parsed, including those of
      // injection layers. So we can proceed with any actions that were waiting
      // on a clean tree.
      this.resolveNextTransactionPromise(changes.length);
    });
  }

  emitRangeUpdate(range) {
    const startRow = range.start.row;
    const endRow = range.end.row;
    for (let row = startRow; row < endRow; row++) {
      this.isFoldableCache[row] = undefined;
    }
    this.prefillFoldCache(range);
    this.emitter.emit('did-change-highlighting', range);
  }

  // Resolve the promise that was created when we reacted to the first change
  // in a given transaction. We resolve it with the number of changes in the
  // transaction so that we can react differently to batches of changes than to
  // single changes.
  resolveNextTransactionPromise(changeCount) {
    if (this.resolveNextTransaction) {
      this.resolveNextTransaction(changeCount);
      this.resolveNextTransaction = null;
    }
  }

  // Create a promise that will resolve when the next transaction is done and
  // all its side effects are handled. When this promise resolves, all parse
  // trees will be clean and up to date. This promise cannot reject — only
  // resolve.
  //
  // If another transaction begins before all parse trees are ready, we'll
  // ensure that the old promise resolves along with the new one.
  refreshNextTransactionPromise() {
    let oldResolve = null;
    if (this.resolveNextTransaction) {
      // We're creating a new promise before the old one is done, so let's
      // chain them.
      oldResolve = this.resolveNextTransaction;
    }
    this.nextTransaction = new Promise((resolve) => {
      this.resolveNextTransaction = (changes) => {
        if (oldResolve) { oldResolve(changes); }
        resolve(changes);
      };
    });
  }

  prefillFoldCache(range) {
    this.rootLanguageLayer?.foldResolver.prefillFoldCache(range);

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
    this.rootLanguageLayer.updateInjections(grammar);
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

  scopeNameForScopeId (scopeId) {
    return this.grammar.scopeNameForScopeId(scopeId);
  }

  idForScope(name) {
    return this.grammar.idForScope(name);
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
    if (point.isEqual(iterator.getPosition())) {
      for (const scope of iterator.getOpenScopeIds()) {
        scopes.push(this.grammar.scopeNameForScopeId(scope));
      }
      // Don't count anything that ends at this point.
      for (const scope of iterator.getCloseScopeIds()) {
        removeLastOccurrenceOf(scopes, this.grammar.scopeNameForScopeId(scope));
      }
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

  parse (language, oldTree, includedRanges) {
    // let devMode = atom.inDevMode();
    let parser = this.getOrCreateParserForLanguage(language);
    let text = this.buffer.getText();
    // if (devMode) { console.time('Parsing'); }
    // TODO: Is there a better way to feed the parser the contents of the file?
    const result = parser.parse(
      text,
      oldTree,
      { includedRanges }
    );

    // if (devMode) { console.timeEnd('Parsing'); }
    return result;
  }

  get tree () {
    return this.rootLanguageLayer?.tree }

  /*
  Section - Syntax Tree APIs
  */

  getSyntaxNodeContainingRange(range, where = FUNCTION_TRUE) {
    if (!this.rootLanguageLayer) { return null; }
    return this.getSyntaxNodeAndGrammarContainingRange(range, where)?.node;
  }

  getSyntaxNodeAndGrammarContainingRange(range, where = FUNCTION_TRUE) {
    if (!this.rootLanguageLayer) { return null; }

    let layersAtStart = this.languageLayersAtPoint(range.start);
    let layersAtEnd = this.languageLayersAtPoint(range.end);
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
        if (layer === this.rootLanguageLayer) {
          // This layer is responsible for the entire buffer, but our tree's
          // root node may not actually span that entire range. If the buffer
          // starts with empty lines, the tree may not start parsing until the
          // first non-whitespace character.
          //
          // But this is the root language layer, so we're going to pretend
          // that our tree's root node spans the entire buffer range.
          results.push({ node: rootNode, grammar, depth });
        }
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

    return null;
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
        if (layer === this.rootLanguageLayer) {
          // This layer is responsible for the entire buffer, but our tree's
          // root node may not actually span that entire range. If the buffer
          // starts with empty lines, the tree may not start parsing until the
          // first non-whitespace character.
          //
          // But this is the root language layer, so we're going to pretend
          // that our tree's root node spans the entire buffer range.
          if (where(rootNode, grammar)) {
            results.push({ rootNode: node, depth });
          }
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
    let fold = this.getFoldRangeForRow(point.row);
    if (fold) { return fold; }

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
    let folds = [];
    for (let layer of layers) {
      let folds = layer.foldResolver.getAllFoldRanges();
      folds.push(...folds);
    }
    return folds;
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
      let candidateFold = layer.foldResolver.getFoldRangeForRow(row);
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

  // TODO: I know that old tree-sitter moved toward placing this data on the
  // grammar itself, but I would prefer to invert the order of these lookups.
  // As a config setting it can be scoped and overridden, but as a grammar
  // property it's just a fact of life that can't be worked around.
  //
  // TODO: Also, this should be revisited soon so that we can give the
  // `snippets` package the ability to ask about all of a grammar's comment
  // tokens — both line and block.
  //
  commentStringsForPosition(position) {
    // First ask the grammar for its comment strings.
    const range = this.firstNonWhitespaceRange(position.row) ||
      new Range(position, position);
    const { grammar } = this.getSyntaxNodeAndGrammarContainingRange(range);

    if (grammar) {
      let { commentStrings } = grammar;
      // Some languages don't have block comments, so only check for the start
      // delimiter.
      if (commentStrings && commentStrings.commentStartString) {
        return commentStrings;
      }
    }

    // Fall back to a lookup through the config system.
    const scope = this.scopeDescriptorForPosition(position);
    const commentStartEntries = this.config.getAll(
      'editor.commentStart', { scope });
    const commentEndEntries = this.config.getAll(
      'editor.commentEnd', { scope });

    const commentStartEntry = commentStartEntries[0];
    const commentEndEntry = commentEndEntries.find(entry => (
      entry.scopeSelector === commentStartEntry.scopeSelector
    ));
    return {
      commentStartString: commentStartEntry && commentStartEntry.value,
      commentEndString: commentEndEntry && commentEndEntry.value
    };
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
    return indentLength / tabLength;
  }

  // Get the suggested indentation level for an existing line in the buffer.
  //
  // * bufferRow - A {Number} indicating the buffer row
  // * tabLength - A {Number} signifying the length of a tab, in spaces,
  //   according to the current settings of the buffer.
  //
  // Returns a {Number}.
  suggestedIndentForBufferRow(row, tabLength, rawOptions = {}) {
    let root = this.rootLanguageLayer;
    if (!root || !root.tree || row === 0) { return 0; }

    let options = {
      allowMatchCapture: true,
      skipBlankLines: true,
      skipDedentCheck: false,
      preserveLeadingWhitespace: false,
      indentationLevels: null,
      ...rawOptions
    };

    let comparisonRow = options.comparisonRow;
    if (comparisonRow === undefined) {
      comparisonRow = row - 1;
      if (options.skipBlankLines) {
        // It usually makes no sense to compare to a blank row, so we'll move
        // upward until we find the a line with text on it.
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
        this.buffer.lineForRow(row),
        tabLength
      );
    }
    let comparisonRowIndent = options.comparisonRowIndent;
    if (comparisonRowIndent === undefined) {
      comparisonRowIndent = this.indentLevelForLine(
        this.buffer.lineForRow(comparisonRow), tabLength
      );
    }

    // TODO: What's the right place to measure from? Often we're here because
    // the user just hit Enter, which means we'd run before injection layers
    // have been re-parsed. Hence the injection's language layer might not know
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
      (layer) => !!layer.indentsQuery
    );

    if (!controllingLayer) {
      return Math.max(comparisonRowIndent - existingIndent, 0);
    }

    let { indentsQuery, scopeResolver } = controllingLayer;

    // TODO: We use `ScopeResolver` here so that we can use its tests. Maybe we
    // need a way to share those tests across different kinds of capture
    // resolvers.
    scopeResolver.reset();

    // If we aren't running at the end of a transaction, the tree will be
    // dirty, and we'll need a parse here so that we can get accurate captures.
    // This will tend not to be costly because — usually — the only change
    // since the last parse will have been a carriage return.
    //
    // TODO: This is imperfect on injection layers because the last known
    // update ranges could be stale. To know the exact range to re-parse we'd
    // need to synchronously parse the root tree and however many intermediate
    // layers' trees in between. That's possible in theory, but it wouldn't be
    // a lot of fun. I haven't actually seen this break, so we'll live with it
    // for now.
    let indentTree = options.tree || controllingLayer.getOrParseTree();

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
      if (node.text === '' && !props.allowEmpty) {
        continue;
      }

      // Ignore anything that isn't actually on the row.
      if (node.endPosition.row < comparisonRow) { continue; }
      if (node.startPosition.row > comparisonRow) { continue; }

      // Ignore anything that fails a scope test.
      if (!scopeResolver.store(capture)) { continue; }

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
    // content of the comparison row, then `dedent.next` can be used.
    //
    // And a language needs to indent more than one level from one line to the
    // next, then `@match` captures can be used to specify an exact level of
    // indentation relative to another specific node. If a `@match` capture
    // exists, we'll catch it in the dedent captures phase, and these heuristics
    // will be ignored.
    indentDelta = clamp(indentDelta, 0, 1);

    // Process `@dedent.next` captures as a last step; they act as a strong
    // hint about the next line's indentation.
    indentDelta -= dedentNextDelta;

    let dedentDelta = 0;

    if (!options.skipDedentCheck) {
      scopeResolver.reset();
      // The second phase covers any captures on the current line that can
      // cause the current line to be indented or dedented.
      let dedentCaptures = indentsQuery.captures(
        indentTree.rootNode,
        { row: row, column: 0 },
        { row: row + 1, column: 0 }
      );

      let currentRowText = this.buffer.lineForRow(row);

      let positionSet = new Set;
      for (let capture of dedentCaptures) {
        let { name, node, setProperties: props = {} } = capture;
        let { text } = node;
        let rowText = currentRowText.trim();

        // Ignore “phantom” nodes that aren't present in the buffer.
        if (text === '' && !props.allowEmpty) { continue; }

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
        // of this behavior with `(#set! force true)`.
        if (!props.force && !rowText.startsWith(text)) { continue; }

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
        } else  if (name === 'none') {
          scopeResolver.reset();
          return 0;
        }

        // Only `@dedent` or `@match` captures can change this line's
        // indentation.
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
    let finalIndent = comparisonRowIndent + indentDelta + dedentDelta;

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
  // another means.
  suggestedIndentForBufferRows(startRow, endRow, tabLength, options = {}) {
    let root = this.rootLanguageLayer;
    if (!root || !root.tree) {
      return new Array(startRow - endRow).map(() => 0);
    }

    let results = new Map();
    let comparisonRow = null;
    let comparisonRowIndent = null;

    // For line X to know its appropriate indentation level, it needs row X-1,
    // if it exists, to be indented properly. That's why `TextEditor` wants to
    // indent each line atomically. Instead, we'll determine the right level
    // for the first row, then supply the result for the previous row when we
    // call `suggestedIndentForBufferRow` for the _next_ row, and so on, so
    // that `suggestedIndentForBufferRow` doesn't try to look up the comparison
    // row itself and find out we haven't actually fixed any of the previous
    // rows' indentations yet.
    for (let row = startRow; row <= endRow; row++) {
      let controllingLayer = this.controllingLayerAtPoint(
        new Point(row, Infinity),
        (layer) => !!layer.indentsQuery && !!layer.tree
      );
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
    if (row === 0) { return 0; }
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
    let indentTree = options.tree || controllingLayer.getOrParseTree();

    const indents = indentsQuery.captures(
      indentTree.rootNode,
      { row: row, column: 0 },
      { row: row + 1, column: 0 }
    );

    let lineText = this.buffer.lineForRow(row).trim();

    const currentRowIndent = this.indentLevelForLine(
      this.buffer.lineForRow(row), tabLength);

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
      // once, it can bypass this behavior with `(#set! force true)`.
      if (!props.force && node.text !== lineText) { continue; }

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
    // TODO: This method's goal is to make sure that text is inserted at the
    // right indentation level from, say, a clipboard paste. But we can't run a
    // syntax capture against arbitrary text that isn't in the parse tree.
    //
    // But if one were to paste text, then select that exact text and invoke
    // **Editor: Auto Indent**, the text would be formatted correctly.
    //
    // So the better approach for a tree-sitter language mode would probably be
    // to do this automatically. The only drawback is that we'd either
    //
    // (a) wait until the transaction is finished and the tree is re-parsed,
    //     which means we'd want to fix the text and then group those changes
    //     with the previous checkpoint to prevent an extra history
    //     checkpoint, or
    // (b) anonymously re-parse the tree to try to avoid that hassle, which
    //     could double the amount of time we spend parsing.
    //
    return this.suggestedIndentForBufferRow(row, tabLength);
  }

  // Private

  // Given a `@match` capture, attempts to resolve it to an absolute
  // indentation level.
  resolveIndentMatchCapture(capture, currentRow, tabLength, indentationLevels = null) {
    let { node, setProperties: props = {} } = capture;

    // A `@match` capture must specify
    //
    //  (#set! matchIndentOf foo)
    //
    // where "foo" is a node descriptor. It may optionally specify
    //
    //  (#set! offsetIndent X)
    //
    // where "X" is a number, positive or negative.
    //
    let { matchIndentOf, offsetIndent = "0" } = props;
    if (!matchIndentOf) { return undefined; }
    offsetIndent = Number(offsetIndent);
    if (isNaN(offsetIndent)) { offsetIndent = 0; }

    // Follow a node descriptor to a target node.
    let targetPosition = resolveNodePosition(node, props.matchIndentOf);

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

  getAllLanguageLayers() {
    return [
      this.rootLanguageLayer,
      ...this.getAllInjectionLayers()
    ];
  }

  injectionLayersAtPoint(point) {
    let injectionMarkers = this.injectionsMarkerLayer.findMarkers({
      containsPosition: point
    });

    injectionMarkers = injectionMarkers.sort((a, b) => {
      return a.getRange().compare(b.getRange());
    });

    return injectionMarkers.map(m => m.languageLayer);
  }

  languageLayersAtPoint(point) {
    let injectionLayers = this.injectionLayersAtPoint(point);
    injectionLayers = injectionLayers.sort((a, b) => b.depth - a.depth);
    return [
      this.rootLanguageLayer,
      ...injectionLayers
    ];
  }

  // Returns the deepest language layer at a given point, or optionally the
  // deepest layer to fulfill a criterion.
  controllingLayerAtPoint(point, where = FUNCTION_TRUE) {
    let layers = this.languageLayersAtPoint(point);
    // Sort deeper layers first.
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
//   controlled by the `endAt` adjustment (which defaults to
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

    let tree = this.layer.getOrParseTree();
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

    // The red-black tree we use here is a bit more complex up front than the
    // one we use for syntax boundaries, because I didn't want the added
    // complexity later on of having to aggregate boundaries when they share a
    // position in the buffer.
    //
    // Instead of keying off of a plain buffer position, this tree also
    // considers whether the boundary is a fold start or a fold end. If one
    // boundary ends at the same point that another one starts, the ending
    // boundary will be visited first.
    let boundaries = createTree(compareBoundaries);
    let captures = this.layer.foldsQuery.captures(rootNode, start, end);

    for (let capture of captures) {
      if (capture.node.startPosition.row < start.row) { continue; }
      if (capture.name === 'fold') {
        boundaries = boundaries.insert({
          position: capture.node.startPosition,
          boundary: 'start'
        }, capture);
      } else {
        let key = this.keyForDividedFold(capture);
        boundaries = boundaries.insert(key, capture);
      }
    }

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

  resolvePositionForDividedFold(capture) {
    let { name, node } = capture;
    if (name === 'fold.start') {
      return new Point(node.startPosition.row, Infinity);
    } else if (name === 'fold.end') {
      let end = node.startPosition;
      if (end.column === 0) {
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

  resolveRangeForSimpleFold(capture) {
    let { node, setProperties: props } = capture;
    if (node.type === 'ERROR') { return null; }
    let start = new Point(node.startPosition.row, Infinity);
    let end = node.endPosition;

    let defaultOptions = { endAt: 'lastChild.startPosition' };
    let options = { ...defaultOptions, ...props };

    try {
      for (let key in options) {
        if (!FoldResolver.ADJUSTMENTS[key]) { continue; }
        let value = options[key];
        end = FoldResolver.ADJUSTMENTS[key](
          end, node, value, props, this.layer);
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
  endAt (end, node, value) {
    end = resolveNodePosition(node, value);
    return end;
  },

  // Adjust the end point by a fixed number of characters in either direction.
  // Will cross rows if necessary.
  offsetEnd (end, node, value, props, layer) {
    let { languageMode } = layer;
    value = Number(value);
    if (isNaN(value)) { return end; }
    return languageMode.adjustPositionByOffset(end, value);
  },

  // Adjust the column of the fold's end point. Use `0` to end the fold at the
  // start of the line.
  adjustEndColumn (end, node, value, props, layer) {
    let column = Number(value);
    if (isNaN(column)) { return end; }
    let newEnd = Point.fromObject({ column, row: end.row });
    return layer.buffer.clipPosition(newEnd);
  },

  // Adjust the end point to be immediately before the current line begins.
  // Useful if the end line also contains the start of a fold and thus should
  // stay on a separate screen line.
  adjustToEndOfPreviousRow (end) {
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

// An iterator for marking boundaries in the buffer to apply syntax
// highlighting.
//
// Manages a collection of `LayerHighlightIterators`, which are the classes
// doing the real work of marking boundaries. `HighlightIterator` is in charge
// of understanding, at any given point, which of the iterators needs to be
// advanced next.
class HighlightIterator {
  constructor(languageMode) {
    this.languageMode = languageMode;
    this.iterators = null;
  }

  seek(start, endRow) {
    let { buffer, rootLanguageLayer } = this.languageMode;
    if (!rootLanguageLayer) { return []; }

    let end = {
      row: endRow,
      column: buffer.lineLengthForRow(endRow)
    };

    this.end = end;
    this.iterators = [];

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

    const iterator = this.languageMode.rootLanguageLayer.buildHighlightIterator();

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
          // we should suppress those scopes unless they're the layer's base
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
    unsortedScopeBundles.sort((a, b) => {
      return a.point.compare(b.point) ||
        a.iterator.depth - b.iterator.depth;
    });

    // Now we can flatten all the scopes themselves, preserving order.
    for (let { scopes } of unsortedScopeBundles) {
      sortedOpenScopes.push(...scopes);
    }

    return sortedOpenScopes;
  }

  moveToSuccessor () {
    // `this.iterators` is _always_ sorted from farthest position to nearest
    // position, so the last item in the collection is always the next one to
    // act.
    let leader = last(this.iterators);
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

  getPosition () {
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
    if (this.currentScopeIsCovered) {
      // console.log(
      //   iterator.name,
      //   iterator.depth,
      //   'would close',
      //   iterator._inspectScopes(
      //     iterator.getCloseScopeIds()
      //   ),
      //   'at',
      //   iterator.getPosition().toString(),
      //   'but scope is covered!'
      // );
    } else {
      // console.log(
      //   iterator.name,
      //   iterator.depth,
      //   'CLOSING',
      //   iterator.getPosition().toString(),
      //   iterator._inspectScopes(
      //     iterator.getCloseScopeIds()
      //   )
      // );
    }
    if (iterator) {
      if (this.currentScopeIsCovered) {
        return iterator.getOpenScopeIds().filter(id => {
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
    if (this.currentScopeIsCovered) {
      // console.log(
      //   iterator.name,
      //   iterator.depth,
      //   'would open',
      //   iterator._inspectScopes(
      //     iterator.getOpenScopeIds()
      //   ),
      //   'at',
      //   iterator.getPosition().toString(),
      //   'but scope is covered!'
      // );
    } else {
      // console.log(
      //   iterator.name,
      //   iterator.depth,
      //   'OPENING',
      //   iterator.getPosition().toString(),
      //   iterator._inspectScopes(
      //     iterator.getOpenScopeIds()
      //   )
      // );
    }
    if (iterator) {
      if (this.currentScopeIsCovered) {
        return iterator.getOpenScopeIds().filter(id => {
          return iterator.languageLayer.languageScopeId === id;
        });
      } else {
        return iterator.getOpenScopeIds();
      }
    }
    return [];
  }

  // EXPERIMENT: Rather than the commented-out logic below, let's try something
  // more holistic that is off by default but triggered via an explicit
  // `coverShallowerScopes` option in `atom.grammars.addInjectionPoint`.
  detectCoveredScope() {
    const layerCount = this.iterators.length;
    if (layerCount > 1) {
      const rest = [...this.iterators];
      const leader = rest.pop();
      let covered = rest.some(it => {
        return it.coversIteratorAtPosition(
          leader,
          leader.getPosition()
        );
      });

      if (covered) {
        this.currentScopeIsCovered = true;
        return;
      }
      // const first = this.iterators[layerCount - 1];
      // const next = this.iterators[layerCount - 2];
      //
      // // In the tree-sitter EJS grammar I encountered a situation where an EJS
      // // scope was incorrectly being shadowed because `source.js` wanted to
      // // _close_ a scope on the same boundary that `text.html.ejs` wanted to
      // // _open_ one. This is one (clumsy) way to prevent that outcome.
      // let bothOpeningScopes = first.getOpenScopeIds().length > 0 && next.getOpenScopeIds().length > 0;
      // let bothClosingScopes = first.getCloseScopeIds().length > 0 && next.getCloseScopeIds().length > 0;
      //
      // if (
      //   comparePoints(next.getPosition(), first.getPosition()) === 0 &&
      //   next.isClosingScopes() === first.isClosingScopes() &&
      //   next.depth > first.depth &&
      //   !next.isAtInjectionBoundary() &&
      //   (bothOpeningScopes || bothClosingScopes)
      // ) {
      //   this.currentScopeIsCovered = true;
      //   return;
      // }
    }

    this.currentScopeIsCovered = false;
  }

  logPosition() {
    let iterator = last(this.iterators);
    iterator.logPosition();
  }
}

// Iterates through everything that a `LanguageLayer` is responsible for,
// marking boundaries for scope insertion.
class LayerHighlightIterator {
  constructor (languageLayer) {
    this.languageLayer = languageLayer;
    this.name = languageLayer.grammar.scopeName;
    this.depth = languageLayer.depth;

    let { injectionPoint } = this.languageLayer;

    this.coverShallowerScopes = injectionPoint?.coverShallowerScopes ?? false
  }

  // If this isn't the root language layer, we need to make sure this iterator
  // doesn't try to go past its marker boundary.
  _getEndPosition (endRow) {
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

    // …and this iterator's ranges actually include this position.
    let ranges = this.languageLayer.getCurrentRanges();
    if (ranges) {
      return ranges.some(range => range.containsPoint(position));
    }

    // TODO: Despite all this, we may want to allow parent layers to apply
    // scopes at the very edges of this layer's ranges/extent; or perhaps to
    // apply ending scopes at starting positions and vice-versa; or at least to
    // make it a configurable behavior.
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

  isAtInjectionBoundary () {
    let position = Point.fromObject(this.iterator.key);
    return position.isEqual(this.start) || position.isEqual(this.end);
  }

  _inspectScopes (ids) {
    if (Array.isArray(ids)) {
      return ids.map(id => this._inspectScopes(id)).join(', ')
    }
    return this.languageLayer.languageMode.scopeNameForScopeId(ids);
  }

  getOpenScopeIds () {
    // console.log(
    //   this.name,
    //   this.depth,
    //   'OPENING',
    //   this.getPosition().toString(),
    //   this._inspectScopes(
    //     this.iterator.value.openScopeIds
    //   )
    // );
    return [...this.iterator.value.openScopeIds];
  }

  getCloseScopeIds () {
    // console.log(
    //   this.name,
    //   'CLOSING',
    //   this.getPosition().toString(),
    //   this._inspectScopes(
    //     this.iterator.value.closeScopeIds
    //   )
    // );
    return [...this.iterator.value.closeScopeIds];
  }

  getPosition () {
    return this.iterator.key || Point.INFINITY;
  }

  logPosition () {
    let pos = this.getPosition();

    let { languageMode } = this.languageLayer;

    console.log(
      `[highlight] (${pos.row}, ${pos.column})`,
      'close',
      this.iterator.value.closeScopeIds.map(id => languageMode.scopeNameForScopeId(id)),
      'open',
      this.iterator.value.openScopeIds.map(id => languageMode.scopeNameForScopeId(id)),
      'next?',
      this.iterator.hasNext
    );
  }

  compare(other) {
    // First, favor the one whose current position is earlier.
    const result = comparePoints(this.iterator.key, other.iterator.key);
    if (result !== 0) { return result; }

    // Failing that, favor iterators that need to close scopes over those that
    // don't.
    let ours = this.getCloseScopeIds();
    let theirs = other.getCloseScopeIds();

    if (ours.length > 0 && theirs.length === 0) {
      return -1;
    } else if (theirs > 0 && ours.length === 0) {
      return 1;
    }

    // Failing that, favor the shallower layer.
    //
    // TODO: Is this universally true? Feels like we should favor the shallower
    // layer when both are opening scopes, and favor the deeper layer when both
    // are closing scopes.
    return this.languageLayer.depth - other.languageLayer.depth;
  }

  moveToSuccessor () {
    if (!this.iterator.hasNext) { return false; }
    if (this.done) { return false; }
    this.iterator.next();
    this.done = this.isDone();
    return true;
  }

  peekAtSuccessor () {
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
    return comparePoints(next, this.end) > 0;
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
    this.temporaryTrees = [];

    this.subscriptions = new CompositeDisposable;

    this.currentRangesLayer = this.buffer.addMarkerLayer();

    this.languageLoaded = this.grammar.getLanguage().then(async (language) => {
      this.language = language;
      // TODO: Currently, we require a syntax query, but we might want to
      // rethink this. There are use cases for treating the root layer merely
      // as a way to delegate to injections, in which case syntax highlighting
      // wouldn't be needed.
      try {
        this.syntaxQuery = await this.grammar.getQuery('syntaxQuery');
      } catch (error) {
        console.warn(`Grammar ${grammar.scopeName} failed to load its "highlights.scm" file. Please fix this error or contact the maintainer.`);
        console.error(error);
      }

      // All other queries are optional. Regular expression language layers,
      // for instance, don't really have a need for any of these.
      let otherQueries = ['foldsQuery', 'indentsQuery', 'localsQuery'];

      for (let queryType of otherQueries) {
        if (grammar[queryType]) {
          try {
            let query = await this.grammar.getQuery(queryType);
            this[queryType] = query;
          } catch (error) {
            console.warn(`Grammar ${grammar.scopeName} failed to load its ${queryType}. Please fix this error or contact the maintainer.`);
          }
        }
      }

      if (atom.inDevMode()) {
        // In dev mode, changes to query files should be applied in real time.
        // This allows someone to save, e.g., `highlights.scm` and immediately
        // see the impact of their change.
        this.observeQueryFileChanges();
      }
    });

    this.tree = null;
    this.scopeResolver = new ScopeResolver(
      this,
      (name) => this.languageMode.idForScope(name)
    );
    this.foldResolver = new FoldResolver(this.buffer, this);

    // What should our language scope name be? Should we even have one?
    let languageScope;
    if (depth === 0) {
      languageScope = this.grammar.scopeName;
    } else {
      languageScope = injectionPoint.languageScope;
      // Honor an explicit `null`, but fall back to the default scope name
      // otherwise.
      if (typeof languageScope === 'function') {
        languageScope = languageScope(this.grammar);
      }
      if (languageScope === undefined) {
        languageScope = this.grammar.scopeName;
      }
    }

    this.languageScope = languageScope;
    if (languageScope === null) {
      this.languageScopeId = null;
    } else {
      this.languageScopeId = this.languageMode.idForScope(languageScope);
    }
  }

  inspect() {
    let { scopeName } = this.grammar;
    return `[LanguageLayer ${scopeName || '(anonymous)'} depth=${this.depth}]`;
  }

  destroy() {
    this.tree = null;
    this.destroyed = true;
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
    if (!this.language || !this.tree) { return []; }
    if (!this.grammar.getLanguageSync()) { return []; }
    if (!this.syntaxQuery) { return []; }

    from = buffer.clipPosition(Point.fromObject(from, true));
    to = buffer.clipPosition(Point.fromObject(to, true));

    let boundaries = createTree(comparePoints);
    let extent = this.getExtent();

    const captures = this.syntaxQuery.captures(this.tree.rootNode, from, to);
    this.scopeResolver.reset();

    for (let capture of captures) {
      let { node } = capture;
      // Phantom nodes invented by the parse tree. Indentation captures can use
      // `allowEmpty` to force these to be considered, but for marking scopes,
      // there's no need for it; it'd just cause us to open and close a scope
      // in the same position.
      if (node.text === '') { continue; }

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
    let includedRanges = this.depth === 0 ? [extent] : this.getCurrentRanges();

    if (this.languageScopeId) {
      for (let range of includedRanges) {
        // Filter out ranges that have no intersection with ours.
        if (range.end.isLessThanOrEqual(from)) { continue; }
        if (range.start.isGreaterThanOrEqual(to)) { continue; }

        if (range.start.isLessThan(from)) {
          // If we get this far, we know that the base language scope was open
          // when our range began.
          alreadyOpenScopes.set(range.start, [this.languageScopeId]);
        } else {
          // Range start must be between `from` and `to`, or else equal `from`
          // exactly.
          this.scopeResolver.setBoundary(
            range.start,
            this.languageScopeId,
            'open',
            { root: true }
          );
        }

        if (range.end.isGreaterThan(to)) {
          // Do nothing; we don't need to set this boundary.
        } else {
          // The range must end somewhere within our range.
          this.scopeResolver.setBoundary(
            range.end,
            this.languageScopeId,
            'close',
            { root: true }
          );
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

      let bundle = {
        closeScopeIds: [...data.close],
        openScopeIds: [...data.open]
      };

      boundaries = boundaries.insert(point, bundle);
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

  handleTextChange(edit) {
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
  }

  update(nodeRangeSet) {
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
    return this._performUpdate(nodeRangeSet);
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
    nodes = nodes.sort((a, b) => {
      return rangeForNode(b).compare(rangeForNode(a));
    });

    return nodes;
  }

  // EXPERIMENTAL: Given a local reference node, tries to find the node that
  // defines it.
  findDefinitionForLocalReference(node, captures = null) {
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

  updateInjections(grammar) {
    // This method is called when a random grammar in the registry has been
    // added or updated, so we only care about it if it could possibly affect
    // an injection of ours.
    if (!grammar?.injectionRegex) { return; }
    if (!this.tree) { return; }

    // We don't need to consume the grammar itself; we'll just call
    // `_populateInjections` here because the callback signals that this
    // layer's list of injection points might have changed.
    this._populateInjections(MAX_RANGE, null);
  }

  async _performUpdate(nodeRangeSet) {
    await this.languageLoaded;
    let includedRanges = null;

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

    let affectedRange = this.editedRange;
    this.editedRange = null;

    let language = this.grammar.getLanguageSync();
    let tree = this.languageMode.parse(
      language,
      this.tree,
      includedRanges
    );

    if (includedRanges) {
      this.setCurrentRanges(includedRanges);
    }

    // Experiment: Even when no syntax changes have occurred, we should
    // always re-highlight the most specific node within which the edit
    // occurred. This is needed because a node's scope can change based on
    // its contents.
    if (affectedRange) {
      let node = this.getSyntaxNodeContainingRange(affectedRange);
      // Simple guard here against situations where the most specific node
      // for this range is the root node. We're not trying to invalidate the
      // whole tree. If the whole tree truly needs to be invalidated, it'll
      // get caught by tree-sitter anyway.
      //
      // This can still invalidate _large_ parts of the tree in certain
      // grammars.
      if (node && node.parent) {
        this.languageMode.emitRangeUpdate(node.range);
      }
    }

    if (this.lastSyntaxTree) {
      const rangesWithSyntaxChanges = this.lastSyntaxTree.getChangedRanges(tree);

      let oldSyntaxTree = this.lastSyntaxTree;
      this.lastSyntaxTree = tree;

      let oldTree = this.tree;
      this.tree = tree;
      this.treeIsDirty = false;

      if (oldTree) {
        oldTree.delete();
      }

      if (oldSyntaxTree) {
        oldSyntaxTree.delete();
      }

      while (this.temporaryTrees.length > 0) {
        let tree = this.temporaryTrees.pop();
        tree.delete();
      }

      if (rangesWithSyntaxChanges.length > 0) {
        for (const range of rangesWithSyntaxChanges) {
          this.languageMode.emitRangeUpdate(rangeForNode(range));
        }

        const combinedRangeWithSyntaxChange = new Range(
          rangesWithSyntaxChanges[0].startPosition,
          last(rangesWithSyntaxChanges).endPosition
        );

        if (affectedRange) {
          this.languageMode.emitRangeUpdate(affectedRange);
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

      this.languageMode.emitRangeUpdate(rangeForNode(tree.rootNode));
      if (includedRanges) {
        affectedRange = new Range(
          includedRanges[0].startPosition,
          last(includedRanges).endPosition
        );
      } else {
        affectedRange = MAX_RANGE;
      }
    }

    if (affectedRange) {
      await this._populateInjections(affectedRange, nodeRangeSet);
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

  getOrParseTree() {
    if (!this.treeIsDirty) { return this.tree; }

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
    let tree = this.languageMode.parse(
      this.language,
      this.tree,
      ranges
    );

    // Keep track of any off-schedule trees we generate so that we can GC them
    // when the next transaction is done.
    //
    // NOTE: We thought we could re-use this work at the end of the transaction
    // and save ourselves some time, but that seems to interfere with
    // `getChangedRanges` — we'd be doing an incremental parse from Tree B to
    // Tree C, but then comparing Tree C to Tree A when detecting range
    // changes. This should work in theory, but reports a bunch of false
    // positives in practice.
    this.temporaryTrees.push(tree);
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
    let captures = this.syntaxQuery.captures(
      this.tree.rootNode,
      point,
      { row: point.row, column: point.column + 1 }
    );

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
  getSyntaxNodeContainingRange(range) {
    if (!this.language || !this.tree) { return null; }
    let { buffer } = this.languageMode;

    if (range.start.isEqual(range.end)) {
      return this.getSyntaxNodeAtPosition(range.start);
    }

    let indexStart = buffer.characterIndexForPosition(range.start);
    let indexEnd = buffer.characterIndexForPosition(range.end);

    let rangeBreadth = indexEnd - indexStart;
    let node = this.getSyntaxNodeAtPosition(
      range.start,
      (node) => {
        let breadth = node.endIndex - node.startIndex;
        return node.startIndex <= indexEnd &&
          node.endIndex >= indexEnd &&
          breadth >= rangeBreadth;
      }
    );

    return node ?? null;
  }

  _populateInjections (range, nodeRangeSet) {
    const promises = [];

    // We won't touch _all_ injections, but we will touch any injection that
    // could possibly have been affected by this layer's update.
    let existingInjectionMarkers = this.languageMode.injectionsMarkerLayer
      .findMarkers({ intersectsRange: range })
      .filter(marker => marker.parentLanguageLayer === this);

    if (existingInjectionMarkers.length > 0) {
      range = range.union(
        new Range(
          existingInjectionMarkers[0].getRange().start,
          last(existingInjectionMarkers).getRange().end
        )
      );
    }

    const markersToUpdate = new Map();

    // Query for all the nodes that could possibly prompt the creation of
    // injection points.
    const nodes = this.tree.rootNode.descendantsOfType(
      Object.keys(this.grammar.injectionPointsByType),
      range.start,
      range.end
    );

    let existingInjectionMarkerIndex = 0;
    // let newLanguageLayers = 0;
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
        const contentNodes = injectionPoint.content(node);
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
          // newLanguageLayers++;
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

    // let staleLanguageLayers = 0;
    for (const marker of existingInjectionMarkers) {
      // Any markers that didn't get matched up with injection points are now
      // stale and should be destroyed.
      if (!markersToUpdate.has(marker)) {
        this.languageMode.emitRangeUpdate(
          marker.getRange()
        );
        marker.languageLayer.destroy();
        // staleLanguageLayers++;
      }
    }

    if (markersToUpdate.size > 0) {
      for (const [marker, nodeRangeSet] of markersToUpdate) {
        promises.push(marker.languageLayer.update(nodeRangeSet));
      }
    }

    return Promise.all(promises);
  }
}

// An injection `LanguageLayer` may need to parse and highlight a strange
// subset of its stated range — for instance, all the descendants within a
// parent that are of a particular type. A `NodeRangeSet` is how that strange
// subset is expressed.
class NodeRangeSet {
  constructor(previous, nodes, injectionPoint) {
    this.previous = previous;
    this.nodes = nodes;
    this.newlinesBetween = injectionPoint.newlinesBetween;
    this.includeAdjacentWhitespace = injectionPoint.includeAdjacentWhitespace;
    this.includeChildren = injectionPoint.includeChildren;
  }

  getRanges(buffer) {
    const previousRanges = this.previous && this.previous.getRanges(buffer);
    let result = [];

    for (const node of this.nodes) {
      let position = node.startPosition, index = node.startIndex;

      if (!this.includeChildren) {
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

  coversRange (candidateRange) {
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
    const lastRange = newRanges[newRanges.length - 1];
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

module.exports = WASMTreeSitterLanguageMode;
