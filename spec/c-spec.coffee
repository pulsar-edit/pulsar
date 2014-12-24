describe 'Language-C', ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage('language-c')

  describe "C", ->
    beforeEach ->
      grammar = atom.grammars.grammarForScopeName('source.c')

    it 'parses the grammar', ->
      expect(grammar).toBeTruthy()
      expect(grammar.scopeName).toBe 'source.c'

    it 'tokenizes functions', ->
      lines = grammar.tokenizeLines '''
        int something() {
          return 0;
        }
      '''

      expect(lines[0][0]).toEqual value: 'int', scopes: ["source.c", "storage.type.c"]
      expect(lines[0][2]).toEqual value: 'something', scopes: ["source.c", "meta.function.c", "entity.name.function.c"]

  describe "C++", ->
    beforeEach ->
      grammar = atom.grammars.grammarForScopeName('source.cpp')

    it 'parses the grammar', ->
      expect(grammar).toBeTruthy()
      expect(grammar.scopeName).toBe 'source.cpp'

    it 'tokenizes classes', ->
      lines = grammar.tokenizeLines '''
        class Thing {
          int x;
        }
      '''

      expect(lines[0][0]).toEqual value: 'class', scopes: ["source.cpp", "meta.class-struct-block.cpp", "storage.type.cpp"]
      expect(lines[0][2]).toEqual value: 'Thing', scopes: ["source.cpp", "meta.class-struct-block.cpp", "entity.name.type.cpp"]
