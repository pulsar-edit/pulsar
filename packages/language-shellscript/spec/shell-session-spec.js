/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
describe("Shell session grammar", function() {
  let grammar = null;

  beforeEach(function() {
    atom.config.set('core.useTreeSitterParsers', false);


    waitsForPromise(() => atom.packages.activatePackage("language-shellscript"));

    return runs(() => grammar = atom.grammars.grammarForScopeName("text.shell-session"));
  });

  it("parses the grammar", function() {
    expect(grammar).toBeDefined();
    return expect(grammar.scopeName).toBe("text.shell-session");
  });

  const prompts = [">", "$", "#", "%", "❯", "➜"];
  it("tokenizes prompts", () => (() => {
    const result = [];
    for (let delim of Array.from(prompts)) {
      const {tokens} = grammar.tokenizeLine(delim + ' echo $FOO');

      expect(tokens[0]).toEqual({value: delim, scopes: ['text.shell-session', 'punctuation.separator.prompt.shell-session']});
      expect(tokens[1]).toEqual({value: ' ', scopes: ['text.shell-session']});
      result.push(expect(tokens[2]).toEqual({value: 'echo', scopes: ['text.shell-session', 'source.shell', 'support.function.builtin.shell']}));
    }
    return result;
  })());

  it("tokenises prompts with Greek characters", function() {
    const sigils = ["λ", "Λ", "Δ", "Σ", "Ω"];
    return (() => {
      const result = [];
      for (let sigil of Array.from(sigils)) {
        const lines = grammar.tokenizeLines(`\
${sigil} echo ${sigil}μμ
O${sigil}tput Ω\
`
        );
        expect(lines[0][0]).toEqual({value: sigil, scopes: ['text.shell-session', 'punctuation.separator.prompt.shell-session']});
        expect(lines[0][2]).toEqual({value: 'echo', scopes: ['text.shell-session', 'source.shell', 'support.function.builtin.shell']});
        expect(lines[0][3]).toEqual({value: ` ${sigil}μμ`, scopes: ['text.shell-session', 'source.shell']});
        result.push(expect(lines[1][0]).toEqual({value: `O${sigil}tput Ω`, scopes: ['text.shell-session', 'meta.output.shell-session']}));
      }
      return result;
    })();
});

  it("does not tokenize prompts with indents", () => (() => {
    const result = [];
    for (let delim of Array.from(prompts)) {
      const {tokens} = grammar.tokenizeLine('  ' + delim + ' echo $FOO');

      result.push(expect(tokens[0]).toEqual({value: '  ' + delim + ' echo $FOO', scopes: ['text.shell-session', 'meta.output.shell-session']}));
    }
    return result;
  })());

  it("tokenizes prompts with prefixes", function() {
    const {tokens} = grammar.tokenizeLine('user@machine $ echo $FOO');

    expect(tokens[0]).toEqual({value: 'user@machine', scopes: ['text.shell-session', 'entity.other.prompt-prefix.shell-session']});
    expect(tokens[1]).toEqual({value: ' ', scopes: ['text.shell-session']});
    expect(tokens[2]).toEqual({value: '$', scopes: ['text.shell-session', 'punctuation.separator.prompt.shell-session']});
    expect(tokens[3]).toEqual({value: ' ', scopes: ['text.shell-session']});
    return expect(tokens[4]).toEqual({value: 'echo', scopes: ['text.shell-session', 'source.shell', 'support.function.builtin.shell']});
});

  it("tokenizes prompts with prefixes and a leading parenthetical", function() {
    const {tokens} = grammar.tokenizeLine('(venv) machine:pwd user$ echo $FOO');

    expect(tokens[0]).toEqual({value: '(venv) machine:pwd user', scopes: ['text.shell-session', 'entity.other.prompt-prefix.shell-session']});
    expect(tokens[1]).toEqual({value: '$', scopes: ['text.shell-session', 'punctuation.separator.prompt.shell-session']});
    expect(tokens[2]).toEqual({value: ' ', scopes: ['text.shell-session']});
    return expect(tokens[3]).toEqual({value: 'echo', scopes: ['text.shell-session', 'source.shell', 'support.function.builtin.shell']});
});

  it("tokenizes prompts with prefixes with brackets", function() {
    const {tokens} = grammar.tokenizeLine('[user@machine pwd]$ echo $FOO');

    expect(tokens[0]).toEqual({value: '[user@machine pwd]', scopes: ['text.shell-session', 'entity.other.prompt-prefix.shell-session']});
    expect(tokens[1]).toEqual({value: '$', scopes: ['text.shell-session', 'punctuation.separator.prompt.shell-session']});
    expect(tokens[2]).toEqual({value: ' ', scopes: ['text.shell-session']});
    return expect(tokens[3]).toEqual({value: 'echo', scopes: ['text.shell-session', 'source.shell', 'support.function.builtin.shell']});
});

  return it("tokenizes shell output", function() {
    const tokens = grammar.tokenizeLines(`\
$ echo $FOO
foo\
`
    );

    return expect(tokens[1][0]).toEqual({value: 'foo', scopes: ['text.shell-session', 'meta.output.shell-session']});
});
});
