
describe("Language C# package", function() {

  beforeEach(() => waitsForPromise(() => atom.packages.activatePackage("language-csharp")));

  describe("C# Script grammar", () => it("parses the grammar", function() {
    const grammar = atom.grammars.grammarForScopeName("source.csx");
    expect(grammar).toBeDefined();
    expect(grammar.scopeName).toBe("source.csx");
  }));

  describe("C# Cake grammar", () => it("parses the grammar", function() {
    const grammar = atom.grammars.grammarForScopeName("source.cake");
    expect(grammar).toBeDefined();
    expect(grammar.scopeName).toBe("source.cake");
  }));
});
