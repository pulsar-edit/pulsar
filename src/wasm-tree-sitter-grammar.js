const fs = require('fs');
const path = require('path');
const Parser = require('./web-tree-sitter');
const { CompositeDisposable, Emitter } = require('event-kit');
const { File } = require('pathwatcher');
const { normalizeDelimiters } = require('./comment-utils.js');

const parserInitPromise = Parser.init();

// Extended: This class holds an instance of a Tree-sitter grammar.
module.exports = class WASMTreeSitterGrammar {
  constructor(registry, grammarPath, params) {
    this.registry = registry;
    this.name = params.name;
    this.type = 'modern-tree-sitter';
    this.scopeName = params.scopeName;

    this.contentRegex = buildRegex(params.contentRegex);
    this.firstLineRegex = buildRegex(params.firstLineRegex);
    this.injectionRegex = buildRegex(
      params.injectionRegex || params.injectionRegExp
    );
    this.injectionPointsByType = {};

    this.grammarFilePath = grammarPath;
    this.queryPaths = params.treeSitter;
    this.languageSegment = params.treeSitter?.languageSegment ?? null;
    const dirName = path.dirname(grammarPath);

    this.emitter = new Emitter;
    this.subscriptions = new CompositeDisposable;

    this.queryCache = new Map();
    this.promisesForQueryFiles = new Map();
    this.promisesForQueries = new Map();

    this.treeSitterGrammarPath = path.join(dirName, params.treeSitter.grammar);
    this.fileTypes = params.fileTypes || [];

    this.nextScopeId = 256 + 1;
    this.classNamesById = new Map();
    this.scopeNamesById = new Map();
    this.idsByScope = Object.create(null);

    this.commentStrings = {
      commentStartString: params.comments && params.comments.start,
      commentEndString: params.comments && params.comments.end
    };

    this.commentMetadata = params.comments;

    this.shouldObserveQueryFiles = atom.inDevMode() && !atom.inSpecMode();
    this.getLanguage();

    for (const injectionPoint of params.injectionPoints ?? []) {
      this.addInjectionPoint(injectionPoint);
    }
  }

  // Though _text is unused here, some packages (eg semanticolor) use it to
  // customize scopes on the fly.
  idForScope(scopeName, _text) {
    if (!scopeName) { return undefined; }
    let id = this.idsByScope[scopeName];
    if (!id) {
      id = this.nextScopeId += 2;
      const className = scopeName
        .split('.')
        .map(s => `syntax--${s}`)
        .join(' ');
      this.idsByScope[scopeName] = id;
      this.classNamesById.set(id, className);
      this.scopeNamesById.set(id, scopeName);
    }
    return id;
  }

  // Extended: Retrieve all known comment delimiters for this grammar.
  //
  // Some grammars may have different delimiters for different parts of a file
  // (such as JSX within JavaScript). In these cases, you might want to call
  // {TextEditor::getCommentDelimitersForBufferPosition} with a `{Point}` in the
  // buffer.
  //
  // Returns an {Object} with the following properties:
  //
  // * `line`: If present, a {String} representing a line comment delimiter.
  //   (If `undefined`, there is no known line comment delimiter for the given
  //   buffer position.)
  // * `block`: If present, a two-item {Array} containing {String}s
  //   representing the starting and ending block comment delimiters. (If
  //   `undefined`, there are no known block comment delimiters for the given
  //   buffer position.)
  //
  getCommentDelimiters() {
    // Prefer the config system. It's a better place for this data to live.
    let commentDelimiters = atom.config.get(
      'editor.commentDelimiters',
      { scope: [this.scopeName] }
    );
    if (commentDelimiters) return commentDelimiters;

    // Failing that, try to extract useful information from this metadata.
    if (this.commentMetadata) {
      return normalizeDelimiters(this.commentMetadata);
    }

    // If even that doesn't exist, we can fall back onto the older config
    // settings.
    let start = atom.config.get('editor.commentStart', { scope: [this.scope] });
    let end = atom.config.get('editor.commentEnd', { scope: [this.scope] });

    return normalizeDelimiters({ start, end });
  }

  classNameForScopeId(id) {
    return this.classNamesById.get(id);
  }

  scopeNameForScopeId(id) {
    return this.scopeNamesById.get(id);
  }

  // Returns the Tree-sitter language instance associated with this grammar
  // _if_ it has already loaded. Call this only when you can be certain that
  // it's present.
  getLanguageSync() {
    return this._language;
  }

  // Extended: Returns the Tree-sitter language instance associated with this
  // grammar once it loads.
  //
  // Returns a {Promise} that will resolve with a Tree-sitter `Language`
  // instance. Once it resolves, the grammar is ready to perform parsing and to
  // execute query captures.
  async getLanguage() {
    await parserInitPromise;
    if (!this._language) {
      try {
        this._language = await Parser.Language.load(this.treeSitterGrammarPath);
      } catch (err) {
        console.error(`Error loading grammar for ${this.scopeName}; original error follows`);
        throw err;
      }
    }

    if (!this._queryFilesLoaded) {
      await this.loadQueryFiles(this.grammarFilePath, this.queryPaths);
    }
    return this._language;
  }

  async loadQueryFiles(grammarPath, queryPaths) {
    if (this._loadQueryFilesPromise) {
      return this._loadQueryFilesPromise;
    }

    this._loadQueryFilesPromise = new Promise((resolve) => {
      let promises = [];
      let dirName = path.dirname(grammarPath);

      for (let [key, name] of Object.entries(queryPaths)) {
        if (!key.endsWith('Query')) { continue; }

        // Every `fooQuery` path can contain either a single file name or an
        // array of file names. If the latter, each is concatenated together in
        // order.
        let paths = Array.isArray(name) ? name : [name];
        let filePaths = paths.map(p => path.join(dirName, p));

        promises.push(this.loadQueryFile(filePaths, key));

        if (this.shouldObserveQueryFiles && !this._queryFilesLoaded) {
          this.observeQueryFile(filePaths, key);
        }
      }
      return Promise.all(promises).then(() => resolve());
    }).then(() => {
      this._queryFilesLoaded = true;
      this._loadQueryFilesPromise = null;
    });

    return this._loadQueryFilesPromise;
  }

  loadQueryFile(paths, queryType) {
    let key = `${paths.join(',')}/${queryType}`;

    let existingPromise = this.promisesForQueryFiles.get(key);
    if (existingPromise) { return existingPromise; }

    let readFilePromises = paths.map(path => {
      return fs.promises.readFile(path, 'utf-8').then((contents) => {
        return { contents, path };
      });
    });

    let promise = Promise.all(readFilePromises).then((allResults) => {
      let output = "";
      for (let result of allResults) {
        let { contents, path } = result;
        if (contents === "") {
          // An empty file should still count as “present” when assessing whether
          // a grammar has a particular query. So we'll set the contents to a
          // comment instead.
          contents = '; (empty)';
        }
        if (contents.includes('._LANG_')) {
          // The `_LANG_` token indicates places where the last segment of a
          // scope name will vary based on which grammar includes it. It
          // assumes that the grammar author will define a segment (like
          // `ts.tsx`) under the `treeSitter.languageSegment` setting in the
          // grammar file.
          if (this.languageSegment) {
            contents = contents.replace(/\._LANG_/g, `.${this.languageSegment}`);
          } else {
            console.warn(`Warning: query file at ${path} includes _LANG_ tokens, but grammar does not specify a "treeSitter.languageSegment" setting.`);
          }
        }
        output += `\n${contents}`;
      }
      if (this[queryType] !== output) {
        this[queryType] = output;
        this.queryCache.delete(queryType);
      }
    }).finally(() => {
      this.promisesForQueryFiles.delete(key);
    });

    this.promisesForQueryFiles.set(key, promise);
    return promise;
  }

  getQuerySync(queryType) {
    let language = this.getLanguageSync();
    if (!language) { return null; }
    let query = this.queryCache.get(queryType);
    if (!query) {
      query = language.query(this[queryType]);
      this.queryCache.set(queryType, query);
    }
    return query;
  }

  // Extended: Given a kind of query, retrieves a Tree-sitter `Query` object
  // in async fashion.
  //
  // * `queryType` A {String} describing the query type: typically one of
  //     `highlightsQuery`, `foldsQuery`, `tagsQuery`, or `indentsQuery`,
  //     but could be any other custom type.
  //
  // Returns a {Promise} that resolves to a Tree-sitter `Query` object.
  getQuery(queryType) {
    // Async, but designed so that multiple near-simultaneous calls to
    // `getQuery` from multiple buffers will not cause multiple calls to
    // `language.query`, since it's a major bottleneck. Instead they all
    // receive the same unsettled promise.
    // let inDevMode = atom.inDevMode();
    let query = this.queryCache.get(queryType);
    if (query) { return Promise.resolve(query); }

    let promise = this.promisesForQueries.get(queryType);
    if (promise) { return promise; }

    promise = new Promise((resolve, reject) => {
      this.getLanguage().then((language) => {
        // let timeTag = `${this.scopeName} ${queryType} load time`;
        try {
          // if (inDevMode) { console.time(timeTag); }
          query = language.query(this[queryType]);

          // if (inDevMode) { console.timeEnd(timeTag); }
          this.queryCache.set(queryType, query);
          resolve(query);
        } catch (error) {
          // if (inDevMode) { console.timeEnd(timeTag); }
          reject(error);
        }
      });
    }).finally(() => {
      this.promisesForQueries.delete(queryType);
    });

    this.promisesForQueries.set(queryType, promise);
    return promise;
  }

  // Extended: Creates an arbitrary query from this grammar. Package authors
  // and end users can use queries for whatever purposes they like.
  //
  // * `queryContents` A {String} representing the entire contents of a query
  //     file. Can contain any number of queries.
  //
  // Returns a {Promise} that will resolve to a Tree-sitter `Query` object.
  async createQuery(queryContents) {
    let language = await this.getLanguage();
    return language.query(queryContents);
  }

  // Extended: Creates an arbitrary query from this grammar. Package authors
  // and end users can use queries for whatever purposes they like.
  //
  // Synchronous; use only when you can be certain that the tree-sitter
  // language has already loaded.
  //
  // * `queryContents` A {String} representing the entire contents of a query
  //     file. Can contain any number of queries.
  //
  // Returns a Tree-sitter `Query` object.
  createQuerySync(queryContents) {
    if (!this._language) {
      throw new Error(`Language not loaded!`);
    }
    return this._language.query(queryContents);
  }

  // Used by the specs to override a particular query for testing.
  async setQueryForTest(queryType, contents) {
    await this.getLanguage();
    this.queryCache.delete(queryType);
    this[queryType] = contents;
    let query = await this.getQuery(queryType);
    this.emitter.emit('did-change-query-file', { filePath: '', queryType });
    return query;
  }

  // Observe a particular query file on disk so that it can immediately be
  // re-applied when it changes. Occurs only in dev mode.
  observeQueryFile(filePaths, queryType) {
    for (let filePath of filePaths) {
      let watcher = new File(filePath);
      this.subscriptions.add(watcher.onDidChange(() => {
        let existingQuery = this[queryType];
        // When any one of the file paths changes, we have to re-concatenate
        // the whole set.
        this.loadQueryFile(filePaths, queryType).then(async () => {
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
  }

  // Extended: Calls `callback` when any of this grammar's query files change.
  //
  // The callback is invoked with an object argument with two keys:
  //
  // * `callback`: The callback to be invoked. Takes one argument:
  //   * `data`: An object with keys:
  //     * `filePath`: The path to the query file on disk.
  //     * `queryType`: The type of query file, as denoted by its
  //         configuration key in the grammar file. Usually one of
  //         `highlightsQuery`, `indentsQuery`, `foldsQuery`, or `tagsQuery`.
  onDidChangeQueryFile(callback) {
    return this.emitter.on('did-change-query-file', callback);
  }

  // TODO: Why is this here?
  activate() {
    this.registration = this.registry.addGrammar(this);
  }

  // TODO: Why is this here?
  deactivate() {
    this.registration?.dispose();
    this.subscriptions?.dispose();
    this.queryCache.clear();
  }

  // Extended: Define a set of rules for when this grammar should delegate to a
  // different grammar for certain regions of a buffer. Examples:
  //
  // * embedding one language inside another (e.g., JavaScript in HTML)
  // * tokenizing certain structures with greater detail (e.g., regular
  //   expressions in most languages)
  // * highlighting non-standard augmentations to a language (e.g., JSDoc
  //   comments in JavaScript)
  //
  // This differs from TextMate-style injections, which operate at the scope
  // level and are currently incompatible with Tree-sitter grammars.
  //
  // NOTE: Packages will call {::addInjectionPoint} with a given scope name,
  // and that call will be delegated to any Tree-sitter grammars that match
  // that scope name, whether they're legacy Tree-sitter or modern Tree-sitter.
  // But modern Tree-sitter grammars cannot be injected into legacy Tree-sitter
  // grammars, and vice versa.
  //
  // * `options` The options for the injection point:
  //   * `type` A {String} describing type of node to inject into.
  //   * `language` A {Function} that should return a string describing the
  //     language that should inject into this area. The string should be a
  //     short, unambiguous description of the language; it will be tested
  //     against other grammars’ `injectionRegex` properties. Receives one
  //     parameter:
  //     * `node` A Tree-sitter node.
  //   * `content` A {Function} that should return the node (or nodes) that
  //     will actually be injected into. Usually this will be the same node
  //     that was given, but could also be a specific child or descendant of
  //     that node.
  //   * `includeChildren` (optional) {Boolean} controlling whether the
  //     injection range should include the ranges of the content node’s
  //     children. Defaults to `false`, meaning that the range of each of this
  //     node's children will be "subtracted" from the injection range, and the
  //     remainder will be parsed as if those ranges of the buffer do not
  //     exist.
  //   * `includeAdjacentWhitespace` (optional) {Boolean} controlling whether
  //     the injection range should include whitespace that occurs between
  //     content nodes. Defaults to `false`. When `true`, if two injection
  //     ranges are separated from one another by only whitespace, that
  //     whitespace will be added to the injection range, and the ranges will
  //     be consolidated.
  //   * `newlinesBetween` (optional) {Boolean} controlling whether the
  //     injection range should include any newline characters that may exist
  //     in between injection ranges. Defaults to `false`. Grammars like ERB
  //     and EJS need this so that they do not interpret two different
  //     embedded code sections on different lines as occurring on the same
  //     line.
  //   * `coverShallowerScopes` (optional) {Boolean} controlling whether the
  //     injection should prevent the parent grammar (and any of its
  //     ancestors) from applying scope boundaries within its injection
  //     range(s). Defalts to `false`.
  //   * `languageScope` (optional) A value that determines what scope, if
  //     any, is added to the injection as its “base” scope name. Can be a
  //     {String}, {null}, or a {Function} that returns either of these values.
  //     The base language scope that should be used by this injection.
  //     Defaults to the grammar's own `scopeName` property. Set this to a
  //     string to override the default scope name, or `null` to omit a base
  //     scope name altogether. Set this to a function if the scope name to be
  //     applied varies based on the grammar; the function will be called with
  //     a grammar instance as its only argument.
  //
  //
  addInjectionPoint(injectionPoint) {
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
    return `WASMTreeSitterGrammar {scopeName: ${this.scopeName}}`;
  }

  /*
  Section - Backward compatibility shims
  */
  /* eslint-disable no-unused-vars */
  onDidUpdate(callback) {
    // do nothing
  }

  tokenizeLines(text, compatibilityMode = true) {
    return text.split('\n').map(line => this.tokenizeLine(line, null, false));
  }

  tokenizeLine(line, ruleStack, firstLine) {
    return {
      value: line,
      scopes: [this.scopeName]
    };
  }
  /* eslint-enable no-unused-vars */
}

function buildRegex(value) {
  // Allow multiple alternatives to be specified via an array, for
  // readability of the grammar file
  if (Array.isArray(value)) value = value.map(_ => `(${_})`).join('|');
  if (typeof value === 'string') return new RegExp(value);
  return null;
}
