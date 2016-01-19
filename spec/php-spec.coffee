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

      it 'should tokenize default array type with old array value correctly', ->
        tokens = grammar.tokenizeLines "<?php\nfunction array_test(array $value = array()) {}"

        expect(tokens[1][0]).toEqual value: 'function', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'storage.type.function.php']
        expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php']
        expect(tokens[1][2]).toEqual value: 'array_test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'entity.name.function.php']
        expect(tokens[1][3]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.begin.php']
        expect(tokens[1][4]).toEqual value: 'array', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php', 'storage.type.php']
        expect(tokens[1][5]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php']
        expect(tokens[1][6]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][7]).toEqual value: 'value', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php', 'variable.other.php']
        expect(tokens[1][8]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php']
        expect(tokens[1][9]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php', 'keyword.operator.assignment.php']
        expect(tokens[1][10]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php']
        expect(tokens[1][11]).toEqual value: 'array', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php', 'support.function.construct.php']
        expect(tokens[1][12]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php', 'punctuation.definition.array.begin.php']
        expect(tokens[1][13]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php', 'punctuation.definition.array.end.php']
        expect(tokens[1][14]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.end.php']
        expect(tokens[1][15]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][16]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.begin.php']
        expect(tokens[1][17]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.end.php']

      it 'should tokenize variadic arguments correctly', ->
        tokens = grammar.tokenizeLines "<?php\nfunction test(...$value) {}"

        expect(tokens[1][4]).toEqual value: '...', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.no-default.php', 'variable.other.php']
        expect(tokens[1][5]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.no-default.php', 'variable.other.php', 'punctuation.definition.variable.php']

      it 'should tokenize default array type with short array value correctly', ->
        tokens = grammar.tokenizeLines "<?php\nfunction array_test(array $value = []) {}"

        expect(tokens[1][0]).toEqual value: 'function', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'storage.type.function.php']
        expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php']
        expect(tokens[1][2]).toEqual value: 'array_test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'entity.name.function.php']
        expect(tokens[1][3]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.begin.php']
        expect(tokens[1][4]).toEqual value: 'array', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php', 'storage.type.php']
        expect(tokens[1][5]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php']
        expect(tokens[1][6]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][7]).toEqual value: 'value', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php', 'variable.other.php']
        expect(tokens[1][8]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php']
        expect(tokens[1][9]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php', 'keyword.operator.assignment.php']
        expect(tokens[1][10]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php']
        expect(tokens[1][11]).toEqual value: '[', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php', 'punctuation.section.array.begin.php']
        expect(tokens[1][12]).toEqual value: ']', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php', 'punctuation.section.array.end.php']
        expect(tokens[1][13]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.end.php']
        expect(tokens[1][14]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][15]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.begin.php']
        expect(tokens[1][16]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.end.php']

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

      it 'should tokenize default value with non-lowercase array type hinting correctly', ->
        tokens = grammar.tokenizeLines "<?php\nfunction array_test(Array $value = []) {}"

        expect(tokens[1][0]).toEqual value: 'function', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'storage.type.function.php']
        expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php']
        expect(tokens[1][2]).toEqual value: 'array_test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'entity.name.function.php']
        expect(tokens[1][3]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.begin.php']
        expect(tokens[1][4]).toEqual value: 'Array', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php', 'storage.type.php']
        expect(tokens[1][5]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php']
        expect(tokens[1][6]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][7]).toEqual value: 'value', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php', 'variable.other.php']
        expect(tokens[1][8]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php']
        expect(tokens[1][9]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php', 'keyword.operator.assignment.php']
        expect(tokens[1][10]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php']
        expect(tokens[1][11]).toEqual value: '[', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php', 'punctuation.section.array.begin.php']
        expect(tokens[1][12]).toEqual value: ']', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php', 'punctuation.section.array.end.php']
        expect(tokens[1][13]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.end.php']
        expect(tokens[1][14]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][15]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.begin.php']
        expect(tokens[1][16]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.end.php']

      it 'should tokenize \\e correctly', ->
        tokens = grammar.tokenizeLines "<?php\n\"test \\e test\";"

        expect(tokens[1][0]).toEqual value: '"', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php', 'punctuation.definition.string.begin.php']
        expect(tokens[1][1]).toEqual value: 'test ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php', 'meta.string-contents.quoted.double.php']
        expect(tokens[1][2]).toEqual value: '\\e', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php', 'meta.string-contents.quoted.double.php', 'constant.character.escape.php']
        expect(tokens[1][3]).toEqual value: ' test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php', 'meta.string-contents.quoted.double.php']
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
        expect(tokens[1][3]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.begin.php']
        expect(tokens[1][4]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.end.php']
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

      it 'should tokenize single quoted string regex escape characters correctly', ->
        tokens = grammar.tokenizeLines "<?php\n'/[\\\\\\\\]/';"

        expect(tokens[1][0]).toEqual value: '\'/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.regexp.single-quoted.php', 'punctuation.definition.string.begin.php']
        expect(tokens[1][1]).toEqual value: '[', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.regexp.single-quoted.php', 'string.regexp.character-class.php', 'punctuation.definition.character-class.php']
        expect(tokens[1][2]).toEqual value: '\\\\\\\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.regexp.single-quoted.php', 'string.regexp.character-class.php']
        expect(tokens[1][3]).toEqual value: ']', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.regexp.single-quoted.php', 'string.regexp.character-class.php', 'punctuation.definition.character-class.php']
        expect(tokens[1][4]).toEqual value: '/\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.regexp.single-quoted.php', 'punctuation.definition.string.end.php']
        expect(tokens[1][5]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize opening scope of a closure correctly', ->
        tokens = grammar.tokenizeLines "<?php\n$a = function() {};"

        expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][1]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
        expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][3]).toEqual value: '=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
        expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][5]).toEqual value: 'function', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.closure.php', 'storage.type.function.php']
        expect(tokens[1][6]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.closure.php', 'punctuation.definition.parameters.begin.php']
        expect(tokens[1][7]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.closure.php', 'punctuation.definition.parameters.end.php']
        expect(tokens[1][8]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.closure.php']
        expect(tokens[1][9]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.begin.php']
        expect(tokens[1][10]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.section.scope.end.php']
        expect(tokens[1][11]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize non-function-non-control operations correctly', ->
        tokens = grammar.tokenizeLines "<?php\necho 'test';"

        expect(tokens[1][0]).toEqual value: 'echo', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'support.function.construct.output.php']
        expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][2]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
        expect(tokens[1][3]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.single.php', 'meta.string-contents.quoted.single.php']
        expect(tokens[1][4]).toEqual value: '\'', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.single.php', 'punctuation.definition.string.end.php']
        expect(tokens[1][5]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']
