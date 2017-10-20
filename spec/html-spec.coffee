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
      {tokens} = grammar.tokenizeLine "<?php namespace Test;"

      expect(tokens[1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php']
      expect(tokens[2]).toEqual value: 'namespace', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'keyword.other.namespace.php']
      expect(tokens[3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php']
      expect(tokens[4]).toEqual value: 'Test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(tokens[5]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']
