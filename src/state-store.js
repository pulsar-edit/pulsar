const sqlite3 = require('sqlite3')

module.exports = class StateStore {
  constructor(databaseName, version) {
    this.connected = false;
    this.databaseName = databaseName;
    this.version = version;
    this._db = new sqlite3.Database('/tmp/pulsar-1.sqlite3')
    this.ready = this.runOnPromise(
      "CREATE TABLE IF NOT EXISTS state(key VARCHAR KEY UNIQUE, value VARCHAR)"
    )

    // Patch Buffer#toJSON because it's silly....
    Buffer.prototype.toJSON = function() {
      return {
        "~$type": "Buffer",
        "~$data": this.base64Slice()
      }
    }
  }

  async runOnPromise(...args) {
    await this.ready
    return new Promise((resolve, reject) => {
      this._db.get(...args, (error, val) => {
        if(error) {
          reject(error)
        } else {
          resolve(val)
        }
      })
    })
  }

  isConnected() {
    return this.connected;
  }

  connect() {
    return this.ready.then(() => !!this._db)
  }

  save(key, value) {
    return this.runOnPromise(
      `INSERT INTO state(key, value)
          VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE
        SET value = EXCLUDED.value`,
      [key, JSON.stringify({value, storedAt: new Date().toString()})]
    )
  }

  load(key) {
    return this.runOnPromise(
      "SELECT value FROM state WHERE key = ?",
      [key]
    ).then(res => {
      const val = res?.value
      if(val) {
        const parsed = JSON.parse(val, (key, val) => {
          if(val && val['~$type'] === 'Buffer') {
            return Buffer.from(val['~$data'], 'base64')
          } else {
            return val
          }
        })
        return parsed.value
      }
    })
  }

  delete(key) {
    return this.runOnPromise("DELETE FROM state WHERE key = ?", [key])
  }

  clear() {
    return this.runOnPromise("DELETE FROM state")
  }

  count() {
    return this.runOnPromise("SELECT COUNT(*) c FROM state")
      .then(r => r.c)
  }
};
