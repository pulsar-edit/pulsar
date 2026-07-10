const FindOptions = require("../lib/find-options");
const BufferSearch = require("../lib/buffer-search");

describe("BufferSearch", () => {
  let editor, model, markersListener;

  beforeEach(() => {
    for (const key of ["useRegex", "caseSensitive", "wholeWord", "inCurrentSelection"]) {
      atom.config.set(`search-panel.${key}`, false);
    }

    editor = atom.workspace.buildTextEditor();
    editor.setText("one two One\none oneone\ntwo one\n");

    model = new BufferSearch(new FindOptions());
    model.setEditor(editor);

    markersListener = jasmine.createSpy("markersListener");
    model.onDidUpdate(markersListener);
  });

  afterEach(() => model.destroy());

  it("marks every occurrence of the pattern and emits did-update", () => {
    model.search("one");
    // "one" (case-insensitive default): line0 col0, line0 col8 (One),
    // line1 col0, line1 col4, line1 col7, line2 col4 => 6 matches.
    expect(model.markers.length).toBe(6);
    expect(markersListener).toHaveBeenCalled();
  });

  it("clears markers when the pattern is emptied", () => {
    model.search("one");
    expect(model.markers.length).toBeGreaterThan(0);
    model.search("");
    expect(model.markers.length).toBe(0);
  });

  describe("the case-sensitive option", () => {
    it("matches any case when disabled", () => {
      model.search("one", { caseSensitive: false });
      expect(model.markers.length).toBe(6);
    });

    it("matches exact case when enabled", () => {
      model.search("One", { caseSensitive: true });
      expect(model.markers.length).toBe(1);
    });
  });

  describe("the whole-word option", () => {
    it("only matches standalone words when enabled", () => {
      // Without whole-word "one" matches inside "oneone"; with it, that is excluded.
      model.search("one", { wholeWord: false, caseSensitive: true });
      const loose = model.markers.length;
      model.search("one", { wholeWord: true, caseSensitive: true });
      expect(model.markers.length).toBeLessThan(loose);
      // Standalone lowercase "one": line0 col0, line1 col0, line2 col4 => 3.
      expect(model.markers.length).toBe(3);
    });
  });

  describe("the regex option", () => {
    it("interprets the pattern as a regular expression when enabled", () => {
      model.search("o.e", { useRegex: true, caseSensitive: true });
      // matches every lowercase "one" occurrence including inside "oneone".
      expect(model.markers.length).toBe(5);
    });

    it("treats the pattern literally when disabled", () => {
      model.search("o.e", { useRegex: false });
      expect(model.markers.length).toBe(0);
    });
  });

  describe("the in-current-selection option", () => {
    it("only searches within the selected ranges", () => {
      editor.setSelectedBufferRange([
        [0, 0],
        [0, 11],
      ]);
      model.search("one", { inCurrentSelection: true, caseSensitive: true });
      // Only the first line is selected -> single lowercase "one".
      expect(model.markers.length).toBe(1);
    });
  });

  describe("replace", () => {
    it("replaces the given markers and shrinks the marker set", () => {
      model.search("one", { caseSensitive: true });
      const before = model.markers.length;
      const [first] = model.markers;
      model.replace([first], "X");
      expect(model.markers.length).toBe(before - 1);
      expect(editor.getText()).toContain("X");
    });

    it("replaces every marker when passed the full set", () => {
      model.search("two", { caseSensitive: true });
      model.replace(model.markers.slice(), "2");
      expect(model.markers.length).toBe(0);
      expect(editor.getText()).not.toContain("two");
    });
  });
});
