const _ = require('underscore-plus');
const Grim = require('grim');
const CSON = require('season');
const SecondMate = require('second-mate');
const { Disposable, CompositeDisposable, Emitter } = require('event-kit');
const TextMateLanguageMode = require('./text-mate-language-mode');
const WASMTreeSitterLanguageMode = require('./wasm-tree-sitter-language-mode');
const WASMTreeSitterGrammar = require('./wasm-tree-sitter-grammar');
const ScopeDescriptor = require('./scope-descriptor');
const Token = require('./token');
const fs = require('fs-plus');
const { Point, Range } = require('text-buffer');

const PATH_SPLIT_REGEX = new RegExp('[/.]');

// Extended: This class holds the grammars used for tokenizing.
//
// An instance of this class is always available as the `atom.grammars` global.
module.exports = class GrammarRegistry {
  constructor({ config } = {}) {
    this.config = config;
    this.subscriptions = new CompositeDisposable();
    this.textmateRegistry = new SecondMate.GrammarRegistry({
      maxTokensPerLine: 100,
      maxLineLength: 1000
    });
    this.emitter = new Emitter();
    this.clear();
  }

  clear() {
    this.textmateRegistry.clear();
    this.wasmTreeSitterGrammarsById = {};
    // TODO: Remove this, or convert wasmTreeSitterGrammarsById to this
    this.treeSitterGrammarsById = {};
    if (this.subscriptions) this.subscriptions.dispose();
    this.subscriptions = new CompositeDisposable();
    this.languageOverridesByBufferId = new Map();
    this.grammarScoresByBuffer = new Map();
    this.textMateScopeNamesByTreeSitterLanguageId = new Map();
    this.treeSitterLanguageIdsByTextMateScopeName = new Map();

    const grammarAddedOrUpdated = this.grammarAddedOrUpdated.bind(this);
    this.textmateRegistry.onDidAddGrammar(grammarAddedOrUpdated);
    this.textmateRegistry.onDidUpdateGrammar(grammarAddedOrUpdated);

    let onLanguageModeChange = () => {
      this.grammarScoresByBuffer.forEach((_score, buffer) => {
        if (!this.languageOverridesByBufferId.has(buffer.id)) {
          this.autoAssignLanguageMode(buffer);
        }
      });
    };

    this.subscriptions.add(
      this.config.onDidChange('core.useTreeSitterParsers', onLanguageModeChange),
    );
  }

  serialize() {
    const languageOverridesByBufferId = {};
    this.languageOverridesByBufferId.forEach((languageId, bufferId) => {
      languageOverridesByBufferId[bufferId] = languageId;
    });
    return { languageOverridesByBufferId };
  }

  deserialize(params) {
    for (const bufferId in params.languageOverridesByBufferId || {}) {
      this.languageOverridesByBufferId.set(
        bufferId,
        params.languageOverridesByBufferId[bufferId]
      );
    }
  }

  createToken(value, scopes) {
    return new Token({ value, scopes });
  }

  // Extended: set a {TextBuffer}'s language mode based on its path and content,
  // and continue to update its language mode as grammars are added or updated, or
  // the buffer's file path changes.
  //
  // * `buffer` The {TextBuffer} whose language mode will be maintained.
  //
  // Returns a {Disposable} that can be used to stop updating the buffer's
  // language mode.
  maintainLanguageMode(buffer) {
    this.grammarScoresByBuffer.set(buffer, null);

    const languageOverride = this.languageOverridesByBufferId.get(buffer.id);
    if (languageOverride) {
      this.assignLanguageMode(buffer, languageOverride);
    } else {
      this.autoAssignLanguageMode(buffer);
    }

    const pathChangeSubscription = buffer.onDidChangePath(() => {
      this.grammarScoresByBuffer.delete(buffer);
      if (!this.languageOverridesByBufferId.has(buffer.id)) {
        this.autoAssignLanguageMode(buffer);
      }
    });

    const destroySubscription = buffer.onDidDestroy(() => {
      this.grammarScoresByBuffer.delete(buffer);
      this.languageOverridesByBufferId.delete(buffer.id);
      this.subscriptions.remove(destroySubscription);
      this.subscriptions.remove(pathChangeSubscription);
    });

    this.subscriptions.add(pathChangeSubscription, destroySubscription);

    return new Disposable(() => {
      destroySubscription.dispose();
      pathChangeSubscription.dispose();
      this.subscriptions.remove(pathChangeSubscription);
      this.subscriptions.remove(destroySubscription);
      this.grammarScoresByBuffer.delete(buffer);
      this.languageOverridesByBufferId.delete(buffer.id);
    });
  }

  // Extended: Force a {TextBuffer} to use a different grammar than the
  // one that would otherwise be selected for it.
  //
  // * `buffer` The {TextBuffer} whose grammar will be set.
  // * `languageId` The {String} id of the desired language.
  //
  // Returns a {Boolean} that indicates whether the language was successfully
  // found.
  assignLanguageMode(buffer, languageId) {
    if (buffer.getBuffer) buffer = buffer.getBuffer();

    let grammar = null;
    if (languageId != null) {
      grammar = this.grammarForId(languageId);
      if (!grammar || !grammar.scopeName) return false;
      this.languageOverridesByBufferId.set(buffer.id, languageId);
    } else {
      this.languageOverridesByBufferId.set(buffer.id, null);
      grammar = this.textmateRegistry.nullGrammar;
    }

    this.grammarScoresByBuffer.set(buffer, null);
    if (grammar !== buffer.getLanguageMode().grammar) {
      buffer.setLanguageMode(
        this.languageModeForGrammarAndBuffer(grammar, buffer)
      );
    }

    return true;
  }

  // Extended: Force a {TextBuffer} to use a different grammar than the
  // one that would otherwise be selected for it.
  //
  // * `buffer` The {TextBuffer} whose grammar will be set.
  // * `grammar` The desired {Grammar}.
  //
  // Returns a {Boolean} that indicates whether the assignment was successful
  assignGrammar(buffer, grammar) {
    if (!grammar) return false;
    if (buffer.getBuffer) buffer = buffer.getBuffer();
    this.languageOverridesByBufferId.set(buffer.id, grammar.scopeName || null);
    this.grammarScoresByBuffer.set(buffer, null);
    if (grammar !== buffer.getLanguageMode().grammar) {
      buffer.setLanguageMode(
        this.languageModeForGrammarAndBuffer(grammar, buffer)
      );
    }
    return true;
  }

  // Extended: Get the `languageId` that has been explicitly assigned to
  // the given buffer, if any.
  //
  // Returns a {String} id of the language
  getAssignedLanguageId(buffer) {
    return this.languageOverridesByBufferId.get(buffer.id);
  }

  // Extended: Remove any language mode override that has been set for the
  // given {TextBuffer}. This will assign to the buffer the best language
  // mode available.
  //
  // * `buffer` The {TextBuffer}.
  autoAssignLanguageMode(buffer) {
    const result = this.selectGrammarWithScore(
      buffer.getPath(),
      getGrammarSelectionContent(buffer)
    );
    this.languageOverridesByBufferId.delete(buffer.id);
    this.grammarScoresByBuffer.set(buffer, result.score);
    if (result.grammar !== buffer.getLanguageMode().grammar) {
      buffer.setLanguageMode(
        this.languageModeForGrammarAndBuffer(result.grammar, buffer)
      );
    }
  }

  languageModeForGrammarAndBuffer(grammar, buffer) {
    if (grammar instanceof WASMTreeSitterGrammar) {
      return new WASMTreeSitterLanguageMode({
        grammar,
        buffer,
        config: this.config,
        grammars: this
      });
    } else {
      return new TextMateLanguageMode({ grammar, buffer, config: this.config });
    }
  }

  // Extended: Select a grammar for the given file path and file contents.
  //
  // This picks the best match by checking the file path and contents against
  // each grammar.
  //
  // * `filePath` A {String} file path.
  // * `fileContents` A {String} of text for the file path.
  //
  // Returns a {Grammar}, never null.
  selectGrammar(filePath, fileContents) {
    return this.selectGrammarWithScore(filePath, fileContents).grammar;
  }

  selectGrammarWithScore(filePath, fileContents) {
    let bestMatch = null;
    let highestScore = -Infinity;
    this.forEachGrammar(grammar => {
      const score = this.getGrammarScore(grammar, filePath, fileContents);
      if (score > highestScore || bestMatch == null) {
        bestMatch = grammar;
        highestScore = score;
      }
    });
    return { grammar: bestMatch, score: highestScore };
  }

  getLanguageParserForScope(scope) {
    if (typeof scope === 'string') {
      scope = new ScopeDescriptor({ scopes: [scope] })
    }
    let useTreeSitterParsers = this.config.get('core.useTreeSitterParsers', { scope });

    if (!useTreeSitterParsers) {
      return 'textmate';
    } else {
      return 'wasm-tree-sitter'
    }
  }

  // Extended: Returns a {Number} representing how well the grammar matches the
  // `filePath` and `contents`.
  getGrammarScore(grammar, filePath, contents) {
    if (contents == null && fs.isFileSync(filePath)) {
      contents = fs.readFileSync(filePath, 'utf8');
    }

    // Initially identify matching grammars based on the filename and the first
    // line of the file.
    let score = this.getGrammarPathScore(grammar, filePath);
    if (this.grammarMatchesPrefix(grammar, contents)) score += 0.5;

    // If multiple grammars match by one of the above criteria, break ties.
    if (score > 0) {
      const isTreeSitter = grammar instanceof WASMTreeSitterGrammar;
      let scope = new ScopeDescriptor({ scopes: [grammar.scopeName] });
      let parserConfig = this.getLanguageParserForScope(scope);

      // Prefer either TextMate or Tree-sitter grammars based on the user's
      // settings.
      //
      // TODO: This logic is a bit convoluted temporarily as we transition away
      // from legacy tree-sitter grammars; it can be vastly simplified once the
      // transition is complete.
      if (isTreeSitter) {
        if (parserConfig === 'wasm-tree-sitter') {
          score += 0.1;
        } else if (parserConfig === 'textmate') {
          score = -1;
        }
      }

      // Prefer grammars with matching content regexes. Prefer a grammar with no content regex
      // over one with a non-matching content regex.
      if (grammar.contentRegex) {
        const contentMatch = isTreeSitter
          ? grammar.contentRegex.test(contents)
          : grammar.contentRegex.findNextMatchSync(contents);
        if (contentMatch) {
          score += 0.05;
        } else {
          score -= 0.05;
        }
      }

      // Prefer grammars that the user has manually installed over bundled grammars.
      if (!grammar.bundledPackage) score += 0.01;
    }

    return score;
  }

  getGrammarPathScore(grammar, filePath) {
    if (!filePath) return -1;
    if (process.platform === 'win32') {
      filePath = filePath.replace(/\\/g, '/');
    }

    const pathComponents = filePath.toLowerCase().split(PATH_SPLIT_REGEX);
    let pathScore = 0;

    let customFileTypes;
    if (this.config.get('core.customFileTypes')) {
      customFileTypes = this.config.get('core.customFileTypes')[
        grammar.scopeName
      ];
    }

    let { fileTypes } = grammar;
    if (customFileTypes) {
      fileTypes = fileTypes.concat(customFileTypes);
    }

    for (let i = 0; i < fileTypes.length; i++) {
      const fileType = fileTypes[i];
      const fileTypeComponents = fileType.toLowerCase().split(PATH_SPLIT_REGEX);
      const pathSuffix = pathComponents.slice(-fileTypeComponents.length);
      if (_.isEqual(pathSuffix, fileTypeComponents)) {
        pathScore = Math.max(pathScore, fileType.length);
        if (i >= grammar.fileTypes.length) {
          pathScore += 0.5;
        }
      }
    }

    return pathScore;
  }

  grammarMatchesPrefix(grammar, contents) {
    if (contents && grammar.firstLineRegex) {
      let escaped = false;
      let numberOfNewlinesInRegex = 0;
      for (let character of grammar.firstLineRegex.source) {
        switch (character) {
          case '\\':
            escaped = !escaped;
            break;
          case 'n':
            if (escaped) {
              numberOfNewlinesInRegex++;
            }
            escaped = false;
            break;
          default:
            escaped = false;
        }
      }

      const prefix = contents
        .split('\n')
        .slice(0, numberOfNewlinesInRegex + 1)
        .join('\n');
      if (grammar.firstLineRegex.findNextMatchSync) {
        return grammar.firstLineRegex.findNextMatchSync(prefix);
      } else {
        return grammar.firstLineRegex.test(prefix);
      }
    } else {
      return false;
    }
  }

  forEachGrammar(callback) {
    this.getGrammars({ includeTreeSitter: true }).forEach(callback);
  }

  grammarForId(languageId) {
    if (!languageId) return null;
    const config = this.getLanguageParserForScope(
      new ScopeDescriptor({ scopes: [languageId] })
    );

    let getTreeSitterGrammar = (table, languageId) => {
      let grammar = table[languageId];
      if (grammar?.scopeName) {
        return grammar;
      }
      return null;
    };

    if (config === 'wasm-tree-sitter') {
      return (
        getTreeSitterGrammar(
          this.wasmTreeSitterGrammarsById,
          languageId
        ) ||
        this.textmateRegistry.grammarForScopeName(languageId)
      );
    } else {
      return (
        this.textmateRegistry.grammarForScopeName(languageId) ||
        this.wasmTreeSitterGrammarsById[languageId] ||
        this.treeSitterGrammarsById[languageId]
      );
    }
  }

  // Deprecated: Get the grammar override for the given file path.
  //
  // * `filePath` A {String} file path.
  //
  // Returns a {String} such as `"source.js"`.
  grammarOverrideForPath(filePath) {
    Grim.deprecate('Use buffer.getLanguageMode().getLanguageId() instead');
    const buffer = atom.project.findBufferForPath(filePath);
    if (buffer) return this.getAssignedLanguageId(buffer);
  }

  // Deprecated: Set the grammar override for the given file path.
  //
  // * `filePath` A non-empty {String} file path.
  // * `languageId` A {String} such as `"source.js"`.
  //
  // Returns undefined.
  setGrammarOverrideForPath(filePath, languageId) {
    Grim.deprecate(
      'Use atom.grammars.assignLanguageMode(buffer, languageId) instead'
    );
    const buffer = atom.project.findBufferForPath(filePath);
    if (buffer) {
      const grammar = this.grammarForScopeName(languageId);
      if (grammar)
        this.languageOverridesByBufferId.set(buffer.id, grammar.name);
    }
  }

  // Remove the grammar override for the given file path.
  //
  // * `filePath` A {String} file path.
  //
  // Returns undefined.
  clearGrammarOverrideForPath(filePath) {
    Grim.deprecate('Use atom.grammars.autoAssignLanguageMode(buffer) instead');
    const buffer = atom.project.findBufferForPath(filePath);
    if (buffer) this.languageOverridesByBufferId.delete(buffer.id);
  }

  grammarAddedOrUpdated(grammar) {
    if (grammar.scopeName && !grammar.id) grammar.id = grammar.scopeName;

    this.grammarScoresByBuffer.forEach((score, buffer) => {
      const languageMode = buffer.getLanguageMode();
      const languageOverride = this.languageOverridesByBufferId.get(buffer.id);

      if (
        grammar === buffer.getLanguageMode().grammar ||
        grammar === this.grammarForId(languageOverride)
      ) {
        buffer.setLanguageMode(
          this.languageModeForGrammarAndBuffer(grammar, buffer)
        );
        return;
      } else if (!languageOverride) {
        const score = this.getGrammarScore(
          grammar,
          buffer.getPath(),
          getGrammarSelectionContent(buffer)
        );
        const currentScore = this.grammarScoresByBuffer.get(buffer);
        if (currentScore == null || score > currentScore) {
          buffer.setLanguageMode(
            this.languageModeForGrammarAndBuffer(grammar, buffer)
          );
          this.grammarScoresByBuffer.set(buffer, score);
          return;
        }
      }

      languageMode.updateForInjection(grammar);
    });
  }

  // Extended: Invoke the given callback when a grammar is added to the registry.
  //
  // * `callback` {Function} to call when a grammar is added.
  //   * `grammar` {Grammar} that was added.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onDidAddGrammar(callback) {
    let disposable = new CompositeDisposable();
    disposable.add(
      this.textmateRegistry.onDidAddGrammar(callback),
      this.emitter.on('did-add-grammar', callback)
    );
    return disposable;
  }

  // Extended: Invoke the given callback when a grammar is updated due to a grammar
  // it depends on being added or removed from the registry.
  //
  // * `callback` {Function} to call when a grammar is updated.
  //   * `grammar` {Grammar} that was updated.
  //
  // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.
  onDidUpdateGrammar(callback) {
    let disposable = new CompositeDisposable();
    disposable.add(
      this.textmateRegistry.onDidUpdateGrammar(callback),
      this.emitter.on('did-update-grammar', callback)
    );
    return disposable;
  }

  // Experimental: Specify a type of syntax node that may embed other languages.
  //
  // * `grammarId` The {String} id of the parent language
  // * `injectionPoint` An {Object} with the following keys:
  //   * `type` The {String} type of syntax node that may embed other languages
  //   * `language` A {Function} that is called with syntax nodes of the specified `type` and
  //     returns a {String} that will be tested against other grammars' `injectionRegex` in
  //     order to determine what language should be embedded.
  //   * `content` A {Function} that is called with syntax nodes of the specified `type` and
  //     returns another syntax node or array of syntax nodes that contain the embedded source
  //     code. Depending on the settings below, the content node(s) will be converted into a
  //     series of buffer ranges; when this injection is parsed, anything not inside those
  //     ranges will be invisible to the parser.
  //   * `includeChildren` A {Boolean} that indicates whether the children (and, in fact, all
  //     descendants) of the nodes returned by `content` should be included in the injection's
  //     buffer range(s). Defaults to `false`.
  //   * `newlinesBetween` A {Boolean} that indicates whether each node returned from `content`
  //     should be separated by at least one newline character so that the parser understands
  //     them to be logically separated. Embedded languages like ERB and EJS need this. Defaults
  //     to {false}.
  //   * `languageScope` A {String} or {Function} that returns the desired scope name to apply
  //     to each of the injection's buffer ranges. Defaults to the injected grammar's own language
  //     scope — e.g., `source.js` for the JavaScript grammar. Set to `null` if the language scope
  //     should be omitted. If a {Function}, will be called with the grammar instance as an
  //     argument, and should return either a {String} or `null`.
  //   * `coverShallowerScopes` A {Boolean} that indicates whether this injection should prevent
  //     shallower layers (including the layer that created this injection) from adding scopes
  //     within any of this injection's buffer ranges. Useful for injecting languages into
  //     themselves — for instance, injecting Rust into Rust macro definitions.
  //   * `includeAdjacentWhitespace` A {Boolean} that indicates whether the injection's buffer
  //     range(s) should include whitespace that occurs between two adjacent ranges. Defaults to
  //     `false`. When `true`, if two consecutive injection buffer ranges are separated _only_ by
  //     whitespace, those ranges will be consolidated into one range along with that whitespace.
  //
  addInjectionPoint(grammarId, injectionPoint, { only = null } = {}) {
    let grammarsToDispose = [];
    const addOrCreateInjectionPoint = (table, grammarId) => {
      let grammar = table[grammarId];
      if (grammar) {
        if (grammar.addInjectionPoint) {
          grammar.addInjectionPoint(injectionPoint);

          // This is a grammar that's already loaded — not just a stub. Editors
          // that already use this grammar will want to know that we added an
          // injection.
          this.emitter.emit('did-update-grammar', grammar);
        } else {
          grammar.injectionPoints.push(injectionPoint);
        }
        grammarsToDispose.push(grammar);

      } else {
        table[grammarId] = { injectionPoints: [injectionPoint] }
      }
    };

    // TEMP: By default, an injection point will be added for both kinds of
    // tree-sitter grammars, but the optional keyword argument `only` lets us
    // target one or the other. We'll only need this option until we transition
    // away from legacy tree-sitter.
    if (!only || only === 'legacy') {
      addOrCreateInjectionPoint(this.treeSitterGrammarsById, grammarId);
    }

    if (!only || only === 'modern') {
      addOrCreateInjectionPoint(this.wasmTreeSitterGrammarsById, grammarId);
    }

    return new Disposable(() => {
      for (let grammar of grammarsToDispose) {
        grammar.removeInjectionPoint(injectionPoint);
      }
    });
  }

  get nullGrammar() {
    return this.textmateRegistry.nullGrammar;
  }

  get grammars() {
    return this.getGrammars();
  }

  decodeTokens() {
    return this.textmateRegistry.decodeTokens.apply(
      this.textmateRegistry,
      arguments
    );
  }

  grammarForScopeName(scopeName) {
    return this.grammarForId(scopeName);
  }

  addGrammar(grammar) {
    if (grammar instanceof WASMTreeSitterGrammar) {
      const existingParams =
        this.wasmTreeSitterGrammarsById[grammar.scopeName] || {};
      if (grammar.scopeName)
        this.wasmTreeSitterGrammarsById[grammar.scopeName] = grammar;
      if (existingParams.injectionPoints) {
        for (const injectionPoint of existingParams.injectionPoints) {
          grammar.addInjectionPoint(injectionPoint);
        }
      }
      this.grammarAddedOrUpdated(grammar);
      this.emitter.emit('did-add-grammar', grammar);
      return new Disposable(() => this.removeGrammar(grammar));
    } else {
      return this.textmateRegistry.addGrammar(grammar);
    }
  }

  removeGrammar(grammar) {
    if (grammar instanceof WASMTreeSitterGrammar) {
      delete this.wasmTreeSitterGrammarsById[grammar.scopeName];
    } else {
      return this.textmateRegistry.removeGrammar(grammar);
    }
  }

  removeGrammarForScopeName(scopeName) {
    return this.textmateRegistry.removeGrammarForScopeName(scopeName);
  }

  // Extended: Read a grammar asynchronously and add it to the registry.
  //
  // * `grammarPath` A {String} absolute file path to a grammar file.
  // * `callback` A {Function} to call when loaded with the following arguments:
  //   * `error` An {Error}, may be null.
  //   * `grammar` A {Grammar} or null if an error occurred.
  loadGrammar(grammarPath, callback) {
    this.readGrammar(grammarPath, (error, grammar) => {
      if (error) return callback(error);
      this.addGrammar(grammar);
      callback(null, grammar);
    });
  }

  // Extended: Read a grammar synchronously and add it to this registry.
  //
  // * `grammarPath` A {String} absolute file path to a grammar file.
  //
  // Returns a {Grammar}.
  loadGrammarSync(grammarPath) {
    const grammar = this.readGrammarSync(grammarPath);
    this.addGrammar(grammar);
    return grammar;
  }

  // Extended: Read a grammar asynchronously but don't add it to the registry.
  //
  // * `grammarPath` A {String} absolute file path to a grammar file.
  // * `callback` A {Function} to call when read with the following arguments:
  //   * `error` An {Error}, may be null.
  //   * `grammar` A {Grammar} or null if an error occurred.
  //
  // Returns undefined.
  readGrammar(grammarPath, callback) {
    if (!callback) callback = () => {};
    CSON.readFile(grammarPath, (error, params = {}) => {
      if (error) return callback(error);
      try {
        callback(null, this.createGrammar(grammarPath, params));
      } catch (error) {
        callback(error);
      }
    });
  }

  // Extended: Read a grammar synchronously but don't add it to the registry.
  //
  // * `grammarPath` A {String} absolute file path to a grammar file.
  //
  // Returns a {Grammar}.
  readGrammarSync(grammarPath) {
    return this.createGrammar(
      grammarPath,
      CSON.readFileSync(grammarPath) || {}
    );
  }

  createGrammar(grammarPath, params) {
    if (params.type === 'modern-tree-sitter') {
      return new WASMTreeSitterGrammar(this, grammarPath, params)
    } else {
      if (
        typeof params.scopeName !== 'string' ||
        params.scopeName.length === 0
      ) {
        throw new Error(
          `Grammar missing required scopeName property: ${grammarPath}`
        );
      }
      return this.textmateRegistry.createGrammar(grammarPath, params);
    }
  }

  // Extended: Get all the grammars in this registry.
  //
  // * `options` (optional) {Object}
  //   * `includeTreeSitter` (optional) {Boolean} Set to include
  //     [Tree-sitter](https://github.blog/2018-10-31-atoms-new-parsing-system/) grammars
  //
  // Returns a non-empty {Array} of {Grammar} instances.
  getGrammars(params) {
    let result = this.textmateRegistry.getGrammars();
    if (!(params && params.includeTreeSitter)) return result;

    const tsGrammars = Object.values(this.treeSitterGrammarsById)
      .filter(g => g.scopeName);
    result = result.concat(tsGrammars);

    let modernTsGrammars = Object.values(this.wasmTreeSitterGrammarsById)
      .filter(g => g.scopeName);
    result = result.concat(modernTsGrammars);

    return result;
  }

  scopeForId(id) {
    return this.textmateRegistry.scopeForId(id);
  }

  // Match up a language string (of the sort generated by an injection point)
  // with a grammar. Checks the `injectionRegex` property on grammars and
  // returns the one with the longest match.
  treeSitterGrammarForLanguageString(languageString, type = 'wasm') {
    let longestMatchLength = 0;
    let grammarWithLongestMatch = null;
    let table = type === 'original' ? this.treeSitterGrammarsById : this.wasmTreeSitterGrammarsById;
    for (const id in table) {
      const grammar = table[id];
      if (grammar.injectionRegex) {
        const match = languageString.match(grammar.injectionRegex);
        if (match) {
          const { length } = match[0];
          if (length > longestMatchLength) {
            grammarWithLongestMatch = grammar;
            longestMatchLength = length;
          }
        }
      }
    }
    return grammarWithLongestMatch;
  }
};

function getGrammarSelectionContent(buffer) {
  return buffer.getTextInRange(
    Range(Point(0, 0), buffer.positionForCharacterIndex(1024))
  );
}
