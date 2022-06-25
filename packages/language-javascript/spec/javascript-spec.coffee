fs = require 'fs'
path = require 'path'
TextEditor = null
buildTextEditor = (params) ->
  if atom.workspace.buildTextEditor?
    atom.workspace.buildTextEditor(params)
  else
    TextEditor ?= require('atom').TextEditor
    new TextEditor(params)

describe "JavaScript grammar", ->
  grammar = null

  beforeEach ->
    atom.config.set('core.useTreeSitterParsers', false)

    waitsForPromise ->
      atom.packages.activatePackage("language-javascript")

    runs ->
      grammar = atom.grammars.grammarForScopeName("source.js")

  it "parses the grammar", ->
    expect(grammar).toBeTruthy()
    expect(grammar.scopeName).toBe "source.js"

  describe "strings", ->
    it "tokenizes single-line strings", ->
      delimsByScope =
        "string.quoted.double.js": '"'
        "string.quoted.single.js": "'"

      for scope, delim of delimsByScope
        {tokens} = grammar.tokenizeLine(delim + "x" + delim)
        expect(tokens[0].value).toEqual delim
        expect(tokens[0].scopes).toEqual ["source.js", scope, "punctuation.definition.string.begin.js"]
        expect(tokens[1].value).toEqual "x"
        expect(tokens[1].scopes).toEqual ["source.js", scope]
        expect(tokens[2].value).toEqual delim
        expect(tokens[2].scopes).toEqual ["source.js", scope, "punctuation.definition.string.end.js"]

    it "tokenizes invalid multiline strings", ->
      delimsByScope =
        "string.quoted.double.js": '"'
        "string.quoted.single.js": "'"

      for scope, delim of delimsByScope
        lines = grammar.tokenizeLines delim + """
          line1
          line2\\
          line3
        """ + delim
        expect(lines[0][0]).toEqual value: delim, scopes: ['source.js', scope, 'punctuation.definition.string.begin.js']
        expect(lines[1][0]).toEqual value: 'line2\\', scopes: ['source.js', scope]
        expect(lines[2][0]).toEqual value: 'line3', scopes: ['source.js', scope]
        expect(lines[2][1]).toEqual value: delim, scopes: ['source.js', scope, 'punctuation.definition.string.end.js']

    describe "Unicode escape sequences", ->
      bracketScopes = [
        'punctuation.definition.unicode-escape.begin.bracket.curly.js',
        'punctuation.definition.unicode-escape.end.bracket.curly.js'
      ]
      delimsByScope =
        "string.quoted.double.js": '"'
        "string.quoted.single.js": "'"

      it "tokenises 2-digit sequences", ->
        for scope, quote of delimsByScope
          {tokens} = grammar.tokenizeLine(quote + '\\x2011' + quote)
          expect(tokens[0]).toEqual value: quote, scopes: ['source.js', scope, 'punctuation.definition.string.begin.js']
          expect(tokens[1]).toEqual value: '\\x20', scopes: ['source.js', scope, 'constant.character.escape.js']
          expect(tokens[2]).toEqual value: '11', scopes: ['source.js', scope]
          expect(tokens[3]).toEqual value: quote, scopes: ['source.js', scope, 'punctuation.definition.string.end.js']

      it "tokenises 4-digit sequences", ->
        for scope, quote of delimsByScope
          {tokens} = grammar.tokenizeLine(quote + '\\u2011' + quote)
          expect(tokens[0]).toEqual value: quote, scopes: ['source.js', scope, 'punctuation.definition.string.begin.js']
          expect(tokens[1]).toEqual value: '\\u2011', scopes: ['source.js', scope, 'constant.character.escape.js']
          expect(tokens[2]).toEqual value: quote, scopes: ['source.js', scope, 'punctuation.definition.string.end.js']

      it "tokenises variable-length sequences", ->
        for scope, quote of delimsByScope
          {tokens} = grammar.tokenizeLine(quote + '\\u{2000}' + quote)
          expect(tokens[0]).toEqual value: quote, scopes: ['source.js', scope, 'punctuation.definition.string.begin.js']
          expect(tokens[1]).toEqual value: '\\u', scopes: ['source.js', scope, 'constant.character.escape.js']
          expect(tokens[2]).toEqual value: '{', scopes: ['source.js', scope, 'constant.character.escape.js', bracketScopes[0]]
          expect(tokens[3]).toEqual value: '2000', scopes: ['source.js', scope, 'constant.character.escape.js']
          expect(tokens[4]).toEqual value: '}', scopes: ['source.js', scope, 'constant.character.escape.js', bracketScopes[1]]
          expect(tokens[5]).toEqual value: quote, scopes: ['source.js', scope, 'punctuation.definition.string.end.js']

      it "highlights sequences with invalid syntax", ->
        for invalid in ['\\u', '\\u{2000', '\\u{G}']
          {tokens} = grammar.tokenizeLine('"' + invalid + '"')
          expect(tokens[1]).toEqual value: invalid, scopes: ['source.js', 'string.quoted.double.js', 'invalid.illegal.unicode-escape.js']

      it "highlights sequences with invalid codepoints", ->
        maxCodepoint = 0x10FFFF
        for codepoint in [0x5000, 0x11FFFF, 0x1000000, maxCodepoint]
          pointStr = codepoint.toString(16).toUpperCase().replace(/^0x/, "")
          {tokens} = grammar.tokenizeLine('"\\u{' + pointStr + '}"')
          pointScopes = ['source.js', 'string.quoted.double.js', 'constant.character.escape.js']
          if codepoint > maxCodepoint then pointScopes.push 'invalid.illegal.unicode-escape.js'
          expect(tokens[0]).toEqual value: '"', scopes: ['source.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']
          expect(tokens[1]).toEqual value: '\\u', scopes: ['source.js', 'string.quoted.double.js', 'constant.character.escape.js']
          expect(tokens[2]).toEqual value: '{', scopes: ['source.js', 'string.quoted.double.js', 'constant.character.escape.js', bracketScopes[0]]
          expect(tokens[3]).toEqual value: pointStr, scopes: pointScopes
          expect(tokens[4]).toEqual value: '}', scopes: ['source.js', 'string.quoted.double.js', 'constant.character.escape.js', bracketScopes[1]]
          expect(tokens[5]).toEqual value: '"', scopes: ['source.js', 'string.quoted.double.js', 'punctuation.definition.string.end.js']

  describe "keywords", ->
    keywords = ['await', 'break', 'catch', 'continue', 'do']

    for keyword in keywords
      it "tokenizes the #{keyword} keyword", ->
        {tokens} = grammar.tokenizeLine(keyword)
        expect(tokens[0]).toEqual value: keyword, scopes: ['source.js', 'keyword.control.js']

    it "tokenizes the debugger statement", ->
      {tokens} = grammar.tokenizeLine("debugger;")
      expect(tokens[0]).toEqual value: "debugger", scopes: ['source.js', 'keyword.other.debugger.js']
      expect(tokens[1]).toEqual value: ";", scopes: ['source.js', 'punctuation.terminator.statement.js']

    it "tokenises an `await` keyword after a spread operator", ->
      {tokens} = grammar.tokenizeLine("...await stuff()")
      expect(tokens[0]).toEqual value: '...', scopes: ['source.js', 'keyword.operator.spread.js']
      expect(tokens[1]).toEqual value: 'await', scopes: ['source.js', 'keyword.control.js']
      expect(tokens[3]).toEqual value: 'stuff', scopes: ['source.js', 'meta.function-call.js', 'entity.name.function.js']
      expect(tokens[4]).toEqual value: '(', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(tokens[5]).toEqual value: ')', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']

  describe "built-in globals", ->
    it "tokenizes built-in classes", ->
      {tokens} = grammar.tokenizeLine('window')
      expect(tokens[0]).toEqual value: 'window', scopes: ['source.js', 'support.variable.dom.js']

      {tokens} = grammar.tokenizeLine('window.name')
      expect(tokens[0]).toEqual value: 'window', scopes: ['source.js', 'support.variable.dom.js']

      {tokens} = grammar.tokenizeLine('$window')
      expect(tokens[0]).toEqual value: '$window', scopes: ['source.js']

    it "tokenizes built-in variables", ->
      {tokens} = grammar.tokenizeLine('module')
      expect(tokens[0]).toEqual value: 'module', scopes: ['source.js', 'support.variable.js']

      {tokens} = grammar.tokenizeLine('module.prop')
      expect(tokens[0]).toEqual value: 'module', scopes: ['source.js', 'support.variable.js']

  describe "instantiation", ->
    it "tokenizes the new keyword and instance entities", ->
      {tokens} = grammar.tokenizeLine('new something')
      expect(tokens[0]).toEqual value: 'new', scopes: ['source.js', 'meta.class.instance.constructor.js', 'keyword.operator.new.js']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.js', 'meta.class.instance.constructor.js']
      expect(tokens[2]).toEqual value: 'something', scopes: ['source.js', 'meta.class.instance.constructor.js', 'entity.name.type.instance.js']

      {tokens} = grammar.tokenizeLine('new Something')
      expect(tokens[0]).toEqual value: 'new', scopes: ['source.js', 'meta.class.instance.constructor.js', 'keyword.operator.new.js']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.js', 'meta.class.instance.constructor.js']
      expect(tokens[2]).toEqual value: 'Something', scopes: ['source.js', 'meta.class.instance.constructor.js', 'entity.name.type.instance.js']

      {tokens} = grammar.tokenizeLine('new $something')
      expect(tokens[0]).toEqual value: 'new', scopes: ['source.js', 'meta.class.instance.constructor.js', 'keyword.operator.new.js']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.js', 'meta.class.instance.constructor.js']
      expect(tokens[2]).toEqual value: '$something', scopes: ['source.js', 'meta.class.instance.constructor.js', 'entity.name.type.instance.js']

      {tokens} = grammar.tokenizeLine('var instance = new obj.ct.Cla$s();')
      expect(tokens[0]).toEqual value: 'var', scopes: ['source.js', 'storage.type.var.js']
      expect(tokens[1]).toEqual value: ' instance ', scopes: ['source.js']
      expect(tokens[2]).toEqual value: '=', scopes: ['source.js', 'keyword.operator.assignment.js']
      expect(tokens[3]).toEqual value: ' ', scopes: ['source.js']
      expect(tokens[4]).toEqual value: 'new', scopes: ['source.js', 'meta.class.instance.constructor.js', 'keyword.operator.new.js']
      expect(tokens[5]).toEqual value: ' ', scopes: ['source.js', 'meta.class.instance.constructor.js']
      expect(tokens[6]).toEqual value: 'obj', scopes: ['source.js', 'meta.class.instance.constructor.js', 'entity.name.type.instance.js']
      expect(tokens[7]).toEqual value: '.', scopes: ['source.js', 'meta.class.instance.constructor.js', 'entity.name.type.instance.js', 'meta.delimiter.property.period.js']
      expect(tokens[8]).toEqual value: 'ct', scopes: ['source.js', 'meta.class.instance.constructor.js', 'entity.name.type.instance.js']
      expect(tokens[9]).toEqual value: '.', scopes: ['source.js', 'meta.class.instance.constructor.js', 'entity.name.type.instance.js', 'meta.delimiter.property.period.js']
      expect(tokens[10]).toEqual value: 'Cla$s', scopes: ['source.js', 'meta.class.instance.constructor.js', 'entity.name.type.instance.js']
      expect(tokens[11]).toEqual value: '(', scopes: ['source.js', 'meta.brace.round.js']
      expect(tokens[12]).toEqual value: ')', scopes: ['source.js', 'meta.brace.round.js']
      expect(tokens[13]).toEqual value: ';', scopes: ['source.js', 'punctuation.terminator.statement.js']

  describe "regular expressions", ->
    it "tokenizes regular expressions", ->
      {tokens} = grammar.tokenizeLine('/test/')
      expect(tokens[0]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.begin.js']
      expect(tokens[1]).toEqual value: 'test', scopes: ['source.js', 'string.regexp.js']
      expect(tokens[2]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.end.js']

      {tokens} = grammar.tokenizeLine('/random/g')
      expect(tokens[0]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.begin.js']
      expect(tokens[1]).toEqual value: 'random', scopes: ['source.js', 'string.regexp.js']
      expect(tokens[2]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.end.js']
      expect(tokens[3]).toEqual value: 'g', scopes: ['source.js', 'string.regexp.js', 'meta.flag.regexp']

      {tokens} = grammar.tokenizeLine('/rock(et)?/is')
      expect(tokens[0]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.begin.js']
      expect(tokens[1]).toEqual value: 'rock', scopes: ['source.js', 'string.regexp.js']
      expect(tokens[2]).toEqual value: '(', scopes: ['source.js', 'string.regexp.js', 'meta.group.regexp', 'punctuation.definition.group.regexp']
      expect(tokens[3]).toEqual value: 'et', scopes: ['source.js', 'string.regexp.js', 'meta.group.regexp']
      expect(tokens[4]).toEqual value: ')', scopes: ['source.js', 'string.regexp.js', 'meta.group.regexp', 'punctuation.definition.group.regexp']
      expect(tokens[5]).toEqual value: '?', scopes: ['source.js', 'string.regexp.js', 'keyword.operator.quantifier.regexp']
      expect(tokens[6]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.end.js']
      expect(tokens[7]).toEqual value: 'is', scopes: ['source.js', 'string.regexp.js', 'meta.flag.regexp']

      {tokens} = grammar.tokenizeLine('/(foo)bar\\1/')
      expect(tokens[0]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.begin.js']
      expect(tokens[1]).toEqual value: '(', scopes: ['source.js', 'string.regexp.js', 'meta.group.regexp', 'punctuation.definition.group.regexp']
      expect(tokens[2]).toEqual value: 'foo', scopes: ['source.js', 'string.regexp.js', 'meta.group.regexp']
      expect(tokens[3]).toEqual value: ')', scopes: ['source.js', 'string.regexp.js', 'meta.group.regexp', 'punctuation.definition.group.regexp']
      expect(tokens[4]).toEqual value: 'bar', scopes: ['source.js', 'string.regexp.js']
      expect(tokens[5]).toEqual value: '\\1', scopes: ['source.js', 'string.regexp.js', 'keyword.other.back-reference.regexp']
      expect(tokens[6]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.end.js']

      {tokens} = grammar.tokenizeLine('/(?<bY_$>foo)bar\\k<bY_$>/')
      expect(tokens[0]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.begin.js']
      expect(tokens[1]).toEqual value: '(?<bY_$>', scopes: ['source.js', 'string.regexp.js', 'meta.group.regexp', 'punctuation.definition.group.regexp']
      expect(tokens[2]).toEqual value: 'foo', scopes: ['source.js', 'string.regexp.js', 'meta.group.regexp']
      expect(tokens[3]).toEqual value: ')', scopes: ['source.js', 'string.regexp.js', 'meta.group.regexp', 'punctuation.definition.group.regexp']
      expect(tokens[4]).toEqual value: 'bar', scopes: ['source.js', 'string.regexp.js']
      expect(tokens[5]).toEqual value: '\\k<bY_$>', scopes: ['source.js', 'string.regexp.js', 'keyword.other.back-reference.regexp']
      expect(tokens[6]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.end.js']

      {tokens} = grammar.tokenizeLine('/(?:foo)bar/')
      expect(tokens[0]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.begin.js']
      expect(tokens[1]).toEqual value: '(?:', scopes: ['source.js', 'string.regexp.js', 'meta.group.regexp', 'punctuation.definition.group.regexp']
      expect(tokens[2]).toEqual value: 'foo', scopes: ['source.js', 'string.regexp.js', 'meta.group.regexp']
      expect(tokens[3]).toEqual value: ')', scopes: ['source.js', 'string.regexp.js', 'meta.group.regexp', 'punctuation.definition.group.regexp']
      expect(tokens[4]).toEqual value: 'bar', scopes: ['source.js', 'string.regexp.js']
      expect(tokens[5]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.end.js']

      {tokens} = grammar.tokenizeLine('/(?<=foo)test(?=bar)/')
      expect(tokens[0]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.begin.js']
      expect(tokens[1]).toEqual value: '(', scopes: ['source.js', 'string.regexp.js', 'meta.group.assertion.regexp', 'punctuation.definition.group.regexp']
      expect(tokens[2]).toEqual value: '?<=', scopes: ['source.js', 'string.regexp.js', 'meta.group.assertion.regexp', 'meta.assertion.look-behind.regexp']
      expect(tokens[3]).toEqual value: 'foo', scopes: ['source.js', 'string.regexp.js', 'meta.group.assertion.regexp']
      expect(tokens[4]).toEqual value: ')', scopes: ['source.js', 'string.regexp.js', 'meta.group.assertion.regexp', 'punctuation.definition.group.regexp']
      expect(tokens[5]).toEqual value: 'test', scopes: ['source.js', 'string.regexp.js']
      expect(tokens[6]).toEqual value: '(', scopes: ['source.js', 'string.regexp.js', 'meta.group.assertion.regexp', 'punctuation.definition.group.regexp']
      expect(tokens[7]).toEqual value: '?=', scopes: ['source.js', 'string.regexp.js', 'meta.group.assertion.regexp', 'meta.assertion.look-ahead.regexp']
      expect(tokens[8]).toEqual value: 'bar', scopes: ['source.js', 'string.regexp.js', 'meta.group.assertion.regexp']
      expect(tokens[9]).toEqual value: ')', scopes: ['source.js', 'string.regexp.js', 'meta.group.assertion.regexp', 'punctuation.definition.group.regexp']
      expect(tokens[10]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.end.js']

      {tokens} = grammar.tokenizeLine('/(?<!\\$)test(?!\\.)/')
      expect(tokens[0]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.begin.js']
      expect(tokens[1]).toEqual value: '(', scopes: ['source.js', 'string.regexp.js', 'meta.group.assertion.regexp', 'punctuation.definition.group.regexp']
      expect(tokens[2]).toEqual value: '?<!', scopes: ['source.js', 'string.regexp.js', 'meta.group.assertion.regexp', 'meta.assertion.negative-look-behind.regexp']
      expect(tokens[3]).toEqual value: '\\$', scopes: ['source.js', 'string.regexp.js', 'meta.group.assertion.regexp', 'constant.character.escape.backslash.regexp']
      expect(tokens[4]).toEqual value: ')', scopes: ['source.js', 'string.regexp.js', 'meta.group.assertion.regexp', 'punctuation.definition.group.regexp']
      expect(tokens[5]).toEqual value: 'test', scopes: ['source.js', 'string.regexp.js']
      expect(tokens[6]).toEqual value: '(', scopes: ['source.js', 'string.regexp.js', 'meta.group.assertion.regexp', 'punctuation.definition.group.regexp']
      expect(tokens[7]).toEqual value: '?!', scopes: ['source.js', 'string.regexp.js', 'meta.group.assertion.regexp', 'meta.assertion.negative-look-ahead.regexp']
      expect(tokens[8]).toEqual value: '\\.', scopes: ['source.js', 'string.regexp.js', 'meta.group.assertion.regexp', 'constant.character.escape.backslash.regexp']
      expect(tokens[9]).toEqual value: ')', scopes: ['source.js', 'string.regexp.js', 'meta.group.assertion.regexp', 'punctuation.definition.group.regexp']
      expect(tokens[10]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.end.js']

      {tokens} = grammar.tokenizeLine('/{"}/')
      expect(tokens[0]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.begin.js']
      expect(tokens[2]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.end.js']

      {tokens} = grammar.tokenizeLine('foo + /test/')
      expect(tokens[0]).toEqual value: 'foo ', scopes: ['source.js']
      expect(tokens[1]).toEqual value: '+', scopes: ['source.js', 'keyword.operator.js']
      expect(tokens[2]).toEqual value: ' ', scopes: ['source.js', 'string.regexp.js']
      expect(tokens[3]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.begin.js']
      expect(tokens[4]).toEqual value: 'test', scopes: ['source.js', 'string.regexp.js']
      expect(tokens[5]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.end.js']

    it "tokenizes regular expressions inside arrays", ->
      {tokens} = grammar.tokenizeLine('[/test/]')
      expect(tokens[0]).toEqual value: '[', scopes: ['source.js', 'meta.brace.square.js']
      expect(tokens[1]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.begin.js']
      expect(tokens[2]).toEqual value: 'test', scopes: ['source.js', 'string.regexp.js']
      expect(tokens[3]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.end.js']
      expect(tokens[4]).toEqual value: ']', scopes: ['source.js', 'meta.brace.square.js']

      {tokens} = grammar.tokenizeLine('[1, /test/]')
      expect(tokens[0]).toEqual value: '[', scopes: ['source.js', 'meta.brace.square.js']
      expect(tokens[1]).toEqual value: '1', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[2]).toEqual value: ',', scopes: ['source.js', 'meta.delimiter.object.comma.js']
      expect(tokens[3]).toEqual value: ' ', scopes: ['source.js', 'string.regexp.js']
      expect(tokens[4]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.begin.js']
      expect(tokens[5]).toEqual value: 'test', scopes: ['source.js', 'string.regexp.js']
      expect(tokens[6]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.end.js']
      expect(tokens[7]).toEqual value: ']', scopes: ['source.js', 'meta.brace.square.js']

    it "tokenizes regular expressions inside curly brackets", ->
      {tokens} = grammar.tokenizeLine('{/test/}')
      expect(tokens[0]).toEqual value: '{', scopes: ['source.js', 'meta.brace.curly.js']
      expect(tokens[1]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.begin.js']
      expect(tokens[2]).toEqual value: 'test', scopes: ['source.js', 'string.regexp.js']
      expect(tokens[3]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.end.js']
      expect(tokens[4]).toEqual value: '}', scopes: ['source.js', 'meta.brace.curly.js']

    it "tokenizes regular expressions inside arrow function expressions", ->
      {tokens} = grammar.tokenizeLine('getRegex = () => /^helloworld$/;')
      expect(tokens[9]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.begin.js']
      expect(tokens[10]).toEqual value: '^', scopes: ['source.js', 'string.regexp.js', 'keyword.control.anchor.regexp']
      expect(tokens[11]).toEqual value: 'helloworld', scopes: ['source.js', 'string.regexp.js']
      expect(tokens[12]).toEqual value: '$', scopes: ['source.js', 'string.regexp.js', 'keyword.control.anchor.regexp']
      expect(tokens[13]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.end.js']
      expect(tokens[14]).toEqual value: ';', scopes: ['source.js', 'punctuation.terminator.statement.js']

    it "verifies that regular expressions have explicit count modifiers", ->
      source = fs.readFileSync(path.resolve(__dirname, '..', 'grammars', 'javascript.cson'), 'utf8')
      expect(source.search /{,/).toEqual -1

      source = fs.readFileSync(path.resolve(__dirname, '..', 'grammars', 'regular expressions (javascript).cson'), 'utf8')
      expect(source.search /{,/).toEqual -1

  describe "numbers", ->
    it "tokenizes hexadecimals", ->
      {tokens} = grammar.tokenizeLine('0x1D306')
      expect(tokens[0]).toEqual value: '0x1D306', scopes: ['source.js', 'constant.numeric.hex.js']

      {tokens} = grammar.tokenizeLine('0X1D306')
      expect(tokens[0]).toEqual value: '0X1D306', scopes: ['source.js', 'constant.numeric.hex.js']

      {tokens} = grammar.tokenizeLine('0x1D306n')
      expect(tokens[0]).toEqual value: '0x1D306n', scopes: ['source.js', 'constant.numeric.hex.js']

      {tokens} = grammar.tokenizeLine('0X1D306n')
      expect(tokens[0]).toEqual value: '0X1D306n', scopes: ['source.js', 'constant.numeric.hex.js']

      {tokens} = grammar.tokenizeLine('0X1D30_69A3')
      expect(tokens[0]).toEqual value: '0X1D30', scopes: ['source.js', 'constant.numeric.hex.js']
      expect(tokens[1]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.hex.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[2]).toEqual value: '69A3', scopes: ['source.js', 'constant.numeric.hex.js']

    it "tokenizes binary literals", ->
      {tokens} = grammar.tokenizeLine('0b011101110111010001100110')
      expect(tokens[0]).toEqual value: '0b011101110111010001100110', scopes: ['source.js', 'constant.numeric.binary.js']

      {tokens} = grammar.tokenizeLine('0B011101110111010001100110')
      expect(tokens[0]).toEqual value: '0B011101110111010001100110', scopes: ['source.js', 'constant.numeric.binary.js']

      {tokens} = grammar.tokenizeLine('0b011101110111010001100110n')
      expect(tokens[0]).toEqual value: '0b011101110111010001100110n', scopes: ['source.js', 'constant.numeric.binary.js']

      {tokens} = grammar.tokenizeLine('0B011101110111010001100110n')
      expect(tokens[0]).toEqual value: '0B011101110111010001100110n', scopes: ['source.js', 'constant.numeric.binary.js']

      {tokens} = grammar.tokenizeLine('0B0111_0111_0111_0100_0110_0110')
      expect(tokens[0]).toEqual value: '0B0111', scopes: ['source.js', 'constant.numeric.binary.js']
      expect(tokens[1]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.binary.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[2]).toEqual value: '0111', scopes: ['source.js', 'constant.numeric.binary.js']
      expect(tokens[3]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.binary.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[4]).toEqual value: '0111', scopes: ['source.js', 'constant.numeric.binary.js']
      expect(tokens[5]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.binary.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[6]).toEqual value: '0100', scopes: ['source.js', 'constant.numeric.binary.js']
      expect(tokens[7]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.binary.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[8]).toEqual value: '0110', scopes: ['source.js', 'constant.numeric.binary.js']
      expect(tokens[9]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.binary.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[10]).toEqual value: '0110', scopes: ['source.js', 'constant.numeric.binary.js']

    it "tokenizes octal literals", ->
      {tokens} = grammar.tokenizeLine('0o1411')
      expect(tokens[0]).toEqual value: '0o1411', scopes: ['source.js', 'constant.numeric.octal.js']

      {tokens} = grammar.tokenizeLine('0O1411')
      expect(tokens[0]).toEqual value: '0O1411', scopes: ['source.js', 'constant.numeric.octal.js']

      {tokens} = grammar.tokenizeLine('0o1411n')
      expect(tokens[0]).toEqual value: '0o1411n', scopes: ['source.js', 'constant.numeric.octal.js']

      {tokens} = grammar.tokenizeLine('0O1411n')
      expect(tokens[0]).toEqual value: '0O1411n', scopes: ['source.js', 'constant.numeric.octal.js']

      {tokens} = grammar.tokenizeLine('0010')
      expect(tokens[0]).toEqual value: '0010', scopes: ['source.js', 'constant.numeric.octal.js']

      {tokens} = grammar.tokenizeLine('0010_7201_5112')
      expect(tokens[0]).toEqual value: '0010', scopes: ['source.js', 'constant.numeric.octal.js']
      expect(tokens[1]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.octal.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[2]).toEqual value: '7201', scopes: ['source.js', 'constant.numeric.octal.js']
      expect(tokens[3]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.octal.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[4]).toEqual value: '5112', scopes: ['source.js', 'constant.numeric.octal.js']

      {tokens} = grammar.tokenizeLine('0O1411_1236')
      expect(tokens[0]).toEqual value: '0O1411', scopes: ['source.js', 'constant.numeric.octal.js']
      expect(tokens[1]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.octal.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[2]).toEqual value: '1236', scopes: ['source.js', 'constant.numeric.octal.js']

    it "tokenizes decimals", ->
      {tokens} = grammar.tokenizeLine('1234')
      expect(tokens[0]).toEqual value: '1234', scopes: ['source.js', 'constant.numeric.decimal.js']

      {tokens} = grammar.tokenizeLine('123456789n')
      expect(tokens[0]).toEqual value: '123456789n', scopes: ['source.js', 'constant.numeric.decimal.js']

      {tokens} = grammar.tokenizeLine('123_456_789n')
      expect(tokens[0]).toEqual value: '123', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[1]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[2]).toEqual value: '456', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[3]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[4]).toEqual value: '789n', scopes: ['source.js', 'constant.numeric.decimal.js']

      {tokens} = grammar.tokenizeLine('5e-10')
      expect(tokens[0]).toEqual value: '5e-10', scopes: ['source.js', 'constant.numeric.decimal.js']

      {tokens} = grammar.tokenizeLine('5E+5')
      expect(tokens[0]).toEqual value: '5E+5', scopes: ['source.js', 'constant.numeric.decimal.js']

      {tokens} = grammar.tokenizeLine('9.')
      expect(tokens[0]).toEqual value: '9', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[1]).toEqual value: '.', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.decimal.period.js']

      {tokens} = grammar.tokenizeLine('9_9.')
      expect(tokens[0]).toEqual value: '9', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[1]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[2]).toEqual value: '9', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[3]).toEqual value: '.', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.decimal.period.js']

      {tokens} = grammar.tokenizeLine('.9')
      expect(tokens[0]).toEqual value: '.', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.decimal.period.js']
      expect(tokens[1]).toEqual value: '9', scopes: ['source.js', 'constant.numeric.decimal.js']

      {tokens} = grammar.tokenizeLine('.9_9')
      expect(tokens[0]).toEqual value: '.', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.decimal.period.js']
      expect(tokens[1]).toEqual value: '9', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[2]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[3]).toEqual value: '9', scopes: ['source.js', 'constant.numeric.decimal.js']

      {tokens} = grammar.tokenizeLine('9.9')
      expect(tokens[0]).toEqual value: '9', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[1]).toEqual value: '.', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.decimal.period.js']
      expect(tokens[2]).toEqual value: '9', scopes: ['source.js', 'constant.numeric.decimal.js']

      {tokens} = grammar.tokenizeLine('9_9.9_9')
      expect(tokens[0]).toEqual value: '9', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[1]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[2]).toEqual value: '9', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[3]).toEqual value: '.', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.decimal.period.js']
      expect(tokens[4]).toEqual value: '9', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[5]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[6]).toEqual value: '9', scopes: ['source.js', 'constant.numeric.decimal.js']

      {tokens} = grammar.tokenizeLine('.1e-23')
      expect(tokens[0]).toEqual value: '.', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.decimal.period.js']
      expect(tokens[1]).toEqual value: '1e-23', scopes: ['source.js', 'constant.numeric.decimal.js']

      {tokens} = grammar.tokenizeLine('.1_1E+1_1')
      expect(tokens[0]).toEqual value: '.', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.decimal.period.js']
      expect(tokens[1]).toEqual value: '1', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[2]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[3]).toEqual value: '1E+1', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[4]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[5]).toEqual value: '1', scopes: ['source.js', 'constant.numeric.decimal.js']

      {tokens} = grammar.tokenizeLine('1.E3')
      expect(tokens[0]).toEqual value: '1', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[1]).toEqual value: '.', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.decimal.period.js']
      expect(tokens[2]).toEqual value: 'E3', scopes: ['source.js', 'constant.numeric.decimal.js']

      {tokens} = grammar.tokenizeLine('1_1.E-1_1')
      expect(tokens[0]).toEqual value: '1', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[1]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[2]).toEqual value: '1', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[3]).toEqual value: '.', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.decimal.period.js']
      expect(tokens[4]).toEqual value: 'E-1', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[5]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[6]).toEqual value: '1', scopes: ['source.js', 'constant.numeric.decimal.js']

      {tokens} = grammar.tokenizeLine('1_1.1_1E1_1')
      expect(tokens[0]).toEqual value: '1', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[1]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[2]).toEqual value: '1', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[3]).toEqual value: '.', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.decimal.period.js']
      expect(tokens[4]).toEqual value: '1', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[5]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[6]).toEqual value: '1E1', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[7]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[8]).toEqual value: '1', scopes: ['source.js', 'constant.numeric.decimal.js']

      {tokens} = grammar.tokenizeLine('9_9')
      expect(tokens[0]).toEqual value: '9', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[1]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[2]).toEqual value: '9', scopes: ['source.js', 'constant.numeric.decimal.js']

      {tokens} = grammar.tokenizeLine('9_9_9')
      expect(tokens[0]).toEqual value: '9', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[1]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[2]).toEqual value: '9', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[3]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[4]).toEqual value: '9', scopes: ['source.js', 'constant.numeric.decimal.js']

      {tokens} = grammar.tokenizeLine('999_999_999')
      expect(tokens[0]).toEqual value: '999', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[1]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[2]).toEqual value: '999', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[3]).toEqual value: '_', scopes: ['source.js', 'constant.numeric.decimal.js', 'meta.delimiter.numeric.separator.js']
      expect(tokens[4]).toEqual value: '999', scopes: ['source.js', 'constant.numeric.decimal.js']

    it "does not tokenize numbers that are part of a variable", ->
      {tokens} = grammar.tokenizeLine('hi$1')
      expect(tokens[0]).toEqual value: 'hi$1', scopes: ['source.js']

      {tokens} = grammar.tokenizeLine('hi_1')
      expect(tokens[0]).toEqual value: 'hi_1', scopes: ['source.js']

      {tokens} = grammar.tokenizeLine('_1')
      expect(tokens[0]).toEqual value: '_1', scopes: ['source.js', 'constant.other.js']

      {tokens} = grammar.tokenizeLine('1_')
      expect(tokens[0]).toEqual value: '1_', scopes: ['source.js', 'invalid.illegal.identifier.js']

      {tokens} = grammar.tokenizeLine('1_._1')
      expect(tokens[0]).toEqual value: '1_', scopes: ['source.js', 'invalid.illegal.identifier.js']
      expect(tokens[1]).toEqual value: '.', scopes: ['source.js', 'meta.delimiter.property.period.js']
      expect(tokens[2]).toEqual value: '_1', scopes: ['source.js', 'variable.other.property.js']

      {tokens} = grammar.tokenizeLine('1__1')
      expect(tokens[0]).toEqual value: '1__1', scopes: ['source.js', 'invalid.illegal.identifier.js']

  describe "operators", ->
    it "tokenizes them", ->
      operators = ["delete", "in", "of", "instanceof", "new", "typeof", "void"]

      for operator in operators
        {tokens} = grammar.tokenizeLine(operator)
        expect(tokens[0]).toEqual value: operator, scopes: ['source.js', 'keyword.operator.' + operator  + '.js']

    it "tokenizes spread operator", ->
      {tokens} = grammar.tokenizeLine('myFunction(...args);')
      expect(tokens[2]).toEqual value: '...', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'keyword.operator.spread.js']
      expect(tokens[3]).toEqual value: 'args', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js']

      {tokens} = grammar.tokenizeLine('[...iterableObj]')
      expect(tokens[1]).toEqual value: '...', scopes: ['source.js', 'keyword.operator.spread.js']
      expect(tokens[2]).toEqual value: 'iterableObj', scopes: ['source.js']

      {tokens} = grammar.tokenizeLine('...arguments')
      expect(tokens[0]).toEqual value: '...', scopes: ['source.js', 'keyword.operator.spread.js']
      expect(tokens[1]).toEqual value: 'arguments', scopes: ['source.js', 'variable.language.js']

      {tokens} = grammar.tokenizeLine('...super')
      expect(tokens[0]).toEqual value: '...', scopes: ['source.js', 'keyword.operator.spread.js']
      expect(tokens[1]).toEqual value: 'super', scopes: ['source.js', 'variable.language.js']

      {tokens} = grammar.tokenizeLine('...this')
      expect(tokens[0]).toEqual value: '...', scopes: ['source.js', 'keyword.operator.spread.js']
      expect(tokens[1]).toEqual value: 'this', scopes: ['source.js', 'variable.language.js']

    describe "increment, decrement", ->
      it "tokenizes increment", ->
        {tokens} = grammar.tokenizeLine('i++')
        expect(tokens[0]).toEqual value: 'i', scopes: ['source.js']
        expect(tokens[1]).toEqual value: '++', scopes: ['source.js', 'keyword.operator.increment.js']

      it "tokenizes decrement", ->
        {tokens} = grammar.tokenizeLine('i--')
        expect(tokens[0]).toEqual value: 'i', scopes: ['source.js']
        expect(tokens[1]).toEqual value: '--', scopes: ['source.js', 'keyword.operator.decrement.js']

    describe "logical", ->
      operators = ["&&", "||", "!"]

      it "tokenizes them", ->
        for operator in operators
          {tokens} = grammar.tokenizeLine('a ' + operator + ' b')
          expect(tokens[0]).toEqual value: 'a ', scopes: ['source.js']
          expect(tokens[1]).toEqual value: operator, scopes: ['source.js', 'keyword.operator.logical.js']
          expect(tokens[2]).toEqual value: ' b', scopes: ['source.js']

    describe "comparison", ->
      operators = ["<=", ">=", "!=", "!==", "===", "==", "<", ">" ]

      it "tokenizes them", ->
        for operator in operators
          {tokens} = grammar.tokenizeLine('a ' + operator + ' b')
          expect(tokens[0]).toEqual value: 'a ', scopes: ['source.js']
          expect(tokens[1]).toEqual value: operator, scopes: ['source.js', 'keyword.operator.comparison.js']
          expect(tokens[2]).toEqual value: ' b', scopes: ['source.js']

    describe "bitwise", ->
      it "tokenizes bitwise 'not'", ->
        {tokens} = grammar.tokenizeLine('~a')
        expect(tokens[0]).toEqual value: '~', scopes: ['source.js', 'keyword.operator.bitwise.js']
        expect(tokens[1]).toEqual value: 'a', scopes: ['source.js']

      it "tokenizes bitwise shift operators", ->
        operators = ["<<", ">>", ">>>"]

        for operator in operators
          {tokens} = grammar.tokenizeLine('a ' + operator + ' b')
          expect(tokens[0]).toEqual value: 'a ', scopes: ['source.js']
          expect(tokens[1]).toEqual value: operator, scopes: ['source.js', 'keyword.operator.bitwise.shift.js']
          expect(tokens[2]).toEqual value: ' b', scopes: ['source.js']

      it "tokenizes them", ->
        operators = ["|", "^", "&"]

        for operator in operators
          {tokens} = grammar.tokenizeLine('a ' + operator + ' b')
          expect(tokens[0]).toEqual value: 'a ', scopes: ['source.js']
          expect(tokens[1]).toEqual value: operator, scopes: ['source.js', 'keyword.operator.bitwise.js']
          expect(tokens[2]).toEqual value: ' b', scopes: ['source.js']

    describe "arithmetic", ->
      operators = ["*", "/", "-", "%", "+"]

      it "tokenizes them", ->
        for operator in operators
          {tokens} = grammar.tokenizeLine('a ' + operator + ' b')
          expect(tokens[0]).toEqual value: 'a ', scopes: ['source.js']
          expect(tokens[1]).toEqual value: operator, scopes: ['source.js', 'keyword.operator.js']
          expect(tokens[2]).toEqual value: ' b', scopes: ['source.js']

      it "tokenizes the arithmetic operators when separated by newlines", ->
        for operator in operators
          lines = grammar.tokenizeLines '1\n' + operator + ' 2'
          expect(lines[0][0]).toEqual value: '1', scopes: ['source.js', 'constant.numeric.decimal.js']
          expect(lines[1][0]).toEqual value: operator, scopes: ['source.js', 'keyword.operator.js']
          expect(lines[1][2]).toEqual value: '2', scopes: ['source.js', 'constant.numeric.decimal.js']

    describe "assignment", ->
      it "tokenizes '=' operator", ->
        {tokens} = grammar.tokenizeLine('a = b')
        expect(tokens[0]).toEqual value: 'a ', scopes: ['source.js']
        expect(tokens[1]).toEqual value: '=', scopes: ['source.js', 'keyword.operator.assignment.js']
        expect(tokens[2]).toEqual value: ' b', scopes: ['source.js']

      describe "compound", ->
        it "tokenizes them", ->
          operators = ["+=", "-=", "*=", "/=", "%="]
          for operator in operators
            {tokens} = grammar.tokenizeLine('a ' + operator + ' b')
            expect(tokens[0]).toEqual value: 'a ', scopes: ['source.js']
            expect(tokens[1]).toEqual value: operator, scopes: ['source.js', 'keyword.operator.assignment.compound.js']
            expect(tokens[2]).toEqual value: ' b', scopes: ['source.js']

        describe "bitwise", ->
          it "tokenizes them", ->
            operators = ["<<=", ">>=", ">>>=", "&=", "^=", "|="]
            for operator in operators
              {tokens} = grammar.tokenizeLine('a ' + operator + ' b')
              expect(tokens[0]).toEqual value: 'a ', scopes: ['source.js']
              expect(tokens[1]).toEqual value: operator, scopes: ['source.js', 'keyword.operator.assignment.compound.bitwise.js']
              expect(tokens[2]).toEqual value: ' b', scopes: ['source.js']

  describe "constants", ->
    it "tokenizes ALL_CAPS variables as constants", ->
      {tokens} = grammar.tokenizeLine('var MY_COOL_VAR = 42;')
      expect(tokens[0]).toEqual value: 'var', scopes: ['source.js', 'storage.type.var.js']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.js']
      expect(tokens[2]).toEqual value: 'MY_COOL_VAR', scopes: ['source.js', 'constant.other.js']
      expect(tokens[3]).toEqual value: ' ', scopes: ['source.js']
      expect(tokens[4]).toEqual value: '=', scopes: ['source.js', 'keyword.operator.assignment.js']
      expect(tokens[5]).toEqual value: ' ', scopes: ['source.js']
      expect(tokens[6]).toEqual value: '42', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[7]).toEqual value: ';', scopes: ['source.js', 'punctuation.terminator.statement.js']

      {tokens} = grammar.tokenizeLine('something = MY_COOL_VAR * 1;')
      expect(tokens[0]).toEqual value: 'something ', scopes: ['source.js']
      expect(tokens[1]).toEqual value: '=', scopes: ['source.js', 'keyword.operator.assignment.js']
      expect(tokens[2]).toEqual value: ' ', scopes: ['source.js']
      expect(tokens[3]).toEqual value: 'MY_COOL_VAR', scopes: ['source.js', 'constant.other.js']
      expect(tokens[4]).toEqual value: ' ', scopes: ['source.js']
      expect(tokens[5]).toEqual value: '*', scopes: ['source.js', 'keyword.operator.js']
      expect(tokens[6]).toEqual value: ' ', scopes: ['source.js']
      expect(tokens[7]).toEqual value: '1', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[8]).toEqual value: ';', scopes: ['source.js', 'punctuation.terminator.statement.js']

      {tokens} = grammar.tokenizeLine('OBJ.prop')
      expect(tokens[0]).toEqual value: 'OBJ', scopes: ['source.js', 'constant.other.object.js']

    it "tokenises constants with dollar signs", ->
      constants = ['CON$TANT', 'ABC$', 'ABC$D', '$_ALL', 'ALL_$', 'ANGULAR$$$$$$$$$$$']
      for constant in constants
        {tokens} = grammar.tokenizeLine(constant)
        expect(tokens[0]).toEqual value: constant, scopes: ['source.js', 'constant.other.js']

    it "doesn't tokenise constants without alphabetic characters", ->
      for name in ['$_', '$', '_', '$_$_$_$___$___$____$']
        {tokens} = grammar.tokenizeLine(name)
        expect(tokens[0]).toEqual value: name, scopes: ['source.js']

    it "tokenizes variables declared using `const` as constants", ->
      {tokens} = grammar.tokenizeLine('const myCoolVar = 42;')
      expect(tokens[0]).toEqual value: 'const', scopes: ['source.js', 'storage.type.const.js']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.js']
      expect(tokens[2]).toEqual value: 'myCoolVar', scopes: ['source.js', 'constant.other.js']
      expect(tokens[3]).toEqual value: ' ', scopes: ['source.js']
      expect(tokens[4]).toEqual value: '=', scopes: ['source.js', 'keyword.operator.assignment.js']
      expect(tokens[5]).toEqual value: ' ', scopes: ['source.js']
      expect(tokens[6]).toEqual value: '42', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[7]).toEqual value: ';', scopes: ['source.js', 'punctuation.terminator.statement.js']

      lines = grammar.tokenizeLines """
        const a,
        b,
        c
        if(a)
      """
      expect(lines[0][0]).toEqual value: 'const', scopes: ['source.js', 'storage.type.const.js']
      expect(lines[0][1]).toEqual value: ' ', scopes: ['source.js']
      expect(lines[0][2]).toEqual value: 'a', scopes: ['source.js', 'constant.other.js']
      expect(lines[0][3]).toEqual value: ',', scopes: ['source.js', 'meta.delimiter.object.comma.js']
      expect(lines[1][0]).toEqual value: 'b', scopes: ['source.js', 'constant.other.js']
      expect(lines[1][1]).toEqual value: ',', scopes: ['source.js', 'meta.delimiter.object.comma.js']
      expect(lines[2][0]).toEqual value: 'c', scopes: ['source.js', 'constant.other.js']
      expect(lines[3][0]).toEqual value: 'if', scopes: ['source.js', 'keyword.control.js']
      expect(lines[3][1]).toEqual value: '(', scopes: ['source.js', 'meta.brace.round.js']
      expect(lines[3][2]).toEqual value: 'a', scopes: ['source.js']
      expect(lines[3][3]).toEqual value: ')', scopes: ['source.js', 'meta.brace.round.js']

      lines = grammar.tokenizeLines """
        const {
          a,
          b,
          c,
        } = foo
      """
      expect(lines[0][0]).toEqual value: 'const', scopes: ['source.js', 'storage.type.const.js']
      expect(lines[0][1]).toEqual value: ' ', scopes: ['source.js']
      expect(lines[0][2]).toEqual value: '{', scopes: ['source.js', 'meta.brace.curly.js']
      expect(lines[1][0]).toEqual value: '  ', scopes: ['source.js']
      expect(lines[1][1]).toEqual value: 'a', scopes: ['source.js', 'constant.other.js']
      expect(lines[1][2]).toEqual value: ',', scopes: ['source.js', 'meta.delimiter.object.comma.js']
      expect(lines[2][0]).toEqual value: '  ', scopes: ['source.js']
      expect(lines[2][1]).toEqual value: 'b', scopes: ['source.js', 'constant.other.js']
      expect(lines[2][2]).toEqual value: ',', scopes: ['source.js', 'meta.delimiter.object.comma.js']
      expect(lines[3][0]).toEqual value: '  ', scopes: ['source.js']
      expect(lines[3][1]).toEqual value: 'c', scopes: ['source.js', 'constant.other.js']
      expect(lines[4][0]).toEqual value: '}', scopes: ['source.js', 'meta.brace.curly.js']
      expect(lines[4][1]).toEqual value: ' ', scopes: ['source.js']
      expect(lines[4][2]).toEqual value: '=', scopes: ['source.js', 'keyword.operator.assignment.js']
      expect(lines[4][3]).toEqual value: ' foo', scopes: ['source.js']

      {tokens} = grammar.tokenizeLine('(const hi);')
      expect(tokens[0]).toEqual value: '(', scopes: ['source.js', 'meta.brace.round.js']
      expect(tokens[1]).toEqual value: 'const', scopes: ['source.js', 'storage.type.const.js']
      expect(tokens[2]).toEqual value: ' ', scopes: ['source.js']
      expect(tokens[3]).toEqual value: 'hi', scopes: ['source.js', 'constant.other.js']
      expect(tokens[4]).toEqual value: ')', scopes: ['source.js', 'meta.brace.round.js']
      expect(tokens[5]).toEqual value: ';', scopes: ['source.js', 'punctuation.terminator.statement.js']

      {tokens} = grammar.tokenizeLine('const {first:f,second,...rest} = obj;')
      expect(tokens[0]).toEqual value: 'const', scopes: ['source.js', 'storage.type.const.js']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.js']
      expect(tokens[2]).toEqual value: '{', scopes: ['source.js', 'meta.brace.curly.js']
      expect(tokens[3]).toEqual value: 'first', scopes: ['source.js']
      expect(tokens[4]).toEqual value: ':', scopes: ['source.js', 'keyword.operator.assignment.js']
      expect(tokens[5]).toEqual value: 'f', scopes: ['source.js', 'constant.other.js']
      expect(tokens[6]).toEqual value: ',', scopes: ['source.js', 'meta.delimiter.object.comma.js']
      expect(tokens[7]).toEqual value: 'second', scopes: ['source.js', 'constant.other.js']
      expect(tokens[8]).toEqual value: ',', scopes: ['source.js', 'meta.delimiter.object.comma.js']
      expect(tokens[9]).toEqual value: '...', scopes: ['source.js', 'keyword.operator.spread.js']
      expect(tokens[10]).toEqual value: 'rest', scopes: ['source.js', 'constant.other.js']
      expect(tokens[11]).toEqual value: '}', scopes: ['source.js', 'meta.brace.curly.js']
      expect(tokens[12]).toEqual value: ' ', scopes: ['source.js']
      expect(tokens[13]).toEqual value: '=', scopes: ['source.js', 'keyword.operator.assignment.js']
      expect(tokens[14]).toEqual value: ' obj', scopes: ['source.js']
      expect(tokens[15]).toEqual value: ';', scopes: ['source.js', 'punctuation.terminator.statement.js']

      {tokens} = grammar.tokenizeLine('const c = /regex/;')
      expect(tokens[0]).toEqual value: 'const', scopes: ['source.js', 'storage.type.const.js']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.js']
      expect(tokens[2]).toEqual value: 'c', scopes: ['source.js', 'constant.other.js']
      expect(tokens[3]).toEqual value: ' ', scopes: ['source.js']
      expect(tokens[4]).toEqual value: '=', scopes: ['source.js', 'keyword.operator.assignment.js']
      expect(tokens[5]).toEqual value: ' ', scopes: ['source.js', 'string.regexp.js']
      expect(tokens[6]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.begin.js']
      expect(tokens[7]).toEqual value: 'regex', scopes: ['source.js', 'string.regexp.js']
      expect(tokens[8]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.end.js']
      expect(tokens[9]).toEqual value: ';', scopes: ['source.js', 'punctuation.terminator.statement.js']

    it "tokenizes variables declared with `const` in for-in and for-of loops", ->
      {tokens} = grammar.tokenizeLine 'for (const elem of array) {'
      expect(tokens[0]).toEqual value: 'for', scopes: ['source.js', 'keyword.control.js']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.js']
      expect(tokens[2]).toEqual value: '(', scopes: ['source.js', 'meta.brace.round.js']
      expect(tokens[3]).toEqual value: 'const', scopes: ['source.js', 'storage.type.const.js']
      expect(tokens[4]).toEqual value: ' ', scopes: ['source.js']
      expect(tokens[5]).toEqual value: 'elem', scopes: ['source.js', 'constant.other.js']
      expect(tokens[6]).toEqual value: ' ', scopes: ['source.js']
      expect(tokens[7]).toEqual value: 'of', scopes: ['source.js', 'keyword.operator.of.js']
      expect(tokens[8]).toEqual value: ' array', scopes: ['source.js']
      expect(tokens[9]).toEqual value: ')', scopes: ['source.js', 'meta.brace.round.js']

      {tokens} = grammar.tokenizeLine 'for (const name in object) {'
      expect(tokens[5]).toEqual value: 'name', scopes: ['source.js', 'constant.other.js']
      expect(tokens[6]).toEqual value: ' ', scopes: ['source.js']
      expect(tokens[7]).toEqual value: 'in', scopes: ['source.js', 'keyword.operator.in.js']
      expect(tokens[8]).toEqual value: ' object', scopes: ['source.js']

      {tokens} = grammar.tokenizeLine 'const index = 0;'
      expect(tokens[0]).toEqual value: 'const', scopes: ['source.js', 'storage.type.const.js']
      expect(tokens[2]).toEqual value: 'index', scopes: ['source.js', 'constant.other.js']
      expect(tokens[4]).toEqual value: '=', scopes: ['source.js', 'keyword.operator.assignment.js']

      {tokens} = grammar.tokenizeLine 'const offset = 0;'
      expect(tokens[0]).toEqual value: 'const', scopes: ['source.js', 'storage.type.const.js']
      expect(tokens[2]).toEqual value: 'offset', scopes: ['source.js', 'constant.other.js']
      expect(tokens[4]).toEqual value: '=', scopes: ['source.js', 'keyword.operator.assignment.js']

    it "tokenizes support constants", ->
      {tokens} = grammar.tokenizeLine('awesome = cool.EPSILON;')
      expect(tokens[0]).toEqual value: 'awesome ', scopes: ['source.js']
      expect(tokens[1]).toEqual value: '=', scopes: ['source.js', 'keyword.operator.assignment.js']
      expect(tokens[3]).toEqual value: 'cool', scopes: ['source.js', 'variable.other.object.js']
      expect(tokens[4]).toEqual value: '.', scopes: ['source.js', 'meta.delimiter.property.period.js']
      expect(tokens[5]).toEqual value: 'EPSILON', scopes: ['source.js', 'support.constant.js']
      expect(tokens[6]).toEqual value: ';', scopes: ['source.js', 'punctuation.terminator.statement.js']

    it "tokenizes constants in the middle of ternary expressions", ->
      {tokens} = grammar.tokenizeLine('a ? FOO : b')
      expect(tokens[3]).toEqual value: 'FOO', scopes: ['source.js', 'constant.other.js']

    it "tokenizes constants at the end of ternary expressions", ->
      {tokens} = grammar.tokenizeLine('a ? b : FOO')
      expect(tokens[7]).toEqual value: 'FOO', scopes: ['source.js', 'constant.other.js']

  describe "ES6 string templates", ->
    it "tokenizes them as strings", ->
      {tokens} = grammar.tokenizeLine('`hey ${name}`')
      expect(tokens[0]).toEqual value: '`', scopes: ['source.js', 'string.quoted.template.js', 'punctuation.definition.string.begin.js']
      expect(tokens[1]).toEqual value: 'hey ', scopes: ['source.js', 'string.quoted.template.js']
      expect(tokens[2]).toEqual value: '${', scopes: ['source.js', 'string.quoted.template.js', 'source.js.embedded.source', 'punctuation.section.embedded.js']
      expect(tokens[3]).toEqual value: 'name', scopes: ['source.js', 'string.quoted.template.js', 'source.js.embedded.source']
      expect(tokens[4]).toEqual value: '}', scopes: ['source.js', 'string.quoted.template.js', 'source.js.embedded.source', 'punctuation.section.embedded.js']
      expect(tokens[5]).toEqual value: '`', scopes: ['source.js', 'string.quoted.template.js', 'punctuation.definition.string.end.js']

      {tokens} = grammar.tokenizeLine('`hey ${() => {return hi;}}`')
      expect(tokens[0]).toEqual value: '`', scopes: ['source.js', 'string.quoted.template.js', 'punctuation.definition.string.begin.js']
      expect(tokens[1]).toEqual value: 'hey ', scopes: ['source.js', 'string.quoted.template.js']
      expect(tokens[2]).toEqual value: '${', scopes: ['source.js', 'string.quoted.template.js', 'source.js.embedded.source', 'punctuation.section.embedded.js']
      expect(tokens[3]).toEqual value: '(', scopes: ['source.js', 'string.quoted.template.js', 'source.js.embedded.source', 'meta.function.arrow.js', 'meta.parameters.js', 'punctuation.definition.parameters.begin.bracket.round.js']
      expect(tokens[4]).toEqual value: ')', scopes: ['source.js', 'string.quoted.template.js', 'source.js.embedded.source', 'meta.function.arrow.js', 'meta.parameters.js', 'punctuation.definition.parameters.end.bracket.round.js']
      expect(tokens[6]).toEqual value: '=>', scopes: ['source.js', 'string.quoted.template.js', 'source.js.embedded.source', 'meta.function.arrow.js', 'storage.type.function.arrow.js']
      expect(tokens[8]).toEqual value: '{', scopes: ['source.js', 'string.quoted.template.js', 'source.js.embedded.source', 'punctuation.definition.function.body.begin.bracket.curly.js']
      expect(tokens[9]).toEqual value: 'return', scopes: ['source.js', 'string.quoted.template.js', 'source.js.embedded.source', 'keyword.control.js']
      expect(tokens[10]).toEqual value: ' hi', scopes: ['source.js', 'string.quoted.template.js', 'source.js.embedded.source']
      expect(tokens[11]).toEqual value: ';', scopes: ['source.js', 'string.quoted.template.js', 'source.js.embedded.source', 'punctuation.terminator.statement.js']
      expect(tokens[12]).toEqual value: '}', scopes: ['source.js', 'string.quoted.template.js', 'source.js.embedded.source', 'punctuation.definition.function.body.end.bracket.curly.js']
      expect(tokens[13]).toEqual value: '}', scopes: ['source.js', 'string.quoted.template.js', 'source.js.embedded.source', 'punctuation.section.embedded.js']
      expect(tokens[14]).toEqual value: '`', scopes: ['source.js', 'string.quoted.template.js', 'punctuation.definition.string.end.js']

  describe "HTML template strings", ->
    # TODO: Remove after Atom 1.21 is released
    [tagScope, entityScope] = []
    if parseFloat(atom.getVersion()) <= 1.21
      tagScope = 'meta.tag.inline.any.html'
      entityScope = 'entity.name.tag.inline.any.html'
    else
      tagScope = 'meta.tag.inline.b.html'
      entityScope = 'entity.name.tag.inline.b.html'

    beforeEach ->
      waitsForPromise ->
        atom.packages.activatePackage("language-html")

    it "tokenizes ES6 tagged HTML string templates", ->
      {tokens} = grammar.tokenizeLine('html`hey <b>${name}</b>`')
      expect(tokens[0]).toEqual value: 'html', scopes: ['source.js', 'string.quoted.template.html.js', 'entity.name.function.js']
      expect(tokens[1]).toEqual value: '`', scopes: ['source.js', 'string.quoted.template.html.js', 'punctuation.definition.string.begin.js']
      expect(tokens[2]).toEqual value: 'hey ', scopes: ['source.js', 'string.quoted.template.html.js']
      expect(tokens[3]).toEqual value: '<', scopes: ['source.js', 'string.quoted.template.html.js', tagScope, 'punctuation.definition.tag.begin.html']
      expect(tokens[4]).toEqual value: 'b', scopes: ['source.js', 'string.quoted.template.html.js', tagScope, entityScope]
      expect(tokens[5]).toEqual value: '>', scopes: ['source.js', 'string.quoted.template.html.js', tagScope, 'punctuation.definition.tag.end.html']
      expect(tokens[6]).toEqual value: '${', scopes: ['source.js', 'string.quoted.template.html.js', 'source.js.embedded.source', 'punctuation.section.embedded.js']
      expect(tokens[7]).toEqual value: 'name', scopes: ['source.js', 'string.quoted.template.html.js', 'source.js.embedded.source']
      expect(tokens[8]).toEqual value: '}', scopes: ['source.js', 'string.quoted.template.html.js', 'source.js.embedded.source', 'punctuation.section.embedded.js']
      expect(tokens[9]).toEqual value: '</', scopes: ['source.js', 'string.quoted.template.html.js', tagScope, 'punctuation.definition.tag.begin.html']
      expect(tokens[10]).toEqual value: 'b', scopes: ['source.js', 'string.quoted.template.html.js', tagScope, entityScope]
      expect(tokens[11]).toEqual value: '>', scopes: ['source.js', 'string.quoted.template.html.js', tagScope, 'punctuation.definition.tag.end.html']
      expect(tokens[12]).toEqual value: '`', scopes: ['source.js', 'string.quoted.template.html.js', 'punctuation.definition.string.end.js']

    it "tokenizes innerHTML attribute declarations with string template tags", ->
      {tokens} = grammar.tokenizeLine('text.innerHTML = `hey <b>${name}</b>`')
      expect(tokens[0]).toEqual value: 'text', scopes: ['source.js', 'variable.other.object.js']
      expect(tokens[1]).toEqual value: '.', scopes: ['source.js', 'meta.delimiter.property.period.js']
      expect(tokens[2]).toEqual value: 'innerHTML', scopes: ['source.js', 'variable.other.property.js']
      expect(tokens[3]).toEqual value: ' ', scopes: ['source.js']
      expect(tokens[4]).toEqual value: '=', scopes: ['source.js', 'keyword.operator.assignment.js']
      expect(tokens[5]).toEqual value: ' ', scopes: ['source.js']
      expect(tokens[6]).toEqual value: '`', scopes: ['source.js', 'string.quoted.template.html.js', 'punctuation.definition.string.begin.js']
      expect(tokens[7]).toEqual value: 'hey ', scopes: ['source.js', 'string.quoted.template.html.js']
      expect(tokens[8]).toEqual value: '<', scopes: ['source.js', 'string.quoted.template.html.js', tagScope, 'punctuation.definition.tag.begin.html']
      expect(tokens[9]).toEqual value: 'b', scopes: ['source.js', 'string.quoted.template.html.js', tagScope, entityScope]
      expect(tokens[10]).toEqual value: '>', scopes: ['source.js', 'string.quoted.template.html.js', tagScope, 'punctuation.definition.tag.end.html']
      expect(tokens[11]).toEqual value: '${', scopes: ['source.js', 'string.quoted.template.html.js', 'source.js.embedded.source', 'punctuation.section.embedded.js']
      expect(tokens[12]).toEqual value: 'name', scopes: ['source.js', 'string.quoted.template.html.js', 'source.js.embedded.source']
      expect(tokens[13]).toEqual value: '}', scopes: ['source.js', 'string.quoted.template.html.js', 'source.js.embedded.source', 'punctuation.section.embedded.js']
      expect(tokens[14]).toEqual value: '</', scopes: ['source.js', 'string.quoted.template.html.js', tagScope, 'punctuation.definition.tag.begin.html']
      expect(tokens[15]).toEqual value: 'b', scopes: ['source.js', 'string.quoted.template.html.js', tagScope, entityScope]
      expect(tokens[16]).toEqual value: '>', scopes: ['source.js', 'string.quoted.template.html.js', tagScope, 'punctuation.definition.tag.end.html']
      expect(tokens[17]).toEqual value: '`', scopes: ['source.js', 'string.quoted.template.html.js', 'punctuation.definition.string.end.js']

    it "tokenizes ES6 tagged HTML string templates with expanded function name", ->
      {tokens} = grammar.tokenizeLine('escapeHTML`hey <b>${name}</b>`')
      expect(tokens[0]).toEqual value: 'escapeHTML', scopes: ['source.js', 'string.quoted.template.html.js', 'entity.name.function.js']
      expect(tokens[1]).toEqual value: '`', scopes: ['source.js', 'string.quoted.template.html.js', 'punctuation.definition.string.begin.js']
      expect(tokens[2]).toEqual value: 'hey ', scopes: ['source.js', 'string.quoted.template.html.js']
      expect(tokens[3]).toEqual value: '<', scopes: ['source.js', 'string.quoted.template.html.js', tagScope, 'punctuation.definition.tag.begin.html']
      expect(tokens[4]).toEqual value: 'b', scopes: ['source.js', 'string.quoted.template.html.js', tagScope, entityScope]
      expect(tokens[5]).toEqual value: '>', scopes: ['source.js', 'string.quoted.template.html.js', tagScope, 'punctuation.definition.tag.end.html']
      expect(tokens[6]).toEqual value: '${', scopes: ['source.js', 'string.quoted.template.html.js', 'source.js.embedded.source', 'punctuation.section.embedded.js']
      expect(tokens[7]).toEqual value: 'name', scopes: ['source.js', 'string.quoted.template.html.js', 'source.js.embedded.source']
      expect(tokens[8]).toEqual value: '}', scopes: ['source.js', 'string.quoted.template.html.js', 'source.js.embedded.source', 'punctuation.section.embedded.js']
      expect(tokens[9]).toEqual value: '</', scopes: ['source.js', 'string.quoted.template.html.js', tagScope, 'punctuation.definition.tag.begin.html']
      expect(tokens[10]).toEqual value: 'b', scopes: ['source.js', 'string.quoted.template.html.js', tagScope, entityScope]
      expect(tokens[11]).toEqual value: '>', scopes: ['source.js', 'string.quoted.template.html.js', tagScope, 'punctuation.definition.tag.end.html']
      expect(tokens[12]).toEqual value: '`', scopes: ['source.js', 'string.quoted.template.html.js', 'punctuation.definition.string.end.js']

    it "tokenizes ES6 tagged HTML string templates with expanded function name and white space", ->
      {tokens} = grammar.tokenizeLine('escapeHTML   `hey <b>${name}</b>`')
      expect(tokens[0]).toEqual value: 'escapeHTML', scopes: ['source.js', 'string.quoted.template.html.js', 'entity.name.function.js']
      expect(tokens[1]).toEqual value: '   ', scopes: ['source.js', 'string.quoted.template.html.js']
      expect(tokens[2]).toEqual value: '`', scopes: ['source.js', 'string.quoted.template.html.js', 'punctuation.definition.string.begin.js']
      expect(tokens[3]).toEqual value: 'hey ', scopes: ['source.js', 'string.quoted.template.html.js']
      expect(tokens[4]).toEqual value: '<', scopes: ['source.js', 'string.quoted.template.html.js', tagScope, 'punctuation.definition.tag.begin.html']
      expect(tokens[5]).toEqual value: 'b', scopes: ['source.js', 'string.quoted.template.html.js', tagScope, entityScope]
      expect(tokens[6]).toEqual value: '>', scopes: ['source.js', 'string.quoted.template.html.js', tagScope, 'punctuation.definition.tag.end.html']
      expect(tokens[7]).toEqual value: '${', scopes: ['source.js', 'string.quoted.template.html.js', 'source.js.embedded.source', 'punctuation.section.embedded.js']
      expect(tokens[8]).toEqual value: 'name', scopes: ['source.js', 'string.quoted.template.html.js', 'source.js.embedded.source']
      expect(tokens[9]).toEqual value: '}', scopes: ['source.js', 'string.quoted.template.html.js', 'source.js.embedded.source', 'punctuation.section.embedded.js']
      expect(tokens[10]).toEqual value: '</', scopes: ['source.js', 'string.quoted.template.html.js', tagScope, 'punctuation.definition.tag.begin.html']
      expect(tokens[11]).toEqual value: 'b', scopes: ['source.js', 'string.quoted.template.html.js', tagScope, entityScope]
      expect(tokens[12]).toEqual value: '>', scopes: ['source.js', 'string.quoted.template.html.js', tagScope, 'punctuation.definition.tag.end.html']
      expect(tokens[13]).toEqual value: '`', scopes: ['source.js', 'string.quoted.template.html.js', 'punctuation.definition.string.end.js']

  describe "ES6 tagged Relay.QL string templates", ->
    it "tokenizes them as strings", ->
      {tokens} = grammar.tokenizeLine('Relay.QL`fragment on Foo { id }`')
      expect(tokens[0]).toEqual value: 'Relay.QL', scopes: ['source.js', 'string.quoted.template.graphql.js', 'entity.name.function.js']
      expect(tokens[1]).toEqual value: '`', scopes: ['source.js', 'string.quoted.template.graphql.js', 'punctuation.definition.string.begin.js']
      expect(tokens[2]).toEqual value: 'fragment on Foo { id }', scopes: ['source.js', 'string.quoted.template.graphql.js']
      expect(tokens[3]).toEqual value: '`', scopes: ['source.js', 'string.quoted.template.graphql.js', 'punctuation.definition.string.end.js']

  describe "ES6 tagged Relay.QL string templates with interpolation", ->
    it "tokenizes them as strings", ->
      {tokens} = grammar.tokenizeLine('Relay.QL`fragment on Foo { ${myFragment} }`')
      expect(tokens[0]).toEqual value: 'Relay.QL', scopes: ['source.js', 'string.quoted.template.graphql.js', 'entity.name.function.js']
      expect(tokens[1]).toEqual value: '`', scopes: ['source.js', 'string.quoted.template.graphql.js', 'punctuation.definition.string.begin.js']
      expect(tokens[2]).toEqual value: 'fragment on Foo { ', scopes: ['source.js', 'string.quoted.template.graphql.js']
      expect(tokens[3]).toEqual value: '${', scopes: ['source.js', 'string.quoted.template.graphql.js', 'source.js.embedded.source', 'punctuation.section.embedded.js']
      expect(tokens[4]).toEqual value: 'myFragment', scopes: ['source.js', 'string.quoted.template.graphql.js', 'source.js.embedded.source']
      expect(tokens[5]).toEqual value: '}', scopes: ['source.js', 'string.quoted.template.graphql.js', 'source.js.embedded.source', 'punctuation.section.embedded.js']
      expect(tokens[6]).toEqual value: ' }', scopes: ['source.js', 'string.quoted.template.graphql.js']
      expect(tokens[7]).toEqual value: '`', scopes: ['source.js', 'string.quoted.template.graphql.js', 'punctuation.definition.string.end.js']

  describe "ES6 tagged gql string templates", ->
    it "tokenizes them as strings", ->
      {tokens} = grammar.tokenizeLine('gql`fragment on Foo { id }`')
      expect(tokens[0]).toEqual value: 'gql', scopes: ['source.js', 'string.quoted.template.graphql.js', 'entity.name.function.js']
      expect(tokens[1]).toEqual value: '`', scopes: ['source.js', 'string.quoted.template.graphql.js', 'punctuation.definition.string.begin.js']
      expect(tokens[2]).toEqual value: 'fragment on Foo { id }', scopes: ['source.js', 'string.quoted.template.graphql.js']
      expect(tokens[3]).toEqual value: '`', scopes: ['source.js', 'string.quoted.template.graphql.js', 'punctuation.definition.string.end.js']

  describe "ES6 tagged SQL string templates", ->
    it "tokenizes them as strings", ->
      {tokens} = grammar.tokenizeLine('SQL`SELECT foo FROM bar WHERE id = :id`')
      expect(tokens[0]).toEqual value: 'SQL', scopes: ['source.js', 'string.quoted.template.sql.js', 'entity.name.function.js']
      expect(tokens[1]).toEqual value: '`', scopes: ['source.js', 'string.quoted.template.sql.js', 'punctuation.definition.string.begin.js']
      expect(tokens[2]).toEqual value: 'SELECT foo FROM bar WHERE id = :id', scopes: ['source.js', 'string.quoted.template.sql.js']
      expect(tokens[3]).toEqual value: '`', scopes: ['source.js', 'string.quoted.template.sql.js', 'punctuation.definition.string.end.js']

  describe "ES6 tagged SQL string templates with interpolation", ->
    it "tokenizes them as strings", ->
      {tokens} = grammar.tokenizeLine('SQL`SELECT foo FROM bar WHERE id = ${id}`')
      expect(tokens[0]).toEqual value: 'SQL', scopes: ['source.js', 'string.quoted.template.sql.js', 'entity.name.function.js']
      expect(tokens[1]).toEqual value: '`', scopes: ['source.js', 'string.quoted.template.sql.js', 'punctuation.definition.string.begin.js']
      expect(tokens[2]).toEqual value: 'SELECT foo FROM bar WHERE id = ', scopes: ['source.js', 'string.quoted.template.sql.js']
      expect(tokens[3]).toEqual value: '${', scopes: ['source.js', 'string.quoted.template.sql.js', 'source.js.embedded.source', 'punctuation.section.embedded.js']
      expect(tokens[4]).toEqual value: 'id', scopes: ['source.js', 'string.quoted.template.sql.js', 'source.js.embedded.source']
      expect(tokens[5]).toEqual value: '}', scopes: ['source.js', 'string.quoted.template.sql.js', 'source.js.embedded.source', 'punctuation.section.embedded.js']
      expect(tokens[6]).toEqual value: '`', scopes: ['source.js', 'string.quoted.template.sql.js', 'punctuation.definition.string.end.js']

  describe "ES6 class", ->
    it "tokenizes class", ->
      {tokens} = grammar.tokenizeLine('class MyClass')
      expect(tokens[0]).toEqual value: 'class', scopes: ['source.js', 'meta.class.js', 'storage.type.class.js']
      expect(tokens[2]).toEqual value: 'MyClass', scopes: ['source.js', 'meta.class.js', 'entity.name.type.class.js']

      {tokens} = grammar.tokenizeLine('class $abc$')
      expect(tokens[2]).toEqual value: '$abc$', scopes: ['source.js', 'meta.class.js', 'entity.name.type.class.js']

      {tokens} = grammar.tokenizeLine('class $$')
      expect(tokens[2]).toEqual value: '$$', scopes: ['source.js', 'meta.class.js', 'entity.name.type.class.js']

    it "tokenizes class...extends", ->
      {tokens} = grammar.tokenizeLine('class MyClass extends SomeClass')
      expect(tokens[0]).toEqual value: 'class', scopes: ['source.js', 'meta.class.js', 'storage.type.class.js']
      expect(tokens[2]).toEqual value: 'MyClass', scopes: ['source.js', 'meta.class.js', 'entity.name.type.class.js']
      expect(tokens[4]).toEqual value: 'extends', scopes: ['source.js', 'meta.class.js', 'storage.modifier.js']
      expect(tokens[6]).toEqual value: 'SomeClass', scopes: ['source.js', 'meta.class.js', 'entity.other.inherited-class.js']

      {tokens} = grammar.tokenizeLine('class MyClass extends $abc$')
      expect(tokens[6]).toEqual value: '$abc$', scopes: ['source.js', 'meta.class.js', 'entity.other.inherited-class.js']

      {tokens} = grammar.tokenizeLine('class MyClass extends $$')
      expect(tokens[6]).toEqual value: '$$', scopes: ['source.js', 'meta.class.js', 'entity.other.inherited-class.js']

    it "tokenizes anonymous class", ->
      {tokens} = grammar.tokenizeLine('class extends SomeClass')
      expect(tokens[0]).toEqual value: 'class', scopes: ['source.js', 'meta.class.js', 'storage.type.class.js']
      expect(tokens[2]).toEqual value: 'extends', scopes: ['source.js', 'meta.class.js', 'storage.modifier.js']
      expect(tokens[4]).toEqual value: 'SomeClass', scopes: ['source.js', 'meta.class.js', 'entity.other.inherited-class.js']

      {tokens} = grammar.tokenizeLine('class extends $abc$')
      expect(tokens[4]).toEqual value: '$abc$', scopes: ['source.js', 'meta.class.js', 'entity.other.inherited-class.js']

      {tokens} = grammar.tokenizeLine('class extends $$')
      expect(tokens[4]).toEqual value: '$$', scopes: ['source.js', 'meta.class.js', 'entity.other.inherited-class.js']

  describe "ES6 import", ->
    it "tokenizes import", ->
      {tokens} = grammar.tokenizeLine('import "module-name";')
      expect(tokens[0]).toEqual value: 'import', scopes: ['source.js', 'meta.import.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: '"', scopes: ['source.js', 'meta.import.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']
      expect(tokens[3]).toEqual value: 'module-name', scopes: ['source.js', 'meta.import.js', 'string.quoted.double.js']
      expect(tokens[4]).toEqual value: '"', scopes: ['source.js', 'meta.import.js', 'string.quoted.double.js', 'punctuation.definition.string.end.js']
      expect(tokens[5]).toEqual value: ';', scopes: ['source.js', 'punctuation.terminator.statement.js']

    it "tokenizes default import", ->
      {tokens} = grammar.tokenizeLine('import defaultMember from "module-name";')
      expect(tokens[0]).toEqual value: 'import', scopes: ['source.js', 'meta.import.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: 'defaultMember', scopes: ['source.js', 'meta.import.js', 'variable.other.module.js']
      expect(tokens[4]).toEqual value: 'from', scopes: ['source.js', 'meta.import.js', 'keyword.control.js']

    it "tokenizes default named import", ->
      {tokens} = grammar.tokenizeLine('import { default as defaultMember } from "module-name";')
      expect(tokens[0]).toEqual value: 'import', scopes: ['source.js', 'meta.import.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: '{', scopes: ['source.js', 'meta.import.js', 'punctuation.definition.modules.begin.js']
      expect(tokens[4]).toEqual value: 'default', scopes: ['source.js', 'meta.import.js', 'variable.language.default.js']
      expect(tokens[6]).toEqual value: 'as', scopes: ['source.js', 'meta.import.js', 'keyword.control.js']
      expect(tokens[8]).toEqual value: 'defaultMember', scopes: ['source.js', 'meta.import.js', 'variable.other.module-alias.js']
      expect(tokens[10]).toEqual value: '}', scopes: ['source.js', 'meta.import.js', 'punctuation.definition.modules.end.js']
      expect(tokens[12]).toEqual value: 'from', scopes: ['source.js', 'meta.import.js', 'keyword.control.js']

    it "tokenizes named import", ->
      {tokens} = grammar.tokenizeLine('import { member } from "module-name";')
      expect(tokens[0]).toEqual value: 'import', scopes: ['source.js', 'meta.import.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: '{', scopes: ['source.js', 'meta.import.js', 'punctuation.definition.modules.begin.js']
      expect(tokens[4]).toEqual value: 'member', scopes: ['source.js', 'meta.import.js', 'variable.other.module.js']
      expect(tokens[6]).toEqual value: '}', scopes: ['source.js', 'meta.import.js', 'punctuation.definition.modules.end.js']
      expect(tokens[8]).toEqual value: 'from', scopes: ['source.js', 'meta.import.js', 'keyword.control.js']

      {tokens} = grammar.tokenizeLine('import { member1 , member2 as alias2 } from "module-name";')
      expect(tokens[0]).toEqual value: 'import', scopes: ['source.js', 'meta.import.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: '{', scopes: ['source.js', 'meta.import.js', 'punctuation.definition.modules.begin.js']
      expect(tokens[4]).toEqual value: 'member1', scopes: ['source.js', 'meta.import.js', 'variable.other.module.js']
      expect(tokens[6]).toEqual value: ',', scopes: ['source.js', 'meta.import.js', 'meta.delimiter.object.comma.js']
      expect(tokens[8]).toEqual value: 'member2', scopes: ['source.js', 'meta.import.js', 'variable.other.module.js']
      expect(tokens[10]).toEqual value: 'as', scopes: ['source.js', 'meta.import.js', 'keyword.control.js']
      expect(tokens[12]).toEqual value: 'alias2', scopes: ['source.js', 'meta.import.js', 'variable.other.module-alias.js']
      expect(tokens[14]).toEqual value: '}', scopes: ['source.js', 'meta.import.js', 'punctuation.definition.modules.end.js']
      expect(tokens[16]).toEqual value: 'from', scopes: ['source.js', 'meta.import.js', 'keyword.control.js']

    it "tokenizes entire module import", ->
      {tokens} = grammar.tokenizeLine('import * as name from "module-name";')
      expect(tokens[0]).toEqual value: 'import', scopes: ['source.js', 'meta.import.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: '*', scopes: ['source.js', 'meta.import.js', 'variable.language.import-all.js']
      expect(tokens[4]).toEqual value: 'as', scopes: ['source.js', 'meta.import.js', 'keyword.control.js']
      expect(tokens[6]).toEqual value: 'name', scopes: ['source.js', 'meta.import.js', 'variable.other.module-alias.js']
      expect(tokens[8]).toEqual value: 'from', scopes: ['source.js', 'meta.import.js', 'keyword.control.js']

    it "tokenizes `import defaultMember, { member } from 'module-name';`", ->
      {tokens} = grammar.tokenizeLine('import defaultMember, { member } from "module-name";')
      expect(tokens[0]).toEqual value: 'import', scopes: ['source.js', 'meta.import.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: 'defaultMember', scopes: ['source.js', 'meta.import.js', 'variable.other.module.js']
      expect(tokens[3]).toEqual value: ',', scopes: ['source.js', 'meta.import.js', 'meta.delimiter.object.comma.js']
      expect(tokens[5]).toEqual value: '{', scopes: ['source.js', 'meta.import.js', 'punctuation.definition.modules.begin.js']
      expect(tokens[7]).toEqual value: 'member', scopes: ['source.js', 'meta.import.js', 'variable.other.module.js']
      expect(tokens[9]).toEqual value: '}', scopes: ['source.js', 'meta.import.js', 'punctuation.definition.modules.end.js']
      expect(tokens[11]).toEqual value: 'from', scopes: ['source.js', 'meta.import.js', 'keyword.control.js']

    it "tokenizes `import defaultMember, * as alias from 'module-name';", ->
      {tokens} = grammar.tokenizeLine('import defaultMember, * as alias from "module-name";')
      expect(tokens[0]).toEqual value: 'import', scopes: ['source.js', 'meta.import.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: 'defaultMember', scopes: ['source.js', 'meta.import.js', 'variable.other.module.js']
      expect(tokens[3]).toEqual value: ',', scopes: ['source.js', 'meta.import.js', 'meta.delimiter.object.comma.js']
      expect(tokens[5]).toEqual value: '*', scopes: ['source.js', 'meta.import.js', 'variable.language.import-all.js']
      expect(tokens[7]).toEqual value: 'as', scopes: ['source.js', 'meta.import.js', 'keyword.control.js']
      expect(tokens[9]).toEqual value: 'alias', scopes: ['source.js', 'meta.import.js', 'variable.other.module-alias.js']
      expect(tokens[11]).toEqual value: 'from', scopes: ['source.js', 'meta.import.js', 'keyword.control.js']

    it "tokenizes comments in statement", ->
      lines = grammar.tokenizeLines '''
        import /* comment */ {
          member1, // comment
          /* comment */
          member2
        } from "module-name";
      '''
      expect(lines[0][2]).toEqual value: '/*', scopes: ['source.js', 'meta.import.js', 'comment.block.js', 'punctuation.definition.comment.begin.js']
      expect(lines[0][3]).toEqual value: ' comment ', scopes: ['source.js', 'meta.import.js', 'comment.block.js']
      expect(lines[0][4]).toEqual value: '*/', scopes: ['source.js', 'meta.import.js', 'comment.block.js', 'punctuation.definition.comment.end.js']
      expect(lines[1][4]).toEqual value: '//', scopes: ['source.js', 'meta.import.js', 'comment.line.double-slash.js', 'punctuation.definition.comment.js']
      expect(lines[1][5]).toEqual value: ' comment', scopes: ['source.js', 'meta.import.js', 'comment.line.double-slash.js']
      expect(lines[2][1]).toEqual value: '/*', scopes: ['source.js', 'meta.import.js', 'comment.block.js', 'punctuation.definition.comment.begin.js']
      expect(lines[2][2]).toEqual value: ' comment ', scopes: ['source.js', 'meta.import.js', 'comment.block.js']
      expect(lines[2][3]).toEqual value: '*/', scopes: ['source.js', 'meta.import.js', 'comment.block.js', 'punctuation.definition.comment.end.js']

      # https://github.com/atom/language-javascript/issues/485
      lines = grammar.tokenizeLines '''
        import a from 'a' //
        import b from 'b'
      '''
      expect(lines[0][10]).toEqual value: '//', scopes: ['source.js', 'meta.import.js', 'comment.line.double-slash.js', 'punctuation.definition.comment.js']
      expect(lines[1][0]).toEqual value: 'import', scopes: ['source.js', 'meta.import.js', 'keyword.control.js']

  describe "ES6 export", ->
    it "tokenizes named export", ->
      {tokens} = grammar.tokenizeLine('export var x = 0;')
      expect(tokens[0]).toEqual value: 'export', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: 'var', scopes: ['source.js', 'storage.type.var.js']
      expect(tokens[3]).toEqual value: ' x ', scopes: ['source.js']
      expect(tokens[4]).toEqual value: '=', scopes: ['source.js', 'keyword.operator.assignment.js']

      {tokens} = grammar.tokenizeLine('export let scopedVariable = 0;')
      expect(tokens[0]).toEqual value: 'export', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: 'let', scopes: ['source.js', 'storage.type.var.js']
      expect(tokens[3]).toEqual value: ' scopedVariable ', scopes: ['source.js']
      expect(tokens[4]).toEqual value: '=', scopes: ['source.js', 'keyword.operator.assignment.js']

      {tokens} = grammar.tokenizeLine('export const CONSTANT = 0;')
      expect(tokens[0]).toEqual value: 'export', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: 'const', scopes: ['source.js', 'storage.type.const.js']
      expect(tokens[4]).toEqual value: 'CONSTANT', scopes: ['source.js', 'constant.other.js']
      expect(tokens[6]).toEqual value: '=', scopes: ['source.js', 'keyword.operator.assignment.js']

    it "tokenizes named function export", ->
      {tokens} = grammar.tokenizeLine('export function func(p1, p2){}')
      expect(tokens[0]).toEqual value: 'export', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: 'function', scopes: ['source.js', 'meta.function.js', 'storage.type.function.js']
      expect(tokens[4]).toEqual value: 'func', scopes: ['source.js', 'meta.function.js', 'entity.name.function.js']

    it "tokenizes named class export", ->
      {tokens} = grammar.tokenizeLine('export class Foo {}')
      expect(tokens[0]).toEqual value: 'export', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: 'class', scopes: ['source.js', 'meta.class.js', 'storage.type.class.js']
      expect(tokens[4]).toEqual value: 'Foo', scopes: ['source.js', 'meta.class.js', 'entity.name.type.class.js']

    it "tokenizes existing variable export", ->
      {tokens} = grammar.tokenizeLine('export { bar };')
      expect(tokens[0]).toEqual value: 'export', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: '{', scopes: ['source.js', 'meta.export.js', 'punctuation.definition.modules.begin.js']
      expect(tokens[4]).toEqual value: 'bar', scopes: ['source.js', 'meta.export.js', 'variable.other.module.js']
      expect(tokens[6]).toEqual value: '}', scopes: ['source.js', 'meta.export.js', 'punctuation.definition.modules.end.js']

      {tokens} = grammar.tokenizeLine('export { bar, foo as alias };')
      expect(tokens[0]).toEqual value: 'export', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: '{', scopes: ['source.js', 'meta.export.js', 'punctuation.definition.modules.begin.js']
      expect(tokens[4]).toEqual value: 'bar', scopes: ['source.js', 'meta.export.js', 'variable.other.module.js']
      expect(tokens[5]).toEqual value: ',', scopes: ['source.js', 'meta.export.js', 'meta.delimiter.object.comma.js']
      expect(tokens[7]).toEqual value: 'foo', scopes: ['source.js', 'meta.export.js', 'variable.other.module.js']
      expect(tokens[9]).toEqual value: 'as', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']
      expect(tokens[11]).toEqual value: 'alias', scopes: ['source.js', 'meta.export.js', 'variable.other.module-alias.js']
      expect(tokens[13]).toEqual value: '}', scopes: ['source.js', 'meta.export.js', 'punctuation.definition.modules.end.js']

    it "tokenizes default export", ->
      {tokens} = grammar.tokenizeLine('export default 123;')
      expect(tokens[0]).toEqual value: 'export', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: 'default', scopes: ['source.js', 'meta.export.js', 'variable.language.default.js']
      expect(tokens[4]).toEqual value: '123', scopes: ['source.js', 'constant.numeric.decimal.js']

      {tokens} = grammar.tokenizeLine('export default name;')
      expect(tokens[0]).toEqual value: 'export', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: 'default', scopes: ['source.js', 'meta.export.js', 'variable.language.default.js']
      expect(tokens[4]).toEqual value: 'name', scopes: ['source.js', 'meta.export.js', 'variable.other.module.js']

      {tokens} = grammar.tokenizeLine('export { foo as default };')
      expect(tokens[0]).toEqual value: 'export', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: '{', scopes: ['source.js', 'meta.export.js', 'punctuation.definition.modules.begin.js']
      expect(tokens[4]).toEqual value: 'foo', scopes: ['source.js', 'meta.export.js', 'variable.other.module.js']
      expect(tokens[6]).toEqual value: 'as', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']
      expect(tokens[8]).toEqual value: 'default', scopes: ['source.js', 'meta.export.js', 'variable.language.default.js']
      expect(tokens[10]).toEqual value: '}', scopes: ['source.js', 'meta.export.js', 'punctuation.definition.modules.end.js']

      {tokens} = grammar.tokenizeLine('''
      export default {
        'prop': 'value'
      };
      ''')
      expect(tokens[0]).toEqual value: 'export', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: 'default', scopes: ['source.js', 'meta.export.js', 'variable.language.default.js']
      expect(tokens[4]).toEqual value: '{', scopes: ['source.js', 'meta.brace.curly.js']
      expect(tokens[6]).toEqual value: "'", scopes: ['source.js', 'string.quoted.single.js', 'punctuation.definition.string.begin.js']
      expect(tokens[7]).toEqual value: "prop", scopes: ['source.js', 'string.quoted.single.js']
      expect(tokens[8]).toEqual value: "'", scopes: ['source.js', 'string.quoted.single.js', 'punctuation.definition.string.end.js']
      expect(tokens[9]).toEqual value: ":", scopes: ['source.js', 'keyword.operator.assignment.js']
      expect(tokens[11]).toEqual value: "'", scopes: ['source.js', 'string.quoted.single.js', 'punctuation.definition.string.begin.js']
      expect(tokens[12]).toEqual value: "value", scopes: ['source.js', 'string.quoted.single.js']
      expect(tokens[13]).toEqual value: "'", scopes: ['source.js', 'string.quoted.single.js', 'punctuation.definition.string.end.js']
      expect(tokens[15]).toEqual value: '}', scopes: ['source.js', 'meta.brace.curly.js']

    it "tokenizes default function export", ->
      {tokens} = grammar.tokenizeLine('export default function () {}')
      expect(tokens[0]).toEqual value: 'export', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: 'default', scopes: ['source.js', 'meta.export.js', 'variable.language.default.js']
      expect(tokens[4]).toEqual value: 'function', scopes: ['source.js', 'meta.function.js', 'storage.type.function.js']

      {tokens} = grammar.tokenizeLine('export default function func() {}')
      expect(tokens[0]).toEqual value: 'export', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: 'default', scopes: ['source.js', 'meta.export.js', 'variable.language.default.js']
      expect(tokens[4]).toEqual value: 'function', scopes: ['source.js', 'meta.function.js', 'storage.type.function.js']

    it "tokenizes comments in statement", ->
      lines = grammar.tokenizeLines '''
        export {
          member1, // comment
          /* comment */
          member2
        };
      '''
      expect(lines[1][4]).toEqual value: '//', scopes: ['source.js', 'meta.export.js', 'comment.line.double-slash.js', 'punctuation.definition.comment.js']
      expect(lines[1][5]).toEqual value: ' comment', scopes: ['source.js', 'meta.export.js', 'comment.line.double-slash.js']
      expect(lines[2][1]).toEqual value: '/*', scopes: ['source.js', 'meta.export.js', 'comment.block.js', 'punctuation.definition.comment.begin.js']
      expect(lines[2][2]).toEqual value: ' comment ', scopes: ['source.js', 'meta.export.js', 'comment.block.js']
      expect(lines[2][3]).toEqual value: '*/', scopes: ['source.js', 'meta.export.js', 'comment.block.js', 'punctuation.definition.comment.end.js']

      {tokens} = grammar.tokenizeLine('export {member1, /* comment */ member2} /* comment */ from "module";')
      expect(tokens[6]).toEqual value: '/*', scopes: ['source.js', 'meta.export.js', 'comment.block.js', 'punctuation.definition.comment.begin.js']
      expect(tokens[7]).toEqual value: ' comment ', scopes: ['source.js', 'meta.export.js', 'comment.block.js']
      expect(tokens[8]).toEqual value: '*/', scopes: ['source.js', 'meta.export.js', 'comment.block.js', 'punctuation.definition.comment.end.js']
      expect(tokens[13]).toEqual value: '/*', scopes: ['source.js', 'meta.export.js', 'comment.block.js', 'punctuation.definition.comment.begin.js']
      expect(tokens[14]).toEqual value: ' comment ', scopes: ['source.js', 'meta.export.js', 'comment.block.js']
      expect(tokens[15]).toEqual value: '*/', scopes: ['source.js', 'meta.export.js', 'comment.block.js', 'punctuation.definition.comment.end.js']

    it "tokenizes default class export", ->
      {tokens} = grammar.tokenizeLine('export default class {}')
      expect(tokens[0]).toEqual value: 'export', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: 'default', scopes: ['source.js', 'meta.export.js', 'variable.language.default.js']
      expect(tokens[4]).toEqual value: 'class', scopes: ['source.js', 'storage.type.js']
      expect(tokens[6]).toEqual value: '{', scopes: ['source.js', 'punctuation.section.scope.begin.js']
      expect(tokens[7]).toEqual value: '}', scopes: ['source.js', 'punctuation.section.scope.end.js']

      {tokens} = grammar.tokenizeLine('export default class Foo {}')
      expect(tokens[0]).toEqual value: 'export', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: 'default', scopes: ['source.js', 'meta.export.js', 'variable.language.default.js']
      expect(tokens[4]).toEqual value: 'class', scopes: ['source.js', 'meta.class.js', 'storage.type.class.js']
      expect(tokens[6]).toEqual value: 'Foo', scopes: ['source.js', 'meta.class.js', 'entity.name.type.class.js']

    it "tokenizes re-export", ->
      {tokens} = grammar.tokenizeLine('export { name } from "module-name";')
      expect(tokens[0]).toEqual value: 'export', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: '{', scopes: ['source.js', 'meta.export.js', 'punctuation.definition.modules.begin.js']
      expect(tokens[4]).toEqual value: 'name', scopes: ['source.js', 'meta.export.js', 'variable.other.module.js']
      expect(tokens[6]).toEqual value: '}', scopes: ['source.js', 'meta.export.js', 'punctuation.definition.modules.end.js']
      expect(tokens[8]).toEqual value: 'from', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']

      {tokens} = grammar.tokenizeLine('export * from "module-name";')
      expect(tokens[0]).toEqual value: 'export', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: '*', scopes: ['source.js', 'meta.export.js', 'variable.language.import-all.js']
      expect(tokens[4]).toEqual value: 'from', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']

      {tokens} = grammar.tokenizeLine('export { default as alias } from "module-name";')
      expect(tokens[0]).toEqual value: 'export', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: '{', scopes: ['source.js', 'meta.export.js', 'punctuation.definition.modules.begin.js']
      expect(tokens[4]).toEqual value: 'default', scopes: ['source.js', 'meta.export.js', 'variable.language.default.js']
      expect(tokens[6]).toEqual value: 'as', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']
      expect(tokens[8]).toEqual value: 'alias', scopes: ['source.js', 'meta.export.js', 'variable.other.module-alias.js']
      expect(tokens[10]).toEqual value: '}', scopes: ['source.js', 'meta.export.js', 'punctuation.definition.modules.end.js']
      expect(tokens[12]).toEqual value: 'from', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']

    it "tokenizes multiline re-export", ->
      lines = grammar.tokenizeLines '''
        export {
          default as alias,
          member1 as alias1,
          member2,
        } from "module-name";
      '''
      expect(lines[0][0]).toEqual value: 'export', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']
      expect(lines[0][2]).toEqual value: '{', scopes: ['source.js', 'meta.export.js', 'punctuation.definition.modules.begin.js']
      expect(lines[1][1]).toEqual value: 'default', scopes: ['source.js', 'meta.export.js', 'variable.language.default.js']
      expect(lines[1][3]).toEqual value: 'as', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']
      expect(lines[1][5]).toEqual value: 'alias', scopes: ['source.js', 'meta.export.js', 'variable.other.module-alias.js']
      expect(lines[1][6]).toEqual value: ',', scopes: ['source.js', 'meta.export.js', 'meta.delimiter.object.comma.js']
      expect(lines[2][1]).toEqual value: 'member1', scopes: ['source.js', 'meta.export.js', 'variable.other.module.js']
      expect(lines[2][3]).toEqual value: 'as', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']
      expect(lines[2][5]).toEqual value: 'alias1', scopes: ['source.js', 'meta.export.js', 'variable.other.module-alias.js']
      expect(lines[2][6]).toEqual value: ',', scopes: ['source.js', 'meta.export.js', 'meta.delimiter.object.comma.js']
      expect(lines[3][1]).toEqual value: 'member2', scopes: ['source.js', 'meta.export.js', 'variable.other.module.js']
      expect(lines[3][2]).toEqual value: ',', scopes: ['source.js', 'meta.export.js', 'meta.delimiter.object.comma.js']
      expect(lines[4][0]).toEqual value: '}', scopes: ['source.js', 'meta.export.js', 'punctuation.definition.modules.end.js']
      expect(lines[4][2]).toEqual value: 'from', scopes: ['source.js', 'meta.export.js', 'keyword.control.js']

  describe "ES6 yield", ->
    it "tokenizes yield", ->
      {tokens} = grammar.tokenizeLine('yield next')
      expect(tokens[0]).toEqual value: 'yield', scopes: ['source.js', 'meta.control.yield.js', 'keyword.control.js']

    it "tokenizes yield*", ->
      {tokens} = grammar.tokenizeLine('yield * next')
      expect(tokens[0]).toEqual value: 'yield', scopes: ['source.js', 'meta.control.yield.js', 'keyword.control.js']
      expect(tokens[2]).toEqual value: '*', scopes: ['source.js', 'meta.control.yield.js', 'storage.modifier.js']

  describe "functions", ->
    it "tokenizes regular function declarations", ->
      {tokens} = grammar.tokenizeLine('function foo(){}')
      expect(tokens[0]).toEqual value: 'function', scopes: ['source.js', 'meta.function.js', 'storage.type.function.js']
      expect(tokens[2]).toEqual value: 'foo', scopes: ['source.js', 'meta.function.js', 'entity.name.function.js']
      expect(tokens[3]).toEqual value: '(', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'punctuation.definition.parameters.begin.bracket.round.js']
      expect(tokens[4]).toEqual value: ')', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'punctuation.definition.parameters.end.bracket.round.js']
      expect(tokens[5]).toEqual value: '{', scopes: ['source.js', 'punctuation.definition.function.body.begin.bracket.curly.js']
      expect(tokens[6]).toEqual value: '}', scopes: ['source.js', 'punctuation.definition.function.body.end.bracket.curly.js']

      lines = grammar.tokenizeLines '''
        function foo() {
          if(something){ }
        }
      '''
      expect(lines[0][0]).toEqual value: 'function', scopes: ['source.js', 'meta.function.js', 'storage.type.function.js']
      expect(lines[0][2]).toEqual value: 'foo', scopes: ['source.js', 'meta.function.js', 'entity.name.function.js']
      expect(lines[0][3]).toEqual value: '(', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'punctuation.definition.parameters.begin.bracket.round.js']
      expect(lines[0][4]).toEqual value: ')', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'punctuation.definition.parameters.end.bracket.round.js']
      expect(lines[0][6]).toEqual value: '{', scopes: ['source.js', 'punctuation.definition.function.body.begin.bracket.curly.js']
      expect(lines[1][1]).toEqual value: 'if', scopes: ['source.js', 'keyword.control.js']
      expect(lines[1][5]).toEqual value: '{', scopes: ['source.js', 'meta.brace.curly.js']
      expect(lines[1][7]).toEqual value: '}', scopes: ['source.js', 'meta.brace.curly.js']
      expect(lines[2][0]).toEqual value: '}', scopes: ['source.js', 'punctuation.definition.function.body.end.bracket.curly.js']

      {tokens} = grammar.tokenizeLine('function $abc$(){}')
      expect(tokens[2]).toEqual value: '$abc$', scopes: ['source.js', 'meta.function.js', 'entity.name.function.js']

      {tokens} = grammar.tokenizeLine('function $$(){}')
      expect(tokens[2]).toEqual value: '$$', scopes: ['source.js', 'meta.function.js', 'entity.name.function.js']

    it "tokenizes anonymous functions", ->
      {tokens} = grammar.tokenizeLine('function (){}')
      expect(tokens[0]).toEqual value: 'function', scopes: ['source.js', 'meta.function.js', 'storage.type.function.js']
      expect(tokens[2]).toEqual value: '(', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'punctuation.definition.parameters.begin.bracket.round.js']
      expect(tokens[3]).toEqual value: ')', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'punctuation.definition.parameters.end.bracket.round.js']
      expect(tokens[4]).toEqual value: '{', scopes: ['source.js', 'punctuation.definition.function.body.begin.bracket.curly.js']
      expect(tokens[5]).toEqual value: '}', scopes: ['source.js', 'punctuation.definition.function.body.end.bracket.curly.js']

    it "tokenizes async functions", ->
      {tokens} = grammar.tokenizeLine('async function foo(){}')
      expect(tokens[0]).toEqual value: 'async', scopes: ['source.js', 'meta.function.js', 'storage.modifier.async.js']
      expect(tokens[2]).toEqual value: 'function', scopes: ['source.js', 'meta.function.js', 'storage.type.function.js']
      expect(tokens[4]).toEqual value: 'foo', scopes: ['source.js', 'meta.function.js', 'entity.name.function.js']

    it "tokenizes functions as object properties", ->
      {tokens} = grammar.tokenizeLine('obj.method = function foo(')
      expect(tokens[0]).toEqual value: 'obj', scopes: ['source.js', 'variable.other.object.js']
      expect(tokens[1]).toEqual value: '.', scopes: ['source.js', 'meta.function.js', 'meta.delimiter.method.period.js']
      expect(tokens[2]).toEqual value: 'method', scopes: ['source.js', 'meta.function.js', 'entity.name.function.js']
      expect(tokens[4]).toEqual value: '=', scopes: ['source.js', 'meta.function.js', 'keyword.operator.assignment.js']
      expect(tokens[6]).toEqual value: 'function', scopes: ['source.js', 'meta.function.js', 'storage.type.function.js']
      expect(tokens[8]).toEqual value: 'foo', scopes: ['source.js', 'meta.function.js', 'entity.name.function.js']
      expect(tokens[9]).toEqual value: '(', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'punctuation.definition.parameters.begin.bracket.round.js']

      {tokens} = grammar.tokenizeLine('this.register = function(')
      expect(tokens[0]).toEqual value: 'this', scopes: ['source.js', 'variable.language.js']
      expect(tokens[1]).toEqual value: '.', scopes: ['source.js', 'meta.function.js', 'meta.delimiter.method.period.js']
      expect(tokens[2]).toEqual value: 'register', scopes: ['source.js', 'meta.function.js', 'entity.name.function.js']
      expect(tokens[6]).toEqual value: 'function', scopes: ['source.js', 'meta.function.js', 'storage.type.function.js']

      {tokens} = grammar.tokenizeLine('document.getElementById("foo").onclick = function(')
      expect(tokens[8]).toEqual value: '.', scopes: ['source.js', 'meta.function.js', 'meta.delimiter.method.period.js']
      expect(tokens[9]).toEqual value: 'onclick', scopes: ['source.js', 'meta.function.js', 'entity.name.function.js']
      expect(tokens[13]).toEqual value: 'function', scopes: ['source.js', 'meta.function.js', 'storage.type.function.js']

    it "tokenises getter/setter keywords", ->
      {tokens} = grammar.tokenizeLine('get name(){ }')
      expect(tokens[0]).toEqual value: 'get', scopes: ['source.js', 'meta.function.method.definition.js', 'keyword.operator.getter.js']
      expect(tokens[2]).toEqual value: 'name', scopes: ['source.js', 'meta.function.method.definition.js', 'entity.name.function.js']
      expect(tokens[3]).toEqual value: '(', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'punctuation.definition.parameters.begin.bracket.round.js']
      expect(tokens[4]).toEqual value: ')', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'punctuation.definition.parameters.end.bracket.round.js']
      expect(tokens[5]).toEqual value: '{', scopes: ['source.js', 'punctuation.definition.function.body.begin.bracket.curly.js']
      expect(tokens[7]).toEqual value: '}', scopes: ['source.js', 'punctuation.definition.function.body.end.bracket.curly.js']

    it "tokenizes ES6 method definitions", ->
      {tokens} = grammar.tokenizeLine('f(a, b) {}')
      expect(tokens[0]).toEqual value: 'f', scopes: ['source.js', 'meta.function.method.definition.js', 'entity.name.function.js']
      expect(tokens[1]).toEqual value: '(', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'punctuation.definition.parameters.begin.bracket.round.js']
      expect(tokens[2]).toEqual value: 'a', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js',  'variable.parameter.function.js']
      expect(tokens[3]).toEqual value: ',', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'meta.delimiter.object.comma.js']
      expect(tokens[5]).toEqual value: 'b', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'variable.parameter.function.js']
      expect(tokens[6]).toEqual value: ')', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'punctuation.definition.parameters.end.bracket.round.js']

      {tokens} = grammar.tokenizeLine('async foo(){}')
      expect(tokens[0]).toEqual value: 'async', scopes: ['source.js', 'storage.modifier.js']
      expect(tokens[2]).toEqual value: 'foo', scopes: ['source.js', 'meta.function.method.definition.js', 'entity.name.function.js']

      {tokens} = grammar.tokenizeLine('hi({host, root = "./", plugins = [a, "b", "c", d]}) {}')
      expect(tokens[0]).toEqual value: 'hi', scopes: ['source.js', 'meta.function.method.definition.js', 'entity.name.function.js']
      expect(tokens[1]).toEqual value: '(', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'punctuation.definition.parameters.begin.bracket.round.js']
      expect(tokens[2]).toEqual value: '{', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'meta.brace.curly.js']
      expect(tokens[3]).toEqual value: 'host', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js']
      expect(tokens[4]).toEqual value: ',', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'meta.delimiter.object.comma.js']
      expect(tokens[5]).toEqual value: ' root ', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js']
      expect(tokens[6]).toEqual value: '=', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'keyword.operator.assignment.js']
      expect(tokens[8]).toEqual value: '"', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']
      expect(tokens[9]).toEqual value: './', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'string.quoted.double.js']
      expect(tokens[10]).toEqual value: '"', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'string.quoted.double.js', 'punctuation.definition.string.end.js']
      expect(tokens[11]).toEqual value: ',', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'meta.delimiter.object.comma.js']
      expect(tokens[12]).toEqual value: ' plugins ', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js']
      expect(tokens[13]).toEqual value: '=', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'keyword.operator.assignment.js']
      expect(tokens[15]).toEqual value: '[', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'meta.brace.square.js']
      expect(tokens[16]).toEqual value: 'a', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js']
      expect(tokens[17]).toEqual value: ',', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'meta.delimiter.object.comma.js']
      expect(tokens[19]).toEqual value: '"', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']
      expect(tokens[22]).toEqual value: ',', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'meta.delimiter.object.comma.js']
      expect(tokens[24]).toEqual value: '"', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']
      expect(tokens[28]).toEqual value: ' d', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js']
      expect(tokens[29]).toEqual value: ']', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'meta.brace.square.js']
      expect(tokens[30]).toEqual value: '}', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'meta.brace.curly.js']
      expect(tokens[31]).toEqual value: ')', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'punctuation.definition.parameters.end.bracket.round.js']

      {tokens} = grammar.tokenizeLine('write("){");')
      expect(tokens[0]).toEqual value: 'write', scopes: ['source.js', 'meta.function-call.js', 'entity.name.function.js']
      expect(tokens[1]).toEqual value: '(', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(tokens[2]).toEqual value: '"', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']
      expect(tokens[3]).toEqual value: '){', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'string.quoted.double.js']
      expect(tokens[4]).toEqual value: '"', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'string.quoted.double.js', 'punctuation.definition.string.end.js']
      expect(tokens[5]).toEqual value: ')', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']
      expect(tokens[6]).toEqual value: ';', scopes: ['source.js', 'punctuation.terminator.statement.js']

      {tokens} = grammar.tokenizeLine('import (x) { return "Yeah"; }')
      expect(tokens[0]).toEqual value: 'import', scopes: ['source.js', 'meta.function.method.definition.js', 'entity.name.function.js']
      expect(tokens[11]).toEqual value: 'Yeah', scopes: ['source.js', 'string.quoted.double.js']

      {tokens} = grammar.tokenizeLine('export (x) { return "Nah"; }')
      expect(tokens[0]).toEqual value: 'export', scopes: ['source.js', 'meta.function.method.definition.js', 'entity.name.function.js']
      expect(tokens[11]).toEqual value: 'Nah', scopes: ['source.js', 'string.quoted.double.js']

    it "tokenises ES6 methods with computed names", ->
      {tokens} = grammar.tokenizeLine('[ foo ] () { }')
      expect(tokens[0]).toEqual value: '[', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.computed-key.js', 'punctuation.definition.computed-key.begin.bracket.square.js']
      expect(tokens[2]).toEqual value: 'foo', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.computed-key.js', 'variable.parameter.property.js']
      expect(tokens[4]).toEqual value: ']', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.computed-key.js', 'punctuation.definition.computed-key.end.bracket.square.js']
      expect(tokens[6]).toEqual value: '(', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'punctuation.definition.parameters.begin.bracket.round.js']
      expect(tokens[7]).toEqual value: ')', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'punctuation.definition.parameters.end.bracket.round.js']
      expect(tokens[9]).toEqual value: '{', scopes: ['source.js', 'punctuation.definition.function.body.begin.bracket.curly.js']
      expect(tokens[11]).toEqual value: '}', scopes: ['source.js', 'punctuation.definition.function.body.end.bracket.curly.js']

      {tokens} = grammar.tokenizeLine('[ "delet" + this ] (gun) { }')
      expect(tokens[0]).toEqual value: '[', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.computed-key.js', 'punctuation.definition.computed-key.begin.bracket.square.js']
      expect(tokens[2]).toEqual value: '"', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.computed-key.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']
      expect(tokens[3]).toEqual value: 'delet', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.computed-key.js', 'string.quoted.double.js']
      expect(tokens[4]).toEqual value: '"', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.computed-key.js', 'string.quoted.double.js', 'punctuation.definition.string.end.js']
      expect(tokens[6]).toEqual value: '+', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.computed-key.js', 'keyword.operator.js']
      expect(tokens[8]).toEqual value: 'this', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.computed-key.js', 'variable.language.js']
      expect(tokens[10]).toEqual value: ']', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.computed-key.js', 'punctuation.definition.computed-key.end.bracket.square.js']
      expect(tokens[12]).toEqual value: '(', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'punctuation.definition.parameters.begin.bracket.round.js']
      expect(tokens[13]).toEqual value: 'gun', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'variable.parameter.function.js']
      expect(tokens[14]).toEqual value: ')', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'punctuation.definition.parameters.end.bracket.round.js']
      expect(tokens[16]).toEqual value: '{', scopes: ['source.js', 'punctuation.definition.function.body.begin.bracket.curly.js']
      expect(tokens[18]).toEqual value: '}', scopes: ['source.js', 'punctuation.definition.function.body.end.bracket.curly.js']

      {tokens} = grammar.tokenizeLine('get [ foo ] () { }')
      expect(tokens[0]).toEqual value: 'get', scopes: ['source.js', 'meta.function.method.definition.js', 'keyword.operator.getter.js']
      expect(tokens[2]).toEqual value: '[', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.computed-key.js', 'punctuation.definition.computed-key.begin.bracket.square.js']
      expect(tokens[4]).toEqual value: 'foo', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.computed-key.js', 'variable.parameter.property.js']
      expect(tokens[6]).toEqual value: ']', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.computed-key.js', 'punctuation.definition.computed-key.end.bracket.square.js']
      expect(tokens[8]).toEqual value: '(', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'punctuation.definition.parameters.begin.bracket.round.js']
      expect(tokens[9]).toEqual value: ')', scopes: ['source.js', 'meta.function.method.definition.js', 'meta.parameters.js', 'punctuation.definition.parameters.end.bracket.round.js']
      expect(tokens[11]).toEqual value: '{', scopes: ['source.js', 'punctuation.definition.function.body.begin.bracket.curly.js']
      expect(tokens[13]).toEqual value: '}', scopes: ['source.js', 'punctuation.definition.function.body.end.bracket.curly.js']

    it "tokenizes constructors", ->
      {tokens} = grammar.tokenizeLine('constructor(p1, p2) { this.p1 = p1; }')
      expect(tokens[0]).toEqual value: 'constructor', scopes: ['source.js', 'meta.function.js', 'entity.name.function.constructor.js']
      expect(tokens[1]).toEqual value: '(', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'punctuation.definition.parameters.begin.bracket.round.js']
      expect(tokens[2]).toEqual value: 'p1', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'variable.parameter.function.js']
      expect(tokens[3]).toEqual value: ',', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'meta.delimiter.object.comma.js']
      expect(tokens[5]).toEqual value: 'p2', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'variable.parameter.function.js']
      expect(tokens[6]).toEqual value: ')', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'punctuation.definition.parameters.end.bracket.round.js']
      expect(tokens[10]).toEqual value: 'this', scopes: ['source.js', 'variable.language.js']

      {tokens} = grammar.tokenizeLine('constructorABC: {}')
      expect(tokens[0]).not.toEqual value: 'constructor', scopes: ['source.js', 'meta.function.js', 'entity.name.function.constructor.js']

    it "tokenizes named function expressions", ->
      {tokens} = grammar.tokenizeLine('var func = function foo(){}')
      expect(tokens[0]).toEqual value: 'var', scopes: ['source.js', 'storage.type.var.js']
      expect(tokens[2]).toEqual value: 'func', scopes: ['source.js', 'meta.function.js', 'entity.name.function.js']
      expect(tokens[4]).toEqual value: '=', scopes: ['source.js', 'meta.function.js', 'keyword.operator.assignment.js']
      expect(tokens[6]).toEqual value: 'function', scopes: ['source.js', 'meta.function.js', 'storage.type.function.js']
      expect(tokens[8]).toEqual value: 'foo', scopes: ['source.js', 'meta.function.js', 'entity.name.function.js']
      expect(tokens[9]).toEqual value: '(', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'punctuation.definition.parameters.begin.bracket.round.js']

    it "tokenizes anonymous function expressions", ->
      {tokens} = grammar.tokenizeLine('var func = function(){}')
      expect(tokens[0]).toEqual value: 'var', scopes: ['source.js', 'storage.type.var.js']
      expect(tokens[2]).toEqual value: 'func', scopes: ['source.js', 'meta.function.js', 'entity.name.function.js']
      expect(tokens[4]).toEqual value: '=', scopes: ['source.js', 'meta.function.js', 'keyword.operator.assignment.js']
      expect(tokens[6]).toEqual value: 'function', scopes: ['source.js', 'meta.function.js', 'storage.type.function.js']
      expect(tokens[7]).toEqual value: '(', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'punctuation.definition.parameters.begin.bracket.round.js']

    it "tokenizes functions in object literals", ->
      {tokens} = grammar.tokenizeLine('func: function foo(')
      expect(tokens[0]).toEqual value: 'func', scopes: ['source.js', 'meta.function.json.js', 'entity.name.function.js']
      expect(tokens[1]).toEqual value: ':', scopes: ['source.js', 'meta.function.json.js', 'keyword.operator.assignment.js']
      expect(tokens[3]).toEqual value: 'function', scopes: ['source.js', 'meta.function.json.js', 'storage.type.function.js']
      expect(tokens[5]).toEqual value: 'foo', scopes: ['source.js', 'meta.function.json.js', 'entity.name.function.js']
      expect(tokens[6]).toEqual value: '(', scopes: ['source.js', 'meta.function.json.js', 'meta.parameters.js', 'punctuation.definition.parameters.begin.bracket.round.js']

      {tokens} = grammar.tokenizeLine('"func": function foo(')
      expect(tokens[1]).toEqual value: 'func', scopes: ['source.js', 'meta.function.json.js', 'string.quoted.double.js', 'entity.name.function.js']
      expect(tokens[3]).toEqual value: ':', scopes: ['source.js', 'meta.function.json.js', 'keyword.operator.assignment.js']
      expect(tokens[5]).toEqual value: 'function', scopes: ['source.js', 'meta.function.json.js', 'storage.type.function.js']
      expect(tokens[7]).toEqual value: 'foo', scopes: ['source.js', 'meta.function.json.js', 'entity.name.function.js']
      expect(tokens[8]).toEqual value: '(', scopes: ['source.js', 'meta.function.json.js', 'meta.parameters.js', 'punctuation.definition.parameters.begin.bracket.round.js']

      {tokens} = grammar.tokenizeLine('function : a => a')
      expect(tokens[0]).toEqual value: 'function', scopes: ['source.js', 'meta.function.arrow.json.js', 'entity.name.function.js']
      expect(tokens[2]).toEqual value: ':', scopes: ['source.js', 'meta.function.arrow.json.js', 'keyword.operator.assignment.js']
      expect(tokens[4]).toEqual value: 'a', scopes: ['source.js', 'meta.function.arrow.json.js', 'meta.parameters.js', 'variable.parameter.function.js']
      expect(tokens[6]).toEqual value: '=>', scopes: ['source.js', 'meta.function.arrow.json.js', 'storage.type.function.arrow.js']
      expect(tokens[7]).toEqual value: ' a', scopes: ['source.js']

      {tokens} = grammar.tokenizeLine('"func": a => a')
      expect(tokens[1]).toEqual value: 'func', scopes: ['source.js', 'meta.function.arrow.json.js', 'string.quoted.double.js', 'entity.name.function.js']
      expect(tokens[3]).toEqual value: ':', scopes: ['source.js', 'meta.function.arrow.json.js', 'keyword.operator.assignment.js']
      expect(tokens[5]).toEqual value: 'a', scopes: ['source.js', 'meta.function.arrow.json.js', 'meta.parameters.js', 'variable.parameter.function.js']
      expect(tokens[7]).toEqual value: '=>', scopes: ['source.js', 'meta.function.arrow.json.js', 'storage.type.function.arrow.js']
      expect(tokens[8]).toEqual value: ' a', scopes: ['source.js']

      {tokens} = grammar.tokenizeLine('"func" : a => a')
      expect(tokens[8]).toEqual value: '=>', scopes: ['source.js', 'meta.function.arrow.json.js', 'storage.type.function.arrow.js']

    it "tokenizes generator functions", ->
      {tokens} = grammar.tokenizeLine('function* foo(){}')
      expect(tokens[0]).toEqual value: 'function', scopes: ['source.js', 'meta.function.js', 'storage.type.function.js']
      expect(tokens[1]).toEqual value: '*', scopes: ['source.js', 'meta.function.js', 'storage.modifier.generator.js']
      expect(tokens[3]).toEqual value: 'foo', scopes: ['source.js', 'meta.function.js', 'entity.name.function.js']
      expect(tokens[4]).toEqual value: '(', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'punctuation.definition.parameters.begin.bracket.round.js']
      expect(tokens[5]).toEqual value: ')', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'punctuation.definition.parameters.end.bracket.round.js']
      expect(tokens[6]).toEqual value: '{', scopes: ['source.js', 'punctuation.definition.function.body.begin.bracket.curly.js']
      expect(tokens[7]).toEqual value: '}', scopes: ['source.js', 'punctuation.definition.function.body.end.bracket.curly.js']

      {tokens} = grammar.tokenizeLine('function *foo(){}')
      expect(tokens[2]).toEqual value: '*', scopes: ['source.js', 'meta.function.js', 'storage.modifier.generator.js']

      {tokens} = grammar.tokenizeLine('function *(){}')
      expect(tokens[2]).toEqual value: '*', scopes: ['source.js', 'meta.function.js', 'storage.modifier.generator.js']

    it "tokenizes arrow functions", ->
      {tokens} = grammar.tokenizeLine('x => x * x')
      expect(tokens[0]).toEqual value: 'x', scopes: ['source.js', 'meta.function.arrow.js', 'meta.parameters.js', 'variable.parameter.function.js']
      expect(tokens[2]).toEqual value: '=>', scopes: ['source.js', 'meta.function.arrow.js', 'storage.type.function.arrow.js']
      expect(tokens[3]).toEqual value: ' x ', scopes: ['source.js']

      {tokens} = grammar.tokenizeLine('() => {}')
      expect(tokens[0]).toEqual value: '(', scopes: ['source.js', 'meta.function.arrow.js', 'meta.parameters.js', 'punctuation.definition.parameters.begin.bracket.round.js']
      expect(tokens[1]).toEqual value: ')', scopes: ['source.js', 'meta.function.arrow.js', 'meta.parameters.js', 'punctuation.definition.parameters.end.bracket.round.js']
      expect(tokens[3]).toEqual value: '=>', scopes: ['source.js', 'meta.function.arrow.js', 'storage.type.function.arrow.js']
      expect(tokens[5]).toEqual value: '{', scopes: ['source.js', 'punctuation.definition.function.body.begin.bracket.curly.js']
      expect(tokens[6]).toEqual value: '}', scopes: ['source.js', 'punctuation.definition.function.body.end.bracket.curly.js']

      {tokens} = grammar.tokenizeLine('(p1, p2) => {}')
      expect(tokens[0]).toEqual value: '(', scopes: ['source.js', 'meta.function.arrow.js', 'meta.parameters.js', 'punctuation.definition.parameters.begin.bracket.round.js']
      expect(tokens[1]).toEqual value: 'p1', scopes: ['source.js', 'meta.function.arrow.js', 'meta.parameters.js', 'variable.parameter.function.js']
      expect(tokens[2]).toEqual value: ',', scopes: ['source.js', 'meta.function.arrow.js', 'meta.parameters.js', 'meta.delimiter.object.comma.js']
      expect(tokens[4]).toEqual value: 'p2', scopes: ['source.js', 'meta.function.arrow.js', 'meta.parameters.js', 'variable.parameter.function.js']
      expect(tokens[5]).toEqual value: ')', scopes: ['source.js', 'meta.function.arrow.js', 'meta.parameters.js', 'punctuation.definition.parameters.end.bracket.round.js']
      expect(tokens[7]).toEqual value: '=>', scopes: ['source.js', 'meta.function.arrow.js', 'storage.type.function.arrow.js']
      expect(tokens[9]).toEqual value: '{', scopes: ['source.js', 'punctuation.definition.function.body.begin.bracket.curly.js']
      expect(tokens[10]).toEqual value: '}', scopes: ['source.js', 'punctuation.definition.function.body.end.bracket.curly.js']

      lines = grammar.tokenizeLines """
        a = (x,
             y) => {}
      """
      expect(lines[1][3]).toEqual value: '=>', scopes: ['source.js', 'meta.function.arrow.js', 'storage.type.function.arrow.js']

    it "tokenizes stored arrow functions", ->
      {tokens} = grammar.tokenizeLine('var func = (p1, p2) => {}')
      expect(tokens[0]).toEqual value: 'var', scopes: ['source.js', 'storage.type.var.js']
      expect(tokens[2]).toEqual value: 'func', scopes: ['source.js', 'meta.function.arrow.js', 'entity.name.function.js']
      expect(tokens[4]).toEqual value: '=', scopes: ['source.js', 'meta.function.arrow.js', 'keyword.operator.assignment.js']
      expect(tokens[11]).toEqual value: ')', scopes: ['source.js', 'meta.function.arrow.js', 'meta.parameters.js', 'punctuation.definition.parameters.end.bracket.round.js']
      expect(tokens[13]).toEqual value: '=>', scopes: ['source.js', 'meta.function.arrow.js', 'storage.type.function.arrow.js']

    it "tokenizes arrow functions as object properties", ->
      {tokens} = grammar.tokenizeLine('Utils.isEmpty = (p1, p2) => {}')
      expect(tokens[0]).toEqual value: 'Utils', scopes: ['source.js', 'variable.other.object.js']
      expect(tokens[2]).toEqual value: 'isEmpty', scopes: ['source.js', 'meta.function.arrow.js', 'entity.name.function.js']
      expect(tokens[4]).toEqual value: '=', scopes: ['source.js', 'meta.function.arrow.js', 'keyword.operator.assignment.js']
      expect(tokens[11]).toEqual value: ')', scopes: ['source.js', 'meta.function.arrow.js', 'meta.parameters.js', 'punctuation.definition.parameters.end.bracket.round.js']
      expect(tokens[13]).toEqual value: '=>', scopes: ['source.js', 'meta.function.arrow.js', 'storage.type.function.arrow.js']

    it "tokenizes arrow functions in object literals", ->
      {tokens} = grammar.tokenizeLine('foo: param => {}')
      expect(tokens[0]).toEqual value: 'foo', scopes: ['source.js', 'meta.function.arrow.json.js', 'entity.name.function.js']
      expect(tokens[1]).toEqual value: ':', scopes: ['source.js', 'meta.function.arrow.json.js', 'keyword.operator.assignment.js']
      expect(tokens[3]).toEqual value: 'param', scopes: ['source.js', 'meta.function.arrow.json.js', 'meta.parameters.js', 'variable.parameter.function.js']
      expect(tokens[5]).toEqual value: '=>', scopes: ['source.js', 'meta.function.arrow.json.js', 'storage.type.function.arrow.js']

      {tokens} = grammar.tokenizeLine('"foo": param => {}')
      expect(tokens[1]).toEqual value: 'foo', scopes: ['source.js', 'meta.function.arrow.json.js', 'string.quoted.double.js', 'entity.name.function.js']
      expect(tokens[3]).toEqual value: ':', scopes: ['source.js', 'meta.function.arrow.json.js', 'keyword.operator.assignment.js']
      expect(tokens[5]).toEqual value: 'param', scopes: ['source.js', 'meta.function.arrow.json.js', 'meta.parameters.js', 'variable.parameter.function.js']
      expect(tokens[7]).toEqual value: '=>', scopes: ['source.js', 'meta.function.arrow.json.js', 'storage.type.function.arrow.js']

    it "tokenizes default parameters", ->
      {tokens} = grammar.tokenizeLine('function multiply(a, b = 1){}')
      expect(tokens[7]).toEqual value: 'b', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'variable.parameter.function.js']
      expect(tokens[9]).toEqual value: '=', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'keyword.operator.assignment.js']
      expect(tokens[11]).toEqual value: '1', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'constant.numeric.decimal.js']

      {tokens} = grammar.tokenizeLine('function callSomething(thing = this.something()) {}')
      expect(tokens[4]).toEqual value: 'thing', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'variable.parameter.function.js']
      expect(tokens[6]).toEqual value: '=', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'keyword.operator.assignment.js']
      expect(tokens[8]).toEqual value: 'this', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'variable.language.js']
      expect(tokens[9]).toEqual value: '.', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'meta.method-call.js', 'meta.delimiter.method.period.js']
      expect(tokens[10]).toEqual value: 'something', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'meta.method-call.js', 'entity.name.function.js']

    it "tokenizes the rest parameter", ->
      {tokens} = grammar.tokenizeLine('(...args) => args[0]')
      expect(tokens[1]).toEqual value: '...', scopes: ['source.js', 'meta.function.arrow.js', 'meta.parameters.js', 'keyword.operator.spread.js']
      expect(tokens[2]).toEqual value: 'args', scopes: ['source.js', 'meta.function.arrow.js', 'meta.parameters.js', 'variable.parameter.rest.function.js']

    it "tokenizes illegal parameters", ->
      {tokens} = grammar.tokenizeLine('0abc => {}')
      expect(tokens[0]).toEqual value: '0abc', scopes: ['source.js', 'meta.function.arrow.js', 'meta.parameters.js', 'invalid.illegal.identifier.js']
      expect(tokens[2]).toEqual value: '=>', scopes: ['source.js', 'meta.function.arrow.js', 'storage.type.function.arrow.js']

      {tokens} = grammar.tokenizeLine('(0abc) => {}')
      expect(tokens[1]).toEqual value: '0abc', scopes: ['source.js', 'meta.function.arrow.js', 'meta.parameters.js', 'invalid.illegal.identifier.js']
      expect(tokens[4]).toEqual value: '=>', scopes: ['source.js', 'meta.function.arrow.js', 'storage.type.function.arrow.js']

  describe "variables", ->
    it "tokenizes 'this'", ->
      {tokens} = grammar.tokenizeLine('this')
      expect(tokens[0]).toEqual value: 'this', scopes: ['source.js', 'variable.language.js']

      {tokens} = grammar.tokenizeLine('this.obj.prototype = new El()')
      expect(tokens[0]).toEqual value: 'this', scopes: ['source.js', 'variable.language.js']

      {tokens} = grammar.tokenizeLine('$this')
      expect(tokens[0]).toEqual value: '$this', scopes: ['source.js']

      {tokens} = grammar.tokenizeLine('this$')
      expect(tokens[0]).toEqual value: 'this$', scopes: ['source.js']

    it "tokenizes 'super'", ->
      {tokens} = grammar.tokenizeLine('super')
      expect(tokens[0]).toEqual value: 'super', scopes: ['source.js', 'variable.language.js']

    it "tokenizes 'arguments'", ->
      {tokens} = grammar.tokenizeLine('arguments')
      expect(tokens[0]).toEqual value: 'arguments', scopes: ['source.js', 'variable.language.js']

      {tokens} = grammar.tokenizeLine('arguments[0]')
      expect(tokens[0]).toEqual value: 'arguments', scopes: ['source.js', 'variable.language.js']

      {tokens} = grammar.tokenizeLine('arguments.length')
      expect(tokens[0]).toEqual value: 'arguments', scopes: ['source.js', 'variable.language.js']

    it "tokenizes illegal identifiers", ->
      {tokens} = grammar.tokenizeLine('0illegal')
      expect(tokens[0]).toEqual value: '0illegal', scopes: ['source.js', 'invalid.illegal.identifier.js']

      {tokens} = grammar.tokenizeLine('123illegal')
      expect(tokens[0]).toEqual value: '123illegal', scopes: ['source.js', 'invalid.illegal.identifier.js']

      {tokens} = grammar.tokenizeLine('123$illegal')
      expect(tokens[0]).toEqual value: '123$illegal', scopes: ['source.js', 'invalid.illegal.identifier.js']

    describe "objects", ->
      it "tokenizes them", ->
        {tokens} = grammar.tokenizeLine('obj.prop')
        expect(tokens[0]).toEqual value: 'obj', scopes: ['source.js', 'variable.other.object.js']

        {tokens} = grammar.tokenizeLine('$abc$.prop')
        expect(tokens[0]).toEqual value: '$abc$', scopes: ['source.js', 'variable.other.object.js']

        {tokens} = grammar.tokenizeLine('$$.prop')
        expect(tokens[0]).toEqual value: '$$', scopes: ['source.js', 'variable.other.object.js']

      it "tokenizes illegal objects", ->
        {tokens} = grammar.tokenizeLine('1.prop')
        expect(tokens[0]).toEqual value: '1', scopes: ['source.js', 'invalid.illegal.identifier.js']

        {tokens} = grammar.tokenizeLine('123.prop')
        expect(tokens[0]).toEqual value: '123', scopes: ['source.js', 'invalid.illegal.identifier.js']

        {tokens} = grammar.tokenizeLine('123a.prop')
        expect(tokens[0]).toEqual value: '123a', scopes: ['source.js', 'invalid.illegal.identifier.js']

  describe "function calls", ->
    it "tokenizes function calls", ->
      {tokens} = grammar.tokenizeLine('functionCall()')
      expect(tokens[0]).toEqual value: 'functionCall', scopes: ['source.js', 'meta.function-call.js', 'entity.name.function.js']
      expect(tokens[1]).toEqual value: '(', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(tokens[2]).toEqual value: ')', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']

      {tokens} = grammar.tokenizeLine('functionCall(arg1, "test", {a: 123})')
      expect(tokens[0]).toEqual value: 'functionCall', scopes: ['source.js', 'meta.function-call.js', 'entity.name.function.js']
      expect(tokens[1]).toEqual value: '(', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(tokens[2]).toEqual value: 'arg1', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js']
      expect(tokens[3]).toEqual value: ',', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'meta.delimiter.object.comma.js']
      expect(tokens[5]).toEqual value: '"', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']
      expect(tokens[6]).toEqual value: 'test', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'string.quoted.double.js']
      expect(tokens[7]).toEqual value: '"', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'string.quoted.double.js', 'punctuation.definition.string.end.js']
      expect(tokens[8]).toEqual value: ',', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'meta.delimiter.object.comma.js']
      expect(tokens[10]).toEqual value: '{', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'meta.brace.curly.js']
      expect(tokens[11]).toEqual value: 'a', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js']
      expect(tokens[12]).toEqual value: ':', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'keyword.operator.assignment.js']
      expect(tokens[14]).toEqual value: '123', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'constant.numeric.decimal.js']
      expect(tokens[15]).toEqual value: '}', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'meta.brace.curly.js']
      expect(tokens[16]).toEqual value: ')', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']

      {tokens} = grammar.tokenizeLine('functionCall((123).toString())')
      expect(tokens[1]).toEqual value: '(', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(tokens[2]).toEqual value: '(', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'meta.brace.round.js']
      expect(tokens[3]).toEqual value: '123', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'constant.numeric.decimal.js']
      expect(tokens[4]).toEqual value: ')', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'meta.brace.round.js']
      expect(tokens[9]).toEqual value: ')', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']

      {tokens} = grammar.tokenizeLine('$abc$()')
      expect(tokens[0]).toEqual value: '$abc$', scopes: ['source.js', 'meta.function-call.js', 'entity.name.function.js']

      {tokens} = grammar.tokenizeLine('$$()')
      expect(tokens[0]).toEqual value: '$$', scopes: ['source.js', 'meta.function-call.js', 'entity.name.function.js']

      {tokens} = grammar.tokenizeLine('ABC()')
      expect(tokens[0]).toEqual value: 'ABC', scopes: ['source.js', 'meta.function-call.js', 'entity.name.function.js']

      {tokens} = grammar.tokenizeLine('$ABC$()')
      expect(tokens[0]).toEqual value: '$ABC$', scopes: ['source.js', 'meta.function-call.js', 'entity.name.function.js']

    it "tokenizes function calls when they are arguments", ->
      {tokens} = grammar.tokenizeLine('a(b(c))')
      expect(tokens[0]).toEqual value: 'a', scopes: ['source.js', 'meta.function-call.js', 'entity.name.function.js']
      expect(tokens[1]).toEqual value: '(', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(tokens[2]).toEqual value: 'b', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'meta.function-call.js', 'entity.name.function.js']
      expect(tokens[3]).toEqual value: '(', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(tokens[4]).toEqual value: 'c', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'meta.function-call.js', 'meta.arguments.js']
      expect(tokens[5]).toEqual value: ')', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']
      expect(tokens[6]).toEqual value: ')', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']

    it "tokenizes illegal function calls", ->
      {tokens} = grammar.tokenizeLine('0illegal()')
      expect(tokens[0]).toEqual value: '0illegal', scopes: ['source.js', 'meta.function-call.js', 'invalid.illegal.identifier.js']
      expect(tokens[1]).toEqual value: '(', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(tokens[2]).toEqual value: ')', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']

    it "tokenizes illegal arguments", ->
      {tokens} = grammar.tokenizeLine('a(1a)')
      expect(tokens[0]).toEqual value: 'a', scopes: ['source.js', 'meta.function-call.js', 'entity.name.function.js']
      expect(tokens[1]).toEqual value: '(', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(tokens[2]).toEqual value: '1a', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'invalid.illegal.identifier.js']
      expect(tokens[3]).toEqual value: ')', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']

      {tokens} = grammar.tokenizeLine('a(123a)')
      expect(tokens[2]).toEqual value: '123a', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'invalid.illegal.identifier.js']

      {tokens} = grammar.tokenizeLine('a(1.prop)')
      expect(tokens[2]).toEqual value: '1', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'invalid.illegal.identifier.js']
      expect(tokens[3]).toEqual value: '.', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'meta.delimiter.property.period.js']
      expect(tokens[4]).toEqual value: 'prop', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'variable.other.property.js']

    it "tokenizes function declaration as an argument", ->
      {tokens} = grammar.tokenizeLine('a(function b(p) { return p; })')
      expect(tokens[0]).toEqual value: 'a', scopes: ['source.js', 'meta.function-call.js', 'entity.name.function.js']
      expect(tokens[1]).toEqual value: '(', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(tokens[2]).toEqual value: 'function', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'meta.function.js', 'storage.type.function.js']
      expect(tokens[4]).toEqual value: 'b', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'meta.function.js', 'entity.name.function.js']
      expect(tokens[5]).toEqual value: '(', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'meta.function.js', 'meta.parameters.js', 'punctuation.definition.parameters.begin.bracket.round.js']
      expect(tokens[6]).toEqual value: 'p', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'meta.function.js', 'meta.parameters.js', 'variable.parameter.function.js']
      expect(tokens[7]).toEqual value: ')', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'meta.function.js', 'meta.parameters.js', 'punctuation.definition.parameters.end.bracket.round.js']
      expect(tokens[9]).toEqual value: '{', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.function.body.begin.bracket.curly.js']
      expect(tokens[11]).toEqual value: 'return', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'keyword.control.js']
      expect(tokens[12]).toEqual value: ' p', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js']
      expect(tokens[13]).toEqual value: ';', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.terminator.statement.js']
      expect(tokens[15]).toEqual value: '}', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.function.body.end.bracket.curly.js']
      expect(tokens[16]).toEqual value: ')', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']

  describe "method calls", ->
    it "tokenizes method calls", ->
      {tokens} = grammar.tokenizeLine('a.b(1+1)')
      expect(tokens[0]).toEqual value: 'a', scopes: ['source.js', 'variable.other.object.js']
      expect(tokens[1]).toEqual value: '.', scopes: ['source.js', 'meta.method-call.js', 'meta.delimiter.method.period.js']
      expect(tokens[2]).toEqual value: 'b', scopes: ['source.js', 'meta.method-call.js', 'entity.name.function.js']
      expect(tokens[3]).toEqual value: '(', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(tokens[4]).toEqual value: '1', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'constant.numeric.decimal.js']
      expect(tokens[5]).toEqual value: '+', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'keyword.operator.js']
      expect(tokens[6]).toEqual value: '1', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'constant.numeric.decimal.js']
      expect(tokens[7]).toEqual value: ')', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']

      {tokens} = grammar.tokenizeLine('a . b(1+1)')
      expect(tokens[2]).toEqual value: '.', scopes: ['source.js', 'meta.method-call.js', 'meta.delimiter.method.period.js']
      expect(tokens[4]).toEqual value: 'b', scopes: ['source.js', 'meta.method-call.js', 'entity.name.function.js']
      expect(tokens[5]).toEqual value: '(', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']

      {tokens} = grammar.tokenizeLine('a.$abc$()')
      expect(tokens[2]).toEqual value: '$abc$', scopes: ['source.js', 'meta.method-call.js', 'entity.name.function.js']

      {tokens} = grammar.tokenizeLine('a.$$()')
      expect(tokens[2]).toEqual value: '$$', scopes: ['source.js', 'meta.method-call.js', 'entity.name.function.js']

      lines = grammar.tokenizeLines """
        gulp.src("./*.js")
          .pipe(minify())
          .pipe(gulp.dest("build"))
      """
      expect(lines[0][0]).toEqual value: 'gulp', scopes: ['source.js', 'variable.other.object.js']
      expect(lines[0][1]).toEqual value: '.', scopes: ['source.js', 'meta.method-call.js', 'meta.delimiter.method.period.js']
      expect(lines[0][2]).toEqual value: 'src', scopes: ['source.js', 'meta.method-call.js', 'entity.name.function.js']
      expect(lines[0][3]).toEqual value: '(', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(lines[0][4]).toEqual value: '"', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']
      expect(lines[0][5]).toEqual value: './*.js', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'string.quoted.double.js']
      expect(lines[0][6]).toEqual value: '"', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'string.quoted.double.js', 'punctuation.definition.string.end.js']
      expect(lines[0][7]).toEqual value: ')', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']
      expect(lines[1][1]).toEqual value: '.', scopes: ['source.js', 'meta.method-call.js', 'meta.delimiter.method.period.js']
      expect(lines[1][2]).toEqual value: 'pipe', scopes: ['source.js', 'meta.method-call.js', 'entity.name.function.js']
      expect(lines[1][3]).toEqual value: '(', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(lines[1][4]).toEqual value: 'minify', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'meta.function-call.js', 'entity.name.function.js']
      expect(lines[1][5]).toEqual value: '(', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(lines[1][6]).toEqual value: ')', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']
      expect(lines[1][7]).toEqual value: ')', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']
      expect(lines[2][1]).toEqual value: '.', scopes: ['source.js', 'meta.method-call.js', 'meta.delimiter.method.period.js']
      expect(lines[2][2]).toEqual value: 'pipe', scopes: ['source.js', 'meta.method-call.js', 'entity.name.function.js']
      expect(lines[2][3]).toEqual value: '(', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(lines[2][4]).toEqual value: 'gulp', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'variable.other.object.js']
      expect(lines[2][5]).toEqual value: '.', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'meta.method-call.js', 'meta.delimiter.method.period.js']
      expect(lines[2][6]).toEqual value: 'dest', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'meta.method-call.js', 'entity.name.function.js']
      expect(lines[2][7]).toEqual value: '(', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(lines[2][8]).toEqual value: '"', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'meta.method-call.js', 'meta.arguments.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']
      expect(lines[2][9]).toEqual value: 'build', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'meta.method-call.js', 'meta.arguments.js', 'string.quoted.double.js']
      expect(lines[2][10]).toEqual value: '"', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'meta.method-call.js', 'meta.arguments.js', 'string.quoted.double.js', 'punctuation.definition.string.end.js']
      expect(lines[2][11]).toEqual value: ')', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']
      expect(lines[2][12]).toEqual value: ')', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']

    describe "built-in methods", ->
      methods    = ["require", "parseInt", "parseFloat", "print"]
      domMethods = ["substringData", "submit", "splitText", "setNamedItem", "setAttribute"]

      for method in methods
        it "tokenizes '#{method}'", ->
          {tokens} = grammar.tokenizeLine('.' + method + '()')
          expect(tokens[0]).toEqual value: '.', scopes: ['source.js', 'meta.method-call.js', 'meta.delimiter.method.period.js']
          expect(tokens[1]).toEqual value: method, scopes: ['source.js', 'meta.method-call.js', 'support.function.js']
          expect(tokens[2]).toEqual value: '(', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
          expect(tokens[3]).toEqual value: ')', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']

      for domMethod in domMethods
        it "tokenizes '#{domMethod}'", ->
          {tokens} = grammar.tokenizeLine('.' + domMethod + '()')
          expect(tokens[0]).toEqual value: '.', scopes: ['source.js', 'meta.method-call.js', 'meta.delimiter.method.period.js']
          expect(tokens[1]).toEqual value: domMethod, scopes: ['source.js', 'meta.method-call.js', 'support.function.dom.js']
          expect(tokens[2]).toEqual value: '(', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
          expect(tokens[3]).toEqual value: ')', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']

  describe "properties", ->
    it "tokenizes properties", ->
      {tokens} = grammar.tokenizeLine('obj.property')
      expect(tokens[0]).toEqual value: 'obj', scopes: ['source.js', 'variable.other.object.js']
      expect(tokens[1]).toEqual value: '.', scopes: ['source.js', 'meta.delimiter.property.period.js']
      expect(tokens[2]).toEqual value: 'property', scopes: ['source.js', 'variable.other.property.js']

      {tokens} = grammar.tokenizeLine('obj.property.property')
      expect(tokens[0]).toEqual value: 'obj', scopes: ['source.js', 'variable.other.object.js']
      expect(tokens[1]).toEqual value: '.', scopes: ['source.js', 'meta.delimiter.property.period.js']
      expect(tokens[2]).toEqual value: 'property', scopes: ['source.js', 'variable.other.object.property.js']

      {tokens} = grammar.tokenizeLine('obj.Property')
      expect(tokens[0]).toEqual value: 'obj', scopes: ['source.js', 'variable.other.object.js']
      expect(tokens[1]).toEqual value: '.', scopes: ['source.js', 'meta.delimiter.property.period.js']
      expect(tokens[2]).toEqual value: 'Property', scopes: ['source.js', 'variable.other.property.js']

      {tokens} = grammar.tokenizeLine('obj.$abc$')
      expect(tokens[2]).toEqual value: '$abc$', scopes: ['source.js', 'variable.other.property.js']

      {tokens} = grammar.tokenizeLine('obj.$$')
      expect(tokens[2]).toEqual value: '$$', scopes: ['source.js', 'variable.other.property.js']

      {tokens} = grammar.tokenizeLine('a().b')
      expect(tokens[2]).toEqual value: ')', scopes: ['source.js', 'meta.function-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']
      expect(tokens[3]).toEqual value: '.', scopes: ['source.js', 'meta.delimiter.property.period.js']
      expect(tokens[4]).toEqual value: 'b', scopes: ['source.js', 'variable.other.property.js']

      {tokens} = grammar.tokenizeLine('a.123illegal')
      expect(tokens[0]).toEqual value: 'a', scopes: ['source.js']
      expect(tokens[1]).toEqual value: '.', scopes: ['source.js', 'meta.delimiter.property.period.js']
      expect(tokens[2]).toEqual value: '123illegal', scopes: ['source.js', 'invalid.illegal.identifier.js']

    it "tokenizes constant properties", ->
      {tokens} = grammar.tokenizeLine('obj.MY_CONSTANT')
      expect(tokens[0]).toEqual value: 'obj', scopes: ['source.js', 'variable.other.object.js']
      expect(tokens[1]).toEqual value: '.', scopes: ['source.js', 'meta.delimiter.property.period.js']
      expect(tokens[2]).toEqual value: 'MY_CONSTANT', scopes: ['source.js', 'constant.other.property.js']

      {tokens} = grammar.tokenizeLine('obj.MY_CONSTANT.prop')
      expect(tokens[0]).toEqual value: 'obj', scopes: ['source.js', 'variable.other.object.js']
      expect(tokens[1]).toEqual value: '.', scopes: ['source.js', 'meta.delimiter.property.period.js']
      expect(tokens[2]).toEqual value: 'MY_CONSTANT', scopes: ['source.js', 'constant.other.object.property.js']

      {tokens} = grammar.tokenizeLine('a.C')
      expect(tokens[0]).toEqual value: 'a', scopes: ['source.js', 'variable.other.object.js']
      expect(tokens[1]).toEqual value: '.', scopes: ['source.js', 'meta.delimiter.property.period.js']
      expect(tokens[2]).toEqual value: 'C', scopes: ['source.js', 'constant.other.property.js']

  describe "strings and functions", ->
    it "doesn't confuse them", ->
      {tokens} = grammar.tokenizeLine("'a'.b(':c(d)')")
      expect(tokens[0]).toEqual value: "'", scopes: ['source.js', 'string.quoted.single.js', 'punctuation.definition.string.begin.js']
      expect(tokens[1]).toEqual value: "a", scopes: ['source.js', 'string.quoted.single.js']
      expect(tokens[2]).toEqual value: "'", scopes: ['source.js', 'string.quoted.single.js', 'punctuation.definition.string.end.js']
      expect(tokens[3]).toEqual value: ".", scopes: ['source.js', 'meta.method-call.js', 'meta.delimiter.method.period.js']
      expect(tokens[4]).toEqual value: "b", scopes: ['source.js', 'meta.method-call.js', 'entity.name.function.js']
      expect(tokens[5]).toEqual value: "(", scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(tokens[6]).toEqual value: "'", scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'string.quoted.single.js', 'punctuation.definition.string.begin.js']
      expect(tokens[7]).toEqual value: ":c(d)", scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'string.quoted.single.js']
      expect(tokens[8]).toEqual value: "'", scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'string.quoted.single.js', 'punctuation.definition.string.end.js']
      expect(tokens[9]).toEqual value: ")", scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']

      delimsByScope =
        "string.quoted.double.js": '"'
        "string.quoted.single.js": "'"

      for scope, delim of delimsByScope
        {tokens} = grammar.tokenizeLine('a.push(' + delim + 'x' + delim + ' + y + ' + delim + ':function()' + delim + ');')
        expect(tokens[2]).toEqual value: 'push', scopes: ['source.js', 'meta.method-call.js', 'support.function.js']
        expect(tokens[3]).toEqual value: '(', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
        expect(tokens[4]).toEqual value: delim, scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', scope, 'punctuation.definition.string.begin.js']
        expect(tokens[5]).toEqual value: 'x', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', scope]
        expect(tokens[6]).toEqual value: delim, scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', scope, 'punctuation.definition.string.end.js']
        expect(tokens[8]).toEqual value: '+', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'keyword.operator.js']
        expect(tokens[9]).toEqual value: ' y ', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js']
        expect(tokens[10]).toEqual value: '+', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'keyword.operator.js']
        expect(tokens[12]).toEqual value: delim, scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', scope, 'punctuation.definition.string.begin.js']
        expect(tokens[13]).toEqual value: ':function()', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', scope]
        expect(tokens[14]).toEqual value: delim, scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', scope, 'punctuation.definition.string.end.js']
        expect(tokens[15]).toEqual value: ')', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']

  describe "comments", ->
    it "tokenizes // comments", ->
      {tokens} = grammar.tokenizeLine '//'
      expect(tokens[0]).toEqual value: '//', scopes: ['source.js', 'comment.line.double-slash.js', 'punctuation.definition.comment.js']

      {tokens} = grammar.tokenizeLine '// stuff'
      expect(tokens[0]).toEqual value: '//', scopes: ['source.js', 'comment.line.double-slash.js', 'punctuation.definition.comment.js']
      expect(tokens[1]).toEqual value: ' stuff', scopes: ['source.js', 'comment.line.double-slash.js']

    it "tokenizes /* */ comments", ->
      {tokens} = grammar.tokenizeLine('/**/')
      expect(tokens[0]).toEqual value: '/*', scopes: ['source.js', 'comment.block.empty.js', 'punctuation.definition.comment.begin.js']
      expect(tokens[1]).toEqual value: '*/', scopes: ['source.js', 'comment.block.empty.js', 'punctuation.definition.comment.end.js']

      {tokens} = grammar.tokenizeLine('/* foo */')
      expect(tokens[0]).toEqual value: '/*', scopes: ['source.js', 'comment.block.js', 'punctuation.definition.comment.begin.js']
      expect(tokens[1]).toEqual value: ' foo ', scopes: ['source.js', 'comment.block.js']
      expect(tokens[2]).toEqual value: '*/', scopes: ['source.js', 'comment.block.js', 'punctuation.definition.comment.end.js']

    it "tokenizes /** */ comments", ->
      {tokens} = grammar.tokenizeLine('/***/')
      expect(tokens[0]).toEqual value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']
      expect(tokens[1]).toEqual value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']

      {tokens} = grammar.tokenizeLine('/** foo */')
      expect(tokens[0]).toEqual value: '/**', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.begin.js']
      expect(tokens[1]).toEqual value: ' foo ', scopes: ['source.js', 'comment.block.documentation.js']
      expect(tokens[2]).toEqual value: '*/', scopes: ['source.js', 'comment.block.documentation.js', 'punctuation.definition.comment.end.js']

    it "tokenizes // comments", ->
      {tokens} = grammar.tokenizeLine('// comment')
      expect(tokens[0]).toEqual value: '//', scopes: ['source.js', 'comment.line.double-slash.js', 'punctuation.definition.comment.js']
      expect(tokens[1]).toEqual value: ' comment', scopes: ['source.js', 'comment.line.double-slash.js']

    it "tokenizes comments inside constant definitions", ->
      {tokens} = grammar.tokenizeLine('const a, // comment')
      expect(tokens[0]).toEqual value: 'const', scopes: ['source.js', 'storage.type.const.js']
      expect(tokens[2]).toEqual value: 'a', scopes: ['source.js', 'constant.other.js']
      expect(tokens[3]).toEqual value: ',', scopes: ['source.js', 'meta.delimiter.object.comma.js']
      expect(tokens[5]).toEqual value: '//', scopes: ['source.js', 'comment.line.double-slash.js', 'punctuation.definition.comment.js']
      expect(tokens[6]).toEqual value: ' comment', scopes: ['source.js', 'comment.line.double-slash.js']

    it "tokenizes comments inside function declarations", ->
      {tokens} = grammar.tokenizeLine('function /* */ foo() /* */ {}')
      expect(tokens[0]).toEqual value: 'function', scopes: ['source.js', 'meta.function.js', 'storage.type.function.js']
      expect(tokens[2]).toEqual value: '/*', scopes: ['source.js', 'meta.function.js', 'comment.block.js', 'punctuation.definition.comment.begin.js']
      expect(tokens[4]).toEqual value: '*/', scopes: ['source.js', 'meta.function.js', 'comment.block.js', 'punctuation.definition.comment.end.js']
      expect(tokens[6]).toEqual value: 'foo', scopes: ['source.js', 'meta.function.js', 'entity.name.function.js']
      expect(tokens[10]).toEqual value: '/*', scopes: ['source.js', 'comment.block.js', 'punctuation.definition.comment.begin.js']
      expect(tokens[12]).toEqual value: '*/', scopes: ['source.js', 'comment.block.js', 'punctuation.definition.comment.end.js']

      {tokens} = grammar.tokenizeLine('x => /* */ {}')
      expect(tokens[0]).toEqual value: 'x', scopes: ['source.js', 'meta.function.arrow.js', 'meta.parameters.js', 'variable.parameter.function.js']
      expect(tokens[2]).toEqual value: '=>', scopes: ['source.js', 'meta.function.arrow.js', 'storage.type.function.arrow.js']
      expect(tokens[4]).toEqual value: '/*', scopes: ['source.js', 'comment.block.js', 'punctuation.definition.comment.begin.js']
      expect(tokens[6]).toEqual value: '*/', scopes: ['source.js', 'comment.block.js', 'punctuation.definition.comment.end.js']
      expect(tokens[8]).toEqual value: '{', scopes: ['source.js', 'punctuation.definition.function.body.begin.bracket.curly.js']

      {tokens} = grammar.tokenizeLine('.foo = x => /* */ {}')
      expect(tokens[1]).toEqual value: 'foo', scopes: ['source.js', 'meta.function.arrow.js', 'entity.name.function.js']
      expect(tokens[5]).toEqual value: 'x', scopes: ['source.js', 'meta.function.arrow.js', 'meta.parameters.js', 'variable.parameter.function.js']
      expect(tokens[7]).toEqual value: '=>', scopes: ['source.js', 'meta.function.arrow.js', 'storage.type.function.arrow.js']
      expect(tokens[9]).toEqual value: '/*', scopes: ['source.js', 'comment.block.js', 'punctuation.definition.comment.begin.js']
      expect(tokens[11]).toEqual value: '*/', scopes: ['source.js', 'comment.block.js', 'punctuation.definition.comment.end.js']
      expect(tokens[13]).toEqual value: '{', scopes: ['source.js', 'punctuation.definition.function.body.begin.bracket.curly.js']

      lines = grammar.tokenizeLines '''
        function
        // comment
        foo() {}
      '''
      expect(lines[0][0]).toEqual value: 'function', scopes: ['source.js', 'meta.function.js', 'storage.type.function.js']
      expect(lines[1][0]).toEqual value: '//', scopes: ['source.js', 'meta.function.js', 'comment.line.double-slash.js', 'punctuation.definition.comment.js']
      expect(lines[1][1]).toEqual value: ' comment', scopes: ['source.js', 'meta.function.js', 'comment.line.double-slash.js']
      expect(lines[2][0]).toEqual value: 'foo', scopes: ['source.js', 'meta.function.js', 'entity.name.function.js']

      lines = grammar.tokenizeLines '''
        x  =>
          // comment
        {}
      '''
      expect(lines[0][0]).toEqual value: 'x', scopes: ['source.js', 'meta.function.arrow.js', 'meta.parameters.js', 'variable.parameter.function.js']
      expect(lines[0][2]).toEqual value: '=>', scopes: ['source.js', 'meta.function.arrow.js', 'storage.type.function.arrow.js']
      expect(lines[1][1]).toEqual value: '//', scopes: ['source.js', 'comment.line.double-slash.js', 'punctuation.definition.comment.js']
      expect(lines[1][2]).toEqual value: ' comment', scopes: ['source.js', 'comment.line.double-slash.js']
      expect(lines[2][0]).toEqual value: '{', scopes: ['source.js', 'punctuation.definition.function.body.begin.bracket.curly.js']

    it "tokenizes comments inside function parameters correctly", ->
      {tokens} = grammar.tokenizeLine('function test(p1 /*, p2 */) {}')
      expect(tokens[6]).toEqual value: '/*', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'comment.block.js', 'punctuation.definition.comment.begin.js']
      expect(tokens[7]).toEqual value: ', p2 ', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'comment.block.js']
      expect(tokens[8]).toEqual value: '*/', scopes: ['source.js', 'meta.function.js', 'meta.parameters.js', 'comment.block.js', 'punctuation.definition.comment.end.js']

  describe "console", ->
    it "tokenizes the console keyword", ->
      {tokens} = grammar.tokenizeLine('console;')
      expect(tokens[0]).toEqual value: 'console', scopes: ['source.js', 'entity.name.type.object.console.js']
      expect(tokens[1]).toEqual value: ';', scopes: ['source.js', 'punctuation.terminator.statement.js']

      {tokens} = grammar.tokenizeLine('console$')
      expect(tokens[0]).not.toEqual value: 'console', scopes: ['source.js', 'entity.name.type.object.console.js']

      {tokens} = grammar.tokenizeLine('$console')
      expect(tokens[1]).not.toEqual value: 'console', scopes: ['source.js', 'entity.name.type.object.console.js']

    it "tokenizes console support functions", ->
      {tokens} = grammar.tokenizeLine('console.log().log()')
      expect(tokens[0]).toEqual value: 'console', scopes: ['source.js', 'entity.name.type.object.console.js']
      expect(tokens[1]).toEqual value: '.', scopes: ['source.js', 'meta.method-call.js', 'meta.delimiter.method.period.js']
      expect(tokens[2]).toEqual value: 'log', scopes: ['source.js', 'meta.method-call.js', 'support.function.console.js']
      expect(tokens[3]).toEqual value: '(', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(tokens[4]).toEqual value: ')', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']
      expect(tokens[6]).not.toEqual value: 'log', scopes: ['source.js', 'meta.method-call.js', 'support.function.console.js']

      {tokens} = grammar.tokenizeLine('console/**/.log()')
      expect(tokens[0]).toEqual value: 'console', scopes: ['source.js', 'entity.name.type.object.console.js']
      expect(tokens[1]).toEqual value: '/*', scopes: ['source.js', 'comment.block.empty.js', 'punctuation.definition.comment.begin.js']
      expect(tokens[2]).toEqual value: '*/', scopes: ['source.js', 'comment.block.empty.js', 'punctuation.definition.comment.end.js']
      expect(tokens[3]).toEqual value: '.', scopes: ['source.js', 'meta.method-call.js', 'meta.delimiter.method.period.js']
      expect(tokens[4]).toEqual value: 'log', scopes: ['source.js', 'meta.method-call.js', 'support.function.console.js']
      expect(tokens[5]).toEqual value: '(', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(tokens[6]).toEqual value: ')', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']

      lines = grammar.tokenizeLines '''
        console
        .log();
      '''
      expect(lines[0][0]).toEqual value: 'console', scopes: ['source.js', 'entity.name.type.object.console.js']
      expect(lines[1][0]).toEqual value: '.', scopes: ['source.js', 'meta.method-call.js', 'meta.delimiter.method.period.js']
      expect(lines[1][1]).toEqual value: 'log', scopes: ['source.js', 'meta.method-call.js', 'support.function.console.js']
      expect(lines[1][2]).toEqual value: '(', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(lines[1][3]).toEqual value: ')', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']
      expect(lines[1][4]).toEqual value: ';', scopes: ['source.js', 'punctuation.terminator.statement.js']

      {tokens} = grammar.tokenizeLine('console . log();')
      expect(tokens[0]).toEqual value: 'console', scopes: ['source.js', 'entity.name.type.object.console.js']
      expect(tokens[2]).toEqual value: '.', scopes: ['source.js', 'meta.method-call.js', 'meta.delimiter.method.period.js']
      expect(tokens[4]).toEqual value: 'log', scopes: ['source.js', 'meta.method-call.js', 'support.function.console.js']
      expect(tokens[5]).toEqual value: '(', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(tokens[6]).toEqual value: ')', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']
      expect(tokens[7]).toEqual value: ';', scopes: ['source.js', 'punctuation.terminator.statement.js']

    it "tokenizes console custom functions", ->
      {tokens} = grammar.tokenizeLine('console.foo();')
      expect(tokens[0]).toEqual value: 'console', scopes: ['source.js', 'entity.name.type.object.console.js']
      expect(tokens[1]).toEqual value: '.', scopes: ['source.js', 'meta.method-call.js', 'meta.delimiter.method.period.js']
      expect(tokens[2]).toEqual value: 'foo', scopes: ['source.js', 'meta.method-call.js', 'entity.name.function.js']
      expect(tokens[3]).toEqual value: '(', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(tokens[4]).toEqual value: ')', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']
      expect(tokens[5]).toEqual value: ';', scopes: ['source.js', 'punctuation.terminator.statement.js']

      {tokens} = grammar.tokenizeLine('console .foo();')
      expect(tokens[3]).toEqual value: 'foo', scopes: ['source.js', 'meta.method-call.js', 'entity.name.function.js']

  describe "math", ->
    it "tokenizes the math object", ->
      {tokens} = grammar.tokenizeLine('Math;')
      expect(tokens[0]).toEqual value: 'Math', scopes: ['source.js', 'support.class.math.js']
      expect(tokens[1]).toEqual value: ';', scopes: ['source.js', 'punctuation.terminator.statement.js']

    it "tokenizes math support functions/properties", ->
      {tokens} = grammar.tokenizeLine('Math.random();')
      expect(tokens[0]).toEqual value: 'Math', scopes: ['source.js', 'support.class.math.js']
      expect(tokens[1]).toEqual value: '.', scopes: ['source.js', 'meta.method-call.js', 'meta.delimiter.method.period.js']
      expect(tokens[2]).toEqual value: 'random', scopes: ['source.js', 'meta.method-call.js', 'support.function.math.js']
      expect(tokens[3]).toEqual value: '(', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(tokens[4]).toEqual value: ')', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']
      expect(tokens[5]).toEqual value: ';', scopes: ['source.js', 'punctuation.terminator.statement.js']

      lines = grammar.tokenizeLines '''
        Math
        .random();
      '''
      expect(lines[0][0]).toEqual value: 'Math', scopes: ['source.js', 'support.class.math.js']
      expect(lines[1][0]).toEqual value: '.', scopes: ['source.js', 'meta.method-call.js', 'meta.delimiter.method.period.js']
      expect(lines[1][1]).toEqual value: 'random', scopes: ['source.js', 'meta.method-call.js', 'support.function.math.js']
      expect(lines[1][2]).toEqual value: '(', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(lines[1][3]).toEqual value: ')', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']
      expect(lines[1][4]).toEqual value: ';', scopes: ['source.js', 'punctuation.terminator.statement.js']

      {tokens} = grammar.tokenizeLine('Math.PI;')
      expect(tokens[0]).toEqual value: 'Math', scopes: ['source.js', 'support.class.math.js']
      expect(tokens[1]).toEqual value: '.', scopes: ['source.js', 'meta.delimiter.property.period.js']
      expect(tokens[2]).toEqual value: 'PI', scopes: ['source.js', 'support.constant.property.math.js']
      expect(tokens[3]).toEqual value: ';', scopes: ['source.js', 'punctuation.terminator.statement.js']

    it "tokenizes math custom functions", ->
      {tokens} = grammar.tokenizeLine('Math.PI();')
      expect(tokens[0]).toEqual value: 'Math', scopes: ['source.js', 'support.class.math.js']
      expect(tokens[1]).toEqual value: '.', scopes: ['source.js', 'meta.method-call.js', 'meta.delimiter.method.period.js']
      expect(tokens[2]).toEqual value: 'PI', scopes: ['source.js', 'meta.method-call.js', 'entity.name.function.js']
      expect(tokens[3]).toEqual value: '(', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(tokens[4]).toEqual value: ')', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']
      expect(tokens[5]).toEqual value: ';', scopes: ['source.js', 'punctuation.terminator.statement.js']

  describe "promise", ->
    it "tokenizes the promise object", ->
      {tokens} = grammar.tokenizeLine('Promise;')
      expect(tokens[0]).toEqual value: 'Promise', scopes: ['source.js', 'support.class.promise.js']
      expect(tokens[1]).toEqual value: ';', scopes: ['source.js', 'punctuation.terminator.statement.js']

    it "tokenizes promise support functions", ->
      {tokens} = grammar.tokenizeLine('Promise.race();')
      expect(tokens[0]).toEqual value: 'Promise', scopes: ['source.js', 'support.class.promise.js']
      expect(tokens[1]).toEqual value: '.', scopes: ['source.js', 'meta.method-call.js', 'meta.delimiter.method.period.js']
      expect(tokens[2]).toEqual value: 'race', scopes: ['source.js', 'meta.method-call.js', 'support.function.promise.js']
      expect(tokens[3]).toEqual value: '(', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(tokens[4]).toEqual value: ')', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']
      expect(tokens[5]).toEqual value: ';', scopes: ['source.js', 'punctuation.terminator.statement.js']

      lines = grammar.tokenizeLines '''
        Promise
        .resolve();
      '''
      expect(lines[0][0]).toEqual value: 'Promise', scopes: ['source.js', 'support.class.promise.js']
      expect(lines[1][0]).toEqual value: '.', scopes: ['source.js', 'meta.method-call.js', 'meta.delimiter.method.period.js']
      expect(lines[1][1]).toEqual value: 'resolve', scopes: ['source.js', 'meta.method-call.js', 'support.function.promise.js']
      expect(lines[1][2]).toEqual value: '(', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(lines[1][3]).toEqual value: ')', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']
      expect(lines[1][4]).toEqual value: ';', scopes: ['source.js', 'punctuation.terminator.statement.js']

    it "tokenizes promise custom functions", ->
      {tokens} = grammar.tokenizeLine('Promise.anExtraFunction();')
      expect(tokens[0]).toEqual value: 'Promise', scopes: ['source.js', 'support.class.promise.js']
      expect(tokens[1]).toEqual value: '.', scopes: ['source.js', 'meta.method-call.js', 'meta.delimiter.method.period.js']
      expect(tokens[2]).toEqual value: 'anExtraFunction', scopes: ['source.js', 'meta.method-call.js', 'entity.name.function.js']
      expect(tokens[3]).toEqual value: '(', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.begin.bracket.round.js']
      expect(tokens[4]).toEqual value: ')', scopes: ['source.js', 'meta.method-call.js', 'meta.arguments.js', 'punctuation.definition.arguments.end.bracket.round.js']
      expect(tokens[5]).toEqual value: ';', scopes: ['source.js', 'punctuation.terminator.statement.js']

  describe "object literals", ->
    keywords = ['super', 'this', 'null', 'true', 'false', 'debugger', 'exports', '__filename']

    for keyword in keywords
      it "tokenizes the #{keyword} keyword when it is an object key", ->
        {tokens} = grammar.tokenizeLine("#{keyword}: 1")
        expect(tokens[0]).toEqual value: keyword, scopes: ['source.js']
        expect(tokens[1]).toEqual value: ':', scopes: ['source.js', 'keyword.operator.assignment.js']

    it "tokenizes object keys", ->
      {tokens} = grammar.tokenizeLine('foo: 1')
      expect(tokens[0]).toEqual value: 'foo', scopes: ['source.js']
      expect(tokens[1]).toEqual value: ':', scopes: ['source.js', 'keyword.operator.assignment.js']

      {tokens} = grammar.tokenizeLine('$abc$: 1')
      expect(tokens[0]).toEqual value: '$abc$', scopes: ['source.js']
      expect(tokens[1]).toEqual value: ':', scopes: ['source.js', 'keyword.operator.assignment.js']

      {tokens} = grammar.tokenizeLine('0abc: 1')
      expect(tokens[0]).toEqual value: '0abc', scopes: ['source.js', 'invalid.illegal.identifier.js']
      expect(tokens[1]).toEqual value: ':', scopes: ['source.js', 'keyword.operator.assignment.js']

      {tokens} = grammar.tokenizeLine('"key": 1')
      expect(tokens[0]).toEqual value: '"', scopes: ['source.js', 'string.quoted.double.js', 'punctuation.definition.string.begin.js']
      expect(tokens[1]).toEqual value: 'key', scopes: ['source.js', 'string.quoted.double.js']
      expect(tokens[2]).toEqual value: '"', scopes: ['source.js', 'string.quoted.double.js', 'punctuation.definition.string.end.js']
      expect(tokens[3]).toEqual value: ':', scopes: ['source.js', 'keyword.operator.assignment.js']

    it "tokenizes numbers when they are object keys", ->
      {tokens} = grammar.tokenizeLine('123: 1')
      expect(tokens[0]).toEqual value: '123', scopes: ['source.js', 'constant.numeric.decimal.js']
      expect(tokens[1]).toEqual value: ':', scopes: ['source.js', 'keyword.operator.assignment.js']

    it "tokenizes constants when they are object keys", ->
      {tokens} = grammar.tokenizeLine('FOO: 1')
      expect(tokens[0]).toEqual value: 'FOO', scopes: ['source.js', 'constant.other.js']
      expect(tokens[1]).toEqual value: ':', scopes: ['source.js', 'keyword.operator.assignment.js']

  describe "ternary expressions", ->
    map =
      FOO: 'constant.other.js'
      super: 'variable.language.js'
      this: 'variable.language.js'
      null: 'constant.language.null.js'
      true: 'constant.language.boolean.true.js'
      false: 'constant.language.boolean.false.js'
      exports: 'support.variable.js'
      __filename: 'support.variable.js'

    for keyword, scope of map
      do (keyword, scope) ->
        it "tokenizes `#{keyword}` in the middle of ternary expressions", ->
          {tokens} = grammar.tokenizeLine("a ? #{keyword} : b")
          expect(tokens[3]).toEqual value: keyword, scopes: ['source.js', scope]

        it "tokenizes `#{keyword}` at the end of ternary expressions", ->
          {tokens} = grammar.tokenizeLine("a ? b : #{keyword}")
          expect(tokens[7]).toEqual value: keyword, scopes: ['source.js', scope]

    it "tokenizes yield at the end of ternary expressions", ->
      {tokens} = grammar.tokenizeLine('a ? b : yield')
      expect(tokens[7]).toEqual value: 'yield', scopes: ['source.js', 'meta.control.yield.js', 'keyword.control.js']

    it "tokenizes yield in the middle of ternary expressions", ->
      {tokens} = grammar.tokenizeLine('a ? yield : b')
      expect(tokens[3]).toEqual value: 'yield', scopes: ['source.js', 'meta.control.yield.js', 'keyword.control.js']

    it "tokenizes regular expressions inside ternary expressions", ->
      {tokens} = grammar.tokenizeLine('a ? /b/ : /c/')
      expect(tokens[0]).toEqual value: 'a ', scopes: ['source.js']
      expect(tokens[1]).toEqual value: '?', scopes: ['source.js', 'keyword.operator.ternary.js']
      expect(tokens[2]).toEqual value: ' ', scopes: ['source.js', 'string.regexp.js']
      expect(tokens[3]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.begin.js']
      expect(tokens[4]).toEqual value: 'b', scopes: ['source.js', 'string.regexp.js']
      expect(tokens[5]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.end.js']
      expect(tokens[6]).toEqual value: ' ', scopes: ['source.js']
      expect(tokens[7]).toEqual value: ':', scopes: ['source.js', 'keyword.operator.ternary.js']
      expect(tokens[8]).toEqual value: ' ', scopes: ['source.js', 'string.regexp.js']
      expect(tokens[9]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.begin.js']
      expect(tokens[10]).toEqual value: 'c', scopes: ['source.js', 'string.regexp.js']
      expect(tokens[11]).toEqual value: '/', scopes: ['source.js', 'string.regexp.js', 'punctuation.definition.string.end.js']

    it "tokenizes object literals in the middle of ternary expressions", ->
      {tokens} = grammar.tokenizeLine('a ? {key: value} : b')
      expect(tokens[1]).toEqual value: '?', scopes: ['source.js', 'keyword.operator.ternary.js']
      expect(tokens[9]).toEqual value: ':', scopes: ['source.js', 'keyword.operator.ternary.js']

    it "tokenizes arrow functions inside ternary expressions", ->
      {tokens} = grammar.tokenizeLine('result = condition ? something : (a, b) => a + b')
      expect(tokens[3]).toEqual value: '?', scopes: ['source.js', 'keyword.operator.ternary.js']
      expect(tokens[7]).toEqual value: ':', scopes: ['source.js', 'keyword.operator.ternary.js']
      expect(tokens[16]).toEqual value: '=>', scopes: ['source.js', 'meta.function.arrow.js', 'storage.type.function.arrow.js']

      {tokens} = grammar.tokenizeLine('result = condition ? (a, b) => a + b : something')
      expect(tokens[3]).toEqual value: '?', scopes: ['source.js', 'keyword.operator.ternary.js']
      expect(tokens[12]).toEqual value: '=>', scopes: ['source.js', 'meta.function.arrow.js', 'storage.type.function.arrow.js']
      expect(tokens[18]).toEqual value: ':', scopes: ['source.js', 'keyword.operator.ternary.js']

  describe "switch statements", ->
    it "tokenizes the switch keyword", ->
      {tokens} = grammar.tokenizeLine('switch(){}')
      expect(tokens[0]).toEqual value: 'switch', scopes: ['source.js', 'meta.switch-statement.js', 'keyword.control.switch.js']

    it "tokenizes switch expression", ->
      {tokens} = grammar.tokenizeLine('switch(foo + bar){}')
      expect(tokens[1]).toEqual value: '(', scopes: ['source.js', 'meta.switch-statement.js', 'punctuation.definition.switch-expression.begin.bracket.round.js']
      expect(tokens[2]).toEqual value: 'foo ', scopes: ['source.js', 'meta.switch-statement.js']
      expect(tokens[3]).toEqual value: '+', scopes: ['source.js', 'meta.switch-statement.js', 'keyword.operator.js']
      expect(tokens[4]).toEqual value: ' bar', scopes: ['source.js', 'meta.switch-statement.js']
      expect(tokens[5]).toEqual value: ')', scopes: ['source.js', 'meta.switch-statement.js', 'punctuation.definition.switch-expression.end.bracket.round.js']

    it "tokenizes switch block", ->
      lines = grammar.tokenizeLines '''
        switch (foo())
        {
          case abc:
          case 1+1:
            2+2
            break;
          case null:
          default:
        }
      '''
      expect(lines[1][0]).toEqual value: '{', scopes: ['source.js', 'meta.switch-statement.js', 'punctuation.definition.section.switch-block.begin.bracket.curly.js']
      expect(lines[2][1]).toEqual value: 'case', scopes: ['source.js', 'meta.switch-statement.js', 'keyword.control.case.js']
      expect(lines[2][3]).toEqual value: 'abc', scopes: ['source.js', 'meta.switch-statement.js']
      expect(lines[2][4]).toEqual value: ':', scopes: ['source.js', 'meta.switch-statement.js', 'punctuation.definition.section.case-statement.js']
      expect(lines[3][1]).toEqual value: 'case', scopes: ['source.js', 'meta.switch-statement.js', 'keyword.control.case.js']
      expect(lines[3][3]).toEqual value: '1', scopes: ['source.js', 'meta.switch-statement.js', 'constant.numeric.decimal.js']
      expect(lines[3][4]).toEqual value: '+', scopes: ['source.js', 'meta.switch-statement.js', 'keyword.operator.js']
      expect(lines[3][5]).toEqual value: '1', scopes: ['source.js', 'meta.switch-statement.js', 'constant.numeric.decimal.js']
      expect(lines[3][6]).toEqual value: ':', scopes: ['source.js', 'meta.switch-statement.js', 'punctuation.definition.section.case-statement.js']
      expect(lines[4][1]).toEqual value: '2', scopes: ['source.js', 'meta.switch-statement.js', 'constant.numeric.decimal.js']
      expect(lines[4][2]).toEqual value: '+', scopes: ['source.js', 'meta.switch-statement.js', 'keyword.operator.js']
      expect(lines[4][3]).toEqual value: '2', scopes: ['source.js', 'meta.switch-statement.js', 'constant.numeric.decimal.js']
      expect(lines[5][1]).toEqual value: 'break', scopes: ['source.js', 'meta.switch-statement.js', 'keyword.control.js']
      expect(lines[5][2]).toEqual value: ';', scopes: ['source.js', 'meta.switch-statement.js', 'punctuation.terminator.statement.js']
      expect(lines[6][1]).toEqual value: 'case', scopes: ['source.js', 'meta.switch-statement.js', 'keyword.control.case.js']
      expect(lines[6][3]).toEqual value: 'null', scopes: ['source.js', 'meta.switch-statement.js', 'constant.language.null.js']
      expect(lines[6][4]).toEqual value: ':', scopes: ['source.js', 'meta.switch-statement.js', 'punctuation.definition.section.case-statement.js']
      expect(lines[7][1]).toEqual value: 'default', scopes: ['source.js', 'meta.switch-statement.js', 'keyword.control.default.js']
      expect(lines[7][2]).toEqual value: ':', scopes: ['source.js', 'meta.switch-statement.js', 'punctuation.definition.section.case-statement.js']
      expect(lines[8][0]).toEqual value: '}', scopes: ['source.js', 'meta.switch-statement.js', 'punctuation.definition.section.switch-block.end.bracket.curly.js']

  describe "indentation", ->
    editor = null

    beforeEach ->
      editor = buildTextEditor()
      editor.setGrammar(grammar)

    expectPreservedIndentation = (text) ->
      editor.setText(text)
      editor.autoIndentBufferRows(0, editor.getLineCount() - 1)

      expectedLines = text.split("\n")
      actualLines = editor.getText().split("\n")
      for actualLine, i in actualLines
        expect([
          actualLine,
          editor.indentLevelForLine(actualLine)
        ]).toEqual([
          expectedLines[i],
          editor.indentLevelForLine(expectedLines[i])
        ])

    it "indents allman-style curly braces", ->
      expectPreservedIndentation """
        if (true)
        {
          for (;;)
          {
            while (true)
            {
              x();
            }
          }
        }
        else
        {
          do
          {
            y();
          } while (true);
        }
      """

    it "indents non-allman-style curly braces", ->
      expectPreservedIndentation """
        if (true) {
          for (;;) { // "
            while (true) {
              x();
            }
          }
        } else {
          do {
            y();
          } while (true);
        }
      """

    it "doesn't indent case statements, because it wouldn't know when to outdent", ->
      expectPreservedIndentation """
        switch (e) {
          case 5:
          something();
          case 6:
          somethingElse();
        }
      """

    it "indents collection literals", ->
      expectPreservedIndentation """
        [ // "
          {
            a: b,
            c: d
          },
          e,
          f
        ]
      """

    it "indents function arguments", ->
      expectPreservedIndentation """
        f(
          g( // "
            h,
            i
          ),
          j
        );
      """

  describe "firstLineMatch", ->
    it "recognises interpreter directives", ->
      valid = """
        #!/usr/sbin/node foo
        #!/usr/bin/iojs foo=bar/
        #!/usr/sbin/node
        #!/usr/sbin/node foo bar baz
        #!/usr/bin/node perl
        #!/usr/bin/node bin/perl
        #!/usr/bin/node
        #!/bin/node
        #!/usr/bin/node --script=usr/bin
        #! /usr/bin/env A=003 B=149 C=150 D=xzd E=base64 F=tar G=gz H=head I=tail node
        #!\t/usr/bin/env --foo=bar node --quu=quux
        #! /usr/bin/node
        #!/usr/bin/env node
      """
      for line in valid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).not.toBeNull()

      invalid = """
        \x20#!/usr/sbin/node
        \t#!/usr/sbin/node
        #!/usr/bin/env-node/node-env/
        #!/usr/bin/env-node
        #! /usr/binnode
        #!\t/usr/bin/env --node=bar
      """
      for line in invalid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).toBeNull()

    it "recognises Emacs modelines", ->
      valid = """
        #-*-js-*-
        #-*-mode:js-*-
        /* -*-js-*- */
        // -*- JavaScript -*-
        /* -*- mode:js -*- */
        // -*- font:bar;mode:JS -*-
        // -*- font:bar;mode:JavaScript;foo:bar; -*-
        // -*-font:mode;mode:JS-*-
        // -*- foo:bar mode: js bar:baz -*-
        " -*-foo:bar;mode:JS;bar:foo-*- ";
        " -*-font-mode:foo;mode:JavaScript;foo-bar:quux-*-"
        "-*-font:x;foo:bar; mode : js;bar:foo;foooooo:baaaaar;fo:ba;-*-";
        "-*- font:x;foo : bar ; mode : jS ; bar : foo ; foooooo:baaaaar;fo:ba-*-";
      """
      for line in valid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).not.toBeNull()

      invalid = """
        /* --*js-*- */
        /* -*-- js -*-
        /* -*- -- js -*-
        /* -*- javascripts -;- -*-
        // -*- iJS -*-
        // -*- JS; -*-
        // -*- js-stuff -*-
        /* -*- model:js -*-
        /* -*- indent-mode:js -*-
        // -*- font:mode;JS -*-
        // -*- mode: -*- JS
        // -*- mode: grok-with-js -*-
        // -*-font:mode;mode:js--*-
      """
      for line in invalid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).toBeNull()

    it "recognises Vim modelines", ->
      valid = """
        vim: se filetype=javascript:
        # vim: se ft=javascript:
        # vim: set ft=javascript:
        # vim: set filetype=JavaScript:
        # vim: ft=javascript
        # vim: syntax=jAvaScRIPT
        # vim: se syntax=JAVASCRIPT:
        # ex: syntax=javascript
        # vim:ft=javascript
        # vim600: ft=javascript
        # vim>600: set ft=javascript:
        # vi:noai:sw=3 ts=6 ft=javascript
        # vi::::::::::noai:::::::::::: ft=javascript
        # vim:ts=4:sts=4:sw=4:noexpandtab:ft=javascript
        # vi:: noai : : : : sw   =3 ts   =6 ft  =javascript
        # vim: ts=4: pi sts=4: ft=javascript: noexpandtab: sw=4:
        # vim: ts=4 sts=4: ft=javascript noexpandtab:
        # vim:noexpandtab sts=4 ft=javascript ts=4
        # vim:noexpandtab:ft=javascript
        # vim:ts=4:sts=4 ft=javascript:noexpandtab:\x20
        # vim:noexpandtab titlestring=hi\|there\\\\ ft=javascript ts=4
      """
      for line in valid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).not.toBeNull()

      invalid = """
        ex: se filetype=javascript:
        _vi: se filetype=javascript:
         vi: se filetype=javascript
        # vim set ft=javascripts
        # vim: soft=javascript
        # vim: hairy-syntax=javascript:
        # vim set ft=javascript:
        # vim: setft=javascript:
        # vim: se ft=javascript backupdir=tmp
        # vim: set ft=javascript set cmdheight=1
        # vim:noexpandtab sts:4 ft:javascript ts:4
        # vim:noexpandtab titlestring=hi\\|there\\ ft=javascript ts=4
        # vim:noexpandtab titlestring=hi\\|there\\\\\\ ft=javascript ts=4
      """
      for line in invalid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).toBeNull()
