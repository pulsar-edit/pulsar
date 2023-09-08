const { CompositeDisposable, Emitter } = require('atom');
const Grim = require('grim');
const StatusBarView = require('./status-bar-view');
const FileInfoView = require('./file-info-view');
const CursorPositionView = require('./cursor-position-view');
const SelectionCountView = require('./selection-count-view');
const GitView = require('./git-view');
const LaunchModeView = require('./launch-mode-view');

module.exports = {
  activate() {
    this.emitters = new Emitter();
    this.subscriptions = new CompositeDisposable();

    this.statusBar = new StatusBarView();
    this.attachStatusBar();

    this.subscriptions.add(atom.config.onDidChange('status-bar.fullWidth', () => {
      this.attachStatusBar();
    })
    );

    this.updateStatusBarVisibility();

    this.statusBarVisibilitySubscription =
      atom.config.observe('status-bar.isVisible', () => {
        this.updateStatusBarVisibility();
      });

    atom.commands.add('atom-workspace', 'status-bar:toggle', () => {
      if (this.statusBarPanel.isVisible()) {
        atom.config.set('status-bar.isVisible', false);
      } else {
        atom.config.set('status-bar.isVisible', true);
      }
    });

    const { safeMode, devMode } = atom.getLoadSettings();
    if (safeMode || devMode) {
      const launchModeView = new LaunchModeView({safeMode, devMode});
      this.statusBar.addLeftTile({item: launchModeView.element, priority: -1});
    }

    this.fileInfo = new FileInfoView();
    this.statusBar.addLeftTile({item: this.fileInfo.element, priority: 0});

    this.cursorPosition = new CursorPositionView();
    this.statusBar.addLeftTile({item: this.cursorPosition.element, priority: 1});

    this.selectionCount = new SelectionCountView();
    this.statusBar.addLeftTile({item: this.selectionCount.element, priority: 2});

    this.gitInfo = new GitView();
    this.gitInfoTile = this.statusBar.addRightTile({item: this.gitInfo.element, priority: 0});
  },

  deactivate() {
    this.statusBarVisibilitySubscription?.dispose();
    this.statusBarVisibilitySubscription = null;

    this.gitInfo?.destroy();
    this.gitInfo = null;

    this.fileInfo?.destroy();
    this.fileInfo = null;

    this.cursorPosition?.destroy();
    this.cursorPosition = null;

    this.selectionCount?.destroy();
    this.selectionCount = null;

    this.statusBarPanel?.destroy();
    this.statusBarPanel = null;

    this.statusBar?.destroy();
    this.statusBar = null;

    this.subscriptions?.dispose();
    this.subscriptions = null;

    this.emitters?.dispose();
    this.emitters = null;

    if (atom.__workspaceView != null) { delete atom.__workspaceView.statusBar; }
  },

  updateStatusBarVisibility() {
    if (atom.config.get('status-bar.isVisible')) {
      this.statusBarPanel.show();
    } else {
      this.statusBarPanel.hide();
    }
  },

  provideStatusBar() {
    return {
      addLeftTile: this.statusBar.addLeftTile.bind(this.statusBar),
      addRightTile: this.statusBar.addRightTile.bind(this.statusBar),
      getLeftTiles: this.statusBar.getLeftTiles.bind(this.statusBar),
      getRightTiles: this.statusBar.getRightTiles.bind(this.statusBar),
      disableGitInfoTile: this.gitInfoTile.destroy.bind(this.gitInfoTile)
    };
  },

  attachStatusBar() {
    if (this.statusBarPanel != null) { this.statusBarPanel.destroy(); }

    const panelArgs = {item: this.statusBar, priority: 0};
    if (atom.config.get('status-bar.fullWidth')) {
      this.statusBarPanel = atom.workspace.addFooterPanel(panelArgs);
    } else {
      this.statusBarPanel = atom.workspace.addBottomPanel(panelArgs);
    }
  },

  // Deprecated
  //
  // Wrap deprecation calls on the methods returned rather than
  // Services API method which would be registered and trigger
  // a deprecation call
  legacyProvideStatusBar() {
    const statusbar = this.provideStatusBar();

    return {
      addLeftTile(...args) {
        Grim.deprecate("Use version ^1.0.0 of the status-bar Service API.");
        statusbar.addLeftTile(...args);
      },
      addRightTile(...args) {
        Grim.deprecate("Use version ^1.0.0 of the status-bar Service API.");
        statusbar.addRightTile(...args);
      },
      getLeftTiles() {
        Grim.deprecate("Use version ^1.0.0 of the status-bar Service API.");
        statusbar.getLeftTiles();
      },
      getRightTiles() {
        Grim.deprecate("Use version ^1.0.0 of the status-bar Service API.");
        statusbar.getRightTiles();
      }
    };
  }
};
