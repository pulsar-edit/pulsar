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
      expect(tokens[1][5]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']
      expect(tokens[1][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

    it 'should tokenize + correctly', ->
      tokens = grammar.tokenizeLines "<?php\n1 + 2;"

      expect(tokens[1][0]).toEqual value: '1', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][2]).toEqual value: '+', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.arithmetic.php']
      expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][4]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']
      expect(tokens[1][5]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

    it 'should tokenize - correctly', ->
      tokens = grammar.tokenizeLines "<?php\n1 - 2;"

      expect(tokens[1][0]).toEqual value: '1', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][2]).toEqual value: '-', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.arithmetic.php']
      expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][4]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']
      expect(tokens[1][5]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

    it 'should tokenize * correctly', ->
      tokens = grammar.tokenizeLines "<?php\n1 * 2;"

      expect(tokens[1][0]).toEqual value: '1', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][2]).toEqual value: '*', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.arithmetic.php']
      expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][4]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']
      expect(tokens[1][5]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

    it 'should tokenize / correctly', ->
      tokens = grammar.tokenizeLines "<?php\n1 / 2;"

      expect(tokens[1][0]).toEqual value: '1', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][2]).toEqual value: '/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.arithmetic.php']
      expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][4]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']
      expect(tokens[1][5]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

    it 'should tokenize % correctly', ->
      tokens = grammar.tokenizeLines "<?php\n1 % 2;"

      expect(tokens[1][0]).toEqual value: '1', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][2]).toEqual value: '%', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.arithmetic.php']
      expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][4]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']
      expect(tokens[1][5]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

    describe 'combined operators', ->
      it 'should tokenize === correctly', ->
        tokens = grammar.tokenizeLines "<?php\n$test === 2;"

        expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][1]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
        expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][3]).toEqual value: '===', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.comparison.php']
        expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][5]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']
        expect(tokens[1][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize += correctly', ->
        tokens = grammar.tokenizeLines "<?php\n$test += 2;"

        expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][1]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
        expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][3]).toEqual value: '+=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
        expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][5]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']
        expect(tokens[1][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize -= correctly', ->
        tokens = grammar.tokenizeLines "<?php\n$test -= 2;"

        expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][1]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
        expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][3]).toEqual value: '-=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
        expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][5]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']
        expect(tokens[1][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize *= correctly', ->
        tokens = grammar.tokenizeLines "<?php\n$test *= 2;"

        expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][1]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
        expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][3]).toEqual value: '*=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
        expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][5]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']
        expect(tokens[1][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize /= correctly', ->
        tokens = grammar.tokenizeLines "<?php\n$test /= 2;"

        expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][1]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
        expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][3]).toEqual value: '/=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
        expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][5]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']
        expect(tokens[1][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize %= correctly', ->
        tokens = grammar.tokenizeLines "<?php\n$test %= 2;"

        expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][1]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
        expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][3]).toEqual value: '%=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
        expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][5]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']
        expect(tokens[1][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize .= correctly', ->
        tokens = grammar.tokenizeLines "<?php\n$test .= 2;"

        expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][1]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
        expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][3]).toEqual value: '.=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.string.php']
        expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][5]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']
        expect(tokens[1][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize &= correctly', ->
        tokens = grammar.tokenizeLines "<?php\n$test &= 2;"

        expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][1]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
        expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][3]).toEqual value: '&=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
        expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][5]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']
        expect(tokens[1][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize |= correctly', ->
        tokens = grammar.tokenizeLines "<?php\n$test |= 2;"

        expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][1]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
        expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][3]).toEqual value: '|=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
        expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][5]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']
        expect(tokens[1][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize ^= correctly', ->
        tokens = grammar.tokenizeLines "<?php\n$test ^= 2;"

        expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][1]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
        expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][3]).toEqual value: '^=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
        expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][5]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']
        expect(tokens[1][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize <<= correctly', ->
        tokens = grammar.tokenizeLines "<?php\n$test <<= 2;"

        expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][1]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
        expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][3]).toEqual value: '<<=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
        expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][5]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']
        expect(tokens[1][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize >>= correctly', ->
        tokens = grammar.tokenizeLines "<?php\n$test >>= 2;"

        expect(tokens[1][0]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1][1]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
        expect(tokens[1][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][3]).toEqual value: '>>=', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.assignment.php']
        expect(tokens[1][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
        expect(tokens[1][5]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']
        expect(tokens[1][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']
      
      it 'should tokenize ?? correctly', ->
        tokens = grammar.tokenizeLines """<?php
          $foo = $bar ?? 'bar';
        """
        expect(tokens[1][8]).toEqual value: '??', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.null-coalescing.php']
      
      describe 'ternaries', ->
        it 'should tokenize ternary expressions', ->
          tokens = grammar.tokenizeLines """<?php
            $foo = 1 == 3 ? true : false;
          """
          expect(tokens[1][11]).toEqual value: '?', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.ternary.php']
          expect(tokens[1][15]).toEqual value: ':', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.ternary.php']

          tokens = grammar.tokenizeLines """<?php
            $foo = 1 == 3
            ? true
            : false;
          """
          expect(tokens[2][0]).toEqual value: '?', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.ternary.php']
          expect(tokens[3][0]).toEqual value: ':', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.ternary.php']

          tokens = grammar.tokenizeLines """<?php
            $foo=1==3?true:false;
          """
          expect(tokens[1][6]).toEqual value: '?', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.ternary.php']
          expect(tokens[1][8]).toEqual value: ':', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.ternary.php']
        
        it 'should tokenize shorthand ternaries', ->
          tokens = grammar.tokenizeLines """<?php
            $foo = false ?: false ?: true ?: false;
          """
          expect(tokens[1][7]).toEqual value: '?:', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.ternary.php']
          expect(tokens[1][11]).toEqual tokens[1][7]
          expect(tokens[1][15]).toEqual tokens[1][7]

        it 'should tokenize a combination of ternaries', ->
          tokens = grammar.tokenizeLines """<?php
            $foo = false ?: true == 1
            ? true : false ?: false;
          """
          expect(tokens[1][7]).toEqual value: '?:', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.ternary.php']
          expect(tokens[2][0]).toEqual value: '?', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.ternary.php']
          expect(tokens[2][4]).toEqual value: ':', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.ternary.php']
          expect(tokens[2][8]).toEqual value: '?:', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.operator.ternary.php']


  it 'should tokenize $this', ->
    tokens = grammar.tokenizeLines "<?php $this"

    expect(tokens[0][2]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.language.this.php', 'punctuation.definition.variable.php']
    expect(tokens[0][3]).toEqual value: 'this', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.language.this.php']

    tokens = grammar.tokenizeLines "<?php $thistles"

    expect(tokens[0][2]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(tokens[0][3]).toEqual value: 'thistles', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']

  it 'should tokenize include on the same line as <?php', ->
    # https://github.com/atom/language-php/issues/154
    tokens = grammar.tokenizeLines "<?php include 'test'?>"

    expect(tokens[0][2]).toEqual value: 'include', scopes: ['text.html.php', 'meta.embedded.line.php', 'source.php', 'meta.include.php', 'keyword.control.import.include.php']
    expect(tokens[0][4]).toEqual value: "'", scopes: ['text.html.php', 'meta.embedded.line.php', 'source.php', 'meta.include.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
    expect(tokens[0][6]).toEqual value: "'", scopes: ['text.html.php', 'meta.embedded.line.php', 'source.php', 'meta.include.php', 'string.quoted.single.php', 'punctuation.definition.string.end.php']
    expect(tokens[0][7]).toEqual value: '?', scopes: ['text.html.php', 'meta.embedded.line.php', 'punctuation.section.embedded.end.php', 'source.php']
    expect(tokens[0][8]).toEqual value: '>', scopes: ['text.html.php', 'meta.embedded.line.php', 'punctuation.section.embedded.end.php']

  describe 'declaring namespaces', ->
    it 'tokenize namespaces immediately following <?php', ->
      tokens = grammar.tokenizeLines "<?php namespace Test;"

      expect(tokens[0][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php']
      expect(tokens[0][2]).toEqual value: 'namespace', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'keyword.other.namespace.php']
      expect(tokens[0][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php']
      expect(tokens[0][4]).toEqual value: 'Test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(tokens[0][5]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

    it 'tokenizes namespaces', ->
      tokens = grammar.tokenizeLines "<?php\nnamespace Test;"

      expect(tokens[1][0]).toEqual value: 'namespace', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'keyword.other.namespace.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php']
      expect(tokens[1][2]).toEqual value: 'Test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(tokens[1][3]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

    it 'tokenizes sub-namespaces', ->
      tokens = grammar.tokenizeLines "<?php\nnamespace One\\Two\\Three;"

      expect(tokens[1][0]).toEqual value: 'namespace', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'keyword.other.namespace.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php']
      expect(tokens[1][2]).toEqual value: 'One', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(tokens[1][3]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'entity.name.type.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][4]).toEqual value: 'Two', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(tokens[1][5]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'entity.name.type.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][6]).toEqual value: 'Three', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(tokens[1][7]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

    it 'tokenizes bracketed namespaces', ->
      tokens = grammar.tokenizeLines """<?php
        namespace Test {
          // code
        }
      """

      expect(tokens[1][0]).toEqual value: 'namespace', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'keyword.other.namespace.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php']
      expect(tokens[1][2]).toEqual value: 'Test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php']
      expect(tokens[1][4]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'punctuation.definition.namespace.begin.bracket.curly.php']
      expect(tokens[2][1]).toEqual value: '//', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'comment.line.double-slash.php', 'punctuation.definition.comment.php']
      expect(tokens[3][0]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'punctuation.definition.namespace.end.bracket.curly.php']

      tokens = grammar.tokenizeLines """<?php
        namespace Test
        {
          // code
        }
      """

      expect(tokens[1][0]).toEqual value: 'namespace', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'keyword.other.namespace.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php']
      expect(tokens[1][2]).toEqual value: 'Test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(tokens[2][0]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'punctuation.definition.namespace.begin.bracket.curly.php']
      expect(tokens[3][1]).toEqual value: '//', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'comment.line.double-slash.php', 'punctuation.definition.comment.php']
      expect(tokens[4][0]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'punctuation.definition.namespace.end.bracket.curly.php']

      tokens = grammar.tokenizeLines """<?php
        namespace One\\Two\\Three {
          // code
        }
      """

      expect(tokens[1][0]).toEqual value: 'namespace', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'keyword.other.namespace.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php']
      expect(tokens[1][2]).toEqual value: 'One', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(tokens[1][3]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'entity.name.type.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][4]).toEqual value: 'Two', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(tokens[1][5]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'entity.name.type.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][6]).toEqual value: 'Three', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(tokens[1][7]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php']
      expect(tokens[1][8]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'punctuation.definition.namespace.begin.bracket.curly.php']
      expect(tokens[2][1]).toEqual value: '//', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'comment.line.double-slash.php', 'punctuation.definition.comment.php']
      expect(tokens[3][0]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'punctuation.definition.namespace.end.bracket.curly.php']

      tokens = grammar.tokenizeLines """<?php
        namespace One\\Two\\Three
        {
          // code
        }
      """

      expect(tokens[1][0]).toEqual value: 'namespace', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'keyword.other.namespace.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php']
      expect(tokens[1][2]).toEqual value: 'One', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(tokens[1][3]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'entity.name.type.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][4]).toEqual value: 'Two', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(tokens[1][5]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'entity.name.type.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][6]).toEqual value: 'Three', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(tokens[2][0]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'punctuation.definition.namespace.begin.bracket.curly.php']
      expect(tokens[3][1]).toEqual value: '//', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'comment.line.double-slash.php', 'punctuation.definition.comment.php']
      expect(tokens[4][0]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'punctuation.definition.namespace.end.bracket.curly.php']

    it 'tokenizes global namespaces', ->
      tokens = grammar.tokenizeLines """<?php
        namespace {
          // code
        }
      """

      expect(tokens[1][0]).toEqual value: 'namespace', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'keyword.other.namespace.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php']
      expect(tokens[1][2]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'punctuation.definition.namespace.begin.bracket.curly.php']
      expect(tokens[2][1]).toEqual value: '//', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'comment.line.double-slash.php', 'punctuation.definition.comment.php']
      expect(tokens[3][0]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'punctuation.definition.namespace.end.bracket.curly.php']

      tokens = grammar.tokenizeLines """<?php
        namespace
        {
          // code
        }
      """

      expect(tokens[1][0]).toEqual value: 'namespace', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'keyword.other.namespace.php']
      expect(tokens[2][0]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'punctuation.definition.namespace.begin.bracket.curly.php']
      expect(tokens[3][1]).toEqual value: '//', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'comment.line.double-slash.php', 'punctuation.definition.comment.php']
      expect(tokens[4][0]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.namespace.php', 'punctuation.definition.namespace.end.bracket.curly.php']

  describe 'using namespaces', ->
    it 'tokenizes basic use statements', ->
      tokens = grammar.tokenizeLines "<?php\nuse ArrayObject;"

      expect(tokens[1][0]).toEqual value: 'use', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'keyword.other.use.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php']
      expect(tokens[1][2]).toEqual value: 'ArrayObject', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.class.builtin.php']
      expect(tokens[1][3]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

      tokens = grammar.tokenizeLines "<?php\nuse My\\Full\\NSname;"

      expect(tokens[1][0]).toEqual value: 'use', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'keyword.other.use.php']
      expect(tokens[1][2]).toEqual value: 'My', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[1][3]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][4]).toEqual value: 'Full', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[1][5]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][6]).toEqual value: 'NSname', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.class.php']
      expect(tokens[1][7]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

    it 'tokenizes multiline use statements', ->
      tokens = grammar.tokenizeLines """
        <?php
          use One\\Two,
              Three\\Four;
      """

      expect(tokens[1][1]).toEqual value: 'use', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'keyword.other.use.php']
      expect(tokens[1][3]).toEqual value: 'One', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[1][4]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][5]).toEqual value: 'Two', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.class.php']
      expect(tokens[1][6]).toEqual value: ',', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'punctuation.separator.delimiter.php']
      expect(tokens[2][1]).toEqual value: 'Three', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[2][2]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[2][3]).toEqual value: 'Four', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.class.php']
      expect(tokens[2][4]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

    it 'tokenizes use function statements', ->
      tokens = grammar.tokenizeLines "<?php\nuse function My\\Full\\functionName;"

      expect(tokens[1][0]).toEqual value: 'use', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'keyword.other.use.php']
      expect(tokens[1][2]).toEqual value: 'function', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'storage.type.function.php']
      expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php']
      expect(tokens[1][4]).toEqual value: 'My', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[1][5]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][6]).toEqual value: 'Full', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[1][7]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][8]).toEqual value: 'functionName', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.class.php']
      expect(tokens[1][9]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

    it 'tokenizes use const statements', ->
      tokens = grammar.tokenizeLines "<?php\nuse const My\\Full\\CONSTANT;"

      expect(tokens[1][0]).toEqual value: 'use', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'keyword.other.use.php']
      expect(tokens[1][2]).toEqual value: 'const', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'storage.type.const.php']
      expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php']
      expect(tokens[1][4]).toEqual value: 'My', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[1][5]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][6]).toEqual value: 'Full', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[1][7]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][8]).toEqual value: 'CONSTANT', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.class.php']
      expect(tokens[1][9]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

    it 'tokenizes use-as statements', ->
      tokens = grammar.tokenizeLines "<?php\nuse My\\Full\\Classname as Another;"

      expect(tokens[1][0]).toEqual value: 'use', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'keyword.other.use.php']
      expect(tokens[1][2]).toEqual value: 'My', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[1][3]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][4]).toEqual value: 'Full', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[1][5]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][6]).toEqual value: 'Classname', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.class.php']
      expect(tokens[1][7]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php']
      expect(tokens[1][8]).toEqual value: 'as', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'keyword.other.use-as.php']
      expect(tokens[1][9]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php']
      expect(tokens[1][10]).toEqual value: 'Another', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'entity.other.alias.php']
      expect(tokens[1][11]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

    it 'tokenizes multiple combined use statements', ->
      tokens = grammar.tokenizeLines "<?php\nuse My\\Full\\Classname as Another, My\\Full\\NSname;"

      expect(tokens[1][0]).toEqual value: 'use', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'keyword.other.use.php']
      expect(tokens[1][2]).toEqual value: 'My', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[1][3]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][4]).toEqual value: 'Full', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[1][5]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][6]).toEqual value: 'Classname', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.class.php']
      expect(tokens[1][8]).toEqual value: 'as', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'keyword.other.use-as.php']
      expect(tokens[1][10]).toEqual value: 'Another', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'entity.other.alias.php']
      expect(tokens[1][11]).toEqual value: ',', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'punctuation.separator.delimiter.php']
      expect(tokens[1][12]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php']
      expect(tokens[1][13]).toEqual value: 'My', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[1][14]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][15]).toEqual value: 'Full', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[1][16]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][17]).toEqual value: 'NSname', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.class.php']
      expect(tokens[1][18]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

    it 'tokenizes grouped use statements', ->
      tokens = grammar.tokenizeLines """<?php
        use some\\namespace\\{
          ClassA,
          ClassB,
          ClassC as C
        };
      """

      expect(tokens[1][0]).toEqual value: 'use', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'keyword.other.use.php']
      expect(tokens[1][2]).toEqual value: 'some', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[1][3]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][4]).toEqual value: 'namespace', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[1][5]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][6]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'punctuation.definition.use.begin.bracket.curly.php']
      expect(tokens[2][1]).toEqual value: 'ClassA', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.class.php']
      expect(tokens[2][2]).toEqual value: ',', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'punctuation.separator.delimiter.php']
      expect(tokens[3][1]).toEqual value: 'ClassB', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.class.php']
      expect(tokens[3][2]).toEqual value: ',', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'punctuation.separator.delimiter.php']
      expect(tokens[4][1]).toEqual value: 'ClassC', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.class.php']
      expect(tokens[4][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php']
      expect(tokens[4][3]).toEqual value: 'as', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'keyword.other.use-as.php']
      expect(tokens[4][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php']
      expect(tokens[4][5]).toEqual value: 'C', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'entity.other.alias.php']
      expect(tokens[5][0]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'punctuation.definition.use.end.bracket.curly.php']
      expect(tokens[5][1]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

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

        tokens = grammar.tokenizeLines """
          <?php
          class Test {
            use A\\B;
          }
        """

        expect(tokens[2][1]).toEqual value: 'use', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'keyword.other.use.php']
        expect(tokens[2][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(tokens[2][3]).toEqual value: 'A', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.other.namespace.php']
        expect(tokens[2][4]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
        expect(tokens[2][5]).toEqual value: 'B', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.class.php']
        expect(tokens[2][6]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'punctuation.terminator.expression.php']

      it 'tokenizes multiline use statements', ->
        tokens = grammar.tokenizeLines """
          <?php
            class Test {
              use One\\Two,
                  Three\\Four;
            }
        """

        expect(tokens[2][1]).toEqual value: 'use', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'keyword.other.use.php']
        expect(tokens[2][3]).toEqual value: 'One', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.other.namespace.php']
        expect(tokens[2][4]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
        expect(tokens[2][5]).toEqual value: 'Two', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.class.php']
        expect(tokens[2][6]).toEqual value: ',', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'punctuation.separator.delimiter.php']
        expect(tokens[3][1]).toEqual value: 'Three', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.other.namespace.php']
        expect(tokens[3][2]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
        expect(tokens[3][3]).toEqual value: 'Four', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.class.php']
        expect(tokens[3][4]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'punctuation.terminator.expression.php']

      it 'tokenizes complex use statements', ->
        tokens = grammar.tokenizeLines """
          <?php
          class Test {
            use A, B {
              B::smallTalk insteadof A;
            }
            /* comment */
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
        expect(tokens[3][1]).toEqual value: 'B', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.class.php']
        expect(tokens[3][2]).toEqual value: '::', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'keyword.operator.class.php']
        expect(tokens[3][3]).toEqual value: 'smallTalk', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'constant.other.class.php']
        expect(tokens[3][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(tokens[3][5]).toEqual value: 'insteadof', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'keyword.other.use-insteadof.php']
        expect(tokens[3][6]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(tokens[3][7]).toEqual value: 'A', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.class.php']
        expect(tokens[3][8]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'punctuation.terminator.expression.php']
        expect(tokens[4][1]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'punctuation.definition.use.end.bracket.curly.php']
        expect(tokens[5][1]).toEqual value: '/*', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'comment.block.php', 'punctuation.definition.comment.php']

      it 'tokenizes aliases', ->
        tokens = grammar.tokenizeLines """
          <?php
          class Aliased_Talker {
              use A, B {
                  B::smallTalk as private talk;
              }
          }
        """

        expect(tokens[3][1]).toEqual value: 'B', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.class.php']
        expect(tokens[3][2]).toEqual value: '::', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'keyword.operator.class.php']
        expect(tokens[3][3]).toEqual value: 'smallTalk', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'constant.other.class.php']
        expect(tokens[3][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(tokens[3][5]).toEqual value: 'as', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'keyword.other.use-as.php']
        expect(tokens[3][6]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(tokens[3][7]).toEqual value: 'private', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'storage.modifier.php']
        expect(tokens[3][8]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(tokens[3][9]).toEqual value: 'talk', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'entity.other.alias.php']
        expect(tokens[3][10]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'punctuation.terminator.expression.php']
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

        expect(tokens[3][1]).toEqual value: 'B', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.class.php']
        expect(tokens[3][2]).toEqual value: '::', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'keyword.operator.class.php']
        expect(tokens[3][3]).toEqual value: 'smallTalk', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'constant.other.class.php']
        expect(tokens[3][4]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(tokens[3][5]).toEqual value: 'as', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'keyword.other.use-as.php']
        expect(tokens[3][6]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(tokens[3][7]).toEqual value: 'talk', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'entity.other.alias.php']
        expect(tokens[3][8]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'punctuation.terminator.expression.php']
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
      expect(tokens[1][16]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.begin.bracket.curly.php']
      expect(tokens[1][17]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.end.bracket.curly.php']

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
      expect(tokens[1][15]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.begin.bracket.curly.php']
      expect(tokens[1][16]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.end.bracket.curly.php']

    it 'tokenizes a non-empty array', ->
      tokens = grammar.tokenizeLines "<?php\nfunction not_empty_array_test(array $value = [1,2,'3']) {}"

      expect(tokens[1][11]).toEqual value: '[', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'punctuation.section.array.begin.php']
      expect(tokens[1][12]).toEqual value: '1', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'constant.numeric.decimal.php']
      expect(tokens[1][13]).toEqual value: ',', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php']
      expect(tokens[1][14]).toEqual value: '2', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'constant.numeric.decimal.php']
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
      expect(tokens[1][15]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.begin.bracket.curly.php']
      expect(tokens[1][16]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.end.bracket.curly.php']

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
      # Char 160 is hex0xA0, which is between 0x7F and 0xFF, making it a valid PHP identifier
      functionName = "foo#{String.fromCharCode 160}bar"
      tokens = grammar.tokenizeLines "<?php\nfunction #{functionName}() {}"

      expect(tokens[1][0]).toEqual value: 'function', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'storage.type.function.php']
      expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php']
      expect(tokens[1][2]).toEqual value: functionName, scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'entity.name.function.php']
      expect(tokens[1][3]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.begin.bracket.round.php']
      expect(tokens[1][4]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.end.bracket.round.php']
      expect(tokens[1][5]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
      expect(tokens[1][6]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.begin.bracket.curly.php']
      expect(tokens[1][7]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.end.bracket.curly.php']

  describe 'function calls', ->
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
      expect(tokens[1][2]).toEqual value: '5', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'constant.numeric.decimal.php']
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
      expect(tokens[1][3]).toEqual value: '5', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'constant.numeric.decimal.php']
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

    it 'tokenizes root-namespaced function calls', ->
      tokens = grammar.tokenizeLines "<?php\n\\test()"

      expect(tokens[1][0]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][1]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'entity.name.function.php']

    it 'tokenizes user-namespaced function calls', ->
      tokens = grammar.tokenizeLines "<?php\nhello\\test()"

      expect(tokens[1][0]).toEqual value: 'hello', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'support.other.namespace.php']
      expect(tokens[1][1]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][2]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'entity.name.function.php']

      tokens = grammar.tokenizeLines "<?php\none\\two\\test()"

      expect(tokens[1][0]).toEqual value: 'one', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'support.other.namespace.php']
      expect(tokens[1][1]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][2]).toEqual value: 'two', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'support.other.namespace.php']
      expect(tokens[1][3]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][4]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'entity.name.function.php']

    it 'tokenizes absolutely-namespaced function calls', ->
      tokens = grammar.tokenizeLines "<?php\n\\hello\\test()"

      expect(tokens[1][0]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][1]).toEqual value: 'hello', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'support.other.namespace.php']
      expect(tokens[1][2]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][3]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'entity.name.function.php']

      tokens = grammar.tokenizeLines "<?php\n\\one\\two\\test()"

      expect(tokens[1][0]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][1]).toEqual value: 'one', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'support.other.namespace.php']
      expect(tokens[1][2]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][3]).toEqual value: 'two', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'support.other.namespace.php']
      expect(tokens[1][4]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1][5]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'entity.name.function.php']

    it 'does not treat user-namespaced functions as builtins', ->
      tokens = grammar.tokenizeLines "<?php\nhello\\apc_store()"

      expect(tokens[1][2]).toEqual value: 'apc_store', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'entity.name.function.php']

      tokens = grammar.tokenizeLines "<?php\n\\hello\\apc_store()"

      expect(tokens[1][3]).toEqual value: 'apc_store', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function-call.php', 'entity.name.function.php']

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
      expect(tokens[1][4]).toEqual value: '5', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php', 'constant.numeric.decimal.php']
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
      expect(tokens[1][5]).toEqual value: '5', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.php', 'constant.numeric.decimal.php']
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
      expect(tokens[1][4]).toEqual value: '5', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'constant.numeric.decimal.php']
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
      expect(tokens[1][7]).toEqual value: '5', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.method-call.static.php', 'constant.numeric.decimal.php']
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
      expect(tokens[1][2]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.begin.bracket.curly.php']
      expect(tokens[1][3]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.end.bracket.curly.php']
      expect(tokens[1][5]).toEqual value: 'catch', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'keyword.control.exception.catch.php']
      expect(tokens[1][6]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'punctuation.definition.parameters.begin.bracket.round.php']
      expect(tokens[1][7]).toEqual value: 'Exception', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'support.class.exception.php']
      expect(tokens[1][8]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php']
      expect(tokens[1][9]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[1][10]).toEqual value: 'e', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'variable.other.php']
      expect(tokens[1][11]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'punctuation.definition.parameters.end.bracket.round.php']
      expect(tokens[1][13]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.begin.bracket.curly.php']
      expect(tokens[1][14]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.end.bracket.curly.php']

      tokens = grammar.tokenizeLines "<?php\ntry {} catch (Exception $e) {}"

      expect(tokens[1][0]).toEqual value: 'try', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.control.exception.php']
      expect(tokens[1][2]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.begin.bracket.curly.php']
      expect(tokens[1][3]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.end.bracket.curly.php']
      expect(tokens[1][5]).toEqual value: 'catch', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'keyword.control.exception.catch.php']
      expect(tokens[1][6]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php']
      expect(tokens[1][7]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'punctuation.definition.parameters.begin.bracket.round.php']
      expect(tokens[1][8]).toEqual value: 'Exception', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'support.class.exception.php']
      expect(tokens[1][9]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php']
      expect(tokens[1][10]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[1][11]).toEqual value: 'e', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'variable.other.php']
      expect(tokens[1][12]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.catch.php', 'punctuation.definition.parameters.end.bracket.round.php']
      expect(tokens[1][14]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.begin.bracket.curly.php']
      expect(tokens[1][15]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.end.bracket.curly.php']

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
      expect(tokens[1][21]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.begin.bracket.curly.php']
      expect(tokens[1][22]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.end.bracket.curly.php']

  describe "numbers", ->
    it "tokenizes hexadecimals", ->
      tokens = grammar.tokenizeLines '<?php\n0x1D306'
      expect(tokens[1][0]).toEqual value: '0x1D306', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.hex.php']

      tokens = grammar.tokenizeLines '<?php\n0X1D306'
      expect(tokens[1][0]).toEqual value: '0X1D306', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.hex.php']

    it "tokenizes binary literals", ->
      tokens = grammar.tokenizeLines '<?php\n0b011101110111010001100110'
      expect(tokens[1][0]).toEqual value: '0b011101110111010001100110', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.binary.php']

      tokens = grammar.tokenizeLines '<?php\n0B011101110111010001100110'
      expect(tokens[1][0]).toEqual value: '0B011101110111010001100110', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.binary.php']

    it "tokenizes octal literals", ->
      tokens = grammar.tokenizeLines '<?php\n01411'
      expect(tokens[1][0]).toEqual value: '01411', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.octal.php']

      tokens = grammar.tokenizeLines '<?php\n0010'
      expect(tokens[1][0]).toEqual value: '0010', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.octal.php']

    it "tokenizes decimals", ->
      tokens = grammar.tokenizeLines '<?php\n1234'
      expect(tokens[1][0]).toEqual value: '1234', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']

      tokens = grammar.tokenizeLines '<?php\n5e-10'
      expect(tokens[1][0]).toEqual value: '5e-10', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']

      tokens = grammar.tokenizeLines '<?php\n5E+5'
      expect(tokens[1][0]).toEqual value: '5E+5', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']

      tokens = grammar.tokenizeLines '<?php\n9.'
      expect(tokens[1][0]).toEqual value: '9', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']
      expect(tokens[1][1]).toEqual value: '.', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php', 'punctuation.separator.decimal.period.php']

      tokens = grammar.tokenizeLines '<?php\n.9'
      expect(tokens[1][0]).toEqual value: '.', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php', 'punctuation.separator.decimal.period.php']
      expect(tokens[1][1]).toEqual value: '9', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']

      tokens = grammar.tokenizeLines '<?php\n9.9'
      expect(tokens[1][0]).toEqual value: '9', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']
      expect(tokens[1][1]).toEqual value: '.', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php', 'punctuation.separator.decimal.period.php']
      expect(tokens[1][2]).toEqual value: '9', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']

      tokens = grammar.tokenizeLines '<?php\n.1e-23'
      expect(tokens[1][0]).toEqual value: '.', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php', 'punctuation.separator.decimal.period.php']
      expect(tokens[1][1]).toEqual value: '1e-23', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']

      tokens = grammar.tokenizeLines '<?php\n1.E3'
      expect(tokens[1][0]).toEqual value: '1', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']
      expect(tokens[1][1]).toEqual value: '.', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php', 'punctuation.separator.decimal.period.php']
      expect(tokens[1][2]).toEqual value: 'E3', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'constant.numeric.decimal.php']

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
    expect(tokens[4][1]).toEqual value: 'return', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php', 'keyword.control.return.php']
    expect(tokens[5][1]).toEqual value: 'case', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php', 'keyword.control.case.php']
    expect(tokens[5][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php']
    expect(tokens[5][3]).toEqual value: '1', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php', 'constant.numeric.decimal.php']
    expect(tokens[5][4]).toEqual value: ':', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php', 'punctuation.terminator.statement.php']
    expect(tokens[6][1]).toEqual value: 'break', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php', 'keyword.control.break.php']
    expect(tokens[7][1]).toEqual value: 'default', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php', 'keyword.control.default.php']
    expect(tokens[7][2]).toEqual value: ':', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php', 'punctuation.terminator.statement.php']
    expect(tokens[8][1]).toEqual value: 'continue', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.switch-statement.php', 'keyword.control.continue.php']
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

  describe 'PHPDoc', ->
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

    describe 'types', ->
      it 'should tokenize a single type', ->
        tokens = grammar.tokenizeLines "<?php\n/**\n*@param int description"

        expect(tokens[2][1]).toEqual value: '@param', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
        expect(tokens[2][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']
        expect(tokens[2][3]).toEqual value: 'int', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.type.php']
        expect(tokens[2][4]).toEqual value: ' description', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']

        tokens = grammar.tokenizeLines "<?php\n/**\n*@param Test description"

        expect(tokens[2][1]).toEqual value: '@param', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
        expect(tokens[2][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']
        expect(tokens[2][3]).toEqual value: 'Test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.class.php']
        expect(tokens[2][4]).toEqual value: ' description', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']

      it 'should tokenize a single namespaced type', ->
        tokens = grammar.tokenizeLines "<?php\n/**\n*@param \\Test\\Type description"

        expect(tokens[2][1]).toEqual value: '@param', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
        expect(tokens[2][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']
        expect(tokens[2][3]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
        expect(tokens[2][4]).toEqual value: 'Test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.other.namespace.php']
        expect(tokens[2][5]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
        expect(tokens[2][6]).toEqual value: 'Type', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.class.php']
        expect(tokens[2][7]).toEqual value: ' description', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']

      it 'should tokenize multiple types', ->
        tokens = grammar.tokenizeLines "<?php\n/**\n*@param int|Class description"

        expect(tokens[2][1]).toEqual value: '@param', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
        expect(tokens[2][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']
        expect(tokens[2][3]).toEqual value: 'int', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.type.php']
        expect(tokens[2][4]).toEqual value: '|', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'punctuation.separator.delimiter.php']
        expect(tokens[2][5]).toEqual value: 'Class', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.class.php']
        expect(tokens[2][6]).toEqual value: ' description', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']

      it 'should tokenize multiple namespaced types', ->
        tokens = grammar.tokenizeLines "<?php\n/**\n*@param Test\\One|\\Another\\Root description"

        expect(tokens[2][1]).toEqual value: '@param', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
        expect(tokens[2][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']
        expect(tokens[2][3]).toEqual value: 'Test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.other.namespace.php']
        expect(tokens[2][4]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
        expect(tokens[2][5]).toEqual value: 'One', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.class.php']
        expect(tokens[2][6]).toEqual value: '|', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'punctuation.separator.delimiter.php']
        expect(tokens[2][7]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
        expect(tokens[2][8]).toEqual value: 'Another', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.other.namespace.php']
        expect(tokens[2][9]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
        expect(tokens[2][10]).toEqual value: 'Root', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.class.php']
        expect(tokens[2][11]).toEqual value: ' description', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']

      it 'should tokenize a single array type', ->
        tokens = grammar.tokenizeLines "<?php\n/**\n*@param int[] description"

        expect(tokens[2][1]).toEqual value: '@param', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
        expect(tokens[2][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']
        expect(tokens[2][3]).toEqual value: 'int', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.type.php']
        expect(tokens[2][4]).toEqual value: '[]', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.array.phpdoc.php']
        expect(tokens[2][5]).toEqual value: ' description', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']

        tokens = grammar.tokenizeLines "<?php\n/**\n*@param Test[] description"

        expect(tokens[2][1]).toEqual value: '@param', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
        expect(tokens[2][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']
        expect(tokens[2][3]).toEqual value: 'Test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.class.php']
        expect(tokens[2][4]).toEqual value: '[]', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.array.phpdoc.php']
        expect(tokens[2][5]).toEqual value: ' description', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']

      it 'should tokenize a single namespaced array type', ->
        tokens = grammar.tokenizeLines "<?php\n/**\n*@param Test\\Type[] description"

        expect(tokens[2][1]).toEqual value: '@param', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
        expect(tokens[2][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']
        expect(tokens[2][3]).toEqual value: 'Test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.other.namespace.php']
        expect(tokens[2][4]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
        expect(tokens[2][5]).toEqual value: 'Type', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.class.php']
        expect(tokens[2][6]).toEqual value: '[]', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.array.phpdoc.php']
        expect(tokens[2][7]).toEqual value: ' description', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']

      it 'should tokenize multiple array types', ->
        tokens = grammar.tokenizeLines "<?php\n/**\n*@param (int|Class)[] description"

        expect(tokens[2][1]).toEqual value: '@param', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
        expect(tokens[2][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']
        expect(tokens[2][3]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'punctuation.definition.type.begin.bracket.round.phpdoc.php']
        expect(tokens[2][4]).toEqual value: 'int', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.type.php']
        expect(tokens[2][5]).toEqual value: '|', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'punctuation.separator.delimiter.php']
        expect(tokens[2][6]).toEqual value: 'Class', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.class.php']
        expect(tokens[2][7]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'punctuation.definition.type.end.bracket.round.phpdoc.php']
        expect(tokens[2][8]).toEqual value: '[]', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.array.phpdoc.php']

        tokens = grammar.tokenizeLines "<?php\n/**\n*@param ((Test|int)[]|Test\\Type[]|string[]|resource)[] description"

        expect(tokens[2][1]).toEqual value: '@param', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
        expect(tokens[2][2]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']
        expect(tokens[2][3]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'punctuation.definition.type.begin.bracket.round.phpdoc.php']
        expect(tokens[2][4]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'punctuation.definition.type.begin.bracket.round.phpdoc.php']
        expect(tokens[2][5]).toEqual value: 'Test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.class.php']
        expect(tokens[2][6]).toEqual value: '|', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'punctuation.separator.delimiter.php']
        expect(tokens[2][7]).toEqual value: 'int', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.type.php']
        expect(tokens[2][8]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'punctuation.definition.type.end.bracket.round.phpdoc.php']
        expect(tokens[2][9]).toEqual value: '[]', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.array.phpdoc.php']
        expect(tokens[2][10]).toEqual value: '|', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'punctuation.separator.delimiter.php']
        expect(tokens[2][11]).toEqual value: 'Test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.other.namespace.php']
        expect(tokens[2][12]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
        expect(tokens[2][13]).toEqual value: 'Type', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.class.php']
        expect(tokens[2][14]).toEqual value: '[]', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.array.phpdoc.php']
        expect(tokens[2][15]).toEqual value: '|', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'punctuation.separator.delimiter.php']
        expect(tokens[2][16]).toEqual value: 'string', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.type.php']
        expect(tokens[2][17]).toEqual value: '[]', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.array.phpdoc.php']
        expect(tokens[2][18]).toEqual value: '|', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'punctuation.separator.delimiter.php']
        expect(tokens[2][19]).toEqual value: 'resource', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.type.php']
        expect(tokens[2][20]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'punctuation.definition.type.end.bracket.round.phpdoc.php']
        expect(tokens[2][21]).toEqual value: '[]', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.array.phpdoc.php']
        expect(tokens[2][22]).toEqual value: ' description', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php']

      it 'should end the PHPDoc at the ending comment even if there are malformed types', ->
        tokens = grammar.tokenizeLines "<?php\n/** @var array(string) */"

        expect(tokens[1][8]).toEqual value: '*/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']

    it 'should not tokenize /*** as phpdoc', ->
      tokens = grammar.tokenizeLines "<?php\n/*** @var */"

      expect(tokens[1][0].scopes).not.toContain 'comment.block.documentation.phpdoc.php'

    it 'should tokenize malformed phpDocumentor DocBlock line that contains closing tag correctly', ->
      tokens = grammar.tokenizeLines "<?php\n/**\ninvalid*/$a=1;"

      expect(tokens[1][0]).toEqual value: '/**', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']
      expect(tokens[2][0]).toEqual value: 'invalid', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'invalid.illegal.missing-asterisk.phpdoc.php']
      expect(tokens[2][1]).toEqual value: '*/', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']
      expect(tokens[2][2]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']

  describe 'string escape sequences', ->
    it 'tokenizes escaped octal sequences', ->
      tokens = grammar.tokenizeLines "<?php\n\"test \\007 test\";"

      expect(tokens[1][0]).toEqual value: '"', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php', 'punctuation.definition.string.begin.php']
      expect(tokens[1][1]).toEqual value: 'test ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php']
      expect(tokens[1][2]).toEqual value: '\\007', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php', 'constant.character.escape.octal.php']
      expect(tokens[1][3]).toEqual value: ' test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php']
      expect(tokens[1][4]).toEqual value: '"', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php', 'punctuation.definition.string.end.php']
      expect(tokens[1][5]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

    it 'tokenizes escaped hex sequences', ->
      tokens = grammar.tokenizeLines "<?php\n\"test \\x0f test\";"

      expect(tokens[1][0]).toEqual value: '"', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php', 'punctuation.definition.string.begin.php']
      expect(tokens[1][1]).toEqual value: 'test ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php']
      expect(tokens[1][2]).toEqual value: '\\x0f', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php', 'constant.character.escape.hex.php']
      expect(tokens[1][3]).toEqual value: ' test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php']
      expect(tokens[1][4]).toEqual value: '"', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php', 'punctuation.definition.string.end.php']
      expect(tokens[1][5]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

    it 'tokenizes escaped unicode sequences', ->
      tokens = grammar.tokenizeLines "<?php\n\"test \\u{00A0} test\";"

      expect(tokens[1][0]).toEqual value: '"', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php', 'punctuation.definition.string.begin.php']
      expect(tokens[1][1]).toEqual value: 'test ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php']
      expect(tokens[1][2]).toEqual value: '\\u{00A0}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php', 'constant.character.escape.unicode.php']
      expect(tokens[1][3]).toEqual value: ' test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php']
      expect(tokens[1][4]).toEqual value: '"', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php', 'punctuation.definition.string.end.php']
      expect(tokens[1][5]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

    for escapeCharacter in ['n', 'r', 't', 'v', 'e', 'f', '$', '"', '\\']
      it "tokenizes #{escapeCharacter} as an escape character", ->
        tokens = grammar.tokenizeLines "<?php\n\"test \\#{escapeCharacter} test\";"

        expect(tokens[1][0]).toEqual value: '"', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php', 'punctuation.definition.string.begin.php']
        expect(tokens[1][1]).toEqual value: 'test ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php']
        expect(tokens[1][2]).toEqual value: "\\#{escapeCharacter}", scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.quoted.double.php', 'constant.character.escape.php']
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
    expect(tokens[1][11]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.begin.bracket.curly.php']
    expect(tokens[1][12]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.end.bracket.curly.php']

  it 'should tokenize trait correctly', ->
    tokens = grammar.tokenizeLines "<?php\ntrait Test {}"

    expect(tokens[1][0]).toEqual value: 'trait', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.trait.php', 'storage.type.trait.php']
    expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.trait.php']
    expect(tokens[1][2]).toEqual value: 'Test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.trait.php', 'entity.name.type.trait.php']
    expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.trait.php']
    expect(tokens[1][4]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.begin.bracket.curly.php']
    expect(tokens[1][5]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.end.bracket.curly.php']

  it 'should tokenize use const correctly', ->
    tokens = grammar.tokenizeLines "<?php\nuse const Test\\Test\\CONSTANT;"

    expect(tokens[1][0]).toEqual value: 'use', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'keyword.other.use.php']
    expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php']
    expect(tokens[1][2]).toEqual value: 'const', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'storage.type.const.php']
    expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php']
    expect(tokens[1][4]).toEqual value: 'Test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php']
    expect(tokens[1][5]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
    expect(tokens[1][6]).toEqual value: 'Test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php']
    expect(tokens[1][7]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
    expect(tokens[1][8]).toEqual value: 'CONSTANT', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.class.php']
    expect(tokens[1][9]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize use function correctly', ->
    tokens = grammar.tokenizeLines "<?php\nuse function A\\B\\fun as func;"

    expect(tokens[1][0]).toEqual value: 'use', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'keyword.other.use.php']
    expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php']
    expect(tokens[1][2]).toEqual value: 'function', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'storage.type.function.php']
    expect(tokens[1][3]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php']
    expect(tokens[1][4]).toEqual value: 'A', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php']
    expect(tokens[1][5]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
    expect(tokens[1][6]).toEqual value: 'B', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php']
    expect(tokens[1][7]).toEqual value: '\\', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
    expect(tokens[1][8]).toEqual value: 'fun', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'support.class.php']
    expect(tokens[1][9]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php']
    expect(tokens[1][10]).toEqual value: 'as', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'keyword.other.use-as.php']
    expect(tokens[1][11]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php']
    expect(tokens[1][12]).toEqual value: 'func', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.use.php', 'entity.other.alias.php']
    expect(tokens[1][13]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize yield correctly', ->
    tokens = grammar.tokenizeLines "<?php\nfunction test() { yield $a; }"

    expect(tokens[1][0]).toEqual value: 'function', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'storage.type.function.php']
    expect(tokens[1][1]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php']
    expect(tokens[1][2]).toEqual value: 'test', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'entity.name.function.php']
    expect(tokens[1][3]).toEqual value: '(', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.begin.bracket.round.php']
    expect(tokens[1][4]).toEqual value: ')', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.function.php', 'punctuation.definition.parameters.end.bracket.round.php']
    expect(tokens[1][5]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][6]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.begin.bracket.curly.php']
    expect(tokens[1][7]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][8]).toEqual value: 'yield', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'keyword.control.yield.php']
    expect(tokens[1][9]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][10]).toEqual value: '$', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(tokens[1][11]).toEqual value: 'a', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'variable.other.php']
    expect(tokens[1][12]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']
    expect(tokens[1][13]).toEqual value: ' ', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php']
    expect(tokens[1][14]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.end.bracket.curly.php']

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
    expect(tokens[1][9]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.begin.bracket.curly.php']
    expect(tokens[1][10]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.end.bracket.curly.php']
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

    tokens = grammar.tokenizeLines """
      <?php
      $a = <<<HEREDOC
      I am a heredoc
      HEREDOC
      ;
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
    expect(tokens[4][0]).toEqual value: ';', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.terminator.expression.php']

  it 'does not match incorrect heredoc terminators', ->
    tokens = grammar.tokenizeLines """
      <?php
      $a = <<<HEREDOC
      I am a heredoc
      HEREDOC ;
    """
    expect(tokens[3][0]).toEqual value: 'HEREDOC ;', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php']

    tokens = grammar.tokenizeLines """
      <?php
      $a = <<<HEREDOC
      I am a heredoc
      HEREDOC; // comment
    """
    expect(tokens[3][0]).toEqual value: 'HEREDOC; // comment', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'string.unquoted.heredoc.php']

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
    it 'tokenizes brackets', ->
      tokens = grammar.tokenizeLines "<?php\n{}"

      expect(tokens[1][0]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.begin.bracket.curly.php']
      expect(tokens[1][1]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.end.bracket.curly.php']

      tokens = grammar.tokenizeLines "<?php\n{/* stuff */}"

      expect(tokens[1][0]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.begin.bracket.curly.php']
      expect(tokens[1][4]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'punctuation.definition.end.bracket.curly.php']

      # Make sure that nested brackets close correctly
      tokens = grammar.tokenizeLines """
        <?php
        class Test {
          {}
        }
      """

      expect(tokens[1][4]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'punctuation.definition.class.begin.bracket.curly.php']
      expect(tokens[2][1]).toEqual value: '{', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'punctuation.definition.begin.bracket.curly.php']
      expect(tokens[2][2]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'meta.class.body.php', 'punctuation.definition.end.bracket.curly.php']
      expect(tokens[3][0]).toEqual value: '}', scopes: ['text.html.php', 'meta.embedded.block.php', 'source.php', 'meta.class.php', 'punctuation.definition.class.end.bracket.curly.php']

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
