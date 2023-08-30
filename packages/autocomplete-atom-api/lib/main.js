const provider = require('./provider');

module.exports = {
  activate() { return provider.load(); },

  getProvider() { return provider; }
};
