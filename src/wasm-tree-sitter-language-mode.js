const Parser = require('web-tree-sitter');
const ScopeDescriptor = require('./scope-descriptor')
const fs = require('fs');
const { Point } = require('text-buffer');

const initPromise = Parser.init()
createTree = require("functional-red-black-tree")

class WASMTreeSitterLanguageMode {
  constructor( buffer, config) {
    this.scopeNames = new Map()
    this.scopeIds = new Map()
    this.lastId = 257
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
      this.tree = this.parser.parse(buffer.getText())
      this.boundaries = createTree(comparePoints)
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
    global.nt = this.buffer.getText()
    if(!this.tree) return;

    const startIndex = this.buffer.characterIndexForPosition(change.newRange.start)
    // console.log("EDITING", {
    //   startPosition: change.newRange.start,
    //   oldEndPosition: change.oldRange.end,
    //   newEndPosition: change.newRange.end,
    //   startIndex: startIndex,
    //   oldEndIndex: startIndex + change.oldText.length,
    //   newEndIndex: this.buffer.characterIndexForPosition(change.newRange.end)
    // }, change)
    this.tree.edit({
      startPosition: change.newRange.start,
      oldEndPosition: change.oldRange.end,
      newEndPosition: change.newRange.end,
      startIndex: startIndex,
      oldEndIndex: startIndex + change.oldText.length,
      newEndIndex: this.buffer.characterIndexForPosition(change.newRange.end)
    })
    const newTree = this.parser.parse(this.buffer.getText(), this.tree)
    // console.log("CHANGES", this.tree.getChangedRanges(newTree))

    this.tree = newTree
  }

  _updateBoundaries(from, to) {
    const syntax = this.syntaxQuery.matches(this.tree.rootNode, from, to)
    const locals = this.localsQuery.matches(this.tree.rootNode, from, to)
    const matches = syntax //.concat(locals)

    let oldDataIterator = this.boundaries.ge(from)
    let oldScopes = []
    while( oldDataIterator.hasNext && comparePoints(oldDataIterator.key, to) <= 0 ) {
      this.boundaries = this.boundaries.remove(oldDataIterator.key)
      oldDataIterator.next()
    }

    matches.forEach(({captures}) => {
      captures.forEach(capture => {
        const node = capture.node
        const names = capture.name.split('.')
        names.forEach(name => {
          if(!this.scopeNames.get(name)) {
            this.lastId += 2
            const newId = this.lastId;
            // console.log("New ID", newId)
            this.scopeNames.set(name, newId)
            this.scopeIds.set(newId, name)
          }
        })

        const ids = names.map(name => this.scopeNames.get(name))
        // console.log("ADDING", node.startPosition, names, ids)

        let old = this.boundaries.get(node.startPosition)
        // console.log("Old Bound", old)
        if(old) {
          // console.log("Pushing new", ids, names, old)
          old.openScopeIds.push(...ids)
        } else {
          this.boundaries = this.boundaries.insert(node.startPosition, {
            closeScopeIds: oldScopes,
            openScopeIds: [...ids],
            openScopeNames: names,
            position: node.startPosition
          })
          oldScopes = ids
        }

        old = this.boundaries.get(node.endPosition)
        if(old) {
          old.closeScopeIds.push(...ids)
        } else {
          this.boundaries = this.boundaries.insert(node.endPosition, {
            closeScopeIds: [...ids],
            openScopeIds: [],
            closeScopeNames: names,
            position: node.endPosition
          })
        }
      })
    })

    this.boundaries = this.boundaries.insert(Point.INFINITY, {
      closeScopeIds: oldScopes,
      openScopeIds: [],
      position: Point.INFINITY
    })
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
