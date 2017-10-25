describe 'PHP grammar', ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage 'language-php'

    runs ->
      grammar = atom.grammars.grammarForScopeName 'source.php'
      @addMatchers
        toContainAll: (arr) ->
          arr.every (el) =>
            @actual.includes el

  it 'parses the grammar', ->
    expect(grammar).toBeTruthy()
    expect(grammar.scopeName).toBe 'source.php'

  describe 'operators', ->
    it 'should tokenize = correctly', ->
      {tokens} = grammar.tokenizeLine '$test = 2;'

      expect(tokens[0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[2]).toEqual value: ' ', scopes: ['source.php']
      expect(tokens[3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
      expect(tokens[4]).toEqual value: ' ', scopes: ['source.php']
      expect(tokens[5]).toEqual value: '2', scopes: ['source.php', 'constant.numeric.decimal.php']
      expect(tokens[6]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

    it 'should tokenize + correctly', ->
      {tokens} = grammar.tokenizeLine '1 + 2;'

      expect(tokens[0]).toEqual value: '1', scopes: ['source.php', 'constant.numeric.decimal.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php']
      expect(tokens[2]).toEqual value: '+', scopes: ['source.php', 'keyword.operator.arithmetic.php']
      expect(tokens[3]).toEqual value: ' ', scopes: ['source.php']
      expect(tokens[4]).toEqual value: '2', scopes: ['source.php', 'constant.numeric.decimal.php']
      expect(tokens[5]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

    it 'should tokenize - correctly', ->
      {tokens} = grammar.tokenizeLine '1 - 2;'

      expect(tokens[0]).toEqual value: '1', scopes: ['source.php', 'constant.numeric.decimal.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php']
      expect(tokens[2]).toEqual value: '-', scopes: ['source.php', 'keyword.operator.arithmetic.php']
      expect(tokens[3]).toEqual value: ' ', scopes: ['source.php']
      expect(tokens[4]).toEqual value: '2', scopes: ['source.php', 'constant.numeric.decimal.php']
      expect(tokens[5]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

    it 'should tokenize * correctly', ->
      {tokens} = grammar.tokenizeLine '1 * 2;'

      expect(tokens[0]).toEqual value: '1', scopes: ['source.php', 'constant.numeric.decimal.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php']
      expect(tokens[2]).toEqual value: '*', scopes: ['source.php', 'keyword.operator.arithmetic.php']
      expect(tokens[3]).toEqual value: ' ', scopes: ['source.php']
      expect(tokens[4]).toEqual value: '2', scopes: ['source.php', 'constant.numeric.decimal.php']
      expect(tokens[5]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

    it 'should tokenize / correctly', ->
      {tokens} = grammar.tokenizeLine '1 / 2;'

      expect(tokens[0]).toEqual value: '1', scopes: ['source.php', 'constant.numeric.decimal.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php']
      expect(tokens[2]).toEqual value: '/', scopes: ['source.php', 'keyword.operator.arithmetic.php']
      expect(tokens[3]).toEqual value: ' ', scopes: ['source.php']
      expect(tokens[4]).toEqual value: '2', scopes: ['source.php', 'constant.numeric.decimal.php']
      expect(tokens[5]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

    it 'should tokenize % correctly', ->
      {tokens} = grammar.tokenizeLine '1 % 2;'

      expect(tokens[0]).toEqual value: '1', scopes: ['source.php', 'constant.numeric.decimal.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php']
      expect(tokens[2]).toEqual value: '%', scopes: ['source.php', 'keyword.operator.arithmetic.php']
      expect(tokens[3]).toEqual value: ' ', scopes: ['source.php']
      expect(tokens[4]).toEqual value: '2', scopes: ['source.php', 'constant.numeric.decimal.php']
      expect(tokens[5]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

    describe 'combined operators', ->
      it 'should tokenize === correctly', ->
        {tokens} = grammar.tokenizeLine '$test === 2;'

        expect(tokens[0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1]).toEqual value: 'test', scopes: ['source.php', 'variable.other.php']
        expect(tokens[2]).toEqual value: ' ', scopes: ['source.php']
        expect(tokens[3]).toEqual value: '===', scopes: ['source.php', 'keyword.operator.comparison.php']
        expect(tokens[4]).toEqual value: ' ', scopes: ['source.php']
        expect(tokens[5]).toEqual value: '2', scopes: ['source.php', 'constant.numeric.decimal.php']
        expect(tokens[6]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize += correctly', ->
        {tokens} = grammar.tokenizeLine '$test += 2;'

        expect(tokens[0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1]).toEqual value: 'test', scopes: ['source.php', 'variable.other.php']
        expect(tokens[2]).toEqual value: ' ', scopes: ['source.php']
        expect(tokens[3]).toEqual value: '+=', scopes: ['source.php', 'keyword.operator.assignment.php']
        expect(tokens[4]).toEqual value: ' ', scopes: ['source.php']
        expect(tokens[5]).toEqual value: '2', scopes: ['source.php', 'constant.numeric.decimal.php']
        expect(tokens[6]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize -= correctly', ->
        {tokens} = grammar.tokenizeLine '$test -= 2;'

        expect(tokens[0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1]).toEqual value: 'test', scopes: ['source.php', 'variable.other.php']
        expect(tokens[2]).toEqual value: ' ', scopes: ['source.php']
        expect(tokens[3]).toEqual value: '-=', scopes: ['source.php', 'keyword.operator.assignment.php']
        expect(tokens[4]).toEqual value: ' ', scopes: ['source.php']
        expect(tokens[5]).toEqual value: '2', scopes: ['source.php', 'constant.numeric.decimal.php']
        expect(tokens[6]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize *= correctly', ->
        {tokens} = grammar.tokenizeLine '$test *= 2;'

        expect(tokens[0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1]).toEqual value: 'test', scopes: ['source.php', 'variable.other.php']
        expect(tokens[2]).toEqual value: ' ', scopes: ['source.php']
        expect(tokens[3]).toEqual value: '*=', scopes: ['source.php', 'keyword.operator.assignment.php']
        expect(tokens[4]).toEqual value: ' ', scopes: ['source.php']
        expect(tokens[5]).toEqual value: '2', scopes: ['source.php', 'constant.numeric.decimal.php']
        expect(tokens[6]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize /= correctly', ->
        {tokens} = grammar.tokenizeLine '$test /= 2;'

        expect(tokens[0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1]).toEqual value: 'test', scopes: ['source.php', 'variable.other.php']
        expect(tokens[2]).toEqual value: ' ', scopes: ['source.php']
        expect(tokens[3]).toEqual value: '/=', scopes: ['source.php', 'keyword.operator.assignment.php']
        expect(tokens[4]).toEqual value: ' ', scopes: ['source.php']
        expect(tokens[5]).toEqual value: '2', scopes: ['source.php', 'constant.numeric.decimal.php']
        expect(tokens[6]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize %= correctly', ->
        {tokens} = grammar.tokenizeLine '$test %= 2;'

        expect(tokens[0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1]).toEqual value: 'test', scopes: ['source.php', 'variable.other.php']
        expect(tokens[2]).toEqual value: ' ', scopes: ['source.php']
        expect(tokens[3]).toEqual value: '%=', scopes: ['source.php', 'keyword.operator.assignment.php']
        expect(tokens[4]).toEqual value: ' ', scopes: ['source.php']
        expect(tokens[5]).toEqual value: '2', scopes: ['source.php', 'constant.numeric.decimal.php']
        expect(tokens[6]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize .= correctly', ->
        {tokens} = grammar.tokenizeLine '$test .= 2;'

        expect(tokens[0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1]).toEqual value: 'test', scopes: ['source.php', 'variable.other.php']
        expect(tokens[2]).toEqual value: ' ', scopes: ['source.php']
        expect(tokens[3]).toEqual value: '.=', scopes: ['source.php', 'keyword.operator.string.php']
        expect(tokens[4]).toEqual value: ' ', scopes: ['source.php']
        expect(tokens[5]).toEqual value: '2', scopes: ['source.php', 'constant.numeric.decimal.php']
        expect(tokens[6]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize &= correctly', ->
        {tokens} = grammar.tokenizeLine '$test &= 2;'

        expect(tokens[0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1]).toEqual value: 'test', scopes: ['source.php', 'variable.other.php']
        expect(tokens[2]).toEqual value: ' ', scopes: ['source.php']
        expect(tokens[3]).toEqual value: '&=', scopes: ['source.php', 'keyword.operator.assignment.php']
        expect(tokens[4]).toEqual value: ' ', scopes: ['source.php']
        expect(tokens[5]).toEqual value: '2', scopes: ['source.php', 'constant.numeric.decimal.php']
        expect(tokens[6]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize |= correctly', ->
        {tokens} = grammar.tokenizeLine '$test |= 2;'

        expect(tokens[0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1]).toEqual value: 'test', scopes: ['source.php', 'variable.other.php']
        expect(tokens[2]).toEqual value: ' ', scopes: ['source.php']
        expect(tokens[3]).toEqual value: '|=', scopes: ['source.php', 'keyword.operator.assignment.php']
        expect(tokens[4]).toEqual value: ' ', scopes: ['source.php']
        expect(tokens[5]).toEqual value: '2', scopes: ['source.php', 'constant.numeric.decimal.php']
        expect(tokens[6]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize ^= correctly', ->
        {tokens} = grammar.tokenizeLine '$test ^= 2;'

        expect(tokens[0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1]).toEqual value: 'test', scopes: ['source.php', 'variable.other.php']
        expect(tokens[2]).toEqual value: ' ', scopes: ['source.php']
        expect(tokens[3]).toEqual value: '^=', scopes: ['source.php', 'keyword.operator.assignment.php']
        expect(tokens[4]).toEqual value: ' ', scopes: ['source.php']
        expect(tokens[5]).toEqual value: '2', scopes: ['source.php', 'constant.numeric.decimal.php']
        expect(tokens[6]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize <<= correctly', ->
        {tokens} = grammar.tokenizeLine '$test <<= 2;'

        expect(tokens[0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1]).toEqual value: 'test', scopes: ['source.php', 'variable.other.php']
        expect(tokens[2]).toEqual value: ' ', scopes: ['source.php']
        expect(tokens[3]).toEqual value: '<<=', scopes: ['source.php', 'keyword.operator.assignment.php']
        expect(tokens[4]).toEqual value: ' ', scopes: ['source.php']
        expect(tokens[5]).toEqual value: '2', scopes: ['source.php', 'constant.numeric.decimal.php']
        expect(tokens[6]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize >>= correctly', ->
        {tokens} = grammar.tokenizeLine '$test >>= 2;'

        expect(tokens[0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
        expect(tokens[1]).toEqual value: 'test', scopes: ['source.php', 'variable.other.php']
        expect(tokens[2]).toEqual value: ' ', scopes: ['source.php']
        expect(tokens[3]).toEqual value: '>>=', scopes: ['source.php', 'keyword.operator.assignment.php']
        expect(tokens[4]).toEqual value: ' ', scopes: ['source.php']
        expect(tokens[5]).toEqual value: '2', scopes: ['source.php', 'constant.numeric.decimal.php']
        expect(tokens[6]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

      it 'should tokenize ?? correctly', ->
        {tokens} = grammar.tokenizeLine "$foo = $bar ?? 'bar';"
        expect(tokens[8]).toEqual value: '??', scopes: ['source.php', 'keyword.operator.null-coalescing.php']

      describe 'ternaries', ->
        it 'should tokenize ternary expressions', ->
          {tokens} = grammar.tokenizeLine '$foo = 1 == 3 ? true : false;'
          expect(tokens[11]).toEqual value: '?', scopes: ['source.php', 'keyword.operator.ternary.php']
          expect(tokens[15]).toEqual value: ':', scopes: ['source.php', 'keyword.operator.ternary.php']

          lines = grammar.tokenizeLines '''
            $foo = 1 == 3
            ? true
            : false;
          '''
          expect(lines[1][0]).toEqual value: '?', scopes: ['source.php', 'keyword.operator.ternary.php']
          expect(lines[2][0]).toEqual value: ':', scopes: ['source.php', 'keyword.operator.ternary.php']

          {tokens} = grammar.tokenizeLine '$foo=1==3?true:false;'
          expect(tokens[6]).toEqual value: '?', scopes: ['source.php', 'keyword.operator.ternary.php']
          expect(tokens[8]).toEqual value: ':', scopes: ['source.php', 'keyword.operator.ternary.php']

        it 'should tokenize shorthand ternaries', ->
          {tokens} = grammar.tokenizeLine '$foo = false ?: false ?: true ?: false;'
          expect(tokens[7]).toEqual value: '?:', scopes: ['source.php', 'keyword.operator.ternary.php']
          expect(tokens[11]).toEqual tokens[7]
          expect(tokens[15]).toEqual tokens[7]

        it 'should tokenize a combination of ternaries', ->
          lines = grammar.tokenizeLines '''
            $foo = false ?: true == 1
            ? true : false ?: false;
          '''
          expect(lines[0][7]).toEqual value: '?:', scopes: ['source.php', 'keyword.operator.ternary.php']
          expect(lines[1][0]).toEqual value: '?', scopes: ['source.php', 'keyword.operator.ternary.php']
          expect(lines[1][4]).toEqual value: ':', scopes: ['source.php', 'keyword.operator.ternary.php']
          expect(lines[1][8]).toEqual value: '?:', scopes: ['source.php', 'keyword.operator.ternary.php']

  it 'should tokenize $this', ->
    {tokens} = grammar.tokenizeLine '$this'

    expect(tokens[0]).toEqual value: '$', scopes: ['source.php', 'variable.language.this.php', 'punctuation.definition.variable.php']
    expect(tokens[1]).toEqual value: 'this', scopes: ['source.php', 'variable.language.this.php']

    {tokens} = grammar.tokenizeLine '$thistles'

    expect(tokens[0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(tokens[1]).toEqual value: 'thistles', scopes: ['source.php', 'variable.other.php']

  describe 'declaring namespaces', ->
    it 'tokenizes namespaces', ->
      {tokens} = grammar.tokenizeLine 'namespace Test;'

      expect(tokens[0]).toEqual value: 'namespace', scopes: ['source.php', 'meta.namespace.php', 'keyword.other.namespace.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php', 'meta.namespace.php']
      expect(tokens[2]).toEqual value: 'Test', scopes: ['source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(tokens[3]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

    it 'tokenizes sub-namespaces', ->
      {tokens} = grammar.tokenizeLine 'namespace One\\Two\\Three;'

      expect(tokens[0]).toEqual value: 'namespace', scopes: ['source.php', 'meta.namespace.php', 'keyword.other.namespace.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php', 'meta.namespace.php']
      expect(tokens[2]).toEqual value: 'One', scopes: ['source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(tokens[3]).toEqual value: '\\', scopes: ['source.php', 'meta.namespace.php', 'entity.name.type.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[4]).toEqual value: 'Two', scopes: ['source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(tokens[5]).toEqual value: '\\', scopes: ['source.php', 'meta.namespace.php', 'entity.name.type.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[6]).toEqual value: 'Three', scopes: ['source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(tokens[7]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

    it 'tokenizes bracketed namespaces', ->
      lines = grammar.tokenizeLines '''
        namespace Test {
          // code
        }
      '''

      expect(lines[0][0]).toEqual value: 'namespace', scopes: ['source.php', 'meta.namespace.php', 'keyword.other.namespace.php']
      expect(lines[0][1]).toEqual value: ' ', scopes: ['source.php', 'meta.namespace.php']
      expect(lines[0][2]).toEqual value: 'Test', scopes: ['source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(lines[0][3]).toEqual value: ' ', scopes: ['source.php', 'meta.namespace.php']
      expect(lines[0][4]).toEqual value: '{', scopes: ['source.php', 'meta.namespace.php', 'punctuation.definition.namespace.begin.bracket.curly.php']
      expect(lines[1][1]).toEqual value: '//', scopes: ['source.php', 'meta.namespace.php', 'comment.line.double-slash.php', 'punctuation.definition.comment.php']
      expect(lines[2][0]).toEqual value: '}', scopes: ['source.php', 'meta.namespace.php', 'punctuation.definition.namespace.end.bracket.curly.php']

      lines = grammar.tokenizeLines '''
        namespace Test
        {
          // code
        }
      '''

      expect(lines[0][0]).toEqual value: 'namespace', scopes: ['source.php', 'meta.namespace.php', 'keyword.other.namespace.php']
      expect(lines[0][1]).toEqual value: ' ', scopes: ['source.php', 'meta.namespace.php']
      expect(lines[0][2]).toEqual value: 'Test', scopes: ['source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(lines[1][0]).toEqual value: '{', scopes: ['source.php', 'meta.namespace.php', 'punctuation.definition.namespace.begin.bracket.curly.php']
      expect(lines[2][1]).toEqual value: '//', scopes: ['source.php', 'meta.namespace.php', 'comment.line.double-slash.php', 'punctuation.definition.comment.php']
      expect(lines[3][0]).toEqual value: '}', scopes: ['source.php', 'meta.namespace.php', 'punctuation.definition.namespace.end.bracket.curly.php']

      lines = grammar.tokenizeLines '''
        namespace One\\Two\\Three {
          // code
        }
      '''

      expect(lines[0][0]).toEqual value: 'namespace', scopes: ['source.php', 'meta.namespace.php', 'keyword.other.namespace.php']
      expect(lines[0][1]).toEqual value: ' ', scopes: ['source.php', 'meta.namespace.php']
      expect(lines[0][2]).toEqual value: 'One', scopes: ['source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(lines[0][3]).toEqual value: '\\', scopes: ['source.php', 'meta.namespace.php', 'entity.name.type.namespace.php', 'punctuation.separator.inheritance.php']
      expect(lines[0][4]).toEqual value: 'Two', scopes: ['source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(lines[0][5]).toEqual value: '\\', scopes: ['source.php', 'meta.namespace.php', 'entity.name.type.namespace.php', 'punctuation.separator.inheritance.php']
      expect(lines[0][6]).toEqual value: 'Three', scopes: ['source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(lines[0][7]).toEqual value: ' ', scopes: ['source.php', 'meta.namespace.php']
      expect(lines[0][8]).toEqual value: '{', scopes: ['source.php', 'meta.namespace.php', 'punctuation.definition.namespace.begin.bracket.curly.php']
      expect(lines[1][1]).toEqual value: '//', scopes: ['source.php', 'meta.namespace.php', 'comment.line.double-slash.php', 'punctuation.definition.comment.php']
      expect(lines[2][0]).toEqual value: '}', scopes: ['source.php', 'meta.namespace.php', 'punctuation.definition.namespace.end.bracket.curly.php']

      lines = grammar.tokenizeLines '''
        namespace One\\Two\\Three
        {
          // code
        }
      '''

      expect(lines[0][0]).toEqual value: 'namespace', scopes: ['source.php', 'meta.namespace.php', 'keyword.other.namespace.php']
      expect(lines[0][1]).toEqual value: ' ', scopes: ['source.php', 'meta.namespace.php']
      expect(lines[0][2]).toEqual value: 'One', scopes: ['source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(lines[0][3]).toEqual value: '\\', scopes: ['source.php', 'meta.namespace.php', 'entity.name.type.namespace.php', 'punctuation.separator.inheritance.php']
      expect(lines[0][4]).toEqual value: 'Two', scopes: ['source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(lines[0][5]).toEqual value: '\\', scopes: ['source.php', 'meta.namespace.php', 'entity.name.type.namespace.php', 'punctuation.separator.inheritance.php']
      expect(lines[0][6]).toEqual value: 'Three', scopes: ['source.php', 'meta.namespace.php', 'entity.name.type.namespace.php']
      expect(lines[1][0]).toEqual value: '{', scopes: ['source.php', 'meta.namespace.php', 'punctuation.definition.namespace.begin.bracket.curly.php']
      expect(lines[2][1]).toEqual value: '//', scopes: ['source.php', 'meta.namespace.php', 'comment.line.double-slash.php', 'punctuation.definition.comment.php']
      expect(lines[3][0]).toEqual value: '}', scopes: ['source.php', 'meta.namespace.php', 'punctuation.definition.namespace.end.bracket.curly.php']

    it 'tokenizes global namespaces', ->
      lines = grammar.tokenizeLines '''
        namespace {
          // code
        }
      '''

      expect(lines[0][0]).toEqual value: 'namespace', scopes: ['source.php', 'meta.namespace.php', 'keyword.other.namespace.php']
      expect(lines[0][1]).toEqual value: ' ', scopes: ['source.php', 'meta.namespace.php']
      expect(lines[0][2]).toEqual value: '{', scopes: ['source.php', 'meta.namespace.php', 'punctuation.definition.namespace.begin.bracket.curly.php']
      expect(lines[1][1]).toEqual value: '//', scopes: ['source.php', 'meta.namespace.php', 'comment.line.double-slash.php', 'punctuation.definition.comment.php']
      expect(lines[2][0]).toEqual value: '}', scopes: ['source.php', 'meta.namespace.php', 'punctuation.definition.namespace.end.bracket.curly.php']

      lines = grammar.tokenizeLines '''
        namespace
        {
          // code
        }
      '''

      expect(lines[0][0]).toEqual value: 'namespace', scopes: ['source.php', 'meta.namespace.php', 'keyword.other.namespace.php']
      expect(lines[1][0]).toEqual value: '{', scopes: ['source.php', 'meta.namespace.php', 'punctuation.definition.namespace.begin.bracket.curly.php']
      expect(lines[2][1]).toEqual value: '//', scopes: ['source.php', 'meta.namespace.php', 'comment.line.double-slash.php', 'punctuation.definition.comment.php']
      expect(lines[3][0]).toEqual value: '}', scopes: ['source.php', 'meta.namespace.php', 'punctuation.definition.namespace.end.bracket.curly.php']

  describe 'using namespaces', ->
    it 'tokenizes basic use statements', ->
      {tokens} = grammar.tokenizeLine 'use ArrayObject;'

      expect(tokens[0]).toEqual value: 'use', scopes: ['source.php', 'meta.use.php', 'keyword.other.use.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php', 'meta.use.php']
      expect(tokens[2]).toEqual value: 'ArrayObject', scopes: ['source.php', 'meta.use.php', 'support.class.builtin.php']
      expect(tokens[3]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

      {tokens} = grammar.tokenizeLine 'use My\\Full\\NSname;'

      expect(tokens[0]).toEqual value: 'use', scopes: ['source.php', 'meta.use.php', 'keyword.other.use.php']
      expect(tokens[2]).toEqual value: 'My', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[3]).toEqual value: '\\', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[4]).toEqual value: 'Full', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[5]).toEqual value: '\\', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[6]).toEqual value: 'NSname', scopes: ['source.php', 'meta.use.php', 'support.class.php']
      expect(tokens[7]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

    it 'tokenizes multiline use statements', ->
      lines = grammar.tokenizeLines '''
        use One\\Two,
            Three\\Four;
      '''

      expect(lines[0][0]).toEqual value: 'use', scopes: ['source.php', 'meta.use.php', 'keyword.other.use.php']
      expect(lines[0][2]).toEqual value: 'One', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(lines[0][3]).toEqual value: '\\', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(lines[0][4]).toEqual value: 'Two', scopes: ['source.php', 'meta.use.php', 'support.class.php']
      expect(lines[0][5]).toEqual value: ',', scopes: ['source.php', 'meta.use.php', 'punctuation.separator.delimiter.php']
      expect(lines[1][1]).toEqual value: 'Three', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(lines[1][2]).toEqual value: '\\', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(lines[1][3]).toEqual value: 'Four', scopes: ['source.php', 'meta.use.php', 'support.class.php']
      expect(lines[1][4]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

    it 'tokenizes use function statements', ->
      {tokens} = grammar.tokenizeLine 'use function My\\Full\\functionName;'

      expect(tokens[0]).toEqual value: 'use', scopes: ['source.php', 'meta.use.php', 'keyword.other.use.php']
      expect(tokens[2]).toEqual value: 'function', scopes: ['source.php', 'meta.use.php', 'storage.type.function.php']
      expect(tokens[3]).toEqual value: ' ', scopes: ['source.php', 'meta.use.php']
      expect(tokens[4]).toEqual value: 'My', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[5]).toEqual value: '\\', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[6]).toEqual value: 'Full', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[7]).toEqual value: '\\', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[8]).toEqual value: 'functionName', scopes: ['source.php', 'meta.use.php', 'support.class.php']
      expect(tokens[9]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

    it 'tokenizes use const statements', ->
      {tokens} = grammar.tokenizeLine 'use const My\\Full\\CONSTANT;'

      expect(tokens[0]).toEqual value: 'use', scopes: ['source.php', 'meta.use.php', 'keyword.other.use.php']
      expect(tokens[2]).toEqual value: 'const', scopes: ['source.php', 'meta.use.php', 'storage.type.const.php']
      expect(tokens[3]).toEqual value: ' ', scopes: ['source.php', 'meta.use.php']
      expect(tokens[4]).toEqual value: 'My', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[5]).toEqual value: '\\', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[6]).toEqual value: 'Full', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[7]).toEqual value: '\\', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[8]).toEqual value: 'CONSTANT', scopes: ['source.php', 'meta.use.php', 'support.class.php']
      expect(tokens[9]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

    it 'tokenizes use-as statements', ->
      {tokens} = grammar.tokenizeLine 'use My\\Full\\Classname as Another;'

      expect(tokens[0]).toEqual value: 'use', scopes: ['source.php', 'meta.use.php', 'keyword.other.use.php']
      expect(tokens[2]).toEqual value: 'My', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[3]).toEqual value: '\\', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[4]).toEqual value: 'Full', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[5]).toEqual value: '\\', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[6]).toEqual value: 'Classname', scopes: ['source.php', 'meta.use.php', 'support.class.php']
      expect(tokens[7]).toEqual value: ' ', scopes: ['source.php', 'meta.use.php']
      expect(tokens[8]).toEqual value: 'as', scopes: ['source.php', 'meta.use.php', 'keyword.other.use-as.php']
      expect(tokens[9]).toEqual value: ' ', scopes: ['source.php', 'meta.use.php']
      expect(tokens[10]).toEqual value: 'Another', scopes: ['source.php', 'meta.use.php', 'entity.other.alias.php']
      expect(tokens[11]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

    it 'tokenizes multiple combined use statements', ->
      {tokens} = grammar.tokenizeLine 'use My\\Full\\Classname as Another, My\\Full\\NSname;'

      expect(tokens[0]).toEqual value: 'use', scopes: ['source.php', 'meta.use.php', 'keyword.other.use.php']
      expect(tokens[2]).toEqual value: 'My', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[3]).toEqual value: '\\', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[4]).toEqual value: 'Full', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[5]).toEqual value: '\\', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[6]).toEqual value: 'Classname', scopes: ['source.php', 'meta.use.php', 'support.class.php']
      expect(tokens[8]).toEqual value: 'as', scopes: ['source.php', 'meta.use.php', 'keyword.other.use-as.php']
      expect(tokens[10]).toEqual value: 'Another', scopes: ['source.php', 'meta.use.php', 'entity.other.alias.php']
      expect(tokens[11]).toEqual value: ',', scopes: ['source.php', 'meta.use.php', 'punctuation.separator.delimiter.php']
      expect(tokens[12]).toEqual value: ' ', scopes: ['source.php', 'meta.use.php']
      expect(tokens[13]).toEqual value: 'My', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[14]).toEqual value: '\\', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[15]).toEqual value: 'Full', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[16]).toEqual value: '\\', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[17]).toEqual value: 'NSname', scopes: ['source.php', 'meta.use.php', 'support.class.php']
      expect(tokens[18]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

    it 'tokenizes grouped use statements', ->
      tokens = grammar.tokenizeLines '''
        use some\\namespace\\{
          ClassA,
          ClassB,
          ClassC as C
        };
      '''

      expect(tokens[0][0]).toEqual value: 'use', scopes: ['source.php', 'meta.use.php', 'keyword.other.use.php']
      expect(tokens[0][2]).toEqual value: 'some', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[0][3]).toEqual value: '\\', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[0][4]).toEqual value: 'namespace', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php']
      expect(tokens[0][5]).toEqual value: '\\', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[0][6]).toEqual value: '{', scopes: ['source.php', 'meta.use.php', 'punctuation.definition.use.begin.bracket.curly.php']
      expect(tokens[1][1]).toEqual value: 'ClassA', scopes: ['source.php', 'meta.use.php', 'support.class.php']
      expect(tokens[1][2]).toEqual value: ',', scopes: ['source.php', 'meta.use.php', 'punctuation.separator.delimiter.php']
      expect(tokens[2][1]).toEqual value: 'ClassB', scopes: ['source.php', 'meta.use.php', 'support.class.php']
      expect(tokens[2][2]).toEqual value: ',', scopes: ['source.php', 'meta.use.php', 'punctuation.separator.delimiter.php']
      expect(tokens[3][1]).toEqual value: 'ClassC', scopes: ['source.php', 'meta.use.php', 'support.class.php']
      expect(tokens[3][2]).toEqual value: ' ', scopes: ['source.php', 'meta.use.php']
      expect(tokens[3][3]).toEqual value: 'as', scopes: ['source.php', 'meta.use.php', 'keyword.other.use-as.php']
      expect(tokens[3][4]).toEqual value: ' ', scopes: ['source.php', 'meta.use.php']
      expect(tokens[3][5]).toEqual value: 'C', scopes: ['source.php', 'meta.use.php', 'entity.other.alias.php']
      expect(tokens[4][0]).toEqual value: '}', scopes: ['source.php', 'meta.use.php', 'punctuation.definition.use.end.bracket.curly.php']
      expect(tokens[4][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  describe 'classes', ->
    it 'tokenizes class declarations', ->
      {tokens} = grammar.tokenizeLine 'class Test { /* stuff */ }'

      expect(tokens[0]).toEqual value: 'class', scopes: ['source.php', 'meta.class.php', 'storage.type.class.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php', 'meta.class.php']
      expect(tokens[2]).toEqual value: 'Test', scopes: ['source.php', 'meta.class.php', 'entity.name.type.class.php']
      expect(tokens[3]).toEqual value: ' ', scopes: ['source.php', 'meta.class.php']
      expect(tokens[4]).toEqual value: '{', scopes: ['source.php', 'meta.class.php', 'punctuation.definition.class.begin.bracket.curly.php']
      expect(tokens[5]).toEqual value: ' ', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php']
      expect(tokens[6]).toEqual value: '/*', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'comment.block.php', 'punctuation.definition.comment.php']
      expect(tokens[10]).toEqual value: '}', scopes: ['source.php', 'meta.class.php', 'punctuation.definition.class.end.bracket.curly.php']

    it 'tokenizes class modifiers', ->
      {tokens} = grammar.tokenizeLine 'abstract class Test {}'

      expect(tokens[0]).toEqual value: 'abstract', scopes: ['source.php', 'meta.class.php', 'storage.modifier.abstract.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php', 'meta.class.php']
      expect(tokens[2]).toEqual value: 'class', scopes: ['source.php', 'meta.class.php', 'storage.type.class.php']
      expect(tokens[3]).toEqual value: ' ', scopes: ['source.php', 'meta.class.php']
      expect(tokens[4]).toEqual value: 'Test', scopes: ['source.php', 'meta.class.php', 'entity.name.type.class.php']

      {tokens} = grammar.tokenizeLine 'final class Test {}'

      expect(tokens[0]).toEqual value: 'final', scopes: ['source.php', 'meta.class.php', 'storage.modifier.final.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php', 'meta.class.php']
      expect(tokens[2]).toEqual value: 'class', scopes: ['source.php', 'meta.class.php', 'storage.type.class.php']
      expect(tokens[3]).toEqual value: ' ', scopes: ['source.php', 'meta.class.php']
      expect(tokens[4]).toEqual value: 'Test', scopes: ['source.php', 'meta.class.php', 'entity.name.type.class.php']

    describe 'use statements', ->
      it 'tokenizes basic use statements', ->
        lines = grammar.tokenizeLines '''
          class Test {
            use A;
          }
        '''

        expect(lines[1][1]).toEqual value: 'use', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'keyword.other.use.php']
        expect(lines[1][2]).toEqual value: ' ', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(lines[1][3]).toEqual value: 'A', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.class.php']
        expect(lines[1][4]).toEqual value: ';', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'punctuation.terminator.expression.php']

        lines = grammar.tokenizeLines '''
          class Test {
            use A, B;
          }
        '''

        expect(lines[1][1]).toEqual value: 'use', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'keyword.other.use.php']
        expect(lines[1][2]).toEqual value: ' ', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(lines[1][3]).toEqual value: 'A', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.class.php']
        expect(lines[1][4]).toEqual value: ',', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'punctuation.separator.delimiter.php']
        expect(lines[1][5]).toEqual value: ' ', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(lines[1][6]).toEqual value: 'B', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.class.php']
        expect(lines[1][7]).toEqual value: ';', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'punctuation.terminator.expression.php']

        lines = grammar.tokenizeLines '''
          class Test {
            use A\\B;
          }
        '''

        expect(lines[1][1]).toEqual value: 'use', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'keyword.other.use.php']
        expect(lines[1][2]).toEqual value: ' ', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(lines[1][3]).toEqual value: 'A', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.other.namespace.php']
        expect(lines[1][4]).toEqual value: '\\', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
        expect(lines[1][5]).toEqual value: 'B', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.class.php']
        expect(lines[1][6]).toEqual value: ';', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'punctuation.terminator.expression.php']

      it 'tokenizes multiline use statements', ->
        lines = grammar.tokenizeLines '''
            class Test {
              use One\\Two,
                  Three\\Four;
            }
        '''

        expect(lines[1][1]).toEqual value: 'use', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'keyword.other.use.php']
        expect(lines[1][3]).toEqual value: 'One', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.other.namespace.php']
        expect(lines[1][4]).toEqual value: '\\', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
        expect(lines[1][5]).toEqual value: 'Two', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.class.php']
        expect(lines[1][6]).toEqual value: ',', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'punctuation.separator.delimiter.php']
        expect(lines[2][1]).toEqual value: 'Three', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.other.namespace.php']
        expect(lines[2][2]).toEqual value: '\\', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
        expect(lines[2][3]).toEqual value: 'Four', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.class.php']
        expect(lines[2][4]).toEqual value: ';', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'punctuation.terminator.expression.php']

      it 'tokenizes complex use statements', ->
        lines = grammar.tokenizeLines '''
          class Test {
            use A, B {
              B::smallTalk insteadof A;
            }
            /* comment */
          }
        '''

        expect(lines[1][1]).toEqual value: 'use', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'keyword.other.use.php']
        expect(lines[1][2]).toEqual value: ' ', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(lines[1][3]).toEqual value: 'A', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.class.php']
        expect(lines[1][4]).toEqual value: ',', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'punctuation.separator.delimiter.php']
        expect(lines[1][5]).toEqual value: ' ', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(lines[1][6]).toEqual value: 'B', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.class.php']
        expect(lines[1][7]).toEqual value: ' ', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(lines[1][8]).toEqual value: '{', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'punctuation.definition.use.begin.bracket.curly.php']
        expect(lines[2][1]).toEqual value: 'B', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.class.php']
        expect(lines[2][2]).toEqual value: '::', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'keyword.operator.class.php']
        expect(lines[2][3]).toEqual value: 'smallTalk', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'constant.other.class.php']
        expect(lines[2][4]).toEqual value: ' ', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(lines[2][5]).toEqual value: 'insteadof', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'keyword.other.use-insteadof.php']
        expect(lines[2][6]).toEqual value: ' ', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(lines[2][7]).toEqual value: 'A', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.class.php']
        expect(lines[2][8]).toEqual value: ';', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'punctuation.terminator.expression.php']
        expect(lines[3][1]).toEqual value: '}', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'punctuation.definition.use.end.bracket.curly.php']
        expect(lines[4][1]).toEqual value: '/*', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'comment.block.php', 'punctuation.definition.comment.php']

      it 'tokenizes aliases', ->
        lines = grammar.tokenizeLines '''
          class Aliased_Talker {
              use A, B {
                  B::smallTalk as private talk;
              }
          }
        '''

        expect(lines[2][1]).toEqual value: 'B', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.class.php']
        expect(lines[2][2]).toEqual value: '::', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'keyword.operator.class.php']
        expect(lines[2][3]).toEqual value: 'smallTalk', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'constant.other.class.php']
        expect(lines[2][4]).toEqual value: ' ', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(lines[2][5]).toEqual value: 'as', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'keyword.other.use-as.php']
        expect(lines[2][6]).toEqual value: ' ', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(lines[2][7]).toEqual value: 'private', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'storage.modifier.php']
        expect(lines[2][8]).toEqual value: ' ', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(lines[2][9]).toEqual value: 'talk', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'entity.other.alias.php']
        expect(lines[2][10]).toEqual value: ';', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'punctuation.terminator.expression.php']
        expect(lines[3][1]).toEqual value: '}', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'punctuation.definition.use.end.bracket.curly.php']

      it 'tokenizes aliases', ->
        lines = grammar.tokenizeLines '''
          class Aliased_Talker {
              use A, B {
                  B::smallTalk as talk;
              }
          }
        '''

        expect(lines[2][1]).toEqual value: 'B', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'support.class.php']
        expect(lines[2][2]).toEqual value: '::', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'keyword.operator.class.php']
        expect(lines[2][3]).toEqual value: 'smallTalk', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'constant.other.class.php']
        expect(lines[2][4]).toEqual value: ' ', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(lines[2][5]).toEqual value: 'as', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'keyword.other.use-as.php']
        expect(lines[2][6]).toEqual value: ' ', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php']
        expect(lines[2][7]).toEqual value: 'talk', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'entity.other.alias.php']
        expect(lines[2][8]).toEqual value: ';', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'punctuation.terminator.expression.php']
        expect(lines[3][1]).toEqual value: '}', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'meta.use.php', 'punctuation.definition.use.end.bracket.curly.php']

  describe 'functions', ->
    it 'tokenizes functions with no arguments', ->
      {tokens} = grammar.tokenizeLine 'function test() {}'

      expect(tokens[0]).toEqual value: 'function', scopes: ['source.php', 'meta.function.php', 'storage.type.function.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php', 'meta.function.php']
      expect(tokens[2]).toEqual value: 'test', scopes: ['source.php', 'meta.function.php', 'entity.name.function.php']
      expect(tokens[3]).toEqual value: '(', scopes: ['source.php', 'meta.function.php', 'punctuation.definition.parameters.begin.bracket.round.php']
      expect(tokens[4]).toEqual value: ')', scopes: ['source.php', 'meta.function.php', 'punctuation.definition.parameters.end.bracket.round.php']

      # Should NOT be tokenized as an actual function
      {tokens} = grammar.tokenizeLine 'function_test() {}'

      expect(tokens[0]).toEqual value: 'function_test', scopes: ['source.php', 'meta.function-call.php', 'entity.name.function.php']

    it 'tokenizes default array type with old array value', ->
      {tokens} = grammar.tokenizeLine 'function array_test(array $value = array()) {}'

      expect(tokens[0]).toEqual value: 'function', scopes: ['source.php', 'meta.function.php', 'storage.type.function.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php', 'meta.function.php']
      expect(tokens[2]).toEqual value: 'array_test', scopes: ['source.php', 'meta.function.php', 'entity.name.function.php']
      expect(tokens[3]).toEqual value: '(', scopes: ['source.php', 'meta.function.php', 'punctuation.definition.parameters.begin.bracket.round.php']
      expect(tokens[4]).toEqual value: 'array', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'storage.type.php']
      expect(tokens[5]).toEqual value: ' ', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php']
      expect(tokens[6]).toEqual value: '$', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[7]).toEqual value: 'value', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'variable.other.php']
      expect(tokens[8]).toEqual value: ' ', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php']
      expect(tokens[9]).toEqual value: '=', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'keyword.operator.assignment.php']
      expect(tokens[10]).toEqual value: ' ', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php']
      expect(tokens[11]).toEqual value: 'array', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'support.function.construct.php']
      expect(tokens[12]).toEqual value: '(', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'punctuation.definition.array.begin.bracket.round.php']
      expect(tokens[13]).toEqual value: ')', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'punctuation.definition.array.end.bracket.round.php']
      expect(tokens[14]).toEqual value: ')', scopes: ['source.php', 'meta.function.php', 'punctuation.definition.parameters.end.bracket.round.php']
      expect(tokens[15]).toEqual value: ' ', scopes: ['source.php']
      expect(tokens[16]).toEqual value: '{', scopes: ['source.php', 'punctuation.definition.begin.bracket.curly.php']
      expect(tokens[17]).toEqual value: '}', scopes: ['source.php', 'punctuation.definition.end.bracket.curly.php']

    it 'tokenizes variadic arguments', ->
      {tokens} = grammar.tokenizeLine 'function test(...$value) {}'

      expect(tokens[4]).toEqual value: '...', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.no-default.php', 'variable.other.php', 'keyword.operator.variadic.php']
      expect(tokens[5]).toEqual value: '$', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.no-default.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[6]).toEqual value: 'value', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.no-default.php', 'variable.other.php']

    it 'tokenizes variadic arguments and typehinted class name', ->
      {tokens} = grammar.tokenizeLine 'function test(class_name ...$value) {}'

      expect(tokens[4]).toEqual value: 'class_name', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'storage.type.php']
      expect(tokens[6]).toEqual value: '...', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'variable.other.php', 'keyword.operator.variadic.php']
      expect(tokens[7]).toEqual value: '$', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[8]).toEqual value: 'value', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'variable.other.php']

    it 'tokenizes namespaced and typehinted class names', ->
      {tokens} = grammar.tokenizeLine 'function test(\\class_name $value) {}'

      expect(tokens[4]).toEqual value: '\\', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[5]).toEqual value: 'class_name', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'storage.type.php']
      expect(tokens[7]).toEqual value: '$', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'variable.other.php', 'punctuation.definition.variable.php']

      {tokens} = grammar.tokenizeLine 'function test(a\\class_name $value) {}'

      expect(tokens[4]).toEqual value: 'a', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'support.other.namespace.php', 'storage.type.php']
      expect(tokens[5]).toEqual value: '\\', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[6]).toEqual value: 'class_name', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'storage.type.php']
      expect(tokens[8]).toEqual value: '$', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'variable.other.php', 'punctuation.definition.variable.php']

      {tokens} = grammar.tokenizeLine 'function test(a\\b\\class_name $value) {}'

      expect(tokens[4]).toEqual value: 'a', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'support.other.namespace.php', 'storage.type.php']
      expect(tokens[5]).toEqual value: '\\', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[6]).toEqual value: 'b', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'support.other.namespace.php', 'storage.type.php']
      expect(tokens[7]).toEqual value: '\\', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[8]).toEqual value: 'class_name', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'storage.type.php']
      expect(tokens[10]).toEqual value: '$', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'variable.other.php', 'punctuation.definition.variable.php']

      {tokens} = grammar.tokenizeLine 'function test(\\a\\b\\class_name $value) {}'

      expect(tokens[4]).toEqual value: '\\', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[5]).toEqual value: 'a', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'support.other.namespace.php', 'storage.type.php']
      expect(tokens[6]).toEqual value: '\\', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[7]).toEqual value: 'b', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'support.other.namespace.php', 'storage.type.php']
      expect(tokens[8]).toEqual value: '\\', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[9]).toEqual value: 'class_name', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'storage.type.php']
      expect(tokens[11]).toEqual value: '$', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'variable.other.php', 'punctuation.definition.variable.php']

    it 'tokenizes default array type with short array value', ->
      {tokens} = grammar.tokenizeLine 'function array_test(array $value = []) {}'

      expect(tokens[0]).toEqual value: 'function', scopes: ['source.php', 'meta.function.php', 'storage.type.function.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php', 'meta.function.php']
      expect(tokens[2]).toEqual value: 'array_test', scopes: ['source.php', 'meta.function.php', 'entity.name.function.php']
      expect(tokens[3]).toEqual value: '(', scopes: ['source.php', 'meta.function.php', 'punctuation.definition.parameters.begin.bracket.round.php']
      expect(tokens[4]).toEqual value: 'array', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'storage.type.php']
      expect(tokens[5]).toEqual value: ' ', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php']
      expect(tokens[6]).toEqual value: '$', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[7]).toEqual value: 'value', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'variable.other.php']
      expect(tokens[8]).toEqual value: ' ', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php']
      expect(tokens[9]).toEqual value: '=', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'keyword.operator.assignment.php']
      expect(tokens[10]).toEqual value: ' ', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php']
      expect(tokens[11]).toEqual value: '[', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'punctuation.section.array.begin.php']
      expect(tokens[12]).toEqual value: ']', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'punctuation.section.array.end.php']
      expect(tokens[13]).toEqual value: ')', scopes: ['source.php', 'meta.function.php', 'punctuation.definition.parameters.end.bracket.round.php']
      expect(tokens[14]).toEqual value: ' ', scopes: ['source.php']
      expect(tokens[15]).toEqual value: '{', scopes: ['source.php', 'punctuation.definition.begin.bracket.curly.php']
      expect(tokens[16]).toEqual value: '}', scopes: ['source.php', 'punctuation.definition.end.bracket.curly.php']

    it 'tokenizes a non-empty array', ->
      {tokens} = grammar.tokenizeLine "function not_empty_array_test(array $value = [1,2,'3']) {}"

      expect(tokens[11]).toEqual value: '[', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'punctuation.section.array.begin.php']
      expect(tokens[12]).toEqual value: '1', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'constant.numeric.decimal.php']
      expect(tokens[13]).toEqual value: ',', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php']
      expect(tokens[14]).toEqual value: '2', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'constant.numeric.decimal.php']
      expect(tokens[15]).toEqual value: ',', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php']
      expect(tokens[16]).toEqual value: '\'', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
      expect(tokens[17]).toEqual value: '3', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'string.quoted.single.php']
      expect(tokens[18]).toEqual value: '\'', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'string.quoted.single.php', 'punctuation.definition.string.end.php']
      expect(tokens[19]).toEqual value: ']', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'punctuation.section.array.end.php']

    it 'tokenizes default value with non-lowercase array type hinting', ->
      {tokens} = grammar.tokenizeLine 'function array_test(Array $value = []) {}'

      expect(tokens[0]).toEqual value: 'function', scopes: ['source.php', 'meta.function.php', 'storage.type.function.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php', 'meta.function.php']
      expect(tokens[2]).toEqual value: 'array_test', scopes: ['source.php', 'meta.function.php', 'entity.name.function.php']
      expect(tokens[3]).toEqual value: '(', scopes: ['source.php', 'meta.function.php', 'punctuation.definition.parameters.begin.bracket.round.php']
      expect(tokens[4]).toEqual value: 'Array', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'storage.type.php']
      expect(tokens[5]).toEqual value: ' ', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php']
      expect(tokens[6]).toEqual value: '$', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[7]).toEqual value: 'value', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'variable.other.php']
      expect(tokens[8]).toEqual value: ' ', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php']
      expect(tokens[9]).toEqual value: '=', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'keyword.operator.assignment.php']
      expect(tokens[10]).toEqual value: ' ', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php']
      expect(tokens[11]).toEqual value: '[', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'punctuation.section.array.begin.php']
      expect(tokens[12]).toEqual value: ']', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.array.php', 'punctuation.section.array.end.php']
      expect(tokens[13]).toEqual value: ')', scopes: ['source.php', 'meta.function.php', 'punctuation.definition.parameters.end.bracket.round.php']
      expect(tokens[14]).toEqual value: ' ', scopes: ['source.php']
      expect(tokens[15]).toEqual value: '{', scopes: ['source.php', 'punctuation.definition.begin.bracket.curly.php']
      expect(tokens[16]).toEqual value: '}', scopes: ['source.php', 'punctuation.definition.end.bracket.curly.php']

    it 'tokenizes multiple typehinted arguments with default values', ->
      {tokens} = grammar.tokenizeLine "function test(string $subject = 'no subject', string $body = null) {}"

      expect(tokens[0]).toEqual value: 'function', scopes: ['source.php', 'meta.function.php', 'storage.type.function.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php', 'meta.function.php']
      expect(tokens[2]).toEqual value: 'test', scopes: ['source.php', 'meta.function.php', 'entity.name.function.php']
      expect(tokens[3]).toEqual value: '(', scopes: ['source.php', 'meta.function.php', 'punctuation.definition.parameters.begin.bracket.round.php']
      expect(tokens[4]).toEqual value: 'string', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'storage.type.php']
      expect(tokens[6]).toEqual value: '$', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[7]).toEqual value: 'subject', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'variable.other.php']
      expect(tokens[8]).toEqual value: ' ', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php']
      expect(tokens[9]).toEqual value: '=', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'keyword.operator.assignment.php']
      expect(tokens[10]).toEqual value: ' ', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php']
      expect(tokens[11]).toEqual value: "'", scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
      expect(tokens[12]).toEqual value: 'no subject', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'string.quoted.single.php']
      expect(tokens[13]).toEqual value: "'", scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'string.quoted.single.php', 'punctuation.definition.string.end.php']
      expect(tokens[14]).toEqual value: ',', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'punctuation.separator.delimiter.php']
      expect(tokens[15]).toEqual value: ' ', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php']
      expect(tokens[16]).toEqual value: 'string', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'storage.type.php']
      expect(tokens[18]).toEqual value: '$', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[19]).toEqual value: 'body', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'variable.other.php']
      expect(tokens[21]).toEqual value: '=', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'keyword.operator.assignment.php']
      expect(tokens[22]).toEqual value: ' ', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php']
      expect(tokens[23]).toEqual value: 'null', scopes: ['source.php', 'meta.function.php', 'meta.function.parameters.php', 'meta.function.parameter.typehinted.php', 'constant.language.php']
      expect(tokens[24]).toEqual value: ')', scopes: ['source.php', 'meta.function.php', 'punctuation.definition.parameters.end.bracket.round.php']

    it 'tokenizes return values', ->
      {tokens} = grammar.tokenizeLine 'function test() : Client {}'

      expect(tokens[0]).toEqual value: 'function', scopes: ['source.php', 'meta.function.php', 'storage.type.function.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php', 'meta.function.php']
      expect(tokens[2]).toEqual value: 'test', scopes: ['source.php', 'meta.function.php', 'entity.name.function.php']
      expect(tokens[3]).toEqual value: '(', scopes: ['source.php', 'meta.function.php', 'punctuation.definition.parameters.begin.bracket.round.php']
      expect(tokens[4]).toEqual value: ')', scopes: ['source.php', 'meta.function.php', 'punctuation.definition.parameters.end.bracket.round.php']
      expect(tokens[5]).toEqual value: ' ', scopes: ['source.php', 'meta.function.php']
      expect(tokens[6]).toEqual value: ':', scopes: ['source.php', 'meta.function.php', 'keyword.operator.return-value.php']
      expect(tokens[7]).toEqual value: ' ', scopes: ['source.php', 'meta.function.php']
      expect(tokens[8]).toEqual value: 'Client', scopes: ['source.php', 'meta.function.php', 'storage.type.php']
      expect(tokens[9]).toEqual value: ' ', scopes: ['source.php']

    it 'tokenizes function names with characters other than letters or numbers', ->
      # Char 160 is hex0xA0, which is between 0x7F and 0xFF, making it a valid PHP identifier
      functionName = "foo#{String.fromCharCode 160}bar"
      {tokens} = grammar.tokenizeLine "function #{functionName}() {}"

      expect(tokens[0]).toEqual value: 'function', scopes: ['source.php', 'meta.function.php', 'storage.type.function.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php', 'meta.function.php']
      expect(tokens[2]).toEqual value: functionName, scopes: ['source.php', 'meta.function.php', 'entity.name.function.php']
      expect(tokens[3]).toEqual value: '(', scopes: ['source.php', 'meta.function.php', 'punctuation.definition.parameters.begin.bracket.round.php']
      expect(tokens[4]).toEqual value: ')', scopes: ['source.php', 'meta.function.php', 'punctuation.definition.parameters.end.bracket.round.php']
      expect(tokens[5]).toEqual value: ' ', scopes: ['source.php']
      expect(tokens[6]).toEqual value: '{', scopes: ['source.php', 'punctuation.definition.begin.bracket.curly.php']
      expect(tokens[7]).toEqual value: '}', scopes: ['source.php', 'punctuation.definition.end.bracket.curly.php']

  describe 'function calls', ->
    it 'tokenizes function calls with no arguments', ->
      {tokens} = grammar.tokenizeLine 'inverse()'

      expect(tokens[0]).toEqual value: 'inverse', scopes: ['source.php', 'meta.function-call.php', 'entity.name.function.php']
      expect(tokens[1]).toEqual value: '(', scopes: ['source.php', 'meta.function-call.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[2]).toEqual value: ')', scopes: ['source.php', 'meta.function-call.php', 'punctuation.definition.arguments.end.bracket.round.php']

      {tokens} = grammar.tokenizeLine 'inverse ()'

      expect(tokens[0]).toEqual value: 'inverse', scopes: ['source.php', 'meta.function-call.php', 'entity.name.function.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php', 'meta.function-call.php']
      expect(tokens[2]).toEqual value: '(', scopes: ['source.php', 'meta.function-call.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[3]).toEqual value: ')', scopes: ['source.php', 'meta.function-call.php', 'punctuation.definition.arguments.end.bracket.round.php']

    it 'tokenizes function calls with arguments', ->
      {tokens} = grammar.tokenizeLine "inverse(5, 'b')"

      expect(tokens[0]).toEqual value: 'inverse', scopes: ['source.php', 'meta.function-call.php', 'entity.name.function.php']
      expect(tokens[1]).toEqual value: '(', scopes: ['source.php', 'meta.function-call.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[2]).toEqual value: '5', scopes: ['source.php', 'meta.function-call.php', 'constant.numeric.decimal.php']
      expect(tokens[3]).toEqual value: ',', scopes: ['source.php', 'meta.function-call.php', 'punctuation.separator.delimiter.php']
      expect(tokens[4]).toEqual value: ' ', scopes: ['source.php', 'meta.function-call.php']
      expect(tokens[5]).toEqual value: "'", scopes: ['source.php', 'meta.function-call.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
      expect(tokens[6]).toEqual value: 'b', scopes: ['source.php', 'meta.function-call.php', 'string.quoted.single.php']
      expect(tokens[7]).toEqual value: "'", scopes: ['source.php', 'meta.function-call.php', 'string.quoted.single.php', 'punctuation.definition.string.end.php']
      expect(tokens[8]).toEqual value: ')', scopes: ['source.php', 'meta.function-call.php', 'punctuation.definition.arguments.end.bracket.round.php']

      {tokens} = grammar.tokenizeLine "inverse (5, 'b')"

      expect(tokens[0]).toEqual value: 'inverse', scopes: ['source.php', 'meta.function-call.php', 'entity.name.function.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php', 'meta.function-call.php']
      expect(tokens[2]).toEqual value: '(', scopes: ['source.php', 'meta.function-call.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[3]).toEqual value: '5', scopes: ['source.php', 'meta.function-call.php', 'constant.numeric.decimal.php']
      expect(tokens[4]).toEqual value: ',', scopes: ['source.php', 'meta.function-call.php', 'punctuation.separator.delimiter.php']
      expect(tokens[5]).toEqual value: ' ', scopes: ['source.php', 'meta.function-call.php']
      expect(tokens[6]).toEqual value: "'", scopes: ['source.php', 'meta.function-call.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
      expect(tokens[7]).toEqual value: 'b', scopes: ['source.php', 'meta.function-call.php', 'string.quoted.single.php']
      expect(tokens[8]).toEqual value: "'", scopes: ['source.php', 'meta.function-call.php', 'string.quoted.single.php', 'punctuation.definition.string.end.php']
      expect(tokens[9]).toEqual value: ')', scopes: ['source.php', 'meta.function-call.php', 'punctuation.definition.arguments.end.bracket.round.php']

    it 'tokenizes builtin function calls', ->
      {tokens} = grammar.tokenizeLine "echo('Hi!')"

      expect(tokens[0]).toEqual value: 'echo', scopes: ['source.php', 'meta.function-call.php', 'support.function.construct.output.php']
      expect(tokens[1]).toEqual value: '(', scopes: ['source.php', 'meta.function-call.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[2]).toEqual value: "'", scopes: ['source.php', 'meta.function-call.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
      expect(tokens[3]).toEqual value: 'Hi!', scopes: ['source.php', 'meta.function-call.php', 'string.quoted.single.php']
      expect(tokens[4]).toEqual value: "'", scopes: ['source.php', 'meta.function-call.php', 'string.quoted.single.php', 'punctuation.definition.string.end.php']
      expect(tokens[5]).toEqual value: ')', scopes: ['source.php', 'meta.function-call.php', 'punctuation.definition.arguments.end.bracket.round.php']

      {tokens} = grammar.tokenizeLine "echo ('Hi!')"

      expect(tokens[0]).toEqual value: 'echo', scopes: ['source.php', 'meta.function-call.php', 'support.function.construct.output.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php', 'meta.function-call.php']
      expect(tokens[2]).toEqual value: '(', scopes: ['source.php', 'meta.function-call.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[3]).toEqual value: "'", scopes: ['source.php', 'meta.function-call.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
      expect(tokens[4]).toEqual value: 'Hi!', scopes: ['source.php', 'meta.function-call.php', 'string.quoted.single.php']
      expect(tokens[5]).toEqual value: "'", scopes: ['source.php', 'meta.function-call.php', 'string.quoted.single.php', 'punctuation.definition.string.end.php']
      expect(tokens[6]).toEqual value: ')', scopes: ['source.php', 'meta.function-call.php', 'punctuation.definition.arguments.end.bracket.round.php']

    it 'tokenizes root-namespaced function calls', ->
      {tokens} = grammar.tokenizeLine '\\test()'

      expect(tokens[0]).toEqual value: '\\', scopes: ['source.php', 'meta.function-call.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1]).toEqual value: 'test', scopes: ['source.php', 'meta.function-call.php', 'entity.name.function.php']

    it 'tokenizes user-namespaced function calls', ->
      {tokens} = grammar.tokenizeLine 'hello\\test()'

      expect(tokens[0]).toEqual value: 'hello', scopes: ['source.php', 'meta.function-call.php', 'support.other.namespace.php']
      expect(tokens[1]).toEqual value: '\\', scopes: ['source.php', 'meta.function-call.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[2]).toEqual value: 'test', scopes: ['source.php', 'meta.function-call.php', 'entity.name.function.php']

      {tokens} = grammar.tokenizeLine 'one\\two\\test()'

      expect(tokens[0]).toEqual value: 'one', scopes: ['source.php', 'meta.function-call.php', 'support.other.namespace.php']
      expect(tokens[1]).toEqual value: '\\', scopes: ['source.php', 'meta.function-call.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[2]).toEqual value: 'two', scopes: ['source.php', 'meta.function-call.php', 'support.other.namespace.php']
      expect(tokens[3]).toEqual value: '\\', scopes: ['source.php', 'meta.function-call.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[4]).toEqual value: 'test', scopes: ['source.php', 'meta.function-call.php', 'entity.name.function.php']

    it 'tokenizes absolutely-namespaced function calls', ->
      {tokens} = grammar.tokenizeLine '\\hello\\test()'

      expect(tokens[0]).toEqual value: '\\', scopes: ['source.php', 'meta.function-call.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1]).toEqual value: 'hello', scopes: ['source.php', 'meta.function-call.php', 'support.other.namespace.php']
      expect(tokens[2]).toEqual value: '\\', scopes: ['source.php', 'meta.function-call.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[3]).toEqual value: 'test', scopes: ['source.php', 'meta.function-call.php', 'entity.name.function.php']

      {tokens} = grammar.tokenizeLine '\\one\\two\\test()'

      expect(tokens[0]).toEqual value: '\\', scopes: ['source.php', 'meta.function-call.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1]).toEqual value: 'one', scopes: ['source.php', 'meta.function-call.php', 'support.other.namespace.php']
      expect(tokens[2]).toEqual value: '\\', scopes: ['source.php', 'meta.function-call.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[3]).toEqual value: 'two', scopes: ['source.php', 'meta.function-call.php', 'support.other.namespace.php']
      expect(tokens[4]).toEqual value: '\\', scopes: ['source.php', 'meta.function-call.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[5]).toEqual value: 'test', scopes: ['source.php', 'meta.function-call.php', 'entity.name.function.php']

    it 'does not treat user-namespaced functions as builtins', ->
      {tokens} = grammar.tokenizeLine 'hello\\apc_store()'

      expect(tokens[2]).toEqual value: 'apc_store', scopes: ['source.php', 'meta.function-call.php', 'entity.name.function.php']

      {tokens} = grammar.tokenizeLine '\\hello\\apc_store()'

      expect(tokens[3]).toEqual value: 'apc_store', scopes: ['source.php', 'meta.function-call.php', 'entity.name.function.php']

  describe 'method calls', ->
    it 'tokenizes method calls with no arguments', ->
      {tokens} = grammar.tokenizeLine 'obj->method()'

      expect(tokens[2]).toEqual value: 'method', scopes: ['source.php', 'meta.method-call.php', 'entity.name.function.php']
      expect(tokens[3]).toEqual value: '(', scopes: ['source.php', 'meta.method-call.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[4]).toEqual value: ')', scopes: ['source.php', 'meta.method-call.php', 'punctuation.definition.arguments.end.bracket.round.php']

      {tokens} = grammar.tokenizeLine 'obj->method ()'

      expect(tokens[2]).toEqual value: 'method', scopes: ['source.php', 'meta.method-call.php', 'entity.name.function.php']
      expect(tokens[3]).toEqual value: ' ', scopes: ['source.php', 'meta.method-call.php']
      expect(tokens[4]).toEqual value: '(', scopes: ['source.php', 'meta.method-call.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[5]).toEqual value: ')', scopes: ['source.php', 'meta.method-call.php', 'punctuation.definition.arguments.end.bracket.round.php']

    it 'tokenizes method calls with arguments', ->
      {tokens} = grammar.tokenizeLine "obj->method(5, 'b')"

      expect(tokens[2]).toEqual value: 'method', scopes: ['source.php', 'meta.method-call.php', 'entity.name.function.php']
      expect(tokens[3]).toEqual value: '(', scopes: ['source.php', 'meta.method-call.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[4]).toEqual value: '5', scopes: ['source.php', 'meta.method-call.php', 'constant.numeric.decimal.php']
      expect(tokens[5]).toEqual value: ',', scopes: ['source.php', 'meta.method-call.php', 'punctuation.separator.delimiter.php']
      expect(tokens[6]).toEqual value: ' ', scopes: ['source.php', 'meta.method-call.php']
      expect(tokens[7]).toEqual value: "'", scopes: ['source.php', 'meta.method-call.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
      expect(tokens[8]).toEqual value: 'b', scopes: ['source.php', 'meta.method-call.php', 'string.quoted.single.php']
      expect(tokens[9]).toEqual value: "'", scopes: ['source.php', 'meta.method-call.php', 'string.quoted.single.php', 'punctuation.definition.string.end.php']
      expect(tokens[10]).toEqual value: ')', scopes: ['source.php', 'meta.method-call.php', 'punctuation.definition.arguments.end.bracket.round.php']

      {tokens} = grammar.tokenizeLine "obj->method (5, 'b')"

      expect(tokens[2]).toEqual value: 'method', scopes: ['source.php', 'meta.method-call.php', 'entity.name.function.php']
      expect(tokens[3]).toEqual value: ' ', scopes: ['source.php', 'meta.method-call.php']
      expect(tokens[4]).toEqual value: '(', scopes: ['source.php', 'meta.method-call.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[5]).toEqual value: '5', scopes: ['source.php', 'meta.method-call.php', 'constant.numeric.decimal.php']
      expect(tokens[6]).toEqual value: ',', scopes: ['source.php', 'meta.method-call.php', 'punctuation.separator.delimiter.php']
      expect(tokens[7]).toEqual value: ' ', scopes: ['source.php', 'meta.method-call.php']
      expect(tokens[8]).toEqual value: "'", scopes: ['source.php', 'meta.method-call.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
      expect(tokens[9]).toEqual value: 'b', scopes: ['source.php', 'meta.method-call.php', 'string.quoted.single.php']
      expect(tokens[10]).toEqual value: "'", scopes: ['source.php', 'meta.method-call.php', 'string.quoted.single.php', 'punctuation.definition.string.end.php']
      expect(tokens[11]).toEqual value: ')', scopes: ['source.php', 'meta.method-call.php', 'punctuation.definition.arguments.end.bracket.round.php']

  describe 'the scope resolution operator', ->
    it 'tokenizes static method calls with no arguments', ->
      {tokens} = grammar.tokenizeLine 'obj::method()'

      expect(tokens[0]).toEqual value: 'obj', scopes: ['source.php', 'support.class.php']
      expect(tokens[1]).toEqual value: '::', scopes: ['source.php', 'meta.method-call.static.php', 'keyword.operator.class.php']
      expect(tokens[2]).toEqual value: 'method', scopes: ['source.php', 'meta.method-call.static.php', 'entity.name.function.php']
      expect(tokens[3]).toEqual value: '(', scopes: ['source.php', 'meta.method-call.static.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[4]).toEqual value: ')', scopes: ['source.php', 'meta.method-call.static.php', 'punctuation.definition.arguments.end.bracket.round.php']

      {tokens} = grammar.tokenizeLine 'obj :: method ()'

      expect(tokens[0]).toEqual value: 'obj', scopes: ['source.php', 'support.class.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php']
      expect(tokens[2]).toEqual value: '::', scopes: ['source.php', 'meta.method-call.static.php', 'keyword.operator.class.php']
      expect(tokens[3]).toEqual value: ' ', scopes: ['source.php', 'meta.method-call.static.php']
      expect(tokens[4]).toEqual value: 'method', scopes: ['source.php', 'meta.method-call.static.php', 'entity.name.function.php']
      expect(tokens[5]).toEqual value: ' ', scopes: ['source.php', 'meta.method-call.static.php']
      expect(tokens[6]).toEqual value: '(', scopes: ['source.php', 'meta.method-call.static.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[7]).toEqual value: ')', scopes: ['source.php', 'meta.method-call.static.php', 'punctuation.definition.arguments.end.bracket.round.php']

    it 'tokenizes static method calls with arguments', ->
      {tokens} = grammar.tokenizeLine "obj::method(5, 'b')"

      expect(tokens[0]).toEqual value: 'obj', scopes: ['source.php', 'support.class.php']
      expect(tokens[1]).toEqual value: '::', scopes: ['source.php', 'meta.method-call.static.php', 'keyword.operator.class.php']
      expect(tokens[2]).toEqual value: 'method', scopes: ['source.php', 'meta.method-call.static.php', 'entity.name.function.php']
      expect(tokens[3]).toEqual value: '(', scopes: ['source.php', 'meta.method-call.static.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[4]).toEqual value: '5', scopes: ['source.php', 'meta.method-call.static.php', 'constant.numeric.decimal.php']
      expect(tokens[5]).toEqual value: ',', scopes: ['source.php', 'meta.method-call.static.php', 'punctuation.separator.delimiter.php']
      expect(tokens[6]).toEqual value: ' ', scopes: ['source.php', 'meta.method-call.static.php']
      expect(tokens[7]).toEqual value: "'", scopes: ['source.php', 'meta.method-call.static.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
      expect(tokens[8]).toEqual value: 'b', scopes: ['source.php', 'meta.method-call.static.php', 'string.quoted.single.php']
      expect(tokens[9]).toEqual value: "'", scopes: ['source.php', 'meta.method-call.static.php', 'string.quoted.single.php', 'punctuation.definition.string.end.php']
      expect(tokens[10]).toEqual value: ')', scopes: ['source.php', 'meta.method-call.static.php', 'punctuation.definition.arguments.end.bracket.round.php']

      {tokens} = grammar.tokenizeLine "obj :: method (5, 'b')"

      expect(tokens[0]).toEqual value: 'obj', scopes: ['source.php', 'support.class.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php']
      expect(tokens[2]).toEqual value: '::', scopes: ['source.php', 'meta.method-call.static.php', 'keyword.operator.class.php']
      expect(tokens[3]).toEqual value: ' ', scopes: ['source.php', 'meta.method-call.static.php']
      expect(tokens[4]).toEqual value: 'method', scopes: ['source.php', 'meta.method-call.static.php', 'entity.name.function.php']
      expect(tokens[5]).toEqual value: ' ', scopes: ['source.php', 'meta.method-call.static.php']
      expect(tokens[6]).toEqual value: '(', scopes: ['source.php', 'meta.method-call.static.php', 'punctuation.definition.arguments.begin.bracket.round.php']
      expect(tokens[7]).toEqual value: '5', scopes: ['source.php', 'meta.method-call.static.php', 'constant.numeric.decimal.php']
      expect(tokens[8]).toEqual value: ',', scopes: ['source.php', 'meta.method-call.static.php', 'punctuation.separator.delimiter.php']
      expect(tokens[9]).toEqual value: ' ', scopes: ['source.php', 'meta.method-call.static.php']
      expect(tokens[10]).toEqual value: "'", scopes: ['source.php', 'meta.method-call.static.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
      expect(tokens[11]).toEqual value: 'b', scopes: ['source.php', 'meta.method-call.static.php', 'string.quoted.single.php']
      expect(tokens[12]).toEqual value: "'", scopes: ['source.php', 'meta.method-call.static.php', 'string.quoted.single.php', 'punctuation.definition.string.end.php']
      expect(tokens[13]).toEqual value: ')', scopes: ['source.php', 'meta.method-call.static.php', 'punctuation.definition.arguments.end.bracket.round.php']

    it 'tokenizes class variables', ->
      {tokens} = grammar.tokenizeLine 'obj::$variable'

      expect(tokens[0]).toEqual value: 'obj', scopes: ['source.php', 'support.class.php']
      expect(tokens[1]).toEqual value: '::', scopes: ['source.php', 'keyword.operator.class.php']
      expect(tokens[2]).toEqual value: '$', scopes: ['source.php', 'variable.other.class.php', 'punctuation.definition.variable.php']
      expect(tokens[3]).toEqual value: 'variable', scopes: ['source.php', 'variable.other.class.php']

      {tokens} = grammar.tokenizeLine 'obj :: $variable'

      expect(tokens[0]).toEqual value: 'obj', scopes: ['source.php', 'support.class.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php']
      expect(tokens[2]).toEqual value: '::', scopes: ['source.php', 'keyword.operator.class.php']
      expect(tokens[3]).toEqual value: ' ', scopes: ['source.php']
      expect(tokens[4]).toEqual value: '$', scopes: ['source.php', 'variable.other.class.php', 'punctuation.definition.variable.php']
      expect(tokens[5]).toEqual value: 'variable', scopes: ['source.php', 'variable.other.class.php']

    it 'tokenizes class constants', ->
      {tokens} = grammar.tokenizeLine 'obj::constant'

      expect(tokens[0]).toEqual value: 'obj', scopes: ['source.php', 'support.class.php']
      expect(tokens[1]).toEqual value: '::', scopes: ['source.php', 'keyword.operator.class.php']
      expect(tokens[2]).toEqual value: 'constant', scopes: ['source.php', 'constant.other.class.php']

      {tokens} = grammar.tokenizeLine 'obj :: constant'

      expect(tokens[0]).toEqual value: 'obj', scopes: ['source.php', 'support.class.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php']
      expect(tokens[2]).toEqual value: '::', scopes: ['source.php', 'keyword.operator.class.php']
      expect(tokens[3]).toEqual value: ' ', scopes: ['source.php']
      expect(tokens[4]).toEqual value: 'constant', scopes: ['source.php', 'constant.other.class.php']

    it 'tokenizes namespaced classes', ->
      {tokens} = grammar.tokenizeLine '\\One\\Two\\Three::$var'

      expect(tokens[0]).toEqual value: '\\', scopes: ['source.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[1]).toEqual value: 'One', scopes: ['source.php', 'support.other.namespace.php']
      expect(tokens[2]).toEqual value: '\\', scopes: ['source.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[3]).toEqual value: 'Two', scopes: ['source.php', 'support.other.namespace.php']
      expect(tokens[4]).toEqual value: '\\', scopes: ['source.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
      expect(tokens[5]).toEqual value: 'Three', scopes: ['source.php', 'support.class.php']
      expect(tokens[6]).toEqual value: '::', scopes: ['source.php', 'keyword.operator.class.php']
      expect(tokens[7]).toEqual value: '$', scopes: ['source.php', 'variable.other.class.php', 'punctuation.definition.variable.php']
      expect(tokens[8]).toEqual value: 'var', scopes: ['source.php', 'variable.other.class.php']

    it 'tokenizes the special "class" keyword', ->
      {tokens} = grammar.tokenizeLine 'obj::class'

      expect(tokens[0]).toEqual value: 'obj', scopes: ['source.php', 'support.class.php']
      expect(tokens[1]).toEqual value: '::', scopes: ['source.php', 'keyword.operator.class.php']
      expect(tokens[2]).toEqual value: 'class', scopes: ['source.php', 'keyword.other.class.php']

      {tokens} = grammar.tokenizeLine 'obj :: class'

      expect(tokens[0]).toEqual value: 'obj', scopes: ['source.php', 'support.class.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php']
      expect(tokens[2]).toEqual value: '::', scopes: ['source.php', 'keyword.operator.class.php']
      expect(tokens[3]).toEqual value: ' ', scopes: ['source.php']
      expect(tokens[4]).toEqual value: 'class', scopes: ['source.php', 'keyword.other.class.php']

      # Should NOT be tokenized as `keyword.other.class`
      {tokens} = grammar.tokenizeLine 'obj::classic'

      expect(tokens[0]).toEqual value: 'obj', scopes: ['source.php', 'support.class.php']
      expect(tokens[1]).toEqual value: '::', scopes: ['source.php', 'keyword.operator.class.php']
      expect(tokens[2]).toEqual value: 'classic', scopes: ['source.php', 'constant.other.class.php']

  describe 'try/catch', ->
    it 'tokenizes a basic try/catch block', ->
      {tokens} = grammar.tokenizeLine 'try {} catch(Exception $e) {}'

      expect(tokens[0]).toEqual value: 'try', scopes: ['source.php', 'keyword.control.exception.php']
      expect(tokens[2]).toEqual value: '{', scopes: ['source.php', 'punctuation.definition.begin.bracket.curly.php']
      expect(tokens[3]).toEqual value: '}', scopes: ['source.php', 'punctuation.definition.end.bracket.curly.php']
      expect(tokens[5]).toEqual value: 'catch', scopes: ['source.php', 'meta.catch.php', 'keyword.control.exception.catch.php']
      expect(tokens[6]).toEqual value: '(', scopes: ['source.php', 'meta.catch.php', 'punctuation.definition.parameters.begin.bracket.round.php']
      expect(tokens[7]).toEqual value: 'Exception', scopes: ['source.php', 'meta.catch.php', 'support.class.exception.php']
      expect(tokens[8]).toEqual value: ' ', scopes: ['source.php', 'meta.catch.php']
      expect(tokens[9]).toEqual value: '$', scopes: ['source.php', 'meta.catch.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[10]).toEqual value: 'e', scopes: ['source.php', 'meta.catch.php', 'variable.other.php']
      expect(tokens[11]).toEqual value: ')', scopes: ['source.php', 'meta.catch.php', 'punctuation.definition.parameters.end.bracket.round.php']
      expect(tokens[13]).toEqual value: '{', scopes: ['source.php', 'punctuation.definition.begin.bracket.curly.php']
      expect(tokens[14]).toEqual value: '}', scopes: ['source.php', 'punctuation.definition.end.bracket.curly.php']

      {tokens} = grammar.tokenizeLine 'try {} catch (Exception $e) {}'

      expect(tokens[0]).toEqual value: 'try', scopes: ['source.php', 'keyword.control.exception.php']
      expect(tokens[2]).toEqual value: '{', scopes: ['source.php', 'punctuation.definition.begin.bracket.curly.php']
      expect(tokens[3]).toEqual value: '}', scopes: ['source.php', 'punctuation.definition.end.bracket.curly.php']
      expect(tokens[5]).toEqual value: 'catch', scopes: ['source.php', 'meta.catch.php', 'keyword.control.exception.catch.php']
      expect(tokens[6]).toEqual value: ' ', scopes: ['source.php', 'meta.catch.php']
      expect(tokens[7]).toEqual value: '(', scopes: ['source.php', 'meta.catch.php', 'punctuation.definition.parameters.begin.bracket.round.php']
      expect(tokens[8]).toEqual value: 'Exception', scopes: ['source.php', 'meta.catch.php', 'support.class.exception.php']
      expect(tokens[9]).toEqual value: ' ', scopes: ['source.php', 'meta.catch.php']
      expect(tokens[10]).toEqual value: '$', scopes: ['source.php', 'meta.catch.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[11]).toEqual value: 'e', scopes: ['source.php', 'meta.catch.php', 'variable.other.php']
      expect(tokens[12]).toEqual value: ')', scopes: ['source.php', 'meta.catch.php', 'punctuation.definition.parameters.end.bracket.round.php']
      expect(tokens[14]).toEqual value: '{', scopes: ['source.php', 'punctuation.definition.begin.bracket.curly.php']
      expect(tokens[15]).toEqual value: '}', scopes: ['source.php', 'punctuation.definition.end.bracket.curly.php']

    it 'tokenizes a catch block containing multiple exceptions', ->
      {tokens} = grammar.tokenizeLine 'try {} catch(AException | BException | CException $e) {}'

      expect(tokens[5]).toEqual value: 'catch', scopes: ['source.php', 'meta.catch.php', 'keyword.control.exception.catch.php']
      expect(tokens[6]).toEqual value: '(', scopes: ['source.php', 'meta.catch.php', 'punctuation.definition.parameters.begin.bracket.round.php']
      expect(tokens[7]).toEqual value: 'AException', scopes: ['source.php', 'meta.catch.php', 'support.class.exception.php']
      expect(tokens[8]).toEqual value: ' ', scopes: ['source.php', 'meta.catch.php']
      expect(tokens[9]).toEqual value: '|', scopes: ['source.php', 'meta.catch.php', 'punctuation.separator.delimiter.php']
      expect(tokens[10]).toEqual value: ' ', scopes: ['source.php', 'meta.catch.php']
      expect(tokens[11]).toEqual value: 'BException', scopes: ['source.php', 'meta.catch.php', 'support.class.exception.php']
      expect(tokens[13]).toEqual value: '|', scopes: ['source.php', 'meta.catch.php', 'punctuation.separator.delimiter.php']
      expect(tokens[15]).toEqual value: 'CException', scopes: ['source.php', 'meta.catch.php', 'support.class.exception.php']
      expect(tokens[17]).toEqual value: '$', scopes: ['source.php', 'meta.catch.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(tokens[18]).toEqual value: 'e', scopes: ['source.php', 'meta.catch.php', 'variable.other.php']
      expect(tokens[19]).toEqual value: ')', scopes: ['source.php', 'meta.catch.php', 'punctuation.definition.parameters.end.bracket.round.php']
      expect(tokens[21]).toEqual value: '{', scopes: ['source.php', 'punctuation.definition.begin.bracket.curly.php']
      expect(tokens[22]).toEqual value: '}', scopes: ['source.php', 'punctuation.definition.end.bracket.curly.php']

  describe 'numbers', ->
    it 'tokenizes hexadecimals', ->
      {tokens} = grammar.tokenizeLine '0x1D306'
      expect(tokens[0]).toEqual value: '0x1D306', scopes: ['source.php', 'constant.numeric.hex.php']

      {tokens} = grammar.tokenizeLine '0X1D306'
      expect(tokens[0]).toEqual value: '0X1D306', scopes: ['source.php', 'constant.numeric.hex.php']

    it 'tokenizes binary literals', ->
      {tokens} = grammar.tokenizeLine '0b011101110111010001100110'
      expect(tokens[0]).toEqual value: '0b011101110111010001100110', scopes: ['source.php', 'constant.numeric.binary.php']

      {tokens} = grammar.tokenizeLine '0B011101110111010001100110'
      expect(tokens[0]).toEqual value: '0B011101110111010001100110', scopes: ['source.php', 'constant.numeric.binary.php']

    it 'tokenizes octal literals', ->
      {tokens} = grammar.tokenizeLine '01411'
      expect(tokens[0]).toEqual value: '01411', scopes: ['source.php', 'constant.numeric.octal.php']

      {tokens} = grammar.tokenizeLine '0010'
      expect(tokens[0]).toEqual value: '0010', scopes: ['source.php', 'constant.numeric.octal.php']

    it 'tokenizes decimals', ->
      {tokens} = grammar.tokenizeLine '1234'
      expect(tokens[0]).toEqual value: '1234', scopes: ['source.php', 'constant.numeric.decimal.php']

      {tokens} = grammar.tokenizeLine '5e-10'
      expect(tokens[0]).toEqual value: '5e-10', scopes: ['source.php', 'constant.numeric.decimal.php']

      {tokens} = grammar.tokenizeLine '5E+5'
      expect(tokens[0]).toEqual value: '5E+5', scopes: ['source.php', 'constant.numeric.decimal.php']

      {tokens} = grammar.tokenizeLine '9.'
      expect(tokens[0]).toEqual value: '9', scopes: ['source.php', 'constant.numeric.decimal.php']
      expect(tokens[1]).toEqual value: '.', scopes: ['source.php', 'constant.numeric.decimal.php', 'punctuation.separator.decimal.period.php']

      {tokens} = grammar.tokenizeLine '.9'
      expect(tokens[0]).toEqual value: '.', scopes: ['source.php', 'constant.numeric.decimal.php', 'punctuation.separator.decimal.period.php']
      expect(tokens[1]).toEqual value: '9', scopes: ['source.php', 'constant.numeric.decimal.php']

      {tokens} = grammar.tokenizeLine '9.9'
      expect(tokens[0]).toEqual value: '9', scopes: ['source.php', 'constant.numeric.decimal.php']
      expect(tokens[1]).toEqual value: '.', scopes: ['source.php', 'constant.numeric.decimal.php', 'punctuation.separator.decimal.period.php']
      expect(tokens[2]).toEqual value: '9', scopes: ['source.php', 'constant.numeric.decimal.php']

      {tokens} = grammar.tokenizeLine '.1e-23'
      expect(tokens[0]).toEqual value: '.', scopes: ['source.php', 'constant.numeric.decimal.php', 'punctuation.separator.decimal.period.php']
      expect(tokens[1]).toEqual value: '1e-23', scopes: ['source.php', 'constant.numeric.decimal.php']

      {tokens} = grammar.tokenizeLine '1.E3'
      expect(tokens[0]).toEqual value: '1', scopes: ['source.php', 'constant.numeric.decimal.php']
      expect(tokens[1]).toEqual value: '.', scopes: ['source.php', 'constant.numeric.decimal.php', 'punctuation.separator.decimal.period.php']
      expect(tokens[2]).toEqual value: 'E3', scopes: ['source.php', 'constant.numeric.decimal.php']

  it 'should tokenize switch statements correctly', ->
    lines = grammar.tokenizeLines '''
      switch($something)
      {
        case 'string':
          return 1;
        case 1:
          break;
        default:
          continue;
      }
    '''

    expect(lines[0][0]).toEqual value: 'switch', scopes: ['source.php', 'meta.switch-statement.php', 'keyword.control.switch.php']
    expect(lines[0][1]).toEqual value: '(', scopes: ['source.php', 'meta.switch-statement.php', 'punctuation.definition.switch-expression.begin.bracket.round.php']
    expect(lines[0][2]).toEqual value: '$', scopes: ['source.php', 'meta.switch-statement.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(lines[0][3]).toEqual value: 'something', scopes: ['source.php', 'meta.switch-statement.php', 'variable.other.php']
    expect(lines[0][4]).toEqual value: ')', scopes: ['source.php', 'meta.switch-statement.php', 'punctuation.definition.switch-expression.end.bracket.round.php']
    expect(lines[1][0]).toEqual value: '{', scopes: ['source.php', 'meta.switch-statement.php', 'punctuation.definition.section.switch-block.begin.bracket.curly.php']
    expect(lines[2][1]).toEqual value: 'case', scopes: ['source.php', 'meta.switch-statement.php', 'keyword.control.case.php']
    expect(lines[2][2]).toEqual value: ' ', scopes: ['source.php', 'meta.switch-statement.php']
    expect(lines[2][3]).toEqual value: "'", scopes: ['source.php', 'meta.switch-statement.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
    expect(lines[2][6]).toEqual value: ':', scopes: ['source.php', 'meta.switch-statement.php', 'punctuation.terminator.statement.php']
    expect(lines[3][1]).toEqual value: 'return', scopes: ['source.php', 'meta.switch-statement.php', 'keyword.control.return.php']
    expect(lines[4][1]).toEqual value: 'case', scopes: ['source.php', 'meta.switch-statement.php', 'keyword.control.case.php']
    expect(lines[4][2]).toEqual value: ' ', scopes: ['source.php', 'meta.switch-statement.php']
    expect(lines[4][3]).toEqual value: '1', scopes: ['source.php', 'meta.switch-statement.php', 'constant.numeric.decimal.php']
    expect(lines[4][4]).toEqual value: ':', scopes: ['source.php', 'meta.switch-statement.php', 'punctuation.terminator.statement.php']
    expect(lines[5][1]).toEqual value: 'break', scopes: ['source.php', 'meta.switch-statement.php', 'keyword.control.break.php']
    expect(lines[6][1]).toEqual value: 'default', scopes: ['source.php', 'meta.switch-statement.php', 'keyword.control.default.php']
    expect(lines[6][2]).toEqual value: ':', scopes: ['source.php', 'meta.switch-statement.php', 'punctuation.terminator.statement.php']
    expect(lines[7][1]).toEqual value: 'continue', scopes: ['source.php', 'meta.switch-statement.php', 'keyword.control.continue.php']
    expect(lines[8][0]).toEqual value: '}', scopes: ['source.php', 'meta.switch-statement.php', 'punctuation.definition.section.switch-block.end.bracket.curly.php']

  it 'should tokenize storage types correctly', ->
    {tokens} = grammar.tokenizeLine '(int)'

    expect(tokens[0]).toEqual value: '(', scopes: ['source.php', 'punctuation.definition.storage-type.begin.bracket.round.php']
    expect(tokens[1]).toEqual value: 'int', scopes: ['source.php', 'storage.type.php']
    expect(tokens[2]).toEqual value: ')', scopes: ['source.php', 'punctuation.definition.storage-type.end.bracket.round.php']

    {tokens} = grammar.tokenizeLine '( int )'

    expect(tokens[0]).toEqual value: '(', scopes: ['source.php', 'punctuation.definition.storage-type.begin.bracket.round.php']
    expect(tokens[1]).toEqual value: ' ', scopes: ['source.php']
    expect(tokens[2]).toEqual value: 'int', scopes: ['source.php', 'storage.type.php']
    expect(tokens[3]).toEqual value: ' ', scopes: ['source.php']
    expect(tokens[4]).toEqual value: ')', scopes: ['source.php', 'punctuation.definition.storage-type.end.bracket.round.php']

  describe 'PHPDoc', ->
    it 'should tokenize @api tag correctly', ->
      lines = grammar.tokenizeLines '''
        /**
        *@api
        */
      '''

      expect(lines[0][0]).toEqual value: '/**', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']
      expect(lines[1][0]).toEqual value: '*', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']
      expect(lines[1][1]).toEqual value: '@api', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
      expect(lines[2][0]).toEqual value: '*/', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']

    it 'should tokenize @method tag correctly', ->
      lines = grammar.tokenizeLines '''
        /**
        *@method
        */
      '''

      expect(lines[0][0]).toEqual value: '/**', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']
      expect(lines[1][0]).toEqual value: '*', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']
      expect(lines[1][1]).toEqual value: '@method', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
      expect(lines[2][0]).toEqual value: '*/', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']

    it 'should tokenize @property tag correctly', ->
      lines = grammar.tokenizeLines '''
        /**
        *@property
        */
      '''

      expect(lines[0][0]).toEqual value: '/**', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']
      expect(lines[1][0]).toEqual value: '*', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']
      expect(lines[1][1]).toEqual value: '@property', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
      expect(lines[2][0]).toEqual value: '*/', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']

    it 'should tokenize @property-read tag correctly', ->
      lines = grammar.tokenizeLines '''
        /**
        *@property-read
        */
      '''

      expect(lines[0][0]).toEqual value: '/**', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']
      expect(lines[1][0]).toEqual value: '*', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']
      expect(lines[1][1]).toEqual value: '@property-read', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
      expect(lines[2][0]).toEqual value: '*/', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']

    it 'should tokenize @property-write tag correctly', ->
      lines = grammar.tokenizeLines '''
        /**
        *@property-write
        */
      '''

      expect(lines[0][0]).toEqual value: '/**', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']
      expect(lines[1][0]).toEqual value: '*', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']
      expect(lines[1][1]).toEqual value: '@property-write', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
      expect(lines[2][0]).toEqual value: '*/', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']

    it 'should tokenize @source tag correctly', ->
      lines = grammar.tokenizeLines '''
        /**
        *@source
        */
      '''

      expect(lines[0][0]).toEqual value: '/**', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']
      expect(lines[1][0]).toEqual value: '*', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']
      expect(lines[1][1]).toEqual value: '@source', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
      expect(lines[2][0]).toEqual value: '*/', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']

    it 'should tokenize an inline phpdoc correctly', ->
      {tokens} = grammar.tokenizeLine '/** @var */'

      expect(tokens[0]).toEqual value: '/**', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']
      expect(tokens[2]).toEqual value: '@var', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
      expect(tokens[3]).toEqual value: ' ', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']
      expect(tokens[4]).toEqual value: '*/', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']

    describe 'types', ->
      it 'should tokenize a single type', ->
        lines = grammar.tokenizeLines '''
          /**
          *@param int description
        '''

        expect(lines[1][1]).toEqual value: '@param', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
        expect(lines[1][2]).toEqual value: ' ', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']
        expect(lines[1][3]).toEqual value: 'int', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.type.php']
        expect(lines[1][4]).toEqual value: ' description', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']

        lines = grammar.tokenizeLines '''
          /**
          *@param Test description
        '''

        expect(lines[1][1]).toEqual value: '@param', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
        expect(lines[1][2]).toEqual value: ' ', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']
        expect(lines[1][3]).toEqual value: 'Test', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.class.php']
        expect(lines[1][4]).toEqual value: ' description', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']

      it 'should tokenize a single namespaced type', ->
        lines = grammar.tokenizeLines '''
          /**
          *@param \\Test\\Type description
        '''

        expect(lines[1][1]).toEqual value: '@param', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
        expect(lines[1][2]).toEqual value: ' ', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']
        expect(lines[1][3]).toEqual value: '\\', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
        expect(lines[1][4]).toEqual value: 'Test', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.other.namespace.php']
        expect(lines[1][5]).toEqual value: '\\', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
        expect(lines[1][6]).toEqual value: 'Type', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.class.php']
        expect(lines[1][7]).toEqual value: ' description', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']

      it 'should tokenize multiple types', ->
        lines = grammar.tokenizeLines '''
          /**
          *@param int|Class description
        '''

        expect(lines[1][1]).toEqual value: '@param', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
        expect(lines[1][2]).toEqual value: ' ', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']
        expect(lines[1][3]).toEqual value: 'int', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.type.php']
        expect(lines[1][4]).toEqual value: '|', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'punctuation.separator.delimiter.php']
        expect(lines[1][5]).toEqual value: 'Class', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.class.php']
        expect(lines[1][6]).toEqual value: ' description', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']

      it 'should tokenize multiple namespaced types', ->
        lines = grammar.tokenizeLines '''
          /**
          *@param Test\\One|\\Another\\Root description
        '''

        expect(lines[1][1]).toEqual value: '@param', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
        expect(lines[1][2]).toEqual value: ' ', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']
        expect(lines[1][3]).toEqual value: 'Test', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.other.namespace.php']
        expect(lines[1][4]).toEqual value: '\\', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
        expect(lines[1][5]).toEqual value: 'One', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.class.php']
        expect(lines[1][6]).toEqual value: '|', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'punctuation.separator.delimiter.php']
        expect(lines[1][7]).toEqual value: '\\', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
        expect(lines[1][8]).toEqual value: 'Another', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.other.namespace.php']
        expect(lines[1][9]).toEqual value: '\\', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
        expect(lines[1][10]).toEqual value: 'Root', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.class.php']
        expect(lines[1][11]).toEqual value: ' description', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']

      it 'should tokenize a single array type', ->
        lines = grammar.tokenizeLines '''
          /**
          *@param int[] description
        '''

        expect(lines[1][1]).toEqual value: '@param', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
        expect(lines[1][2]).toEqual value: ' ', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']
        expect(lines[1][3]).toEqual value: 'int', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.type.php']
        expect(lines[1][4]).toEqual value: '[]', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.array.phpdoc.php']
        expect(lines[1][5]).toEqual value: ' description', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']

        lines = grammar.tokenizeLines '''
          /**
          *@param Test[] description
        '''

        expect(lines[1][1]).toEqual value: '@param', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
        expect(lines[1][2]).toEqual value: ' ', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']
        expect(lines[1][3]).toEqual value: 'Test', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.class.php']
        expect(lines[1][4]).toEqual value: '[]', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.array.phpdoc.php']
        expect(lines[1][5]).toEqual value: ' description', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']

      it 'should tokenize a single namespaced array type', ->
        lines = grammar.tokenizeLines '''
          /**
          *@param Test\\Type[] description
        '''

        expect(lines[1][1]).toEqual value: '@param', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
        expect(lines[1][2]).toEqual value: ' ', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']
        expect(lines[1][3]).toEqual value: 'Test', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.other.namespace.php']
        expect(lines[1][4]).toEqual value: '\\', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
        expect(lines[1][5]).toEqual value: 'Type', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.class.php']
        expect(lines[1][6]).toEqual value: '[]', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.array.phpdoc.php']
        expect(lines[1][7]).toEqual value: ' description', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']

      it 'should tokenize multiple array types', ->
        lines = grammar.tokenizeLines '''
          /**
          *@param (int|Class)[] description
        '''

        expect(lines[1][1]).toEqual value: '@param', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
        expect(lines[1][2]).toEqual value: ' ', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']
        expect(lines[1][3]).toEqual value: '(', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'punctuation.definition.type.begin.bracket.round.phpdoc.php']
        expect(lines[1][4]).toEqual value: 'int', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.type.php']
        expect(lines[1][5]).toEqual value: '|', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'punctuation.separator.delimiter.php']
        expect(lines[1][6]).toEqual value: 'Class', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.class.php']
        expect(lines[1][7]).toEqual value: ')', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'punctuation.definition.type.end.bracket.round.phpdoc.php']
        expect(lines[1][8]).toEqual value: '[]', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.array.phpdoc.php']

        lines = grammar.tokenizeLines '''
          /**
          *@param ((Test|int)[]|Test\\Type[]|string[]|resource)[] description
        '''

        expect(lines[1][1]).toEqual value: '@param', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'keyword.other.phpdoc.php']
        expect(lines[1][2]).toEqual value: ' ', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']
        expect(lines[1][3]).toEqual value: '(', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'punctuation.definition.type.begin.bracket.round.phpdoc.php']
        expect(lines[1][4]).toEqual value: '(', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'punctuation.definition.type.begin.bracket.round.phpdoc.php']
        expect(lines[1][5]).toEqual value: 'Test', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.class.php']
        expect(lines[1][6]).toEqual value: '|', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'punctuation.separator.delimiter.php']
        expect(lines[1][7]).toEqual value: 'int', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.type.php']
        expect(lines[1][8]).toEqual value: ')', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'punctuation.definition.type.end.bracket.round.phpdoc.php']
        expect(lines[1][9]).toEqual value: '[]', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.array.phpdoc.php']
        expect(lines[1][10]).toEqual value: '|', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'punctuation.separator.delimiter.php']
        expect(lines[1][11]).toEqual value: 'Test', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.other.namespace.php']
        expect(lines[1][12]).toEqual value: '\\', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
        expect(lines[1][13]).toEqual value: 'Type', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'support.class.php']
        expect(lines[1][14]).toEqual value: '[]', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.array.phpdoc.php']
        expect(lines[1][15]).toEqual value: '|', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'punctuation.separator.delimiter.php']
        expect(lines[1][16]).toEqual value: 'string', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.type.php']
        expect(lines[1][17]).toEqual value: '[]', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.array.phpdoc.php']
        expect(lines[1][18]).toEqual value: '|', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'punctuation.separator.delimiter.php']
        expect(lines[1][19]).toEqual value: 'resource', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.type.php']
        expect(lines[1][20]).toEqual value: ')', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'punctuation.definition.type.end.bracket.round.phpdoc.php']
        expect(lines[1][21]).toEqual value: '[]', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'meta.other.type.phpdoc.php', 'keyword.other.array.phpdoc.php']
        expect(lines[1][22]).toEqual value: ' description', scopes: ['source.php', 'comment.block.documentation.phpdoc.php']

      it 'should end the PHPDoc at the ending comment even if there are malformed types', ->
        {tokens} = grammar.tokenizeLine '/** @var array(string) */'

        expect(tokens[8]).toEqual value: '*/', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']

    it 'should not tokenize /*** as phpdoc', ->
      {tokens} = grammar.tokenizeLine '/*** @var */'

      expect(tokens[0].scopes).not.toContain 'comment.block.documentation.phpdoc.php'

    it 'should tokenize malformed phpDocumentor DocBlock line that contains closing tag correctly', ->
      lines = grammar.tokenizeLines '''
        /**
        invalid*/$a=1;
      '''

      expect(lines[0][0]).toEqual value: '/**', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']
      expect(lines[1][0]).toEqual value: 'invalid', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'invalid.illegal.missing-asterisk.phpdoc.php']
      expect(lines[1][1]).toEqual value: '*/', scopes: ['source.php', 'comment.block.documentation.phpdoc.php', 'punctuation.definition.comment.php']
      expect(lines[1][2]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']

  describe 'string escape sequences', ->
    it 'tokenizes escaped octal sequences', ->
      {tokens} = grammar.tokenizeLine '"test \\007 test";'

      expect(tokens[0]).toEqual value: '"', scopes: ['source.php', 'string.quoted.double.php', 'punctuation.definition.string.begin.php']
      expect(tokens[1]).toEqual value: 'test ', scopes: ['source.php', 'string.quoted.double.php']
      expect(tokens[2]).toEqual value: '\\007', scopes: ['source.php', 'string.quoted.double.php', 'constant.character.escape.octal.php']
      expect(tokens[3]).toEqual value: ' test', scopes: ['source.php', 'string.quoted.double.php']
      expect(tokens[4]).toEqual value: '"', scopes: ['source.php', 'string.quoted.double.php', 'punctuation.definition.string.end.php']
      expect(tokens[5]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

    it 'tokenizes escaped hex sequences', ->
      {tokens} = grammar.tokenizeLine '"test \\x0f test";'

      expect(tokens[0]).toEqual value: '"', scopes: ['source.php', 'string.quoted.double.php', 'punctuation.definition.string.begin.php']
      expect(tokens[1]).toEqual value: 'test ', scopes: ['source.php', 'string.quoted.double.php']
      expect(tokens[2]).toEqual value: '\\x0f', scopes: ['source.php', 'string.quoted.double.php', 'constant.character.escape.hex.php']
      expect(tokens[3]).toEqual value: ' test', scopes: ['source.php', 'string.quoted.double.php']
      expect(tokens[4]).toEqual value: '"', scopes: ['source.php', 'string.quoted.double.php', 'punctuation.definition.string.end.php']
      expect(tokens[5]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

    it 'tokenizes escaped unicode sequences', ->
      {tokens} = grammar.tokenizeLine '"test \\u{00A0} test";'

      expect(tokens[0]).toEqual value: '"', scopes: ['source.php', 'string.quoted.double.php', 'punctuation.definition.string.begin.php']
      expect(tokens[1]).toEqual value: 'test ', scopes: ['source.php', 'string.quoted.double.php']
      expect(tokens[2]).toEqual value: '\\u{00A0}', scopes: ['source.php', 'string.quoted.double.php', 'constant.character.escape.unicode.php']
      expect(tokens[3]).toEqual value: ' test', scopes: ['source.php', 'string.quoted.double.php']
      expect(tokens[4]).toEqual value: '"', scopes: ['source.php', 'string.quoted.double.php', 'punctuation.definition.string.end.php']
      expect(tokens[5]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

    for escapeCharacter in ['n', 'r', 't', 'v', 'e', 'f', '$', '"', '\\']
      it "tokenizes #{escapeCharacter} as an escape character", ->
        {tokens} = grammar.tokenizeLine "\"test \\#{escapeCharacter} test\";"

        expect(tokens[0]).toEqual value: '"', scopes: ['source.php', 'string.quoted.double.php', 'punctuation.definition.string.begin.php']
        expect(tokens[1]).toEqual value: 'test ', scopes: ['source.php', 'string.quoted.double.php']
        expect(tokens[2]).toEqual value: "\\#{escapeCharacter}", scopes: ['source.php', 'string.quoted.double.php', 'constant.character.escape.php']
        expect(tokens[3]).toEqual value: ' test', scopes: ['source.php', 'string.quoted.double.php']
        expect(tokens[4]).toEqual value: '"', scopes: ['source.php', 'string.quoted.double.php', 'punctuation.definition.string.end.php']
        expect(tokens[5]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize multiple inherited interfaces correctly', ->
    {tokens} = grammar.tokenizeLine 'interface Superman extends Bird, Plane {}'

    expect(tokens[0]).toEqual value: 'interface', scopes: ['source.php', 'meta.interface.php', 'storage.type.interface.php']
    expect(tokens[1]).toEqual value: ' ', scopes: ['source.php', 'meta.interface.php']
    expect(tokens[2]).toEqual value: 'Superman', scopes: ['source.php', 'meta.interface.php', 'entity.name.type.interface.php']
    expect(tokens[3]).toEqual value: ' ', scopes: ['source.php', 'meta.interface.php']
    expect(tokens[4]).toEqual value: 'extends', scopes: ['source.php', 'meta.interface.php', 'storage.modifier.extends.php']
    expect(tokens[5]).toEqual value: ' ', scopes: ['source.php', 'meta.interface.php']
    expect(tokens[6]).toEqual value: 'Bird', scopes: ['source.php', 'meta.interface.php', 'entity.other.inherited-class.php']
    expect(tokens[7]).toEqual value: ',', scopes: ['source.php', 'meta.interface.php', 'punctuation.separator.classes.php']
    expect(tokens[8]).toEqual value: ' ', scopes: ['source.php', 'meta.interface.php']
    expect(tokens[9]).toEqual value: 'Plane', scopes: ['source.php', 'meta.interface.php', 'entity.other.inherited-class.php']
    expect(tokens[10]).toEqual value: ' ', scopes: ['source.php', 'meta.interface.php']
    expect(tokens[11]).toEqual value: '{', scopes: ['source.php', 'punctuation.definition.begin.bracket.curly.php']
    expect(tokens[12]).toEqual value: '}', scopes: ['source.php', 'punctuation.definition.end.bracket.curly.php']

  it 'should tokenize trait correctly', ->
    {tokens} = grammar.tokenizeLine 'trait Test {}'

    expect(tokens[0]).toEqual value: 'trait', scopes: ['source.php', 'meta.trait.php', 'storage.type.trait.php']
    expect(tokens[1]).toEqual value: ' ', scopes: ['source.php', 'meta.trait.php']
    expect(tokens[2]).toEqual value: 'Test', scopes: ['source.php', 'meta.trait.php', 'entity.name.type.trait.php']
    expect(tokens[3]).toEqual value: ' ', scopes: ['source.php', 'meta.trait.php']
    expect(tokens[4]).toEqual value: '{', scopes: ['source.php', 'punctuation.definition.begin.bracket.curly.php']
    expect(tokens[5]).toEqual value: '}', scopes: ['source.php', 'punctuation.definition.end.bracket.curly.php']

  it 'should tokenize use const correctly', ->
    {tokens} = grammar.tokenizeLine 'use const Test\\Test\\CONSTANT;'

    expect(tokens[0]).toEqual value: 'use', scopes: ['source.php', 'meta.use.php', 'keyword.other.use.php']
    expect(tokens[1]).toEqual value: ' ', scopes: ['source.php', 'meta.use.php']
    expect(tokens[2]).toEqual value: 'const', scopes: ['source.php', 'meta.use.php', 'storage.type.const.php']
    expect(tokens[3]).toEqual value: ' ', scopes: ['source.php', 'meta.use.php']
    expect(tokens[4]).toEqual value: 'Test', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php']
    expect(tokens[5]).toEqual value: '\\', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
    expect(tokens[6]).toEqual value: 'Test', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php']
    expect(tokens[7]).toEqual value: '\\', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
    expect(tokens[8]).toEqual value: 'CONSTANT', scopes: ['source.php', 'meta.use.php', 'support.class.php']
    expect(tokens[9]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize use function correctly', ->
    {tokens} = grammar.tokenizeLine 'use function A\\B\\fun as func;'

    expect(tokens[0]).toEqual value: 'use', scopes: ['source.php', 'meta.use.php', 'keyword.other.use.php']
    expect(tokens[1]).toEqual value: ' ', scopes: ['source.php', 'meta.use.php']
    expect(tokens[2]).toEqual value: 'function', scopes: ['source.php', 'meta.use.php', 'storage.type.function.php']
    expect(tokens[3]).toEqual value: ' ', scopes: ['source.php', 'meta.use.php']
    expect(tokens[4]).toEqual value: 'A', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php']
    expect(tokens[5]).toEqual value: '\\', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
    expect(tokens[6]).toEqual value: 'B', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php']
    expect(tokens[7]).toEqual value: '\\', scopes: ['source.php', 'meta.use.php', 'support.other.namespace.php', 'punctuation.separator.inheritance.php']
    expect(tokens[8]).toEqual value: 'fun', scopes: ['source.php', 'meta.use.php', 'support.class.php']
    expect(tokens[9]).toEqual value: ' ', scopes: ['source.php', 'meta.use.php']
    expect(tokens[10]).toEqual value: 'as', scopes: ['source.php', 'meta.use.php', 'keyword.other.use-as.php']
    expect(tokens[11]).toEqual value: ' ', scopes: ['source.php', 'meta.use.php']
    expect(tokens[12]).toEqual value: 'func', scopes: ['source.php', 'meta.use.php', 'entity.other.alias.php']
    expect(tokens[13]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize yield correctly', ->
    {tokens} = grammar.tokenizeLine 'function test() { yield $a; }'

    expect(tokens[0]).toEqual value: 'function', scopes: ['source.php', 'meta.function.php', 'storage.type.function.php']
    expect(tokens[1]).toEqual value: ' ', scopes: ['source.php', 'meta.function.php']
    expect(tokens[2]).toEqual value: 'test', scopes: ['source.php', 'meta.function.php', 'entity.name.function.php']
    expect(tokens[3]).toEqual value: '(', scopes: ['source.php', 'meta.function.php', 'punctuation.definition.parameters.begin.bracket.round.php']
    expect(tokens[4]).toEqual value: ')', scopes: ['source.php', 'meta.function.php', 'punctuation.definition.parameters.end.bracket.round.php']
    expect(tokens[5]).toEqual value: ' ', scopes: ['source.php']
    expect(tokens[6]).toEqual value: '{', scopes: ['source.php', 'punctuation.definition.begin.bracket.curly.php']
    expect(tokens[7]).toEqual value: ' ', scopes: ['source.php']
    expect(tokens[8]).toEqual value: 'yield', scopes: ['source.php', 'keyword.control.yield.php']
    expect(tokens[9]).toEqual value: ' ', scopes: ['source.php']
    expect(tokens[10]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(tokens[11]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
    expect(tokens[12]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']
    expect(tokens[13]).toEqual value: ' ', scopes: ['source.php']
    expect(tokens[14]).toEqual value: '}', scopes: ['source.php', 'punctuation.definition.end.bracket.curly.php']

  it 'should tokenize embedded SQL in a string', ->
    waitsForPromise ->
      atom.packages.activatePackage('language-sql')

    runs ->
      delimsByScope =
        'string.quoted.double.sql.php': '"'
        'string.quoted.single.sql.php': "'"

      for scope, delim of delimsByScope
        {tokens} = grammar.tokenizeLine "#{delim}SELECT something#{delim}"

        expect(tokens[0]).toEqual value: delim, scopes: ['source.php', scope, 'punctuation.definition.string.begin.php']
        expect(tokens[1]).toEqual value: 'SELECT', scopes: ['source.php', scope, 'source.sql.embedded.php', 'keyword.other.DML.sql']
        expect(tokens[2]).toEqual value: ' something', scopes: ['source.php', scope, 'source.sql.embedded.php']
        expect(tokens[3]).toEqual value: delim, scopes: ['source.php', scope, 'punctuation.definition.string.end.php']

        lines = grammar.tokenizeLines """
          #{delim}SELECT something
          -- uh oh a comment SELECT#{delim}
        """
        expect(lines[1][0]).toEqual value: '--', scopes: ['source.php', scope, 'source.sql.embedded.php', 'comment.line.double-dash.sql', 'punctuation.definition.comment.sql']
        expect(lines[1][1]).toEqual value: ' uh oh a comment SELECT', scopes: ['source.php', scope, 'source.sql.embedded.php', 'comment.line.double-dash.sql']
        expect(lines[1][2]).toEqual value: delim, scopes: ['source.php', scope, 'punctuation.definition.string.end.php']

  it 'should tokenize single quoted string regex escape characters correctly', ->
    {tokens} = grammar.tokenizeLine "'/[\\\\\\\\]/';"

    expect(tokens[0]).toEqual value: '\'/', scopes: ['source.php', 'string.regexp.single-quoted.php', 'punctuation.definition.string.begin.php']
    expect(tokens[1]).toEqual value: '[', scopes: ['source.php', 'string.regexp.single-quoted.php', 'string.regexp.character-class.php', 'punctuation.definition.character-class.php']
    expect(tokens[2]).toEqual value: '\\\\\\\\', scopes: ['source.php', 'string.regexp.single-quoted.php', 'string.regexp.character-class.php']
    expect(tokens[3]).toEqual value: ']', scopes: ['source.php', 'string.regexp.single-quoted.php', 'string.regexp.character-class.php', 'punctuation.definition.character-class.php']
    expect(tokens[4]).toEqual value: '/\'', scopes: ['source.php', 'string.regexp.single-quoted.php', 'punctuation.definition.string.end.php']
    expect(tokens[5]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize single quoted string regex with escaped bracket', ->
    {tokens} = grammar.tokenizeLine "'/\\[/'"

    expect(tokens[0]).toEqual value: '\'/', scopes: ['source.php', 'string.regexp.single-quoted.php', 'punctuation.definition.string.begin.php']
    expect(tokens[1]).toEqual value: '\\[', scopes: ['source.php', 'string.regexp.single-quoted.php', 'constant.character.escape.php']
    expect(tokens[2]).toEqual value: '/\'', scopes: ['source.php', 'string.regexp.single-quoted.php', 'punctuation.definition.string.end.php']

  it 'should tokenize opening scope of a closure correctly', ->
    {tokens} = grammar.tokenizeLine '$a = function() {};'

    expect(tokens[0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(tokens[1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
    expect(tokens[2]).toEqual value: ' ', scopes: ['source.php']
    expect(tokens[3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
    expect(tokens[4]).toEqual value: ' ', scopes: ['source.php']
    expect(tokens[5]).toEqual value: 'function', scopes: ['source.php', 'meta.function.closure.php', 'storage.type.function.php']
    expect(tokens[6]).toEqual value: '(', scopes: ['source.php', 'meta.function.closure.php', 'punctuation.definition.parameters.begin.bracket.round.php']
    expect(tokens[7]).toEqual value: ')', scopes: ['source.php', 'meta.function.closure.php', 'punctuation.definition.parameters.end.bracket.round.php']
    expect(tokens[8]).toEqual value: ' ', scopes: ['source.php', 'meta.function.closure.php']
    expect(tokens[9]).toEqual value: '{', scopes: ['source.php', 'punctuation.definition.begin.bracket.curly.php']
    expect(tokens[10]).toEqual value: '}', scopes: ['source.php', 'punctuation.definition.end.bracket.curly.php']
    expect(tokens[11]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize non-function-non-control operations correctly', ->
    {tokens} = grammar.tokenizeLine "echo 'test';"

    expect(tokens[0]).toEqual value: 'echo', scopes: ['source.php', 'support.function.construct.output.php']
    expect(tokens[1]).toEqual value: ' ', scopes: ['source.php']
    expect(tokens[2]).toEqual value: '\'', scopes: ['source.php', 'string.quoted.single.php', 'punctuation.definition.string.begin.php']
    expect(tokens[3]).toEqual value: 'test', scopes: ['source.php', 'string.quoted.single.php']
    expect(tokens[4]).toEqual value: '\'', scopes: ['source.php', 'string.quoted.single.php', 'punctuation.definition.string.end.php']
    expect(tokens[5]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a simple heredoc correctly', ->
    lines = grammar.tokenizeLines '''
      $a = <<<HEREDOC
      I am a heredoc
      HEREDOC;
    '''

    expect(lines[0][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(lines[0][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
    expect(lines[0][2]).toEqual value: ' ', scopes: ['source.php']
    expect(lines[0][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
    expect(lines[0][4]).toEqual value: ' ', scopes: ['source.php']
    expect(lines[0][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.heredoc.php', 'punctuation.definition.string.php']
    expect(lines[0][6]).toEqual value: 'HEREDOC', scopes: ['source.php', 'string.unquoted.heredoc.php', 'keyword.operator.heredoc.php']
    expect(lines[1][0]).toEqual value: 'I am a heredoc', scopes: ['source.php', 'string.unquoted.heredoc.php']
    expect(lines[2][0]).toEqual value: 'HEREDOC', scopes: ['source.php', 'string.unquoted.heredoc.php', 'keyword.operator.heredoc.php']
    expect(lines[2][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

    lines = grammar.tokenizeLines '''
      $a = <<<HEREDOC
      I am a heredoc
      HEREDOC
      ;
    '''

    expect(lines[0][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(lines[0][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
    expect(lines[0][2]).toEqual value: ' ', scopes: ['source.php']
    expect(lines[0][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
    expect(lines[0][4]).toEqual value: ' ', scopes: ['source.php']
    expect(lines[0][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.heredoc.php', 'punctuation.definition.string.php']
    expect(lines[0][6]).toEqual value: 'HEREDOC', scopes: ['source.php', 'string.unquoted.heredoc.php', 'keyword.operator.heredoc.php']
    expect(lines[1][0]).toEqual value: 'I am a heredoc', scopes: ['source.php', 'string.unquoted.heredoc.php']
    expect(lines[2][0]).toEqual value: 'HEREDOC', scopes: ['source.php', 'string.unquoted.heredoc.php', 'keyword.operator.heredoc.php']
    expect(lines[3][0]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'does not match incorrect heredoc terminators', ->
    lines = grammar.tokenizeLines '''
      $a = <<<HEREDOC
      I am a heredoc
      HEREDOC ;
    '''
    expect(lines[2][0]).toEqual value: 'HEREDOC ;', scopes: ['source.php', 'string.unquoted.heredoc.php']

    lines = grammar.tokenizeLines '''
      $a = <<<HEREDOC
      I am a heredoc
      HEREDOC; // comment
    '''
    expect(lines[2][0]).toEqual value: 'HEREDOC; // comment', scopes: ['source.php', 'string.unquoted.heredoc.php']

  it 'should tokenize a longer heredoc correctly', ->
    lines = grammar.tokenizeLines '''
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
    '''

    expect(lines[0][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(lines[0][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
    expect(lines[0][2]).toEqual value: ' ', scopes: ['source.php']
    expect(lines[0][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
    expect(lines[0][4]).toEqual value: ' ', scopes: ['source.php']
    expect(lines[0][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.heredoc.php', 'punctuation.definition.string.php']
    expect(lines[0][6]).toEqual value: 'GITHUB', scopes: ['source.php', 'string.unquoted.heredoc.php', 'keyword.operator.heredoc.php']
    expect(lines[1][0]).toEqual value: 'This is a plain string.', scopes: ['source.php', 'string.unquoted.heredoc.php']
    expect(lines[2][0]).toEqual value: 'SELECT * FROM github WHERE octocat = \'awesome\' and ID = 1;', scopes: ['source.php', 'string.unquoted.heredoc.php']
    expect(lines[3][0]).toEqual value: '<strong>rainbows</strong>', scopes: ['source.php', 'string.unquoted.heredoc.php']
    expect(lines[4][0]).toEqual value: '', scopes: ['source.php', 'string.unquoted.heredoc.php']
    expect(lines[5][0]).toEqual value: 'if(awesome) {', scopes: ['source.php', 'string.unquoted.heredoc.php']
    expect(lines[6][0]).toEqual value: '  doSomething(10, function(x){', scopes: ['source.php', 'string.unquoted.heredoc.php']
    expect(lines[7][0]).toEqual value: '    console.log(x*x);', scopes: ['source.php', 'string.unquoted.heredoc.php']
    expect(lines[8][0]).toEqual value: '  });', scopes: ['source.php', 'string.unquoted.heredoc.php']
    expect(lines[9][0]).toEqual value: '}', scopes: ['source.php', 'string.unquoted.heredoc.php']
    expect(lines[10][0]).toEqual value: 'GITHUB', scopes: ['source.php', 'string.unquoted.heredoc.php', 'keyword.operator.heredoc.php']
    expect(lines[10][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a longer heredoc with interpolated values and escaped characters correctly', ->
    lines = grammar.tokenizeLines '''
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
    '''

    expect(lines[0][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(lines[0][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
    expect(lines[0][2]).toEqual value: ' ', scopes: ['source.php']
    expect(lines[0][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
    expect(lines[0][4]).toEqual value: ' ', scopes: ['source.php']
    expect(lines[0][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.heredoc.php', 'punctuation.definition.string.php']
    expect(lines[0][6]).toEqual value: 'GITHUB', scopes: ['source.php', 'string.unquoted.heredoc.php', 'keyword.operator.heredoc.php']
    expect(lines[1][0]).toEqual value: 'This is a plain string.', scopes: ['source.php', 'string.unquoted.heredoc.php']
    expect(lines[2][0]).toEqual value: 'Jumpin\' Juniper is ', scopes: ['source.php', 'string.unquoted.heredoc.php']
    expect(lines[2][1]).toEqual value: '\\"', scopes: ['source.php', 'string.unquoted.heredoc.php', 'constant.character.escape.php']
    expect(lines[2][2]).toEqual value: 'The ', scopes: ['source.php', 'string.unquoted.heredoc.php']
    expect(lines[2][3]).toEqual value: '$', scopes: ['source.php', 'string.unquoted.heredoc.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(lines[2][4]).toEqual value: 'thing', scopes: ['source.php', 'string.unquoted.heredoc.php', 'variable.other.php']
    expect(lines[2][5]).toEqual value: '\\"', scopes: ['source.php', 'string.unquoted.heredoc.php', 'constant.character.escape.php']
    expect(lines[3][0]).toEqual value: 'SELECT * FROM github WHERE octocat = \'awesome\' and ID = 1;', scopes: ['source.php', 'string.unquoted.heredoc.php']
    expect(lines[4][0]).toEqual value: '<strong>rainbows</strong>', scopes: ['source.php', 'string.unquoted.heredoc.php']
    expect(lines[5][0]).toEqual value: '', scopes: ['source.php', 'string.unquoted.heredoc.php']
    expect(lines[6][0]).toEqual value: 'if(awesome) {', scopes: ['source.php', 'string.unquoted.heredoc.php']
    expect(lines[7][0]).toEqual value: '  doSomething(10, function(x){', scopes: ['source.php', 'string.unquoted.heredoc.php']
    expect(lines[8][0]).toEqual value: '    console.log(x*x);', scopes: ['source.php', 'string.unquoted.heredoc.php']
    expect(lines[9][0]).toEqual value: '  });', scopes: ['source.php', 'string.unquoted.heredoc.php']
    expect(lines[10][0]).toEqual value: '}', scopes: ['source.php', 'string.unquoted.heredoc.php']
    expect(lines[11][0]).toEqual value: 'GITHUB', scopes: ['source.php', 'string.unquoted.heredoc.php', 'keyword.operator.heredoc.php']
    expect(lines[11][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a nowdoc with interpolated values correctly', ->
    lines = grammar.tokenizeLines '''
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
    '''

    expect(lines[0][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(lines[0][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
    expect(lines[0][2]).toEqual value: ' ', scopes: ['source.php']
    expect(lines[0][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
    expect(lines[0][4]).toEqual value: ' ', scopes: ['source.php']
    expect(lines[0][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'punctuation.definition.string.php']
    expect(lines[0][6]).toEqual value: '\'', scopes: ['source.php', 'string.unquoted.nowdoc.php']
    expect(lines[0][7]).toEqual value: 'GITHUB', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'keyword.operator.nowdoc.php']
    expect(lines[0][8]).toEqual value: '\'', scopes: ['source.php', 'string.unquoted.nowdoc.php']
    expect(lines[1][0]).toEqual value: 'This is a plain string.', scopes: ['source.php', 'string.unquoted.nowdoc.php']
    expect(lines[2][0]).toEqual value: 'Jumpin\' Juniper is \\"The $thing\\"', scopes: ['source.php', 'string.unquoted.nowdoc.php']
    expect(lines[3][0]).toEqual value: 'SELECT * FROM github WHERE octocat = \'awesome\' and ID = 1;', scopes: ['source.php', 'string.unquoted.nowdoc.php']
    expect(lines[4][0]).toEqual value: '<strong>rainbows</strong>', scopes: ['source.php', 'string.unquoted.nowdoc.php']
    expect(lines[5][0]).toEqual value: '', scopes: ['source.php', 'string.unquoted.nowdoc.php']
    expect(lines[6][0]).toEqual value: 'if(awesome) {', scopes: ['source.php', 'string.unquoted.nowdoc.php']
    expect(lines[7][0]).toEqual value: '  doSomething(10, function(x){', scopes: ['source.php', 'string.unquoted.nowdoc.php']
    expect(lines[8][0]).toEqual value: '    console.log(x*x);', scopes: ['source.php', 'string.unquoted.nowdoc.php']
    expect(lines[9][0]).toEqual value: '  });', scopes: ['source.php', 'string.unquoted.nowdoc.php']
    expect(lines[10][0]).toEqual value: '}', scopes: ['source.php', 'string.unquoted.nowdoc.php']
    expect(lines[11][0]).toEqual value: 'GITHUB', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'keyword.operator.nowdoc.php']
    expect(lines[11][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a heredoc with embedded HTML and interpolation correctly', ->
    waitsForPromise ->
      atom.packages.activatePackage('language-html')

    runs ->
      lines = grammar.tokenizeLines '''
        $a = <<<HTML
        <strong>rainbows</strong>
        Jumpin' Juniper is \\"The $thing\\"
        HTML;
      '''

      expect(lines[0][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(lines[0][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
      expect(lines[0][2]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[0][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
      expect(lines[0][4]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[0][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(lines[0][6]).toEqual value: 'HTML', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'punctuation.section.embedded.begin.php', 'keyword.operator.heredoc.php']
      expect(lines[1][0].value).toEqual '<'
      expect(lines[1][0].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'text.html']
      expect(lines[1][1].value).toEqual 'strong'
      expect(lines[1][1].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'text.html']
      expect(lines[1][2].value).toEqual '>'
      expect(lines[1][2].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'text.html']
      expect(lines[1][3].value).toEqual 'rainbows'
      expect(lines[1][3].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'text.html']
      expect(lines[1][4].value).toEqual '</'
      expect(lines[1][4].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'text.html']
      expect(lines[1][5].value).toEqual 'strong'
      expect(lines[1][5].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'text.html']
      expect(lines[1][6].value).toEqual '>'
      expect(lines[1][6].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'text.html']
      expect(lines[2][0]).toEqual value: 'Jumpin\' Juniper is ', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'text.html']
      expect(lines[2][1]).toEqual value: '\\"', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'text.html', 'constant.character.escape.php']
      expect(lines[2][2]).toEqual value: 'The ', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'text.html']
      expect(lines[2][3]).toEqual value: '$', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'text.html', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(lines[2][4]).toEqual value: 'thing', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'text.html', 'variable.other.php']
      expect(lines[2][5]).toEqual value: '\\"', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'text.html', 'constant.character.escape.php']
      expect(lines[3][0]).toEqual value: 'HTML', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.html', 'punctuation.section.embedded.end.php', 'keyword.operator.heredoc.php']
      expect(lines[3][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a nowdoc with embedded HTML and interpolation correctly', ->
    waitsForPromise ->
      atom.packages.activatePackage('language-html')

    runs ->
      lines = grammar.tokenizeLines '''
        $a = <<<'HTML'
        <strong>rainbows</strong>
        Jumpin' Juniper is \\"The $thing\\"
        HTML;
      '''

      expect(lines[0][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(lines[0][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
      expect(lines[0][2]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[0][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
      expect(lines[0][4]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[0][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.html', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(lines[0][6]).toEqual value: '\'', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.html', 'punctuation.section.embedded.begin.php']
      expect(lines[0][7]).toEqual value: 'HTML', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.html', 'punctuation.section.embedded.begin.php', 'keyword.operator.nowdoc.php']
      expect(lines[0][8]).toEqual value: '\'', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.html', 'punctuation.section.embedded.begin.php']
      expect(lines[1][0].value).toEqual '<'
      expect(lines[1][0].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.html', 'text.html']
      expect(lines[1][1].value).toEqual 'strong'
      expect(lines[1][1].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.html', 'text.html']
      expect(lines[1][2].value).toEqual '>'
      expect(lines[1][2].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.html', 'text.html']
      expect(lines[1][3].value).toEqual 'rainbows'
      expect(lines[1][3].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.html', 'text.html']
      expect(lines[1][4].value).toEqual '</'
      expect(lines[1][4].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.html', 'text.html']
      expect(lines[1][5].value).toEqual 'strong'
      expect(lines[1][5].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.html', 'text.html']
      expect(lines[1][6].value).toEqual '>'
      expect(lines[1][6].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.html', 'text.html']
      expect(lines[2][0]).toEqual value: 'Jumpin\' Juniper is \\"The $thing\\"', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.html', 'text.html']
      expect(lines[3][0]).toEqual value: 'HTML', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.html', 'punctuation.section.embedded.end.php', 'keyword.operator.nowdoc.php']
      expect(lines[3][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a heredoc with illegal whitespace at the end of the line correctly', ->
    lines = grammar.tokenizeLines '''
      $a = <<<GITHUB\t
      This is a plain string.
      GITHUB;
    '''

    expect(lines[0][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(lines[0][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
    expect(lines[0][2]).toEqual value: ' ', scopes: ['source.php']
    expect(lines[0][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
    expect(lines[0][4]).toEqual value: ' ', scopes: ['source.php']
    expect(lines[0][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.heredoc.php', 'punctuation.definition.string.php']
    expect(lines[0][6]).toEqual value: 'GITHUB', scopes: ['source.php', 'string.unquoted.heredoc.php', 'keyword.operator.heredoc.php']
    expect(lines[0][7]).toEqual value: '\t', scopes: ['source.php', 'string.unquoted.heredoc.php', 'invalid.illegal.trailing-whitespace.php']
    expect(lines[1][0]).toEqual value: 'This is a plain string.', scopes: ['source.php', 'string.unquoted.heredoc.php']
    expect(lines[2][0]).toEqual value: 'GITHUB', scopes: ['source.php', 'string.unquoted.heredoc.php', 'keyword.operator.heredoc.php']
    expect(lines[2][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a heredoc with embedded XML correctly', ->
    waitsForPromise ->
      atom.packages.activatePackage('language-xml')

    runs ->
      lines = grammar.tokenizeLines '''
        $a = <<<XML
        <root/>
        XML;
      '''

      expect(lines[0][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(lines[0][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
      expect(lines[0][2]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[0][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
      expect(lines[0][4]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[0][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.xml', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(lines[0][6]).toEqual value: 'XML', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.xml', 'punctuation.section.embedded.begin.php', 'keyword.operator.heredoc.php']
      expect(lines[1][0].value).toEqual '<'
      expect(lines[1][0].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.xml', 'text.xml']
      expect(lines[1][1].value).toEqual 'root'
      expect(lines[1][1].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.xml', 'text.xml']
      expect(lines[1][2].value).toEqual '/>'
      expect(lines[1][2].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.xml', 'text.xml']
      expect(lines[2][0]).toEqual value: 'XML', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.xml', 'punctuation.section.embedded.end.php', 'keyword.operator.heredoc.php']
      expect(lines[2][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a nowdoc with embedded XML correctly', ->
    waitsForPromise ->
      atom.packages.activatePackage('language-xml')

    runs ->
      lines = grammar.tokenizeLines '''
        $a = <<<'XML'
        <root/>
        XML;
      '''

      expect(lines[0][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(lines[0][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
      expect(lines[0][2]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[0][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
      expect(lines[0][4]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[0][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.xml', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(lines[0][6]).toEqual value: '\'', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.xml', 'punctuation.section.embedded.begin.php']
      expect(lines[0][7]).toEqual value: 'XML', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.xml', 'punctuation.section.embedded.begin.php', 'keyword.operator.nowdoc.php']
      expect(lines[0][8]).toEqual value: '\'', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.xml', 'punctuation.section.embedded.begin.php']
      expect(lines[1][0].value).toEqual '<'
      expect(lines[1][0].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.xml', 'text.xml']
      expect(lines[1][1].value).toEqual 'root'
      expect(lines[1][1].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.xml', 'text.xml']
      expect(lines[1][2].value).toEqual '/>'
      expect(lines[1][2].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.xml', 'text.xml']
      expect(lines[2][0]).toEqual value: 'XML', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.xml', 'punctuation.section.embedded.end.php', 'keyword.operator.nowdoc.php']
      expect(lines[2][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a heredoc with embedded SQL correctly', ->
    waitsForPromise ->
      atom.packages.activatePackage('language-sql')

    runs ->
      lines = grammar.tokenizeLines '''
        $a = <<<SQL
        SELECT * FROM table
        SQL;
      '''

      expect(lines[0][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(lines[0][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
      expect(lines[0][2]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[0][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
      expect(lines[0][4]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[0][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.sql', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(lines[0][6]).toEqual value: 'SQL', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.sql', 'punctuation.section.embedded.begin.php', 'keyword.operator.heredoc.php']
      expect(lines[1][0].value).toEqual 'SELECT'
      expect(lines[1][0].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.sql', 'source.sql']
      expect(lines[1][1].value).toEqual ' '
      expect(lines[1][1].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.sql', 'source.sql']
      expect(lines[1][2].value).toEqual '*'
      expect(lines[1][2].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.sql', 'source.sql']
      expect(lines[1][3].value).toEqual ' '
      expect(lines[1][3].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.sql', 'source.sql']
      expect(lines[1][4].value).toEqual 'FROM'
      expect(lines[1][4].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.sql', 'source.sql']
      expect(lines[1][5].value).toEqual ' table'
      expect(lines[1][5].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.sql', 'source.sql']
      expect(lines[2][0]).toEqual value: 'SQL', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.sql', 'punctuation.section.embedded.end.php', 'keyword.operator.heredoc.php']
      expect(lines[2][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a nowdoc with embedded SQL correctly', ->
    waitsForPromise ->
      atom.packages.activatePackage('language-sql')

    runs ->
      lines = grammar.tokenizeLines '''
        $a = <<<'SQL'
        SELECT * FROM table
        SQL;
      '''

      expect(lines[0][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(lines[0][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
      expect(lines[0][2]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[0][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
      expect(lines[0][4]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[0][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.sql', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(lines[0][6]).toEqual value: '\'', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.sql', 'punctuation.section.embedded.begin.php']
      expect(lines[0][7]).toEqual value: 'SQL', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.sql', 'punctuation.section.embedded.begin.php', 'keyword.operator.nowdoc.php']
      expect(lines[0][8]).toEqual value: '\'', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.sql', 'punctuation.section.embedded.begin.php']
      expect(lines[1][0].value).toEqual 'SELECT'
      expect(lines[1][0].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.sql', 'source.sql']
      expect(lines[1][1].value).toEqual ' '
      expect(lines[1][1].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.sql', 'source.sql']
      expect(lines[1][2].value).toEqual '*'
      expect(lines[1][2].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.sql', 'source.sql']
      expect(lines[1][3].value).toEqual ' '
      expect(lines[1][3].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.sql', 'source.sql']
      expect(lines[1][4].value).toEqual 'FROM'
      expect(lines[1][4].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.sql', 'source.sql']
      expect(lines[1][5].value).toEqual ' table'
      expect(lines[1][5].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.sql', 'source.sql']
      expect(lines[2][0]).toEqual value: 'SQL', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.sql', 'punctuation.section.embedded.end.php', 'keyword.operator.nowdoc.php']
      expect(lines[2][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a heredoc with embedded javascript correctly', ->
    waitsForPromise ->
      atom.packages.activatePackage('language-javascript')

    runs ->
      lines = grammar.tokenizeLines '''
        $a = <<<JAVASCRIPT
        var a = 1;
        JAVASCRIPT;

        $a = <<<JS
        var a = 1;
        JS;
      '''

      expect(lines[0][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(lines[0][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
      expect(lines[0][2]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[0][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
      expect(lines[0][4]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[0][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(lines[0][6]).toEqual value: 'JAVASCRIPT', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'punctuation.section.embedded.begin.php', 'keyword.operator.heredoc.php']
      expect(lines[1][0].value).toEqual 'var'
      expect(lines[1][0].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'source.js']
      expect(lines[1][1].value).toEqual ' a '
      expect(lines[1][1].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'source.js']
      expect(lines[1][2].value).toEqual '='
      expect(lines[1][2].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'source.js']
      expect(lines[1][3].value).toEqual ' '
      expect(lines[1][3].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'source.js']
      expect(lines[1][4].value).toEqual '1'
      expect(lines[1][4].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'source.js']
      expect(lines[1][5].value).toEqual ';'
      expect(lines[1][5].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'source.js']
      expect(lines[2][0]).toEqual value: 'JAVASCRIPT', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'punctuation.section.embedded.end.php', 'keyword.operator.heredoc.php']
      expect(lines[2][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

      expect(lines[4][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(lines[4][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
      expect(lines[4][2]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[4][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
      expect(lines[4][4]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[4][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(lines[4][6]).toEqual value: 'JS', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'punctuation.section.embedded.begin.php', 'keyword.operator.heredoc.php']
      expect(lines[5][0].value).toEqual 'var'
      expect(lines[5][0].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'source.js']
      expect(lines[5][1].value).toEqual ' a '
      expect(lines[5][1].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'source.js']
      expect(lines[5][2].value).toEqual '='
      expect(lines[5][2].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'source.js']
      expect(lines[5][3].value).toEqual ' '
      expect(lines[5][3].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'source.js']
      expect(lines[5][4].value).toEqual '1'
      expect(lines[5][4].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'source.js']
      expect(lines[5][5].value).toEqual ';'
      expect(lines[5][5].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'source.js']
      expect(lines[6][0]).toEqual value: 'JS', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.js', 'punctuation.section.embedded.end.php', 'keyword.operator.heredoc.php']
      expect(lines[6][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a nowdoc with embedded javascript correctly', ->
    waitsForPromise ->
      atom.packages.activatePackage('language-javascript')

    runs ->
      lines = grammar.tokenizeLines '''
        $a = <<<'JAVASCRIPT'
        var a = 1;
        JAVASCRIPT;

        $a = <<<'JS'
        var a = 1;
        JS;
      '''

      expect(lines[0][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(lines[0][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
      expect(lines[0][2]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[0][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
      expect(lines[0][4]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[0][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(lines[0][6]).toEqual value: '\'', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'punctuation.section.embedded.begin.php']
      expect(lines[0][7]).toEqual value: 'JAVASCRIPT', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'punctuation.section.embedded.begin.php', 'keyword.operator.nowdoc.php']
      expect(lines[0][8]).toEqual value: '\'', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'punctuation.section.embedded.begin.php']
      expect(lines[1][0].value).toEqual 'var'
      expect(lines[1][0].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'source.js']
      expect(lines[1][1].value).toEqual ' a '
      expect(lines[1][1].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'source.js']
      expect(lines[1][2].value).toEqual '='
      expect(lines[1][2].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'source.js']
      expect(lines[1][3].value).toEqual ' '
      expect(lines[1][3].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'source.js']
      expect(lines[1][4].value).toEqual '1'
      expect(lines[1][4].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'source.js']
      expect(lines[1][5].value).toEqual ';'
      expect(lines[1][5].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'source.js']
      expect(lines[2][0]).toEqual value: 'JAVASCRIPT', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'punctuation.section.embedded.end.php', 'keyword.operator.nowdoc.php']
      expect(lines[2][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

      expect(lines[4][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(lines[4][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
      expect(lines[4][2]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[4][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
      expect(lines[4][4]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[4][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(lines[4][6]).toEqual value: '\'', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'punctuation.section.embedded.begin.php']
      expect(lines[4][7]).toEqual value: 'JS', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'punctuation.section.embedded.begin.php', 'keyword.operator.nowdoc.php']
      expect(lines[4][8]).toEqual value: '\'', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'punctuation.section.embedded.begin.php']
      expect(lines[5][0].value).toEqual 'var'
      expect(lines[5][0].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'source.js']
      expect(lines[5][1].value).toEqual ' a '
      expect(lines[5][1].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'source.js']
      expect(lines[5][2].value).toEqual '='
      expect(lines[5][2].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'source.js']
      expect(lines[5][3].value).toEqual ' '
      expect(lines[5][3].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'source.js']
      expect(lines[5][4].value).toEqual '1'
      expect(lines[5][4].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'source.js']
      expect(lines[5][5].value).toEqual ';'
      expect(lines[5][5].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'source.js']
      expect(lines[6][0]).toEqual value: 'JS', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.js', 'punctuation.section.embedded.end.php', 'keyword.operator.nowdoc.php']
      expect(lines[6][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a heredoc with embedded json correctly', ->
    waitsForPromise ->
      atom.packages.activatePackage('language-json')

    runs ->
      lines = grammar.tokenizeLines '''
        $a = <<<JSON
        {"a" : 1}
        JSON;
      '''

      expect(lines[0][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(lines[0][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
      expect(lines[0][2]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[0][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
      expect(lines[0][4]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[0][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.json', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(lines[0][6]).toEqual value: 'JSON', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.json', 'punctuation.section.embedded.begin.php', 'keyword.operator.heredoc.php']
      expect(lines[1][0].value).toEqual '{'
      expect(lines[1][0].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.json', 'source.json']
      expect(lines[1][1].value).toEqual '"'
      expect(lines[1][1].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.json', 'source.json']
      expect(lines[1][2].value).toEqual 'a'
      expect(lines[1][2].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.json', 'source.json']
      expect(lines[1][3].value).toEqual '"'
      expect(lines[1][3].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.json', 'source.json']
      expect(lines[1][4].value).toEqual ' '
      expect(lines[1][4].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.json', 'source.json']
      expect(lines[1][5].value).toEqual ':'
      expect(lines[1][5].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.json', 'source.json']
      expect(lines[1][6].value).toEqual ' '
      expect(lines[1][6].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.json', 'source.json']
      expect(lines[1][7].value).toEqual '1'
      expect(lines[1][7].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.json', 'source.json']
      expect(lines[1][8].value).toEqual '}'
      expect(lines[1][8].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.json', 'source.json']
      expect(lines[2][0]).toEqual value: 'JSON', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.json', 'punctuation.section.embedded.end.php', 'keyword.operator.heredoc.php']
      expect(lines[2][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a nowdoc with embedded json correctly', ->
    waitsForPromise ->
      atom.packages.activatePackage('language-json')

    runs ->
      lines = grammar.tokenizeLines '''
        $a = <<<'JSON'
        {"a" : 1}
        JSON;
      '''

      expect(lines[0][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(lines[0][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
      expect(lines[0][2]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[0][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
      expect(lines[0][4]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[0][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(lines[0][6]).toEqual value: '\'', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'punctuation.section.embedded.begin.php']
      expect(lines[0][7]).toEqual value: 'JSON', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'punctuation.section.embedded.begin.php', 'keyword.operator.nowdoc.php']
      expect(lines[0][8]).toEqual value: '\'', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'punctuation.section.embedded.begin.php']
      expect(lines[1][0].value).toEqual '{'
      expect(lines[1][0].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'source.json']
      expect(lines[1][1].value).toEqual '"'
      expect(lines[1][1].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'source.json']
      expect(lines[1][2].value).toEqual 'a'
      expect(lines[1][2].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'source.json']
      expect(lines[1][3].value).toEqual '"'
      expect(lines[1][3].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'source.json']
      expect(lines[1][4].value).toEqual ' '
      expect(lines[1][4].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'source.json']
      expect(lines[1][5].value).toEqual ':'
      expect(lines[1][5].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'source.json']
      expect(lines[1][6].value).toEqual ' '
      expect(lines[1][6].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'source.json']
      expect(lines[1][7].value).toEqual '1'
      expect(lines[1][7].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'source.json']
      expect(lines[1][8].value).toEqual '}'
      expect(lines[1][8].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'source.json']
      expect(lines[2][0]).toEqual value: 'JSON', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.json', 'punctuation.section.embedded.end.php', 'keyword.operator.nowdoc.php']
      expect(lines[2][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a heredoc with embedded css correctly', ->
    waitsForPromise ->
      atom.packages.activatePackage('language-css')

    runs ->
      lines = grammar.tokenizeLines '''
        $a = <<<CSS
        body{}
        CSS;
      '''

      expect(lines[0][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(lines[0][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
      expect(lines[0][2]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[0][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
      expect(lines[0][4]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[0][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.css', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(lines[0][6]).toEqual value: 'CSS', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.css', 'punctuation.section.embedded.begin.php', 'keyword.operator.heredoc.php']
      expect(lines[1][0].value).toEqual 'body'
      expect(lines[1][0].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.css', 'source.css']
      expect(lines[1][1].value).toEqual '{'
      expect(lines[1][1].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.css', 'source.css']
      expect(lines[1][2].value).toEqual '}'
      expect(lines[1][2].scopes).toContainAll ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.css', 'source.css']
      expect(lines[2][0]).toEqual value: 'CSS', scopes: ['source.php', 'string.unquoted.heredoc.php', 'meta.embedded.css', 'punctuation.section.embedded.end.php', 'keyword.operator.heredoc.php']
      expect(lines[2][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a nowdoc with embedded css correctly', ->
    waitsForPromise ->
      atom.packages.activatePackage('language-css')

    runs ->
      lines = grammar.tokenizeLines '''
        $a = <<<'CSS'
        body{}
        CSS;
      '''

      expect(lines[0][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
      expect(lines[0][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
      expect(lines[0][2]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[0][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
      expect(lines[0][4]).toEqual value: ' ', scopes: ['source.php']
      expect(lines[0][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.css', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
      expect(lines[0][6]).toEqual value: '\'', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.css', 'punctuation.section.embedded.begin.php']
      expect(lines[0][7]).toEqual value: 'CSS', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.css', 'punctuation.section.embedded.begin.php', 'keyword.operator.nowdoc.php']
      expect(lines[0][8]).toEqual value: '\'', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.css', 'punctuation.section.embedded.begin.php']
      expect(lines[1][0].value).toEqual 'body'
      expect(lines[1][0].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.css', 'source.css']
      expect(lines[1][1].value).toEqual '{'
      expect(lines[1][1].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.css', 'source.css']
      expect(lines[1][2].value).toEqual '}'
      expect(lines[1][2].scopes).toContainAll ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.css', 'source.css']
      expect(lines[2][0]).toEqual value: 'CSS', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'meta.embedded.css', 'punctuation.section.embedded.end.php', 'keyword.operator.nowdoc.php']
      expect(lines[2][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a heredoc with embedded regex escaped bracket correctly', ->
    lines = grammar.tokenizeLines '''
      $a = <<<REGEX
      /\\[/
      REGEX;
    '''

    expect(lines[0][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(lines[0][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
    expect(lines[0][2]).toEqual value: ' ', scopes: ['source.php']
    expect(lines[0][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
    expect(lines[0][4]).toEqual value: ' ', scopes: ['source.php']
    expect(lines[0][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.heredoc.php', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
    expect(lines[0][6]).toEqual value: 'REGEX', scopes: ['source.php', 'string.unquoted.heredoc.php', 'punctuation.section.embedded.begin.php', 'keyword.operator.heredoc.php']
    expect(lines[1][0]).toEqual value: '/', scopes: ['source.php', 'string.unquoted.heredoc.php', 'string.regexp.heredoc.php']
    expect(lines[1][1]).toEqual value: '\\[', scopes: ['source.php', 'string.unquoted.heredoc.php', 'string.regexp.heredoc.php', 'constant.character.escape.regex.php']
    expect(lines[1][2]).toEqual value: '/', scopes: ['source.php', 'string.unquoted.heredoc.php', 'string.regexp.heredoc.php']
    expect(lines[2][0]).toEqual value: 'REGEX', scopes: ['source.php', 'string.unquoted.heredoc.php', 'punctuation.section.embedded.end.php', 'keyword.operator.heredoc.php']
    expect(lines[2][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a nowdoc with embedded regex escape characters correctly', ->
    lines = grammar.tokenizeLines '''
      $a = <<<'REGEX'
      /[\\\\\\\\]/
      REGEX;
    '''

    expect(lines[0][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(lines[0][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
    expect(lines[0][2]).toEqual value: ' ', scopes: ['source.php']
    expect(lines[0][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
    expect(lines[0][4]).toEqual value: ' ', scopes: ['source.php']
    expect(lines[0][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
    expect(lines[0][6]).toEqual value: '\'', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php']
    expect(lines[0][7]).toEqual value: 'REGEX', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php', 'keyword.operator.nowdoc.php']
    expect(lines[0][8]).toEqual value: '\'', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php']
    expect(lines[1][0]).toEqual value: '/', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php']
    expect(lines[1][1]).toEqual value: '[', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php', 'string.regexp.character-class.php', 'punctuation.definition.character-class.php']
    expect(lines[1][2]).toEqual value: '\\\\', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php', 'string.regexp.character-class.php', 'constant.character.escape.php']
    expect(lines[1][3]).toEqual value: '\\\\', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php', 'string.regexp.character-class.php', 'constant.character.escape.php']
    expect(lines[1][4]).toEqual value: ']', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php', 'string.regexp.character-class.php', 'punctuation.definition.character-class.php']
    expect(lines[1][5]).toEqual value: '/', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php']
    expect(lines[2][0]).toEqual value: 'REGEX', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.end.php', 'keyword.operator.nowdoc.php']
    expect(lines[2][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a nowdoc with embedded regex escaped bracket correctly', ->
    lines = grammar.tokenizeLines '''
      $a = <<<'REGEX'
      /\\[/
      REGEX;
    '''

    expect(lines[0][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(lines[0][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
    expect(lines[0][2]).toEqual value: ' ', scopes: ['source.php']
    expect(lines[0][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
    expect(lines[0][4]).toEqual value: ' ', scopes: ['source.php']
    expect(lines[0][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
    expect(lines[0][6]).toEqual value: '\'', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php']
    expect(lines[0][7]).toEqual value: 'REGEX', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php', 'keyword.operator.nowdoc.php']
    expect(lines[0][8]).toEqual value: '\'', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php']
    expect(lines[1][0]).toEqual value: '/', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php']
    expect(lines[1][1]).toEqual value: '\\[', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php', 'constant.character.escape.regex.php']
    expect(lines[1][2]).toEqual value: '/', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php']
    expect(lines[2][0]).toEqual value: 'REGEX', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.end.php', 'keyword.operator.nowdoc.php']
    expect(lines[2][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a heredoc with embedded regex escape characters correctly', ->
    lines = grammar.tokenizeLines '''
      $a = <<<REGEXP
      /[\\\\\\\\]/
      REGEXP;
    '''

    expect(lines[0][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(lines[0][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
    expect(lines[0][2]).toEqual value: ' ', scopes: ['source.php']
    expect(lines[0][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
    expect(lines[0][4]).toEqual value: ' ', scopes: ['source.php']
    expect(lines[0][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.heredoc.php', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
    expect(lines[0][6]).toEqual value: 'REGEXP', scopes: ['source.php', 'string.unquoted.heredoc.php', 'punctuation.section.embedded.begin.php', 'keyword.operator.heredoc.php']
    expect(lines[1][0]).toEqual value: '/', scopes: ['source.php', 'string.unquoted.heredoc.php', 'string.regexp.heredoc.php']
    expect(lines[1][1]).toEqual value: '[', scopes: ['source.php', 'string.unquoted.heredoc.php', 'string.regexp.heredoc.php', 'string.regexp.character-class.php', 'punctuation.definition.character-class.php']
    expect(lines[1][2]).toEqual value: '\\\\', scopes: ['source.php', 'string.unquoted.heredoc.php', 'string.regexp.heredoc.php', 'string.regexp.character-class.php', 'constant.character.escape.php']
    expect(lines[1][3]).toEqual value: '\\\\', scopes: ['source.php', 'string.unquoted.heredoc.php', 'string.regexp.heredoc.php', 'string.regexp.character-class.php', 'constant.character.escape.php']
    expect(lines[1][4]).toEqual value: ']', scopes: ['source.php', 'string.unquoted.heredoc.php', 'string.regexp.heredoc.php', 'string.regexp.character-class.php', 'punctuation.definition.character-class.php']
    expect(lines[1][5]).toEqual value: '/', scopes: ['source.php', 'string.unquoted.heredoc.php', 'string.regexp.heredoc.php']
    expect(lines[2][0]).toEqual value: 'REGEXP', scopes: ['source.php', 'string.unquoted.heredoc.php', 'punctuation.section.embedded.end.php', 'keyword.operator.heredoc.php']
    expect(lines[2][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a heredoc with embedded regex escaped bracket correctly', ->
    lines = grammar.tokenizeLines '''
      $a = <<<REGEXP
      /\\[/
      REGEXP;
    '''

    expect(lines[0][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(lines[0][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
    expect(lines[0][2]).toEqual value: ' ', scopes: ['source.php']
    expect(lines[0][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
    expect(lines[0][4]).toEqual value: ' ', scopes: ['source.php']
    expect(lines[0][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.heredoc.php', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
    expect(lines[0][6]).toEqual value: 'REGEXP', scopes: ['source.php', 'string.unquoted.heredoc.php', 'punctuation.section.embedded.begin.php', 'keyword.operator.heredoc.php']
    expect(lines[1][0]).toEqual value: '/', scopes: ['source.php', 'string.unquoted.heredoc.php', 'string.regexp.heredoc.php']
    expect(lines[1][1]).toEqual value: '\\[', scopes: ['source.php', 'string.unquoted.heredoc.php', 'string.regexp.heredoc.php', 'constant.character.escape.regex.php']
    expect(lines[1][2]).toEqual value: '/', scopes: ['source.php', 'string.unquoted.heredoc.php', 'string.regexp.heredoc.php']
    expect(lines[2][0]).toEqual value: 'REGEXP', scopes: ['source.php', 'string.unquoted.heredoc.php', 'punctuation.section.embedded.end.php', 'keyword.operator.heredoc.php']
    expect(lines[2][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a nowdoc with embedded regex escape characters correctly', ->
    lines = grammar.tokenizeLines '''
      $a = <<<'REGEXP'
      /[\\\\\\\\]/
      REGEXP;
    '''

    expect(lines[0][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(lines[0][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
    expect(lines[0][2]).toEqual value: ' ', scopes: ['source.php']
    expect(lines[0][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
    expect(lines[0][4]).toEqual value: ' ', scopes: ['source.php']
    expect(lines[0][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
    expect(lines[0][6]).toEqual value: '\'', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php']
    expect(lines[0][7]).toEqual value: 'REGEXP', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php', 'keyword.operator.nowdoc.php']
    expect(lines[0][8]).toEqual value: '\'', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php']
    expect(lines[1][0]).toEqual value: '/', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php']
    expect(lines[1][1]).toEqual value: '[', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php', 'string.regexp.character-class.php', 'punctuation.definition.character-class.php']
    expect(lines[1][2]).toEqual value: '\\\\', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php', 'string.regexp.character-class.php', 'constant.character.escape.php']
    expect(lines[1][3]).toEqual value: '\\\\', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php', 'string.regexp.character-class.php', 'constant.character.escape.php']
    expect(lines[1][4]).toEqual value: ']', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php', 'string.regexp.character-class.php', 'punctuation.definition.character-class.php']
    expect(lines[1][5]).toEqual value: '/', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php']
    expect(lines[2][0]).toEqual value: 'REGEXP', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.end.php', 'keyword.operator.nowdoc.php']
    expect(lines[2][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  it 'should tokenize a nowdoc with embedded regex escaped bracket correctly', ->
    lines = grammar.tokenizeLines '''
      $a = <<<'REGEXP'
      /\\[/
      REGEXP;
    '''

    expect(lines[0][0]).toEqual value: '$', scopes: ['source.php', 'variable.other.php', 'punctuation.definition.variable.php']
    expect(lines[0][1]).toEqual value: 'a', scopes: ['source.php', 'variable.other.php']
    expect(lines[0][2]).toEqual value: ' ', scopes: ['source.php']
    expect(lines[0][3]).toEqual value: '=', scopes: ['source.php', 'keyword.operator.assignment.php']
    expect(lines[0][4]).toEqual value: ' ', scopes: ['source.php']
    expect(lines[0][5]).toEqual value: '<<<', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php', 'punctuation.definition.string.php']
    expect(lines[0][6]).toEqual value: '\'', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php']
    expect(lines[0][7]).toEqual value: 'REGEXP', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php', 'keyword.operator.nowdoc.php']
    expect(lines[0][8]).toEqual value: '\'', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.begin.php']
    expect(lines[1][0]).toEqual value: '/', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php']
    expect(lines[1][1]).toEqual value: '\\[', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php', 'constant.character.escape.regex.php']
    expect(lines[1][2]).toEqual value: '/', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'string.regexp.nowdoc.php']
    expect(lines[2][0]).toEqual value: 'REGEXP', scopes: ['source.php', 'string.unquoted.nowdoc.php', 'punctuation.section.embedded.end.php', 'keyword.operator.nowdoc.php']
    expect(lines[2][1]).toEqual value: ';', scopes: ['source.php', 'punctuation.terminator.expression.php']

  describe 'punctuation', ->
    it 'tokenizes brackets', ->
      {tokens} = grammar.tokenizeLine '{}'

      expect(tokens[0]).toEqual value: '{', scopes: ['source.php', 'punctuation.definition.begin.bracket.curly.php']
      expect(tokens[1]).toEqual value: '}', scopes: ['source.php', 'punctuation.definition.end.bracket.curly.php']

      {tokens} = grammar.tokenizeLine '{/* stuff */}'

      expect(tokens[0]).toEqual value: '{', scopes: ['source.php', 'punctuation.definition.begin.bracket.curly.php']
      expect(tokens[4]).toEqual value: '}', scopes: ['source.php', 'punctuation.definition.end.bracket.curly.php']

      # Make sure that nested brackets close correctly
      lines = grammar.tokenizeLines '''
        class Test {
          {}
        }
      '''

      expect(lines[0][4]).toEqual value: '{', scopes: ['source.php', 'meta.class.php', 'punctuation.definition.class.begin.bracket.curly.php']
      expect(lines[1][1]).toEqual value: '{', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'punctuation.definition.begin.bracket.curly.php']
      expect(lines[1][2]).toEqual value: '}', scopes: ['source.php', 'meta.class.php', 'meta.class.body.php', 'punctuation.definition.end.bracket.curly.php']
      expect(lines[2][0]).toEqual value: '}', scopes: ['source.php', 'meta.class.php', 'punctuation.definition.class.end.bracket.curly.php']

    it 'tokenizes parentheses', ->
      {tokens} = grammar.tokenizeLine '()'

      expect(tokens[0]).toEqual value: '(', scopes: ['source.php', 'punctuation.definition.begin.bracket.round.php']
      expect(tokens[1]).toEqual value: ')', scopes: ['source.php', 'punctuation.definition.end.bracket.round.php']

      {tokens} = grammar.tokenizeLine '(/* stuff */)'

      expect(tokens[0]).toEqual value: '(', scopes: ['source.php', 'punctuation.definition.begin.bracket.round.php']
      expect(tokens[4]).toEqual value: ')', scopes: ['source.php', 'punctuation.definition.end.bracket.round.php']
