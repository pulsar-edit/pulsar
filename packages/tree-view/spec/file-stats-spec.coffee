_ = require 'underscore-plus'
fs = require 'fs-plus'
path = require 'path'
temp = require('temp').track()

describe "FileStats", ->
  describe "provision of filesystem stats", ->
    [file1Data, file2Data, timeStarted, treeView] = ["ABCDEFGHIJKLMNOPQRSTUVWXYZ", "0123456789"]

    beforeEach ->
      jasmine.useRealClock()
      timeStarted = Date.now()
      rootDirPath = fs.absolute(temp.mkdirSync("tree-view"))
      subdirPath = path.join(rootDirPath, "subdir")
      filePath1 = path.join(rootDirPath, "file1.txt")
      filePath2 = path.join(subdirPath, "file2.txt")

      fs.makeTreeSync(subdirPath)
      fs.writeFileSync(filePath1, file1Data)
      fs.writeFileSync(filePath2, file2Data)
      atom.project.setPaths([rootDirPath])

      waitsFor (done) ->
        atom.workspace.onDidOpen(done)
        atom.packages.activatePackage("tree-view")

      runs ->
        treeView = atom.workspace.getLeftDock().getActivePaneItem()

    it "passes stats to File instances", ->
      stats = treeView.roots[0].directory.entries.get("file1.txt").stats
      expect(stats).toBeDefined()
      expect(stats.mtime).toBeDefined()
      expect(stats.size).toEqual(file1Data.length)

    it "passes stats to Directory instances", ->
      stats = treeView.roots[0].directory.entries.get("subdir").stats
      expect(stats).toBeDefined()
      expect(stats.mtime).toBeDefined()

    it "passes stats to a root directory when initialised", ->
      expect(treeView.roots[0].directory.stats).toBeDefined()

    it "passes stats to File instances in subdirectories", ->
      treeView.element.querySelector(".entries > li").expand()
      subdir = treeView.roots[0].directory.entries.get("subdir")
      stats = subdir.entries.get("file2.txt").stats
      expect(stats).toBeDefined()
      expect(stats.size).toEqual(file2Data.length)

    it "converts date-stats to timestamps", ->
      stats = treeView.roots[0].directory.entries.get("file1.txt").stats
      stamp = stats.mtime
      expect(_.isDate stamp).toBe(false)
      expect(typeof stamp).toBe("number")
      expect(Number.isNaN stamp).toBe(false)

    it "accurately converts timestamps", ->
      stats = treeView.roots[0].directory.entries.get("file1.txt").stats
      # Two minutes should be enough
      expect(Math.abs stats.mtime - timeStarted).toBeLessThan(120000)

  describe "virtual filepaths", ->
    beforeEach ->
      atom.project.setPaths([])
      waitsForPromise -> Promise.all [
        atom.packages.activatePackage("tree-view")
        atom.packages.activatePackage("about")
      ]

    it "doesn't throw an exception when accessing virtual filepaths", ->
      atom.project.setPaths(["atom://about"])
