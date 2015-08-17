describe "JSON grammar", ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage("language-json")

    runs ->
      grammar = atom.grammars.grammarForScopeName("source.json")

  it "parses the grammar", ->
    expect(grammar).toBeDefined()
    expect(grammar.scopeName).toBe "source.json"

  it "tokenizes arrays", ->
    {tokens} = grammar.tokenizeLine('[1, 2, 3]')
    expect(tokens[0]).toEqual value: '[', scopes: ['source.json', 'meta.structure.array.json', 'punctuation.definition.array.begin.json']
    expect(tokens[1]).toEqual value: '1', scopes: ['source.json', 'meta.structure.array.json', 'constant.numeric.json']
    expect(tokens[2]).toEqual value: ',', scopes: ['source.json', 'meta.structure.array.json', 'punctuation.separator.array.json']
    expect(tokens[3]).toEqual value: ' ', scopes: ['source.json', 'meta.structure.array.json']
    expect(tokens[4]).toEqual value: '2', scopes: ['source.json', 'meta.structure.array.json', 'constant.numeric.json']
    expect(tokens[5]).toEqual value: ',', scopes: ['source.json', 'meta.structure.array.json', 'punctuation.separator.array.json']
    expect(tokens[6]).toEqual value: ' ', scopes: ['source.json', 'meta.structure.array.json']
    expect(tokens[7]).toEqual value: '3', scopes: ['source.json', 'meta.structure.array.json', 'constant.numeric.json']
    expect(tokens[8]).toEqual value: ']', scopes: ['source.json', 'meta.structure.array.json', 'punctuation.definition.array.end.json']

  it "tokenizes objects", ->
    {tokens} = grammar.tokenizeLine('{"a": 1, "b": true, "foo": "bar"}')
    expect(tokens[0]).toEqual value: '{', scopes: ['source.json', 'meta.structure.dictionary.json', 'punctuation.definition.dictionary.begin.json']
    expect(tokens[1]).toEqual value: '"', scopes: ['source.json', 'meta.structure.dictionary.json', 'string.quoted.double.json', 'punctuation.definition.string.begin.json']
    expect(tokens[2]).toEqual value: 'a', scopes: ['source.json', 'meta.structure.dictionary.json', 'string.quoted.double.json']
    expect(tokens[3]).toEqual value: '"', scopes: ['source.json', 'meta.structure.dictionary.json', 'string.quoted.double.json', 'punctuation.definition.string.end.json']
    expect(tokens[4]).toEqual value: ':', scopes: ['source.json', 'meta.structure.dictionary.json', 'meta.structure.dictionary.value.json', 'punctuation.separator.dictionary.key-value.json']
    expect(tokens[5]).toEqual value: ' ', scopes: ['source.json', 'meta.structure.dictionary.json', 'meta.structure.dictionary.value.json']
    expect(tokens[6]).toEqual value: '1', scopes: ['source.json', 'meta.structure.dictionary.json', 'meta.structure.dictionary.value.json', 'constant.numeric.json']
    expect(tokens[7]).toEqual value: ',', scopes: ['source.json', 'meta.structure.dictionary.json', 'meta.structure.dictionary.value.json', 'punctuation.separator.dictionary.pair.json']
    expect(tokens[8]).toEqual value: ' ', scopes: ['source.json', 'meta.structure.dictionary.json']
    expect(tokens[9]).toEqual value: '"', scopes: ['source.json', 'meta.structure.dictionary.json', 'string.quoted.double.json', 'punctuation.definition.string.begin.json']
    expect(tokens[10]).toEqual value: 'b', scopes: ['source.json', 'meta.structure.dictionary.json', 'string.quoted.double.json']
    expect(tokens[11]).toEqual value: '"', scopes: ['source.json', 'meta.structure.dictionary.json', 'string.quoted.double.json', 'punctuation.definition.string.end.json']
    expect(tokens[12]).toEqual value: ':', scopes: ['source.json', 'meta.structure.dictionary.json', 'meta.structure.dictionary.value.json', 'punctuation.separator.dictionary.key-value.json']
    expect(tokens[13]).toEqual value: ' ', scopes: ['source.json', 'meta.structure.dictionary.json', 'meta.structure.dictionary.value.json']
    expect(tokens[14]).toEqual value: 'true', scopes: ['source.json', 'meta.structure.dictionary.json', 'meta.structure.dictionary.value.json', 'constant.language.json']
    expect(tokens[15]).toEqual value: ',', scopes: ['source.json', 'meta.structure.dictionary.json', 'meta.structure.dictionary.value.json', 'punctuation.separator.dictionary.pair.json']
    expect(tokens[16]).toEqual value: ' ', scopes: ['source.json', 'meta.structure.dictionary.json']
    expect(tokens[17]).toEqual value: '"', scopes: ['source.json', 'meta.structure.dictionary.json', 'string.quoted.double.json', 'punctuation.definition.string.begin.json']
    expect(tokens[18]).toEqual value: 'foo', scopes: ['source.json', 'meta.structure.dictionary.json', 'string.quoted.double.json']
    expect(tokens[19]).toEqual value: '"', scopes: ['source.json', 'meta.structure.dictionary.json', 'string.quoted.double.json', 'punctuation.definition.string.end.json']
    expect(tokens[20]).toEqual value: ':', scopes: ['source.json', 'meta.structure.dictionary.json', 'meta.structure.dictionary.value.json', 'punctuation.separator.dictionary.key-value.json']
    expect(tokens[21]).toEqual value: ' ', scopes: ['source.json', 'meta.structure.dictionary.json', 'meta.structure.dictionary.value.json']
    expect(tokens[22]).toEqual value: '"', scopes: ['source.json', 'meta.structure.dictionary.json', 'meta.structure.dictionary.value.json', 'string.quoted.double.json', 'punctuation.definition.string.begin.json']
    expect(tokens[23]).toEqual value: 'bar', scopes: ['source.json', 'meta.structure.dictionary.json', 'meta.structure.dictionary.value.json', 'string.quoted.double.json']
    expect(tokens[24]).toEqual value: '"', scopes: ['source.json', 'meta.structure.dictionary.json', 'meta.structure.dictionary.value.json', 'string.quoted.double.json', 'punctuation.definition.string.end.json']
    expect(tokens[25]).toEqual value: '}', scopes: ['source.json', 'meta.structure.dictionary.json', 'punctuation.definition.dictionary.end.json']
