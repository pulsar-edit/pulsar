describe "TextMate Gemfile grammar", ->
  grammar = null

  beforeEach ->
    atom.config.set('core.useTreeSitterParsers', false)

    waitsForPromise ->
      atom.packages.activatePackage("language-ruby")

    runs ->
      grammar = atom.grammars.grammarForScopeName("source.ruby.gemfile")

  it "parses the grammar", ->
    expect(grammar).toBeTruthy()
    expect(grammar.scopeName).toBe "source.ruby.gemfile"

  it "tokenizes ruby", ->
    {tokens} = grammar.tokenizeLine('ruby')
    expect(tokens[0]).toEqual value: 'ruby', scopes: ['source.ruby.gemfile', 'meta.declaration.ruby.gemfile', 'keyword.other.special-method.ruby.gemfile']

  it "tokenizes source", ->
    {tokens} = grammar.tokenizeLine('source')
    expect(tokens[0]).toEqual value: 'source', scopes: ['source.ruby.gemfile', 'meta.declaration.ruby.gemfile', 'keyword.other.special-method.ruby.gemfile']

  it "tokenizes group", ->
    {tokens} = grammar.tokenizeLine('group')
    expect(tokens[0]).toEqual value: 'group', scopes: ['source.ruby.gemfile', 'meta.declaration.ruby.gemfile', 'keyword.other.special-method.ruby.gemfile']

  it "tokenizes gem", ->
    {tokens} = grammar.tokenizeLine('gem')
    expect(tokens[0]).toEqual value: 'gem', scopes: ['source.ruby.gemfile', 'meta.declaration.ruby.gemfile', 'keyword.other.special-method.ruby.gemfile']

  it "tokenizes double-quoted strings", ->
    {tokens} = grammar.tokenizeLine('"foo"')
    expect(tokens[0]).toEqual value: '"', scopes: ['source.ruby.gemfile', 'string.quoted.double.interpolated.ruby', 'punctuation.definition.string.begin.ruby']
    expect(tokens[1]).toEqual value: 'foo', scopes: ['source.ruby.gemfile', 'string.quoted.double.interpolated.ruby']
    expect(tokens[2]).toEqual value: '"', scopes: ['source.ruby.gemfile', 'string.quoted.double.interpolated.ruby', 'punctuation.definition.string.end.ruby']

  it "tokenizes single-quoted strings", ->
    {tokens} = grammar.tokenizeLine('\'foo\'')
    expect(tokens[0]).toEqual value: '\'', scopes: ['source.ruby.gemfile', 'string.quoted.single.ruby', 'punctuation.definition.string.begin.ruby']
    expect(tokens[1]).toEqual value: 'foo', scopes: ['source.ruby.gemfile', 'string.quoted.single.ruby']
    expect(tokens[2]).toEqual value: '\'', scopes: ['source.ruby.gemfile', 'string.quoted.single.ruby', 'punctuation.definition.string.end.ruby']

  it "tokenizes group names", ->
    {tokens} = grammar.tokenizeLine(':foo')
    expect(tokens[0]).toEqual value: ':', scopes: ['source.ruby.gemfile', 'constant.other.symbol.ruby', 'punctuation.definition.constant.ruby']
    expect(tokens[1]).toEqual value: 'foo', scopes: ['source.ruby.gemfile', 'constant.other.symbol.ruby']

  it "tokenizes group properly in ruby code", ->
    {tokens} = grammar.tokenizeLine('do |group|')
    expect(tokens[0]).toEqual value: 'do', scopes: ['source.ruby.gemfile', 'keyword.control.start-block.ruby']
    expect(tokens[1]).toEqual value: ' ', scopes: ['source.ruby.gemfile']
    expect(tokens[2]).toEqual value: '|', scopes: ['source.ruby.gemfile', 'punctuation.separator.variable.ruby']
    expect(tokens[3]).toEqual value: 'group', scopes: ['source.ruby.gemfile', 'variable.other.block.ruby']
    expect(tokens[4]).toEqual value: '|', scopes: ['source.ruby.gemfile', 'punctuation.separator.variable.ruby']
