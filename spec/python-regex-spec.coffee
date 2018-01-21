describe 'Python regular expression grammar', ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage('language-python')

    runs ->
      grammar = atom.grammars.grammarForScopeName('source.regexp.python')

  describe 'character classes', ->
    it 'does not recursively match character classes', ->
      {tokens} = grammar.tokenizeLine '[.:[\\]@]'
      expect(tokens[0]).toEqual value: '[', scopes: ['source.regexp.python', 'constant.other.character-class.set.regexp', 'punctuation.definition.character-class.begin.regexp']
      expect(tokens[1]).toEqual value: '.:[', scopes: ['source.regexp.python', 'constant.other.character-class.set.regexp']
      expect(tokens[2]).toEqual value: '\\]', scopes: ['source.regexp.python', 'constant.other.character-class.set.regexp', 'constant.character.escape.backslash.regexp']
      expect(tokens[3]).toEqual value: '@', scopes: ['source.regexp.python', 'constant.other.character-class.set.regexp']
      expect(tokens[4]).toEqual value: ']', scopes: ['source.regexp.python', 'constant.other.character-class.set.regexp', 'punctuation.definition.character-class.end.regexp']
