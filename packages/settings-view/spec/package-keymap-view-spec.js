const PackageKeymapView = require("../lib/package-keymap-view.js");
let view;

describe("PackageKeymapView", () => {
  beforeEach(() => {
    // Just prevent this stuff from calling through, it doesn't matter for this test
    spyOn(atom.packages, "getLoadedPackage").andReturn({ keymaps: [] });

    view = new PackageKeymapView({
      name: "test-package",
    });
  });

  afterEach(() => view.destroy());

  it("renders accessible package keybinding rows", () => {
    const row = view.elementForKeyBinding(
      {
        keystrokes: "ctrl-k",
        command: "test-package:run",
        selector: "atom-text-editor",
      },
      { renderShortcut: true, shortcutRowSpan: 2 },
    );

    expect(row.querySelector(".keystroke kbd").textContent).toBe("ctrl-k");
    expect(row.querySelector(".keystroke").rowSpan).toBe(2);
    expect(row.querySelector(".command").textContent).toBe("test-package:run");
    expect(row.querySelector(".selector").textContent).toBe("atom-text-editor");
    expect(row.querySelector(".copy-keybinding").tagName).toBe("BUTTON");
    expect(row.querySelector(".copy-keybinding").getAttribute("aria-label")).toContain("ctrl-k");
  });

  it("keeps a repeated shortcut available to the narrow card layout", () => {
    const row = view.elementForKeyBinding(
      {
        keystrokes: "ctrl-k",
        command: "test-package:other",
        selector: ".other-context",
      },
      { renderShortcut: false, shortcutRowSpan: 2 },
    );
    expect(row.querySelector(".keystroke")).toHaveClass("keybinding-mobile-shortcut");
  });

  it("escapes special characters in copied CSON overrides", () => {
    spyOn(atom.keymaps, "getUserKeymapPath").andReturn("keymap.cson");
    view.writeKeyBindingToClipboard({
      selector: "atom-text-editor[data-grammar~='css']",
      keystrokes: "ctrl-\\",
      command: "test-package:toggle's",
    });
    expect(atom.clipboard.read().replace(/\r\n/g, "\n"))
      .toBe(String.raw`'atom-text-editor[data-grammar~=\'css\']':
  'ctrl-\\': 'test-package:toggle\'s'`);
  });

  it("should say a selector with no platform listed is compatible with the current one", () => {
    expect(view.selectorIsCompatibleWithPlatform("atom-text-editor", "win32")).toBe(true);
  });

  it("should say a selector with a platform other than the current is not compatible", () => {
    expect(view.selectorIsCompatibleWithPlatform(".platform-darwin", "linux")).toBe(false);
    expect(view.selectorIsCompatibleWithPlatform(".platform-win32", "darwin")).toBe(false);
  });

  it("should say a selector with the current platform listed is compatible", () => {
    expect(view.selectorIsCompatibleWithPlatform(".platform-linux", "linux")).toBe(true);
    expect(view.selectorIsCompatibleWithPlatform(".platform-win32", "win32")).toBe(true);
    expect(view.selectorIsCompatibleWithPlatform(".platform-darwin", "darwin")).toBe(true);
  });

  it("should say a selector with the current platform and others listed is compatible", () => {
    expect(view.selectorIsCompatibleWithPlatform(".platform-linux, .platform-win32", "win32")).toBe(
      true,
    );
    expect(view.selectorIsCompatibleWithPlatform(".platform-linux, .platform-win32", "linux")).toBe(
      true,
    );
  });
});
