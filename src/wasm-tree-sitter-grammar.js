const fs = require('fs');
const path = require('path');
const Parser = require('web-tree-sitter');

module.exports = class WASMTreeSitterGrammar {
  constructor(registry, grammarPath, params) {
    this.scopeName = params.scopeName
    const dirName = path.dirname(grammarPath)
    const qPath = path.join(dirName, params.treeSitter.syntaxQuery)
    this.syntaxQuery = fs.readFileSync(qPath, 'utf-8')
    this._loadQueryIfExists(params,dirName, 'localsQuery')
    this._loadQueryIfExists(params,dirName, 'foldsQuery')
    this.indentsQuery = fs.readFileSync(iPath, 'utf-8')
    this.grammarPath = path.join(dirName, params.treeSitter.grammar)
    this.contentRegex = buildRegex(params.contentRegex);
    this.firstLineRegex = buildRegex(params.firstLineRegex);
    this.fileTypes = params.fileTypes || [];
    this.registry = registry
    this.name = params.name
  }

  _loadQueryIfExists(params, dirName, queryName) {
    if(params.treeSitter[queryName]) {
      const p = path.join(dirName, params.treeSitter[queryName])
      this[queryName] = fs.readFileSync(p, 'utf-8')
    }
  }

  // TODO: Why is this here?
  activate() {
    this.registration = this.registry.addGrammar(this);
  }

  // TODO: Why is this here?
  deactivate() {
    this.registration?.dispose();
  }

  inspect() {
    return `TreeSitterGrammar {scopeName: ${this.scopeName}}`;
  }
}

function buildRegex(value) {
  // Allow multiple alternatives to be specified via an array, for
  // readability of the grammar file
  if (Array.isArray(value)) value = value.map(_ => `(${_})`).join('|');
  if (typeof value === 'string') return new RegExp(value);
  return null;
}
