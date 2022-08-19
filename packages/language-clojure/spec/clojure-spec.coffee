describe "Clojure grammar", ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage("language-clojure")

    runs ->
      grammar = atom.grammars.grammarForScopeName("source.clojure")

  it "parses the grammar", ->
    expect(grammar).toBeDefined()
    expect(grammar.scopeName).toBe "source.clojure"

  it "tokenizes semicolon comments", ->
    {tokens} = grammar.tokenizeLine "; clojure"
    expect(tokens[0]).toEqual value: ";", scopes: ["source.clojure", "comment.line.semicolon.clojure", "punctuation.definition.comment.clojure"]
    expect(tokens[1]).toEqual value: " clojure", scopes: ["source.clojure", "comment.line.semicolon.clojure"]

  it "does not tokenize escaped semicolons as comments", ->
    {tokens} = grammar.tokenizeLine "\\; clojure"
    expect(tokens[0]).toEqual value: "\\; ", scopes: ["source.clojure"]
    expect(tokens[1]).toEqual value: "clojure", scopes: ["source.clojure", "meta.symbol.clojure"]

  it "tokenizes shebang comments", ->
    {tokens} = grammar.tokenizeLine "#!/usr/bin/env clojure"
    expect(tokens[0]).toEqual value: "#!", scopes: ["source.clojure", "comment.line.shebang.clojure", "punctuation.definition.comment.shebang.clojure"]
    expect(tokens[1]).toEqual value: "/usr/bin/env clojure", scopes: ["source.clojure", "comment.line.shebang.clojure"]

  it "tokenizes strings", ->
    {tokens} = grammar.tokenizeLine '"foo bar"'
    expect(tokens[0]).toEqual value: '"', scopes: ["source.clojure", "string.quoted.double.clojure", "punctuation.definition.string.begin.clojure"]
    expect(tokens[1]).toEqual value: 'foo bar', scopes: ["source.clojure", "string.quoted.double.clojure"]
    expect(tokens[2]).toEqual value: '"', scopes: ["source.clojure", "string.quoted.double.clojure", "punctuation.definition.string.end.clojure"]

  it "tokenizes character escape sequences", ->
    {tokens} = grammar.tokenizeLine '"\\n"'
    expect(tokens[0]).toEqual value: '"', scopes: ["source.clojure", "string.quoted.double.clojure", "punctuation.definition.string.begin.clojure"]
    expect(tokens[1]).toEqual value: '\\n', scopes: ["source.clojure", "string.quoted.double.clojure", "constant.character.escape.clojure"]
    expect(tokens[2]).toEqual value: '"', scopes: ["source.clojure", "string.quoted.double.clojure", "punctuation.definition.string.end.clojure"]

  it "tokenizes regexes", ->
    {tokens} = grammar.tokenizeLine '#"foo"'
    expect(tokens[0]).toEqual value: '#"', scopes: ["source.clojure", "string.regexp.clojure", "punctuation.definition.regexp.begin.clojure"]
    expect(tokens[1]).toEqual value: 'foo', scopes: ["source.clojure", "string.regexp.clojure"]
    expect(tokens[2]).toEqual value: '"', scopes: ["source.clojure", "string.regexp.clojure", "punctuation.definition.regexp.end.clojure"]

  it "tokenizes backslash escape character in regexes", ->
    {tokens} = grammar.tokenizeLine '#"\\\\" "/"'
    expect(tokens[0]).toEqual value: '#"', scopes: ["source.clojure", "string.regexp.clojure", "punctuation.definition.regexp.begin.clojure"]
    expect(tokens[1]).toEqual value: "\\\\", scopes: ['source.clojure', 'string.regexp.clojure', 'constant.character.escape.clojure']
    expect(tokens[2]).toEqual value: '"', scopes: ['source.clojure', 'string.regexp.clojure', "punctuation.definition.regexp.end.clojure"]
    expect(tokens[4]).toEqual value: '"', scopes: ['source.clojure', 'string.quoted.double.clojure', 'punctuation.definition.string.begin.clojure']
    expect(tokens[5]).toEqual value: "/", scopes: ['source.clojure', 'string.quoted.double.clojure']
    expect(tokens[6]).toEqual value: '"', scopes: ['source.clojure', 'string.quoted.double.clojure', 'punctuation.definition.string.end.clojure']

  it "tokenizes escaped double quote in regexes", ->
    {tokens} = grammar.tokenizeLine '#"\\""'
    expect(tokens[0]).toEqual value: '#"', scopes: ["source.clojure", "string.regexp.clojure", "punctuation.definition.regexp.begin.clojure"]
    expect(tokens[1]).toEqual value: '\\"', scopes: ['source.clojure', 'string.regexp.clojure', 'constant.character.escape.clojure']
    expect(tokens[2]).toEqual value: '"', scopes: ['source.clojure', 'string.regexp.clojure', "punctuation.definition.regexp.end.clojure"]

  it "tokenizes numerics", ->
    numbers =
      "constant.numeric.ratio.clojure": ["1/2", "123/456", "+0/2", "-23/1"]
      "constant.numeric.arbitrary-radix.clojure": ["2R1011", "16rDEADBEEF", "16rDEADBEEFN", "36rZebra"]
      "constant.numeric.hexadecimal.clojure": ["0xDEADBEEF", "0XDEADBEEF", "0xDEADBEEFN", "0x0"]
      "constant.numeric.octal.clojure": ["0123", "0123N", "00"]
      "constant.numeric.double.clojure": ["123.45", "123.45e6", "123.45E6", "123.456M", "42.", "42.M", "42E+9M", "42E-0", "0M", "+0M", "42.E-23M"]
      "constant.numeric.long.clojure": ["123", "12321", "123N", "+123N", "-123", "0"]
      "constant.numeric.symbol.clojure": ["##Inf", "##-Inf", "##NaN"]

    for scope, nums of numbers
      for num in nums
        {tokens} = grammar.tokenizeLine num
        expect(tokens[0]).toEqual value: num, scopes: ["source.clojure", scope]

  it "tokenizes booleans", ->
    booleans =
      "constant.language.boolean.clojure": ["true", "false"]

    for scope, bools of booleans
      for bool in bools
        {tokens} = grammar.tokenizeLine bool
        expect(tokens[0]).toEqual value: bool, scopes: ["source.clojure", scope]

  it "tokenizes nil", ->
    {tokens} = grammar.tokenizeLine "nil"
    expect(tokens[0]).toEqual value: "nil", scopes: ["source.clojure", "constant.language.nil.clojure"]

  it "tokenizes keywords", ->
    tests =
      "meta.expression.clojure": ["(:foo)"]
      "meta.map.clojure": ["{:foo}"]
      "meta.vector.clojure": ["[:foo]"]
      "meta.quoted-expression.clojure": ["'(:foo)", "`(:foo)"]

    for metaScope, lines of tests
      for line in lines
        {tokens} = grammar.tokenizeLine line
        expect(tokens[1]).toEqual value: ":foo", scopes: ["source.clojure", metaScope, "constant.keyword.clojure"]

    {tokens} = grammar.tokenizeLine "(def foo :bar)"
    expect(tokens[5]).toEqual value: ":bar", scopes: ["source.clojure", "meta.expression.clojure", "meta.definition.global.clojure", "constant.keyword.clojure"]

    # keywords can start with an uppercase non-ASCII letter
    {tokens} = grammar.tokenizeLine "(def foo :Öπ)"
    expect(tokens[5]).toEqual value: ":Öπ", scopes: ["source.clojure", "meta.expression.clojure", "meta.definition.global.clojure", "constant.keyword.clojure"]

  it "tokenizes keyfns (keyword control)", ->
    keyfns = ["declare", "declare-", "ns", "in-ns", "import", "use", "require", "load", "compile", "def", "defn", "defn-", "defmacro", "defåπç"]

    for keyfn in keyfns
      {tokens} = grammar.tokenizeLine "(#{keyfn})"
      expect(tokens[1]).toEqual value: keyfn, scopes: ["source.clojure", "meta.expression.clojure", "keyword.control.clojure"]

  it "tokenizes keyfns (storage control)", ->
    keyfns = ["if", "when", "for", "cond", "do", "let", "binding", "loop", "recur", "fn", "throw", "try", "catch", "finally", "case"]

    for keyfn in keyfns
      {tokens} = grammar.tokenizeLine "(#{keyfn})"
      expect(tokens[1]).toEqual value: keyfn, scopes: ["source.clojure", "meta.expression.clojure", "storage.control.clojure"]

  it "tokenizes global definitions", ->
    macros = ["ns", "declare", "def", "defn", "defn-", "defroutes", "compojure/defroutes", "rum.core/defc123-", "some.nested-ns/def-nested->symbol!?*", "def+!.?abc8:<>", "ns/def+!.?abc8:<>", "ns/defåÄÖπç"]

    for macro in macros
      {tokens} = grammar.tokenizeLine "(#{macro} foo 'bar)"
      expect(tokens[1]).toEqual value: macro, scopes: ["source.clojure", "meta.expression.clojure", "meta.definition.global.clojure", "keyword.control.clojure"]
      expect(tokens[3]).toEqual value: "foo", scopes: ["source.clojure", "meta.expression.clojure", "meta.definition.global.clojure", "entity.global.clojure"]

  it "tokenizes dynamic variables", ->
    mutables = ["*ns*", "*foo-bar*", "*åÄÖπç*"]

    for mutable in mutables
      {tokens} = grammar.tokenizeLine mutable
      expect(tokens[0]).toEqual value: mutable, scopes: ["source.clojure", "meta.symbol.dynamic.clojure"]

  it "tokenizes metadata", ->
    {tokens} = grammar.tokenizeLine "^Foo"
    expect(tokens[0]).toEqual value: "^", scopes: ["source.clojure", "meta.metadata.simple.clojure"]
    expect(tokens[1]).toEqual value: "Foo", scopes: ["source.clojure", "meta.metadata.simple.clojure", "meta.symbol.clojure"]

    # non-ASCII letters
    {tokens} = grammar.tokenizeLine "^Öπ"
    expect(tokens[0]).toEqual value: "^", scopes: ["source.clojure", "meta.metadata.simple.clojure"]
    expect(tokens[1]).toEqual value: "Öπ", scopes: ["source.clojure", "meta.metadata.simple.clojure", "meta.symbol.clojure"]

    {tokens} = grammar.tokenizeLine "^{:foo true}"
    expect(tokens[0]).toEqual value: "^{", scopes: ["source.clojure", "meta.metadata.map.clojure", "punctuation.section.metadata.map.begin.clojure"]
    expect(tokens[1]).toEqual value: ":foo", scopes: ["source.clojure", "meta.metadata.map.clojure", "constant.keyword.clojure"]
    expect(tokens[2]).toEqual value: " ", scopes: ["source.clojure", "meta.metadata.map.clojure"]
    expect(tokens[3]).toEqual value: "true", scopes: ["source.clojure", "meta.metadata.map.clojure", "constant.language.boolean.clojure"]
    expect(tokens[4]).toEqual value: "}", scopes: ["source.clojure", "meta.metadata.map.clojure", "punctuation.section.metadata.map.end.trailing.clojure"]

  it "tokenizes functions", ->
    expressions = ["(foo)", "(foo 1 10)"]

    for expr in expressions
      {tokens} = grammar.tokenizeLine expr
      expect(tokens[1]).toEqual value: "foo", scopes: ["source.clojure", "meta.expression.clojure", "entity.name.function.clojure"]

    #non-ASCII letters
    {tokens} = grammar.tokenizeLine "(Öπ 2 20)"
    expect(tokens[1]).toEqual value: "Öπ", scopes: ["source.clojure", "meta.expression.clojure", "entity.name.function.clojure"]

  it "tokenizes vars", ->
    {tokens} = grammar.tokenizeLine "(func #'foo)"
    expect(tokens[2]).toEqual value: " #", scopes: ["source.clojure", "meta.expression.clojure"]
    expect(tokens[3]).toEqual value: "'foo", scopes: ["source.clojure", "meta.expression.clojure", "meta.var.clojure"]

    # non-ASCII letters
    {tokens} = grammar.tokenizeLine "(func #'Öπ)"
    expect(tokens[2]).toEqual value: " #", scopes: ["source.clojure", "meta.expression.clojure"]
    expect(tokens[3]).toEqual value: "'Öπ", scopes: ["source.clojure", "meta.expression.clojure", "meta.var.clojure"]

  it "tokenizes symbols", ->
    {tokens} = grammar.tokenizeLine "x"
    expect(tokens[0]).toEqual value: "x", scopes: ["source.clojure", "meta.symbol.clojure"]

    # non-ASCII letters
    {tokens} = grammar.tokenizeLine "Öπ"
    expect(tokens[0]).toEqual value: "Öπ", scopes: ["source.clojure", "meta.symbol.clojure"]

    # Should not be tokenized as a symbol
    {tokens} = grammar.tokenizeLine "1foobar"
    expect(tokens[0]).toEqual value: "1", scopes: ["source.clojure", "constant.numeric.long.clojure"]

  it "tokenizes namespaces", ->
    {tokens} = grammar.tokenizeLine "foo/bar"
    expect(tokens[0]).toEqual value: "foo", scopes: ["source.clojure", "meta.symbol.namespace.clojure"]
    expect(tokens[1]).toEqual value: "/", scopes: ["source.clojure"]
    expect(tokens[2]).toEqual value: "bar", scopes: ["source.clojure", "meta.symbol.clojure"]

    # non-ASCII letters
    {tokens} = grammar.tokenizeLine "Öπ/Åä"
    expect(tokens[0]).toEqual value: "Öπ", scopes: ["source.clojure", "meta.symbol.namespace.clojure"]
    expect(tokens[1]).toEqual value: "/", scopes: ["source.clojure"]
    expect(tokens[2]).toEqual value: "Åä", scopes: ["source.clojure", "meta.symbol.clojure"]

  testMetaSection = (metaScope, puncScope, startsWith, endsWith) ->
    # Entire expression on one line.
    {tokens} = grammar.tokenizeLine "#{startsWith}foo, bar#{endsWith}"

    [start, mid..., end] = tokens

    expect(start).toEqual value: startsWith, scopes: ["source.clojure", "meta.#{metaScope}.clojure", "punctuation.section.#{puncScope}.begin.clojure"]
    expect(end).toEqual value: endsWith, scopes: ["source.clojure", "meta.#{metaScope}.clojure", "punctuation.section.#{puncScope}.end.trailing.clojure"]

    for token in mid
      expect(token.scopes.slice(0, 2)).toEqual ["source.clojure", "meta.#{metaScope}.clojure"]

    # Expression broken over multiple lines.
    tokens = grammar.tokenizeLines("#{startsWith}foo\n bar#{endsWith}")

    [start, mid..., after] = tokens[0]

    expect(start).toEqual value: startsWith, scopes: ["source.clojure", "meta.#{metaScope}.clojure", "punctuation.section.#{puncScope}.begin.clojure"]

    for token in mid
      expect(token.scopes.slice(0, 2)).toEqual ["source.clojure", "meta.#{metaScope}.clojure"]

    [mid..., end] = tokens[1]

    expect(end).toEqual value: endsWith, scopes: ["source.clojure", "meta.#{metaScope}.clojure", "punctuation.section.#{puncScope}.end.trailing.clojure"]

    for token in mid
      expect(token.scopes.slice(0, 2)).toEqual ["source.clojure", "meta.#{metaScope}.clojure"]

  it "tokenizes expressions", ->
    testMetaSection "expression", "expression", "(", ")"

  it "tokenizes quoted expressions", ->
    testMetaSection "quoted-expression", "expression", "'(", ")"
    testMetaSection "quoted-expression", "expression", "`(", ")"

  it "tokenizes vectors", ->
    testMetaSection "vector", "vector", "[", "]"

  it "tokenizes maps", ->
    testMetaSection "map", "map", "{", "}"

  it "tokenizes sets", ->
    testMetaSection "set", "set", "\#{", "}"

  it "tokenizes functions in nested sexp", ->
    {tokens} = grammar.tokenizeLine "((foo bar) baz)"
    expect(tokens[0]).toEqual value: "(", scopes: ["source.clojure", "meta.expression.clojure", "punctuation.section.expression.begin.clojure"]
    expect(tokens[1]).toEqual value: "(", scopes: ["source.clojure", "meta.expression.clojure", "meta.expression.clojure", "punctuation.section.expression.begin.clojure"]
    expect(tokens[2]).toEqual value: "foo", scopes: ["source.clojure", "meta.expression.clojure", "meta.expression.clojure", "entity.name.function.clojure"]
    expect(tokens[3]).toEqual value: " ", scopes: ["source.clojure", "meta.expression.clojure", "meta.expression.clojure"]
    expect(tokens[4]).toEqual value: "bar", scopes: ["source.clojure", "meta.expression.clojure", "meta.expression.clojure", "meta.symbol.clojure"]
    expect(tokens[5]).toEqual value: ")", scopes: ["source.clojure", "meta.expression.clojure", "meta.expression.clojure", "punctuation.section.expression.end.clojure"]
    expect(tokens[6]).toEqual value: " ", scopes: ["source.clojure", "meta.expression.clojure"]
    expect(tokens[7]).toEqual value: "baz", scopes: ["source.clojure", "meta.expression.clojure", "meta.symbol.clojure"]
    expect(tokens[8]).toEqual value: ")", scopes: ["source.clojure", "meta.expression.clojure", "punctuation.section.expression.end.trailing.clojure"]

  it "tokenizes maps used as functions", ->
    {tokens} = grammar.tokenizeLine "({:foo bar} :foo)"
    expect(tokens[0]).toEqual value: "(", scopes: ["source.clojure", "meta.expression.clojure", "punctuation.section.expression.begin.clojure"]
    expect(tokens[1]).toEqual value: "{", scopes: ["source.clojure", "meta.expression.clojure", "meta.map.clojure", "punctuation.section.map.begin.clojure"]
    expect(tokens[2]).toEqual value: ":foo", scopes: ["source.clojure", "meta.expression.clojure", "meta.map.clojure", "constant.keyword.clojure"]
    expect(tokens[3]).toEqual value: " ", scopes: ["source.clojure", "meta.expression.clojure", "meta.map.clojure"]
    expect(tokens[4]).toEqual value: "bar", scopes: ["source.clojure", "meta.expression.clojure", "meta.map.clojure", "meta.symbol.clojure"]
    expect(tokens[5]).toEqual value: "}", scopes: ["source.clojure", "meta.expression.clojure", "meta.map.clojure", "punctuation.section.map.end.clojure"]
    expect(tokens[6]).toEqual value: " ", scopes: ["source.clojure", "meta.expression.clojure"]
    expect(tokens[7]).toEqual value: ":foo", scopes: ["source.clojure", "meta.expression.clojure", "constant.keyword.clojure"]
    expect(tokens[8]).toEqual value: ")", scopes: ["source.clojure", "meta.expression.clojure", "punctuation.section.expression.end.trailing.clojure"]

  it "tokenizes sets used in functions", ->
    {tokens} = grammar.tokenizeLine "(\#{:foo :bar})"
    expect(tokens[0]).toEqual value: "(", scopes: ["source.clojure", "meta.expression.clojure", "punctuation.section.expression.begin.clojure"]
    expect(tokens[1]).toEqual value: "\#{", scopes: ["source.clojure", "meta.expression.clojure", "meta.set.clojure", "punctuation.section.set.begin.clojure"]
    expect(tokens[2]).toEqual value: ":foo", scopes: ["source.clojure", "meta.expression.clojure", "meta.set.clojure", "constant.keyword.clojure"]
    expect(tokens[3]).toEqual value: " ", scopes: ["source.clojure", "meta.expression.clojure", "meta.set.clojure"]
    expect(tokens[4]).toEqual value: ":bar", scopes: ["source.clojure", "meta.expression.clojure", "meta.set.clojure", "constant.keyword.clojure"]
    expect(tokens[5]).toEqual value: "}", scopes: ["source.clojure", "meta.expression.clojure", "meta.set.clojure", "punctuation.section.set.end.trailing.clojure"]
    expect(tokens[6]).toEqual value: ")", scopes: ["source.clojure", "meta.expression.clojure", "punctuation.section.expression.end.trailing.clojure"]

  describe "firstLineMatch", ->
    it "recognises interpreter directives", ->
      valid = """
        #!/usr/sbin/boot foo
        #!/usr/bin/boot foo=bar/
        #!/usr/sbin/boot
        #!/usr/sbin/boot foo bar baz
        #!/usr/bin/boot perl
        #!/usr/bin/boot bin/perl
        #!/usr/bin/boot
        #!/bin/boot
        #!/usr/bin/boot --script=usr/bin
        #! /usr/bin/env A=003 B=149 C=150 D=xzd E=base64 F=tar G=gz H=head I=tail boot
        #!\t/usr/bin/env --foo=bar boot --quu=quux
        #! /usr/bin/boot
        #!/usr/bin/env boot
      """
      for line in valid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).not.toBeNull()

      invalid = """
        \x20#!/usr/sbin/boot
        \t#!/usr/sbin/boot
        #!/usr/bin/env-boot/node-env/
        #!/usr/bin/das-boot
        #! /usr/binboot
        #!\t/usr/bin/env --boot=bar
      """
      for line in invalid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).toBeNull()

    it "recognises Emacs modelines", ->
      valid = """
        #-*- Clojure -*-
        #-*- mode: ClojureScript -*-
        /* -*-clojureScript-*- */
        // -*- Clojure -*-
        /* -*- mode:Clojure -*- */
        // -*- font:bar;mode:Clojure -*-
        // -*- font:bar;mode:Clojure;foo:bar; -*-
        // -*-font:mode;mode:Clojure-*-
        // -*- foo:bar mode: clojureSCRIPT bar:baz -*-
        " -*-foo:bar;mode:clojure;bar:foo-*- ";
        " -*-font-mode:foo;mode:clojure;foo-bar:quux-*-"
        "-*-font:x;foo:bar; mode : clojure; bar:foo;foooooo:baaaaar;fo:ba;-*-";
        "-*- font:x;foo : bar ; mode : ClojureScript ; bar : foo ; foooooo:baaaaar;fo:ba-*-";
      """
      for line in valid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).not.toBeNull()

      invalid = """
        /* --*clojure-*- */
        /* -*-- clojure -*-
        /* -*- -- Clojure -*-
        /* -*- Clojure -;- -*-
        // -*- iClojure -*-
        // -*- Clojure; -*-
        // -*- clojure-door -*-
        /* -*- model:clojure -*-
        /* -*- indent-mode:clojure -*-
        // -*- font:mode;Clojure -*-
        // -*- mode: -*- Clojure
        // -*- mode: das-clojure -*-
        // -*-font:mode;mode:clojure--*-
      """
      for line in invalid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).toBeNull()

    it "recognises Vim modelines", ->
      valid = """
        vim: se filetype=clojure:
        # vim: se ft=clojure:
        # vim: set ft=Clojure:
        # vim: set filetype=Clojure:
        # vim: ft=Clojure
        # vim: syntax=Clojure
        # vim: se syntax=Clojure:
        # ex: syntax=Clojure
        # vim:ft=clojure
        # vim600: ft=clojure
        # vim>600: set ft=clojure:
        # vi:noai:sw=3 ts=6 ft=clojure
        # vi::::::::::noai:::::::::::: ft=clojure
        # vim:ts=4:sts=4:sw=4:noexpandtab:ft=clojure
        # vi:: noai : : : : sw   =3 ts   =6 ft  =clojure
        # vim: ts=4: pi sts=4: ft=clojure: noexpandtab: sw=4:
        # vim: ts=4 sts=4: ft=clojure noexpandtab:
        # vim:noexpandtab sts=4 ft=clojure ts=4
        # vim:noexpandtab:ft=clojure
        # vim:ts=4:sts=4 ft=clojure:noexpandtab:\x20
        # vim:noexpandtab titlestring=hi\|there\\\\ ft=clojure ts=4
      """
      for line in valid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).not.toBeNull()

      invalid = """
        ex: se filetype=clojure:
        _vi: se filetype=clojure:
         vi: se filetype=clojure
        # vim set ft=klojure
        # vim: soft=clojure
        # vim: clean-syntax=clojure:
        # vim set ft=clojure:
        # vim: setft=clojure:
        # vim: se ft=clojure backupdir=tmp
        # vim: set ft=clojure set cmdheight=1
        # vim:noexpandtab sts:4 ft:clojure ts:4
        # vim:noexpandtab titlestring=hi\\|there\\ ft=clojure ts=4
        # vim:noexpandtab titlestring=hi\\|there\\\\\\ ft=clojure ts=4
      """
      for line in invalid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).toBeNull()
