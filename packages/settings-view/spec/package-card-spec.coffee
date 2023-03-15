path = require 'path'
PackageCard = require '../lib/package-card'
PackageManager = require '../lib/package-manager'
SettingsView = require '../lib/settings-view'

describe "PackageCard", ->
  setPackageStatusSpies = (opts) ->
    spyOn(PackageCard.prototype, 'isInstalled').andReturn(opts.installed)
    spyOn(PackageCard.prototype, 'isDisabled').andReturn(opts.disabled)
    spyOn(PackageCard.prototype, 'hasSettings').andReturn(opts.hasSettings)

  [card, packageManager] = []

  beforeEach ->
    packageManager = new PackageManager()
    spyOn(packageManager, 'runCommand')

  it "doesn't show the disable control for a theme", ->
    setPackageStatusSpies {installed: true, disabled: false}
    card = new PackageCard({theme: 'syntax', name: 'test-theme'}, new SettingsView(), packageManager)
    jasmine.attachToDOM(card.element)
    expect(card.refs.enablementButton).not.toBeVisible()

  it "doesn't show the status indicator for a theme", ->
    setPackageStatusSpies {installed: true, disabled: false}
    card = new PackageCard {theme: 'syntax', name: 'test-theme'}, new SettingsView(), packageManager
    jasmine.attachToDOM(card.element)
    expect(card.refs.statusIndicatorButton).not.toBeVisible()

  it "doesn't show the settings button for a theme", ->
    setPackageStatusSpies {installed: true, disabled: false}
    card = new PackageCard {theme: 'syntax', name: 'test-theme'}, new SettingsView(), packageManager
    jasmine.attachToDOM(card.element)
    expect(card.refs.settingsButton).not.toBeVisible()

  it "doesn't show the settings button on the settings view", ->
    setPackageStatusSpies {installed: true, disabled: false, hasSettings: true}
    card = new PackageCard {name: 'test-package'}, new SettingsView(), packageManager, {onSettingsView: true}
    jasmine.attachToDOM(card.element)
    expect(card.refs.settingsButton).not.toBeVisible()

  it "removes the settings button if a package has no settings", ->
    setPackageStatusSpies {installed: true, disabled: false, hasSettings: false}
    card = new PackageCard {name: 'test-package'}, new SettingsView(), packageManager
    jasmine.attachToDOM(card.element)
    expect(card.refs.settingsButton).not.toBeVisible()

  it "removes the uninstall button if a package has is a bundled package", ->
    setPackageStatusSpies {installed: true, disabled: false, hasSettings: true}
    card = new PackageCard {name: 'find-and-replace'}, new SettingsView(), packageManager
    jasmine.attachToDOM(card.element)
    expect(card.refs.uninstallButton).not.toBeVisible()

  it "displays the new version in the update button", ->
    setPackageStatusSpies {installed: true, disabled: false, hasSettings: true}
    card = new PackageCard {name: 'find-and-replace', version: '1.0.0', latestVersion: '1.2.0'}, new SettingsView(), packageManager
    jasmine.attachToDOM(card.element)
    expect(card.refs.updateButton).toBeVisible()
    expect(card.refs.updateButton.textContent).toContain 'Update to 1.2.0'

  it "displays the new version in the update button when the package is disabled", ->
    setPackageStatusSpies {installed: true, disabled: true, hasSettings: true}
    card = new PackageCard {name: 'find-and-replace', version: '1.0.0', latestVersion: '1.2.0'}, new SettingsView(), packageManager
    jasmine.attachToDOM(card.element)
    expect(card.refs.updateButton).toBeVisible()
    expect(card.refs.updateButton.textContent).toContain 'Update to 1.2.0'

  it "shows the author details", ->
    authorName = "authorName"
    pack =
      name: 'some-package'
      version: '0.1.0'
      repository: "https://github.com/#{authorName}/some-package"
    card = new PackageCard(pack, new SettingsView(), packageManager)

    jasmine.attachToDOM(card.element)

    expect(card.refs.loginLink.textContent).toBe(authorName)

  describe "when the package is not installed", ->
    it "shows the settings, uninstall, and disable buttons", ->
      pack =
        name: 'some-package'
        version: '0.1.0'
        repository: 'http://github.com/omgwow/some-package'
      card = new PackageCard(pack, new SettingsView(), packageManager)

      jasmine.attachToDOM(card.element)

      expect(card.refs.installButtonGroup).toBeVisible()
      expect(card.refs.updateButtonGroup).not.toBeVisible()
      expect(card.refs.packageActionButtonGroup).not.toBeVisible()

    it "can be installed if currently not installed", ->
      setPackageStatusSpies {installed: false, disabled: false}
      spyOn(packageManager, 'install')

      card = new PackageCard {name: 'test-package'}, new SettingsView(), packageManager
      expect(card.refs.installButton.style.display).not.toBe('none')
      expect(card.refs.uninstallButton.style.display).toBe('none')
      card.refs.installButton.click()
      expect(packageManager.install).toHaveBeenCalled()

    it "can be installed if currently not installed and package latest release engine match atom version", ->
      spyOn(packageManager, 'install')
      spyOn(packageManager, 'loadCompatiblePackageVersion').andCallFake (packageName, callback) ->
        pack =
          name: packageName
          version: '0.1.0'
          engines:
            atom: '>0.50.0'

        callback(null, pack)

      setPackageStatusSpies {installed: false, disabled: false}

      card = new PackageCard {
        name: 'test-package'
        version: '0.1.0'
        engines:
          atom: '>0.50.0'
      }, new SettingsView(), packageManager

      # In that case there's no need to make a request to get all the versions
      expect(packageManager.loadCompatiblePackageVersion).not.toHaveBeenCalled()

      expect(card.refs.installButton.style.display).not.toBe('none')
      expect(card.refs.uninstallButton.style.display).toBe('none')
      card.refs.installButton.click()
      expect(packageManager.install).toHaveBeenCalled()
      expect(packageManager.install.mostRecentCall.args[0]).toEqual({
        name: 'test-package'
        version: '0.1.0'
        engines:
          atom: '>0.50.0'
      })

    it "can be installed with a previous version whose engine match the current atom version", ->
      spyOn(packageManager, 'install')
      spyOn(packageManager, 'loadCompatiblePackageVersion').andCallFake (packageName, callback) ->
        pack =
          name: packageName
          version: '0.0.1'
          engines:
            atom: '>0.50.0'

        callback(null, pack)

      setPackageStatusSpies {installed: false, disabled: false}

      card = new PackageCard {
        name: 'test-package'
        version: '0.1.0'
        engines:
          atom: '>99.0.0'
      }, new SettingsView(), packageManager

      expect(card.refs.installButton.style.display).not.toBe('none')
      expect(card.refs.uninstallButton.style.display).toBe('none')
      expect(card.refs.versionValue.textContent).toBe('0.0.1')
      expect(card.refs.versionValue).toHaveClass('text-warning')
      expect(card.refs.packageMessage).toHaveClass('text-warning')
      card.refs.installButton.click()
      expect(packageManager.install).toHaveBeenCalled()
      expect(packageManager.install.mostRecentCall.args[0]).toEqual({
        name: 'test-package'
        version: '0.0.1'
        engines:
          atom: '>0.50.0'
      })

    it "can't be installed if there is no version compatible with the current atom version", ->
      spyOn(packageManager, 'loadCompatiblePackageVersion').andCallFake (packageName, callback) ->
        pack =
          name: packageName

        callback(null, pack)

      setPackageStatusSpies {installed: false, disabled: false}

      pack =
        name: 'test-package'
        engines:
          atom: '>=99.0.0'
      card = new PackageCard(pack , new SettingsView(), packageManager)
      jasmine.attachToDOM(card.element)

      expect(card.refs.installButtonGroup).not.toBeVisible()
      expect(card.refs.packageActionButtonGroup).not.toBeVisible()
      expect(card.refs.versionValue).toHaveClass('text-error')
      expect(card.refs.packageMessage).toHaveClass('text-error')

  describe "when the package is installed", ->
    beforeEach ->
      atom.packages.loadPackage(path.join(__dirname, 'fixtures', 'package-with-config'))
      waitsFor ->
        atom.packages.isPackageLoaded('package-with-config') is true

    it "can be disabled if installed", ->
      setPackageStatusSpies {installed: true, disabled: false}
      spyOn(atom.packages, 'disablePackage').andReturn(true)

      card = new PackageCard {name: 'test-package'}, new SettingsView(), packageManager
      expect(card.refs.enablementButton.querySelector('.disable-text').textContent).toBe('Disable')
      card.refs.enablementButton.click()
      expect(atom.packages.disablePackage).toHaveBeenCalled()

    it "can be updated", ->
      pack = atom.packages.getLoadedPackage('package-with-config')
      pack.latestVersion = '1.1.0'
      packageUpdated = false

      packageManager.on 'package-updated', -> packageUpdated = true
      packageManager.runCommand.andCallFake (args, callback) ->
        callback(0, '', '')
        onWillThrowError: ->

      originalLoadPackage = atom.packages.loadPackage
      spyOn(atom.packages, 'loadPackage').andCallFake ->
        originalLoadPackage.call(atom.packages, path.join(__dirname, 'fixtures', 'package-with-config'))

      card = new PackageCard(pack, new SettingsView(), packageManager)
      jasmine.attachToDOM(card.element)
      expect(card.refs.updateButton).toBeVisible()

      card.update()

      waitsFor ->
        packageUpdated

      runs ->
        expect(card.refs.updateButton).not.toBeVisible()

    it 'keeps the update button visible if the update failed', ->
      pack = atom.packages.getLoadedPackage('package-with-config')
      pack.latestVersion = '1.1.0'
      updateFailed = false

      packageManager.on 'package-update-failed', -> updateFailed = true
      packageManager.runCommand.andCallFake (args, callback) ->
        callback(1, '', '')
        onWillThrowError: ->

      originalLoadPackage = atom.packages.loadPackage
      spyOn(atom.packages, 'loadPackage').andCallFake ->
        originalLoadPackage.call(atom.packages, path.join(__dirname, 'fixtures', 'package-with-config'))

      card = new PackageCard(pack, new SettingsView(), packageManager)
      jasmine.attachToDOM(card.element)
      expect(card.refs.updateButton).toBeVisible()

      card.update()

      waitsFor ->
        updateFailed

      runs ->
        expect(card.refs.updateButton).toBeVisible()

    it 'does not error when attempting to update without any update available', ->
      # While this cannot be done through the package card UI,
      # updates can still be triggered through the Updates panel's Update All button
      # https://github.com/atom/settings-view/issues/879

      pack = atom.packages.getLoadedPackage('package-with-config')

      originalLoadPackage = atom.packages.loadPackage
      spyOn(atom.packages, 'loadPackage').andCallFake ->
        originalLoadPackage.call(atom.packages, path.join(__dirname, 'fixtures', 'package-with-config'))

      card = new PackageCard(pack, new SettingsView(), packageManager)
      jasmine.attachToDOM(card.element)
      expect(card.refs.updateButton).not.toBeVisible()

      waitsForPromise -> card.update()

      runs ->
        expect(card.refs.updateButton).not.toBeVisible()

    it "will stay disabled after an update", ->
      pack = atom.packages.getLoadedPackage('package-with-config')
      pack.latestVersion = '1.1.0'
      packageUpdated = false

      packageManager.on 'package-updated', -> packageUpdated = true
      packageManager.runCommand.andCallFake (args, callback) ->
        callback(0, '', '')
        onWillThrowError: ->

      originalLoadPackage = atom.packages.loadPackage
      spyOn(atom.packages, 'loadPackage').andCallFake ->
        originalLoadPackage.call(atom.packages, path.join(__dirname, 'fixtures', 'package-with-config'))

      pack.disable()
      card = new PackageCard(pack, new SettingsView(), packageManager)
      expect(atom.packages.isPackageDisabled('package-with-config')).toBe true
      card.update()

      waitsFor ->
        packageUpdated

      runs ->
        expect(atom.packages.isPackageDisabled('package-with-config')).toBe true

    it "is uninstalled when the uninstallButton is clicked", ->
      setPackageStatusSpies {installed: true, disabled: false}

      [uninstallCallback] = []
      packageManager.runCommand.andCallFake (args, callback) ->
        if args[0] is 'uninstall'
          uninstallCallback = callback
        onWillThrowError: ->

      spyOn(packageManager, 'install').andCallThrough()
      spyOn(packageManager, 'uninstall').andCallThrough()

      pack = atom.packages.getLoadedPackage('package-with-config')
      card = new PackageCard(pack, new SettingsView(), packageManager)
      jasmine.attachToDOM(card.element)

      expect(card.refs.uninstallButton).toBeVisible()
      expect(card.refs.enablementButton).toBeVisible()
      card.refs.uninstallButton.click()

      expect(card.refs.uninstallButton.disabled).toBe true
      expect(card.refs.enablementButton.disabled).toBe true
      expect(card.refs.uninstallButton).toHaveClass('is-uninstalling')

      expect(packageManager.uninstall).toHaveBeenCalled()
      expect(packageManager.uninstall.mostRecentCall.args[0].name).toEqual('package-with-config')

      jasmine.unspy(PackageCard::, 'isInstalled')
      spyOn(PackageCard.prototype, 'isInstalled').andReturn false
      uninstallCallback(0, '', '')

      waits 1
      runs ->
        expect(card.refs.uninstallButton.disabled).toBe false
        expect(card.refs.uninstallButton).not.toHaveClass('is-uninstalling')
        expect(card.refs.installButtonGroup).toBeVisible()
        expect(card.refs.updateButtonGroup).not.toBeVisible()
        expect(card.refs.packageActionButtonGroup).not.toBeVisible()

    it "shows the settings, uninstall, and enable buttons when disabled", ->
      atom.config.set('package-with-config.setting', 'something')
      pack = atom.packages.getLoadedPackage('package-with-config')
      spyOn(atom.packages, 'isPackageDisabled').andReturn(true)
      card = new PackageCard(pack, new SettingsView(), packageManager)
      jasmine.attachToDOM(card.element)

      expect(card.refs.updateButtonGroup).not.toBeVisible()
      expect(card.refs.installButtonGroup).not.toBeVisible()

      expect(card.refs.settingsButton).toBeVisible()
      expect(card.refs.uninstallButton).toBeVisible()
      expect(card.refs.enablementButton).toBeVisible()
      expect(card.refs.enablementButton.textContent).toBe 'Enable'

    it "shows the settings, uninstall, and disable buttons", ->
      atom.config.set('package-with-config.setting', 'something')
      pack = atom.packages.getLoadedPackage('package-with-config')
      card = new PackageCard(pack, new SettingsView(), packageManager)

      jasmine.attachToDOM(card.element)

      expect(card.refs.updateButtonGroup).not.toBeVisible()
      expect(card.refs.installButtonGroup).not.toBeVisible()

      expect(card.refs.settingsButton).toBeVisible()
      expect(card.refs.uninstallButton).toBeVisible()
      expect(card.refs.enablementButton).toBeVisible()
      expect(card.refs.enablementButton.textContent).toBe 'Disable'

    it "does not show the settings button when there are no settings", ->
      pack = atom.packages.getLoadedPackage('package-with-config')
      spyOn(PackageCard::, 'hasSettings').andReturn(false)
      card = new PackageCard(pack, new SettingsView(), packageManager)

      jasmine.attachToDOM(card.element)

      expect(card.refs.settingsButton).not.toBeVisible()
      expect(card.refs.uninstallButton).toBeVisible()
      expect(card.refs.enablementButton).toBeVisible()
      expect(card.refs.enablementButton.textContent).toBe 'Disable'
