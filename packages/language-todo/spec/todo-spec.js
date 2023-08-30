
describe("TODO grammar", () => {
  let grammar = null;

  beforeEach(() => {
    waitsForPromise(() => atom.packages.activatePackage("language-todo"));

    runs(() => grammar = atom.grammars.grammarForScopeName("text.todo"));
  });

  it("parses the grammar", () => {
    expect(grammar).toBeTruthy();
    expect(grammar.scopeName).toBe("text.todo");
  });
});
