
describe("Perl grammar", function() {
  let grammar = null;

  beforeEach(function() {
    waitsForPromise(() => atom.packages.activatePackage("language-perl"));

    runs(() => grammar = atom.grammars.grammarForScopeName("source.perl"));
  });

  it("parses the grammar", function() {
    expect(grammar).toBeDefined();
    expect(grammar.scopeName).toBe("source.perl");
  });

  describe("when a regexp compile tokenizes", function() {
    it("works with all bracket/seperator variations", function() {
      let {tokens} = grammar.tokenizeLine("qr/text/acdegilmnoprsux;");
      expect(tokens[0]).toEqual({value: "qr", scopes: ["source.perl", "string.regexp.compile.simple-delimiter.perl", "punctuation.definition.string.perl", "support.function.perl"]});
      expect(tokens[1]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.compile.simple-delimiter.perl", "punctuation.definition.string.perl"]});
      expect(tokens[2]).toEqual({value: "text", scopes: ["source.perl", "string.regexp.compile.simple-delimiter.perl"]});
      expect(tokens[3]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.compile.simple-delimiter.perl", "punctuation.definition.string.perl"]});
      expect(tokens[4]).toEqual({value: "acdegilmnoprsux", scopes: ["source.perl", "string.regexp.compile.perl", "punctuation.definition.string.perl", "keyword.control.regexp-option.perl"]});
      expect(tokens[5]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});

      ({tokens} = grammar.tokenizeLine("qr(text)acdegilmnoprsux;"));
      expect(tokens[0]).toEqual({value: "qr", scopes: ["source.perl", "string.regexp.compile.nested_parens.perl", "punctuation.definition.string.perl", "support.function.perl"]});
      expect(tokens[1]).toEqual({value: "(", scopes: ["source.perl", "string.regexp.compile.nested_parens.perl", "punctuation.definition.string.perl"]});
      expect(tokens[2]).toEqual({value: "text", scopes: ["source.perl", "string.regexp.compile.nested_parens.perl"]});
      expect(tokens[3]).toEqual({value: ")", scopes: ["source.perl", "string.regexp.compile.nested_parens.perl", "punctuation.definition.string.perl"]});
      expect(tokens[4]).toEqual({value: "acdegilmnoprsux", scopes: ["source.perl", "string.regexp.compile.perl", "punctuation.definition.string.perl", "keyword.control.regexp-option.perl"]});
      expect(tokens[5]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});

      ({tokens} = grammar.tokenizeLine("qr{text}acdegilmnoprsux;"));
      expect(tokens[0]).toEqual({value: "qr", scopes: ["source.perl", "string.regexp.compile.nested_braces.perl", "punctuation.definition.string.perl", "support.function.perl"]});
      expect(tokens[1]).toEqual({value: "{", scopes: ["source.perl", "string.regexp.compile.nested_braces.perl", "punctuation.definition.string.perl"]});
      expect(tokens[2]).toEqual({value: "text", scopes: ["source.perl", "string.regexp.compile.nested_braces.perl"]});
      expect(tokens[3]).toEqual({value: "}", scopes: ["source.perl", "string.regexp.compile.nested_braces.perl", "punctuation.definition.string.perl"]});
      expect(tokens[4]).toEqual({value: "acdegilmnoprsux", scopes: ["source.perl", "string.regexp.compile.perl", "punctuation.definition.string.perl", "keyword.control.regexp-option.perl"]});
      expect(tokens[5]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});

      ({tokens} = grammar.tokenizeLine("qr[text]acdegilmnoprsux;"));
      expect(tokens[0]).toEqual({value: "qr", scopes: ["source.perl", "string.regexp.compile.nested_brackets.perl", "punctuation.definition.string.perl", "support.function.perl"]});
      expect(tokens[1]).toEqual({value: "[", scopes: ["source.perl", "string.regexp.compile.nested_brackets.perl", "punctuation.definition.string.perl"]});
      expect(tokens[2]).toEqual({value: "text", scopes: ["source.perl", "string.regexp.compile.nested_brackets.perl"]});
      expect(tokens[3]).toEqual({value: "]", scopes: ["source.perl", "string.regexp.compile.nested_brackets.perl", "punctuation.definition.string.perl"]});
      expect(tokens[4]).toEqual({value: "acdegilmnoprsux", scopes: ["source.perl", "string.regexp.compile.perl", "punctuation.definition.string.perl", "keyword.control.regexp-option.perl"]});
      expect(tokens[5]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});

      ({tokens} = grammar.tokenizeLine("qr<text>acdegilmnoprsux;"));
      expect(tokens[0]).toEqual({value: "qr", scopes: ["source.perl", "string.regexp.compile.nested_ltgt.perl", "punctuation.definition.string.perl", "support.function.perl"]});
      expect(tokens[1]).toEqual({value: "<", scopes: ["source.perl", "string.regexp.compile.nested_ltgt.perl", "punctuation.definition.string.perl"]});
      expect(tokens[2]).toEqual({value: "text", scopes: ["source.perl", "string.regexp.compile.nested_ltgt.perl"]});
      expect(tokens[3]).toEqual({value: ">", scopes: ["source.perl", "string.regexp.compile.nested_ltgt.perl", "punctuation.definition.string.perl"]});
      expect(tokens[4]).toEqual({value: "acdegilmnoprsux", scopes: ["source.perl", "string.regexp.compile.perl", "punctuation.definition.string.perl", "keyword.control.regexp-option.perl"]});
      expect(tokens[5]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});
  });

    it("does not treat $) as a variable", function() {
      const {tokens} = grammar.tokenizeLine("qr(^text$);");
      expect(tokens[2]).toEqual({value: "^text", scopes: ["source.perl", "string.regexp.compile.nested_parens.perl"]});
      expect(tokens[3]).toEqual({value: "$", scopes: ["source.perl", "string.regexp.compile.nested_parens.perl"]});
      expect(tokens[4]).toEqual({value: ")", scopes: ["source.perl", "string.regexp.compile.nested_parens.perl", "punctuation.definition.string.perl"]});
      expect(tokens[5]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});
  });

    it("does not treat ( in a class as a group", function() {
      const {tokens} = grammar.tokenizeLine("m/ \\A [(]? [?] .* - /smx");
      expect(tokens[1]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.find-m.simple-delimiter.perl", "punctuation.definition.string.perl"]});
      expect(tokens[5]).toEqual({value: "[", scopes: ["source.perl", "string.regexp.find-m.simple-delimiter.perl"]});
      expect(tokens[6]).toEqual({value: "(", scopes: ["source.perl", "string.regexp.find-m.simple-delimiter.perl"]});
      expect(tokens[7]).toEqual({value: "]", scopes: ["source.perl", "string.regexp.find-m.simple-delimiter.perl"]});
      expect(tokens[13]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.find-m.simple-delimiter.perl", "punctuation.definition.string.perl"]});
      expect(tokens[14]).toEqual({value: "smx", scopes: ["source.perl", "string.regexp.find-m.perl", "punctuation.definition.string.perl", "keyword.control.regexp-option.perl"]});
  });

    it("does not treat 'm'(hashkey) as a regex match begin", function() {
      const {tokens} = grammar.tokenizeLine("$foo->{m}->bar();");
      expect(tokens[3]).toEqual({value: "{", scopes: ["source.perl", "punctuation.section.brace.curly.bracket.begin.perl"]});
      expect(tokens[4]).toEqual({value: "m", scopes: ["source.perl", "constant.other.bareword.perl"]});
      expect(tokens[5]).toEqual({value: "}", scopes: ["source.perl", "punctuation.section.brace.curly.bracket.end.perl"]});
  });

    it("does not treat '#' as a comment in regex match", function() {
      const {tokens} = grammar.tokenizeLine("$asd =~ s#asd#foo#;");
      expect(tokens[5]).toEqual({value: "s", scopes: ["source.perl", "string.regexp.replaceXXX.simple_delimiter.perl", "punctuation.definition.string.perl", "support.function.perl"]});
      expect(tokens[6]).toEqual({value: "#", scopes: ["source.perl", "string.regexp.replaceXXX.simple_delimiter.perl", "punctuation.definition.string.perl"]});
      expect(tokens[8]).toEqual({value: "#", scopes: ["source.perl", "string.regexp.replaceXXX.format.simple_delimiter.perl", "punctuation.definition.string.perl"]});
      expect(tokens[10]).toEqual({value: "#", scopes: ["source.perl", "string.regexp.replaceXXX.format.simple_delimiter.perl", "punctuation.definition.string.perl"]});
  });
});

  describe("when a regexp find tokenizes", function() {
    it("works with all bracket/seperator variations", function() {
      let {tokens} = grammar.tokenizeLine(" =~ /text/acdegilmnoprsux;");
      expect(tokens[3]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.find.perl", "punctuation.definition.string.perl"]});
      expect(tokens[4]).toEqual({value: "text", scopes: ["source.perl", "string.regexp.find.perl"]});
      expect(tokens[5]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.find.perl", "punctuation.definition.string.perl"]});
      expect(tokens[6]).toEqual({value: "acdegilmnoprsux", scopes: ["source.perl", "string.regexp.find.perl", "punctuation.definition.string.perl", "keyword.control.regexp-option.perl"]});
      expect(tokens[7]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});

      ({tokens} = grammar.tokenizeLine(" =~ m/text/acdegilmnoprsux;"));
      expect(tokens[3]).toEqual({value: "m", scopes: ["source.perl", "string.regexp.find-m.simple-delimiter.perl", "punctuation.definition.string.perl", "support.function.perl"]});
      expect(tokens[4]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.find-m.simple-delimiter.perl", "punctuation.definition.string.perl"]});
      expect(tokens[5]).toEqual({value: "text", scopes: ["source.perl", "string.regexp.find-m.simple-delimiter.perl"]});
      expect(tokens[6]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.find-m.simple-delimiter.perl", "punctuation.definition.string.perl"]});
      expect(tokens[7]).toEqual({value: "acdegilmnoprsux", scopes: ["source.perl", "string.regexp.find-m.perl", "punctuation.definition.string.perl", "keyword.control.regexp-option.perl"]});
      expect(tokens[8]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});

      ({tokens} = grammar.tokenizeLine(" =~ m(text)acdegilmnoprsux;"));
      expect(tokens[3]).toEqual({value: "m", scopes: ["source.perl", "string.regexp.find-m.nested_parens.perl", "punctuation.definition.string.perl", "support.function.perl"]});
      expect(tokens[4]).toEqual({value: "(", scopes: ["source.perl", "string.regexp.find-m.nested_parens.perl", "punctuation.definition.string.perl"]});
      expect(tokens[5]).toEqual({value: "text", scopes: ["source.perl", "string.regexp.find-m.nested_parens.perl"]});
      expect(tokens[6]).toEqual({value: ")", scopes: ["source.perl", "string.regexp.find-m.nested_parens.perl", "punctuation.definition.string.perl"]});
      expect(tokens[7]).toEqual({value: "acdegilmnoprsux", scopes: ["source.perl", "string.regexp.find-m.perl", "punctuation.definition.string.perl", "keyword.control.regexp-option.perl"]});
      expect(tokens[8]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});

      ({tokens} = grammar.tokenizeLine(" =~ m{text}acdegilmnoprsux;"));
      expect(tokens[3]).toEqual({value: "m", scopes: ["source.perl", "string.regexp.find-m.nested_braces.perl", "punctuation.definition.string.perl", "support.function.perl"]});
      expect(tokens[4]).toEqual({value: "{", scopes: ["source.perl", "string.regexp.find-m.nested_braces.perl", "punctuation.definition.string.perl"]});
      expect(tokens[5]).toEqual({value: "text", scopes: ["source.perl", "string.regexp.find-m.nested_braces.perl"]});
      expect(tokens[6]).toEqual({value: "}", scopes: ["source.perl", "string.regexp.find-m.nested_braces.perl", "punctuation.definition.string.perl"]});
      expect(tokens[7]).toEqual({value: "acdegilmnoprsux", scopes: ["source.perl", "string.regexp.find-m.perl", "punctuation.definition.string.perl", "keyword.control.regexp-option.perl"]});
      expect(tokens[8]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});

      ({tokens} = grammar.tokenizeLine(" =~ m[text]acdegilmnoprsux;"));
      expect(tokens[3]).toEqual({value: "m", scopes: ["source.perl", "string.regexp.find-m.nested_brackets.perl", "punctuation.definition.string.perl", "support.function.perl"]});
      expect(tokens[4]).toEqual({value: "[", scopes: ["source.perl", "string.regexp.find-m.nested_brackets.perl", "punctuation.definition.string.perl"]});
      expect(tokens[5]).toEqual({value: "text", scopes: ["source.perl", "string.regexp.find-m.nested_brackets.perl"]});
      expect(tokens[6]).toEqual({value: "]", scopes: ["source.perl", "string.regexp.find-m.nested_brackets.perl", "punctuation.definition.string.perl"]});
      expect(tokens[7]).toEqual({value: "acdegilmnoprsux", scopes: ["source.perl", "string.regexp.find-m.perl", "punctuation.definition.string.perl", "keyword.control.regexp-option.perl"]});
      expect(tokens[8]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});

      ({tokens} = grammar.tokenizeLine(" =~ m<text>acdegilmnoprsux;"));
      expect(tokens[3]).toEqual({value: "m", scopes: ["source.perl", "string.regexp.find-m.nested_ltgt.perl", "punctuation.definition.string.perl", "support.function.perl"]});
      expect(tokens[4]).toEqual({value: "<", scopes: ["source.perl", "string.regexp.find-m.nested_ltgt.perl", "punctuation.definition.string.perl"]});
      expect(tokens[5]).toEqual({value: "text", scopes: ["source.perl", "string.regexp.find-m.nested_ltgt.perl"]});
      expect(tokens[6]).toEqual({value: ">", scopes: ["source.perl", "string.regexp.find-m.nested_ltgt.perl", "punctuation.definition.string.perl"]});
      expect(tokens[7]).toEqual({value: "acdegilmnoprsux", scopes: ["source.perl", "string.regexp.find-m.perl", "punctuation.definition.string.perl", "keyword.control.regexp-option.perl"]});
      expect(tokens[8]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});
  });

    it("works with without any character before a regexp", function() {
      let {tokens} = grammar.tokenizeLine("/asd/");
      expect(tokens[0]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.find.perl", "punctuation.definition.string.perl"]});
      expect(tokens[1]).toEqual({value: "asd", scopes: ["source.perl", "string.regexp.find.perl"]});
      expect(tokens[2]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.find.perl", "punctuation.definition.string.perl"]});

      ({tokens} = grammar.tokenizeLine(" /asd/"));
      expect(tokens[0]).toEqual({value: " ", scopes: ["source.perl"]});
      expect(tokens[1]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.find.perl", "punctuation.definition.string.perl"]});
      expect(tokens[2]).toEqual({value: "asd", scopes: ["source.perl", "string.regexp.find.perl"]});
      expect(tokens[3]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.find.perl", "punctuation.definition.string.perl"]});

      const lines = grammar.tokenizeLines(`$asd =~
/asd/;`);
      expect(lines[0][3]).toEqual({value: "=~", scopes: ["source.perl", "keyword.operator.comparison.perl"]});
      expect(lines[1][0]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.find.perl", "punctuation.definition.string.perl"]});
      expect(lines[1][1]).toEqual({value: "asd", scopes: ["source.perl", "string.regexp.find.perl"]});
      expect(lines[1][2]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.find.perl", "punctuation.definition.string.perl"]});
      expect(lines[1][3]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});
  });

    it("works with control keys before a regexp", function() {
      let {tokens} = grammar.tokenizeLine("if /asd/");
      expect(tokens[1]).toEqual({value: " ", scopes: ["source.perl"]});
      expect(tokens[2]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.find.perl", "punctuation.definition.string.perl"]});
      expect(tokens[3]).toEqual({value: "asd", scopes: ["source.perl", "string.regexp.find.perl"]});
      expect(tokens[4]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.find.perl", "punctuation.definition.string.perl"]});

      ({tokens} = grammar.tokenizeLine("unless /asd/"));
      expect(tokens[1]).toEqual({value: " ", scopes: ["source.perl"]});
      expect(tokens[2]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.find.perl", "punctuation.definition.string.perl"]});
      expect(tokens[3]).toEqual({value: "asd", scopes: ["source.perl", "string.regexp.find.perl"]});
      expect(tokens[4]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.find.perl", "punctuation.definition.string.perl"]});
  });

    it("works with multiline regexp", function() {
      const lines = grammar.tokenizeLines(`$asd =~ /
(\\d)
/x`);
      expect(lines[0][3]).toEqual({value: "=~", scopes: ["source.perl", "keyword.operator.comparison.perl"]});
      expect(lines[0][4]).toEqual({value: " ", scopes: ["source.perl"]});
      expect(lines[0][5]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.find.perl", "punctuation.definition.string.perl"]});
      expect(lines[1][0]).toEqual({value: "(", scopes: ["source.perl", "string.regexp.find.perl"]});
      expect(lines[1][2]).toEqual({value: ")", scopes: ["source.perl", "string.regexp.find.perl"]});
      expect(lines[2][0]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.find.perl", "punctuation.definition.string.perl"]});
      expect(lines[2][1]).toEqual({value: "x", scopes: ["source.perl", "string.regexp.find.perl", "punctuation.definition.string.perl", "keyword.control.regexp-option.perl"]});
  });

    it("works in a if", function() {
      let {tokens} = grammar.tokenizeLine("if (/ hello /i) {}");
      expect(tokens[1]).toEqual({value: " ", scopes: ["source.perl"]});
      expect(tokens[2]).toEqual({value: "(", scopes: ["source.perl", "punctuation.section.parenthesis.round.bracket.begin.perl"]});
      expect(tokens[3]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.find.perl", "punctuation.definition.string.perl"]});
      expect(tokens[4]).toEqual({value: " hello ", scopes: ["source.perl", "string.regexp.find.perl"]});
      expect(tokens[5]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.find.perl", "punctuation.definition.string.perl"]});
      expect(tokens[6]).toEqual({value: "i", scopes: ["source.perl", "string.regexp.find.perl", "punctuation.definition.string.perl", "keyword.control.regexp-option.perl"]});
      expect(tokens[7]).toEqual({value: ")", scopes: ["source.perl", "punctuation.section.parenthesis.round.bracket.end.perl"]});
      expect(tokens[8]).toEqual({value: " ", scopes: ["source.perl"]});
      expect(tokens[9]).toEqual({value: "{", scopes: ["source.perl", "punctuation.section.brace.curly.bracket.begin.perl"]});
      expect(tokens[10]).toEqual({value: "}", scopes: ["source.perl", "punctuation.section.brace.curly.bracket.end.perl"]});

      ({tokens} = grammar.tokenizeLine('if ($_ && / hello /i) {}'));
      expect(tokens[0]).toEqual({value: 'if', scopes: ['source.perl', 'keyword.control.perl']});
      expect(tokens[2]).toEqual({value: '(', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.begin.perl']});
      expect(tokens[3]).toEqual({value: '$', scopes: ['source.perl', 'variable.other.predefined.perl', 'punctuation.definition.variable.perl']});
      expect(tokens[4]).toEqual({value: '_', scopes: ['source.perl', 'variable.other.predefined.perl']});
      expect(tokens[6]).toEqual({value: '&&', scopes: ['source.perl', 'keyword.operator.logical.c-style.perl']});
      expect(tokens[8]).toEqual({value: '/', scopes: ['source.perl', 'string.regexp.find.perl', 'punctuation.definition.string.perl']});
      expect(tokens[9]).toEqual({value: ' hello ', scopes: ['source.perl', 'string.regexp.find.perl']});
      expect(tokens[10]).toEqual({value: '/', scopes: ['source.perl', 'string.regexp.find.perl', 'punctuation.definition.string.perl']});
      expect(tokens[11]).toEqual({value: 'i', scopes: ['source.perl', 'string.regexp.find.perl', 'punctuation.definition.string.perl', 'keyword.control.regexp-option.perl']});
      expect(tokens[12]).toEqual({value: ')', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.end.perl']});
      expect(tokens[14]).toEqual({value: '{', scopes: ['source.perl', 'punctuation.section.brace.curly.bracket.begin.perl']});
      expect(tokens[15]).toEqual({value: '}', scopes: ['source.perl', 'punctuation.section.brace.curly.bracket.end.perl']});
  });
});

  describe("when a regexp replace tokenizes", function() {
    it("works with all bracket/seperator variations", function() {
      let {tokens} = grammar.tokenizeLine("s/text/test/acdegilmnoprsux");
      expect(tokens[0]).toEqual({value: "s", scopes: ["source.perl", "string.regexp.replaceXXX.simple_delimiter.perl", "punctuation.definition.string.perl", "support.function.perl"]});
      expect(tokens[1]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.replaceXXX.simple_delimiter.perl", "punctuation.definition.string.perl"]});
      expect(tokens[2]).toEqual({value: "text", scopes: ["source.perl", "string.regexp.replaceXXX.simple_delimiter.perl"]});
      expect(tokens[3]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.replaceXXX.format.simple_delimiter.perl", "punctuation.definition.string.perl"]});
      expect(tokens[4]).toEqual({value: "test", scopes: ["source.perl", "string.regexp.replaceXXX.format.simple_delimiter.perl"]});
      expect(tokens[5]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.replaceXXX.format.simple_delimiter.perl", "punctuation.definition.string.perl"]});
      expect(tokens[6]).toEqual({value: "acdegilmnoprsux", scopes: ["source.perl", "string.regexp.replace.perl", "punctuation.definition.string.perl", "keyword.control.regexp-option.perl"]});

      ({tokens} = grammar.tokenizeLine("s(text)(test)acdegilmnoprsux"));
      expect(tokens[0]).toEqual({value: "s", scopes: ["source.perl", "string.regexp.nested_parens.perl", "punctuation.definition.string.perl", "support.function.perl"]});
      expect(tokens[1]).toEqual({value: "(", scopes: ["source.perl", "string.regexp.nested_parens.perl", "punctuation.definition.string.perl"]});
      expect(tokens[2]).toEqual({value: "text", scopes: ["source.perl", "string.regexp.nested_parens.perl"]});
      expect(tokens[3]).toEqual({value: ")", scopes: ["source.perl", "string.regexp.nested_parens.perl", "punctuation.definition.string.perl"]});
      expect(tokens[4]).toEqual({value: "(", scopes: ["source.perl", "string.regexp.format.nested_parens.perl", "punctuation.definition.string.perl"]});
      expect(tokens[5]).toEqual({value: "test", scopes: ["source.perl", "string.regexp.format.nested_parens.perl"]});
      expect(tokens[6]).toEqual({value: ")", scopes: ["source.perl", "string.regexp.format.nested_parens.perl", "punctuation.definition.string.perl"]});
      expect(tokens[7]).toEqual({value: "acdegilmnoprsux", scopes: ["source.perl", "string.regexp.replace.perl", "punctuation.definition.string.perl", "keyword.control.regexp-option.perl"]});

      ({tokens} = grammar.tokenizeLine("s{text}{test}acdegilmnoprsux"));
      expect(tokens[0]).toEqual({value: "s", scopes: ["source.perl", "string.regexp.nested_braces.perl", "punctuation.definition.string.perl", "support.function.perl"]});
      expect(tokens[1]).toEqual({value: "{", scopes: ["source.perl", "string.regexp.nested_braces.perl", "punctuation.definition.string.perl"]});
      expect(tokens[2]).toEqual({value: "text", scopes: ["source.perl", "string.regexp.nested_braces.perl"]});
      expect(tokens[3]).toEqual({value: "}", scopes: ["source.perl", "string.regexp.nested_braces.perl", "punctuation.definition.string.perl"]});
      expect(tokens[4]).toEqual({value: "{", scopes: ["source.perl", "string.regexp.format.nested_braces.perl", "punctuation.definition.string.perl"]});
      expect(tokens[5]).toEqual({value: "test", scopes: ["source.perl", "string.regexp.format.nested_braces.perl"]});
      expect(tokens[6]).toEqual({value: "}", scopes: ["source.perl", "string.regexp.format.nested_braces.perl", "punctuation.definition.string.perl"]});
      expect(tokens[7]).toEqual({value: "acdegilmnoprsux", scopes: ["source.perl", "string.regexp.replace.perl", "punctuation.definition.string.perl", "keyword.control.regexp-option.perl"]});

      ({tokens} = grammar.tokenizeLine("s[text][test]acdegilmnoprsux"));
      expect(tokens[0]).toEqual({value: "s", scopes: ["source.perl", "string.regexp.nested_brackets.perl", "punctuation.definition.string.perl", "support.function.perl"]});
      expect(tokens[1]).toEqual({value: "[", scopes: ["source.perl", "string.regexp.nested_brackets.perl", "punctuation.definition.string.perl"]});
      expect(tokens[2]).toEqual({value: "text", scopes: ["source.perl", "string.regexp.nested_brackets.perl"]});
      expect(tokens[3]).toEqual({value: "]", scopes: ["source.perl", "string.regexp.nested_brackets.perl", "punctuation.definition.string.perl"]});
      expect(tokens[4]).toEqual({value: "[", scopes: ["source.perl", "string.regexp.format.nested_brackets.perl", "punctuation.definition.string.perl"]});
      expect(tokens[5]).toEqual({value: "test", scopes: ["source.perl", "string.regexp.format.nested_brackets.perl"]});
      expect(tokens[6]).toEqual({value: "]", scopes: ["source.perl", "string.regexp.format.nested_brackets.perl", "punctuation.definition.string.perl"]});
      expect(tokens[7]).toEqual({value: "acdegilmnoprsux", scopes: ["source.perl", "string.regexp.replace.perl", "punctuation.definition.string.perl", "keyword.control.regexp-option.perl"]});

      ({tokens} = grammar.tokenizeLine("s<text><test>acdegilmnoprsux"));
      expect(tokens[0]).toEqual({value: "s", scopes: ["source.perl", "string.regexp.nested_ltgt.perl", "punctuation.definition.string.perl", "support.function.perl"]});
      expect(tokens[1]).toEqual({value: "<", scopes: ["source.perl", "string.regexp.nested_ltgt.perl", "punctuation.definition.string.perl"]});
      expect(tokens[2]).toEqual({value: "text", scopes: ["source.perl", "string.regexp.nested_ltgt.perl"]});
      expect(tokens[3]).toEqual({value: ">", scopes: ["source.perl", "string.regexp.nested_ltgt.perl", "punctuation.definition.string.perl"]});
      expect(tokens[4]).toEqual({value: "<", scopes: ["source.perl", "string.regexp.format.nested_ltgt.perl", "punctuation.definition.string.perl"]});
      expect(tokens[5]).toEqual({value: "test", scopes: ["source.perl", "string.regexp.format.nested_ltgt.perl"]});
      expect(tokens[6]).toEqual({value: ">", scopes: ["source.perl", "string.regexp.format.nested_ltgt.perl", "punctuation.definition.string.perl"]});
      expect(tokens[7]).toEqual({value: "acdegilmnoprsux", scopes: ["source.perl", "string.regexp.replace.perl", "punctuation.definition.string.perl", "keyword.control.regexp-option.perl"]});

      ({tokens} = grammar.tokenizeLine("s_text_test_acdegilmnoprsux"));
      expect(tokens[0]).toEqual({value: "s", scopes: ["source.perl", "string.regexp.replaceXXX.simple_delimiter.perl", "punctuation.definition.string.perl", "support.function.perl"]});
      expect(tokens[1]).toEqual({value: "_", scopes: ["source.perl", "string.regexp.replaceXXX.simple_delimiter.perl", "punctuation.definition.string.perl"]});
      expect(tokens[2]).toEqual({value: "text", scopes: ["source.perl", "string.regexp.replaceXXX.simple_delimiter.perl"]});
      expect(tokens[3]).toEqual({value: "_", scopes: ["source.perl", "string.regexp.replaceXXX.format.simple_delimiter.perl", "punctuation.definition.string.perl"]});
      expect(tokens[4]).toEqual({value: "test", scopes: ["source.perl", "string.regexp.replaceXXX.format.simple_delimiter.perl"]});
      expect(tokens[5]).toEqual({value: "_", scopes: ["source.perl", "string.regexp.replaceXXX.format.simple_delimiter.perl", "punctuation.definition.string.perl"]});
      expect(tokens[6]).toEqual({value: "acdegilmnoprsux", scopes: ["source.perl", "string.regexp.replace.perl", "punctuation.definition.string.perl", "keyword.control.regexp-option.perl"]});
  });

    it("works with two '/' delimiter in the first line, and one in the last", function() {
      const lines = grammar.tokenizeLines(`$line =~ s/&#(\\d+);/
  chr($1)
/gxe;`);
      expect(lines[0][6]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.replaceXXX.simple_delimiter.perl", "punctuation.definition.string.perl"]});
      expect(lines[0][10]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.replaceXXX.format.simple_delimiter.perl", "punctuation.definition.string.perl"]});
      expect(lines[2][0]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.replaceXXX.format.simple_delimiter.perl", "punctuation.definition.string.perl"]});
      expect(lines[2][2]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});
  });

    it("works with one '/' delimiter in the first line, one in the next and one in the last", function() {
      const lines = grammar.tokenizeLines(`$line =~ s/&#(\\d+);
/
  chr($1)
/gxe;`);
      expect(lines[0][6]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.replace.extended.simple_delimiter.perl", "punctuation.definition.string.perl"]});
      expect(lines[1][0]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.replace.extended.simple_delimiter.perl", "punctuation.definition.string.perl"]});
      expect(lines[3][0]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.replace.extended.simple_delimiter.perl", "punctuation.definition.string.perl"]});
      expect(lines[3][2]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});
  });

    it("works with one '/' delimiter in the first line and two in the last", function() {
      const lines = grammar.tokenizeLines(`$line =~ s/&#(\\d+);
/chr($1)/gxe;`);
      expect(lines[0][6]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.replace.extended.simple_delimiter.perl", "punctuation.definition.string.perl"]});
      expect(lines[1][0]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.replace.extended.simple_delimiter.perl", "punctuation.definition.string.perl"]});
      expect(lines[1][5]).toEqual({value: "/", scopes: ["source.perl", "string.regexp.replace.extended.simple_delimiter.perl", "punctuation.definition.string.perl"]});
      expect(lines[1][7]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});
  });
});

  describe("tokenizes constant variables", function() {
    it("highlights constants", function() {
      let {tokens} = grammar.tokenizeLine("__FILE__");
      expect(tokens[0]).toEqual({value: "__FILE__", scopes: ["source.perl", "constant.language.perl"]});

      ({tokens} = grammar.tokenizeLine("__LINE__"));
      expect(tokens[0]).toEqual({value: "__LINE__", scopes: ["source.perl", "constant.language.perl"]});

      ({tokens} = grammar.tokenizeLine("__PACKAGE__"));
      expect(tokens[0]).toEqual({value: "__PACKAGE__", scopes: ["source.perl", "constant.language.perl"]});

      ({tokens} = grammar.tokenizeLine("__SUB__"));
      expect(tokens[0]).toEqual({value: "__SUB__", scopes: ["source.perl", "constant.language.perl"]});

      ({tokens} = grammar.tokenizeLine("__END__"));
      expect(tokens[0]).toEqual({value: "__END__", scopes: ["source.perl", "constant.language.perl"]});

      ({tokens} = grammar.tokenizeLine("__DATA__"));
      expect(tokens[0]).toEqual({value: "__DATA__", scopes: ["source.perl", "constant.language.perl"]});
  });

    it("does highlight custom constants different", function() {
      const {tokens} = grammar.tokenizeLine("__TEST__");
      expect(tokens[0]).toEqual({value: "__TEST__", scopes: ["source.perl", "string.unquoted.program-block.perl", "punctuation.definition.string.begin.perl"]});
  });
});

  describe("when an __END__ constant is used", () => it("highlights subsequent lines as comments", function() {
    const lines = grammar.tokenizeLines(`\
"String";
__END__
"String";\
`);
    expect(lines[2][0]).toEqual({value: '"String";', scopes: ["source.perl", "comment.block.documentation.perl"]});
}));

  describe("tokenizes compile phase keywords", () => it("does highlight all compile phase keywords", function() {
    let {tokens} = grammar.tokenizeLine("BEGIN");
    expect(tokens[0]).toEqual({value: "BEGIN", scopes: ["source.perl", "meta.function.perl", "entity.name.function.perl"]});

    ({tokens} = grammar.tokenizeLine("UNITCHECK"));
    expect(tokens[0]).toEqual({value: "UNITCHECK", scopes: ["source.perl", "meta.function.perl", "entity.name.function.perl"]});

    ({tokens} = grammar.tokenizeLine("CHECK"));
    expect(tokens[0]).toEqual({value: "CHECK", scopes: ["source.perl", "meta.function.perl", "entity.name.function.perl"]});

    ({tokens} = grammar.tokenizeLine("INIT"));
    expect(tokens[0]).toEqual({value: "INIT", scopes: ["source.perl", "meta.function.perl", "entity.name.function.perl"]});

    ({tokens} = grammar.tokenizeLine("END"));
    expect(tokens[0]).toEqual({value: "END", scopes: ["source.perl", "meta.function.perl", "entity.name.function.perl"]});

    ({tokens} = grammar.tokenizeLine("DESTROY"));
    expect(tokens[0]).toEqual({value: "DESTROY", scopes: ["source.perl", "meta.function.perl", "entity.name.function.perl"]});
}));

  describe("tokenizes method calls", () => it("does not highlight if called like a method", function() {
    let {tokens} = grammar.tokenizeLine("$test->q;");
    expect(tokens[2]).toEqual({value: "->", scopes: ["source.perl", "punctuation.separator.arrow.perl"]});
    expect(tokens[3]).toEqual({value: "q", scopes: ["source.perl"]});
    expect(tokens[4]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});

    ({tokens} = grammar.tokenizeLine("$test->q();"));
    expect(tokens[2]).toEqual({value: '->', scopes: ['source.perl', 'punctuation.separator.arrow.perl']});
    expect(tokens[3]).toEqual({value: 'q', scopes: ['source.perl']});
    expect(tokens[4]).toEqual({value: '(', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.begin.perl']});
    expect(tokens[5]).toEqual({value: ')', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.end.perl']});
    expect(tokens[6]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});

    ({tokens} = grammar.tokenizeLine('$test->qq();'));
    expect(tokens[0]).toEqual({value: '$', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
    expect(tokens[1]).toEqual({value: 'test', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
    expect(tokens[2]).toEqual({value: '->', scopes: ['source.perl', 'punctuation.separator.arrow.perl']});
    expect(tokens[3]).toEqual({value: 'qq', scopes: ['source.perl']});
    expect(tokens[4]).toEqual({value: '(', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.begin.perl']});
    expect(tokens[5]).toEqual({value: ')', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.end.perl']});
    expect(tokens[6]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});

    ({tokens} = grammar.tokenizeLine('$test->qw();'));
    expect(tokens[0]).toEqual({value: '$', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
    expect(tokens[1]).toEqual({value: 'test', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
    expect(tokens[2]).toEqual({value: '->', scopes: ['source.perl', 'punctuation.separator.arrow.perl']});
    expect(tokens[3]).toEqual({value: 'qw', scopes: ['source.perl']});
    expect(tokens[4]).toEqual({value: '(', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.begin.perl']});
    expect(tokens[5]).toEqual({value: ')', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.end.perl']});
    expect(tokens[6]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});

    ({tokens} = grammar.tokenizeLine("$test->qx();"));
    expect(tokens[0]).toEqual({value: '$', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
    expect(tokens[1]).toEqual({value: 'test', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
    expect(tokens[2]).toEqual({value: '->', scopes: ['source.perl', 'punctuation.separator.arrow.perl']});
    expect(tokens[3]).toEqual({value: 'qx', scopes: ['source.perl']});
    expect(tokens[4]).toEqual({value: '(', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.begin.perl']});
    expect(tokens[5]).toEqual({value: ')', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.end.perl']});
    expect(tokens[6]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
}));

  describe("when a function call tokenizes", () => it("does not highlight calls which looks like a regexp", function() {
    let {tokens} = grammar.tokenizeLine('s_ttest($key,\\"t_storage\\",$single_task);');
    expect(tokens[0]).toEqual({value: 's_ttest', scopes: ['source.perl']});
    expect(tokens[1]).toEqual({value: '(', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.begin.perl']});
    expect(tokens[2]).toEqual({value: '$', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
    expect(tokens[3]).toEqual({value: 'key', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
    expect(tokens[4]).toEqual({value: ',', scopes: ['source.perl', 'punctuation.separator.comma.perl']});
    expect(tokens[5]).toEqual({value: '\\', scopes: ['source.perl']});
    expect(tokens[6]).toEqual({value: '"', scopes: ['source.perl', 'string.quoted.double.perl', 'punctuation.definition.string.begin.perl']});
    expect(tokens[7]).toEqual({value: 't_storage', scopes: ['source.perl', 'string.quoted.double.perl']});
    expect(tokens[8]).toEqual({value: '\\"', scopes: ['source.perl', 'string.quoted.double.perl', 'constant.character.escape.perl']});
    expect(tokens[9]).toEqual({value: ',', scopes: ['source.perl', 'string.quoted.double.perl']});
    expect(tokens[10]).toEqual({value: '$', scopes: ['source.perl', 'string.quoted.double.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
    expect(tokens[11]).toEqual({value: 'single_task', scopes: ['source.perl', 'string.quoted.double.perl', 'variable.other.readwrite.global.perl']});
    expect(tokens[12]).toEqual({value: ');', scopes: ['source.perl', 'string.quoted.double.perl']});

    ({tokens} = grammar.tokenizeLine('s__ttest($key,\\"t_license\\",$single_task);'));
    expect(tokens[0]).toEqual({value: 's__ttest', scopes: ['source.perl']});
    expect(tokens[1]).toEqual({value: '(', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.begin.perl']});
    expect(tokens[2]).toEqual({value: '$', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
    expect(tokens[3]).toEqual({value: 'key', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
    expect(tokens[4]).toEqual({value: ',', scopes: ['source.perl', 'punctuation.separator.comma.perl']});
    expect(tokens[5]).toEqual({value: '\\', scopes: ['source.perl']});
    expect(tokens[6]).toEqual({value: '"', scopes: ['source.perl', 'string.quoted.double.perl', 'punctuation.definition.string.begin.perl']});
    expect(tokens[7]).toEqual({value: 't_license', scopes: ['source.perl', 'string.quoted.double.perl']});
    expect(tokens[8]).toEqual({value: '\\"', scopes: ['source.perl', 'string.quoted.double.perl', 'constant.character.escape.perl']});
    expect(tokens[9]).toEqual({value: ',', scopes: ['source.perl', 'string.quoted.double.perl']});
    expect(tokens[10]).toEqual({value: '$', scopes: ['source.perl', 'string.quoted.double.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
    expect(tokens[11]).toEqual({value: 'single_task', scopes: ['source.perl', 'string.quoted.double.perl', 'variable.other.readwrite.global.perl']});
    expect(tokens[12]).toEqual({value: ');', scopes: ['source.perl', 'string.quoted.double.perl']});
}));

  describe("tokenizes single quoting", function() {
    it("does not escape characters in single-quote strings", function() {
      let {tokens} = grammar.tokenizeLine("'Test this\\nsimple one';");
      expect(tokens[0]).toEqual({value: "'", scopes: ["source.perl", "string.quoted.single.perl", "punctuation.definition.string.begin.perl"]});
      expect(tokens[1]).toEqual({value: "Test this\\nsimple one", scopes: ["source.perl", "string.quoted.single.perl"]});
      expect(tokens[2]).toEqual({value: "'", scopes: ["source.perl", "string.quoted.single.perl", "punctuation.definition.string.end.perl"]});
      expect(tokens[3]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});

      ({tokens} = grammar.tokenizeLine("q(Test this\\nsimple one);"));
      expect(tokens[0]).toEqual({value: "q(", scopes: ["source.perl", "string.quoted.other.q-paren.perl", "punctuation.definition.string.begin.perl"]});
      expect(tokens[1]).toEqual({value: "Test this\\nsimple one", scopes: ["source.perl", "string.quoted.other.q-paren.perl"]});
      expect(tokens[2]).toEqual({value: ")", scopes: ["source.perl", "string.quoted.other.q-paren.perl", "punctuation.definition.string.end.perl"]});
      expect(tokens[3]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});

      ({tokens} = grammar.tokenizeLine("q~Test this\\nadvanced one~;"));
      expect(tokens[0]).toEqual({value: "q~", scopes: ["source.perl", "string.quoted.other.q.perl", "punctuation.definition.string.begin.perl"]});
      expect(tokens[1]).toEqual({value: "Test this\\nadvanced one", scopes: ["source.perl", "string.quoted.other.q.perl"]});
      expect(tokens[2]).toEqual({value: "~", scopes: ["source.perl", "string.quoted.other.q.perl", "punctuation.definition.string.end.perl"]});
      expect(tokens[3]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});
  });

    it("does not escape characters in single-quote multiline strings", function() {
      let lines = grammar.tokenizeLines(`q(
This is my first line\\n
and this the second one\\x00
last
);`);
      expect(lines[0][0]).toEqual({value: "q(", scopes: ["source.perl", "string.quoted.other.q-paren.perl", "punctuation.definition.string.begin.perl"]});
      expect(lines[1][0]).toEqual({value: "This is my first line\\n", scopes: ["source.perl", "string.quoted.other.q-paren.perl"]});
      expect(lines[2][0]).toEqual({value: "and this the second one\\x00", scopes: ["source.perl", "string.quoted.other.q-paren.perl"]});
      expect(lines[3][0]).toEqual({value: "last", scopes: ["source.perl", "string.quoted.other.q-paren.perl"]});
      expect(lines[4][0]).toEqual({value: ")", scopes: ["source.perl", "string.quoted.other.q-paren.perl", "punctuation.definition.string.end.perl"]});
      expect(lines[4][1]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});

      lines = grammar.tokenizeLines(`q~
This is my first line\\n
and this the second one)\\x00
last
~;`);
      expect(lines[0][0]).toEqual({value: "q~", scopes: ["source.perl", "string.quoted.other.q.perl", "punctuation.definition.string.begin.perl"]});
      expect(lines[1][0]).toEqual({value: "This is my first line\\n", scopes: ["source.perl", "string.quoted.other.q.perl"]});
      expect(lines[2][0]).toEqual({value: "and this the second one)\\x00", scopes: ["source.perl", "string.quoted.other.q.perl"]});
      expect(lines[3][0]).toEqual({value: "last", scopes: ["source.perl", "string.quoted.other.q.perl"]});
      expect(lines[4][0]).toEqual({value: "~", scopes: ["source.perl", "string.quoted.other.q.perl", "punctuation.definition.string.end.perl"]});
      expect(lines[4][1]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});
  });

    it("does not highlight the whole word as an escape sequence", function() {
      const {tokens} = grammar.tokenizeLine("\"I l\\xF6ve th\\x{00E4}s\";");
      expect(tokens[0]).toEqual({value: "\"", scopes: ["source.perl", "string.quoted.double.perl", "punctuation.definition.string.begin.perl"]});
      expect(tokens[1]).toEqual({value: "I l", scopes: ["source.perl", "string.quoted.double.perl"]});
      expect(tokens[2]).toEqual({value: "\\xF6", scopes: ["source.perl", "string.quoted.double.perl", "constant.character.escape.perl"]});
      expect(tokens[3]).toEqual({value: "ve th", scopes: ["source.perl", "string.quoted.double.perl"]});
      expect(tokens[4]).toEqual({value: "\\x{00E4}", scopes: ["source.perl", "string.quoted.double.perl", "constant.character.escape.perl"]});
      expect(tokens[5]).toEqual({value: "s", scopes: ["source.perl", "string.quoted.double.perl"]});
      expect(tokens[6]).toEqual({value: "\"", scopes: ["source.perl", "string.quoted.double.perl", "punctuation.definition.string.end.perl"]});
      expect(tokens[7]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});
  });
});

  describe("tokenizes double quoting", () => it("does escape characters in double-quote strings", function() {
    let {tokens} = grammar.tokenizeLine("\"Test\\tthis\\nsimple one\";");
    expect(tokens[0]).toEqual({value: "\"", scopes: ["source.perl", "string.quoted.double.perl", "punctuation.definition.string.begin.perl"]});
    expect(tokens[1]).toEqual({value: "Test", scopes: ["source.perl", "string.quoted.double.perl"]});
    expect(tokens[2]).toEqual({value: "\\t", scopes: ["source.perl", "string.quoted.double.perl", "constant.character.escape.perl"]});
    expect(tokens[3]).toEqual({value: "this", scopes: ["source.perl", "string.quoted.double.perl"]});
    expect(tokens[4]).toEqual({value: "\\n", scopes: ["source.perl", "string.quoted.double.perl", "constant.character.escape.perl"]});
    expect(tokens[5]).toEqual({value: "simple one", scopes: ["source.perl", "string.quoted.double.perl"]});
    expect(tokens[6]).toEqual({value: "\"", scopes: ["source.perl", "string.quoted.double.perl", "punctuation.definition.string.end.perl"]});
    expect(tokens[7]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});

    ({tokens} = grammar.tokenizeLine("qq(Test\\tthis\\nsimple one);"));
    expect(tokens[0]).toEqual({value: "qq(", scopes: ["source.perl", "string.quoted.other.qq-paren.perl", "punctuation.definition.string.begin.perl"]});
    expect(tokens[1]).toEqual({value: "Test", scopes: ["source.perl", "string.quoted.other.qq-paren.perl"]});
    expect(tokens[2]).toEqual({value: "\\t", scopes: ["source.perl", "string.quoted.other.qq-paren.perl", "constant.character.escape.perl"]});
    expect(tokens[3]).toEqual({value: "this", scopes: ["source.perl", "string.quoted.other.qq-paren.perl"]});
    expect(tokens[4]).toEqual({value: "\\n", scopes: ["source.perl", "string.quoted.other.qq-paren.perl", "constant.character.escape.perl"]});
    expect(tokens[5]).toEqual({value: "simple one", scopes: ["source.perl", "string.quoted.other.qq-paren.perl"]});
    expect(tokens[6]).toEqual({value: ")", scopes: ["source.perl", "string.quoted.other.qq-paren.perl", "punctuation.definition.string.end.perl"]});
    expect(tokens[7]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});

    ({tokens} = grammar.tokenizeLine("qq~Test\\tthis\\nadvanced one~;"));
    expect(tokens[0]).toEqual({value: "qq~", scopes: ["source.perl", "string.quoted.other.qq.perl", "punctuation.definition.string.begin.perl"]});
    expect(tokens[1]).toEqual({value: "Test", scopes: ["source.perl", "string.quoted.other.qq.perl"]});
    expect(tokens[2]).toEqual({value: "\\t", scopes: ["source.perl", "string.quoted.other.qq.perl", "constant.character.escape.perl"]});
    expect(tokens[3]).toEqual({value: "this", scopes: ["source.perl", "string.quoted.other.qq.perl"]});
    expect(tokens[4]).toEqual({value: "\\n", scopes: ["source.perl", "string.quoted.other.qq.perl", "constant.character.escape.perl"]});
    expect(tokens[5]).toEqual({value: "advanced one", scopes: ["source.perl", "string.quoted.other.qq.perl"]});
    expect(tokens[6]).toEqual({value: "~", scopes: ["source.perl", "string.quoted.other.qq.perl", "punctuation.definition.string.end.perl"]});
    expect(tokens[7]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});
}));

  describe("tokenizes word quoting", () => it("quotes words", function() {
    const {tokens} = grammar.tokenizeLine("qw(Aword Bword Cword);");
    expect(tokens[0]).toEqual({value: "qw(", scopes: ["source.perl", "string.quoted.other.q-paren.perl", "punctuation.definition.string.begin.perl"]});
    expect(tokens[1]).toEqual({value: "Aword Bword Cword", scopes: ["source.perl", "string.quoted.other.q-paren.perl"]});
    expect(tokens[2]).toEqual({value: ")", scopes: ["source.perl", "string.quoted.other.q-paren.perl", "punctuation.definition.string.end.perl"]});
    expect(tokens[3]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});
}));

  describe("tokenizes subroutines", function() {
    it("highlights subroutines", function() {
      const lines = grammar.tokenizeLines(`\
sub mySub {
  print "asd";
}\
`
      );
      expect(lines[0][0]).toEqual({value: 'sub', scopes: ['source.perl', 'meta.function.perl', 'storage.type.function.sub.perl']});
      expect(lines[0][2]).toEqual({value: 'mySub', scopes: ['source.perl', 'meta.function.perl', 'entity.name.function.perl']});
      expect(lines[0][4]).toEqual({value: '{', scopes: ['source.perl', 'punctuation.section.brace.curly.bracket.begin.perl']});
      expect(lines[1][1]).toEqual({value: 'print', scopes: ['source.perl', 'support.function.perl']});
      expect(lines[1][3]).toEqual({value: '"', scopes: ['source.perl', 'string.quoted.double.perl', 'punctuation.definition.string.begin.perl']});
      expect(lines[1][4]).toEqual({value: 'asd', scopes: ['source.perl', 'string.quoted.double.perl']});
      expect(lines[1][5]).toEqual({value: '"', scopes: ['source.perl', 'string.quoted.double.perl', 'punctuation.definition.string.end.perl']});
      expect(lines[1][6]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
      expect(lines[2][0]).toEqual({value: '}', scopes: ['source.perl', 'punctuation.section.brace.curly.bracket.end.perl']});
  });

    it("highlights subroutines assigned to variables", function() {
      const lines = grammar.tokenizeLines(`\
my $test = sub {
  print "asd";
};\
`
      );
      expect(lines[0][0]).toEqual({value: 'my', scopes: ['source.perl', 'storage.modifier.perl']});
      expect(lines[0][2]).toEqual({value: '$', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
      expect(lines[0][3]).toEqual({value: 'test', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
      expect(lines[0][5]).toEqual({value: '=', scopes: ['source.perl', 'keyword.operator.assignement.perl']});
      expect(lines[0][7]).toEqual({value: 'sub', scopes: ['source.perl', 'meta.function.perl', 'storage.type.function.sub.perl']});
      expect(lines[0][9]).toEqual({value: '{', scopes: ['source.perl', 'punctuation.section.brace.curly.bracket.begin.perl']});
      expect(lines[1][1]).toEqual({value: 'print', scopes: ['source.perl', 'support.function.perl']});
      expect(lines[1][3]).toEqual({value: '"', scopes: ['source.perl', 'string.quoted.double.perl', 'punctuation.definition.string.begin.perl']});
      expect(lines[1][4]).toEqual({value: 'asd', scopes: ['source.perl', 'string.quoted.double.perl']});
      expect(lines[1][5]).toEqual({value: '"', scopes: ['source.perl', 'string.quoted.double.perl', 'punctuation.definition.string.end.perl']});
      expect(lines[1][6]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
      expect(lines[2][0]).toEqual({value: '}', scopes: ['source.perl', 'punctuation.section.brace.curly.bracket.end.perl']});
      expect(lines[2][1]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
  });

    it("highlights subroutines assigned to hash-keys", function() {
      const lines = grammar.tokenizeLines(`\
my $test = { a => sub {
print "asd";
}};\
`
      );
      expect(lines[0][0]).toEqual({value: 'my', scopes: ['source.perl', 'storage.modifier.perl']});
      expect(lines[0][2]).toEqual({value: '$', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
      expect(lines[0][3]).toEqual({value: 'test', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
      expect(lines[0][5]).toEqual({value: '=', scopes: ['source.perl', 'keyword.operator.assignement.perl']});
      expect(lines[0][7]).toEqual({value: '{', scopes: ['source.perl', 'punctuation.section.brace.curly.bracket.begin.perl']});
      expect(lines[0][9]).toEqual({value: 'a', scopes: ['source.perl', 'constant.other.key.perl']});
      expect(lines[0][11]).toEqual({value: '=>', scopes: ['source.perl', 'punctuation.separator.key-value.perl']});
      expect(lines[0][13]).toEqual({value: 'sub', scopes: ['source.perl', 'meta.function.perl', 'storage.type.function.sub.perl']});
      expect(lines[0][15]).toEqual({value: '{', scopes: ['source.perl', 'punctuation.section.brace.curly.bracket.begin.perl']});
      expect(lines[1][0]).toEqual({value: 'print', scopes: ['source.perl', 'support.function.perl']});
      expect(lines[1][2]).toEqual({value: '"', scopes: ['source.perl', 'string.quoted.double.perl', 'punctuation.definition.string.begin.perl']});
      expect(lines[1][3]).toEqual({value: 'asd', scopes: ['source.perl', 'string.quoted.double.perl']});
      expect(lines[1][4]).toEqual({value: '"', scopes: ['source.perl', 'string.quoted.double.perl', 'punctuation.definition.string.end.perl']});
      expect(lines[1][5]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
      expect(lines[2][0]).toEqual({value: '}', scopes: ['source.perl', 'punctuation.section.brace.curly.bracket.end.perl']});
      expect(lines[2][1]).toEqual({value: '}', scopes: ['source.perl', 'punctuation.section.brace.curly.bracket.end.perl']});
      expect(lines[2][2]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
  });
});

  describe("tokenizes format", () => it("works as expected", function() {
    let lines = grammar.tokenizeLines(`format STDOUT_TOP =
Passwd File
Name                Login    Office   Uid   Gid Home
------------------------------------------------------------------
.
format STDOUT =
@<<<<<<<<<<<<<<<<<< @||||||| @<<<<<<@>>>> @>>>> @<<<<<<<<<<<<<<<<<
$name,              $login,  $office,$uid,$gid, $home
.`);
    expect(lines[0][0]).toEqual({value: "format", scopes: ["source.perl", "meta.format.perl", "support.function.perl"]});
    expect(lines[0][2]).toEqual({value: "STDOUT_TOP", scopes: ["source.perl", "meta.format.perl", "entity.name.function.format.perl"]});
    expect(lines[1][0]).toEqual({value: "Passwd File", scopes: ["source.perl", "meta.format.perl"]});
    expect(lines[2][0]).toEqual({value: "Name                Login    Office   Uid   Gid Home", scopes: ["source.perl", "meta.format.perl"]});
    expect(lines[3][0]).toEqual({value: "------------------------------------------------------------------", scopes: ["source.perl", "meta.format.perl"]});
    expect(lines[4][0]).toEqual({value: ".", scopes: ["source.perl", "meta.format.perl"]});
    expect(lines[5][0]).toEqual({value: "format", scopes: ["source.perl", "meta.format.perl", "support.function.perl"]});
    expect(lines[5][2]).toEqual({value: "STDOUT", scopes: ["source.perl", "meta.format.perl", "entity.name.function.format.perl"]});
    expect(lines[6][0]).toEqual({value: "@<<<<<<<<<<<<<<<<<< @||||||| @<<<<<<@>>>> @>>>> @<<<<<<<<<<<<<<<<<", scopes: ["source.perl", "meta.format.perl"]});
    expect(lines[8][0]).toEqual({value: ".", scopes: ["source.perl", "meta.format.perl"]});

    lines = grammar.tokenizeLines(`format STDOUT_TOP =
                    Bug Reports
@<<<<<<<<<<<<<<<<<<<<<<<     @|||         @>>>>>>>>>>>>>>>>>>>>>>>
$system,                      $%,         $date
------------------------------------------------------------------
.
format STDOUT =
Subject: @<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
 $subject
Index: @<<<<<<<<<<<<<<<<<<<<<<<<<<<< ^<<<<<<<<<<<<<<<<<<<<<<<<<<<<
$index,                       $description
Priority: @<<<<<<<<<< Date: @<<<<<<< ^<<<<<<<<<<<<<<<<<<<<<<<<<<<<
  $priority,        $date,   $description
From: @<<<<<<<<<<<<<<<<<<<<<<<<<<<<< ^<<<<<<<<<<<<<<<<<<<<<<<<<<<<
$from,                         $description
Assigned to: @<<<<<<<<<<<<<<<<<<<<<< ^<<<<<<<<<<<<<<<<<<<<<<<<<<<<
     $programmer,            $description
~                                    ^<<<<<<<<<<<<<<<<<<<<<<<<<<<<
                             $description
~                                    ^<<<<<<<<<<<<<<<<<<<<<<<<<<<<
                             $description
~                                    ^<<<<<<<<<<<<<<<<<<<<<<<<<<<<
                             $description
~                                    ^<<<<<<<<<<<<<<<<<<<<<<<<<<<<
                             $description
~                                    ^<<<<<<<<<<<<<<<<<<<<<<<...
                             $description
.`);
    expect(lines[0][0]).toEqual({value: "format", scopes: ["source.perl", "meta.format.perl", "support.function.perl"]});
    expect(lines[0][2]).toEqual({value: "STDOUT_TOP", scopes: ["source.perl", "meta.format.perl", "entity.name.function.format.perl"]});
    expect(lines[2][0]).toEqual({value: "@<<<<<<<<<<<<<<<<<<<<<<<     @|||         @>>>>>>>>>>>>>>>>>>>>>>>", scopes: ["source.perl", "meta.format.perl"]});
    expect(lines[4][0]).toEqual({value: "------------------------------------------------------------------", scopes: ["source.perl", "meta.format.perl"]});
    expect(lines[5][0]).toEqual({value: ".", scopes: ["source.perl", "meta.format.perl"]});
    expect(lines[6][0]).toEqual({value: "format", scopes: ["source.perl", "meta.format.perl", "support.function.perl"]});
    expect(lines[6][2]).toEqual({value: "STDOUT", scopes: ["source.perl", "meta.format.perl", "entity.name.function.format.perl"]});
    expect(lines[7][0]).toEqual({value: "Subject: @<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<", scopes: ["source.perl", "meta.format.perl"]});
    expect(lines[9][0]).toEqual({value: "Index: @<<<<<<<<<<<<<<<<<<<<<<<<<<<< ^<<<<<<<<<<<<<<<<<<<<<<<<<<<<", scopes: ["source.perl", "meta.format.perl"]});
    expect(lines[11][0]).toEqual({value: "Priority: @<<<<<<<<<< Date: @<<<<<<< ^<<<<<<<<<<<<<<<<<<<<<<<<<<<<", scopes: ["source.perl", "meta.format.perl"]});
    expect(lines[13][0]).toEqual({value: "From: @<<<<<<<<<<<<<<<<<<<<<<<<<<<<< ^<<<<<<<<<<<<<<<<<<<<<<<<<<<<", scopes: ["source.perl", "meta.format.perl"]});
    expect(lines[15][0]).toEqual({value: "Assigned to: @<<<<<<<<<<<<<<<<<<<<<< ^<<<<<<<<<<<<<<<<<<<<<<<<<<<<", scopes: ["source.perl", "meta.format.perl"]});
    expect(lines[17][0]).toEqual({value: "~                                    ^<<<<<<<<<<<<<<<<<<<<<<<<<<<<", scopes: ["source.perl", "meta.format.perl"]});
    expect(lines[19][0]).toEqual({value: "~                                    ^<<<<<<<<<<<<<<<<<<<<<<<<<<<<", scopes: ["source.perl", "meta.format.perl"]});
    expect(lines[21][0]).toEqual({value: "~                                    ^<<<<<<<<<<<<<<<<<<<<<<<<<<<<", scopes: ["source.perl", "meta.format.perl"]});
    expect(lines[23][0]).toEqual({value: "~                                    ^<<<<<<<<<<<<<<<<<<<<<<<<<<<<", scopes: ["source.perl", "meta.format.perl"]});
    expect(lines[25][0]).toEqual({value: "~                                    ^<<<<<<<<<<<<<<<<<<<<<<<...", scopes: ["source.perl", "meta.format.perl"]});
    expect(lines[27][0]).toEqual({value: ".", scopes: ["source.perl", "meta.format.perl"]});
}));

  describe("when a heredoc tokenizes", function() {
    it("doesn't highlight the entire line", function() {
      const lines = grammar.tokenizeLines(`\
$asd->foo(<<TEST, $bar, s/foo/bar/g);
asd
TEST
;\
`);
      expect(lines[0][5]).toEqual({value: '<<', scopes: ['source.perl', 'punctuation.definition.string.perl', 'string.unquoted.heredoc.perl', 'punctuation.definition.heredoc.perl']});
      expect(lines[0][6]).toEqual({value: 'TEST', scopes: ['source.perl', 'punctuation.definition.string.perl', 'string.unquoted.heredoc.perl']});
      expect(lines[0][7]).toEqual({value: ',', scopes: ['source.perl', 'punctuation.separator.comma.perl']});
      expect(lines[3][0]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});
  });

    it("does not highlight variables and escape sequences in a single quote heredoc", function() {
      let lines = grammar.tokenizeLines(`\
$asd->foo(<<'TEST');
$asd\\n
;\
`);
      expect(lines[1][0]).toEqual({value: "$asd\\n", scopes: ["source.perl", "string.unquoted.heredoc.quote.perl"]});

      lines = grammar.tokenizeLines(`\
$asd->foo(<<\\TEST);
$asd\\n
;\
`);
      expect(lines[1][0]).toEqual({value: "$asd\\n", scopes: ["source.perl", "string.unquoted.heredoc.quote.perl"]});
  });
});

  describe("when a storage modifier tokenizes", () => it("highlights it", function() {
    const {tokens} = grammar.tokenizeLine("my our local state");
    expect(tokens[0]).toEqual({value: "my", scopes: ["source.perl", "storage.modifier.perl"]});
    expect(tokens[2]).toEqual({value: "our", scopes: ["source.perl", "storage.modifier.perl"]});
    expect(tokens[4]).toEqual({value: "local", scopes: ["source.perl", "storage.modifier.perl"]});
    expect(tokens[6]).toEqual({value: "state", scopes: ["source.perl", "storage.modifier.perl"]});
}));

  describe('when encountering `v` followed by dot-delimited digits', () => it('tokenises it as a version literal', function() {
    const lines = grammar.tokenizeLines(`\
use v5.14
use v5.24.1\
`
    );
    expect(lines[0][0]).toEqual({value: 'use', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'keyword.control.directive.pragma.use.perl']});
    expect(lines[0][2]).toEqual({value: 'v5.14', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'constant.other.version.literal.perl']});
    expect(lines[1][0]).toEqual({value: 'use', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'keyword.control.directive.pragma.use.perl']});
    expect(lines[1][2]).toEqual({value: 'v5.24.1', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'constant.other.version.literal.perl']});
}));

  describe("when an operator tokenizes", function() {
    it("highlights assignement operators", function() {
      const {tokens} = grammar.tokenizeLine("1 = ||= //= += -= *= /= %= **= &= |= ^= &.= |.= ^.=");
      expect(tokens[2]).toEqual({value: "=", scopes: ["source.perl", "keyword.operator.assignement.perl"]});
      expect(tokens[4]).toEqual({value: "||=", scopes: ["source.perl", "keyword.operator.assignement.conditional.perl"]});
      expect(tokens[6]).toEqual({value: "//=", scopes: ["source.perl", "keyword.operator.assignement.conditional.perl"]});
      expect(tokens[8]).toEqual({value: "+=", scopes: ["source.perl", "keyword.operator.assignement.compound.perl"]});
      expect(tokens[10]).toEqual({value: "-=", scopes: ["source.perl", "keyword.operator.assignement.compound.perl"]});
      expect(tokens[12]).toEqual({value: "*=", scopes: ["source.perl", "keyword.operator.assignement.compound.perl"]});
      expect(tokens[14]).toEqual({value: "/=", scopes: ["source.perl", "keyword.operator.assignement.compound.perl"]});
      expect(tokens[16]).toEqual({value: "%=", scopes: ["source.perl", "keyword.operator.assignement.compound.perl"]});
      expect(tokens[18]).toEqual({value: "**=", scopes: ["source.perl", "keyword.operator.assignement.compound.perl"]});
      expect(tokens[20]).toEqual({value: "&=", scopes: ["source.perl", "keyword.operator.assignement.compound.bitwise.perl"]});
      expect(tokens[22]).toEqual({value: "|=", scopes: ["source.perl", "keyword.operator.assignement.compound.bitwise.perl"]});
      expect(tokens[24]).toEqual({value: "^=", scopes: ["source.perl", "keyword.operator.assignement.compound.bitwise.perl"]});
      expect(tokens[26]).toEqual({value: "&.=", scopes: ["source.perl", "keyword.operator.assignement.compound.stringwise.perl"]});
      expect(tokens[28]).toEqual({value: "|.=", scopes: ["source.perl", "keyword.operator.assignement.compound.stringwise.perl"]});
      expect(tokens[30]).toEqual({value: "^.=", scopes: ["source.perl", "keyword.operator.assignement.compound.stringwise.perl"]});
  });

    it("highlights arithmetic operators", function() {
      const {tokens} = grammar.tokenizeLine("+ - * / % **");
      expect(tokens[0]).toEqual({value: "+", scopes: ["source.perl", "keyword.operator.arithmetic.perl"]});
      expect(tokens[2]).toEqual({value: "-", scopes: ["source.perl", "keyword.operator.arithmetic.perl"]});
      expect(tokens[4]).toEqual({value: "*", scopes: ["source.perl", "keyword.operator.arithmetic.perl"]});
      expect(tokens[6]).toEqual({value: "/", scopes: ["source.perl", "keyword.operator.arithmetic.perl"]});
      expect(tokens[8]).toEqual({value: "%", scopes: ["source.perl", "keyword.operator.arithmetic.perl"]});
      expect(tokens[10]).toEqual({value: "**", scopes: ["source.perl", "keyword.operator.arithmetic.perl"]});
  });

    it("highlights increment/decrement operators", function() {
      const {tokens} = grammar.tokenizeLine("++ --");
      expect(tokens[0]).toEqual({value: "++", scopes: ["source.perl", "keyword.operator.increment.perl"]});
      expect(tokens[2]).toEqual({value: "--", scopes: ["source.perl", "keyword.operator.decrement.perl"]});
  });

    it("highlights bitwise operators", function() {
      const {tokens} = grammar.tokenizeLine("& | ^ ~ >> <<");
      expect(tokens[0]).toEqual({value: "&", scopes: ["source.perl", "keyword.operator.bitwise.perl"]});
      expect(tokens[2]).toEqual({value: "|", scopes: ["source.perl", "keyword.operator.bitwise.perl"]});
      expect(tokens[4]).toEqual({value: "^", scopes: ["source.perl", "keyword.operator.bitwise.perl"]});
      expect(tokens[6]).toEqual({value: "~", scopes: ["source.perl", "keyword.operator.bitwise.perl"]});
      expect(tokens[8]).toEqual({value: ">>", scopes: ["source.perl", "keyword.operator.bitwise.perl"]});
      expect(tokens[10]).toEqual({value: "<<", scopes: ["source.perl", "keyword.operator.bitwise.perl"]});
  });

    it("highlights stringwise operators", function() {
      const {tokens} = grammar.tokenizeLine("&. |. ^. ~.");
      expect(tokens[0]).toEqual({value: "&.", scopes: ["source.perl", "keyword.operator.stringwise.perl"]});
      expect(tokens[2]).toEqual({value: "|.", scopes: ["source.perl", "keyword.operator.stringwise.perl"]});
      expect(tokens[4]).toEqual({value: "^.", scopes: ["source.perl", "keyword.operator.stringwise.perl"]});
      expect(tokens[6]).toEqual({value: "~.", scopes: ["source.perl", "keyword.operator.stringwise.perl"]});
  });

    it("highlights comparison operators", function() {
      const {tokens} = grammar.tokenizeLine("1 == != < > <= >= =~ !~ ~~ <=>");
      expect(tokens[2]).toEqual({value: "==", scopes: ["source.perl", "keyword.operator.comparison.perl"]});
      expect(tokens[4]).toEqual({value: "!=", scopes: ["source.perl", "keyword.operator.comparison.perl"]});
      expect(tokens[6]).toEqual({value: "<", scopes: ["source.perl", "keyword.operator.comparison.perl"]});
      expect(tokens[8]).toEqual({value: ">", scopes: ["source.perl", "keyword.operator.comparison.perl"]});
      expect(tokens[10]).toEqual({value: "<=", scopes: ["source.perl", "keyword.operator.comparison.perl"]});
      expect(tokens[12]).toEqual({value: ">=", scopes: ["source.perl", "keyword.operator.comparison.perl"]});
      expect(tokens[14]).toEqual({value: "=~", scopes: ["source.perl", "keyword.operator.comparison.perl"]});
      expect(tokens[16]).toEqual({value: "!~", scopes: ["source.perl", "keyword.operator.comparison.perl"]});
      expect(tokens[18]).toEqual({value: "~~", scopes: ["source.perl", "keyword.operator.comparison.perl"]});
      expect(tokens[20]).toEqual({value: "<=>", scopes: ["source.perl", "keyword.operator.comparison.perl"]});
  });

    it("highlights stringwise comparison operators", function() {
      const {tokens} = grammar.tokenizeLine("eq ne lt gt le ge cmp");
      expect(tokens[0]).toEqual({value: "eq", scopes: ["source.perl", "keyword.operator.comparison.stringwise.perl"]});
      expect(tokens[2]).toEqual({value: "ne", scopes: ["source.perl", "keyword.operator.comparison.stringwise.perl"]});
      expect(tokens[4]).toEqual({value: "lt", scopes: ["source.perl", "keyword.operator.comparison.stringwise.perl"]});
      expect(tokens[6]).toEqual({value: "gt", scopes: ["source.perl", "keyword.operator.comparison.stringwise.perl"]});
      expect(tokens[8]).toEqual({value: "le", scopes: ["source.perl", "keyword.operator.comparison.stringwise.perl"]});
      expect(tokens[10]).toEqual({value: "ge", scopes: ["source.perl", "keyword.operator.comparison.stringwise.perl"]});
      expect(tokens[12]).toEqual({value: "cmp", scopes: ["source.perl", "keyword.operator.comparison.stringwise.perl"]});
  });

    it("highlights ellipsis statements", function() {
      let lines = grammar.tokenizeLines(`\
{ ... }
sub foo { ... }
...;
eval { ... };\
`
      );
      expect(lines[0][0]).toEqual({value: '{', scopes: ['source.perl', 'punctuation.section.brace.curly.bracket.begin.perl']});
      expect(lines[0][1]).toEqual({value: ' ... ', scopes: ['source.perl', 'keyword.operator.ellipsis.placeholder.perl']});
      expect(lines[0][2]).toEqual({value: '}', scopes: ['source.perl', 'punctuation.section.brace.curly.bracket.end.perl']});
      expect(lines[1][0]).toEqual({value: 'sub', scopes: ['source.perl', 'meta.function.perl', 'storage.type.function.sub.perl']});
      expect(lines[1][2]).toEqual({value: 'foo', scopes: ['source.perl', 'meta.function.perl', 'entity.name.function.perl']});
      expect(lines[1][4]).toEqual({value: '{', scopes: ['source.perl', 'punctuation.section.brace.curly.bracket.begin.perl']});
      expect(lines[1][5]).toEqual({value: ' ... ', scopes: ['source.perl', 'keyword.operator.ellipsis.placeholder.perl']});
      expect(lines[1][6]).toEqual({value: '}', scopes: ['source.perl', 'punctuation.section.brace.curly.bracket.end.perl']});
      expect(lines[2][0]).toEqual({value: '...', scopes: ['source.perl', 'keyword.operator.range.perl']});
      expect(lines[2][1]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
      expect(lines[3][0]).toEqual({value: 'eval', scopes: ['source.perl', 'keyword.control.perl']});
      expect(lines[3][2]).toEqual({value: '{', scopes: ['source.perl', 'punctuation.section.brace.curly.bracket.begin.perl']});
      expect(lines[3][3]).toEqual({value: ' ... ', scopes: ['source.perl', 'keyword.operator.ellipsis.placeholder.perl']});
      expect(lines[3][4]).toEqual({value: '}', scopes: ['source.perl', 'punctuation.section.brace.curly.bracket.end.perl']});
      expect(lines[3][5]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});

      lines = grammar.tokenizeLines(`\
sub someMethod {
  my $self = shift;
  ...;
}\
`
      );
      expect(lines[2][1]).toEqual({value: '...', scopes: ['source.perl', 'keyword.operator.range.perl']});
      expect(lines[2][2]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
  });

    it("highlights logical operators", function() {
      const {tokens} = grammar.tokenizeLine("and or xor as not");
      expect(tokens[0]).toEqual({value: "and", scopes: ["source.perl", "keyword.operator.logical.perl"]});
      expect(tokens[2]).toEqual({value: "or", scopes: ["source.perl", "keyword.operator.logical.perl"]});
      expect(tokens[4]).toEqual({value: "xor", scopes: ["source.perl", "keyword.operator.logical.perl"]});
      expect(tokens[6]).toEqual({value: "as", scopes: ["source.perl", "keyword.operator.logical.perl"]});
      expect(tokens[8]).toEqual({value: "not", scopes: ["source.perl", "keyword.operator.logical.perl"]});
  });

    it("highlights c-style logical operators", function() {
      const {tokens} = grammar.tokenizeLine("&& ||");
      expect(tokens[0]).toEqual({value: "&&", scopes: ["source.perl", "keyword.operator.logical.c-style.perl"]});
      expect(tokens[2]).toEqual({value: "||", scopes: ["source.perl", "keyword.operator.logical.c-style.perl"]});
  });

    it("highlights defined-or logical operators", function() {
      const {tokens} = grammar.tokenizeLine("$var // 3");
      expect(tokens[3]).toEqual({value: "//", scopes: ["source.perl", "keyword.operator.logical.defined-or.perl"]});
  });

    it("highlights concatenation operators", function() {
      const {tokens} = grammar.tokenizeLine("'x'.'y'");
      expect(tokens[3]).toEqual({value: ".", scopes: ["source.perl", "keyword.operator.concatenation.perl"]});
  });

    it("highlights repetition operators", function() {
      const lines = grammar.tokenizeLines(`'x' x 3
'x'x3
'x'xx
axx\
`);
      expect(lines[0][0]).toEqual({value: "'", scopes: ["source.perl", "string.quoted.single.perl", "punctuation.definition.string.begin.perl"]});
      expect(lines[0][1]).toEqual({value: "x", scopes: ["source.perl", "string.quoted.single.perl"]});
      expect(lines[0][2]).toEqual({value: "'", scopes: ["source.perl", "string.quoted.single.perl", "punctuation.definition.string.end.perl"]});
      expect(lines[0][4]).toEqual({value: "x", scopes: ["source.perl", "keyword.operator.repetition.perl"]});
      expect(lines[1][0]).toEqual({value: "'", scopes: ["source.perl", "string.quoted.single.perl", "punctuation.definition.string.begin.perl"]});
      expect(lines[1][1]).toEqual({value: "x", scopes: ["source.perl", "string.quoted.single.perl"]});
      expect(lines[1][2]).toEqual({value: "'", scopes: ["source.perl", "string.quoted.single.perl", "punctuation.definition.string.end.perl"]});
      expect(lines[1][3]).toEqual({value: "x", scopes: ["source.perl", "keyword.operator.repetition.perl"]});
      expect(lines[2][0]).toEqual({value: "'", scopes: ["source.perl", "string.quoted.single.perl", "punctuation.definition.string.begin.perl"]});
      expect(lines[2][1]).toEqual({value: "x", scopes: ["source.perl", "string.quoted.single.perl"]});
      expect(lines[2][2]).toEqual({value: "'", scopes: ["source.perl", "string.quoted.single.perl", "punctuation.definition.string.end.perl"]});
      expect(lines[2][3]).toEqual({value: "xx", scopes: ["source.perl"]});
      expect(lines[3][0]).toEqual({value: "axx", scopes: ["source.perl"]});
  });

    it("highlights range operators", function() {
      const {tokens} = grammar.tokenizeLine(".. ... 0..1 3...9");
      expect(tokens[0]).toEqual({value: "..", scopes: ["source.perl", "keyword.operator.range.perl"]});
      expect(tokens[2]).toEqual({value: "...", scopes: ["source.perl", "keyword.operator.range.perl"]});
      expect(tokens[5]).toEqual({value: "..", scopes: ["source.perl", "keyword.operator.range.perl"]});
      expect(tokens[9]).toEqual({value: "...", scopes: ["source.perl", "keyword.operator.range.perl"]});
  });

    it("highlights readline operators", function() {
      const {tokens} = grammar.tokenizeLine("<> <$fh>");
      expect(tokens[0]).toEqual({value: "<", scopes: ["source.perl", "keyword.operator.readline.perl"]});
      expect(tokens[1]).toEqual({value: ">", scopes: ["source.perl", "keyword.operator.readline.perl"]});
      expect(tokens[3]).toEqual({value: "<", scopes: ["source.perl", "keyword.operator.readline.perl"]});
      expect(tokens[6]).toEqual({value: ">", scopes: ["source.perl", "keyword.operator.readline.perl"]});
  });
});

  describe("when a separator tokenizes", function() {
    it("highlights semicolons", function() {
      const {tokens} = grammar.tokenizeLine("$var;");
      expect(tokens[2]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});
  });

    it("highlights commas", function() {
      const lines = grammar.tokenizeLines(`[1, 2]
($a, $b)
3,%c\
`);
      expect(lines[0][2]).toEqual({value: ",", scopes: ["source.perl", "punctuation.separator.comma.perl"]});
      expect(lines[1][3]).toEqual({value: ",", scopes: ["source.perl", "punctuation.separator.comma.perl"]});
      expect(lines[2][1]).toEqual({value: ",", scopes: ["source.perl", "punctuation.separator.comma.perl"]});
  });

    it("highlights double colons", function() {
      const {tokens} = grammar.tokenizeLine("A::B");
      expect(tokens[1]).toEqual({value: "::", scopes: ["source.perl", "punctuation.separator.colon.perl"]});
  });

    it("highlights arrows", function() {
      const {tokens} = grammar.tokenizeLine("$abc->d");
      expect(tokens[2]).toEqual({value: "->", scopes: ["source.perl", "punctuation.separator.arrow.perl"]});
  });

    it("highlights fat arrows", function() {
      const {tokens} = grammar.tokenizeLine("key => 'value'");
      expect(tokens[2]).toEqual({value: "=>", scopes: ["source.perl", "punctuation.separator.key-value.perl"]});
  });
});


  describe("when a number tokenizes", function() {
    it("highlights decimals", function() {
      const lines = grammar.tokenizeLines(`0
0.
.0
0.0\
`);
      expect(lines[0][0]).toEqual({value: "0", scopes: ["source.perl", "constant.numeric.decimal.perl"]});
      expect(lines[1][0]).toEqual({value: "0", scopes: ["source.perl", "constant.numeric.decimal.perl"]});
      expect(lines[1][1]).toEqual({value: ".", scopes: ["source.perl", "constant.numeric.decimal.perl", "punctuation.delimiter.decimal.period.perl"]});
      expect(lines[2][0]).toEqual({value: ".", scopes: ["source.perl", "constant.numeric.decimal.perl", "punctuation.delimiter.decimal.period.perl"]});
      expect(lines[2][1]).toEqual({value: "0", scopes: ["source.perl", "constant.numeric.decimal.perl"]});
      expect(lines[3][0]).toEqual({value: "0", scopes: ["source.perl", "constant.numeric.decimal.perl"]});
      expect(lines[3][1]).toEqual({value: ".", scopes: ["source.perl", "constant.numeric.decimal.perl", "punctuation.delimiter.decimal.period.perl"]});
      expect(lines[3][2]).toEqual({value: "0", scopes: ["source.perl", "constant.numeric.decimal.perl"]});
  });

    it("highlights exponentials", function() {
      const lines = grammar.tokenizeLines(`0e
0.e
.0e
0.0e
0E0
0e0.
0e0.0
0e-0
0E-.0
0e-0.0\
`);
      expect(lines[0][0]).toEqual({value: "0e", scopes: ["source.perl", "constant.numeric.exponential.perl"]});
      expect(lines[1][0]).toEqual({value: "0", scopes: ["source.perl", "constant.numeric.exponential.perl"]});
      expect(lines[1][1]).toEqual({value: ".", scopes: ["source.perl", "constant.numeric.exponential.perl", "punctuation.delimiter.decimal.period.perl"]});
      expect(lines[1][2]).toEqual({value: "e", scopes: ["source.perl", "constant.numeric.exponential.perl"]});
      expect(lines[2][0]).toEqual({value: ".", scopes: ["source.perl", "constant.numeric.exponential.perl", "punctuation.delimiter.decimal.period.perl"]});
      expect(lines[2][1]).toEqual({value: "0e", scopes: ["source.perl", "constant.numeric.exponential.perl"]});
      expect(lines[3][0]).toEqual({value: "0", scopes: ["source.perl", "constant.numeric.exponential.perl"]});
      expect(lines[3][1]).toEqual({value: ".", scopes: ["source.perl", "constant.numeric.exponential.perl", "punctuation.delimiter.decimal.period.perl"]});
      expect(lines[3][2]).toEqual({value: "0e", scopes: ["source.perl", "constant.numeric.exponential.perl"]});
      expect(lines[4][0]).toEqual({value: "0E0", scopes: ["source.perl", "constant.numeric.exponential.perl"]});
      expect(lines[5][0]).toEqual({value: "0e0", scopes: ["source.perl", "constant.numeric.exponential.perl"]});
      expect(lines[5][1]).toEqual({value: ".", scopes: ["source.perl", "constant.numeric.exponential.perl", "punctuation.delimiter.decimal.period.perl"]});
      expect(lines[6][0]).toEqual({value: "0e0", scopes: ["source.perl", "constant.numeric.exponential.perl"]});
      expect(lines[6][1]).toEqual({value: ".", scopes: ["source.perl", "constant.numeric.exponential.perl", "punctuation.delimiter.decimal.period.perl"]});
      expect(lines[6][2]).toEqual({value: "0", scopes: ["source.perl", "constant.numeric.exponential.perl"]});
      expect(lines[7][0]).toEqual({value: "0e-0", scopes: ["source.perl", "constant.numeric.exponential.perl"]});
      expect(lines[8][0]).toEqual({value: "0E-", scopes: ["source.perl", "constant.numeric.exponential.perl"]});
      expect(lines[8][1]).toEqual({value: ".", scopes: ["source.perl", "constant.numeric.exponential.perl", "punctuation.delimiter.decimal.period.perl"]});
      expect(lines[8][2]).toEqual({value: "0", scopes: ["source.perl", "constant.numeric.exponential.perl"]});
      expect(lines[9][0]).toEqual({value: "0e-0", scopes: ["source.perl", "constant.numeric.exponential.perl"]});
      expect(lines[9][1]).toEqual({value: ".", scopes: ["source.perl", "constant.numeric.exponential.perl", "punctuation.delimiter.decimal.period.perl"]});
      expect(lines[9][2]).toEqual({value: "0", scopes: ["source.perl", "constant.numeric.exponential.perl"]});
  });

    it("highlights hexadecimals", function() {
      const lines = grammar.tokenizeLines(`0x
0x0e0\
`);
      expect(lines[0][0]).toEqual({value: "0x", scopes: ["source.perl", "constant.numeric.hexadecimal.perl"]});
      expect(lines[1][0]).toEqual({value: "0x0e0", scopes: ["source.perl", "constant.numeric.hexadecimal.perl"]});
  });


    it("highlights binaries", function() {
      const lines = grammar.tokenizeLines(`0b
0b10\
`);
      expect(lines[0][0]).toEqual({value: "0b", scopes: ["source.perl", "constant.numeric.binary.perl"]});
      expect(lines[1][0]).toEqual({value: "0b10", scopes: ["source.perl", "constant.numeric.binary.perl"]});
  });

    it("does not highlight decimals as hexadecimals", function() {
      const lines = grammar.tokenizeLines(`00x
00xa\
`);
      expect(lines[0][0]).toEqual({value: "00", scopes: ["source.perl", "constant.numeric.decimal.perl"]});
      expect(lines[0][1]).toEqual({value: "x", scopes: ["source.perl"]});
      expect(lines[1][0]).toEqual({value: "00", scopes: ["source.perl", "constant.numeric.decimal.perl"]});
      expect(lines[1][1]).toEqual({value: "xa", scopes: ["source.perl"]});
  });

    it("does not highlight decimals as binaries", function() {
      const lines = grammar.tokenizeLines(`00b
00b1\
`);
      expect(lines[0][0]).toEqual({value: "00", scopes: ["source.perl", "constant.numeric.decimal.perl"]});
      expect(lines[0][1]).toEqual({value: "b", scopes: ["source.perl"]});
      expect(lines[1][0]).toEqual({value: "00", scopes: ["source.perl", "constant.numeric.decimal.perl"]});
      expect(lines[1][1]).toEqual({value: "b1", scopes: ["source.perl"]});
  });

    it("does not highlight periods between numbers", function() {
      const lines = grammar.tokenizeLines(`0.0.0.0
0..0
0...0
0e.0
0e-.0.0\
`);
      expect(lines[0][0]).toEqual({value: "0", scopes: ["source.perl", "constant.numeric.decimal.perl"]});
      expect(lines[0][1]).toEqual({value: ".", scopes: ["source.perl", "constant.numeric.decimal.perl", "punctuation.delimiter.decimal.period.perl"]});
      expect(lines[0][2]).toEqual({value: "0", scopes: ["source.perl", "constant.numeric.decimal.perl"]});
      expect(lines[0][3]).toEqual({value: ".", scopes: ["source.perl", "keyword.operator.concatenation.perl"]});
      expect(lines[0][4]).toEqual({value: "0", scopes: ["source.perl", "constant.numeric.decimal.perl"]});
      expect(lines[0][5]).toEqual({value: ".", scopes: ["source.perl", "constant.numeric.decimal.perl", "punctuation.delimiter.decimal.period.perl"]});
      expect(lines[0][6]).toEqual({value: "0", scopes: ["source.perl", "constant.numeric.decimal.perl"]});
      expect(lines[1][0]).toEqual({value: "0", scopes: ["source.perl", "constant.numeric.decimal.perl"]});
      expect(lines[1][1]).toEqual({value: "..", scopes: ["source.perl", "keyword.operator.range.perl"]});
      expect(lines[1][2]).toEqual({value: "0", scopes: ["source.perl", "constant.numeric.decimal.perl"]});
      expect(lines[2][0]).toEqual({value: "0", scopes: ["source.perl", "constant.numeric.decimal.perl"]});
      expect(lines[2][1]).toEqual({value: "...", scopes: ["source.perl", "keyword.operator.range.perl"]});
      expect(lines[2][2]).toEqual({value: "0", scopes: ["source.perl", "constant.numeric.decimal.perl"]});
      expect(lines[3][0]).toEqual({value: "0e", scopes: ["source.perl", "constant.numeric.exponential.perl"]});
      expect(lines[3][1]).toEqual({value: ".", scopes: ["source.perl", "keyword.operator.concatenation.perl"]});
      expect(lines[3][2]).toEqual({value: "0", scopes: ["source.perl", "constant.numeric.decimal.perl"]});
      expect(lines[4][0]).toEqual({value: "0e-", scopes: ["source.perl", "constant.numeric.exponential.perl"]});
      expect(lines[4][1]).toEqual({value: ".", scopes: ["source.perl", "constant.numeric.exponential.perl", "punctuation.delimiter.decimal.period.perl"]});
      expect(lines[4][2]).toEqual({value: "0", scopes: ["source.perl", "constant.numeric.exponential.perl"]});
      expect(lines[4][3]).toEqual({value: ".", scopes: ["source.perl", "keyword.operator.concatenation.perl"]});
      expect(lines[4][4]).toEqual({value: "0", scopes: ["source.perl", "constant.numeric.decimal.perl"]});
  });
});

  describe("numbers with thousand separators", () => it("matches them as a single token", function() {
    const lines = grammar.tokenizeLines(`\
my $n = 12345;
my $n = 12345.67;
my $n = -.02e+23;
my $n = 6.02e23;
my $n = 4_294_967_296;
my $n = 0377;
my $n = 0X00A0;
my $n = 0xffff;
my $n = 0b1100_0000;\
`
    );
    expect(lines[0][0]).toEqual({value: 'my', scopes: ['source.perl', 'storage.modifier.perl']});
    expect(lines[0][2]).toEqual({value: '$', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
    expect(lines[0][3]).toEqual({value: 'n', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
    expect(lines[0][5]).toEqual({value: '=', scopes: ['source.perl', 'keyword.operator.assignement.perl']});
    expect(lines[0][7]).toEqual({value: '12345', scopes: ['source.perl', 'constant.numeric.decimal.perl']});
    expect(lines[0][8]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
    expect(lines[1][0]).toEqual({value: 'my', scopes: ['source.perl', 'storage.modifier.perl']});
    expect(lines[1][2]).toEqual({value: '$', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
    expect(lines[1][3]).toEqual({value: 'n', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
    expect(lines[1][5]).toEqual({value: '=', scopes: ['source.perl', 'keyword.operator.assignement.perl']});
    expect(lines[1][7]).toEqual({value: '12345', scopes: ['source.perl', 'constant.numeric.decimal.perl']});
    expect(lines[1][8]).toEqual({value: '.', scopes: ['source.perl', 'constant.numeric.decimal.perl', 'punctuation.delimiter.decimal.period.perl']});
    expect(lines[1][9]).toEqual({value: '67', scopes: ['source.perl', 'constant.numeric.decimal.perl']});
    expect(lines[1][10]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
    expect(lines[2][0]).toEqual({value: 'my', scopes: ['source.perl', 'storage.modifier.perl']});
    expect(lines[2][2]).toEqual({value: '$', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
    expect(lines[2][3]).toEqual({value: 'n', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
    expect(lines[2][5]).toEqual({value: '=', scopes: ['source.perl', 'keyword.operator.assignement.perl']});
    expect(lines[2][7]).toEqual({value: '-', scopes: ['source.perl', 'keyword.operator.arithmetic.perl']});
    expect(lines[2][8]).toEqual({value: '.', scopes: ['source.perl', 'constant.numeric.exponential.perl', 'punctuation.delimiter.decimal.period.perl']});
    expect(lines[2][9]).toEqual({value: '02e+23', scopes: ['source.perl', 'constant.numeric.exponential.perl']});
    expect(lines[2][10]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
    expect(lines[3][0]).toEqual({value: 'my', scopes: ['source.perl', 'storage.modifier.perl']});
    expect(lines[3][2]).toEqual({value: '$', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
    expect(lines[3][3]).toEqual({value: 'n', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
    expect(lines[3][5]).toEqual({value: '=', scopes: ['source.perl', 'keyword.operator.assignement.perl']});
    expect(lines[3][7]).toEqual({value: '6', scopes: ['source.perl', 'constant.numeric.exponential.perl']});
    expect(lines[3][8]).toEqual({value: '.', scopes: ['source.perl', 'constant.numeric.exponential.perl', 'punctuation.delimiter.decimal.period.perl']});
    expect(lines[3][9]).toEqual({value: '02e23', scopes: ['source.perl', 'constant.numeric.exponential.perl']});
    expect(lines[3][10]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
    expect(lines[4][0]).toEqual({value: 'my', scopes: ['source.perl', 'storage.modifier.perl']});
    expect(lines[4][2]).toEqual({value: '$', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
    expect(lines[4][3]).toEqual({value: 'n', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
    expect(lines[4][5]).toEqual({value: '=', scopes: ['source.perl', 'keyword.operator.assignement.perl']});
    expect(lines[4][7]).toEqual({value: '4_294_967_296', scopes: ['source.perl', 'constant.numeric.decimal.with-thousand-separators.perl']});
    expect(lines[4][8]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
    expect(lines[5][0]).toEqual({value: 'my', scopes: ['source.perl', 'storage.modifier.perl']});
    expect(lines[5][2]).toEqual({value: '$', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
    expect(lines[5][3]).toEqual({value: 'n', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
    expect(lines[5][5]).toEqual({value: '=', scopes: ['source.perl', 'keyword.operator.assignement.perl']});
    expect(lines[5][7]).toEqual({value: '0377', scopes: ['source.perl', 'constant.numeric.decimal.perl']});
    expect(lines[5][8]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
    expect(lines[6][0]).toEqual({value: 'my', scopes: ['source.perl', 'storage.modifier.perl']});
    expect(lines[6][2]).toEqual({value: '$', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
    expect(lines[6][3]).toEqual({value: 'n', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
    expect(lines[6][5]).toEqual({value: '=', scopes: ['source.perl', 'keyword.operator.assignement.perl']});
    expect(lines[6][7]).toEqual({value: '0X00A0', scopes: ['source.perl', 'constant.numeric.hexadecimal.perl']});
    expect(lines[6][8]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
    expect(lines[7][0]).toEqual({value: 'my', scopes: ['source.perl', 'storage.modifier.perl']});
    expect(lines[7][2]).toEqual({value: '$', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
    expect(lines[7][3]).toEqual({value: 'n', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
    expect(lines[7][5]).toEqual({value: '=', scopes: ['source.perl', 'keyword.operator.assignement.perl']});
    expect(lines[7][7]).toEqual({value: '0xffff', scopes: ['source.perl', 'constant.numeric.hexadecimal.perl']});
    expect(lines[7][8]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
    expect(lines[8][0]).toEqual({value: 'my', scopes: ['source.perl', 'storage.modifier.perl']});
    expect(lines[8][2]).toEqual({value: '$', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
    expect(lines[8][3]).toEqual({value: 'n', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
    expect(lines[8][5]).toEqual({value: '=', scopes: ['source.perl', 'keyword.operator.assignement.perl']});
    expect(lines[8][7]).toEqual({value: '0b1100_0000', scopes: ['source.perl', 'constant.numeric.binary.perl']});
    expect(lines[8][8]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
}));

  describe("when a hash variable tokenizes", () => it("does not highlight whitespace beside a key as a constant", function() {
    const lines = grammar.tokenizeLines(`my %hash = (
key => 'value1',
'key' => 'value2'
);`);
    expect(lines[1][0]).toEqual({value: "key", scopes: ["source.perl", "constant.other.key.perl"]});
    expect(lines[1][1]).toEqual({value: " ", scopes: ["source.perl"]});
    expect(lines[2][0]).toEqual({value: "'", scopes: ["source.perl", "string.quoted.single.perl", "punctuation.definition.string.begin.perl"]});
    expect(lines[2][1]).toEqual({value: "key", scopes: ["source.perl", "string.quoted.single.perl"]});
    expect(lines[2][2]).toEqual({value: "'", scopes: ["source.perl", "string.quoted.single.perl", "punctuation.definition.string.end.perl"]});
    expect(lines[2][3]).toEqual({value: " ", scopes: ["source.perl"]});
}));

  describe("when a variable tokenizes", function() {
    it("highlights its type separately", function() {
      const lines = grammar.tokenizeLines(`\
my $scalar;
$scalar
@array
%hash
my $array_ref = \\\\@array;
my $hash_ref = \\\\%hash;
my @array = @$array_ref;
my %hash = %$hash_ref;
my @n = sort {$a <=> $b} @m;\
`
      );
      expect(lines[0][0]).toEqual({value: 'my', scopes: ['source.perl', 'storage.modifier.perl']});
      expect(lines[0][2]).toEqual({value: '$', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
      expect(lines[0][3]).toEqual({value: 'scalar', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
      expect(lines[0][4]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
      expect(lines[1][0]).toEqual({value: '$', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
      expect(lines[1][1]).toEqual({value: 'scalar', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
      expect(lines[2][0]).toEqual({value: '@', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
      expect(lines[2][1]).toEqual({value: 'array', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
      expect(lines[3][0]).toEqual({value: '%', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
      expect(lines[3][1]).toEqual({value: 'hash', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
      expect(lines[4][0]).toEqual({value: 'my', scopes: ['source.perl', 'storage.modifier.perl']});
      expect(lines[4][2]).toEqual({value: '$', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
      expect(lines[4][3]).toEqual({value: 'array_ref', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
      expect(lines[4][5]).toEqual({value: '=', scopes: ['source.perl', 'keyword.operator.assignement.perl']});
      expect(lines[4][6]).toEqual({value: ' \\', scopes: ['source.perl']});
      expect(lines[4][7]).toEqual({value: '\\@', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
      expect(lines[4][8]).toEqual({value: 'array', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
      expect(lines[4][9]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
      expect(lines[5][0]).toEqual({value: 'my', scopes: ['source.perl', 'storage.modifier.perl']});
      expect(lines[5][2]).toEqual({value: '$', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
      expect(lines[5][3]).toEqual({value: 'hash_ref', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
      expect(lines[5][5]).toEqual({value: '=', scopes: ['source.perl', 'keyword.operator.assignement.perl']});
      expect(lines[5][6]).toEqual({value: ' \\', scopes: ['source.perl']});
      expect(lines[5][7]).toEqual({value: '\\%', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
      expect(lines[5][8]).toEqual({value: 'hash', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
      expect(lines[5][9]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
      expect(lines[6][0]).toEqual({value: 'my', scopes: ['source.perl', 'storage.modifier.perl']});
      expect(lines[6][2]).toEqual({value: '@', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
      expect(lines[6][3]).toEqual({value: 'array', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
      expect(lines[6][5]).toEqual({value: '=', scopes: ['source.perl', 'keyword.operator.assignement.perl']});
      expect(lines[6][7]).toEqual({value: '@$', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
      expect(lines[6][8]).toEqual({value: 'array_ref', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
      expect(lines[6][9]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
      expect(lines[7][0]).toEqual({value: 'my', scopes: ['source.perl', 'storage.modifier.perl']});
      expect(lines[7][2]).toEqual({value: '%', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
      expect(lines[7][3]).toEqual({value: 'hash', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
      expect(lines[7][5]).toEqual({value: '=', scopes: ['source.perl', 'keyword.operator.assignement.perl']});
      expect(lines[7][7]).toEqual({value: '%$', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
      expect(lines[7][8]).toEqual({value: 'hash_ref', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
      expect(lines[7][9]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
      expect(lines[8][0]).toEqual({value: 'my', scopes: ['source.perl', 'storage.modifier.perl']});
      expect(lines[8][2]).toEqual({value: '@', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
      expect(lines[8][3]).toEqual({value: 'n', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
      expect(lines[8][5]).toEqual({value: '=', scopes: ['source.perl', 'keyword.operator.assignement.perl']});
      expect(lines[8][7]).toEqual({value: 'sort', scopes: ['source.perl', 'support.function.perl']});
      expect(lines[8][9]).toEqual({value: '{', scopes: ['source.perl', 'punctuation.section.brace.curly.bracket.begin.perl']});
      expect(lines[8][10]).toEqual({value: '$', scopes: ['source.perl', 'variable.other.predefined.perl', 'punctuation.definition.variable.perl']});
      expect(lines[8][11]).toEqual({value: 'a', scopes: ['source.perl', 'variable.other.predefined.perl']});
      expect(lines[8][13]).toEqual({value: '<=>', scopes: ['source.perl', 'keyword.operator.comparison.perl']});
      expect(lines[8][15]).toEqual({value: '$', scopes: ['source.perl', 'variable.other.predefined.perl', 'punctuation.definition.variable.perl']});
      expect(lines[8][16]).toEqual({value: 'b', scopes: ['source.perl', 'variable.other.predefined.perl']});
      expect(lines[8][17]).toEqual({value: '}', scopes: ['source.perl', 'punctuation.section.brace.curly.bracket.end.perl']});
      expect(lines[8][19]).toEqual({value: '@', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
      expect(lines[8][20]).toEqual({value: 'm', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
      expect(lines[8][21]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
  });

    it("does not highlight numbers separately", function() {
      const {tokens} = grammar.tokenizeLine("$0 %a0");
      expect(tokens[0]).toEqual({value: "$", scopes: ["source.perl", "variable.other.predefined.program-name.perl", "punctuation.definition.variable.perl"]});
      expect(tokens[1]).toEqual({value: "0", scopes: ["source.perl", "variable.other.predefined.program-name.perl"]});
      expect(tokens[3]).toEqual({value: "%", scopes: ["source.perl", "variable.other.readwrite.global.perl", "punctuation.definition.variable.perl"]});
      expect(tokens[4]).toEqual({value: "a0", scopes: ["source.perl", "variable.other.readwrite.global.perl"]});
  });
});

  describe("when package to tokenizes", () => it("does not highlight semicolon in package name", function() {
    const {tokens} = grammar.tokenizeLine("package Test::ASD; #this is my new class");
    expect(tokens[0]).toEqual({value: "package", scopes: ["source.perl", "meta.class.perl", "keyword.control.perl"]});
    expect(tokens[1]).toEqual({value: " ", scopes: ["source.perl", "meta.class.perl"]});
    expect(tokens[2]).toEqual({value: "Test::ASD", scopes: ["source.perl", "meta.class.perl", "entity.name.type.class.perl"]});
    expect(tokens[3]).toEqual({value: ";", scopes: ["source.perl", "punctuation.terminator.semicolon.perl"]});
    expect(tokens[5]).toEqual({value: "#", scopes: ["source.perl", "comment.line.number-sign.perl", "punctuation.definition.comment.perl"]});
    expect(tokens[6]).toEqual({value: "this is my new class", scopes: ["source.perl", "comment.line.number-sign.perl"]});
}));

  describe("when brackets are encountered", function() {
    it("applies generic punctuation scopes without assuming context", function() {
      const lines = grammar.tokenizeLines(`\
sub name {
  {
    {
    }
  }
}\
`
      );
      expect(lines[0][0]).toEqual({value: 'sub', scopes: ['source.perl', 'meta.function.perl', 'storage.type.function.sub.perl']});
      expect(lines[0][2]).toEqual({value: 'name', scopes: ['source.perl', 'meta.function.perl', 'entity.name.function.perl']});
      expect(lines[0][4]).toEqual({value: '{', scopes: ['source.perl', 'punctuation.section.brace.curly.bracket.begin.perl']});
      expect(lines[1][1]).toEqual({value: '{', scopes: ['source.perl', 'punctuation.section.brace.curly.bracket.begin.perl']});
      expect(lines[3][1]).toEqual({value: '}', scopes: ['source.perl', 'punctuation.section.brace.curly.bracket.end.perl']});
      expect(lines[4][0]).toEqual({value: '  ', scopes: ['source.perl' ]});
      expect(lines[5][0]).toEqual({value: '}', scopes: ['source.perl', 'punctuation.section.brace.curly.bracket.end.perl']});

      let {tokens} = grammar.tokenizeLine('(lisperlerlang % ( a ( b ( c () 1 ) 2 ) 3 ) ) %)');
      expect(tokens[0]).toEqual({value: '(', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.begin.perl']});
      expect(tokens[1]).toEqual({value: 'lisperlerlang ', scopes: ['source.perl']});
      expect(tokens[2]).toEqual({value: '%', scopes: ['source.perl', 'keyword.operator.arithmetic.perl']});
      expect(tokens[4]).toEqual({value: '(', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.begin.perl']});
      expect(tokens[5]).toEqual({value: ' a ', scopes: ['source.perl']});
      expect(tokens[6]).toEqual({value: '(', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.begin.perl']});
      expect(tokens[7]).toEqual({value: ' b ', scopes: ['source.perl']});
      expect(tokens[8]).toEqual({value: '(', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.begin.perl']});
      expect(tokens[9]).toEqual({value: ' c ', scopes: ['source.perl']});
      expect(tokens[10]).toEqual({value: '(', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.begin.perl']});
      expect(tokens[11]).toEqual({value: ')', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.end.perl']});
      expect(tokens[13]).toEqual({value: '1', scopes: ['source.perl', 'constant.numeric.decimal.perl']});
      expect(tokens[15]).toEqual({value: ')', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.end.perl']});
      expect(tokens[17]).toEqual({value: '2', scopes: ['source.perl', 'constant.numeric.decimal.perl']});
      expect(tokens[19]).toEqual({value: ')', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.end.perl']});
      expect(tokens[21]).toEqual({value: '3', scopes: ['source.perl', 'constant.numeric.decimal.perl']});
      expect(tokens[23]).toEqual({value: ')', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.end.perl']});
      expect(tokens[25]).toEqual({value: ')', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.end.perl']});
      expect(tokens[27]).toEqual({value: '%', scopes: ['source.perl', 'keyword.operator.arithmetic.perl']});
      expect(tokens[28]).toEqual({value: ')', scopes: ['source.perl', 'punctuation.unmatched.parenthesis.round.bracket.end.perl']});

      ({tokens} = grammar.tokenizeLine('sub name [ a [ b [ c [] 1 ] 2 ] 3 ] ]'));
      expect(tokens[0]).toEqual({value: 'sub', scopes: ['source.perl', 'meta.function.perl', 'storage.type.function.sub.perl']});
      expect(tokens[2]).toEqual({value: 'name', scopes: ['source.perl', 'meta.function.perl', 'entity.name.function.perl']});
      expect(tokens[4]).toEqual({value: '[', scopes: ['source.perl', 'punctuation.section.square.bracket.begin.perl']});
      expect(tokens[5]).toEqual({value: ' a ', scopes: ['source.perl']});
      expect(tokens[6]).toEqual({value: '[', scopes: ['source.perl', 'punctuation.section.square.bracket.begin.perl']});
      expect(tokens[7]).toEqual({value: ' b ', scopes: ['source.perl']});
      expect(tokens[8]).toEqual({value: '[', scopes: ['source.perl', 'punctuation.section.square.bracket.begin.perl']});
      expect(tokens[9]).toEqual({value: ' c ', scopes: ['source.perl']});
      expect(tokens[10]).toEqual({value: '[', scopes: ['source.perl', 'punctuation.section.square.bracket.begin.perl']});
      expect(tokens[11]).toEqual({value: ']', scopes: ['source.perl', 'punctuation.section.square.bracket.end.perl']});
      expect(tokens[13]).toEqual({value: '1', scopes: ['source.perl', 'constant.numeric.decimal.perl']});
      expect(tokens[15]).toEqual({value: ']', scopes: ['source.perl', 'punctuation.section.square.bracket.end.perl']});
      expect(tokens[17]).toEqual({value: '2', scopes: ['source.perl', 'constant.numeric.decimal.perl']});
      expect(tokens[19]).toEqual({value: ']', scopes: ['source.perl', 'punctuation.section.square.bracket.end.perl']});
      expect(tokens[21]).toEqual({value: '3', scopes: ['source.perl', 'constant.numeric.decimal.perl']});
      expect(tokens[23]).toEqual({value: ']', scopes: ['source.perl', 'punctuation.section.square.bracket.end.perl']});
      expect(tokens[25]).toEqual({value: ']', scopes: ['source.perl', 'punctuation.unmatched.square.bracket.end.perl']});
  });

    it("tokenises unbalanced brackets", function() {
      const lines = grammar.tokenizeLines(`\
BEGIN:
(
    BEGIN:
    (
        \# (((\\     Comment
        $Unbalanced (())) ;
        \# Also a comment ))))))))))))))) Nothing specil
    )
    END:
)
END:\
`
      );
      expect(lines[0][0]).toEqual({value: 'BEGIN', scopes: ['source.perl', 'meta.function.perl', 'entity.name.function.perl']});
      expect(lines[0][1]).toEqual({value: ':', scopes: ['source.perl', 'keyword.operator.ternary.perl']});
      expect(lines[1][0]).toEqual({value: '(', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.begin.perl']});
      expect(lines[2][1]).toEqual({value: 'BEGIN', scopes: ['source.perl', 'meta.function.perl', 'entity.name.function.perl']});
      expect(lines[2][2]).toEqual({value: ':', scopes: ['source.perl', 'keyword.operator.ternary.perl']});
      expect(lines[3][1]).toEqual({value: '(', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.begin.perl']});
      expect(lines[4][1]).toEqual({value: '#', scopes: ['source.perl', 'comment.line.number-sign.perl', 'punctuation.definition.comment.perl']});
      expect(lines[4][2]).toEqual({value: ' (((\\     Comment', scopes: ['source.perl', 'comment.line.number-sign.perl']});
      expect(lines[4][3]).toEqual({value: '', scopes: ['source.perl', 'comment.line.number-sign.perl']});
      expect(lines[5][2]).toEqual({value: '$', scopes: ['source.perl', 'variable.other.readwrite.global.perl', 'punctuation.definition.variable.perl']});
      expect(lines[5][3]).toEqual({value: 'Unbalanced', scopes: ['source.perl', 'variable.other.readwrite.global.perl']});
      expect(lines[5][5]).toEqual({value: '(', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.begin.perl']});
      expect(lines[5][6]).toEqual({value: '(', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.begin.perl']});
      expect(lines[5][7]).toEqual({value: ')', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.end.perl']});
      expect(lines[5][8]).toEqual({value: ')', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.end.perl']});
      expect(lines[5][9]).toEqual({value: ')', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.end.perl']});
      expect(lines[5][11]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
      expect(lines[6][1]).toEqual({value: '#', scopes: ['source.perl', 'comment.line.number-sign.perl', 'punctuation.definition.comment.perl']});
      expect(lines[6][2]).toEqual({value: ' Also a comment ))))))))))))))) Nothing specil', scopes: ['source.perl', 'comment.line.number-sign.perl']});
      expect(lines[6][3]).toEqual({value: '', scopes: ['source.perl', 'comment.line.number-sign.perl']});
      expect(lines[7][1]).toEqual({value: ')', scopes: ['source.perl', 'punctuation.section.parenthesis.round.bracket.end.perl']});
      expect(lines[8][1]).toEqual({value: 'END', scopes: ['source.perl', 'meta.function.perl', 'entity.name.function.perl']});
      expect(lines[8][2]).toEqual({value: ':', scopes: ['source.perl', 'keyword.operator.ternary.perl']});
      expect(lines[9][0]).toEqual({value: ')', scopes: ['source.perl', 'punctuation.unmatched.parenthesis.round.bracket.end.perl']});
      expect(lines[10][0]).toEqual({value: 'END', scopes: ['source.perl', 'meta.function.perl', 'entity.name.function.perl']});
      expect(lines[10][1]).toEqual({value: ':', scopes: ['source.perl', 'keyword.operator.ternary.perl']});
  });
});

  describe("when tokenising pragma directives", function() {
    it("highlights each component correctly", function() {
      const lines = grammar.tokenizeLines(`\
use strict;
use warnings -verbose;
no autodie;
use open IN  => ":crlf", OUT => ":raw";
use open ":std";\
`
      );
      expect(lines[0][0]).toEqual({value: 'use', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'keyword.control.directive.pragma.use.perl']});
      expect(lines[0][2]).toEqual({value: 'strict', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'constant.language.pragma.module.perl']});
      expect(lines[0][3]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
      expect(lines[1][0]).toEqual({value: 'use', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'keyword.control.directive.pragma.use.perl']});
      expect(lines[1][2]).toEqual({value: 'warnings', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'constant.language.pragma.module.perl']});
      expect(lines[1][4]).toEqual({value: '-', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'keyword.operator.arithmetic.perl']});
      expect(lines[1][5]).toEqual({value: 'verbose', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'constant.language.pragma.module.perl']});
      expect(lines[1][6]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
      expect(lines[2][0]).toEqual({value: 'no', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'keyword.control.directive.pragma.no.perl']});
      expect(lines[2][2]).toEqual({value: 'autodie', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'constant.language.pragma.module.perl']});
      expect(lines[2][3]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
      expect(lines[3][0]).toEqual({value: 'use', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'keyword.control.directive.pragma.use.perl']});
      expect(lines[3][2]).toEqual({value: 'open', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'support.function.perl']});
      expect(lines[3][4]).toEqual({value: 'IN', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'constant.other.key.perl']});
      expect(lines[3][6]).toEqual({value: '=>', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'punctuation.separator.key-value.perl']});
      expect(lines[3][8]).toEqual({value: '"', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'string.quoted.double.perl', 'punctuation.definition.string.begin.perl']});
      expect(lines[3][9]).toEqual({value: ':crlf', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'string.quoted.double.perl']});
      expect(lines[3][10]).toEqual({value: '"', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'string.quoted.double.perl', 'punctuation.definition.string.end.perl']});
      expect(lines[3][11]).toEqual({value: ',', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'punctuation.separator.comma.perl']});
      expect(lines[3][13]).toEqual({value: 'OUT', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'constant.other.key.perl']});
      expect(lines[3][15]).toEqual({value: '=>', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'punctuation.separator.key-value.perl']});
      expect(lines[3][17]).toEqual({value: '"', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'string.quoted.double.perl', 'punctuation.definition.string.begin.perl']});
      expect(lines[3][18]).toEqual({value: ':raw', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'string.quoted.double.perl']});
      expect(lines[3][19]).toEqual({value: '"', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'string.quoted.double.perl', 'punctuation.definition.string.end.perl']});
      expect(lines[3][20]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
      expect(lines[4][0]).toEqual({value: 'use', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'keyword.control.directive.pragma.use.perl']});
      expect(lines[4][2]).toEqual({value: 'open', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'support.function.perl']});
      expect(lines[4][4]).toEqual({value: '"', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'string.quoted.double.perl', 'punctuation.definition.string.begin.perl']});
      expect(lines[4][5]).toEqual({value: ':std', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'string.quoted.double.perl']});
      expect(lines[4][6]).toEqual({value: '"', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'string.quoted.double.perl', 'punctuation.definition.string.end.perl']});
      expect(lines[4][7]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
  });

    it("flags repeated or conflicting keywords", function() {
      const lines = grammar.tokenizeLines(`\
no use warnings;
no no "no use";
use use "use warnings";
use no warnings;\
`
      );
      expect(lines[0][0]).toEqual({value: 'no', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'keyword.control.directive.pragma.no.perl']});
      expect(lines[0][2]).toEqual({value: 'use', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'invalid.illegal.syntax.pragma.perl']});
      expect(lines[0][4]).toEqual({value: 'warnings', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'constant.language.pragma.module.perl']});
      expect(lines[0][5]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
      expect(lines[1][0]).toEqual({value: 'no', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'keyword.control.directive.pragma.no.perl']});
      expect(lines[1][2]).toEqual({value: 'no', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'invalid.illegal.syntax.pragma.perl']});
      expect(lines[1][4]).toEqual({value: '"', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'string.quoted.double.perl', 'punctuation.definition.string.begin.perl']});
      expect(lines[1][5]).toEqual({value: 'no use', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'string.quoted.double.perl']});
      expect(lines[1][6]).toEqual({value: '"', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'string.quoted.double.perl', 'punctuation.definition.string.end.perl']});
      expect(lines[1][7]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
      expect(lines[2][0]).toEqual({value: 'use', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'keyword.control.directive.pragma.use.perl']});
      expect(lines[2][2]).toEqual({value: 'use', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'invalid.illegal.syntax.pragma.perl']});
      expect(lines[2][4]).toEqual({value: '"', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'string.quoted.double.perl', 'punctuation.definition.string.begin.perl']});
      expect(lines[2][5]).toEqual({value: 'use warnings', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'string.quoted.double.perl']});
      expect(lines[2][6]).toEqual({value: '"', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'string.quoted.double.perl', 'punctuation.definition.string.end.perl']});
      expect(lines[2][7]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
      expect(lines[3][0]).toEqual({value: 'use', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'keyword.control.directive.pragma.use.perl']});
      expect(lines[3][2]).toEqual({value: 'no', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'invalid.illegal.syntax.pragma.perl']});
      expect(lines[3][4]).toEqual({value: 'warnings', scopes: ['source.perl', 'meta.preprocessor.pragma.perl', 'constant.language.pragma.module.perl']});
      expect(lines[3][5]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
  });

    it("highlights `enable diagnostics` as a pragma directive", function() {
      const lines = grammar.tokenizeLines(`\
enable diagnostics;
disable diagnostics;\
`
      );
      expect(lines[0][0]).toEqual({value: 'enable', scopes: ['source.perl', 'meta.diagnostics.pragma.perl', 'keyword.control.diagnostics.enable.perl']});
      expect(lines[0][2]).toEqual({value: 'diagnostics', scopes: ['source.perl', 'meta.diagnostics.pragma.perl', 'constant.language.pragma.module.perl']});
      expect(lines[0][3]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
      expect(lines[1][0]).toEqual({value: 'disable', scopes: ['source.perl', 'meta.diagnostics.pragma.perl', 'keyword.control.diagnostics.disable.perl']});
      expect(lines[1][2]).toEqual({value: 'diagnostics', scopes: ['source.perl', 'meta.diagnostics.pragma.perl', 'constant.language.pragma.module.perl']});
      expect(lines[1][3]).toEqual({value: ';', scopes: ['source.perl', 'punctuation.terminator.semicolon.perl']});
  });
});

  describe("when tokenising Pod markup", function() {
    it("highlights Pod commands", function() {
      const lines = grammar.tokenizeLines(`\
=pod
Bar
=cut\
`
      );
      expect(lines[0][0]).toEqual({value: "=pod", scopes: ["source.perl", "comment.block.documentation.perl", "storage.type.class.pod.perl"]});
      expect(lines[1][0]).toEqual({value: "Bar", scopes: ["source.perl", "comment.block.documentation.perl"]});
      expect(lines[2][0]).toEqual({value: "=cut", scopes: ["source.perl", "comment.block.documentation.perl", "storage.type.class.pod.perl"]});
  });

    it("does not highlight commands with leading whitespace", function() {
      const {tokens} = grammar.tokenizeLine(" =pod");
      expect(tokens[2]).toEqual({value: "pod", scopes: ["source.perl"]});
  });

    it("highlights additional command parameters", function() {
      const {tokens} = grammar.tokenizeLine("=head1 Heading");
      expect(tokens[0]).toEqual({value: "=head1", scopes: ["source.perl", "comment.block.documentation.perl", "storage.type.class.pod.perl"]});
      expect(tokens[1]).toEqual({value: " ", scopes: ["source.perl", "comment.block.documentation.perl"]});
      expect(tokens[2]).toEqual({value: "Heading", scopes: ["source.perl", "comment.block.documentation.perl", "variable.other.pod.perl"]});
  });

    it("highlights formatting codes", function() {
      const lines = grammar.tokenizeLines(`\
=pod
See L<perlpod(1)>.\
`
      );
      expect(lines[1][0]).toEqual({value: "See ", scopes: ["source.perl", "comment.block.documentation.perl"]});
      expect(lines[1][1]).toEqual({value: "L<", scopes: ["source.perl", "comment.block.documentation.perl", "entity.name.type.instance.pod.perl"]});
      expect(lines[1][2]).toEqual({value: "perlpod(1)", scopes: ["source.perl", "comment.block.documentation.perl", "entity.name.type.instance.pod.perl", "markup.underline.link.hyperlink.pod.perl"]});
      expect(lines[1][3]).toEqual({value: ">", scopes: ["source.perl", "comment.block.documentation.perl", "entity.name.type.instance.pod.perl"]});
  });

    it("highlights formatting codes in command parameters", function() {
      const {tokens} = grammar.tokenizeLine("=head1 This is a B<bold heading>");
      expect(tokens[2]).toEqual({value: "This is a ", scopes: ["source.perl", "comment.block.documentation.perl", "variable.other.pod.perl"]});
      expect(tokens[3]).toEqual({value: "B<", scopes: ["source.perl", "comment.block.documentation.perl", "variable.other.pod.perl", "entity.name.type.instance.pod.perl"]});
      expect(tokens[4]).toEqual({value: "bold heading", scopes: ["source.perl", "comment.block.documentation.perl", "variable.other.pod.perl", "entity.name.type.instance.pod.perl", "markup.bold.pod.perl"]});
      expect(tokens[5]).toEqual({value: ">", scopes: ["source.perl", "comment.block.documentation.perl", "variable.other.pod.perl", "entity.name.type.instance.pod.perl"]});
  });

    it("highlights multiple angle-brackets correctly in formatting codes", function() {
      const lines = grammar.tokenizeLines(`\
=pod
Text I<< <italic> >> Text\
`
      );
      expect(lines[1][0]).toEqual({value: "Text ", scopes: ["source.perl", "comment.block.documentation.perl"]});
      expect(lines[1][1]).toEqual({value: "I<<", scopes: ["source.perl", "comment.block.documentation.perl", "entity.name.type.instance.pod.perl"]});
      expect(lines[1][2]).toEqual({value: " <italic> ", scopes: ["source.perl", "comment.block.documentation.perl", "entity.name.type.instance.pod.perl", "markup.italic.pod.perl"]});
      expect(lines[1][3]).toEqual({value: ">>", scopes: ["source.perl", "comment.block.documentation.perl", "entity.name.type.instance.pod.perl"]});
      expect(lines[1][4]).toEqual({value: " Text", scopes: ["source.perl", "comment.block.documentation.perl"]});
  });

    it("uses HTML highlighting in embedded HTML snippets", function() {
      const lines = grammar.tokenizeLines(`\
=pod
=begin html
<b>Bold</b>
=end html\
`
      );
      expect(lines[1][0]).toEqual({value: "=begin", scopes: ["source.perl", "comment.block.documentation.perl", "meta.embedded.pod.perl", "storage.type.class.pod.perl"]});
      expect(lines[1][1]).toEqual({value: " ", scopes: ["source.perl", "comment.block.documentation.perl", "meta.embedded.pod.perl"]});
      expect(lines[1][2]).toEqual({value: "html", scopes: ["source.perl", "comment.block.documentation.perl", "meta.embedded.pod.perl", "variable.other.pod.perl"]});
      expect(lines[2][0]).toEqual({value: "<b>Bold</b>", scopes: ["source.perl", "comment.block.documentation.perl", "meta.embedded.pod.perl", "text.embedded.html.basic"]});
      expect(lines[3][0]).toEqual({value: "=end", scopes: ["source.perl", "comment.block.documentation.perl", "meta.embedded.pod.perl", "storage.type.class.pod.perl"]});
      expect(lines[3][1]).toEqual({value: " ", scopes: ["source.perl", "comment.block.documentation.perl", "meta.embedded.pod.perl"]});
      expect(lines[3][2]).toEqual({value: "html", scopes: ["source.perl", "comment.block.documentation.perl", "meta.embedded.pod.perl", "variable.other.pod.perl"]});
  });

    it("cuts embedded snippets off early before a terminating =cut command", function() {
      const lines = grammar.tokenizeLines(`\
=pod
=begin html
<b>Bold</b>
=cut
my $var;\
`
      );
      expect(lines[2][0]).toEqual({value: "<b>Bold</b>", scopes: ["source.perl", "comment.block.documentation.perl", "meta.embedded.pod.perl", "text.embedded.html.basic"]});
      expect(lines[3][0]).toEqual({value: "=cut", scopes: ["source.perl", "comment.block.documentation.perl", "storage.type.class.pod.perl"]});
      expect(lines[4][0]).toEqual({value: "my", scopes: ["source.perl", "storage.modifier.perl"]});
  });
});

  describe("firstLineMatch", function() {
    it("recognises interpreter directives", function() {
      let line;
      const valid = `\
#!perl -w
#! perl -w
#!/usr/sbin/perl foo
#!/usr/bin/perl foo=bar/
#!/usr/sbin/perl
#!/usr/sbin/perl foo bar baz
#!/usr/bin/env perl
#!/usr/bin/env bin/perl
#!/usr/bin/perl
#!/bin/perl
#!/usr/bin/perl --script=usr/bin
#! /usr/bin/env A=003 B=149 C=150 D=xzd E=base64 F=tar G=gz H=head I=tail perl
#!\t/usr/bin/env --foo=bar perl --quu=quux
#! /usr/bin/perl
#!/usr/bin/env perl\
`;
      for (line of Array.from(valid.split(/\n/))) {
        expect(grammar.firstLineRegex.findNextMatchSync(line)).not.toBeNull();
      }

      const invalid = `\
#! pearl
#!=perl
perl
#perl
\x20#!/usr/sbin/perl
\t#!/usr/sbin/perl
#!
#!\x20
#!/usr/bin/env-perl/perl-env/
#!/usr/bin/env-perl
#! /usr/binperl
#!\t/usr/bin/env --perl=bar\
`;
      return (() => {
        const result = [];
        for (line of Array.from(invalid.split(/\n/))) {
          result.push(expect(grammar.firstLineRegex.findNextMatchSync(line)).toBeNull());
        }
        return result;
      })();
    });

    it("recognises Emacs modelines", function() {
      let line;
      const valid = `\
#-*-perl-*-
#-*-mode:perl-*-
/* -*-perl-*- */
// -*- PERL -*-
/* -*- mode:perl -*- */
// -*- font:bar;mode:Perl -*-
// -*- font:bar;mode:Perl;foo:bar; -*-
// -*-font:mode;mode:perl-*-
" -*-foo:bar;mode:Perl;bar:foo-*- ";
" -*-font-mode:foo;mode:Perl;foo-bar:quux-*-"
"-*-font:x;foo:bar; mode : pErL;bar:foo;foooooo:baaaaar;fo:ba;-*-";
"-*- font:x;foo : bar ; mode : pErL ; bar : foo ; foooooo:baaaaar;fo:ba-*-";\
`;
      for (line of Array.from(valid.split(/\n/))) {
        expect(grammar.firstLineRegex.findNextMatchSync(line)).not.toBeNull();
      }

      const invalid = `\
/* --*perl-*- */
/* -*-- perl -*-
/* -*- -- perl -*-
/* -*- perl -;- -*-
// -*- iPERL -*-
// -*- perl-stuff -*-
/* -*- model:perl -*-
/* -*- indent-mode:perl -*-
// -*- font:mode;Perl -*-
// -*- mode: -*- Perl
// -*- mode: grok-with-perl -*-
// -*-font:mode;mode:perl--*-\
`;
      return (() => {
        const result = [];
        for (line of Array.from(invalid.split(/\n/))) {
          result.push(expect(grammar.firstLineRegex.findNextMatchSync(line)).toBeNull());
        }
        return result;
      })();
    });

    it("recognises Vim modelines", function() {
      let line;
      const valid = `\
vim: se filetype=perl:
# vim: se ft=perl:
# vim: set ft=perl:
# vim: set filetype=Perl:
# vim: ft=perl
# vim: syntax=pERl
# vim: se syntax=PERL:
# ex: syntax=perl
# vim:ft=perl
# vim600: ft=perl
# vim>600: set ft=perl:
# vi:noai:sw=3 ts=6 ft=perl
# vi::::::::::noai:::::::::::: ft=perl
# vim:ts=4:sts=4:sw=4:noexpandtab:ft=perl
# vi:: noai : : : : sw   =3 ts   =6 ft  =perl
# vim: ts=4: pi sts=4: ft=perl: noexpandtab: sw=4:
# vim: ts=4 sts=4: ft=perl noexpandtab:
# vim:noexpandtab sts=4 ft=perl ts=4
# vim:noexpandtab:ft=perl
# vim:ts=4:sts=4 ft=perl:noexpandtab:\x20
# vim:noexpandtab titlestring=hi\|there\\\\ ft=perl ts=4\
`;
      for (line of Array.from(valid.split(/\n/))) {
        expect(grammar.firstLineRegex.findNextMatchSync(line)).not.toBeNull();
      }

      const invalid = `\
ex: se filetype=perl:
_vi: se filetype=perl:
 vi: se filetype=perl
# vim set ft=perlo
# vim: soft=perl
# vim: hairy-syntax=perl:
# vim set ft=perl:
# vim: setft=perl:
# vim: se ft=perl backupdir=tmp
# vim: set ft=perl set cmdheight=1
# vim:noexpandtab sts:4 ft:perl ts:4
# vim:noexpandtab titlestring=hi\\|there\\ ft=perl ts=4
# vim:noexpandtab titlestring=hi\\|there\\\\\\ ft=perl ts=4\
`;
      return (() => {
        const result = [];
        for (line of Array.from(invalid.split(/\n/))) {
          result.push(expect(grammar.firstLineRegex.findNextMatchSync(line)).toBeNull());
        }
        return result;
      })();
    });
  });
});

// Local variables:
// mode: CoffeeScript
// End:
