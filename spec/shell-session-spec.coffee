describe "Shell session grammar", ->
  grammar = null
  grammar_session = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage("language-shellscript")

    runs ->
      grammar_session = atom.grammars.grammarForScopeName("text.shell-session")
    runs ->
      grammar = atom.grammars.grammarForScopeName("source.shell")

  # Remove this and fix assertions when Atom is upgraded to first-mate 4.x on master
  temporaryScopeHack = (lines) ->
    for tokens in lines
      for {scopes} in tokens
        index = scopes.indexOf('source.shell')
        scopes.splice(index, 1) if index >= 0

  it "parses the grammar", ->
    expect(grammar_session).toBeDefined()
    expect(grammar_session.scopeName).toBe "text.shell-session"

  it "tokenizes > prompts", ->
    tokens = grammar_session.tokenizeLines('> echo $FOO')
    temporaryScopeHack(tokens)

    expect(tokens[0][0].value).toBe '>'
    expect(tokens[0][0].scopes).toEqual ['text.shell-session', 'punctuation.separator.prompt.shell-session']

    expect(tokens[0][1].value).toBe ' '
    expect(tokens[0][1].scopes).toEqual ['text.shell-session']

    expect(tokens[0][2].value).toBe 'echo'
    expect(tokens[0][2].scopes).toEqual ['text.shell-session', 'support.function.builtin.shell']

  it "tokenizes $ prompts", ->
    tokens = grammar_session.tokenizeLines('$ echo $FOO')
    temporaryScopeHack(tokens)

    expect(tokens[0][0].value).toBe '$'
    expect(tokens[0][0].scopes).toEqual ['text.shell-session', 'punctuation.separator.prompt.shell-session']

    expect(tokens[0][1].value).toBe ' '
    expect(tokens[0][1].scopes).toEqual ['text.shell-session']

    expect(tokens[0][2].value).toBe 'echo'
    expect(tokens[0][2].scopes).toEqual ['text.shell-session', 'support.function.builtin.shell']

  it "tokenizes pound prompts", ->
    tokens = grammar_session.tokenizeLines('# echo $FOO')
    temporaryScopeHack(tokens)

    expect(tokens[0][0].value).toBe '#'
    expect(tokens[0][0].scopes).toEqual ['text.shell-session', 'punctuation.separator.prompt.shell-session']

    expect(tokens[0][1].value).toBe ' '
    expect(tokens[0][1].scopes).toEqual ['text.shell-session']

    expect(tokens[0][2].value).toBe 'echo'
    expect(tokens[0][2].scopes).toEqual ['text.shell-session', 'support.function.builtin.shell']

  it "tokenizes % prompts", ->
    tokens = grammar_session.tokenizeLines('% echo $FOO')
    temporaryScopeHack(tokens)

    expect(tokens[0][0].value).toBe '%'
    expect(tokens[0][0].scopes).toEqual ['text.shell-session', 'punctuation.separator.prompt.shell-session']

    expect(tokens[0][1].value).toBe ' '
    expect(tokens[0][1].scopes).toEqual ['text.shell-session']

    expect(tokens[0][2].value).toBe 'echo'
    expect(tokens[0][2].scopes).toEqual ['text.shell-session', 'support.function.builtin.shell']

  it "tokenizes prompts with prefixes", ->
    tokens = grammar_session.tokenizeLines('user@machine $ echo $FOO')
    temporaryScopeHack(tokens)

    expect(tokens[0][0].value).toBe 'user@machine'
    expect(tokens[0][0].scopes).toEqual ['text.shell-session', 'entity.other.prompt-prefix.shell-session']

    expect(tokens[0][1].value).toBe ' '
    expect(tokens[0][1].scopes).toEqual ['text.shell-session']

    expect(tokens[0][2].value).toBe '$'
    expect(tokens[0][2].scopes).toEqual ['text.shell-session', 'punctuation.separator.prompt.shell-session']

    expect(tokens[0][3].value).toBe ' '
    expect(tokens[0][3].scopes).toEqual ['text.shell-session']

    expect(tokens[0][4].value).toBe 'echo'
    expect(tokens[0][4].scopes).toEqual ['text.shell-session', 'support.function.builtin.shell']

  it "tokenizes shell output", ->
    tokens = grammar_session.tokenizeLines('$ echo $FOO\nfoo')
    temporaryScopeHack(tokens)

    expect(tokens[1][0].value).toBe 'foo'
    expect(tokens[1][0].scopes).toEqual ['text.shell-session', 'meta.output.shell-session']

  it "", ->
    tokens = grammar.tokenizeLines("${'root'}")
    temporaryScopeHack(tokens)

    expect(tokens[0][0].value).toBe "${"
    expect(tokens[0][0].scopes).toEqual ['variable.other.bracket.shell', 'punctuation.definition.variable.shell']
    expect(tokens[0][1].value).toBe "'"
    expect(tokens[0][1].scopes).toEqual ['variable.other.bracket.shell', 'string.quoted.single.shell', 'punctuation.definition.string.begin.shell']
    expect(tokens[0][2].value).toBe "root"
    expect(tokens[0][2].scopes).toEqual ['variable.other.bracket.shell', 'string.quoted.single.shell']
    expect(tokens[0][3].value).toBe "'"
    expect(tokens[0][3].scopes).toEqual ['variable.other.bracket.shell', 'string.quoted.single.shell', 'punctuation.definition.string.end.shell']
    expect(tokens[0][4].value).toBe '}'
    expect(tokens[0][4].scopes).toEqual ['variable.other.bracket.shell', 'punctuation.definition.variable.shell']
