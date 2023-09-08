
const path = require('path');

const fs = require('fs-plus');
const InstalledPackagesPanel = require('../lib/installed-packages-panel');
const PackageManager = require('../lib/package-manager');
const PackageCard = require('../lib/package-card');
const SettingsView = require('../lib/settings-view');

describe('InstalledPackagesPanel', function() {
  describe('when the packages are loading', () => it('filters packages by name once they have loaded', function() {
    const settingsView = new SettingsView;
    this.packageManager = new PackageManager;
    this.installed = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'installed.json')));
    spyOn(this.packageManager, 'getOutdated').andReturn(new Promise(function() {}));
    spyOn(this.packageManager, 'loadCompatiblePackageVersion').andCallFake(function() {});
    spyOn(this.packageManager, 'getInstalled').andReturn(Promise.resolve(this.installed));
    this.panel = new InstalledPackagesPanel(settingsView, this.packageManager);
    this.panel.refs.filterEditor.setText('user-');
    window.advanceClock(this.panel.refs.filterEditor.getBuffer().stoppedChangingDelay);

    waitsFor(function() {
      return (this.packageManager.getInstalled.callCount === 1) && (this.panel.refs.communityCount.textContent.indexOf('…') < 0);
    });

    runs(function() {
      expect(this.panel.refs.communityCount.textContent.trim()).toBe('1/1');
      expect(this.panel.refs.communityPackages.querySelectorAll('.package-card:not(.hidden)').length).toBe(1);

      expect(this.panel.refs.coreCount.textContent.trim()).toBe('0/1');
      expect(this.panel.refs.corePackages.querySelectorAll('.package-card:not(.hidden)').length).toBe(0);

      expect(this.panel.refs.devCount.textContent.trim()).toBe('0/1');
      expect(this.panel.refs.devPackages.querySelectorAll('.package-card:not(.hidden)').length).toBe(0);
    });
  }));

  describe('when the packages have finished loading', function() {
    beforeEach(function() {
      const settingsView = new SettingsView;
      this.packageManager = new PackageManager;
      this.installed = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'installed.json')));
      spyOn(this.packageManager, 'getOutdated').andReturn(new Promise(function() {}));
      spyOn(this.packageManager, 'loadCompatiblePackageVersion').andCallFake(function() {});
      spyOn(this.packageManager, 'getInstalled').andReturn(Promise.resolve(this.installed));
      this.panel = new InstalledPackagesPanel(settingsView, this.packageManager);

      waitsFor(function() {
        return (this.packageManager.getInstalled.callCount === 1) && (this.panel.refs.communityCount.textContent.indexOf('…') < 0);
      });
    });

    it('shows packages', function() {
      expect(this.panel.refs.communityCount.textContent.trim()).toBe('1');
      expect(this.panel.refs.communityPackages.querySelectorAll('.package-card:not(.hidden)').length).toBe(1);

      expect(this.panel.refs.coreCount.textContent.trim()).toBe('1');
      expect(this.panel.refs.corePackages.querySelectorAll('.package-card:not(.hidden)').length).toBe(1);

      expect(this.panel.refs.devCount.textContent.trim()).toBe('1');
      expect(this.panel.refs.devPackages.querySelectorAll('.package-card:not(.hidden)').length).toBe(1);
    });

    it('filters packages by name', function() {
      this.panel.refs.filterEditor.setText('user-');
      window.advanceClock(this.panel.refs.filterEditor.getBuffer().stoppedChangingDelay);
      expect(this.panel.refs.communityCount.textContent.trim()).toBe('1/1');
      expect(this.panel.refs.communityPackages.querySelectorAll('.package-card:not(.hidden)').length).toBe(1);

      expect(this.panel.refs.coreCount.textContent.trim()).toBe('0/1');
      expect(this.panel.refs.corePackages.querySelectorAll('.package-card:not(.hidden)').length).toBe(0);

      expect(this.panel.refs.devCount.textContent.trim()).toBe('0/1');
      expect(this.panel.refs.devPackages.querySelectorAll('.package-card:not(.hidden)').length).toBe(0);
    });

    it('adds newly installed packages to the list', function() {
      let [installCallback] = [];
      spyOn(this.packageManager, 'runCommand').andCallFake(function(args, callback) {
        installCallback = callback;
        return {onWillThrowError() {}};
      });
      spyOn(atom.packages, 'activatePackage').andCallFake(name => {
        return this.installed.user.push({name});
    });

      expect(this.panel.refs.communityCount.textContent.trim()).toBe('1');
      expect(this.panel.refs.communityPackages.querySelectorAll('.package-card:not(.hidden)').length).toBe(1);

      this.packageManager.install({name: 'another-user-package'});
      installCallback(0, '', '');

      advanceClock(InstalledPackagesPanel.loadPackagesDelay());
      waits(1);
      runs(function() {
        expect(this.panel.refs.communityCount.textContent.trim()).toBe('2');
        expect(this.panel.refs.communityPackages.querySelectorAll('.package-card:not(.hidden)').length).toBe(2);
      });
    });

    it('removes uninstalled packages from the list', function() {
      let [uninstallCallback] = [];
      spyOn(this.packageManager, 'runCommand').andCallFake(function(args, callback) {
        uninstallCallback = callback;
        return {onWillThrowError() {}};
      });
      spyOn(this.packageManager, 'unload').andCallFake(name => {
        return this.installed.user = [];
    });

      expect(this.panel.refs.communityCount.textContent.trim()).toBe('1');
      expect(this.panel.refs.communityPackages.querySelectorAll('.package-card:not(.hidden)').length).toBe(1);

      this.packageManager.uninstall({name: 'user-package'});
      uninstallCallback(0, '', '');

      advanceClock(InstalledPackagesPanel.loadPackagesDelay());
      waits(1);
      runs(function() {
        expect(this.panel.refs.communityCount.textContent.trim()).toBe('0');
        expect(this.panel.refs.communityPackages.querySelectorAll('.package-card:not(.hidden)').length).toBe(0);
      });
    });
  });

  describe('expanding and collapsing sub-sections', function() {
    beforeEach(function() {
      const settingsView = new SettingsView;
      this.packageManager = new PackageManager;
      this.installed = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'installed.json')));
      spyOn(this.packageManager, 'getOutdated').andReturn(new Promise(function() {}));
      spyOn(this.packageManager, 'loadCompatiblePackageVersion').andCallFake(function() {});
      spyOn(this.packageManager, 'getInstalled').andReturn(Promise.resolve(this.installed));
      this.panel = new InstalledPackagesPanel(settingsView, this.packageManager);

      waitsFor(function() {
        return (this.packageManager.getInstalled.callCount === 1) && (this.panel.refs.communityCount.textContent.indexOf('…') < 0);
      });
    });

    it('collapses and expands a sub-section if its header is clicked', function() {
      this.panel.element.querySelector('.sub-section.installed-packages .sub-section-heading').click();
      expect(this.panel.element.querySelector('.sub-section.installed-packages')).toHaveClass('collapsed');

      expect(this.panel.element.querySelector('.sub-section.core-packages')).not.toHaveClass('collapsed');
      expect(this.panel.element.querySelector('.sub-section.dev-packages')).not.toHaveClass('collapsed');

      this.panel.element.querySelector('.sub-section.installed-packages .sub-section-heading').click();
      expect(this.panel.element.querySelector('.sub-section.installed-packages')).not.toHaveClass('collapsed');
    });

    it('can collapse and expand any of the sub-sections', function() {
      let element;
      expect(this.panel.element.querySelectorAll('.sub-section-heading.has-items').length).toBe(3);

      for (element of Array.from(this.panel.element.querySelectorAll('.sub-section-heading.has-items'))) {
        element.click();
      }

      expect(this.panel.element.querySelector('.sub-section.installed-packages')).toHaveClass('collapsed');
      expect(this.panel.element.querySelector('.sub-section.core-packages')).toHaveClass('collapsed');
      expect(this.panel.element.querySelector('.sub-section.dev-packages')).toHaveClass('collapsed');

      for (element of Array.from(this.panel.element.querySelectorAll('.sub-section-heading.has-items'))) {
        element.click();
      }

      expect(this.panel.element.querySelector('.sub-section.installed-packages')).not.toHaveClass('collapsed');
      expect(this.panel.element.querySelector('.sub-section.core-packages')).not.toHaveClass('collapsed');
      expect(this.panel.element.querySelector('.sub-section.dev-packages')).not.toHaveClass('collapsed');
    });

    it('can collapse sub-sections when filtering', function() {
      this.panel.refs.filterEditor.setText('user-');
      window.advanceClock(this.panel.refs.filterEditor.getBuffer().stoppedChangingDelay);

      const hasItems = this.panel.element.querySelectorAll('.sub-section-heading.has-items');
      expect(hasItems.length).toBe(1);
      expect(hasItems[0].textContent).toMatch(/Community Packages/);
    });
  });

  describe('when there are no packages', function() {
    beforeEach(function() {
      const settingsView = new SettingsView;
      this.packageManager = new PackageManager;
      this.installed = {
        dev: [],
        user: [],
        core: []
      };
      spyOn(this.packageManager, 'getOutdated').andReturn(new Promise(function() {}));
      spyOn(this.packageManager, 'loadCompatiblePackageVersion').andCallFake(function() {});
      spyOn(this.packageManager, 'getInstalled').andReturn(Promise.resolve(this.installed));
      this.panel = new InstalledPackagesPanel(settingsView, this.packageManager);

      waitsFor(function() {
        return (this.packageManager.getInstalled.callCount === 1) && (this.panel.refs.communityCount.textContent.indexOf('…') < 0);
      });
    });

    it('has a count of zero in all headings', function() {
      expect(this.panel.element.querySelector('.section-heading-count').textContent).toMatch(/^0+$/);
      expect(this.panel.element.querySelectorAll('.sub-section .icon-package').length).toBe(4);
      expect(this.panel.element.querySelectorAll('.sub-section .icon-package.has-items').length).toBe(0);
    });

    it('can not collapse and expand any of the sub-sections', function() {
      let element;
      for (element of Array.from(this.panel.element.querySelectorAll('.sub-section .icon-package'))) {
        element.click();
      }

      expect(this.panel.element.querySelector('.sub-section.installed-packages')).not.toHaveClass('collapsed');
      expect(this.panel.element.querySelector('.sub-section.core-packages')).not.toHaveClass('collapsed');
      expect(this.panel.element.querySelector('.sub-section.dev-packages')).not.toHaveClass('collapsed');
    });

    it('does not allow collapsing on any section when filtering', function() {
      this.panel.refs.filterEditor.setText('user-');
      window.advanceClock(this.panel.refs.filterEditor.getBuffer().stoppedChangingDelay);

      expect(this.panel.element.querySelector('.section-heading-count').textContent).toMatch(/^(0\/0)+$/);
      expect(this.panel.element.querySelectorAll('.sub-section .icon-package').length).toBe(4);
      expect(this.panel.element.querySelectorAll('.sub-section .icon-paintcan.has-items').length).toBe(0);
    });
  });
});
