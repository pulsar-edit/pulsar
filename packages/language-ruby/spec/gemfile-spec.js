/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
describe("TextMate Gemfile grammar", function() {
  let grammar = null;

  beforeEach(function() {
    atom.config.set('core.useTreeSitterParsers', false);


    waitsForPromise(() => atom.packages.activatePackage("language-ruby"));

    return runs(() => grammar = atom.grammars.grammarForScopeName("source.ruby.gemfile"));
  });

  it("parses the grammar", function() {
    expect(grammar).toBeTruthy();
    return expect(grammar.scopeName).toBe("source.ruby.gemfile");
  });

  it("tokenizes ruby", function() {
    const {tokens} = grammar.tokenizeLine('ruby');
    return expect(tokens[0]).toEqual({value: 'ruby', scopes: ['source.ruby.gemfile', 'meta.declaration.ruby.gemfile', 'keyword.other.special-method.ruby.gemfile']});
});

  it("tokenizes source", function() {
    const {tokens} = grammar.tokenizeLine('source');
    return expect(tokens[0]).toEqual({value: 'source', scopes: ['source.ruby.gemfile', 'meta.declaration.ruby.gemfile', 'keyword.other.special-method.ruby.gemfile']});
});

  it("tokenizes group", function() {
    const {tokens} = grammar.tokenizeLine('group');
    return expect(tokens[0]).toEqual({value: 'group', scopes: ['source.ruby.gemfile', 'meta.declaration.ruby.gemfile', 'keyword.other.special-method.ruby.gemfile']});
});

  it("tokenizes gem", function() {
    const {tokens} = grammar.tokenizeLine('gem');
    return expect(tokens[0]).toEqual({value: 'gem', scopes: ['source.ruby.gemfile', 'meta.declaration.ruby.gemfile', 'keyword.other.special-method.ruby.gemfile']});
});

  it("tokenizes double-quoted strings", function() {
    const {tokens} = grammar.tokenizeLine('"foo"');
    expect(tokens[0]).toEqual({value: '"', scopes: ['source.ruby.gemfile', 'string.quoted.double.interpolated.ruby', 'punctuation.definition.string.begin.ruby']});
    expect(tokens[1]).toEqual({value: 'foo', scopes: ['source.ruby.gemfile', 'string.quoted.double.interpolated.ruby']});
    return expect(tokens[2]).toEqual({value: '"', scopes: ['source.ruby.gemfile', 'string.quoted.double.interpolated.ruby', 'punctuation.definition.string.end.ruby']});
});

  it("tokenizes single-quoted strings", function() {
    const {tokens} = grammar.tokenizeLine('\'foo\'');
    expect(tokens[0]).toEqual({value: '\'', scopes: ['source.ruby.gemfile', 'string.quoted.single.ruby', 'punctuation.definition.string.begin.ruby']});
    expect(tokens[1]).toEqual({value: 'foo', scopes: ['source.ruby.gemfile', 'string.quoted.single.ruby']});
    return expect(tokens[2]).toEqual({value: '\'', scopes: ['source.ruby.gemfile', 'string.quoted.single.ruby', 'punctuation.definition.string.end.ruby']});
});

  it("tokenizes group names", function() {
    const {tokens} = grammar.tokenizeLine(':foo');
    expect(tokens[0]).toEqual({value: ':', scopes: ['source.ruby.gemfile', 'constant.other.symbol.ruby', 'punctuation.definition.constant.ruby']});
    return expect(tokens[1]).toEqual({value: 'foo', scopes: ['source.ruby.gemfile', 'constant.other.symbol.ruby']});
});

  return it("tokenizes group properly in ruby code", function() {
    const {tokens} = grammar.tokenizeLine('do |group|');
    expect(tokens[0]).toEqual({value: 'do', scopes: ['source.ruby.gemfile', 'keyword.control.start-block.ruby']});
    expect(tokens[1]).toEqual({value: ' ', scopes: ['source.ruby.gemfile']});
    expect(tokens[2]).toEqual({value: '|', scopes: ['source.ruby.gemfile', 'punctuation.separator.variable.ruby']});
    expect(tokens[3]).toEqual({value: 'group', scopes: ['source.ruby.gemfile', 'variable.other.block.ruby']});
    return expect(tokens[4]).toEqual({value: '|', scopes: ['source.ruby.gemfile', 'punctuation.separator.variable.ruby']});
});
});
