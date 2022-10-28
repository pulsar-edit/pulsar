const { BufferedProcess } = require('atom');
const UpdatePackageDependenciesStatusView = require('./update-package-dependencies-status-view');

module.exports = {
  activate() {
    this.subscription = core.commands.add(
      'atom-workspace',
      'update-package-dependencies:update',
      () => this.update()
    );
  },

  deactivate() {
    this.subscription.dispose();
    if (this.updatePackageDependenciesStatusView) {
      this.updatePackageDependenciesStatusView.detach();
      this.updatePackageDependenciesStatusView = null;
    }
  },

  consumeStatusBar(statusBar) {
    this.updatePackageDependenciesStatusView = new UpdatePackageDependenciesStatusView(
      statusBar
    );
  },

  update() {
    if (this.process) return; // Do not allow multiple apm processes to run
    if (this.updatePackageDependenciesStatusView)
      this.updatePackageDependenciesStatusView.attach();

    let errorOutput = '';

    const command = core.packages.getApmPath();
    const args = ['install', '--no-color'];
    const stderr = output => {
      errorOutput += output;
    };
    const options = {
      cwd: this.getActiveProjectPath(),
      env: Object.assign({}, process.env, { NODE_ENV: 'development' })
    };

    const exit = code => {
      this.process = null;
      if (this.updatePackageDependenciesStatusView)
        this.updatePackageDependenciesStatusView.detach();

      if (code === 0) {
        core.notifications.addSuccess('Package dependencies updated');
      } else {
        core.notifications.addError('Failed to update package dependencies', {
          detail: errorOutput,
          dismissable: true
        });
      }
    };

    this.process = this.runBufferedProcess({
      command,
      args,
      stderr,
      exit,
      options
    });
  },

  // This function exists so that it can be spied on by tests
  runBufferedProcess(params) {
    return new BufferedProcess(params);
  },

  getActiveProjectPath() {
    const activeItem = core.workspace.getActivePaneItem();
    if (activeItem && typeof activeItem.getPath === 'function') {
      return core.project.relativizePath(activeItem.getPath())[0];
    } else {
      return core.project.getPaths()[0];
    }
  }
};
