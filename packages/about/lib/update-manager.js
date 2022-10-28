const { Emitter, CompositeDisposable } = require('atom');

const Unsupported = 'unsupported';
const Idle = 'idle';
const CheckingForUpdate = 'checking';
const DownloadingUpdate = 'downloading';
const UpdateAvailableToInstall = 'update-available';
const UpToDate = 'no-update-available';
const ErrorState = 'error';

let UpdateManager = class UpdateManager {
  constructor() {
    this.emitter = new Emitter();
    this.currentVersion = core.getVersion();
    this.availableVersion = core.getVersion();
    this.resetState();
    this.listenForAtomEvents();
  }

  listenForAtomEvents() {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      core.autoUpdater.onDidBeginCheckingForUpdate(() => {
        this.setState(CheckingForUpdate);
      }),
      core.autoUpdater.onDidBeginDownloadingUpdate(() => {
        this.setState(DownloadingUpdate);
      }),
      core.autoUpdater.onDidCompleteDownloadingUpdate(({ releaseVersion }) => {
        this.setAvailableVersion(releaseVersion);
      }),
      core.autoUpdater.onUpdateNotAvailable(() => {
        this.setState(UpToDate);
      }),
      core.autoUpdater.onUpdateError(() => {
        this.setState(ErrorState);
      }),
      core.config.observe('core.automaticallyUpdate', value => {
        this.autoUpdatesEnabled = value;
        this.emitDidChange();
      })
    );

    // TODO: When https://github.com/atom/electron/issues/4587 is closed we can add this support.
    // core.autoUpdater.onUpdateAvailable =>
    //   @find('.about-updates-item').removeClass('is-shown')
    //   @updateAvailable.addClass('is-shown')
  }

  dispose() {
    this.subscriptions.dispose();
  }

  onDidChange(callback) {
    return this.emitter.on('did-change', callback);
  }

  emitDidChange() {
    this.emitter.emit('did-change');
  }

  getAutoUpdatesEnabled() {
    return (
      this.autoUpdatesEnabled && this.state !== UpdateManager.State.Unsupported
    );
  }

  setAutoUpdatesEnabled(enabled) {
    return core.config.set('core.automaticallyUpdate', enabled);
  }

  getErrorMessage() {
    return core.autoUpdater.getErrorMessage();
  }

  getState() {
    return this.state;
  }

  setState(state) {
    this.state = state;
    this.emitDidChange();
  }

  resetState() {
    this.state = core.autoUpdater.platformSupportsUpdates()
      ? core.autoUpdater.getState()
      : Unsupported;
    this.emitDidChange();
  }

  getAvailableVersion() {
    return this.availableVersion;
  }

  setAvailableVersion(version) {
    this.availableVersion = version;

    if (this.availableVersion !== this.currentVersion) {
      this.state = UpdateAvailableToInstall;
    } else {
      this.state = UpToDate;
    }

    this.emitDidChange();
  }

  checkForUpdate() {
    core.autoUpdater.checkForUpdate();
  }

  restartAndInstallUpdate() {
    core.autoUpdater.restartAndInstallUpdate();
  }

  getReleaseNotesURLForCurrentVersion() {
    return this.getReleaseNotesURLForVersion(this.currentVersion);
  }

  getReleaseNotesURLForAvailableVersion() {
    return this.getReleaseNotesURLForVersion(this.availableVersion);
  }

  getReleaseNotesURLForVersion(appVersion) {
    // Dev versions will not have a releases page
    if (appVersion.indexOf('dev') > -1) {
      return 'https://atom.io/releases';
    }

    if (!appVersion.startsWith('v')) {
      appVersion = `v${appVersion}`;
    }

    const releaseRepo =
      appVersion.indexOf('nightly') > -1 ? 'pulsar-nightly-releases' : 'pulsar';
    return `https://github.com/pulsar-edit/${releaseRepo}/releases/tag/${appVersion}`;
  }
};

UpdateManager.State = {
  Unsupported: Unsupported,
  Idle: Idle,
  CheckingForUpdate: CheckingForUpdate,
  DownloadingUpdate: DownloadingUpdate,
  UpdateAvailableToInstall: UpdateAvailableToInstall,
  UpToDate: UpToDate,
  Error: ErrorState
};

module.exports = UpdateManager;
