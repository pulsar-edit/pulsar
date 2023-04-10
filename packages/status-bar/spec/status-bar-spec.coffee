describe "Status Bar package", ->
  [editor, statusBar, statusBarService, workspaceElement, mainModule] = []

  beforeEach ->
    workspaceElement = atom.views.getView(atom.workspace)

    waitsForPromise ->
      atom.packages.activatePackage('status-bar').then (pack) ->
        statusBar = workspaceElement.querySelector("status-bar")
        statusBarService = pack.mainModule.provideStatusBar()
        {mainModule} = pack

  describe "@activate()", ->
    it "appends only one status bar", ->
      expect(workspaceElement.querySelectorAll('status-bar').length).toBe 1
      atom.workspace.getActivePane().splitRight(copyActiveItem: true)
      expect(workspaceElement.querySelectorAll('status-bar').length).toBe 1

  describe "@deactivate()", ->
    it "removes the status bar view", ->
      waitsForPromise ->
        Promise.resolve(atom.packages.deactivatePackage('status-bar')) # Wrapped so works with Promise & non-Promise deactivate
      runs ->
        expect(workspaceElement.querySelector('status-bar')).toBeNull()

  describe "isVisible option", ->
    beforeEach ->
      jasmine.attachToDOM(workspaceElement)

    describe "when it is true", ->
      beforeEach ->
        atom.config.set 'status-bar.isVisible', true

      it "shows status bar", ->
        expect(workspaceElement.querySelector('status-bar').parentNode).toBeVisible()

    describe "when it is false", ->
      beforeEach ->
        atom.config.set 'status-bar.isVisible', false

      it "hides status bar", ->
        expect(workspaceElement.querySelector('status-bar').parentNode).not.toBeVisible()

  describe "when status-bar:toggle is triggered", ->
    beforeEach ->
      jasmine.attachToDOM(workspaceElement)
      atom.config.set 'status-bar.isVisible', true

    it "hides or shows the status bar", ->
      atom.commands.dispatch(workspaceElement, 'status-bar:toggle')
      expect(workspaceElement.querySelector('status-bar').parentNode).not.toBeVisible()
      atom.commands.dispatch(workspaceElement, 'status-bar:toggle')
      expect(workspaceElement.querySelector('status-bar').parentNode).toBeVisible()

    it "toggles the value of isVisible in config file", ->
      expect(atom.config.get 'status-bar.isVisible').toBe true
      atom.commands.dispatch(workspaceElement, 'status-bar:toggle')
      expect(atom.config.get 'status-bar.isVisible').toBe false
      atom.commands.dispatch(workspaceElement, 'status-bar:toggle')
      expect(atom.config.get 'status-bar.isVisible').toBe true

  describe "full-width setting", ->
    [containers] = []

    beforeEach ->
      containers = atom.workspace.panelContainers
      jasmine.attachToDOM(workspaceElement)

      waitsForPromise ->
        atom.workspace.open('sample.js')

    it "expects the setting to be enabled by default", ->
      expect(atom.config.get('status-bar.fullWidth')).toBeTruthy()
      expect(containers.footer.panels).toContain(mainModule.statusBarPanel)

    describe "when setting is changed", ->
      it "fits status bar to editor's width", ->
        atom.config.set('status-bar.fullWidth', false)
        expect(containers.bottom.panels).toContain(mainModule.statusBarPanel)
        expect(containers.footer.panels).not.toContain(mainModule.statusBarPanel)

      it "restores the status-bar location when re-enabling setting", ->
        atom.config.set('status-bar.fullWidth', true)
        expect(containers.footer.panels).toContain(mainModule.statusBarPanel)
        expect(containers.bottom.panels).not.toContain(mainModule.statusBarPanel)

  describe "the 'status-bar' service", ->
    it "allows tiles to be added, removed, and retrieved", ->
      dummyView = document.createElement("div")
      tile = statusBarService.addLeftTile(item: dummyView)
      expect(statusBar).toContain(dummyView)
      expect(statusBarService.getLeftTiles()).toContain(tile)
      tile.destroy()
      expect(statusBar).not.toContain(dummyView)
      expect(statusBarService.getLeftTiles()).not.toContain(tile)

      dummyView = document.createElement("div")
      tile = statusBarService.addRightTile(item: dummyView)
      expect(statusBar).toContain(dummyView)
      expect(statusBarService.getRightTiles()).toContain(tile)
      tile.destroy()
      expect(statusBar).not.toContain(dummyView)
      expect(statusBarService.getRightTiles()).not.toContain(tile)

    it "allows the git info tile to be disabled", ->
      getGitInfoTile = ->
        statusBar.getRightTiles().find((tile) -> tile.item.matches('.git-view'))

      expect(getGitInfoTile()).not.toBeUndefined()
      statusBarService.disableGitInfoTile()
      expect(getGitInfoTile()).toBeUndefined()
