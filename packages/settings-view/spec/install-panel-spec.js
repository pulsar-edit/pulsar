
const InstallPanel = require('../lib/install-panel');
const PackageManager = require('../lib/package-manager');
const SettingsView = require('../lib/settings-view');

let packageManager;
let panel;
let gitUrlInfo;

describe('InstallPanel', function() {
  beforeEach(function() {
    const settingsView = new SettingsView();
    packageManager = new PackageManager();
    panel = new InstallPanel(settingsView, packageManager);
  });

  describe("when the packages button is clicked", function() {
    beforeEach(function() {
      spyOn(panel, 'search');
      panel.refs.searchEditor.setText('something');
    });

    it("performs a search for the contents of the input", function() {
      panel.refs.searchPackagesButton.click();
      expect(panel.searchType).toBe('packages');
      expect(panel.search).toHaveBeenCalledWith('something');
      expect(panel.search.callCount).toBe(1);

      panel.refs.searchPackagesButton.click();
      expect(panel.searchType).toBe('packages');
      expect(panel.search).toHaveBeenCalledWith('something');
      expect(panel.search.callCount).toBe(2);
    });
  });

  describe("when the themes button is clicked", function() {
    beforeEach(function() {
      spyOn(panel, 'search');
      panel.refs.searchEditor.setText('something');
    });

    it("performs a search for the contents of the input", function() {
      panel.refs.searchThemesButton.click();
      expect(panel.searchType).toBe('themes');
      expect(panel.search.callCount).toBe(1);
      expect(panel.search).toHaveBeenCalledWith('something');

      panel.refs.searchThemesButton.click();
      expect(panel.searchType).toBe('themes');
      expect(panel.search.callCount).toBe(2);
    });
  });

  describe("when the buttons are toggled", function() {
    beforeEach(function() {
      spyOn(panel, 'search');
      panel.refs.searchEditor.setText('something');
    });

    it("performs a search for the contents of the input", function() {
      panel.refs.searchThemesButton.click();
      expect(panel.searchType).toBe('themes');
      expect(panel.search.callCount).toBe(1);
      expect(panel.search).toHaveBeenCalledWith('something');

      panel.refs.searchPackagesButton.click();
      expect(panel.searchType).toBe('packages');
      expect(panel.search.callCount).toBe(2);

      panel.refs.searchThemesButton.click();
      expect(panel.searchType).toBe('themes');
      expect(panel.search.callCount).toBe(3);
    });
  });

  describe("searching packages", () => it("displays the packages in the order returned", function() {
    spyOn(panel.client, 'search').andCallFake(() => Promise.resolve([{name: 'not-first'}, {name: 'first'}]));
    spyOn(panel, 'getPackageCardView').andCallThrough();

    waitsForPromise(() => {
      return panel.search('first');
    });

    return runs(function() {
      expect(panel.getPackageCardView.argsForCall[0][0].name).toEqual('not-first');
      expect(panel.getPackageCardView.argsForCall[1][0].name).toEqual('first');
    });
  }));

  describe("searching git packages", function() {
    beforeEach(() => {
      return spyOn(panel, 'showGitInstallPackageCard').andCallThrough();
    });

    it("shows a git installation card with git specific info for ssh URLs", function() {
      const query = 'git@github.com:user/repo.git';
      panel.performSearchForQuery(query);
      const args = panel.showGitInstallPackageCard.argsForCall[0][0];
      expect(args.name).toEqual(query);
      expect(args.gitUrlInfo).toBeTruthy();
    });

    it("shows a git installation card with git specific info for https URLs", function() {
      const query = 'https://github.com/user/repo.git';
      panel.performSearchForQuery(query);
      const args = panel.showGitInstallPackageCard.argsForCall[0][0];
      expect(args.name).toEqual(query);
      expect(args.gitUrlInfo).toBeTruthy();
    });

    it("shows a git installation card with git specific info for shortcut URLs", function() {
      const query = 'user/repo';
      panel.performSearchForQuery(query);
      const args = panel.showGitInstallPackageCard.argsForCall[0][0];
      expect(args.name).toEqual(query);
      expect(args.gitUrlInfo).toBeTruthy();
    });

    it("doesn't show a git installation card for normal packages", function() {
      const query = 'this-package-is-so-normal';
      panel.performSearchForQuery(query);
      expect(panel.showGitInstallPackageCard).not.toHaveBeenCalled();
    });

    describe("when a package with the same gitUrlInfo property is installed", function() {
      beforeEach(function() {
        gitUrlInfo = jasmine.createSpy('gitUrlInfo');
        return panel.showGitInstallPackageCard({gitUrlInfo: gitUrlInfo});
      });

      it("replaces the package card with the newly installed pack object", function() {
        const newPack =
          {gitUrlInfo: gitUrlInfo};
        spyOn(panel, 'updateGitPackageCard');
        packageManager.emitter.emit('package-installed', {pack: newPack});
        expect(panel.updateGitPackageCard).toHaveBeenCalledWith(newPack);
      });
    });
  });
});
