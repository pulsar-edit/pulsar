/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const _ = require('underscore-plus');
const fs = require('fs-plus');
const path = require('path');
const temp = require('temp').track();

describe("FileStats", function() {
  describe("provision of filesystem stats", function() {
    let [file1Data, file2Data, timeStarted, treeView] = ["ABCDEFGHIJKLMNOPQRSTUVWXYZ", "0123456789"];

    beforeEach(function() {
      jasmine.useRealClock();
      timeStarted = Date.now();
      const rootDirPath = fs.absolute(temp.mkdirSync("tree-view"));
      const subdirPath = path.join(rootDirPath, "subdir");
      const filePath1 = path.join(rootDirPath, "file1.txt");
      const filePath2 = path.join(subdirPath, "file2.txt");

      fs.makeTreeSync(subdirPath);
      fs.writeFileSync(filePath1, file1Data);
      fs.writeFileSync(filePath2, file2Data);
      atom.project.setPaths([rootDirPath]);

      waitsFor(function(done) {
        atom.workspace.onDidOpen(done);
        return atom.packages.activatePackage("tree-view");
      });

      return runs(() => treeView = atom.workspace.getLeftDock().getActivePaneItem());
    });

    it("passes stats to File instances", function() {
      const {
        stats
      } = treeView.roots[0].directory.entries.get("file1.txt");
      expect(stats).toBeDefined();
      expect(stats.mtime).toBeDefined();
      return expect(stats.size).toEqual(file1Data.length);
    });

    it("passes stats to Directory instances", function() {
      const {
        stats
      } = treeView.roots[0].directory.entries.get("subdir");
      expect(stats).toBeDefined();
      return expect(stats.mtime).toBeDefined();
    });

    it("passes stats to a root directory when initialised", () => expect(treeView.roots[0].directory.stats).toBeDefined());

    it("passes stats to File instances in subdirectories", function() {
      treeView.element.querySelector(".entries > li").expand();
      const subdir = treeView.roots[0].directory.entries.get("subdir");
      const {
        stats
      } = subdir.entries.get("file2.txt");
      expect(stats).toBeDefined();
      return expect(stats.size).toEqual(file2Data.length);
    });

    it("converts date-stats to timestamps", function() {
      const {
        stats
      } = treeView.roots[0].directory.entries.get("file1.txt");
      const stamp = stats.mtime;
      expect(_.isDate(stamp)).toBe(false);
      expect(typeof stamp).toBe("number");
      return expect(Number.isNaN(stamp)).toBe(false);
    });

    return it("accurately converts timestamps", function() {
      const {
        stats
      } = treeView.roots[0].directory.entries.get("file1.txt");
      // Two minutes should be enough
      return expect(Math.abs(stats.mtime - timeStarted)).toBeLessThan(120000);
    });
  });

  return describe("virtual filepaths", function() {
    beforeEach(function() {
      atom.project.setPaths([]);
      return waitsForPromise(() => Promise.all([
        atom.packages.activatePackage("tree-view"),
        atom.packages.activatePackage("about")
      ]));});

    return it("doesn't throw an exception when accessing virtual filepaths", () => atom.project.setPaths(["atom://about"]));
  });
});
