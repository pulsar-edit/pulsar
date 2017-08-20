path = require 'path'
grammarTest = require 'atom-grammar-test'

describe 'HTML grammar', ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage('language-html')

    waitsForPromise ->
      atom.packages.activatePackage('language-coffee-script')

    runs ->
      grammar = atom.grammars.grammarForScopeName('text.html.basic')

  it 'parses the grammar', ->
    expect(grammar).toBeTruthy()
    expect(grammar.scopeName).toBe 'text.html.basic'

  describe 'meta.scope.outside-tag scope', ->
    it 'tokenizes an empty file', ->
      lines = grammar.tokenizeLines ''
      expect(lines[0][0]).toEqual value: '', scopes: ['text.html.basic']

    it 'tokenizes a single < as without freezing', ->
      lines = grammar.tokenizeLines '<'
      expect(lines[0][0]).toEqual value: '<', scopes: ['text.html.basic']

      lines = grammar.tokenizeLines ' <'
      expect(lines[0][0]).toEqual value: ' <', scopes: ['text.html.basic']

    it 'tokenizes <? without locking up', ->
      lines = grammar.tokenizeLines '<?'
      expect(lines[0][0]).toEqual value: '<?', scopes: ['text.html.basic']

    it 'tokenizes >< as html without locking up', ->
      lines = grammar.tokenizeLines '><'
      expect(lines[0][0]).toEqual value: '><', scopes: ['text.html.basic']

    it 'tokenizes < after tags without locking up', ->
      lines = grammar.tokenizeLines '<span><'
      expect(lines[0][3]).toEqual value: '<', scopes: ['text.html.basic']

  describe 'template script tags', ->
    it 'tokenizes the content inside the tag as HTML', ->
      lines = grammar.tokenizeLines '''
        <script id='id' type='text/template'>
          <div>test</div>
        </script>
      '''

      expect(lines[0][0]).toEqual value: '<', scopes: ['text.html.basic', 'punctuation.definition.tag.html']
      expect(lines[1][0]).toEqual value: '  ', scopes: ['text.html.basic', 'text.embedded.html']
      expect(lines[1][1]).toEqual value: '<', scopes: ['text.html.basic', 'text.embedded.html', 'meta.tag.block.any.html', 'punctuation.definition.tag.begin.html']

  describe 'CoffeeScript script tags', ->
    it 'tokenizes the content inside the tag as CoffeeScript', ->
      lines = grammar.tokenizeLines '''
        <script id='id' type='text/coffeescript'>
          -> console.log 'hi'
        </script>
      '''

      expect(lines[0][0]).toEqual value: '<', scopes: ['text.html.basic', 'punctuation.definition.tag.html']
      expect(lines[1][0]).toEqual value: '  ', scopes: ['text.html.basic', 'source.coffee.embedded.html']
      expect(lines[1][1]).toEqual value: '->', scopes: ['text.html.basic', 'source.coffee.embedded.html', 'storage.type.function.coffee']

  describe 'JavaScript script tags', ->
    beforeEach ->
      waitsForPromise -> atom.packages.activatePackage('language-javascript')

    it 'tokenizes the content inside the tag as JavaScript', ->
      lines = grammar.tokenizeLines '''
        <script id='id' type='text/javascript'>
          var hi = 'hi'
        </script>
      '''

      expect(lines[0][0]).toEqual value: '<', scopes: ['text.html.basic', 'punctuation.definition.tag.html']

      expect(lines[1][0]).toEqual value: '  ', scopes: ['text.html.basic', 'source.js.embedded.html']
      expect(lines[1][1]).toEqual value: 'var', scopes: ['text.html.basic', 'source.js.embedded.html', 'storage.type.var.js']

  describe "comments", ->
    it "tokenizes -- as an error", ->
      {tokens} = grammar.tokenizeLine '<!-- some comment --->'

      expect(tokens[0]).toEqual value: '<!--', scopes: ['text.html.basic', 'comment.block.html', 'punctuation.definition.comment.html']
      expect(tokens[1]).toEqual value: ' some comment -', scopes: ['text.html.basic', 'comment.block.html']
      expect(tokens[2]).toEqual value: '-->', scopes: ['text.html.basic', 'comment.block.html', 'punctuation.definition.comment.html']

      {tokens} = grammar.tokenizeLine '<!-- -- -->'

      expect(tokens[0]).toEqual value: '<!--', scopes: ['text.html.basic', 'comment.block.html', 'punctuation.definition.comment.html']
      expect(tokens[1]).toEqual value: ' ', scopes: ['text.html.basic', 'comment.block.html']
      expect(tokens[2]).toEqual value: '--', scopes: ['text.html.basic', 'comment.block.html', 'invalid.illegal.bad-comments-or-CDATA.html']
      expect(tokens[3]).toEqual value: ' ', scopes: ['text.html.basic', 'comment.block.html']
      expect(tokens[4]).toEqual value: '-->', scopes: ['text.html.basic', 'comment.block.html', 'punctuation.definition.comment.html']

  grammarTest path.join(__dirname, 'fixtures/syntax_test_html.html')
  grammarTest path.join(__dirname, 'fixtures/syntax_test_html_template_fragments.html')

  describe "attributes", ->
     it "recognizes attributes", ->
        lines = grammar.tokenizeLines '<span\nclass="foo">'
        expect(lines[1][0]).toEqual value: 'class', scopes: ["text.html.basic", "meta.tag.inline.any.html", "entity.other.attribute-name.html"]

  describe "entities", ->
    it "tokenizes & and characters after it", ->
      {tokens} = grammar.tokenizeLine '& &amp; &a'

      expect(tokens[0]).toEqual value: '&', scopes: ['text.html.basic', 'invalid.illegal.bad-ampersand.html']
      expect(tokens[3]).toEqual value: 'amp', scopes: ['text.html.basic', 'constant.character.entity.html', 'entity.name.entity.other.html']
      expect(tokens[4]).toEqual value: ';', scopes: ['text.html.basic', 'constant.character.entity.html', 'punctuation.definition.entity.end.html']
      expect(tokens[7]).toEqual value: 'a', scopes: ['text.html.basic']

  describe "firstLineMatch", ->
    it "recognises HTML5 doctypes", ->
      expect(grammar.firstLineRegex.scanner.findNextMatchSync("<!DOCTYPE html>")).not.toBeNull()
      expect(grammar.firstLineRegex.scanner.findNextMatchSync("<!doctype HTML>")).not.toBeNull()

    it "recognises Emacs modelines", ->
      valid = """
        #-*- HTML -*-
        #-*- mode: HTML -*-
        /* -*-html-*- */
        // -*- HTML -*-
        /* -*- mode:HTML -*- */
        // -*- font:bar;mode:HTML -*-
        // -*- font:bar;mode:HTML;foo:bar; -*-
        // -*-font:mode;mode:HTML-*-
        // -*- foo:bar mode: html bar:baz -*-
        " -*-foo:bar;mode:html;bar:foo-*- ";
        " -*-font-mode:foo;mode:html;foo-bar:quux-*-"
        "-*-font:x;foo:bar; mode : HTML; bar:foo;foooooo:baaaaar;fo:ba;-*-";
        "-*- font:x;foo : bar ; mode : HtML ; bar : foo ; foooooo:baaaaar;fo:ba-*-";
      """
      for line in valid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).not.toBeNull()

      invalid = """
        /* --*html-*- */
        /* -*-- HTML -*-
        /* -*- -- HTML -*-
        /* -*- HTM -;- -*-
        // -*- xHTML -*-
        // -*- HTML; -*-
        // -*- html-stuff -*-
        /* -*- model:html -*-
        /* -*- indent-mode:html -*-
        // -*- font:mode;html -*-
        // -*- HTimL -*-
        // -*- mode: -*- HTML
        // -*- mode: -html -*-
        // -*-font:mode;mode:html--*-
      """
      for line in invalid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).toBeNull()

    it "recognises Vim modelines", ->
      valid = """
        vim: se filetype=html:
        # vim: se ft=html:
        # vim: set ft=HTML:
        # vim: set filetype=XHTML:
        # vim: ft=XHTML
        # vim: syntax=HTML
        # vim: se syntax=xhtml:
        # ex: syntax=HTML
        # vim:ft=html
        # vim600: ft=xhtml
        # vim>600: set ft=html:
        # vi:noai:sw=3 ts=6 ft=html
        # vi::::::::::noai:::::::::::: ft=html
        # vim:ts=4:sts=4:sw=4:noexpandtab:ft=html
        # vi:: noai : : : : sw   =3 ts   =6 ft  =html
        # vim: ts=4: pi sts=4: ft=html: noexpandtab: sw=4:
        # vim: ts=4 sts=4: ft=html noexpandtab:
        # vim:noexpandtab sts=4 ft=html ts=4
        # vim:noexpandtab:ft=html
        # vim:ts=4:sts=4 ft=html:noexpandtab:\x20
        # vim:noexpandtab titlestring=hi\|there\\\\ ft=html ts=4
      """
      for line in valid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).not.toBeNull()

      invalid = """
        ex: se filetype=html:
        _vi: se filetype=HTML:
         vi: se filetype=HTML
        # vim set ft=html5
        # vim: soft=html
        # vim: clean-syntax=html:
        # vim set ft=html:
        # vim: setft=HTML:
        # vim: se ft=html backupdir=tmp
        # vim: set ft=HTML set cmdheight=1
        # vim:noexpandtab sts:4 ft:HTML ts:4
        # vim:noexpandtab titlestring=hi\\|there\\ ft=HTML ts=4
        # vim:noexpandtab titlestring=hi\\|there\\\\\\ ft=HTML ts=4
      """
      for line in invalid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).toBeNull()
