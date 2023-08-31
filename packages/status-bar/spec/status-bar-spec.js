/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
describe("Status Bar package", function() {
  let [editor, statusBar, statusBarService, workspaceElement, mainModule] = [];

  beforeEach(function() {
    workspaceElement = atom.views.getView(atom.workspace);

    return waitsForPromise(() => atom.packages.activatePackage('status-bar').then(function(pack) {
      statusBar = workspaceElement.querySelector("status-bar");
      statusBarService = pack.mainModule.provideStatusBar();
      return ({mainModule} = pack);
    }));
  });

  describe("@activate()", () => it("appends only one status bar", function() {
    expect(workspaceElement.querySelectorAll('status-bar').length).toBe(1);
    atom.workspace.getActivePane().splitRight({copyActiveItem: true});
    return expect(workspaceElement.querySelectorAll('status-bar').length).toBe(1);
  }));

  describe("@deactivate()", () => it("removes the status bar view", function() {
    waitsForPromise(() => Promise.resolve(atom.packages.deactivatePackage('status-bar'))); // Wrapped so works with Promise & non-Promise deactivate
    return runs(() => expect(workspaceElement.querySelector('status-bar')).toBeNull());
  }));

  describe("isVisible option", function() {
    beforeEach(() => jasmine.attachToDOM(workspaceElement));

    describe("when it is true", function() {
      beforeEach(() => atom.config.set('status-bar.isVisible', true));

      return it("shows status bar", () => expect(workspaceElement.querySelector('status-bar').parentNode).toBeVisible());
    });

    return describe("when it is false", function() {
      beforeEach(() => atom.config.set('status-bar.isVisible', false));

      return it("hides status bar", () => expect(workspaceElement.querySelector('status-bar').parentNode).not.toBeVisible());
    });
  });

  describe("when status-bar:toggle is triggered", function() {
    beforeEach(function() {
      jasmine.attachToDOM(workspaceElement);
      return atom.config.set('status-bar.isVisible', true);
    });

    it("hides or shows the status bar", function() {
      atom.commands.dispatch(workspaceElement, 'status-bar:toggle');
      expect(workspaceElement.querySelector('status-bar').parentNode).not.toBeVisible();
      atom.commands.dispatch(workspaceElement, 'status-bar:toggle');
      return expect(workspaceElement.querySelector('status-bar').parentNode).toBeVisible();
    });

    return it("toggles the value of isVisible in config file", function() {
      expect(atom.config.get('status-bar.isVisible')).toBe(true);
      atom.commands.dispatch(workspaceElement, 'status-bar:toggle');
      expect(atom.config.get('status-bar.isVisible')).toBe(false);
      atom.commands.dispatch(workspaceElement, 'status-bar:toggle');
      return expect(atom.config.get('status-bar.isVisible')).toBe(true);
    });
  });

  describe("full-width setting", function() {
    let [containers] = [];

    beforeEach(function() {
      containers = atom.workspace.panelContainers;
      jasmine.attachToDOM(workspaceElement);

      return waitsForPromise(() => atom.workspace.open('sample.js'));
    });

    it("expects the setting to be enabled by default", function() {
      expect(atom.config.get('status-bar.fullWidth')).toBeTruthy();
      return expect(containers.footer.panels).toContain(mainModule.statusBarPanel);
    });

    return describe("when setting is changed", function() {
      it("fits status bar to editor's width", function() {
        atom.config.set('status-bar.fullWidth', false);
        expect(containers.bottom.panels).toContain(mainModule.statusBarPanel);
        return expect(containers.footer.panels).not.toContain(mainModule.statusBarPanel);
      });

      return it("restores the status-bar location when re-enabling setting", function() {
        atom.config.set('status-bar.fullWidth', true);
        expect(containers.footer.panels).toContain(mainModule.statusBarPanel);
        return expect(containers.bottom.panels).not.toContain(mainModule.statusBarPanel);
      });
    });
  });

  return describe("the 'status-bar' service", function() {
    it("allows tiles to be added, removed, and retrieved", function() {
      let dummyView = document.createElement("div");
      let tile = statusBarService.addLeftTile({item: dummyView});
      expect(statusBar).toContain(dummyView);
      expect(statusBarService.getLeftTiles()).toContain(tile);
      tile.destroy();
      expect(statusBar).not.toContain(dummyView);
      expect(statusBarService.getLeftTiles()).not.toContain(tile);

      dummyView = document.createElement("div");
      tile = statusBarService.addRightTile({item: dummyView});
      expect(statusBar).toContain(dummyView);
      expect(statusBarService.getRightTiles()).toContain(tile);
      tile.destroy();
      expect(statusBar).not.toContain(dummyView);
      return expect(statusBarService.getRightTiles()).not.toContain(tile);
    });

    return it("allows the git info tile to be disabled", function() {
      const getGitInfoTile = () => statusBar.getRightTiles().find(tile => tile.item.matches('.git-view'));

      expect(getGitInfoTile()).not.toBeUndefined();
      statusBarService.disableGitInfoTile();
      return expect(getGitInfoTile()).toBeUndefined();
    });
  });
});
