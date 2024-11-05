'use strict';

const path = require('path');
const nativeSQLite = require(path.join(
  require.resolve('better-sqlite3'),
  '..', '..',
  'build', 'Release',
  'better_sqlite3.node'
));
const sqlite3 = require('better-sqlite3');

module.exports = class SQLStateStore {
  constructor(databaseName, version) {
    const table = databaseName + version;
    this.tableName = '"' + table + '"';
    this.dbPromise = (async () => {
      await awaitForAtomGlobal();
      const dbPath = path.join(atom.getConfigDirPath(), 'session-store.db');
      let db;
      try {
        db = sqlite3(dbPath, {nativeBinding: nativeSQLite});
      } catch(error) {
        atom.notifications.addFatalError('Error loading database', {
          stack: new Error('Error loading SQLite database for state storage').stack,
          dismissable: true
        });
        console.error('Error loading SQLite database', error);
        return null;
      }
      db.pragma('journal_mode = WAL');
      db.exec(
        `CREATE TABLE IF NOT EXISTS ${this.tableName} (key VARCHAR, value JSON)`
      );
      db.exec(
        `CREATE UNIQUE INDEX IF NOT EXISTS "${table}_index" ON ${this.tableName}(key)`
      );
      return db;
    })();
    this.connected = false;
    this.dbPromise.then(db => this.connected = !!db);
  }

  isConnected() {
    return this.connected;
  }

  connect() {
    return this.dbPromise.then(db => !!db);
  }

  save(key, value) {
    return this.dbPromise.then(db => {
      if(!db) return null;
      return exec(db,
        `REPLACE INTO ${this.tableName} VALUES (?, ?)`,
        key,
        JSON.stringify({ value: value, storedAt: new Date().toString() })
      );
    });
  }

  load(key) {
    return this.dbPromise.then(db => {
      if(!db) return null;
      return getOne(db, `SELECT value FROM ${this.tableName} WHERE key = ?`, key);
    }).then(result => {
      if(result) {
        const parsed = JSON.parse(result.value, reviver);
        return parsed?.value;
      }
      return null;
    });
  }

  delete(key) {
    return this.dbPromise.then(db =>
      exec(db, `DELETE FROM ${this.tableName} WHERE key = ?`, key)
    );
  }

  clear() {
    return this.dbPromise.then(db =>
      exec(db, `DELETE FROM ${this.tableName}`)
    );
  }

  count() {
    return this.dbPromise.then(db => {
      if(!db) return null;
      const r = getOne(db, `SELECT COUNT(key) c FROM ${this.tableName}`);
      return r.c;
    });
  }
};

function getOne(db, sql, ...params) {
  const stmt = db.prepare(sql);
  return stmt.get(params)
}

function exec(db, sql, ...params) {
  const stmt = db.prepare(sql);
  stmt.run(params)
}

function awaitForAtomGlobal() {
  return new Promise(resolve => {
    const i = setInterval(() => {
      if(atom) {
        clearInterval(i);
        resolve();
      }
    }, 50);
  })
}

function reviver(_, value) {
  if(value?.type === 'Buffer') {
    return Buffer.from(value.data);
  } else {
    return value;
  }
}
