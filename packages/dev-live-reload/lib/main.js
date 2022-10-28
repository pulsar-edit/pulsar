module.exports = {
  activate(state) {
    if (!core.inDevMode() || core.inSpecMode()) return;

    if (core.packages.hasActivatedInitialPackages()) {
      this.startWatching();
    } else {
      this.activatedDisposable = core.packages.onDidActivateInitialPackages(
        () => this.startWatching()
      );
    }
  },

  deactivate() {
    if (this.activatedDisposable) this.activatedDisposable.dispose();
    if (this.commandDisposable) this.commandDisposable.dispose();
    if (this.uiWatcher) this.uiWatcher.destroy();
  },

  startWatching() {
    const UIWatcher = require('./ui-watcher');
    this.uiWatcher = new UIWatcher({ themeManager: core.themes });
    this.commandDisposable = core.commands.add(
      'atom-workspace',
      'dev-live-reload:reload-all',
      () => this.uiWatcher.reloadAll()
    );
    if (this.activatedDisposable) this.activatedDisposable.dispose();
  }
};
