
// NOTE: This spec file doesn't use Coffeescript extended quotes (""")
// because Make does not support spaces for indentation (which this spec file is using)
// So we have to settle with \n\t single-line notation

describe("Makefile grammar", () => {
  let grammar = null;

  beforeEach(() => {
    waitsForPromise(() => atom.packages.activatePackage("language-make"));

    runs(() => grammar = atom.grammars.grammarForScopeName("source.makefile"));
  });

  it("parses the grammar", () => {
    expect(grammar).toBeTruthy();
    expect(grammar.scopeName).toBe("source.makefile");
  });

  it("selects the Makefile grammar for files that start with a hashbang make -f command", () => expect(atom.grammars.selectGrammar('', '#!/usr/bin/make -f')).toBe(grammar));

  it("parses comments correctly", () => {
    let lines = grammar.tokenizeLines('#foo\n\t#bar\n#foo\\\nbar');

    expect(lines[0][0]).toEqual({value: '#', scopes: ['source.makefile', 'comment.line.number-sign.makefile', 'punctuation.definition.comment.makefile']});
    expect(lines[0][1]).toEqual({value: 'foo', scopes: ['source.makefile', 'comment.line.number-sign.makefile']});
    expect(lines[1][0]).toEqual({value: '\t', scopes: ['source.makefile', 'punctuation.whitespace.comment.leading.makefile']});
    expect(lines[1][1]).toEqual({value: '#', scopes: ['source.makefile', 'comment.line.number-sign.makefile', 'punctuation.definition.comment.makefile']});
    expect(lines[1][2]).toEqual({value: 'bar', scopes: ['source.makefile', 'comment.line.number-sign.makefile']});
    expect(lines[2][0]).toEqual({value: '#', scopes: ['source.makefile', 'comment.line.number-sign.makefile', 'punctuation.definition.comment.makefile']});
    expect(lines[2][1]).toEqual({value: 'foo', scopes: ['source.makefile', 'comment.line.number-sign.makefile']});
    expect(lines[2][2]).toEqual({value: '\\', scopes: ['source.makefile', 'comment.line.number-sign.makefile', 'constant.character.escape.continuation.makefile']});
    expect(lines[3][0]).toEqual({value: 'bar', scopes: ['source.makefile', 'comment.line.number-sign.makefile']});

    lines = grammar.tokenizeLines('# comment\\\nshould still be a comment\nnot a comment');
    expect(lines[0][0]).toEqual({value: '#', scopes: ['source.makefile', 'comment.line.number-sign.makefile', 'punctuation.definition.comment.makefile']});
    expect(lines[0][1]).toEqual({value: ' comment', scopes: ['source.makefile', 'comment.line.number-sign.makefile']});
    expect(lines[0][2]).toEqual({value: '\\', scopes: ['source.makefile', 'comment.line.number-sign.makefile', 'constant.character.escape.continuation.makefile']});
    expect(lines[1][0]).toEqual({value: 'should still be a comment', scopes: ['source.makefile', 'comment.line.number-sign.makefile']});
    expect(lines[2][0]).toEqual({value: 'not a comment', scopes: ['source.makefile']});
});

  it("parses recipes", () => {
    waitsForPromise(() => atom.packages.activatePackage("language-shellscript"));

    runs(() => {
      const lines = grammar.tokenizeLines('all: foo.bar\n\ttest\n\nclean: foo\n\trm -fr foo.bar');
      expect(lines[0][0]).toEqual({value: 'all', scopes: ['source.makefile', 'meta.scope.target.makefile', 'entity.name.function.target.makefile']});
      expect(lines[3][0]).toEqual({value: 'clean', scopes: ['source.makefile', 'meta.scope.target.makefile', 'entity.name.function.target.makefile']});});
});

      // TODO: Enable these specs after language-shellscript@0.25.0 is on stable
      // lines = grammar.tokenizeLines 'help: # Show this help\n\t@command grep --extended-regexp \'^[a-zA-Z_-]+:.*?# .*$$\' $(MAKEFILE_LIST) | sort | awk \'BEGIN {FS = ":.*?# "}; {printf "\\033[1;39m%-15s\\033[0;39m %s\\n", $$1, $$2}\''
      // expect(lines[0][0]).toEqual value: 'help', scopes: ['source.makefile', 'meta.scope.target.makefile', 'entity.name.function.target.makefile']
      // expect(lines[0][1]).toEqual value: ':', scopes: ['source.makefile', 'meta.scope.target.makefile', 'punctuation.separator.key-value.makefile']
      // expect(lines[0][3]).toEqual value: '#', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.prerequisites.makefile', 'comment.line.number-sign.makefile', 'punctuation.definition.comment.makefile']
      // expect(lines[1][0]).toEqual value: '\t', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.recipe.makefile']
      // expect(lines[1][1]).toEqual value: '@command grep --extended-regexp ', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.recipe.makefile']
      // expect(lines[1][2]).toEqual value: '\'', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.recipe.makefile', 'string.quoted.single.shell', 'punctuation.definition.string.begin.shell']

  const testFunctionCall = function(functionName) {
    const {tokens} = grammar.tokenizeLine('foo: echo $(' + functionName + ' /foo/bar.txt)');

    expect(tokens[4]).toEqual({value: functionName, scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.prerequisites.makefile', 'string.interpolated.makefile', 'meta.scope.function-call.makefile', 'support.function.' + functionName + '.makefile']});
  };

  it("parses `subst` correctly", () => testFunctionCall('subst'));

  it("parses `patsubst` correctly", () => testFunctionCall('patsubst'));

  it("parses `strip` correctly", () => testFunctionCall('strip'));

  it("parses `findstring` correctly", () => testFunctionCall('findstring'));

  it("parses `filter` correctly", () => testFunctionCall('filter'));

  it("parses `sort` correctly", () => testFunctionCall('sort'));

  it("parses `word` correctly", () => testFunctionCall('word'));

  it("parses `wordlist` correctly", () => testFunctionCall('wordlist'));

  it("parses `firstword` correctly", () => testFunctionCall('firstword'));

  it("parses `lastword` correctly", () => testFunctionCall('lastword'));

  it("parses `dir` correctly", () => testFunctionCall('dir'));

  it("parses `notdir` correctly", () => testFunctionCall('notdir'));

  it("parses `suffix` correctly", () => testFunctionCall('suffix'));

  it("parses `basename` correctly", () => testFunctionCall('basename'));

  it("parses `addsuffix` correctly", () => testFunctionCall('addsuffix'));

  it("parses `addprefix` correctly", () => testFunctionCall('addprefix'));

  it("parses `join` correctly", () => testFunctionCall('join'));

  it("parses `wildcard` correctly", () => testFunctionCall('wildcard'));

  it("parses `realpath` correctly", () => testFunctionCall('realpath'));

  it("parses `abspath` correctly", () => testFunctionCall('abspath'));

  it("parses `if` correctly", () => testFunctionCall('if'));

  it("parses `or` correctly", () => testFunctionCall('or'));

  it("parses `and` correctly", () => testFunctionCall('and'));

  it("parses `foreach` correctly", () => testFunctionCall('foreach'));

  it("parses `file` correctly", () => testFunctionCall('file'));

  it("parses `call` correctly", () => testFunctionCall('call'));

  it("parses `value` correctly", () => testFunctionCall('value'));

  it("parses `eval` correctly", () => testFunctionCall('eval'));

  it("parses `error` correctly", () => testFunctionCall('error'));

  it("parses `warning` correctly", () => testFunctionCall('warning'));

  it("parses `info` correctly", () => testFunctionCall('info'));

  it("parses `shell` correctly", () => testFunctionCall('shell'));

  it("parses `guile` correctly", () => testFunctionCall('guile'));

  it("parses targets with line breaks in body", () => {
    const lines = grammar.tokenizeLines('foo:\n\techo $(basename /foo/bar.txt)');

    expect(lines[1][3]).toEqual({value: 'basename', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.recipe.makefile', 'string.interpolated.makefile', 'meta.scope.function-call.makefile', 'support.function.basename.makefile']});
});

  it("continues matching prerequisites after reaching a line continuation character", () => {
    waitsForPromise(() => atom.packages.activatePackage("language-shellscript"));

    runs(() => {
      const lines = grammar.tokenizeLines('hello: a b c \\\n d e f\n\techo "test"');

      expect(lines[0][3]).toEqual({value: '\\', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.prerequisites.makefile', 'constant.character.escape.continuation.makefile']});
      expect(lines[1][0]).toEqual({value: ' d e f', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.prerequisites.makefile']});
      expect(lines[2][1]).toEqual({value: 'echo', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.recipe.makefile', 'support.function.builtin.shell']});});
});

  it("parses nested interpolated strings and function calls correctly", () => {
    waitsForPromise(() => atom.packages.activatePackage("language-shellscript"));

    runs(() => {
      const lines = grammar.tokenizeLines('default:\n\t$(eval MESSAGE=$(shell node -pe "decodeURIComponent(process.argv.pop())" "${MSG}"))');

      expect(lines[1][1]).toEqual({value: '$(', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.recipe.makefile', 'string.interpolated.makefile', 'punctuation.definition.variable.makefile']});
      expect(lines[1][2]).toEqual({value: 'eval', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.recipe.makefile', 'string.interpolated.makefile', 'meta.scope.function-call.makefile', 'support.function.eval.makefile']});
      expect(lines[1][5]).toEqual({value: '$(', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.recipe.makefile', 'string.interpolated.makefile', 'meta.scope.function-call.makefile', 'string.interpolated.makefile', 'punctuation.definition.variable.makefile']});
      expect(lines[1][6]).toEqual({value: 'shell', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.recipe.makefile', 'string.interpolated.makefile', 'meta.scope.function-call.makefile', 'string.interpolated.makefile', 'meta.scope.function-call.makefile', 'support.function.shell.makefile']});
      expect(lines[1][9]).toEqual({value: '"', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.recipe.makefile', 'string.interpolated.makefile', 'meta.scope.function-call.makefile', 'string.interpolated.makefile', 'meta.scope.function-call.makefile', 'string.quoted.double.shell', 'punctuation.definition.string.begin.shell']});
      expect(lines[1][10]).toEqual({value: 'decodeURIComponent(process.argv.pop())', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.recipe.makefile', 'string.interpolated.makefile', 'meta.scope.function-call.makefile', 'string.interpolated.makefile', 'meta.scope.function-call.makefile', 'string.quoted.double.shell']});
      expect(lines[1][11]).toEqual({value: '"', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.recipe.makefile', 'string.interpolated.makefile', 'meta.scope.function-call.makefile', 'string.interpolated.makefile', 'meta.scope.function-call.makefile', 'string.quoted.double.shell', 'punctuation.definition.string.end.shell']});
      expect(lines[1][14]).toEqual({value: '${', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.recipe.makefile', 'string.interpolated.makefile', 'meta.scope.function-call.makefile', 'string.interpolated.makefile', 'meta.scope.function-call.makefile', 'string.quoted.double.shell', 'variable.other.bracket.shell', 'punctuation.definition.variable.shell']});
      expect(lines[1][16]).toEqual({value: '}', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.recipe.makefile', 'string.interpolated.makefile', 'meta.scope.function-call.makefile', 'string.interpolated.makefile', 'meta.scope.function-call.makefile', 'string.quoted.double.shell', 'variable.other.bracket.shell', 'punctuation.definition.variable.shell']});
      expect(lines[1][18]).toEqual({value: ')', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.recipe.makefile', 'string.interpolated.makefile', 'meta.scope.function-call.makefile', 'string.interpolated.makefile', 'punctuation.definition.variable.makefile']});
      expect(lines[1][19]).toEqual({value: ')', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.recipe.makefile', 'string.interpolated.makefile', 'punctuation.definition.variable.makefile']});});
});

  it("recognizes global functions", () => {
    const {tokens} = grammar.tokenizeLine('$(foreach util,$(EXES),$(eval $(call BUILD_EXE,$(util))))');

    expect(tokens[0]).toEqual({value: '$(', scopes: ['source.makefile', 'string.interpolated.makefile', 'punctuation.definition.variable.makefile']});
});

  it("parses `origin` correctly", () => {
    waitsForPromise(() => atom.packages.activatePackage("language-shellscript"));

    runs(() => {
      const lines = grammar.tokenizeLines('default:\n\t$(origin 1)');

      expect(lines[1][1]).toEqual({value: '$(', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.recipe.makefile', 'string.interpolated.makefile', 'punctuation.definition.variable.makefile']});
      expect(lines[1][2]).toEqual({value: 'origin', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.recipe.makefile', 'string.interpolated.makefile', 'meta.scope.function-call.makefile', 'support.function.origin.makefile']});
      expect(lines[1][4]).toEqual({value: '1', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.recipe.makefile', 'string.interpolated.makefile', 'meta.scope.function-call.makefile', 'variable.other.makefile']});
      expect(lines[1][5]).toEqual({value: ')', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.recipe.makefile', 'string.interpolated.makefile', 'punctuation.definition.variable.makefile']});});
});

  it("parses `flavor` correctly", () => {
    waitsForPromise(() => atom.packages.activatePackage("language-shellscript"));

    runs(() => {
      const lines = grammar.tokenizeLines('default:\n\t$(flavor 1)');

      expect(lines[1][1]).toEqual({value: '$(', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.recipe.makefile', 'string.interpolated.makefile', 'punctuation.definition.variable.makefile']});
      expect(lines[1][2]).toEqual({value: 'flavor', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.recipe.makefile', 'string.interpolated.makefile', 'meta.scope.function-call.makefile', 'support.function.flavor.makefile']});
      expect(lines[1][4]).toEqual({value: '1', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.recipe.makefile', 'string.interpolated.makefile', 'meta.scope.function-call.makefile', 'variable.other.makefile']});
      expect(lines[1][5]).toEqual({value: ')', scopes: ['source.makefile', 'meta.scope.target.makefile', 'meta.scope.recipe.makefile', 'string.interpolated.makefile', 'punctuation.definition.variable.makefile']});});
});

  it("tokenizes variable assignments", () => {
    let tokens;
    const operators = ['=', '?=', ':=', '+='];
    for (let operator of Array.from(operators)) {
      ({tokens} = grammar.tokenizeLine(`SOMEVAR ${operator} whatever`));
      expect(tokens[0]).toEqual({value: 'SOMEVAR', scopes: ['source.makefile', 'variable.other.makefile']});
      expect(tokens[1]).toEqual({value: ' ', scopes: ['source.makefile']});
      expect(tokens[2]).toEqual({value: operator, scopes: ['source.makefile', 'keyword.operator.assignment.makefile']});
      expect(tokens[3]).toEqual({value: ' whatever', scopes: ['source.makefile']});
    }

    ({tokens} = grammar.tokenizeLine('`$om3_V@R! := whatever'));
    expect(tokens[0]).toEqual({value: '`$om3_V@R!', scopes: ['source.makefile', 'variable.other.makefile']});
    expect(tokens[1]).toEqual({value: ' ', scopes: ['source.makefile']});
    expect(tokens[2]).toEqual({value: ':=', scopes: ['source.makefile', 'keyword.operator.assignment.makefile']});
    expect(tokens[3]).toEqual({value: ' whatever', scopes: ['source.makefile']});

    let lines = grammar.tokenizeLines('SOMEVAR = OTHER\\\nVAR');
    expect(lines[0][0]).toEqual({value: 'SOMEVAR', scopes: ['source.makefile', 'variable.other.makefile']});
    expect(lines[0][3]).toEqual({value: ' OTHER', scopes: ['source.makefile']});
    expect(lines[0][4]).toEqual({value: '\\', scopes: ['source.makefile', 'constant.character.escape.continuation.makefile']});

    lines = grammar.tokenizeLines('SOMEVAR := foo # bar explanation\nOTHERVAR := bar');
    expect(lines[0][0]).toEqual({value: 'SOMEVAR', scopes: ['source.makefile', 'variable.other.makefile']});
    expect(lines[0][4]).toEqual({value: '#', scopes: ['source.makefile', 'comment.line.number-sign.makefile', 'punctuation.definition.comment.makefile']});
    expect(lines[1][0]).toEqual({value: 'OTHERVAR', scopes: ['source.makefile', 'variable.other.makefile']});
});
});
