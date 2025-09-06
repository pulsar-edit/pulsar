/** @babel */

const StateStore = require('../src/state-store.js');

describe('StateStore', () => {
  let databaseName = `test-database-${Date.now()}`;
  let version = 1;

  describe('with the default IndexedDB backend', () => {
    beforeEach(() => {
      jasmine.useRealClock();
      atom.config.set('core.useLegacySessionStore', true)
    })

    it('can save, load, and delete states', async () => {
      const store = new StateStore(databaseName, version, {
        config: atom.config
      });
      store.initialize({ configDirPath: atom.getConfigDirPath() });

      await store.save('key', { foo: 'bar' });

      let state = await store.load('key');
      expect(state).toEqual({ foo: 'bar' });

      await store.delete('key');

      expect(await store.load('key')).toBeNull();
      expect(await store.count()).toBe(0);
    });

    it('resolves with null when a non-existent key is loaded', () => {
      const store = new StateStore(databaseName, version, {
        config: atom.config
      });
      store.initialize({ configDirPath: atom.getConfigDirPath() });
      return store.load('no-such-key').then(value => {
        expect(value).toBeNull();
      });
    });

    it('can clear the state object store', async () => {
      const store = new StateStore(databaseName, version, {
        config: atom.config
      });
      store.initialize({ configDirPath: atom.getConfigDirPath() });

      await store.save('key', { foo: 'bar' });
      expect(await store.count()).toBe(1);

      await store.clear();
      expect(await store.count()).toBe(0);
    });

    it('returns a database instance via dbPromise', async () => {
      const store = new StateStore(databaseName, version, {
        config: atom.config
      });
      store.initialize({ configDirPath: atom.getConfigDirPath() });
      const instance = await store.dbPromise;
      expect(instance instanceof IDBDatabase).toBe(true);
    });

    describe('when there is an error reading from the database', () => {
      it('rejects the promise returned by load', async () => {
        jasmine.useRealClock();
        const store = new StateStore(databaseName, version, {
          config: atom.config
        });
        store.initialize({ configDirPath: atom.getConfigDirPath() });

        const fakeErrorEvent = {
          target: { errorCode: 'Something bad happened' }
        };

        spyOn(IDBObjectStore.prototype, 'get').and.callFake(_key => {
          let request = {};
          process.nextTick(() => request.onerror(fakeErrorEvent));
          return request;
        });

        try {
          await store.load('nonExistentKey');
          throw new Error(`Promise should have been rejected`);
        } catch (event) {
          expect(event).toBe(fakeErrorEvent);
        }
      });
    });
  });

  describe('with the new SQLite3 backend', () => {
    beforeEach(() => {
      jasmine.useRealClock();
      atom.config.set('core.useLegacySessionStore', false)
    })

    it('can save, load, and delete states', async () => {
      const store = new StateStore(databaseName, version, {
        config: atom.config
      });
      store.initialize({ configDirPath: atom.getConfigDirPath() });

      await store.save('key', { foo: 'bar' });

      let state = await store.load('key');
      expect(state).toEqual({ foo: 'bar' });

      await store.delete('key');

      expect(await store.load('key')).toBeNull();
      expect(await store.count()).toBe(0);
    });

    it('resolves with null when a non-existent key is loaded', () => {
      const store = new StateStore(databaseName, version, {
        config: atom.config
      });
      store.initialize({ configDirPath: atom.getConfigDirPath() });
      return store.load('no-such-key').then(value => {
        expect(value).toBeNull();
      });
    });

    it('can clear the state object store', async () => {
      const store = new StateStore(databaseName, version, {
        config: atom.config
      });
      store.initialize({ configDirPath: atom.getConfigDirPath() });

      await store.save('key', { foo: 'bar' });
      expect(await store.count()).toBe(1);

      await store.clear();
      expect(await store.count()).toBe(0);
    });

    it('returns a database instance via dbPromise', async () => {
      const store = new StateStore(databaseName, version, {
        config: atom.config
      });
      store.initialize({ configDirPath: atom.getConfigDirPath() });
      const instance = await store.dbPromise;
      const Database = require("better-sqlite3");
      expect(instance instanceof Database).toBe(true);
    });
  });
});
