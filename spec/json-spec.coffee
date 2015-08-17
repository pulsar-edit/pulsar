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
