describe "Language C# package", ->

  beforeEach ->
    waitsForPromise ->
      core.packages.activatePackage("language-csharp")

  describe "C# Script grammar", ->
    it "parses the grammar", ->
      grammar = core.grammars.grammarForScopeName("source.csx")
      expect(grammar).toBeDefined()
      expect(grammar.scopeName).toBe "source.csx"

  describe "C# Cake grammar", ->
    it "parses the grammar", ->
      grammar = core.grammars.grammarForScopeName("source.cake")
      expect(grammar).toBeDefined()
      expect(grammar.scopeName).toBe "source.cake"
