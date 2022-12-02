const fs = require('fs-plus');
const path = require('path');
const KeymapManager = require('atom-keymap');
const CSON = require('season');

KeymapManager.prototype.onDidLoadUserKeymap = function(callback) {
  return this.emitter.on('did-load-user-keymap', callback);
};

KeymapManager.prototype.getUserKeymapPath = function() {
  if (this.configDirPath == null) {
    return "";
  }
  let userKeymapPath = CSON.resolve(path.join(this.configDirPath, 'keymap'));
  if (userKeymapPath) {
    return userKeymapPath;
  }
  return path.join(this.configDirPath, 'keymap.cson');
};

KeymapManager.prototype.loadUserKeymap = function() {
  const userKeymapPath = this.getUserKeymapPath();
  if (!fs.isFileSync(userKeymapPath)) {
    return;
  }
  try {
    this.loadKeymap(userKeymapPath, {watch: true, suppressErrors: true, priority: 100});
  }
  catch (error) {
    if (error.message.indexOf('Unable to watch path') > -1) {
      const message = `Unable to watch path: \`${path.basename(userKeymapPath)}\`. Make sure you \
        have permission to read \`${userKeymapPath}\`.

        On linux there are currently problems with watch sizes. See \
        [this document][watches] for more info. \
        [watches]:https://github.com/atom/atom/blob/master/docs/build-instructions/linux.md#typeerror-unable-to-watch-path`;
      this.notificationManager.addError(message, {dismissable: true});
    }
    else {
      const detail = error.path;
      const stack = error.stack;
      this.notificationManager.addFatalError(error.message, {detail,stack,dismissable: true});
    }
  }
  return this.emitter.emit('did-load-user-keymap');
};

KeymapManager.prototype.subscribeToFileReadFailure = function() {
  return this.onDidFailToReadFile((error) => {
    const userKeymapPath = this.getUserKeymapPath();
    const message = `Failed to load \`${userKeymapPath}\``;
    const detail = error.location != null ? error.stack : error.message;
    this.notificationManager.addError(message, {detail, dismissable: true});
  });
};

module.exports = KeymapManager;
