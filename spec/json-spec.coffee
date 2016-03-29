describe "JSON grammar", ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage('language-json')

    runs ->
      grammar = atom.grammars.grammarForScopeName('source.json')

  it "parses the grammar", ->
    expect(grammar).toBeDefined()
    expect(grammar.scopeName).toBe 'source.json'

  it "tokenizes arrays", ->
    baseScopes = ['source.json', 'meta.structure.array.json']
    numericScopes = [baseScopes..., 'constant.numeric.json']
    separatorScopes = [baseScopes..., 'punctuation.separator.array.json']

    {tokens} = grammar.tokenizeLine('[1, 2, 3]')
    expect(tokens[0]).toEqual value: '[', scopes: [baseScopes..., 'punctuation.definition.array.begin.json']
    expect(tokens[1]).toEqual value: '1', scopes: numericScopes
    expect(tokens[2]).toEqual value: ',', scopes: separatorScopes
    expect(tokens[3]).toEqual value: ' ', scopes: [baseScopes...]
    expect(tokens[4]).toEqual value: '2', scopes: numericScopes
    expect(tokens[5]).toEqual value: ',', scopes: separatorScopes
    expect(tokens[6]).toEqual value: ' ', scopes: [baseScopes...]
    expect(tokens[7]).toEqual value: '3', scopes: numericScopes
    expect(tokens[8]).toEqual value: ']', scopes: [baseScopes..., 'punctuation.definition.array.end.json']

  it "identifies trailing commas in arrays", ->
    baseScopes = ['source.json', 'meta.structure.array.json']
    numericScopes = [baseScopes..., 'constant.numeric.json']
    separatorScopes = [baseScopes..., 'punctuation.separator.array.json']

    {tokens} = grammar.tokenizeLine('[1, ]')
    expect(tokens[0]).toEqual value: '[', scopes: [baseScopes..., 'punctuation.definition.array.begin.json']
    expect(tokens[1]).toEqual value: '1', scopes: numericScopes
    expect(tokens[2]).toEqual value: ',', scopes: [baseScopes..., 'invalid.illegal.trailing-array-separator.json']
    expect(tokens[3]).toEqual value: ' ', scopes: [baseScopes...]
    expect(tokens[4]).toEqual value: ']', scopes: [baseScopes..., 'punctuation.definition.array.end.json']

  it "tokenizes objects", ->
    baseScopes = ['source.json', 'meta.structure.dictionary.json']
    keyScopes = [baseScopes..., 'string.quoted.double.json']
    keyBeginScopes = [keyScopes..., 'punctuation.definition.string.begin.json']
    keyEndScopes = [keyScopes..., 'punctuation.definition.string.end.json']
    valueScopes = [baseScopes..., 'meta.structure.dictionary.value.json']
    keyValueSeparatorScopes = [valueScopes..., 'punctuation.separator.dictionary.key-value.json']
    pairSeparatorScopes = [valueScopes..., 'punctuation.separator.dictionary.pair.json']
    stringValueScopes = [valueScopes..., 'string.quoted.double.json']

    {tokens} = grammar.tokenizeLine('{"a": 1, "b": true, "foo": "bar"}')
    expect(tokens[0]).toEqual value: '{', scopes: [baseScopes..., 'punctuation.definition.dictionary.begin.json']
    expect(tokens[1]).toEqual value: '"', scopes: keyBeginScopes
    expect(tokens[2]).toEqual value: 'a', scopes: keyScopes
    expect(tokens[3]).toEqual value: '"', scopes: keyEndScopes
    expect(tokens[4]).toEqual value: ':', scopes: keyValueSeparatorScopes
    expect(tokens[5]).toEqual value: ' ', scopes: valueScopes
    expect(tokens[6]).toEqual value: '1', scopes: [valueScopes..., 'constant.numeric.json']
    expect(tokens[7]).toEqual value: ',', scopes: pairSeparatorScopes
    expect(tokens[8]).toEqual value: ' ', scopes: baseScopes
    expect(tokens[9]).toEqual value: '"', scopes: keyBeginScopes
    expect(tokens[10]).toEqual value: 'b', scopes: keyScopes
    expect(tokens[11]).toEqual value: '"', scopes: keyEndScopes
    expect(tokens[12]).toEqual value: ':', scopes: keyValueSeparatorScopes
    expect(tokens[13]).toEqual value: ' ', scopes: valueScopes
    expect(tokens[14]).toEqual value: 'true', scopes: [valueScopes..., 'constant.language.json']
    expect(tokens[15]).toEqual value: ',', scopes: pairSeparatorScopes
    expect(tokens[16]).toEqual value: ' ', scopes: baseScopes
    expect(tokens[17]).toEqual value: '"', scopes: keyBeginScopes
    expect(tokens[18]).toEqual value: 'foo', scopes: keyScopes
    expect(tokens[19]).toEqual value: '"', scopes: keyEndScopes
    expect(tokens[20]).toEqual value: ':', scopes: keyValueSeparatorScopes
    expect(tokens[21]).toEqual value: ' ', scopes: valueScopes
    expect(tokens[22]).toEqual value: '"', scopes: [stringValueScopes..., 'punctuation.definition.string.begin.json']
    expect(tokens[23]).toEqual value: 'bar', scopes: stringValueScopes
    expect(tokens[24]).toEqual value: '"', scopes: [stringValueScopes..., 'punctuation.definition.string.end.json']
    expect(tokens[25]).toEqual value: '}', scopes: [baseScopes..., 'punctuation.definition.dictionary.end.json']

  it "identifies trailing commas in objects", ->
    baseScopes = ['source.json', 'meta.structure.dictionary.json']
    keyScopes = [baseScopes..., 'string.quoted.double.json']
    keyBeginScopes = [keyScopes..., 'punctuation.definition.string.begin.json']
    keyEndScopes = [keyScopes..., 'punctuation.definition.string.end.json']
    valueScopes = [baseScopes..., 'meta.structure.dictionary.value.json']
    keyValueSeparatorScopes = [valueScopes..., 'punctuation.separator.dictionary.key-value.json']
    pairSeparatorScopes = [valueScopes..., 'punctuation.separator.dictionary.pair.json']

    {tokens} = grammar.tokenizeLine('{"a": 1, "b": 2, }')
    expect(tokens[0]).toEqual value: '{', scopes: [baseScopes..., 'punctuation.definition.dictionary.begin.json']
    expect(tokens[1]).toEqual value: '"', scopes: keyBeginScopes
    expect(tokens[2]).toEqual value: 'a', scopes: keyScopes
    expect(tokens[3]).toEqual value: '"', scopes: keyEndScopes
    expect(tokens[4]).toEqual value: ':', scopes: keyValueSeparatorScopes
    expect(tokens[5]).toEqual value: ' ', scopes: valueScopes
    expect(tokens[6]).toEqual value: '1', scopes: [valueScopes..., 'constant.numeric.json']
    expect(tokens[7]).toEqual value: ',', scopes: pairSeparatorScopes
    expect(tokens[8]).toEqual value: ' ', scopes: baseScopes
    expect(tokens[9]).toEqual value: '"', scopes: keyBeginScopes
    expect(tokens[10]).toEqual value: 'b', scopes: keyScopes
    expect(tokens[11]).toEqual value: '"', scopes: keyEndScopes
    expect(tokens[12]).toEqual value: ':', scopes: keyValueSeparatorScopes
    expect(tokens[13]).toEqual value: ' ', scopes: valueScopes
    expect(tokens[14]).toEqual value: '2', scopes: [valueScopes..., 'constant.numeric.json']
    expect(tokens[15]).toEqual value: ',', scopes: [valueScopes..., 'invalid.illegal.trailing-dictionary-separator.json']
    expect(tokens[16]).toEqual value: ' ', scopes: baseScopes
    expect(tokens[17]).toEqual value: '}', scopes: [baseScopes..., 'punctuation.definition.dictionary.end.json']
