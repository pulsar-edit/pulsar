const keytar = require('keytar');

const SERVICE_NAME = 'GitHub';
const ACCOUNT_NAME = 'Pulsar';

class Credentials {
  constructor() {
    this._token = null;
    this._onDidUpdateCredentials = null;
  }

  async load() {
    try {
      this._token = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
      return this._token;
    } catch (error) {
      console.error('Failed to load credentials from keychain:', error);
      return null;
    }
  }

  async save(token) {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token provided');
    }

    try {
      await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, token);
      this._token = token;
      this._notifyCredentialsUpdated();
    } catch (error) {
      console.error('Failed to save credentials to keychain:', error);
      throw error;
    }
  }

  async delete() {
    try {
      const result = await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
      this._token = null;
      this._notifyCredentialsUpdated();
      return result;
    } catch (error) {
      console.error('Failed to delete credentials from keychain:', error);
      throw error;
    }
  }

  getToken() {
    return this._token;
  }

  hasToken() {
    return this._token !== null && this._token !== undefined;
  }

  onDidUpdateCredentials(callback) {
    this._onDidUpdateCredentials = callback;
  }

  _notifyCredentialsUpdated() {
    if (typeof this._onDidUpdateCredentials === 'function') {
      this._onDidUpdateCredentials(this._token);
    }
  }
}

module.exports = Credentials;
