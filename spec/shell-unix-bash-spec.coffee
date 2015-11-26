TextEditor = null
buildTextEditor = (params) ->
  if atom.workspace.buildTextEditor?
    atom.workspace.buildTextEditor(params)
  else
    TextEditor ?= require('atom').TextEditor
    new TextEditor(params)

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
    brackets =
      "[": "]"
      "[[": "]]"

    for openingBracket, closingBracket of brackets
      {tokens} = grammar.tokenizeLine('if ' + openingBracket + ' -f /var/log/messages ' + closingBracket)

      expect(tokens[0]).toEqual value: 'if', scopes: ['source.shell', 'meta.scope.if-block.shell', 'keyword.control.shell']
      expect(tokens[2]).toEqual value: openingBracket, scopes: ['source.shell', 'meta.scope.if-block.shell', 'meta.scope.logical-expression.shell', 'punctuation.definition.logical-expression.shell']
      expect(tokens[4]).toEqual value: '-f', scopes: ['source.shell', 'meta.scope.if-block.shell', 'meta.scope.logical-expression.shell', 'keyword.operator.logical.shell']
      expect(tokens[5]).toEqual value: ' /var/log/messages ', scopes: ['source.shell', 'meta.scope.if-block.shell', 'meta.scope.logical-expression.shell']
      expect(tokens[6]).toEqual value: closingBracket, scopes: ['source.shell', 'meta.scope.if-block.shell', 'meta.scope.logical-expression.shell', 'punctuation.definition.logical-expression.shell']

  it "doesn't tokenize keywords when they're part of a phrase", ->
    {tokens} = grammar.tokenizeLine('grep --ignore-case "something"')

    expect(tokens[0]).toEqual value: 'grep --ignore-case ', scopes: ['source.shell']
    expect(tokens[1]).toEqual value: '"', scopes: ['source.shell', 'string.quoted.double.shell', 'punctuation.definition.string.begin.shell']

    {tokens} = grammar.tokenizeLine('iffy')

    expect(tokens[0]).toEqual value: 'iffy', scopes: ['source.shell']

    {tokens} = grammar.tokenizeLine('enable-something')

    expect(tokens[0]).toEqual value: 'enable-something', scopes: ['source.shell']

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

  it "tokenizes heredocs", ->
    delimsByScope =
      "ruby": "RUBY"
      "python": "PYTHON"
      "applescript": "APPLESCRIPT"
      "shell": "SHELL"

    for scope, delim of delimsByScope
      tokens = grammar.tokenizeLines """
        <<#{delim}
        stuff
        #{delim}
      """

      expect(tokens[0][0]).toEqual value: '<<', scopes: ['source.shell', 'string.unquoted.heredoc.' + scope + '.shell', 'keyword.operator.heredoc.shell']
      expect(tokens[0][1]).toEqual value: delim, scopes: ['source.shell', 'string.unquoted.heredoc.' + scope + '.shell', 'keyword.control.heredoc-token.shell']
      expect(tokens[1][0]).toEqual value: 'stuff', scopes: ['source.shell', 'string.unquoted.heredoc.' + scope + '.shell', 'source.' + scope + '.embedded.shell']
      expect(tokens[2][0]).toEqual value: delim, scopes: ['source.shell', 'string.unquoted.heredoc.' + scope + '.shell', 'keyword.control.heredoc-token.shell']

      tokens = grammar.tokenizeLines """
        <<-#{delim}
        stuff
        #{delim}
      """

      expect(tokens[0][0]).toEqual value: '<<', scopes: ['source.shell', 'string.unquoted.heredoc.no-indent.' + scope + '.shell', 'keyword.operator.heredoc.shell']
      expect(tokens[0][2]).toEqual value: delim, scopes: ['source.shell', 'string.unquoted.heredoc.no-indent.' + scope + '.shell', 'keyword.control.heredoc-token.shell']
      expect(tokens[1][0]).toEqual value: 'stuff', scopes: ['source.shell', 'string.unquoted.heredoc.no-indent.' + scope + '.shell', 'source.' + scope + '.embedded.shell']
      expect(tokens[2][0]).toEqual value: delim, scopes: ['source.shell', 'string.unquoted.heredoc.no-indent.' + scope + '.shell', 'keyword.control.heredoc-token.shell']

    tokens = grammar.tokenizeLines """
      <<RANDOMTHING
      stuff
      RANDOMTHING
    """

    expect(tokens[0][0]).toEqual value: '<<', scopes: ['source.shell', 'string.unquoted.heredoc.shell', 'keyword.operator.heredoc.shell']
    expect(tokens[0][1]).toEqual value: 'RANDOMTHING', scopes: ['source.shell', 'string.unquoted.heredoc.shell', 'keyword.control.heredoc-token.shell']
    expect(tokens[1][0]).toEqual value: 'stuff', scopes: ['source.shell', 'string.unquoted.heredoc.shell']
    expect(tokens[2][0]).toEqual value: 'RANDOMTHING', scopes: ['source.shell', 'string.unquoted.heredoc.shell', 'keyword.control.heredoc-token.shell']

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

    it "indents semicolon-style conditional", ->
      expectPreservedIndentation """
        if [ $? -eq 0 ]; then
          echo "0"
        elif [ $? -eq 1 ]; then
          echo "1"
        else
          echo "other"
        fi
      """

    it "indents newline-style conditional", ->
      expectPreservedIndentation """
        if [ $? -eq 0 ]
        then
          echo "0"
        elif [ $? -eq 1 ]
        then
          echo "1"
        else
          echo "other"
        fi
      """

    it "indents semicolon-style while loop", ->
      expectPreservedIndentation """
        while [ $x -gt 0 ]; do
          x=$(($x-1))
        done
      """

    it "indents newline-style while loop", ->
      expectPreservedIndentation """
        while [ $x -gt 0 ]
        do
          x=$(($x-1))
        done
      """
