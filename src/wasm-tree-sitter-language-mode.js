const Parser = require('web-tree-sitter');
const ScopeDescriptor = require('./scope-descriptor')
const fs = require('fs');
const { Point } = require('text-buffer');

const initPromise = Parser.init()

class WASMTreeSitterLanguageMode {
  constructor( buffer, config) {
    console.log("Reset!")
    this.scopeNames = {}
    this.scopeIds = {}
    this.lastId = 255
    this.buffer = buffer
    this.config = config
    this.injectionsMarkerLayer = buffer.addMarkerLayer();

    // console.log("BUFFER!", buffer)
    // console.log("GRAMMAR!", grammar)

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
    // console.log("INJ", args)
  }

  onDidChangeHighlighting(fn) {
  }

  tokenizedLineForRow(row) {
    // console.log(new Error().stack)
    // console.log("TOKEN FOR ROW", args)
    // if(row === 1) {
    //   return {
    //     openScopes: [256],
    //     tags: [],
    //     closeScopes: [],
    //     scopes: [
    //       { value: 'const', scopes: ['source', 'keyword'] },
    //       { value: 'a', scopes: ['source'] },
    //     ]
    //   }
    // }
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
    // // return new HighlightIterator(this)
    //
    //   // const displayLayer = buffer.addDisplayLayer()
    //
    //   const boundaries = [{
    //     position: Point(0, 0),
    //     closeScopeIds: [],
    //     openScopeIds: [1, 259]
    //   }, {
    //     position: Point(0, 2),
    //     closeScopeIds: [259, 1],
    //     openScopeIds: []
    //   }]
    //
    //   const iterator = {
    //     getOpenScopeIds () {
    //       return boundaries[0].openScopeIds
    //     },
    //
    //     getCloseScopeIds () {
    //       return boundaries[0].closeScopeIds
    //     },
    //
    //     getPosition () {
    //       return (boundaries[0] && boundaries[0].position) || Point.INFINITY
    //     },
    //
    //     moveToSuccessor () {
    //       return boundaries.shift()
    //     },
    //
    //     seek () {
    //       return []
    //     }
    //   }
    //   return iterator
    if(!this.parser) return nullIterator;
    const tree = this.parser.parse(this.buffer.getText())
    const matches = this.syntaxQuery.matches(tree.rootNode)
    let boundaries = []
    let oldScopes = []
    matches.forEach(({captures}) => {
      captures.forEach(({name, node}) => {
        if(!this.scopeNames[name]) {
          console.log("Add Scope", name)
          this.lastId++
          const newId = this.lastId;
          this.scopeNames[name] = newId
          this.scopeIds[newId] = name
          console.log("Added Scope", this.scopeIds)
        }
        const id = this.scopeNames[name]
        // console.log("Token", node.startPosition, "kind", name)
        boundaries.push({
          closeScopeIds: oldScopes,
          openScopeIds: [id],
          position: node.startPosition
        })

        // boundaries.push({
        //   closeScopeIds: [id],
        //   openScopeIds: [],
        //   position: node.endPosition
        // })
        oldScopes = [id]
      })
    })

    boundaries.push({
      closeScopeIds: oldScopes,
      openScopeIds: [],
      position: Point.INFINITY
    })

    console.log("B", boundaries)

    return {
      getOpenScopeIds () {
        console.log("Open", boundaries[0].openScopeIds)
        return boundaries[0].openScopeIds
      },

      getCloseScopeIds () {
        console.log("Close", boundaries[0].closeScopeIds)
        return boundaries[0].closeScopeIds
      },

      getPosition () {
        console.log("getPosition")
        return (boundaries[0] && boundaries[0].position) || Point.INFINITY
      },

      moveToSuccessor () {
        console.log("moveToSuccessor")
        return boundaries.shift()
      },

      seek(pos) {
        console.log("POS", pos)
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

// class HighlightIterator {
//   constructor(languageMode) {
//     this.languageMode = languageMode
//   }
//
//   seek(targetPosition, endRow) {
//     console.log("SEEK", targetPosition, endRow)
//     this.seeking = targetPosition.column
//     return [259]
//   }
//
//   // compare(...args) {
//   //   console.log("COMPARE", args)
//   //   return 1;
//   // }
//   moveToSuccessor() {
//     console.log("moveToSuccessor")
//     this.seeking = this.languageMode.buffer.getText().length;
//   }
//
//   getPosition() {
//     console.log("getPosition")
//     const lineSize = this.languageMode.buffer.getText().length;
//     console.log("RES", this.seeking, lineSize)
//     if(this.seeking < lineSize) {
//       console.log("RET", this.seeking)
//       return new Point(0, this.seeking - 1);
//     } else {
//       console.log("RET - INFINITY")
//       return Point.INFINITY;
//     }
//   }
//
//   getOpenScopeIds() {
//     console.log("getOpen")
//     if(this.seeking === 0) {
//       return [259];
//     } else {
//       return [];
//     }
//   }
//
//   getCloseScopeIds() {
//     console.log("getClose")
//     if(this.seeking === 0) {
//       return [259];
//     } else {
//       return [];
//     }
//   }
// }
