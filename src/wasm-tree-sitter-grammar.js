const fs = require('fs');
const path = require('path');
// const Parser = require('web-tree-sitter');
const { CompositeDisposable, Emitter } = require('event-kit');
const { File } = require('pathwatcher');

module.exports = class WASMTreeSitterGrammar {
  constructor(registry, grammarPath, params) {
    this.scopeName = params.scopeName
    this._grammarPath = grammarPath
    this.queryPaths = params.treeSitter
    const dirName = path.dirname(grammarPath)

    this.emitter = new Emitter;
    this.subscriptions = new CompositeDisposable;
    this._queryFileWatchers = [];

    this.loadQueryFiles(grammarPath, this.queryPaths);

    // this.syntaxQuery = fs.readFileSync(qPath, 'utf-8')
    // this._loadQueryIfExists(params,dirName, 'localsQuery')
    // this._loadQueryIfExists(params,dirName, 'foldsQuery')
    // this.indentsQuery = fs.readFileSync(iPath, 'utf-8')
    this.grammarPath = path.join(dirName, params.treeSitter.grammar)
    this.contentRegex = buildRegex(params.contentRegex);
    this.firstLineRegex = buildRegex(params.firstLineRegex);
    this.fileTypes = params.fileTypes || [];
    this.registry = registry
    this.name = params.name
  }

  loadQueryFiles (grammarPath, queryPaths) {
    console.log('loadQueryFiles', grammarPath, queryPaths);

    if (!('syntaxQuery' in queryPaths)) {
      throw new Error(`Syntax query must be present`);
    }
    let dirName = path.dirname(grammarPath)
    for (let [key, name] of Object.entries(queryPaths)) {
      if (!key.endsWith('Query')) { continue; }
      let filePath = path.join(dirName, name);
      this.loadQueryFile(filePath, key);
      if (atom.inDevMode()) {
        this.observeQueryFile(filePath, key);
      }
    }
  }

  loadQueryFile(filePath, queryType) {
    this[queryType] = fs.readFileSync(filePath, 'utf-8');
  }

  observeQueryFile(filePath, queryType) {
    let watcher = new File(filePath);
    this.subscriptions.add(watcher.onDidChange(() => {
      this.loadQueryFile(filePath, queryType);
      this.emitter.emit('did-change-query-file', { filePath, queryType });
    }));
  }

  onDidChangeQueryFile(callback) {
    return this.emitter.on('did-change-query-file', callback);
  }

  _reloadQueryFiles () {
    this.loadQueryFiles(this._grammarPath, this.queryPaths);
  }

  _loadQueryIfExists(params, dirName, queryName) {
    if (params.treeSitter[queryName]) {
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
