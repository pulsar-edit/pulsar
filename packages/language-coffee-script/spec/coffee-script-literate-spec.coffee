describe "CoffeeScript (Literate) grammar", ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage("language-coffee-script")

    runs ->
      grammar = atom.grammars.grammarForScopeName("source.litcoffee")

  it "parses the grammar", ->
    expect(grammar).toBeTruthy()
    expect(grammar.scopeName).toBe "source.litcoffee"

  it "recognizes a code block after a list", ->
    tokens = grammar.tokenizeLines '''
      1. Example
      2. List

          1 + 2
    '''
    expect(tokens[3][1]).toEqual value: "1", scopes: ["source.litcoffee", "markup.raw.block.markdown", "constant.numeric.decimal.coffee"]

  describe "firstLineMatch", ->
    it "recognises interpreter directives", ->
      valid = """
        #!/usr/local/bin/coffee --no-header --literate -w
        #!/usr/local/bin/coffee -l
        #!/usr/local/bin/env coffee --literate -w
      """
      for line in valid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).not.toBeNull()

      invalid = """
        #!/usr/local/bin/coffee --no-head -literate -w
        #!/usr/local/bin/coffee --wl
        #!/usr/local/bin/env coffee --illiterate -w=l
      """
      for line in invalid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).toBeNull()

    it "recognises Emacs modelines", ->
      valid = """
        #-*- litcoffee -*-
        #-*- mode: litcoffee -*-
        /* -*-litcoffee-*- */
        // -*- litcoffee -*-
        /* -*- mode:LITCOFFEE -*- */
        // -*- font:bar;mode:LitCoffee -*-
        // -*- font:bar;mode:litcoffee;foo:bar; -*-
        // -*-font:mode;mode:litcoffee-*-
        // -*- foo:bar mode: litcoffee bar:baz -*-
        " -*-foo:bar;mode:litcoffee;bar:foo-*- ";
        " -*-font-mode:foo;mode:LITcofFEE;foo-bar:quux-*-"
        "-*-font:x;foo:bar; mode : litCOFFEE; bar:foo;foooooo:baaaaar;fo:ba;-*-";
        "-*- font:x;foo : bar ; mode : LiTcOFFEe ; bar : foo ; foooooo:baaaaar;fo:ba-*-";
      """
      for line in valid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).not.toBeNull()

      invalid = """
        /* --*litcoffee-*- */
        /* -*-- litcoffee -*-
        /* -*- -- litcoffee -*-
        /* -*- LITCOFFEE -;- -*-
        // -*- itsLitCoffeeFam -*-
        // -*- litcoffee; -*-
        // -*- litcoffee-stuff -*-
        /* -*- model:litcoffee -*-
        /* -*- indent-mode:litcoffee -*-
        // -*- font:mode;litcoffee -*-
        // -*- mode: -*- litcoffee
        // -*- mode: burnt-because-litcoffee -*-
        // -*-font:mode;mode:litcoffee--*-
      """
      for line in invalid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).toBeNull()

    it "recognises Vim modelines", ->
      valid = """
        vim: se filetype=litcoffee:
        # vim: se ft=litcoffee:
        # vim: set ft=LITCOFFEE:
        # vim: set filetype=litcoffee:
        # vim: ft=LITCOFFEE
        # vim: syntax=litcoffee
        # vim: se syntax=litcoffee:
        # ex: syntax=litcoffee
        # vim:ft=LitCoffee
        # vim600: ft=litcoffee
        # vim>600: set ft=litcoffee:
        # vi:noai:sw=3 ts=6 ft=litcoffee
        # vi::::::::::noai:::::::::::: ft=litcoffee
        # vim:ts=4:sts=4:sw=4:noexpandtab:ft=LITCOFFEE
        # vi:: noai : : : : sw   =3 ts   =6 ft  =litCoffee
        # vim: ts=4: pi sts=4: ft=litcoffee: noexpandtab: sw=4:
        # vim: ts=4 sts=4: ft=litcoffee noexpandtab:
        # vim:noexpandtab sts=4 ft=LitCOffEE ts=4
        # vim:noexpandtab:ft=litcoffee
        # vim:ts=4:sts=4 ft=litcoffee:noexpandtab:\x20
        # vim:noexpandtab titlestring=hi\|there\\\\ ft=litcoffee ts=4
      """
      for line in valid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).not.toBeNull()

      invalid = """
        ex: se filetype=litcoffee:
        _vi: se filetype=litcoffee:
         vi: se filetype=litcoffee
        # vim set ft=illitcoffee
        # vim: soft=litcoffee
        # vim: clean-syntax=litcoffee:
        # vim set ft=litcoffee:
        # vim: setft=litcoffee:
        # vim: se ft=litcoffee backupdir=tmp
        # vim: set ft=LITCOFFEE set cmdheight=1
        # vim:noexpandtab sts:4 ft:litcoffee ts:4
        # vim:noexpandtab titlestring=hi\\|there\\ ft=litcoffee ts=4
        # vim:noexpandtab titlestring=hi\\|there\\\\\\ ft=litcoffee ts=4
      """
      for line in invalid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).toBeNull()
