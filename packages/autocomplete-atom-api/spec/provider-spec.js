const temp = require("temp");

describe("Atom API autocompletions", () => {
  let [editor, provider] = [];
  const conditionPromise = async (condition, description = "condition") => {
    const startedAt = Date.now();
    while (true) {
      if (condition()) {
        return;
      }
      if (Date.now() - startedAt > 5000) {
        throw new Error(`Timed out waiting for ${description}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  };

  const getCompletions = function () {
    const cursor = editor.getLastCursor();
    const start = cursor.getBeginningOfCurrentWordBufferPosition();
    const end = cursor.getBufferPosition();
    const prefix = editor.getTextInRange([start, end]);
    const request = {
      editor,
      bufferPosition: end,
      scopeDescriptor: cursor.getScopeDescriptor(),
      prefix,
    };
    return provider.getSuggestions(request);
  };

  beforeEach(async () => {
    jasmine.useRealClock();
    await atom.packages.activatePackage("autocomplete-atom-api");
    provider = atom.packages.getActivePackage("autocomplete-atom-api").mainModule.getProvider();
    await conditionPromise(() => Object.keys(provider.completions).length > 0, "completions");
    await conditionPromise(() => provider.packageDirectories?.length > 0, "package directories");
    await atom.workspace.open("test.js");
    editor = atom.workspace.getActiveTextEditor();
  });

  it("only includes completions in files that are in an Atom package or Atom core", () => {
    const emptyProjectPath = temp.mkdirSync("atom-project-");
    atom.project.setPaths([emptyProjectPath]);

    return atom.workspace.open("empty.js").then(() => {
      expect(provider.packageDirectories.length).toBe(0);
      editor = atom.workspace.getActiveTextEditor();
      editor.setText("atom.");
      editor.setCursorBufferPosition([0, Infinity]);

      expect(getCompletions()).toBeUndefined();
    });
  });

  it("only includes completions in .atom/init", () => {
    const emptyProjectPath = temp.mkdirSync("some-guy");
    atom.project.setPaths([emptyProjectPath]);

    return atom.workspace.open(".atom/init.coffee").then(() => {
      expect(provider.packageDirectories.length).toBe(0);
      editor = atom.workspace.getActiveTextEditor();
      editor.setText("atom.");
      editor.setCursorBufferPosition([0, Infinity]);

      expect(getCompletions()).not.toBeUndefined();
    });
  });

  it("does not fail when no editor path", () => {
    const emptyProjectPath = temp.mkdirSync("some-guy");
    atom.project.setPaths([emptyProjectPath]);

    return atom.workspace.open().then(() => {
      expect(provider.packageDirectories.length).toBe(0);
      editor = atom.workspace.getActiveTextEditor();
      editor.setText("atom.");
      editor.setCursorBufferPosition([0, Infinity]);
      expect(getCompletions()).toBeUndefined();
    });
  });

  it("includes properties and functions on the atom global", () => {
    editor.setText("atom.");
    editor.setCursorBufferPosition([0, Infinity]);

    expect(getCompletions().length).toBe(53);
    expect(getCompletions()[0].text).toBe("clipboard");

    editor.setText("var c = atom.");
    editor.setCursorBufferPosition([0, Infinity]);

    expect(getCompletions().length).toBe(53);
    expect(getCompletions()[0].text).toBe("clipboard");

    editor.setText("atom.c");
    editor.setCursorBufferPosition([0, Infinity]);
    expect(getCompletions().length).toBe(7);
    expect(getCompletions()[0].text).toBe("clipboard");
    expect(getCompletions()[0].type).toBe("property");
    expect(getCompletions()[0].leftLabel).toBe("Clipboard");
    expect(getCompletions()[1].text).toBe("commands");
    expect(getCompletions()[2].text).toBe("config");
    expect(getCompletions()[6].snippet).toBe("confirm(${1:options})");
    expect(getCompletions()[6].type).toBe("method");
    expect(getCompletions()[6].leftLabel).toBe("Number");
    expect(getCompletions()[6].descriptionMoreURL).toBe(
      "https://atom.io/docs/api/latest/AtomEnvironment#instance-confirm",
    );
  });

  it("includes methods on atom global properties", () => {
    editor.setText("atom.clipboard.");
    editor.setCursorBufferPosition([0, Infinity]);

    expect(getCompletions().length).toBe(3);
    expect(getCompletions()[0].text).toBe("read()");
    expect(getCompletions()[1].text).toBe("readWithMetadata()");
    expect(getCompletions()[2].snippet).toBe("write(${1:text}, ${2:metadata})");

    editor.setText("atom.clipboard.rea");
    editor.setCursorBufferPosition([0, Infinity]);

    expect(getCompletions().length).toBe(2);
    expect(getCompletions()[0].text).toBe("read()");
    expect(getCompletions()[1].text).toBe("readWithMetadata()");
  });
});
