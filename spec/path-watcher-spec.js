const temp = require('temp');
const fs = require('fs-plus');
const path = require('path');
const { promisify } = require('util');
const { File } = require('atom');
const { closeAllWatchers } = require('@pulsar-edit/pathwatcher');
const { sep } = path;

const { CompositeDisposable } = require('event-kit');
const { watchPath } = require('../src/path-watcher');
const { conditionPromise } = require('./helpers/async-spec-helpers');

function waitsForCondition(label, condition) {
  return conditionPromise(condition, label);
}

temp.track();

const rename = promisify(fs.rename);
const unlink = promisify(fs.unlink);

// The watcher classes aren't exported, so reach one through a live watcher.
// Subclassing gives us our own task and registry, so these specs don't depend
// on whatever `atom.project` and `atom.themes` are watching.
async function isolatedWatcherClass() {
  const probe = await watchPath(await tempMkdir('atom-fsmanager-probe-'), {}, () => {});
  const Klass = probe.native.constructor;
  probe.dispose();
  return class extends Klass {
    static task = null;
    static initialized = false;
    static started = false;
    static pendingRespawn = false;
    static INSTANCES = new Map();
    static PROMISE_META = new Map();
  };
}

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
    await watchPath.reset();
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
    await watchPath.reset();
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

  const WATCHER_IMPLEMENTATIONS = ['nsfw', 'parcel'];

  for (let impl of WATCHER_IMPLEMENTATIONS) {
    describe(`watchPath() (${impl} implementation)`, function () {
      let disposables;
      beforeEach(async () => {
        jasmine.useRealClock();
        atom.config.set('core.fileSystemWatcher', impl);
        // Changing the config setting will trigger an async transition to new
        // file-watchers. This helper method lets us wait until that transition
        // has finished.
        await watchPath.waitForTransition();
        disposables = new CompositeDisposable();
      });

      afterEach(() => {
        disposables?.dispose();
      });

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

      // TODO: File-watchers cannot respect `core.ignoredNames` by default
      // without breaking backward-compatibility. Keeping this around for a
      // future where we might use this new behavior on an opt-in basis.
      xit('respects `core.ignoredNames`', async () => {
        jasmine.useRealClock();

        let existing = atom.config.get('core.ignoredNames');
        atom.config.set(
          'core.ignoredNames',
          [...existing, 'some-other-dir']
        );

        const rootDir = await tempMkdir('atom-fsmanager-test-');

        // Create a directory that will be affected by our `core.ignoredNames`
        // value.
        let ignoredDir = path.join(rootDir, 'some-other-dir');
        await mkdir(ignoredDir, { recursive: true });

        let spy = jasmine.createSpy();

        let watcher = await watchPath(rootDir, {}, spy);
        disposables.add(watcher);

        // Writing a file to a path within an ignored directory should not
        // trigger the callback…
        await writeFile(path.join(ignoredDir, 'foo.txt'), 'something');
        // (file-watchers might have a debounce interval)
        await wait(process.env.CI ? 3000 : 1000);
        expect(spy).not.toHaveBeenCalled();

        // …but writing a file to a path outside of an ignored directory should
        // trigger the callback.
        await writeFile(path.join(rootDir, 'foo.txt'), 'something');
        // (file-watchers might have a debounce interval)
        await wait(process.env.CI ? 3000 : 1000);
        expect(spy).toHaveBeenCalled();
      });

      it('resolves the returned promise when the watcher begins listening', async function () {
        const rootDir = await tempMkdir('atom-fsmanager-test-');
        const watcher = await watchPath(rootDir, {}, () => {});
        disposables.add(watcher);
        expect(watcher.constructor.name).toBe('PathWatcher');
      });

      it('recovers from an unexpected worker crash', async () => {
        jasmine.useRealClock();
        const rootDir = await tempMkdir('atom-fsmanager-test-').then(realpath);

        let events = [];
        const watcher = await watchPath(rootDir, {}, (batch) => events.push(...batch));
        disposables.add(watcher);

        let errors = [];
        watcher.onDidError(err => errors.push(err));

        // Prove the watcher works *before* we break it, so that a failure
        // below can only mean the respawn didn't work.
        const before = path.join(rootDir, 'before.txt');
        await writeFile(before, 'before\n');
        await conditionPromise(
          () => events.some(e => e.path === before),
          'the pre-crash write to be observed'
        );

        const task = watcher.native.constructor.task;
        const doomed = task.childProcess;
        const respawned = new Promise(resolve => task.once('task:respawned', resolve));

        doomed.kill('SIGKILL');
        await respawned;

        expect(task.childProcess).not.toBe(null);
        expect(task.childProcess.pid).not.toBe(doomed.pid);

        // `task:respawned` only means a replacement was forked; the watches
        // aren't re-established until it reports ready, and the OS needs a
        // moment beyond that. Write repeatedly until an event lands rather
        // than guessing at a delay.
        events.length = 0;
        let n = 0;
        await conditionPromise(
          async () => {
            await writeFile(path.join(rootDir, `after-${n++}.txt`), 'after\n');
            return events.length > 0;
          },
          'the respawned worker to deliver events'
        );
        expect(errors.some(e => /restarted/.test(e.message))).toBe(true);
      });

      it('rejects in-flight requests when the worker dies', async () => {
        jasmine.useRealClock();
        const rootDir = await tempMkdir('atom-fsmanager-test-').then(realpath);

        const watcher = await watchPath(rootDir, {}, () => {});
        disposables.add(watcher);

        const native = watcher.native;
        const task = native.constructor.task;

        // Neither worker replies to an unrecognized event — it just hits the
        // `default` branch and warns — so this request can only ever settle by
        // way of the crash handling we're testing. That keeps the spec from
        // racing the worker's reply against our kill signal.
        const pending = native.send('watcher:nonexistent', {});
        task.childProcess.kill('SIGKILL');

        let error = null;
        try {
          await pending;
        } catch (err) {
          error = err;
        }

        expect(error).not.toBe(null);
        expect(error.message).toContain('exited unexpectedly');
      });

      // Three round trips through a real filesystem watcher don't reliably fit
      // in the default 5s spec budget — `nsfw` alone debounces at 200ms on top
      // of whatever latency the OS adds — so this one gets more room.
      describe('action vocabulary', () => {
        let originalTimeout;
        beforeEach(() => {
          originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
          jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
        });

        afterEach(() => {
          jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
        });

      it('reports only contract-defined actions', async () => {
        jasmine.useRealClock();
        const rootDir = await tempMkdir('atom-fsmanager-test-').then(realpath);
        const filePath = path.join(rootDir, 'vocabulary.txt');

        let events = [];
        const watcher = await watchPath(rootDir, {}, batch => events.push(...batch));
        disposables.add(watcher);

        const eventsForFile = () => events.filter(e => e.path === filePath);

        await writeFile(filePath, 'one\n');
        await conditionPromise(
          () => eventsForFile().some(e => e.action === 'created'),
          'a created event'
        );

        // Deliberately not asserting `modified` here. On macOS `nsfw` reports
        // through FSEvents, whose per-path flags are cumulative: a file written
        // moments after it was created still carries `ItemCreated`, so nsfw
        // reports `created` a second time rather than `modified`. The contract
        // guarantees the vocabulary, not that every adapter draws the
        // create/modify line in the same place — the same way it doesn't
        // guarantee that every adapter can detect renames.
        const countBeforeAppend = eventsForFile().length;
        await appendFile(filePath, 'two\n');
        await conditionPromise(
          () => eventsForFile().length > countBeforeAppend,
          'an event for the append'
        );

        await unlink(filePath);
        await conditionPromise(
          () => eventsForFile().some(e => e.action === 'deleted'),
          'a deleted event'
        );

        // The actual regression guard: no adapter may invent its own
        // vocabulary. `@parcel/watcher` previously reported `updated` here.
        const allowed = ['created', 'modified', 'deleted', 'renamed'];
        const seen = [...new Set(events.map(e => e.action))];
        expect(seen.every(a => allowed.includes(a))).toBe(true, `saw: ${seen}`);
      });
      });

      it('builds a fresh task after the last watcher goes away', async () => {
        jasmine.useRealClock();
        const rootDir = await tempMkdir('atom-fsmanager-test-').then(realpath);

        // We construct our own subclass so that we can test this behavior more
        // easily. If we test the built-in watcher, we end up treading on
        // shared ground; there's an implicit watch over the project root that
        // we do not control, plus `ThemeManager` declares its own watcher.
        const probe = await watchPath(rootDir, {}, () => {});
        disposables.add(probe);

        // We test which constructor is being used, then subclass that; this
        // means we're testing behavior that matches what would happen under
        // this configured watcher, but with a clean slate.
        class IsolatedWatcher extends probe.native.constructor {
          // These must be declared, not inherited: static lookup walks the
          // prototype chain, so without them `initialize()` would find the
          // parent's live task and bind onto it.
          static task = null;
          static initialized = false;
          static started = false;
          static pendingRespawn = false;
          static INSTANCES = new Map();
          static PROMISE_META = new Map();
        }

        const native = new IsolatedWatcher(rootDir);
        await native.start();

        const firstTask = IsolatedWatcher.task;
        expect(firstTask).toBeTruthy();
        expect(firstTask.emitter.listenerCountForEventName('watcher:events')).toBe(1);

        await native.stop();
        expect(IsolatedWatcher.task).toBe(null);

        await native.start();
        const secondTask = IsolatedWatcher.task;
        expect(secondTask).not.toBe(firstTask);
        // The regression this guards: re-binding onto a terminated task's
        // emitter, which silently doubled every handler per cycle.
        expect(secondTask.emitter.listenerCountForEventName('watcher:events')).toBe(1);

        await native.stop();
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

      it('honors a stop that arrives while the watcher is still starting', async () => {
        jasmine.useRealClock();
        const rootDir = await tempMkdir('atom-fsmanager-test-').then(realpath);
        const Isolated = await isolatedWatcherClass();
        const native = new Isolated(rootDir);

        // Deliberately not awaited: stop lands mid-`STARTING`.
        const starting = native.start();
        const stopping = native.stop();
        await Promise.all([starting, stopping]);

        expect(native.isRunning()).toBe(false);
        // The leak this guards: the watcher used to finish starting *after*
        // the stop was ignored, leaving a worker subscription nothing could
        // ever release.
        expect(Isolated.INSTANCES.size).toBe(0);
        expect(Isolated.task).toBe(null);
      });

      it('reports a failed start and returns to a stopped state', async () => {
        const Isolated = await isolatedWatcherClass();
        const native = new Isolated(path.join(path.sep, 'definitely', 'not', 'here'));

        const errors = [];
        native.onDidError(err => errors.push(err));

        await native.start();

        expect(errors.length).toBe(1);
        expect(native.isRunning()).toBe(false);
        // Not wedged in STARTING: it can be started again.
        expect(Isolated.task).toBe(null);
      });

      it('does not throw on a rename event with no origin path', async () => {
        const rootDir = await tempMkdir('atom-fsmanager-test-').then(realpath);
        const watcher = await watchPath(rootDir, {}, () => {});
        subs.add(watcher);

        const received = [];
        watcher.onNativeEvents(
          [{ action: 'renamed', path: path.join(rootDir, 'orphan.txt') }],
          batch => received.push(...batch)
        );

        expect(received.length).toBe(1);
        expect(received[0].action).toBe('created');
      });



      describe('when watching a single file', () => {
        let rootDir, filePath;

        beforeEach(async () => {
          jasmine.useRealClock();
          rootDir = await tempMkdir('atom-fsmanager-test-').then(realpath);
          filePath = path.join(rootDir, 'thud.js');
          await writeFile(filePath, 'original\n');
        });

        it('reports modifications to the file', async () => {
          let events = [];
          const watcher = await watchPath(filePath, {}, batch => events.push(...batch));
          disposables.add(watcher);

          await appendFile(filePath, 'more\n');
          await conditionPromise(
            () => events.some(e => e.action === 'modified' && e.path === filePath),
            'a modified event'
          );
        });

        it('reports deletion of the file', async () => {
          let events = [];
          const watcher = await watchPath(filePath, {}, batch => events.push(...batch));
          disposables.add(watcher);

          await unlink(filePath);
          await conditionPromise(
            () => events.some(e => e.action === 'deleted' && e.path === filePath),
            'a deleted event'
          );
        });

        // The regression test for the stale-inode bug: a watch on the file
        // itself would follow the old inode and go silent after this.
        it('survives an atomic replacement and reports it as a modification', async () => {
          let events = [];
          const watcher = await watchPath(filePath, {}, batch => events.push(...batch));
          disposables.add(watcher);

          const tmpPath = path.join(rootDir, 'thud.js.tmp');
          await writeFile(tmpPath, 'replaced\n');
          await rename(tmpPath, filePath);

          await conditionPromise(
            () => events.some(e => e.action === 'modified' && e.path === filePath),
            'a modified event for the replacement'
          );
          expect(events.some(e => e.action === 'created')).toBe(false);

          // And it's still live afterwards — the point of watching the parent.
          events.length = 0;
          await appendFile(filePath, 'again\n');
          await conditionPromise(
            () => events.some(e => e.path === filePath),
            'events to continue after the replacement'
          );
        });

        it('coalesces a burst of writes into few batches', async () => {
          const callback = jasmine.createSpy('onDidChange');
          const watcher = await watchPath(filePath, {}, callback);
          disposables.add(watcher);

          for (let i = 0; i < 10; i++) {
            await appendFile(filePath, `line ${i}\n`);
          }
          await conditionPromise(() => callback.calls.count() > 0, 'any batch');
          await wait(process.env.CI ? 1000 : 400);

          // Ten writes, nowhere near ten batches.
          expect(callback.calls.count()).toBeLessThan(4);
        });
      });
    });
  }

  describe('when the fileSystemWatcher setting changes', () => {
    it('keeps existing watchers alive across the transition', async () => {
      jasmine.useRealClock();
      atom.config.set('core.fileSystemWatcher', 'nsfw');
      await watchPath.waitForTransition();

      const rootDir = await tempMkdir('atom-fsmanager-test-').then(realpath);
      let events = [];
      const watcher = await watchPath(rootDir, {}, batch => events.push(...batch));
      subs.add(watcher);

      await writeFile(path.join(rootDir, 'before.txt'), 'before\n');
      await conditionPromise(() => events.length > 0, 'events before the switch');

      const before = watcher.native.constructor.name;

      atom.config.set('core.fileSystemWatcher', 'parcel');
      await watchPath.waitForTransition();

      expect(watcher.native.constructor.name).not.toBe(before);

      events.length = 0;
      let n = 0;
      await conditionPromise(async () => {
        await writeFile(path.join(rootDir, `after-${n++}.txt`), 'after\n');
        return events.length > 0;
      }, 'events after the switch');
    });
  });

});
