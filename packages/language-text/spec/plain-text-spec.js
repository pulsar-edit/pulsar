
describe("Plain Text grammar", () => {
  let grammar = null;

  beforeEach(() => {
    waitsForPromise(() => atom.packages.activatePackage("language-text"));

    runs(() => grammar = atom.grammars.grammarForScopeName("text.plain"));
  });

  it("parses the grammar", () => {
    expect(grammar).toBeTruthy();
    expect(grammar.scopeName).toBe("text.plain");
  });
});
