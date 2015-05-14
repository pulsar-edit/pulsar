{TextEditor} = require 'atom'

describe 'PHP grammar', ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage 'language-php'

    runs ->
      grammar = atom.grammars.grammarForScopeName 'text.html.php'

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

      it 'should tokenize namespace at the same line as <?php', ->
        tokens = grammar.tokenizeLines "<?php namespace Test;"
        expect(tokens[0][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php']
        expect(tokens[0][2]).toEqual value: 'namespace', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'keyword.other.namespace.php']
        expect(tokens[0][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php']
        expect(tokens[0][4]).toEqual value: 'Test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
        expect(tokens[0][5]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize namespace correctyl', ->
        tokens = grammar.tokenizeLines "<?php\nnamespace Test;"
        expect(tokens[1][0]).toEqual value: 'namespace', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'keyword.other.namespace.php']
        expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php']
        expect(tokens[1][2]).toEqual value: 'Test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
        expect(tokens[1][3]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']
