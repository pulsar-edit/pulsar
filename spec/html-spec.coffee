path = require 'path'
grammarTest = require 'atom-grammar-test'

describe 'HTML grammar', ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage('language-html')

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

  describe 'style tags', ->
    beforeEach ->
      waitsForPromise ->
        atom.packages.activatePackage('language-css')

    it 'tokenizes the tag attributes', ->
      lines = grammar.tokenizeLines '''
        <style id="id" class="very-classy">
        </style>
      '''

      expect(lines[0][0]).toEqual value: '<', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']
      expect(lines[0][1]).toEqual value: 'style', scopes: ['text.html.basic', 'meta.tag.style.html', 'entity.name.tag.style.html']
      expect(lines[0][3]).toEqual value: 'id', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.id.html', 'entity.other.attribute-name.id.html']
      expect(lines[0][4]).toEqual value: '=', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.id.html', 'punctuation.separator.key-value.html']
      expect(lines[0][5]).toEqual value: '"', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.id.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html']
      expect(lines[0][6]).toEqual value: 'id', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.id.html', 'string.quoted.double.html', 'meta.toc-list.id.html']
      expect(lines[0][7]).toEqual value: '"', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.id.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']
      expect(lines[0][9]).toEqual value: 'class', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.class.html', 'entity.other.attribute-name.class.html']
      expect(lines[0][10]).toEqual value: '=', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.html', 'punctuation.separator.key-value.html']
      expect(lines[0][11]).toEqual value: '"', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html']
      expect(lines[0][12]).toEqual value: 'very-classy', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.html', 'string.quoted.double.html']
      expect(lines[0][13]).toEqual value: '"', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']
      expect(lines[0][14]).toEqual value: '>', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']
      expect(lines[1][0]).toEqual value: '</', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']
      expect(lines[1][1]).toEqual value: 'style', scopes: ['text.html.basic', 'meta.tag.style.html', 'entity.name.tag.style.html']
      expect(lines[1][2]).toEqual value: '>', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']

    it 'tokenizes multiline tag attributes', ->
      lines = grammar.tokenizeLines '''
        <style id="id"
         class="very-classy"
        >
        </style>
      '''

      expect(lines[0][0]).toEqual value: '<', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']
      expect(lines[0][1]).toEqual value: 'style', scopes: ['text.html.basic', 'meta.tag.style.html', 'entity.name.tag.style.html']
      expect(lines[0][3]).toEqual value: 'id', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.id.html', 'entity.other.attribute-name.id.html']
      expect(lines[0][4]).toEqual value: '=', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.id.html', 'punctuation.separator.key-value.html']
      expect(lines[0][5]).toEqual value: '"', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.id.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html']
      expect(lines[0][6]).toEqual value: 'id', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.id.html', 'string.quoted.double.html', 'meta.toc-list.id.html']
      expect(lines[0][7]).toEqual value: '"', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.id.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']
      expect(lines[1][1]).toEqual value: 'class', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.class.html', 'entity.other.attribute-name.class.html']
      expect(lines[1][5]).toEqual value: '"', scopes: ['text.html.basic', 'meta.tag.style.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']
      expect(lines[2][0]).toEqual value: '>', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']
      expect(lines[3][0]).toEqual value: '</', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']
      expect(lines[3][1]).toEqual value: 'style', scopes: ['text.html.basic', 'meta.tag.style.html', 'entity.name.tag.style.html']
      expect(lines[3][2]).toEqual value: '>', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']

    it 'tokenizes the content inside the tag as CSS', ->
      lines = grammar.tokenizeLines '''
        <style class="very-classy">
          span { color: red; }
        </style>
      '''

      expect(lines[0][0]).toEqual value: '<', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']
      expect(lines[1][0]).toEqual value: '  ', scopes: ['text.html.basic', 'meta.tag.style.html', 'source.css.embedded.html']
      expect(lines[1][1]).toEqual value: 'span', scopes: ['text.html.basic', 'meta.tag.style.html', 'source.css.embedded.html', 'meta.selector.css', 'entity.name.tag.css']
      expect(lines[2][0]).toEqual value: '</', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']

    it 'tokenizes multiline tags', ->
      lines = grammar.tokenizeLines '''
        <style
         class="very-classy">
          span { color: red; }
        </style>
      '''

      expect(lines[0][0]).toEqual value: '<', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']
      expect(lines[2][1]).toEqual value: 'span', scopes: ['text.html.basic', 'meta.tag.style.html', 'source.css.embedded.html', 'meta.selector.css', 'entity.name.tag.css']
      expect(lines[3][0]).toEqual value: '</', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']

  describe 'script tags', ->
    it 'tokenizes the tag attributes', ->
      lines = grammar.tokenizeLines '''
        <script id="id" type="text/html">
        </script>
      '''

      expect(lines[0][0]).toEqual value: '<', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']
      expect(lines[0][1]).toEqual value: 'script', scopes: ['text.html.basic', 'meta.tag.script.html', 'entity.name.tag.script.html']
      expect(lines[0][3]).toEqual value: 'id', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.id.html', 'entity.other.attribute-name.id.html']
      expect(lines[0][4]).toEqual value: '=', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.id.html', 'punctuation.separator.key-value.html']
      expect(lines[0][5]).toEqual value: '"', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.id.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html']
      expect(lines[0][6]).toEqual value: 'id', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.id.html', 'string.quoted.double.html', 'meta.toc-list.id.html']
      expect(lines[0][7]).toEqual value: '"', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.id.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']
      expect(lines[0][9]).toEqual value: 'type', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.html', 'entity.other.attribute-name.html']
      expect(lines[0][10]).toEqual value: '=', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.html', 'punctuation.separator.key-value.html']
      expect(lines[0][11]).toEqual value: '"', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html']
      expect(lines[0][12]).toEqual value: 'text/html', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.html', 'string.quoted.double.html']
      expect(lines[0][13]).toEqual value: '"', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']
      expect(lines[0][14]).toEqual value: '>', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']
      expect(lines[1][0]).toEqual value: '</', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']
      expect(lines[1][1]).toEqual value: 'script', scopes: ['text.html.basic', 'meta.tag.script.html', 'entity.name.tag.script.html']
      expect(lines[1][2]).toEqual value: '>', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']

    it 'tokenizes multiline tag attributes', ->
      lines = grammar.tokenizeLines '''
        <script id="id" type="text/html"
         class="very-classy"
        >
        </script>
      '''

      expect(lines[0][0]).toEqual value: '<', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']
      expect(lines[0][1]).toEqual value: 'script', scopes: ['text.html.basic', 'meta.tag.script.html', 'entity.name.tag.script.html']
      expect(lines[0][3]).toEqual value: 'id', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.id.html', 'entity.other.attribute-name.id.html']
      expect(lines[0][4]).toEqual value: '=', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.id.html', 'punctuation.separator.key-value.html']
      expect(lines[0][5]).toEqual value: '"', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.id.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html']
      expect(lines[0][6]).toEqual value: 'id', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.id.html', 'string.quoted.double.html', 'meta.toc-list.id.html']
      expect(lines[0][7]).toEqual value: '"', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.id.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']
      expect(lines[0][9]).toEqual value: 'type', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.html', 'entity.other.attribute-name.html']
      expect(lines[0][10]).toEqual value: '=', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.html', 'punctuation.separator.key-value.html']
      expect(lines[0][11]).toEqual value: '"', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html']
      expect(lines[0][12]).toEqual value: 'text/html', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.html', 'string.quoted.double.html']
      expect(lines[0][13]).toEqual value: '"', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']
      expect(lines[1][1]).toEqual value: 'class', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.class.html', 'entity.other.attribute-name.class.html']
      expect(lines[1][5]).toEqual value: '"', scopes: ['text.html.basic', 'meta.tag.script.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']
      expect(lines[2][0]).toEqual value: '>', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']
      expect(lines[3][0]).toEqual value: '</', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']
      expect(lines[3][1]).toEqual value: 'script', scopes: ['text.html.basic', 'meta.tag.script.html', 'entity.name.tag.script.html']
      expect(lines[3][2]).toEqual value: '>', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']

  describe 'template script tags', ->
    it 'tokenizes the content inside the tag as HTML', ->
      lines = grammar.tokenizeLines '''
        <script id='id' type='text/template'>
          <div>test</div>
        </script>
      '''

      expect(lines[0][0]).toEqual value: '<', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']
      expect(lines[1][0]).toEqual value: '  ', scopes: ['text.html.basic', 'meta.tag.script.html', 'text.embedded.html']
      expect(lines[1][1]).toEqual value: '<', scopes: ['text.html.basic', 'meta.tag.script.html', 'text.embedded.html', 'meta.tag.block.div.html', 'punctuation.definition.tag.begin.html']
      expect(lines[2][0]).toEqual value: '</', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']

    it 'tokenizes multiline tags', ->
      lines = grammar.tokenizeLines '''
        <script id='id' type='text/template'
         class='very-classy'>
          <div>test</div>
        </script>
      '''

      expect(lines[0][0]).toEqual value: '<', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']
      expect(lines[2][1]).toEqual value: '<', scopes: ['text.html.basic', 'meta.tag.script.html', 'text.embedded.html', 'meta.tag.block.div.html', 'punctuation.definition.tag.begin.html']
      expect(lines[3][0]).toEqual value: '</', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']

  describe 'CoffeeScript script tags', ->
    beforeEach ->
      waitsForPromise ->
        atom.packages.activatePackage('language-coffee-script')

    it 'tokenizes the content inside the tag as CoffeeScript', ->
      lines = grammar.tokenizeLines '''
        <script id='id' type='text/coffeescript'>
          -> console.log 'hi'
        </script>
      '''

      expect(lines[0][0]).toEqual value: '<', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']
      expect(lines[1][0]).toEqual value: '  ', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.coffee.embedded.html']
      # TODO: Remove when Atom 1.21 reaches stable
      if parseFloat(atom.getVersion()) <= 1.20
        expect(lines[1][1]).toEqual value: '->', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.coffee.embedded.html', 'storage.type.function.coffee']
      else
        expect(lines[1][1]).toEqual value: '->', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.coffee.embedded.html', 'meta.function.inline.coffee', 'storage.type.function.coffee']
      expect(lines[2][0]).toEqual value: '</', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']

    it 'tokenizes multiline tags', ->
      lines = grammar.tokenizeLines '''
        <script id='id' type='text/coffeescript'
         class='very-classy'>
          -> console.log 'hi'
        </script>
      '''

      expect(lines[0][0]).toEqual value: '<', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']
      # TODO: Remove when Atom 1.21 reaches stable
      if parseFloat(atom.getVersion()) <= 1.20
        expect(lines[2][1]).toEqual value: '->', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.coffee.embedded.html', 'storage.type.function.coffee']
      else
        expect(lines[2][1]).toEqual value: '->', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.coffee.embedded.html', 'meta.function.inline.coffee', 'storage.type.function.coffee']
      expect(lines[3][0]).toEqual value: '</', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']

    it 'recognizes closing script tags in comments', ->
      lines = grammar.tokenizeLines '''
        <script id='id' type='text/coffeescript'>
          # comment </script>
      '''

      expect(lines[1][1]).toEqual value: '#', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.coffee.embedded.html', 'comment.line.number-sign.coffee', 'punctuation.definition.comment.coffee']
      expect(lines[1][2]).toEqual value: ' comment ', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.coffee.embedded.html', 'comment.line.number-sign.coffee']
      expect(lines[1][3]).toEqual value: '</', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']

      lines = grammar.tokenizeLines '''
        <script id='id' type='text/coffeescript'>
          ###
          comment </script>
      '''

      expect(lines[1][1]).toEqual value: '###', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.coffee.embedded.html', 'comment.block.coffee', 'punctuation.definition.comment.coffee']
      expect(lines[2][0]).toEqual value: '  comment ', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.coffee.embedded.html', 'comment.block.coffee']
      expect(lines[2][1]).toEqual value: '</', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']

  describe 'JavaScript script tags', ->
    beforeEach ->
      waitsForPromise -> atom.packages.activatePackage('language-javascript')

    it 'tokenizes the content inside the tag as JavaScript', ->
      lines = grammar.tokenizeLines '''
        <script id='id' type='text/javascript'>
          var hi = 'hi'
        </script>
      '''

      expect(lines[0][0]).toEqual value: '<', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']
      expect(lines[1][0]).toEqual value: '  ', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.js.embedded.html']
      expect(lines[1][1]).toEqual value: 'var', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.js.embedded.html', 'storage.type.var.js']
      expect(lines[2][0]).toEqual value: '</', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']

    it 'tokenizes multiline tags', ->
      lines = grammar.tokenizeLines '''
        <script id='id'
         class='very-classy'>
          var hi = 'hi'
        </script>
      '''

      expect(lines[0][0]).toEqual value: '<', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']
      expect(lines[2][1]).toEqual value: 'var', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.js.embedded.html', 'storage.type.var.js']
      expect(lines[3][0]).toEqual value: '</', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']

    it 'recognizes closing script tags in comments', ->
      lines = grammar.tokenizeLines '''
        <script id='id' type='text/javascript'>
          // comment </script>
      '''

      expect(lines[1][1]).toEqual value: '//', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.js.embedded.html', 'comment.line.double-slash.js', 'punctuation.definition.comment.js']
      expect(lines[1][2]).toEqual value: ' comment ', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.js.embedded.html', 'comment.line.double-slash.js']
      expect(lines[1][3]).toEqual value: '</', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']

      lines = grammar.tokenizeLines '''
        <script id='id' type='text/javascript'>
          /*
          comment </script>
      '''

      expect(lines[1][1]).toEqual value: '/*', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.js.embedded.html', 'comment.block.js', 'punctuation.definition.comment.begin.js']
      expect(lines[2][0]).toEqual value: '  comment ', scopes: ['text.html.basic', 'meta.tag.script.html', 'source.js.embedded.html', 'comment.block.js']
      expect(lines[2][1]).toEqual value: '</', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']

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
    it "recognizes a single attribute with a quoted value", ->
      {tokens} = grammar.tokenizeLine '<span class="foo">'

      expect(tokens[3]).toEqual value: 'class', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-with-value.class.html', 'entity.other.attribute-name.class.html']
      expect(tokens[4]).toEqual value: '=', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-with-value.html', 'punctuation.separator.key-value.html']
      expect(tokens[5]).toEqual value: '"', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'punctuation.definition.string.begin.html']
      expect(tokens[6]).toEqual value: 'foo', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-with-value.html', 'string.quoted.double.html']
      expect(tokens[7]).toEqual value: '"', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']
      expect(tokens[8]).toEqual value: '>', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'punctuation.definition.tag.end.html']

      {tokens} = grammar.tokenizeLine "<span class='foo'>"

      expect(tokens[3]).toEqual value: 'class', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-with-value.class.html', 'entity.other.attribute-name.class.html']
      expect(tokens[4]).toEqual value: '=', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-with-value.html', 'punctuation.separator.key-value.html']
      expect(tokens[5]).toEqual value: "'", scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-with-value.html', 'string.quoted.single.html', 'punctuation.definition.string.begin.html']
      expect(tokens[6]).toEqual value: 'foo', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-with-value.html', 'string.quoted.single.html']
      expect(tokens[7]).toEqual value: "'", scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-with-value.html', 'string.quoted.single.html', 'punctuation.definition.string.end.html']
      expect(tokens[8]).toEqual value: '>', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'punctuation.definition.tag.end.html']

    it "recognizes a single attribute with an unquoted value", ->
      {tokens} = grammar.tokenizeLine "<span class=foo-3+5@>"

      expect(tokens[3]).toEqual value: 'class', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-with-value.class.html', 'entity.other.attribute-name.class.html']
      expect(tokens[4]).toEqual value: '=', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-with-value.html', 'punctuation.separator.key-value.html']
      expect(tokens[5]).toEqual value: 'foo-3+5@', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-with-value.html', 'string.unquoted.html']
      expect(tokens[6]).toEqual value: '>', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'punctuation.definition.tag.end.html']

    it "recognizes a single attribute with no value", ->
      {tokens} = grammar.tokenizeLine "<span class>"

      expect(tokens[3]).toEqual value: 'class', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-without-value.class.html', 'entity.other.attribute-name.class.html']
      expect(tokens[4]).toEqual value: '>', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'punctuation.definition.tag.end.html']

    it "recognizes multiple attributes with varying values", ->
      {tokens} = grammar.tokenizeLine "<span class='btn' disabled spellcheck=true>"

      expect(tokens[3]).toEqual value: 'class', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-with-value.class.html', 'entity.other.attribute-name.class.html']
      expect(tokens[4]).toEqual value: '=', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-with-value.html', 'punctuation.separator.key-value.html']
      expect(tokens[5]).toEqual value: "'", scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-with-value.html', 'string.quoted.single.html', 'punctuation.definition.string.begin.html']
      expect(tokens[6]).toEqual value: 'btn', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-with-value.html', 'string.quoted.single.html']
      expect(tokens[7]).toEqual value: "'", scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-with-value.html', 'string.quoted.single.html', 'punctuation.definition.string.end.html']
      expect(tokens[8]).toEqual value: ' ', scopes: ['text.html.basic', 'meta.tag.inline.any.html']
      expect(tokens[9]).toEqual value: 'disabled', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-without-value.html', 'entity.other.attribute-name.html']
      expect(tokens[10]).toEqual value: ' ', scopes: ['text.html.basic', 'meta.tag.inline.any.html']
      expect(tokens[11]).toEqual value: 'spellcheck', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-with-value.html', 'entity.other.attribute-name.html']
      expect(tokens[12]).toEqual value: '=', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-with-value.html', 'punctuation.separator.key-value.html']
      expect(tokens[13]).toEqual value: 'true', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-with-value.html', 'string.unquoted.html']
      expect(tokens[14]).toEqual value: '>', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'punctuation.definition.tag.end.html']

    it "recognizes attributes that are not on the same line as the tag name", ->
      lines = grammar.tokenizeLines '''
        <span
         class="foo"
         disabled>
      '''

      expect(lines[1][1]).toEqual value: 'class', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-with-value.class.html', 'entity.other.attribute-name.class.html']
      expect(lines[1][2]).toEqual value: '=', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-with-value.html', 'punctuation.separator.key-value.html']
      expect(lines[1][5]).toEqual value: '"', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'punctuation.definition.string.end.html']
      expect(lines[2][1]).toEqual value: 'disabled', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'meta.attribute-without-value.html', 'entity.other.attribute-name.html']
      expect(lines[2][2]).toEqual value: '>', scopes: ['text.html.basic', 'meta.tag.inline.any.html', 'punctuation.definition.tag.end.html']

  describe "entities in text", ->
    it "tokenizes & and characters after it", ->
      {tokens} = grammar.tokenizeLine '& &amp; &a'

      expect(tokens[0]).toEqual value: '& ', scopes: ['text.html.basic']
      expect(tokens[1]).toEqual value: '&', scopes: ['text.html.basic', 'constant.character.entity.html', 'punctuation.definition.entity.begin.html']
      expect(tokens[2]).toEqual value: 'amp', scopes: ['text.html.basic', 'constant.character.entity.html', 'entity.name.entity.other.html']
      expect(tokens[3]).toEqual value: ';', scopes: ['text.html.basic', 'constant.character.entity.html', 'punctuation.definition.entity.end.html']
      expect(tokens[5]).toEqual value: '&', scopes: ['text.html.basic', 'constant.character.entity.html', 'punctuation.definition.entity.begin.html']
      expect(tokens[6]).toEqual value: 'a', scopes: ['text.html.basic', 'constant.character.entity.html', 'entity.name.entity.other.html']

      lines = grammar.tokenizeLines '&\n'
      expect(lines[0][0]).toEqual value: '&', scopes: ['text.html.basic']

    it "tokenizes hexadecimal and digit entities", ->
      {tokens} = grammar.tokenizeLine '&#x00022; &#X00022; &#34;'

      expect(tokens[0]).toEqual value: '&', scopes: ['text.html.basic', 'constant.character.entity.html', 'punctuation.definition.entity.begin.html']
      expect(tokens[1]).toEqual value: '#x00022', scopes: ['text.html.basic', 'constant.character.entity.html', 'entity.name.entity.other.html']
      expect(tokens[2]).toEqual value: ';', scopes: ['text.html.basic', 'constant.character.entity.html', 'punctuation.definition.entity.end.html']
      expect(tokens[4]).toEqual value: '&', scopes: ['text.html.basic', 'constant.character.entity.html', 'punctuation.definition.entity.begin.html']
      expect(tokens[5]).toEqual value: '#X00022', scopes: ['text.html.basic', 'constant.character.entity.html', 'entity.name.entity.other.html']
      expect(tokens[6]).toEqual value: ';', scopes: ['text.html.basic', 'constant.character.entity.html', 'punctuation.definition.entity.end.html']
      expect(tokens[8]).toEqual value: '&', scopes: ['text.html.basic', 'constant.character.entity.html', 'punctuation.definition.entity.begin.html']
      expect(tokens[9]).toEqual value: '#34', scopes: ['text.html.basic', 'constant.character.entity.html', 'entity.name.entity.other.html']
      expect(tokens[10]).toEqual value: ';', scopes: ['text.html.basic', 'constant.character.entity.html', 'punctuation.definition.entity.end.html']

    it "tokenizes invalid ampersands", ->
      {tokens} = grammar.tokenizeLine 'PSE&>'
      expect(tokens[0]).toEqual value: 'PSE', scopes: ['text.html.basic']
      expect(tokens[1]).toEqual value: '&', scopes: ['text.html.basic', 'invalid.illegal.bad-ampersand.html']
      expect(tokens[2]).toEqual value: '>', scopes: ['text.html.basic']

      {tokens} = grammar.tokenizeLine 'PSE&'
      expect(tokens[0]).toEqual value: 'PSE&', scopes: ['text.html.basic']

      {tokens} = grammar.tokenizeLine '&<'
      expect(tokens[0]).toEqual value: '&<', scopes: ['text.html.basic']

      {tokens} = grammar.tokenizeLine '& '
      expect(tokens[0]).toEqual value: '& ', scopes: ['text.html.basic']

      {tokens} = grammar.tokenizeLine '&'
      expect(tokens[0]).toEqual value: '&', scopes: ['text.html.basic']

      {tokens} = grammar.tokenizeLine '&&'
      expect(tokens[0]).toEqual value: '&&', scopes: ['text.html.basic']

  describe "entities in attributes", ->
    it "tokenizes entities", ->
      {tokens} = grammar.tokenizeLine '<a href="http://example.com?&amp;">'
      expect(tokens[7]).toEqual value: '&', scopes: ['text.html.basic', 'meta.tag.inline.a.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'constant.character.entity.html', 'punctuation.definition.entity.begin.html']
      expect(tokens[8]).toEqual value: 'amp', scopes: ['text.html.basic', 'meta.tag.inline.a.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'constant.character.entity.html', 'entity.name.entity.other.html']
      expect(tokens[9]).toEqual value: ';', scopes: ['text.html.basic', 'meta.tag.inline.a.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'constant.character.entity.html', 'punctuation.definition.entity.end.html']

    it "does not tokenize query parameters as entities", ->
      {tokens} = grammar.tokenizeLine '<a href="http://example.com?one=1&type=json&topic=css">'
      expect(tokens[6]).toEqual value: 'http://example.com?one=1&type=json&topic=css', scopes: ['text.html.basic', 'meta.tag.inline.a.html', 'meta.attribute-with-value.html', 'string.quoted.double.html']

    it "tokenizes invalid ampersands", ->
      # Note: in order to replicate the following tests' behaviors, make sure you have language-hyperlink disabled
      {tokens} = grammar.tokenizeLine '<a href="http://example.com?&">'
      expect(tokens[7]).toEqual value: '&', scopes: ['text.html.basic', 'meta.tag.inline.a.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'invalid.illegal.bad-ampersand.html']

      {tokens} = grammar.tokenizeLine '<a href="http://example.com?&=">'
      expect(tokens[7]).toEqual value: '&', scopes: ['text.html.basic', 'meta.tag.inline.a.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'invalid.illegal.bad-ampersand.html']

      {tokens} = grammar.tokenizeLine '<a href="http://example.com?& ">'
      expect(tokens[6]).toEqual value: 'http://example.com?& ', scopes: ['text.html.basic', 'meta.tag.inline.a.html', 'meta.attribute-with-value.html', 'string.quoted.double.html']

      lines = grammar.tokenizeLines '<a href="http://example.com?&\n">'
      expect(lines[0][6]).toEqual value: 'http://example.com?&', scopes: ['text.html.basic', 'meta.tag.inline.a.html', 'meta.attribute-with-value.html', 'string.quoted.double.html']

      {tokens} = grammar.tokenizeLine '<a href="http://example.com?&&">'
      expect(tokens[6]).toEqual value: 'http://example.com?&', scopes: ['text.html.basic', 'meta.tag.inline.a.html', 'meta.attribute-with-value.html', 'string.quoted.double.html']
      expect(tokens[7]).toEqual value: '&', scopes: ['text.html.basic', 'meta.tag.inline.a.html', 'meta.attribute-with-value.html', 'string.quoted.double.html', 'invalid.illegal.bad-ampersand.html']

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

  describe "tags", ->
    it "tokenizes style tags as such", ->
      lines = grammar.tokenizeLines '<style>'
      expect(lines[0][0]).toEqual value: '<', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']
      expect(lines[0][1]).toEqual value: 'style', scopes: ['text.html.basic', 'meta.tag.style.html', 'entity.name.tag.style.html']
      expect(lines[0][2]).toEqual value: '>', scopes: ['text.html.basic', 'meta.tag.style.html', 'punctuation.definition.tag.html']

    it "tokenizes script tags as such", ->
      lines = grammar.tokenizeLines '<script>'
      expect(lines[0][0]).toEqual value: '<', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']
      expect(lines[0][1]).toEqual value: 'script', scopes: ['text.html.basic', 'meta.tag.script.html', 'entity.name.tag.script.html']
      expect(lines[0][2]).toEqual value: '>', scopes: ['text.html.basic', 'meta.tag.script.html', 'punctuation.definition.tag.html']

    it "tokenizes structure tags as such", ->
      lines = grammar.tokenizeLines '<html>'
      expect(lines[0][0]).toEqual value: '<', scopes: ['text.html.basic', 'meta.tag.structure.html.html', 'punctuation.definition.tag.html']
      expect(lines[0][1]).toEqual value: 'html', scopes: ['text.html.basic', 'meta.tag.structure.html.html', 'entity.name.tag.structure.html.html']
      expect(lines[0][2]).toEqual value: '>', scopes: ['text.html.basic', 'meta.tag.structure.html.html', 'punctuation.definition.tag.html']

    it "tokenizes block tags as such", ->
      lines = grammar.tokenizeLines '<div>'
      expect(lines[0][0]).toEqual value: '<', scopes: ['text.html.basic', 'meta.tag.block.div.html', 'punctuation.definition.tag.begin.html']
      expect(lines[0][1]).toEqual value: 'div', scopes: ['text.html.basic', 'meta.tag.block.div.html', 'entity.name.tag.block.div.html']
      expect(lines[0][2]).toEqual value: '>', scopes: ['text.html.basic', 'meta.tag.block.div.html', 'punctuation.definition.tag.end.html']

    it "tokenizes inline tags as such", ->
      lines = grammar.tokenizeLines '<span>'
      expect(lines[0][0]).toEqual value: '<', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'punctuation.definition.tag.begin.html']
      expect(lines[0][1]).toEqual value: 'span', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'entity.name.tag.inline.span.html']
      expect(lines[0][2]).toEqual value: '>', scopes: ['text.html.basic', 'meta.tag.inline.span.html', 'punctuation.definition.tag.end.html']

    it "doesn't tokenize XML namespaces as tags if the prefix is a valid style tag", ->
      lines = grammar.tokenizeLines '<style:foo>'
      expect(lines[0][1].value).toNotEqual 'style'
      expect(lines[0][1].scopes).toEqual ['text.html.basic', 'meta.tag.other.html', 'entity.name.tag.other.html']

    it "doesn't tokenize XML namespaces as tags if the prefix is a valid script tag", ->
      lines = grammar.tokenizeLines '<script:foo>'
      expect(lines[0][1].value).toNotEqual 'script'
      expect(lines[0][1].scopes).toEqual ['text.html.basic', 'meta.tag.other.html', 'entity.name.tag.other.html']

    it "doesn't tokenize XML namespaces as tags if the prefix is a valid structure tag", ->
      lines = grammar.tokenizeLines '<html:foo>'
      expect(lines[0][1].value).toNotEqual 'html'
      expect(lines[0][1].scopes).toEqual ['text.html.basic', 'meta.tag.other.html', 'entity.name.tag.other.html']

    it "doesn't tokenize XML namespaces as tags if the prefix is a valid block tag", ->
      lines = grammar.tokenizeLines '<div:foo>'
      expect(lines[0][1].value).toNotEqual 'div'
      expect(lines[0][1].scopes).toEqual ['text.html.basic', 'meta.tag.other.html', 'entity.name.tag.other.html']

    it "doesn't tokenize XML namespaces as tags if the prefix is a valid inline tag", ->
      lines = grammar.tokenizeLines '<span:foo>'
      expect(lines[0][1].value).toNotEqual 'span'
      expect(lines[0][1].scopes).toEqual ['text.html.basic', 'meta.tag.other.html', 'entity.name.tag.other.html']

    it "it doesn't treat only the part before a hyphen as tag name if this part is a is a valid style tag", ->
      lines = grammar.tokenizeLines '<style-foo>'
      expect(lines[0][1].value).toNotEqual 'style'
      expect(lines[0][1].scopes).toEqual ['text.html.basic', 'meta.tag.other.html', 'entity.name.tag.other.html']

    it "it doesn't treat only the part before a hyphen as tag name if this part is a is a valid script tag", ->
      lines = grammar.tokenizeLines '<script-foo>'
      expect(lines[0][1].value).toNotEqual 'script'
      expect(lines[0][1].scopes).toEqual ['text.html.basic', 'meta.tag.other.html', 'entity.name.tag.other.html']

    it "it doesn't treat only the part before a hyphen as tag name if this part is a is a valid structure tag", ->
      lines = grammar.tokenizeLines '<html-foo>'
      expect(lines[0][1].value).toNotEqual 'html'
      expect(lines[0][1].scopes).toEqual ['text.html.basic', 'meta.tag.other.html', 'entity.name.tag.other.html']

    it "it doesn't treat only the part before a hyphen as tag name if this part is a is a valid block tag", ->
      lines = grammar.tokenizeLines '<div-foo>'
      expect(lines[0][1].value).toNotEqual 'div'
      expect(lines[0][1].scopes).toEqual ['text.html.basic', 'meta.tag.other.html', 'entity.name.tag.other.html']

    it "it doesn't treat only the part before a hyphen as tag name if this part is a is a valid inline tag", ->
      lines = grammar.tokenizeLines '<span-foo>'
      expect(lines[0][1].value).toNotEqual 'span'
      expect(lines[0][1].scopes).toEqual ['text.html.basic', 'meta.tag.other.html', 'entity.name.tag.other.html']

    it "tokenizes other tags as such", ->
      lines = grammar.tokenizeLines '<foo>'
      expect(lines[0][0]).toEqual value: '<', scopes: ['text.html.basic', 'meta.tag.other.html', 'punctuation.definition.tag.begin.html']
      expect(lines[0][1]).toEqual value: 'foo', scopes: ['text.html.basic', 'meta.tag.other.html', 'entity.name.tag.other.html']
      expect(lines[0][2]).toEqual value: '>', scopes: ['text.html.basic', 'meta.tag.other.html', 'punctuation.definition.tag.end.html']

    it "tolerates colons in other tag names", ->
      lines = grammar.tokenizeLines '<foo:bar>'
      expect(lines[0][1]).toEqual value: 'foo:bar', scopes: ['text.html.basic', 'meta.tag.other.html', 'entity.name.tag.other.html']

    it "tolerates hyphens in other tag names", ->
      lines = grammar.tokenizeLines '<foo-bar>'
      expect(lines[0][1]).toEqual value: 'foo-bar', scopes: ['text.html.basic', 'meta.tag.other.html', 'entity.name.tag.other.html']
