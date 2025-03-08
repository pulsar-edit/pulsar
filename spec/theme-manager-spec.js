const path = require('path');
const fs = require('fs-plus');
const temp = require('temp').track();

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function timeout(ms) {
  return new Promise((_, reject) => setTimeout(reject, ms, new Error('Timeout')));
}

async function waitForCondition(
  func,
  {
    intervalMs = 50,
    timeoutMs = jasmine.getEnv().defaultTimeoutInterval
  } = {}
) {
  let attempt = new Promise((resolve) => {
    const retryer = () => {
      if (func()) {
        resolve();
      } else {
        setTimeout(retryer, intervalMs);
      }
    }
    retryer();
  });

  return Promise.race([attempt, timeout(timeoutMs)]).catch((err) => {
    jasmine.getEnv().currentSpec.fail(err);
  });
}


fdescribe('atom.themes', () => {
  beforeEach(() => {
    jasmine.useRealClock();
    spyOn(atom, 'inSpecMode').andReturn(false);
    spyOn(console, 'warn');
  });

  afterEach(async () => {
    await atom.themes.deactivateThemes();
    try {
      temp.cleanupSync();
    } catch (error) {}
  });

  describe('theme getters and setters', () => {
    beforeEach(() => {
      jasmine.snapshotDeprecations();
      atom.packages.loadPackages();
    });

    afterEach(() => jasmine.restoreDeprecationsSnapshot());

    describe('getLoadedThemes', () =>
      it('gets all the loaded themes', () => {
        const themes = atom.themes.getLoadedThemes();
        expect(themes.length).toBeGreaterThan(2);
      }));

    describe('getActiveThemes', () => {
      it('gets all the active themes', async () => {
        jasmine.useRealClock();
        await atom.themes.activateThemes();
        const names = atom.config.get('core.themes');
        expect(names.length).toBeGreaterThan(0);
        const themes = atom.themes.getActiveThemes();
        expect(themes).toHaveLength(names.length);
      })
    });
  });

  describe('when the core.themes config value contains invalid entries', () => {
    it('ignores them', () => {
      atom.config.set('core.themes', [
        'atom-light-ui',
        null,
        undefined,
        '',
        false,
        4,
        {},
        [],
        'atom-dark-ui'
      ]);

      expect(atom.themes.getEnabledThemeNames()).toEqual([
        'atom-dark-ui',
        'atom-light-ui'
      ]);
    })
  });

  describe('::getImportPaths()', () => {
    it('returns the theme directories before the themes are loaded', () => {
      atom.config.set('core.themes', [
        'theme-with-index-less',
        'atom-dark-ui',
        'atom-light-ui'
      ]);

      const paths = atom.themes.getImportPaths();

      // syntax theme is not a dir at this time, so only two.
      expect(paths.length).toBe(2);
      expect(paths[0]).toContain('atom-light-ui');
      expect(paths[1]).toContain('atom-dark-ui');
    });

    it('ignores themes that cannot be resolved to a directory', () => {
      atom.config.set('core.themes', ['definitely-not-a-theme']);
      expect(() => atom.themes.getImportPaths()).not.toThrow();
    });
  });

  describe('when the core.themes config value changes', () => {
    it('add/removes stylesheets to reflect the new config value', async () => {
      jasmine.useRealClock();
      let didChangeActiveThemesHandler = jasmine.createSpy();
      atom.themes.onDidChangeActiveThemes(didChangeActiveThemesHandler);
      spyOn(atom.styles, 'getUserStyleSheetPath').andCallFake(() => null);

      await atom.themes.activateThemes();
      didChangeActiveThemesHandler.reset();
      atom.config.set('core.themes', []);

      await waitForCondition(() => {
        return didChangeActiveThemesHandler.callCount === 1;
      });

      didChangeActiveThemesHandler.reset();
      expect(document.querySelectorAll('style.theme')).toHaveLength(0);
      atom.config.set('core.themes', ['atom-dark-ui']);

      await waitForCondition(() => {
        return didChangeActiveThemesHandler.callCount === 1;
      });

      didChangeActiveThemesHandler.reset();
      expect(document.querySelectorAll('style[priority="1"]')).toHaveLength(2);
      expect(
        document
        .querySelector('style[priority="1"]')
        .getAttribute('source-path')
      ).toMatch(/atom-dark-ui/);
      atom.config.set('core.themes', ['atom-light-ui', 'atom-dark-ui']);

      await waitForCondition(() => {
        return didChangeActiveThemesHandler.callCount === 1;
      });

      didChangeActiveThemesHandler.reset();
      expect(document.querySelectorAll('style[priority="1"]')).toHaveLength(2);
      expect(
        document
        .querySelectorAll('style[priority="1"]')[0]
        .getAttribute('source-path')
      ).toMatch(/atom-dark-ui/);
      expect(
        document
        .querySelectorAll('style[priority="1"]')[1]
        .getAttribute('source-path')
      ).toMatch(/atom-light-ui/);
      atom.config.set('core.themes', []);

      await waitForCondition(() => {
        return didChangeActiveThemesHandler.callCount === 1;
      });

      didChangeActiveThemesHandler.reset();
      expect(document.querySelectorAll('style[priority="1"]')).toHaveLength(2);

      // atom-dark-ui has a directory path, the syntax one doesn't
      atom.config.set('core.themes', [
        'theme-with-index-less',
        'atom-dark-ui'
      ]);

      await waitForCondition(() => {
        return didChangeActiveThemesHandler.callCount === 1;
      });

      expect(document.querySelectorAll('style[priority="1"]')).toHaveLength(2);

      const importPaths = atom.themes.getImportPaths();
      expect(importPaths.length).toBe(1);
      expect(importPaths[0]).toContain('atom-dark-ui');
    });

    it('adds theme-* classes to the workspace for each active theme', async () => {
      jasmine.useRealClock();
      atom.config.set('core.themes', ['atom-dark-ui', 'atom-dark-syntax']);

      let didChangeActiveThemesHandler = jasmine.createSpy();
      atom.themes.onDidChangeActiveThemes(didChangeActiveThemesHandler);
      await atom.themes.activateThemes();

      const workspaceElement = atom.workspace.getElement();
      expect(workspaceElement).toHaveClass('theme-atom-dark-ui');

      atom.themes.onDidChangeActiveThemes(
        (didChangeActiveThemesHandler = jasmine.createSpy())
      );
      atom.config.set('core.themes', [
        'theme-with-ui-variables',
        'theme-with-syntax-variables'
      ]);

      await waitForCondition(() => {
        return didChangeActiveThemesHandler.callCount > 0;
      });

      // `theme-` twice as it prefixes the name with `theme-`
      expect(workspaceElement).toHaveClass('theme-theme-with-ui-variables');
      expect(workspaceElement).toHaveClass(
        'theme-theme-with-syntax-variables'
      );
      expect(workspaceElement).not.toHaveClass('theme-atom-dark-ui');
      expect(workspaceElement).not.toHaveClass('theme-atom-dark-syntax');
    });
  });

  describe('when a theme fails to load', () =>
    it('logs a warning', () => {
      console.warn.reset();
      atom.packages
        .activatePackage('a-theme-that-will-not-be-found')
        .then(() => {}, () => {});
      expect(console.warn.callCount).toBe(1);
      expect(console.warn.argsForCall[0][0]).toContain(
        "Could not resolve 'a-theme-that-will-not-be-found'"
      );
    }));

  describe('::requireStylesheet(path)', () => {
    beforeEach(() => jasmine.snapshotDeprecations());

    afterEach(() => jasmine.restoreDeprecationsSnapshot());

    it('synchronously loads css at the given path and installs a style tag for it in the head', () => {
      let styleElementAddedHandler;
      atom.styles.onDidAddStyleElement(
        (styleElementAddedHandler = jasmine.createSpy(
          'styleElementAddedHandler'
        ))
      );

      const cssPath = getAbsolutePath(
        atom.project.getDirectories()[0],
        'css.css'
      );
      const lengthBefore = document.querySelectorAll('head style').length;

      atom.themes.requireStylesheet(cssPath);
      expect(document.querySelectorAll('head style').length).toBe(
        lengthBefore + 1
      );

      expect(styleElementAddedHandler).toHaveBeenCalled();

      const element = document.querySelector(
        'head style[source-path*="css.css"]'
      );
      expect(element.getAttribute('source-path')).toEqualPath(cssPath);
      expect(element.textContent).toBe(fs.readFileSync(cssPath, 'utf8'));

      // doesn't append twice
      styleElementAddedHandler.reset();
      atom.themes.requireStylesheet(cssPath);
      expect(document.querySelectorAll('head style').length).toBe(
        lengthBefore + 1
      );
      expect(styleElementAddedHandler).not.toHaveBeenCalled();

      document
        .querySelectorAll('head style[id*="css.css"]')
        .forEach(styleElement => {
          styleElement.remove();
        });
    });

    it('synchronously loads and parses less files at the given path and installs a style tag for it in the head', () => {
      const lessPath = getAbsolutePath(
        atom.project.getDirectories()[0],
        'sample.less'
      );
      const lengthBefore = document.querySelectorAll('head style').length;
      atom.themes.requireStylesheet(lessPath);
      expect(document.querySelectorAll('head style').length).toBe(
        lengthBefore + 1
      );

      const element = document.querySelector(
        'head style[source-path*="sample.less"]'
      );
      expect(element.getAttribute('source-path')).toEqualPath(lessPath);
      expect(element.textContent.toLowerCase()).toBe(`\
#header {
  color: #4d926f;
}
h2 {
  color: #4d926f;
}
\
`);

      // doesn't append twice
      atom.themes.requireStylesheet(lessPath);
      expect(document.querySelectorAll('head style').length).toBe(
        lengthBefore + 1
      );
      document
        .querySelectorAll('head style[id*="sample.less"]')
        .forEach(styleElement => {
          styleElement.remove();
        });
    });

    it('supports requiring css and less stylesheets without an explicit extension', () => {
      atom.themes.requireStylesheet(path.join(__dirname, 'fixtures', 'css'));
      expect(
        document
          .querySelector('head style[source-path*="css.css"]')
          .getAttribute('source-path')
      ).toEqualPath(
        getAbsolutePath(atom.project.getDirectories()[0], 'css.css')
      );
      atom.themes.requireStylesheet(path.join(__dirname, 'fixtures', 'sample'));
      expect(
        document
          .querySelector('head style[source-path*="sample.less"]')
          .getAttribute('source-path')
      ).toEqualPath(
        getAbsolutePath(atom.project.getDirectories()[0], 'sample.less')
      );

      document.querySelector('head style[source-path*="css.css"]').remove();
      document.querySelector('head style[source-path*="sample.less"]').remove();
    });

    it('returns a disposable allowing styles applied by the given path to be removed', () => {
      const cssPath = require.resolve('./fixtures/css.css');

      expect(getComputedStyle(document.body).fontWeight).not.toBe('700');
      const disposable = atom.themes.requireStylesheet(cssPath);
      expect(getComputedStyle(document.body).fontWeight).toBe('700');

      let styleElementRemovedHandler;
      atom.styles.onDidRemoveStyleElement(
        (styleElementRemovedHandler = jasmine.createSpy(
          'styleElementRemovedHandler'
        ))
      );

      disposable.dispose();

      expect(getComputedStyle(document.body).fontWeight).not.toBe('bold');

      expect(styleElementRemovedHandler).toHaveBeenCalled();
    });
  });

  describe('base style sheet loading', () => {
    beforeEach(async () => {
      jasmine.useRealClock();
      const workspaceElement = atom.workspace.getElement();
      jasmine.attachToDOM(atom.workspace.getElement());
      workspaceElement.appendChild(document.createElement('atom-text-editor'));
      await atom.themes.activateThemes();
    });

    it("loads the correct values from the theme's ui-variables file", async () => {
      let didChangeActiveThemesHandler = jasmine.createSpy();
      atom.themes.onDidChangeActiveThemes(didChangeActiveThemesHandler);
      atom.config.set('core.themes', [
        'theme-with-ui-variables',
        'theme-with-syntax-variables'
      ]);

      await waitForCondition(() => {
        return didChangeActiveThemesHandler.callCount > 0;
      });

      // an override loaded in the base css
      expect(
        getComputedStyle(atom.workspace.getElement())['background-color']
      ).toBe('rgb(0, 0, 255)');

      // from within the theme itself
      expect(
        getComputedStyle(document.querySelector('atom-text-editor'))
        .paddingTop
      ).toBe('150px');
      expect(
        getComputedStyle(document.querySelector('atom-text-editor'))
        .paddingRight
      ).toBe('150px');
      expect(
        getComputedStyle(document.querySelector('atom-text-editor'))
        .paddingBottom
      ).toBe('150px');
    });

    describe('when there is a theme with incomplete variables', () => {
      it('loads the correct values from the fallback ui-variables', async () => {
        let didChangeActiveThemesHandler = jasmine.createSpy();
        atom.themes.onDidChangeActiveThemes(didChangeActiveThemesHandler);

        atom.config.set('core.themes', [
          'theme-with-incomplete-ui-variables',
          'theme-with-syntax-variables'
        ]);

        await waitForCondition(() => {
          return didChangeActiveThemesHandler.callCount > 0;
        });

        // an override loaded in the base css
        expect(
          getComputedStyle(atom.workspace.getElement())['background-color']
        ).toBe('rgb(0, 0, 255)');

        // from within the theme itself
        expect(
          getComputedStyle(document.querySelector('atom-text-editor'))
          .backgroundColor
        ).toBe('rgb(0, 152, 255)');
      })
    });
  });

  describe('user stylesheet', () => {
    let userStylesheetPath;
    beforeEach(async () => {
      userStylesheetPath = path.join(temp.mkdirSync('atom'), 'styles.less');
      fs.writeFileSync(
        userStylesheetPath,
        'body {border-style: dotted !important;}'
      );
      spyOn(atom.styles, 'getUserStyleSheetPath').andReturn(userStylesheetPath);
    });

    describe('when the user stylesheet changes', () => {
      beforeEach(() => jasmine.snapshotDeprecations());

      afterEach(() => jasmine.restoreDeprecationsSnapshot());

      it('reloads it', async () => {
        jasmine.useRealClock();

        await atom.themes.activateThemes();
        let styleElementRemovedHandler = jasmine.createSpy('styleElementRemovedHandler');
        let styleElementAddedHandler = jasmine.createSpy('styleElementAddedHandler');
        atom.styles.onDidRemoveStyleElement(styleElementRemovedHandler);
        atom.styles.onDidAddStyleElement(styleElementAddedHandler);

        spyOn(atom.themes, 'loadUserStylesheet').andCallThrough();

        expect(getComputedStyle(document.body).borderStyle).toBe('dotted');

        fs.writeFileSync(userStylesheetPath, 'body {border-style: dashed}');

        await waitForCondition(() => {
          return getComputedStyle(document.body).borderStyle === 'dashed';
        });

        expect(styleElementRemovedHandler).toHaveBeenCalled();
        expect(
          styleElementRemovedHandler.argsForCall[0]?.[0].textContent
        ).toContain('dotted');

        expect(styleElementAddedHandler).toHaveBeenCalled();
        expect(
          styleElementAddedHandler.argsForCall[0]?.[0].textContent
        ).toContain('dashed');

        styleElementRemovedHandler.reset();
        fs.removeSync(userStylesheetPath);

        await waitForCondition(() => {
          return getComputedStyle(document.body).borderStyle === 'none';
        });
      });
    });

    describe('when there is an error reading the stylesheet', () => {
      let addErrorHandler = null;
      beforeEach(async () => {
        jasmine.useRealClock();
        addErrorHandler = jasmine.createSpy();
        await atom.themes.loadUserStylesheet();
        spyOn(atom.themes.lessCache, 'cssForFile').andCallFake(() => {
          throw new Error('EACCES permission denied "styles.less"');
        });
        atom.notifications.onDidAddNotification(addErrorHandler);
      });

      it('creates an error notification and does not add the stylesheet', async () => {
        await atom.themes.loadUserStylesheet();
        expect(addErrorHandler).toHaveBeenCalled();
        const note = addErrorHandler.mostRecentCall.args[0];
        expect(note.getType()).toBe('error');
        expect(note.getMessage()).toContain('Error loading');
        expect(
          atom.styles.styleElementsBySourcePath[
            atom.styles.getUserStyleSheetPath()
          ]
        ).toBeUndefined();
      });
    });

    describe('when there is an error watching the user stylesheet', () => {
      let addErrorHandler = null;
      beforeEach(() => {
        jasmine.useRealClock();
        addErrorHandler = jasmine.createSpy();
        const watcher = require('../src/path-watcher');
        spyOn(watcher, 'watchPath').andCallFake(() => {
          throw new Error('Unable to watch path');
        });
        spyOn(atom.themes, 'loadStylesheet').andReturn('');
        atom.notifications.onDidAddNotification(addErrorHandler);
      });

      it('creates an error notification', async () => {
        await atom.themes.loadUserStylesheet();
        expect(addErrorHandler).toHaveBeenCalled();
        const note = addErrorHandler.mostRecentCall.args[0];
        expect(note.getType()).toBe('error');
        expect(note.getMessage()).toContain('Unable to watch path');
      });
    });

    it("adds a notification when a theme's stylesheet is invalid", () => {
      const addErrorHandler = jasmine.createSpy();
      atom.notifications.onDidAddNotification(addErrorHandler);
      expect(() =>
        atom.packages
          .activatePackage('theme-with-invalid-styles')
          .then(() => {}, () => {})
      ).not.toThrow();
      expect(addErrorHandler.callCount).toBe(2);
      expect(addErrorHandler.argsForCall[1][0].message).toContain(
        'Failed to activate the theme-with-invalid-styles theme'
      );
    });
  });

  describe('when a non-existent theme is present in the config', () => {
    beforeEach(async () => {
      console.warn.reset();
      jasmine.useRealClock();
      atom.config.set('core.themes', [
        'non-existent-dark-ui',
        'non-existent-dark-syntax'
      ]);

      await atom.themes.activateThemes();
    });

    it('uses the default one-dark UI and syntax themes and logs a warning', () => {
      const activeThemeNames = atom.themes.getActiveThemeNames();
      expect(console.warn.callCount).toBe(2);
      expect(activeThemeNames.length).toBe(2);
      expect(activeThemeNames).toContain('one-dark-ui');
      expect(activeThemeNames).toContain('one-dark-syntax');
    });
  });

  describe('when in safe mode', () => {
    describe('when the enabled UI and syntax themes are bundled with Atom', () => {
      beforeEach(async () => {
        jasmine.useRealClock();
        atom.config.set('core.themes', ['atom-light-ui', 'atom-dark-syntax']);

        await atom.themes.activateThemes();
      });

      it('uses the enabled themes', () => {
        const activeThemeNames = atom.themes.getActiveThemeNames();
        expect(activeThemeNames.length).toBe(2);
        expect(activeThemeNames).toContain('atom-light-ui');
        expect(activeThemeNames).toContain('atom-dark-syntax');
      });
    });

    describe('when the enabled UI and syntax themes are not bundled with Atom', () => {
      beforeEach(async () => {
        jasmine.useRealClock();
        atom.config.set('core.themes', [
          'installed-dark-ui',
          'installed-dark-syntax'
        ]);

        await atom.themes.activateThemes();
      });

      it('uses the default dark UI and syntax themes', () => {
        const activeThemeNames = atom.themes.getActiveThemeNames();
        expect(activeThemeNames.length).toBe(2);
        expect(activeThemeNames).toContain('one-dark-ui');
        expect(activeThemeNames).toContain('one-dark-syntax');
      });
    });

    describe('when the enabled UI theme is not bundled with Atom', () => {
      beforeEach(async () => {
        jasmine.useRealClock();
        atom.config.set('core.themes', [
          'installed-dark-ui',
          'atom-light-syntax'
        ]);

        await atom.themes.activateThemes();
      });

      it('uses the default one-dark UI theme', () => {
        const activeThemeNames = atom.themes.getActiveThemeNames();
        expect(activeThemeNames.length).toBe(2);
        expect(activeThemeNames).toContain('one-dark-ui');
        expect(activeThemeNames).toContain('atom-light-syntax');
      });
    });

    describe('when the enabled syntax theme is not bundled with Atom', () => {
      beforeEach(async () => {
        jasmine.useRealClock();
        atom.config.set('core.themes', [
          'atom-light-ui',
          'installed-dark-syntax'
        ]);

        await atom.themes.activateThemes();
      });

      it('uses the default one-dark syntax theme', () => {
        const activeThemeNames = atom.themes.getActiveThemeNames();
        expect(activeThemeNames.length).toBe(2);
        expect(activeThemeNames).toContain('atom-light-ui');
        expect(activeThemeNames).toContain('one-dark-syntax');
      });
    });
  });
});

function getAbsolutePath(directory, relativePath) {
  if (directory) {
    return directory.resolve(relativePath);
  }
}
