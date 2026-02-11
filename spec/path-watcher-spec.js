const temp = require('temp');
const fs = require('fs-plus');
const path = require('path');
const { promisify } = require('util');
const { File, Directory } = require('atom');
const { closeAllWatchers } = require('@pulsar-edit/pathwatcher');
const { sep } = path;

const { CompositeDisposable } = require('event-kit');
const { watchPath, stopAllWatchers } = require('../src/path-watcher');
const { conditionPromise } = require('./helpers/async-spec-helpers');

function waitsForCondition(label, condition) {
  return conditionPromise(condition, label);
}

temp.track();

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const appendFile = promisify(fs.appendFile);
const realpath = promisify(fs.realpath);
const symlink = promisify(fs.symlink);

const tempMkdir = promisify(temp.mkdir);

describe('File', () => {
  let filePath;
  let file;

  beforeEach(() => {
    jasmine.useRealClock();
    filePath = path.join(__dirname, 'fixtures', 'file-test.txt');
    fs.removeSync(filePath);
    fs.writeFileSync(filePath, "this is old!");
    file = new File(filePath);
  });

  afterEach(async () => {
    file.unsubscribeFromNativeChangeEvents();
    fs.removeSync(filePath);
    closeAllWatchers();
    await stopAllWatchers();
    await wait(100);
  });

  it('normalizes the specified path', () => {
    let name = [
      __dirname,
      'fixtures',
      'abc',
      '..',
      'file-test.txt'
    ].join(sep)
    expect(
      new File(name).getBaseName()
    ).toBe('file-test.txt');
    expect(
      new File(name).path.toLowerCase()
    ).toBe(file.path.toLowerCase());
  });

  it('returns true from isFile()', () => {
    expect(file.isFile()).toBe(true);
  });

  it('returns false from isDirectory()', () => {
    expect(file.isDirectory()).toBe(false);
  });

  describe('::isSymbolicLink', () => {
    it('returns false for regular files', () => {
      expect(file.isSymbolicLink()).toBe(false);
    });

    it('returns true for symlinked files', () => {
      let symbolicFile = new File(filePath, true);
      expect(
        symbolicFile.isSymbolicLink()
      ).toBe(true);
    });
  });

  describe('::getDigestSync', () => {
    it('computes and returns the SHA-1 digest and caches it', () => {
      filePath = path.join(
        temp.mkdirSync('node-pathwatcher-directory'),
        'file.txt'
      );
      fs.writeFileSync(filePath, '');

      file = new File(filePath);
      spyOn(file, 'readSync').and.callThrough();

      // debugger;
      expect(
        file.getDigestSync()
      ).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709');
      expect(file.readSync.calls.count()).toBe(1);
      expect(
        file.getDigestSync()
      ).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709');
      expect(file.readSync.calls.count()).toBe(1);

      file.writeSync('x');

      expect(
        file.getDigestSync()
      ).toBe('11f6ad8ec52a2984abaafd7c3b516503785c2072');
      expect(file.readSync.calls.count()).toBe(1);
      expect(
        file.getDigestSync()
      ).toBe('11f6ad8ec52a2984abaafd7c3b516503785c2072');
      expect(file.readSync.calls.count()).toBe(1);
    });
  });

  describe('::create()', () => {
    let callback;
    let nonExistentFile;
    let tempDir;

    beforeEach(() => {
      tempDir = temp.mkdirSync('node-pathwatcher-directory');
      callback = jasmine.createSpy('promiseCallback');
    });

    afterEach(() => {
      nonExistentFile.unsubscribeFromNativeChangeEvents();
      fs.removeSync(nonExistentFile.getPath());
    });

    it('creates file in directory if file does not exist', async () => {
      let fileName = path.join(tempDir, 'file.txt');
      expect(
        fs.existsSync(fileName)
      ).toBe(false);
      nonExistentFile = new File(fileName);

      await nonExistentFile.create().then(callback);

      expect(callback.calls.argsFor(0)[0]).toBe(true);
      expect(fs.existsSync(fileName)).toBe(true);
      expect(fs.isFileSync(fileName)).toBe(true);
      expect(fs.readFileSync(fileName).toString()).toBe('');
    });
  });

  describe('when the file has not been read', () => {
    describe('when the contents of the file change', () => {
      it('notifies ::onDidChange observers', async () => {
        jasmine.useRealClock();
        let changeHandler = jasmine.createSpy('changeHandler');
        file.onDidChange(changeHandler);
        fs.writeFileSync(file.getPath(), `this is new!`);
        await waitsForCondition('change event', () => {
          return changeHandler.calls.count() > 0;
        });
      });
    });

    describe('when the contents of the file are deleted', () => {
      it('notifies ::onDidChange observers', async () => {
        let changeHandler = jasmine.createSpy('changeHandler');
        file.onDidChange(changeHandler);
        fs.writeFileSync(file.getPath(), '');
        await waitsForCondition('change event', () => {
          return changeHandler.calls.count() > 0;
        });
      });
    });
  });

  describe('when the file has already been read #darwin', () => {
    beforeEach(() => file.readSync());

    describe('when the contents of the file change', () => {
      it('notifies ::onDidChange observers', async () => {
        jasmine.useRealClock();
        let lastText = null;
        file.onDidChange(async () => {
          let text = await file.read();
          lastText = text;
        });
        fs.writeFileSync(file.getPath(), 'this is new!');
        await waitsForCondition('read after first change event', () => {
          return lastText === 'this is new!';
        });
        fs.writeFileSync(file.getPath(), 'this is newer!');
        await waitsForCondition('read after second change event', () => {
          return lastText === 'this is newer!';
        });
        expect(file.readSync()).toBe('this is newer!')
      });
    });

    describe('when the file is deleted', () => {
      it('notifies ::onDidDelete observers', async () => {
        let deleteHandler = jasmine.createSpy('deleteHandler');
        file.onDidDelete(deleteHandler);
        fs.removeSync(file.getPath());
        await waitsForCondition('remove event', () => {
          return deleteHandler.calls.count() > 0;
        })
      });
    });

    describe('when a file is moved (via the filesystem)', () => {
      let newPath = null;

      beforeEach(() => {
        newPath = path.join(
          path.dirname(filePath),
          'file-was-moved-test.txt'
        );
      });

      afterEach(async () => {
        if (fs.existsSync(newPath)) {
          fs.removeSync(newPath);
          let deleteHandler = jasmine.createSpy('deleteHandler');
          file.onDidDelete(deleteHandler);
          await waitsForCondition('removeEvent', () => (deleteHandler.calls.count() > 0), 30000);
        }
        await wait(500);
      });

      it('updates its path', async () => {
        jasmine.useRealClock();
        let moveHandler = jasmine.createSpy('moveHandler');
        file.onDidRename(moveHandler);

        fs.moveSync(filePath, newPath);

        await waitsForCondition(
          'move event',
          (() => moveHandler.calls.count() > 0),
          30000
        );
        expect(file.getPath()).toBe(newPath);
      });

      it('maintains ::onDidChange observers that were subscribed on the previous path', async () => {
        jasmine.useRealClock();
        let moveHandler = jasmine.createSpy('moveHandler');
        let changeHandler = jasmine.createSpy('changeHandler');
        file.onDidRename(moveHandler);
        file.onDidChange(changeHandler);

        fs.moveSync(filePath, newPath);

        await waitsForCondition(
          'move event',
          () => moveHandler.calls.count() > 0
        );
        expect(changeHandler).not.toHaveBeenCalled();
        fs.writeFileSync(file.getPath(), 'this is new!');

        await waitsForCondition(
          'change event',
          () => changeHandler.calls.count() > 0
        );
      });

      describe('when a file is deleted and the recreated within a small amount of time (git sometimes does this)', async () => {
        it('triggers a contents change event if the contents change', async () => {
          jasmine.useRealClock();
          let changeHandler = jasmine.createSpy("file changed");
          let deleteHandler = jasmine.createSpy("file deleted");

          // debugger;
          file.onDidChange(changeHandler);
          file.onDidDelete(deleteHandler);

          await wait(1000);

          expect(changeHandler).not.toHaveBeenCalled();
          fs.removeSync(filePath);
          expect(changeHandler).not.toHaveBeenCalled();

          // NOTE: Putting this wait(0) here makes this test flakier. We
          // override the async behavior inside of this spec anyway, so it's
          // not a great crime to comment this out.
          //
          // The alternative is to write a test that's very precise about
          // timing, but that's a bit hard to do in a non-flaky way for a test
          // that must pass in a CI environment.

          // await wait(0);
          fs.writeFileSync(filePath, 'HE HAS RISEN!');
          expect(changeHandler).not.toHaveBeenCalled();

          // await promise;
          await waitsForCondition(
            'resurrection change event',
            () => {
              return changeHandler.calls.count() >= 1
            }
          );
          expect(deleteHandler).not.toHaveBeenCalled();
          fs.writeFileSync(filePath, 'Hallelujah!');
          changeHandler.calls.reset();

          await waitsForCondition(
            'post-resurrection change event',
            () => changeHandler.calls.count() > 0
          );
        });
      });
    });
  });
});

describe('watchPath', function () {
  let subs;

  beforeEach(function () {
    subs = new CompositeDisposable();
  });

  afterEach(async function () {
    subs.dispose();
    await stopAllWatchers();
  });

  function waitForChanges(watcher, ...fileNames) {
    const waiting = new Set(fileNames);
    let fired = false;
    const relevantEvents = [];

    return new Promise(resolve => {
      const sub = watcher.onDidChange(events => {
        for (const event of events) {
          if (waiting.delete(event.path)) {
            relevantEvents.push(event);
          }
        }

        if (!fired && waiting.size === 0) {
          fired = true;
          resolve(relevantEvents);
          sub.dispose();
        }
      });
    });
  }

  describe('watchPath()', function () {
    it('resolves the returned promise when the watcher begins listening', async function () {
      const rootDir = await tempMkdir('atom-fsmanager-test-');

      const watcher = await watchPath(rootDir, {}, () => {});
      expect(watcher.constructor.name).toBe('PathWatcher');
    });

    it('reuses an existing native watcher and resolves getStartPromise immediately if attached to a running watcher', async function () {
      const rootDir = await tempMkdir('atom-fsmanager-test-');

      const watcher0 = await watchPath(rootDir, {}, () => {});
      const watcher1 = await watchPath(rootDir, {}, () => {});

      expect(watcher0.native).toBe(watcher1.native);
    });

    let disposables;
    beforeEach(() => {
      disposables = new CompositeDisposable();
    })

    afterEach(() => {
      disposables?.dispose();
    })

    it('resolves the returned promise when the watcher begins listening', async function () {
      const rootDir = await tempMkdir('atom-fsmanager-test-');
      const watcher = await watchPath(rootDir, {}, () => {});
      disposables.add(watcher);
      expect(watcher.constructor.name).toBe('PathWatcher');
    });

    it('reuses an existing native watcher and resolves getStartPromise immediately if attached to a running watcher', async function () {
      const rootDir = await tempMkdir('atom-fsmanager-test-');

      const watcher0 = await watchPath(rootDir, {}, () => {});
      const watcher1 = await watchPath(rootDir, {}, () => {});

      disposables.add(watcher0, watcher1);

      expect(watcher0.native).toBe(watcher1.native);
    });

    it("returns paths that appear to descend from the given path, even when symlinks are involved, when `realPaths` is `false`", async () => {
      jasmine.useRealClock();
      const rootDir = await tempMkdir('atom-fsmanager-test-');
      const realRootDir = await realpath(rootDir)
      const symlinkedPath = temp.path({ suffix: '-symlinked' })
      await symlink(realRootDir, symlinkedPath)

      let events0 = [];
      let watcher0 = await watchPath(realRootDir, { realPaths: false }, (events) => {
        events0.push(...events);
      });
      let events1 = [];
      let watcher1 = await watchPath(symlinkedPath, { realPaths: false }, (events) => {
        events1.push(...events);
      });

      disposables.add(watcher0, watcher1);

      await writeFile(path.join(realRootDir, 'foo.txt'), '!')
      await conditionPromise(() => {
        return events0.length > 0 && events1.length > 0 && events0.length === events1.length;
      });

      let [first0] = events0;
      let [first1] = events1;

      // Even though these two events describe the same filesystem action,
      // their `path` properties don't match one another; they correspond to
      // the paths given in their respective calls to `watchPath`.
      expect(first0.path).not.toBe(first1.path);
      expect(first0.path.startsWith(realRootDir)).toBe(true);
      expect(first1.path.startsWith(symlinkedPath)).toBe(true);
    })

    it("returns real paths for events when `realPaths` is `true`", async () => {
      jasmine.useRealClock();
      const rootDir = await tempMkdir('atom-fsmanager-test-');
      const realRootDir = await realpath(rootDir)
      const symlinkedPath = temp.path({ suffix: '-symlinked' })
      await symlink(realRootDir, symlinkedPath)
      const realSymlinkedPath = await realpath(symlinkedPath)

      let events0 = [];
      let watcher0 = await watchPath(realRootDir, { realPaths: true }, (events) => {
        events0.push(...events);
      });
      let events1 = [];
      let watcher1 = await watchPath(symlinkedPath, { realPaths: true }, (events) => {
        events1.push(...events);
      });

      disposables.add(watcher0, watcher1);

      await writeFile(path.join(realRootDir, 'foo.txt'), '!')
      await conditionPromise(() => {
        return events0.length > 0 && events1.length > 0 &&
          events0.length === events1.length;
      });

      let [first0] = events0;
      let [first1] = events1;

      // Because `realPaths` is `true`, these events will have identical `path`
      // properties that point to the file's true path on disk.
      expect(first0.path).toBe(first1.path);
      expect(first0.path.startsWith(realRootDir)).toBe(true);
      expect(first1.path.startsWith(symlinkedPath)).toBe(false);
    })

    it("normalizes a path without resolving symlinks when `realPaths` is `false`", async () => {
      jasmine.useRealClock();
      const rootDir = await tempMkdir('atom-fsmanager-test-');
      const realRootDir = await realpath(rootDir);
      const symlinkedPath = temp.path({ suffix: '-symlinked' })
      await symlink(realRootDir, symlinkedPath);

      const relativizedPath = `${symlinkedPath}${path.sep}..${path.sep}${path.basename(symlinkedPath)}`

      let events0 = [];
      let watcher0 = await watchPath(relativizedPath, { realPaths: false }, (events) => {
        events0.push(...events);
      });
      disposables.add(watcher0);

      await writeFile(path.join(realRootDir, 'foo.txt'), '!')
      await conditionPromise(() => events0.length > 0);

      let [first0] = events0;

      // We want to ensure that the weird relative path the user gave to
      // `watchPath` is resolved internally _without_ it pointing to the real
      // path on disk.
      expect(first0.path.startsWith(symlinkedPath)).toBe(true);
      expect(first0.path.startsWith(relativizedPath)).toBe(false);
    })

    it("reuses existing native watchers even while they're still starting", async function () {
      const rootDir = await tempMkdir('atom-fsmanager-test-');

      const [watcher0, watcher1] = await Promise.all([
        watchPath(rootDir, {}, () => {}),
        watchPath(rootDir, {}, () => {})
      ]);
      expect(watcher0.native).toBe(watcher1.native);
    });

    it("doesn't attach new watchers to a native watcher that's stopping", async function () {
      const rootDir = await tempMkdir('atom-fsmanager-test-');

      const watcher0 = await watchPath(rootDir, {}, () => {});
      const native0 = watcher0.native;

      watcher0.dispose();
      const watcher1 = await watchPath(rootDir, {}, () => {});

      expect(watcher1.native).not.toBe(native0);
    });

    it('reuses an existing native watcher on a parent directory and filters events', async function () {
      const rootDir = await tempMkdir('atom-fsmanager-test-').then(realpath);
      const rootFile = path.join(rootDir, 'rootfile.txt');
      const subDir = path.join(rootDir, 'subdir');
      const subFile = path.join(subDir, 'subfile.txt');

      await mkdir(subDir);

      // Keep the watchers alive with an undisposed subscription
      const rootWatcher = await watchPath(rootDir, {}, () => {});
      const childWatcher = await watchPath(subDir, {}, () => {});

      expect(rootWatcher.native).toBe(childWatcher.native);
      expect(rootWatcher.native.isRunning()).toBe(true);

      const firstChanges = Promise.all([
        waitForChanges(rootWatcher, subFile),
        waitForChanges(childWatcher, subFile)
      ]);
      await writeFile(subFile, 'subfile\n', { encoding: 'utf8' });
      await firstChanges;

      const nextRootEvent = waitForChanges(rootWatcher, rootFile);
      await writeFile(rootFile, 'rootfile\n', { encoding: 'utf8' });
      await nextRootEvent;
    });

    it('adopts existing child watchers and filters events appropriately to them', async function () {
      const parentDir = await tempMkdir('atom-fsmanager-test-').then(realpath);

      // Create the directory tree
      const rootFile = path.join(parentDir, 'rootfile.txt');
      const subDir0 = path.join(parentDir, 'subdir0');
      const subFile0 = path.join(subDir0, 'subfile0.txt');
      const subDir1 = path.join(parentDir, 'subdir1');
      const subFile1 = path.join(subDir1, 'subfile1.txt');

      await mkdir(subDir0);
      await mkdir(subDir1);
      await Promise.all([
        writeFile(rootFile, 'rootfile\n', { encoding: 'utf8' }),
        writeFile(subFile0, 'subfile 0\n', { encoding: 'utf8' }),
        writeFile(subFile1, 'subfile 1\n', { encoding: 'utf8' })
      ]);

      // Begin the child watchers and keep them alive
      const subWatcher0 = await watchPath(subDir0, {}, () => {});
      const subWatcherChanges0 = waitForChanges(subWatcher0, subFile0);

      const subWatcher1 = await watchPath(subDir1, {}, () => {});
      const subWatcherChanges1 = waitForChanges(subWatcher1, subFile1);

      expect(subWatcher0.native).not.toBe(subWatcher1.native);

      // Create the parent watcher
      const parentWatcher = await watchPath(parentDir, {}, () => {});
      const parentWatcherChanges = waitForChanges(
        parentWatcher,
        rootFile,
        subFile0,
        subFile1
      );

      expect(subWatcher0.native).toBe(parentWatcher.native);
      expect(subWatcher1.native).toBe(parentWatcher.native);

      // Ensure events are filtered correctly
      await Promise.all([
        appendFile(rootFile, 'change\n', { encoding: 'utf8' }),
        appendFile(subFile0, 'change\n', { encoding: 'utf8' }),
        appendFile(subFile1, 'change\n', { encoding: 'utf8' })
      ]);

      await Promise.all([
        subWatcherChanges0,
        subWatcherChanges1,
        parentWatcherChanges
      ]);
    });

    // Regression tests for https://github.com/pulsar-edit/pulsar/issues/1402
    // Cyclic symlinks (e.g. `ln -s . a`) caused NSFW's inotify-based watcher
    // to recurse infinitely, consuming 100% CPU. With @parcel/watcher, these
    // should be handled gracefully.
    describe('with cyclic symlinks', function () {
      const symlinkType = process.platform === 'win32' ? 'junction' : 'dir';

      it('starts a watcher on a directory with one cyclic symlink without hanging', async function () {
        const rootDir = await tempMkdir('atom-cyclic-test-').then(realpath);

        // Create a symlink that points back to the root: rootDir/cycle -> rootDir
        await symlink(rootDir, path.join(rootDir, 'cycle'), symlinkType);

        const TIMEOUT = 10000;
        const watcher = await Promise.race([
          watchPath(rootDir, {}, () => {}),
          wait(TIMEOUT).then(() => {
            throw new Error(`watchPath did not resolve within ${TIMEOUT}ms — likely hung on cyclic symlink`);
          })
        ]);
        disposables.add(watcher);
        expect(watcher.constructor.name).toBe('PathWatcher');
      });

      it('starts a watcher on a directory with multiple cyclic symlinks without hanging', async function () {
        const rootDir = await tempMkdir('atom-cyclic-test-').then(realpath);

        // Create two symlinks that both point back to the root.
        // This is the exact scenario from issue #1402: with NSFW this caused
        // O(2^N) recursive scanning because the inode cycle detection was
        // broken for 2+ symlinks.
        await symlink(rootDir, path.join(rootDir, 'cycle-a'), symlinkType);
        await symlink(rootDir, path.join(rootDir, 'cycle-b'), symlinkType);

        const TIMEOUT = 10000;
        const watcher = await Promise.race([
          watchPath(rootDir, {}, () => {}),
          wait(TIMEOUT).then(() => {
            throw new Error(`watchPath did not resolve within ${TIMEOUT}ms — likely hung on cyclic symlinks`);
          })
        ]);
        disposables.add(watcher);
        expect(watcher.constructor.name).toBe('PathWatcher');
      });

      it('still detects file changes in a directory containing cyclic symlinks', async function () {
        jasmine.useRealClock();
        const rootDir = await tempMkdir('atom-cyclic-test-').then(realpath);
        const testFile = path.join(rootDir, 'test.txt');

        // Create cyclic symlinks.
        await symlink(rootDir, path.join(rootDir, 'cycle-a'), symlinkType);
        await symlink(rootDir, path.join(rootDir, 'cycle-b'), symlinkType);

        const TIMEOUT = 10000;
        const watcher = await Promise.race([
          watchPath(rootDir, {}, () => {}),
          wait(TIMEOUT).then(() => {
            throw new Error(`watchPath did not resolve within ${TIMEOUT}ms`);
          })
        ]);
        disposables.add(watcher);

        // Verify that file events are still detected despite the cycles.
        const changes = waitForChanges(watcher, testFile);
        await writeFile(testFile, 'hello\n', { encoding: 'utf8' });
        const events = await Promise.race([
          changes,
          wait(TIMEOUT).then(() => {
            throw new Error(`Did not receive file change event within ${TIMEOUT}ms`);
          })
        ]);

        expect(events.length).toBeGreaterThan(0);
        expect(events[0].path).toBe(testFile);
      });
    });
  });
});
