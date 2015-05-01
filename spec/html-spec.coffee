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
    it 'tokenizes an empty file as outside-tag', ->
      lines = grammar.tokenizeLines ''
      expect(lines[0][0]).toEqual value: '', scopes: ['text.html.basic']

    it 'tokenizes a single < as outside-tag and does not freeze', ->
      lines = grammar.tokenizeLines '<'
      expect(lines[0][0]).toEqual value: '<', scopes: ['text.html.basic']

    it 'tokenizes <? without locking up', ->
      lines = grammar.tokenizeLines '<?'
      expect(lines[0][0]).toEqual value: '<?', scopes: ['text.html.basic']

    it 'tokenizes < after tags without locking up', ->
      lines = grammar.tokenizeLines '<span><'
      expect(lines[0][3]).toEqual value: '<', scopes: ['text.html.basic', 'meta.scope.outside-tag.html']

    it 'tokenizes >< as html without locking up', ->
      lines = grammar.tokenizeLines '><'
      expect(lines[0][0]).toEqual value: '><', scopes: ['text.html.basic', 'meta.scope.outside-tag.html']

    it 'tokenizes the single line content between the tags as outside-tag', ->
      lines = grammar.tokenizeLines '''
        <span class="" >  </span>
      '''
      expect(lines[0][7].scopes).not.toContain 'meta.scope.outside-tag.html'
      expect(lines[0][9].scopes).toContain 'meta.scope.outside-tag.html'

    it 'tokenizes the multiline content between the tags as outside-tag', ->
      lines = grammar.tokenizeLines '''
        <span class="" >
          test
        </span>
      '''
      expect(lines[1][0].scopes).toContain 'meta.scope.outside-tag.html'

  describe 'template script tags', ->
    it 'tokenizes the content inside the tag as HTML', ->
      lines = grammar.tokenizeLines '''
        <script id='id' type='text/template'>
          <div>test</div>
        </script>
      '''

      expect(lines[1][0]).toEqual value: '  ', scopes: ['text.html.basic', 'text.embedded.html', 'meta.scope.outside-tag.html']
      expect(lines[1][1]).toEqual value: '<', scopes: ['text.html.basic', 'text.embedded.html', 'meta.tag.block.any.html', 'punctuation.definition.tag.begin.html']

  describe 'CoffeeScript script tags', ->
    it 'tokenizes the content inside the tag as CoffeeScript', ->
      lines = grammar.tokenizeLines '''
        <script id='id' type='text/coffeescript'>
          -> console.log 'hi'
        </script>
      '''

      expect(lines[1][0]).toEqual value: '  ', scopes: ['text.html.basic', 'source.coffee.embedded.html']
      expect(lines[1][1]).toEqual value: '->', scopes: ['text.html.basic', 'source.coffee.embedded.html', 'storage.type.function.coffee']
