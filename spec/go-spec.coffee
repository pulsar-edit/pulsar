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
      'string.quoted.raw.go': '`'

    for scope, delim of delims
      {tokens} = grammar.tokenizeLine(delim + 'I am a string' + delim)
      expect(tokens[0].value).toEqual delim
      expect(tokens[0].scopes).toEqual ['source.go', scope, 'punctuation.definition.string.begin.go']
      expect(tokens[1].value).toEqual 'I am a string'
      expect(tokens[1].scopes).toEqual ['source.go', scope]
      expect(tokens[2].value).toEqual delim
      expect(tokens[2].scopes).toEqual ['source.go', scope, 'punctuation.definition.string.end.go']

  it 'tokenizes placeholders in strings', ->
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
      expect(tokens[1].scopes).toEqual ['source.go', 'string.quoted.double.go', 'constant.other.placeholder.go']
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

  it 'tokenizes placeholders in raw strings', ->
    # Taken from go/src/pkg/fmt/fmt_test.go
    verbs = [
      '%# x', '%-5s', '%5s', '%05s', '%.5s', '%10.1q', '%10v', '%-10v', '%.0d'
      '%.d', '%+07.2f', '%0100d', '%0.100f', '%#064x', '%+.3F', '%-#20.8x',
      '%[1]d', '%[2]*[1]d', '%[3]*.[2]*[1]f', '%[3]*.[2]f', '%3.[2]d', '%.[2]d'
      '%-+[1]x', '%d', '%-d', '%+d', '%#d', '% d', '%0d', '%1.2d', '%-1.2d'
      '%+1.2d', '%-+1.2d', '%*d', '%.*d', '%*.*d', '%0*d', '%-*d'
    ]

    for verb in verbs
      {tokens} = grammar.tokenizeLine('`' + verb + '`')
      expect(tokens[0].value).toEqual '`',
      expect(tokens[0].scopes).toEqual ['source.go', 'string.quoted.raw.go', 'punctuation.definition.string.begin.go']
      expect(tokens[1].value).toEqual verb
      expect(tokens[1].scopes).toEqual ['source.go', 'string.quoted.raw.go', 'constant.other.placeholder.go']
      expect(tokens[2].value).toEqual '`',
      expect(tokens[2].scopes).toEqual ['source.go', 'string.quoted.raw.go', 'punctuation.definition.string.end.go']

  it 'tokenizes runes', ->
    verbs = [
      'u', 'X', '$', ':', '(', '.', '2', '=', '!', '@',
      '\\a', '\\b', '\\f', '\\n', '\\r', '\\t', '\\v', '\\\\'
      '\\000', '\\007', '\\377', '\\x07', '\\xff', '\\u12e4', '\\U00101234'
    ]

    for verb in verbs
      {tokens} = grammar.tokenizeLine('\'' + verb + '\'')
      expect(tokens[0].value).toEqual '\'' + verb + '\'',
      expect(tokens[0].scopes).toEqual ['source.go', 'constant.other.rune.go']

  it 'tokenizes invalid runes and single quoted strings', ->
    {tokens} = grammar.tokenizeLine('\'ab\'')
    expect(tokens[0].value).toEqual '\'ab\''
    expect(tokens[0].scopes).toEqual ['source.go', 'invalid.illegal.unknown-rune.go']

    {tokens} = grammar.tokenizeLine('\'some single quote string\'')
    expect(tokens[0].value).toEqual '\'some single quote string\''
    expect(tokens[0].scopes).toEqual ['source.go', 'invalid.illegal.unknown-rune.go']

  it 'tokenizes invalid whitespace around chan annotations', ->
    invalid_send =
      'chan <- sendonly': ' '

    invalid_receive =
      '<- chan recvonly': ' '

    for expr, invalid of invalid_send
      {tokens} = grammar.tokenizeLine(expr)
      expect(tokens[1].value).toEqual invalid
      expect(tokens[1].scopes).toEqual ['source.go', 'invalid.illegal.send-channel.go']

    for expr, invalid of invalid_receive
      {tokens} = grammar.tokenizeLine(expr)
      expect(tokens[1].value).toEqual invalid
      expect(tokens[1].scopes).toEqual ['source.go', 'invalid.illegal.receive-channel.go']

  it 'tokenizes keywords', ->
    keywordLists =
      'keyword.control.go': ['break', 'case', 'continue', 'default', 'defer', 'else', 'fallthrough', 'for', 'go', 'goto', 'if', 'range', 'return', 'select', 'switch']
      'keyword.channel.go': ['chan']
      'keyword.const.go': ['const']
      'keyword.function.go': ['func']
      'keyword.interface.go': ['interface']
      'keyword.import.go': ['import']
      'keyword.map.go': ['map']
      'keyword.package.go': ['package']
      'keyword.struct.go': ['struct']
      'keyword.type.go': ['type']
      'keyword.var.go': ['var']

    for scope, list of keywordLists
      for keyword in list
        {tokens} = grammar.tokenizeLine keyword
        expect(tokens[0].value).toEqual keyword
        expect(tokens[0].scopes).toEqual ['source.go', scope]

  it 'tokenizes storage types', ->
    storageTypes =
      'storage.type.boolean.go': ['bool']
      'storage.type.byte.go': ['byte']
      'storage.type.error.go': ['error']
      'storage.type.numeric.go': ['int', 'int8', 'int16', 'int32', 'int64', 'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'float32', 'float64', 'complex64', 'complex128']
      'storage.type.rune.go': ['rune']
      'storage.type.string.go': ['string']
      'storage.type.uintptr.go': ['uintptr']

    for scope, types of storageTypes
      for type in types
        {tokens} = grammar.tokenizeLine type
        expect(tokens[0].value).toEqual type
        expect(tokens[0].scopes).toEqual ['source.go', scope]

  it 'tokenizes func regardless of the context', ->
    funcKeyword = ['func f()', 'func (x) f()', 'func(x) f()', 'func']
    for line in funcKeyword
      {tokens} = grammar.tokenizeLine line
      expect(tokens[0].value).toEqual 'func'
      expect(tokens[0].scopes).toEqual ['source.go', 'keyword.function.go']

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
      expect(relevantToken.scopes).toEqual ['source.go', 'keyword.function.go']

      next = tokens[t.tokenPos + 1]
      expect(next.value).toEqual '('
      expect(next.scopes).toEqual ['source.go', 'punctuation.other.bracket.round.go']

  it 'only tokenizes func when it is an exact match', ->
    tests = ['myfunc', 'funcMap']
    for test in tests
      {tokens} = grammar.tokenizeLine test
      expect(tokens[0].value).not.toEqual 'func'
      expect(tokens[0].scopes).not.toEqual ['source.go', 'keyword.function.go']

  it 'tokenizes func names in their declarations', ->
    tests = [
      {
        'line': 'func f()'
        'tokenPos': 2
      }
      {
        'line': 'func (T) f()'
        'tokenPos': 6
      }
      {
        'line': 'func (t T) f()'
        'tokenPos': 6
      }
      {
        'line': 'func (t *T) f()'
        'tokenPos': 8
      }
    ]

    for t in tests
      {tokens} = grammar.tokenizeLine t.line
      expect(tokens[0].value).toEqual 'func'
      expect(tokens[0].scopes).toEqual ['source.go', 'keyword.function.go']

      relevantToken = tokens[t.tokenPos]
      expect(relevantToken).toBeDefined()
      expect(relevantToken.value).toEqual 'f'
      expect(relevantToken.scopes).toEqual ['source.go', 'entity.name.function']

      next = tokens[t.tokenPos + 1]
      expect(next.value).toEqual '('
      expect(next.scopes).toEqual ['source.go', 'punctuation.other.bracket.round.go']

  it 'tokenizes operators method declarations', ->
    tests = [
      {
        'line': 'func (t *T) f()'
        'tokenPos': 4
      }
    ]

    for t in tests
      {tokens} = grammar.tokenizeLine t.line
      expect(tokens[0].value).toEqual 'func'
      expect(tokens[0].scopes).toEqual ['source.go', 'keyword.function.go']

      relevantToken = tokens[t.tokenPos]
      expect(relevantToken.value).toEqual '*'
      expect(relevantToken.scopes).toEqual ['source.go', 'keyword.operator.address.go']

  it 'tokenizes numerics', ->
    numbers =
      'constant.numeric.integer.go': ['42', '0600', '0xBadFace', '170141183460469231731687303715884105727', '1E6', '0i', '011i', '1E6i']
      'constant.numeric.floating-point.go': [
        '0.', '72.40', '072.40', '2.71828', '1.e+0', '6.67428e-11', '.25', '.12345E+5',
        '0.i', '2.71828i', '1.e+0i', '6.67428e-11i', '.25i', '.12345E+5i'
      ]

    for scope, nums of numbers
      for num in nums
        {tokens} = grammar.tokenizeLine num
        expect(tokens[0].value).toEqual num
        expect(tokens[0].scopes).toEqual ['source.go', scope]

    invalidOctals = ['08', '039', '0995']
    for num in invalidOctals
      {tokens} = grammar.tokenizeLine num
      expect(tokens[0].value).toEqual num
      expect(tokens[0].scopes).toEqual ['source.go', 'invalid.illegal.numeric.go']

  it 'tokenizes language constants', ->
    constants = ['true', 'false', 'nil', 'iota']
    for constant in constants
      {tokens} = grammar.tokenizeLine constant
      expect(tokens[0].value).toEqual constant
      expect(tokens[0].scopes).toEqual ['source.go', 'constant.language.go']

  it 'tokenizes built-in functions', ->
    funcs = [
      'append(x)', 'cap(x)', 'close(x)', 'complex(x)', 'copy(x)', 'delete(x)', 'imag(x)', 'len(x)', 'make(x)', 'new(x)',
      'panic(x)', 'print(x)', 'println(x)', 'real(x)', 'recover(x)'
    ]
    funcVals = ['append', 'cap', 'close', 'complex', 'copy', 'delete', 'imag', 'len', 'make', 'new', 'panic', 'print', 'println', 'real', 'recover']

    for func in funcs
      funcVal = funcVals[funcs.indexOf(func)]
      {tokens} = grammar.tokenizeLine func
      expect(tokens[0].value).toEqual funcVal
      expect(tokens[0].scopes).toEqual ['source.go', 'support.function.builtin.go']

  it 'tokenizes operators', ->
    binaryOpers =
      'keyword.operator.arithmetic.go': ['+', '-', '*', '/', '%']
      'keyword.operator.arithmetic.bitwise.go': ['&', '|', '^', '&^', '<<', '>>']
      'keyword.operator.assignment.go': ['=', '+=', '-=', '|=', '^=', '*=', '/=', ':=', '%=', '<<=', '>>=', '&=', '&^=']
      'keyword.operator.channel.go': ['<-']
      'keyword.operator.comparison.go': ['==', '!=', '<', '<=', '>', '>=']
      'keyword.operator.decrement.go': ['--']
      'keyword.operator.ellipsis.go': ['...']
      'keyword.operator.increment.go': ['++']
      'keyword.operator.logical.go': ['&&', '||']

    unaryOpers =
      'keyword.operator.address.go': ['*var', '&var']
      'keyword.operator.arithmetic.go': ['+var', '-var']
      'keyword.operator.arithmetic.bitwise.go': ['^var']
      'keyword.operator.logical.go': ['!var']

    for scope, ops of binaryOpers
      for op in ops
        {tokens} = grammar.tokenizeLine op
        expect(tokens[0].value).toEqual op
        expect(tokens[0].scopes).toEqual ['source.go', scope]

    for scope, ops of unaryOpers
      for op in ops
        {tokens} = grammar.tokenizeLine op
        expect(tokens[0].value).toEqual op[0]
        expect(tokens[0].scopes).toEqual ['source.go', scope]

  it 'tokenizes punctuation brackets', ->
    brackets =
      'punctuation.other.bracket.square.go': [ '[', ']' ]
      'punctuation.other.bracket.round.go': [ '(', ')' ]
      'punctuation.other.bracket.curly.go': [ '{', '}' ]

    for scope, brkts of brackets
      for brkt in brkts
        {tokens} = grammar.tokenizeLine brkt
        expect(tokens[0].value).toEqual brkt
        expect(tokens[0].scopes).toEqual ['source.go', scope]

  it 'tokenizes punctuation delimiters', ->
    delims =
      'punctuation.other.comma.go': ','
      'punctuation.other.period.go': '.'
      'punctuation.other.colon.go': ':'

    for scope, delim of delims
      {tokens} = grammar.tokenizeLine delim
      expect(tokens[0].value).toEqual delim
      expect(tokens[0].scopes).toEqual ['source.go', scope]

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
        expect(next.scopes).toEqual ['source.go', 'punctuation.other.bracket.round.go']
      else
        expect(relevantToken.scopes).not.toEqual want

  it 'tokenizes package names', ->
    tests = ['package main', 'package mypackage']

    for test in tests
      {tokens} = grammar.tokenizeLine test
      expect(tokens[0].scopes).toEqual ['source.go', 'keyword.package.go']
      expect(tokens[2].scopes).toEqual ['source.go', 'entity.name.package.go']

  it 'tokenizes type names', ->
    tests = ['type mystring string', 'type mytype interface{']

    for test in tests
      {tokens} = grammar.tokenizeLine test
      expect(tokens[0].scopes).toEqual ['source.go', 'keyword.type.go']
      expect(tokens[2].scopes).toEqual ['source.go', 'entity.name.type.go']

  describe 'in variable declarations', ->
    testVar = (token) ->
      expect(token.value).toBe 'var'
      expect(token.scopes).toEqual ['source.go', 'keyword.var.go']

    testVarAssignment = (token, name) ->
      expect(token.value).toBe name
      expect(token.scopes).toEqual ['source.go', 'variable.other.assignment.go']

    testVarDeclaration = (token, name) ->
      expect(token.value).toBe name
      expect(token.scopes).toEqual ['source.go', 'variable.other.declaration.go']

    testOp = (token, op) ->
      expect(token.value).toBe op
      expect(token.scopes).toEqual ['source.go', 'keyword.operator.go']

    testOpAddress = (token, op) ->
      expect(token.value).toBe op
      expect(token.scopes).toEqual ['source.go', 'keyword.operator.address.go']

    testOpAssignment = (token, op) ->
      expect(token.value).toBe op
      expect(token.scopes).toEqual ['source.go', 'keyword.operator.assignment.go']

    testOpBracket = (token, op) ->
      expect(token.value).toBe op
      expect(token.scopes).toEqual ['source.go', 'punctuation.other.bracket.round.go']

    testOpPunctuation = (token, op) ->
      expect(token.value).toBe op
      expect(token.scopes).toEqual ['source.go', 'punctuation.other.comma.go']

    testOpTermination = (token, op) ->
      expect(token.value).toBe op
      expect(token.scopes).toEqual ['source.go', 'punctuation.terminator.go']

    testNumType = (token, name) ->
      expect(token.value).toBe name
      expect(token.scopes).toEqual ['source.go', 'storage.type.numeric.go']

    testStringType = (token, name) ->
      expect(token.value).toBe name
      expect(token.scopes).toEqual ['source.go', 'storage.type.string.go']

    testNum = (token, value) ->
      expect(token.value).toBe value
      expect(token.scopes).toEqual ['source.go', 'constant.numeric.integer.go']

    testString = (token, value) ->
      expect(token.value).toBe value
      expect(token.scopes).toEqual ['source.go', 'string.quoted.double.go']

    describe 'in var statements', ->
      it 'tokenizes a single variable assignment', ->
        {tokens} = grammar.tokenizeLine 'i = 7'
        testVarAssignment tokens[0], 'i'
        testOpAssignment tokens[2], '='
        testNum tokens[4], '7'

      it 'tokenizes a multiple variable assignments', ->
        {tokens} = grammar.tokenizeLine 'i, j = 7, 8'
        testVarAssignment tokens[0], 'i'
        testOpPunctuation tokens[1], ','
        testVarAssignment tokens[3], 'j'
        testOpAssignment tokens[5], '='
        testNum tokens[7], '7'
        testNum tokens[10], '8'

      it 'tokenizes a single name and a type', ->
        {tokens} = grammar.tokenizeLine 'var i int'
        testVar tokens[0]
        testVarDeclaration tokens[2], 'i'
        testNumType tokens[4], 'int'

      it 'tokenizes a single name and a type', ->
        {tokens} = grammar.tokenizeLine 'var s []string'
        testVar tokens[0]
        testVarDeclaration tokens[2], 's'
        testStringType tokens[6], 'string'

      it 'tokenizes a single name and its initialization', ->
        {tokens} = grammar.tokenizeLine ' var k =  0'
        testVar tokens[1]
        testVarAssignment tokens[3], 'k'
        testOpAssignment tokens[5], '='
        testNum tokens[7], '0'

      it 'tokenizes a single name, a type, and an initialization', ->
        {tokens} = grammar.tokenizeLine 'var z blub = 7'
        testVar tokens[0]
        testVarAssignment tokens[2], 'z'
        expect(tokens[3].scopes).toEqual ['source.go']
        testOpAssignment tokens[4], '='
        testNum tokens[6], '7'

      it 'tokenizes multiple names and a type', ->
        {tokens} = grammar.tokenizeLine 'var U, V,  W  float64'
        testVar tokens[0]
        testVarDeclaration tokens[2], 'U'
        testOpPunctuation tokens[3], ','
        testVarDeclaration tokens[5], 'V'
        testOpPunctuation tokens[6], ','
        testVarDeclaration tokens[8], 'W'

      it 'tokenizes multiple names and initialization expressions', ->
        {tokens} = grammar.tokenizeLine 'var x, y, z = 1, 2, 3'
        testVar tokens[0]
        testVarAssignment tokens[2], 'x'
        testOpPunctuation tokens[3], ','
        testVarAssignment tokens[5], 'y'
        testOpPunctuation tokens[6], ','
        testVarAssignment tokens[8], 'z'
        testOpAssignment tokens[10], '='
        testNum tokens[12], '1'
        testOpPunctuation tokens[13], ','
        testNum tokens[15], '2'
        testOpPunctuation tokens[16], ','
        testNum tokens[18], '3'

      it 'tokenizes multiple names, a type, and initialization expressions', ->
        {tokens} = grammar.tokenizeLine 'var x, y float32 = float, thirtytwo'
        testVar tokens[0]
        testVarAssignment tokens[2], 'x'
        testOpPunctuation tokens[3], ','
        testVarAssignment tokens[5], 'y'
        testNumType tokens[7], 'float32'
        testOpAssignment tokens[9], '='
        testOpPunctuation tokens[11], ','

      it 'tokenizes multiple names and a function call', ->
        {tokens} = grammar.tokenizeLine 'var re, im = complexSqrt(-1)'
        testVar tokens[0]
        testVarAssignment tokens[2], 're'
        testVarAssignment tokens[5], 'im'
        testOpAssignment tokens[7], '='

      it 'tokenizes with a placeholder', ->
        {tokens} = grammar.tokenizeLine 'var _, found = entries[name]'
        testVar tokens[0]
        testVarAssignment tokens[2], '_'
        testVarAssignment tokens[5], 'found'
        testOpAssignment tokens[7], '='

      describe 'in var statement blocks', ->
        it 'tokenizes single names with a type', ->
          [kwd, decl, closing] = grammar.tokenizeLines '\tvar (\n\t\tfoo *bar\n\t)'
          testVar kwd[1]
          testOpBracket kwd[3], '('
          testVarDeclaration decl[1], 'foo'
          testOpAddress decl[3], '*'
          testOpBracket closing[1], ')'

        it 'tokenizes single names with an initializer', ->
          [kwd, decl, closing] = grammar.tokenizeLines 'var (\n\tfoo = 42\n)'
          testVar kwd[0], 'var'
          testOpBracket kwd[2], '('
          testVarAssignment decl[1], 'foo'
          testOpAssignment decl[3], '='
          testNum decl[5], '42'
          testOpBracket closing[0], ')'

        it 'tokenizes multiple names', ->
          [kwd, decl, closing] = grammar.tokenizeLines 'var (\n\tfoo, bar = baz, quux\n)'
          testVar kwd[0]
          testOpBracket kwd[2], '('
          testVarAssignment decl[1], 'foo'
          testOpPunctuation decl[2], ','
          testVarAssignment decl[4], 'bar'
          testOpAssignment decl[6], '='
          testOpPunctuation decl[8], ','
          testOpBracket closing[0], ')'

        it 'tokenizes non variable declarations (e.g. comments)', ->
          [kwd, comment, decl, closing] = grammar.tokenizeLines 'var (\n\t// I am a comment\n\tfoo *bar\n)'
          testVar kwd[0]
          testOpBracket kwd[2], '('
          expect(comment[1].value).toEqual '//'
          expect(comment[1].scopes).toEqual ['source.go', 'comment.line.double-slash.go', 'punctuation.definition.comment.go']
          expect(comment[2].value).toEqual ' I am a comment'
          expect(comment[2].scopes).toEqual ['source.go', 'comment.line.double-slash.go']
          testVarDeclaration decl[1], 'foo'
          testOpAddress decl[3], '*'
          testOpBracket closing[0], ')'
          
        it 'tokenizes all parts of variable initializations correctly', ->
          [kwd, decl, init, _, closing] = grammar.tokenizeLines 'var (\n\tm = map[string]int{\n\t\t"key": 10,\n\t}\n)'
          testVar kwd[0]
          testOpBracket kwd[2], '('
          testVarAssignment decl[1], 'm'
          testOpAssignment decl[3], '='
          testString init[2], 'key'
          testNum init[6], '10'
          testOpBracket closing[0], ')'

      describe 'in shorthand variable declarations', ->
        it 'tokenizes single names', ->
          {tokens} = grammar.tokenizeLine 'f := func() int { return 7 }'
          testVarAssignment tokens[0], 'f'
          testOpAssignment tokens[2], ':='

          {tokens} = grammar.tokenizeLine 'ch := make(chan int)'
          testVarAssignment tokens[0], 'ch'
          testOpAssignment tokens[2], ':='

        it 'tokenizes multiple names', ->
          {tokens} = grammar.tokenizeLine 'i, j := 0, 10'
          testVarAssignment tokens[0], 'i'
          testOpPunctuation tokens[1], ','
          testVarAssignment tokens[3], 'j'

          {tokens} = grammar.tokenizeLine 'if _, y, z := coord(p); z > 0'
          testVarAssignment tokens[2], '_'
          testVarAssignment tokens[5], 'y'
          testVarAssignment tokens[8], 'z'
          testOpAssignment tokens[10], ':='
          testOpTermination tokens[16], ';'
