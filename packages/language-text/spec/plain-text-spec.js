/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
describe("Plain Text grammar", function() {
  let grammar = null;

  beforeEach(function() {
    waitsForPromise(() => atom.packages.activatePackage("language-text"));

    return runs(() => grammar = atom.grammars.grammarForScopeName("text.plain"));
  });

  return it("parses the grammar", function() {
    expect(grammar).toBeTruthy();
    return expect(grammar.scopeName).toBe("text.plain");
  });
});
