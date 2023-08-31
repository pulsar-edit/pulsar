/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const InstallPanel = require('../lib/install-panel');
const PackageManager = require('../lib/package-manager');
const SettingsView = require('../lib/settings-view');

describe('InstallPanel', function() {
  beforeEach(function() {
    const settingsView = new SettingsView();
    this.packageManager = new PackageManager();
    return this.panel = new InstallPanel(settingsView, this.packageManager);
  });

  describe("when the packages button is clicked", function() {
    beforeEach(function() {
      spyOn(this.panel, 'search');
      return this.panel.refs.searchEditor.setText('something');
    });

    return it("performs a search for the contents of the input", function() {
      this.panel.refs.searchPackagesButton.click();
      expect(this.panel.searchType).toBe('packages');
      expect(this.panel.search).toHaveBeenCalledWith('something');
      expect(this.panel.search.callCount).toBe(1);

      this.panel.refs.searchPackagesButton.click();
      expect(this.panel.searchType).toBe('packages');
      expect(this.panel.search).toHaveBeenCalledWith('something');
      return expect(this.panel.search.callCount).toBe(2);
    });
  });

  describe("when the themes button is clicked", function() {
    beforeEach(function() {
      spyOn(this.panel, 'search');
      return this.panel.refs.searchEditor.setText('something');
    });

    return it("performs a search for the contents of the input", function() {
      this.panel.refs.searchThemesButton.click();
      expect(this.panel.searchType).toBe('themes');
      expect(this.panel.search.callCount).toBe(1);
      expect(this.panel.search).toHaveBeenCalledWith('something');

      this.panel.refs.searchThemesButton.click();
      expect(this.panel.searchType).toBe('themes');
      return expect(this.panel.search.callCount).toBe(2);
    });
  });

  describe("when the buttons are toggled", function() {
    beforeEach(function() {
      spyOn(this.panel, 'search');
      return this.panel.refs.searchEditor.setText('something');
    });

    return it("performs a search for the contents of the input", function() {
      this.panel.refs.searchThemesButton.click();
      expect(this.panel.searchType).toBe('themes');
      expect(this.panel.search.callCount).toBe(1);
      expect(this.panel.search).toHaveBeenCalledWith('something');

      this.panel.refs.searchPackagesButton.click();
      expect(this.panel.searchType).toBe('packages');
      expect(this.panel.search.callCount).toBe(2);

      this.panel.refs.searchThemesButton.click();
      expect(this.panel.searchType).toBe('themes');
      return expect(this.panel.search.callCount).toBe(3);
    });
  });

  describe("searching packages", () => it("displays the packages in the order returned", function() {
    spyOn(this.panel.client, 'search').andCallFake(() => Promise.resolve([{name: 'not-first'}, {name: 'first'}]));
    spyOn(this.panel, 'getPackageCardView').andCallThrough();

    waitsForPromise(() => {
      return this.panel.search('first');
    });

    return runs(function() {
      expect(this.panel.getPackageCardView.argsForCall[0][0].name).toEqual('not-first');
      return expect(this.panel.getPackageCardView.argsForCall[1][0].name).toEqual('first');
    });
  }));

  return describe("searching git packages", function() {
    beforeEach(function() {
      return spyOn(this.panel, 'showGitInstallPackageCard').andCallThrough();
    });

    it("shows a git installation card with git specific info for ssh URLs", function() {
      const query = 'git@github.com:user/repo.git';
      this.panel.performSearchForQuery(query);
      const args = this.panel.showGitInstallPackageCard.argsForCall[0][0];
      expect(args.name).toEqual(query);
      return expect(args.gitUrlInfo).toBeTruthy();
    });

    it("shows a git installation card with git specific info for https URLs", function() {
      const query = 'https://github.com/user/repo.git';
      this.panel.performSearchForQuery(query);
      const args = this.panel.showGitInstallPackageCard.argsForCall[0][0];
      expect(args.name).toEqual(query);
      return expect(args.gitUrlInfo).toBeTruthy();
    });

    it("shows a git installation card with git specific info for shortcut URLs", function() {
      const query = 'user/repo';
      this.panel.performSearchForQuery(query);
      const args = this.panel.showGitInstallPackageCard.argsForCall[0][0];
      expect(args.name).toEqual(query);
      return expect(args.gitUrlInfo).toBeTruthy();
    });

    it("doesn't show a git installation card for normal packages", function() {
      const query = 'this-package-is-so-normal';
      this.panel.performSearchForQuery(query);
      return expect(this.panel.showGitInstallPackageCard).not.toHaveBeenCalled();
    });

    return describe("when a package with the same gitUrlInfo property is installed", function() {
      beforeEach(function() {
        this.gitUrlInfo = jasmine.createSpy('gitUrlInfo');
        return this.panel.showGitInstallPackageCard({gitUrlInfo: this.gitUrlInfo});
      });

      return it("replaces the package card with the newly installed pack object", function() {
        const newPack =
          {gitUrlInfo: this.gitUrlInfo};
        spyOn(this.panel, 'updateGitPackageCard');
        this.packageManager.emitter.emit('package-installed', {pack: newPack});
        return expect(this.panel.updateGitPackageCard).toHaveBeenCalledWith(newPack);
      });
    });
  });
});
