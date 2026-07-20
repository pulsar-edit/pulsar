const path = require("path");

describe("Ruby grammars", () => {
  beforeEach(async () => {
    await atom.packages.activatePackage("language-ruby");
  });

  it("tokenizes the editor using TextMate parser", async () => {
    atom.config.set("language.useTreeSitterParsers", false);

    await runGrammarTests(path.join(__dirname, "fixtures", "textmate-grammar.rb"), /#/);
  });

  xit("tokenizes the editor using node tree-sitter parser", async () => {
    atom.config.set("language.useTreeSitterParsers", true);
    await runGrammarTests(path.join(__dirname, "fixtures", "textmate-grammar.rb"), /#/);
  });
});
