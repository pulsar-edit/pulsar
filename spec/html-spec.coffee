describe 'PHP in HTML', ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage 'language-php'

    waitsForPromise ->
      # While not used explicitly in any tests, we still activate language-html
      # to mirror how language-php behaves outside of specs
      atom.packages.activatePackage 'language-html'

    runs ->
      grammar = atom.grammars.grammarForScopeName 'text.html.php'

  it 'parses the grammar', ->
    expect(grammar).toBeTruthy()
    expect(grammar.scopeName).toBe 'text.html.php'

  describe 'PHP tags', ->
    it 'tokenizes starting and closing PHP tags on the same line', ->
      startTags = ['<?php', '<?=', '<?']

      for startTag in startTags
        tokens = grammar.tokenizeLines "#{startTag} /* stuff */ ?>"

        expect(tokens[0][0]).toEqual value: startTag, scopes: ['text.html.php', 'meta.embedded.line.php', 'punctuation.section.embedded.begin.php']
        expect(tokens[0][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.line.php', 'source.php']
        expect(tokens[0][2]).toEqual value: '/*', scopes: ['text.html.php', 'meta.embedded.line.php', 'source.php', 'comment.block.php', 'punctuation.definition.comment.php']
        expect(tokens[0][4]).toEqual value: '*/', scopes: ['text.html.php', 'meta.embedded.line.php', 'source.php', 'comment.block.php', 'punctuation.definition.comment.php']
        expect(tokens[0][5]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.line.php', 'source.php']
        expect(tokens[0][6]).toEqual value: '?', scopes: ['text.html.php', 'meta.embedded.line.php', 'punctuation.section.embedded.end.php', 'source.php']
        expect(tokens[0][7]).toEqual value: '>', scopes: ['text.html.php', 'meta.embedded.line.php', 'punctuation.section.embedded.end.php']

    it 'tokenizes starting and closing PHP tags on different lines', ->
      startTags = ['<?php', '<?=', '<?']

      for startTag in startTags
        tokens = grammar.tokenizeLines "#{startTag}\n/* stuff */ ?>"

        expect(tokens[0][0]).toEqual value: startTag, scopes: ['text.html.php', 'meta.embedded.block.php', 'punctuation.section.embedded.begin.php']
        expect(tokens[1][0]).toEqual value: '/*', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.php', 'punctuation.definition.comment.php']
        expect(tokens[1][2]).toEqual value: '*/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.php', 'punctuation.definition.comment.php']
        expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][4]).toEqual value: '?', scopes: ['text.html.php', 'meta.embedded.block.php', 'punctuation.section.embedded.end.php', 'source.php']
        expect(tokens[1][5]).toEqual value: '>', scopes: ['text.html.php', 'meta.embedded.block.php', 'punctuation.section.embedded.end.php']

        tokens = grammar.tokenizeLines "#{startTag} /* stuff */\n?>"

        expect(tokens[0][0]).toEqual value: startTag, scopes: ['text.html.php', 'meta.embedded.block.php', 'punctuation.section.embedded.begin.php']
        expect(tokens[0][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[0][2]).toEqual value: '/*', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.php', 'punctuation.definition.comment.php']
        expect(tokens[0][4]).toEqual value: '*/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.php', 'punctuation.definition.comment.php']
        expect(tokens[1][0]).toEqual value: '?', scopes: ['text.html.php', 'meta.embedded.block.php', 'punctuation.section.embedded.end.php', 'source.php']
        expect(tokens[1][1]).toEqual value: '>', scopes: ['text.html.php', 'meta.embedded.block.php', 'punctuation.section.embedded.end.php']

        tokens = grammar.tokenizeLines "#{startTag}\n/* stuff */\n?>"

        expect(tokens[0][0]).toEqual value: startTag, scopes: ['text.html.php', 'meta.embedded.block.php', 'punctuation.section.embedded.begin.php']
        expect(tokens[1][0]).toEqual value: '/*', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.php', 'punctuation.definition.comment.php']
        expect(tokens[1][2]).toEqual value: '*/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.php', 'punctuation.definition.comment.php']
        expect(tokens[2][0]).toEqual value: '?', scopes: ['text.html.php', 'meta.embedded.block.php', 'punctuation.section.embedded.end.php', 'source.php']
        expect(tokens[2][1]).toEqual value: '>', scopes: ['text.html.php', 'meta.embedded.block.php', 'punctuation.section.embedded.end.php']

    it 'tokenizes `include` on the same line as <?php', ->
      # https://github.com/atom/language-php/issues/154
      {tokens} = grammar.tokenizeLine "<?php include 'test'?>"

      expect(tokens[2]).toEqual value: 'include', scopes: ['text.html.php', 'meta.embedded.line.php', 'source.php', 'meta.include.php', 'keyword.control.import.include.php']
      expect(tokens[4]).toEqual value: "'", scopes: ['text.html.php', 'meta.embedded.line.php', 'source.php', 'meta.include.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
      expect(tokens[6]).toEqual value: "'", scopes: ['text.html.php', 'meta.embedded.line.php', 'source.php', 'meta.include.php', 'string.quoted.single.php', 'punctuation.definition.string.end.php']
      expect(tokens[7]).toEqual value: '?', scopes: ['text.html.php', 'meta.embedded.line.php', 'punctuation.section.embedded.end.php', 'source.php']
      expect(tokens[8]).toEqual value: '>', scopes: ['text.html.php', 'meta.embedded.line.php', 'punctuation.section.embedded.end.php']

    it 'tokenize namespaces immediately following <?php', ->
      {tokens} = grammar.tokenizeLine '<?php namespace Test;'

      expect(tokens[1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php']
      expect(tokens[2]).toEqual value: 'namespace', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'keyword.other.namespace.php']
      expect(tokens[3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php']
      expect(tokens[4]).toEqual value: 'Test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(tokens[5]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  describe 'shebang', ->
    it 'recognises shebang on the first line of document', ->
      lines = grammar.tokenizeLines '''
        #!/usr/bin/env php
        <?php echo "test"; ?>
      '''

      expect(lines[0][0]).toEqual value: '#!', scopes: ['text.html.php', 'comment.line.shebang.php', 'punctuation.definition.comment.php']
      expect(lines[0][1]).toEqual value: '/usr/bin/env php', scopes: ['text.html.php', 'comment.line.shebang.php']
      expect(lines[1][0]).toEqual value: '<?php', scopes: ['text.html.php', 'meta.embedded.line.php', 'punctuation.section.embedded.begin.php']

    it 'does not recognize shebang on any of the other lines', ->
      lines = grammar.tokenizeLines '''

        #!/usr/bin/env php
        <?php echo "test"; ?>
      '''

      expect(lines[1][0]).toEqual value: '#!/usr/bin/env php', scopes: [ 'text.html.php' ]

  describe 'firstLineMatch', ->
    it 'recognises interpreter directives', ->
      valid = '''
        #!/usr/bin/php
        #!/usr/bin/php foo=bar/
        #!/usr/sbin/php5
        #!/usr/sbin/php7 foo bar baz
        #!/usr/bin/php perl
        #!/usr/bin/php4 bin/perl
        #!/usr/bin/env php
        #!/bin/php
        #!/usr/bin/php --script=usr/bin
        #! /usr/bin/env A=003 B=149 C=150 D=xzd E=base64 F=tar G=gz H=head I=tail php
        #!\t/usr/bin/env --foo=bar php --quu=quux
        #! /usr/bin/php
        #!/usr/bin/env php
      '''
      for line in valid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).not.toBeNull()

      invalid = '''
        \x20#!/usr/sbin/php
        \t#!/usr/sbin/php
        #!/usr/bin/env-php/node-env/
        #!/usr/bin/env-php
        #! /usr/binphp
        #!/usr/bin.php
        #!\t/usr/bin/env --php=bar
      '''
      for line in invalid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).toBeNull()

    it 'recognises Emacs modelines', ->
      valid = '''
        #-*- PHP -*-
        #-*- mode: PHP -*-
        /* -*-php-*- */
        // -*- PHP -*-
        /* -*- mode:PHP -*- */
        // -*- font:bar;mode:pHp -*-
        // -*- font:bar;mode:PHP;foo:bar; -*-
        // -*-font:mode;mode:php-*-
        // -*- foo:bar mode: php bar:baz -*-
        "-*-foo:bar;mode:php;bar:foo-*- ";
        "-*-font-mode:foo;mode:php;foo-bar:quux-*-"
        "-*-font:x;foo:bar; mode : PHP; bar:foo;foooooo:baaaaar;fo:ba;-*-";
        "-*- font:x;foo : bar ; mode : php ; bar : foo ; foooooo:baaaaar;fo:ba-*-";
      '''
      for line in valid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).not.toBeNull()

      invalid = '''
        /* --*php-*- */
        /* -*-- php -*-
        /* -*- -- PHP -*-
        /* -*- PHP -;- -*-
        // -*- PHPetrol -*-
        // -*- PHP; -*-
        // -*- php-stuff -*-
        /* -*- model:php -*-
        /* -*- indent-mode:php -*-
        // -*- font:mode;php -*-
        // -*- mode: -*- php
        // -*- mode: stop-using-php -*-
        // -*-font:mode;mode:php--*-
      '''
      for line in invalid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).toBeNull()

    it 'recognises Vim modelines', ->
      valid = '''
        vim: se filetype=php:
        # vim: se ft=php:
        # vim: set ft=PHP:
        # vim: set filetype=PHP:
        # vim: ft=PHTML
        # vim: syntax=phtml
        # vim: se syntax=php:
        # ex: syntax=PHP
        # vim:ft=php
        # vim600: ft=php
        # vim>600: set ft=PHP:
        # vi:noai:sw=3 ts=6 ft=phtml
        # vi::::::::::noai:::::::::::: ft=phtml
        # vim:ts=4:sts=4:sw=4:noexpandtab:ft=phtml
        # vi:: noai : : : : sw   =3 ts   =6 ft  =php
        # vim: ts=4: pi sts=4: ft=php: noexpandtab: sw=4:
        # vim: ts=4 sts=4: ft=php noexpandtab:
        # vim:noexpandtab sts=4 ft=php ts=4
        # vim:noexpandtab:ft=php
        # vim:ts=4:sts=4 ft=phtml:noexpandtab:\x20
        # vim:noexpandtab titlestring=hi\|there\\\\ ft=phtml ts=4
      '''
      for line in valid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).not.toBeNull()

      invalid = '''
        ex: se filetype=php:
        _vi: se filetype=php:
         vi: se filetype=php
        # vim set ft=phpetrol
        # vim: soft=php
        # vim: clean-syntax=php:
        # vim set ft=php:
        # vim: setft=php:
        # vim: se ft=php backupdir=tmp
        # vim: set ft=php set cmdheight=1
        # vim:noexpandtab sts:4 ft:php ts:4
        # vim:noexpandtab titlestring=hi\\|there\\ ft=php ts=4
        # vim:noexpandtab titlestring=hi\\|there\\\\\\ ft=php ts=4
      '''
      for line in invalid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).toBeNull()
