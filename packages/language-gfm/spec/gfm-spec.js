(function() {
  describe("GitHub Flavored Markdown grammar", function() {
    var grammar;
    grammar = null;
    beforeEach(function() {
      waitsForPromise(function() {
        return atom.packages.activatePackage("language-gfm");
      });
      return runs(function() {
        return grammar = atom.grammars.grammarForScopeName("source.gfm");
      });
    });
    it("parses the grammar", function() {
      expect(grammar).toBeDefined();
      return expect(grammar.scopeName).toBe("source.gfm");
    });
    it("tokenizes spaces", function() {
      var tokens;
      tokens = grammar.tokenizeLine(" ").tokens;
      return expect(tokens[0]).toEqual({
        value: " ",
        scopes: ["source.gfm"]
      });
    });
    it("tokenizes horizontal rules", function() {
      var tokens;
      tokens = grammar.tokenizeLine("***").tokens;
      expect(tokens[0]).toEqual({
        value: "***",
        scopes: ["source.gfm", "comment.hr.gfm"]
      });
      tokens = grammar.tokenizeLine("---").tokens;
      expect(tokens[0]).toEqual({
        value: "---",
        scopes: ["source.gfm", "comment.hr.gfm"]
      });
      tokens = grammar.tokenizeLine("___").tokens;
      return expect(tokens[0]).toEqual({
        value: "___",
        scopes: ["source.gfm", "comment.hr.gfm"]
      });
    });
    it("tokenizes escaped characters", function() {
      var tokens;
      tokens = grammar.tokenizeLine("\\*").tokens;
      expect(tokens[0]).toEqual({
        value: "\\*",
        scopes: ["source.gfm", "constant.character.escape.gfm"]
      });
      tokens = grammar.tokenizeLine("\\\\").tokens;
      expect(tokens[0]).toEqual({
        value: "\\\\",
        scopes: ["source.gfm", "constant.character.escape.gfm"]
      });
      tokens = grammar.tokenizeLine("\\abc").tokens;
      expect(tokens[0]).toEqual({
        value: "\\a",
        scopes: ["source.gfm", "constant.character.escape.gfm"]
      });
      return expect(tokens[1]).toEqual({
        value: "bc",
        scopes: ["source.gfm"]
      });
    });
    it("tokenizes ***bold italic*** text", function() {
      var firstLineTokens, secondLineTokens, tokens, _ref;
      tokens = grammar.tokenizeLine("this is ***bold italic*** text").tokens;
      expect(tokens[0]).toEqual({
        value: "this is ",
        scopes: ["source.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "***",
        scopes: ["source.gfm", "markup.bold.italic.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "bold italic",
        scopes: ["source.gfm", "markup.bold.italic.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: "***",
        scopes: ["source.gfm", "markup.bold.italic.gfm"]
      });
      expect(tokens[4]).toEqual({
        value: " text",
        scopes: ["source.gfm"]
      });
      _ref = grammar.tokenizeLines("this is ***bold\nitalic***!"), firstLineTokens = _ref[0], secondLineTokens = _ref[1];
      expect(firstLineTokens[0]).toEqual({
        value: "this is ",
        scopes: ["source.gfm"]
      });
      expect(firstLineTokens[1]).toEqual({
        value: "***",
        scopes: ["source.gfm", "markup.bold.italic.gfm"]
      });
      expect(firstLineTokens[2]).toEqual({
        value: "bold",
        scopes: ["source.gfm", "markup.bold.italic.gfm"]
      });
      expect(secondLineTokens[0]).toEqual({
        value: "italic",
        scopes: ["source.gfm", "markup.bold.italic.gfm"]
      });
      expect(secondLineTokens[1]).toEqual({
        value: "***",
        scopes: ["source.gfm", "markup.bold.italic.gfm"]
      });
      return expect(secondLineTokens[2]).toEqual({
        value: "!",
        scopes: ["source.gfm"]
      });
    });
    it("tokenizes ___bold italic___ text", function() {
      var firstLineTokens, secondLineTokens, tokens, _ref;
      tokens = grammar.tokenizeLine("this is ___bold italic___ text").tokens;
      expect(tokens[0]).toEqual({
        value: "this is ",
        scopes: ["source.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "___",
        scopes: ["source.gfm", "markup.bold.italic.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "bold italic",
        scopes: ["source.gfm", "markup.bold.italic.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: "___",
        scopes: ["source.gfm", "markup.bold.italic.gfm"]
      });
      expect(tokens[4]).toEqual({
        value: " text",
        scopes: ["source.gfm"]
      });
      _ref = grammar.tokenizeLines("this is ___bold\nitalic___!"), firstLineTokens = _ref[0], secondLineTokens = _ref[1];
      expect(firstLineTokens[0]).toEqual({
        value: "this is ",
        scopes: ["source.gfm"]
      });
      expect(firstLineTokens[1]).toEqual({
        value: "___",
        scopes: ["source.gfm", "markup.bold.italic.gfm"]
      });
      expect(firstLineTokens[2]).toEqual({
        value: "bold",
        scopes: ["source.gfm", "markup.bold.italic.gfm"]
      });
      expect(secondLineTokens[0]).toEqual({
        value: "italic",
        scopes: ["source.gfm", "markup.bold.italic.gfm"]
      });
      expect(secondLineTokens[1]).toEqual({
        value: "___",
        scopes: ["source.gfm", "markup.bold.italic.gfm"]
      });
      return expect(secondLineTokens[2]).toEqual({
        value: "!",
        scopes: ["source.gfm"]
      });
    });
    it("tokenizes **bold** text", function() {
      var firstLineTokens, secondLineTokens, tokens, _ref;
      tokens = grammar.tokenizeLine("**bold**").tokens;
      expect(tokens[0]).toEqual({
        value: "**",
        scopes: ["source.gfm", "markup.bold.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "bold",
        scopes: ["source.gfm", "markup.bold.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "**",
        scopes: ["source.gfm", "markup.bold.gfm", "punctuation.definition.entity.gfm"]
      });
      _ref = grammar.tokenizeLines("this is **not\nbold**!"), firstLineTokens = _ref[0], secondLineTokens = _ref[1];
      expect(firstLineTokens[0]).toEqual({
        value: "this is **not",
        scopes: ["source.gfm"]
      });
      expect(secondLineTokens[0]).toEqual({
        value: "bold**!",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine("not**bold**").tokens;
      expect(tokens[0]).toEqual({
        value: "not",
        scopes: ["source.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "**",
        scopes: ["source.gfm", "markup.bold.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "bold",
        scopes: ["source.gfm", "markup.bold.gfm"]
      });
      return expect(tokens[3]).toEqual({
        value: "**",
        scopes: ["source.gfm", "markup.bold.gfm", "punctuation.definition.entity.gfm"]
      });
    });
    it("tokenizes __bold__ text", function() {
      var firstLineTokens, secondLineTokens, tokens, _ref;
      tokens = grammar.tokenizeLine("____").tokens;
      expect(tokens[0]).toEqual({
        value: "____",
        scopes: ["source.gfm", "comment.hr.gfm"]
      });
      tokens = grammar.tokenizeLine("__bold__").tokens;
      expect(tokens[0]).toEqual({
        value: "__",
        scopes: ['source.gfm', 'markup.bold.gfm', 'punctuation.definition.entity.gfm']
      });
      expect(tokens[1]).toEqual({
        value: "bold",
        scopes: ["source.gfm", "markup.bold.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "__",
        scopes: ['source.gfm', 'markup.bold.gfm', 'punctuation.definition.entity.gfm']
      });
      _ref = grammar.tokenizeLines("this is __not\nbold__!"), firstLineTokens = _ref[0], secondLineTokens = _ref[1];
      expect(firstLineTokens[0]).toEqual({
        value: "this is __not",
        scopes: ["source.gfm"]
      });
      expect(secondLineTokens[0]).toEqual({
        value: "bold__!",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine("not__bold__").tokens;
      return expect(tokens[0]).toEqual({
        value: "not__bold__",
        scopes: ["source.gfm"]
      });
    });
    it("tokenizes *italic* text", function() {
      var firstLineTokens, secondLineTokens, tokens, _ref;
      tokens = grammar.tokenizeLine("**").tokens;
      expect(tokens[0]).toEqual({
        value: "**",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine("this is *italic* text").tokens;
      expect(tokens[0]).toEqual({
        value: "this is ",
        scopes: ["source.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "*",
        scopes: ["source.gfm", "markup.italic.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "italic",
        scopes: ["source.gfm", "markup.italic.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: "*",
        scopes: ["source.gfm", "markup.italic.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[4]).toEqual({
        value: " text",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine("is*italic*").tokens;
      expect(tokens[0]).toEqual({
        value: "is",
        scopes: ["source.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "*",
        scopes: ["source.gfm", "markup.italic.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "italic",
        scopes: ["source.gfm", "markup.italic.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: "*",
        scopes: ["source.gfm", "markup.italic.gfm", "punctuation.definition.entity.gfm"]
      });
      tokens = grammar.tokenizeLine("* not italic").tokens;
      expect(tokens[0]).toEqual({
        value: "*",
        scopes: ["source.gfm", "variable.unordered.list.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: " ",
        scopes: ["source.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "not italic",
        scopes: ["source.gfm"]
      });
      _ref = grammar.tokenizeLines("this is *not\nitalic*!"), firstLineTokens = _ref[0], secondLineTokens = _ref[1];
      expect(firstLineTokens[0]).toEqual({
        value: "this is *not",
        scopes: ["source.gfm"]
      });
      return expect(secondLineTokens[0]).toEqual({
        value: "italic*!",
        scopes: ["source.gfm"]
      });
    });
    it("tokenizes _italic_ text", function() {
      var firstLineTokens, secondLineTokens, tokens, _ref;
      tokens = grammar.tokenizeLine("__").tokens;
      expect(tokens[0]).toEqual({
        value: "__",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine("this is _italic_ text").tokens;
      expect(tokens[0]).toEqual({
        value: "this is ",
        scopes: ["source.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "_",
        scopes: ['source.gfm', 'markup.italic.gfm', 'punctuation.definition.entity.gfm']
      });
      expect(tokens[2]).toEqual({
        value: "italic",
        scopes: ["source.gfm", "markup.italic.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: "_",
        scopes: ['source.gfm', 'markup.italic.gfm', 'punctuation.definition.entity.gfm']
      });
      expect(tokens[4]).toEqual({
        value: " text",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine("not_italic_").tokens;
      expect(tokens[0]).toEqual({
        value: "not_italic_",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine("not x^{a}_m y^{b}_n italic").tokens;
      expect(tokens[0]).toEqual({
        value: "not x^{a}_m y^{b}_n italic",
        scopes: ["source.gfm"]
      });
      _ref = grammar.tokenizeLines("this is _not\nitalic_!"), firstLineTokens = _ref[0], secondLineTokens = _ref[1];
      expect(firstLineTokens[0]).toEqual({
        value: "this is _not",
        scopes: ["source.gfm"]
      });
      return expect(secondLineTokens[0]).toEqual({
        value: "italic_!",
        scopes: ["source.gfm"]
      });
    });
    it("tokenizes ~~strike~~ text", function() {
      var firstLineTokens, secondLineTokens, tokens, _ref;
      tokens = grammar.tokenizeLine("~~strike~~").tokens;
      expect(tokens[0]).toEqual({
        value: "~~",
        scopes: ["source.gfm", "markup.strike.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "strike",
        scopes: ["source.gfm", "markup.strike.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "~~",
        scopes: ["source.gfm", "markup.strike.gfm"]
      });
      _ref = grammar.tokenizeLines("this is ~~str\nike~~!"), firstLineTokens = _ref[0], secondLineTokens = _ref[1];
      expect(firstLineTokens[0]).toEqual({
        value: "this is ",
        scopes: ["source.gfm"]
      });
      expect(firstLineTokens[1]).toEqual({
        value: "~~",
        scopes: ["source.gfm", "markup.strike.gfm"]
      });
      expect(firstLineTokens[2]).toEqual({
        value: "str",
        scopes: ["source.gfm", "markup.strike.gfm"]
      });
      expect(secondLineTokens[0]).toEqual({
        value: "ike",
        scopes: ["source.gfm", "markup.strike.gfm"]
      });
      expect(secondLineTokens[1]).toEqual({
        value: "~~",
        scopes: ["source.gfm", "markup.strike.gfm"]
      });
      expect(secondLineTokens[2]).toEqual({
        value: "!",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine("not~~strike~~").tokens;
      return expect(tokens[0]).toEqual({
        value: "not~~strike~~",
        scopes: ["source.gfm"]
      });
    });
    it("tokenizes headings", function() {
      var tokens;
      tokens = grammar.tokenizeLine("# Heading 1").tokens;
      expect(tokens[0]).toEqual({
        value: "#",
        scopes: ["source.gfm", "markup.heading.heading-1.gfm", "markup.heading.marker.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: " ",
        scopes: ["source.gfm", "markup.heading.heading-1.gfm", "markup.heading.space.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "Heading 1",
        scopes: ["source.gfm", "markup.heading.heading-1.gfm"]
      });
      tokens = grammar.tokenizeLine("## Heading 2").tokens;
      expect(tokens[0]).toEqual({
        value: "##",
        scopes: ["source.gfm", "markup.heading.heading-2.gfm", "markup.heading.marker.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: " ",
        scopes: ["source.gfm", "markup.heading.heading-2.gfm", "markup.heading.space.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "Heading 2",
        scopes: ["source.gfm", "markup.heading.heading-2.gfm"]
      });
      tokens = grammar.tokenizeLine("### Heading 3").tokens;
      expect(tokens[0]).toEqual({
        value: "###",
        scopes: ["source.gfm", "markup.heading.heading-3.gfm", "markup.heading.marker.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: " ",
        scopes: ["source.gfm", "markup.heading.heading-3.gfm", "markup.heading.space.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "Heading 3",
        scopes: ["source.gfm", "markup.heading.heading-3.gfm"]
      });
      tokens = grammar.tokenizeLine("#### Heading 4").tokens;
      expect(tokens[0]).toEqual({
        value: "####",
        scopes: ["source.gfm", "markup.heading.heading-4.gfm", "markup.heading.marker.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: " ",
        scopes: ["source.gfm", "markup.heading.heading-4.gfm", "markup.heading.space.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "Heading 4",
        scopes: ["source.gfm", "markup.heading.heading-4.gfm"]
      });
      tokens = grammar.tokenizeLine("##### Heading 5").tokens;
      expect(tokens[0]).toEqual({
        value: "#####",
        scopes: ["source.gfm", "markup.heading.heading-5.gfm", "markup.heading.marker.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: " ",
        scopes: ["source.gfm", "markup.heading.heading-5.gfm", "markup.heading.space.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "Heading 5",
        scopes: ["source.gfm", "markup.heading.heading-5.gfm"]
      });
      tokens = grammar.tokenizeLine("###### Heading 6").tokens;
      expect(tokens[0]).toEqual({
        value: "######",
        scopes: ["source.gfm", "markup.heading.heading-6.gfm", "markup.heading.marker.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: " ",
        scopes: ["source.gfm", "markup.heading.heading-6.gfm", "markup.heading.space.gfm"]
      });
      return expect(tokens[2]).toEqual({
        value: "Heading 6",
        scopes: ["source.gfm", "markup.heading.heading-6.gfm"]
      });
    });
    it("tokenizes matches inside of headers", function() {
      var tokens;
      tokens = grammar.tokenizeLine("# Heading :one:").tokens;
      expect(tokens[0]).toEqual({
        value: "#",
        scopes: ["source.gfm", "markup.heading.heading-1.gfm", "markup.heading.marker.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: " ",
        scopes: ["source.gfm", "markup.heading.heading-1.gfm", "markup.heading.space.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "Heading ",
        scopes: ["source.gfm", "markup.heading.heading-1.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: ":",
        scopes: ["source.gfm", "markup.heading.heading-1.gfm", "string.emoji.gfm", "string.emoji.start.gfm"]
      });
      expect(tokens[4]).toEqual({
        value: "one",
        scopes: ["source.gfm", "markup.heading.heading-1.gfm", "string.emoji.gfm", "string.emoji.word.gfm"]
      });
      return expect(tokens[5]).toEqual({
        value: ":",
        scopes: ["source.gfm", "markup.heading.heading-1.gfm", "string.emoji.gfm", "string.emoji.end.gfm"]
      });
    });
    it("tokenizes an :emoji:", function() {
      var tokens;
      tokens = grammar.tokenizeLine("this is :no_good:").tokens;
      expect(tokens[0]).toEqual({
        value: "this is ",
        scopes: ["source.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: ":",
        scopes: ["source.gfm", "string.emoji.gfm", "string.emoji.start.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "no_good",
        scopes: ["source.gfm", "string.emoji.gfm", "string.emoji.word.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: ":",
        scopes: ["source.gfm", "string.emoji.gfm", "string.emoji.end.gfm"]
      });
      tokens = grammar.tokenizeLine("this is :no good:").tokens;
      expect(tokens[0]).toEqual({
        value: "this is :no good:",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine("http://localhost:8080").tokens;
      return expect(tokens[0]).toEqual({
        value: "http://localhost:8080",
        scopes: ["source.gfm"]
      });
    });
    it("tokenizes a ``` code block", function() {
      var ruleStack, tokens, _ref, _ref1;
      _ref = grammar.tokenizeLine("```"), tokens = _ref.tokens, ruleStack = _ref.ruleStack;
      expect(tokens[0]).toEqual({
        value: "```",
        scopes: ["source.gfm", "markup.raw.gfm", "support.gfm"]
      });
      _ref1 = grammar.tokenizeLine("-> 'hello'", ruleStack), tokens = _ref1.tokens, ruleStack = _ref1.ruleStack;
      expect(tokens[0]).toEqual({
        value: "-> 'hello'",
        scopes: ["source.gfm", "markup.raw.gfm"]
      });
      tokens = grammar.tokenizeLine("```", ruleStack).tokens;
      return expect(tokens[0]).toEqual({
        value: "```",
        scopes: ["source.gfm", "markup.raw.gfm", "support.gfm"]
      });
    });
    it("tokenizes a ~~~ code block", function() {
      var ruleStack, tokens, _ref, _ref1;
      _ref = grammar.tokenizeLine("~~~"), tokens = _ref.tokens, ruleStack = _ref.ruleStack;
      expect(tokens[0]).toEqual({
        value: "~~~",
        scopes: ["source.gfm", "markup.raw.gfm", "support.gfm"]
      });
      _ref1 = grammar.tokenizeLine("-> 'hello'", ruleStack), tokens = _ref1.tokens, ruleStack = _ref1.ruleStack;
      expect(tokens[0]).toEqual({
        value: "-> 'hello'",
        scopes: ["source.gfm", "markup.raw.gfm"]
      });
      tokens = grammar.tokenizeLine("~~~", ruleStack).tokens;
      return expect(tokens[0]).toEqual({
        value: "~~~",
        scopes: ["source.gfm", "markup.raw.gfm", "support.gfm"]
      });
    });
    it("doesn't tokenise ~`~ as a code block", function() {
      var tokens;
      tokens = grammar.tokenizeLine("~`~").tokens;
      expect(tokens[0]).toEqual({
        value: '~',
        scopes: ['source.gfm']
      });
      expect(tokens[1]).toEqual({
        value: '`',
        scopes: ['source.gfm', 'markup.raw.gfm']
      });
      return expect(tokens[2]).toEqual({
        value: '~',
        scopes: ['source.gfm', 'markup.raw.gfm']
      });
    });
    it("tokenises code-blocks with borders of differing lengths", function() {
      var firstLineTokens, secondLineTokens, thirdLineTokens, _ref, _ref1;
      _ref = grammar.tokenizeLines("~~~\nfoo bar\n~~~~~~~"), firstLineTokens = _ref[0], secondLineTokens = _ref[1], thirdLineTokens = _ref[2];
      expect(firstLineTokens[0]).toEqual({
        value: '~~~',
        scopes: ['source.gfm', 'markup.raw.gfm', 'support.gfm']
      });
      expect(secondLineTokens[0]).toEqual({
        value: 'foo bar',
        scopes: ['source.gfm', 'markup.raw.gfm']
      });
      expect(thirdLineTokens[0]).toEqual({
        value: '~~~~~~~',
        scopes: ['source.gfm', 'markup.raw.gfm', 'support.gfm']
      });
      _ref1 = grammar.tokenizeLines("~~~~~~~\nfoo bar\n~~~"), firstLineTokens = _ref1[0], secondLineTokens = _ref1[1], thirdLineTokens = _ref1[2];
      expect(firstLineTokens[0]).toEqual({
        value: '~~~~~~~',
        scopes: ['source.gfm', 'markup.raw.gfm', 'support.gfm']
      });
      expect(secondLineTokens[0]).toEqual({
        value: 'foo bar',
        scopes: ['source.gfm', 'markup.raw.gfm']
      });
      return expect(thirdLineTokens[0]).toEqual({
        value: '~~~',
        scopes: ['source.gfm', 'markup.raw.gfm']
      });
    });
    it("tokenizes a ``` code block with trailing whitespace", function() {
      var ruleStack, tokens, _ref, _ref1;
      _ref = grammar.tokenizeLine("```"), tokens = _ref.tokens, ruleStack = _ref.ruleStack;
      expect(tokens[0]).toEqual({
        value: "```",
        scopes: ["source.gfm", "markup.raw.gfm", "support.gfm"]
      });
      _ref1 = grammar.tokenizeLine("-> 'hello'", ruleStack), tokens = _ref1.tokens, ruleStack = _ref1.ruleStack;
      expect(tokens[0]).toEqual({
        value: "-> 'hello'",
        scopes: ["source.gfm", "markup.raw.gfm"]
      });
      tokens = grammar.tokenizeLine("```  ", ruleStack).tokens;
      return expect(tokens[0]).toEqual({
        value: "```  ",
        scopes: ["source.gfm", "markup.raw.gfm", "support.gfm"]
      });
    });
    it("tokenizes a ~~~ code block with trailing whitespace", function() {
      var ruleStack, tokens, _ref, _ref1;
      _ref = grammar.tokenizeLine("~~~"), tokens = _ref.tokens, ruleStack = _ref.ruleStack;
      expect(tokens[0]).toEqual({
        value: "~~~",
        scopes: ["source.gfm", "markup.raw.gfm", "support.gfm"]
      });
      _ref1 = grammar.tokenizeLine("-> 'hello'", ruleStack), tokens = _ref1.tokens, ruleStack = _ref1.ruleStack;
      expect(tokens[0]).toEqual({
        value: "-> 'hello'",
        scopes: ["source.gfm", "markup.raw.gfm"]
      });
      tokens = grammar.tokenizeLine("~~~  ", ruleStack).tokens;
      return expect(tokens[0]).toEqual({
        value: "~~~  ",
        scopes: ["source.gfm", "markup.raw.gfm", "support.gfm"]
      });
    });
    it("tokenises a ``` code block with an unknown language", function() {
      var ruleStack, tokens, _ref, _ref1;
      _ref = grammar.tokenizeLine("``` myLanguage"), tokens = _ref.tokens, ruleStack = _ref.ruleStack;
      expect(tokens[0]).toEqual({
        value: '``` myLanguage',
        scopes: ['source.gfm', 'markup.code.other.gfm', 'support.gfm']
      });
      _ref1 = grammar.tokenizeLine("-> 'hello'", ruleStack), tokens = _ref1.tokens, ruleStack = _ref1.ruleStack;
      expect(tokens[0]).toEqual({
        value: "-> 'hello'",
        scopes: ['source.gfm', 'markup.code.other.gfm', 'source.embedded.mylanguage']
      });
      tokens = grammar.tokenizeLine("```", ruleStack).tokens;
      return expect(tokens[0]).toEqual({
        value: '```',
        scopes: ['source.gfm', 'markup.code.other.gfm', 'support.gfm']
      });
    });
    it("tokenizes a ``` code block with a known language", function() {
      var ruleStack, tokens, _ref, _ref1, _ref2, _ref3, _ref4;
      _ref = grammar.tokenizeLine("```  bash"), tokens = _ref.tokens, ruleStack = _ref.ruleStack;
      expect(tokens[0]).toEqual({
        value: "```  bash",
        scopes: ["source.gfm", "markup.code.shell.gfm", "support.gfm"]
      });
      expect(ruleStack[1].contentScopeName).toBe("source.embedded.shell");
      _ref1 = grammar.tokenizeLine("```js  "), tokens = _ref1.tokens, ruleStack = _ref1.ruleStack;
      expect(tokens[0]).toEqual({
        value: "```js  ",
        scopes: ["source.gfm", "markup.code.js.gfm", "support.gfm"]
      });
      expect(ruleStack[1].contentScopeName).toBe("source.embedded.js");
      _ref2 = grammar.tokenizeLine("```JS  "), tokens = _ref2.tokens, ruleStack = _ref2.ruleStack;
      expect(tokens[0]).toEqual({
        value: "```JS  ",
        scopes: ["source.gfm", "markup.code.js.gfm", "support.gfm"]
      });
      expect(ruleStack[1].contentScopeName).toBe("source.embedded.js");
      _ref3 = grammar.tokenizeLine("```r  "), tokens = _ref3.tokens, ruleStack = _ref3.ruleStack;
      expect(tokens[0]).toEqual({
        value: "```r  ",
        scopes: ["source.gfm", "markup.code.r.gfm", "support.gfm"]
      });
      expect(ruleStack[1].contentScopeName).toBe("source.embedded.r");
      _ref4 = grammar.tokenizeLine("```properties  "), tokens = _ref4.tokens, ruleStack = _ref4.ruleStack;
      expect(tokens[0]).toEqual({
        value: "```properties  ",
        scopes: ["source.gfm", "markup.code.git-config.gfm", "support.gfm"]
      });
      return expect(ruleStack[1].contentScopeName).toBe("source.embedded.git-config");
    });
    it("tokenizes a Rmarkdown ``` code block", function() {
      var ruleStack, tokens, _ref, _ref1, _ref2;
      _ref = grammar.tokenizeLine("```{r}"), tokens = _ref.tokens, ruleStack = _ref.ruleStack;
      expect(tokens[0]).toEqual({
        value: "```{r}",
        scopes: ["source.gfm", "markup.code.r.gfm", "support.gfm"]
      });
      expect(ruleStack[1].contentScopeName).toBe("source.embedded.r");
      _ref1 = grammar.tokenizeLine("```{r,eval=TRUE,cache=FALSE}"), tokens = _ref1.tokens, ruleStack = _ref1.ruleStack;
      expect(tokens[0]).toEqual({
        value: "```{r,eval=TRUE,cache=FALSE}",
        scopes: ["source.gfm", "markup.code.r.gfm", "support.gfm"]
      });
      expect(ruleStack[1].contentScopeName).toBe("source.embedded.r");
      _ref2 = grammar.tokenizeLine("```{r eval=TRUE,cache=FALSE}"), tokens = _ref2.tokens, ruleStack = _ref2.ruleStack;
      expect(tokens[0]).toEqual({
        value: "```{r eval=TRUE,cache=FALSE}",
        scopes: ["source.gfm", "markup.code.r.gfm", "support.gfm"]
      });
      return expect(ruleStack[1].contentScopeName).toBe("source.embedded.r");
    });
    it("tokenizes a Rmarkdown ``` code block with whitespace", function() {
      var ruleStack, tokens, _ref, _ref1, _ref2;
      _ref = grammar.tokenizeLine("```{r   }"), tokens = _ref.tokens, ruleStack = _ref.ruleStack;
      expect(tokens[0]).toEqual({
        value: "```{r   }",
        scopes: ["source.gfm", "markup.code.r.gfm", "support.gfm"]
      });
      expect(ruleStack[1].contentScopeName).toBe("source.embedded.r");
      _ref1 = grammar.tokenizeLine("```{R }    "), tokens = _ref1.tokens, ruleStack = _ref1.ruleStack;
      expect(tokens[0]).toEqual({
        value: "```{R }    ",
        scopes: ["source.gfm", "markup.code.r.gfm", "support.gfm"]
      });
      expect(ruleStack[1].contentScopeName).toBe("source.embedded.r");
      _ref2 = grammar.tokenizeLine("```{r eval = TRUE, cache = FALSE}"), tokens = _ref2.tokens, ruleStack = _ref2.ruleStack;
      expect(tokens[0]).toEqual({
        value: "```{r eval = TRUE, cache = FALSE}",
        scopes: ["source.gfm", "markup.code.r.gfm", "support.gfm"]
      });
      return expect(ruleStack[1].contentScopeName).toBe("source.embedded.r");
    });
    it("tokenizes a ~~~ code block with a language", function() {
      var ruleStack, tokens, _ref, _ref1, _ref2;
      _ref = grammar.tokenizeLine("~~~  bash"), tokens = _ref.tokens, ruleStack = _ref.ruleStack;
      expect(tokens[0]).toEqual({
        value: "~~~  bash",
        scopes: ["source.gfm", "markup.code.shell.gfm", "support.gfm"]
      });
      expect(ruleStack[1].contentScopeName).toBe("source.embedded.shell");
      _ref1 = grammar.tokenizeLine("~~~js  "), tokens = _ref1.tokens, ruleStack = _ref1.ruleStack;
      expect(tokens[0]).toEqual({
        value: "~~~js  ",
        scopes: ["source.gfm", "markup.code.js.gfm", "support.gfm"]
      });
      expect(ruleStack[1].contentScopeName).toBe("source.embedded.js");
      _ref2 = grammar.tokenizeLine("~~~properties  "), tokens = _ref2.tokens, ruleStack = _ref2.ruleStack;
      expect(tokens[0]).toEqual({
        value: "~~~properties  ",
        scopes: ["source.gfm", "markup.code.git-config.gfm", "support.gfm"]
      });
      return expect(ruleStack[1].contentScopeName).toBe("source.embedded.git-config");
    });
    it("tokenizes a ``` code block with a language and trailing whitespace", function() {
      var ruleStack, tokens, _ref, _ref1;
      _ref = grammar.tokenizeLine("```  bash"), tokens = _ref.tokens, ruleStack = _ref.ruleStack;
      tokens = grammar.tokenizeLine("```  ", ruleStack).tokens;
      expect(tokens[0]).toEqual({
        value: "```  ",
        scopes: ["source.gfm", "markup.code.shell.gfm", "support.gfm"]
      });
      expect(ruleStack[1].contentScopeName).toBe("source.embedded.shell");
      _ref1 = grammar.tokenizeLine("```js  "), tokens = _ref1.tokens, ruleStack = _ref1.ruleStack;
      tokens = grammar.tokenizeLine("```  ", ruleStack).tokens;
      expect(tokens[0]).toEqual({
        value: "```  ",
        scopes: ["source.gfm", "markup.code.js.gfm", "support.gfm"]
      });
      return expect(ruleStack[1].contentScopeName).toBe("source.embedded.js");
    });
    it("tokenizes a ~~~ code block with a language and trailing whitespace", function() {
      var ruleStack, tokens, _ref, _ref1, _ref2;
      _ref = grammar.tokenizeLine("~~~  bash"), tokens = _ref.tokens, ruleStack = _ref.ruleStack;
      tokens = grammar.tokenizeLine("~~~  ", ruleStack).tokens;
      expect(tokens[0]).toEqual({
        value: "~~~  ",
        scopes: ["source.gfm", "markup.code.shell.gfm", "support.gfm"]
      });
      expect(ruleStack[1].contentScopeName).toBe("source.embedded.shell");
      _ref1 = grammar.tokenizeLine("~~~js  "), tokens = _ref1.tokens, ruleStack = _ref1.ruleStack;
      tokens = grammar.tokenizeLine("~~~  ", ruleStack).tokens;
      expect(tokens[0]).toEqual({
        value: "~~~  ",
        scopes: ["source.gfm", "markup.code.js.gfm", "support.gfm"]
      });
      expect(ruleStack[1].contentScopeName).toBe("source.embedded.js");
      _ref2 = grammar.tokenizeLine("~~~ properties  "), tokens = _ref2.tokens, ruleStack = _ref2.ruleStack;
      tokens = grammar.tokenizeLine("~~~  ", ruleStack).tokens;
      expect(tokens[0]).toEqual({
        value: "~~~  ",
        scopes: ["source.gfm", "markup.code.git-config.gfm", "support.gfm"]
      });
      return expect(ruleStack[1].contentScopeName).toBe("source.embedded.git-config");
    });
    it("tokenizes inline `code` blocks", function() {
      var tokens;
      tokens = grammar.tokenizeLine("`this` is `code`").tokens;
      expect(tokens[0]).toEqual({
        value: "`",
        scopes: ["source.gfm", "markup.raw.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "this",
        scopes: ["source.gfm", "markup.raw.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "`",
        scopes: ["source.gfm", "markup.raw.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: " is ",
        scopes: ["source.gfm"]
      });
      expect(tokens[4]).toEqual({
        value: "`",
        scopes: ["source.gfm", "markup.raw.gfm"]
      });
      expect(tokens[5]).toEqual({
        value: "code",
        scopes: ["source.gfm", "markup.raw.gfm"]
      });
      expect(tokens[6]).toEqual({
        value: "`",
        scopes: ["source.gfm", "markup.raw.gfm"]
      });
      tokens = grammar.tokenizeLine("``").tokens;
      expect(tokens[0]).toEqual({
        value: "`",
        scopes: ["source.gfm", "markup.raw.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "`",
        scopes: ["source.gfm", "markup.raw.gfm"]
      });
      tokens = grammar.tokenizeLine("``a\\`b``").tokens;
      expect(tokens[0]).toEqual({
        value: "``",
        scopes: ["source.gfm", "markup.raw.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "a\\`b",
        scopes: ["source.gfm", "markup.raw.gfm"]
      });
      return expect(tokens[2]).toEqual({
        value: "``",
        scopes: ["source.gfm", "markup.raw.gfm"]
      });
    });
    it("tokenizes [links](links)", function() {
      var tokens;
      tokens = grammar.tokenizeLine("please click [this link](website)").tokens;
      expect(tokens[0]).toEqual({
        value: "please click ",
        scopes: ["source.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "[",
        scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "this link",
        scopes: ["source.gfm", "link", "entity.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: "]",
        scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]
      });
      expect(tokens[4]).toEqual({
        value: "(",
        scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]
      });
      expect(tokens[5]).toEqual({
        value: "website",
        scopes: ["source.gfm", "link", "markup.underline.link.gfm"]
      });
      return expect(tokens[6]).toEqual({
        value: ")",
        scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]
      });
    });
    it("tokenizes reference [links][links]", function() {
      var tokens;
      tokens = grammar.tokenizeLine("please click [this link][website]").tokens;
      expect(tokens[0]).toEqual({
        value: "please click ",
        scopes: ["source.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "[",
        scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "this link",
        scopes: ["source.gfm", "link", "entity.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: "]",
        scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]
      });
      expect(tokens[4]).toEqual({
        value: "[",
        scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]
      });
      expect(tokens[5]).toEqual({
        value: "website",
        scopes: ["source.gfm", "link", "markup.underline.link.gfm"]
      });
      return expect(tokens[6]).toEqual({
        value: "]",
        scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]
      });
    });
    it("tokenizes id-less reference [links][]", function() {
      var tokens;
      tokens = grammar.tokenizeLine("please click [this link][]").tokens;
      expect(tokens[0]).toEqual({
        value: "please click ",
        scopes: ["source.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "[",
        scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "this link",
        scopes: ["source.gfm", "link", "entity.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: "]",
        scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]
      });
      expect(tokens[4]).toEqual({
        value: "[",
        scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]
      });
      return expect(tokens[5]).toEqual({
        value: "]",
        scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]
      });
    });
    it("tokenizes [link]: footers", function() {
      var tokens;
      tokens = grammar.tokenizeLine("[aLink]: http://website").tokens;
      expect(tokens[0]).toEqual({
        value: "[",
        scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "aLink",
        scopes: ["source.gfm", "link", "entity.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "]",
        scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: ":",
        scopes: ["source.gfm", "link", "punctuation.separator.key-value.gfm"]
      });
      expect(tokens[4]).toEqual({
        value: " ",
        scopes: ["source.gfm", "link"]
      });
      return expect(tokens[5]).toEqual({
        value: "http://website",
        scopes: ["source.gfm", "link", "markup.underline.link.gfm"]
      });
    });
    it("tokenizes [link]: <footers>", function() {
      var tokens;
      tokens = grammar.tokenizeLine("[aLink]: <http://website>").tokens;
      expect(tokens[0]).toEqual({
        value: "[",
        scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "aLink",
        scopes: ["source.gfm", "link", "entity.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "]",
        scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: ": <",
        scopes: ["source.gfm", "link"]
      });
      expect(tokens[4]).toEqual({
        value: "http://website",
        scopes: ["source.gfm", "link", "markup.underline.link.gfm"]
      });
      return expect(tokens[5]).toEqual({
        value: ">",
        scopes: ["source.gfm", "link"]
      });
    });
    it("tokenizes [![links](links)](links)", function() {
      var tokens;
      tokens = grammar.tokenizeLine("[![title](image)](link)").tokens;
      expect(tokens[0]).toEqual({
        value: "[!",
        scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "[",
        scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "title",
        scopes: ["source.gfm", "link", "entity.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: "]",
        scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]
      });
      expect(tokens[4]).toEqual({
        value: "(",
        scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]
      });
      expect(tokens[5]).toEqual({
        value: "image",
        scopes: ["source.gfm", "link", "markup.underline.link.gfm"]
      });
      expect(tokens[6]).toEqual({
        value: ")",
        scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]
      });
      expect(tokens[7]).toEqual({
        value: "]",
        scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]
      });
      expect(tokens[8]).toEqual({
        value: "(",
        scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]
      });
      expect(tokens[9]).toEqual({
        value: "link",
        scopes: ["source.gfm", "link", "markup.underline.link.gfm"]
      });
      return expect(tokens[10]).toEqual({
        value: ")",
        scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]
      });
    });
    it("tokenizes [![links](links)][links]", function() {
      var tokens;
      tokens = grammar.tokenizeLine("[![title](image)][link]").tokens;
      expect(tokens[0]).toEqual({
        value: "[!",
        scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "[",
        scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "title",
        scopes: ["source.gfm", "link", "entity.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: "]",
        scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]
      });
      expect(tokens[4]).toEqual({
        value: "(",
        scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]
      });
      expect(tokens[5]).toEqual({
        value: "image",
        scopes: ["source.gfm", "link", "markup.underline.link.gfm"]
      });
      expect(tokens[6]).toEqual({
        value: ")",
        scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]
      });
      expect(tokens[7]).toEqual({
        value: "]",
        scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]
      });
      expect(tokens[8]).toEqual({
        value: "[",
        scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]
      });
      expect(tokens[9]).toEqual({
        value: "link",
        scopes: ["source.gfm", "link", "markup.underline.link.gfm"]
      });
      return expect(tokens[10]).toEqual({
        value: "]",
        scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]
      });
    });
    it("tokenizes [![links][links]](links)", function() {
      var tokens;
      tokens = grammar.tokenizeLine("[![title][image]](link)").tokens;
      expect(tokens[0]).toEqual({
        value: "[!",
        scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "[",
        scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "title",
        scopes: ["source.gfm", "link", "entity.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: "]",
        scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]
      });
      expect(tokens[4]).toEqual({
        value: "[",
        scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]
      });
      expect(tokens[5]).toEqual({
        value: "image",
        scopes: ["source.gfm", "link", "markup.underline.link.gfm"]
      });
      expect(tokens[6]).toEqual({
        value: "]",
        scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]
      });
      expect(tokens[7]).toEqual({
        value: "]",
        scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]
      });
      expect(tokens[8]).toEqual({
        value: "(",
        scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]
      });
      expect(tokens[9]).toEqual({
        value: "link",
        scopes: ["source.gfm", "link", "markup.underline.link.gfm"]
      });
      return expect(tokens[10]).toEqual({
        value: ")",
        scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]
      });
    });
    it("tokenizes [![links][links]][links]", function() {
      var tokens;
      tokens = grammar.tokenizeLine("[![title][image]][link]").tokens;
      expect(tokens[0]).toEqual({
        value: "[!",
        scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "[",
        scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "title",
        scopes: ["source.gfm", "link", "entity.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: "]",
        scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]
      });
      expect(tokens[4]).toEqual({
        value: "[",
        scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]
      });
      expect(tokens[5]).toEqual({
        value: "image",
        scopes: ["source.gfm", "link", "markup.underline.link.gfm"]
      });
      expect(tokens[6]).toEqual({
        value: "]",
        scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]
      });
      expect(tokens[7]).toEqual({
        value: "]",
        scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]
      });
      expect(tokens[8]).toEqual({
        value: "[",
        scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]
      });
      expect(tokens[9]).toEqual({
        value: "link",
        scopes: ["source.gfm", "link", "markup.underline.link.gfm"]
      });
      return expect(tokens[10]).toEqual({
        value: "]",
        scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]
      });
    });
    it("tokenizes mentions", function() {
      var tokens;
      tokens = grammar.tokenizeLine("sentence with no space before@name ").tokens;
      expect(tokens[0]).toEqual({
        value: "sentence with no space before@name ",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine("@name '@name' @name's @name. @name, (@name) [@name]").tokens;
      expect(tokens[0]).toEqual({
        value: "@",
        scopes: ["source.gfm", "variable.mention.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "name",
        scopes: ["source.gfm", "string.username.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: " '",
        scopes: ["source.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: "@",
        scopes: ["source.gfm", "variable.mention.gfm"]
      });
      expect(tokens[4]).toEqual({
        value: "name",
        scopes: ["source.gfm", "string.username.gfm"]
      });
      expect(tokens[5]).toEqual({
        value: "' ",
        scopes: ["source.gfm"]
      });
      expect(tokens[6]).toEqual({
        value: "@",
        scopes: ["source.gfm", "variable.mention.gfm"]
      });
      expect(tokens[7]).toEqual({
        value: "name",
        scopes: ["source.gfm", "string.username.gfm"]
      });
      expect(tokens[8]).toEqual({
        value: "'s ",
        scopes: ["source.gfm"]
      });
      expect(tokens[9]).toEqual({
        value: "@",
        scopes: ["source.gfm", "variable.mention.gfm"]
      });
      expect(tokens[10]).toEqual({
        value: "name",
        scopes: ["source.gfm", "string.username.gfm"]
      });
      expect(tokens[11]).toEqual({
        value: ". ",
        scopes: ["source.gfm"]
      });
      expect(tokens[12]).toEqual({
        value: "@",
        scopes: ["source.gfm", "variable.mention.gfm"]
      });
      expect(tokens[13]).toEqual({
        value: "name",
        scopes: ["source.gfm", "string.username.gfm"]
      });
      expect(tokens[14]).toEqual({
        value: ", (",
        scopes: ["source.gfm"]
      });
      expect(tokens[15]).toEqual({
        value: "@",
        scopes: ["source.gfm", "variable.mention.gfm"]
      });
      expect(tokens[16]).toEqual({
        value: "name",
        scopes: ["source.gfm", "string.username.gfm"]
      });
      expect(tokens[17]).toEqual({
        value: ") [",
        scopes: ["source.gfm"]
      });
      expect(tokens[18]).toEqual({
        value: "@",
        scopes: ["source.gfm", "variable.mention.gfm"]
      });
      expect(tokens[19]).toEqual({
        value: "name",
        scopes: ["source.gfm", "string.username.gfm"]
      });
      expect(tokens[20]).toEqual({
        value: "]",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine('"@name"').tokens;
      expect(tokens[0]).toEqual({
        value: '"',
        scopes: ["source.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "@",
        scopes: ["source.gfm", "variable.mention.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "name",
        scopes: ["source.gfm", "string.username.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: '"',
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine("sentence with a space before @name/ and an invalid symbol after").tokens;
      expect(tokens[0]).toEqual({
        value: "sentence with a space before @name/ and an invalid symbol after",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine("sentence with a space before @name that continues").tokens;
      expect(tokens[0]).toEqual({
        value: "sentence with a space before ",
        scopes: ["source.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "@",
        scopes: ["source.gfm", "variable.mention.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "name",
        scopes: ["source.gfm", "string.username.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: " that continues",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine("* @name at the start of an unordered list").tokens;
      expect(tokens[0]).toEqual({
        value: "*",
        scopes: ["source.gfm", "variable.unordered.list.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: " ",
        scopes: ["source.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "@",
        scopes: ["source.gfm", "variable.mention.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: "name",
        scopes: ["source.gfm", "string.username.gfm"]
      });
      expect(tokens[4]).toEqual({
        value: " at the start of an unordered list",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine("a username @1337_hubot with numbers, letters and underscores").tokens;
      expect(tokens[0]).toEqual({
        value: "a username ",
        scopes: ["source.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "@",
        scopes: ["source.gfm", "variable.mention.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "1337_hubot",
        scopes: ["source.gfm", "string.username.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: " with numbers, letters and underscores",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine("a username @1337-hubot with numbers, letters and hyphens").tokens;
      expect(tokens[0]).toEqual({
        value: "a username ",
        scopes: ["source.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "@",
        scopes: ["source.gfm", "variable.mention.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "1337-hubot",
        scopes: ["source.gfm", "string.username.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: " with numbers, letters and hyphens",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine("@name at the start of a line").tokens;
      expect(tokens[0]).toEqual({
        value: "@",
        scopes: ["source.gfm", "variable.mention.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "name",
        scopes: ["source.gfm", "string.username.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: " at the start of a line",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine("any email like you@domain.com shouldn't mistakenly be matched as a mention").tokens;
      expect(tokens[0]).toEqual({
        value: "any email like you@domain.com shouldn't mistakenly be matched as a mention",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine("@person's").tokens;
      expect(tokens[0]).toEqual({
        value: "@",
        scopes: ["source.gfm", "variable.mention.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "person",
        scopes: ["source.gfm", "string.username.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "'s",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine("@person;").tokens;
      expect(tokens[0]).toEqual({
        value: "@",
        scopes: ["source.gfm", "variable.mention.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "person",
        scopes: ["source.gfm", "string.username.gfm"]
      });
      return expect(tokens[2]).toEqual({
        value: ";",
        scopes: ["source.gfm"]
      });
    });
    it("tokenizes issue numbers", function() {
      var tokens;
      tokens = grammar.tokenizeLine("sentence with no space before#12 ").tokens;
      expect(tokens[0]).toEqual({
        value: "sentence with no space before#12 ",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine(" #101 '#101' #101's #101. #101, (#101) [#101]").tokens;
      expect(tokens[1]).toEqual({
        value: "#",
        scopes: ["source.gfm", "variable.issue.tag.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "101",
        scopes: ["source.gfm", "string.issue.number.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: " '",
        scopes: ["source.gfm"]
      });
      expect(tokens[4]).toEqual({
        value: "#",
        scopes: ["source.gfm", "variable.issue.tag.gfm"]
      });
      expect(tokens[5]).toEqual({
        value: "101",
        scopes: ["source.gfm", "string.issue.number.gfm"]
      });
      expect(tokens[6]).toEqual({
        value: "' ",
        scopes: ["source.gfm"]
      });
      expect(tokens[7]).toEqual({
        value: "#",
        scopes: ["source.gfm", "variable.issue.tag.gfm"]
      });
      expect(tokens[8]).toEqual({
        value: "101",
        scopes: ["source.gfm", "string.issue.number.gfm"]
      });
      expect(tokens[9]).toEqual({
        value: "'s ",
        scopes: ["source.gfm"]
      });
      expect(tokens[10]).toEqual({
        value: "#",
        scopes: ["source.gfm", "variable.issue.tag.gfm"]
      });
      expect(tokens[11]).toEqual({
        value: "101",
        scopes: ["source.gfm", "string.issue.number.gfm"]
      });
      expect(tokens[12]).toEqual({
        value: ". ",
        scopes: ["source.gfm"]
      });
      expect(tokens[13]).toEqual({
        value: "#",
        scopes: ["source.gfm", "variable.issue.tag.gfm"]
      });
      expect(tokens[14]).toEqual({
        value: "101",
        scopes: ["source.gfm", "string.issue.number.gfm"]
      });
      expect(tokens[15]).toEqual({
        value: ", (",
        scopes: ["source.gfm"]
      });
      expect(tokens[16]).toEqual({
        value: "#",
        scopes: ["source.gfm", "variable.issue.tag.gfm"]
      });
      expect(tokens[17]).toEqual({
        value: "101",
        scopes: ["source.gfm", "string.issue.number.gfm"]
      });
      expect(tokens[18]).toEqual({
        value: ") [",
        scopes: ["source.gfm"]
      });
      expect(tokens[19]).toEqual({
        value: "#",
        scopes: ["source.gfm", "variable.issue.tag.gfm"]
      });
      expect(tokens[20]).toEqual({
        value: "101",
        scopes: ["source.gfm", "string.issue.number.gfm"]
      });
      expect(tokens[21]).toEqual({
        value: "]",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine('"#101"').tokens;
      expect(tokens[0]).toEqual({
        value: '"',
        scopes: ["source.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "#",
        scopes: ["source.gfm", "variable.issue.tag.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "101",
        scopes: ["source.gfm", "string.issue.number.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: '"',
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine("sentence with a space before #123i and a character after").tokens;
      expect(tokens[0]).toEqual({
        value: "sentence with a space before #123i and a character after",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine("sentence with a space before #123 that continues").tokens;
      expect(tokens[0]).toEqual({
        value: "sentence with a space before ",
        scopes: ["source.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "#",
        scopes: ["source.gfm", "variable.issue.tag.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "123",
        scopes: ["source.gfm", "string.issue.number.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: " that continues",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine(" #123's").tokens;
      expect(tokens[1]).toEqual({
        value: "#",
        scopes: ["source.gfm", "variable.issue.tag.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "123",
        scopes: ["source.gfm", "string.issue.number.gfm"]
      });
      return expect(tokens[3]).toEqual({
        value: "'s",
        scopes: ["source.gfm"]
      });
    });
    it("tokenizes unordered lists", function() {
      var tokens;
      tokens = grammar.tokenizeLine("*Item 1").tokens;
      expect(tokens[0]).not.toEqual({
        value: "*Item 1",
        scopes: ["source.gfm", "variable.unordered.list.gfm"]
      });
      tokens = grammar.tokenizeLine("  * Item 1").tokens;
      expect(tokens[0]).toEqual({
        value: "  ",
        scopes: ["source.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "*",
        scopes: ["source.gfm", "variable.unordered.list.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: " ",
        scopes: ["source.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: "Item 1",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine("  + Item 2").tokens;
      expect(tokens[0]).toEqual({
        value: "  ",
        scopes: ["source.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "+",
        scopes: ["source.gfm", "variable.unordered.list.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: " ",
        scopes: ["source.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: "Item 2",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine("  - Item 3").tokens;
      expect(tokens[0]).toEqual({
        value: "  ",
        scopes: ["source.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "-",
        scopes: ["source.gfm", "variable.unordered.list.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: " ",
        scopes: ["source.gfm"]
      });
      return expect(tokens[3]).toEqual({
        value: "Item 3",
        scopes: ["source.gfm"]
      });
    });
    it("tokenizes ordered lists", function() {
      var tokens;
      tokens = grammar.tokenizeLine("1.First Item").tokens;
      expect(tokens[0]).toEqual({
        value: "1.First Item",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine("  1. First Item").tokens;
      expect(tokens[0]).toEqual({
        value: "  ",
        scopes: ["source.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "1.",
        scopes: ["source.gfm", "variable.ordered.list.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: " ",
        scopes: ["source.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: "First Item",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine("  10. Tenth Item").tokens;
      expect(tokens[0]).toEqual({
        value: "  ",
        scopes: ["source.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "10.",
        scopes: ["source.gfm", "variable.ordered.list.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: " ",
        scopes: ["source.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: "Tenth Item",
        scopes: ["source.gfm"]
      });
      tokens = grammar.tokenizeLine("  111. Hundred and eleventh item").tokens;
      expect(tokens[0]).toEqual({
        value: "  ",
        scopes: ["source.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "111.",
        scopes: ["source.gfm", "variable.ordered.list.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: " ",
        scopes: ["source.gfm"]
      });
      return expect(tokens[3]).toEqual({
        value: "Hundred and eleventh item",
        scopes: ["source.gfm"]
      });
    });
    it("tokenizes > quoted text", function() {
      var tokens;
      tokens = grammar.tokenizeLine("> Quotation :+1:").tokens;
      expect(tokens[0]).toEqual({
        value: ">",
        scopes: ["source.gfm", "comment.quote.gfm", "support.quote.gfm"]
      });
      return expect(tokens[1]).toEqual({
        value: " Quotation :+1:",
        scopes: ["source.gfm", "comment.quote.gfm"]
      });
    });
    it("tokenizes HTML entities", function() {
      var tokens;
      tokens = grammar.tokenizeLine("&trade; &#8482; &a1; &#xb3;").tokens;
      expect(tokens[0]).toEqual({
        value: "&",
        scopes: ["source.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "trade",
        scopes: ["source.gfm", "constant.character.entity.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: ";",
        scopes: ["source.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: " ",
        scopes: ["source.gfm"]
      });
      expect(tokens[4]).toEqual({
        value: "&",
        scopes: ["source.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[5]).toEqual({
        value: "#8482",
        scopes: ["source.gfm", "constant.character.entity.gfm"]
      });
      expect(tokens[6]).toEqual({
        value: ";",
        scopes: ["source.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[7]).toEqual({
        value: " ",
        scopes: ["source.gfm"]
      });
      expect(tokens[8]).toEqual({
        value: "&",
        scopes: ["source.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[9]).toEqual({
        value: "a1",
        scopes: ["source.gfm", "constant.character.entity.gfm"]
      });
      expect(tokens[10]).toEqual({
        value: ";",
        scopes: ["source.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[11]).toEqual({
        value: " ",
        scopes: ["source.gfm"]
      });
      expect(tokens[12]).toEqual({
        value: "&",
        scopes: ["source.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[13]).toEqual({
        value: "#xb3",
        scopes: ["source.gfm", "constant.character.entity.gfm"]
      });
      return expect(tokens[14]).toEqual({
        value: ";",
        scopes: ["source.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
    });
    it("tokenizes HTML entities in *italic* text", function() {
      var tokens;
      tokens = grammar.tokenizeLine("*&trade; &#8482; &#xb3;*").tokens;
      expect(tokens[0]).toEqual({
        value: "*",
        scopes: ['source.gfm', 'markup.italic.gfm', 'punctuation.definition.entity.gfm']
      });
      expect(tokens[1]).toEqual({
        value: "&",
        scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "trade",
        scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: ";",
        scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[4]).toEqual({
        value: " ",
        scopes: ["source.gfm", "markup.italic.gfm"]
      });
      expect(tokens[5]).toEqual({
        value: "&",
        scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[6]).toEqual({
        value: "#8482",
        scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm"]
      });
      expect(tokens[7]).toEqual({
        value: ";",
        scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[8]).toEqual({
        value: " ",
        scopes: ["source.gfm", "markup.italic.gfm"]
      });
      expect(tokens[9]).toEqual({
        value: "&",
        scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[10]).toEqual({
        value: "#xb3",
        scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm"]
      });
      expect(tokens[11]).toEqual({
        value: ";",
        scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[12]).toEqual({
        value: "*",
        scopes: ['source.gfm', 'markup.italic.gfm', 'punctuation.definition.entity.gfm']
      });
      tokens = grammar.tokenizeLine("_&trade; &#8482; &#xb3;_").tokens;
      expect(tokens[0]).toEqual({
        value: "_",
        scopes: ['source.gfm', 'markup.italic.gfm', 'punctuation.definition.entity.gfm']
      });
      expect(tokens[1]).toEqual({
        value: "&",
        scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "trade",
        scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: ";",
        scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[4]).toEqual({
        value: " ",
        scopes: ["source.gfm", "markup.italic.gfm"]
      });
      expect(tokens[5]).toEqual({
        value: "&",
        scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[6]).toEqual({
        value: "#8482",
        scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm"]
      });
      expect(tokens[7]).toEqual({
        value: ";",
        scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[8]).toEqual({
        value: " ",
        scopes: ["source.gfm", "markup.italic.gfm"]
      });
      expect(tokens[9]).toEqual({
        value: "&",
        scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[10]).toEqual({
        value: "#xb3",
        scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm"]
      });
      expect(tokens[11]).toEqual({
        value: ";",
        scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      return expect(tokens[12]).toEqual({
        value: "_",
        scopes: ['source.gfm', 'markup.italic.gfm', 'punctuation.definition.entity.gfm']
      });
    });
    it("tokenizes HTML entities in **bold** text", function() {
      var tokens;
      tokens = grammar.tokenizeLine("**&trade; &#8482; &#xb3;**").tokens;
      expect(tokens[0]).toEqual({
        value: "**",
        scopes: ["source.gfm", "markup.bold.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "&",
        scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "trade",
        scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: ";",
        scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[4]).toEqual({
        value: " ",
        scopes: ["source.gfm", "markup.bold.gfm"]
      });
      expect(tokens[5]).toEqual({
        value: "&",
        scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[6]).toEqual({
        value: "#8482",
        scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm"]
      });
      expect(tokens[7]).toEqual({
        value: ";",
        scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[8]).toEqual({
        value: " ",
        scopes: ["source.gfm", "markup.bold.gfm"]
      });
      expect(tokens[9]).toEqual({
        value: "&",
        scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[10]).toEqual({
        value: "#xb3",
        scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm"]
      });
      expect(tokens[11]).toEqual({
        value: ";",
        scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[12]).toEqual({
        value: "**",
        scopes: ["source.gfm", "markup.bold.gfm", "punctuation.definition.entity.gfm"]
      });
      tokens = grammar.tokenizeLine("__&trade; &#8482; &#xb3;__").tokens;
      expect(tokens[0]).toEqual({
        value: "__",
        scopes: ["source.gfm", "markup.bold.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "&",
        scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "trade",
        scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: ";",
        scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[4]).toEqual({
        value: " ",
        scopes: ["source.gfm", "markup.bold.gfm"]
      });
      expect(tokens[5]).toEqual({
        value: "&",
        scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[6]).toEqual({
        value: "#8482",
        scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm"]
      });
      expect(tokens[7]).toEqual({
        value: ";",
        scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[8]).toEqual({
        value: " ",
        scopes: ["source.gfm", "markup.bold.gfm"]
      });
      expect(tokens[9]).toEqual({
        value: "&",
        scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[10]).toEqual({
        value: "#xb3",
        scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm"]
      });
      expect(tokens[11]).toEqual({
        value: ";",
        scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      return expect(tokens[12]).toEqual({
        value: "__",
        scopes: ["source.gfm", "markup.bold.gfm", "punctuation.definition.entity.gfm"]
      });
    });
    it("tokenizes HTML entities in ***bold italic*** text", function() {
      var tokens;
      tokens = grammar.tokenizeLine("***&trade; &#8482; &#xb3;***").tokens;
      expect(tokens[0]).toEqual({
        value: "***",
        scopes: ["source.gfm", "markup.bold.italic.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "&",
        scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "trade",
        scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: ";",
        scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm"]
      });
      expect(tokens[4]).toEqual({
        value: " ",
        scopes: ["source.gfm", "markup.bold.italic.gfm"]
      });
      expect(tokens[5]).toEqual({
        value: "&",
        scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[6]).toEqual({
        value: "#8482",
        scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[7]).toEqual({
        value: ";",
        scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm"]
      });
      expect(tokens[8]).toEqual({
        value: " ",
        scopes: ["source.gfm", "markup.bold.italic.gfm"]
      });
      expect(tokens[9]).toEqual({
        value: "&",
        scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[10]).toEqual({
        value: "#xb3",
        scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[11]).toEqual({
        value: ";",
        scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm"]
      });
      expect(tokens[12]).toEqual({
        value: "***",
        scopes: ["source.gfm", "markup.bold.italic.gfm"]
      });
      tokens = grammar.tokenizeLine("___&trade; &#8482; &#xb3;___").tokens;
      expect(tokens[0]).toEqual({
        value: "___",
        scopes: ["source.gfm", "markup.bold.italic.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "&",
        scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "trade",
        scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: ";",
        scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm"]
      });
      expect(tokens[4]).toEqual({
        value: " ",
        scopes: ["source.gfm", "markup.bold.italic.gfm"]
      });
      expect(tokens[5]).toEqual({
        value: "&",
        scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[6]).toEqual({
        value: "#8482",
        scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[7]).toEqual({
        value: ";",
        scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm"]
      });
      expect(tokens[8]).toEqual({
        value: " ",
        scopes: ["source.gfm", "markup.bold.italic.gfm"]
      });
      expect(tokens[9]).toEqual({
        value: "&",
        scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[10]).toEqual({
        value: "#xb3",
        scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[11]).toEqual({
        value: ";",
        scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm"]
      });
      return expect(tokens[12]).toEqual({
        value: "___",
        scopes: ["source.gfm", "markup.bold.italic.gfm"]
      });
    });
    it("tokenizes HTML entities in strikethrough text", function() {
      var tokens;
      tokens = grammar.tokenizeLine("~~&trade; &#8482; &#xb3;~~").tokens;
      expect(tokens[0]).toEqual({
        value: "~~",
        scopes: ["source.gfm", "markup.strike.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: "&",
        scopes: ["source.gfm", "markup.strike.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[2]).toEqual({
        value: "trade",
        scopes: ["source.gfm", "markup.strike.gfm", "constant.character.entity.gfm"]
      });
      expect(tokens[3]).toEqual({
        value: ";",
        scopes: ["source.gfm", "markup.strike.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[4]).toEqual({
        value: " ",
        scopes: ["source.gfm", "markup.strike.gfm"]
      });
      expect(tokens[5]).toEqual({
        value: "&",
        scopes: ["source.gfm", "markup.strike.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[6]).toEqual({
        value: "#8482",
        scopes: ["source.gfm", "markup.strike.gfm", "constant.character.entity.gfm"]
      });
      expect(tokens[7]).toEqual({
        value: ";",
        scopes: ["source.gfm", "markup.strike.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[8]).toEqual({
        value: " ",
        scopes: ["source.gfm", "markup.strike.gfm"]
      });
      expect(tokens[9]).toEqual({
        value: "&",
        scopes: ["source.gfm", "markup.strike.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      expect(tokens[10]).toEqual({
        value: "#xb3",
        scopes: ["source.gfm", "markup.strike.gfm", "constant.character.entity.gfm"]
      });
      expect(tokens[11]).toEqual({
        value: ";",
        scopes: ["source.gfm", "markup.strike.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]
      });
      return expect(tokens[12]).toEqual({
        value: "~~",
        scopes: ["source.gfm", "markup.strike.gfm"]
      });
    });
    it("tokenizes HTML comments", function() {
      var tokens;
      tokens = grammar.tokenizeLine("<!-- a comment -->").tokens;
      expect(tokens[0]).toEqual({
        value: "<!--",
        scopes: ["source.gfm", "comment.block.gfm", "punctuation.definition.comment.gfm"]
      });
      expect(tokens[1]).toEqual({
        value: " a comment ",
        scopes: ["source.gfm", "comment.block.gfm"]
      });
      return expect(tokens[2]).toEqual({
        value: "-->",
        scopes: ["source.gfm", "comment.block.gfm", "punctuation.definition.comment.gfm"]
      });
    });
    it("tokenizes YAML front matter", function() {
      var firstLineTokens, secondLineTokens, thirdLineTokens, _ref;
      _ref = grammar.tokenizeLines("---\nfront: matter\n---"), firstLineTokens = _ref[0], secondLineTokens = _ref[1], thirdLineTokens = _ref[2];
      expect(firstLineTokens[0]).toEqual({
        value: "---",
        scopes: ["source.gfm", "front-matter.yaml.gfm", "comment.hr.gfm"]
      });
      expect(secondLineTokens[0]).toEqual({
        value: "front: matter",
        scopes: ["source.gfm", "front-matter.yaml.gfm"]
      });
      return expect(thirdLineTokens[0]).toEqual({
        value: "---",
        scopes: ["source.gfm", "front-matter.yaml.gfm", "comment.hr.gfm"]
      });
    });
    it("tokenizes linebreaks", function() {
      var tokens;
      tokens = grammar.tokenizeLine("line  ").tokens;
      expect(tokens[0]).toEqual({
        value: "line",
        scopes: ["source.gfm"]
      });
      return expect(tokens[1]).toEqual({
        value: "  ",
        scopes: ["source.gfm", "linebreak.gfm"]
      });
    });
    it("tokenizes tables", function() {
      var alignTokens, contentTokens, emptyLineTokens, headerTokens, headingTokens, _ref, _ref1;
      _ref = grammar.tokenizeLines("| Column 1  | Column 2  |\n|:----------|:---------:|\n| Content 1 | Content 2 |"), headerTokens = _ref[0], alignTokens = _ref[1], contentTokens = _ref[2];
      expect(headerTokens[0]).toEqual({
        value: "|",
        scopes: ["source.gfm", "table.gfm", "border.pipe.outer"]
      });
      expect(headerTokens[1]).toEqual({
        value: " Column 1  ",
        scopes: ["source.gfm", "table.gfm"]
      });
      expect(headerTokens[2]).toEqual({
        value: "|",
        scopes: ["source.gfm", "table.gfm", "border.pipe.inner"]
      });
      expect(headerTokens[3]).toEqual({
        value: " Column 2  ",
        scopes: ["source.gfm", "table.gfm"]
      });
      expect(headerTokens[4]).toEqual({
        value: "|",
        scopes: ["source.gfm", "table.gfm", "border.pipe.outer"]
      });
      expect(alignTokens[0]).toEqual({
        value: "|",
        scopes: ["source.gfm", "table.gfm", "border.pipe.outer"]
      });
      expect(alignTokens[1]).toEqual({
        value: ":",
        scopes: ["source.gfm", "table.gfm", "border.alignment"]
      });
      expect(alignTokens[2]).toEqual({
        value: "----------",
        scopes: ["source.gfm", "table.gfm", "border.header"]
      });
      expect(alignTokens[3]).toEqual({
        value: "|",
        scopes: ["source.gfm", "table.gfm", "border.pipe.inner"]
      });
      expect(alignTokens[4]).toEqual({
        value: ":",
        scopes: ["source.gfm", "table.gfm", "border.alignment"]
      });
      expect(alignTokens[5]).toEqual({
        value: "---------",
        scopes: ["source.gfm", "table.gfm", "border.header"]
      });
      expect(alignTokens[6]).toEqual({
        value: ":",
        scopes: ["source.gfm", "table.gfm", "border.alignment"]
      });
      expect(alignTokens[7]).toEqual({
        value: "|",
        scopes: ["source.gfm", "table.gfm", "border.pipe.outer"]
      });
      expect(contentTokens[0]).toEqual({
        value: "|",
        scopes: ["source.gfm", "table.gfm", "border.pipe.outer"]
      });
      expect(contentTokens[1]).toEqual({
        value: " Content 1 ",
        scopes: ["source.gfm", "table.gfm"]
      });
      expect(contentTokens[2]).toEqual({
        value: "|",
        scopes: ["source.gfm", "table.gfm", "border.pipe.inner"]
      });
      expect(contentTokens[3]).toEqual({
        value: " Content 2 ",
        scopes: ["source.gfm", "table.gfm"]
      });
      expect(contentTokens[4]).toEqual({
        value: "|",
        scopes: ["source.gfm", "table.gfm", "border.pipe.outer"]
      });
      _ref1 = grammar.tokenizeLines("| Column 1  | Column 2\t\n\n# Heading"), headerTokens = _ref1[0], emptyLineTokens = _ref1[1], headingTokens = _ref1[2];
      expect(headerTokens[0]).toEqual({
        value: "|",
        scopes: ["source.gfm", "table.gfm", "border.pipe.outer"]
      });
      expect(headerTokens[1]).toEqual({
        value: " Column 1  ",
        scopes: ["source.gfm", "table.gfm"]
      });
      expect(headerTokens[2]).toEqual({
        value: "|",
        scopes: ["source.gfm", "table.gfm", "border.pipe.inner"]
      });
      expect(headerTokens[3]).toEqual({
        value: " Column 2",
        scopes: ["source.gfm", "table.gfm"]
      });
      expect(headerTokens[4]).toEqual({
        value: "\t",
        scopes: ["source.gfm", "table.gfm"]
      });
      expect(headingTokens[0]).toEqual({
        value: "#",
        scopes: ["source.gfm", "markup.heading.heading-1.gfm", "markup.heading.marker.gfm"]
      });
      expect(headingTokens[1]).toEqual({
        value: " ",
        scopes: ["source.gfm", "markup.heading.heading-1.gfm", "markup.heading.space.gfm"]
      });
      return expect(headingTokens[2]).toEqual({
        value: "Heading",
        scopes: ["source.gfm", "markup.heading.heading-1.gfm"]
      });
    });
    return it("tokenizes criticmarkup", function() {
      var addToken, delToken, hlToken, subToken, _ref;
      _ref = grammar.tokenizeLines("Add{++ some text++}\nDelete{-- some text--}\nHighlight {==some text==}{>>with comment<<}\nReplace {~~this~>by that~~}"), addToken = _ref[0], delToken = _ref[1], hlToken = _ref[2], subToken = _ref[3];
      expect(addToken[0]).toEqual({
        value: "Add",
        scopes: ["source.gfm"]
      });
      expect(addToken[1]).toEqual({
        value: "{++",
        scopes: ["source.gfm", "markup.inserted.critic.gfm.addition", "punctuation.definition.inserted.critic.gfm.addition.marker"]
      });
      expect(addToken[2]).toEqual({
        value: " some text",
        scopes: ["source.gfm", "markup.inserted.critic.gfm.addition"]
      });
      expect(addToken[3]).toEqual({
        value: "++}",
        scopes: ["source.gfm", "markup.inserted.critic.gfm.addition", "punctuation.definition.inserted.critic.gfm.addition.marker"]
      });
      expect(delToken[0]).toEqual({
        value: "Delete",
        scopes: ["source.gfm"]
      });
      expect(delToken[1]).toEqual({
        value: "{--",
        scopes: ["source.gfm", "markup.deleted.critic.gfm.deletion", "punctuation.definition.deleted.critic.gfm.deletion.marker"]
      });
      expect(delToken[2]).toEqual({
        value: " some text",
        scopes: ["source.gfm", "markup.deleted.critic.gfm.deletion"]
      });
      expect(delToken[3]).toEqual({
        value: "--}",
        scopes: ["source.gfm", "markup.deleted.critic.gfm.deletion", "punctuation.definition.deleted.critic.gfm.deletion.marker"]
      });
      expect(hlToken[0]).toEqual({
        value: "Highlight ",
        scopes: ["source.gfm"]
      });
      expect(hlToken[1]).toEqual({
        value: "{==",
        scopes: ["source.gfm", "critic.gfm.highlight", "critic.gfm.highlight.marker"]
      });
      expect(hlToken[2]).toEqual({
        value: "some text",
        scopes: ["source.gfm", "critic.gfm.highlight"]
      });
      expect(hlToken[3]).toEqual({
        value: "==}",
        scopes: ["source.gfm", "critic.gfm.highlight", "critic.gfm.highlight.marker"]
      });
      expect(hlToken[4]).toEqual({
        value: "{>>",
        scopes: ["source.gfm", "critic.gfm.comment", "critic.gfm.comment.marker"]
      });
      expect(hlToken[5]).toEqual({
        value: "with comment",
        scopes: ["source.gfm", "critic.gfm.comment"]
      });
      expect(hlToken[6]).toEqual({
        value: "<<}",
        scopes: ["source.gfm", "critic.gfm.comment", "critic.gfm.comment.marker"]
      });
      expect(subToken[0]).toEqual({
        value: "Replace ",
        scopes: ["source.gfm"]
      });
      expect(subToken[1]).toEqual({
        value: "{~~",
        scopes: ["source.gfm", "markup.changed.critic.gfm.substitution", "punctuation.definition.changed.critic.gfm.substitution.marker"]
      });
      expect(subToken[2]).toEqual({
        value: "this",
        scopes: ["source.gfm", "markup.changed.critic.gfm.substitution"]
      });
      expect(subToken[3]).toEqual({
        value: "~>",
        scopes: ["source.gfm", "markup.changed.critic.gfm.substitution", "punctuation.definition.changed.critic.gfm.substitution.operator"]
      });
      expect(subToken[4]).toEqual({
        value: "by that",
        scopes: ["source.gfm", "markup.changed.critic.gfm.substitution"]
      });
      return expect(subToken[5]).toEqual({
        value: "~~}",
        scopes: ["source.gfm", "markup.changed.critic.gfm.substitution", "punctuation.definition.changed.critic.gfm.substitution.marker"]
      });
    });
  });

}).call(this);