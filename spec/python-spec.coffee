describe "Python grammar", ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage("language-python")

    runs ->
      grammar = atom.grammars.grammarForScopeName("source.python")

  it "parses the grammar", ->
    expect(grammar).toBeDefined()
    expect(grammar.scopeName).toBe "source.python"

  it "tokenizes multi-line strings", ->
    tokens = grammar.tokenizeLines('"1\\\n2"')

    # Line 0
    expect(tokens[0][0].value).toBe '"'
    expect(tokens[0][0].scopes).toEqual ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']

    expect(tokens[0][1].value).toBe '1'
    expect(tokens[0][1].scopes).toEqual ['source.python', 'string.quoted.double.single-line.python']

    expect(tokens[0][2].value).toBe '\\'
    expect(tokens[0][2].scopes).toEqual ['source.python', 'string.quoted.double.single-line.python', 'constant.character.escape.newline.python']

    expect(tokens[0][3]).not.toBeDefined()

    # Line 1
    expect(tokens[1][0].value).toBe '2'
    expect(tokens[1][0].scopes).toEqual ['source.python', 'string.quoted.double.single-line.python']

    expect(tokens[1][1].value).toBe '"'
    expect(tokens[1][1].scopes).toEqual ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

    expect(tokens[1][2]).not.toBeDefined()

  it "terminates a single-quoted raw string containing opening parenthesis at closing quote", ->
    tokens = grammar.tokenizeLines("r'%d(' #foo")

    expect(tokens[0][0].value).toBe 'r'
    expect(tokens[0][0].scopes).toEqual ['source.python', 'string.quoted.single.single-line.raw-regex.python', 'storage.type.string.python']
    expect(tokens[0][1].value).toBe "'"
    expect(tokens[0][1].scopes).toEqual ['source.python', 'string.quoted.single.single-line.raw-regex.python', 'punctuation.definition.string.begin.python']
    expect(tokens[0][2].value).toBe '%d'
    expect(tokens[0][2].scopes).toEqual ['source.python', 'string.quoted.single.single-line.raw-regex.python', 'constant.other.placeholder.python']
    expect(tokens[0][3].value).toBe '('
    expect(tokens[0][3].scopes).toEqual ['source.python', 'string.quoted.single.single-line.raw-regex.python', 'meta.group.regexp', 'punctuation.definition.group.regexp']
    expect(tokens[0][4].value).toBe "'"
    expect(tokens[0][4].scopes).toEqual ['source.python', 'string.quoted.single.single-line.raw-regex.python', 'punctuation.definition.string.end.python']
    expect(tokens[0][5].value).toBe ' '
    expect(tokens[0][5].scopes).toEqual ['source.python']
    expect(tokens[0][6].value).toBe '#'
    expect(tokens[0][6].scopes).toEqual ['source.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']
    expect(tokens[0][7].value).toBe 'foo'
    expect(tokens[0][7].scopes).toEqual ['source.python', 'comment.line.number-sign.python']

  it "terminates a single-quoted raw string containing opening bracket at closing quote", ->
    tokens = grammar.tokenizeLines("r'%d[' #foo")

    expect(tokens[0][0].value).toBe 'r'
    expect(tokens[0][0].scopes).toEqual ['source.python', 'string.quoted.single.single-line.raw-regex.python', 'storage.type.string.python']
    expect(tokens[0][1].value).toBe "'"
    expect(tokens[0][1].scopes).toEqual ['source.python', 'string.quoted.single.single-line.raw-regex.python', 'punctuation.definition.string.begin.python']
    expect(tokens[0][2].value).toBe '%d'
    expect(tokens[0][2].scopes).toEqual ['source.python', 'string.quoted.single.single-line.raw-regex.python', 'constant.other.placeholder.python']
    expect(tokens[0][3].value).toBe '['
    expect(tokens[0][3].scopes).toEqual ['source.python', 'string.quoted.single.single-line.raw-regex.python', 'constant.other.character-class.set.regexp', 'punctuation.definition.character-class.regexp']
    expect(tokens[0][4].value).toBe "'"
    expect(tokens[0][4].scopes).toEqual ['source.python', 'string.quoted.single.single-line.raw-regex.python', 'punctuation.definition.string.end.python']
    expect(tokens[0][5].value).toBe ' '
    expect(tokens[0][5].scopes).toEqual ['source.python']
    expect(tokens[0][6].value).toBe '#'
    expect(tokens[0][6].scopes).toEqual ['source.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']
    expect(tokens[0][7].value).toBe 'foo'
    expect(tokens[0][7].scopes).toEqual ['source.python', 'comment.line.number-sign.python']

  it "terminates a double-quoted raw string containing opening parenthesis at closing quote", ->
    tokens = grammar.tokenizeLines('r"%d(" #foo')

    expect(tokens[0][0].value).toBe 'r'
    expect(tokens[0][0].scopes).toEqual ['source.python', 'string.quoted.double.single-line.raw-regex.python', 'storage.type.string.python']
    expect(tokens[0][1].value).toBe '"'
    expect(tokens[0][1].scopes).toEqual ['source.python', 'string.quoted.double.single-line.raw-regex.python', 'punctuation.definition.string.begin.python']
    expect(tokens[0][2].value).toBe '%d'
    expect(tokens[0][2].scopes).toEqual ['source.python', 'string.quoted.double.single-line.raw-regex.python', 'constant.other.placeholder.python']
    expect(tokens[0][3].value).toBe '('
    expect(tokens[0][3].scopes).toEqual ['source.python', 'string.quoted.double.single-line.raw-regex.python', 'meta.group.regexp', 'punctuation.definition.group.regexp']
    expect(tokens[0][4].value).toBe '"'
    expect(tokens[0][4].scopes).toEqual ['source.python', 'string.quoted.double.single-line.raw-regex.python', 'punctuation.definition.string.end.python']
    expect(tokens[0][5].value).toBe ' '
    expect(tokens[0][5].scopes).toEqual ['source.python']
    expect(tokens[0][6].value).toBe '#'
    expect(tokens[0][6].scopes).toEqual ['source.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']
    expect(tokens[0][7].value).toBe 'foo'
    expect(tokens[0][7].scopes).toEqual ['source.python', 'comment.line.number-sign.python']

  it "terminates a double-quoted raw string containing opening bracket at closing quote", ->
    tokens = grammar.tokenizeLines('r"%d[" #foo')

    expect(tokens[0][0].value).toBe 'r'
    expect(tokens[0][0].scopes).toEqual ['source.python', 'string.quoted.double.single-line.raw-regex.python', 'storage.type.string.python']
    expect(tokens[0][1].value).toBe '"'
    expect(tokens[0][1].scopes).toEqual ['source.python', 'string.quoted.double.single-line.raw-regex.python', 'punctuation.definition.string.begin.python']
    expect(tokens[0][2].value).toBe '%d'
    expect(tokens[0][2].scopes).toEqual ['source.python', 'string.quoted.double.single-line.raw-regex.python', 'constant.other.placeholder.python']
    expect(tokens[0][3].value).toBe '['
    expect(tokens[0][3].scopes).toEqual ['source.python', 'string.quoted.double.single-line.raw-regex.python', 'constant.other.character-class.set.regexp', 'punctuation.definition.character-class.regexp']
    expect(tokens[0][4].value).toBe '"'
    expect(tokens[0][4].scopes).toEqual ['source.python', 'string.quoted.double.single-line.raw-regex.python', 'punctuation.definition.string.end.python']
    expect(tokens[0][5].value).toBe ' '
    expect(tokens[0][5].scopes).toEqual ['source.python']
    expect(tokens[0][6].value).toBe '#'
    expect(tokens[0][6].scopes).toEqual ['source.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']
    expect(tokens[0][7].value).toBe 'foo'
    expect(tokens[0][7].scopes).toEqual ['source.python', 'comment.line.number-sign.python']

  it "terminates a unicode single-quoted raw string containing opening parenthesis at closing quote", ->
    tokens = grammar.tokenizeLines("ur'%d(' #foo")

    expect(tokens[0][0].value).toBe 'ur'
    expect(tokens[0][0].scopes).toEqual ['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'storage.type.string.python']
    expect(tokens[0][1].value).toBe "'"
    expect(tokens[0][1].scopes).toEqual ['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'punctuation.definition.string.begin.python']
    expect(tokens[0][2].value).toBe '%d'
    expect(tokens[0][2].scopes).toEqual ['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'constant.other.placeholder.python']
    expect(tokens[0][3].value).toBe '('
    expect(tokens[0][3].scopes).toEqual ['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'meta.group.regexp', 'punctuation.definition.group.regexp']
    expect(tokens[0][4].value).toBe "'"
    expect(tokens[0][4].scopes).toEqual ['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'punctuation.definition.string.end.python']
    expect(tokens[0][5].value).toBe ' '
    expect(tokens[0][5].scopes).toEqual ['source.python']
    expect(tokens[0][6].value).toBe '#'
    expect(tokens[0][6].scopes).toEqual ['source.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']
    expect(tokens[0][7].value).toBe 'foo'
    expect(tokens[0][7].scopes).toEqual ['source.python', 'comment.line.number-sign.python']

  it "terminates a unicode single-quoted raw string containing opening bracket at closing quote", ->
    tokens = grammar.tokenizeLines("ur'%d[' #foo")

    expect(tokens[0][0].value).toBe 'ur'
    expect(tokens[0][0].scopes).toEqual ['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'storage.type.string.python']
    expect(tokens[0][1].value).toBe "'"
    expect(tokens[0][1].scopes).toEqual ['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'punctuation.definition.string.begin.python']
    expect(tokens[0][2].value).toBe '%d'
    expect(tokens[0][2].scopes).toEqual ['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'constant.other.placeholder.python']
    expect(tokens[0][3].value).toBe '['
    expect(tokens[0][3].scopes).toEqual ['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'constant.other.character-class.set.regexp', 'punctuation.definition.character-class.regexp']
    expect(tokens[0][4].value).toBe "'"
    expect(tokens[0][4].scopes).toEqual ['source.python', 'string.quoted.single.single-line.unicode-raw-regex.python', 'punctuation.definition.string.end.python']
    expect(tokens[0][5].value).toBe ' '
    expect(tokens[0][5].scopes).toEqual ['source.python']
    expect(tokens[0][6].value).toBe '#'
    expect(tokens[0][6].scopes).toEqual ['source.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']
    expect(tokens[0][7].value).toBe 'foo'
    expect(tokens[0][7].scopes).toEqual ['source.python', 'comment.line.number-sign.python']

  it "terminates a unicode double-quoted raw string containing opening parenthesis at closing quote", ->
    tokens = grammar.tokenizeLines('ur"%d(" #foo')

    expect(tokens[0][0].value).toBe 'ur'
    expect(tokens[0][0].scopes).toEqual ['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'storage.type.string.python']
    expect(tokens[0][1].value).toBe '"'
    expect(tokens[0][1].scopes).toEqual ['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'punctuation.definition.string.begin.python']
    expect(tokens[0][2].value).toBe '%d'
    expect(tokens[0][2].scopes).toEqual ['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'constant.other.placeholder.python']
    expect(tokens[0][3].value).toBe '('
    expect(tokens[0][3].scopes).toEqual ['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'meta.group.regexp', 'punctuation.definition.group.regexp']
    expect(tokens[0][4].value).toBe '"'
    expect(tokens[0][4].scopes).toEqual ['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'punctuation.definition.string.end.python']
    expect(tokens[0][5].value).toBe ' '
    expect(tokens[0][5].scopes).toEqual ['source.python']
    expect(tokens[0][6].value).toBe '#'
    expect(tokens[0][6].scopes).toEqual ['source.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']
    expect(tokens[0][7].value).toBe 'foo'
    expect(tokens[0][7].scopes).toEqual ['source.python', 'comment.line.number-sign.python']

  it "terminates a unicode double-quoted raw string containing opening bracket at closing quote", ->
    tokens = grammar.tokenizeLines('ur"%d[" #foo')

    expect(tokens[0][0].value).toBe 'ur'
    expect(tokens[0][0].scopes).toEqual ['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'storage.type.string.python']
    expect(tokens[0][1].value).toBe '"'
    expect(tokens[0][1].scopes).toEqual ['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'punctuation.definition.string.begin.python']
    expect(tokens[0][2].value).toBe '%d'
    expect(tokens[0][2].scopes).toEqual ['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'constant.other.placeholder.python']
    expect(tokens[0][3].value).toBe '['
    expect(tokens[0][3].scopes).toEqual ['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'constant.other.character-class.set.regexp', 'punctuation.definition.character-class.regexp']
    expect(tokens[0][4].value).toBe '"'
    expect(tokens[0][4].scopes).toEqual ['source.python', 'string.quoted.double.single-line.unicode-raw-regex.python', 'punctuation.definition.string.end.python']
    expect(tokens[0][5].value).toBe ' '
    expect(tokens[0][5].scopes).toEqual ['source.python']
    expect(tokens[0][6].value).toBe '#'
    expect(tokens[0][6].scopes).toEqual ['source.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']
    expect(tokens[0][7].value).toBe 'foo'
    expect(tokens[0][7].scopes).toEqual ['source.python', 'comment.line.number-sign.python']

  it "terminates referencing an item in a list variable after a sequence of a closing and opening bracket", ->
    tokens = grammar.tokenizeLines('foo[i[0]][j[0]]')

    expect(tokens[0][0].value).toBe 'foo'
    expect(tokens[0][0].scopes).toEqual ['source.python', 'meta.item-access.python']
    expect(tokens[0][1].value).toBe '['
    expect(tokens[0][1].scopes).toEqual ['source.python', 'meta.item-access.python', 'punctuation.definition.arguments.begin.python']
    expect(tokens[0][2].value).toBe 'i'
    expect(tokens[0][2].scopes).toEqual ['source.python', 'meta.item-access.python', 'meta.item-access.arguments.python', 'meta.item-access.python']
    expect(tokens[0][3].value).toBe '['
    expect(tokens[0][3].scopes).toEqual ['source.python', 'meta.item-access.python', 'meta.item-access.arguments.python', 'meta.item-access.python', 'punctuation.definition.arguments.begin.python']
    expect(tokens[0][4].value).toBe '0'
    expect(tokens[0][4].scopes).toEqual ['source.python', 'meta.item-access.python', 'meta.item-access.arguments.python', 'meta.item-access.python', 'meta.item-access.arguments.python', 'constant.numeric.integer.decimal.python']
    expect(tokens[0][5].value).toBe ']'
    expect(tokens[0][5].scopes).toEqual ['source.python', 'meta.item-access.python', 'meta.item-access.arguments.python', 'meta.item-access.python', 'punctuation.definition.arguments.end.python']
    expect(tokens[0][6].value).toBe ']'
    expect(tokens[0][6].scopes).toEqual ['source.python', 'meta.item-access.python', 'punctuation.definition.arguments.end.python']
    expect(tokens[0][7].value).toBe '['
    expect(tokens[0][7].scopes).toEqual ['source.python', 'meta.structure.list.python', 'punctuation.definition.list.begin.python']
    expect(tokens[0][8].value).toBe 'j'
    expect(tokens[0][8].scopes).toEqual ['source.python', 'meta.structure.list.python', 'meta.structure.list.item.python', 'meta.item-access.python']
    expect(tokens[0][9].value).toBe '['
    expect(tokens[0][9].scopes).toEqual ['source.python', 'meta.structure.list.python', 'meta.structure.list.item.python', 'meta.item-access.python', 'punctuation.definition.arguments.begin.python']
    expect(tokens[0][10].value).toBe '0'
    expect(tokens[0][10].scopes).toEqual ['source.python', 'meta.structure.list.python', 'meta.structure.list.item.python', 'meta.item-access.python', 'meta.item-access.arguments.python', 'constant.numeric.integer.decimal.python']
    expect(tokens[0][11].value).toBe ']'
    expect(tokens[0][11].scopes).toEqual ['source.python', 'meta.structure.list.python', 'meta.structure.list.item.python', 'meta.item-access.python', 'punctuation.definition.arguments.end.python']
    expect(tokens[0][12].value).toBe ']'
    expect(tokens[0][12].scopes).toEqual ['source.python', 'meta.structure.list.python', 'punctuation.definition.list.end.python']

  it "tokenizes properties of self as variables", ->
    tokens = grammar.tokenizeLines('self.foo')

    expect(tokens[0][0].value).toBe 'self'
    expect(tokens[0][0].scopes).toEqual ['source.python', 'variable.language.python']
    expect(tokens[0][1].value).toBe '.'
    expect(tokens[0][1].scopes).toEqual ['source.python']
    expect(tokens[0][2].value).toBe 'foo'
    expect(tokens[0][2].scopes).toEqual ['source.python']

  it "tokenizes properties of a variable as variables", ->
    tokens = grammar.tokenizeLines('bar.foo')

    expect(tokens[0][0].value).toBe 'bar'
    expect(tokens[0][0].scopes).toEqual ['source.python']
    expect(tokens[0][1].value).toBe '.'
    expect(tokens[0][1].scopes).toEqual ['source.python']
    expect(tokens[0][2].value).toBe 'foo'
    expect(tokens[0][2].scopes).toEqual ['source.python']

  it "tokenizes comments inside function parameters", ->
    {tokens} = grammar.tokenizeLine('def test(arg, # comment')

    expect(tokens[0]).toEqual value: 'def', scopes: ['source.python', 'meta.function.python', 'storage.type.function.python']
    expect(tokens[2]).toEqual value: 'test', scopes: ['source.python', 'meta.function.python', 'entity.name.function.python']
    expect(tokens[3]).toEqual value: '(', scopes: ['source.python', 'meta.function.python', 'punctuation.definition.parameters.begin.python']
    expect(tokens[4]).toEqual value: 'arg', scopes: ['source.python', 'meta.function.python', 'meta.function.parameters.python', 'variable.parameter.function.python']
    expect(tokens[5]).toEqual value: ',', scopes: ['source.python', 'meta.function.python', 'meta.function.parameters.python', 'punctuation.separator.parameters.python']
    expect(tokens[7]).toEqual value: '#', scopes: ['source.python', 'meta.function.python', 'meta.function.parameters.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']
    expect(tokens[8]).toEqual value: ' comment', scopes: ['source.python', 'meta.function.python', 'meta.function.parameters.python', 'comment.line.number-sign.python']

    tokens = grammar.tokenizeLines("""
      def __init__(
        self,
        codec, # comment
        config
      ):
    """)

    expect(tokens[0][0]).toEqual value: 'def', scopes: ['source.python', 'meta.function.python', 'storage.type.function.python']
    expect(tokens[0][2]).toEqual value: '__init__', scopes: ['source.python', 'meta.function.python', 'entity.name.function.python', 'support.function.magic.python']
    expect(tokens[0][3]).toEqual value: '(', scopes: ['source.python', 'meta.function.python', 'punctuation.definition.parameters.begin.python']
    expect(tokens[1][1]).toEqual value: 'self', scopes: ['source.python', 'meta.function.python', 'meta.function.parameters.python', 'variable.parameter.function.python']
    expect(tokens[1][2]).toEqual value: ',', scopes: ['source.python', 'meta.function.python', 'meta.function.parameters.python', 'punctuation.separator.parameters.python']
    expect(tokens[2][1]).toEqual value: 'codec', scopes: ['source.python', 'meta.function.python', 'meta.function.parameters.python', 'variable.parameter.function.python']
    expect(tokens[2][2]).toEqual value: ',', scopes: ['source.python', 'meta.function.python', 'meta.function.parameters.python', 'punctuation.separator.parameters.python']
    expect(tokens[2][4]).toEqual value: '#', scopes: ['source.python', 'meta.function.python', 'meta.function.parameters.python', 'comment.line.number-sign.python', 'punctuation.definition.comment.python']
    expect(tokens[2][5]).toEqual value: ' comment', scopes: ['source.python', 'meta.function.python', 'meta.function.parameters.python', 'comment.line.number-sign.python']
    expect(tokens[3][1]).toEqual value: 'config', scopes: ['source.python', 'meta.function.python', 'meta.function.parameters.python', 'variable.parameter.function.python']
    expect(tokens[4][0]).toEqual value: ')', scopes: ['source.python', 'meta.function.python', 'punctuation.definition.parameters.end.python']
    expect(tokens[4][1]).toEqual value: ':', scopes: ['source.python', 'meta.function.python', 'punctuation.section.function.begin.python']


  it "correctly enables SQL inline highlighting on blocks", ->
    tokens = grammar.tokenizeLines('''
      """
      SELECT bar
      FROM foo
      """
    ''')

    expect(tokens[0][0]).toEqual value: '"""', scopes: ['source.python', 'string.quoted.double.block.sql.python', 'punctuation.definition.string.begin.python']
    expect(tokens[1][0]).toEqual value: 'SELECT bar', scopes: ['source.python', 'string.quoted.double.block.sql.python']
    expect(tokens[2][0]).toEqual value: 'FROM foo', scopes: ['source.python', 'string.quoted.double.block.sql.python']
    expect(tokens[3][0]).toEqual value: '"""', scopes: ['source.python', 'string.quoted.double.block.sql.python', 'punctuation.definition.string.end.python']

    tokens = grammar.tokenizeLines("""
      '''
      SELECT bar
      FROM foo
      '''
    """)

    expect(tokens[0][0]).toEqual value: '\'\'\'', scopes: ['source.python', 'string.quoted.single.block.sql.python', 'punctuation.definition.string.begin.python']
    expect(tokens[1][0]).toEqual value: 'SELECT bar', scopes: ['source.python', 'string.quoted.single.block.sql.python']
    expect(tokens[2][0]).toEqual value: 'FROM foo', scopes: ['source.python', 'string.quoted.single.block.sql.python']
    expect(tokens[3][0]).toEqual value: '\'\'\'', scopes: ['source.python', 'string.quoted.single.block.sql.python', 'punctuation.definition.string.end.python']
