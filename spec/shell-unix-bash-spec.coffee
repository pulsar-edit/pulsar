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

  it "doesn't tokenize keywords when they're part of a phrase", ->
    {tokens} = grammar.tokenizeLine('grep --ignore-case "something"')

    expect(tokens[0]).toEqual value: 'grep --ignore-case ', scopes: ['source.shell']
    expect(tokens[1]).toEqual value: '"', scopes: ['source.shell', 'string.quoted.double.shell', 'punctuation.definition.string.begin.shell']

    {tokens} = grammar.tokenizeLine('iffy')

    expect(tokens[0]).toEqual value: 'iffy', scopes: ['source.shell']

  it "tokenizes herestrings", ->
    delimsByScope =
      "string.quoted.double.shell": '"'
      "string.quoted.single.shell": "'"

    for scope, delim of delimsByScope
      tokens = grammar.tokenizeLines """
      $cmd <<<#{delim}
      lorem ipsum#{delim}
      """

      expect(tokens[0][0]).toEqual value: '$', scopes: ['source.shell', 'variable.other.normal.shell', 'punctuation.definition.variable.shell']
      expect(tokens[0][1]).toEqual value: 'cmd', scopes: ['source.shell', 'variable.other.normal.shell']
      expect(tokens[0][3]).toEqual value: '<<<', scopes: ['source.shell', 'meta.herestring.shell', 'keyword.operator.herestring.shell']
      expect(tokens[0][4]).toEqual value: delim, scopes: ['source.shell', 'meta.herestring.shell', scope, 'punctuation.definition.string.begin.shell']
      expect(tokens[1][0]).toEqual value: 'lorem ipsum', scopes: ['source.shell', 'meta.herestring.shell', scope]
      expect(tokens[1][1]).toEqual value: delim, scopes: ['source.shell', 'meta.herestring.shell', scope, 'punctuation.definition.string.end.shell']

  it "tokenizes shebangs", ->
    {tokens} = grammar.tokenizeLine('#!/bin/sh')

    expect(tokens[0]).toEqual value: '#!', scopes: ['source.shell', 'comment.line.number-sign.shebang.shell', 'punctuation.definition.comment.shebang.shell']
    expect(tokens[1]).toEqual value: '/bin/sh', scopes: ['source.shell', 'comment.line.number-sign.shebang.shell']

  it "tokenizes comments", ->
    {tokens} = grammar.tokenizeLine('#comment')

    expect(tokens[0]).toEqual value: '#', scopes: ['source.shell', 'comment.line.number-sign.shell', 'punctuation.definition.comment.shell']
    expect(tokens[1]).toEqual value: 'comment', scopes: ['source.shell', 'comment.line.number-sign.shell']

  it "tokenizes nested variable expansions", ->
    {tokens} = grammar.tokenizeLine('${${C}}')

    expect(tokens[0]).toEqual value: '${', scopes: ['source.shell', 'variable.other.bracket.shell', 'punctuation.definition.variable.shell']
    expect(tokens[1]).toEqual value: '${', scopes: ['source.shell', 'variable.other.bracket.shell', 'variable.other.bracket.shell', 'punctuation.definition.variable.shell']
    expect(tokens[2]).toEqual value: 'C', scopes: ['source.shell', 'variable.other.bracket.shell', 'variable.other.bracket.shell']
    expect(tokens[3]).toEqual value: '}', scopes: ['source.shell', 'variable.other.bracket.shell', 'variable.other.bracket.shell', 'punctuation.definition.variable.shell']
    expect(tokens[4]).toEqual value: '}', scopes: ['source.shell', 'variable.other.bracket.shell', 'punctuation.definition.variable.shell']
