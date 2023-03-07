const Parser = require('web-tree-sitter');
const ScopeDescriptor = require('./scope-descriptor')
// const { Patch } = require('superstring');
// const fs = require('fs');
const { Point, Range } = require('text-buffer');
const { CompositeDisposable, Emitter } = require('event-kit');
const Token = require('./token');
const TokenizedLine = require('./tokenized-line');
const { matcherForSelector } = require('./selectors');

// const parserInitPromise = Parser.init();
const createTree = require("./rb-tree")

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

const COMMENT_MATCHER = matcherForSelector('comment');
const MAX_RANGE = new Range(Point.ZERO, Point.INFINITY).freeze();

// A data structure for storing scope information during a `HighlightIterator`
// task. The data is reset in between each task.
class ScopeResolver {

  constructor () {
    this.map = new Map
    // TODO: It probably doesn't actually matter what order these are visited
    // in.
    this.order = []
    this.rangeData = new Map
  }

  _keyForPoint (point) {
    return `${point.row},${point.column}`
  }

  _keyForRange (syntax) {
    let { startIndex, endIndex } = syntax.node;
    return `${startIndex}/${endIndex}`;
    // let { startPosition, endPosition } = syntax.node;
    // return `${this._keyForPoint(startPosition)}/${this._keyForPoint(endPosition)}`
  }

  _keyToObject (key) {
    let [row, column] = key.split(',');
    return new Point(Number(row), Number(column));
    // return { row: Number(row), column: Number(column) }
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
    let tests = [];
    let candidateTests = Object.keys(props);

    if (existingData?.final) { return false; }

    for (let candidate of candidateTests) {
      if (tests.includes(candidate)) { continue; }
      if (!(candidate in ScopeResolver.TESTS)) { continue; }
      tests.push(candidate);
    }

    for (let key of tests) {
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
  // Will return `false` if the scope will not be added for the given range.
  store (syntax, id) {
    let {
      node,
      setProperties: props = {}
    } = syntax;

    let {
      startPosition: start,
      endPosition: end
    } = node;

    let data = this.getDataForRange(syntax);

    if (!this.test(data, props, node)) {
      return false;
    } else {
      this.setDataForRange(syntax, props);
    }

    // We should open this scope at `start`.
    this.setBoundary(node, start, id, 'open');

    // We should close this scope at `end`.
    this.setBoundary(node, end, id, 'close');

    return true;
  }

  setBoundary (node, point, id, which) {
    let key = this._keyForPoint(point)
    if (!this.order.includes(key)) {
      this.order.push(key);
    }
    if (!this.map.has(key)) {
      this.map.set(key, {
        open: [],
        close: [],
        openNodes: [],
        closeNodes: []
      })
    }
    let bundle = this.map.get(key);
    let idBundle = bundle[which];
    // TODO: Do we still need to store nodes?
    let nodeBundle = bundle[`${which}Nodes`];

    if (which === 'open') {
      // TODO: For now, assume that if two tokens both open at (X, Y), the one
      // that spans a greater distance in the buffer will be encountered first.
      // If that's not true, this logic may need to be more complex.

      // If an earlier token has already opened at this point, we want to open
      // after it.
      idBundle.push(id)
      nodeBundle.push(node)
    } else {
      // If an earlier token has already closed at this point, we want to close
      // before it.
      idBundle.unshift(id)
      nodeBundle.unshift(node)
    }
  }

  clear () {
    this.map.clear()
    this.rangeData.clear()
    this.order = []
  }

  *[Symbol.iterator] () {
    for (let key of this.order) {
      let point = this._keyToObject(key);
      yield [point, this.map.get(key)]
    }
  }
}

ScopeResolver.TESTS = {
  // Passes only if another node has not already declared `final` for the exact
  // same range. Used to prevent later scope matches from applying to a given
  // capture.
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
    return node.parent.firstChild.id === node.id;
  },

  // Passes only if the given node is the last among its siblings.
  onlyIfLast (existingData, props, node) {
    if (!node.parent) {
      // Root nodes are always last.
      return true;
    }
    return node.parent.lastChild.id === node.id;
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
  }
};



const VAR_ID = 257
const conversions = new Map([
  ['function.method.builtin', 'keyword.other.special-method'],
  ['number', 'constant.numeric'],
  // 'punctuation.special':
  // 'punctuation.bracket':
  // 'string':
  // 'embedded':
  // 'punctuation.bracket':
  ['string.special.regex', 'string.regexp']
])
class WASMTreeSitterLanguageMode {
  constructor(buffer, config, grammar) {
    this.emitter = new Emitter();
    this.lastId = 259
    this.scopeNames = new Map([["variable", VAR_ID]])
    this.scopeIds = new Map([[VAR_ID, "variable"]])
    this.buffer = buffer
    this.config = config
    this.injectionsMarkerLayer = buffer.addMarkerLayer();
    this.newRanges = []
    this.oldNodeTexts = new Set()
    this.grammar = grammar;
    this.rootScopeId = this.findOrCreateScopeId(this.grammar.scopeName);

    this.subscriptions = new CompositeDisposable;

    this.rootLanguage = null;
    this.rootLanguageLayer = null;

    this.grammarForLanguageString = this.grammarForLanguageString.bind(this);

    this.parsersByLanguage = new Map();

    this.grammar.getLanguage().then(lang => {
      this.rootLanguage = lang;
      this.rootLanguageLayer = new LanguageLayer(null, this, grammar, 0);
      this.syntaxQuery = lang.query(grammar.syntaxQuery)
      if (grammar.localsQuery) {
        // this.localsQuery = lang.query(grammar.localsQuery)
      }
      this.grammar = grammar;
      if (grammar.foldsQuery) {
        this.foldsQuery = lang.query(grammar.foldsQuery);
      }
      if (grammar.indentsQuery) {
        this.indentsQuery = lang.query(grammar.indentsQuery);
      }
      return this.getOrCreateParserForLanguage(lang);
    }).then(parser => {
      this.rootLanguageLayer
        .update(null)
        .then(() => this.emitter.emit('did-tokenize'));

      // const range = buffer.getRange();
      // this.tree = parser.parse(buffer.getText());
      // this.emitter.emit('did-change-highlighting', range);
    });

    // this.readyPromise = parserInitPromise.then(() =>
    //   Parser.Language.load(grammar.grammarPath)
    // ).then(lang => {
    //   this.rootLanguage = lang;
    //   this.syntaxQuery = lang.query(grammar.syntaxQuery)
    //   if (grammar.localsQuery) {
    //     // this.localsQuery = lang.query(grammar.localsQuery)
    //   }
    //   this.grammar = grammar;
    //   if (grammar.foldsQuery) {
    //     this.foldsQuery = lang.query(grammar.foldsQuery);
    //   }
    //   if (grammar.indentsQuery) {
    //     this.indentsQuery = lang.query(grammar.indentsQuery);
    //   }
    //   return this.getOrCreateParserForLanguage(lang);
    // }).then(parser => {
    //   this.rootLanguageLayer
    //     .update(null)
    //     .then(() => this.emitter.emit('did-tokenize'));
    //
    //   const range = buffer.getRange();
    //   this.tree = parser.parse(buffer.getText());
    //   this.emitter.emit('did-change-highlighting', range);
    // });

    this.rootScopeDescriptor = new ScopeDescriptor({
      scopes: [grammar.scopeName]
    });

    if (atom.inDevMode()) {
      this.observeQueryFileChanges();
    }
  }

  getRootParser() {
    return this.getOrCreateParserForLanguage(this.rootLanguage);
  }

  getOrCreateParserForLanguage(lang) {
    let existing = this.parsersByLanguage.get(lang);
    if (existing) {
      return existing;
    }
    let parser = new Parser();
    parser.setLanguage(lang);
    this.parsersByLanguage.set(lang, parser);
    return parser;
  }

  // HACK: Force an existing buffer to react to an update in the SCM file.
  _reloadSyntaxQuery() {
    this.grammar._reloadQueryFiles();

    let lang = this.parser.getLanguage();
    this.syntaxQuery = lang.query(this.grammar.syntaxQuery);

    // Force first highlight
    // this.boundaries = createTree(comparePoints);
    const range = this.buffer.getRange()
    this.tree = this.parser.parse(this.buffer.getText())
    // this._updateBoundaries(range.start, range.end);

    this.emitter.emit('did-change-highlighting', range)
  }

  observeQueryFileChanges() {
    this.subscriptions.add(
      this.grammar.onDidChangeQueryFile(({ queryType }) => {
        // let lang = this.parser.getLanguage();
        let lang = this.rootLanguage;
        if (!lang) { return; }
        try {
          this[queryType] = lang.query(this.grammar[queryType]);
          // Force a re-highlight of the entire syntax file.
          this.emitter.emit('did-change-highlighting', this.buffer.getRange());
        } catch (error) {
          console.error("Error parsing query file:");
          console.error(error);
        }
      })
    );
  }

  destroy() {
    this.injectionsMarkerLayer.destroy();
    this.tree = null;
    this.subscriptions.dispose();
  }

  getGrammar() {
    return this.grammar;
  }

  getLanguageId() {
    return this.grammar.scopeName;
  }

  updateForInjection(grammar) {
    this.updateInjections(MAX_RANGE, grammar);
  }

  bufferDidChange(change) {
    // if (!this.tree) { return; }

    let { oldRange, newRange, oldText, newText } = change;
    this.newRanges.push(change.newRange)

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

    // this.tree.edit(edit);
    this.rootLanguageLayer.handleTextChange(edit, oldText, newText);
  }

  bufferDidFinishTransaction() {
    this.rootLanguageLayer.update(null);
    // // We don't need to iterate through the list of changes because we've been
    // // building an affected buffer range with each individual change.
    // let affectedRange = this.editedRange;
    // this.editedRange = null;
    //
    // // We have to be careful not to re-parse the tree except in this one place,
    // // or else we might miss some of the changed ranges compared to the last
    // // time we were here. It's OK to re-parse as long as you don't assign the
    // // result back to `this.tree`.
    // //
    // // TODO: If there are use cases that demand we reassign to `this.tree` in
    // // other methods, then this method should retain the last tree it used and
    // // use _that_ to compare to the new tree.
    // //
    // let parser = this.getRootParser();
    // const newTree = parser.parse(this.buffer.getText(), this.tree)
    // const rangesWithSyntaxChanges = this.tree.getChangedRanges(newTree);
    // this.tree = newTree;
    //
    // let combinedRangeWithSyntaxChange = null;
    //
    // if (rangesWithSyntaxChanges.length > 0) {
    //   // Syntax changes are guaranteed to be ordered, so we can take a shortcut.
    //   combinedRangeWithSyntaxChange = new Range(
    //     rangesWithSyntaxChanges[0].startPosition,
    //     last(rangesWithSyntaxChanges).endPosition
    //   );
    // }
    //
    // if (combinedRangeWithSyntaxChange) {
    //   affectedRange = combineRanges([
    //     affectedRange,
    //     combinedRangeWithSyntaxChange
    //   ]);
    // }
    //
    // // console.log(
    // //   'invalidating:',
    // //   affectedRange.start,
    // //   affectedRange.end
    // // );
    // // this.emitter.emit('did-change-highlighting', affectedRange)
    // this.emitRangeUpdate(affectedRange);
  }

  emitRangeUpdate(range) {
    // const startRow = range.start.row;
    // const endRow = range.end.row;
    // for (let row = startRow; row < endRow; row++) {
    //   this.isFoldableCache[row] = undefined;
    // }
    // console.log('invalidating:', range.start, range.end);
    this.emitter.emit('did-change-highlighting', range);
  }

  // handleTextChange(edit) {
  //   const {
  //     startPosition,
  //     oldEndPosition,
  //     newEndPosition
  //   } = edit;
  //   // console.log('handleTextChange:', edit);
  //
  //   if (this.editedRange) {
  //     if (startPosition.isLessThan(this.editedRange.start)) {
  //       this.editedRange.start = startPosition;
  //     } if (oldEndPosition.isLessThan(this.editedRange.end)) {
  //       this.editedRange.end = newEndPosition.traverse(
  //         this.editedRange.end.traversalFrom(oldEndPosition)
  //       );
  //     } else {
  //       this.editedRange.end = newEndPosition;
  //     }
  //   } else {
  //     this.editedRange = new Range(startPosition, newEndPosition);
  //   }
  // }

  updateInjections(range, grammar) {
    if (!this.tree) { return; } // TEMP?
    let existingInjectionMarkers = this.injectionsMarkerLayer
      .findMarkers({ intersectsRange: range })
      .filter(marker => marker.grammar = grammar);

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

        const grammar = this.grammarForLanguageString(
          languageName
        );
        if (!grammar) { continue; }

        const contentNodes = injectionPoint.content(node);
        if (!contentNodes) { continue; }

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
          marker = this.injectionsMarkerLayer.markRange(
            injectionRange
          );

          marker.languageLayer = new LanguageLayer(
            marker,
            this,
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
  }

  grammarForLanguageString(languageString) {
    return this.grammarRegistry.treeSitterGrammarForLanguageString(
      languageString
    );
  }

  // Returns a list of all syntax boundaries within the given range.
  getSyntaxBoundaries(from, to, { includeOpenScopes = false } = {}) {
    let boundaries = createTree(comparePoints);
    let bufferRange = this.buffer.getRange();
    const syntax = this.syntaxQuery.captures(this.tree.rootNode, from, to);

    if (!this.scopeResolver) {
      this.scopeResolver = new ScopeResolver();
    }
    this.scopeResolver.clear();

    syntax.forEach((s) => {
      let { name } = s
      let id = this.findOrCreateScopeId(name)
      // ScopeResolver takes all our syntax tokens and consolidates them into a
      // fixed set of boundaries to visit in order. If a token has data, it
      // sets that data so that a later token for the same range can read it.
      this.scopeResolver.store(s, id)
    });

    // The root language scope should be the first scope opened and the last
    // scope closed in the buffer.
    if (comparePoints(bufferRange.start, from) === 0) {
      this.scopeResolver.setBoundary(null, from, this.rootScopeId, 'open');
    }

    if (comparePoints(bufferRange.end, to) === 0) {
      this.scopeResolver.setBoundary(null, to, this.rootScopeId, 'close');
    }

    let alreadyOpenScopes = [];
    if (comparePoints(from, bufferRange.start) > 0) {
      alreadyOpenScopes.push(this.rootScopeId);
    }
    for (let [point, data] of this.scopeResolver) {
      // Ignore boundaries that aren't within the specified range.
      if (comparePoints(point, from) < 0) {
        alreadyOpenScopes.push(...data.open);
        for (let c of data.close) {
          removeLastOccurrenceOf(
            alreadyOpenScopes,
            c
          );
        }
      }
      if (!isBetweenPoints(point, from, to)) { continue; }
      let bundle = {
        closeScopeIds: [...data.close],
        openScopeIds: [...data.open],
        closeNodes: [...data.closeNodes],
        openNodes: [...data.openNodes]
      };
      boundaries = boundaries.insert(point, bundle);
    }

    return includeOpenScopes ?
      [boundaries, alreadyOpenScopes] :
      boundaries;
  }

  _prepareInvalidations() {
    let nodes = this.oldNodeTexts
    let parentScopes = createTree(comparePoints)

    this.newRanges.forEach(range => {
      const newNodeText = this.boundaries.lt(range.end).value?.definition
      if (newNodeText) nodes.add(newNodeText)
      const parent = findNodeInCurrentScope(
        this.boundaries, range.start, v => v.scope === 'open'
      )
      if (parent) parentScopes = parentScopes.insert(parent.position, parent)
    })

    parentScopes.forEach((_, val) => {
      const from = val.position, to = val.closeScopeNode.position
      const range = new Range(from, to)
      this._invalidateReferences(range, nodes)
    })
    this.oldNodeTexts = new Set()
    this.newRanges = []
  }

  _invalidateReferences(range, invalidatedNames) {
    const {start, end} = range
    let it = this.boundaries.ge(start)
    while (it.hasNext) {
      const node = it.value.openNode
      if (node && !it.value.definition) {
        const txt = node.text
        if (invalidatedNames.has(txt)) {
          const range = new Range(node.startPosition, node.endPosition)
          this.emitter.emit('did-change-highlighting', range)
        }
      }
      it.next()
      if (comparePoints(it.key, end) >= 0) return
    }
  }

  _updateWithLocals(locals) {
    const size = locals.length
    for (let i = 0; i < size; i++) {
      const {name, node} = locals[i]
      const nextOne = locals[i+1]

      const duplicatedLocalScope = nextOne &&
        comparePoints(node.startPosition, nextOne.node.startPosition) === 0 &&
        comparePoints(node.endPosition, nextOne.node.endPosition) === 0
      if (duplicatedLocalScope) {
        // Local reference have lower precedence over everything else
        if (name === 'local.reference') continue;
      }

      let openNode = this._getOrInsert(node.startPosition, node)
      if (!openNode.openNode) openNode.openNode = node
      let closeNode = this._getOrInsert(node.endPosition, node)
      if (!closeNode.closeNode) closeNode.closeNode = node

      if (name === "local.scope") {
        openNode.scope = "open"
        closeNode.scope = "close"
        openNode.closeScopeNode = closeNode
        closeNode.openScopeNode = openNode
        const parentNode = findNodeInCurrentScope(
          this.boundaries, node.startPosition, v => v.scope === 'open')
        const depth = parentNode?.depth || 0
        openNode.depth = depth + 1
        closeNode.depth = depth + 1
      } else if (name === "local.reference" && !openNode.definition) {
        const varName = node.text
        const varScope = findNodeInCurrentScope(
          this.boundaries, node.startPosition, v => v.definition === varName)
        if (varScope) {
          openNode.openScopeIds = varScope.openScopeIds
          closeNode.closeScopeIds = varScope.closeDefinition.closeScopeIds
        }
      } else if (name === "local.definition") {
        const shouldAddVarToScopes = openNode.openScopeIds.indexOf(VAR_ID) === -1
        if (shouldAddVarToScopes) {
          openNode.openScopeIds = [...openNode.openScopeIds, VAR_ID]
          closeNode.closeScopeIds = [VAR_ID, ...closeNode.closeScopeIds]
        }

        openNode.definition = node.text
        openNode.closeDefinition = closeNode
      }
    }
  }

  _getOrInsert(key) {
    const existing = this.boundaries.get(key)
    if (existing) {
      return existing
    } else {
      const obj = {openScopeIds: [], closeScopeIds: [], position: key}
      this.boundaries = this.boundaries.insert(key, obj)
      return obj
    }
  }

  /*
  Section - Highlighting
  */
  onDidChangeHighlighting(callback) {
    return this.emitter.on('did-change-highlighting', callback);
  }

  buildHighlightIterator() {
    if (!this.rootLanguageLayer) {
      console.warn('NO ROOT LANGUAGE!');
      return new NullLayerHighlightIterator();
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

  findOrCreateScopeId (name) {
    let id = this.scopeNames.get(name);
    if (!id) {
      this.lastId += 2;
      id = this.lastId;
      this.scopeNames.set(name, id);
      this.scopeIds.set(id, name);
    }
    return id;
  }

  syntaxTreeScopeDescriptorForPosition(point) {
    point = this.buffer.clipPosition(Point.fromObject(point));

    // If the position is the end of a line, get node of left character instead of newline
    // This is to match TextMate behaviour, see https://github.com/atom/atom/issues/18463
    if (
      point.column > 0 &&
      point.column === this.buffer.lineLengthForRow(point.row)
    ) {
      point = point.copy();
      point.column--;
    }

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

    iterate(this.tree.rootNode);

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

    return this.rootLanguageLayer.bufferRangeForScopeAtPosition(selector, point, match);
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

  getFoldableRanges() {
    if (!this.tree) return [];
    const folds = this.foldsQuery.captures(this.tree.rootNode)
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
        const {column} = fold.node.startPosition
        return column > minCol && column <= maxCol
      })
      .map(fold => this._makeFoldableRange(fold.node))
  }

  parse (language, oldTree, includedRanges) {
    let parser = this.getOrCreateParserForLanguage(language);
    const result = parser.parse(
      this.buffer.getText(),
      oldTree,
      { includedRanges }
    );

    return result;
  }

  get rootTree () {
    return this.rootLanguageLayer?.tree
  }

  // get tree () {
  //   return this.rootLanguageLayer?.tree;
  // }

  // Re-parse the tree without replacing the existing tree.
  forceAnonymousParse() {
    let parser = this.getRootParser();
    return parser.parse(this.buffer.getText(), this.tree);
  }

  // Copied from original tree-sitter. I honestly didn't even read this.
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

  // eslint-disable-next-line no-unused-vars
  getFoldableRangeContainingPoint(point, tabLength) {
    const foldsAtRow = this._getFoldsAtRow(point.row)
    const node = foldsAtRow[0]?.node
    if (node) {
      return this._makeFoldableRange(node)
    }
  }

  _makeFoldableRange(node) {
    const children = node.children
    const lastNode = children[children.length-1]
    const range = new Range([node.startPosition.row, Infinity], lastNode.startPosition)
    return range
  }

  isFoldableAtRow(row) {
    const foldsAtRow = this._getFoldsAtRow(row)
    return foldsAtRow.length !== 0
  }

  _getFoldsAtRow(row) {
    if (!this.tree) { return []; }
    const folds = this.foldsQuery.captures(
      this.tree.rootNode,
      { row: row, column: 0 },
      { row: row + 1, column: 0 }
    )
    if (!folds) {
      return [];
    }
    return folds.filter(fold => fold.node.startPosition.row === row)
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

  // Get the suggested indentation level for an existing line in the buffer.
  //
  // * bufferRow - A {Number} indicating the buffer row
  //
  // Returns a {Number}.
  suggestedIndentForBufferRow(row, tabLength, options = {}) {
    let indentTree = this.forceAnonymousParse();
    if (row === 0) { return 0; }

    let comparisonRow = row - 1;

    if (options.skipBlankLines !== false) {
      // Move upward until we find the a line with text on it.
      while (this.buffer.isRowBlank(comparisonRow) || comparisonRow === 0) {
        comparisonRow--;
      }
    }

    const lastLineIndent = this.indentLevelForLine(
      this.buffer.lineForRow(comparisonRow), tabLength
    );

    // Capture in two phases. The first phase affects whether this line should
    // be indented from the previous line.
    const indentCaptures = this.indentsQuery.captures(
      indentTree.rootNode,
      { row: comparisonRow, column: 0 },
      { row: row, column: 0 }
    );

    let indentDelta = this.getIndentDeltaFromCaptures(indentCaptures);
    indentDelta = clamp(indentDelta, 0, 1);

    // The second phase tells us whether this line should be dedented from the
    // previous line.
    const dedentCaptures = this.indentsQuery.captures(
      indentTree.rootNode,
      { row: row, column: 0 },
      { row: row + 1, column: 0 }
    );

    let dedentDelta = this.getIndentDeltaFromCaptures(dedentCaptures);
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
    // console.log('suggestedIndentForEditedBufferRow', row);
    if (row === 0) { return 0; }

    // Indents query won't work unless we re-parse the tree. Since we're typing
    // one character at a time, this should not be costly.
    let indentTree = this.forceAnonymousParse();
    const indents = this.indentsQuery.captures(
      indentTree.rootNode,
      { row: row, column: 0 },
      { row: row + 1, column: 0 }
    )

    const indent = indents.find(i => {
      return i.node.startPosition.row === row && i.name === 'branch'
    });
    if (indent?.name === "branch") {
      if (this.buffer.lineForRow(row).trim() === indent.node.text) {
        const parent = indent.node.parent
        if (parent) return this.indentLevelForLine(
          this.buffer.getLines()[parent.startPosition.row],
          tabLength
        )
      }
    }
  }

  // Get the suggested indentation level for a given line of text, if it were
  // inserted at the given row in the buffer.
  //
  // * bufferRow - A {Number} indicating the buffer row
  //
  // Returns a {Number}.
  suggestedIndentForLineAtBufferRow(row, line, tabLength) {
    // console.log('suggestedIndentForLineAtBufferRow', row, line);
    return this.suggestedIndentForBufferRow(row, tabLength);
  }

  // Private

  firstNonWhitespaceRange(row) {
    return this.buffer.findInRangeSync(
      /\S/,
      new Range(new Point(row, 0), new Point(row, Infinity))
    );
  }

  getIndentDeltaFromCaptures(captures) {
    let delta = 0;
    let positionSet = new Set;
    for (let { name, node } of captures) {
      // Ignore phantom captures.
      let text = node.text;
      if (!text || !text.length) { continue; }

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
    // console.log('ITERATOR:', iterator);
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
}

module.exports = WASMTreeSitterLanguageMode;

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

function findNodeInCurrentScope(boundaries, position, filter) {
  let iterator = boundaries.ge(position)
  while (iterator.hasPrev) {
    iterator.prev()
    const value = iterator.value
    if (filter(value)) return value

    if (value.scope === 'close') {
      // If we have a closing scope, there's an "inner scope" that we will
      // ignore, and move the iterator BEFORE the inner scope position
      iterator = boundaries.lt(value.openScopeNode.position)
    } else if (value.scope === 'open') {
      // But, if we find an "open" scope, we check depth. If it's `1`, we
      // got into the last nested scope we were inside, so it's time to quit
      if (value.depth === 1) return
    }
  }
}

function comparePoints(a, b) {
  const rows = a.row - b.row
  if (rows === 0)
    return a.column - b.column
  else
    return rows
}

function isBetweenPoints (point, a, b) {
  let comp = comparePoints(a, b);
  let lesser = comp > 0 ? b : a;
  let greater = comp > 0 ? a : b;
  return comparePoints(point, lesser) >= 0 && comparePoints(point, greater) <= 0;
}

class OldHighlightIterator {
  constructor (languageMode) {
    this.languageMode = languageMode;
  }

  seek (start, endRow) {
    let { buffer } = this.languageMode;
    let end = {
      row: endRow,
      column: buffer.lineLengthForRow(endRow)
    };
    this.end = end;

    let [boundaries, openScopes] = this.languageMode.getSyntaxBoundaries(
      start,
      end,
      { includeOpenScopes: true }
    );
    this.iterator = boundaries.begin;
    this.bufferRange = buffer.getRange();
    return openScopes;
  }

  getOpenScopeIds () {
    // this.logPosition();
    return [...this.iterator.value.openScopeIds];
  }

  getCloseScopeIds () {
    return [...this.iterator.value.closeScopeIds];
  }

  getPosition () {
    let position = this.iterator.key;
    return position || Point.INFINITY;
  }

  logPosition () {
    let pos = this.getPosition();

    console.log(
      `[highlight] (${pos.row}, ${pos.column})`,
      'close',
      this.iterator.value.closeScopeIds.map(id => this.languageMode.scopeNameForScopeId(id)),
      'open',
      this.iterator.value.openScopeIds.map(id => this.languageMode.scopeNameForScopeId(id)),
      'next?',
      this.iterator.hasNext
    );
  }

  moveToSuccessor () {
    this.iterator.next();
    if (this.iterator.key && this.end) {
      if (comparePoints(this.iterator.key, this.end) > 0) {
        this.iterator = { value: null };
      }
    }
  }
}

class HighlightIterator {
  constructor(languageMode) {
    // console.log('new HighlightIterator', languageMode);
    this.languageMode = languageMode;
    this.iterators = null;
  }

  seek(start, endRow) {
    // console.log('HighlightIterator#seek', start, endRow);
    let { buffer, rootLanguageLayer } = this.languageMode;
    if (!rootLanguageLayer) { return []; }
    let end = {
      row: endRow,
      column: buffer.lineLengthForRow(endRow)
    };
    this.end = end;

    // const targetIndex = this.languageMode.buffer.characterIndexForPosition(start);

    this.iterators = [];

    const iterator = this.languageMode.rootLanguageLayer.buildHighlightIterator();

    let result = iterator.seek(start, endRow)
    if (result) {
      this.iterators.push(iterator);
    }

    // console.log('iterators:', this.iterators);

    // TODO: Injections.
    return result;
  }

  moveToSuccessor () {
    // let nextBoundary = null;
    // let nextIterator = null;
    // for (let iterator of iterators) {
    //   let next = iterator.peekAtSuccessor();
    //   if (!nextBoundary || comparePoints(next.key, nextBoundary) < 0) {
    //     nextBoundary = next.key;
    //     nextIterator = iterator;
    //   }
    // }
    let leader = last(this.iterators);
    if (leader.moveToSuccessor()) {
      const leaderIndex = this.iterators.length - 1;
      let i = leaderIndex;
      while (i > 0 && this.iterators[i - 1].compare(leader) < 0) { i--; }
      if (i < leaderIndex) {
        this.iterators.splice(i, 0, this.iterators.pop());
      }
    } else {
      this.iterators.pop();
    }

    // detect covered scope?
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
    if (iterator) {
      return iterator.getCloseScopeIds();
    }
    return [];
  }

  getOpenScopeIds() {
    let iterator = last(this.iterators);
    if (iterator) {
      return iterator.getOpenScopeIds();
    }
    return [];
  }

  logPosition() {
    let iterator = last(this.iterators);
    iterator.logPosition();
  }
}

class LayerHighlightIterator {
  constructor (languageLayer) {
    this.languageLayer = languageLayer;

    // TODO
  }

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

  seek(start, endRow) {
    // console.log('LayerHighlightIterator#seek', start, endRow);
    let end = this._getEndPosition(endRow);
    let [boundaries, openScopes] = this.languageLayer.getSyntaxBoundaries(
      start,
      end,
      { includeOpenScopes: true }
    );

    // console.log('got boundaries:', boundaries, openScopes);
    this.iterator = boundaries.begin;
    this.end = end;
    return openScopes;
  }

  _inspectScopes (ids) {
    if (Array.isArray(ids)) {
      return [
        ...ids.map(id => this._inspectScopes(id))
      ];
    }
    return this.languageLayer.languageMode.scopeNameForScopeId(ids);
  }

  getOpenScopeIds () {
    return [...this.iterator.value.openScopeIds];
  }

  getCloseScopeIds () {
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

  moveToSuccessor () {
    if (!this.iterator.hasNext) { return false; }
    this.iterator.next();
    if (this.iterator.key && this.end) {
      if (comparePoints(this.iterator.key, this.end) > 0) {
        this.iterator = { value: null };
        return false;
      }
    }
    return true;
  }

  peekAtSuccessor () {
    if (!this.iterator.hasNext) { return null; }
    this.iterator.next();
    let { key, value } = this.iterator;
    this.iterator.prev();
    return { key, value };
  }
}

class LanguageLayer {
  constructor(marker, languageMode, grammar, depth) {
    this.marker = marker;
    this.languageMode = languageMode;
    this.grammar = grammar;
    this.depth = depth;

    // TODO: Make sure this is synchronous.
    let language = this.grammar.getLanguageSync();
    this.syntaxQuery = language.query(grammar.syntaxQuery);

    this.tree = null;
    this.scopeResolver = new ScopeResolver();
    this.languageScopeId = this.languageMode.findOrCreateScopeId(this.grammar.scopeName);
    this.grammar.getLanguage();
  }

  getSyntaxBoundaries(from, to, { includeOpenScopes = false } = {}) {
    if (!this.tree) { return []; }
    if (!this.grammar.getLanguageSync()) { return []; }
    from = Point.fromObject(from, true);
    to = Point.fromObject(to, true);
    let boundaries = createTree(comparePoints);
    let bufferRange = this.marker ? this.marker.getRange() : MAX_RANGE;

    const captures = this.syntaxQuery.captures(this.tree.rootNode, from, to);

    this.scopeResolver.clear();

    for (let capture of captures) {
      let { name } = capture;
      let id = this.languageMode.findOrCreateScopeId(name);
      this.scopeResolver.store(capture, id);
    }

    if (from.isEqual(bufferRange.start)) {
      this.scopeResolver.setBoundary(null, from, this.languageScopeId, 'open');
    }

    if (to.isEqual(bufferRange.end)) {
      this.scopeResolver.setBoundary(null, to, this.languageScopeId, 'close');
    }

    let alreadyOpenScopes = [];

    if (from.isGreaterThan(bufferRange.start)) {
      alreadyOpenScopes.push(this.languageScopeId);
    }

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
        openScopeIds: [...data.open],
        closeNodes: [...data.closeNodes],
        openNodes: [...data.openNodes]
      };

      boundaries = boundaries.insert(point, bundle);
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
    // console.log('handleTextChange', edit);
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

    for (const marker of this.languageMode.injectionsMarkerLayer.getMarkers()) {
      if (marker.parentLanguageLayer === this) {
        marker.languageLayer.destroy();
      }
    }
  }

  update(nodeRangeSet) {
    // TODO: Async?
    this._performUpdate(nodeRangeSet);
    return Promise.resolve();
  }

  updateInjections(grammar) {
    // TODO: Async?
    if (!grammar.injectionRegex) { return; }
    this._populateInjections(MAX_RANGE, null);
  }

  _performUpdate(nodeRangeSet) {
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
      this._populateInjections(affectedRange, nodeRangeSet);
    }
  }

  scopeMapAtPosition(point) {
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

    // console.log('scopeMapAtPosition returning', results);
    return results;
  }

  scopeDescriptorForPosition(point) {
    let results = this.scopeMapAtPosition(point);
    let scopes = results.map(cap => cap.name);
    if (scopes.length === 0 || scopes[0] !== this.grammar.scopeName) {
      scopes.unshift(this.grammar.scopeName);
    }
    return new ScopeDescriptor({ scopes });
  }

  bufferRangeForScopeAtPosition(selector, point, match = null) {
    if (!match) {
      match = matcherForSelector(selector);
    }
    let results = this.scopeMapAtPosition(point);

    results.reverse();
    for (let { name, node } of results) {
      if (match(name)) {
        return new Range(node.startPosition, node.endPosition);
      }
    }
  }

  _populateInjections () {
    // no-op
  }
}

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
