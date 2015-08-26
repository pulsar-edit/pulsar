describe "Shell session grammar", ->
  grammar = null
  grammarSession = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage("language-shellscript")

    runs ->
      grammar = atom.grammars.grammarForScopeName("source.shell")
      grammarSession = atom.grammars.grammarForScopeName("text.shell-session")

  it "parses the grammar", ->
    expect(grammar).toBeDefined()
    expect(grammar.scopeName).toBe "source.shell"
    expect(grammarSession).toBeDefined()
    expect(grammarSession.scopeName).toBe "text.shell-session"

  it "tokenizes > prompts", ->
    {tokens} = grammarSession.tokenizeLine('> echo $FOO')

    expect(tokens[0]).toEqual value: '>', scopes: ['text.shell-session', 'punctuation.separator.prompt.shell-session']
    expect(tokens[1]).toEqual value: ' ', scopes: ['text.shell-session', 'source.shell']
    expect(tokens[2]).toEqual value: 'echo', scopes: ['text.shell-session', 'source.shell', 'support.function.builtin.shell']

  it "tokenizes $, pound, and % prompts", ->
    prompts = ["$", "#", "%"]

    for delim in prompts
      {tokens} = grammarSession.tokenizeLine(delim + ' echo $FOO')

      expect(tokens[0]).toEqual value: delim, scopes: ['text.shell-session', 'punctuation.separator.prompt.shell-session']
      expect(tokens[1]).toEqual value: ' ', scopes: ['text.shell-session']
      expect(tokens[2]).toEqual value: 'echo', scopes: ['text.shell-session', 'source.shell', 'support.function.builtin.shell']

  it "tokenizes prompts with prefixes", ->
    {tokens} = grammarSession.tokenizeLine('user@machine $ echo $FOO')

    expect(tokens[0]).toEqual value: 'user@machine', scopes: ['text.shell-session', 'entity.other.prompt-prefix.shell-session']
    expect(tokens[1]).toEqual value: ' ', scopes: ['text.shell-session']
    expect(tokens[2]).toEqual value: '$', scopes: ['text.shell-session', 'punctuation.separator.prompt.shell-session']
    expect(tokens[3]).toEqual value: ' ', scopes: ['text.shell-session']
    expect(tokens[4]).toEqual value: 'echo', scopes: ['text.shell-session', 'source.shell', 'support.function.builtin.shell']

  it "tokenizes shell output", ->
    tokens = grammarSession.tokenizeLines('$ echo $FOO\nfoo')

    expect(tokens[1][0]).toEqual value: 'foo', scopes: ['text.shell-session', 'meta.output.shell-session']

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
