
describe("Shell session grammar", () => {
  let grammar = null;

  beforeEach(() => {
    atom.config.set('core.useTreeSitterParsers', false);


    waitsForPromise(() => atom.packages.activatePackage("language-shellscript"));

    runs(() => grammar = atom.grammars.grammarForScopeName("text.shell-session"));
  });

  it("parses the grammar", () => {
    expect(grammar).toBeDefined();
    expect(grammar.scopeName).toBe("text.shell-session");
  });

  const prompts = [">", "$", "#", "%", "❯", "➜"];
  it("tokenizes prompts", () => (() => {
    const result = [];
    for (let delim of prompts) {
      const {tokens} = grammar.tokenizeLine(delim + ' echo $FOO');

      expect(tokens[0]).toEqual({value: delim, scopes: ['text.shell-session', 'punctuation.separator.prompt.shell-session']});
      expect(tokens[1]).toEqual({value: ' ', scopes: ['text.shell-session']});
      result.push(expect(tokens[2]).toEqual({value: 'echo', scopes: ['text.shell-session', 'source.shell', 'support.function.builtin.shell']}));
    }
    return result;
  })());

  it("tokenises prompts with Greek characters", () => {
    const sigils = ["λ", "Λ", "Δ", "Σ", "Ω"];
    return (() => {
      const result = [];
      for (let sigil of sigils) {
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
    for (let delim of prompts) {
      const {tokens} = grammar.tokenizeLine('  ' + delim + ' echo $FOO');

      result.push(expect(tokens[0]).toEqual({value: '  ' + delim + ' echo $FOO', scopes: ['text.shell-session', 'meta.output.shell-session']}));
    }
    return result;
  })());

  it("tokenizes prompts with prefixes", () => {
    const {tokens} = grammar.tokenizeLine('user@machine $ echo $FOO');

    expect(tokens[0]).toEqual({value: 'user@machine', scopes: ['text.shell-session', 'entity.other.prompt-prefix.shell-session']});
    expect(tokens[1]).toEqual({value: ' ', scopes: ['text.shell-session']});
    expect(tokens[2]).toEqual({value: '$', scopes: ['text.shell-session', 'punctuation.separator.prompt.shell-session']});
    expect(tokens[3]).toEqual({value: ' ', scopes: ['text.shell-session']});
    expect(tokens[4]).toEqual({value: 'echo', scopes: ['text.shell-session', 'source.shell', 'support.function.builtin.shell']});
});

  it("tokenizes prompts with prefixes and a leading parenthetical", () => {
    const {tokens} = grammar.tokenizeLine('(venv) machine:pwd user$ echo $FOO');

    expect(tokens[0]).toEqual({value: '(venv) machine:pwd user', scopes: ['text.shell-session', 'entity.other.prompt-prefix.shell-session']});
    expect(tokens[1]).toEqual({value: '$', scopes: ['text.shell-session', 'punctuation.separator.prompt.shell-session']});
    expect(tokens[2]).toEqual({value: ' ', scopes: ['text.shell-session']});
    expect(tokens[3]).toEqual({value: 'echo', scopes: ['text.shell-session', 'source.shell', 'support.function.builtin.shell']});
});

  it("tokenizes prompts with prefixes with brackets", () => {
    const {tokens} = grammar.tokenizeLine('[user@machine pwd]$ echo $FOO');

    expect(tokens[0]).toEqual({value: '[user@machine pwd]', scopes: ['text.shell-session', 'entity.other.prompt-prefix.shell-session']});
    expect(tokens[1]).toEqual({value: '$', scopes: ['text.shell-session', 'punctuation.separator.prompt.shell-session']});
    expect(tokens[2]).toEqual({value: ' ', scopes: ['text.shell-session']});
    expect(tokens[3]).toEqual({value: 'echo', scopes: ['text.shell-session', 'source.shell', 'support.function.builtin.shell']});
});

  it("tokenizes shell output", () => {
    const tokens = grammar.tokenizeLines(`\
$ echo $FOO
foo\
`
    );

    expect(tokens[1][0]).toEqual({value: 'foo', scopes: ['text.shell-session', 'meta.output.shell-session']});
});
});
