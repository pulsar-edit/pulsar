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

  it "tokenizes for...in loops", ->
    {tokens} = grammar.tokenizeLine('for variable in file do do-something-done done')
    expect(tokens[0]).toEqual value: 'for', scopes: ['source.shell', 'meta.scope.for-in-loop.shell', 'keyword.control.shell']
    expect(tokens[2]).toEqual value: 'variable', scopes: ['source.shell', 'meta.scope.for-in-loop.shell', 'variable.other.loop.shell']
    expect(tokens[4]).toEqual value: 'in', scopes: ['source.shell', 'meta.scope.for-in-loop.shell', 'keyword.control.shell']
    expect(tokens[5]).toEqual value: ' file ', scopes: ['source.shell', 'meta.scope.for-in-loop.shell']
    expect(tokens[6]).toEqual value: 'do', scopes: ['source.shell', 'meta.scope.for-in-loop.shell', 'keyword.control.shell']
    expect(tokens[7]).toEqual value: ' do-something-done ', scopes: ['source.shell', 'meta.scope.for-in-loop.shell']
    expect(tokens[8]).toEqual value: 'done', scopes: ['source.shell', 'meta.scope.for-in-loop.shell', 'keyword.control.shell']

    {tokens} = grammar.tokenizeLine('for "variable" in "${list[@]}" do something done')
    expect(tokens[0]).toEqual value: 'for', scopes: ['source.shell', 'meta.scope.for-in-loop.shell', 'keyword.control.shell']
    expect(tokens[2]).toEqual value: '"', scopes: ['source.shell', 'meta.scope.for-in-loop.shell', 'variable.other.loop.shell', 'string.quoted.double.shell', 'punctuation.definition.string.begin.shell']
    expect(tokens[3]).toEqual value: 'variable', scopes: ['source.shell', 'meta.scope.for-in-loop.shell', 'variable.other.loop.shell', 'string.quoted.double.shell']
    expect(tokens[4]).toEqual value: '"', scopes: ['source.shell', 'meta.scope.for-in-loop.shell', 'variable.other.loop.shell', 'string.quoted.double.shell', 'punctuation.definition.string.end.shell']
    expect(tokens[6]).toEqual value: 'in', scopes: ['source.shell', 'meta.scope.for-in-loop.shell', 'keyword.control.shell']
    expect(tokens[8]).toEqual value: '"', scopes: ['source.shell', 'meta.scope.for-in-loop.shell', 'string.quoted.double.shell', 'punctuation.definition.string.begin.shell']
    expect(tokens[9]).toEqual value: '${', scopes: ['source.shell', 'meta.scope.for-in-loop.shell', 'string.quoted.double.shell', 'variable.other.bracket.shell', 'punctuation.definition.variable.shell']
    expect(tokens[10]).toEqual value: 'list', scopes: ['source.shell', 'meta.scope.for-in-loop.shell', 'string.quoted.double.shell', 'variable.other.bracket.shell']
    expect(tokens[11]).toEqual value: '[', scopes: ['source.shell', 'meta.scope.for-in-loop.shell', 'string.quoted.double.shell', 'variable.other.bracket.shell', 'punctuation.section.array.shell']
    expect(tokens[12]).toEqual value: '@', scopes: ['source.shell', 'meta.scope.for-in-loop.shell', 'string.quoted.double.shell', 'variable.other.bracket.shell']
    expect(tokens[13]).toEqual value: ']', scopes: ['source.shell', 'meta.scope.for-in-loop.shell', 'string.quoted.double.shell', 'variable.other.bracket.shell', 'punctuation.section.array.shell']
    expect(tokens[14]).toEqual value: '}', scopes: ['source.shell', 'meta.scope.for-in-loop.shell', 'string.quoted.double.shell', 'variable.other.bracket.shell', 'punctuation.definition.variable.shell']
    expect(tokens[15]).toEqual value: '"', scopes: ['source.shell', 'meta.scope.for-in-loop.shell', 'string.quoted.double.shell', 'punctuation.definition.string.end.shell']
    expect(tokens[17]).toEqual value: 'do', scopes: ['source.shell', 'meta.scope.for-in-loop.shell', 'keyword.control.shell']
    expect(tokens[18]).toEqual value: ' something ', scopes: ['source.shell', 'meta.scope.for-in-loop.shell']
    expect(tokens[19]).toEqual value: 'done', scopes: ['source.shell', 'meta.scope.for-in-loop.shell', 'keyword.control.shell']

    {tokens} = grammar.tokenizeLine('for variable in something do # in')
    expect(tokens[4]).toEqual value: 'in', scopes: ['source.shell', 'meta.scope.for-in-loop.shell', 'keyword.control.shell']
    expect(tokens[8]).toEqual value: '#', scopes: ['source.shell', 'meta.scope.for-in-loop.shell', 'comment.line.number-sign.shell', 'punctuation.definition.comment.shell']
    expect(tokens[9]).toEqual value: ' in', scopes: ['source.shell', 'meta.scope.for-in-loop.shell', 'comment.line.number-sign.shell']

  it "doesn't tokenize keywords when they're part of a phrase", ->
    {tokens} = grammar.tokenizeLine('grep --ignore-case "something"')
    expect(tokens[0]).toEqual value: 'grep --ignore-case ', scopes: ['source.shell']
    expect(tokens[1]).toEqual value: '"', scopes: ['source.shell', 'string.quoted.double.shell', 'punctuation.definition.string.begin.shell']

    strings = [
      'iffy'
      'enable-something'
      'there.for'
      'be+done'
      'little,while'
      'rest@until'
      'lets:select words'
      'in🚀case of stuff'
      'the#fi%nal countdown'
      'time⏰out'
    ]

    for string in strings
      {tokens} = grammar.tokenizeLine(string)
      expect(tokens[0]).toEqual value: string, scopes: ['source.shell']

    {tokens} = grammar.tokenizeLine('this/function ()')
    expect(tokens[0]).toEqual value: 'this/function', scopes: ['source.shell', 'meta.function.shell', 'entity.name.function.shell']
    expect(tokens[2]).toEqual value: '()', scopes: ['source.shell', 'meta.function.shell', 'punctuation.definition.arguments.shell']

    {tokens} = grammar.tokenizeLine('and,for (( this ))')
    expect(tokens[0]).toEqual value: 'and,for ', scopes: ['source.shell']
    expect(tokens[1]).toEqual value: '((', scopes: ['source.shell', 'string.other.math.shell', 'punctuation.definition.string.begin.shell']

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

    for scope, delim of delimsByScope
      tokens = grammar.tokenizeLines """
      $cmd <<< #{delim}
      lorem ipsum#{delim}
      """
      expect(tokens[0][0]).toEqual value: '$', scopes: ['source.shell', 'variable.other.normal.shell', 'punctuation.definition.variable.shell']
      expect(tokens[0][1]).toEqual value: 'cmd', scopes: ['source.shell', 'variable.other.normal.shell']
      expect(tokens[0][3]).toEqual value: '<<<', scopes: ['source.shell', 'meta.herestring.shell', 'keyword.operator.herestring.shell']
      expect(tokens[0][4]).toEqual value: ' ', scopes: ['source.shell', 'meta.herestring.shell']
      expect(tokens[0][5]).toEqual value: delim, scopes: ['source.shell', 'meta.herestring.shell', scope, 'punctuation.definition.string.begin.shell']
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
        << #{delim}
        stuff
        #{delim}
      """
      expect(tokens[0][0]).toEqual value: '<<', scopes: ['source.shell', 'string.unquoted.heredoc.' + scope + '.shell', 'keyword.operator.heredoc.shell']
      expect(tokens[0][1]).toEqual value: ' ', scopes: ['source.shell', 'string.unquoted.heredoc.' + scope + '.shell']
      expect(tokens[0][2]).toEqual value: delim, scopes: ['source.shell', 'string.unquoted.heredoc.' + scope + '.shell', 'keyword.control.heredoc-token.shell']
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
        <<- #{delim}
        stuff
        #{delim}
      """
      expect(tokens[0][0]).toEqual value: '<<', scopes: ['source.shell', 'string.unquoted.heredoc.no-indent.' + scope + '.shell', 'keyword.operator.heredoc.shell']
      expect(tokens[0][1]).toEqual value: '- ', scopes: ['source.shell', 'string.unquoted.heredoc.no-indent.' + scope + '.shell']
      expect(tokens[0][2]).toEqual value: delim, scopes: ['source.shell', 'string.unquoted.heredoc.no-indent.' + scope + '.shell', 'keyword.control.heredoc-token.shell']
      expect(tokens[1][0]).toEqual value: 'stuff', scopes: ['source.shell', 'string.unquoted.heredoc.no-indent.' + scope + '.shell', 'source.' + scope + '.embedded.shell']
      expect(tokens[2][0]).toEqual value: delim, scopes: ['source.shell', 'string.unquoted.heredoc.no-indent.' + scope + '.shell', 'keyword.control.heredoc-token.shell']

    delims = [
      "RANDOMTHING"
      "RUBY@1.8"
      "END-INPUT"
    ]

    for delim in delims
      tokens = grammar.tokenizeLines """
        <<#{delim}
        stuff
        #{delim}
      """
      expect(tokens[0][0]).toEqual value: '<<', scopes: ['source.shell', 'string.unquoted.heredoc.shell', 'keyword.operator.heredoc.shell']
      expect(tokens[0][1]).toEqual value: delim, scopes: ['source.shell', 'string.unquoted.heredoc.shell', 'keyword.control.heredoc-token.shell']
      expect(tokens[1][0]).toEqual value: 'stuff', scopes: ['source.shell', 'string.unquoted.heredoc.shell']
      expect(tokens[2][0]).toEqual value: delim, scopes: ['source.shell', 'string.unquoted.heredoc.shell', 'keyword.control.heredoc-token.shell']

  it "tokenizes shebangs", ->
    {tokens} = grammar.tokenizeLine('#!/bin/sh')
    expect(tokens[0]).toEqual value: '#!', scopes: ['source.shell', 'comment.line.number-sign.shebang.shell', 'punctuation.definition.comment.shebang.shell']
    expect(tokens[1]).toEqual value: '/bin/sh', scopes: ['source.shell', 'comment.line.number-sign.shebang.shell']

  it "tokenizes comments", ->
    {tokens} = grammar.tokenizeLine('#comment')
    expect(tokens[0]).toEqual value: '#', scopes: ['source.shell', 'comment.line.number-sign.shell', 'punctuation.definition.comment.shell']
    expect(tokens[1]).toEqual value: 'comment', scopes: ['source.shell', 'comment.line.number-sign.shell']

  it "tokenizes comments in interpolated strings", ->
    {tokens} = grammar.tokenizeLine('`#comment`')
    expect(tokens[1]).toEqual value: '#', scopes: ['source.shell', 'string.interpolated.backtick.shell', 'comment.line.number-sign.shell', 'punctuation.definition.comment.shell']
    expect(tokens[3]).toEqual value: '`', scopes: ['source.shell', 'string.interpolated.backtick.shell', 'punctuation.definition.string.end.shell']

  it "tokenizes nested variable expansions", ->
    {tokens} = grammar.tokenizeLine('${${C}}')
    expect(tokens[0]).toEqual value: '${', scopes: ['source.shell', 'variable.other.bracket.shell', 'punctuation.definition.variable.shell']
    expect(tokens[1]).toEqual value: '${', scopes: ['source.shell', 'variable.other.bracket.shell', 'variable.other.bracket.shell', 'punctuation.definition.variable.shell']
    expect(tokens[2]).toEqual value: 'C', scopes: ['source.shell', 'variable.other.bracket.shell', 'variable.other.bracket.shell']
    expect(tokens[3]).toEqual value: '}', scopes: ['source.shell', 'variable.other.bracket.shell', 'variable.other.bracket.shell', 'punctuation.definition.variable.shell']
    expect(tokens[4]).toEqual value: '}', scopes: ['source.shell', 'variable.other.bracket.shell', 'punctuation.definition.variable.shell']

  it "tokenizes case blocks", ->
    {tokens} = grammar.tokenizeLine('case word in esac);; esac')
    expect(tokens[0]).toEqual value: 'case', scopes: ['source.shell', 'meta.scope.case-block.shell', 'keyword.control.shell']
    expect(tokens[1]).toEqual value: ' word ', scopes: ['source.shell', 'meta.scope.case-block.shell']
    expect(tokens[2]).toEqual value: 'in', scopes: ['source.shell', 'meta.scope.case-block.shell', 'meta.scope.case-body.shell', 'keyword.control.shell']
    expect(tokens[3]).toEqual value: ' ', scopes: ['source.shell', 'meta.scope.case-block.shell', 'meta.scope.case-body.shell']
    expect(tokens[4]).toEqual value: 'esac', scopes: ['source.shell', 'meta.scope.case-block.shell', 'meta.scope.case-body.shell', 'meta.scope.case-clause.shell', 'meta.scope.case-pattern.shell']
    expect(tokens[5]).toEqual value: ')', scopes: ['source.shell', 'meta.scope.case-block.shell', 'meta.scope.case-body.shell', 'meta.scope.case-clause.shell', 'meta.scope.case-pattern.shell', 'punctuation.definition.case-pattern.shell']
    expect(tokens[6]).toEqual value: ';;', scopes: ['source.shell', 'meta.scope.case-block.shell', 'meta.scope.case-body.shell', 'meta.scope.case-clause.shell', 'punctuation.terminator.case-clause.shell']
    expect(tokens[7]).toEqual value: ' ', scopes: ['source.shell', 'meta.scope.case-block.shell', 'meta.scope.case-body.shell']
    expect(tokens[8]).toEqual value: 'esac', scopes: ['source.shell', 'meta.scope.case-block.shell', 'keyword.control.shell']

  it "does not confuse strings and functions", ->
    {tokens} = grammar.tokenizeLine('echo "()"')
    expect(tokens[0]).toEqual value: 'echo', scopes: ['source.shell', 'support.function.builtin.shell']
    expect(tokens[2]).toEqual value: '"', scopes: ['source.shell', 'string.quoted.double.shell', 'punctuation.definition.string.begin.shell']
    expect(tokens[3]).toEqual value: '()', scopes: ['source.shell', 'string.quoted.double.shell']
    expect(tokens[4]).toEqual value: '"', scopes: ['source.shell', 'string.quoted.double.shell', 'punctuation.definition.string.end.shell']

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

  describe "firstLineMatch", ->
    it "recognises interpreter directives", ->
      valid = """
        #!/bin/sh
        #!/usr/sbin/env bash
        #!/usr/bin/bash foo=bar/
        #!/usr/sbin/ksh foo bar baz
        #!/usr/bin/dash perl
        #!/usr/bin/env bin/sh
        #!/usr/bin/rc
        #!/bin/env rc
        #!/usr/bin/bash --script=usr/bin
        #! /usr/bin/env A=003 B=149 C=150 D=xzd E=base64 F=tar G=gz H=head I=tail bash
        #!\t/usr/bin/env --foo=bar bash --quu=quux
        #! /usr/bin/bash
        #!/usr/bin/env bash
      """
      for line in valid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).not.toBeNull()

      invalid = """
        \x20#!/usr/sbin/bash
        \t#!/usr/sbin/bash
        #!/usr/bin/env-bash/node-env/
        #!/usr/bin/env-bash
        #! /usr/binbash
        #! /usr/arc
        #!\t/usr/bin/env --bash=bar
      """
      for line in invalid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).toBeNull()

    it "recognises Emacs modelines", ->
      valid = """
        #-*-shell-script-*-
        #-*-mode:shell-script-*-
        /* -*-sh-*- */
        // -*- SHELL-SCRIPT -*-
        /* -*- mode:shell-script -*- */
        // -*- font:bar;mode:sh -*-
        // -*- font:bar;mode:shell-script;foo:bar; -*-
        // -*-font:mode;mode:SH-*-
        // -*- foo:bar mode: sh bar:baz -*-
        " -*-foo:bar;mode:sh;bar:foo-*- ";
        " -*-font-mode:foo;mode:shell-script;foo-bar:quux-*-"
        "-*-font:x;foo:bar; mode : sh;bar:foo;foooooo:baaaaar;fo:ba;-*-";
        "-*- font:x;foo : bar ; mode : sH ; bar : foo ; foooooo:baaaaar;fo:ba-*-";
      """
      for line in valid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).not.toBeNull()

      invalid = """
        /* --*sh-*- */
        /* -*-- sh -*-
        /* -*- -- sh -*-
        /* -*- shell-scripts -;- -*-
        // -*- SSSSSSSSSH -*-
        // -*- SH; -*-
        // -*- sh-stuff -*-
        /* -*- model:sh -*-
        /* -*- indent-mode:sh -*-
        // -*- font:mode;SH -*-
        // -*- mode: -*- SH
        // -*- mode: secret-sh -*-
        // -*-font:mode;mode:sh--*-
      """
      for line in invalid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).toBeNull()

    it "recognises Vim modelines", ->
      valid = """
        vim: se filetype=sh:
        # vim: se ft=sh:
        # vim: set ft=sh:
        # vim: set filetype=sh:
        # vim: ft=sh
        # vim: syntax=sH
        # vim: se syntax=SH:
        # ex: syntax=SH
        # vim:ft=sh
        # vim600: ft=sh
        # vim>600: set ft=sh:
        # vi:noai:sw=3 ts=6 ft=sh
        # vi::::::::::noai:::::::::::: ft=sh
        # vim:ts=4:sts=4:sw=4:noexpandtab:ft=sh
        # vi:: noai : : : : sw   =3 ts   =6 ft  =sh
        # vim: ts=4: pi sts=4: ft=sh: noexpandtab: sw=4:
        # vim: ts=4 sts=4: ft=sh noexpandtab:
        # vim:noexpandtab sts=4 ft=sh ts=4
        # vim:noexpandtab:ft=sh
        # vim:ts=4:sts=4 ft=sh:noexpandtab:\x20
        # vim:noexpandtab titlestring=hi\|there\\\\ ft=sh ts=4
      """
      for line in valid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).not.toBeNull()

      invalid = """
        ex: se filetype=sh:
        _vi: se filetype=sh:
         vi: se filetype=sh
        # vim set ft=ssh
        # vim: soft=sh
        # vim: hairy-syntax=sh:
        # vim set ft=sh:
        # vim: setft=sh:
        # vim: se ft=sh backupdir=tmp
        # vim: set ft=sh set cmdheight=1
        # vim:noexpandtab sts:4 ft:sh ts:4
        # vim:noexpandtab titlestring=hi\\|there\\ ft=sh ts=4
        # vim:noexpandtab titlestring=hi\\|there\\\\\\ ft=sh ts=4
      """
      for line in invalid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).toBeNull()
