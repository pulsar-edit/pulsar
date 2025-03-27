'use strict';
const IndexedDB = require('./state-store/indexed-db');
const SQL = require('./state-store/sql');

module.exports = class StateStore {
  constructor(databaseName, version, { config }) {
    this.databaseName = databaseName;
    this.version = version;
    this.config = config;
  }

  initialize({ configDirPath }) {
    this.configDirPath = configDirPath;
  }

  isConnected() {
    let impl = this._getImplementation();
    return impl?.isConnected() ?? false;
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

  _getImplementation() {
    if (this.config.get('core.useLegacySessionStore')) {
      return this.indexed;
    } else {
      return this.sql;
    }
  }

  _getOrCreateImplementation() {
    if (this.config.get('core.useLegacySessionStore')) {
      this.indexed ??= new IndexedDB(this.databaseName, this.version);
      return this.indexed;
    } else {
      if (!this.configDirPath) {
        throw new Error(`state-store: Must initialize with configDirPath`);
      }
      this.sql ??= new SQL(this.databaseName, this.version, {
        storagePath: this.configDirPath
      });
      return this.sql;
    }
  }
};
