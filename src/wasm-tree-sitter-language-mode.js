const Parser = require('web-tree-sitter');
const ScopeDescriptor = require('./scope-descriptor')
const { Patch } = require('superstring');
// const fs = require('fs');
const { Point, Range } = require('text-buffer');
const { Emitter } = require('event-kit');

const initPromise = Parser.init()
const createTree = require("./rb-tree")

function last(array) {
  return array[array.length - 1];
}

class PositionIndex {
  constructor () {
    this.map = new Map
    // TODO: It probably doesn't actually matter what order these are visited
    // in.
    this.order = []
    this.rangeData = new Map
  }

  _normalizePoint (point) {
    return `${point.row},${point.column}`
  }

  _normalizeRange (syntax) {
    let { startPosition, endPosition } = syntax.node;
    return `${this._normalizePoint(startPosition)}/${this._normalizePoint(endPosition)}`
  }

  _keyToObject (key) {
    let [row, column] = key.split(',');
    return { row: Number(row), column: Number(column) }
  }

  setDataForRange (syntax, props) {
    let key = this._normalizeRange(syntax);
    return this.rangeData.set(key, props);
  }

  getDataForRange (syntax) {
    let key = this._normalizeRange(syntax);
    return this.rangeData.get(key);
  }

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
    if (data && data.final) {
      // A previous rule covering this exact range marked itself as "final." We
      // should not add an additional scope.
      return;
    } else if (data && props.shy) {
      // This node will only apply if we haven't yet marked this range with
      // anything.
      return;
    } else {
      // TODO: We may want to handle the case where more than one token will
      // want to set data for a given range. Do we merge objects? Store each
      // dataset separately?
      this.setDataForRange(syntax, props);
    }

    // We should open this scope at `start`.
    this.set(node, start, id, 'open');

    // We should close this scope at `end`.
    this.set(node, end, id, 'close');
  }

  set (node, point, id, which) {
    let key = this._normalizePoint(point)
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

  get (point) {
    let key = this._normalizePoint(point)
    return this.map.get(key)
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


const VAR_ID = 257
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

    let resolve
    this.ready = new Promise(r => resolve = r)
    this.grammar = grammar

    initPromise.then(() =>
      Parser.Language.load(grammar.grammarPath)
    ).then(lang => {
      this.lang = lang
      this.syntaxQuery = lang.query(grammar.syntaxQuery)
      if(grammar.localsQuery) {
        // this.localsQuery = lang.query(grammar.localsQuery)
      }
      this.grammar = grammar
      if(grammar.foldsQuery) {
        this.foldsQuery = lang.query(grammar.foldsQuery)
      }
      this.indentsQuery = lang.query(grammar.indentsQuery)
      this.parser = new Parser()
      this.parser.setLanguage(lang)

      // Force first highlight
      this.boundaries = createTree(comparePoints)
      // const startRange = new Range([0, 0], [0, 0])
      const range = buffer.getRange()
      this.tree = this.parser.parse(buffer.getText())
      console.log('TREE:', this.tree, this.tree.then);
      this._updateBoundaries(range.start, range.end)
      this.emitter.emit('did-change-highlighting', range)
      resolve(true)
    })

    this.rootScopeDescriptor = new ScopeDescriptor({
      scopes: [grammar.scopeName]
    });
  }

  // A hack to force an existing buffer to react to an update in the SCM file.
  _reloadSyntaxQuery () {
    this.grammar._reloadQueryFiles();

    let lang = this.parser.getLanguage();
    this.syntaxQuery = lang.query(this.grammar.syntaxQuery);

    // Force first highlight
    this.boundaries = createTree(comparePoints);
    const range = this.buffer.getRange()
    this.tree = this.parser.parse(this.buffer.getText())
    this._updateBoundaries(range.start, range.end);

    this.emitter.emit('did-change-highlighting', range)
  }

  getGrammar() {
    return this.grammar;
  }

  updateForInjection(...args) {
  }

  onDidChangeHighlighting(callback) {
    return this.emitter.on('did-change-highlighting', callback)
  }

  tokenizedLineForRow(row) {
  }

  getScopeChain(...args) {
    console.log("getScopeChain", args)
  }

  bufferDidChange(change) {
    console.log('bufferDidChange:', change);
    if (!this.tree) return;

    this.newRanges.push(change.newRange)
    const possibleDefinition = this.boundaries.lt(change.oldRange.end).value?.definition
    if(possibleDefinition) this.oldNodeTexts.add(possibleDefinition)

    const startIndex = this.buffer.characterIndexForPosition(change.newRange.start)

    // Mark edits in the tree, but don't actually reparse until
    // `bufferDidFinishTransaction`.
    this.tree.edit({
      startPosition: change.newRange.start,
      oldEndPosition: change.oldRange.end,
      newEndPosition: change.newRange.end,
      startIndex: startIndex,
      oldEndIndex: startIndex + change.oldText.length,
      newEndIndex: this.buffer.characterIndexForPosition(change.newRange.end)
    })
  }

  bufferDidFinishTransaction({ changes }) {
    console.log('bufferDidFinishTransaction', changes);
    // TODO: There's got to be a better way to do this. If I consider just the
    // new range _or_ the old range, it seems like there are edge cases that
    // would confound the strategy.
    let megaRanges = changes.map(({ newRange, oldRange }) => {
      return combineRanges([newRange, oldRange]);
    })

    let combinedRangeOfChanges = combineRanges(megaRanges);


    const newTree = this.parser.parse(this.buffer.getText(), this.tree)
    const rangesWithSyntaxChanges = this.tree.getChangedRanges(newTree);
    this.tree = newTree;

    console.log('"new" tree has text:', newTree.rootNode.text);

    let combinedRangeWithSyntaxChange = null;

    if (rangesWithSyntaxChanges.length > 0) {
      // Syntax changes are guaranteed to be ordered, so we can take a shortcut.
      combinedRangeWithSyntaxChange = new Range(
        rangesWithSyntaxChanges[0].startPosition,
        last(rangesWithSyntaxChanges).endPosition
      );
    }

    if (combinedRangeWithSyntaxChange) {
      combinedRangeOfChanges = combineRanges([
        combinedRangeOfChanges,
        combinedRangeWithSyntaxChange
      ]);
    }

    console.log('updating boundaries:', combinedRangeOfChanges.start, combinedRangeOfChanges.end);
    this._updateBoundaries(
      combinedRangeOfChanges.start,
      combinedRangeOfChanges.end
    );
  }

  _updateBoundaries(from, to) {
    // Run the captures and see how much of the document will be affected.
    let range = this._captureBoundsOfSyntaxUpdate(from, to);

    // If there are no captures, use the original from/to range.
    if (!range) {
      range = new Range(from, to);
    }

    if (this.localsQuery) {
      const locals = this.localsQuery.captures(this.tree.rootNode, from, to)
      this._updateWithLocals(locals)
      this._prepareInvalidations()
    }

    this._updateSyntax(range.start, range.end);

    console.log('invalidating:', range.start, range.end);

    this.emitter.emit('did-change-highlighting', range)
  }

  // FIXME: This was a different strategy for determining how much of the
  // document to invalidate: crawl `this.boundaries` between `from` and `to`,
  // then take the earliest and latest positions of affected nodes.
  _findInvalidationRange(from, to) {
    let iterate = (from, to) => {
      let iterator = this.boundaries.ge(from)

      let newFrom = from;
      let newTo = to;
      while (iterator.hasNext && comparePoints(iterator.key, to) <= 0) {
        let { key, value } = iterator
        let { closeNodes, openNodes } = value

        for (let o of openNodes) {
          if (comparePoints(o.endPosition, newTo) > 0) {
            newTo = o.endPosition;
          }
        }

        for (let c of closeNodes) {
          if (comparePoints(c.startPosition, newFrom) < 0) {
            newFrom = c.startPosition;
          }
        }

        iterator.next()
      }

      let didChange = comparePoints(from, newFrom) !== 0 || comparePoints(to, newTo) !== 0;

      return [newFrom, newTo, didChange];
    };

    let currentFrom = from;
    let currentTo = to;
    let stable = false;
    while (!stable) {
      let [newFrom, newTo, didChange] = iterate(currentFrom, currentTo);
      if (!didChange) {
        stable = true;
        break;
      }
      currentFrom = newFrom;
      currentTo = newTo;
    }

    return new Range(currentFrom, currentTo);

    // return [currentFrom, currentTo];
  }

  _captureBoundsOfSyntaxUpdate (from, to) {
    const syntax = this.syntaxQuery.captures(this.tree.rootNode, from, to);

    if (syntax.length === 0) { return null; }

    let earliest = null;
    let latest = null;
    syntax.forEach(({ node }) => {
      if (!earliest) {
        earliest = node.startPosition;
      } else if (comparePoints(node.startPosition, earliest) < 0) {
        earliest = node.startPosition;
      }

      if (!latest) {
        latest = node.endPosition;
      } else if (comparePoints(node.endPosition, latest) > 0) {
        latest = node.endPosition;
      }
    });

    earliest.column = 0;

    let combinedRange = new Range(earliest, latest);

    return combinedRange;
  }

  _updateSyntax(from, to) {
    console.log('_updateSyntax', from, to);

    const syntax = this.syntaxQuery.captures(this.tree.rootNode, from, to)

    let oldDataIterator = this.boundaries.ge(from)
    let oldScopes = []
    // Remove all boundaries data for the given range.
    while (oldDataIterator.hasNext && comparePoints(oldDataIterator.key, to) <= 0 ) {
      let { key, value } = oldDataIterator
      console.log('@ removing:', key, value);
      this.boundaries = this.boundaries.remove(key)
      oldScopes = value.closeScopeIds;
      oldDataIterator.next();
      // TODO: Doesn't this mean that we'll miss the last item in the iterator
      // under certain circumstances?
    }

    // TODO: Still don't quite understand this; need to revisit.
    oldScopes = oldScopes || []

    if (!this.positionIndex) {
      this.positionIndex = new PositionIndex();
    }
    this.positionIndex.clear()

    console.log('oldScopes:', oldScopes.map(s => this.scopeForId(s)));

    let inspect = (id) => {
      if (Array.isArray(id)) {
        return id.map(i => inspect(i))
      }
      return this.scopeForId(id)
    };

    let earliest = null;
    let latest = null;
    syntax.forEach((s) => {
      let { name, node } = s
      let id = this.findOrCreateScopeId(name)

      if (!earliest) {
        earliest = node.startPosition;
      } else if (comparePoints(node.startPosition, earliest) < 0) {
        earliest = node.startPosition;
      }

      if (!latest) {
        latest = node.endPosition;
      } else if (comparePoints(node.endPosition, latest) > 0) {
        latest = node.endPosition;
      }
      // PositionIndex takes all our syntax tokens and consolidates them into a
      // fixed set of boundaries to visit in order. If a token has data, it
      // sets that data so that a later token for the same range can read it.
      this.positionIndex.store(s, id)
    });

    let combinedRange = new Range(earliest, latest);

    for (let [point, data] of this.positionIndex) {
      let closeScopeIds = [...oldScopes, ...data.close];
      let bundle = {
        closeScopeIds,
        openScopeIds: [...data.open],
        closeNodes: [...data.closeNodes],
        openNodes: [...data.openNodes],
        position: point
      }
      oldScopes = [];
      console.log('@ at position', point, 'close:', inspect(bundle.closeScopeIds), 'open:', inspect(bundle.openScopeIds));
      this.boundaries = this.boundaries.insert(point, bundle)
    }



    // syntax.forEach(({ node, name }) => {
    //   // let id = this.scopeNames.get(name)
    //   // console.log(' handling node:', name, node);
    //   // if (!id) {
    //   //   this.lastId += 2
    //   //   id = this.lastId
    //   //   const newId = this.lastId;
    //   //   this.scopeNames.set(name, newId)
    //   //   this.scopeIds.set(newId, name)
    //   // }
    //   let id = this.findOrCreateScopeId(name)
    //   let old = this.boundaries.get(node.startPosition)
    //   if (old) {
    //     // console.log(' found node:', this.scopeForId(id));
    //     old.openNode = node
    //     if (old.openScopeIds.length === 0) {
    //       old.openScopeIds = [id]
    //     }
    //   } else {
    //     let bundle = {
    //       closeScopeIds: [...oldScopes],
    //       openScopeIds: [id],
    //       openNode: node,
    //       position: node.startPosition
    //     }
    //     console.log('inserting close', s(bundle.closeScopeIds), 'open', s(bundle.openScopeIds), 'at', node.startPosition);
    //     this.boundaries = this.boundaries.insert(node.startPosition, bundle)
    //     oldScopes = [id]
    //   }
    //
    //   old = this.boundaries.get(node.endPosition)
    //   if (old) {
    //     old.closeNode = node
    //     if (old.closeScopeIds.length === 0) {
    //       old.closeScopeIds = [id]
    //     }
    //   } else {
    //     this.boundaries = this.boundaries.insert(node.endPosition, {
    //       closeScopeIds: [id],
    //       openScopeIds: [],
    //       closeNode: node,
    //       position: node.endPosition
    //     })
    //   }
    // })

    // console.log('closing', oldScopes.map(s => this.scopeForId(s)), 'at the end of the document');
    this.boundaries = this.boundaries.insert(Point.INFINITY, {
      closeScopeIds: [...oldScopes],
      openScopeIds: [],
      position: Point.INFINITY
    })

    console.log('combinedRange:', combinedRange.start, combinedRange.end);

    return combinedRange;
  }

  // _updateSyntax(from, to) {
  //   const syntax = this.syntaxQuery.captures(this.tree.rootNode, from, to)
  //   let oldDataIterator = this.boundaries.ge(from)
  //   let oldScopes = []
  //
  //   while( oldDataIterator.hasNext && comparePoints(oldDataIterator.key, to) <= 0 ) {
  //     this.boundaries = this.boundaries.remove(oldDataIterator.key)
  //     oldScopes = oldDataIterator.value.closeScopeIds
  //     oldDataIterator.next()
  //   }
  //
  //   oldScopes = oldScopes || []
  //   syntax.forEach(({node, name}) => {
  //     let id = this.scopeNames.get(name)
  //     if(!id) {
  //       this.lastId += 2
  //       id = this.lastId
  //       const newId = this.lastId;
  //       this.scopeNames.set(name, newId)
  //       this.scopeIds.set(newId, name)
  //     }
  //     // })
  //
  //     let old = this.boundaries.get(node.startPosition)
  //     if(old) {
  //       old.openNode = node
  //       if(old.openScopeIds.length === 0) {
  //         old.openScopeIds = [id]
  //       }
  //     } else {
  //       this.boundaries = this.boundaries.insert(node.startPosition, {
  //         closeScopeIds: [...oldScopes],
  //         openScopeIds: [id],
  //         openNode: node,
  //         position: node.startPosition
  //       })
  //       oldScopes = [id]
  //     }
  //
  //     old = this.boundaries.get(node.endPosition)
  //     if(old) {
  //       old.closeNode = node
  //       if(old.closeScopeIds.length === 0) old.closeScopeIds = [id]
  //     } else {
  //       this.boundaries = this.boundaries.insert(node.endPosition, {
  //         closeScopeIds: [id],
  //         openScopeIds: [],
  //         closeNode: node,
  //         position: node.endPosition
  //       })
  //     }
  //   })
  //
  //   this.boundaries = this.boundaries.insert(Point.INFINITY, {
  //     closeScopeIds: [...oldScopes],
  //     openScopeIds: [],
  //     position: Point.INFINITY
  //   })
  // }

  _prepareInvalidations() {
    let nodes = this.oldNodeTexts
    let parentScopes = createTree(comparePoints)

    this.newRanges.forEach(range => {
      const newNodeText = this.boundaries.lt(range.end).value?.definition
      if(newNodeText) nodes.add(newNodeText)
      const parent = findNodeInCurrentScope(
        this.boundaries, range.start, v => v.scope === 'open'
      )
      if(parent) parentScopes = parentScopes.insert(parent.position, parent)
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
    while(it.hasNext) {
      const node = it.value.openNode
      if(node && !it.value.definition) {
        const txt = node.text
        if(invalidatedNames.has(txt)) {
          const range = new Range(node.startPosition, node.endPosition)
          this.emitter.emit('did-change-highlighting', range)
        }
      }
      it.next()
      if(comparePoints(it.key, end) >= 0) return
    }
  }

  _updateWithLocals(locals) {
    const size = locals.length
    for(let i = 0; i < size; i++) {
      const {name, node} = locals[i]
      const nextOne = locals[i+1]

      const duplicatedLocalScope = nextOne &&
        comparePoints(node.startPosition, nextOne.node.startPosition) === 0 &&
        comparePoints(node.endPosition, nextOne.node.endPosition) === 0
      if(duplicatedLocalScope) {
        // Local reference have lower precedence over everything else
        if(name === 'local.reference') continue;
      }

      let openNode = this._getOrInsert(node.startPosition, node)
      if(!openNode.openNode) openNode.openNode = node
      let closeNode = this._getOrInsert(node.endPosition, node)
      if(!closeNode.closeNode) closeNode.closeNode = node

      if(name === "local.scope") {
        openNode.scope = "open"
        closeNode.scope = "close"
        openNode.closeScopeNode = closeNode
        closeNode.openScopeNode = openNode
        const parentNode = findNodeInCurrentScope(
          this.boundaries, node.startPosition, v => v.scope === 'open')
        const depth = parentNode?.depth || 0
        openNode.depth = depth + 1
        closeNode.depth = depth + 1
      } else if(name === "local.reference" && !openNode.definition) {
        const varName = node.text
        const varScope = findNodeInCurrentScope(
          this.boundaries, node.startPosition, v => v.definition === varName)
        if(varScope) {
          openNode.openScopeIds = varScope.openScopeIds
          closeNode.closeScopeIds = varScope.closeDefinition.closeScopeIds
        }
      } else if(name === "local.definition") {
        const shouldAddVarToScopes = openNode.openScopeIds.indexOf(VAR_ID) === -1
        if(shouldAddVarToScopes) {
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
    if(existing) {
      return existing
    } else {
      const obj = {openScopeIds: [], closeScopeIds: [], position: key}
      this.boundaries = this.boundaries.insert(key, obj)
      return obj
    }
  }

  buildHighlightIterator() {
    if(!this.parser) return nullIterator;
    let iterator// = boundaries.ge({row: 0, column: 0})
    const updateBoundaries = (start, end) => {
      this._updateBoundaries(start, end)
      return this.boundaries
    }

    return new HighlightIterator(this);

    // return {
    //   getOpenScopeIds () {
    //     return iterator.value.openScopeIds
    //   },
    //
    //   getCloseScopeIds () {
    //     return iterator.value.closeScopeIds
    //   },
    //
    //   getPosition () {
    //     return (iterator.value && iterator.value.position) || Point.INFINITY
    //   },
    //
    //   moveToSuccessor () {
    //     return iterator.next()
    //   },
    //
    //   seek(start, endRow) {
    //     const end = {row: endRow + 1, column: 0}
    //     iterator = updateBoundaries(start, end).ge(start)
    //     return []
    //   }
    // }
  }

  classNameForScopeId(scopeId) {
    const scope = this.scopeIds.get(scopeId)
    if (scope) {
      return `syntax--${scope.replace(/\./g, ' syntax--')}`
    }
  }

  scopeForId (scopeId) {
    return this.scopeIds.get(scopeId)
  }

  findOrCreateScopeId (name) {
    let id = this.scopeNames.get(name)
    if (!id) {
      this.lastId += 2
      id = this.lastId
      const newId = this.lastId;
      this.scopeNames.set(name, newId)
      this.scopeIds.set(newId, name)
    }
    return id
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

    let root = this.tree.rootNode;
    let rangeIncludesPoint = (start, end, point) => {
      return comparePoints(start, point) <= 0 && comparePoints(end, point) >= 0
    };

    let iterate = (node, isAnonymous = false) => {
      let { startPosition: start, endPosition: end } = node;
      if (rangeIncludesPoint(start, end, point)) {
        scopes.push(isAnonymous ? `"${node.type}"` : node.type);
        let namedChildrenIds = node.namedChildren.map(c => c.typeId);
        for (let child of node.children) {
          let isAnonymous = !namedChildrenIds.includes(child.typeId);
          iterate(child, isAnonymous);
        }
      }
    };

    iterate(root);

    scopes.unshift(this.grammar.scopeName);
    return new ScopeDescriptor({ scopes });
  }

  scopeDescriptorForPosition (point) {
    // If the position is the end of a line, get scope of left character instead of newline
    // This is to match TextMate behaviour, see https://github.com/atom/atom/issues/18463
    if (
      point.column > 0 &&
      point.column === this.buffer.lineLengthForRow(point.row)
    ) {
      point = point.copy();
      point.column--;
    }

    if (!this.tree) {
      return new ScopeDescriptor({scopes: ['text']})
    }
    const current = Point.fromObject(point, true)
    let begin = Point.fromObject(point, true)
    begin.column = 0

    // const end = Point.fromObject([begin.row + 1, 0])
    // this._updateBoundaries(begin, end)

    // Start at the beginning.
    const it = this.boundaries.ge(new Point(0, 0))
    if (!it.value) {
      return new ScopeDescriptor({scopes: ['text']})
    }

    let scopeIds = []
    while (comparePoints(it.key, current) <= 0) {
      const closing = new Set(it.value.closeScopeIds)
      scopeIds = scopeIds.filter(s => !closing.has(s))
      scopeIds.push(...it.value.openScopeIds)
      if (!it.hasNext) { break }
      it.next()
    }

    const scopes = scopeIds.map(id => this.scopeForId(id))

    if (scopes.length === 0 || scopes[0] !== this.grammar.scopeName) {
      scopes.unshift(this.grammar.scopeName);
    }
    return new ScopeDescriptor({scopes})
  }

  getFoldableRanges() {
    if(!this.tree) return [];
    const folds = this.foldsQuery.captures(this.tree.rootNode)
    return folds.map(fold => this._makeFoldableRange(fold.node))
  }

  getFoldableRangesAtIndentLevel(level) {
    const tabLength = this.buffer.displayLayers[0]?.tabLength || 2
    const minCol = (level-1) * tabLength
    const maxCol = (level) * tabLength
    if(!this.tree) return [];
    return this.foldsQuery
      .captures(this.tree.rootNode)
      .filter(fold => {
        const {column} = fold.node.startPosition
        return column > minCol && column <= maxCol
      })
      .map(fold => this._makeFoldableRange(fold.node))
  }

  suggestedIndentForBufferRow(row, tabLength, options) {
    // console.log('suggestedLineForBufferRow', row, tabLength);
    if (row === 0) { return 0; }

    const lastLineIndent = this.indentLevelForLine(
      this.buffer.lineForRow(row - 1), tabLength
    )
    let amount = lastLineIndent

    // console.log('going from', row - 1, 'to', row, this.tree.rootNode);
    const indents = this.indentsQuery.captures(
      this.tree.rootNode,
      {row: row - 1, column: 0},
      {row: row, column: 0}
    )
    // console.log('indents:', indents);

    let delta = 0;
    for (let { name, node } of indents) {
      let text = node.text;
      if (!text || !text.length) { continue; }
      if (name === 'indent') { delta++ }
      else if (name === 'indent_end') { delta-- }
      // console.log('delta is now:', delta);
    }

    if (delta > 1) { delta = 1; }
    if (delta < 0) { delta = 0; }

    return lastLineIndent + delta;
  }

  // suggestedIndentForEditedBufferRow(row, tabLength) {
  //   if (row === 0) { return 0; }
  //
  //   const indents = this.indentsQuery.captures(
  //     this.tree.rootNode,
  //     {row: row, column: 0},
  //     {row: row + 1, column: 0}
  //   )
  //
  //   console.log('edited indents:', indents);
  //
  //   let currentLineIndent = this.indentLevelForLine(this.buffer.lineForRow(row), tabLength);
  //   let originalLineIndent = this.suggestedIndentForBufferRow(row, tabLength);
  //   // let startingLineIndent = Math.
  //   console.log('starting at', originalLineIndent);
  //
  //   let delta = 0;
  //   for (let { name, node } of indents) {
  //     if (!node.text?.length) { continue; }
  //
  //     if (name === 'branch') {
  //       delta--
  //     }
  //   }
  //
  //   if (delta === 0) {
  //     return currentLineIndent;
  //   }
  //
  //   if (delta < -1) { delta = -1; }
  //   return Math.max(0, originalLineIndent + delta);
  // }

  suggestedIndentForEditedBufferRow(row, tabLength) {
    const indents = this.indentsQuery.captures(
      this.tree.rootNode,
      {row: row, column: 0},
      {row: row+1, column: 0}
    )
    // console.log('indents:', indents);
    const indent = indents.find(i => {
      return i.node.startPosition.row === row && i.name === 'branch'
    });
    // console.log('specific indent:', indent);
    if(indent?.name === "branch") {
      if(this.buffer.lineForRow(row).trim() === indent.node.text) {
        const parent = indent.node.parent
        if(parent) return this.indentLevelForLine(
          this.buffer.getLines()[parent.startPosition.row],
          tabLength
        )
      }
    }
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

  getFoldableRangeContainingPoint(point, tabLength) {
    const foldsAtRow = this._getFoldsAtRow(point.row)
    const node = foldsAtRow[0]?.node
    if(node) {
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
    if (!this.tree) { return [] }
    const folds = this.foldsQuery.captures(
      this.tree.rootNode,
      { row: row, column: 0 },
      { row: row + 1, column: 0 }
    )
    return folds.filter(fold => fold.node.startPosition.row === row)
  }
}
module.exports = WASMTreeSitterLanguageMode;

const nullIterator = {
  seek: () => [],
  compare: () => 1,
  moveToSuccessor: () => {},
  getPosition: () => Point.INFINITY,
  getOpenScopeIds: () => [],
  getCloseScopeIds: () => []
}

function findNodeInCurrentScope(boundaries, position, filter) {
  let iterator = boundaries.ge(position)
  while(iterator.hasPrev) {
    iterator.prev()
    const value = iterator.value
    if(filter(value)) return value

    if(value.scope === 'close') {
      // If we have a closing scope, there's an "inner scope" that we will
      // ignore, and move the iterator BEFORE the inner scope position
      iterator = boundaries.lt(value.openScopeNode.position)
    } else if(value.scope === 'open') {
      // But, if we find an "open" scope, we check depth. If it's `1`, we
      // got into the last nested scope we were inside, so it's time to quit
      if(value.depth === 1) return
    }
  }
}

function comparePoints(a, b) {
  const rows = a.row - b.row
  if(rows === 0)
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

class HighlightIterator {
  constructor (languageMode) {
    this.languageMode = languageMode
  }

  getBoundaries () {
    let { boundaries } = this.languageMode;
    if (!boundaries) {
      let range = this.languageMode.buffer.getRange();
      this.languageMode._updateBoundaries(
        range.start, range.end);
      return this.languageMode.boundaries;
    }
    return boundaries;
  }

  openScopesAtPosition (position) {
    let boundaries = this.getBoundaries();
    // Start at the beginning.
    const it = boundaries.ge(new Point(0, 0))

    if (!it.value) { return [] }

    let scopeIds = []
    while (comparePoints(it.key, position) <= 0) {
      const closing = it.value.closeScopeIds

      for (let c of closing) {
        scopeIds.splice(
          scopeIds.lastIndexOf(c),
          1
        );
      }

      scopeIds.push(...it.value.openScopeIds)
      if (!it.hasNext) { break }
      it.next()
    }

    return scopeIds;
  }

  seek (start, endRow) {
    let end = { row: endRow, column: 0 };
    this.end = end;

    let boundaries = this.getBoundaries();
    this.iterator = boundaries.ge(start);

    return this.openScopesAtPosition(start);
  }

  getOpenScopeIds () {
    let { value } = this.iterator;
    return value.openScopeIds;
  }

  getCloseScopeIds () {
    let { value } = this.iterator;
    return value.closeScopeIds;
  }

  getPosition () {
    let position = this.iterator.value?.position;
    return position || Point.INFINITY;
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


function combineRanges (ranges) {
  let earliest = null;
  let latest = null;
  ranges.forEach(({ end, start }) => {
    if (!earliest) {
      earliest = start;
    } else if (comparePoints(start, earliest) < 0) {
      earliest = start;
    }

    if (!latest) {
      latest = end;
    } else if (comparePoints(end, latest) > 0) {
      latest = end;
    }
  });

  return new Range(earliest, latest);
}
