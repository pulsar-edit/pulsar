const Parser = require('web-tree-sitter');
const ScopeDescriptor = require('./scope-descriptor')
const fs = require('fs');
const { Point } = require('text-buffer');

const initPromise = Parser.init()

class WASMTreeSitterLanguageMode {
  constructor( buffer, config) {
    this.scopeNames = {}
    this.scopeIds = {}
    this.lastId = 257
    this.buffer = buffer
    this.config = config
    this.injectionsMarkerLayer = buffer.addMarkerLayer();

    initPromise.then(() =>
      Parser.Language.load('/tmp/grammars/javascript/grammar.wasm')
    ).then(lang => {
      const syntaxQuery = fs.readFileSync('/tmp/grammars/javascript/queries/highlights.scm', 'utf-8')
      this.syntaxQuery = lang.query(syntaxQuery)
      this.parser = new Parser()
      this.parser.setLanguage(lang)
      global.mode = this
    })

    this.rootScopeDescriptor = new ScopeDescriptor({
      scopes: ['javascript']
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

  bufferDidChange(...args) {
    // console.log("bufferDidChange", args)
  }

  bufferDidFinishTransaction(...args) {
    // console.log("bufferDidFinishTransaction", args)
  }

  buildHighlightIterator() {
    if(!this.parser) return nullIterator;
    const tree = this.parser.parse(this.buffer.getText())
    const matches = this.syntaxQuery.matches(tree.rootNode)
    let boundaries = []
    let oldScopes = []
    matches.forEach(({captures}) => {
      captures.forEach(({name, node}) => {
        if(!this.scopeNames[name]) {
          this.lastId += 2
          const newId = this.lastId;
          this.scopeNames[name] = newId
          this.scopeIds[newId] = name
        }
        const id = this.scopeNames[name]
        // console.log("Token", node.startPosition, "kind", name)
        boundaries.push({
          closeScopeIds: oldScopes,
          openScopeIds: [id],
          position: node.startPosition
        })

        boundaries.push({
          closeScopeIds: [id],
          openScopeIds: [],
          position: node.endPosition
        })
        oldScopes = [id]
      })
    })

    boundaries.push({
      closeScopeIds: oldScopes,
      openScopeIds: [],
      position: Point.INFINITY
    })

    // console.log("B", boundaries)

    return {
      getOpenScopeIds () {
        return boundaries[0].openScopeIds
      },

      getCloseScopeIds () {
        return boundaries[0].closeScopeIds
      },

      getPosition () {
        return (boundaries[0] && boundaries[0].position) || Point.INFINITY
      },

      moveToSuccessor () {
        return boundaries.shift()
      },

      seek(pos) {
        while(boundaries.length > 0) {
          const f = boundaries[0].position
          if(f.row > pos.row) break
          if(f.row == pos.row && f.column >= pos.column) break
          boundaries.shift()
        }
        return []
      }
    }
  }

  classNameForScopeId(scopeId) {
    console.log('classNameForScopeId', scopeId, this.scopeIds)
    const scope = this.scopeIds[scopeId]
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
