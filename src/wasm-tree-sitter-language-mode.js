const Parser = require('web-tree-sitter');
const ScopeDescriptor = require('./scope-descriptor')
const fs = require('fs');
const { Point, Range } = require('text-buffer');
const { Emitter } = require('event-kit');

const initPromise = Parser.init()
createTree = require("./rb-tree")

const VAR_ID = 257
class WASMTreeSitterLanguageMode {
  constructor( buffer, config) {
    this.emitter = new Emitter();
    this.lastId = 259
    this.scopeNames = new Map([["variable", VAR_ID]])
    this.scopeIds = new Map([[VAR_ID, "variable"]])
    this.buffer = buffer
    this.config = config
    this.injectionsMarkerLayer = buffer.addMarkerLayer();

    initPromise.then(() =>
      Parser.Language.load('/tmp/grammars/ruby/grammar.wasm')
    ).then(lang => {
      const syntaxQuery = fs.readFileSync('/tmp/grammars/ruby/queries/highlights.scm', 'utf-8')
      if(fs.existsSync('/tmp/grammars/ruby/queries/locals.scm')) {
        const localsQuery = fs.readFileSync('/tmp/grammars/ruby/queries/locals.scm', 'utf-8')
        this.localsQuery = lang.query(localsQuery)
      }
      this.syntaxQuery = lang.query(syntaxQuery)
      this.parser = new Parser()
      this.parser.setLanguage(lang)

      // Force first highlight
      this.tree = this.parser.parse("")
      this.boundaries = createTree(comparePoints)
      const startRange = new Range([0, 0], [0, 0])
      const range = buffer.getRange()
      buffer.emitDidChangeEvent({oldRange: startRange, newRange: range, oldText: ""})
      global.mode = this
    })

    this.rootScopeDescriptor = new ScopeDescriptor({
      scopes: ['ruby']
    });
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
    if(!this.tree) return;
    // This is here to avoid infinite loops
    // because Pulsar invalidates more ranges than we ask :(
    this.needsInvalidation = true

    const startIndex = this.buffer.characterIndexForPosition(change.newRange.start)
    this.tree.edit({
      startPosition: change.newRange.start,
      oldEndPosition: change.oldRange.end,
      newEndPosition: change.newRange.end,
      startIndex: startIndex,
      oldEndIndex: startIndex + change.oldText.length,
      newEndIndex: this.buffer.characterIndexForPosition(change.newRange.end)
    })
    const newTree = this.parser.parse(this.buffer.getText(), this.tree)
    // const changes = newTree.getChangedRanges(this.tree)
    this.tree = newTree
  }

  _updateBoundaries(from, to) {
    const syntax = this.syntaxQuery.captures(this.tree.rootNode, from, to)

    let oldDataIterator = this.boundaries.ge(from)
    let oldScopes = []

    let scopesInvalidated = createTree(comparePoints)
    let oldBoundaries = this.boundaries
    let invalidatedNames = new Set()
    while( oldDataIterator.hasNext && comparePoints(oldDataIterator.key, to) <= 0 ) {
      const oldValue = oldDataIterator.value
      if(oldValue.definition) {
        scopesInvalidated = scopesInvalidated.insert(oldDataIterator.key, oldDataIterator.value)
        // New scope name
        invalidatedNames.add(this.buffer.getTextInRange([
          oldDataIterator.value.openNode.startPosition,
          oldDataIterator.value.openNode.endPosition
        ]))
        // Old scope name
        invalidatedNames.add(oldDataIterator.value.openNode.text)
      }
      this.boundaries = this.boundaries.remove(oldDataIterator.key)
      oldScopes = oldDataIterator.value.closeScopeIds
      oldDataIterator.next()
    }

    if(this.needsInvalidation) {
      this.needsInvalidation = false
      let parentScopes = createTree(comparePoints)
      scopesInvalidated.forEach(key => {
        const parent = findNodeInCurrentScope(
          oldBoundaries, key, v => v.scope === 'open')
        if(parent) parentScopes = parentScopes.insert(parent.position, parent)
      })

      parentScopes.forEach((_, val) => {
        const from = val.position, to = val.closeScopeNode.position
        const range = new Range(from, to)
        this._invalidateReferences(oldBoundaries, range, invalidatedNames)
      })
    }

    oldScopes = oldScopes || []

    syntax.forEach(capture => {
      const node = capture.node
      const names = capture.name.split('.')

      names.forEach(name => {
        if(!this.scopeNames.get(name)) {
          this.lastId += 2
          const newId = this.lastId;
          this.scopeNames.set(name, newId)
          this.scopeIds.set(newId, name)
        }
      })

      const ids = names.map(name => this.scopeNames.get(name))
      let old = this.boundaries.get(node.startPosition)
      if(old) {
        old.openNode = node
        if(old.openScopeIds.length === 0) {
          old.openScopeIds = [...ids]
        }
      } else {
        this.boundaries = this.boundaries.insert(node.startPosition, {
          closeScopeIds: [...oldScopes],
          openScopeIds: [...ids],
          openNode: node,
          position: node.startPosition
        })
        oldScopes = ids
      }

      old = this.boundaries.get(node.endPosition)
      if(old) {
        old.closeNode = node
        if(old.closeScopeIds.length === 0) old.closeScopeIds = ids.reverse()
      } else {
        this.boundaries = this.boundaries.insert(node.endPosition, {
          closeScopeIds: ids.reverse(),
          openScopeIds: [],
          closeNode: node,
          position: node.endPosition
        })
      }
    })

    this.boundaries = this.boundaries.insert(Point.INFINITY, {
      closeScopeIds: [...oldScopes],
      openScopeIds: [],
      position: Point.INFINITY
    })

    if(this.localsQuery) {
      const locals = this.localsQuery.captures(this.tree.rootNode, from, to)
      this._updateWithLocals(locals)
    }
  }

  _invalidateReferences(oldBoundaries, range, invalidatedNames) {
    const {start, end} = range
    let it = oldBoundaries.ge(start)
    while(it.hasNext) {
      const node = it.value.openNode
      if(node && !it.value.definition) {
        const txt = node.text
        if(invalidatedNames.has(txt)) {
          console.log("Invalidating", node.startPosition, node.text)
          const range = new Range(node.startPosition, node.endPosition)
          this.emitter.emit('did-change-highlighting', range)
        }
      }
      it.next()
      if(comparePoints(it.key, end) >= 0) return
    }
  }

  _updateWithLocals(locals) {
    locals.forEach(({name, node}) => {
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
    })
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

  bufferDidFinishTransaction(...args) {
    // console.log("bufferDidFinishTransaction", args)
  }

  buildHighlightIterator() {
    if(!this.parser) return nullIterator;
    let iterator// = boundaries.ge({row: 0, column: 0})
    const updateBoundaries = (start, end) => {
      this._updateBoundaries(start, end)
      return this.boundaries
    }

    return {
      getOpenScopeIds () {
        return [...new Set(iterator.value.openScopeIds)]
      },

      getCloseScopeIds () {
        return [...new Set(iterator.value.closeScopeIds)]
      },

      getPosition () {
        return (iterator.value && iterator.value.position) || Point.INFINITY
      },

      moveToSuccessor () {
        return iterator.next()
      },

      seek(start, endRow) {
        // debugger
        const end = {row: endRow + 1, column: 0}
        iterator = updateBoundaries(start, end).ge(start)
        return []
      }
    }
  }

  classNameForScopeId(scopeId) {
    // console.log('classNameForScopeId', scopeId, this.scopeIds)
    const scope = this.scopeIds.get(scopeId)
    if(scope) return `syntax--${scope}`
    // // console.log("classNameForScopeId", scopeId)
    // if(scopeId === 259) {
    //   return "syntax--keyword"
    // }
  }

  scopeForId(scopeId) {
    return this.scopeIds[scopeId]
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

// createTree = require("functional-red-black-tree")
// tree = createTree((a, b) => (a.row - b.row) + (a.column - b.column) / 10)
//
// nt = tree.
//   insert({row: 1, column: 1}, '1,1').
//   insert({row: 0, column: 1}, '0,1').
//   insert({row: 1, column: 0}, '1,0').
//   insert({row: 0, column: 0}, '0,0').
//   insert({row: 0, column: 2}, '0,2')
//
// nt.get = function(key) {
//   var cmp = this._compare
//   var n = this.root
//   while(n) {
//     var d = cmp(key, n.key)
//     console.log("RETURN OF", d, "Inside", n)
//     if(d === 0) {
//       return n.value
//     }
//     if(d <= 0) {
//       n = n.left
//     } else {
//       n = n.right
//     }
//   }
//   return
// }
//
// nt.get({row: 0, column: 1})
// it = nt.ge({row: 0, column: 1})
//
// compare({row: 0, column: 1}, {row: 0, column: 1}) === 0

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
