describe 'Language-Objective-C', ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage('language-objective-c')

    waitsForPromise ->
      atom.packages.activatePackage('language-c')

  describe "Objective-C", ->
    beforeEach ->
      grammar = atom.grammars.grammarForScopeName('source.objc')

    it 'parses the grammar', ->
      expect(grammar).toBeTruthy()
      expect(grammar.scopeName).toBe 'source.objc'

    it 'tokenizes classes', ->
      lines = grammar.tokenizeLines '''
        @interface Thing
        @property (nonatomic, strong) NSArray *items;
        @end
      '''

      expect(lines[0][1]).toEqual value: 'interface', scopes: ["source.objc", "meta.interface-or-protocol.objc", "storage.type.objc"]
      expect(lines[0][3]).toEqual value: 'Thing', scopes: ["source.objc", "meta.interface-or-protocol.objc", "entity.name.type.objc"]

  describe "Objective-C++", ->
    beforeEach ->
      grammar = atom.grammars.grammarForScopeName('source.objcpp')

    it 'parses the grammar', ->
      expect(grammar).toBeTruthy()
      expect(grammar.scopeName).toBe 'source.objcpp'

    it 'tokenizes classes', ->
      lines = grammar.tokenizeLines '''
        class Thing1 {
          vector<int> items;
        };

        @interface Thing2
        @property (nonatomic, strong) NSArray *items;
        @end
      '''

      expect(lines[0][2].value).toBe 'Thing1'
      expect(lines[4][3]).toEqual value: 'Thing2', scopes: ["source.objcpp", "meta.interface-or-protocol.objc", "entity.name.type.objc"]
