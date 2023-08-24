
describe("TOML grammar", function() {
  let grammar = null;

  beforeEach(function() {
    waitsForPromise(() => atom.packages.activatePackage("language-toml"));

    runs(function() {
      atom.config.set('core.useTreeSitterParsers', false);
      grammar = atom.grammars.grammarForScopeName('source.toml');
    });
  });

  it("parses the grammar", function() {
    expect(grammar).toBeTruthy();
    expect(grammar.scopeName).toBe("source.toml");
  });

  it("tokenizes comments", function() {
    let {tokens} = grammar.tokenizeLine("# I am a comment");
    expect(tokens[0]).toEqual({value: "#", scopes: ["source.toml", "comment.line.number-sign.toml", "punctuation.definition.comment.toml"]});
    expect(tokens[1]).toEqual({value: " I am a comment", scopes: ["source.toml", "comment.line.number-sign.toml"]});

    ({tokens} = grammar.tokenizeLine("# = I am also a comment!"));
    expect(tokens[0]).toEqual({value: "#", scopes: ["source.toml", "comment.line.number-sign.toml", "punctuation.definition.comment.toml"]});
    expect(tokens[1]).toEqual({value: " = I am also a comment!", scopes: ["source.toml", "comment.line.number-sign.toml"]});

    ({tokens} = grammar.tokenizeLine("#Nope = still a comment"));
    expect(tokens[0]).toEqual({value: "#", scopes: ["source.toml", "comment.line.number-sign.toml", "punctuation.definition.comment.toml"]});
    expect(tokens[1]).toEqual({value: "Nope = still a comment", scopes: ["source.toml", "comment.line.number-sign.toml"]});

    ({tokens} = grammar.tokenizeLine(" #Whitespace = tricky"));
    expect(tokens[1]).toEqual({value: "#", scopes: ["source.toml", "comment.line.number-sign.toml", "punctuation.definition.comment.toml"]});
    expect(tokens[2]).toEqual({value: "Whitespace = tricky", scopes: ["source.toml", "comment.line.number-sign.toml"]});
});

  it("tokenizes strings", function() {
    let {tokens} = grammar.tokenizeLine('foo = "I am a string"');
    expect(tokens[4]).toEqual({value: '"', scopes: ["source.toml", "string.quoted.double.toml", "punctuation.definition.string.begin.toml"]});
    expect(tokens[5]).toEqual({value: 'I am a string', scopes: ["source.toml", "string.quoted.double.toml"]});
    expect(tokens[6]).toEqual({value: '"', scopes: ["source.toml", "string.quoted.double.toml", "punctuation.definition.string.end.toml"]});

    ({tokens} = grammar.tokenizeLine('foo = "I\'m \\n escaped"'));
    expect(tokens[4]).toEqual({value: '"', scopes: ["source.toml", "string.quoted.double.toml", "punctuation.definition.string.begin.toml"]});
    expect(tokens[5]).toEqual({value: "I'm ", scopes: ["source.toml", "string.quoted.double.toml"]});
    expect(tokens[6]).toEqual({value: "\\n", scopes: ["source.toml", "string.quoted.double.toml", "constant.character.escape.toml"]});
    expect(tokens[7]).toEqual({value: " escaped", scopes: ["source.toml", "string.quoted.double.toml"]});
    expect(tokens[8]).toEqual({value: '"', scopes: ["source.toml", "string.quoted.double.toml", "punctuation.definition.string.end.toml"]});

    ({tokens} = grammar.tokenizeLine("foo = 'I am not \\n escaped'"));
    expect(tokens[4]).toEqual({value: "'", scopes: ["source.toml", "string.quoted.single.toml", "punctuation.definition.string.begin.toml"]});
    expect(tokens[5]).toEqual({value: 'I am not \\n escaped', scopes: ["source.toml", "string.quoted.single.toml"]});
    expect(tokens[6]).toEqual({value: "'", scopes: ["source.toml", "string.quoted.single.toml", "punctuation.definition.string.end.toml"]});

    ({tokens} = grammar.tokenizeLine('foo = "Equal sign ahead = no problem"'));
    expect(tokens[4]).toEqual({value: '"', scopes: ["source.toml", "string.quoted.double.toml", "punctuation.definition.string.begin.toml"]});
    expect(tokens[5]).toEqual({value: 'Equal sign ahead = no problem', scopes: ["source.toml", "string.quoted.double.toml"]});
    expect(tokens[6]).toEqual({value: '"', scopes: ["source.toml", "string.quoted.double.toml", "punctuation.definition.string.end.toml"]});
});

  it("does not tokenize equal signs within strings", function() {
    const {tokens} = grammar.tokenizeLine('pywinusb = { version = "*", os_name = "==\'nt\'", index="pypi"}');
    expect(tokens[20]).toEqual({value: "=='nt'", scopes: ["source.toml", "string.quoted.double.toml"]});
});

  it("tokenizes multiline strings", function() {
    let lines = grammar.tokenizeLines(`foo = """
I am a
string
"""\
`
    );
    expect(lines[0][4]).toEqual({value: '"""', scopes: ["source.toml", "string.quoted.double.block.toml", "punctuation.definition.string.begin.toml"]});
    expect(lines[1][0]).toEqual({value: 'I am a', scopes: ["source.toml", "string.quoted.double.block.toml"]});
    expect(lines[2][0]).toEqual({value: 'string', scopes: ["source.toml", "string.quoted.double.block.toml"]});
    expect(lines[3][0]).toEqual({value: '"""', scopes: ["source.toml", "string.quoted.double.block.toml", "punctuation.definition.string.end.toml"]});

    lines = grammar.tokenizeLines(`foo = '''
I am a
string
'''\
`
    );
    expect(lines[0][4]).toEqual({value: "'''", scopes: ["source.toml", "string.quoted.single.block.toml", "punctuation.definition.string.begin.toml"]});
    expect(lines[1][0]).toEqual({value: 'I am a', scopes: ["source.toml", "string.quoted.single.block.toml"]});
    expect(lines[2][0]).toEqual({value: 'string', scopes: ["source.toml", "string.quoted.single.block.toml"]});
    expect(lines[3][0]).toEqual({value: "'''", scopes: ["source.toml", "string.quoted.single.block.toml", "punctuation.definition.string.end.toml"]});
});

  it("tokenizes escape characters in double-quoted multiline strings", function() {
    const lines = grammar.tokenizeLines(`foo = """
I am\\u0020a
\\qstring
with\\UaBcDE3F2escape characters\\nyay
"""\
`
    );
    expect(lines[0][4]).toEqual({value: '"""', scopes: ["source.toml", "string.quoted.double.block.toml", "punctuation.definition.string.begin.toml"]});
    expect(lines[1][0]).toEqual({value: 'I am', scopes: ["source.toml", "string.quoted.double.block.toml"]});
    expect(lines[1][1]).toEqual({value: '\\u0020', scopes: ["source.toml", "string.quoted.double.block.toml", "constant.character.escape.toml"]});
    expect(lines[2][0]).toEqual({value: '\\qstring', scopes: ["source.toml", "string.quoted.double.block.toml"]});
    expect(lines[3][0]).toEqual({value: 'with', scopes: ["source.toml", "string.quoted.double.block.toml"]});
    expect(lines[3][1]).toEqual({value: '\\UaBcDE3F2', scopes: ["source.toml", "string.quoted.double.block.toml", "constant.character.escape.toml"]});
    expect(lines[3][2]).toEqual({value: 'escape characters', scopes: ["source.toml", "string.quoted.double.block.toml"]});
    expect(lines[3][3]).toEqual({value: '\\n', scopes: ["source.toml", "string.quoted.double.block.toml", "constant.character.escape.toml"]});
    expect(lines[3][4]).toEqual({value: 'yay', scopes: ["source.toml", "string.quoted.double.block.toml"]});
    expect(lines[4][0]).toEqual({value: '"""', scopes: ["source.toml", "string.quoted.double.block.toml", "punctuation.definition.string.end.toml"]});
});

  it("tokenizes line continuation characters in double-quoted multiline strings", function() {
    const lines = grammar.tokenizeLines(`foo = """
I am a
string \\
with line-continuation\\ \t
yay
"""\
`
    );
    expect(lines[0][4]).toEqual({value: '"""', scopes: ["source.toml", "string.quoted.double.block.toml", "punctuation.definition.string.begin.toml"]});
    expect(lines[1][0]).toEqual({value: 'I am a', scopes: ["source.toml", "string.quoted.double.block.toml"]});
    expect(lines[2][0]).toEqual({value: 'string ', scopes: ["source.toml", "string.quoted.double.block.toml"]});
    expect(lines[2][1]).toEqual({value: '\\', scopes: ["source.toml", "string.quoted.double.block.toml", "constant.character.escape.toml"]});
    expect(lines[3][0]).toEqual({value: 'with line-continuation', scopes: ["source.toml", "string.quoted.double.block.toml"]});
    expect(lines[3][1]).toEqual({value: '\\', scopes: ["source.toml", "string.quoted.double.block.toml", "constant.character.escape.toml"]});
    expect(lines[3][2]).toEqual({value: ' \t', scopes: ["source.toml", "string.quoted.double.block.toml"]});
    expect(lines[4][0]).toEqual({value: 'yay', scopes: ["source.toml", "string.quoted.double.block.toml"]});
    expect(lines[5][0]).toEqual({value: '"""', scopes: ["source.toml", "string.quoted.double.block.toml", "punctuation.definition.string.end.toml"]});
});

  it("tokenizes escape characters in double-quoted multiline strings", function() {
    const lines = grammar.tokenizeLines(`foo = '''
I am\\u0020a
\\qstring
with\\UaBcDE3F2no escape characters\\naw
'''\
`
    );
    expect(lines[0][4]).toEqual({value: "'''", scopes: ["source.toml", "string.quoted.single.block.toml", "punctuation.definition.string.begin.toml"]});
    expect(lines[1][0]).toEqual({value: 'I am\\u0020a', scopes: ["source.toml", "string.quoted.single.block.toml"]});
    expect(lines[2][0]).toEqual({value: '\\qstring', scopes: ["source.toml", "string.quoted.single.block.toml"]});
    expect(lines[3][0]).toEqual({value: 'with\\UaBcDE3F2no escape characters\\naw', scopes: ["source.toml", "string.quoted.single.block.toml"]});
    expect(lines[4][0]).toEqual({value: "'''", scopes: ["source.toml", "string.quoted.single.block.toml", "punctuation.definition.string.end.toml"]});
});

  it("does not tokenize line continuation characters in single-quoted multiline strings", function() {
    const lines = grammar.tokenizeLines(`foo = '''
I am a
string \\
with no line-continuation\\ \t
aw
'''\
`
    );
    expect(lines[0][4]).toEqual({value: "'''", scopes: ["source.toml", "string.quoted.single.block.toml", "punctuation.definition.string.begin.toml"]});
    expect(lines[1][0]).toEqual({value: 'I am a', scopes: ["source.toml", "string.quoted.single.block.toml"]});
    expect(lines[2][0]).toEqual({value: 'string \\', scopes: ["source.toml", "string.quoted.single.block.toml"]});
    expect(lines[3][0]).toEqual({value: 'with no line-continuation\\ \t', scopes: ["source.toml", "string.quoted.single.block.toml"]});
    expect(lines[4][0]).toEqual({value: 'aw', scopes: ["source.toml", "string.quoted.single.block.toml"]});
    expect(lines[5][0]).toEqual({value: "'''", scopes: ["source.toml", "string.quoted.single.block.toml", "punctuation.definition.string.end.toml"]});
});

  it("tokenizes booleans", function() {
    let {tokens} = grammar.tokenizeLine("foo = true");
    expect(tokens[4]).toEqual({value: "true", scopes: ["source.toml", "constant.language.boolean.true.toml"]});

    ({tokens} = grammar.tokenizeLine("foo = false"));
    expect(tokens[4]).toEqual({value: "false", scopes: ["source.toml", "constant.language.boolean.false.toml"]});
});

  it("tokenizes integers", () => (() => {
    const result = [];
    for (let int of ["+99", "42", "0", "-17", "1_000", "1_2_3_4_5"]) {
      const {tokens} = grammar.tokenizeLine(`foo = ${int}`);
      result.push(expect(tokens[4]).toEqual({value: int, scopes: ["source.toml", "constant.numeric.toml"]}));
    }
    return result;
  })());

  it("does not tokenize a number with leading zeros as an integer", function() {
    const {tokens} = grammar.tokenizeLine("foo = 01");
    expect(tokens[4]).toEqual({value: "01", scopes: ["source.toml", "invalid.illegal.toml"]});
});

  it("does not tokenize a number with an underscore not followed by a digit as an integer", function() {
    let {tokens} = grammar.tokenizeLine("foo = 1__2");
    expect(tokens[4]).toEqual({value: "1__2", scopes: ["source.toml", "invalid.illegal.toml"]});

    ({tokens} = grammar.tokenizeLine("foo = 1_"));
    expect(tokens[4]).toEqual({value: "1_", scopes: ["source.toml", "invalid.illegal.toml"]});
});

  it("tokenizes hex integers", () => (() => {
    const result = [];
    for (let int of ["0xDEADBEEF", "0xdeadbeef", "0xdead_beef"]) {
      const {tokens} = grammar.tokenizeLine(`foo = ${int}`);
      result.push(expect(tokens[4]).toEqual({value: int, scopes: ["source.toml", "constant.numeric.hex.toml"]}));
    }
    return result;
  })());

  it("tokenizes octal integers", function() {
    const {tokens} = grammar.tokenizeLine("foo = 0o755");
    expect(tokens[4]).toEqual({value: "0o755", scopes: ["source.toml", "constant.numeric.octal.toml"]});
});

  it("tokenizes binary integers", function() {
    const {tokens} = grammar.tokenizeLine("foo = 0b11010110");
    expect(tokens[4]).toEqual({value: "0b11010110", scopes: ["source.toml", "constant.numeric.binary.toml"]});
});

  it("does not tokenize a number followed by other characters as a number", function() {
    const {tokens} = grammar.tokenizeLine("foo = 0xdeadbeefs");
    expect(tokens[4]).toEqual({value: "0xdeadbeefs", scopes: ["source.toml", "invalid.illegal.toml"]});
});

  it("tokenizes floats", () => (() => {
    const result = [];
    for (let float of ["+1.0", "3.1415", "-0.01", "5e+22", "1e6", "-2E-2", "6.626e-34", "6.626e-34", "9_224_617.445_991_228_313", "1e1_000"]) {
      const {tokens} = grammar.tokenizeLine(`foo = ${float}`);
      result.push(expect(tokens[4]).toEqual({value: float, scopes: ["source.toml", "constant.numeric.toml"]}));
    }
    return result;
  })());

  it("tokenizes inf and nan", () => ["+", "-", ""].map((sign) =>
    (() => {
      const result = [];
      for (let float of ["inf", "nan"]) {
        const {tokens} = grammar.tokenizeLine(`foo = ${sign}${float}`);
        result.push(expect(tokens[4]).toEqual({value: `${sign}${float}`, scopes: ["source.toml", `constant.numeric.${float}.toml`]}));
      }
      return result;
    })()));

  it("tokenizes offset date-times", function() {
    let {tokens} = grammar.tokenizeLine("foo = 1979-05-27T07:32:00Z");
    expect(tokens[4]).toEqual({value: "1979-05-27", scopes: ["source.toml", "constant.numeric.date.toml"]});
    expect(tokens[5]).toEqual({value: "T", scopes: ["source.toml", "constant.numeric.date.toml", "keyword.other.time.toml"]});
    expect(tokens[6]).toEqual({value: "07:32:00", scopes: ["source.toml", "constant.numeric.date.toml"]});
    expect(tokens[7]).toEqual({value: "Z", scopes: ["source.toml", "constant.numeric.date.toml", "keyword.other.offset.toml"]});

    ({tokens} = grammar.tokenizeLine("foo = 1979-05-27 07:32:00Z"));
    expect(tokens[4]).toEqual({value: "1979-05-27", scopes: ["source.toml", "constant.numeric.date.toml"]});
    expect(tokens[5]).toEqual({value: " ", scopes: ["source.toml", "constant.numeric.date.toml", "keyword.other.time.toml"]});
    expect(tokens[6]).toEqual({value: "07:32:00", scopes: ["source.toml", "constant.numeric.date.toml"]});
    expect(tokens[7]).toEqual({value: "Z", scopes: ["source.toml", "constant.numeric.date.toml", "keyword.other.offset.toml"]});

    ({tokens} = grammar.tokenizeLine("foo = 1979-05-27T00:32:00.999999-07:00"));
    expect(tokens[4]).toEqual({value: "1979-05-27", scopes: ["source.toml", "constant.numeric.date.toml"]});
    expect(tokens[5]).toEqual({value: "T", scopes: ["source.toml", "constant.numeric.date.toml", "keyword.other.time.toml"]});
    expect(tokens[6]).toEqual({value: "00:32:00.999999", scopes: ["source.toml", "constant.numeric.date.toml"]});
    expect(tokens[7]).toEqual({value: "-", scopes: ["source.toml", "constant.numeric.date.toml", "keyword.other.offset.toml"]});
    expect(tokens[8]).toEqual({value: "07:00", scopes: ["source.toml", "constant.numeric.date.toml"]});
});

  it("tokenizes local date-times", function() {
    const {tokens} = grammar.tokenizeLine("foo = 1979-05-27T00:32:00.999999");
    expect(tokens[4]).toEqual({value: "1979-05-27", scopes: ["source.toml", "constant.numeric.date.toml"]});
    expect(tokens[5]).toEqual({value: "T", scopes: ["source.toml", "constant.numeric.date.toml", "keyword.other.time.toml"]});
    expect(tokens[6]).toEqual({value: "00:32:00.999999", scopes: ["source.toml", "constant.numeric.date.toml"]});
});

  it("tokenizes local dates", function() {
    const {tokens} = grammar.tokenizeLine("foo = 1979-05-27");
    expect(tokens[4]).toEqual({value: "1979-05-27", scopes: ["source.toml", "constant.numeric.date.toml"]});
});

  it("tokenizes local times", function() {
    const {tokens} = grammar.tokenizeLine("foo = 00:32:00.999999");
    expect(tokens[4]).toEqual({value: "00:32:00.999999", scopes: ["source.toml", "constant.numeric.date.toml"]});
});

  it("tokenizes tables", function() {
    let {tokens} = grammar.tokenizeLine("[table]");
    expect(tokens[0]).toEqual({value: "[", scopes: ["source.toml", "entity.name.section.table.toml", "punctuation.definition.table.begin.toml"]});
    expect(tokens[1]).toEqual({value: "table", scopes: ["source.toml", "entity.name.section.table.toml"]});
    expect(tokens[2]).toEqual({value: "]", scopes: ["source.toml", "entity.name.section.table.toml", "punctuation.definition.table.end.toml"]});

    ({tokens} = grammar.tokenizeLine("  [table]"));
    expect(tokens[0]).toEqual({value: "  ", scopes: ["source.toml"]});
    expect(tokens[1]).toEqual({value: "[", scopes: ["source.toml", "entity.name.section.table.toml", "punctuation.definition.table.begin.toml"]});
});
    // and so on

  it("tokenizes table arrays", function() {
    const {tokens} = grammar.tokenizeLine("[[table]]");
    expect(tokens[0]).toEqual({value: "[[", scopes: ["source.toml", "entity.name.section.table.array.toml", "punctuation.definition.table.array.begin.toml"]});
    expect(tokens[1]).toEqual({value: "table", scopes: ["source.toml", "entity.name.section.table.array.toml"]});
    expect(tokens[2]).toEqual({value: "]]", scopes: ["source.toml", "entity.name.section.table.array.toml", "punctuation.definition.table.array.end.toml"]});
});

  it("tokenizes keys", function() {
    let {tokens} = grammar.tokenizeLine("key =");
    expect(tokens[0]).toEqual({value: "key", scopes: ["source.toml", "variable.other.key.toml"]});
    expect(tokens[1]).toEqual({value: " ", scopes: ["source.toml"]});
    expect(tokens[2]).toEqual({value: "=", scopes: ["source.toml", "keyword.operator.assignment.toml"]});

    ({tokens} = grammar.tokenizeLine("1key_-34 ="));
    expect(tokens[0]).toEqual({value: "1key_-34", scopes: ["source.toml", "variable.other.key.toml"]});
    expect(tokens[1]).toEqual({value: " ", scopes: ["source.toml"]});
    expect(tokens[2]).toEqual({value: "=", scopes: ["source.toml", "keyword.operator.assignment.toml"]});

    ({tokens} = grammar.tokenizeLine("ʎǝʞ ="));
    expect(tokens[0]).toEqual({value: "ʎǝʞ =", scopes: ["source.toml"]});

    ({tokens} = grammar.tokenizeLine("  ="));
    expect(tokens[0]).toEqual({value: "  =", scopes: ["source.toml"]});
});

  it("tokenizes quoted keys", function() {
    let {tokens} = grammar.tokenizeLine("'key' =");
    expect(tokens[0]).toEqual({value: "'", scopes: ["source.toml", "string.quoted.single.toml", "punctuation.definition.string.begin.toml"]});
    expect(tokens[1]).toEqual({value: "key", scopes: ["source.toml", "string.quoted.single.toml", "variable.other.key.toml"]});
    expect(tokens[2]).toEqual({value: "'", scopes: ["source.toml", "string.quoted.single.toml", "punctuation.definition.string.end.toml"]});
    expect(tokens[3]).toEqual({value: " ", scopes: ["source.toml"]});
    expect(tokens[4]).toEqual({value: "=", scopes: ["source.toml", "keyword.operator.assignment.toml"]});

    ({tokens} = grammar.tokenizeLine("'ʎǝʞ' ="));
    expect(tokens[0]).toEqual({value: "'", scopes: ["source.toml", "string.quoted.single.toml", "punctuation.definition.string.begin.toml"]});
    expect(tokens[1]).toEqual({value: "ʎǝʞ", scopes: ["source.toml", "string.quoted.single.toml", "variable.other.key.toml"]});
    expect(tokens[2]).toEqual({value: "'", scopes: ["source.toml", "string.quoted.single.toml", "punctuation.definition.string.end.toml"]});
    expect(tokens[3]).toEqual({value: " ", scopes: ["source.toml"]});
    expect(tokens[4]).toEqual({value: "=", scopes: ["source.toml", "keyword.operator.assignment.toml"]});

    ({tokens} = grammar.tokenizeLine("'key with spaces' ="));
    expect(tokens[0]).toEqual({value: "'", scopes: ["source.toml", "string.quoted.single.toml", "punctuation.definition.string.begin.toml"]});
    expect(tokens[1]).toEqual({value: "key with spaces", scopes: ["source.toml", "string.quoted.single.toml", "variable.other.key.toml"]});
    expect(tokens[2]).toEqual({value: "'", scopes: ["source.toml", "string.quoted.single.toml", "punctuation.definition.string.end.toml"]});
    expect(tokens[3]).toEqual({value: " ", scopes: ["source.toml"]});
    expect(tokens[4]).toEqual({value: "=", scopes: ["source.toml", "keyword.operator.assignment.toml"]});

    ({tokens} = grammar.tokenizeLine("'key with colons:' ="));
    expect(tokens[0]).toEqual({value: "'", scopes: ["source.toml", "string.quoted.single.toml", "punctuation.definition.string.begin.toml"]});
    expect(tokens[1]).toEqual({value: "key with colons:", scopes: ["source.toml", "string.quoted.single.toml", "variable.other.key.toml"]});
    expect(tokens[2]).toEqual({value: "'", scopes: ["source.toml", "string.quoted.single.toml", "punctuation.definition.string.end.toml"]});
    expect(tokens[3]).toEqual({value: " ", scopes: ["source.toml"]});
    expect(tokens[4]).toEqual({value: "=", scopes: ["source.toml", "keyword.operator.assignment.toml"]});

    ({tokens} = grammar.tokenizeLine("'' ="));
    expect(tokens[0]).toEqual({value: "'", scopes: ["source.toml", "string.quoted.single.toml", "punctuation.definition.string.begin.toml"]});
    expect(tokens[1]).toEqual({value: "'", scopes: ["source.toml", "string.quoted.single.toml", "punctuation.definition.string.end.toml"]});
    expect(tokens[2]).toEqual({value: " ", scopes: ["source.toml"]});
    expect(tokens[3]).toEqual({value: "=", scopes: ["source.toml", "keyword.operator.assignment.toml"]});

    ({tokens} = grammar.tokenizeLine('"key" ='));
    expect(tokens[0]).toEqual({value: '"', scopes: ["source.toml", "string.quoted.double.toml", "punctuation.definition.string.begin.toml"]});
    expect(tokens[1]).toEqual({value: "key", scopes: ["source.toml", "string.quoted.double.toml", "variable.other.key.toml"]});
    expect(tokens[2]).toEqual({value: '"', scopes: ["source.toml", "string.quoted.double.toml", "punctuation.definition.string.end.toml"]});
    expect(tokens[3]).toEqual({value: " ", scopes: ["source.toml"]});
    expect(tokens[4]).toEqual({value: "=", scopes: ["source.toml", "keyword.operator.assignment.toml"]});

    ({tokens} = grammar.tokenizeLine('"ʎǝʞ" ='));
    expect(tokens[0]).toEqual({value: '"', scopes: ["source.toml", "string.quoted.double.toml", "punctuation.definition.string.begin.toml"]});
    expect(tokens[1]).toEqual({value: "ʎǝʞ", scopes: ["source.toml", "string.quoted.double.toml", "variable.other.key.toml"]});
    expect(tokens[2]).toEqual({value: '"', scopes: ["source.toml", "string.quoted.double.toml", "punctuation.definition.string.end.toml"]});
    expect(tokens[3]).toEqual({value: " ", scopes: ["source.toml"]});
    expect(tokens[4]).toEqual({value: "=", scopes: ["source.toml", "keyword.operator.assignment.toml"]});

    ({tokens} = grammar.tokenizeLine('"key with spaces" ='));
    expect(tokens[0]).toEqual({value: '"', scopes: ["source.toml", "string.quoted.double.toml", "punctuation.definition.string.begin.toml"]});
    expect(tokens[1]).toEqual({value: "key with spaces", scopes: ["source.toml", "string.quoted.double.toml", "variable.other.key.toml"]});
    expect(tokens[2]).toEqual({value: '"', scopes: ["source.toml", "string.quoted.double.toml", "punctuation.definition.string.end.toml"]});
    expect(tokens[3]).toEqual({value: " ", scopes: ["source.toml"]});
    expect(tokens[4]).toEqual({value: "=", scopes: ["source.toml", "keyword.operator.assignment.toml"]});

    ({tokens} = grammar.tokenizeLine('"key with colons:" ='));
    expect(tokens[0]).toEqual({value: '"', scopes: ["source.toml", "string.quoted.double.toml", "punctuation.definition.string.begin.toml"]});
    expect(tokens[1]).toEqual({value: "key with colons:", scopes: ["source.toml", "string.quoted.double.toml", "variable.other.key.toml"]});
    expect(tokens[2]).toEqual({value: '"', scopes: ["source.toml", "string.quoted.double.toml", "punctuation.definition.string.end.toml"]});
    expect(tokens[3]).toEqual({value: " ", scopes: ["source.toml"]});
    expect(tokens[4]).toEqual({value: "=", scopes: ["source.toml", "keyword.operator.assignment.toml"]});

    ({tokens} = grammar.tokenizeLine('"key wi\\th escapes" ='));
    expect(tokens[0]).toEqual({value: '"', scopes: ["source.toml", "string.quoted.double.toml", "punctuation.definition.string.begin.toml"]});
    expect(tokens[1]).toEqual({value: "key wi", scopes: ["source.toml", "string.quoted.double.toml", "variable.other.key.toml"]});
    expect(tokens[2]).toEqual({value: "\\t", scopes: ["source.toml", "string.quoted.double.toml", "variable.other.key.toml", "constant.character.escape.toml"]});
    expect(tokens[3]).toEqual({value: "h escapes", scopes: ["source.toml", "string.quoted.double.toml", "variable.other.key.toml"]});
    expect(tokens[4]).toEqual({value: '"', scopes: ["source.toml", "string.quoted.double.toml", "punctuation.definition.string.end.toml"]});
    expect(tokens[5]).toEqual({value: " ", scopes: ["source.toml"]});
    expect(tokens[6]).toEqual({value: "=", scopes: ["source.toml", "keyword.operator.assignment.toml"]});

    ({tokens} = grammar.tokenizeLine('"key with \\" quote" ='));
    expect(tokens[0]).toEqual({value: '"', scopes: ["source.toml", "string.quoted.double.toml", "punctuation.definition.string.begin.toml"]});
    expect(tokens[1]).toEqual({value: "key with ", scopes: ["source.toml", "string.quoted.double.toml", "variable.other.key.toml"]});
    expect(tokens[2]).toEqual({value: '\\"', scopes: ["source.toml", "string.quoted.double.toml", "variable.other.key.toml", "constant.character.escape.toml"]});
    expect(tokens[3]).toEqual({value: " quote", scopes: ["source.toml", "string.quoted.double.toml", "variable.other.key.toml"]});
    expect(tokens[4]).toEqual({value: '"', scopes: ["source.toml", "string.quoted.double.toml", "punctuation.definition.string.end.toml"]});
    expect(tokens[5]).toEqual({value: " ", scopes: ["source.toml"]});
    expect(tokens[6]).toEqual({value: "=", scopes: ["source.toml", "keyword.operator.assignment.toml"]});

    ({tokens} = grammar.tokenizeLine('"" ='));
    expect(tokens[0]).toEqual({value: '"', scopes: ["source.toml", "string.quoted.double.toml", "punctuation.definition.string.begin.toml"]});
    expect(tokens[1]).toEqual({value: '"', scopes: ["source.toml", "string.quoted.double.toml", "punctuation.definition.string.end.toml"]});
    expect(tokens[2]).toEqual({value: " ", scopes: ["source.toml"]});
    expect(tokens[3]).toEqual({value: "=", scopes: ["source.toml", "keyword.operator.assignment.toml"]});
});
});
