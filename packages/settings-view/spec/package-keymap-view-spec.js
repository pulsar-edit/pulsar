
const PackageKeymapView = require("../lib/package-keymap-view.js");
let view;

describe("PackageKeymapView", () => {

  beforeEach(() => {
    // Just prevent this stuff from calling through, it doesn't matter for this test
    spyOn(atom.packages, "getLoadedPackage").andReturn({ keymaps: [] });

    view = new PackageKeymapView({
      name: "test-package"
    });
  });

  it("should say a selector with no platform listed is compatible with the current one", () => {
    expect(view.selectorIsNotCompatibleWithPlatform("atom-text-editor", "win32")).toBe(false);
  });

  it("should say a selector with a platform other than the current is not compatible", () => {
    expect(view.selectorIsNotCompatibleWithPlatform(".platform-darwin", "linux")).toBe(true);
    expect(view.selectorIsNotCompatibleWithPlatform(".platform-win32", "darwin")).toBe(true);
  });

  it("should say a selector with the current platform listed is compatible", () => {
    expect(view.selectorIsNotCompatibleWithPlatform(".platform-linux", "linux")).toBe(false);
    expect(view.selectorIsNotCompatibleWithPlatform(".platform-win32", "win32")).toBe(false);
    expect(view.selectorIsNotCompatibleWithPlatform(".platform-darwin", "darwin")).toBe(false);
  });

  it("should say a selector with the current platform and others listed is compatible", () => {
    expect(view.selectorIsNotCompatibleWithPlatform(".platform-linux, .platform-win32", "win32")).toBe(false);
    expect(view.selectorIsNotCompatibleWithPlatform(".platform-linux, .platform-win32", "linux")).toBe(false);
  });
});
