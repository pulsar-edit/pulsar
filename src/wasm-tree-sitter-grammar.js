const fs = require('fs');
const path = require('path');
const Parser = require('./web-tree-sitter');
const { CompositeDisposable, Emitter } = require('event-kit');
const { File } = require('pathwatcher');

const parserInitPromise = Parser.init();

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

  idForScope(scopeName) {
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

  // Retrieve the comment delimiters for this grammar.
  //
  // Traditionally, grammars specified only the delimiters needed for the
  // “Toggle Line Comments” command — either a line comment (if it existed) or
  // a block comment. But other features might want to know _all_ of a
  // language's possible comment delimiters, so we've devised new config values.
  getCommentDelimiters() {
    let meta = this.commentMetadata;
    if (!meta) { return null; }

    let result = {};

    // The new convention is to specify a `line` property and start/end
    // properties.
    let { line, block } = this.commentMetadata;

    // Failing that, we can deliver at least a partial result by inspecting the
    // older convention. If `start` exists but not `end`, we know `start` must
    // be a line comment delimiter.
    if (!line && meta.start && !meta.end) {
      line = meta.start;
    }
    // Likewise, if both `start` and `end` exist, we know they must be block
    // comment delimiters.
    if (!block && meta.start && meta.end) {
      block = { start: meta.start, end: meta.end };
    }

    // Strip all whitespace from delimiters. Whatever is consuming them can
    // decide if it wants whitespace.
    if (line) {
      line = line.strip();
      result.line = line;
    }

    if (block) {
      block.start = block.start?.strip();
      block.end = block.end?.strip();
      result.block = block;
    }

    return result;
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

  // Returns the Tree-sitter language instance associated with this grammar
  // once it loads. When the {Promise} returned by this method resolves, the
  // grammar is ready to perform parsing and to execute query captures.
  async getLanguage() {
    await parserInitPromise;
    if (!this._language) {
      this._language = await Parser.Language.load(this.treeSitterGrammarPath);
    }

    if (!this._queryFilesLoaded) {
      await this.loadQueryFiles(this.grammarFilePath, this.queryPaths);
    }
    return this._language;
  }

  async loadQueryFiles(grammarPath, queryPaths) {
    if (!('highlightsQuery' in queryPaths)) {
      throw new Error(`Highlights query must be present`);
    }

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

  // Async, but designed so that multiple near-simultaneous calls to `getQuery`
  // from multiple buffers will not cause multiple calls to `language.query`,
  // since it's a major bottleneck. Instead they all receive the same unsettled
  // promise.
  getQuery(queryType) {
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

  // Creates an arbitrary query from this grammar. Package authors and end
  // users can use queries for whatever purposes they like.
  async createQuery(queryContents) {
    let language = await this.getLanguage();
    return language.query(queryContents);
  }

  // Creates an arbitrary query from this grammar. Package authors and end
  // users can use queries for whatever purposes they like.
  //
  // Synchronous; use only when you can be certain that the tree-sitter
  // language has already loaded.
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

  // Calls `callback` when any of this grammar's query files change.
  //
  // The callback is invoked with an object argument with two keys:
  //
  // - `filePath`: The path to the query file on disk.
  // - `queryType`: The type of query file, as denoted by its configuration key
  //     in the grammar file. One of `highlightsQuery`, `indentsQuery`,
  //     `foldsQuery`, or `localsQuery`.
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
  // Understands the following optional keys:
  //
  // * `includeChildren` (boolean): Whether the injection range should include
  //   the ranges of this node's children. Defaults to `false`, meaning that
  //   the range of each of this node's children will be "subtracted" from the
  //   injection range, and the remainder will be parsed as if those ranges of
  //   the buffer do not exist.
  // * `includeAdjacentWhitespace` (boolean): Whether the injection range
  //   should include whitespace that occurs between content nodes. Defaults to
  //   `false`. When `true`, if two injection ranges are separated from one
  //   another by only whitespace, that whitespace will be added to the
  //   injection range, and the ranges will be consolidated.
  // * `newlinesBetween` (boolean): Whether the injection range should include
  //   any newline characters that may exist in between injection ranges.
  //   Defaults to `false`. Grammars like ERB and EJS need this so that they do
  //   not interpret two different embedded code sections on different lines as
  //   occurring on the same line.
  // * `coverShallowerScopes` (boolean): Whether the injection should prevent
  //   the parent grammar (and any of its ancestors) from applying scope
  //   boundaries within its injection range(s). Defalts to `false`.
  // * `languageScope` (string | function | null): The base language scope that
  //   should be used by this injection. Defaults to the grammar's own
  //   `scopeName` property. Set this to a string to override the default scope
  //   name, or `null` to omit a base scope name altogether. Set this to a
  //   function if the scope name to be applied varies based on the grammar;
  //   the function will be called with a grammar instance as its only
  //   argument.
  //
  // NOTE: Packages will call `atom.grammars.addInjectionPoint` with a given
  // scope name, and that call will be delegated to any tree-sitter grammars
  // that match that scope name, whether they're legacy-tree-sitter or
  // modern-tree-sitter. But modern-tree-sitter grammars cannot be injected
  // into by legacy-tree-sitter-grammars, and vice versa.
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
