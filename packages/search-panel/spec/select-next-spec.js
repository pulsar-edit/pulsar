describe("search-panel select-next commands", () => {
  let editor, editorElement;

  beforeEach(async () => {
    editor = await atom.workspace.open();
    editor.setText("foo bar\nfoo baz\nfoo qux\n");
    editorElement = atom.views.getView(editor);

    // search-panel activates on command, so trigger one and await activation.
    const activationPromise = atom.packages.activatePackage("search-panel");
    atom.commands.dispatch(atom.views.getView(atom.workspace), "search-panel:show");
    await activationPromise;
  });

  const dispatch = (command) => atom.commands.dispatch(editorElement, command);
  const selectedTexts = () => editor.getSelections().map((s) => s.getText());

  it("selects the word under the cursor, then the next occurrence", () => {
    editor.setCursorBufferPosition([0, 1]);
    dispatch("search-panel:select-next");
    expect(selectedTexts()).toEqual(["foo"]);

    dispatch("search-panel:select-next");
    expect(editor.getSelections().length).toBe(2);
    expect(selectedTexts()).toEqual(["foo", "foo"]);
  });

  it("selects all occurrences", () => {
    editor.setCursorBufferPosition([0, 1]);
    dispatch("search-panel:select-all");
    expect(editor.getSelections().length).toBe(3);
    expect(selectedTexts()).toEqual(["foo", "foo", "foo"]);
  });

  it("skips the current occurrence and selects the next", () => {
    editor.setCursorBufferPosition([0, 1]);
    dispatch("search-panel:select-next");
    dispatch("search-panel:select-skip");
    dispatch("search-panel:select-next");

    const ranges = editor.getSelectedBufferRanges();
    expect(ranges.length).toBe(2);
    // The first occurrence was skipped, so no selection remains on line 0.
    expect(ranges.some((r) => r.start.row === 0)).toBe(false);
  });

  it("undoes the last added selection", () => {
    editor.setCursorBufferPosition([0, 1]);
    dispatch("search-panel:select-next");
    dispatch("search-panel:select-next");
    expect(editor.getSelections().length).toBe(2);

    dispatch("search-panel:select-undo");
    expect(editor.getSelections().length).toBe(1);
  });
});
