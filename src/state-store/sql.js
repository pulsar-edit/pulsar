"use strict";

const path = require("path");
// Electron 43 ships the synchronous Node SQLite API used by this adapter.
// eslint-disable-next-line n/no-unsupported-features/node-builtins
const { DatabaseSync } = require("node:sqlite");

module.exports = class SQLStateStore {
  constructor(databaseName, version, { storagePath }) {
    const table = `${databaseName}${version}`;
    this.tableName = `"${table}"`;

    const dbPath = path.join(storagePath, "session-store.db");
    let db;
    try {
      db = new DatabaseSync(dbPath);
    } catch (error) {
      const stack = new Error("Error loading SQLite database for state storage").stack;
      atom.notifications.addFatalError("Error loading database", { stack, dismissable: true });
      console.error("Error loading SQLite database", error);
      return null;
    }

    db.exec("PRAGMA journal_mode = WAL");
    db.exec(`CREATE TABLE IF NOT EXISTS ${this.tableName} (key VARCHAR, value JSON)`);
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS "${table}_index" ON ${this.tableName}(key)`);

    this.db = db;
    this.connected = true;
  }

  // The contract for this adapter expects promises, so these methods are async
  // even though Node's built-in SQLite API is synchronous.
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
      JSON.stringify({ value, storedAt: new Date().toString() }),
    );
  }

  async load(key) {
    if (!this.db) return null;
    const result = getOne(this.db, `SELECT value FROM ${this.tableName} WHERE key = ?`, key);
    if (!result) return null;
    const parsed = JSON.parse(result.value, reviver);
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
    const result = getOne(this.db, `SELECT COUNT(key) itemCount FROM ${this.tableName}`);
    return result.itemCount;
  }
};

function getOne(db, sql, ...params) {
  return db.prepare(sql).get(...params);
}

function exec(db, sql, ...params) {
  return db.prepare(sql).run(...params);
}

function reviver(_, value) {
  if (value?.type === "Buffer") {
    return Buffer.from(value.data);
  } else {
    return value;
  }
}
