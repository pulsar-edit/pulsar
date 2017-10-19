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

  prompts = [">", "$", "#", "%"]
  it "tokenizes prompts", ->
    for delim in prompts
      {tokens} = grammar.tokenizeLine(delim + ' echo $FOO')

      expect(tokens[0]).toEqual value: delim, scopes: ['text.shell-session', 'punctuation.separator.prompt.shell-session']
      expect(tokens[1]).toEqual value: ' ', scopes: ['text.shell-session']
      expect(tokens[2]).toEqual value: 'echo', scopes: ['text.shell-session', 'source.shell', 'support.function.builtin.shell']

  it "tokenises prompts with Greek characters", ->
    sigils = ["λ", "Λ", "Δ", "Σ", "Ω"]
    for sigil in sigils
      lines = grammar.tokenizeLines """
        #{sigil} echo #{sigil}μμ
        O#{sigil}tput Ω
      """
      expect(lines[0][0]).toEqual value: sigil, scopes: ['text.shell-session', 'punctuation.separator.prompt.shell-session']
      expect(lines[0][2]).toEqual value: 'echo', scopes: ['text.shell-session', 'source.shell', 'support.function.builtin.shell']
      expect(lines[0][3]).toEqual value: " #{sigil}μμ", scopes: ['text.shell-session', 'source.shell']
      expect(lines[1][0]).toEqual value: "O#{sigil}tput Ω", scopes: ['text.shell-session', 'meta.output.shell-session']

  it "does not tokenize prompts with indents", ->
    for delim in prompts
      {tokens} = grammar.tokenizeLine('  ' + delim + ' echo $FOO')

      expect(tokens[0]).toEqual value: '  ' + delim + ' echo $FOO', scopes: ['text.shell-session', 'meta.output.shell-session']

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
