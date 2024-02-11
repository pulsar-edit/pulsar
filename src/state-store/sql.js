'use strict';

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

module.exports = class SQLStateStore {
  constructor(databaseName, version) {
    const table = databaseName + version;
    this.tableName = '"' + table + '"';
    this.dbPromise = (async () => {
      await awaitForAtomGlobal();
      const dbPath = path.join(atom.getConfigDirPath(), 'session-store.db');
      let db;
      try {
        db = new sqlite3.Database(dbPath);
      } catch(error) {
        atom.notifications.addFatalError('Error loading database', {
          stack: new Error('Error loading SQLite database for state storage').stack,
          dismissable: true
        });
        console.error('Error loading SQLite database', error);
        return null
      }
      await getOne(db,
        `CREATE TABLE IF NOT EXISTS ${this.tableName} (key VARCHAR, value JSON)`
      );
      await getOne(db,
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
      return getOne(db,
        `REPLACE INTO ${this.tableName} VALUES (?, ?)`,
        key,
        JSON.stringify({ value: value, storedAt: new Date().toString() })
      )
    })
  }

  load(key) {
    return this.dbPromise.then(db => {
      if(!db) return null;
      return getOne(db, `SELECT value FROM ${this.tableName} WHERE key = ?`, key )
    }).then(result => {
      if(result) {
        const parsed = JSON.parse(result.value, reviver);
        return parsed?.value
      }
      return null;
    });
  }

  delete(key) {
    return this.dbPromise.then(db =>
      getOne(db, `DELETE FROM ${this.tableName} WHERE key = ?`, key )
    );
  }

  clear() {
    return this.dbPromise.then(db =>
      getOne(db, `DELETE FROM ${this.tableName}`)
    );
  }

  count() {
    return this.dbPromise.then(db => {
      if(!db) return null;
      return getOne(db, `SELECT COUNT(key) c FROM ${this.tableName}`).then(r => r.c)
    });
  }
};

function getOne(db, sql, ...params) {
  return new Promise((resolve, reject) => {
    db.get(sql, ...params, (error, result) => {
      if(error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

function awaitForAtomGlobal() {
  return new Promise(resolve => {
    const i = setInterval(() => {
      if(atom) {
        clearInterval(i)
        resolve()
      }
    }, 50)
  })
}

function reviver(_, value) {
  if(value?.type === 'Buffer') {
    return Buffer.from(value.data);
  } else {
    return value;
  }
}
