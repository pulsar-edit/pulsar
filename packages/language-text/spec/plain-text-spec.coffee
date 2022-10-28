describe "Plain Text grammar", ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      core.packages.activatePackage("language-text")

    runs ->
      grammar = core.grammars.grammarForScopeName("text.plain")

  it "parses the grammar", ->
    expect(grammar).toBeTruthy()
    expect(grammar.scopeName).toBe "text.plain"
