describe("modern JSON grammars", () => {
  beforeEach(async () => {
    atom.config.set("language.useTreeSitterParsers", true);
    await atom.packages.activatePackage("language-json");
  });

  it("names the commented JSON grammar JSONC", () => {
    const grammar = atom.grammars.grammarForScopeName("source.json.jsonc");

    expect(grammar).toBeDefined();
    expect(grammar.name).toBe("JSONC");
  });

  it("highlights trailing commas as valid punctuation in JSONC", async () => {
    const editor = await atom.workspace.open("test.jsonc");
    editor.setText('{"value": 1,}\n[1,]');
    editor.setGrammar(atom.grammars.grammarForScopeName("source.json.jsonc"));
    await editor.getBuffer().languageMode.ready;

    const objectCommaScopes = editor.scopeDescriptorForBufferPosition([0, 11]).getScopesArray();
    const arrayCommaScopes = editor.scopeDescriptorForBufferPosition([1, 2]).getScopesArray();

    expect(objectCommaScopes).toContain("punctuation.separator.comma.json");
    expect(objectCommaScopes).not.toContain("invalid.illegal.comma.json");
    expect(arrayCommaScopes).toContain("punctuation.separator.comma.json");
    expect(arrayCommaScopes).not.toContain("invalid.illegal.comma.json");
  });

  it("continues to mark trailing commas as invalid in strict JSON", async () => {
    const editor = await atom.workspace.open("test.json");
    editor.setText('{"value": 1,}');
    editor.setGrammar(atom.grammars.grammarForScopeName("source.json"));
    await editor.getBuffer().languageMode.ready;

    const commaScopes = editor.scopeDescriptorForBufferPosition([0, 11]).getScopesArray();
    expect(commaScopes).toContain("invalid.illegal.comma.json");
  });
});
