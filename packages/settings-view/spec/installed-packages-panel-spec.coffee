path = require 'path'

fs = require 'fs-plus'
InstalledPackagesPanel = require '../lib/installed-packages-panel'
PackageManager = require '../lib/package-manager'
PackageCard = require '../lib/package-card'
SettingsView = require '../lib/settings-view'

describe 'InstalledPackagesPanel', ->
  describe 'when the packages are loading', ->
    it 'filters packages by name once they have loaded', ->
      settingsView = new SettingsView
      @packageManager = new PackageManager
      @installed = JSON.parse fs.readFileSync(path.join(__dirname, 'fixtures', 'installed.json'))
      spyOn(@packageManager, 'getOutdated').andReturn new Promise ->
      spyOn(@packageManager, 'loadCompatiblePackageVersion').andCallFake ->
      spyOn(@packageManager, 'getInstalled').andReturn Promise.resolve(@installed)
      @panel = new InstalledPackagesPanel(settingsView, @packageManager)
      @panel.refs.filterEditor.setText('user-')
      window.advanceClock(@panel.refs.filterEditor.getBuffer().stoppedChangingDelay)

      waitsFor ->
        @packageManager.getInstalled.callCount is 1 and @panel.refs.communityCount.textContent.indexOf('…') < 0

      runs ->
        expect(@panel.refs.communityCount.textContent.trim()).toBe '1/1'
        expect(@panel.refs.communityPackages.querySelectorAll('.package-card:not(.hidden)').length).toBe 1

        expect(@panel.refs.coreCount.textContent.trim()).toBe '0/1'
        expect(@panel.refs.corePackages.querySelectorAll('.package-card:not(.hidden)').length).toBe 0

        expect(@panel.refs.devCount.textContent.trim()).toBe '0/1'
        expect(@panel.refs.devPackages.querySelectorAll('.package-card:not(.hidden)').length).toBe 0

  describe 'when the packages have finished loading', ->
    beforeEach ->
      settingsView = new SettingsView
      @packageManager = new PackageManager
      @installed = JSON.parse fs.readFileSync(path.join(__dirname, 'fixtures', 'installed.json'))
      spyOn(@packageManager, 'getOutdated').andReturn new Promise ->
      spyOn(@packageManager, 'loadCompatiblePackageVersion').andCallFake ->
      spyOn(@packageManager, 'getInstalled').andReturn Promise.resolve(@installed)
      @panel = new InstalledPackagesPanel(settingsView, @packageManager)

      waitsFor ->
        @packageManager.getInstalled.callCount is 1 and @panel.refs.communityCount.textContent.indexOf('…') < 0

    it 'shows packages', ->
      expect(@panel.refs.communityCount.textContent.trim()).toBe '1'
      expect(@panel.refs.communityPackages.querySelectorAll('.package-card:not(.hidden)').length).toBe 1

      expect(@panel.refs.coreCount.textContent.trim()).toBe '1'
      expect(@panel.refs.corePackages.querySelectorAll('.package-card:not(.hidden)').length).toBe 1

      expect(@panel.refs.devCount.textContent.trim()).toBe '1'
      expect(@panel.refs.devPackages.querySelectorAll('.package-card:not(.hidden)').length).toBe 1

    it 'filters packages by name', ->
      @panel.refs.filterEditor.setText('user-')
      window.advanceClock(@panel.refs.filterEditor.getBuffer().stoppedChangingDelay)
      expect(@panel.refs.communityCount.textContent.trim()).toBe '1/1'
      expect(@panel.refs.communityPackages.querySelectorAll('.package-card:not(.hidden)').length).toBe 1

      expect(@panel.refs.coreCount.textContent.trim()).toBe '0/1'
      expect(@panel.refs.corePackages.querySelectorAll('.package-card:not(.hidden)').length).toBe 0

      expect(@panel.refs.devCount.textContent.trim()).toBe '0/1'
      expect(@panel.refs.devPackages.querySelectorAll('.package-card:not(.hidden)').length).toBe 0

    it 'adds newly installed packages to the list', ->
      [installCallback] = []
      spyOn(@packageManager, 'runCommand').andCallFake (args, callback) ->
        installCallback = callback
        onWillThrowError: ->
      spyOn(atom.packages, 'activatePackage').andCallFake (name) =>
        @installed.user.push {name}

      expect(@panel.refs.communityCount.textContent.trim()).toBe '1'
      expect(@panel.refs.communityPackages.querySelectorAll('.package-card:not(.hidden)').length).toBe 1

      @packageManager.install({name: 'another-user-package'})
      installCallback(0, '', '')

      advanceClock InstalledPackagesPanel.loadPackagesDelay()
      waits 1
      runs ->
        expect(@panel.refs.communityCount.textContent.trim()).toBe '2'
        expect(@panel.refs.communityPackages.querySelectorAll('.package-card:not(.hidden)').length).toBe 2

    it 'removes uninstalled packages from the list', ->
      [uninstallCallback] = []
      spyOn(@packageManager, 'runCommand').andCallFake (args, callback) ->
        uninstallCallback = callback
        onWillThrowError: ->
      spyOn(@packageManager, 'unload').andCallFake (name) =>
        @installed.user = []

      expect(@panel.refs.communityCount.textContent.trim()).toBe '1'
      expect(@panel.refs.communityPackages.querySelectorAll('.package-card:not(.hidden)').length).toBe 1

      @packageManager.uninstall({name: 'user-package'})
      uninstallCallback(0, '', '')

      advanceClock InstalledPackagesPanel.loadPackagesDelay()
      waits 1
      runs ->
        expect(@panel.refs.communityCount.textContent.trim()).toBe '0'
        expect(@panel.refs.communityPackages.querySelectorAll('.package-card:not(.hidden)').length).toBe 0

  describe 'expanding and collapsing sub-sections', ->
    beforeEach ->
      settingsView = new SettingsView
      @packageManager = new PackageManager
      @installed = JSON.parse fs.readFileSync(path.join(__dirname, 'fixtures', 'installed.json'))
      spyOn(@packageManager, 'getOutdated').andReturn new Promise ->
      spyOn(@packageManager, 'loadCompatiblePackageVersion').andCallFake ->
      spyOn(@packageManager, 'getInstalled').andReturn Promise.resolve(@installed)
      @panel = new InstalledPackagesPanel(settingsView, @packageManager)

      waitsFor ->
        @packageManager.getInstalled.callCount is 1 and @panel.refs.communityCount.textContent.indexOf('…') < 0

    it 'collapses and expands a sub-section if its header is clicked', ->
      @panel.element.querySelector('.sub-section.installed-packages .sub-section-heading').click()
      expect(@panel.element.querySelector('.sub-section.installed-packages')).toHaveClass 'collapsed'

      expect(@panel.element.querySelector('.sub-section.core-packages')).not.toHaveClass 'collapsed'
      expect(@panel.element.querySelector('.sub-section.dev-packages')).not.toHaveClass 'collapsed'

      @panel.element.querySelector('.sub-section.installed-packages .sub-section-heading').click()
      expect(@panel.element.querySelector('.sub-section.installed-packages')).not.toHaveClass 'collapsed'

    it 'can collapse and expand any of the sub-sections', ->
      expect(@panel.element.querySelectorAll('.sub-section-heading.has-items').length).toBe 3

      for element in @panel.element.querySelectorAll('.sub-section-heading.has-items')
        element.click()

      expect(@panel.element.querySelector('.sub-section.installed-packages')).toHaveClass 'collapsed'
      expect(@panel.element.querySelector('.sub-section.core-packages')).toHaveClass 'collapsed'
      expect(@panel.element.querySelector('.sub-section.dev-packages')).toHaveClass 'collapsed'

      for element in @panel.element.querySelectorAll('.sub-section-heading.has-items')
        element.click()

      expect(@panel.element.querySelector('.sub-section.installed-packages')).not.toHaveClass 'collapsed'
      expect(@panel.element.querySelector('.sub-section.core-packages')).not.toHaveClass 'collapsed'
      expect(@panel.element.querySelector('.sub-section.dev-packages')).not.toHaveClass 'collapsed'

    it 'can collapse sub-sections when filtering', ->
      @panel.refs.filterEditor.setText('user-')
      window.advanceClock(@panel.refs.filterEditor.getBuffer().stoppedChangingDelay)

      hasItems = @panel.element.querySelectorAll('.sub-section-heading.has-items')
      expect(hasItems.length).toBe 1
      expect(hasItems[0].textContent).toMatch /Community Packages/

  describe 'when there are no packages', ->
    beforeEach ->
      settingsView = new SettingsView
      @packageManager = new PackageManager
      @installed =
        dev: []
        user: []
        core: []
      spyOn(@packageManager, 'getOutdated').andReturn new Promise ->
      spyOn(@packageManager, 'loadCompatiblePackageVersion').andCallFake ->
      spyOn(@packageManager, 'getInstalled').andReturn Promise.resolve(@installed)
      @panel = new InstalledPackagesPanel(settingsView, @packageManager)

      waitsFor ->
        @packageManager.getInstalled.callCount is 1 and @panel.refs.communityCount.textContent.indexOf('…') < 0

    it 'has a count of zero in all headings', ->
      expect(@panel.element.querySelector('.section-heading-count').textContent).toMatch /^0+$/
      expect(@panel.element.querySelectorAll('.sub-section .icon-package').length).toBe 4
      expect(@panel.element.querySelectorAll('.sub-section .icon-package.has-items').length).toBe 0

    it 'can not collapse and expand any of the sub-sections', ->
      for element in @panel.element.querySelectorAll('.sub-section .icon-package')
        element.click()

      expect(@panel.element.querySelector('.sub-section.installed-packages')).not.toHaveClass 'collapsed'
      expect(@panel.element.querySelector('.sub-section.core-packages')).not.toHaveClass 'collapsed'
      expect(@panel.element.querySelector('.sub-section.dev-packages')).not.toHaveClass 'collapsed'

    it 'does not allow collapsing on any section when filtering', ->
      @panel.refs.filterEditor.setText('user-')
      window.advanceClock(@panel.refs.filterEditor.getBuffer().stoppedChangingDelay)

      expect(@panel.element.querySelector('.section-heading-count').textContent).toMatch /^(0\/0)+$/
      expect(@panel.element.querySelectorAll('.sub-section .icon-package').length).toBe 4
      expect(@panel.element.querySelectorAll('.sub-section .icon-paintcan.has-items').length).toBe 0
