describe 'PHP grammar', ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage 'language-php'

    runs ->
      grammar = atom.grammars.grammarForScopeName 'text.html.php'
      @addMatchers
        toContainAll: (arr) ->
          arr.every (el) =>
            @actual.includes el

  it 'parses the grammar', ->
    expect(grammar).toBeTruthy()
    expect(grammar.scopeName).toBe 'text.html.php'

  describe 'operators', ->
    it 'should tokenize = correctly', ->
      tokens = grammar.tokenizeLines "<?php\n$test = 2;"

      expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
      expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][5]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.php']
      expect(tokens[1][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

    it 'should tokenize + correctly', ->
      tokens = grammar.tokenizeLines "<?php\n1 + 2;"

      expect(tokens[1][0]).toEqual value: '1', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][2]).toEqual value: '+', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.arithmetic.php']
      expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][4]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.php']
      expect(tokens[1][5]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

    it 'should tokenize - correctly', ->
      tokens = grammar.tokenizeLines "<?php\n1 - 2;"

      expect(tokens[1][0]).toEqual value: '1', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][2]).toEqual value: '-', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.arithmetic.php']
      expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][4]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.php']
      expect(tokens[1][5]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

    it 'should tokenize * correctly', ->
      tokens = grammar.tokenizeLines "<?php\n1 * 2;"

      expect(tokens[1][0]).toEqual value: '1', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][2]).toEqual value: '*', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.arithmetic.php']
      expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][4]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.php']
      expect(tokens[1][5]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

    it 'should tokenize / correctly', ->
      tokens = grammar.tokenizeLines "<?php\n1 / 2;"

      expect(tokens[1][0]).toEqual value: '1', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][2]).toEqual value: '/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.arithmetic.php']
      expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][4]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.php']
      expect(tokens[1][5]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

    it 'should tokenize % correctly', ->
      tokens = grammar.tokenizeLines "<?php\n1 % 2;"

      expect(tokens[1][0]).toEqual value: '1', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][2]).toEqual value: '%', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.arithmetic.php']
      expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][4]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.php']
      expect(tokens[1][5]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

    describe 'combined operators', ->
      it 'should tokenize === correctly', ->
        tokens = grammar.tokenizeLines "<?php\n$test === 2;"

        expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][1]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
        expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][3]).toEqual value: '===', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.comparison.php']
        expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][5]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.php']
        expect(tokens[1][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize += correctly', ->
        tokens = grammar.tokenizeLines "<?php\n$test += 2;"

        expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][1]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
        expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][3]).toEqual value: '+=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
        expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][5]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.php']
        expect(tokens[1][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize -= correctly', ->
        tokens = grammar.tokenizeLines "<?php\n$test -= 2;"

        expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][1]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
        expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][3]).toEqual value: '-=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
        expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][5]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.php']
        expect(tokens[1][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize *= correctly', ->
        tokens = grammar.tokenizeLines "<?php\n$test *= 2;"

        expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][1]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
        expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][3]).toEqual value: '*=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
        expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][5]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.php']
        expect(tokens[1][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize /= correctly', ->
        tokens = grammar.tokenizeLines "<?php\n$test /= 2;"

        expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][1]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
        expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][3]).toEqual value: '/=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
        expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][5]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.php']
        expect(tokens[1][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize %= correctly', ->
        tokens = grammar.tokenizeLines "<?php\n$test %= 2;"

        expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][1]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
        expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][3]).toEqual value: '%=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
        expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][5]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.php']
        expect(tokens[1][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize .= correctly', ->
        tokens = grammar.tokenizeLines "<?php\n$test .= 2;"

        expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][1]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
        expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][3]).toEqual value: '.=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.string.php']
        expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][5]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.php']
        expect(tokens[1][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize &= correctly', ->
        tokens = grammar.tokenizeLines "<?php\n$test &= 2;"

        expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][1]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
        expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][3]).toEqual value: '&=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
        expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][5]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.php']
        expect(tokens[1][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize |= correctly', ->
        tokens = grammar.tokenizeLines "<?php\n$test |= 2;"

        expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][1]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
        expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][3]).toEqual value: '|=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
        expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][5]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.php']
        expect(tokens[1][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize ^= correctly', ->
        tokens = grammar.tokenizeLines "<?php\n$test ^= 2;"

        expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][1]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
        expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][3]).toEqual value: '^=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
        expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][5]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.php']
        expect(tokens[1][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize <<= correctly', ->
        tokens = grammar.tokenizeLines "<?php\n$test <<= 2;"

        expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][1]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
        expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][3]).toEqual value: '<<=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
        expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][5]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.php']
        expect(tokens[1][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize >>= correctly', ->
        tokens = grammar.tokenizeLines "<?php\n$test >>= 2;"

        expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][1]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
        expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][3]).toEqual value: '>>=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
        expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][5]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.php']
        expect(tokens[1][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize $this', ->
    tokens = grammar.tokenizeLines "<?php $this"
    expect(tokens[0][2]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.language.this.php', 'punctuation.definition.variable.php']
    expect(tokens[0][3]).toEqual value: 'this', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.language.this.php']

    tokens = grammar.tokenizeLines "<?php $thistles"
    expect(tokens[0][2]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(tokens[0][3]).toEqual value: 'thistles', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']

  it 'should tokenize namespace at the same line as <?php', ->
    tokens = grammar.tokenizeLines "<?php namespace Test;"
    expect(tokens[0][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php']
    expect(tokens[0][2]).toEqual value: 'namespace', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'keyword.other.namespace.php']
    expect(tokens[0][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php']
    expect(tokens[0][4]).toEqual value: 'Test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
    expect(tokens[0][5]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize namespace correctly', ->
    tokens = grammar.tokenizeLines "<?php\nnamespace Test;"
    expect(tokens[1][0]).toEqual value: 'namespace', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'keyword.other.namespace.php']
    expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php']
    expect(tokens[1][2]).toEqual value: 'Test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
    expect(tokens[1][3]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize include on the same line as <?php', ->
    # https://github.com/atom/language-php/issues/154
    tokens = grammar.tokenizeLines "<?php include 'test'?>"
    expect(tokens[0][2]).toEqual value: 'include', scopes: ['text.html.php', 'meta.embedded.line.php', 'source.php', 'meta.include.php', 'keyword.control.import.include.php']
    expect(tokens[0][4]).toEqual value: "'", scopes: ['text.html.php', 'meta.embedded.line.php', 'source.php', 'meta.include.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
    expect(tokens[0][6]).toEqual value: "'", scopes: ['text.html.php', 'meta.embedded.line.php', 'source.php', 'meta.include.php', 'string.quoted.single.php', 'punctuation.definition.string.end.php']
    expect(tokens[0][7]).toEqual value: '?', scopes: ['text.html.php', 'meta.embedded.line.php', 'punctuation.section.embedded.end.php', 'source.php']
    expect(tokens[0][8]).toEqual value: '>', scopes: ['text.html.php', 'meta.embedded.line.php', 'punctuation.section.embedded.end.php']

  describe 'classes', ->
    it 'tokenizes class declarations', ->
      tokens = grammar.tokenizeLines "<?php\nclass Test { /* stuff */ }"

      expect(tokens[1][0]).toEqual value: 'class', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'storage.type.class.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php']
      expect(tokens[1][2]).toEqual value: 'Test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'entity.name.type.class.php']
      expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php']
      expect(tokens[1][4]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'punctuation.definition.class.begin.bracket.curly.php']
      expect(tokens[1][5]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php']
      expect(tokens[1][6]).toEqual value: '/*', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'comment.block.php', 'punctuation.definition.comment.php']
      expect(tokens[1][10]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'punctuation.definition.class.end.bracket.curly.php']

    it 'tokenizes class modifiers', ->
      tokens = grammar.tokenizeLines "<?php\nabstract class Test {}"

      expect(tokens[1][0]).toEqual value: 'abstract', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'storage.modifier.abstract.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php']
      expect(tokens[1][2]).toEqual value: 'class', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'storage.type.class.php']
      expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php']
      expect(tokens[1][4]).toEqual value: 'Test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'entity.name.type.class.php']

      tokens = grammar.tokenizeLines "<?php\nfinal class Test {}"

      expect(tokens[1][0]).toEqual value: 'final', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'storage.modifier.final.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php']
      expect(tokens[1][2]).toEqual value: 'class', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'storage.type.class.php']
      expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php']
      expect(tokens[1][4]).toEqual value: 'Test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'entity.name.type.class.php']

    describe "use statements", ->
      it 'tokenizes basic use statements', ->
        tokens = grammar.tokenizeLines """
          <?php
          class Test {
            use A;
          }
        """

        expect(tokens[2][1]).toEqual value: 'use', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'keyword.other.use.php']
        expect(tokens[2][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(tokens[2][3]).toEqual value: 'A', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.class.php']
        expect(tokens[2][4]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'punctuation.terminator.expression.php']

        tokens = grammar.tokenizeLines """
          <?php
          class Test {
            use A, B;
          }
        """

        expect(tokens[2][1]).toEqual value: 'use', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'keyword.other.use.php']
        expect(tokens[2][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(tokens[2][3]).toEqual value: 'A', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.class.php']
        expect(tokens[2][4]).toEqual value: ',', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'punctuation.separator.delimiter.php']
        expect(tokens[2][5]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(tokens[2][6]).toEqual value: 'B', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.class.php']
        expect(tokens[2][7]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'punctuation.terminator.expression.php']

      it 'tokenizes complex use statements', ->
        tokens = grammar.tokenizeLines """
          <?php
          class Test {
            use A, B {
              B::smallTalk insteadof A;
            }
          }
        """

        expect(tokens[2][1]).toEqual value: 'use', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'keyword.other.use.php']
        expect(tokens[2][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(tokens[2][3]).toEqual value: 'A', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.class.php']
        expect(tokens[2][4]).toEqual value: ',', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'punctuation.separator.delimiter.php']
        expect(tokens[2][5]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(tokens[2][6]).toEqual value: 'B', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.class.php']
        expect(tokens[2][7]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(tokens[2][8]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'punctuation.definition.use.begin.bracket.curly.php']
        expect(tokens[3][1]).toEqual value: 'B', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'meta.use.body.php', 'support.class.php']
        expect(tokens[3][2]).toEqual value: '::', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'meta.use.body.php', 'keyword.operator.class.php']
        expect(tokens[3][3]).toEqual value: 'smallTalk', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'meta.use.body.php', 'constant.other.class.php']
        expect(tokens[3][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'meta.use.body.php']
        expect(tokens[3][5]).toEqual value: 'insteadof', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'meta.use.body.php', 'keyword.other.use-insteadof.php']
        expect(tokens[3][6]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'meta.use.body.php']
        expect(tokens[3][7]).toEqual value: 'A', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'meta.use.body.php', 'support.class.php']
        expect(tokens[3][8]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'meta.use.body.php', 'punctuation.terminator.expression.php']
        expect(tokens[4][1]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'punctuation.definition.use.end.bracket.curly.php']

      it 'tokenizes aliases', ->
        tokens = grammar.tokenizeLines """
          <?php
          class Aliased_Talker {
              use A, B {
                  B::smallTalk as private talk;
              }
          }
        """

        expect(tokens[3][1]).toEqual value: 'B', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'meta.use.body.php', 'support.class.php']
        expect(tokens[3][2]).toEqual value: '::', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'meta.use.body.php', 'keyword.operator.class.php']
        expect(tokens[3][3]).toEqual value: 'smallTalk', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'meta.use.body.php', 'constant.other.class.php']
        expect(tokens[3][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'meta.use.body.php']
        expect(tokens[3][5]).toEqual value: 'as', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'meta.use.body.php', 'keyword.other.use-as.php']
        expect(tokens[3][6]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'meta.use.body.php']
        expect(tokens[3][7]).toEqual value: 'private', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'meta.use.body.php', 'storage.modifier.php']
        expect(tokens[3][8]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'meta.use.body.php']
        expect(tokens[3][9]).toEqual value: 'talk', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'meta.use.body.php', 'entity.other.alias.php']
        expect(tokens[3][10]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'meta.use.body.php', 'punctuation.terminator.expression.php']
        expect(tokens[4][1]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'punctuation.definition.use.end.bracket.curly.php']

      it 'tokenizes aliases', ->
        tokens = grammar.tokenizeLines """
          <?php
          class Aliased_Talker {
              use A, B {
                  B::smallTalk as talk;
              }
          }
        """

        expect(tokens[3][1]).toEqual value: 'B', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'meta.use.body.php', 'support.class.php']
        expect(tokens[3][2]).toEqual value: '::', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'meta.use.body.php', 'keyword.operator.class.php']
        expect(tokens[3][3]).toEqual value: 'smallTalk', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'meta.use.body.php', 'constant.other.class.php']
        expect(tokens[3][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'meta.use.body.php']
        expect(tokens[3][5]).toEqual value: 'as', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'meta.use.body.php', 'keyword.other.use-as.php']
        expect(tokens[3][6]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'meta.use.body.php']
        expect(tokens[3][7]).toEqual value: 'talk', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'meta.use.body.php', 'entity.other.alias.php']
        expect(tokens[3][8]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'meta.use.body.php', 'punctuation.terminator.expression.php']
        expect(tokens[4][1]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'punctuation.definition.use.end.bracket.curly.php']

  describe 'functions', ->
    it 'tokenizes functions with no arguments', ->
      tokens = grammar.tokenizeLines "<?php\nfunction test() {}"

      expect(tokens[1][0]).toEqual value: 'function', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'storage.type.function.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php']
      expect(tokens[1][2]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'entity.name.function.php']
      expect(tokens[1][3]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.begin.bracket.round.php']
      expect(tokens[1][4]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.end.bracket.round.php']

      # Should NOT be tokenized as an actual function
      tokens = grammar.tokenizeLines "<?php\nfunction_test() {}"

      expect(tokens[1][0]).toEqual value: 'function_test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'entity.name.function.php']

    it 'tokenizes default array type with old array value', ->
      tokens = grammar.tokenizeLines "<?php\nfunction array_test(array $value = array()) {}"

      expect(tokens[1][0]).toEqual value: 'function', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'storage.type.function.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php']
      expect(tokens[1][2]).toEqual value: 'array_test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'entity.name.function.php']
      expect(tokens[1][3]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.begin.bracket.round.php']
      expect(tokens[1][4]).toEqual value: 'array', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'storage.type.php']
      expect(tokens[1][5]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php']
      expect(tokens[1][6]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[1][7]).toEqual value: 'value', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'variable.other.php']
      expect(tokens[1][8]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php']
      expect(tokens[1][9]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'keyword.operator.assignment.php']
      expect(tokens[1][10]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php']
      expect(tokens[1][11]).toEqual value: 'array', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'support.function.construct.php']
      expect(tokens[1][12]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'punctuation.definition.array.begin.bracket.round.php']
      expect(tokens[1][13]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'punctuation.definition.array.end.bracket.round.php']
      expect(tokens[1][14]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.end.bracket.round.php']
      expect(tokens[1][15]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][16]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.begin.php']
      expect(tokens[1][17]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.end.php']

    it 'tokenizes variadic arguments', ->
      tokens = grammar.tokenizeLines "<?php\nfunction test(...$value) {}"

      expect(tokens[1][4]).toEqual value: '...', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.no-default.php', 'variable.other.php', 'keyword.operator.variadic.php']
      expect(tokens[1][5]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.no-default.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[1][6]).toEqual value: 'value', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.no-default.php', 'variable.other.php']

    it 'tokenizes variadic arguments and typehinted class name', ->
      tokens = grammar.tokenizeLines "<?php\nfunction test(class_name ...$value) {}"

      expect(tokens[1][4]).toEqual value: 'class_name', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'storage.type.php']
      expect(tokens[1][6]).toEqual value: '...', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'variable.other.php', 'keyword.operator.variadic.php']
      expect(tokens[1][7]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[1][8]).toEqual value: 'value', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'variable.other.php']

    it 'tokenizes namespaced and typehinted class names', ->
      tokens = grammar.tokenizeLines "<?php\nfunction test(\\class_name $value) {}"

      expect(tokens[1][4]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][5]).toEqual value: 'class_name', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'storage.type.php']
      expect(tokens[1][7]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'variable.other.php', 'punctuation.definition.variable.php']

      tokens = grammar.tokenizeLines "<?php\nfunction test(a\\class_name $value) {}"

      expect(tokens[1][4]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'support.other.namespace.php', 'storage.type.php']
      expect(tokens[1][5]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][6]).toEqual value: 'class_name', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'storage.type.php']
      expect(tokens[1][8]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'variable.other.php', 'punctuation.definition.variable.php']

      tokens = grammar.tokenizeLines "<?php\nfunction test(a\\b\\class_name $value) {}"

      expect(tokens[1][4]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'support.other.namespace.php', 'storage.type.php']
      expect(tokens[1][5]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][6]).toEqual value: 'b', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'support.other.namespace.php', 'storage.type.php']
      expect(tokens[1][7]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][8]).toEqual value: 'class_name', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'storage.type.php']
      expect(tokens[1][10]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'variable.other.php', 'punctuation.definition.variable.php']

      tokens = grammar.tokenizeLines "<?php\nfunction test(\\a\\b\\class_name $value) {}"

      expect(tokens[1][4]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][5]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'support.other.namespace.php', 'storage.type.php']
      expect(tokens[1][6]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][7]).toEqual value: 'b', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'support.other.namespace.php', 'storage.type.php']
      expect(tokens[1][8]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][9]).toEqual value: 'class_name', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'storage.type.php']
      expect(tokens[1][11]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'variable.other.php', 'punctuation.definition.variable.php']

    it 'tokenizes default array type with short array value', ->
      tokens = grammar.tokenizeLines "<?php\nfunction array_test(array $value = []) {}"

      expect(tokens[1][0]).toEqual value: 'function', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'storage.type.function.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php']
      expect(tokens[1][2]).toEqual value: 'array_test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'entity.name.function.php']
      expect(tokens[1][3]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.begin.bracket.round.php']
      expect(tokens[1][4]).toEqual value: 'array', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'storage.type.php']
      expect(tokens[1][5]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php']
      expect(tokens[1][6]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[1][7]).toEqual value: 'value', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'variable.other.php']
      expect(tokens[1][8]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php']
      expect(tokens[1][9]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'keyword.operator.assignment.php']
      expect(tokens[1][10]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php']
      expect(tokens[1][11]).toEqual value: '[', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'punctuation.section.array.begin.php']
      expect(tokens[1][12]).toEqual value: ']', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'punctuation.section.array.end.php']
      expect(tokens[1][13]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.end.bracket.round.php']
      expect(tokens[1][14]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][15]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.begin.php']
      expect(tokens[1][16]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.end.php']

    it 'tokenizes a non-empty array', ->
      tokens = grammar.tokenizeLines "<?php\nfunction not_empty_array_test(array $value = [1,2,'3']) {}"

      expect(tokens[1][11]).toEqual value: '[', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'punctuation.section.array.begin.php']
      expect(tokens[1][12]).toEqual value: '1', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'constant.numeric.php']
      expect(tokens[1][13]).toEqual value: ',', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php']
      expect(tokens[1][14]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'constant.numeric.php']
      expect(tokens[1][15]).toEqual value: ',', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php']
      expect(tokens[1][16]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
      expect(tokens[1][17]).toEqual value: '3', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'string.quoted.single.php']
      expect(tokens[1][18]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'string.quoted.single.php', 'punctuation.definition.string.end.php']
      expect(tokens[1][19]).toEqual value: ']', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'punctuation.section.array.end.php']

    it 'tokenizes default value with non-lowercase array type hinting', ->
      tokens = grammar.tokenizeLines "<?php\nfunction array_test(Array $value = []) {}"

      expect(tokens[1][0]).toEqual value: 'function', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'storage.type.function.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php']
      expect(tokens[1][2]).toEqual value: 'array_test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'entity.name.function.php']
      expect(tokens[1][3]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.begin.bracket.round.php']
      expect(tokens[1][4]).toEqual value: 'Array', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'storage.type.php']
      expect(tokens[1][5]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php']
      expect(tokens[1][6]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[1][7]).toEqual value: 'value', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'variable.other.php']
      expect(tokens[1][8]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php']
      expect(tokens[1][9]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'keyword.operator.assignment.php']
      expect(tokens[1][10]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php']
      expect(tokens[1][11]).toEqual value: '[', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'punctuation.section.array.begin.php']
      expect(tokens[1][12]).toEqual value: ']', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'punctuation.section.array.end.php']
      expect(tokens[1][13]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.end.bracket.round.php']
      expect(tokens[1][14]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][15]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.begin.php']
      expect(tokens[1][16]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.end.php']

    it 'tokenizes multiple typehinted arguments with default values', ->
      tokens = grammar.tokenizeLines "<?php\nfunction test(string $subject = 'no subject', string $body = null) {}"

      expect(tokens[1][0]).toEqual value: 'function', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'storage.type.function.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php']
      expect(tokens[1][2]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'entity.name.function.php']
      expect(tokens[1][3]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.begin.bracket.round.php']
      expect(tokens[1][4]).toEqual value: 'string', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'storage.type.php']
      expect(tokens[1][6]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[1][7]).toEqual value: 'subject', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'variable.other.php']
      expect(tokens[1][8]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php']
      expect(tokens[1][9]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'keyword.operator.assignment.php']
      expect(tokens[1][10]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php']
      expect(tokens[1][11]).toEqual value: "'", scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
      expect(tokens[1][12]).toEqual value: 'no subject', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'string.quoted.single.php']
      expect(tokens[1][13]).toEqual value: "'", scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'string.quoted.single.php', 'punctuation.definition.string.end.php']
      expect(tokens[1][14]).toEqual value: ',', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'punctuation.separator.delimiter.php']
      expect(tokens[1][15]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php']
      expect(tokens[1][16]).toEqual value: 'string', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'storage.type.php']
      expect(tokens[1][18]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[1][19]).toEqual value: 'body', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'variable.other.php']
      expect(tokens[1][21]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'keyword.operator.assignment.php']
      expect(tokens[1][22]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php']
      expect(tokens[1][23]).toEqual value: 'null', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'constant.language.php']
      expect(tokens[1][24]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.end.bracket.round.php']

    it 'tokenizes return values', ->
      tokens = grammar.tokenizeLines "<?php\nfunction test() : Client {}"

      expect(tokens[1][0]).toEqual value: 'function', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'storage.type.function.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php']
      expect(tokens[1][2]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'entity.name.function.php']
      expect(tokens[1][3]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.begin.bracket.round.php']
      expect(tokens[1][4]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.end.bracket.round.php']
      expect(tokens[1][5]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php']
      expect(tokens[1][6]).toEqual value: ':', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'keyword.operator.return-value.php']
      expect(tokens[1][7]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php']
      expect(tokens[1][8]).toEqual value: 'Client', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'storage.type.php']
      expect(tokens[1][9]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']

    it 'tokenizes function names with characters other than letters or numbers', ->
      # The space between foo and bar is a nbsp (char 160/hex 0xA0), not an actual space (char 32/hex 0x20)
      # 0xA0 is between 0x7F and 0xFF, making it a valid PHP identifier
      tokens = grammar.tokenizeLines "<?php\nfunction foo bar() {}"

      expect(tokens[1][0]).toEqual value: 'function', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'storage.type.function.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php']
      expect(tokens[1][2]).toEqual value: 'foo bar', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'entity.name.function.php']
      expect(tokens[1][3]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.begin.bracket.round.php']
      expect(tokens[1][4]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.end.bracket.round.php']
      expect(tokens[1][5]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][6]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.begin.php']
      expect(tokens[1][7]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.end.php']

  describe 'function calls', ->
    # TODO: Still needs coverage of namespaced function calls

    it 'tokenizes function calls with no arguments', ->
      tokens = grammar.tokenizeLines "<?php\ninverse()"

      expect(tokens[1][0]).toEqual value: 'inverse', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'entity.name.function.php']
      expect(tokens[1][1]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[1][2]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'punctuation.definition.arguments.end.bracket.round.php']

      tokens = grammar.tokenizeLines "<?php\ninverse ()"

      expect(tokens[1][0]).toEqual value: 'inverse', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'entity.name.function.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php']
      expect(tokens[1][2]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[1][3]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'punctuation.definition.arguments.end.bracket.round.php']

    it 'tokenizes function calls with arguments', ->
      tokens = grammar.tokenizeLines "<?php\ninverse(5, 'b')"

      expect(tokens[1][0]).toEqual value: 'inverse', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'entity.name.function.php']
      expect(tokens[1][1]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[1][2]).toEqual value: '5', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'constant.numeric.php']
      expect(tokens[1][3]).toEqual value: ',', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'punctuation.separator.delimiter.php']
      expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php']
      expect(tokens[1][5]).toEqual value: "'", scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
      expect(tokens[1][6]).toEqual value: 'b', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'string.quoted.single.php']
      expect(tokens[1][7]).toEqual value: "'", scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'string.quoted.single.php', 'punctuation.definition.string.end.php']
      expect(tokens[1][8]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'punctuation.definition.arguments.end.bracket.round.php']

      tokens = grammar.tokenizeLines "<?php\ninverse (5, 'b')"

      expect(tokens[1][0]).toEqual value: 'inverse', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'entity.name.function.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php']
      expect(tokens[1][2]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[1][3]).toEqual value: '5', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'constant.numeric.php']
      expect(tokens[1][4]).toEqual value: ',', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'punctuation.separator.delimiter.php']
      expect(tokens[1][5]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php']
      expect(tokens[1][6]).toEqual value: "'", scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
      expect(tokens[1][7]).toEqual value: 'b', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'string.quoted.single.php']
      expect(tokens[1][8]).toEqual value: "'", scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'string.quoted.single.php', 'punctuation.definition.string.end.php']
      expect(tokens[1][9]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'punctuation.definition.arguments.end.bracket.round.php']

    it 'tokenizes builtin function calls', ->
      tokens = grammar.tokenizeLines "<?php\necho('Hi!')"

      expect(tokens[1][0]).toEqual value: 'echo', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'support.function.construct.output.php']
      expect(tokens[1][1]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[1][2]).toEqual value: "'", scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
      expect(tokens[1][3]).toEqual value: 'Hi!', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'string.quoted.single.php']
      expect(tokens[1][4]).toEqual value: "'", scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'string.quoted.single.php', 'punctuation.definition.string.end.php']
      expect(tokens[1][5]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'punctuation.definition.arguments.end.bracket.round.php']

      tokens = grammar.tokenizeLines "<?php\necho ('Hi!')"

      expect(tokens[1][0]).toEqual value: 'echo', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'support.function.construct.output.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php']
      expect(tokens[1][2]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[1][3]).toEqual value: "'", scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
      expect(tokens[1][4]).toEqual value: 'Hi!', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'string.quoted.single.php']
      expect(tokens[1][5]).toEqual value: "'", scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'string.quoted.single.php', 'punctuation.definition.string.end.php']
      expect(tokens[1][6]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'punctuation.definition.arguments.end.bracket.round.php']

  describe 'method calls', ->
    it 'tokenizes method calls with no arguments', ->
      tokens = grammar.tokenizeLines "<?php\nobj->method()"

      expect(tokens[1][2]).toEqual value: 'method', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php', 'entity.name.function.php']
      expect(tokens[1][3]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[1][4]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php', 'punctuation.definition.arguments.end.bracket.round.php']

      tokens = grammar.tokenizeLines "<?php\nobj->method ()"

      expect(tokens[1][2]).toEqual value: 'method', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php', 'entity.name.function.php']
      expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php']
      expect(tokens[1][4]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[1][5]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php', 'punctuation.definition.arguments.end.bracket.round.php']

    it 'tokenizes method calls with arguments', ->
      tokens = grammar.tokenizeLines "<?php\nobj->method(5, 'b')"

      expect(tokens[1][2]).toEqual value: 'method', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php', 'entity.name.function.php']
      expect(tokens[1][3]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[1][4]).toEqual value: '5', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php', 'constant.numeric.php']
      expect(tokens[1][5]).toEqual value: ',', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php', 'punctuation.separator.delimiter.php']
      expect(tokens[1][6]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php']
      expect(tokens[1][7]).toEqual value: "'", scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
      expect(tokens[1][8]).toEqual value: 'b', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php', 'string.quoted.single.php']
      expect(tokens[1][9]).toEqual value: "'", scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php', 'string.quoted.single.php', 'punctuation.definition.string.end.php']
      expect(tokens[1][10]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php', 'punctuation.definition.arguments.end.bracket.round.php']

      tokens = grammar.tokenizeLines "<?php\nobj->method (5, 'b')"

      expect(tokens[1][2]).toEqual value: 'method', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php', 'entity.name.function.php']
      expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php']
      expect(tokens[1][4]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[1][5]).toEqual value: '5', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php', 'constant.numeric.php']
      expect(tokens[1][6]).toEqual value: ',', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php', 'punctuation.separator.delimiter.php']
      expect(tokens[1][7]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php']
      expect(tokens[1][8]).toEqual value: "'", scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
      expect(tokens[1][9]).toEqual value: 'b', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php', 'string.quoted.single.php']
      expect(tokens[1][10]).toEqual value: "'", scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php', 'string.quoted.single.php', 'punctuation.definition.string.end.php']
      expect(tokens[1][11]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php', 'punctuation.definition.arguments.end.bracket.round.php']

  describe 'the scope resolution operator', ->
    it 'tokenizes static method calls with no arguments', ->
      tokens = grammar.tokenizeLines "<?php\nobj::method()"

      expect(tokens[1][0]).toEqual value: 'obj', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'support.class.php']
      expect(tokens[1][1]).toEqual value: '::', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'keyword.operator.class.php']
      expect(tokens[1][2]).toEqual value: 'method', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'entity.name.function.php']
      expect(tokens[1][3]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[1][4]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'punctuation.definition.arguments.end.bracket.round.php']

      tokens = grammar.tokenizeLines "<?php\nobj :: method ()"

      expect(tokens[1][0]).toEqual value: 'obj', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'support.class.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][2]).toEqual value: '::', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'keyword.operator.class.php']
      expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php']
      expect(tokens[1][4]).toEqual value: 'method', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'entity.name.function.php']
      expect(tokens[1][5]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php']
      expect(tokens[1][6]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[1][7]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'punctuation.definition.arguments.end.bracket.round.php']

    it 'tokenizes static method calls with arguments', ->
      tokens = grammar.tokenizeLines "<?php\nobj::method(5, 'b')"

      expect(tokens[1][0]).toEqual value: 'obj', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'support.class.php']
      expect(tokens[1][1]).toEqual value: '::', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'keyword.operator.class.php']
      expect(tokens[1][2]).toEqual value: 'method', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'entity.name.function.php']
      expect(tokens[1][3]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[1][4]).toEqual value: '5', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'constant.numeric.php']
      expect(tokens[1][5]).toEqual value: ',', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'punctuation.separator.delimiter.php']
      expect(tokens[1][6]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php']
      expect(tokens[1][7]).toEqual value: "'", scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
      expect(tokens[1][8]).toEqual value: 'b', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'string.quoted.single.php']
      expect(tokens[1][9]).toEqual value: "'", scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'string.quoted.single.php', 'punctuation.definition.string.end.php']
      expect(tokens[1][10]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'punctuation.definition.arguments.end.bracket.round.php']

      tokens = grammar.tokenizeLines "<?php\nobj :: method (5, 'b')"

      expect(tokens[1][0]).toEqual value: 'obj', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'support.class.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][2]).toEqual value: '::', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'keyword.operator.class.php']
      expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php']
      expect(tokens[1][4]).toEqual value: 'method', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'entity.name.function.php']
      expect(tokens[1][5]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php']
      expect(tokens[1][6]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[1][7]).toEqual value: '5', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'constant.numeric.php']
      expect(tokens[1][8]).toEqual value: ',', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'punctuation.separator.delimiter.php']
      expect(tokens[1][9]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php']
      expect(tokens[1][10]).toEqual value: "'", scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
      expect(tokens[1][11]).toEqual value: 'b', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'string.quoted.single.php']
      expect(tokens[1][12]).toEqual value: "'", scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'string.quoted.single.php', 'punctuation.definition.string.end.php']
      expect(tokens[1][13]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'punctuation.definition.arguments.end.bracket.round.php']

    it 'tokenizes class variables', ->
      tokens = grammar.tokenizeLines "<?php\nobj::$variable"

      expect(tokens[1][0]).toEqual value: 'obj', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'support.class.php']
      expect(tokens[1][1]).toEqual value: '::', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.class.php']
      expect(tokens[1][2]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.class.php', 'punctuation.definition.variable.php']
      expect(tokens[1][3]).toEqual value: 'variable', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.class.php']

      tokens = grammar.tokenizeLines "<?php\nobj :: $variable"

      expect(tokens[1][0]).toEqual value: 'obj', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'support.class.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][2]).toEqual value: '::', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.class.php']
      expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][4]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.class.php', 'punctuation.definition.variable.php']
      expect(tokens[1][5]).toEqual value: 'variable', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.class.php']

    it 'tokenizes class constants', ->
      tokens = grammar.tokenizeLines "<?php\nobj::constant"

      expect(tokens[1][0]).toEqual value: 'obj', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'support.class.php']
      expect(tokens[1][1]).toEqual value: '::', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.class.php']
      expect(tokens[1][2]).toEqual value: 'constant', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.other.class.php']

      tokens = grammar.tokenizeLines "<?php\nobj :: constant"

      expect(tokens[1][0]).toEqual value: 'obj', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'support.class.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][2]).toEqual value: '::', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.class.php']
      expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][4]).toEqual value: 'constant', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.other.class.php']

    it 'tokenizes the special "class" keyword', ->
      tokens = grammar.tokenizeLines "<?php\nobj::class"

      expect(tokens[1][0]).toEqual value: 'obj', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'support.class.php']
      expect(tokens[1][1]).toEqual value: '::', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.class.php']
      expect(tokens[1][2]).toEqual value: 'class', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.other.class.php']

      tokens = grammar.tokenizeLines "<?php\nobj :: class"

      expect(tokens[1][0]).toEqual value: 'obj', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'support.class.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][2]).toEqual value: '::', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.class.php']
      expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][4]).toEqual value: 'class', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.other.class.php']

      # Should NOT be tokenized as `keyword.other.class`
      tokens = grammar.tokenizeLines "<?php\nobj::classic"

      expect(tokens[1][0]).toEqual value: 'obj', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'support.class.php']
      expect(tokens[1][1]).toEqual value: '::', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.class.php']
      expect(tokens[1][2]).toEqual value: 'classic', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.other.class.php']

  describe 'try/catch', ->
    it 'tokenizes a basic try/catch block', ->
      tokens = grammar.tokenizeLines "<?php\ntry {} catch(Exception $e) {}"

      expect(tokens[1][0]).toEqual value: 'try', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.control.exception.php']
      expect(tokens[1][2]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.begin.php']
      expect(tokens[1][3]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.end.php']
      expect(tokens[1][5]).toEqual value: 'catch', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'keyword.control.exception.catch.php']
      expect(tokens[1][6]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'punctuation.definition.parameters.begin.bracket.round.php']
      expect(tokens[1][7]).toEqual value: 'Exception', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'support.class.exception.php']
      expect(tokens[1][8]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php']
      expect(tokens[1][9]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[1][10]).toEqual value: 'e', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'variable.other.php']
      expect(tokens[1][11]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'punctuation.definition.parameters.end.bracket.round.php']
      expect(tokens[1][13]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.begin.php']
      expect(tokens[1][14]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.end.php']

      tokens = grammar.tokenizeLines "<?php\ntry {} catch (Exception $e) {}"

      expect(tokens[1][0]).toEqual value: 'try', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.control.exception.php']
      expect(tokens[1][2]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.begin.php']
      expect(tokens[1][3]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.end.php']
      expect(tokens[1][5]).toEqual value: 'catch', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'keyword.control.exception.catch.php']
      expect(tokens[1][6]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php']
      expect(tokens[1][7]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'punctuation.definition.parameters.begin.bracket.round.php']
      expect(tokens[1][8]).toEqual value: 'Exception', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'support.class.exception.php']
      expect(tokens[1][9]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php']
      expect(tokens[1][10]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[1][11]).toEqual value: 'e', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'variable.other.php']
      expect(tokens[1][12]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'punctuation.definition.parameters.end.bracket.round.php']
      expect(tokens[1][14]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.begin.php']
      expect(tokens[1][15]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.end.php']

    it 'tokenizes a catch block containing multiple exceptions', ->
      tokens = grammar.tokenizeLines "<?php\ntry {} catch(AException | BException | CException $e) {}"

      expect(tokens[1][5]).toEqual value: 'catch', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'keyword.control.exception.catch.php']
      expect(tokens[1][6]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'punctuation.definition.parameters.begin.bracket.round.php']
      expect(tokens[1][7]).toEqual value: 'AException', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'support.class.exception.php']
      expect(tokens[1][8]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php']
      expect(tokens[1][9]).toEqual value: '|', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'punctuation.separator.delimiter.php']
      expect(tokens[1][10]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php']
      expect(tokens[1][11]).toEqual value: 'BException', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'support.class.exception.php']
      expect(tokens[1][13]).toEqual value: '|', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'punctuation.separator.delimiter.php']
      expect(tokens[1][15]).toEqual value: 'CException', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'support.class.exception.php']
      expect(tokens[1][17]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[1][18]).toEqual value: 'e', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'variable.other.php']
      expect(tokens[1][19]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'punctuation.definition.parameters.end.bracket.round.php']
      expect(tokens[1][21]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.begin.php']
      expect(tokens[1][22]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.end.php']

  it 'should tokenize switch statements correctly', ->
    tokens = grammar.tokenizeLines """
      <?php
      switch($something)
      {
        case 'string':
          return 1;
        case 1:
          break;
        default:
          continue;
      }
    """

    expect(tokens[1][0]).toEqual value: 'switch', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php', 'keyword.control.switch.php']
    expect(tokens[1][1]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php', 'punctuation.definition.switch-expression.begin.bracket.round.php']
    expect(tokens[1][2]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(tokens[1][3]).toEqual value: 'something', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php', 'variable.other.php']
    expect(tokens[1][4]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php', 'punctuation.definition.switch-expression.end.bracket.round.php']
    expect(tokens[2][0]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php', 'punctuation.definition.section.switch-block.begin.bracket.curly.php']
    expect(tokens[3][1]).toEqual value: 'case', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php', 'keyword.control.case.php']
    expect(tokens[3][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php']
    expect(tokens[3][3]).toEqual value: "'", scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
    expect(tokens[3][6]).toEqual value: ':', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php', 'punctuation.terminator.statement.php']
    expect(tokens[4][1]).toEqual value: 'return', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php', 'keyword.control.php']
    expect(tokens[5][1]).toEqual value: 'case', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php', 'keyword.control.case.php']
    expect(tokens[5][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php']
    expect(tokens[5][3]).toEqual value: '1', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php', 'constant.numeric.php']
    expect(tokens[5][4]).toEqual value: ':', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php', 'punctuation.terminator.statement.php']
    expect(tokens[6][1]).toEqual value: 'break', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php', 'keyword.control.php']
    expect(tokens[7][1]).toEqual value: 'default', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php', 'keyword.control.default.php']
    expect(tokens[7][2]).toEqual value: ':', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php', 'punctuation.terminator.statement.php']
    expect(tokens[8][1]).toEqual value: 'continue', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php', 'keyword.control.php']
    expect(tokens[9][0]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php', 'punctuation.definition.section.switch-block.end.bracket.curly.php']

  it 'should tokenize storage types correctly', ->
    tokens = grammar.tokenizeLines "<?php\n(int)"

    expect(tokens[1][0]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.storage-type.begin.bracket.round.php']
    expect(tokens[1][1]).toEqual value: 'int', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'storage.type.php']
    expect(tokens[1][2]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.storage-type.end.bracket.round.php']

    tokens = grammar.tokenizeLines "<?php\n( int )"

    expect(tokens[1][0]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.storage-type.begin.bracket.round.php']
    expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][2]).toEqual value: 'int', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'storage.type.php']
    expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][4]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.storage-type.end.bracket.round.php']

  it 'should tokenize @api tag correctly', ->
    tokens = grammar.tokenizeLines "<?php\n/**\n*@api\n*/"

    expect(tokens[1][0]).toEqual value: '/**', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']
    expect(tokens[2][0]).toEqual value: '*', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']
    expect(tokens[2][1]).toEqual value: '@api', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
    expect(tokens[3][0]).toEqual value: '*/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']

  it 'should tokenize @method tag correctly', ->
    tokens = grammar.tokenizeLines "<?php\n/**\n*@method\n*/"

    expect(tokens[1][0]).toEqual value: '/**', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']
    expect(tokens[2][0]).toEqual value: '*', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']
    expect(tokens[2][1]).toEqual value: '@method', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
    expect(tokens[3][0]).toEqual value: '*/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']

  it 'should tokenize @property tag correctly', ->
    tokens = grammar.tokenizeLines "<?php\n/**\n*@property\n*/"

    expect(tokens[1][0]).toEqual value: '/**', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']
    expect(tokens[2][0]).toEqual value: '*', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']
    expect(tokens[2][1]).toEqual value: '@property', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
    expect(tokens[3][0]).toEqual value: '*/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']

  it 'should tokenize @property-read tag correctly', ->
    tokens = grammar.tokenizeLines "<?php\n/**\n*@property-read\n*/"

    expect(tokens[1][0]).toEqual value: '/**', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']
    expect(tokens[2][0]).toEqual value: '*', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']
    expect(tokens[2][1]).toEqual value: '@property-read', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
    expect(tokens[3][0]).toEqual value: '*/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']

  it 'should tokenize @property-write tag correctly', ->
    tokens = grammar.tokenizeLines "<?php\n/**\n*@property-write\n*/"

    expect(tokens[1][0]).toEqual value: '/**', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']
    expect(tokens[2][0]).toEqual value: '*', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']
    expect(tokens[2][1]).toEqual value: '@property-write', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
    expect(tokens[3][0]).toEqual value: '*/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']

  it 'should tokenize @source tag correctly', ->
    tokens = grammar.tokenizeLines "<?php\n/**\n*@source\n*/"

    expect(tokens[1][0]).toEqual value: '/**', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']
    expect(tokens[2][0]).toEqual value: '*', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']
    expect(tokens[2][1]).toEqual value: '@source', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
    expect(tokens[3][0]).toEqual value: '*/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']

  it 'should tokenize an inline phpdoc correctly', ->
    tokens = grammar.tokenizeLines "<?php\n/** @var */"

    expect(tokens[1][0]).toEqual value: '/**', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']
    expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']
    expect(tokens[1][2]).toEqual value: '@var', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
    expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']
    expect(tokens[1][4]).toEqual value: '*/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']

  it 'should not tokenize /*** as phpdoc', ->
    tokens = grammar.tokenizeLines "<?php\n/*** @var */"

    expect(tokens[1][0].scopes).not.toContain 'comment.block.documentation.phpdoc.php'

  it 'should tokenize malformed phpDocumentor DocBlock line that contains closing tag correctly', ->
    tokens = grammar.tokenizeLines "<?php\n/**\ninvalid*/$a=1;"

    expect(tokens[1][0]).toEqual value: '/**', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']
    expect(tokens[2][0]).toEqual value: 'invalid', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'invalid.illegal.missing-asterisk.phpdoc.php']
    expect(tokens[2][1]).toEqual value: '*/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']
    expect(tokens[2][2]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']

  it 'should tokenize \\e correctly', ->
    tokens = grammar.tokenizeLines "<?php\n\"test \\e test\";"

    expect(tokens[1][0]).toEqual value: '"', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php', 'punctuation.definition.string.begin.php']
    expect(tokens[1][1]).toEqual value: 'test ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php']
    expect(tokens[1][2]).toEqual value: '\\e', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php', 'constant.character.escape.php']
    expect(tokens[1][3]).toEqual value: ' test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php']
    expect(tokens[1][4]).toEqual value: '"', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php', 'punctuation.definition.string.end.php']
    expect(tokens[1][5]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize multiple inherited interfaces correctly', ->
    tokens = grammar.tokenizeLines "<?php\ninterface Superman extends Bird, Plane {}"

    expect(tokens[1][0]).toEqual value: 'interface', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.interface.php', 'storage.type.interface.php']
    expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.interface.php']
    expect(tokens[1][2]).toEqual value: 'Superman', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.interface.php', 'entity.name.type.interface.php']
    expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.interface.php']
    expect(tokens[1][4]).toEqual value: 'extends', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.interface.php', 'storage.modifier.extends.php']
    expect(tokens[1][5]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.interface.php']
    expect(tokens[1][6]).toEqual value: 'Bird', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.interface.php', 'entity.other.inherited-class.php']
    expect(tokens[1][7]).toEqual value: ',', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.interface.php', 'punctuation.separator.classes.php']
    expect(tokens[1][8]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.interface.php']
    expect(tokens[1][9]).toEqual value: 'Plane', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.interface.php', 'entity.other.inherited-class.php']
    expect(tokens[1][10]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.interface.php']
    expect(tokens[1][11]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.begin.php']
    expect(tokens[1][12]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.end.php']

  it 'should tokenize trait correctly', ->
    tokens = grammar.tokenizeLines "<?php\ntrait Test {}"

    expect(tokens[1][0]).toEqual value: 'trait', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.trait.php', 'storage.type.trait.php']
    expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.trait.php']
    expect(tokens[1][2]).toEqual value: 'Test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.trait.php', 'entity.name.type.trait.php']
    expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.trait.php']
    expect(tokens[1][4]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.begin.php']
    expect(tokens[1][5]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.end.php']

  it 'should tokenize use const correctly', ->
    tokens = grammar.tokenizeLines "<?php\nuse const Test\\Test\\CONSTANT;"

    expect(tokens[1][0]).toEqual value: 'use', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'keyword.other.use.php']
    expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php']
    expect(tokens[1][2]).toEqual value: 'const', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'storage.type.const.php']
    expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php']
    expect(tokens[1][4]).toEqual value: 'Test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.use.php']
    expect(tokens[1][5]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.use.php', 'punctuation.separator.inheritance.php']
    expect(tokens[1][6]).toEqual value: 'Test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.use.php']
    expect(tokens[1][7]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.use.php', 'punctuation.separator.inheritance.php']
    expect(tokens[1][8]).toEqual value: 'CONSTANT', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.use.php']
    expect(tokens[1][9]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize use function correctly', ->
    tokens = grammar.tokenizeLines "<?php\nuse function A\\B\\fun as func;"

    expect(tokens[1][0]).toEqual value: 'use', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'keyword.other.use.php']
    expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php']
    expect(tokens[1][2]).toEqual value: 'function', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'storage.type.function.php']
    expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php']
    expect(tokens[1][4]).toEqual value: 'A', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.use.php']
    expect(tokens[1][5]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.use.php', 'punctuation.separator.inheritance.php']
    expect(tokens[1][6]).toEqual value: 'B', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.use.php']
    expect(tokens[1][7]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.use.php', 'punctuation.separator.inheritance.php']
    expect(tokens[1][8]).toEqual value: 'fun', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.use.php']
    expect(tokens[1][9]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php']
    expect(tokens[1][10]).toEqual value: 'as', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'keyword.other.use-as.php']
    expect(tokens[1][11]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php']
    expect(tokens[1][12]).toEqual value: 'func', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.use-as.php']
    expect(tokens[1][13]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize yield correctly', ->
    tokens = grammar.tokenizeLines "<?php\nfunction test() { yield $a; }"

    expect(tokens[1][0]).toEqual value: 'function', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'storage.type.function.php']
    expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php']
    expect(tokens[1][2]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'entity.name.function.php']
    expect(tokens[1][3]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.begin.bracket.round.php']
    expect(tokens[1][4]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.end.bracket.round.php']
    expect(tokens[1][5]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][6]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.begin.php']
    expect(tokens[1][7]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][8]).toEqual value: 'yield', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.control.php']
    expect(tokens[1][9]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][10]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(tokens[1][11]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
    expect(tokens[1][12]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']
    expect(tokens[1][13]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][14]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.end.php']

  it 'should tokenize embedded SQL in a string', ->
    waitsForPromise ->
      atom.packages.activatePackage('language-sql')

    runs ->
      delimsByScope =
        "string.quoted.double.sql.php": '"'
        "string.quoted.single.sql.php": "'"

      for scope, delim of delimsByScope
        tokens = grammar.tokenizeLines "<?php\n#{delim}SELECT something#{delim}"

        expect(tokens[1][0]).toEqual value: delim, scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', scope, 'punctuation.definition.string.begin.php']
        expect(tokens[1][1]).toEqual value: 'SELECT', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', scope, 'source.sql.embedded.php', 'keyword.other.DML.sql']
        expect(tokens[1][2]).toEqual value: ' something', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', scope, 'source.sql.embedded.php']
        expect(tokens[1][3]).toEqual value: delim, scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', scope, 'punctuation.definition.string.end.php']

        tokens = grammar.tokenizeLines "<?php\n#{delim}SELECT something\n-- uh oh a comment SELECT#{delim}"
        expect(tokens[2][0]).toEqual value: '--', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', scope, 'source.sql.embedded.php', 'comment.line.double-dash.sql', 'punctuation.definition.comment.sql']
        expect(tokens[2][1]).toEqual value: ' uh oh a comment SELECT', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', scope, 'source.sql.embedded.php', 'comment.line.double-dash.sql']
        expect(tokens[2][2]).toEqual value: delim, scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', scope, 'punctuation.definition.string.end.php']

  it 'should tokenize single quoted string regex escape characters correctly', ->
    tokens = grammar.tokenizeLines "<?php\n'/[\\\\\\\\]/';"

    expect(tokens[1][0]).toEqual value: '\'/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.regexp.single-quoted.php', 'punctuation.definition.string.begin.php']
    expect(tokens[1][1]).toEqual value: '[', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.regexp.single-quoted.php', 'string.regexp.character-class.php', 'punctuation.definition.character-class.php']
    expect(tokens[1][2]).toEqual value: '\\\\\\\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.regexp.single-quoted.php', 'string.regexp.character-class.php']
    expect(tokens[1][3]).toEqual value: ']', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.regexp.single-quoted.php', 'string.regexp.character-class.php', 'punctuation.definition.character-class.php']
    expect(tokens[1][4]).toEqual value: '/\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.regexp.single-quoted.php', 'punctuation.definition.string.end.php']
    expect(tokens[1][5]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize single quoted string regex with escaped bracket', ->
    tokens = grammar.tokenizeLines "<?php\n'/\\[/'"

    expect(tokens[1][0]).toEqual value: '\'/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.regexp.single-quoted.php', 'punctuation.definition.string.begin.php']
    expect(tokens[1][1]).toEqual value: '\\[', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.regexp.single-quoted.php', 'constant.character.escape.php']
    expect(tokens[1][2]).toEqual value: '/\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.regexp.single-quoted.php', 'punctuation.definition.string.end.php']

  it 'should tokenize opening scope of a closure correctly', ->
    tokens = grammar.tokenizeLines "<?php\n$a = function() {};"

    expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(tokens[1][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
    expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
    expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][5]).toEqual value: 'function', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.closure.php', 'storage.type.function.php']
    expect(tokens[1][6]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.closure.php', 'punctuation.definition.parameters.begin.bracket.round.php']
    expect(tokens[1][7]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.closure.php', 'punctuation.definition.parameters.end.bracket.round.php']
    expect(tokens[1][8]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.closure.php']
    expect(tokens[1][9]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.begin.php']
    expect(tokens[1][10]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.end.php']
    expect(tokens[1][11]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize non-function-non-control operations correctly', ->
    tokens = grammar.tokenizeLines "<?php\necho 'test';"

    expect(tokens[1][0]).toEqual value: 'echo', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'support.function.construct.output.php']
    expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][2]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
    expect(tokens[1][3]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.single.php']
    expect(tokens[1][4]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.single.php', 'punctuation.definition.string.end.php']
    expect(tokens[1][5]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a simple heredoc correctly', ->
    tokens = grammar.tokenizeLines """
      <?php
      $a = <<<HEREDOC
      I am a heredoc
      HEREDOC;
    """

    expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(tokens[1][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
    expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
    expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][5]).toEqual value: '<<<', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'punctuation.definition.string.php']
    expect(tokens[1][6]).toEqual value: 'HEREDOC', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'keyword.operator.heredoc.php']
    expect(tokens[2][0]).toEqual value: 'I am a heredoc', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php']
    expect(tokens[3][0]).toEqual value: 'HEREDOC', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'keyword.operator.heredoc.php']
    expect(tokens[3][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a longer heredoc correctly', ->
    tokens = grammar.tokenizeLines """
      <?php
      $a = <<<GITHUB
      This is a plain string.
      SELECT * FROM github WHERE octocat = 'awesome' and ID = 1;
      <strong>rainbows</strong>

      if(awesome) {
        doSomething(10, function(x){
          console.log(x*x);
        });
      }
      GITHUB;
    """

    expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(tokens[1][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
    expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
    expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][5]).toEqual value: '<<<', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'punctuation.definition.string.php']
    expect(tokens[1][6]).toEqual value: 'GITHUB', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'keyword.operator.heredoc.php']
    expect(tokens[2][0]).toEqual value: 'This is a plain string.', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php']
    expect(tokens[3][0]).toEqual value: 'SELECT * FROM github WHERE octocat = \'awesome\' and ID = 1;', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php']
    expect(tokens[4][0]).toEqual value: '<strong>rainbows</strong>', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php']
    expect(tokens[5][0]).toEqual value: '', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php']
    expect(tokens[6][0]).toEqual value: 'if(awesome) {', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php']
    expect(tokens[7][0]).toEqual value: '  doSomething(10, function(x){', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php']
    expect(tokens[8][0]).toEqual value: '    console.log(x*x);', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php']
    expect(tokens[9][0]).toEqual value: '  });', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php']
    expect(tokens[10][0]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php']
    expect(tokens[11][0]).toEqual value: 'GITHUB', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'keyword.operator.heredoc.php']
    expect(tokens[11][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a longer heredoc with interpolated values and escaped characters correctly', ->
    tokens = grammar.tokenizeLines """
      <?php
      $a = <<<GITHUB
      This is a plain string.
      Jumpin' Juniper is \\"The $thing\\"
      SELECT * FROM github WHERE octocat = 'awesome' and ID = 1;
      <strong>rainbows</strong>

      if(awesome) {
        doSomething(10, function(x){
          console.log(x*x);
        });
      }
      GITHUB;
    """

    expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(tokens[1][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
    expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
    expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][5]).toEqual value: '<<<', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'punctuation.definition.string.php']
    expect(tokens[1][6]).toEqual value: 'GITHUB', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'keyword.operator.heredoc.php']
    expect(tokens[2][0]).toEqual value: 'This is a plain string.', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php']
    expect(tokens[3][0]).toEqual value: 'Jumpin\' Juniper is ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php']
    expect(tokens[3][1]).toEqual value: '\\"', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'constant.character.escape.php']
    expect(tokens[3][2]).toEqual value: 'The ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php']
    expect(tokens[3][3]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(tokens[3][4]).toEqual value: 'thing', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'variable.other.php']
    expect(tokens[3][5]).toEqual value: '\\"', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'constant.character.escape.php']
    expect(tokens[4][0]).toEqual value: 'SELECT * FROM github WHERE octocat = \'awesome\' and ID = 1;', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php']
    expect(tokens[5][0]).toEqual value: '<strong>rainbows</strong>', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php']
    expect(tokens[6][0]).toEqual value: '', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php']
    expect(tokens[7][0]).toEqual value: 'if(awesome) {', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php']
    expect(tokens[8][0]).toEqual value: '  doSomething(10, function(x){', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php']
    expect(tokens[9][0]).toEqual value: '    console.log(x*x);', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php']
    expect(tokens[10][0]).toEqual value: '  });', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php']
    expect(tokens[11][0]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php']
    expect(tokens[12][0]).toEqual value: 'GITHUB', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'keyword.operator.heredoc.php']
    expect(tokens[12][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a nowdoc with interpolated values correctly', ->
    tokens = grammar.tokenizeLines """
      <?php
      $a = <<<'GITHUB'
      This is a plain string.
      Jumpin' Juniper is \\"The $thing\\"
      SELECT * FROM github WHERE octocat = 'awesome' and ID = 1;
      <strong>rainbows</strong>

      if(awesome) {
        doSomething(10, function(x){
          console.log(x*x);
        });
      }
      GITHUB;
    """

    expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(tokens[1][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
    expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
    expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][5]).toEqual value: '<<<', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'punctuation.definition.string.php']
    expect(tokens[1][6]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php']
    expect(tokens[1][7]).toEqual value: 'GITHUB', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'keyword.operator.nowdoc.php']
    expect(tokens[1][8]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php']
    expect(tokens[2][0]).toEqual value: 'This is a plain string.', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php']
    expect(tokens[3][0]).toEqual value: 'Jumpin\' Juniper is \\"The $thing\\"', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php']
    expect(tokens[4][0]).toEqual value: 'SELECT * FROM github WHERE octocat = \'awesome\' and ID = 1;', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php']
    expect(tokens[5][0]).toEqual value: '<strong>rainbows</strong>', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php']
    expect(tokens[6][0]).toEqual value: '', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php']
    expect(tokens[7][0]).toEqual value: 'if(awesome) {', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php']
    expect(tokens[8][0]).toEqual value: '  doSomething(10, function(x){', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php']
    expect(tokens[9][0]).toEqual value: '    console.log(x*x);', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php']
    expect(tokens[10][0]).toEqual value: '  });', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php']
    expect(tokens[11][0]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php']
    expect(tokens[12][0]).toEqual value: 'GITHUB', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'keyword.operator.nowdoc.php']
    expect(tokens[12][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a heredoc with embedded HTML and interpolation correctly', ->
    waitsForPromise ->
      atom.packages.activatePackage('language-html')

    runs ->
      tokens = grammar.tokenizeLines """
        <?php
        $a = <<<HTML
        <strong>rainbows</strong>
        Jumpin' Juniper is \\"The $thing\\"
        HTML;
      """

      expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[1][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
      expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
      expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][5]).toEqual value: '<<<', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(tokens[1][6]).toEqual value: 'HTML', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'punctuation.section.embedded.begin.php', 'keyword.operator.heredoc.php']
      expect(tokens[2][0].value).toEqual '<'
      expect(tokens[2][0].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'text.html']
      expect(tokens[2][1].value).toEqual 'strong'
      expect(tokens[2][1].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'text.html']
      expect(tokens[2][2].value).toEqual '>'
      expect(tokens[2][2].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'text.html']
      expect(tokens[2][3].value).toEqual 'rainbows'
      expect(tokens[2][3].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'text.html']
      expect(tokens[2][4].value).toEqual '</'
      expect(tokens[2][4].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'text.html']
      expect(tokens[2][5].value).toEqual 'strong'
      expect(tokens[2][5].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'text.html']
      expect(tokens[2][6].value).toEqual '>'
      expect(tokens[2][6].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'text.html']
      expect(tokens[3][0]).toEqual value: 'Jumpin\' Juniper is ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'text.html']
      expect(tokens[3][1]).toEqual value: '\\"', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'text.html', 'constant.character.escape.php']
      expect(tokens[3][2]).toEqual value: 'The ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'text.html']
      expect(tokens[3][3]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'text.html', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[3][4]).toEqual value: 'thing', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'text.html', 'variable.other.php']
      expect(tokens[3][5]).toEqual value: '\\"', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'text.html', 'constant.character.escape.php']
      expect(tokens[4][0]).toEqual value: 'HTML', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'punctuation.section.embedded.end.php', 'keyword.operator.heredoc.php']
      expect(tokens[4][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a nowdoc with embedded HTML and interpolation correctly', ->
    waitsForPromise ->
      atom.packages.activatePackage('language-html')

    runs ->
      tokens = grammar.tokenizeLines """
        <?php
        $a = <<<'HTML'
        <strong>rainbows</strong>
        Jumpin' Juniper is \\"The $thing\\"
        HTML;
      """

      expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[1][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
      expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
      expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][5]).toEqual value: '<<<', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.html', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(tokens[1][6]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.html', 'punctuation.section.embedded.begin.php']
      expect(tokens[1][7]).toEqual value: 'HTML', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.html', 'punctuation.section.embedded.begin.php', 'keyword.operator.nowdoc.php']
      expect(tokens[1][8]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.html', 'punctuation.section.embedded.begin.php']
      expect(tokens[2][0].value).toEqual '<'
      expect(tokens[2][0].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.html', 'text.html']
      expect(tokens[2][1].value).toEqual 'strong'
      expect(tokens[2][1].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.html', 'text.html']
      expect(tokens[2][2].value).toEqual '>'
      expect(tokens[2][2].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.html', 'text.html']
      expect(tokens[2][3].value).toEqual 'rainbows'
      expect(tokens[2][3].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.html', 'text.html']
      expect(tokens[2][4].value).toEqual '</'
      expect(tokens[2][4].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.html', 'text.html']
      expect(tokens[2][5].value).toEqual 'strong'
      expect(tokens[2][5].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.html', 'text.html']
      expect(tokens[2][6].value).toEqual '>'
      expect(tokens[2][6].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.html', 'text.html']
      expect(tokens[3][0]).toEqual value: 'Jumpin\' Juniper is \\"The $thing\\"', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.html', 'text.html']
      expect(tokens[4][0]).toEqual value: 'HTML', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.html', 'punctuation.section.embedded.end.php', 'keyword.operator.nowdoc.php']
      expect(tokens[4][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a heredoc with illegal whitespace at the end of the line correctly', ->
    tokens = grammar.tokenizeLines """
      <?php
      $a = <<<GITHUB\t
      This is a plain string.
      GITHUB;
    """

    expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(tokens[1][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
    expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
    expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][5]).toEqual value: '<<<', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'punctuation.definition.string.php']
    expect(tokens[1][6]).toEqual value: 'GITHUB', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'keyword.operator.heredoc.php']
    expect(tokens[1][7]).toEqual value: '\t', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'invalid.illegal.trailing-whitespace.php']
    expect(tokens[2][0]).toEqual value: 'This is a plain string.', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php']
    expect(tokens[3][0]).toEqual value: 'GITHUB', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'keyword.operator.heredoc.php']
    expect(tokens[3][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a heredoc with embedded XML correctly', ->
    waitsForPromise ->
      atom.packages.activatePackage('language-xml')

    runs ->
      tokens = grammar.tokenizeLines """
        <?php
        $a = <<<XML
        <root/>
        XML;
      """

      expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[1][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
      expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
      expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][5]).toEqual value: '<<<', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.xml', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(tokens[1][6]).toEqual value: 'XML', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.xml', 'punctuation.section.embedded.begin.php', 'keyword.operator.heredoc.php']
      expect(tokens[2][0].value).toEqual '<'
      expect(tokens[2][0].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.xml', 'text.xml']
      expect(tokens[2][1].value).toEqual 'root'
      expect(tokens[2][1].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.xml', 'text.xml']
      expect(tokens[2][2].value).toEqual '/>'
      expect(tokens[2][2].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.xml', 'text.xml']
      expect(tokens[3][0]).toEqual value: 'XML', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.xml', 'punctuation.section.embedded.end.php', 'keyword.operator.heredoc.php']
      expect(tokens[3][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a nowdoc with embedded XML correctly', ->
    waitsForPromise ->
      atom.packages.activatePackage('language-xml')

    runs ->
      tokens = grammar.tokenizeLines """
        <?php
        $a = <<<'XML'
        <root/>
        XML;
      """

      expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[1][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
      expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
      expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][5]).toEqual value: '<<<', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.xml', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(tokens[1][6]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.xml', 'punctuation.section.embedded.begin.php']
      expect(tokens[1][7]).toEqual value: 'XML', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.xml', 'punctuation.section.embedded.begin.php', 'keyword.operator.nowdoc.php']
      expect(tokens[1][8]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.xml', 'punctuation.section.embedded.begin.php']
      expect(tokens[2][0].value).toEqual '<'
      expect(tokens[2][0].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.xml', 'text.xml']
      expect(tokens[2][1].value).toEqual 'root'
      expect(tokens[2][1].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.xml', 'text.xml']
      expect(tokens[2][2].value).toEqual '/>'
      expect(tokens[2][2].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.xml', 'text.xml']
      expect(tokens[3][0]).toEqual value: 'XML', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.xml', 'punctuation.section.embedded.end.php', 'keyword.operator.nowdoc.php']
      expect(tokens[3][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a heredoc with embedded SQL correctly', ->
    waitsForPromise ->
      atom.packages.activatePackage('language-sql')

    runs ->
      tokens = grammar.tokenizeLines """
        <?php
        $a = <<<SQL
        SELECT * FROM table
        SQL;
      """

      expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[1][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
      expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
      expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][5]).toEqual value: '<<<', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.sql', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(tokens[1][6]).toEqual value: 'SQL', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.sql', 'punctuation.section.embedded.begin.php', 'keyword.operator.heredoc.php']
      expect(tokens[2][0].value).toEqual 'SELECT'
      expect(tokens[2][0].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.sql', 'source.sql']
      expect(tokens[2][1].value).toEqual ' '
      expect(tokens[2][1].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.sql', 'source.sql']
      expect(tokens[2][2].value).toEqual '*'
      expect(tokens[2][2].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.sql', 'source.sql']
      expect(tokens[2][3].value).toEqual ' '
      expect(tokens[2][3].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.sql', 'source.sql']
      expect(tokens[2][4].value).toEqual 'FROM'
      expect(tokens[2][4].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.sql', 'source.sql']
      expect(tokens[2][5].value).toEqual ' table'
      expect(tokens[2][5].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.sql', 'source.sql']
      expect(tokens[3][0]).toEqual value: 'SQL', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.sql', 'punctuation.section.embedded.end.php', 'keyword.operator.heredoc.php']
      expect(tokens[3][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a nowdoc with embedded SQL correctly', ->
    waitsForPromise ->
      atom.packages.activatePackage('language-sql')

    runs ->
      tokens = grammar.tokenizeLines """
        <?php
        $a = <<<'SQL'
        SELECT * FROM table
        SQL;
      """

      expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[1][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
      expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
      expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][5]).toEqual value: '<<<', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.sql', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(tokens[1][6]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.sql', 'punctuation.section.embedded.begin.php']
      expect(tokens[1][7]).toEqual value: 'SQL', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.sql', 'punctuation.section.embedded.begin.php', 'keyword.operator.nowdoc.php']
      expect(tokens[1][8]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.sql', 'punctuation.section.embedded.begin.php']
      expect(tokens[2][0].value).toEqual 'SELECT'
      expect(tokens[2][0].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.sql', 'source.sql']
      expect(tokens[2][1].value).toEqual ' '
      expect(tokens[2][1].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.sql', 'source.sql']
      expect(tokens[2][2].value).toEqual '*'
      expect(tokens[2][2].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.sql', 'source.sql']
      expect(tokens[2][3].value).toEqual ' '
      expect(tokens[2][3].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.sql', 'source.sql']
      expect(tokens[2][4].value).toEqual 'FROM'
      expect(tokens[2][4].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.sql', 'source.sql']
      expect(tokens[2][5].value).toEqual ' table'
      expect(tokens[2][5].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.sql', 'source.sql']
      expect(tokens[3][0]).toEqual value: 'SQL', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.sql', 'punctuation.section.embedded.end.php', 'keyword.operator.nowdoc.php']
      expect(tokens[3][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a heredoc with embedded javascript correctly', ->
    waitsForPromise ->
      atom.packages.activatePackage('language-javascript')

    runs ->
      tokens = grammar.tokenizeLines """
        <?php
        $a = <<<JAVASCRIPT
        var a = 1;
        JAVASCRIPT;

        $a = <<<JS
        var a = 1;
        JS;
      """

      expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[1][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
      expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
      expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][5]).toEqual value: '<<<', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(tokens[1][6]).toEqual value: 'JAVASCRIPT', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'punctuation.section.embedded.begin.php', 'keyword.operator.heredoc.php']
      expect(tokens[2][0].value).toEqual 'var'
      expect(tokens[2][0].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'source.js']
      expect(tokens[2][1].value).toEqual ' a '
      expect(tokens[2][1].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'source.js']
      expect(tokens[2][2].value).toEqual '='
      expect(tokens[2][2].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'source.js']
      expect(tokens[2][3].value).toEqual ' '
      expect(tokens[2][3].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'source.js']
      expect(tokens[2][4].value).toEqual '1'
      expect(tokens[2][4].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'source.js']
      expect(tokens[2][5].value).toEqual ';'
      expect(tokens[2][5].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'source.js']
      expect(tokens[3][0]).toEqual value: 'JAVASCRIPT', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'punctuation.section.embedded.end.php', 'keyword.operator.heredoc.php']
      expect(tokens[3][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      expect(tokens[5][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[5][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
      expect(tokens[5][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[5][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
      expect(tokens[5][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[5][5]).toEqual value: '<<<', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(tokens[5][6]).toEqual value: 'JS', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'punctuation.section.embedded.begin.php', 'keyword.operator.heredoc.php']
      expect(tokens[6][0].value).toEqual 'var'
      expect(tokens[6][0].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'source.js']
      expect(tokens[6][1].value).toEqual ' a '
      expect(tokens[6][1].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'source.js']
      expect(tokens[6][2].value).toEqual '='
      expect(tokens[6][2].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'source.js']
      expect(tokens[6][3].value).toEqual ' '
      expect(tokens[6][3].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'source.js']
      expect(tokens[6][4].value).toEqual '1'
      expect(tokens[6][4].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'source.js']
      expect(tokens[6][5].value).toEqual ';'
      expect(tokens[6][5].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'source.js']
      expect(tokens[7][0]).toEqual value: 'JS', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'punctuation.section.embedded.end.php', 'keyword.operator.heredoc.php']
      expect(tokens[7][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a nowdoc with embedded javascript correctly', ->
    waitsForPromise ->
      atom.packages.activatePackage('language-javascript')

    runs ->
      tokens = grammar.tokenizeLines """
        <?php
        $a = <<<'JAVASCRIPT'
        var a = 1;
        JAVASCRIPT;

        $a = <<<'JS'
        var a = 1;
        JS;
      """

      expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[1][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
      expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
      expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][5]).toEqual value: '<<<', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(tokens[1][6]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'punctuation.section.embedded.begin.php']
      expect(tokens[1][7]).toEqual value: 'JAVASCRIPT', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'punctuation.section.embedded.begin.php', 'keyword.operator.nowdoc.php']
      expect(tokens[1][8]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'punctuation.section.embedded.begin.php']
      expect(tokens[2][0].value).toEqual 'var'
      expect(tokens[2][0].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'source.js']
      expect(tokens[2][1].value).toEqual ' a '
      expect(tokens[2][1].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'source.js']
      expect(tokens[2][2].value).toEqual '='
      expect(tokens[2][2].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'source.js']
      expect(tokens[2][3].value).toEqual ' '
      expect(tokens[2][3].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'source.js']
      expect(tokens[2][4].value).toEqual '1'
      expect(tokens[2][4].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'source.js']
      expect(tokens[2][5].value).toEqual ';'
      expect(tokens[2][5].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'source.js']
      expect(tokens[3][0]).toEqual value: 'JAVASCRIPT', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'punctuation.section.embedded.end.php', 'keyword.operator.nowdoc.php']
      expect(tokens[3][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      expect(tokens[5][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[5][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
      expect(tokens[5][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[5][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
      expect(tokens[5][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[5][5]).toEqual value: '<<<', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(tokens[5][6]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'punctuation.section.embedded.begin.php']
      expect(tokens[5][7]).toEqual value: 'JS', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'punctuation.section.embedded.begin.php', 'keyword.operator.nowdoc.php']
      expect(tokens[5][8]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'punctuation.section.embedded.begin.php']
      expect(tokens[6][0].value).toEqual 'var'
      expect(tokens[6][0].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'source.js']
      expect(tokens[6][1].value).toEqual ' a '
      expect(tokens[6][1].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'source.js']
      expect(tokens[6][2].value).toEqual '='
      expect(tokens[6][2].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'source.js']
      expect(tokens[6][3].value).toEqual ' '
      expect(tokens[6][3].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'source.js']
      expect(tokens[6][4].value).toEqual '1'
      expect(tokens[6][4].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'source.js']
      expect(tokens[6][5].value).toEqual ';'
      expect(tokens[6][5].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'source.js']
      expect(tokens[7][0]).toEqual value: 'JS', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'punctuation.section.embedded.end.php', 'keyword.operator.nowdoc.php']
      expect(tokens[7][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a heredoc with embedded json correctly', ->
    waitsForPromise ->
      atom.packages.activatePackage('language-json')

    runs ->
      tokens = grammar.tokenizeLines """
        <?php
        $a = <<<JSON
        {"a" : 1}
        JSON;
      """

      expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[1][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
      expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
      expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][5]).toEqual value: '<<<', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.json', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(tokens[1][6]).toEqual value: 'JSON', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.json', 'punctuation.section.embedded.begin.php', 'keyword.operator.heredoc.php']
      expect(tokens[2][0].value).toEqual '{'
      expect(tokens[2][0].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.json', 'source.json']
      expect(tokens[2][1].value).toEqual '"'
      expect(tokens[2][1].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.json', 'source.json']
      expect(tokens[2][2].value).toEqual 'a'
      expect(tokens[2][2].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.json', 'source.json']
      expect(tokens[2][3].value).toEqual '"'
      expect(tokens[2][3].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.json', 'source.json']
      expect(tokens[2][4].value).toEqual ' '
      expect(tokens[2][4].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.json', 'source.json']
      expect(tokens[2][5].value).toEqual ':'
      expect(tokens[2][5].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.json', 'source.json']
      expect(tokens[2][6].value).toEqual ' '
      expect(tokens[2][6].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.json', 'source.json']
      expect(tokens[2][7].value).toEqual '1'
      expect(tokens[2][7].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.json', 'source.json']
      expect(tokens[2][8].value).toEqual '}'
      expect(tokens[2][8].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.json', 'source.json']
      expect(tokens[3][0]).toEqual value: 'JSON', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.json', 'punctuation.section.embedded.end.php', 'keyword.operator.heredoc.php']
      expect(tokens[3][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a nowdoc with embedded json correctly', ->
    waitsForPromise ->
      atom.packages.activatePackage('language-json')

    runs ->
      tokens = grammar.tokenizeLines """
        <?php
        $a = <<<'JSON'
        {"a" : 1}
        JSON;
      """

      expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[1][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
      expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
      expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][5]).toEqual value: '<<<', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(tokens[1][6]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'punctuation.section.embedded.begin.php']
      expect(tokens[1][7]).toEqual value: 'JSON', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'punctuation.section.embedded.begin.php', 'keyword.operator.nowdoc.php']
      expect(tokens[1][8]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'punctuation.section.embedded.begin.php']
      expect(tokens[2][0].value).toEqual '{'
      expect(tokens[2][0].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'source.json']
      expect(tokens[2][1].value).toEqual '"'
      expect(tokens[2][1].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'source.json']
      expect(tokens[2][2].value).toEqual 'a'
      expect(tokens[2][2].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'source.json']
      expect(tokens[2][3].value).toEqual '"'
      expect(tokens[2][3].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'source.json']
      expect(tokens[2][4].value).toEqual ' '
      expect(tokens[2][4].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'source.json']
      expect(tokens[2][5].value).toEqual ':'
      expect(tokens[2][5].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'source.json']
      expect(tokens[2][6].value).toEqual ' '
      expect(tokens[2][6].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'source.json']
      expect(tokens[2][7].value).toEqual '1'
      expect(tokens[2][7].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'source.json']
      expect(tokens[2][8].value).toEqual '}'
      expect(tokens[2][8].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'source.json']
      expect(tokens[3][0]).toEqual value: 'JSON', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'punctuation.section.embedded.end.php', 'keyword.operator.nowdoc.php']
      expect(tokens[3][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a heredoc with embedded css correctly', ->
    waitsForPromise ->
      atom.packages.activatePackage('language-css')

    runs ->
      tokens = grammar.tokenizeLines """
        <?php
        $a = <<<CSS
        body{}
        CSS;
      """

      expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[1][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
      expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
      expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][5]).toEqual value: '<<<', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.css', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(tokens[1][6]).toEqual value: 'CSS', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.css', 'punctuation.section.embedded.begin.php', 'keyword.operator.heredoc.php']
      expect(tokens[2][0].value).toEqual 'body'
      expect(tokens[2][0].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.css', 'source.css']
      expect(tokens[2][1].value).toEqual '{'
      expect(tokens[2][1].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.css', 'source.css']
      expect(tokens[2][2].value).toEqual '}'
      expect(tokens[2][2].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.css', 'source.css']
      expect(tokens[3][0]).toEqual value: 'CSS', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'meta.embedded.css', 'punctuation.section.embedded.end.php', 'keyword.operator.heredoc.php']
      expect(tokens[3][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a nowdoc with embedded css correctly', ->
    waitsForPromise ->
      atom.packages.activatePackage('language-css')

    runs ->
      tokens = grammar.tokenizeLines """
        <?php
        $a = <<<'CSS'
        body{}
        CSS;
      """

      expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[1][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
      expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
      expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][5]).toEqual value: '<<<', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.css', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(tokens[1][6]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.css', 'punctuation.section.embedded.begin.php']
      expect(tokens[1][7]).toEqual value: 'CSS', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.css', 'punctuation.section.embedded.begin.php', 'keyword.operator.nowdoc.php']
      expect(tokens[1][8]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.css', 'punctuation.section.embedded.begin.php']
      expect(tokens[2][0].value).toEqual 'body'
      expect(tokens[2][0].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.css', 'source.css']
      expect(tokens[2][1].value).toEqual '{'
      expect(tokens[2][1].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.css', 'source.css']
      expect(tokens[2][2].value).toEqual '}'
      expect(tokens[2][2].scopes).toContainAll ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.css', 'source.css']
      expect(tokens[3][0]).toEqual value: 'CSS', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.css', 'punctuation.section.embedded.end.php', 'keyword.operator.nowdoc.php']
      expect(tokens[3][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a heredoc with embedded regex escaped bracket correctly', ->
    tokens = grammar.tokenizeLines """
      <?php
      $a = <<<REGEX
      /\\[/
      REGEX;
    """

    expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(tokens[1][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
    expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
    expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][5]).toEqual value: '<<<', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
    expect(tokens[1][6]).toEqual value: 'REGEX', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'punctuation.section.embedded.begin.php', 'keyword.operator.heredoc.php']
    expect(tokens[2][0]).toEqual value: '/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'string.regexp.heredoc.php']
    expect(tokens[2][1]).toEqual value: '\\[', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'string.regexp.heredoc.php', 'constant.character.escape.regex.php']
    expect(tokens[2][2]).toEqual value: '/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'string.regexp.heredoc.php']
    expect(tokens[3][0]).toEqual value: 'REGEX', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'punctuation.section.embedded.end.php', 'keyword.operator.heredoc.php']
    expect(tokens[3][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a nowdoc with embedded regex escape characters correctly', ->
    tokens = grammar.tokenizeLines """
      <?php
      $a = <<<'REGEX'
      /[\\\\\\\\]/
      REGEX;
    """

    expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(tokens[1][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
    expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
    expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][5]).toEqual value: '<<<', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
    expect(tokens[1][6]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php']
    expect(tokens[1][7]).toEqual value: 'REGEX', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php', 'keyword.operator.nowdoc.php']
    expect(tokens[1][8]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php']
    expect(tokens[2][0]).toEqual value: '/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php']
    expect(tokens[2][1]).toEqual value: '[', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php', 'string.regexp.character-class.php', 'punctuation.definition.character-class.php']
    expect(tokens[2][2]).toEqual value: '\\\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php', 'string.regexp.character-class.php', 'constant.character.escape.php']
    expect(tokens[2][3]).toEqual value: '\\\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php', 'string.regexp.character-class.php', 'constant.character.escape.php']
    expect(tokens[2][4]).toEqual value: ']', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php', 'string.regexp.character-class.php', 'punctuation.definition.character-class.php']
    expect(tokens[2][5]).toEqual value: '/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php']
    expect(tokens[3][0]).toEqual value: 'REGEX', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.end.php', 'keyword.operator.nowdoc.php']
    expect(tokens[3][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a nowdoc with embedded regex escaped bracket correctly', ->
    tokens = grammar.tokenizeLines """
      <?php
      $a = <<<'REGEX'
      /\\[/
      REGEX;
    """

    expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(tokens[1][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
    expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
    expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][5]).toEqual value: '<<<', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
    expect(tokens[1][6]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php']
    expect(tokens[1][7]).toEqual value: 'REGEX', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php', 'keyword.operator.nowdoc.php']
    expect(tokens[1][8]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php']
    expect(tokens[2][0]).toEqual value: '/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php']
    expect(tokens[2][1]).toEqual value: '\\[', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php', 'constant.character.escape.regex.php']
    expect(tokens[2][2]).toEqual value: '/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php']
    expect(tokens[3][0]).toEqual value: 'REGEX', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.end.php', 'keyword.operator.nowdoc.php']
    expect(tokens[3][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a heredoc with embedded regex escape characters correctly', ->
    tokens = grammar.tokenizeLines """
      <?php
      $a = <<<REGEXP
      /[\\\\\\\\]/
      REGEXP;
    """

    expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(tokens[1][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
    expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
    expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][5]).toEqual value: '<<<', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
    expect(tokens[1][6]).toEqual value: 'REGEXP', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'punctuation.section.embedded.begin.php', 'keyword.operator.heredoc.php']
    expect(tokens[2][0]).toEqual value: '/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'string.regexp.heredoc.php']
    expect(tokens[2][1]).toEqual value: '[', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'string.regexp.heredoc.php', 'string.regexp.character-class.php', 'punctuation.definition.character-class.php']
    expect(tokens[2][2]).toEqual value: '\\\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'string.regexp.heredoc.php', 'string.regexp.character-class.php', 'constant.character.escape.php']
    expect(tokens[2][3]).toEqual value: '\\\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'string.regexp.heredoc.php', 'string.regexp.character-class.php', 'constant.character.escape.php']
    expect(tokens[2][4]).toEqual value: ']', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'string.regexp.heredoc.php', 'string.regexp.character-class.php', 'punctuation.definition.character-class.php']
    expect(tokens[2][5]).toEqual value: '/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'string.regexp.heredoc.php']
    expect(tokens[3][0]).toEqual value: 'REGEXP', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'punctuation.section.embedded.end.php', 'keyword.operator.heredoc.php']
    expect(tokens[3][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a heredoc with embedded regex escaped bracket correctly', ->
    tokens = grammar.tokenizeLines """
      <?php
      $a = <<<REGEXP
      /\\[/
      REGEXP;
    """

    expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(tokens[1][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
    expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
    expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][5]).toEqual value: '<<<', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
    expect(tokens[1][6]).toEqual value: 'REGEXP', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'punctuation.section.embedded.begin.php', 'keyword.operator.heredoc.php']
    expect(tokens[2][0]).toEqual value: '/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'string.regexp.heredoc.php']
    expect(tokens[2][1]).toEqual value: '\\[', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'string.regexp.heredoc.php', 'constant.character.escape.regex.php']
    expect(tokens[2][2]).toEqual value: '/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'string.regexp.heredoc.php']
    expect(tokens[3][0]).toEqual value: 'REGEXP', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php', 'punctuation.section.embedded.end.php', 'keyword.operator.heredoc.php']
    expect(tokens[3][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a nowdoc with embedded regex escape characters correctly', ->
    tokens = grammar.tokenizeLines """
      <?php
      $a = <<<'REGEXP'
      /[\\\\\\\\]/
      REGEXP;
    """

    expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(tokens[1][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
    expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
    expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][5]).toEqual value: '<<<', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
    expect(tokens[1][6]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php']
    expect(tokens[1][7]).toEqual value: 'REGEXP', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php', 'keyword.operator.nowdoc.php']
    expect(tokens[1][8]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php']
    expect(tokens[2][0]).toEqual value: '/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php']
    expect(tokens[2][1]).toEqual value: '[', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php', 'string.regexp.character-class.php', 'punctuation.definition.character-class.php']
    expect(tokens[2][2]).toEqual value: '\\\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php', 'string.regexp.character-class.php', 'constant.character.escape.php']
    expect(tokens[2][3]).toEqual value: '\\\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php', 'string.regexp.character-class.php', 'constant.character.escape.php']
    expect(tokens[2][4]).toEqual value: ']', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php', 'string.regexp.character-class.php', 'punctuation.definition.character-class.php']
    expect(tokens[2][5]).toEqual value: '/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php']
    expect(tokens[3][0]).toEqual value: 'REGEXP', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.end.php', 'keyword.operator.nowdoc.php']
    expect(tokens[3][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a nowdoc with embedded regex escaped bracket correctly', ->
    tokens = grammar.tokenizeLines """
      <?php
      $a = <<<'REGEXP'
      /\\[/
      REGEXP;
    """

    expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(tokens[1][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
    expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
    expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][5]).toEqual value: '<<<', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
    expect(tokens[1][6]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php']
    expect(tokens[1][7]).toEqual value: 'REGEXP', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php', 'keyword.operator.nowdoc.php']
    expect(tokens[1][8]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php']
    expect(tokens[2][0]).toEqual value: '/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php']
    expect(tokens[2][1]).toEqual value: '\\[', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php', 'constant.character.escape.regex.php']
    expect(tokens[2][2]).toEqual value: '/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php']
    expect(tokens[3][0]).toEqual value: 'REGEXP', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.end.php', 'keyword.operator.nowdoc.php']
    expect(tokens[3][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  describe 'punctuation', ->
    it 'tokenizes parentheses', ->
      tokens = grammar.tokenizeLines "<?php\n()"

      expect(tokens[1][0]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.begin.bracket.round.php']
      expect(tokens[1][1]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.end.bracket.round.php']

      tokens = grammar.tokenizeLines "<?php\n(/* stuff */)"

      expect(tokens[1][0]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.begin.bracket.round.php']
      expect(tokens[1][4]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.end.bracket.round.php']

  describe 'firstLineMatch', ->
    it "recognises interpreter directives", ->
      valid = """
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
      """
      for line in valid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).not.toBeNull()

      invalid = """
        \x20#!/usr/sbin/php
        \t#!/usr/sbin/php
        #!/usr/bin/env-php/node-env/
        #!/usr/bin/env-php
        #! /usr/binphp
        #!/usr/bin.php
        #!\t/usr/bin/env --php=bar
      """
      for line in invalid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).toBeNull()

    it "recognises Emacs modelines", ->
      valid = """
        #-*- PHP -*-
        #-*- mode: PHP -*-
        /* -*-php-*- */
        // -*- PHP -*-
        /* -*- mode:PHP -*- */
        // -*- font:bar;mode:pHp -*-
        // -*- font:bar;mode:PHP;foo:bar; -*-
        // -*-font:mode;mode:php-*-
        // -*- foo:bar mode: php bar:baz -*-
        " -*-foo:bar;mode:php;bar:foo-*- ";
        " -*-font-mode:foo;mode:php;foo-bar:quux-*-"
        "-*-font:x;foo:bar; mode : PHP; bar:foo;foooooo:baaaaar;fo:ba;-*-";
        "-*- font:x;foo : bar ; mode : php ; bar : foo ; foooooo:baaaaar;fo:ba-*-";
      """
      for line in valid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).not.toBeNull()

      invalid = """
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
      """
      for line in invalid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).toBeNull()

    it "recognises Vim modelines", ->
      valid = """
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
      """
      for line in valid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).not.toBeNull()

      invalid = """
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
      """
      for line in invalid.split /\n/
        expect(grammar.firstLineRegex.scanner.findNextMatchSync(line)).toBeNull()
