/** @babel */

const StateStore = require('../src/state-store.js');

describe('StateStore', () => {
  let databaseName = `test-database-${Date.now()}`;
  let version = 1;

  describe('with the default IndexedDB backend', () => {
    beforeEach(() => {
      atom.config.set('core.useLegacySessionStore', true)
    })

    it('can save, load, and delete states', () => {
      const store = new StateStore(databaseName, version);
      return store
        .save('key', { foo: 'bar' })
        .then(() => store.load('key'))
        .then(state => {
          expect(state).toEqual({ foo: 'bar' });
        })
        .then(() => store.delete('key'))
        .then(() => store.load('key'))
        .then(value => {
          expect(value).toBeNull();
        })
        .then(() => store.count())
        .then(count => {
          expect(count).toBe(0);
        });
    });

    it('resolves with null when a non-existent key is loaded', () => {
      const store = new StateStore(databaseName, version);
      return store.load('no-such-key').then(value => {
        expect(value).toBeNull();
      });
    });

    it('can clear the state object store', () => {
      const store = new StateStore(databaseName, version);
      return store
        .save('key', { foo: 'bar' })
        .then(() => store.count())
        .then(count => expect(count).toBe(1))
        .then(() => store.clear())
        .then(() => store.count())
        .then(count => {
          expect(count).toBe(0);
        });
    });

    it('returns a database instance via dbPromise', async () => {
      const store = new StateStore(databaseName, version);
      const instance = await store.dbPromise;
      expect(instance instanceof IDBDatabase).toBe(true);
    });

    describe('when there is an error reading from the database', () => {
      it('rejects the promise returned by load', () => {
        const store = new StateStore(databaseName, version);

        const fakeErrorEvent = {
          target: { errorCode: 'Something bad happened' }
        };

        spyOn(IDBObjectStore.prototype, 'get').andCallFake(key => {
          let request = {};
          process.nextTick(() => request.onerror(fakeErrorEvent));
          return request;
        });

        return store
          .load('nonexistentKey')
          .then(() => {
            throw new Error('Promise should have been rejected');
          })
          .catch(event => {
            expect(event).toBe(fakeErrorEvent);
          });
      });
    });
  });

  describe('with the new SQLite3 backend', () => {
    beforeEach(() => {
      atom.config.set('core.useLegacySessionStore', false)
    })

    it('can save, load, and delete states', () => {
      const store = new StateStore(databaseName, version);
      return store
        .save('key', { foo: 'bar' })
        .then(() => store.load('key'))
        .then(state => {
          expect(state).toEqual({ foo: 'bar' });
        })
        .then(() => store.delete('key'))
        .then(() => store.load('key'))
        .then(value => {
          expect(value).toBeNull();
        })
        .then(() => store.count())
        .then(count => {
          expect(count).toBe(0);
        });
    });

    it('resolves with null when a non-existent key is loaded', () => {
      const store = new StateStore(databaseName, version);
      return store.load('no-such-key').then(value => {
        expect(value).toBeNull();
      });
    });

    it('can clear the state object store', () => {
      const store = new StateStore(databaseName, version);
      return store
        .save('key', { foo: 'bar' })
        .then(() => store.count())
        .then(count => expect(count).toBe(1))
        .then(() => store.clear())
        .then(() => store.count())
        .then(count => {
          expect(count).toBe(0);
        });
    });

    it('returns a database instance via dbPromise', async () => {
      const store = new StateStore(databaseName, version);
      const instance = await store.dbPromise;
      const Database = require("better-sqlite3");
      expect(instance instanceof Database).toBe(true);
    });
  });
});
