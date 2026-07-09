function setConfigForLanguageMode(mode) {
  atom.config.set("core.useTreeSitterParsers", mode !== "textmate");
}

describe("Diff grammars", () => {
  beforeEach(() => waitsForPromise(() => atom.packages.activatePackage("language-diff")));

  describe("TextMate parser", () => {
    let grammar = null;

    beforeEach(() => {
      setConfigForLanguageMode("textmate");
      grammar = atom.grammars.grammarForScopeName("source.diff");
    });

    it("parses the grammar", () => {
      expect(grammar).toBeTruthy();
      expect(grammar.scopeName).toBe("source.diff");
    });

    it("tokenizes additions and deletions", () => {
      let { tokens } = grammar.tokenizeLine("- line 1");
      expect(tokens[0].scopes).toContain("markup.deleted.diff");
      expect(tokens[0].scopes).toContain("punctuation.definition.deleted.diff");

      ({ tokens } = grammar.tokenizeLine("+ line 2"));
      expect(tokens[0].scopes).toContain("markup.inserted.diff");
      expect(tokens[0].scopes).toContain("punctuation.definition.inserted.diff");
    });
  });

  describe("modern Tree-sitter parser", () => {
    beforeEach(() => setConfigForLanguageMode("modern-tree-sitter"));

    it("parses the grammar", () => {
      const grammar = atom.grammars.grammarForScopeName("source.diff");
      expect(grammar).toBeTruthy();
      expect(grammar.scopeName).toBe("source.diff");
    });

    it("tokenizes additions and deletions", async () => {
      const editor = await atom.workspace.open("sample.diff");
      editor.setText("- line 1\n+ line 2\n");
      const grammar = atom.grammars.grammarForScopeName("source.diff");
      editor.setGrammar(grammar);
      await editor.getBuffer().languageMode.ready;

      expect(editor.scopeDescriptorForBufferPosition([0, 1]).getScopesArray()).toContain(
        "markup.deleted.diff",
      );
      expect(editor.scopeDescriptorForBufferPosition([1, 1]).getScopesArray()).toContain(
        "markup.inserted.diff",
      );
    });

    it("is injected into Markdown diff code blocks", async () => {
      await atom.packages.activatePackage("language-gfm");

      const editor = await atom.workspace.open("sample.md");
      editor.setText("```diff\n- line 1\n+ line 2\n```\n");
      const grammar = atom.grammars.grammarForScopeName("source.gfm");
      editor.setGrammar(grammar);
      await editor.getBuffer().languageMode.ready;

      const deletionScopes = editor.scopeDescriptorForBufferPosition([1, 1]).getScopesArray();
      expect(deletionScopes).toContain("source.diff");
      expect(deletionScopes).toContain("markup.deleted.diff");

      const additionScopes = editor.scopeDescriptorForBufferPosition([2, 1]).getScopesArray();
      expect(additionScopes).toContain("source.diff");
      expect(additionScopes).toContain("markup.inserted.diff");
    });
  });
});
