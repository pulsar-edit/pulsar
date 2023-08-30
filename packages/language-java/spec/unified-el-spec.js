
describe('Unified expression language grammar', function() {
  let grammar = null;

  beforeEach(function() {
    atom.config.set('core.useTreeSitterParsers', false);

    waitsForPromise(() => atom.packages.activatePackage('language-java'));

    runs(() => grammar = atom.grammars.grammarForScopeName('source.java.el'));
  });

  it('parses the grammar', function() {
    expect(grammar).toBeTruthy();
    expect(grammar.scopeName).toBe('source.java.el');
  });

  describe('operators', function() {
    it('tokenizes the ternary operator', function() {
      const {tokens} = grammar.tokenizeLine('true ? 0 : 1');

      expect(tokens[2]).toEqual({value: '?', scopes: ['source.java.el', 'keyword.control.ternary.java.el']});
      expect(tokens[6]).toEqual({value: ':', scopes: ['source.java.el', 'keyword.control.ternary.java.el']});
  });

    it('parses the comparison operator `==`', function() {
      const {tokens} = grammar.tokenizeLine('1 == 1');
      expect(tokens[2]).toEqual({value: '==', scopes: ['source.java.el', 'keyword.operator.comparison.java.el']});
  });

    it('parses the comparison operator `!=`', function() {
      const {tokens} = grammar.tokenizeLine('1 != 1');
      expect(tokens[2]).toEqual({value: '!=', scopes: ['source.java.el', 'keyword.operator.comparison.java.el']});
  });

    it('parses the comparison operator `<=`', function() {
      const {tokens} = grammar.tokenizeLine('1 <= 1');
      expect(tokens[2]).toEqual({value: '<=', scopes: ['source.java.el', 'keyword.operator.comparison.java.el']});
  });

    it('parses the comparison operator `>=`', function() {
      const {tokens} = grammar.tokenizeLine('1 >= 1');
      expect(tokens[2]).toEqual({value: '>=', scopes: ['source.java.el', 'keyword.operator.comparison.java.el']});
  });

    it('parses the comparison operator `<`', function() {
      const {tokens} = grammar.tokenizeLine('1 < 1');
      expect(tokens[2]).toEqual({value: '<', scopes: ['source.java.el', 'keyword.operator.comparison.java.el']});
  });

    it('parses the comparison operator `>`', function() {
      const {tokens} = grammar.tokenizeLine('1 > 1');
      expect(tokens[2]).toEqual({value: '>', scopes: ['source.java.el', 'keyword.operator.comparison.java.el']});
  });

    it('parses the comparison operator `eq`', function() {
      const {tokens} = grammar.tokenizeLine('1 eq 1');
      expect(tokens[2]).toEqual({value: 'eq', scopes: ['source.java.el', 'keyword.operator.comparison.java.el']});
  });

    it('parses the comparison operator `ne`', function() {
      const {tokens} = grammar.tokenizeLine('1 ne 1');
      expect(tokens[2]).toEqual({value: 'ne', scopes: ['source.java.el', 'keyword.operator.comparison.java.el']});
  });

    it('parses the comparison operator `le`', function() {
      const {tokens} = grammar.tokenizeLine('1 le 1');
      expect(tokens[2]).toEqual({value: 'le', scopes: ['source.java.el', 'keyword.operator.comparison.java.el']});
  });

    it('parses the comparison operator `gt`', function() {
      const {tokens} = grammar.tokenizeLine('1 gt 1');
      expect(tokens[2]).toEqual({value: 'gt', scopes: ['source.java.el', 'keyword.operator.comparison.java.el']});
  });

    it('parses the comparison operator `lt`', function() {
      const {tokens} = grammar.tokenizeLine('1 lt 1');
      expect(tokens[2]).toEqual({value: 'lt', scopes: ['source.java.el', 'keyword.operator.comparison.java.el']});
  });

    it('parses the comparison operator `gt`', function() {
      const {tokens} = grammar.tokenizeLine('1 gt 1');
      expect(tokens[2]).toEqual({value: 'gt', scopes: ['source.java.el', 'keyword.operator.comparison.java.el']});
  });

    it('parses the empty operators', function() {
      const {tokens} = grammar.tokenizeLine('empty foo');
      expect(tokens[0]).toEqual({value: 'empty', scopes: ['source.java.el', 'keyword.operator.empty.java.el']});
  });

    it('parses the arithmetic operator `-`', function() {
      const {tokens} = grammar.tokenizeLine('1 - 1');
      expect(tokens[2]).toEqual({value: '-', scopes: ['source.java.el', 'keyword.operator.arithmetic.java.el']});
  });

    it('parses the arithmetic operator `+`', function() {
      const {tokens} = grammar.tokenizeLine('1 + 1');
      expect(tokens[2]).toEqual({value: '+', scopes: ['source.java.el', 'keyword.operator.arithmetic.java.el']});
  });

    it('parses the arithmetic operator `*`', function() {
      const {tokens} = grammar.tokenizeLine('1 * 1');
      expect(tokens[2]).toEqual({value: '*', scopes: ['source.java.el', 'keyword.operator.arithmetic.java.el']});
  });

    it('parses the arithmetic operator `/`', function() {
      const {tokens} = grammar.tokenizeLine('1 / 1');
      expect(tokens[2]).toEqual({value: '/', scopes: ['source.java.el', 'keyword.operator.arithmetic.java.el']});
  });

    it('parses the arithmetic operator `%`', function() {
      const {tokens} = grammar.tokenizeLine('1 % 1');
      expect(tokens[2]).toEqual({value: '%', scopes: ['source.java.el', 'keyword.operator.arithmetic.java.el']});
  });

    it('parses the arithmetic operator `div`', function() {
      const {tokens} = grammar.tokenizeLine('1 div 1');
      expect(tokens[2]).toEqual({value: 'div', scopes: ['source.java.el', 'keyword.operator.arithmetic.java.el']});
  });

    it('parses the arithmetic operator `mod`', function() {
      const {tokens} = grammar.tokenizeLine('1 mod 1');
      expect(tokens[2]).toEqual({value: 'mod', scopes: ['source.java.el', 'keyword.operator.arithmetic.java.el']});
  });

    it('parses the logical operator `!`', function() {
      const {tokens} = grammar.tokenizeLine('!foo');
      expect(tokens[0]).toEqual({value: '!', scopes: ['source.java.el', 'keyword.operator.logical.java.el']});
  });

    it('parses the logical operator `&&`', function() {
      const {tokens} = grammar.tokenizeLine('1 && 1');
      expect(tokens[2]).toEqual({value: '&&', scopes: ['source.java.el', 'keyword.operator.logical.java.el']});
  });

    it('parses the logical operator `||`', function() {
      const {tokens} = grammar.tokenizeLine('1 || 1');
      expect(tokens[2]).toEqual({value: '||', scopes: ['source.java.el', 'keyword.operator.logical.java.el']});
  });

    it('parses the logical operator `not`', function() {
      const {tokens} = grammar.tokenizeLine('1 not 1');
      expect(tokens[2]).toEqual({value: 'not', scopes: ['source.java.el', 'keyword.operator.logical.java.el']});
  });

    it('parses the logical operator `and`', function() {
      const {tokens} = grammar.tokenizeLine('1 and 1');
      expect(tokens[2]).toEqual({value: 'and', scopes: ['source.java.el', 'keyword.operator.logical.java.el']});
  });

    it('parses the logical operator `or`', function() {
      const {tokens} = grammar.tokenizeLine('1 or 1');
      expect(tokens[2]).toEqual({value: 'or', scopes: ['source.java.el', 'keyword.operator.logical.java.el']});
  });
});

  describe('literals', function() {
    it('parses boolean literals', function() {
      let {tokens} = grammar.tokenizeLine('true');
      expect(tokens[0]).toEqual({value: 'true', scopes: ['source.java.el', 'constant.boolean.java.el']});

      ({tokens} = grammar.tokenizeLine('false'));
      expect(tokens[0]).toEqual({value: 'false', scopes: ['source.java.el', 'constant.boolean.java.el']});
  });

    it('parses the null literal', function() {
      let tokens;
      return ({tokens} = grammar.tokenizeLine('null'));
    });

    it('parses numeric literals', function() {
      let {tokens} = grammar.tokenizeLine('0');
      expect(tokens[0]).toEqual({value: '0', scopes: ['source.java.el', 'constant.numeric.java.el']});

      ({tokens} = grammar.tokenizeLine('9804'));
      expect(tokens[0]).toEqual({value: '9804', scopes: ['source.java.el', 'constant.numeric.java.el']});

      ({tokens} = grammar.tokenizeLine('0.54'));
      expect(tokens[0]).toEqual({value: '0.54', scopes: ['source.java.el', 'constant.numeric.java.el']});

      ({tokens} = grammar.tokenizeLine('13.12'));
      expect(tokens[0]).toEqual({value: '13.12', scopes: ['source.java.el', 'constant.numeric.java.el']});
  });

    it('tokenizes single quoted string literals', function() {
      const {tokens} = grammar.tokenizeLine("'foo\\n bar \\\'baz'");
      expect(tokens[0]).toEqual({value: "'", scopes: ['source.java.el', 'string.quoted.single.java.el', 'punctuation.definition.string.begin.java.el']});
      expect(tokens[1]).toEqual({value: 'foo', scopes: ['source.java.el', 'string.quoted.single.java.el']});
      expect(tokens[2]).toEqual({value: '\\n', scopes: ['source.java.el', 'string.quoted.single.java.el', 'constant.character.escape.java.el']});
      expect(tokens[3]).toEqual({value: ' bar ', scopes: ['source.java.el', 'string.quoted.single.java.el']});
      expect(tokens[4]).toEqual({value: '\\\'', scopes: ['source.java.el', 'string.quoted.single.java.el', 'constant.character.escape.java.el']});
      expect(tokens[5]).toEqual({value: 'baz', scopes: ['source.java.el', 'string.quoted.single.java.el']});
      expect(tokens[6]).toEqual({value: "'", scopes: ['source.java.el', 'string.quoted.single.java.el', 'punctuation.definition.string.end.java.el']});
  });

    it('tokenizes double quoted string literals', function() {
      const {tokens} = grammar.tokenizeLine('"foo\\n bar \\\"baz"');
      expect(tokens[0]).toEqual({value: '"', scopes: ['source.java.el', 'string.quoted.double.java.el', 'punctuation.definition.string.begin.java.el']});
      expect(tokens[1]).toEqual({value: 'foo', scopes: ['source.java.el', 'string.quoted.double.java.el']});
      expect(tokens[2]).toEqual({value: '\\n', scopes: ['source.java.el', 'string.quoted.double.java.el', 'constant.character.escape.java.el']});
      expect(tokens[3]).toEqual({value: ' bar ', scopes: ['source.java.el', 'string.quoted.double.java.el']});
      expect(tokens[4]).toEqual({value: '\\\"', scopes: ['source.java.el', 'string.quoted.double.java.el', 'constant.character.escape.java.el']});
      expect(tokens[5]).toEqual({value: 'baz', scopes: ['source.java.el', 'string.quoted.double.java.el']});
      expect(tokens[6]).toEqual({value: '"', scopes: ['source.java.el', 'string.quoted.double.java.el', 'punctuation.definition.string.end.java.el']});
  });
});

  it('tokenizes function calls', function() {
    const {tokens} = grammar.tokenizeLine('fn:split(foo, bar)');

    expect(tokens[0]).toEqual({value: 'fn', scopes: ['source.java.el', 'namespace.java.el']});
    expect(tokens[1]).toEqual({value: ':', scopes: ['source.java.el', 'namespace.java.el', 'punctuation.separator.namespace.java.el']});
    expect(tokens[2]).toEqual({value: 'split', scopes: ['source.java.el']});
    expect(tokens[3]).toEqual({value: '(', scopes: ['source.java.el', 'meta.brace.round.java.el']});
    expect(tokens[4]).toEqual({value: 'foo', scopes: ['source.java.el']});
    expect(tokens[5]).toEqual({value: ',', scopes: ['source.java.el', 'meta.delimiter.java.el']});
    expect(tokens[6]).toEqual({value: ' bar', scopes: ['source.java.el']});
    expect(tokens[7]).toEqual({value: ')', scopes: ['source.java.el', 'meta.brace.round.java.el']});
});

  it('tokenizes a computed property access', function() {
    const {tokens} = grammar.tokenizeLine('foo[0]');

    expect(tokens[0]).toEqual({value: 'foo', scopes: ['source.java.el']});
    expect(tokens[1]).toEqual({value: '[', scopes: ['source.java.el', 'meta.brace.square.java.el']});
    expect(tokens[2]).toEqual({value: '0', scopes: ['source.java.el', 'constant.numeric.java.el']});
    expect(tokens[3]).toEqual({value: ']', scopes: ['source.java.el', 'meta.brace.square.java.el']});
});
});
