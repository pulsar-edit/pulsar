/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
describe("Ruby on Rails package", function() {
  beforeEach(() => waitsForPromise(() => atom.packages.activatePackage("language-ruby-on-rails")));

  it("parses the HTML grammar", function() {
    const grammar = atom.grammars.grammarForScopeName("text.html.ruby");
    expect(grammar).toBeDefined();
    return expect(grammar.scopeName).toBe("text.html.ruby");
  });

  it("parses the JavaScript grammar", function() {
    const grammar = atom.grammars.grammarForScopeName("source.js.rails source.js.jquery");
    expect(grammar).toBeDefined();
    return expect(grammar.scopeName).toBe("source.js.rails source.js.jquery");
  });

  it("parses the RJS grammar", function() {
    const grammar = atom.grammars.grammarForScopeName("source.ruby.rails.rjs");
    expect(grammar).toBeDefined();
    return expect(grammar.scopeName).toBe("source.ruby.rails.rjs");
  });

  it("parses the Rails grammar", function() {
    const grammar = atom.grammars.grammarForScopeName("source.ruby.rails");
    expect(grammar).toBeDefined();
    return expect(grammar.scopeName).toBe("source.ruby.rails");
  });

  return it("parses the SQL grammar", function() {
    const grammar = atom.grammars.grammarForScopeName("source.sql.ruby");
    expect(grammar).toBeDefined();
    return expect(grammar.scopeName).toBe("source.sql.ruby");
  });
});
