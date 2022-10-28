/** @babel */

import path from 'path';
import IncompatiblePackagesComponent from '../lib/incompatible-packages-component';
import StatusIconComponent from '../lib/status-icon-component';

// This exists only so that CI passes on both Atom 1.6 and Atom 1.8+.
function findStatusBar() {
  if (typeof core.workspace.getFooterPanels === 'function') {
    const footerPanels = core.workspace.getFooterPanels();
    if (footerPanels.length > 0) {
      return footerPanels[0].getItem();
    }
  }

  return core.workspace.getBottomPanels()[0].getItem();
}

describe('Incompatible packages', () => {
  let statusBar;

  beforeEach(() => {
    core.views.getView(core.workspace);

    waitsForPromise(() => core.packages.activatePackage('status-bar'));

    runs(() => {
      statusBar = findStatusBar();
    });
  });

  describe('when there are packages with incompatible native modules', () => {
    beforeEach(() => {
      let incompatiblePackage = core.packages.loadPackage(
        path.join(__dirname, 'fixtures', 'incompatible-package')
      );
      spyOn(incompatiblePackage, 'isCompatible').andReturn(false);
      incompatiblePackage.incompatibleModules = [];
      waitsForPromise(() =>
        core.packages.activatePackage('incompatible-packages')
      );

      waits(1);
    });

    it('adds an icon to the status bar', () => {
      let statusBarIcon = statusBar.getRightTiles()[0].getItem();
      expect(statusBarIcon.constructor).toBe(StatusIconComponent);
    });

    describe('clicking the icon', () => {
      it('displays the incompatible packages view in a pane', () => {
        let statusBarIcon = statusBar.getRightTiles()[0].getItem();
        statusBarIcon.element.dispatchEvent(new MouseEvent('click'));

        let activePaneItem;
        waitsFor(() => (activePaneItem = core.workspace.getActivePaneItem()));

        runs(() => {
          expect(activePaneItem.constructor).toBe(
            IncompatiblePackagesComponent
          );
        });
      });
    });
  });

  describe('when there are no packages with incompatible native modules', () => {
    beforeEach(() => {
      waitsForPromise(() =>
        core.packages.activatePackage('incompatible-packages')
      );
    });

    it('does not add an icon to the status bar', () => {
      let statusBarItemClasses = statusBar
        .getRightTiles()
        .map(tile => tile.getItem().className);

      expect(statusBarItemClasses).not.toContain('incompatible-packages');
    });
  });
});
