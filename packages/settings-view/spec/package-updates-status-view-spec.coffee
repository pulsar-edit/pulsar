PackageManager = require '../lib/package-manager'
PackageUpdatesStatusView = require '../lib/package-updates-status-view'

describe "PackageUpdatesStatusView", ->
  [statusBar, statusView, packageManager] = []

  outdatedPackage1 =
    name: 'out-dated-1'
  outdatedPackage2 =
    name: 'out-dated-2'
  installedPackage =
    name: 'user-package'

  beforeEach ->
    spyOn(PackageManager.prototype, 'loadCompatiblePackageVersion').andCallFake ->
    spyOn(PackageManager.prototype, 'getInstalled').andCallFake -> Promise.resolve([installedPackage])
    spyOn(PackageManager.prototype, 'getOutdated').andCallFake -> Promise.resolve([outdatedPackage1, outdatedPackage2])
    spyOn(PackageUpdatesStatusView.prototype, 'initialize').andCallThrough()
    jasmine.attachToDOM(atom.views.getView(atom.workspace))

    waitsForPromise ->
      atom.packages.activatePackage('status-bar')

    waitsForPromise ->
      atom.packages.activatePackage('settings-view')

    runs ->
      atom.packages.emitter.emit('did-activate-all')
      expect(document.querySelector('status-bar .package-updates-status-view')).toExist()

      packageManager = PackageUpdatesStatusView.prototype.initialize.mostRecentCall.args[1]

  describe "when packages are outdated", ->
    it "adds a tile to the status bar", ->
      expect(document.querySelector('status-bar .package-updates-status-view').textContent).toBe '2 updates'

  describe "when the tile is clicked", ->
    it "opens the Available Updates panel", ->
      spyOn(atom.commands, 'dispatch').andCallFake ->

      document.querySelector('status-bar .package-updates-status-view').click()
      expect(atom.commands.dispatch).toHaveBeenCalledWith(atom.views.getView(atom.workspace), 'settings-view:check-for-package-updates')

    it "does not destroy the tile", ->
      document.querySelector('status-bar .package-updates-status-view').click()
      expect(document.querySelector('status-bar .package-updates-status-view')).toExist()

  describe "when a package is updating", ->
    it "updates the tile", ->
      packageManager.emitPackageEvent('updating', outdatedPackage1)
      expect(document.querySelector('status-bar .package-updates-status-view').textContent).toBe '1/2 updating'

  describe "when a package finishes updating", ->
    it "updates the tile", ->
      packageManager.emitPackageEvent('updating', outdatedPackage1)
      packageManager.emitPackageEvent('updated', outdatedPackage1)
      expect(document.querySelector('status-bar .package-updates-status-view').textContent).toBe '1 update'

  describe "when a package is updated without a prior updating event", ->
    it "updates the tile", ->
      packageManager.emitPackageEvent('updated', outdatedPackage1)
      expect(document.querySelector('status-bar .package-updates-status-view').textContent).toBe '1 update'

  describe "when multiple packages are updating and one finishes", ->
    it "updates the tile", ->
      packageManager.emitPackageEvent('updating', outdatedPackage1)
      packageManager.emitPackageEvent('updating', outdatedPackage2)
      packageManager.emitPackageEvent('updated', outdatedPackage1)
      expect(document.querySelector('status-bar .package-updates-status-view').textContent).toBe '1/1 updating'

  describe "when a package fails to update", ->
    it "updates the tile", ->
      packageManager.emitPackageEvent('updating', outdatedPackage1)
      packageManager.emitPackageEvent('update-failed', outdatedPackage1)
      expect(document.querySelector('status-bar .package-updates-status-view').textContent).toBe '2 updates (1 failed)'

  describe "when a package that previously failed to update starts updating again", ->
    it "updates the tile", ->
      packageManager.emitPackageEvent('updating', outdatedPackage1)
      packageManager.emitPackageEvent('update-failed', outdatedPackage1)
      packageManager.emitPackageEvent('updating', outdatedPackage1)
      expect(document.querySelector('status-bar .package-updates-status-view').textContent).toBe '1/2 updating'
      packageManager.emitPackageEvent('update-failed', outdatedPackage1)
      expect(document.querySelector('status-bar .package-updates-status-view').textContent).toBe '2 updates (1 failed)'

  describe "when a package update that previously failed succeeds on a subsequent try", ->
    it "updates the tile", ->
      packageManager.emitPackageEvent('update-failed', outdatedPackage1)
      packageManager.emitPackageEvent('updated', outdatedPackage1)
      expect(document.querySelector('status-bar .package-updates-status-view').textContent).toBe '1 update'

  describe "when multiple events are happening at the same time", ->
    it "updates the tile", ->
      packageManager.emitPackageEvent('update-available', installedPackage)
      packageManager.emitPackageEvent('updating', outdatedPackage1)
      packageManager.emitPackageEvent('update-failed', outdatedPackage2)
      expect(document.querySelector('status-bar .package-updates-status-view').textContent).toBe '1/3 updating (1 failed)'

  describe "when there are no more updates", ->
    it "destroys the tile", ->
      packageManager.emitPackageEvent('updated', outdatedPackage1)
      packageManager.emitPackageEvent('updated', outdatedPackage2)
      expect(document.querySelector('status-bar .package-updates-status-view')).not.toExist()

  describe "when a new update becomes available and the tile is destroyed", ->
    it "recreates the tile", ->
      packageManager.emitPackageEvent('updated', outdatedPackage1)
      packageManager.emitPackageEvent('updated', outdatedPackage2)
      packageManager.emitPackageEvent('update-available', installedPackage)
      expect(document.querySelector('status-bar .package-updates-status-view')).toExist()
      expect(document.querySelector('status-bar .package-updates-status-view').textContent).toBe '1 update'

  describe "when an update becomes available for a package", ->
    it "updates the tile", ->
      packageManager.emitPackageEvent('update-available', installedPackage)
      expect(document.querySelector('status-bar .package-updates-status-view').textContent).toBe '3 updates'

  describe "when updates are checked for multiple times and no new updates are available", ->
    it "does not keep updating the tile", ->
      packageManager.emitPackageEvent('update-available', outdatedPackage1)
      packageManager.emitPackageEvent('update-available', outdatedPackage1)
      packageManager.emitPackageEvent('update-available', outdatedPackage1)
      expect(document.querySelector('status-bar .package-updates-status-view').textContent).toBe '2 updates'

      # There are more fields in an actual package object,
      # so make sure only name is tested and not object equality
      packageManager.emitPackageEvent('update-available', {name: 'out-dated-1', date: Date.now()})
      expect(document.querySelector('status-bar .package-updates-status-view').textContent).toBe '2 updates'

  describe "when the same update fails multiple times", ->
    it "does not keep updating the tile", ->
      packageManager.emitPackageEvent('update-failed', outdatedPackage1)
      packageManager.emitPackageEvent('update-failed', outdatedPackage1)
      packageManager.emitPackageEvent('update-failed', outdatedPackage1)
      expect(document.querySelector('status-bar .package-updates-status-view').textContent).toBe '2 updates (1 failed)'

  describe "when a package that can be updated is uninstalled", ->
    it "updates the tile", ->
      packageManager.emitPackageEvent('uninstalled', outdatedPackage1)
      expect(document.querySelector('status-bar .package-updates-status-view').textContent).toBe '1 update'

  describe "when a package that is updating is uninstalled", ->
    it "updates the tile", ->
      packageManager.emitPackageEvent('updating', outdatedPackage1)
      packageManager.emitPackageEvent('uninstalled', outdatedPackage1)
      expect(document.querySelector('status-bar .package-updates-status-view').textContent).toBe '1 update'

  describe "when a package that failed to update is uninstalled", ->
    it "updates the tile", ->
      packageManager.emitPackageEvent('update-failed', outdatedPackage1)
      packageManager.emitPackageEvent('uninstalled', outdatedPackage1)
      expect(document.querySelector('status-bar .package-updates-status-view').textContent).toBe '1 update'
