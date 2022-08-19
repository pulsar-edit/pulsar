describe "Perl 6 grammar", ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage("language-perl")

    runs ->
      grammar = atom.grammars.grammarForScopeName("source.perl6")

  it "parses the grammar", ->
    expect(grammar).toBeDefined()
    expect(grammar.scopeName).toBe "source.perl6"

  describe "identifiers", ->
    it "should match simple scalar identifiers", ->
      {tokens} = grammar.tokenizeLine('$a')
      expect(tokens[0]).toEqual value: '$a', scopes: [
        'source.perl6'
        'variable.other.identifier.perl6'
      ]

    it "should match simple array identifiers", ->
      {tokens} = grammar.tokenizeLine('@a')
      expect(tokens[0]).toEqual value: '@a', scopes: [
        'source.perl6'
        'variable.other.identifier.perl6'
      ]

    it "should match simple hash identifiers", ->
      {tokens} = grammar.tokenizeLine('%a')
      expect(tokens[0]).toEqual value: '%a', scopes: [
        'source.perl6'
        'variable.other.identifier.perl6'
      ]

    it "should match simple hash identifiers", ->
      {tokens} = grammar.tokenizeLine('&a')
      expect(tokens[0]).toEqual value: '&a', scopes: [
        'source.perl6'
        'variable.other.identifier.perl6'
      ]

    it "should match unicode identifiers", ->
      {tokens} = grammar.tokenizeLine('$cööl-páttérn')
      expect(tokens[0]).toEqual value: '$cööl-páttérn', scopes: [
        'source.perl6'
        'variable.other.identifier.perl6'
      ]

    it "should match identifiers with multiple dashes which can contain other keywords", ->
      {tokens} = grammar.tokenizeLine('start-from-here')
      expect(tokens.length).toEqual 1
      expect(tokens[0]).toEqual value: 'start-from-here', scopes: [
        'source.perl6'
        'routine.name.perl6'
      ]

    it "should match identifiers with dash which can contain other keywords", ->
      {tokens} = grammar.tokenizeLine('start-here')
      expect(tokens.length).toEqual 1
      expect(tokens[0]).toEqual value: 'start-here', scopes: [
        'source.perl6'
        'routine.name.perl6'
      ]

    it "should match identifiers with dash which can contain other keywords", ->
      {tokens} = grammar.tokenizeLine('is-required')
      expect(tokens.length).toEqual 1
      expect(tokens[0]).toEqual value: 'is-required', scopes: [
        'source.perl6'
        'routine.name.perl6'
      ]

    it "should match identifiers with dash which can contain other keywords", ->
      {tokens} = grammar.tokenizeLine('is-utf8')
      expect(tokens.length).toEqual 1
      expect(tokens[0]).toEqual value: 'is-utf8', scopes: [
        'source.perl6'
        'routine.name.perl6'
      ]

    it "should match identifiers with a dangling match", ->
      {tokens} = grammar.tokenizeLine('is-')
      expect(tokens.length).toEqual 2
      expect(tokens[0]).toEqual value: 'is', scopes: [
        'source.perl6'
        'routine.name.perl6'
      ]
      expect(tokens[1]).toEqual value: '-', scopes: [
        'source.perl6'
      ]

    it "should not match scalar identifiers with a dash followed by a number", ->
      {tokens} = grammar.tokenizeLine('$foo-1')
      expect(tokens.length).toEqual 2
      expect(tokens[0]).toEqual value: '$foo', scopes: [
        'source.perl6'
        'variable.other.identifier.perl6'
      ]
      expect(tokens[1]).toEqual value: '-1', scopes: [
        'source.perl6'
      ]

  describe "strings", ->
    it "should tokenize simple strings", ->
      {tokens} = grammar.tokenizeLine('"abc"')
      expect(tokens.length).toEqual 3
      expect(tokens[0]).toEqual value: '"', scopes: [
        'source.perl6'
        'string.quoted.double.perl6'
        'punctuation.definition.string.begin.perl6'
      ]
      expect(tokens[1]).toEqual value: 'abc', scopes: [
        'source.perl6'
        'string.quoted.double.perl6'
      ]
      expect(tokens[2]).toEqual value: '"', scopes: [
        'source.perl6'
        'string.quoted.double.perl6'
        'punctuation.definition.string.end.perl6'
      ]

  describe "modules", ->
    it "should parse package declarations", ->
      {tokens} = grammar.tokenizeLine("class Johnny's::Super-Cool::cööl-páttérn::Module")
      expect(tokens.length).toEqual 3
      expect(tokens[0]).toEqual value: 'class', scopes: [
        'source.perl6'
        'meta.class.perl6'
        'storage.type.class.perl6'
      ]
      expect(tokens[1]).toEqual
        value: ' '
        scopes: [
          'source.perl6'
          'meta.class.perl6'
        ]
      expect(tokens[2]).toEqual
        value: 'Johnny\'s::Super-Cool::cööl-páttérn::Module'
        scopes: [
          'source.perl6'
          'meta.class.perl6'
          'entity.name.type.class.perl6'
        ]

  describe "comments", ->
    it "should parse comments", ->
      {tokens} = grammar.tokenizeLine("# this is the comment")
      expect(tokens.length).toEqual 3
      expect(tokens[0]).toEqual
        value: '#'
        scopes: [
          'source.perl6'
          'comment.line.number-sign.perl6'
          'punctuation.definition.comment.perl6'
        ]
      expect(tokens[1]).toEqual
        value: ' this is the comment',
        scopes: [
          'source.perl6'
          'comment.line.number-sign.perl6'
        ]


  describe "firstLineMatch", ->
    it "recognises interpreter directives", ->
      valid = """
        #!perl6 -w
        #! perl6 -w
        #!/usr/sbin/perl6 foo
        #!/usr/bin/perl6 foo=bar/
        #!/usr/sbin/perl6
        #!/usr/sbin/perl6 foo bar baz
        #!/usr/bin/env perl6
        #!/usr/bin/env bin/perl6
        #!/usr/bin/perl6
        #!/bin/perl6
        #!/usr/bin/perl6 --script=usr/bin
        #! /usr/bin/env A=003 B=149 C=150 D=xzd E=base64 F=tar G=gz H=head I=tail perl6
        #!\t/usr/bin/env --foo=bar perl6 --quu=quux
        #! /usr/bin/perl6
        #!/usr/bin/env perl6
      """
      for line in valid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).not.toBeNull()

      invalid = """
        #! pearl6
        #!/bin/perl 6
        perl6
        #perl6
        \x20#!/usr/sbin/perl6
        \t#!/usr/sbin/perl6
        #!
        #!\x20
        #!/usr/bin/env
        #!/usr/bin/env-perl6
        #! /usr/binperl6
        #!\t/usr/bin/env --perl6=bar
      """
      for line in invalid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).toBeNull()

    it "recognises the Perl6 pragma", ->
      line = "use v6;"
      expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).not.toBeNull()

    it "recognises Emacs modelines", ->
      modelines = """
        #-*-perl6-*-
        #-*-mode:perl6-*-
        /* -*-perl6-*- */
        // -*- PERL6 -*-
        /* -*- mode:perl6 -*- */
        // -*- font:bar;mode:Perl6 -*-
        // -*- font:bar;mode:Perl6;foo:bar; -*-
        // -*-font:mode;mode:perl6-*-
        " -*-foo:bar;mode:Perl6;bar:foo-*- ";
        " -*-font-mode:foo;mode:Perl6;foo-bar:quux-*-"
        "-*-font:x;foo:bar; mode : pErL6;bar:foo;foooooo:baaaaar;fo:ba;-*-";
        "-*- font:x;foo : bar ; mode : pErL6 ; bar : foo ; foooooo:baaaaar;fo:ba-*-";
      """
      for line in modelines.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).not.toBeNull()

      invalid = """
        /* --*perl6-*- */
        /* -*-- perl6 -*-
        /* -*- -- perl6 -*-
        /* -*- perl6 -;- -*-
        // -*- iPERL6 -*-
        // -*- perl 6 -*-
        // -*- perl6-stuff -*-
        /* -*- model:perl6 -*-
        /* -*- indent-mode:perl6 -*-
        // -*- font:mode;Perl6 -*-
        // -*- mode: -*- Perl6
        // -*- mode: grok-with-perl6 -*-
        // -*-font:mode;mode:perl6--*-
      """

      for line in invalid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).toBeNull()

    it "recognises Vim modelines", ->
      valid = """
        vim: se filetype=perl6:
        # vim: se ft=perl6:
        # vim: set ft=perl6:
        # vim: set filetype=Perl6:
        # vim: ft=perl6
        # vim: syntax=pERl6
        # vim: se syntax=PERL6:
        # ex: syntax=perl6
        # vim:ft=perl6
        # vim600: ft=perl6
        # vim>600: set ft=perl6:
        # vi:noai:sw=3 ts=6 ft=perl6
        # vi::::::::::noai:::::::::::: ft=perl6
        # vim:ts=4:sts=4:sw=4:noexpandtab:ft=perl6
        # vi:: noai : : : : sw   =3 ts   =6 ft  =perl6
        # vim: ts=4: pi sts=4: ft=perl6: noexpandtab: sw=4:
        # vim: ts=4 sts=4: ft=perl6 noexpandtab:
        # vim:noexpandtab sts=4 ft=perl6 ts=4
        # vim:noexpandtab:ft=perl6
        # vim:ts=4:sts=4 ft=perl6:noexpandtab:\x20
        # vim:noexpandtab titlestring=hi\|there\\\\ ft=perl6 ts=4
      """
      for line in valid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).not.toBeNull()

      invalid = """
        ex: se filetype=perl6:
        _vi: se filetype=perl6:
         vi: se filetype=perl6
        # vim set ft=perl6o
        # vim: soft=perl6
        # vim: hairy-syntax=perl6:
        # vim set ft=perl6:
        # vim: setft=perl6:
        # vim: se ft=perl6 backupdir=tmp
        # vim: set ft=perl6 set cmdheight=1
        # vim:noexpandtab sts:4 ft:perl6 ts:4
        # vim:noexpandtab titlestring=hi\\|there\\ ft=perl6 ts=4
        # vim:noexpandtab titlestring=hi\\|there\\\\\\ ft=perl6 ts=4
      """
      for line in invalid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).toBeNull()

# Local variables:
# mode: CoffeeScript
# End:
