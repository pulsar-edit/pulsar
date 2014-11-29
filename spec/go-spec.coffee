describe 'Go grammar', ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage('language-go')

    runs ->
      grammar = atom.grammars.grammarForScopeName('source.go')

  it 'parses the grammar', ->
    expect(grammar).toBeTruthy()
    expect(grammar.scopeName).toBe 'source.go'

  it 'tokenizes comments', ->
    {tokens} = grammar.tokenizeLine('// I am a comment')
    expect(tokens[0].value).toEqual '//'
    expect(tokens[0].scopes).toEqual ['source.go', 'comment.line.double-slash.go', 'punctuation.definition.comment.go']
    expect(tokens[1].value).toEqual ' I am a comment'
    expect(tokens[1].scopes).toEqual ['source.go', 'comment.line.double-slash.go']

    tokens = grammar.tokenizeLines('/*\nI am a comment\n*/')
    expect(tokens[0][0].value).toEqual '/*'
    expect(tokens[0][0].scopes).toEqual ['source.go', 'comment.block.go', 'punctuation.definition.comment.go']
    expect(tokens[1][0].value).toEqual 'I am a comment'
    expect(tokens[1][0].scopes).toEqual ['source.go', 'comment.block.go']
    expect(tokens[2][0].value).toEqual '*/'
    expect(tokens[2][0].scopes).toEqual ['source.go', 'comment.block.go', 'punctuation.definition.comment.go']

  it 'tokenizes strings', ->
    delims =
      'string.quoted.double.go': '"'
      'string.quoted.single.go': '\''
      'string.quoted.double.raw.backtick.go': '`'

    for scope, delim of delims
      {tokens} = grammar.tokenizeLine(delim + 'I am a string' + delim)
      expect(tokens[0].value).toEqual delim
      expect(tokens[0].scopes).toEqual ['source.go', scope, 'punctuation.definition.string.begin.go']
      expect(tokens[1].value).toEqual 'I am a string'
      expect(tokens[1].scopes).toEqual ['source.go', scope]
      expect(tokens[2].value).toEqual delim
      expect(tokens[2].scopes).toEqual ['source.go', scope, 'punctuation.definition.string.end.go']

  it 'tokenizes Printf verbs in strings', ->
    # Taken from go/src/pkg/fmt/fmt_test.go
    verbs = [
      '%# x', '%-5s', '%5s', '%05s', '%.5s', '%10.1q', '%10v', '%-10v', '%.0d'
      '%.d', '%+07.2f', '%0100d', '%0.100f', '%#064x', '%+.3F', '%-#20.8x',
      '%[1]d', '%[2]*[1]d', '%[3]*.[2]*[1]f', '%[3]*.[2]f', '%3.[2]d', '%.[2]d'
      '%-+[1]x', '%d', '%-d', '%+d', '%#d', '% d', '%0d', '%1.2d', '%-1.2d'
      '%+1.2d', '%-+1.2d', '%*d', '%.*d', '%*.*d', '%0*d', '%-*d'
    ]

    for verb in verbs
      {tokens} = grammar.tokenizeLine('"' + verb + '"')
      expect(tokens[0].value).toEqual '"',
      expect(tokens[0].scopes).toEqual ['source.go', 'string.quoted.double.go', 'punctuation.definition.string.begin.go']
      expect(tokens[1].value).toEqual verb
      expect(tokens[1].scopes).toEqual ['source.go', 'string.quoted.double.go', 'constant.escape.format-verb.go']
      expect(tokens[2].value).toEqual '"',
      expect(tokens[2].scopes).toEqual ['source.go', 'string.quoted.double.go', 'punctuation.definition.string.end.go']

  it 'tokenizes character escapes in strings', ->
    escapes = [
      '\\a', '\\b', '\\f', '\\n', '\\r', '\\t', '\\v', '\\\\'
      '\\000', '\\007', '\\377', '\\x07', '\\xff', '\\u12e4', '\\U00101234'
    ]

    for escape in escapes
      {tokens} = grammar.tokenizeLine('"' + escape + '"')
      expect(tokens[1].value).toEqual escape
      expect(tokens[1].scopes).toEqual ['source.go', 'string.quoted.double.go', 'constant.character.escape.go']

    {tokens} = grammar.tokenizeLine('"\\""')
    expect(tokens[1].value).toEqual '\\"'
    expect(tokens[1].scopes).toEqual ['source.go', 'string.quoted.double.go', 'constant.character.escape.go']

    {tokens} = grammar.tokenizeLine('\'\\\'\'')
    expect(tokens[1].value).toEqual '\\\'',
    expect(tokens[1].scopes).toEqual ['source.go', 'string.quoted.single.go', 'constant.character.escape.go']

  it 'tokenizes invalid whitespace around chan annotations', ->
    invalids =
      'chan <- sendonly': ' '
      '<- chan recvonly': ' '
      'trailingspace   ': '   '
      'trailingtab\t': '\t'

    for expr, invalid of invalids
      {tokens} = grammar.tokenizeLine(expr)
      expect(tokens[1].value).toEqual invalid
      expect(tokens[1].scopes).toEqual ['source.go', 'invalid.illegal.go']

  it 'tokenizes keywords', ->
    keywordLists =
      'keyword.go': ['var', 'const', 'type', 'struct', 'interface', 'case', 'default']
      'keyword.directive.go': ['package', 'import']
      'keyword.statement.go': ['defer', 'go', 'goto', 'return', 'break', 'continue', 'fallthrough']
      'keyword.conditional.go': ['if', 'else', 'switch', 'select']
      'keyword.repeat.go': ['for', 'range']

    for scope, list of keywordLists
      for keyword in list
        {tokens} = grammar.tokenizeLine keyword
        expect(tokens[0].value).toEqual keyword
        expect(tokens[0].scopes).toEqual ['source.go', scope]

  it 'tokenizes types', ->
    types = [
      'chan',   'map',     'bool',    'string',  'error',     'int',        'int8',   'int16'
      'int32',  'int64',   'rune',    'byte',    'uint',      'uint8',      'uint16', 'uint32'
      'uint64', 'uintptr', 'float32', 'float64', 'complex64', 'complex128'
    ]

    for type in types
      {tokens} = grammar.tokenizeLine type
      expect(tokens[0].value).toEqual type
      expect(tokens[0].scopes).toEqual ['source.go', 'storage.type.go']

  it 'tokenizes "func" as a keyword or type based on context', ->
    funcKeyword = ['func f()', 'func (x) f()', 'func(x) f()', 'func']
    for line in funcKeyword
      {tokens} = grammar.tokenizeLine line
      expect(tokens[0].value).toEqual 'func'
      expect(tokens[0].scopes).toEqual ['source.go', 'keyword.go']

    funcType = [
      {
        'line': 'var f1 func('
        'tokenPos': 4
      }
      {
        'line': 'f2 :=func()'
        'tokenPos': 3
      }
      {
        'line': '\tfunc('
        'tokenPos': 1
      }
      {
        'line': 'type HandlerFunc func('
        'tokenPos': 4
      }
    ]
    for t in funcType
      {tokens} = grammar.tokenizeLine t.line

      relevantToken = tokens[t.tokenPos]
      expect(relevantToken.value).toEqual 'func'
      expect(relevantToken.scopes).toEqual ['source.go', 'storage.type.go']

      next = tokens[t.tokenPos + 1]
      expect(next.value).toEqual '('
      expect(next.scopes).toEqual ['source.go', 'keyword.operator.bracket.go']

  it 'tokenizes func names in their declarations', ->
    tests = [
      {
        'line': 'func f()'
        'tokenPos': 2
      }
      {
        'line': 'func (T) f()'
        'tokenPos': 2
      }
      {
        'line': 'func (t T) f()'
        'tokenPos': 2
      }
      {
        'line': 'func (t *T) f()'
        'tokenPos': 2
      }
    ]

    for t in tests
      {tokens} = grammar.tokenizeLine t.line
      expect(tokens[0].value).toEqual 'func'
      expect(tokens[0].scopes).toEqual ['source.go', 'keyword.go']

      relevantToken = tokens[t.tokenPos]
      expect(relevantToken).toBeDefined()
      expect(relevantToken.value).toEqual 'f'
      expect(relevantToken.scopes).toEqual ['source.go', 'support.function.decl.go']

      next = tokens[t.tokenPos + 1]
      expect(next.value).toEqual '('
      expect(next.scopes).toEqual ['source.go', 'keyword.operator.bracket.go']

  it 'tokenizes numerics', ->
    numerics = [
      '42', '0600', '0xBadFace', '170141183460469231731687303715884105727', '0.', '72.40'
      '072.40', '2.71828', '1.e+0', '6.67428e-11', '1E6', '.25', '.12345E+5', '0i', '011i'
      '0.i', '2.71828i', '1.e+0i', '6.67428e-11i', '1E6i', '.25i', '.12345E+5i'
    ]

    for num in numerics
      {tokens} = grammar.tokenizeLine num
      expect(tokens[0].value).toEqual num
      expect(tokens[0].scopes).toEqual ['source.go', 'constant.numeric.go']

    invalidOctals = ['08', '039', '0995']
    for num in invalidOctals
      {tokens} = grammar.tokenizeLine num
      expect(tokens[0].value).toEqual num
      expect(tokens[0].scopes).toEqual ['source.go', 'invalid.illegal.numeric.go']

  it 'tokenizes language constants', ->
    constants = ['iota', 'true', 'false', 'nil']
    for constant in constants
      {tokens} = grammar.tokenizeLine constant
      expect(tokens[0].value).toEqual constant
      expect(tokens[0].scopes).toEqual ['source.go', 'constant.language.go']

  it 'tokenizes built-in functions', ->
    funcs = [
      'append', 'cap', 'close', 'complex', 'copy', 'delete', 'imag', 'len', 'make', 'new',
      'panic', 'print', 'println', 'real', 'recover'
    ]

    for func in funcs
      {tokens} = grammar.tokenizeLine func
      expect(tokens[0].value).toEqual func
      expect(tokens[0].scopes).toEqual ['source.go', 'support.function.built-in.go']

  it 'tokenizes operators', ->
    opers = [
      '+', '&', '+=', '&=', '&&', '==', '!=', '-', '|', '-=', '|=', '||', '<',
      '<=', '*', '^', '*=', '^=', '<-', '>', '>=', '/', '<<', '/=',
      '<<=', '++', '=', ':=', ';', '%', '>>', '%=', '>>=', '--', '!', '...',
      ':', '&^', '&^='
    ]

    for op in opers
      {tokens} = grammar.tokenizeLine op

      fullOp = tokens.map((tok) -> tok.value).join('')
      expect(fullOp).toEqual op

      scopes = tokens.map (tok) -> tok.scopes
      allKeywords = scopes.every (scope) -> 'keyword.operator.go' in scope

      expect(allKeywords).toBe true

  it 'tokenizes bracket operators', ->
    opers = [
      '[', ']', '(', ')', '{', '}'
    ]

    for op in opers
      {tokens} = grammar.tokenizeLine op

      fullOp = tokens.map((tok) -> tok.value).join('')
      expect(fullOp).toEqual op

      scopes = tokens.map (tok) -> tok.scopes
      allKeywords = scopes.every (scope) -> 'keyword.operator.bracket.go' in scope

      expect(allKeywords).toBe true

  it 'tokenizes punctuation operators', ->
    opers = [
      '.', ','
    ]

    for op in opers
      {tokens} = grammar.tokenizeLine op

      fullOp = tokens.map((tok) -> tok.value).join('')
      expect(fullOp).toEqual op

      scopes = tokens.map (tok) -> tok.scopes
      allKeywords = scopes.every (scope) -> 'keyword.operator.punctuation.go' in scope

      expect(allKeywords).toBe true

  it 'tokenizes func names in calls to them', ->
    tests = [
      {
        'line': 'a.b()'
        'name': 'b'
        'tokenPos': 2
        'isFunc': true
      }
      {
        'line': 'pkg.Func1('
        'name': 'Func1'
        'tokenPos': 2
        'isFunc': true
      }
      {
        'line': 'pkg.Func1().Func2('
        'name': 'Func2'
        'tokenPos': 6
        'isFunc': true
      }
      {
        'line': 'pkg.var'
        'name': 'var'
        'tokenPos': 2
        'isFunc': false
      }
      {
        'line': 'doWork(ch)'
        'name': 'doWork'
        'tokenPos': 0
        'isFunc': true
      }
      {
        'line': 'f1()'
        'name': 'f1'
        'tokenPos': 0
        'isFunc': true
      }
    ]

    want = ['source.go', 'support.function.go']

    for t in tests
      {tokens} = grammar.tokenizeLine t.line

      relevantToken = tokens[t.tokenPos]
      if t.isFunc
        expect(relevantToken).not.toBeNull()
        expect(relevantToken.value).toEqual t.name
        expect(relevantToken.scopes).toEqual want

        next = tokens[t.tokenPos + 1]
        expect(next.value).toEqual '('
        expect(next.scopes).toEqual ['source.go', 'keyword.operator.bracket.go']
      else
        expect(relevantToken.scopes).not.toEqual want

  it 'tokenizes type names in their declarations', ->
    {tokens} = grammar.tokenizeLine 'type Stringer interface {'
    expect(tokens[0].value).toBe 'type'
    expect(tokens[0].scopes).toEqual ['source.go', 'keyword.go']
    expect(tokens[2].value).toBe 'Stringer'
    expect(tokens[2].scopes).toEqual ['source.go', 'storage.type.go']

    {tokens} = grammar.tokenizeLine 'type Duration int64'
    expect(tokens[0].value).toBe 'type'
    expect(tokens[0].scopes).toEqual ['source.go', 'keyword.go']
    expect(tokens[2].value).toBe 'Duration'
    expect(tokens[2].scopes).toEqual ['source.go', 'storage.type.go']

    {tokens} = grammar.tokenizeLine 'type   byLength []string'
    expect(tokens[0].value).toBe 'type'
    expect(tokens[0].scopes).toEqual ['source.go', 'keyword.go']
    expect(tokens[2].value).toBe 'byLength'
    expect(tokens[2].scopes).toEqual ['source.go', 'storage.type.go']

    {tokens} = grammar.tokenizeLine '  type T'
    expect(tokens[3].value).toBe 'T'
    expect(tokens[3].scopes).not.toEqual ['source.go', 'storage.type.go']

  describe 'in variable declarations', ->
    testVar = (token) ->
      expect(token.value).toBe 'var'
      expect(token.scopes).toEqual ['source.go', 'keyword.go']

    wantedScope = ['source.go', 'variable.go']

    testName = (token, name) ->
      expect(token.value).toBe name
      expect(token.scopes).toEqual wantedScope

    testOp = (token, op) ->
      expect(token.value).toBe op
      expect(token.scopes).toEqual ['source.go', 'keyword.operator.go']

    testOpBracket = (token, op) ->
      expect(token.value).toBe op
      expect(token.scopes).toEqual ['source.go', 'keyword.operator.bracket.go']

    testOpPunctuation = (token, op) ->
      expect(token.value).toBe op
      expect(token.scopes).toEqual ['source.go', 'keyword.operator.punctuation.go']

    testType = (token, name) ->
      expect(token.value).toBe name
      expect(token.scopes).toEqual ['source.go', 'storage.type.go']

    testNum = (token, value) ->
      expect(token.value).toBe value
      expect(token.scopes).toEqual ['source.go', 'constant.numeric.go']

    describe 'in "var" statements', ->
      it 'tokenizes a single name and a type', ->
        {tokens} = grammar.tokenizeLine 'var i int'
        testVar tokens[0]
        testName tokens[2], 'i'
        testType tokens[4], 'int'

      it 'tokenizes a single name and its initialization', ->
        {tokens} = grammar.tokenizeLine ' var k =  0'
        testVar tokens[1]
        testName tokens[3], 'k'
        testOp tokens[5], '='
        testNum tokens[7], '0'

      it 'tokenizes a single name, a type, and an initialization', ->
        {tokens} = grammar.tokenizeLine 'var z blub = 7'
        testVar tokens[0]
        testName tokens[2], 'z'
        testName tokens[4], 'blub'
        testOp tokens[6], '='
        testNum tokens[8], '7'

      it 'tokenizes multiple names and a type', ->
        {tokens} = grammar.tokenizeLine 'var U, V,  W  float64'
        testVar tokens[0]
        testName tokens[2], 'U'
        testOpPunctuation tokens[3], ','
        testName tokens[5], 'V'
        testOpPunctuation tokens[6], ','
        testName tokens[8], 'W'
        testType tokens[10], 'float64'

      it 'tokenizes multiple names and initialization expressions', ->
        {tokens} = grammar.tokenizeLine 'var x, y, z = 1, 2, 3'
        testVar tokens[0]
        testName tokens[2], 'x'
        testOpPunctuation tokens[3], ','
        testName tokens[5], 'y'
        testOpPunctuation tokens[6], ','
        testName tokens[8], 'z'
        testOp tokens[10], '='
        testNum tokens[12], '1'
        testOpPunctuation tokens[13], ','
        testNum tokens[15], '2'
        testOpPunctuation tokens[16], ','
        testNum tokens[18], '3'

      it 'tokenizes multiple names, a type, and initialization expressions', ->
        {tokens} = grammar.tokenizeLine 'var x, y float32 = float, thirtytwo'
        testVar tokens[0]
        testName tokens[2], 'x'
        testOpPunctuation tokens[3], ','
        testName tokens[5], 'y'
        testType tokens[7], 'float32'
        testOp tokens[9], '='
        testName tokens[11], 'float'
        testOpPunctuation tokens[12], ','
        testName tokens[14], 'thirtytwo'

      it 'tokenizes multiple names and a function call', ->
        {tokens} = grammar.tokenizeLine 'var re, im = complexSqrt(-1)'
        testVar tokens[0]
        testName tokens[2], 're'
        testName tokens[5], 'im'
        testOp tokens[7], '='

      it 'tokenizes with a placeholder', ->
        {tokens} = grammar.tokenizeLine 'var _, found = entries[name]'
        testVar tokens[0]
        testName tokens[2], '_'
        testName tokens[5], 'found'
        testOp tokens[7], '='

      describe 'in "var" statement blocks', ->
        it 'tokenizes single names with a type', ->
          [kwd, decl, closing] = grammar.tokenizeLines '\tvar (\n\t\tfoo *bar\n\t)'
          testVar kwd[1]
          testOpBracket kwd[3], '('
          testName decl[1], 'foo'
          testOp decl[3], '*'
          testName decl[4], 'bar'
          testOpBracket closing[1], ')'

        it 'tokenizes single names with an initializer', ->
          [kwd, decl, closing] = grammar.tokenizeLines 'var (\n\tfoo = 42\n)'
          testVar kwd[0], 'var'
          testOpBracket kwd[2], '('
          testName decl[1], 'foo'
          testOp decl[3], '='
          testNum decl[5], '42'
          testOpBracket closing[0], ')'

        it 'tokenizes multiple names', ->
          [kwd, _, decl, closing] = grammar.tokenizeLines 'var (\n\n\tfoo, bar = baz, quux\n)'
          testVar kwd[0]
          testOpBracket kwd[2], '('
          testName decl[1], 'foo'
          testOpPunctuation decl[2], ','
          testName decl[4], 'bar'
          testOp decl[6], '='
          testName decl[8], 'baz'
          testOpPunctuation decl[9], ','
          testName decl[11], 'quux'
          testOpBracket closing[0], ')'

      describe 'in shorthand variable declarations', ->
        it 'tokenizes single names', ->
          {tokens} = grammar.tokenizeLine 'f := func() int { return 7 }'
          testName tokens[0], 'f'
          testOp tokens[2], ':='

          {tokens} = grammar.tokenizeLine 'ch := make(chan int)'
          testName tokens[0], 'ch'
          testOp tokens[2], ':='

        xit 'tokenizes multiple names', ->
          {tokens} = grammar.tokenizeLine 'i, j := 0, 10'
          testName tokens[0], 'i'
          testOpPunctuation tokens[1], ','
          testName tokens[3], 'j'

          {tokens} = grammar.tokenizeLine 'if _, y, z := coord(p); z > 0'
          testName tokens[2], '_'
          testName tokens[5], 'y'
          testName tokens[8], 'z'
          testOp tokens[10], ':='
