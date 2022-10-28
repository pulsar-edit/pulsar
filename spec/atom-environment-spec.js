const { conditionPromise } = require('./async-spec-helpers');
const fs = require('fs');
const path = require('path');
const temp = require('temp').track();
const AtomEnvironment = require('../src/atom-environment');

describe('AtomEnvironment', () => {
  afterEach(() => {
    try {
      temp.cleanupSync();
    } catch (error) {}
  });

  describe('window sizing methods', () => {
    describe('::getPosition and ::setPosition', () => {
      let originalPosition = null;
      beforeEach(() => (originalPosition = core.getPosition()));

      afterEach(() => core.setPosition(originalPosition.x, originalPosition.y));

      it('sets the position of the window, and can retrieve the position just set', () => {
        core.setPosition(22, 45);
        expect(core.getPosition()).toEqual({ x: 22, y: 45 });
      });
    });

    describe('::getSize and ::setSize', () => {
      let originalSize = null;
      beforeEach(() => (originalSize = core.getSize()));
      afterEach(() => core.setSize(originalSize.width, originalSize.height));

      it('sets the size of the window, and can retrieve the size just set', async () => {
        const newWidth = originalSize.width - 12;
        const newHeight = originalSize.height - 23;
        await core.setSize(newWidth, newHeight);
        expect(core.getSize()).toEqual({ width: newWidth, height: newHeight });
      });
    });
  });

  describe('.isReleasedVersion()', () => {
    it('returns false if the version is a SHA and true otherwise', () => {
      let version = '0.1.0';
      spyOn(core, 'getVersion').andCallFake(() => version);
      expect(core.isReleasedVersion()).toBe(true);
      version = '36b5518';
      expect(core.isReleasedVersion()).toBe(false);
    });
  });

  describe('loading default config', () => {
    it('loads the default core config schema', () => {
      expect(core.config.get('core.excludeVcsIgnoredPaths')).toBe(true);
      expect(core.config.get('core.followSymlinks')).toBe(true);
      expect(core.config.get('editor.showInvisibles')).toBe(false);
    });
  });

  describe('window onerror handler', () => {
    let devToolsPromise = null;
    beforeEach(() => {
      devToolsPromise = Promise.resolve();
      spyOn(core, 'openDevTools').andReturn(devToolsPromise);
      spyOn(core, 'executeJavaScriptInDevTools');
    });

    it('will open the dev tools when an error is triggered', async () => {
      try {
        a + 1; // eslint-disable-line no-undef, no-unused-expressions
      } catch (e) {
        window.onerror(e.toString(), 'abc', 2, 3, e);
      }

      await devToolsPromise;
      expect(core.openDevTools).toHaveBeenCalled();
      expect(core.executeJavaScriptInDevTools).toHaveBeenCalled();
    });

    describe('::onWillThrowError', () => {
      let willThrowSpy = null;

      beforeEach(() => {
        willThrowSpy = jasmine.createSpy();
      });

      it('is called when there is an error', () => {
        let error = null;
        core.onWillThrowError(willThrowSpy);
        try {
          a + 1; // eslint-disable-line no-undef, no-unused-expressions
        } catch (e) {
          error = e;
          window.onerror(e.toString(), 'abc', 2, 3, e);
        }

        delete willThrowSpy.mostRecentCall.args[0].preventDefault;
        expect(willThrowSpy).toHaveBeenCalledWith({
          message: error.toString(),
          url: 'abc',
          line: 2,
          column: 3,
          originalError: error
        });
      });

      it('will not show the devtools when preventDefault() is called', () => {
        willThrowSpy.andCallFake(errorObject => errorObject.preventDefault());
        core.onWillThrowError(willThrowSpy);

        try {
          a + 1; // eslint-disable-line no-undef, no-unused-expressions
        } catch (e) {
          window.onerror(e.toString(), 'abc', 2, 3, e);
        }

        expect(willThrowSpy).toHaveBeenCalled();
        expect(core.openDevTools).not.toHaveBeenCalled();
        expect(core.executeJavaScriptInDevTools).not.toHaveBeenCalled();
      });
    });

    describe('::onDidThrowError', () => {
      let didThrowSpy = null;
      beforeEach(() => (didThrowSpy = jasmine.createSpy()));

      it('is called when there is an error', () => {
        let error = null;
        core.onDidThrowError(didThrowSpy);
        try {
          a + 1; // eslint-disable-line no-undef, no-unused-expressions
        } catch (e) {
          error = e;
          window.onerror(e.toString(), 'abc', 2, 3, e);
        }
        expect(didThrowSpy).toHaveBeenCalledWith({
          message: error.toString(),
          url: 'abc',
          line: 2,
          column: 3,
          originalError: error
        });
      });
    });
  });

  describe('.assert(condition, message, callback)', () => {
    let errors = null;

    beforeEach(() => {
      errors = [];
      spyOn(core, 'isReleasedVersion').andReturn(true);
      core.onDidFailAssertion(error => errors.push(error));
    });

    describe('if the condition is false', () => {
      it('notifies onDidFailAssertion handlers with an error object based on the call site of the assertion', () => {
        const result = core.assert(false, 'a == b');
        expect(result).toBe(false);
        expect(errors.length).toBe(1);
        expect(errors[0].message).toBe('Assertion failed: a == b');
        expect(errors[0].stack).toContain('atom-environment-spec');
      });

      describe('if passed a callback function', () => {
        it("calls the callback with the assertion failure's error object", () => {
          let error = null;
          core.assert(false, 'a == b', e => (error = e));
          expect(error).toBe(errors[0]);
        });
      });

      describe('if passed metadata', () => {
        it("assigns the metadata on the assertion failure's error object", () => {
          core.assert(false, 'a == b', { foo: 'bar' });
          expect(errors[0].metadata).toEqual({ foo: 'bar' });
        });
      });

      describe('when Atom has been built from source', () => {
        it('throws an error', () => {
          core.isReleasedVersion.andReturn(false);
          expect(() => core.assert(false, 'testing')).toThrow(
            'Assertion failed: testing'
          );
        });
      });
    });

    describe('if the condition is true', () => {
      it('does nothing', () => {
        const result = core.assert(true, 'a == b');
        expect(result).toBe(true);
        expect(errors).toEqual([]);
      });
    });
  });

  describe('saving and loading', () => {
    beforeEach(() => (core.enablePersistence = true));

    afterEach(() => (core.enablePersistence = false));

    it('selects the state based on the current project paths', async () => {
      jasmine.useRealClock();

      const [dir1, dir2] = [temp.mkdirSync('dir1-'), temp.mkdirSync('dir2-')];

      const loadSettings = Object.assign(core.getLoadSettings(), {
        initialProjectRoots: [dir1],
        windowState: null
      });

      spyOn(core, 'getLoadSettings').andCallFake(() => loadSettings);
      spyOn(core, 'serialize').andReturn({ stuff: 'cool' });

      core.project.setPaths([dir1, dir2]);

      // State persistence will fail if other Atom instances are running
      expect(await core.stateStore.connect()).toBe(true);

      await core.saveState();
      expect(await core.loadState()).toBeFalsy();

      loadSettings.initialProjectRoots = [dir2, dir1];
      expect(await core.loadState()).toEqual({ stuff: 'cool' });
    });

    it('saves state when the CPU is idle after a keydown or mousedown event', () => {
      const atomEnv = new AtomEnvironment({
        applicationDelegate: global.core.applicationDelegate
      });
      const idleCallbacks = [];
      atomEnv.initialize({
        window: {
          requestIdleCallback(callback) {
            idleCallbacks.push(callback);
          },
          addEventListener() {},
          removeEventListener() {}
        },
        document: document.implementation.createHTMLDocument()
      });

      spyOn(atomEnv, 'saveState');

      const keydown = new KeyboardEvent('keydown');
      atomEnv.document.dispatchEvent(keydown);
      advanceClock(atomEnv.saveStateDebounceInterval);
      idleCallbacks.shift()();
      expect(atomEnv.saveState).toHaveBeenCalledWith({ isUnloading: false });
      expect(atomEnv.saveState).not.toHaveBeenCalledWith({ isUnloading: true });

      atomEnv.saveState.reset();
      const mousedown = new MouseEvent('mousedown');
      atomEnv.document.dispatchEvent(mousedown);
      advanceClock(atomEnv.saveStateDebounceInterval);
      idleCallbacks.shift()();
      expect(atomEnv.saveState).toHaveBeenCalledWith({ isUnloading: false });
      expect(atomEnv.saveState).not.toHaveBeenCalledWith({ isUnloading: true });

      atomEnv.destroy();
    });

    it('ignores mousedown/keydown events happening after calling prepareToUnloadEditorWindow', async () => {
      const atomEnv = new AtomEnvironment({
        applicationDelegate: global.core.applicationDelegate
      });
      const idleCallbacks = [];
      atomEnv.initialize({
        window: {
          requestIdleCallback(callback) {
            idleCallbacks.push(callback);
          },
          addEventListener() {},
          removeEventListener() {}
        },
        document: document.implementation.createHTMLDocument()
      });

      spyOn(atomEnv, 'saveState');

      let mousedown = new MouseEvent('mousedown');
      atomEnv.document.dispatchEvent(mousedown);
      expect(atomEnv.saveState).not.toHaveBeenCalled();
      await atomEnv.prepareToUnloadEditorWindow();
      expect(atomEnv.saveState).toHaveBeenCalledWith({ isUnloading: true });

      advanceClock(atomEnv.saveStateDebounceInterval);
      idleCallbacks.shift()();
      expect(atomEnv.saveState.calls.length).toBe(1);

      mousedown = new MouseEvent('mousedown');
      atomEnv.document.dispatchEvent(mousedown);
      advanceClock(atomEnv.saveStateDebounceInterval);
      idleCallbacks.shift()();
      expect(atomEnv.saveState.calls.length).toBe(1);

      atomEnv.destroy();
    });

    it('serializes the project state with all the options supplied in saveState', async () => {
      spyOn(core.project, 'serialize').andReturn({ foo: 42 });

      await core.saveState({ anyOption: 'any option' });
      expect(core.project.serialize.calls.length).toBe(1);
      expect(core.project.serialize.mostRecentCall.args[0]).toEqual({
        anyOption: 'any option'
      });
    });

    it('serializes the text editor registry', async () => {
      await core.packages.activatePackage('language-text');
      const editor = await core.workspace.open('sample.js');
      expect(core.grammars.assignLanguageMode(editor, 'text.plain')).toBe(true);

      const core2 = new AtomEnvironment({
        applicationDelegate: core.applicationDelegate,
        window: document.createElement('div'),
        document: Object.assign(document.createElement('div'), {
          body: document.createElement('div'),
          head: document.createElement('div')
        })
      });
      core2.initialize({ document, window });

      await core2.deserialize(core.serialize());
      await core2.packages.activatePackage('language-text');
      const editor2 = core2.workspace.getActiveTextEditor();
      expect(
        editor2
          .getBuffer()
          .getLanguageMode()
          .getLanguageId()
      ).toBe('text.plain');
      core2.destroy();
    });

    describe('deserialization failures', () => {
      it('propagates unrecognized project state restoration failures', async () => {
        let err;
        spyOn(core.project, 'deserialize').andCallFake(() => {
          err = new Error('deserialization failure');
          return Promise.reject(err);
        });
        spyOn(core.notifications, 'addError');

        await core.deserialize({ project: 'should work' });
        expect(core.notifications.addError).toHaveBeenCalledWith(
          'Unable to deserialize project',
          {
            description: 'deserialization failure',
            stack: err.stack
          }
        );
      });

      it('disregards missing project folder errors', async () => {
        spyOn(core.project, 'deserialize').andCallFake(() => {
          const err = new Error('deserialization failure');
          err.missingProjectPaths = ['nah'];
          return Promise.reject(err);
        });
        spyOn(core.notifications, 'addError');

        await core.deserialize({ project: 'should work' });
        expect(core.notifications.addError).not.toHaveBeenCalled();
      });
    });
  });

  describe('openInitialEmptyEditorIfNecessary', () => {
    describe('when there are no paths set', () => {
      beforeEach(() =>
        spyOn(core, 'getLoadSettings').andReturn({ hasOpenFiles: false })
      );

      it('opens an empty buffer', () => {
        spyOn(core.workspace, 'open');
        core.openInitialEmptyEditorIfNecessary();
        expect(core.workspace.open).toHaveBeenCalledWith(null, {
          pending: true
        });
      });

      it('does not open an empty buffer when a buffer is already open', async () => {
        await core.workspace.open();
        spyOn(core.workspace, 'open');
        core.openInitialEmptyEditorIfNecessary();
        expect(core.workspace.open).not.toHaveBeenCalled();
      });

      it('does not open an empty buffer when core.openEmptyEditorOnStart is false', async () => {
        core.config.set('core.openEmptyEditorOnStart', false);
        spyOn(core.workspace, 'open');
        core.openInitialEmptyEditorIfNecessary();
        expect(core.workspace.open).not.toHaveBeenCalled();
      });
    });

    describe('when the project has a path', () => {
      beforeEach(() => {
        spyOn(core, 'getLoadSettings').andReturn({ hasOpenFiles: true });
        spyOn(core.workspace, 'open');
      });

      it('does not open an empty buffer', () => {
        core.openInitialEmptyEditorIfNecessary();
        expect(core.workspace.open).not.toHaveBeenCalled();
      });
    });
  });

  describe('adding a project folder', () => {
    it('does nothing if the user dismisses the file picker', () => {
      const projectRoots = core.project.getPaths();
      spyOn(core, 'pickFolder').andCallFake(callback => callback(null));
      core.addProjectFolder();
      expect(core.project.getPaths()).toEqual(projectRoots);
    });

    describe('when there is no saved state for the added folders', () => {
      beforeEach(() => {
        spyOn(core, 'loadState').andReturn(Promise.resolve(null));
        spyOn(core, 'attemptRestoreProjectStateForPaths');
      });

      it('adds the selected folder to the project', async () => {
        core.project.setPaths([]);
        const tempDirectory = temp.mkdirSync('a-new-directory');
        spyOn(core, 'pickFolder').andCallFake(callback =>
          callback([tempDirectory])
        );
        await core.addProjectFolder();
        expect(core.project.getPaths()).toEqual([tempDirectory]);
        expect(core.attemptRestoreProjectStateForPaths).not.toHaveBeenCalled();
      });
    });

    describe('when there is saved state for the relevant directories', () => {
      const state = Symbol('savedState');

      beforeEach(() => {
        spyOn(core, 'getStateKey').andCallFake(dirs => dirs.join(':'));
        spyOn(core, 'loadState').andCallFake(async key =>
          key === __dirname ? state : null
        );
        spyOn(core, 'attemptRestoreProjectStateForPaths');
        spyOn(core, 'pickFolder').andCallFake(callback =>
          callback([__dirname])
        );
        core.project.setPaths([]);
      });

      describe('when there are no project folders', () => {
        it('attempts to restore the project state', async () => {
          await core.addProjectFolder();
          expect(core.attemptRestoreProjectStateForPaths).toHaveBeenCalledWith(
            state,
            [__dirname]
          );
          expect(core.project.getPaths()).toEqual([]);
        });
      });

      describe('when there are already project folders', () => {
        const openedPath = path.join(__dirname, 'fixtures');

        beforeEach(() => core.project.setPaths([openedPath]));

        it('does not attempt to restore the project state, instead adding the project paths', async () => {
          await core.addProjectFolder();
          expect(
            core.attemptRestoreProjectStateForPaths
          ).not.toHaveBeenCalled();
          expect(core.project.getPaths()).toEqual([openedPath, __dirname]);
        });
      });
    });
  });

  describe('attemptRestoreProjectStateForPaths(state, projectPaths, filesToOpen)', () => {
    describe('when the window is clean (empty or has only unnamed, unmodified buffers)', () => {
      beforeEach(async () => {
        // Unnamed, unmodified buffer doesn't count toward "clean"-ness
        await core.workspace.open();
      });

      it('automatically restores the saved state into the current environment', async () => {
        const projectPath = temp.mkdirSync();
        const filePath1 = path.join(projectPath, 'file-1');
        const filePath2 = path.join(projectPath, 'file-2');
        const filePath3 = path.join(projectPath, 'file-3');
        fs.writeFileSync(filePath1, 'abc');
        fs.writeFileSync(filePath2, 'def');
        fs.writeFileSync(filePath3, 'ghi');

        const env1 = new AtomEnvironment({
          applicationDelegate: core.applicationDelegate
        });
        env1.project.setPaths([projectPath]);
        await env1.workspace.open(filePath1);
        await env1.workspace.open(filePath2);
        await env1.workspace.open(filePath3);
        const env1State = env1.serialize();
        env1.destroy();

        const env2 = new AtomEnvironment({
          applicationDelegate: core.applicationDelegate
        });
        await env2.attemptRestoreProjectStateForPaths(
          env1State,
          [projectPath],
          [filePath2]
        );
        const restoredURIs = env2.workspace.getPaneItems().map(p => p.getURI());
        expect(restoredURIs).toEqual([filePath1, filePath2, filePath3]);
        env2.destroy();
      });

      describe('when a dock has a non-text editor', () => {
        it("doesn't prompt the user to restore state", () => {
          const dock = core.workspace.getLeftDock();
          dock.getActivePane().addItem({
            getTitle() {
              return 'title';
            },
            element: document.createElement('div')
          });
          const state = {};
          spyOn(core, 'confirm');
          core.attemptRestoreProjectStateForPaths(
            state,
            [__dirname],
            [__filename]
          );
          expect(core.confirm).not.toHaveBeenCalled();
        });
      });
    });

    describe('when the window is dirty', () => {
      let editor;

      beforeEach(async () => {
        editor = await core.workspace.open();
        editor.setText('new editor');
      });

      describe('when a dock has a modified editor', () => {
        it('prompts the user to restore the state', () => {
          const dock = core.workspace.getLeftDock();
          dock.getActivePane().addItem(editor);
          spyOn(core, 'confirm').andReturn(1);
          spyOn(core.project, 'addPath');
          spyOn(core.workspace, 'open');
          const state = Symbol('state');
          core.attemptRestoreProjectStateForPaths(
            state,
            [__dirname],
            [__filename]
          );
          expect(core.confirm).toHaveBeenCalled();
        });
      });

      it('prompts the user to restore the state in a new window, discarding it and adding folder to current window', async () => {
        jasmine.useRealClock();
        spyOn(core, 'confirm').andCallFake((options, callback) => callback(1));
        spyOn(core.project, 'addPath');
        spyOn(core.workspace, 'open');
        const state = Symbol('state');

        core.attemptRestoreProjectStateForPaths(
          state,
          [__dirname],
          [__filename]
        );
        expect(core.confirm).toHaveBeenCalled();
        await conditionPromise(() => core.project.addPath.callCount === 1);

        expect(core.project.addPath).toHaveBeenCalledWith(__dirname);
        expect(core.workspace.open.callCount).toBe(1);
        expect(core.workspace.open).toHaveBeenCalledWith(__filename);
      });

      it('prompts the user to restore the state in a new window, opening a new window', async () => {
        jasmine.useRealClock();
        spyOn(core, 'confirm').andCallFake((options, callback) => callback(0));
        spyOn(core, 'open');
        const state = Symbol('state');

        core.attemptRestoreProjectStateForPaths(
          state,
          [__dirname],
          [__filename]
        );
        expect(core.confirm).toHaveBeenCalled();
        await conditionPromise(() => core.open.callCount === 1);
        expect(core.open).toHaveBeenCalledWith({
          pathsToOpen: [__dirname, __filename],
          newWindow: true,
          devMode: core.inDevMode(),
          safeMode: core.inSafeMode()
        });
      });
    });
  });

  describe('::unloadEditorWindow()', () => {
    it('saves the BlobStore so it can be loaded after reload', () => {
      const configDirPath = temp.mkdirSync('atom-spec-environment');
      const fakeBlobStore = jasmine.createSpyObj('blob store', ['save']);
      const atomEnvironment = new AtomEnvironment({
        applicationDelegate: core.applicationDelegate,
        enablePersistence: true
      });
      atomEnvironment.initialize({
        configDirPath,
        blobStore: fakeBlobStore,
        window,
        document
      });

      atomEnvironment.unloadEditorWindow();

      expect(fakeBlobStore.save).toHaveBeenCalled();

      atomEnvironment.destroy();
    });
  });

  describe('::destroy()', () => {
    it('does not throw exceptions when unsubscribing from ipc events (regression)', async () => {
      const fakeDocument = {
        addEventListener() {},
        removeEventListener() {},
        head: document.createElement('head'),
        body: document.createElement('body')
      };
      const atomEnvironment = new AtomEnvironment({
        applicationDelegate: core.applicationDelegate
      });
      atomEnvironment.initialize({ window, document: fakeDocument });
      spyOn(atomEnvironment.packages, 'loadPackages').andReturn(
        Promise.resolve()
      );
      spyOn(atomEnvironment.packages, 'activate').andReturn(Promise.resolve());
      spyOn(atomEnvironment, 'displayWindow').andReturn(Promise.resolve());
      await atomEnvironment.startEditorWindow();
      atomEnvironment.unloadEditorWindow();
      atomEnvironment.destroy();
    });
  });

  describe('::whenShellEnvironmentLoaded()', () => {
    let atomEnvironment, envLoaded, spy;

    beforeEach(() => {
      let resolvePromise = null;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      envLoaded = () => {
        resolvePromise();
        return promise;
      };
      atomEnvironment = new AtomEnvironment({
        applicationDelegate: core.applicationDelegate,
        updateProcessEnv() {
          return promise;
        }
      });
      atomEnvironment.initialize({ window, document });
      spy = jasmine.createSpy();
    });

    afterEach(() => atomEnvironment.destroy());

    it('is triggered once the shell environment is loaded', async () => {
      atomEnvironment.whenShellEnvironmentLoaded(spy);
      atomEnvironment.updateProcessEnvAndTriggerHooks();
      await envLoaded();
      expect(spy).toHaveBeenCalled();
    });

    it('triggers the callback immediately if the shell environment is already loaded', async () => {
      atomEnvironment.updateProcessEnvAndTriggerHooks();
      await envLoaded();
      atomEnvironment.whenShellEnvironmentLoaded(spy);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('::openLocations(locations)', () => {
    beforeEach(() => {
      core.project.setPaths([]);
    });

    describe('when there is no saved state', () => {
      beforeEach(() => {
        spyOn(core, 'loadState').andReturn(Promise.resolve(null));
      });

      describe('when the opened path exists', () => {
        it('opens a file', async () => {
          const pathToOpen = __filename;
          await core.openLocations([
            { pathToOpen, exists: true, isFile: true }
          ]);
          expect(core.project.getPaths()).toEqual([]);
        });

        it('opens a directory as a project folder', async () => {
          const pathToOpen = __dirname;
          await core.openLocations([
            { pathToOpen, exists: true, isDirectory: true }
          ]);
          expect(core.workspace.getTextEditors().map(e => e.getPath())).toEqual(
            []
          );
          expect(core.project.getPaths()).toEqual([pathToOpen]);
        });
      });

      describe('when the opened path does not exist', () => {
        it('opens it as a new file', async () => {
          const pathToOpen = path.join(
            __dirname,
            'this-path-does-not-exist.txt'
          );
          await core.openLocations([{ pathToOpen, exists: false }]);
          expect(core.workspace.getTextEditors().map(e => e.getPath())).toEqual(
            [pathToOpen]
          );
          expect(core.project.getPaths()).toEqual([]);
        });

        it('may be required to be an existing directory', async () => {
          spyOn(core.notifications, 'addWarning');

          const nonExistent = path.join(__dirname, 'no');
          const existingFile = __filename;
          const existingDir = path.join(__dirname, 'fixtures');

          await core.openLocations([
            { pathToOpen: nonExistent, isDirectory: true },
            { pathToOpen: existingFile, isDirectory: true },
            { pathToOpen: existingDir, isDirectory: true }
          ]);

          expect(core.workspace.getTextEditors()).toEqual([]);
          expect(core.project.getPaths()).toEqual([existingDir]);

          expect(core.notifications.addWarning).toHaveBeenCalledWith(
            'Unable to open project folders',
            {
              description: `The directories \`${nonExistent}\` and \`${existingFile}\` do not exist.`
            }
          );
        });
      });

      describe('when the opened path is handled by a registered directory provider', () => {
        let serviceDisposable;

        beforeEach(() => {
          serviceDisposable = core.packages.serviceHub.provide(
            'atom.directory-provider',
            '0.1.0',
            {
              directoryForURISync(uri) {
                if (uri.startsWith('remote://')) {
                  return {
                    getPath() {
                      return uri;
                    }
                  };
                } else {
                  return null;
                }
              }
            }
          );

          waitsFor(() => core.project.directoryProviders.length > 0);
        });

        afterEach(() => {
          serviceDisposable.dispose();
        });

        it("adds it to the project's paths as is", async () => {
          const pathToOpen = 'remote://server:7644/some/dir/path';
          spyOn(core.project, 'addPath');
          await core.openLocations([{ pathToOpen }]);
          expect(core.project.addPath).toHaveBeenCalledWith(pathToOpen);
        });
      });
    });

    describe('when there is saved state for the relevant directories', () => {
      const state = Symbol('savedState');

      beforeEach(() => {
        spyOn(core, 'getStateKey').andCallFake(dirs => dirs.join(':'));
        spyOn(core, 'loadState').andCallFake(function(key) {
          if (key === __dirname) {
            return Promise.resolve(state);
          } else {
            return Promise.resolve(null);
          }
        });
        spyOn(core, 'attemptRestoreProjectStateForPaths');
      });

      describe('when there are no project folders', () => {
        it('attempts to restore the project state', async () => {
          const pathToOpen = __dirname;
          await core.openLocations([{ pathToOpen, isDirectory: true }]);
          expect(core.attemptRestoreProjectStateForPaths).toHaveBeenCalledWith(
            state,
            [pathToOpen],
            []
          );
          expect(core.project.getPaths()).toEqual([]);
        });

        it('includes missing mandatory project folders in computation of initial state key', async () => {
          const existingDir = path.join(__dirname, 'fixtures');
          const missingDir = path.join(__dirname, 'no');

          core.loadState.andCallFake(function(key) {
            if (key === `${existingDir}:${missingDir}`) {
              return Promise.resolve(state);
            } else {
              return Promise.resolve(null);
            }
          });

          await core.openLocations([
            { pathToOpen: existingDir },
            { pathToOpen: missingDir, isDirectory: true }
          ]);

          expect(core.attemptRestoreProjectStateForPaths).toHaveBeenCalledWith(
            state,
            [existingDir],
            []
          );
          expect(core.project.getPaths(), [existingDir]);
        });

        it('opens the specified files', async () => {
          await core.openLocations([
            { pathToOpen: __dirname, isDirectory: true },
            { pathToOpen: __filename }
          ]);
          expect(core.attemptRestoreProjectStateForPaths).toHaveBeenCalledWith(
            state,
            [__dirname],
            [__filename]
          );
          expect(core.project.getPaths()).toEqual([]);
        });
      });

      describe('when there are already project folders', () => {
        beforeEach(() => core.project.setPaths([__dirname]));

        it('does not attempt to restore the project state, instead adding the project paths', async () => {
          const pathToOpen = path.join(__dirname, 'fixtures');
          await core.openLocations([
            { pathToOpen, exists: true, isDirectory: true }
          ]);
          expect(
            core.attemptRestoreProjectStateForPaths
          ).not.toHaveBeenCalled();
          expect(core.project.getPaths()).toEqual([__dirname, pathToOpen]);
        });

        it('opens the specified files', async () => {
          const pathToOpen = path.join(__dirname, 'fixtures');
          const fileToOpen = path.join(pathToOpen, 'michelle-is-awesome.txt');
          await core.openLocations([
            { pathToOpen, exists: true, isDirectory: true },
            { pathToOpen: fileToOpen, exists: true, isFile: true }
          ]);
          expect(
            core.attemptRestoreProjectStateForPaths
          ).not.toHaveBeenCalledWith(state, [pathToOpen], [fileToOpen]);
          expect(core.project.getPaths()).toEqual([__dirname, pathToOpen]);
        });
      });
    });
  });

  describe('::getReleaseChannel()', () => {
    let version;

    beforeEach(() => {
      spyOn(core, 'getVersion').andCallFake(() => version);
    });

    it('returns the correct channel based on the version number', () => {
      version = '1.5.6';
      expect(core.getReleaseChannel()).toBe('stable');

      version = '1.5.0-beta10';
      expect(core.getReleaseChannel()).toBe('beta');

      version = '1.7.0-dev-5340c91';
      expect(core.getReleaseChannel()).toBe('dev');
    });
  });
});
