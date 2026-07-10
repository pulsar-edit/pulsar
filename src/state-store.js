"use strict";
const SQL = require("./state-store/sql");

module.exports = class StateStore {
  constructor(databaseName, version) {
    this.databaseName = databaseName;
    this.version = version;
  }

  initialize({ configDirPath }) {
    this.configDirPath = configDirPath;
  }

  isConnected() {
    return this.sql?.isConnected() ?? false;
  }

  connect() {
    return this._getOrCreateImplementation().connect();
  }

  save(key, value) {
    return this._getOrCreateImplementation().save(key, value);
  }

  load(key) {
    return this._getOrCreateImplementation().load(key);
  }

  delete(key) {
    return this._getOrCreateImplementation().delete(key);
  }

  clear() {
    return this._getOrCreateImplementation().clear();
  }

  count() {
    return this._getOrCreateImplementation().count();
  }

  get dbPromise() {
    // Exposed due to usage in [`project-plus`](https://web.pulsar-edit.dev/packages/project-plus)
    return this._getOrCreateImplementation().dbPromise;
  }

  _getOrCreateImplementation() {
    if (!this.configDirPath) {
      throw new Error(`state-store: Must initialize with configDirPath`);
    }
    this.sql ??= new SQL(this.databaseName, this.version, {
      storagePath: this.configDirPath,
    });
    return this.sql;
  }
};
