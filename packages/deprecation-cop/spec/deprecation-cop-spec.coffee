DeprecationCopView = require '../lib/deprecation-cop-view'

describe "DeprecationCop", ->
  [activationPromise, workspaceElement] = []

  beforeEach ->
    workspaceElement = core.views.getView(core.workspace)
    activationPromise = core.packages.activatePackage('deprecation-cop')
    expect(core.workspace.getActivePane().getActiveItem()).not.toExist()

  describe "when the deprecation-cop:view event is triggered", ->
    it "displays the deprecation cop pane", ->
      core.commands.dispatch workspaceElement, 'deprecation-cop:view'

      waitsForPromise ->
        activationPromise

      deprecationCopView = null
      waitsFor ->
        deprecationCopView = core.workspace.getActivePane().getActiveItem()

      runs ->
        expect(deprecationCopView instanceof DeprecationCopView).toBeTruthy()

  describe "deactivating the package", ->
    it "removes the deprecation cop pane item", ->
      core.commands.dispatch workspaceElement, 'deprecation-cop:view'

      waitsForPromise ->
        activationPromise

      waitsForPromise ->
        Promise.resolve(core.packages.deactivatePackage('deprecation-cop')) # Wrapped for Promise & non-Promise deactivate

      runs ->
        expect(core.workspace.getActivePane().getActiveItem()).not.toExist()
