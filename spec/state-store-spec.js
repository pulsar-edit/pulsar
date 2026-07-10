/** @babel */

const StateStore = require("../src/state-store.js");

describe("StateStore", () => {
  let databaseName = `test-database-${Date.now()}`;
  let version = 1;

  describe("with the SQLite3 backend", () => {
    beforeEach(() => {
      jasmine.useRealClock();
    });

    it("can save, load, and delete states", async () => {
      const store = new StateStore(databaseName, version);
      store.initialize({ configDirPath: atom.getConfigDirPath() });

      await store.save("key", { foo: "bar" });

      let state = await store.load("key");
      expect(state).toEqual({ foo: "bar" });

      await store.delete("key");

      expect(await store.load("key")).toBeNull();
      expect(await store.count()).toBe(0);
    });

    it("resolves with null when a non-existent key is loaded", () => {
      const store = new StateStore(databaseName, version);
      store.initialize({ configDirPath: atom.getConfigDirPath() });
      return store.load("no-such-key").then((value) => {
        expect(value).toBeNull();
      });
    });

    it("can clear the state object store", async () => {
      const store = new StateStore(databaseName, version);
      store.initialize({ configDirPath: atom.getConfigDirPath() });

      await store.save("key", { foo: "bar" });
      expect(await store.count()).toBe(1);

      await store.clear();
      expect(await store.count()).toBe(0);
    });

    it("returns a database instance via dbPromise", async () => {
      const store = new StateStore(databaseName, version);
      store.initialize({ configDirPath: atom.getConfigDirPath() });
      const instance = await store.dbPromise;
      const Database = require("better-sqlite3");
      expect(instance instanceof Database).toBe(true);
    });
  });
});
