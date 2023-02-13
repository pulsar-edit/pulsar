InstallPanel = require '../lib/install-panel'
PackageManager = require '../lib/package-manager'
SettingsView = require '../lib/settings-view'

describe 'InstallPanel', ->
  beforeEach ->
    settingsView = new SettingsView()
    @packageManager = new PackageManager()
    @panel = new InstallPanel(settingsView, @packageManager)

  describe "when the packages button is clicked", ->
    beforeEach ->
      spyOn(@panel, 'search')
      @panel.refs.searchEditor.setText('something')

    it "performs a search for the contents of the input", ->
      @panel.refs.searchPackagesButton.click()
      expect(@panel.searchType).toBe 'packages'
      expect(@panel.search).toHaveBeenCalledWith 'something'
      expect(@panel.search.callCount).toBe 1

      @panel.refs.searchPackagesButton.click()
      expect(@panel.searchType).toBe 'packages'
      expect(@panel.search).toHaveBeenCalledWith 'something'
      expect(@panel.search.callCount).toBe 2

  describe "when the themes button is clicked", ->
    beforeEach ->
      spyOn(@panel, 'search')
      @panel.refs.searchEditor.setText('something')

    it "performs a search for the contents of the input", ->
      @panel.refs.searchThemesButton.click()
      expect(@panel.searchType).toBe 'themes'
      expect(@panel.search.callCount).toBe 1
      expect(@panel.search).toHaveBeenCalledWith 'something'

      @panel.refs.searchThemesButton.click()
      expect(@panel.searchType).toBe 'themes'
      expect(@panel.search.callCount).toBe 2

  describe "when the buttons are toggled", ->
    beforeEach ->
      spyOn(@panel, 'search')
      @panel.refs.searchEditor.setText('something')

    it "performs a search for the contents of the input", ->
      @panel.refs.searchThemesButton.click()
      expect(@panel.searchType).toBe 'themes'
      expect(@panel.search.callCount).toBe 1
      expect(@panel.search).toHaveBeenCalledWith 'something'

      @panel.refs.searchPackagesButton.click()
      expect(@panel.searchType).toBe 'packages'
      expect(@panel.search.callCount).toBe 2

      @panel.refs.searchThemesButton.click()
      expect(@panel.searchType).toBe 'themes'
      expect(@panel.search.callCount).toBe 3

  describe "searching packages", ->
    it "displays the packages in the order returned", ->
      spyOn(@panel.client, 'search').andCallFake -> Promise.resolve([{name: 'not-first'}, {name: 'first'}])
      spyOn(@panel, 'getPackageCardView').andCallThrough()

      waitsForPromise =>
        @panel.search('first')

      runs ->
        expect(@panel.getPackageCardView.argsForCall[0][0].name).toEqual 'not-first'
        expect(@panel.getPackageCardView.argsForCall[1][0].name).toEqual 'first'

  describe "searching git packages", ->
    beforeEach ->
      spyOn(@panel, 'showGitInstallPackageCard').andCallThrough()

    it "shows a git installation card with git specific info for ssh URLs", ->
      query = 'git@github.com:user/repo.git'
      @panel.performSearchForQuery(query)
      args = @panel.showGitInstallPackageCard.argsForCall[0][0]
      expect(args.name).toEqual query
      expect(args.gitUrlInfo).toBeTruthy()

    it "shows a git installation card with git specific info for https URLs", ->
      query = 'https://github.com/user/repo.git'
      @panel.performSearchForQuery(query)
      args = @panel.showGitInstallPackageCard.argsForCall[0][0]
      expect(args.name).toEqual query
      expect(args.gitUrlInfo).toBeTruthy()

    it "shows a git installation card with git specific info for shortcut URLs", ->
      query = 'user/repo'
      @panel.performSearchForQuery(query)
      args = @panel.showGitInstallPackageCard.argsForCall[0][0]
      expect(args.name).toEqual query
      expect(args.gitUrlInfo).toBeTruthy()

    it "doesn't show a git installation card for normal packages", ->
      query = 'this-package-is-so-normal'
      @panel.performSearchForQuery(query)
      expect(@panel.showGitInstallPackageCard).not.toHaveBeenCalled()

    describe "when a package with the same gitUrlInfo property is installed", ->
      beforeEach ->
        @gitUrlInfo = jasmine.createSpy('gitUrlInfo')
        @panel.showGitInstallPackageCard(gitUrlInfo: @gitUrlInfo)

      it "replaces the package card with the newly installed pack object", ->
        newPack =
          gitUrlInfo: @gitUrlInfo
        spyOn(@panel, 'updateGitPackageCard')
        @packageManager.emitter.emit('package-installed', {pack: newPack})
        expect(@panel.updateGitPackageCard).toHaveBeenCalledWith newPack
