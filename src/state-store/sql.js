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
  constructor(databaseName, version, { storagePath }) {
    const table = `${databaseName}${version}`;
    this.tableName = `"${table}"`;

    let dbPath = path.join(storagePath, 'session-store.db');
    let db;
    try {
      db = sqlite3(dbPath, { nativeBinding: nativeSQLite });
    } catch (error) {
      let stack = new Error('Error loading SQLite database for state storage').stack;
      atom.notifications.addFatalError(
        'Error loading database',
        { stack, dismissable: true }
      );
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

    this.db = db;
    this.connected = true;
  }

  // `better-sqlite3` offers a synchronous API and is militant about why it’s
  // actually better for performance. But the contract for this adapter expects
  // us to return promises here, so we mark all these functions as `async` so
  // that they'll implicitly wrap return values in `Promise.resolve`.
  get dbPromise() {
    return Promise.resolve(this.db);
  }

  isConnected() {
    return this.connected;
  }

  async connect() {
    return true;
  }

  async save(key, value) {
    if (!this.db) return null;
    return exec(
      this.db,
      `REPLACE INTO ${this.tableName} VALUES (?, ?)`,
      key,
      JSON.stringify({ value: value, storedAt: new Date().toString() })
    );
  }

  async load(key) {
    if (!this.db) return null;
    let result = getOne(
      this.db,
      `SELECT value FROM ${this.tableName} WHERE key = ?`,
      key
    );
    if (!result) return null;
    let parsed = JSON.parse(result.value, reviver);
    return parsed?.value;
  }

  async delete(key) {
    exec(this.db, `DELETE FROM ${this.tableName} WHERE key = ?`, key);
  }

  async clear() {
    exec(this.db, `DELETE from ${this.tableName}`);
  }

  async count() {
    if (!this.db) return null;
    let result = getOne(
      this.db,
      `SELECT COUNT(key) itemCount FROM ${this.tableName}`
    );
    return result.itemCount;
  }
};

function getOne(db, sql, ...params) {
  const stmt = db.prepare(sql);
  return stmt.get(params);
}

function exec(db, sql, ...params) {
  const stmt = db.prepare(sql);
  return stmt.run(params);
}

function reviver(_, value) {
  if (value?.type === 'Buffer') {
    return Buffer.from(value.data);
  } else {
    return value;
  }
}
