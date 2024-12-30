'use strict';
const IndexedDB = require('./state-store/indexed-db');
const SQL = require('./state-store/sql');

module.exports = class StateStore {
  constructor(databaseName, version) {
    this.databaseName = databaseName;
    this.version = version;
  }

  isConnected() {
    // We don't need to wait for atom global here because this isConnected
    // is only called on closing the editor
    if(atom.config.get('core.useLegacySessionStore')) {
      if(!this.indexed) return false;
      return this.indexed.isConnected();
    } else {
      if(!this.sql) return false;
      return this.sql.isConnected();
    }
  }

  connect() {
    return this._getCorrectImplementation().then(i => i.connect());
  }

  save(key, value) {
    return this._getCorrectImplementation().then(i => i.save(key, value));
  }

  load(key) {
    return this._getCorrectImplementation().then(i => i.load(key));
  }

  delete(key) {
    return this._getCorrectImplementation().then(i => i.delete(key));
  }

  clear() {
    return this._getCorrectImplementation().then(i => i.clear());
  }

  count() {
    return this._getCorrectImplementation().then(i => i.count());
  }

  get dbPromise() {
    // Exposed due to usage in [`project-plus`](https://web.pulsar-edit.dev/packages/project-plus)
    return this._getCorrectImplementation().then(i => i.dbPromise);
  }

  _getCorrectImplementation() {
    return awaitForAtomGlobal().then(() => {
      if(atom.config.get('core.useLegacySessionStore')) {
        this.indexed ||= new IndexedDB(this.databaseName, this.version);
        return this.indexed;
      } else {
        this.sql ||= new SQL(this.databaseName, this.version);
        return this.sql;
      }
    });
  }
};

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
