/** @babel */

const StateStore = require('../src/state-store.js');

describe('StateStore', () => {
  let databaseName = `test-database-${Date.now()}`;
  let version = 1;

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

  describe('when there is an error reading from the database', () => {
    it('rejects the promise returned by load', async (done) => {
      const store = new StateStore(databaseName, version);

      const fakeErrorEvent = {
        target: { errorCode: 'Something bad happened' }
      };

      const fakeIDBObjectStore = {};
      let loadStorePromise;

      await new Promise((resolve) => {
        spyOn(IDBObjectStore.prototype, 'get').and.callFake(key => {
          resolve();
          return fakeIDBObjectStore;
        });

        loadStorePromise = store.load('nonexistentKey');
      })

      fakeIDBObjectStore.onerror(fakeErrorEvent);

      loadStorePromise
        .then(() => {
          throw new Error('Promise should have been rejected');
        })
        .catch(event => {
          expect(event).toBe(fakeErrorEvent);
        });

      done();
    });
  });
});
