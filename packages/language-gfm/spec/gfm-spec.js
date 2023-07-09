
describe("GitHub Flavored Markdown grammar", function() {
  let grammar = null;

  beforeEach(function() {
    waitsForPromise(() => atom.packages.activatePackage("language-gfm"));

    runs(() => grammar = atom.grammars.grammarForScopeName("source.gfm"));
  });

  it("parses the grammar", function() {
    expect(grammar).toBeDefined();
    expect(grammar.scopeName).toBe("source.gfm");
  });

  it("tokenizes spaces", function() {
    const {tokens} = grammar.tokenizeLine(" ");
    expect(tokens[0]).toEqual({value: " ", scopes: ["source.gfm"]});
});

  it("tokenizes horizontal rules", function() {
    let {tokens} = grammar.tokenizeLine("***");
    expect(tokens[0]).toEqual({value: "***", scopes: ["source.gfm", "comment.hr.gfm"]});

    ({tokens} = grammar.tokenizeLine("---"));
    expect(tokens[0]).toEqual({value: "---", scopes: ["source.gfm", "comment.hr.gfm"]});

    ({tokens} = grammar.tokenizeLine("___"));
    expect(tokens[0]).toEqual({value: "___", scopes: ["source.gfm", "comment.hr.gfm"]});
});

  it("tokenizes escaped characters", function() {
    let {tokens} = grammar.tokenizeLine("\\*");
    expect(tokens[0]).toEqual({value: "\\*", scopes: ["source.gfm", "constant.character.escape.gfm"]});

    ({tokens} = grammar.tokenizeLine("\\\\"));
    expect(tokens[0]).toEqual({value: "\\\\", scopes: ["source.gfm", "constant.character.escape.gfm"]});

    ({tokens} = grammar.tokenizeLine("\\abc"));
    expect(tokens[0]).toEqual({value: "\\a", scopes: ["source.gfm", "constant.character.escape.gfm"]});
    expect(tokens[1]).toEqual({value: "bc", scopes: ["source.gfm"]});
});

  it("tokenizes ***bold italic*** text", function() {
    const {tokens} = grammar.tokenizeLine("this is ***bold italic*** text");
    expect(tokens[0]).toEqual({value: "this is ", scopes: ["source.gfm"]});
    expect(tokens[1]).toEqual({value: "***", scopes: ["source.gfm", "markup.bold.italic.gfm"]});
    expect(tokens[2]).toEqual({value: "bold italic", scopes: ["source.gfm", "markup.bold.italic.gfm"]});
    expect(tokens[3]).toEqual({value: "***", scopes: ["source.gfm", "markup.bold.italic.gfm"]});
    expect(tokens[4]).toEqual({value: " text", scopes: ["source.gfm"]});

    const [firstLineTokens, secondLineTokens] = Array.from(grammar.tokenizeLines("this is ***bold\nitalic***!"));
    expect(firstLineTokens[0]).toEqual({value: "this is ", scopes: ["source.gfm"]});
    expect(firstLineTokens[1]).toEqual({value: "***", scopes: ["source.gfm", "markup.bold.italic.gfm"]});
    expect(firstLineTokens[2]).toEqual({value: "bold", scopes: ["source.gfm", "markup.bold.italic.gfm"]});
    expect(secondLineTokens[0]).toEqual({value: "italic", scopes: ["source.gfm", "markup.bold.italic.gfm"]});
    expect(secondLineTokens[1]).toEqual({value: "***", scopes: ["source.gfm", "markup.bold.italic.gfm"]});
    expect(secondLineTokens[2]).toEqual({value: "!", scopes: ["source.gfm"]});
});

  it("tokenizes ___bold italic___ text", function() {
    const {tokens} = grammar.tokenizeLine("this is ___bold italic___ text");
    expect(tokens[0]).toEqual({value: "this is ", scopes: ["source.gfm"]});
    expect(tokens[1]).toEqual({value: "___", scopes: ["source.gfm", "markup.bold.italic.gfm"]});
    expect(tokens[2]).toEqual({value: "bold italic", scopes: ["source.gfm", "markup.bold.italic.gfm"]});
    expect(tokens[3]).toEqual({value: "___", scopes: ["source.gfm", "markup.bold.italic.gfm"]});
    expect(tokens[4]).toEqual({value: " text", scopes: ["source.gfm"]});

    const [firstLineTokens, secondLineTokens] = Array.from(grammar.tokenizeLines("this is ___bold\nitalic___!"));
    expect(firstLineTokens[0]).toEqual({value: "this is ", scopes: ["source.gfm"]});
    expect(firstLineTokens[1]).toEqual({value: "___", scopes: ["source.gfm", "markup.bold.italic.gfm"]});
    expect(firstLineTokens[2]).toEqual({value: "bold", scopes: ["source.gfm", "markup.bold.italic.gfm"]});
    expect(secondLineTokens[0]).toEqual({value: "italic", scopes: ["source.gfm", "markup.bold.italic.gfm"]});
    expect(secondLineTokens[1]).toEqual({value: "___", scopes: ["source.gfm", "markup.bold.italic.gfm"]});
    expect(secondLineTokens[2]).toEqual({value: "!", scopes: ["source.gfm"]});
});

  it("tokenizes **bold** text", function() {
    let {tokens} = grammar.tokenizeLine("**bold**");
    expect(tokens[0]).toEqual({value: "**", scopes: ["source.gfm", "markup.bold.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[1]).toEqual({value: "bold", scopes: ["source.gfm", "markup.bold.gfm"]});
    expect(tokens[2]).toEqual({value: "**", scopes: ["source.gfm", "markup.bold.gfm", "punctuation.definition.entity.gfm"]});

    const [firstLineTokens, secondLineTokens] = Array.from(grammar.tokenizeLines("this is **not\nbold**!"));
    expect(firstLineTokens[0]).toEqual({value: "this is **not", scopes: ["source.gfm"]});
    expect(secondLineTokens[0]).toEqual({value: "bold**!", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine("not**bold**"));
    expect(tokens[0]).toEqual({value: "not", scopes: ["source.gfm"]});
    expect(tokens[1]).toEqual({value: "**", scopes: ["source.gfm", "markup.bold.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[2]).toEqual({value: "bold", scopes: ["source.gfm", "markup.bold.gfm"]});
    expect(tokens[3]).toEqual({value: "**", scopes: ["source.gfm", "markup.bold.gfm", "punctuation.definition.entity.gfm"]});
});

  it("tokenizes __bold__ text", function() {
    let {tokens} = grammar.tokenizeLine("____");
    expect(tokens[0]).toEqual({value: "____", scopes: ["source.gfm", "comment.hr.gfm"]});

    ({tokens} = grammar.tokenizeLine("__bold__"));
    expect(tokens[0]).toEqual({value: "__", scopes: [ 'source.gfm', 'markup.bold.gfm', 'punctuation.definition.entity.gfm' ]});
    expect(tokens[1]).toEqual({value: "bold", scopes: ["source.gfm", "markup.bold.gfm"]});
    expect(tokens[2]).toEqual({value: "__", scopes: [ 'source.gfm', 'markup.bold.gfm', 'punctuation.definition.entity.gfm' ]});

    const [firstLineTokens, secondLineTokens] = Array.from(grammar.tokenizeLines("this is __not\nbold__!"));
    expect(firstLineTokens[0]).toEqual({value: "this is __not", scopes: ["source.gfm"]});
    expect(secondLineTokens[0]).toEqual({value: "bold__!", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine("not__bold__"));
    expect(tokens[0]).toEqual({value: "not__bold__", scopes: ["source.gfm"]});
});

  it("tokenizes *italic* text", function() {
    let {tokens} = grammar.tokenizeLine("**");
    expect(tokens[0]).toEqual({value: "**", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine("this is *italic* text"));
    expect(tokens[0]).toEqual({value: "this is ", scopes: ["source.gfm"]});
    expect(tokens[1]).toEqual({value: "*", scopes: [ "source.gfm", "markup.italic.gfm", "punctuation.definition.entity.gfm" ]});
    expect(tokens[2]).toEqual({value: "italic", scopes: ["source.gfm", "markup.italic.gfm"]});
    expect(tokens[3]).toEqual({value: "*", scopes: [ "source.gfm", "markup.italic.gfm", "punctuation.definition.entity.gfm" ]});
    expect(tokens[4]).toEqual({value: " text", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine("is*italic*"));
    expect(tokens[0]).toEqual({value: "is", scopes: ["source.gfm"]});
    expect(tokens[1]).toEqual({value: "*", scopes: [ "source.gfm", "markup.italic.gfm", "punctuation.definition.entity.gfm" ]});
    expect(tokens[2]).toEqual({value: "italic", scopes: ["source.gfm", "markup.italic.gfm"]});
    expect(tokens[3]).toEqual({value: "*", scopes: [ "source.gfm", "markup.italic.gfm", "punctuation.definition.entity.gfm" ]});

    ({tokens} = grammar.tokenizeLine("* not italic"));
    expect(tokens[0]).toEqual({value: "*", scopes: ["source.gfm", "variable.unordered.list.gfm"]});
    expect(tokens[1]).toEqual({value: " ", scopes: ["source.gfm"]});
    expect(tokens[2]).toEqual({value: "not italic", scopes: ["source.gfm"]});

    const [firstLineTokens, secondLineTokens] = Array.from(grammar.tokenizeLines("this is *not\nitalic*!"));
    expect(firstLineTokens[0]).toEqual({value: "this is *not", scopes: ["source.gfm"]});
    expect(secondLineTokens[0]).toEqual({value: "italic*!", scopes: ["source.gfm"]});
});

  it("tokenizes _italic_ text", function() {
    let {tokens} = grammar.tokenizeLine("__");
    expect(tokens[0]).toEqual({value: "__", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine("this is _italic_ text"));
    expect(tokens[0]).toEqual({value: "this is ", scopes: ["source.gfm"]});
    expect(tokens[1]).toEqual({value: "_", scopes: [ 'source.gfm', 'markup.italic.gfm', 'punctuation.definition.entity.gfm' ]});
    expect(tokens[2]).toEqual({value: "italic", scopes: ["source.gfm", "markup.italic.gfm"]});
    expect(tokens[3]).toEqual({value: "_", scopes: [ 'source.gfm', 'markup.italic.gfm', 'punctuation.definition.entity.gfm' ]});
    expect(tokens[4]).toEqual({value: " text", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine("not_italic_"));
    expect(tokens[0]).toEqual({value: "not_italic_", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine("not x^{a}_m y^{b}_n italic"));
    expect(tokens[0]).toEqual({value: "not x^{a}_m y^{b}_n italic", scopes: ["source.gfm"]});

    const [firstLineTokens, secondLineTokens] = Array.from(grammar.tokenizeLines("this is _not\nitalic_!"));
    expect(firstLineTokens[0]).toEqual({value: "this is _not", scopes: ["source.gfm"]});
    expect(secondLineTokens[0]).toEqual({value: "italic_!", scopes: ["source.gfm"]});
});

  it("tokenizes ~~strike~~ text", function() {
    let {tokens} = grammar.tokenizeLine("~~strike~~");
    expect(tokens[0]).toEqual({value: "~~", scopes: ["source.gfm", "markup.strike.gfm"]});
    expect(tokens[1]).toEqual({value: "strike", scopes: ["source.gfm", "markup.strike.gfm"]});
    expect(tokens[2]).toEqual({value: "~~", scopes: ["source.gfm", "markup.strike.gfm"]});

    const [firstLineTokens, secondLineTokens] = Array.from(grammar.tokenizeLines("this is ~~str\nike~~!"));
    expect(firstLineTokens[0]).toEqual({value: "this is ", scopes: ["source.gfm"]});
    expect(firstLineTokens[1]).toEqual({value: "~~", scopes: ["source.gfm", "markup.strike.gfm"]});
    expect(firstLineTokens[2]).toEqual({value: "str", scopes: ["source.gfm", "markup.strike.gfm"]});
    expect(secondLineTokens[0]).toEqual({value: "ike", scopes: ["source.gfm", "markup.strike.gfm"]});
    expect(secondLineTokens[1]).toEqual({value: "~~", scopes: ["source.gfm", "markup.strike.gfm"]});
    expect(secondLineTokens[2]).toEqual({value: "!", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine("not~~strike~~"));
    expect(tokens[0]).toEqual({value: "not~~strike~~", scopes: ["source.gfm"]});
});

  it("tokenizes headings", function() {
    let {tokens} = grammar.tokenizeLine("# Heading 1");
    expect(tokens[0]).toEqual({value: "#", scopes: ["source.gfm", "markup.heading.heading-1.gfm", "markup.heading.marker.gfm"]});
    expect(tokens[1]).toEqual({value: " ", scopes: ["source.gfm", "markup.heading.heading-1.gfm", "markup.heading.space.gfm"]});
    expect(tokens[2]).toEqual({value: "Heading 1", scopes: ["source.gfm", "markup.heading.heading-1.gfm"]});

    ({tokens} = grammar.tokenizeLine("## Heading 2"));
    expect(tokens[0]).toEqual({value: "##", scopes: ["source.gfm", "markup.heading.heading-2.gfm", "markup.heading.marker.gfm"]});
    expect(tokens[1]).toEqual({value: " ", scopes: ["source.gfm", "markup.heading.heading-2.gfm", "markup.heading.space.gfm"]});
    expect(tokens[2]).toEqual({value: "Heading 2", scopes: ["source.gfm", "markup.heading.heading-2.gfm"]});

    ({tokens} = grammar.tokenizeLine("### Heading 3"));
    expect(tokens[0]).toEqual({value: "###", scopes: ["source.gfm", "markup.heading.heading-3.gfm", "markup.heading.marker.gfm"]});
    expect(tokens[1]).toEqual({value: " ", scopes: ["source.gfm", "markup.heading.heading-3.gfm", "markup.heading.space.gfm"]});
    expect(tokens[2]).toEqual({value: "Heading 3", scopes: ["source.gfm", "markup.heading.heading-3.gfm"]});

    ({tokens} = grammar.tokenizeLine("#### Heading 4"));
    expect(tokens[0]).toEqual({value: "####", scopes: ["source.gfm", "markup.heading.heading-4.gfm", "markup.heading.marker.gfm"]});
    expect(tokens[1]).toEqual({value: " ", scopes: ["source.gfm", "markup.heading.heading-4.gfm", "markup.heading.space.gfm"]});
    expect(tokens[2]).toEqual({value: "Heading 4", scopes: ["source.gfm", "markup.heading.heading-4.gfm"]});

    ({tokens} = grammar.tokenizeLine("##### Heading 5"));
    expect(tokens[0]).toEqual({value: "#####", scopes: ["source.gfm", "markup.heading.heading-5.gfm", "markup.heading.marker.gfm"]});
    expect(tokens[1]).toEqual({value: " ", scopes: ["source.gfm", "markup.heading.heading-5.gfm", "markup.heading.space.gfm"]});
    expect(tokens[2]).toEqual({value: "Heading 5", scopes: ["source.gfm", "markup.heading.heading-5.gfm"]});

    ({tokens} = grammar.tokenizeLine("###### Heading 6"));
    expect(tokens[0]).toEqual({value: "######", scopes: ["source.gfm", "markup.heading.heading-6.gfm", "markup.heading.marker.gfm"]});
    expect(tokens[1]).toEqual({value: " ", scopes: ["source.gfm", "markup.heading.heading-6.gfm", "markup.heading.space.gfm"]});
    expect(tokens[2]).toEqual({value: "Heading 6", scopes: ["source.gfm", "markup.heading.heading-6.gfm"]});
});

  it("tokenizes matches inside of headers", function() {
    const {tokens} = grammar.tokenizeLine("# Heading :one:");
    expect(tokens[0]).toEqual({value: "#", scopes: ["source.gfm", "markup.heading.heading-1.gfm", "markup.heading.marker.gfm"]});
    expect(tokens[1]).toEqual({value: " ", scopes: ["source.gfm", "markup.heading.heading-1.gfm", "markup.heading.space.gfm"]});
    expect(tokens[2]).toEqual({value: "Heading ", scopes: ["source.gfm", "markup.heading.heading-1.gfm"]});
    expect(tokens[3]).toEqual({value: ":", scopes: ["source.gfm", "markup.heading.heading-1.gfm", "string.emoji.gfm", "string.emoji.start.gfm"]});
    expect(tokens[4]).toEqual({value: "one", scopes: ["source.gfm", "markup.heading.heading-1.gfm", "string.emoji.gfm", "string.emoji.word.gfm"]});
    expect(tokens[5]).toEqual({value: ":", scopes: ["source.gfm", "markup.heading.heading-1.gfm", "string.emoji.gfm", "string.emoji.end.gfm"]});
});

  it("tokenizes an :emoji:", function() {
    let {tokens} = grammar.tokenizeLine("this is :no_good:");
    expect(tokens[0]).toEqual({value: "this is ", scopes: ["source.gfm"]});
    expect(tokens[1]).toEqual({value: ":", scopes: ["source.gfm", "string.emoji.gfm", "string.emoji.start.gfm"]});
    expect(tokens[2]).toEqual({value: "no_good", scopes: ["source.gfm", "string.emoji.gfm", "string.emoji.word.gfm"]});
    expect(tokens[3]).toEqual({value: ":", scopes: ["source.gfm", "string.emoji.gfm", "string.emoji.end.gfm"]});

    ({tokens} = grammar.tokenizeLine("this is :no good:"));
    expect(tokens[0]).toEqual({value: "this is :no good:", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine("http://localhost:8080"));
    expect(tokens[0]).toEqual({value: "http://localhost:8080", scopes: ["source.gfm"]});
});

  it("tokenizes a ``` code block", function() {
    let {tokens, ruleStack} = grammar.tokenizeLine("```");
    expect(tokens[0]).toEqual({value: "```", scopes: ["source.gfm", "markup.raw.gfm", "support.gfm"]});
    ({tokens, ruleStack} = grammar.tokenizeLine("-> 'hello'", ruleStack));
    expect(tokens[0]).toEqual({value: "-> 'hello'", scopes: ["source.gfm", "markup.raw.gfm"]});
    ({tokens} = grammar.tokenizeLine("```", ruleStack));
    expect(tokens[0]).toEqual({value: "```", scopes: ["source.gfm", "markup.raw.gfm", "support.gfm"]});
});

  it("tokenizes a ~~~ code block", function() {
    let {tokens, ruleStack} = grammar.tokenizeLine("~~~");
    expect(tokens[0]).toEqual({value: "~~~", scopes: ["source.gfm", "markup.raw.gfm", "support.gfm"]});
    ({tokens, ruleStack} = grammar.tokenizeLine("-> 'hello'", ruleStack));
    expect(tokens[0]).toEqual({value: "-> 'hello'", scopes: ["source.gfm", "markup.raw.gfm"]});
    ({tokens} = grammar.tokenizeLine("~~~", ruleStack));
    expect(tokens[0]).toEqual({value: "~~~", scopes: ["source.gfm", "markup.raw.gfm", "support.gfm"]});
});

  it("doesn't tokenise ~`~ as a code block", function() {
    const {tokens} = grammar.tokenizeLine("~`~");
    expect(tokens[0]).toEqual({value: '~', scopes: ['source.gfm']});
    expect(tokens[1]).toEqual({value: '`', scopes: ['source.gfm', 'markup.raw.gfm']});
    expect(tokens[2]).toEqual({value: '~', scopes: ['source.gfm', 'markup.raw.gfm']});
});

  it("tokenises code-blocks with borders of differing lengths", function() {
    let [firstLineTokens, secondLineTokens, thirdLineTokens] = Array.from(grammar.tokenizeLines("~~~\nfoo bar\n~~~~~~~"));
    expect(firstLineTokens[0]).toEqual({value: '~~~', scopes: ['source.gfm', 'markup.raw.gfm', 'support.gfm']});
    expect(secondLineTokens[0]).toEqual({value: 'foo bar', scopes: ['source.gfm', 'markup.raw.gfm']});
    expect(thirdLineTokens[0]).toEqual({value: '~~~~~~~', scopes: ['source.gfm', 'markup.raw.gfm', 'support.gfm']});

    [firstLineTokens, secondLineTokens, thirdLineTokens] = Array.from(grammar.tokenizeLines("~~~~~~~\nfoo bar\n~~~"));
    expect(firstLineTokens[0]).toEqual({value: '~~~~~~~', scopes: ['source.gfm', 'markup.raw.gfm', 'support.gfm']});
    expect(secondLineTokens[0]).toEqual({value: 'foo bar', scopes: ['source.gfm', 'markup.raw.gfm']});
    expect(thirdLineTokens[0]).toEqual({value: '~~~', scopes: ['source.gfm', 'markup.raw.gfm']});
});

  it("tokenizes a ``` code block with trailing whitespace", function() {
    let {tokens, ruleStack} = grammar.tokenizeLine("```");
    expect(tokens[0]).toEqual({value: "```", scopes: ["source.gfm", "markup.raw.gfm", "support.gfm"]});
    ({tokens, ruleStack} = grammar.tokenizeLine("-> 'hello'", ruleStack));
    expect(tokens[0]).toEqual({value: "-> 'hello'", scopes: ["source.gfm", "markup.raw.gfm"]});
    ({tokens} = grammar.tokenizeLine("```  ", ruleStack));
    expect(tokens[0]).toEqual({value: "```  ", scopes: ["source.gfm", "markup.raw.gfm", "support.gfm"]});
});

  it("tokenizes a ~~~ code block with trailing whitespace", function() {
    let {tokens, ruleStack} = grammar.tokenizeLine("~~~");
    expect(tokens[0]).toEqual({value: "~~~", scopes: ["source.gfm", "markup.raw.gfm", "support.gfm"]});
    ({tokens, ruleStack} = grammar.tokenizeLine("-> 'hello'", ruleStack));
    expect(tokens[0]).toEqual({value: "-> 'hello'", scopes: ["source.gfm", "markup.raw.gfm"]});
    ({tokens} = grammar.tokenizeLine("~~~  ", ruleStack));
    expect(tokens[0]).toEqual({value: "~~~  ", scopes: ["source.gfm", "markup.raw.gfm", "support.gfm"]});
});

  it("tokenises a ``` code block with an unknown language", function() {
    let {tokens, ruleStack} = grammar.tokenizeLine("``` myLanguage");
    expect(tokens[0]).toEqual({value: '``` myLanguage', scopes: ['source.gfm', 'markup.code.other.gfm', 'support.gfm']});

    ({tokens, ruleStack} = grammar.tokenizeLine("-> 'hello'", ruleStack));
    expect(tokens[0]).toEqual({value: "-> 'hello'", scopes: ['source.gfm', 'markup.code.other.gfm', 'source.embedded.mylanguage']});

    ({tokens} = grammar.tokenizeLine("```", ruleStack));
    expect(tokens[0]).toEqual({value: '```', scopes: ['source.gfm', 'markup.code.other.gfm', 'support.gfm']});
});

  it("tokenizes a ``` code block with a known language", function() {
    let {tokens, ruleStack} = grammar.tokenizeLine("```  bash");
    expect(tokens[0]).toEqual({value: "```  bash", scopes: ["source.gfm", "markup.code.shell.gfm",  "support.gfm"]});
    expect(ruleStack[1].contentScopeName).toBe("source.embedded.shell");

    ({tokens, ruleStack} = grammar.tokenizeLine("```js  "));
    expect(tokens[0]).toEqual({value: "```js  ", scopes: ["source.gfm", "markup.code.js.gfm",  "support.gfm"]});
    expect(ruleStack[1].contentScopeName).toBe("source.embedded.js");

    ({tokens, ruleStack} = grammar.tokenizeLine("```JS  "));
    expect(tokens[0]).toEqual({value: "```JS  ", scopes: ["source.gfm", "markup.code.js.gfm",  "support.gfm"]});
    expect(ruleStack[1].contentScopeName).toBe("source.embedded.js");

    ({tokens, ruleStack} = grammar.tokenizeLine("```r  "));
    expect(tokens[0]).toEqual({value: "```r  ", scopes: ["source.gfm", "markup.code.r.gfm",  "support.gfm"]});
    expect(ruleStack[1].contentScopeName).toBe("source.embedded.r");

    ({tokens, ruleStack} = grammar.tokenizeLine("```properties  "));
    expect(tokens[0]).toEqual({value: "```properties  ", scopes: ["source.gfm", "markup.code.git-config.gfm",  "support.gfm"]});
    expect(ruleStack[1].contentScopeName).toBe("source.embedded.git-config");
  });

  it("tokenizes a Rmarkdown ``` code block", function() {
    let {tokens, ruleStack} = grammar.tokenizeLine("```{r}");
    expect(tokens[0]).toEqual({value: "```{r}", scopes: ["source.gfm", "markup.code.r.gfm", "support.gfm"]});
    expect(ruleStack[1].contentScopeName).toBe("source.embedded.r");

    ({tokens, ruleStack} = grammar.tokenizeLine("```{r,eval=TRUE,cache=FALSE}"));
    expect(tokens[0]).toEqual({value: "```{r,eval=TRUE,cache=FALSE}", scopes: ["source.gfm", "markup.code.r.gfm", "support.gfm"]});
    expect(ruleStack[1].contentScopeName).toBe("source.embedded.r");

    ({tokens, ruleStack} = grammar.tokenizeLine("```{r eval=TRUE,cache=FALSE}"));
    expect(tokens[0]).toEqual({value: "```{r eval=TRUE,cache=FALSE}", scopes: ["source.gfm", "markup.code.r.gfm", "support.gfm"]});
    expect(ruleStack[1].contentScopeName).toBe("source.embedded.r");
  });

  it("tokenizes a Rmarkdown ``` code block with whitespace", function() {
    let {tokens, ruleStack} = grammar.tokenizeLine("```{r   }");
    expect(tokens[0]).toEqual({value: "```{r   }", scopes: ["source.gfm", "markup.code.r.gfm", "support.gfm"]});
    expect(ruleStack[1].contentScopeName).toBe("source.embedded.r");

    ({tokens, ruleStack} = grammar.tokenizeLine("```{R }    "));
    expect(tokens[0]).toEqual({value: "```{R }    ", scopes: ["source.gfm", "markup.code.r.gfm", "support.gfm"]});
    expect(ruleStack[1].contentScopeName).toBe("source.embedded.r");

    ({tokens, ruleStack} = grammar.tokenizeLine("```{r eval = TRUE, cache = FALSE}"));
    expect(tokens[0]).toEqual({value: "```{r eval = TRUE, cache = FALSE}", scopes: ["source.gfm", "markup.code.r.gfm", "support.gfm"]});
    expect(ruleStack[1].contentScopeName).toBe("source.embedded.r");
  });

  it("tokenizes a ~~~ code block with a language", function() {
    let {tokens, ruleStack} = grammar.tokenizeLine("~~~  bash");
    expect(tokens[0]).toEqual({value: "~~~  bash", scopes: ["source.gfm", "markup.code.shell.gfm",  "support.gfm"]});
    expect(ruleStack[1].contentScopeName).toBe("source.embedded.shell");

    ({tokens, ruleStack} = grammar.tokenizeLine("~~~js  "));
    expect(tokens[0]).toEqual({value: "~~~js  ", scopes: ["source.gfm", "markup.code.js.gfm",  "support.gfm"]});
    expect(ruleStack[1].contentScopeName).toBe("source.embedded.js");

    ({tokens, ruleStack} = grammar.tokenizeLine("~~~properties  "));
    expect(tokens[0]).toEqual({value: "~~~properties  ", scopes: ["source.gfm", "markup.code.git-config.gfm", "support.gfm"]});
    expect(ruleStack[1].contentScopeName).toBe("source.embedded.git-config");
  });

  it("tokenizes a ``` code block with a language and trailing whitespace", function() {
    let {tokens, ruleStack} = grammar.tokenizeLine("```  bash");
    ({tokens} = grammar.tokenizeLine("```  ", ruleStack));
    expect(tokens[0]).toEqual({value: "```  ", scopes: ["source.gfm", "markup.code.shell.gfm", "support.gfm"]});
    expect(ruleStack[1].contentScopeName).toBe("source.embedded.shell");

    ({tokens, ruleStack} = grammar.tokenizeLine("```js  "));
    ({tokens} = grammar.tokenizeLine("```  ", ruleStack));
    expect(tokens[0]).toEqual({value: "```  ", scopes: ["source.gfm", "markup.code.js.gfm", "support.gfm"]});
    expect(ruleStack[1].contentScopeName).toBe("source.embedded.js");
  });

  it("tokenizes a ~~~ code block with a language and trailing whitespace", function() {
    let {tokens, ruleStack} = grammar.tokenizeLine("~~~  bash");
    ({tokens} = grammar.tokenizeLine("~~~  ", ruleStack));
    expect(tokens[0]).toEqual({value: "~~~  ", scopes: ["source.gfm", "markup.code.shell.gfm", "support.gfm"]});
    expect(ruleStack[1].contentScopeName).toBe("source.embedded.shell");

    ({tokens, ruleStack} = grammar.tokenizeLine("~~~js  "));
    ({tokens} = grammar.tokenizeLine("~~~  ", ruleStack));
    expect(tokens[0]).toEqual({value: "~~~  ", scopes: ["source.gfm", "markup.code.js.gfm", "support.gfm"]});
    expect(ruleStack[1].contentScopeName).toBe("source.embedded.js");

    ({tokens, ruleStack} = grammar.tokenizeLine("~~~ properties  "));
    ({tokens} = grammar.tokenizeLine("~~~  ", ruleStack));
    expect(tokens[0]).toEqual({value: "~~~  ", scopes: ["source.gfm", "markup.code.git-config.gfm", "support.gfm"]});
    expect(ruleStack[1].contentScopeName).toBe("source.embedded.git-config");
  });

  it("tokenizes inline `code` blocks", function() {
    let {tokens} = grammar.tokenizeLine("`this` is `code`");
    expect(tokens[0]).toEqual({value: "`", scopes: ["source.gfm", "markup.raw.gfm"]});
    expect(tokens[1]).toEqual({value: "this", scopes: ["source.gfm", "markup.raw.gfm"]});
    expect(tokens[2]).toEqual({value: "`", scopes: ["source.gfm", "markup.raw.gfm"]});
    expect(tokens[3]).toEqual({value: " is ", scopes: ["source.gfm"]});
    expect(tokens[4]).toEqual({value: "`", scopes: ["source.gfm", "markup.raw.gfm"]});
    expect(tokens[5]).toEqual({value: "code", scopes: ["source.gfm", "markup.raw.gfm"]});
    expect(tokens[6]).toEqual({value: "`", scopes: ["source.gfm", "markup.raw.gfm"]});

    ({tokens} = grammar.tokenizeLine("``"));
    expect(tokens[0]).toEqual({value: "`", scopes: ["source.gfm", "markup.raw.gfm"]});
    expect(tokens[1]).toEqual({value: "`", scopes: ["source.gfm", "markup.raw.gfm"]});

    ({tokens} = grammar.tokenizeLine("``a\\`b``"));
    expect(tokens[0]).toEqual({value: "``", scopes: ["source.gfm", "markup.raw.gfm"]});
    expect(tokens[1]).toEqual({value: "a\\`b", scopes: ["source.gfm", "markup.raw.gfm"]});
    expect(tokens[2]).toEqual({value: "``", scopes: ["source.gfm", "markup.raw.gfm"]});
});

  it("tokenizes [links](links)", function() {
    const {tokens} = grammar.tokenizeLine("please click [this link](website)");
    expect(tokens[0]).toEqual({value: "please click ", scopes: ["source.gfm"]});
    expect(tokens[1]).toEqual({value: "[", scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]});
    expect(tokens[2]).toEqual({value: "this link", scopes: ["source.gfm", "link", "entity.gfm"]});
    expect(tokens[3]).toEqual({value: "]", scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]});
    expect(tokens[4]).toEqual({value: "(", scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]});
    expect(tokens[5]).toEqual({value: "website", scopes: ["source.gfm", "link", "markup.underline.link.gfm"]});
    expect(tokens[6]).toEqual({value: ")", scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]});
});

  it("tokenizes reference [links][links]", function() {
    const {tokens} = grammar.tokenizeLine("please click [this link][website]");
    expect(tokens[0]).toEqual({value: "please click ", scopes: ["source.gfm"]});
    expect(tokens[1]).toEqual({value: "[", scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]});
    expect(tokens[2]).toEqual({value: "this link", scopes: ["source.gfm", "link", "entity.gfm"]});
    expect(tokens[3]).toEqual({value: "]", scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]});
    expect(tokens[4]).toEqual({value: "[", scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]});
    expect(tokens[5]).toEqual({value: "website", scopes: ["source.gfm", "link", "markup.underline.link.gfm"]});
    expect(tokens[6]).toEqual({value: "]", scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]});
});

  it("tokenizes id-less reference [links][]", function() {
    const {tokens} = grammar.tokenizeLine("please click [this link][]");
    expect(tokens[0]).toEqual({value: "please click ", scopes: ["source.gfm"]});
    expect(tokens[1]).toEqual({value: "[", scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]});
    expect(tokens[2]).toEqual({value: "this link", scopes: ["source.gfm", "link", "entity.gfm"]});
    expect(tokens[3]).toEqual({value: "]", scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]});
    expect(tokens[4]).toEqual({value: "[", scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]});
    expect(tokens[5]).toEqual({value: "]", scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]});
});

  it("tokenizes [link]: footers", function() {
    const {tokens} = grammar.tokenizeLine("[aLink]: http://website");
    expect(tokens[0]).toEqual({value: "[", scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]});
    expect(tokens[1]).toEqual({value: "aLink", scopes: ["source.gfm", "link", "entity.gfm"]});
    expect(tokens[2]).toEqual({value: "]", scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]});
    expect(tokens[3]).toEqual({value: ":", scopes: ["source.gfm", "link", "punctuation.separator.key-value.gfm"]});
    expect(tokens[4]).toEqual({value: " ", scopes: ["source.gfm", "link"]});
    expect(tokens[5]).toEqual({value: "http://website", scopes: ["source.gfm", "link", "markup.underline.link.gfm"]});
});

  it("tokenizes [link]: <footers>", function() {
    const {tokens} = grammar.tokenizeLine("[aLink]: <http://website>");
    expect(tokens[0]).toEqual({value: "[", scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]});
    expect(tokens[1]).toEqual({value: "aLink", scopes: ["source.gfm", "link", "entity.gfm"]});
    expect(tokens[2]).toEqual({value: "]", scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]});
    expect(tokens[3]).toEqual({value: ": <", scopes: ["source.gfm", "link"]});
    expect(tokens[4]).toEqual({value: "http://website", scopes: ["source.gfm", "link", "markup.underline.link.gfm"]});
    expect(tokens[5]).toEqual({value: ">", scopes: ["source.gfm", "link"]});
});

  it("tokenizes [![links](links)](links)", function() {
    const {tokens} = grammar.tokenizeLine("[![title](image)](link)");
    expect(tokens[0]).toEqual({value: "[!", scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]});
    expect(tokens[1]).toEqual({value: "[", scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]});
    expect(tokens[2]).toEqual({value: "title", scopes: ["source.gfm", "link", "entity.gfm"]});
    expect(tokens[3]).toEqual({value: "]", scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]});
    expect(tokens[4]).toEqual({value: "(", scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]});
    expect(tokens[5]).toEqual({value: "image", scopes: ["source.gfm", "link", "markup.underline.link.gfm"]});
    expect(tokens[6]).toEqual({value: ")", scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]});
    expect(tokens[7]).toEqual({value: "]", scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]});
    expect(tokens[8]).toEqual({value: "(", scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]});
    expect(tokens[9]).toEqual({value: "link", scopes: ["source.gfm", "link", "markup.underline.link.gfm"]});
    expect(tokens[10]).toEqual({value: ")", scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]});
});

  it("tokenizes [![links](links)][links]", function() {
    const {tokens} = grammar.tokenizeLine("[![title](image)][link]");
    expect(tokens[0]).toEqual({value: "[!", scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]});
    expect(tokens[1]).toEqual({value: "[", scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]});
    expect(tokens[2]).toEqual({value: "title", scopes: ["source.gfm", "link", "entity.gfm"]});
    expect(tokens[3]).toEqual({value: "]", scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]});
    expect(tokens[4]).toEqual({value: "(", scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]});
    expect(tokens[5]).toEqual({value: "image", scopes: ["source.gfm", "link", "markup.underline.link.gfm"]});
    expect(tokens[6]).toEqual({value: ")", scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]});
    expect(tokens[7]).toEqual({value: "]", scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]});
    expect(tokens[8]).toEqual({value: "[", scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]});
    expect(tokens[9]).toEqual({value: "link", scopes: ["source.gfm", "link", "markup.underline.link.gfm"]});
    expect(tokens[10]).toEqual({value: "]", scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]});
});

  it("tokenizes [![links][links]](links)", function() {
    const {tokens} = grammar.tokenizeLine("[![title][image]](link)");
    expect(tokens[0]).toEqual({value: "[!", scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]});
    expect(tokens[1]).toEqual({value: "[", scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]});
    expect(tokens[2]).toEqual({value: "title", scopes: ["source.gfm", "link", "entity.gfm"]});
    expect(tokens[3]).toEqual({value: "]", scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]});
    expect(tokens[4]).toEqual({value: "[", scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]});
    expect(tokens[5]).toEqual({value: "image", scopes: ["source.gfm", "link", "markup.underline.link.gfm"]});
    expect(tokens[6]).toEqual({value: "]", scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]});
    expect(tokens[7]).toEqual({value: "]", scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]});
    expect(tokens[8]).toEqual({value: "(", scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]});
    expect(tokens[9]).toEqual({value: "link", scopes: ["source.gfm", "link", "markup.underline.link.gfm"]});
    expect(tokens[10]).toEqual({value: ")", scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]});
});

  it("tokenizes [![links][links]][links]", function() {
    const {tokens} = grammar.tokenizeLine("[![title][image]][link]");
    expect(tokens[0]).toEqual({value: "[!", scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]});
    expect(tokens[1]).toEqual({value: "[", scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]});
    expect(tokens[2]).toEqual({value: "title", scopes: ["source.gfm", "link", "entity.gfm"]});
    expect(tokens[3]).toEqual({value: "]", scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]});
    expect(tokens[4]).toEqual({value: "[", scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]});
    expect(tokens[5]).toEqual({value: "image", scopes: ["source.gfm", "link", "markup.underline.link.gfm"]});
    expect(tokens[6]).toEqual({value: "]", scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]});
    expect(tokens[7]).toEqual({value: "]", scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]});
    expect(tokens[8]).toEqual({value: "[", scopes: ["source.gfm", "link", "punctuation.definition.begin.gfm"]});
    expect(tokens[9]).toEqual({value: "link", scopes: ["source.gfm", "link", "markup.underline.link.gfm"]});
    expect(tokens[10]).toEqual({value: "]", scopes: ["source.gfm", "link", "punctuation.definition.end.gfm"]});
});

  it("tokenizes mentions", function() {
    let {tokens} = grammar.tokenizeLine("sentence with no space before@name ");
    expect(tokens[0]).toEqual({value: "sentence with no space before@name ", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine("@name '@name' @name's @name. @name, (@name) [@name]"));
    expect(tokens[0]).toEqual({value: "@", scopes: ["source.gfm", "variable.mention.gfm"]});
    expect(tokens[1]).toEqual({value: "name", scopes: ["source.gfm", "string.username.gfm"]});
    expect(tokens[2]).toEqual({value: " '", scopes: ["source.gfm"]});
    expect(tokens[3]).toEqual({value: "@", scopes: ["source.gfm", "variable.mention.gfm"]});
    expect(tokens[4]).toEqual({value: "name", scopes: ["source.gfm", "string.username.gfm"]});
    expect(tokens[5]).toEqual({value: "' ", scopes: ["source.gfm"]});
    expect(tokens[6]).toEqual({value: "@", scopes: ["source.gfm", "variable.mention.gfm"]});
    expect(tokens[7]).toEqual({value: "name", scopes: ["source.gfm", "string.username.gfm"]});
    expect(tokens[8]).toEqual({value: "'s ", scopes: ["source.gfm"]});
    expect(tokens[9]).toEqual({value: "@", scopes: ["source.gfm", "variable.mention.gfm"]});
    expect(tokens[10]).toEqual({value: "name", scopes: ["source.gfm", "string.username.gfm"]});
    expect(tokens[11]).toEqual({value: ". ", scopes: ["source.gfm"]});
    expect(tokens[12]).toEqual({value: "@", scopes: ["source.gfm", "variable.mention.gfm"]});
    expect(tokens[13]).toEqual({value: "name", scopes: ["source.gfm", "string.username.gfm"]});
    expect(tokens[14]).toEqual({value: ", (", scopes: ["source.gfm"]});
    expect(tokens[15]).toEqual({value: "@", scopes: ["source.gfm", "variable.mention.gfm"]});
    expect(tokens[16]).toEqual({value: "name", scopes: ["source.gfm", "string.username.gfm"]});
    expect(tokens[17]).toEqual({value: ") [", scopes: ["source.gfm"]});
    expect(tokens[18]).toEqual({value: "@", scopes: ["source.gfm", "variable.mention.gfm"]});
    expect(tokens[19]).toEqual({value: "name", scopes: ["source.gfm", "string.username.gfm"]});
    expect(tokens[20]).toEqual({value: "]", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine('"@name"'));
    expect(tokens[0]).toEqual({value: '"', scopes: ["source.gfm"]});
    expect(tokens[1]).toEqual({value: "@", scopes: ["source.gfm", "variable.mention.gfm"]});
    expect(tokens[2]).toEqual({value: "name", scopes: ["source.gfm", "string.username.gfm"]});
    expect(tokens[3]).toEqual({value: '"', scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine("sentence with a space before @name/ and an invalid symbol after"));
    expect(tokens[0]).toEqual({value: "sentence with a space before @name/ and an invalid symbol after", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine("sentence with a space before @name that continues"));
    expect(tokens[0]).toEqual({value: "sentence with a space before ", scopes: ["source.gfm"]});
    expect(tokens[1]).toEqual({value: "@", scopes: ["source.gfm", "variable.mention.gfm"]});
    expect(tokens[2]).toEqual({value: "name", scopes: ["source.gfm", "string.username.gfm"]});
    expect(tokens[3]).toEqual({value: " that continues", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine("* @name at the start of an unordered list"));
    expect(tokens[0]).toEqual({value: "*", scopes: ["source.gfm", "variable.unordered.list.gfm"]});
    expect(tokens[1]).toEqual({value: " ", scopes: ["source.gfm"]});
    expect(tokens[2]).toEqual({value: "@", scopes: ["source.gfm", "variable.mention.gfm"]});
    expect(tokens[3]).toEqual({value: "name", scopes: ["source.gfm", "string.username.gfm"]});
    expect(tokens[4]).toEqual({value: " at the start of an unordered list", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine("a username @1337_hubot with numbers, letters and underscores"));
    expect(tokens[0]).toEqual({value: "a username ", scopes: ["source.gfm"]});
    expect(tokens[1]).toEqual({value: "@", scopes: ["source.gfm", "variable.mention.gfm"]});
    expect(tokens[2]).toEqual({value: "1337_hubot", scopes: ["source.gfm", "string.username.gfm"]});
    expect(tokens[3]).toEqual({value: " with numbers, letters and underscores", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine("a username @1337-hubot with numbers, letters and hyphens"));
    expect(tokens[0]).toEqual({value: "a username ", scopes: ["source.gfm"]});
    expect(tokens[1]).toEqual({value: "@", scopes: ["source.gfm", "variable.mention.gfm"]});
    expect(tokens[2]).toEqual({value: "1337-hubot", scopes: ["source.gfm", "string.username.gfm"]});
    expect(tokens[3]).toEqual({value: " with numbers, letters and hyphens", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine("@name at the start of a line"));
    expect(tokens[0]).toEqual({value: "@", scopes: ["source.gfm", "variable.mention.gfm"]});
    expect(tokens[1]).toEqual({value: "name", scopes: ["source.gfm", "string.username.gfm"]});
    expect(tokens[2]).toEqual({value: " at the start of a line", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine("any email like you@domain.com shouldn't mistakenly be matched as a mention"));
    expect(tokens[0]).toEqual({value: "any email like you@domain.com shouldn't mistakenly be matched as a mention", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine("@person's"));
    expect(tokens[0]).toEqual({value: "@", scopes: ["source.gfm", "variable.mention.gfm"]});
    expect(tokens[1]).toEqual({value: "person", scopes: ["source.gfm", "string.username.gfm"]});
    expect(tokens[2]).toEqual({value: "'s", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine("@person;"));
    expect(tokens[0]).toEqual({value: "@", scopes: ["source.gfm", "variable.mention.gfm"]});
    expect(tokens[1]).toEqual({value: "person", scopes: ["source.gfm", "string.username.gfm"]});
    expect(tokens[2]).toEqual({value: ";", scopes: ["source.gfm"]});
});

  it("tokenizes issue numbers", function() {
    let {tokens} = grammar.tokenizeLine("sentence with no space before#12 ");
    expect(tokens[0]).toEqual({value: "sentence with no space before#12 ", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine(" #101 '#101' #101's #101. #101, (#101) [#101]"));
    expect(tokens[1]).toEqual({value: "#", scopes: ["source.gfm", "variable.issue.tag.gfm"]});
    expect(tokens[2]).toEqual({value: "101", scopes: ["source.gfm", "string.issue.number.gfm"]});
    expect(tokens[3]).toEqual({value: " '", scopes: ["source.gfm"]});
    expect(tokens[4]).toEqual({value: "#", scopes: ["source.gfm", "variable.issue.tag.gfm"]});
    expect(tokens[5]).toEqual({value: "101", scopes: ["source.gfm", "string.issue.number.gfm"]});
    expect(tokens[6]).toEqual({value: "' ", scopes: ["source.gfm"]});
    expect(tokens[7]).toEqual({value: "#", scopes: ["source.gfm", "variable.issue.tag.gfm"]});
    expect(tokens[8]).toEqual({value: "101", scopes: ["source.gfm", "string.issue.number.gfm"]});
    expect(tokens[9]).toEqual({value: "'s ", scopes: ["source.gfm"]});
    expect(tokens[10]).toEqual({value: "#", scopes: ["source.gfm", "variable.issue.tag.gfm"]});
    expect(tokens[11]).toEqual({value: "101", scopes: ["source.gfm", "string.issue.number.gfm"]});
    expect(tokens[12]).toEqual({value: ". ", scopes: ["source.gfm"]});
    expect(tokens[13]).toEqual({value: "#", scopes: ["source.gfm", "variable.issue.tag.gfm"]});
    expect(tokens[14]).toEqual({value: "101", scopes: ["source.gfm", "string.issue.number.gfm"]});
    expect(tokens[15]).toEqual({value: ", (", scopes: ["source.gfm"]});
    expect(tokens[16]).toEqual({value: "#", scopes: ["source.gfm", "variable.issue.tag.gfm"]});
    expect(tokens[17]).toEqual({value: "101", scopes: ["source.gfm", "string.issue.number.gfm"]});
    expect(tokens[18]).toEqual({value: ") [", scopes: ["source.gfm"]});
    expect(tokens[19]).toEqual({value: "#", scopes: ["source.gfm", "variable.issue.tag.gfm"]});
    expect(tokens[20]).toEqual({value: "101", scopes: ["source.gfm", "string.issue.number.gfm"]});
    expect(tokens[21]).toEqual({value: "]", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine('"#101"'));
    expect(tokens[0]).toEqual({value: '"', scopes: ["source.gfm"]});
    expect(tokens[1]).toEqual({value: "#", scopes: ["source.gfm", "variable.issue.tag.gfm"]});
    expect(tokens[2]).toEqual({value: "101", scopes: ["source.gfm", "string.issue.number.gfm"]});
    expect(tokens[3]).toEqual({value: '"', scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine("sentence with a space before #123i and a character after"));
    expect(tokens[0]).toEqual({value: "sentence with a space before #123i and a character after", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine("sentence with a space before #123 that continues"));
    expect(tokens[0]).toEqual({value: "sentence with a space before ", scopes: ["source.gfm"]});
    expect(tokens[1]).toEqual({value: "#", scopes: ["source.gfm", "variable.issue.tag.gfm"]});
    expect(tokens[2]).toEqual({value: "123", scopes: ["source.gfm", "string.issue.number.gfm"]});
    expect(tokens[3]).toEqual({value: " that continues", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine(" #123's"));
    expect(tokens[1]).toEqual({value: "#", scopes: ["source.gfm", "variable.issue.tag.gfm"]});
    expect(tokens[2]).toEqual({value: "123", scopes: ["source.gfm", "string.issue.number.gfm"]});
    expect(tokens[3]).toEqual({value: "'s", scopes: ["source.gfm"]});
});

  it("tokenizes unordered lists", function() {
    let {tokens} = grammar.tokenizeLine("*Item 1");
    expect(tokens[0]).not.toEqual({value: "*Item 1", scopes: ["source.gfm", "variable.unordered.list.gfm"]});

    ({tokens} = grammar.tokenizeLine("  * Item 1"));
    expect(tokens[0]).toEqual({value: "  ", scopes: ["source.gfm"]});
    expect(tokens[1]).toEqual({value: "*", scopes: ["source.gfm", "variable.unordered.list.gfm"]});
    expect(tokens[2]).toEqual({value: " ", scopes: ["source.gfm"]});
    expect(tokens[3]).toEqual({value: "Item 1", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine("  + Item 2"));
    expect(tokens[0]).toEqual({value: "  ", scopes: ["source.gfm"]});
    expect(tokens[1]).toEqual({value: "+", scopes: ["source.gfm", "variable.unordered.list.gfm"]});
    expect(tokens[2]).toEqual({value: " ", scopes: ["source.gfm"]});
    expect(tokens[3]).toEqual({value: "Item 2", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine("  - Item 3"));
    expect(tokens[0]).toEqual({value: "  ", scopes: ["source.gfm"]});
    expect(tokens[1]).toEqual({value: "-", scopes: ["source.gfm", "variable.unordered.list.gfm"]});
    expect(tokens[2]).toEqual({value: " ", scopes: ["source.gfm"]});
    expect(tokens[3]).toEqual({value: "Item 3", scopes: ["source.gfm"]});
});

  it("tokenizes ordered lists", function() {
    let {tokens} = grammar.tokenizeLine("1.First Item");
    expect(tokens[0]).toEqual({value: "1.First Item", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine("  1. First Item"));
    expect(tokens[0]).toEqual({value: "  ", scopes: ["source.gfm"]});
    expect(tokens[1]).toEqual({value: "1.", scopes: ["source.gfm", "variable.ordered.list.gfm"]});
    expect(tokens[2]).toEqual({value: " ", scopes: ["source.gfm"]});
    expect(tokens[3]).toEqual({value: "First Item", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine("  10. Tenth Item"));
    expect(tokens[0]).toEqual({value: "  ", scopes: ["source.gfm"]});
    expect(tokens[1]).toEqual({value: "10.", scopes: ["source.gfm", "variable.ordered.list.gfm"]});
    expect(tokens[2]).toEqual({value: " ", scopes: ["source.gfm"]});
    expect(tokens[3]).toEqual({value: "Tenth Item", scopes: ["source.gfm"]});

    ({tokens} = grammar.tokenizeLine("  111. Hundred and eleventh item"));
    expect(tokens[0]).toEqual({value: "  ", scopes: ["source.gfm"]});
    expect(tokens[1]).toEqual({value: "111.", scopes: ["source.gfm", "variable.ordered.list.gfm"]});
    expect(tokens[2]).toEqual({value: " ", scopes: ["source.gfm"]});
    expect(tokens[3]).toEqual({value: "Hundred and eleventh item", scopes: ["source.gfm"]});
});

  it("tokenizes > quoted text", function() {
    const {tokens} = grammar.tokenizeLine("> Quotation :+1:");
    expect(tokens[0]).toEqual({value: ">", scopes: ["source.gfm", "comment.quote.gfm", "support.quote.gfm"]});
    expect(tokens[1]).toEqual({value: " Quotation :+1:", scopes: ["source.gfm", "comment.quote.gfm"]});
});

  it("tokenizes HTML entities", function() {
    const {tokens} = grammar.tokenizeLine("&trade; &#8482; &a1; &#xb3;");
    expect(tokens[0]).toEqual({value: "&", scopes: ["source.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[1]).toEqual({value: "trade", scopes: ["source.gfm", "constant.character.entity.gfm"]});
    expect(tokens[2]).toEqual({value: ";", scopes: ["source.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});

    expect(tokens[3]).toEqual({value: " ", scopes: ["source.gfm"]});

    expect(tokens[4]).toEqual({value: "&", scopes: ["source.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[5]).toEqual({value: "#8482", scopes: ["source.gfm", "constant.character.entity.gfm"]});
    expect(tokens[6]).toEqual({value: ";", scopes: ["source.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});

    expect(tokens[7]).toEqual({value: " ", scopes: ["source.gfm"]});

    expect(tokens[8]).toEqual({value: "&", scopes: ["source.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[9]).toEqual({value: "a1", scopes: ["source.gfm", "constant.character.entity.gfm"]});
    expect(tokens[10]).toEqual({value: ";", scopes: ["source.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});

    expect(tokens[11]).toEqual({value: " ", scopes: ["source.gfm"]});

    expect(tokens[12]).toEqual({value: "&", scopes: ["source.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[13]).toEqual({value: "#xb3", scopes: ["source.gfm", "constant.character.entity.gfm"]});
    expect(tokens[14]).toEqual({value: ";", scopes: ["source.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
});

  it("tokenizes HTML entities in *italic* text", function() {
    let {tokens} = grammar.tokenizeLine("*&trade; &#8482; &#xb3;*");
    expect(tokens[0]).toEqual({value: "*", scopes: [ 'source.gfm', 'markup.italic.gfm', 'punctuation.definition.entity.gfm' ]});
    expect(tokens[1]).toEqual({value: "&", scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[2]).toEqual({value: "trade", scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm"]});
    expect(tokens[3]).toEqual({value: ";", scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[4]).toEqual({value: " ", scopes: ["source.gfm", "markup.italic.gfm"]});
    expect(tokens[5]).toEqual({value: "&", scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[6]).toEqual({value: "#8482", scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm"]});
    expect(tokens[7]).toEqual({value: ";", scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[8]).toEqual({value: " ", scopes: ["source.gfm", "markup.italic.gfm"]});
    expect(tokens[9]).toEqual({value: "&", scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[10]).toEqual({value: "#xb3", scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm"]});
    expect(tokens[11]).toEqual({value: ";", scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[12]).toEqual({value: "*", scopes: [ 'source.gfm', 'markup.italic.gfm', 'punctuation.definition.entity.gfm' ]});

    ({tokens} = grammar.tokenizeLine("_&trade; &#8482; &#xb3;_"));
    expect(tokens[0]).toEqual({value: "_", scopes: [ 'source.gfm', 'markup.italic.gfm', 'punctuation.definition.entity.gfm' ]});
    expect(tokens[1]).toEqual({value: "&", scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[2]).toEqual({value: "trade", scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm"]});
    expect(tokens[3]).toEqual({value: ";", scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[4]).toEqual({value: " ", scopes: ["source.gfm", "markup.italic.gfm"]});
    expect(tokens[5]).toEqual({value: "&", scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[6]).toEqual({value: "#8482", scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm"]});
    expect(tokens[7]).toEqual({value: ";", scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[8]).toEqual({value: " ", scopes: ["source.gfm", "markup.italic.gfm"]});
    expect(tokens[9]).toEqual({value: "&", scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[10]).toEqual({value: "#xb3", scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm"]});
    expect(tokens[11]).toEqual({value: ";", scopes: ["source.gfm", "markup.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[12]).toEqual({value: "_", scopes: [ 'source.gfm', 'markup.italic.gfm', 'punctuation.definition.entity.gfm' ]});
});

  it("tokenizes HTML entities in **bold** text", function() {
    let {tokens} = grammar.tokenizeLine("**&trade; &#8482; &#xb3;**");
    expect(tokens[0]).toEqual({value: "**", scopes: ["source.gfm", "markup.bold.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[1]).toEqual({value: "&", scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[2]).toEqual({value: "trade", scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm"]});
    expect(tokens[3]).toEqual({value: ";", scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[4]).toEqual({value: " ", scopes: ["source.gfm", "markup.bold.gfm"]});
    expect(tokens[5]).toEqual({value: "&", scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[6]).toEqual({value: "#8482", scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm"]});
    expect(tokens[7]).toEqual({value: ";", scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[8]).toEqual({value: " ", scopes: ["source.gfm", "markup.bold.gfm"]});
    expect(tokens[9]).toEqual({value: "&", scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[10]).toEqual({value: "#xb3", scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm"]});
    expect(tokens[11]).toEqual({value: ";", scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[12]).toEqual({value: "**", scopes: ["source.gfm", "markup.bold.gfm", "punctuation.definition.entity.gfm"]});

    ({tokens} = grammar.tokenizeLine("__&trade; &#8482; &#xb3;__"));
    expect(tokens[0]).toEqual({value: "__", scopes: ["source.gfm", "markup.bold.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[1]).toEqual({value: "&", scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[2]).toEqual({value: "trade", scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm"]});
    expect(tokens[3]).toEqual({value: ";", scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[4]).toEqual({value: " ", scopes: ["source.gfm", "markup.bold.gfm"]});
    expect(tokens[5]).toEqual({value: "&", scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[6]).toEqual({value: "#8482", scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm"]});
    expect(tokens[7]).toEqual({value: ";", scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[8]).toEqual({value: " ", scopes: ["source.gfm", "markup.bold.gfm"]});
    expect(tokens[9]).toEqual({value: "&", scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[10]).toEqual({value: "#xb3", scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm"]});
    expect(tokens[11]).toEqual({value: ";", scopes: ["source.gfm", "markup.bold.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[12]).toEqual({value: "__", scopes: ["source.gfm", "markup.bold.gfm", "punctuation.definition.entity.gfm"]});
});

  it("tokenizes HTML entities in ***bold italic*** text", function() {
    let {tokens} = grammar.tokenizeLine("***&trade; &#8482; &#xb3;***");
    expect(tokens[0]).toEqual({value: "***", scopes: ["source.gfm", "markup.bold.italic.gfm"]});
    expect(tokens[1]).toEqual({value: "&", scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[2]).toEqual({value: "trade", scopes: [ "source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm" ]});
    expect(tokens[3]).toEqual({value: ";", scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm"]});
    expect(tokens[4]).toEqual({value: " ", scopes: ["source.gfm", "markup.bold.italic.gfm"]});
    expect(tokens[5]).toEqual({value: "&", scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[6]).toEqual({value: "#8482", scopes: [ "source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm" ]});
    expect(tokens[7]).toEqual({value: ";", scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm"]});
    expect(tokens[8]).toEqual({value: " ", scopes: ["source.gfm", "markup.bold.italic.gfm"]});
    expect(tokens[9]).toEqual({value: "&", scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[10]).toEqual({value: "#xb3", scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[11]).toEqual({value: ";", scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm"]});
    expect(tokens[12]).toEqual({value: "***", scopes: ["source.gfm", "markup.bold.italic.gfm"]});

    ({tokens} = grammar.tokenizeLine("___&trade; &#8482; &#xb3;___"));
    expect(tokens[0]).toEqual({value: "___", scopes: ["source.gfm", "markup.bold.italic.gfm"]});
    expect(tokens[1]).toEqual({value: "&", scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[2]).toEqual({value: "trade", scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[3]).toEqual({value: ";", scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm"]});
    expect(tokens[4]).toEqual({value: " ", scopes: ["source.gfm", "markup.bold.italic.gfm"]});
    expect(tokens[5]).toEqual({value: "&", scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[6]).toEqual({value: "#8482", scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[7]).toEqual({value: ";", scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm"]});
    expect(tokens[8]).toEqual({value: " ", scopes: ["source.gfm", "markup.bold.italic.gfm"]});
    expect(tokens[9]).toEqual({value: "&", scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[10]).toEqual({value: "#xb3", scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[11]).toEqual({value: ";", scopes: ["source.gfm", "markup.bold.italic.gfm", "constant.character.entity.gfm"]});
    expect(tokens[12]).toEqual({value: "___", scopes: ["source.gfm", "markup.bold.italic.gfm"]});
});

  it("tokenizes HTML entities in strikethrough text", function() {
    const {tokens} = grammar.tokenizeLine("~~&trade; &#8482; &#xb3;~~");
    expect(tokens[0]).toEqual({value: "~~", scopes: ["source.gfm", "markup.strike.gfm"]});
    expect(tokens[1]).toEqual({value: "&", scopes: ["source.gfm", "markup.strike.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[2]).toEqual({value: "trade", scopes: ["source.gfm", "markup.strike.gfm", "constant.character.entity.gfm"]});
    expect(tokens[3]).toEqual({value: ";", scopes: ["source.gfm", "markup.strike.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[4]).toEqual({value: " ", scopes: ["source.gfm", "markup.strike.gfm"]});
    expect(tokens[5]).toEqual({value: "&", scopes: ["source.gfm", "markup.strike.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[6]).toEqual({value: "#8482", scopes: ["source.gfm", "markup.strike.gfm", "constant.character.entity.gfm"]});
    expect(tokens[7]).toEqual({value: ";", scopes: ["source.gfm", "markup.strike.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[8]).toEqual({value: " ", scopes: ["source.gfm", "markup.strike.gfm"]});
    expect(tokens[9]).toEqual({value: "&", scopes: ["source.gfm", "markup.strike.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[10]).toEqual({value: "#xb3", scopes: ["source.gfm", "markup.strike.gfm", "constant.character.entity.gfm"]});
    expect(tokens[11]).toEqual({value: ";", scopes: ["source.gfm", "markup.strike.gfm", "constant.character.entity.gfm", "punctuation.definition.entity.gfm"]});
    expect(tokens[12]).toEqual({value: "~~", scopes: ["source.gfm", "markup.strike.gfm"]});
});

  it("tokenizes HTML comments", function() {
    const {tokens} = grammar.tokenizeLine("<!-- a comment -->");
    expect(tokens[0]).toEqual({value: "<!--", scopes: ["source.gfm", "comment.block.gfm", "punctuation.definition.comment.gfm"]});
    expect(tokens[1]).toEqual({value: " a comment ", scopes: ["source.gfm", "comment.block.gfm"]});
    expect(tokens[2]).toEqual({value: "-->", scopes: ["source.gfm", "comment.block.gfm", "punctuation.definition.comment.gfm"]});
});

  it("tokenizes YAML front matter", function() {
    const [firstLineTokens, secondLineTokens, thirdLineTokens] = Array.from(grammar.tokenizeLines(`\
---
front: matter
---\
`
    ));

    expect(firstLineTokens[0]).toEqual({value: "---", scopes: ["source.gfm", "front-matter.yaml.gfm", "comment.hr.gfm"]});
    expect(secondLineTokens[0]).toEqual({value: "front: matter", scopes: ["source.gfm", "front-matter.yaml.gfm"]});
    expect(thirdLineTokens[0]).toEqual({value: "---", scopes: ["source.gfm", "front-matter.yaml.gfm", "comment.hr.gfm"]});
});

  it("tokenizes linebreaks", function() {
    const {tokens} = grammar.tokenizeLine("line  ");
    expect(tokens[0]).toEqual({value: "line", scopes: ["source.gfm"]});
    expect(tokens[1]).toEqual({value: "  ", scopes: ["source.gfm", "linebreak.gfm"]});
});

  it("tokenizes tables", function() {
    let emptyLineTokens, headingTokens;
    let [headerTokens, alignTokens, contentTokens] = Array.from(grammar.tokenizeLines(`\
| Column 1  | Column 2  |
|:----------|:---------:|
| Content 1 | Content 2 |\
`
    ));

    // Header line
    expect(headerTokens[0]).toEqual({value: "|", scopes: ["source.gfm", "table.gfm", "border.pipe.outer"]});
    expect(headerTokens[1]).toEqual({value: " Column 1  ", scopes: ["source.gfm", "table.gfm"]});
    expect(headerTokens[2]).toEqual({value: "|", scopes: ["source.gfm", "table.gfm", "border.pipe.inner"]});
    expect(headerTokens[3]).toEqual({value: " Column 2  ", scopes: ["source.gfm", "table.gfm"]});
    expect(headerTokens[4]).toEqual({value: "|", scopes: ["source.gfm", "table.gfm", "border.pipe.outer"]});

    // Alignment line
    expect(alignTokens[0]).toEqual({value: "|", scopes: ["source.gfm", "table.gfm", "border.pipe.outer"]});
    expect(alignTokens[1]).toEqual({value: ":", scopes: ["source.gfm", "table.gfm", "border.alignment"]});
    expect(alignTokens[2]).toEqual({value: "----------", scopes: ["source.gfm", "table.gfm", "border.header"]});
    expect(alignTokens[3]).toEqual({value: "|", scopes: ["source.gfm", "table.gfm", "border.pipe.inner"]});
    expect(alignTokens[4]).toEqual({value: ":", scopes: ["source.gfm", "table.gfm", "border.alignment"]});
    expect(alignTokens[5]).toEqual({value: "---------", scopes: ["source.gfm", "table.gfm", "border.header"]});
    expect(alignTokens[6]).toEqual({value: ":", scopes: ["source.gfm", "table.gfm", "border.alignment"]});
    expect(alignTokens[7]).toEqual({value: "|", scopes: ["source.gfm", "table.gfm", "border.pipe.outer"]});

    // Content line
    expect(contentTokens[0]).toEqual({value: "|", scopes: ["source.gfm", "table.gfm", "border.pipe.outer"]});
    expect(contentTokens[1]).toEqual({value: " Content 1 ", scopes: ["source.gfm", "table.gfm"]});
    expect(contentTokens[2]).toEqual({value: "|", scopes: ["source.gfm", "table.gfm", "border.pipe.inner"]});
    expect(contentTokens[3]).toEqual({value: " Content 2 ", scopes: ["source.gfm", "table.gfm"]});
    expect(contentTokens[4]).toEqual({value: "|", scopes: ["source.gfm", "table.gfm", "border.pipe.outer"]});

    [headerTokens, emptyLineTokens, headingTokens] = Array.from(grammar.tokenizeLines(`\
| Column 1  | Column 2\t

# Heading\
`
    ));

    expect(headerTokens[0]).toEqual({value: "|", scopes: ["source.gfm", "table.gfm", "border.pipe.outer"]});
    expect(headerTokens[1]).toEqual({value: " Column 1  ", scopes: ["source.gfm", "table.gfm"]});
    expect(headerTokens[2]).toEqual({value: "|", scopes: ["source.gfm", "table.gfm", "border.pipe.inner"]});
    expect(headerTokens[3]).toEqual({value: " Column 2", scopes: ["source.gfm", "table.gfm"]});
    expect(headerTokens[4]).toEqual({value: "\t", scopes: ["source.gfm", "table.gfm"]});

    expect(headingTokens[0]).toEqual({value: "#", scopes: ["source.gfm", "markup.heading.heading-1.gfm", "markup.heading.marker.gfm"]});
    expect(headingTokens[1]).toEqual({value: " ", scopes: ["source.gfm", "markup.heading.heading-1.gfm", "markup.heading.space.gfm"]});
    expect(headingTokens[2]).toEqual({value: "Heading", scopes: ["source.gfm", "markup.heading.heading-1.gfm"]});
});

  it("tokenizes criticmarkup", function() {
    const [addToken, delToken, hlToken, subToken] = Array.from(grammar.tokenizeLines(`\
Add{++ some text++}
Delete{-- some text--}
Highlight {==some text==}{>>with comment<<}
Replace {~~this~>by that~~}\
`
    ));
    // Addition
    expect(addToken[0]).toEqual({value: "Add", scopes: ["source.gfm"]});
    expect(addToken[1]).toEqual({value: "{++", scopes: ["source.gfm", "markup.inserted.critic.gfm.addition", "punctuation.definition.inserted.critic.gfm.addition.marker"]});
    expect(addToken[2]).toEqual({value: " some text", scopes: ["source.gfm", "markup.inserted.critic.gfm.addition"]});
    expect(addToken[3]).toEqual({value: "++}", scopes: ["source.gfm", "markup.inserted.critic.gfm.addition", "punctuation.definition.inserted.critic.gfm.addition.marker"]});
    // Deletion
    expect(delToken[0]).toEqual({value: "Delete", scopes: ["source.gfm"]});
    expect(delToken[1]).toEqual({value: "{--", scopes: ["source.gfm", "markup.deleted.critic.gfm.deletion", "punctuation.definition.deleted.critic.gfm.deletion.marker"]});
    expect(delToken[2]).toEqual({value: " some text", scopes: ["source.gfm", "markup.deleted.critic.gfm.deletion"]});
    expect(delToken[3]).toEqual({value: "--}", scopes: ["source.gfm", "markup.deleted.critic.gfm.deletion", "punctuation.definition.deleted.critic.gfm.deletion.marker"]});
    // Comment and highlight
    expect(hlToken[0]).toEqual({value: "Highlight ", scopes: ["source.gfm"]});
    expect(hlToken[1]).toEqual({value: "{==", scopes: ["source.gfm", "critic.gfm.highlight", "critic.gfm.highlight.marker"]});
    expect(hlToken[2]).toEqual({value: "some text", scopes: ["source.gfm", "critic.gfm.highlight"]});
    expect(hlToken[3]).toEqual({value: "==}", scopes: ["source.gfm", "critic.gfm.highlight", "critic.gfm.highlight.marker"]});
    expect(hlToken[4]).toEqual({value: "{>>", scopes: ["source.gfm", "critic.gfm.comment", "critic.gfm.comment.marker"]});
    expect(hlToken[5]).toEqual({value: "with comment", scopes: ["source.gfm", "critic.gfm.comment"]});
    expect(hlToken[6]).toEqual({value: "<<}", scopes: ["source.gfm", "critic.gfm.comment", "critic.gfm.comment.marker"]});
    // Replace
    expect(subToken[0]).toEqual({value: "Replace ", scopes: ["source.gfm"]});
    expect(subToken[1]).toEqual({value: "{~~", scopes: ["source.gfm", "markup.changed.critic.gfm.substitution", "punctuation.definition.changed.critic.gfm.substitution.marker"]});
    expect(subToken[2]).toEqual({value: "this", scopes: ["source.gfm", "markup.changed.critic.gfm.substitution"]});
    expect(subToken[3]).toEqual({value: "~>", scopes: ["source.gfm", "markup.changed.critic.gfm.substitution", "punctuation.definition.changed.critic.gfm.substitution.operator"]});
    expect(subToken[4]).toEqual({value: "by that", scopes: ["source.gfm", "markup.changed.critic.gfm.substitution"]});
    expect(subToken[5]).toEqual({value: "~~}", scopes: ["source.gfm", "markup.changed.critic.gfm.substitution", "punctuation.definition.changed.critic.gfm.substitution.marker"]});
});
});
