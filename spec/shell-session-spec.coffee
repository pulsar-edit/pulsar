describe "Shell session grammar", ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage("language-shellscript")

    runs ->
      grammar = atom.grammars.grammarForScopeName("text.shell-session")

  it "parses the grammar", ->
    expect(grammar).toBeDefined()
    expect(grammar.scopeName).toBe "text.shell-session"
  it "tokenizes prompts", ->
    prompts = [">", "$", "#", "%"]

    for delim in prompts
      {tokens} = grammar.tokenizeLine(delim + ' echo $FOO')

      expect(tokens[0]).toEqual value: delim, scopes: ['text.shell-session', 'punctuation.separator.prompt.shell-session']
      expect(tokens[1]).toEqual value: ' ', scopes: ['text.shell-session']
      expect(tokens[2]).toEqual value: 'echo', scopes: ['text.shell-session', 'source.shell', 'support.function.builtin.shell']

  it "tokenizes prompts with prefixes", ->
    {tokens} = grammar.tokenizeLine('user@machine $ echo $FOO')

    expect(tokens[0]).toEqual value: 'user@machine', scopes: ['text.shell-session', 'entity.other.prompt-prefix.shell-session']
    expect(tokens[1]).toEqual value: ' ', scopes: ['text.shell-session']
    expect(tokens[2]).toEqual value: '$', scopes: ['text.shell-session', 'punctuation.separator.prompt.shell-session']
    expect(tokens[3]).toEqual value: ' ', scopes: ['text.shell-session']
    expect(tokens[4]).toEqual value: 'echo', scopes: ['text.shell-session', 'source.shell', 'support.function.builtin.shell']

  it "tokenizes shell output", ->
    tokens = grammar.tokenizeLines """
      $ echo $FOO
      foo
    """

    expect(tokens[1][0]).toEqual value: 'foo', scopes: ['text.shell-session', 'meta.output.shell-session']
