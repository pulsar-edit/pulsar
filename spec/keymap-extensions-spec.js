const temp = require("temp").track();
const fs = require("@lumine-code/fs-plus");
const path = require("path");

describe("keymap-extensions", function () {
  beforeEach(function () {
    atom.keymaps.configDirPath = temp.path("atom-spec-keymap-ext");
    fs.writeFileSync(atom.keymaps.getUserKeymapPath(), "// User keymap\n{}");
    this.userKeymapLoaded = function () {};
    atom.keymaps.onDidLoadUserKeymap(() => this.userKeymapLoaded());
  });

  afterEach(function () {
    fs.removeSync(atom.keymaps.configDirPath);
    atom.keymaps.destroy();
  });

  describe("did-load-user-keymap", () =>
    it("fires when user keymap is loaded", function () {
      spyOn(this, "userKeymapLoaded");
      atom.keymaps.loadUserKeymap();
      expect(this.userKeymapLoaded).toHaveBeenCalled();
    }));

  it("uses keymap.json as the default path", () => {
    expect(atom.keymaps.getUserKeymapPath()).toBe(
      path.join(atom.keymaps.configDirPath, "keymap.json"),
    );
  });

  it("continues to resolve an existing CSON keymap", () => {
    fs.removeSync(atom.keymaps.getUserKeymapPath());
    const csonPath = path.join(atom.keymaps.configDirPath, "keymap.cson");
    fs.writeFileSync(csonPath, "'.workspace': 'ctrl-l': 'core:move-left'");
    expect(atom.keymaps.getUserKeymapPath()).toBe(csonPath);
  });
});
