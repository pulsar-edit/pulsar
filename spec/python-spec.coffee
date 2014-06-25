describe "Python grammar", ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage("language-python")

    runs ->
      grammar = atom.syntax.grammarForScopeName("source.python")

  it "parses the grammar", ->
    expect(grammar).toBeDefined()
    expect(grammar.scopeName).toBe "source.python"

  it "tokenizes multi-line strings", ->
    tokens = grammar.tokenizeLines('"1\\\n2"')

    # Line 0
    expect(tokens[0][0]).toEqual
      value: '"'
      scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.begin.python']

    expect(tokens[0][1]).toEqual
      value: '1'
      scopes: ['source.python', 'string.quoted.double.single-line.python']

    expect(tokens[0][2]).toEqual
      value: '\\'
      scopes: ['source.python', 'string.quoted.double.single-line.python', 'constant.character.escape.newline.python']

    expect(tokens[0][3]).not.toBeDefined()

    # Line 1
    expect(tokens[1][0]).toEqual
      value: '2'
      scopes: ['source.python', 'string.quoted.double.single-line.python']

    expect(tokens[1][1]).toEqual
      value: '"'
      scopes: ['source.python', 'string.quoted.double.single-line.python', 'punctuation.definition.string.end.python']

    expect(tokens[1][2]).not.toBeDefined()
