module.exports = {
  updateError() {
    core.autoUpdater.emitter.emit('update-error');
  },

  checkForUpdate() {
    core.autoUpdater.emitter.emit('did-begin-checking-for-update');
  },

  updateNotAvailable() {
    core.autoUpdater.emitter.emit('update-not-available');
  },

  downloadUpdate() {
    core.autoUpdater.emitter.emit('did-begin-downloading-update');
  },

  finishDownloadingUpdate(releaseVersion) {
    core.autoUpdater.emitter.emit('did-complete-downloading-update', {
      releaseVersion
    });
  }
};
