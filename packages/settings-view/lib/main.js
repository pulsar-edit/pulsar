let SettingsView = null
let settingsView = null

let statusView = null

const PackageManager = require('./package-manager')
let packageManager = null

const SnippetsProvider = {
  getSnippets () { return atom.config.scopedSettingsStore.propertySets }
}

const CONFIG_URI = 'atom://config'

module.exports = {
  handleURI (parsed) {
    switch (parsed.pathname) {
      case '/show-package': this.showPackage(parsed.query.package)
    }
  },

  showPackage (packageName) {
    atom.workspace.open(`atom://config/packages/${packageName}`)
  },

  activate () {
    atom.workspace.addOpener(uri => {
      if (uri.startsWith(CONFIG_URI)) {
        if (settingsView == null || settingsView.destroyed) {
          settingsView = this.createSettingsView({uri})
        } else {
          const pane = atom.workspace.paneForItem(settingsView)
          if (pane) pane.activate()
        }

        settingsView.showPanelForURI(uri)
        return settingsView
      }
    })

    atom.commands.add('atom-workspace', {
      'settings-view:open' () { atom.workspace.open(CONFIG_URI) },
      'settings-view:core' () { atom.workspace.open(`${CONFIG_URI}/core`) },
      'settings-view:editor' () { atom.workspace.open(`${CONFIG_URI}/editor`) },
      'settings-view:show-keybindings' () { atom.workspace.open(`${CONFIG_URI}/keybindings`) },
      'settings-view:change-themes' () { atom.workspace.open(`${CONFIG_URI}/themes`) },
      'settings-view:install-packages-and-themes' () { atom.workspace.open(`${CONFIG_URI}/install`) },
      'settings-view:view-installed-themes' () { atom.workspace.open(`${CONFIG_URI}/themes`) },
      'settings-view:uninstall-themes' () { atom.workspace.open(`${CONFIG_URI}/themes`) },
      'settings-view:view-installed-packages' () { atom.workspace.open(`${CONFIG_URI}/packages`) },
      'settings-view:uninstall-packages' () { atom.workspace.open(`${CONFIG_URI}/packages`) },
      'settings-view:check-for-package-updates' () { atom.workspace.open(`${CONFIG_URI}/updates`) }
    })

    if (process.platform === 'win32' && require('atom').WinShell != null) {
      atom.commands.add('atom-workspace', {'settings-view:system' () { atom.workspace.open(`${CONFIG_URI}/system`) }})
    }
  },

  deactivate () {
    if (settingsView) settingsView.destroy()
    if (statusView) statusView.destroy()
    settingsView = null
    packageManager = null
    statusView = null
    atom.notifications.addWarning("Warning! You have disabled the settings-view package. To enable it again, edit the [`config.cson`](https://pulsar-edit.dev/docs/launch-manual/sections/using-pulsar/#global-configuration-settings) by removing the `settings-view` entry from `core: disabled packages:`");
  },

  consumeStatusBar (statusBar) {
    if (packageManager == null) packageManager = new PackageManager()
    packageManager.getOutdated().then(updates => {
      if (packageManager) {
        const PackageUpdatesStatusView = require('./package-updates-status-view')
        statusView = new PackageUpdatesStatusView()
        statusView.initialize(statusBar, packageManager, updates)
      }
    })

    // Attach a settings button to the status bar
    if (atom.config.get("settings-view.showSettingsIconInStatusBar")) {
      const SettingsIconStatusView = require('./settings-icon-status-view')
      statusViewIcon = new SettingsIconStatusView(statusBar)
      statusViewIcon.attach()
    }
  },

  consumeSnippets (snippets) {
    if (typeof snippets.getUnparsedSnippets === 'function') {
      SnippetsProvider.getSnippets = snippets.getUnparsedSnippets.bind(snippets)
    }
    if (typeof snippets.getUserSnippetsPath === 'function') {
      SnippetsProvider.getUserSnippetsPath = snippets.getUserSnippetsPath.bind(snippets)
    }
  },

  createSettingsView (params) {
    if (SettingsView == null) SettingsView = require('./settings-view')
    if (packageManager == null) packageManager = new PackageManager()
    params.packageManager = packageManager
    params.snippetsProvider = SnippetsProvider
    settingsView = new SettingsView(params)
    return settingsView
  }
}
