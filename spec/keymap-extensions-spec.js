const temp = require('temp').track();
const fs = require('fs-plus');

describe('keymap-extensions', function() {
  beforeEach(function() {
    core.keymaps.configDirPath = temp.path('atom-spec-keymap-ext');
    fs.writeFileSync(core.keymaps.getUserKeymapPath(), '#');
    this.userKeymapLoaded = function() {};
    core.keymaps.onDidLoadUserKeymap(() => this.userKeymapLoaded());
  });

  afterEach(function() {
    fs.removeSync(core.keymaps.configDirPath);
    core.keymaps.destroy();
  });

  describe('did-load-user-keymap', () =>
    it('fires when user keymap is loaded', function() {
      spyOn(this, 'userKeymapLoaded');
      core.keymaps.loadUserKeymap();
      expect(this.userKeymapLoaded).toHaveBeenCalled();
    }));
});
