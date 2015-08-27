describe "Shell script grammar", ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage("language-shellscript")

    runs ->
      grammar = atom.grammars.grammarForScopeName("source.shell")

  it "parses the grammar", ->
    expect(grammar).toBeDefined()
    expect(grammar.scopeName).toBe "source.shell"

  it "tokenizes strings inside variable constructs", ->
    {tokens} = grammar.tokenizeLine("${'root'}")

    expect(tokens[0]).toEqual value: '${', scopes: ['source.shell', 'variable.other.bracket.shell', 'punctuation.definition.variable.shell']
    expect(tokens[1]).toEqual value: "'", scopes: ['source.shell', 'variable.other.bracket.shell', 'string.quoted.single.shell', 'punctuation.definition.string.begin.shell']
    expect(tokens[2]).toEqual value: "root", scopes: ['source.shell', 'variable.other.bracket.shell', 'string.quoted.single.shell']
    expect(tokens[3]).toEqual value: "'", scopes: ['source.shell', 'variable.other.bracket.shell', 'string.quoted.single.shell', 'punctuation.definition.string.end.shell']
    expect(tokens[4]).toEqual value: '}', scopes: ['source.shell', 'variable.other.bracket.shell', 'punctuation.definition.variable.shell']

  it "tokenizes if correctly when it's a parameter", ->
    {tokens} = grammar.tokenizeLine('dd if=/dev/random of=/dev/null')

    expect(tokens[0]).toEqual value: 'dd if=/dev/random of=/dev/null', scopes: ['source.shell']

  it "tokenizes if as a keyword", ->
    {tokens} = grammar.tokenizeLine('if [ -f /var/log/messages ]')

    expect(tokens[0]).toEqual value: 'if', scopes: ['source.shell', 'meta.scope.if-block.shell', 'keyword.control.shell']
    expect(tokens[1]).toEqual value: ' [ -f /var/log/messages ]', scopes: ['source.shell', 'meta.scope.if-block.shell']