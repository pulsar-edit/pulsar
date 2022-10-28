describe "TODO grammar", ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      core.packages.activatePackage("language-todo")

    runs ->
      grammar = core.grammars.grammarForScopeName("text.todo")

  it "parses the grammar", ->
    expect(grammar).toBeTruthy()
    expect(grammar.scopeName).toBe "text.todo"
