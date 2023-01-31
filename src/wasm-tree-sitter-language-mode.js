const Parser = require('web-tree-sitter');
const ScopeDescriptor = require('./scope-descriptor')
const fs = require('fs');
const { Point, Range } = require('text-buffer');

const initPromise = Parser.init()
createTree = require("functional-red-black-tree")

const VAR_ID = 257
class WASMTreeSitterLanguageMode {
  constructor( buffer, config) {
    this.lastId = 259
    // Keeps a map of where each variable scope opens or closes
    // Format: {"startRow,startCol,endRow,endCol": {node: ts-node, depth: int, vars {name: str, scopeIds: [num]}}}
    this.nestedScopes = new Map()
    this.scopeNames = new Map([["variable", VAR_ID]])
    this.scopeIds = new Map([[VAR_ID, "variable"]])
    this.buffer = buffer
    this.config = config
    this.injectionsMarkerLayer = buffer.addMarkerLayer();

    initPromise.then(() =>
      Parser.Language.load('/tmp/grammars/ruby/grammar.wasm')
    ).then(lang => {
      const syntaxQuery = fs.readFileSync('/tmp/grammars/ruby/queries/highlights.scm', 'utf-8')
      const localsQuery = fs.readFileSync('/tmp/grammars/ruby/queries/locals.scm', 'utf-8')
      this.syntaxQuery = lang.query(syntaxQuery)
      this.localsQuery = lang.query(localsQuery)
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

  onDidChangeHighlighting(fn) {
  }

  tokenizedLineForRow(row) {
  }

  getScopeChain(...args) {
    console.log("getScopeChain", args)
  }

  bufferDidChange(change) {
    console.log("B", this)
    global.nt = this.buffer.getText()
    if(!this.tree) return;

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

    const changes = newTree.getChangedRanges(this.tree)
    console.log("WHAT WAS CHANGED", changes)

    this.tree = newTree
  }

  _updateBoundaries(from, to) {
    const syntax = this.syntaxQuery.captures(this.tree.rootNode, from, to)

    let oldDataIterator = this.boundaries.ge(from)
    let oldScopes = []
    while( oldDataIterator.hasNext && comparePoints(oldDataIterator.key, to) <= 0 ) {
      this.boundaries = this.boundaries.remove(oldDataIterator.key)
      oldScopes = oldDataIterator.value.closeScopeIds
      oldDataIterator.next()
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

    console.log("Syntax", syntax)
    if(this.localsQuery) {
      const locals = this.localsQuery.captures(this.tree.rootNode, from, to)
      console.log("Locals", locals)
      this._updateWithLocals(locals)
    }
  }

  _updateWithLocals(locals) {
    locals.forEach(({name, node}) => {
      let openNode = this._getOrInsert(node.startPosition, node)
      if(!openNode.openNode) openNode.openNode = node
      let closeNode = this._getOrInsert(node.endPosition, node)
      if(!closeNode.closeNode) closeNode.closeNode = node

      if(name === "local.scope") {
        const oldScope = this._getParentScope(node)
        const oldDepth = oldScope?.depth || 0
        const key = this._generateScopeKey(node)
        // console.log("Generating scope", key, node)
        /// FIXME - this is WRONG, and we need to invalidate things
        if(!this.nestedScopes.get(key)) {
          this.nestedScopes.set(key, {
            node: node,
            depth: oldDepth+1,
            vars: new Map()
          })
        }
      } else if(name === "local.reference") {
        const varScope = this._getParentScopeContainingVar(node, node.text)
        if(varScope) {
          let oldScopes = this.boundaries.get(node.startPosition)
          oldScopes.openScopeIds = varScope.openNode.openScopeIds
          oldScopes = this.boundaries.get(node.endPosition)
          oldScopes.closeScopeIds = varScope.closeNode.closeScopeIds
        }
      } else if(name === "local.definition") {
        const shouldAddVarToScopes = openNode.openScopeIds.indexOf(VAR_ID) === -1
        if(shouldAddVarToScopes) {
          openNode.openScopeIds = [...openNode.openScopeIds, VAR_ID]
          closeNode.closeScopeIds = [VAR_ID, ...closeNode.closeScopeIds]
        }

        const parentScope = this._getParentScope(node)
        if(parentScope) {
          parentScope.vars.set(node.text, {openNode, closeNode})
          parentScope.vars.set(node.text, {openNode, closeNode})
        }
      }
    })
  }

  _getParentScopeContainingVar(node, varText) {
    const parent = this._getParentScope(node)
    if(!parent) return
    const varScope = parent.vars.get(varText)
    return varScope ? varScope : this._getParentScopeContainingVar(parent.node, varText)
  }

  _getParentScope(node) {
    const parent = node.parent
    if(!parent || parent.type === 'program') return
    const key = this._generateScopeKey(parent)
    // console.log("Getting key", key)
    const scope = this.nestedScopes.get(key)
    return scope ? scope : this._getParentScope(parent)
  }

  _generateScopeKey(node) {
    return `${node.startPosition.row},${node.startPosition.column},` +
      `${node.endPosition.row},${node.endPosition.column}`
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

function comparePoints(a, b) {
  const rows = a.row - b.row
  if(rows === 0)
    return a.column - b.column
  else
    return rows
}
