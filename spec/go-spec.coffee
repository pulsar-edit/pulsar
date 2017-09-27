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

  it 'tokenizes comments in imports', ->
    lines = grammar.tokenizeLines '''
      import (
        //"fmt"
        "os" // comment
        // comment!
      )
    '''
    expect(lines[1][1]).toEqual value: '//', scopes: ['source.go', 'comment.line.double-slash.go', 'punctuation.definition.comment.go']
    expect(lines[2][5]).toEqual value: '//', scopes: ['source.go', 'comment.line.double-slash.go', 'punctuation.definition.comment.go']
    expect(lines[3][1]).toEqual value: '//', scopes: ['source.go', 'comment.line.double-slash.go', 'punctuation.definition.comment.go']

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
    runes = [
      'u', 'X', '$', ':', '(', '.', '2', '=', '!', '@',
      '\\a', '\\b', '\\f', '\\n', '\\r', '\\t', '\\v', '\\\\', "\\'", '\\"',
      '\\000', '\\007', '\\377', '\\x07', '\\xff', '\\u12e4', '\\U00101234'
    ]

    for rune in runes
      {tokens} = grammar.tokenizeLine("'#{rune}'")
      expect(tokens[0]).toEqual value: "'", scopes: ['source.go', 'string.quoted.rune.go', 'punctuation.definition.string.begin.go']
      expect(tokens[1]).toEqual value: rune, scopes: ['source.go', 'string.quoted.rune.go', 'constant.other.rune.go']
      expect(tokens[2]).toEqual value: "'", scopes: ['source.go', 'string.quoted.rune.go', 'punctuation.definition.string.end.go']

  it 'tokenizes invalid runes and single quoted strings', ->
    {tokens} = grammar.tokenizeLine("'\\c'")
    expect(tokens[0]).toEqual value: "'", scopes: ['source.go', 'string.quoted.rune.go', 'punctuation.definition.string.begin.go']
    expect(tokens[1]).toEqual value: '\\c', scopes: ['source.go', 'string.quoted.rune.go', 'invalid.illegal.unknown-rune.go']
    expect(tokens[2]).toEqual value: "'", scopes: ['source.go', 'string.quoted.rune.go', 'punctuation.definition.string.end.go']

    {tokens} = grammar.tokenizeLine("'ab'")
    expect(tokens[0]).toEqual value: "'", scopes: ['source.go', 'string.quoted.rune.go', 'punctuation.definition.string.begin.go']
    expect(tokens[1]).toEqual value: 'ab', scopes: ['source.go', 'string.quoted.rune.go', 'invalid.illegal.unknown-rune.go']
    expect(tokens[2]).toEqual value: "'", scopes: ['source.go', 'string.quoted.rune.go', 'punctuation.definition.string.end.go']

    {tokens} = grammar.tokenizeLine("'some single quote string'")
    expect(tokens[0]).toEqual value: "'", scopes: ['source.go', 'string.quoted.rune.go', 'punctuation.definition.string.begin.go']
    expect(tokens[1]).toEqual value: 'some single quote string', scopes: ['source.go', 'string.quoted.rune.go', 'invalid.illegal.unknown-rune.go']
    expect(tokens[2]).toEqual value: "'", scopes: ['source.go', 'string.quoted.rune.go', 'punctuation.definition.string.end.go']

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
      expect(next.scopes).toEqual ['source.go', 'punctuation.definition.begin.bracket.round.go']

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
      expect(relevantToken.scopes).toEqual ['source.go', 'entity.name.function.go']

      next = tokens[t.tokenPos + 1]
      expect(next.value).toEqual '('
      expect(next.scopes).toEqual ['source.go', 'punctuation.definition.begin.bracket.round.go']

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
    {tokens} = grammar.tokenizeLine '{([])}'
    expect(tokens[0]).toEqual value: '{', scopes: ['source.go', 'punctuation.definition.begin.bracket.curly.go']
    expect(tokens[1]).toEqual value: '(', scopes: ['source.go', 'punctuation.definition.begin.bracket.round.go']
    expect(tokens[2]).toEqual value: '[', scopes: ['source.go', 'punctuation.definition.bracket.square.go']
    expect(tokens[3]).toEqual value: ']', scopes: ['source.go', 'punctuation.definition.bracket.square.go']
    expect(tokens[4]).toEqual value: ')', scopes: ['source.go', 'punctuation.definition.end.bracket.round.go']
    expect(tokens[5]).toEqual value: '}', scopes: ['source.go', 'punctuation.definition.end.bracket.curly.go']

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
        expect(next.scopes).toEqual ['source.go', 'punctuation.definition.begin.bracket.round.go']
      else
        expect(relevantToken.scopes).not.toEqual want

  it 'tokenizes package names', ->
    tests = ['package main', 'package mypackage']

    for test in tests
      {tokens} = grammar.tokenizeLine test
      expect(tokens[0].scopes).toEqual ['source.go', 'keyword.package.go']
      expect(tokens[2].scopes).toEqual ['source.go', 'entity.name.package.go']

  it 'tokenizes invalid package names as such', ->
    {tokens} = grammar.tokenizeLine 'package 0mypackage'
    expect(tokens[0]).toEqual value: 'package', scopes: ['source.go', 'keyword.package.go']
    expect(tokens[2]).toEqual value: '0mypackage', scopes: ['source.go', 'invalid.illegal.identifier.go']

  it 'does not treat words that have a trailing package as a package name', ->
    {tokens} = grammar.tokenizeLine 'func myFunc(Varpackage string)'
    expect(tokens[4]).toEqual value: 'Varpackage ', scopes: ['source.go']
    expect(tokens[5]).toEqual value: 'string', scopes: ['source.go', 'storage.type.string.go']

  it 'tokenizes type names', ->
    tests = ['type mystring string', 'type mytype interface{']

    for test in tests
      {tokens} = grammar.tokenizeLine test
      expect(tokens[0].scopes).toEqual ['source.go', 'keyword.type.go']
      expect(tokens[2].scopes).toEqual ['source.go', 'entity.name.type.go']

  it 'tokenizes invalid type names as such', ->
    {tokens} = grammar.tokenizeLine 'type 0mystring string'
    expect(tokens[0]).toEqual value: 'type', scopes: ['source.go', 'keyword.type.go']
    expect(tokens[2]).toEqual value: '0mystring', scopes: ['source.go', 'invalid.illegal.identifier.go']

  it 'does not treat words that have a trailing type as a type name', ->
    {tokens} = grammar.tokenizeLine 'func myFunc(Vartype string)'
    expect(tokens[4]).toEqual value: 'Vartype ', scopes: ['source.go']
    expect(tokens[5]).toEqual value: 'string', scopes: ['source.go', 'storage.type.string.go']

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

    testOpBracket = (token, op, type) ->
      expect(token.value).toBe op
      expect(token.scopes).toEqual ['source.go', "punctuation.definition.variables.#{type}.bracket.round.go"]

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

      it 'tokenizes a single qualified variable assignment', ->
        {tokens} = grammar.tokenizeLine 'a.b = 7'
        expect(tokens[0]).toEqual value: 'a', scopes: ['source.go', 'variable.other.assignment.go']
        expect(tokens[1]).toEqual value: '.', scopes: ['source.go', 'variable.other.assignment.go', 'punctuation.other.period.go']
        expect(tokens[2]).toEqual value: 'b', scopes: ['source.go', 'variable.other.assignment.go']
        testOpAssignment tokens[4], '='
        testNum tokens[6], '7'

      it 'tokenizes multiple variable assignments', ->
        {tokens} = grammar.tokenizeLine 'i, j = 7, 8'
        testVarAssignment tokens[0], 'i'
        testOpPunctuation tokens[1], ','
        testVarAssignment tokens[3], 'j'
        testOpAssignment tokens[5], '='
        testNum tokens[7], '7'
        testNum tokens[10], '8'

      it 'tokenizes multiple qualified variable assignment', ->
        {tokens} = grammar.tokenizeLine 'a.b, c.d = 7, 8'
        expect(tokens[0]).toEqual value: 'a', scopes: ['source.go', 'variable.other.assignment.go']
        expect(tokens[1]).toEqual value: '.', scopes: ['source.go', 'variable.other.assignment.go', 'punctuation.other.period.go']
        expect(tokens[2]).toEqual value: 'b', scopes: ['source.go', 'variable.other.assignment.go']
        testOpPunctuation tokens[3], ','
        expect(tokens[5]).toEqual value: 'c', scopes: ['source.go', 'variable.other.assignment.go']
        expect(tokens[6]).toEqual value: '.', scopes: ['source.go', 'variable.other.assignment.go', 'punctuation.other.period.go']
        expect(tokens[7]).toEqual value: 'd', scopes: ['source.go', 'variable.other.assignment.go']
        testOpAssignment tokens[9], '='
        testNum tokens[11], '7'
        testNum tokens[14], '8'

      it 'tokenizes a single name and a type', ->
        {tokens} = grammar.tokenizeLine 'var i int'
        testVar tokens[0]
        testVarDeclaration tokens[2], 'i'
        testNumType tokens[4], 'int'

      it 'tokenizes a name and a qualified type', ->
        {tokens} = grammar.tokenizeLine 'var a b.c'
        testVar tokens[0]
        expect(tokens[2]).toEqual value: 'a', scopes: ['source.go', 'variable.other.declaration.go']
        expect(tokens[3]).toEqual value: ' b', scopes: ['source.go']
        expect(tokens[4]).toEqual value: '.', scopes: ['source.go', 'punctuation.other.period.go']
        expect(tokens[5]).toEqual value: 'c', scopes: ['source.go']

      it 'tokenizes a single name and an array type', ->
        {tokens} = grammar.tokenizeLine 'var s []string'
        testVar tokens[0]
        testVarDeclaration tokens[2], 's'
        testStringType tokens[6], 'string'

      it 'tokenizes a single name and an array type with predetermined length', ->
        {tokens} = grammar.tokenizeLine 'var s [4]string'
        testVar tokens[0]
        testVarDeclaration tokens[2], 's'
        expect(tokens[4]).toEqual value: '[', scopes: ['source.go', 'punctuation.definition.bracket.square.go']
        expect(tokens[5]).toEqual value: '4', scopes: ['source.go', 'constant.numeric.integer.go']
        expect(tokens[6]).toEqual value: ']', scopes: ['source.go', 'punctuation.definition.bracket.square.go']
        testStringType tokens[7], 'string'

      it 'tokenizes a single name and an array type with variadic length', ->
        {tokens} = grammar.tokenizeLine 'var s [...]string'
        testVar tokens[0]
        testVarDeclaration tokens[2], 's'
        expect(tokens[4]).toEqual value: '[', scopes: ['source.go', 'punctuation.definition.bracket.square.go']
        expect(tokens[5]).toEqual value: '...', scopes: ['source.go', 'keyword.operator.ellipsis.go']
        expect(tokens[6]).toEqual value: ']', scopes: ['source.go', 'punctuation.definition.bracket.square.go']
        testStringType tokens[7], 'string'

      it 'tokenizes a single name and multi-dimensional types with an address', ->
        {tokens} = grammar.tokenizeLine 'var e [][]*string'
        testVar tokens[0]
        testVarDeclaration tokens[2], 'e'
        expect(tokens[4]).toEqual value: '[', scopes: ['source.go', 'punctuation.definition.bracket.square.go']
        expect(tokens[5]).toEqual value: ']', scopes: ['source.go', 'punctuation.definition.bracket.square.go']
        expect(tokens[6]).toEqual value: '[', scopes: ['source.go', 'punctuation.definition.bracket.square.go']
        expect(tokens[7]).toEqual value: ']', scopes: ['source.go', 'punctuation.definition.bracket.square.go']
        testOpAddress tokens[8], '*'
        testStringType tokens[9], 'string'

      it 'tokenizes a single name and a channel', ->
        {tokens} = grammar.tokenizeLine 'var x <-chan bool'
        testVar tokens[0]
        testVarDeclaration tokens[2], 'x'
        expect(tokens[4]).toEqual value: '<-', scopes: ['source.go', 'keyword.operator.channel.go']
        expect(tokens[5]).toEqual value: 'chan', scopes: ['source.go', 'keyword.channel.go']
        expect(tokens[7]).toEqual value: 'bool', scopes: ['source.go', 'storage.type.boolean.go']

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
        expect(tokens[3]).toEqual value: ' blub ', scopes: ['source.go']
        testOpAssignment tokens[4], '='
        testNum tokens[6], '7'

      it 'tokenizes a single name, a qualified type, and an initialization', ->
        {tokens} = grammar.tokenizeLine 'var a b.c = 5'
        testVar tokens[0]
        expect(tokens[2]).toEqual value: 'a', scopes: ['source.go', 'variable.other.assignment.go']
        expect(tokens[3]).toEqual value: ' b', scopes: ['source.go']
        expect(tokens[4]).toEqual value: '.', scopes: ['source.go', 'punctuation.other.period.go']
        expect(tokens[5]).toEqual value: 'c ', scopes: ['source.go']
        testOpAssignment tokens[6], '='
        testNum tokens[8], '5'

      it 'does not tokenize more than necessary', ->
        # This test is worded vaguely because it's hard to describe.
        # Basically, make sure that the variable match isn't tokenizing the entire line
        # in a (=.+) style match. This prevents multiline stuff after the assignment
        # from working correctly, because match can only tokenize single lines.
        lines = grammar.tokenizeLines '''
          var multiline string = `wow!
          this should work!`
        '''
        testVar lines[0][0]
        testVarAssignment lines[0][2], 'multiline'
        testStringType lines[0][4], 'string'
        testOpAssignment lines[0][6], '='
        expect(lines[0][8]).toEqual value: '`', scopes: ['source.go', 'string.quoted.raw.go', 'punctuation.definition.string.begin.go']
        expect(lines[1][1]).toEqual value: '`', scopes: ['source.go', 'string.quoted.raw.go', 'punctuation.definition.string.end.go']

      it 'tokenizes multiple names and a type', ->
        {tokens} = grammar.tokenizeLine 'var U, V,  W  float64'
        testVar tokens[0]
        testVarDeclaration tokens[2], 'U'
        testOpPunctuation tokens[3], ','
        testVarDeclaration tokens[5], 'V'
        testOpPunctuation tokens[6], ','
        testVarDeclaration tokens[8], 'W'

      it 'tokenizes multiple names and a qualified type', ->
        {tokens} = grammar.tokenizeLine 'var a, b c.d'
        testVar tokens[0]
        expect(tokens[2]).toEqual value: 'a', scopes: ['source.go', 'variable.other.declaration.go']
        testOpPunctuation tokens[3], ','
        expect(tokens[5]).toEqual value: 'b', scopes: ['source.go', 'variable.other.declaration.go']
        expect(tokens[6]).toEqual value: ' c', scopes: ['source.go']
        expect(tokens[7]).toEqual value: '.', scopes: ['source.go', 'punctuation.other.period.go']
        expect(tokens[8]).toEqual value: 'd', scopes: ['source.go']

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

      it 'tokenizes multiple names, a qualified type, and initialization expression', ->
        {tokens} = grammar.tokenizeLine 'var a, b c.d = 1, 2'
        testVar tokens[0]
        expect(tokens[2]).toEqual value: 'a', scopes: ['source.go', 'variable.other.assignment.go']
        testOpPunctuation tokens[3], ','
        expect(tokens[5]).toEqual value: 'b', scopes: ['source.go', 'variable.other.assignment.go']
        expect(tokens[6]).toEqual value: ' c', scopes: ['source.go']
        expect(tokens[7]).toEqual value: '.', scopes: ['source.go', 'punctuation.other.period.go']
        expect(tokens[8]).toEqual value: 'd ', scopes: ['source.go']
        testOpAssignment tokens[9], '='
        testNum tokens[11], '1'
        testOpPunctuation tokens[12], ','
        testNum tokens[14], '2'

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

      it 'does not treat words that have a trailing var as a variable declaration', ->
        {tokens} = grammar.tokenizeLine 'func test(envvar string)'
        expect(tokens[4]).toEqual value: 'envvar ', scopes: ['source.go']
        expect(tokens[5]).toEqual value: 'string', scopes: ['source.go', 'storage.type.string.go']

      describe 'in var statement blocks', ->
        it 'tokenizes single names with a type', ->
          lines = grammar.tokenizeLines '''
            var (
              foo *bar
            )
          '''
          testVar lines[0][0]
          testOpBracket lines[0][2], '(', 'begin'
          testVarDeclaration lines[1][1], 'foo'
          testOpAddress lines[1][3], '*'
          testOpBracket lines[2][0], ')', 'end'

        it 'tokenizes single names with an initializer', ->
          lines = grammar.tokenizeLines '''
            var (
              foo = 42
            )
          '''
          testVar lines[0][0], 'var'
          testOpBracket lines[0][2], '(', 'begin'
          testVarAssignment lines[1][1], 'foo'
          testOpAssignment lines[1][3], '='
          testNum lines[1][5], '42'
          testOpBracket lines[2][0], ')', 'end'

        it 'tokenizes multiple names', ->
          lines = grammar.tokenizeLines '''
            var (
              foo, bar = baz, quux
            )
          '''
          testVar lines[0][0]
          testOpBracket lines[0][2], '(', 'begin'
          testVarAssignment lines[1][1], 'foo'
          testOpPunctuation lines[1][2], ','
          testVarAssignment lines[1][4], 'bar'
          testOpAssignment lines[1][6], '='
          testOpPunctuation lines[1][8], ','
          testOpBracket lines[2][0], ')', 'end'

        it 'tokenizes non variable declarations', ->
          lines = grammar.tokenizeLines '''
            var (
              // I am a comment
              foo *bar
              userRegister = &routers.Handler{
            		Handler: func(c echo.Context) error {
            			if err := userService.Register(&user); err != nil {
            				return err
            			}
            			return nil
            		},
            	}
            )
          '''
          testVar lines[0][0]
          testOpBracket lines[0][2], '(', 'begin'
          expect(lines[1][1]).toEqual value: '//', scopes: ['source.go', 'comment.line.double-slash.go', 'punctuation.definition.comment.go']
          expect(lines[1][2]).toEqual value: ' I am a comment', scopes: ['source.go', 'comment.line.double-slash.go']
          testVarDeclaration lines[2][1], 'foo'
          testOpAddress lines[2][3], '*'
          testVarAssignment lines[3][1], 'userRegister'
          expect(lines[4][3]).toEqual value: 'func', scopes: ['source.go', 'keyword.function.go']
          expect(lines[5][1]).toEqual value: 'if', scopes: ['source.go', 'keyword.control.go']
          expect(lines[8][3]).toEqual value: 'nil', scopes: ['source.go', 'constant.language.go']
          testOpBracket lines[11][0], ')', 'end'

        it 'tokenizes all parts of variable initializations correctly', ->
          lines = grammar.tokenizeLines '''
            var (
              m = map[string]int{
                "key": 10,
              }
            )
          '''
          testVar lines[0][0]
          testOpBracket lines[0][2], '(', 'begin'
          testVarAssignment lines[1][1], 'm'
          testOpAssignment lines[1][3], '='
          testString lines[2][2], 'key'
          testNum lines[2][6], '10'
          testOpBracket lines[4][0], ')', 'end'

      it 'tokenizes non-ASCII variable names', ->
        {tokens} = grammar.tokenizeLine 'über = test'
        testVarAssignment tokens[0], 'über'
        testOpAssignment tokens[2], '='

      it 'tokenizes invalid variable names as such', ->
        {tokens} = grammar.tokenizeLine 'var 0test = 0'
        testVar tokens[0]
        expect(tokens[2]).toEqual value: '0test', scopes: ['source.go', 'invalid.illegal.identifier.go']

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

  describe 'in imports declarations', ->
    testImport = (token) ->
      expect(token.value).toBe 'import'
      expect(token.scopes).toEqual ['source.go', 'keyword.import.go']

    testImportAlias = (token, name) ->
      expect(token.value).toBe name
      expect(token.scopes).toEqual ['source.go', 'entity.alias.import.go']

    testImportPackage = (token, name) ->
      expect(token.value).toBe name
      expect(token.scopes).toEqual ['source.go', 'string.quoted.double.go', 'entity.name.import.go']

    testOpBracket = (token, op, type) ->
      expect(token.value).toBe op
      expect(token.scopes).toEqual ['source.go', "punctuation.definition.imports.#{type}.bracket.round.go"]

    testBeginQuoted = (token) ->
      expect(token.value).toBe '"'
      expect(token.scopes).toEqual ['source.go', 'string.quoted.double.go', 'punctuation.definition.string.begin.go']

    testEndQuoted = (token) ->
      expect(token.value).toBe '"'
      expect(token.scopes).toEqual ['source.go', 'string.quoted.double.go', 'punctuation.definition.string.end.go']

    describe 'when it is a single line declaration', ->
      it 'tokenizes declarations with a package name', ->
        {tokens} = grammar.tokenizeLine 'import "fmt"'
        testImport tokens[0]
        testBeginQuoted tokens[2]
        testImportPackage tokens[3], 'fmt'
        testEndQuoted tokens[4]

      it 'tokenizes declarations with a package name and an alias', ->
        {tokens} = grammar.tokenizeLine 'import . "fmt"'
        testImport tokens[0]
        testImportAlias tokens[2], '.'
        testBeginQuoted tokens[4]
        testImportPackage tokens[5], 'fmt'
        testEndQuoted tokens[6]
        {tokens} = grammar.tokenizeLine 'import otherpackage "github.com/test/package"'
        testImport tokens[0]
        testImportAlias tokens[2], 'otherpackage'
        testBeginQuoted tokens[4]
        testImportPackage tokens[5], 'github.com/test/package'
        testEndQuoted tokens[6]

      it 'does not treat words that have a trailing import as a import declaration', ->
        {tokens} = grammar.tokenizeLine 'func myFunc(Varimport string)'
        expect(tokens[4]).toEqual value: 'Varimport ', scopes: ['source.go']
        expect(tokens[5]).toEqual value: 'string', scopes: ['source.go', 'storage.type.string.go']

    describe 'when it is a multi line declaration', ->
      it 'tokenizes single declarations with a package name', ->
        [kwd, decl, closing] = grammar.tokenizeLines '''
          import (
            "github.com/test/package"
          )
        '''
        testImport kwd[0]
        testOpBracket kwd[2], '(', 'begin'
        testBeginQuoted decl[1]
        testImportPackage decl[2], 'github.com/test/package'
        testEndQuoted decl[3]
        testOpBracket closing[0], ')', 'end'

      it 'tokenizes multiple declarations with a package name', ->
        [kwd, decl, decl2, closing] = grammar.tokenizeLines '''
          import (
            "github.com/test/package"
            "fmt"
          )
        '''
        testImport kwd[0]
        testOpBracket kwd[2], '(', 'begin'
        testBeginQuoted decl[1]
        testImportPackage decl[2], 'github.com/test/package'
        testEndQuoted decl[3]
        testBeginQuoted decl2[1]
        testImportPackage decl2[2], 'fmt'
        testEndQuoted decl2[3]
        testOpBracket closing[0], ')', 'end'

      it 'tokenizes single imports with an alias for a multi-line declaration', ->
        [kwd, decl, closing] = grammar.tokenizeLines '''
          import (
            . "github.com/test/package"
          )
        '''
        testImport kwd[0]
        testOpBracket kwd[2], '(', 'begin'
        testImportAlias decl[1], '.'
        testBeginQuoted decl[3]
        testImportPackage decl[4], 'github.com/test/package'
        testEndQuoted decl[5]
        testOpBracket closing[0], ')', 'end'

      it 'tokenizes multiple imports with an alias for a multi-line declaration', ->
        [kwd, decl, decl2, closing] = grammar.tokenizeLines '''
          import (
            . "github.com/test/package"
            "fmt"
          )
        '''
        testImport kwd[0]
        testOpBracket kwd[2], '(', 'begin'
        testImportAlias decl[1], '.'
        testBeginQuoted decl[3]
        testImportPackage decl[4], 'github.com/test/package'
        testEndQuoted decl[5]
        testBeginQuoted decl2[1]
        testImportPackage decl2[2], 'fmt'
        testEndQuoted decl2[3]
        testOpBracket closing[0], ')', 'end'
