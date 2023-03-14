const fs = require('fs');
const path = require('path');
const Parser = require('web-tree-sitter');
const { CompositeDisposable, Emitter } = require('event-kit');
const { File } = require('pathwatcher');

const parserInitPromise = Parser.init();

module.exports = class WASMTreeSitterGrammar {
  constructor(registry, grammarPath, params) {
    this.scopeName = params.scopeName
    this.grammarFilePath = grammarPath
    this.queryPaths = params.treeSitter
    const dirName = path.dirname(grammarPath);

    this.injectionRegex = buildRegex(
      params.injectionRegex || params.injectionRegExp
    );
    this.injectionPointsByType = {};

    this.emitter = new Emitter;
    this.subscriptions = new CompositeDisposable;
    this._queryFileWatchers = [];

    this.queryCache = new Map();
    this.promisesForQueryFiles = new Map();
    this.promisesForQueries = new Map();

    this.treeSitterGrammarPath = path.join(dirName, params.treeSitter.grammar)
    this.contentRegex = buildRegex(params.contentRegex);
    this.firstLineRegex = buildRegex(params.firstLineRegex);
    this.fileTypes = params.fileTypes || [];
    this.registry = registry
    this.name = params.name;
    this.getLanguage();
  }

  getLanguageSync () {
    return this._language;
  }

  async getLanguage () {
    await parserInitPromise;
    if (!this._language) {
      this._language = await Parser.Language.load(this.treeSitterGrammarPath);
    }

    if (!this._queryFilesLoaded) {
      await this.loadQueryFiles(this.grammarFilePath, this.queryPaths);
    }
    return this._language;
  }

  async loadQueryFiles (grammarPath, queryPaths) {
    if (!('syntaxQuery' in queryPaths)) {
      throw new Error(`Syntax query must be present`);
    }

    if (this._loadQueryFilesPromise) {
      return this._loadQueryFilesPromise;
    }

    this._loadQueryFilesPromise = new Promise((resolve) => {
      let promises = [];
      let dirName = path.dirname(grammarPath);

      for (let [key, name] of Object.entries(queryPaths)) {
        if (!key.endsWith('Query')) { continue; }

        let filePath = path.join(dirName, name);
        promises.push(this.loadQueryFile(filePath, key));

        if (atom.inDevMode() && !this._queryFilesLoaded) {
          this.observeQueryFile(filePath, key);
        }
      }
      Promise.all(promises).then(() => resolve());
    }).then(() => {
      this._queryFilesLoaded = true;
      this._loadQueryFilesPromise = null;
    });

    return this._loadQueryFilesPromise;
  }

  loadQueryFile(filePath, queryType) {
    let key = `${filePath}/${queryType}`;

    let existingPromise = this.promisesForQueryFiles.get(key);
    if (existingPromise) { return existingPromise; }

    let promise = fs.promises.readFile(filePath, 'utf-8');
    promise = promise.then((contents) => {
      if (this[queryType] !== contents) {
        this[queryType] = contents;
        this.queryCache.delete(queryType);
      }
      this.promisesForQueryFiles.delete(key);
    });

    this.promisesForQueryFiles.set(key, promise);
    return promise;
  }

  getQuerySync (queryType) {
    let language = this.getLanguageSync();
    if (!language) { return null; }
    let query = this.queryCache.get(queryType);
    if (!query) {
      query = language.query(this[queryType]);
      this.queryCache.set(queryType, query);
    }
    return query;
  }

  // Async, but designed so that multiple near-simultaneous calls to `getQuery`
  // from multiple buffers will not cause multiple calls to `language.query`,
  // since it's a major bottleneck. Instead they all receive the same unsettled
  // promise.
  getQuery (queryType) {
    let inDevMode = atom.inDevMode();
    let query = this.queryCache.get(queryType);
    if (query) { return Promise.resolve(query); }

    let promise = this.promisesForQueries.get(queryType);
    if (promise) { return promise; }
    promise = new Promise((resolve, reject) => {
      this.getLanguage().then((language) => {
        let timeTag = `${this.scopeName} ${queryType} load time`;
        try {
          if (inDevMode) { console.time(timeTag); }

          query = language.query(this[queryType]);

          if (inDevMode) { console.timeEnd(timeTag); }
          this.queryCache.set(queryType, query);
          resolve(query);
        } catch (error) {
          if (inDevMode) { console.timeEnd(timeTag); }
          reject(error);
        }
      });
    }).then((query) => {
      this.promisesForQueries.delete(queryType);
      return query;
    });
    this.promisesForQueries.set(queryType, promise);
    return promise;
  }

  observeQueryFile(filePath, queryType) {
    let watcher = new File(filePath);
    this.subscriptions.add(watcher.onDidChange(() => {
      let existingQuery = this[queryType];
      this.loadQueryFile(filePath, queryType).then(async () => {
        // Sanity-check the language for errors before we let the buffers know
        // about this change.
        try {
          await this.getQuery(queryType);
        } catch (error) {
          atom.beep();
          console.error(`Error parsing query file: ${queryType}`);
          console.error(error);
          this[queryType] = existingQuery;
          this.queryCache.delete(queryType);
          return;
        }
        this.emitter.emit('did-change-query-file', { filePath, queryType });
      });
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
    this.subscriptions.dispose();
    this.queryCache.clear();
  }

  // Define a set of rules for when this grammar should delegate to a different
  // grammar for certain regions of a buffer. Examples:
  //
  // * embedding one language inside another (e.g., JavaScript in HTML)
  // * tokenizing certain structures with greater detail (e.g., regular
  //   expressions in most languages)
  // * highlighting non-standard augmentations to a language (e.g., JSDoc
  //   comments in JavaScript)
  //
  // This differs from TextMate-style injections, which operate at the scope
  // level and are currently incompatible with tree-sitter grammars.
  //
  // Expects an object with these keys:
  //
  // * `type` (string): The type of node to inject into.
  // * `language` (function): Should return a string describing the language
  //   that should inject into this area. Grammars that can inject into others
  //   will define an `injectionRegex` property that will be tested against
  //   this value; the longest match will win.
  //   The function receives the node itself as an argument, so you can decide
  //   the language based on the content of the node, or return `undefined` if
  //   an injection should not take place.
  // * `content` (function): Receives the matching node and should return the
  //   node that will actually be injected into. Usually this will be the same
  //   node that was given, but could also be a specific child or descendant of
  //   that node, or potentially any other node in the tree.
  //
  // NOTE: Packages will call `atom.grammars.addInjectionPoint` with a given
  // scope name, and that call will be delegated to any tree-sitter grammars
  // that match that scope name, whether they're legacy-tree-sitter or
  // modern-tree-sitter. But modern-tree-sitter grammars cannot be injected
  // into by legacy-tree-sitter-grammars, and vice versa.
  //
  addInjectionPoint (injectionPoint) {
    let { type } = injectionPoint;
    let injectionPoints = this.injectionPointsByType[type];
    if (!injectionPoints) {
      injectionPoints = this.injectionPointsByType[type] = [];
    }
    injectionPoints.push(injectionPoint);
  }

  removeInjectionPoint(injectionPoint) {
    const injectionPoints = this.injectionPointsByType[injectionPoint.type];
    if (injectionPoints) {
      const index = injectionPoints.indexOf(injectionPoint);
      if (index !== -1) injectionPoints.splice(index, 1);
      if (injectionPoints.length === 0) {
        delete this.injectionPointsByType[injectionPoint.type];
      }
    }
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
