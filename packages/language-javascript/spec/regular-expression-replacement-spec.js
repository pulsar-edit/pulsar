
describe("Regular Expression Replacement grammar", function() {
  let grammar = null;

  beforeEach(function() {
    atom.config.set('core.useTreeSitterParsers', false);


    waitsForPromise(() => atom.packages.activatePackage("language-javascript"));

    runs(() => grammar = atom.grammars.grammarForScopeName("source.js.regexp.replacement"));
  });

  it("parses the grammar", function() {
    expect(grammar).toBeTruthy();
    expect(grammar.scopeName).toBe("source.js.regexp.replacement");
  });

  describe("basic strings", () => it("tokenizes with no extra scopes", function() {
    const {tokens} = grammar.tokenizeLine('Hello [world]. (hi to you)');
    expect(tokens[0]).toEqual({value: 'Hello [world]. (hi to you)', scopes: ['source.js.regexp.replacement']});
}));

  describe("escaped characters", function() {
    it("tokenizes with as an escape character", function() {
      const {tokens} = grammar.tokenizeLine('\\n');
      expect(tokens[0]).toEqual({value: '\\n', scopes: ['source.js.regexp.replacement', 'constant.character.escape.backslash.regexp.replacement']});
  });

    it("tokenizes '$$' as an escaped '$' character", function() {
      const {tokens} = grammar.tokenizeLine('$$');
      expect(tokens[0]).toEqual({value: '$$', scopes: ['source.js.regexp.replacement', 'constant.character.escape.dollar.regexp.replacement']});
  });

    it("doesn't treat '\\$' as an escaped '$' character", function() {
      const {tokens} = grammar.tokenizeLine('\\$');
      expect(tokens[0]).toEqual({value: '\\$', scopes: ['source.js.regexp.replacement']});
  });

    it("tokenizes '$$1' as an escaped '$' character followed by a '1' character", function() {
      const {tokens} = grammar.tokenizeLine('$$1');
      expect(tokens[0]).toEqual({value: '$$', scopes: ['source.js.regexp.replacement', 'constant.character.escape.dollar.regexp.replacement']});
      expect(tokens[1]).toEqual({value: '1', scopes: ['source.js.regexp.replacement']});
  });
});

  describe("Numeric placeholders", function() {
    it("doesn't tokenize $0 as a variable", function() {
      const {tokens} = grammar.tokenizeLine('$0');
      expect(tokens[0]).toEqual({value: '$0', scopes: ['source.js.regexp.replacement']});
  });

    it("doesn't tokenize $00 as a variable", function() {
      const {tokens} = grammar.tokenizeLine('$00');
      expect(tokens[0]).toEqual({value: '$00', scopes: ['source.js.regexp.replacement']});
  });

    it("tokenizes $1 as a variable", function() {
      const {tokens} = grammar.tokenizeLine('$1');
      expect(tokens[0]).toEqual({value: '$1', scopes: ['source.js.regexp.replacement', 'variable.regexp.replacement']});
  });

    it("tokenizes $01 as a variable", function() {
      const {tokens} = grammar.tokenizeLine('$01');
      expect(tokens[0]).toEqual({value: '$01', scopes: ['source.js.regexp.replacement', 'variable.regexp.replacement']});
  });

    it("tokenizes $3 as a variable", function() {
      const {tokens} = grammar.tokenizeLine('$3');
      expect(tokens[0]).toEqual({value: '$3', scopes: ['source.js.regexp.replacement', 'variable.regexp.replacement']});
  });

    it("tokenizes $10 as a variable", function() {
      const {tokens} = grammar.tokenizeLine('$10');
      expect(tokens[0]).toEqual({value: '$10', scopes: ['source.js.regexp.replacement', 'variable.regexp.replacement']});
  });

    it("tokenizes $99 as a variable", function() {
      const {tokens} = grammar.tokenizeLine('$99');
      expect(tokens[0]).toEqual({value: '$99', scopes: ['source.js.regexp.replacement', 'variable.regexp.replacement']});
  });

    it("doesn't tokenize the third numberic character in '$100' as a variable", function() {
      const {tokens} = grammar.tokenizeLine('$100');
      expect(tokens[0]).toEqual({value: '$10', scopes: ['source.js.regexp.replacement', 'variable.regexp.replacement']});
      expect(tokens[1]).toEqual({value: '0', scopes: ['source.js.regexp.replacement']});
  });

    describe("Matched sub-string placeholder", () => it("tokenizes $& as a variable", function() {
      const {tokens} = grammar.tokenizeLine('$&');
      expect(tokens[0]).toEqual({value: '$&', scopes: ['source.js.regexp.replacement', 'variable.regexp.replacement']});
  }));

    describe("Preceeding portion placeholder", () => it("tokenizes $` as a variable", function() {
      const {tokens} = grammar.tokenizeLine('$`');
      expect(tokens[0]).toEqual({value: '$`', scopes: ['source.js.regexp.replacement', 'variable.regexp.replacement']});
  }));

    describe("Following portion placeholder", () => it("tokenizes $' as a variable", function() {
      const {tokens} = grammar.tokenizeLine('$\'');
      expect(tokens[0]).toEqual({value: '$\'', scopes: ['source.js.regexp.replacement', 'variable.regexp.replacement']});
  }));
});
});
