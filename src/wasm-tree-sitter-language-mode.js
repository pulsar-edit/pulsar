const Parser = require('web-tree-sitter');
const ScopeDescriptor = require('./scope-descriptor')
// const { Patch } = require('superstring');
// const fs = require('fs');
const { Point, Range, spliceArray } = require('text-buffer');
const { CompositeDisposable, Emitter } = require('event-kit');
const Token = require('./token');
const TokenizedLine = require('./tokenized-line');
const { matcherForSelector } = require('./selectors');

const createTree = require("./rb-tree")

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

// Patch tree-sitter syntax nodes the same way `TreeSitterLanguageMode` did so
// that we don't break anything that relied on `range` being present.
function ensureRangePropertyIsDefined(node) {
  let done = node.range && node.range instanceof Range;
  if (done) { return; }
  let proto = Object.getPrototypeOf(node);

  Object.defineProperty(proto, 'range', {
    get () { return rangeForNode(this); }
  });
}

// function pointForNodePosition(position) {
//   let { row, column } = position;
//   return new Point(row, column);
// }

const COMMENT_MATCHER = matcherForSelector('comment');
const MAX_RANGE = new Range(Point.ZERO, Point.INFINITY).freeze();

const VAR_ID = 257;
// const conversions = new Map([
//   ['function.method.builtin', 'keyword.other.special-method'],
//   ['number', 'constant.numeric'],
//   // 'punctuation.special':
//   // 'punctuation.bracket':
//   // 'string':
//   // 'embedded':
//   // 'punctuation.bracket':
//   ['string.special.regex', 'string.regexp']
// ])
class WASMTreeSitterLanguageMode {
  constructor(grammar, buffer, config, grammars) {
    this.emitter = new Emitter();
    this.lastId = 259;
    this.scopeNames = new Map([["variable", VAR_ID]])
    this.scopeIds = new Map([[VAR_ID, "variable"]])
    this.buffer = buffer;
    this.config = config;
    this.grammarRegistry = grammars;
    this.injectionsMarkerLayer = buffer.addMarkerLayer();
    this.newRanges = []
    this.oldNodeTexts = new Set()
    this.grammar = grammar;
    this.rootScopeId = this.getOrCreateScopeId(this.grammar.scopeName);
    this.ignoreScopeId = this.getOrCreateScopeId('ignore');

    let resolveReady;
    this.ready = new Promise((resolve) => {
      resolveReady = resolve;
    });

    this.tokenized = false;
    this.subscriptions = new CompositeDisposable;

    this.subscriptions.add(
      this.onDidTokenize(() => this.tokenized = true)
    );

    this.isFoldableCache = [];

    this.rootLanguage = null;
    this.rootLanguageLayer = null;

    this.grammarForLanguageString = this.grammarForLanguageString.bind(this);

    this.parsersByLanguage = new Map();

    this.grammar.getLanguage().then(lang => {
      this.rootLanguage = lang;
      this.rootLanguageLayer = new LanguageLayer(null, this, grammar, 0);
      return this.getOrCreateParserForLanguage(lang);
    }).then(() => {
      this.rootLanguageLayer
        .update(null)
        .then(() => this.emitter.emit('did-tokenize'))
        .then(() => resolveReady(true));
    });

    this.rootScopeDescriptor = new ScopeDescriptor({
      scopes: [grammar.scopeName]
    });
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

  destroy() {
    this.injectionsMarkerLayer.destroy();
    this.rootLanguageLayer = null;
    this.subscriptions.dispose();
  }

  getGrammar() {
    return this.grammar;
  }

  getLanguageId() {
    return this.grammar.scopeName;
  }

  updateForInjection(grammar) {
    if (!this.rootLanguageLayer) { return; }
    this.rootLanguageLayer.updateInjections(grammar);
  }

  bufferDidChange(change) {
    if (!this.rootLanguageLayer) { return; }

    let { oldRange, newRange, oldText, newText } = change;
    this.newRanges.push(change.newRange);

    // const possibleDefinition = this.boundaries.lt(change.oldRange.end).value?.definition
    // if (possibleDefinition) {
    //   this.oldNodeTexts.add(possibleDefinition)
    // }

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
    this.rootLanguageLayer.update(null);
  }

  emitRangeUpdate(range) {
    const startRow = range.start.row;
    const endRow = range.end.row;
    for (let row = startRow; row < endRow; row++) {
      this.isFoldableCache[row] = undefined;
    }
    this.emitter.emit('did-change-highlighting', range);
  }

  grammarForLanguageString(languageString) {
    let result =  this.grammarRegistry.treeSitterGrammarForLanguageString(
      languageString,
      'wasm'
    );
    return result;
  }

  // _prepareInvalidations() {
  //   let nodes = this.oldNodeTexts
  //   let parentScopes = createTree(comparePoints)
  //
  //   this.newRanges.forEach(range => {
  //     const newNodeText = this.boundaries.lt(range.end).value?.definition
  //     if (newNodeText) nodes.add(newNodeText)
  //     const parent = findNodeInCurrentScope(
  //       this.boundaries, range.start, v => v.scope === 'open'
  //     )
  //     if (parent) parentScopes = parentScopes.insert(parent.position, parent)
  //   })
  //
  //   parentScopes.forEach((_, val) => {
  //     const from = val.position, to = val.closeScopeNode.position
  //     const range = new Range(from, to)
  //     this._invalidateReferences(range, nodes)
  //   })
  //   this.oldNodeTexts = new Set()
  //   this.newRanges = []
  // }

  // _invalidateReferences(range, invalidatedNames) {
  //   const {start, end} = range
  //   let it = this.boundaries.ge(start)
  //   while (it.hasNext) {
  //     const node = it.value.openNode
  //     if (node && !it.value.definition) {
  //       const txt = node.text
  //       if (invalidatedNames.has(txt)) {
  //         const range = new Range(node.startPosition, node.endPosition)
  //         this.emitter.emit('did-change-highlighting', range)
  //       }
  //     }
  //     it.next()
  //     if (comparePoints(it.key, end) >= 0) return
  //   }
  // }

  // _updateWithLocals(locals) {
  //   const size = locals.length
  //   for (let i = 0; i < size; i++) {
  //     const {name, node} = locals[i]
  //     const nextOne = locals[i+1]
  //
  //     const duplicatedLocalScope = nextOne &&
  //       comparePoints(node.startPosition, nextOne.node.startPosition) === 0 &&
  //       comparePoints(node.endPosition, nextOne.node.endPosition) === 0
  //     if (duplicatedLocalScope) {
  //       // Local reference have lower precedence over everything else
  //       if (name === 'local.reference') continue;
  //     }
  //
  //     let openNode = this._getOrInsert(node.startPosition, node)
  //     if (!openNode.openNode) openNode.openNode = node
  //     let closeNode = this._getOrInsert(node.endPosition, node)
  //     if (!closeNode.closeNode) closeNode.closeNode = node
  //
  //     if (name === "local.scope") {
  //       openNode.scope = "open"
  //       closeNode.scope = "close"
  //       openNode.closeScopeNode = closeNode
  //       closeNode.openScopeNode = openNode
  //       const parentNode = findNodeInCurrentScope(
  //         this.boundaries, node.startPosition, v => v.scope === 'open')
  //       const depth = parentNode?.depth || 0
  //       openNode.depth = depth + 1
  //       closeNode.depth = depth + 1
  //     } else if (name === "local.reference" && !openNode.definition) {
  //       const varName = node.text
  //       const varScope = findNodeInCurrentScope(
  //         this.boundaries, node.startPosition, v => v.definition === varName)
  //       if (varScope) {
  //         openNode.openScopeIds = varScope.openScopeIds
  //         closeNode.closeScopeIds = varScope.closeDefinition.closeScopeIds
  //       }
  //     } else if (name === "local.definition") {
  //       const shouldAddVarToScopes = openNode.openScopeIds.indexOf(VAR_ID) === -1
  //       if (shouldAddVarToScopes) {
  //         openNode.openScopeIds = [...openNode.openScopeIds, VAR_ID]
  //         closeNode.closeScopeIds = [VAR_ID, ...closeNode.closeScopeIds]
  //       }
  //
  //       openNode.definition = node.text
  //       openNode.closeDefinition = closeNode
  //     }
  //   }
  // }

  // _getOrInsert(key) {
  //   const existing = this.boundaries.get(key)
  //   if (existing) {
  //     return existing
  //   } else {
  //     const obj = {openScopeIds: [], closeScopeIds: [], position: key}
  //     this.boundaries = this.boundaries.insert(key, obj)
  //     return obj
  //   }
  // }

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
    const scope = this.scopeIds.get(scopeId);
    if (scope) {
      return `syntax--${scope.replace(/\./g, ' syntax--')}`
    }
  }

  scopeNameForScopeId (scopeId) {
    return this.scopeIds.get(scopeId);
  }

  getOrCreateScopeId (name) {
    let id = this.scopeNames.get(name);
    if (!id) {
      this.lastId += 2;
      id = this.lastId;
      this.scopeNames.set(name, id);
      this.scopeIds.set(id, name);
    }
    return id;
  }

  // Behaves like `scopeDescriptorForPosition`, but returns a list of
  // tree-sitter node names. Useful for understanding tree-sitter parsing or
  // for writing syntax highlighting query files.
  syntaxTreeScopeDescriptorForPosition(point) {
    point = this.buffer.clipPosition(Point.fromObject(point));

    // If the position is the end of a line, get node of left character instead
    // of newline. This is to match TextMate behavior; see
    // https://github.com/atom/atom/issues/18463
    if (
      point.column > 0 &&
      point.column === this.buffer.lineLengthForRow(point.row)
    ) {
      point = point.copy();
      point.column--;
    }

    let layers = this.languageLayersAtPoint(point);
    let scopes = [];

    let iterate = (node, isAnonymous = false) => {
      let { startPosition: start, endPosition: end } = node;
      if (isBetweenPoints(point, start, end)) {
        scopes.push(isAnonymous ? `"${node.type}"` : node.type);
        let namedChildrenIds = node.namedChildren.map(c => c.typeId);
        for (let child of node.children) {
          let isAnonymous = !namedChildrenIds.includes(child.typeId);
          iterate(child, isAnonymous);
        }
      }
    };

    for (let layer of layers) {
      scopes.push(layer.grammar.scopeName);
      iterate(layer.tree.rootNode);
    }

    scopes.unshift(this.grammar.scopeName);
    return new ScopeDescriptor({ scopes });
  }

  // Returns the buffer range for the first scope to match the given scope
  // selector, starting with the smallest scope and moving outward.
  bufferRangeForScopeAtPosition(selector, point) {
    // If the position is the end of a line, get scope of left character instead of newline
    // This is to match TextMate behaviour, see https://github.com/atom/atom/issues/18463
    if (
      point.column > 0 &&
      point.column === this.buffer.lineLengthForRow(point.row)
    ) {
      point = point.copy();
      point.column--;
    }

    let match = matcherForSelector(selector);

    if (!this.rootLanguageLayer) {
      return match('text') ? this.buffer.getRange() : null;
    }

    let layers = this.languageLayersAtPoint(point);
    let results = [];
    for (let layer of layers) {
      results.push(...layer.scopeMapAtPosition(point));
    }

    // We need the results sorted from smallest to biggest.
    results = results.sort(({ node }) => {
      return node.startIndex - node.endIndex;
    });

    for (let { name, node } of results) {
      if (match(name)) {
        return new Range(node.startPosition, node.endPosition);
      }
    }
  }

  scopeDescriptorForPosition (point) {
    if (!this.rootLanguageLayer) {
      return new ScopeDescriptor({scopes: ['text']})
    }

    // If the position is the end of a line, get scope of left character instead of newline
    // This is to match TextMate behaviour, see https://github.com/atom/atom/issues/18463
    if (
      point.column > 0 &&
      point.column === this.buffer.lineLengthForRow(point.row)
    ) {
      point = point.copy();
      point.column--;
    }

    return this.rootLanguageLayer.scopeDescriptorForPosition(point);
  }

  parse (language, oldTree, includedRanges) {
    // let devMode = atom.inDevMode();
    let parser = this.getOrCreateParserForLanguage(language);
    let text = this.buffer.getText();
    // TODO: Is there a better way to feed the parser the contents of the file?
    // if (devMode) { console.time('Parsing'); }
    const result = parser.parse(
      text,
      oldTree,
      { includedRanges }
    );
    // if (devMode) { console.timeEnd('Parsing'); }
    return result;
  }

  get tree () {
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
    if (!this.rootLanguageLayer) { return null; }
    let layerStart = this.controllingLayerAtPoint(range.start);
    let layerEnd = this.controllingLayerAtPoint(range.end);

    // Select the layer with the lower depth. (Or else they're the same layer
    // and it doesn't matter which we pick.)
    let layer = layerStart.depth < layerEnd ? layerStart : layerEnd;
    let { grammar } = layer;

    let startNode = this.getSyntaxNodeAtPosition(range.start);
    let endNode = this.getSyntaxNodeAtPosition(range.end);

    if (startNode.id === endNode.id && where(startNode)) {
      return { node: startNode, grammar };
    }

    // Find the smallest common ancestor.
    let startNodeAncestorIds = [startNode.id];
    let current = startNode;
    while (current.parent) {
      current = current.parent;
      startNodeAncestorIds.push(current.id);
    }

    let node = endNode;
    while (node) {
      if (startNodeAncestorIds.includes(node.id)) {
        if (where(node)) { return { node, grammar }; }
      }
      node = node.parent;
    }

    return null;
  }

  getRangeForSyntaxNodeContainingRange(range, where = FUNCTION_TRUE) {
    if (!this.rootLanguageLayer) { return null; }
    let node = this.getSyntaxNodeContainingRange(range, where);
    return node && rangeForNode(node);
  }

  getSyntaxNodeAtPosition(position, where = FUNCTION_TRUE) {
    if (!this.rootLanguageLayer) { return null; }
    let layer = this.controllingLayerAtPoint(position);
    let root = layer.tree.rootNode;
    let index = this.buffer.characterIndexForPosition(position);
    let node = root.descendantForIndex(index);
    while (node && !where(node)) {
      node = node.parent;
    }
    return node;
  }

  /*
  Section - Folds
  */
  getFoldableRangeContainingPoint(point) {
    const foldsAtRow = this._getFoldsAtRow(point.row)
    // const node = foldsAtRow[0]?.node
    const capture = foldsAtRow[0];
    if (capture) {
      return this._makeFoldableRange(capture)
    }
  }

  getFoldableRanges() {
    if (!this.tokenized) { return []; }

    let layers = this.getAllLanguageLayers();

    let folds = [];
    for (let layer of layers) {
      let folds = layer.getFolds();
      folds.push(...folds);
    }
    return folds.map(fold => this._makeFoldableRange(fold.node))
  }

  getFoldableRangesAtIndentLevel(level) {
    const tabLength = this.buffer.displayLayers[0]?.tabLength || 2
    const minCol = (level-1) * tabLength
    const maxCol = (level) * tabLength
    if (!this.tree) return [];
    return this.foldsQuery
      .captures(this.tree.rootNode)
      .filter(fold => {
        const { column } = fold.node.startPosition;
        return column > minCol && column <= maxCol;
      })
      .map(fold => this._makeFoldableRange(fold.node))
  }

  // Given a node and a descriptor string like "lastChild.startPosition",
  // navigates to the position described.
  resolveNodePosition(node, descriptor) {
    let parts = descriptor.split('.');
    let result = node;
    while (result !== null && parts.length > 0) {
      let part = parts.shift();
      if (!result[part]) {
        throw new Error(`Bad fold descriptor: ${descriptor}`);
      }
      result = result[part];
    }
    return Point.fromObject(result);
  }

  adjustPositionByOffset(position, offset) {
    let { buffer } = this;
    let index = buffer.characterIndexForPosition(position);
    index += offset;
    return buffer.positionForCharacterIndex(index);
  }

  _makeFoldableRange(capture) {
    let {
      node,
      setProperties: props = {}
    } = capture;

    let defaultOptions = {
      end: 'lastChild.startPosition'
    };
    let options = { ...defaultOptions, ...props };

    let start = new Point(node.startPosition.row, Infinity);
    let end;
    try {
      end = this.resolveNodePosition(node, options.end);
    } catch {
      end = this.resolveNodePosition(node, defaultOptions.end);
    }

    if (options.endOffset) {
      let endOffset = Number(options.endOffset);
      if (!isNaN(endOffset)) {
        end = this.adjustPositionByOffset(end, Number(options.endOffset));
      }
    }

    return new Range(start, end);
  }

  isFoldableAtRow(row) {
    if (this.isFoldableCache[row] != null) {
      return this.isFoldableCache[row];
    }
    const foldsAtRow = this._getFoldsAtRow(row);
    let result = foldsAtRow.length !== 0;
    this.isFoldableCache[row] = result;
    return result;
  }

  _getFoldsAtRow(row) {
    if (!this.tokenized) { return []; }
    let layer = this.controllingLayerAtPoint(new Point(row, 0));

    let controllingLayer;
    if (layer.foldsQuery && layer.tree) {
      controllingLayer = layer;
    } else {
      // TODO: Should we cascade down the list of layers, or just jump straight
      // to the root?
      controllingLayer = this.rootLanguageLayer;
    }

    let { foldsQuery } = controllingLayer;
    if (!foldsQuery) { return []; }

    let folds = foldsQuery.captures(
      controllingLayer.tree.rootNode,
      { row: row, column: 0 },
      { row: row + 1, column: 0 }
    );

    if (!folds) { return []; }
    return folds.filter(({ node }) => {
      // Don't treat it as a fold if the node doesn't span at least two lines.
      return node.startPosition.row === row && node.endPosition.row !== row;
    });
  }

  /*
  Section - Comments
  */
  commentStringsForPosition(position) {
    const scope = this.scopeDescriptorForPosition(position);
    const commentStartEntries = this.config.getAll('editor.commentStart', {
      scope
    });
    const commentEndEntries = this.config.getAll('editor.commentEnd', {
      scope
    });
    const commentStartEntry = commentStartEntries[0];
    const commentEndEntry = commentEndEntries.find(entry => {
      return entry.scopeSelector === commentStartEntry.scopeSelector;
    });
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
  //
  // Returns a {Number}.
  suggestedIndentForBufferRow(row, tabLength, options = {}) {
    if (row === 0) { return 0; }

    let comparisonRow = row - 1;
    if (options.skipBlankLines !== false) {
      // Move upward until we find the a line with text on it.
      while (this.buffer.isRowBlank(comparisonRow) && comparisonRow > 0) {
        comparisonRow--;
      }
    }

    // TODO: What's the right place to measure from? If we measure from the
    // beginning of the new row, the injection's language layer might not know
    // whether it controls that point. Feels better to measure from the end of
    // the previous non-whitespace row, but we'll see.
    let comparisonRowEnd = new Point(
      comparisonRow,
      this.buffer.lineLengthForRow(comparisonRow)
    );

    let controllingLayer = this.controllingLayerAtPoint(comparisonRowEnd);

    const lastLineIndent = this.indentLevelForLine(
      this.buffer.lineForRow(comparisonRow), tabLength
    );

    let { indentsQuery } = controllingLayer;
    if (!indentsQuery) {
      return lastLineIndent;
    }

    let indentTree = controllingLayer.forceAnonymousParse();

    // Capture in two phases. The first phase affects whether this line should
    // be indented from the previous line.
    let indentCaptures = indentsQuery.captures(
      indentTree.rootNode,
      { row: comparisonRow, column: 0 },
      { row: row, column: 0 }
    );

    indentCaptures = indentCaptures.filter(
      ({ node }) => node.endPosition.row >= comparisonRow
    );

    let indentDelta = this.getIndentDeltaFromCaptures(indentCaptures, ['indent']);
    indentDelta = clamp(indentDelta, 0, 1);

    // The second phase tells us whether this line should be dedented from the
    // previous line.
    let dedentCaptures = indentsQuery.captures(
      indentTree.rootNode,
      { row: row, column: 0 },
      { row: row + 1, column: 0 }
    );

    let currentRowText = this.buffer.lineForRow(row);
    dedentCaptures = dedentCaptures.filter(capture => {
      // Imagine you've got:
      //
      // { ^foo, bar } = something
      //
      // and the caret represents the cursor. Pressing Enter will move
      // everything after the cursor to a new line and _should_ indent the
      // line, even though there's a closing brace on the new line that would
      // otherwise mark a dedent.
      //
      // Thus we don't want to honor a dedent unless it's the first
      // non-whitespace content in the line. We'll use similar logic for
      // `suggestedIndentForEditedBufferRow`.
      let { text } = capture.node;
      // Filter out phantom nodes.
      if (!text) { return false; }
      return currentRowText.trim().startsWith(text);
    });

    let dedentDelta = this.getIndentDeltaFromCaptures(
      dedentCaptures,
      ['indent_end', 'branch']
    );
    dedentDelta = clamp(dedentDelta, -1, 0);

    return lastLineIndent + indentDelta + dedentDelta;
  }

  // Get the suggested indentation level for a line in the buffer on which the
  // user is currently typing. This may return a different result from
  // {::suggestedIndentForBufferRow} in order to avoid unexpected changes in
  // indentation. It may also return undefined if no change should be made.
  //
  // * row - The row {Number}
  //
  // Returns a {Number}.
  suggestedIndentForEditedBufferRow(row, tabLength) {
    let scopeResolver = new ScopeResolver();
    if (row === 0) { return 0; }

    let controllingLayer = this.controllingLayerAtPoint(new Point(row, 0));
    let { indentsQuery } = controllingLayer;

    if (!indentsQuery) {
      return undefined;
    }

    // Indents query won't work unless we re-parse the tree. Since we're typing
    // one character at a time, this should not be costly.
    let indentTree = controllingLayer.forceAnonymousParse();
    const indents = indentsQuery.captures(
      indentTree.rootNode,
      { row: row, column: 0 },
      { row: row + 1, column: 0 }
    )

    let lineText = this.buffer.lineForRow(row).trim();

    const currentLineIndent = this.indentLevelForLine(
      this.buffer.lineForRow(row), tabLength
    );

    for (let indent of indents) {
      let { node } = indent;
      if (!scopeResolver.store(indent, null)) {
        continue;
      }
      if (node.startPosition.row !== row) { continue; }
      if (indent.name !== 'branch') { continue; }
      if (node.text !== lineText) { continue; }
      return Math.max(0, currentLineIndent - 1);
    }

    return currentLineIndent;
  }

  // Get the suggested indentation level for a given line of text, if it were
  // inserted at the given row in the buffer.
  //
  // * bufferRow - A {Number} indicating the buffer row
  //
  // Returns a {Number}.
  suggestedIndentForLineAtBufferRow(row, line, tabLength) {
    return this.suggestedIndentForBufferRow(row, tabLength);
  }

  // Private

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

  injectionLayersAtPoint (point) {
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

  controllingLayerAtPoint(point) {
    let injectionLayers = this.injectionLayersAtPoint(point);

    if (injectionLayers.length === 0) {
      return this.rootLanguageLayer;
    } else {
      return injectionLayers.sort(layer => -layer.depth)[0];
    }
  }

  firstNonWhitespaceRange(row) {
    return this.buffer.findInRangeSync(
      /\S/,
      new Range(new Point(row, 0), new Point(row, Infinity))
    );
  }

  getIndentDeltaFromCaptures(captures, consider = null) {
    let delta = 0;
    let positionSet = new Set;
    if (!consider) {
      consider = ['indent', 'indent_end', 'branch'];
    }
    for (let { name, node } of captures) {
      // Ignore phantom captures.
      let text = node.text;
      if (!text || !text.length) { continue; }

      if (!consider.includes(name)) { continue; }

      // A given node may be marked with both (e.g.) `indent_end` and `branch`.
      // Only consider a given range once.
      let key = `${node.startIndex}/${node.endIndex}`;
      if (positionSet.has(key)) {
        continue;
      } else {
        positionSet.add(key);
      }

      if (name === 'indent') {
        delta++;
      } else if (name === 'indent_end' || name === 'branch') {
        delta--;
      }
    }
    return delta;
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
      tokenIterator: null,
      grammar: this.grammar
    });
  }

  tokenForPosition(point) {
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

// A data structure for storing scope information during a `HighlightIterator`
// task. The data is reset in between each task.
//
// It also applies the conventions that we've adopted in SCM files
// (particularly in `highlights.scm`) that let us constrain the conditions
// under which various scopes get applied. When a given query capture is added,
// `ScopeResolver` may "reject" it if it fails to pass the given test.
class ScopeResolver {
  constructor (idForScope = null) {
    this.idForScope = idForScope ?? (x => x);
    this.map = new Map
    this.rangeData = new Map
  }

  _keyForPoint (point) {
    return `${point.row},${point.column}`
  }

  _keyForRange (syntax) {
    let { startIndex, endIndex } = syntax.node;
    return `${startIndex}/${endIndex}`;
  }

  _keyToObject (key) {
    let [row, column] = key.split(',');
    return new Point(Number(row), Number(column));
  }

  setDataForRange (syntax, props) {
    let key = this._keyForRange(syntax);
    return this.rangeData.set(key, props);
  }

  getDataForRange (syntax) {
    let key = this._keyForRange(syntax);
    return this.rangeData.get(key);
  }

  // Given a syntax capture, test whether we should include its scope in the
  // document.
  test (existingData, props, node) {
    if (existingData?.final) { return false; }

    for (let key in props) {
      if (!(key in ScopeResolver.TESTS)) { continue; }
      let test = ScopeResolver.TESTS[key];
      if (!test(existingData, props, node)) {
        return false;
      }
    }
    return true;
  }

  // Attempt to add a syntax capture to the boundary data, along with its scope
  // ID.
  //
  // Will return `false` if the scope should not be added for the given range.
  store (syntax) {
    let {
      node,
      name,
      setProperties: props = {}
    } = syntax;

    let {
      startPosition: start,
      endPosition: end
    } = node;

    name = ScopeResolver.interpolateName(name, node);

    let data = this.getDataForRange(syntax);

    if (!this.test(data, props, node, name)) {
      return false;
    } else {
      this.setDataForRange(syntax, props);
    }

    if (name === 'ignore') {
      // "@ignore" is a magical variable in an SCM file that will not be
      // applied in the grammar, but allows us to prevent other kinds of scopes
      // from matching. We purposefully allowed this syntax node to set data
      // for a given range, but not to apply its scope ID to any boundaries.
      return;
    }

    let id = this.idForScope(name);

    // We should open this scope at `start`.
    this.setBoundary(start, id, 'open');

    // We should close this scope at `end`.
    this.setBoundary(end, id, 'close');

    return true;
  }

  setBoundary (point, id, which) {
    let key = this._keyForPoint(point)
    if (!this.map.has(key)) {
      this.map.set(key, { open: [], close: [] })
    }
    let bundle = this.map.get(key);
    let idBundle = bundle[which];

    if (which === 'open') {
      // If an earlier token has already opened at this point, we want to open
      // after it.
      idBundle.push(id)
    } else {
      // If an earlier token has already closed at this point, we want to close
      // before it.
      idBundle.unshift(id)
    }
  }

  clear () {
    this.map.clear()
    this.rangeData.clear()
  }

  *[Symbol.iterator] () {
    // The ordering of the keys doesn't matter here because we'll be putting
    // them into a red-black tree that will be responsible for ordering the
    // boundaries.
    for (let key of this.map.keys()) {
      let point = this._keyToObject(key);
      yield [point, this.map.get(key)]
    }
  }

  debug () {
    for (let [point, bundle] of this) {
      console.log('at point:', point, bundle);
    }
  }
}

// Scope names can mark themselves with `TEXT` to interpolate the node's
// text into the capture.
ScopeResolver.interpolateName = (name, node) => {
  return name.replace('TEXT', node.text);
};

// These tests are used to define criteria under which the scope should be
// applied. Set them in a query file like so:
//
// (
//   (foo) @some.scope.name
//   (#set! onlyIfFirst true)
// )
//
// For boolean rules, the second argument to `#set!` is arbitrary, but must be
// something truthy.
//
// These tests come in handy for criteria that can't be represented by the
// built-in predicates like `#match?` and `#eq?`.
//
// NOTE: Syntax queries will always be run through a `ScopeResolver`, but other
// kinds of queries usually will not.
//
ScopeResolver.TESTS = {
  // Passes only if another node has not already declared `final` for the exact
  // same range. If a capture is the first one to define `final`, then all
  // other captures for that same range are ignored, whether they try to define
  // `final` or not.
  final (existingData) {
    return !(existingData && existingData.final);
  },

  // Passes only if no earlier capture has occurred for the exact same range.
  shy (existingData) {
    return existingData === undefined;
  },

  // Passes only if the given node is the first among its siblings.
  onlyIfFirst (existingData, props, node) {
    if (!node.parent) {
      // Root nodes are always first.
      return true;
    }
    // We're really paranoid on these because if the parse tree is in an error
    // state, weird things can happen, like a node's parent not having a
    // `firstChild`.
    return node?.parent?.firstChild?.id === node.id;
  },

  // Passes only if the given node is not the first among its siblings.
  onlyIfNotFirst (existingData, props, node) {
    if (!node.parent) { return false; }

    return node?.parent?.firstChild?.id !== node.id;
  },

  // Passes only if the given node is the last among its siblings.
  onlyIfLast (existingData, props, node) {
    if (!node.parent) {
      // Root nodes are always last.
      return true;
    }
    return node?.parent?.lastChild?.id === node.id;
  },

  // Passes only if the given node is not the last among its siblings.
  onlyIfNotLast (existingData, props, node) {
    if (!node.parent) { return false; }

    return node?.parent?.lastChild?.id !== node.id;
  },

  // Passes if the node's text starts with the provided string. Used to work
  // around nodes that are too generic.
  //
  // NOTE: Prefer a `#match?` predicate in the query. This is needed only in
  // unusual circumstances.
  onlyIfTextStartsWith(existingData, props, node) {
    let str = props.onlyIfTextStartsWith;
    let text = node.text;
    return text.startsWith(str);
  },

  // Passes if the node's text ends with the provided string. Used to work
  // around nodes that are too generic.
  //
  // NOTE: Prefer a `#match?` predicate in the query. This is needed only in
  // unusual circumstances.
  onlyIfTextEndsWith(existingData, props, node) {
    let str = props.onlyIfTextEndsWith;
    let text = node.text;
    return text.endsWith(str);
  },

  // Passes if this is a child of a node of the given type.
  onlyIfChildOfType(existingData, props, node) {
    let { onlyIfChildOfType: type } = props;
    let parent = node.parent;
    if (!parent || parent.type !== type) { return false; }
    return true;
  },

  // Passes if this is _not_ a child of a node of the given type.
  onlyIfNotChildOfType(existingData, props, node) {
    let { onlyIfNotChildOfType: type } = props;
    let parent = node.parent;
    if (!parent || parent.type !== type) {
      return true;
    }
    return false;
  },

  // Passes if this node has a node of the given type in its ancestor chain.
  onlyIfDescendantOfType(existingData, props, node) {
    let { onlyIfDescendantOfType: type } = props;
    let current = node;
    while (current.parent) {
      current = current.parent;
      if (current.type === type) { return true; }
    }
    return false;
  },

  // Passes if this node does not have a node of the given type in its ancestor
  // chain.
  onlyIfNotDescendantOfType(existingData, props, node) {
    let { onlyIfNotDescendantOfType: type } = props;
    let current = node;
    while (current.parent) {
      current = current.parent;
      if (current.type === type) { return false; }
    }
    return true;
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
    return null;
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

// function findNodeInCurrentScope(boundaries, position, filter) {
//   let iterator = boundaries.ge(position)
//   while (iterator.hasPrev) {
//     iterator.prev()
//     const value = iterator.value
//     if (filter(value)) return value
//
//     if (value.scope === 'close') {
//       // If we have a closing scope, there's an "inner scope" that we will
//       // ignore, and move the iterator BEFORE the inner scope position
//       iterator = boundaries.lt(value.openScopeNode.position)
//     } else if (value.scope === 'open') {
//       // But, if we find an "open" scope, we check depth. If it's `1`, we
//       // got into the last nested scope we were inside, so it's time to quit
//       if (value.depth === 1) return
//     }
//   }
// }

function comparePoints(a, b) {
  const rows = a.row - b.row;
  if (rows === 0) {
    return a.column - b.column
  } else {
    return rows;
  }
}

function isBetweenPoints (point, a, b) {
  let comp = comparePoints(a, b);
  let lesser = comp > 0 ? b : a;
  let greater = comp > 0 ? a : b;
  return comparePoints(point, lesser) >= 0 && comparePoints(point, greater) <= 0;
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

    const injectionMarkers = this.languageMode.injectionsMarkerLayer.findMarkers(
      {
        intersectsRange: new Range(
          start,
          new Point(endRow + 1, 0)
        )
      }
    );

    const iterator = this.languageMode.rootLanguageLayer.buildHighlightIterator();

    let openScopes = [];
    // The contract of `LayerHighlightIterator#seek` is different from the
    // contract of `HighlightIterator#seek`. Instead of having it return an
    // array of open scopes at the given point, we give it an array that it can
    // push items into if needed; but its return value is a boolean that tells
    // us whether we should use this iterator at all. It will return `true` if
    // it needs to mark anything in the specified range, and `false` otherwise.
    let result = iterator.seek(start, endRow, openScopes);
    if (result) {
      this.iterators.push(iterator);
    }

    for (const marker of injectionMarkers) {
      const iterator = marker.languageLayer.buildHighlightIterator();
      let result = iterator.seek(start, endRow, openScopes);
      if (result) {
        this.iterators.push(iterator);
      }
    }

    // Sort the iterators so that the last one in the array is the earliest
    // in the document, and represents the current position.
    this.iterators.sort((a, b) => b.compare(a));

    this.detectCoveredScope();

    return openScopes;
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
      while (i > 0 && this.iterators[i - 1].compare(leader) < 0) { i--; }
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
    if (iterator && !this.currentScopeIsCovered) {
      return iterator.getCloseScopeIds();
    }
    return [];
  }

  getOpenScopeIds() {
    let iterator = last(this.iterators);
    if (iterator && !this.currentScopeIsCovered) {
      return iterator.getOpenScopeIds();
    }
    return [];
  }

  // Detect whether or not another more deeply-nested language layer has a
  // scope boundary at this same position. If so, the current language layer's
  // scope boundary should not be reported.
  //
  // This also will only avoid the scenario where two iterators want to
  // highlight the _exact same_ boundary. If a root language layer wants to
  // mark a boundary that isn't present in an injection's boundary list, the
  // root will be allowed to proceed.
  //
  // TODO: This only works for comparing the first two iterators; anything
  // deeper than that will be ignored. This probably isn't a problem, but we'll
  // see.
  detectCoveredScope() {
    const layerCount = this.iterators.length;
    if (layerCount > 1) {
      const first = this.iterators[layerCount - 1];
      const next = this.iterators[layerCount - 2];

      // In the tree-sitter EJS grammar I encountered a situation where an EJS
      // scope was incorrectly being shadowed because `source.js` wanted to
      // _close_ a scope on the same boundary that `text.html.ejs` wanted to
      // _open_ one. This is one (clumsy) way to prevent that outcome.
      let bothOpeningScopes = first.getOpenScopeIds().length > 0 && next.getOpenScopeIds().length > 0;
      let bothClosingScopes = first.getCloseScopeIds().length > 0 && next.getCloseScopeIds().length > 0;

      if (
        comparePoints(next.getPosition(), first.getPosition()) === 0 &&
        next.atEnd === first.atEnd &&
        next.depth > first.depth &&
        !next.isAtInjectionBoundary() &&
        (bothOpeningScopes || bothClosingScopes)
      ) {
        this.currentScopeIsCovered = true;
        return;
      }
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
    // TODO: Understand `atEnd` better.
    this.atEnd = false;
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
      return naiveEndPoint;
    }
  }

  seek(start, endRow, previousOpenScopes) {
    let end = this._getEndPosition(endRow);
    let [boundaries, openScopes] = this.languageLayer.getSyntaxBoundaries(
      start,
      end,
      { includeOpenScopes: true }
    );

    if (!boundaries) {
      return false;
    }

    this.iterator = boundaries.begin;
    this.start = Point.fromObject(start, true);
    this.end = end;
    previousOpenScopes.push(...openScopes);
    return true;
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
    //   'OPENING',
    //   this.getPosition(),
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
    //   this.getPosition(),
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
    // TODO: Understand this better.
    const result = comparePoints(this.iterator.key, other.iterator.key);

    // const result = this.offset - other.offset;
    if (result !== 0) { return result; }
    if (this.atEnd && !other.atEnd) { return -1; }
    if (other.atEnd && !this.atEnd) { return 1; }

    return this.languageLayer.depth - other.languageLayer.depth;
  }

  moveToSuccessor () {
    if (!this.iterator.hasNext) { return false; }
    this.iterator.next();
    if (!this.iterator.hasNext) { this.atEnd = true; }
    if (this.iterator.key && this.end) {
      if (comparePoints(this.iterator.key, this.end) > 0) {
        this.iterator = { value: null };
        return false;
      }
    }
    return true;
  }
}

// Manages all aspects of a given language's parsing duties over a given region
// of the buffer.
//
// The base `LanguageLayer` that's in charge of the entire buffer is the "root"
// `LanguageLayer`. Other `LanguageLayer`s are created when injections are
// required. Those injected languages may require injections themselves.
//
// Thus, for many editor-related tasks that depend on the context of the
// cursor, we should figure out how many different `LanguageLayer`s are
// operating in that particular region, and either (a) compose their output or
// (b) choose the output of the most specific layer, depending on the task.
//
class LanguageLayer {
  constructor(marker, languageMode, grammar, depth) {
    this.marker = marker;
    this.languageMode = languageMode;
    this.grammar = grammar;
    this.depth = depth;

    this.subscriptions = new CompositeDisposable;

    this.languageLoaded = this.grammar.getLanguage().then(language => {
      this.language = language;
      this.syntaxQuery = this.language.query(grammar.syntaxQuery);

      let otherQueries = ['foldsQuery', 'indentsQuery', 'localsQuery'];

      for (let query of otherQueries) {
        if (grammar[query]) {
          this[query] = this.language.query(grammar[query]);
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
      (name) => this.languageMode.getOrCreateScopeId(name)
    );
    this.languageScopeId = this.languageMode.getOrCreateScopeId(this.grammar.scopeName);
  }

  observeQueryFileChanges() {
    this.subscriptions.add(
      this.grammar.onDidChangeQueryFile(({ queryType }) => {
        try {
          if (!this[queryType]) { return; }
          this[queryType] = this.language.query(this.grammar[queryType]);
          // Force a re-highlight of this layer's entire region.
          let range = this.marker?.getRange() || this.languageMode.buffer.getRange();
          this.languageMode.emitRangeUpdate(range);
        } catch (error) {
          console.error(`Error parsing query file: ${queryType}`);
          console.error(error);
        }
      })
    );
  }

  getExtent() {
    return this.marker?.getRange() ?? this.languageMode.buffer.getRange();
  }

  getSyntaxBoundaries(from, to, { includeOpenScopes = false } = {}) {
    let { buffer } = this.languageMode;
    if (!this.language || !this.tree) { return []; }
    if (!this.grammar.getLanguageSync()) { return []; }

    from = buffer.clipPosition(Point.fromObject(from, true));
    to = buffer.clipPosition(Point.fromObject(to, true));

    let boundaries = createTree(comparePoints);
    let extent = this.marker ? this.marker.getRange() : MAX_RANGE;

    const captures = this.syntaxQuery.captures(this.tree.rootNode, from, to);

    this.scopeResolver.clear();

    for (let capture of captures) {
      let { node } = capture;
      // Phantom nodes invented by the parse tree.
      if (node.text === '') { continue; }
      this.scopeResolver.store(capture);
    }

    // Ensure the whole source file (or whole bounds of the injection) is
    // annotated with the root language scope name. We _do not_ want to leave
    // this up to the grammar author; it's too important.
    if (from.isEqual(extent.start) && from.column === 0) {
      this.scopeResolver.setBoundary(from, this.languageScopeId, 'open');
    }

    if (to.isEqual(extent.end)) {
      this.scopeResolver.setBoundary(to, this.languageScopeId, 'close');
    }

    let alreadyOpenScopes = [];
    if (from.isGreaterThan(extent.start)) {
      alreadyOpenScopes.push(this.languageScopeId);
    }

    let isEmpty = true;
    for (let [point, data] of this.scopeResolver) {
      if (point.isLessThan(from)) {
        alreadyOpenScopes.push(...data.open);
        for (let c of data.close) {
          removeLastOccurrenceOf(alreadyOpenScopes, c);
        }
        continue;
      } else if (point.isGreaterThan(to)) {
        continue;
      }

      let bundle = {
        closeScopeIds: [...data.close],
        openScopeIds: [...data.open]
      };

      isEmpty = false;
      boundaries = boundaries.insert(point, bundle);
    }

    if (isEmpty) {
      return [];
    }

    if (includeOpenScopes) {
      return [boundaries, alreadyOpenScopes];
    } else {
      return boundaries;
    }
  }

  buildHighlightIterator() {
    if (this.tree) {
      return new LayerHighlightIterator(this, this.tree);
    } else {
      return new NullLayerHighlightIterator();
    }
  }

  handleTextChange(edit) {
    const {
      startPosition,
      oldEndPosition,
      newEndPosition
    } = edit;

    if (this.tree) {
      this.tree.edit(edit);
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

  destroy() {
    this.tree = null;
    this.destroyed = true;
    this.marker?.destroy();
    this.subscriptions.dispose();

    for (const marker of this.languageMode.injectionsMarkerLayer.getMarkers()) {
      if (marker.parentLanguageLayer === this) {
        marker.languageLayer.destroy();
      }
    }
  }

  async update(nodeRangeSet) {
    await this._performUpdate(nodeRangeSet);
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
    }).sort((a, b) => a.compare(b));

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
      // not 100% clear what the right answer should be. Best guess for now is
      // the one that's closest to the local reference.
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
    // Ignore unless this is an injection grammar.
    if (!grammar?.injectionRegex) { return; }

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

    if (this.tree) {
      const rangesWithSyntaxChanges = this.tree.getChangedRanges(tree);
      this.tree = tree;

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

      // Like legacy tree-sitter, we're patching syntax nodes so that they have
      // a `range` property that returns a `Range`. We're doing this for
      // compatibility, but we can't get a reference to the node class itself;
      // we have to wait until we have an instance and grab the prototype from
      // there.
      //
      // This is the earliest place in the editor lifecycle where we're
      // guaranteed to be holding an instance of `Node`. Once we patch it here,
      // we're good to go.
      ensureRangePropertyIsDefined(tree.rootNode);

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

  forceAnonymousParse() {
    return this.languageMode.parse(this.language, this.tree);
  }

  getText () {
    let { buffer } = this.languageMode;
    if (!this.marker) {
      return buffer.getText();
    } else {
      return buffer.getTextInRange(this.marker.getRange());
    }
  }

  getFolds() {
    if (!this.foldsQuery) { return []; }
    let foldsTree = this.forceAnonymousParse();
    return this.foldsQuery.captures(foldsTree.rootNode);
  }

  scopeMapAtPosition(point) {
    if (!this.language || !this.tree) { return []; }
    let scopeResolver = new ScopeResolver();

    // If the cursor is resting before column X, we want all scopes that cover
    // the character in column X.
    let captures = this.syntaxQuery.captures(
      this.tree.rootNode,
      point,
      { row: point.row, column: point.column + 1 }
    );

    // Captured nodes aren't guaranteed to overlap the point we asked for.
    captures = captures.filter(({ node }) => {
      // Don't include nodes that end right before the point.
      if (comparePoints(node.endPosition, point) === 0) { return false; }
      return isBetweenPoints(point, node.startPosition, node.endPosition);
    });

    let results = [];
    for (let cap of captures) {
      if (scopeResolver.store(cap, null)) {
        results.push(cap);
      }
    }
    scopeResolver.clear();
    results = results.sort(({ node }) => {
      return node.endIndex - node.startIndex;
    });

    return results;
  }

  scopeDescriptorForPosition(point) {
    let results = this.scopeMapAtPosition(point);

    let injectionLayers = this.languageMode.injectionLayersAtPoint(point);

    for (let layer of injectionLayers) {
      let map = layer.scopeMapAtPosition(point);
      results.push(...map);
    }

    results = results.sort(({ node }) => {
      return node.endIndex - node.startIndex;
    });

    let scopes = results.map(cap => {
      return ScopeResolver.interpolateName(cap.name, cap.node)
    });

    if (scopes.length === 0 || scopes[0] !== this.grammar.scopeName) {
      scopes.unshift(this.grammar.scopeName);
    }
    return new ScopeDescriptor({ scopes });
  }

  _populateInjections (range, nodeRangeSet) {
    const promises = [];
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
    const nodes = this.tree.rootNode.descendantsOfType(
      Object.keys(this.grammar.injectionPointsByType),
      range.start,
      range.end
    );

    let existingInjectionMarkerIndex = 0;
    for (const node of nodes) {
      for (const injectionPoint of this.grammar.injectionPointsByType[node.type]) {
        const languageName = injectionPoint.language(node);
        if (!languageName) { continue; }

        const grammar = this.languageMode.grammarForLanguageString(
          languageName
        );
        if (!grammar) { continue; }

        const contentNodes = injectionPoint.content(node);
        if (!contentNodes) { continue; }

        const injectionNodes = [].concat(contentNodes);
        if (!injectionNodes.length) continue;

        const injectionRange = rangeForNode(node);

        let marker;

        for (
          let i = existingInjectionMarkerIndex,
            n = existingInjectionMarkers.length;
          i < n;
          i++
        ) {
          const existingMarker = existingInjectionMarkers[i];
          const comparison = existingMarker.getRange().compare(injectionRange);
          if (comparison > 0) {
            break;
          } else if (comparison === 0) {
            existingInjectionMarkerIndex = i;
            if (existingMarker.languageLayer.grammar === grammar) {
              marker = existingMarker;
              break;
            }
          } else {
            existingInjectionMarkerIndex = i;
          }
        }

        if (!marker) {
          marker = this.languageMode.injectionsMarkerLayer.markRange(
            injectionRange
          );

          marker.languageLayer = new LanguageLayer(
            marker,
            this.languageMode,
            grammar,
            this.depth + 1
          );

          marker.parentLanguageLayer = this;
        }

        markersToUpdate.set(
          marker,
          new NodeRangeSet(
            nodeRangeSet,
            injectionNodes,
            injectionPoint.newlinesBetween,
            injectionPoint.includeChildren
          )
        );
      }
    }

    for (const marker of existingInjectionMarkers) {
      if (!markersToUpdate.has(marker)) {
        this.languageMode.emitRangeUpdate(
          marker.getRange()
        );
        marker.languageLayer.destroy();
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
// subset of its stated range. A `NodeRangeSet` is how that strange subset is
// determined.
class NodeRangeSet {
  constructor(previous, nodes, newlinesBetween, includeChildren) {
    this.previous = previous;
    this.nodes = nodes;
    this.newlinesBetween = newlinesBetween;
    this.includeChildren = includeChildren;
  }

  getRanges(buffer) {
    const previousRanges = this.previous && this.previous.getRanges(buffer);
    const result = [];

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

    return result;
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
