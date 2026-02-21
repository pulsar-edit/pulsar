/** @babel */

const { Disposable } = require('atom');
const { waitForCondition } = require('./helpers');
const path = require("path");
const ResultsModel = require("../lib/project/results-model");
const FindOptions = require("../lib/find-options");

describe("ResultsModel", () => {
  let editor, resultsModel;

  beforeEach(async () => {
    atom.config.set("core.excludeVcsIgnoredPaths", false);
    atom.config.set("find-and-replace.searchContextLineCountBefore", 2);
    atom.config.set("find-and-replace.searchContextLineCountAfter", 3);
    atom.project.setPaths([path.join(__dirname, "fixtures/project")]);

    editor = await atom.workspace.open("sample.js");
    resultsModel = new ResultsModel(new FindOptions());
  });

  describe("searching for a pattern", () => {
    it("populates the model with all the results, and updates in response to changes in the buffer", async () => {
      const resultAddedSpy = jasmine.createSpy();
      const resultSetSpy = jasmine.createSpy();
      const resultRemovedSpy = jasmine.createSpy();

      resultsModel.onDidAddResult(resultAddedSpy);
      resultsModel.onDidSetResult(resultSetSpy);
      resultsModel.onDidRemoveResult(resultRemovedSpy);
      await resultsModel.search("items", "*.js", "");

      expect(resultAddedSpy).toHaveBeenCalled();
      expect(resultAddedSpy.callCount).toBe(1);

      let result = resultsModel.getResult(editor.getPath());
      expect(result.matches.length).toBe(6);
      expect(resultsModel.getPathCount()).toBe(1);
      expect(resultsModel.getMatchCount()).toBe(6);
      expect(resultsModel.getPaths()).toEqual([editor.getPath()]);
      expect(result.matches[0].leadingContextLines.length).toBe(1);
      expect(result.matches[0].leadingContextLines[0]).toBe("var quicksort = function () {");
      expect(result.matches[0].trailingContextLines.length).toBe(3);
      expect(result.matches[0].trailingContextLines[0]).toBe("    if (items.length <= 1) return items;");
      expect(result.matches[0].trailingContextLines[1]).toBe("    var pivot = items.shift(), current, left = [], right = [];");
      expect(result.matches[0].trailingContextLines[2]).toBe("    while(items.length > 0) {");
      expect(result.matches[5].leadingContextLines.length).toBe(2);
      expect(result.matches[5].trailingContextLines.length).toBe(3);

      editor.setText("there are some items in here");
      advanceClock(editor.buffer.stoppedChangingDelay);
      expect(resultAddedSpy.callCount).toBe(1);
      expect(resultSetSpy.callCount).toBe(1);

      result = resultsModel.getResult(editor.getPath());
      expect(result.matches.length).toBe(1);
      expect(resultsModel.getPathCount()).toBe(1);
      expect(resultsModel.getMatchCount()).toBe(1);
      expect(resultsModel.getPaths()).toEqual([editor.getPath()]);
      expect(result.matches[0].lineText).toBe("there are some items in here");
      expect(result.matches[0].leadingContextLines.length).toBe(0);
      expect(result.matches[0].trailingContextLines.length).toBe(0);

      editor.setText("no matches in here");
      advanceClock(editor.buffer.stoppedChangingDelay);
      expect(resultAddedSpy.callCount).toBe(1);
      expect(resultSetSpy.callCount).toBe(1);
      expect(resultRemovedSpy.callCount).toBe(1);

      result = resultsModel.getResult(editor.getPath());
      expect(result).not.toBeDefined();
      expect(resultsModel.getPathCount()).toBe(0);
      expect(resultsModel.getMatchCount()).toBe(0);

      resultsModel.clear();
      spyOn(editor, "scan").andCallThrough();
      editor.setText("no matches in here");
      advanceClock(editor.buffer.stoppedChangingDelay);
      expect(editor.scan).not.toHaveBeenCalled();
      expect(resultsModel.getPathCount()).toBe(0);
      expect(resultsModel.getMatchCount()).toBe(0);
    });

    it("ignores changes in untitled buffers", async () => {
      await atom.workspace.open();
      await resultsModel.search("items", "*.js", "");

      editor = atom.workspace.getCenter().getActiveTextEditor();
      editor.setText("items\nitems");
      spyOn(editor, "scan").andCallThrough();
      advanceClock(editor.buffer.stoppedChangingDelay);
      expect(editor.scan).not.toHaveBeenCalled();
    });

    it("contains valid match objects after destroying a buffer (regression)", async () => {
      await resultsModel.search('items', '*.js', '');

      advanceClock(editor.buffer.stoppedChangingDelay)
      editor.getBuffer().destroy()
      const result = resultsModel.getResult(editor.getPath())
      expect(result.matches[0].lineText).toBe("  var sort = function(items) {")
    });

    describe("when the project has a single root", () => {
      beforeEach(() => {
        atom.project.setPaths([
          path.join(__dirname, "fixtures/another-project-root")
        ])
        resultsModel = new ResultsModel(
          new FindOptions({ pathsPattern: 'sub/sample.js' })
        )

        atom.config.set('find-and-replace.useRipgrep', false)
        atom.config.set('find-and-replace.enablePCRE2', false)
      });

      it("should correctly show results when the path pattern is empty", async () => {
        await resultsModel.search('quicksort =', '', '')
        let result = resultsModel.getResult(
          path.resolve(__dirname, 'fixtures', 'another-project-root', 'sub', 'sample.js')
        );
        expect(result).not.toBeUndefined();
      });

      it("should correctly show results when the path pattern points to a file", async () => {
        await resultsModel.search('quicksort =', 'sub/sample.js', '')
        let result = resultsModel.getResult(
          path.resolve(__dirname, 'fixtures', 'another-project-root', 'sub', 'sample.js')
        );
        expect(result).not.toBeUndefined();
      });

      it("should correctly show results when the path pattern points to a file (with wildcard)", async () => {
        await resultsModel.search('quicksort =', '**/sample.js', '')
        let result = resultsModel.getResult(
          path.resolve(__dirname, 'fixtures', 'another-project-root', 'sub', 'sample.js')
        );
        expect(result).not.toBeUndefined();
      });

      it("should correctly show results when the path pattern points to an exclusion", async () => {
        await resultsModel.search('quicksort =', '!**/sample.js', '')
        let result = resultsModel.getResult(
          path.resolve(__dirname, 'fixtures', 'another-project-root', 'sub', 'sample.js')
        );
        expect(result).toBeUndefined();
      });

      it("should correctly show results when the path pattern includes multiple clauses", async () => {
        await resultsModel.search('quicksort =', 'sample.js, sub/sample.js', '')
        let result = resultsModel.getResult(
          path.resolve(__dirname, 'fixtures', 'another-project-root', 'sub', 'sample.js')
        );
        expect(result).not.toBeUndefined();
      });

    })

    describe("when a file is modified after the search finishes", () => {
      let editor, modifiedPath;
      let modifyEditor = () => {};
      beforeEach(async () => {
        atom.project.setPaths([
          path.join(__dirname, "fixtures/project"),
        ])
        resultsModel = new ResultsModel(new FindOptions({}));
        modifiedPath = path.resolve(__dirname, "fixtures", "project", "sample.js");
        editor = await atom.workspace.open(modifiedPath);
        modifyEditor = () => {
          editor.setCursorBufferPosition([0, 0]);
          editor.insertText(' ');
          expect(editor.isModified()).toBe(true);
          return new Disposable(() => editor.undo());
        };
      })

      afterEach(async () => editor.destroy());

      it('is added to the results once it matches (with no path pattern)', async () => {
        jasmine.useRealClock();
        await resultsModel.search(' var quicksort =', '', '');
        expect(
          resultsModel.getResult(modifiedPath)
        ).toBe(undefined);
        modifyEditor();
        await new Promise(r => setTimeout(r, 1000));
        expect(
          resultsModel.getResult(modifiedPath)
        ).not.toBe(undefined);
      });

      it('is added to the results once it matches (if path pattern matches)', async () => {
        jasmine.useRealClock();
        await resultsModel.search(' var quicksort =', '**/sample.js', '');
        expect(
          resultsModel.getResult(modifiedPath)
        ).toBe(undefined);
        modifyEditor();
        await waitForCondition(() => {
          return !!resultsModel.getResult(modifiedPath);
        });
        expect(
          resultsModel.getResult(modifiedPath)
        ).not.toBe(undefined);
      });

      it('is not added to the results once it matches (if path pattern excludes it)', async () => {
        jasmine.useRealClock();
        await resultsModel.search(' var quicksort =', '**/foo.js', '');
        expect(
          resultsModel.getResult(modifiedPath)
        ).toBe(undefined);
        modifyEditor();
        await new Promise(r => setTimeout(r, 1000));
        expect(
          resultsModel.getResult(modifiedPath)
        ).toBe(undefined);
      });

      it('is excluded from the results if appropriate, even if there are matches', async () => {
        await resultsModel.search('quicksort =', '**/foo.js', '');
        expect(
          resultsModel.getResult(modifiedPath)
        ).toBe(undefined);
      });

      it('does not include a dirty buffer that would not have been included if it were clean', async () => {
        // In this case, `project/sample.js` should be implicitly excluded
        // because the user opted into a different root and no patterns apply
        // to the `project` root.
        await resultsModel.search('quicksort =', '**/foo.js', '');
        expect(
          resultsModel.getResult(modifiedPath)
        ).toBe(undefined);
      })

      it('has its path inclusions and exclusions assessed properly', async () => {
        await resultsModel.search('quicksort =', '**/sample.js, another-project-root/foo.js, project/sample.js', '');
        expect(
          resultsModel.getResult(modifiedPath)
        ).not.toBe(undefined);
      })
    });

    describe("when the project has multiple roots", () => {
      beforeEach(() => {
        atom.project.setPaths([
          path.join(__dirname, "fixtures/project"),
          path.join(__dirname, "fixtures/another-project-root")
        ])
        resultsModel = new ResultsModel(
          new FindOptions({ pathsPattern: 'another-project-root/sub/sample.js' })
        )
      });

      it("should correctly show results when the path pattern is empty", async () => {
        await resultsModel.search('quicksort =', '', '')
        // We expect three results from three different files that span two
        // different project roots.
        expect(resultsModel.getResultsSummary()?.matchCount).toBe(3);
        expect(resultsModel.getPaths()?.length).toBe(3);
      })

      it("should correctly show results when the path pattern points to a file (with wildcard)", async () => {
        await resultsModel.search('quicksort =', '**/sample.js', '')
        // We expect three results from three different files that span two
        // different project roots.
        expect(resultsModel.getResultsSummary()?.matchCount).toBe(3);
        expect(resultsModel.getPaths()?.length).toBe(3);
      })

      it("should correctly filter results that do not match the path pattern", async () => {
        await resultsModel.search('quicksort =', 'another-project-root/sub/sample.js', '')
        let result = resultsModel.getResult(
          path.resolve(__dirname, 'fixtures', 'another-project-root', 'sub', 'sample.js')
        );
        expect(result).not.toBeUndefined();
      })

      it("should correctly convert path patterns to exclusions when appropriate", async () => {
        await resultsModel.search('quicksort =', '!another-project-root/sub/sample.js', '')
        let result = resultsModel.getResult(
          path.resolve(__dirname, 'fixtures', 'another-project-root', 'sub', 'sample.js')
        );
        expect(result).toBeUndefined();
      });

      it("should allow a path pattern to exclude a project root solely by its base name", async () => {
        await resultsModel.search('quicksort =', '!another-project-root', '')
        let result = resultsModel.getResult(
          path.resolve(__dirname, 'fixtures', 'another-project-root', 'sub', 'sample.js')
        );
        expect(result).toBeUndefined();
      });

      it("should allow us to specify multiple path inclusions that point to different roots", async () => {
        await resultsModel.search('quicksort =', 'another-project-root/sub/sample.js, project/sub/sample.js', '')
        expect(resultsModel.getResultsSummary())
        let result = resultsModel.getResult(
          path.resolve(__dirname, 'fixtures', 'another-project-root', 'sub', 'sample.js')
        );
        expect(result).not.toBeUndefined();
      });

      describe("and a file is already modified when search begins", () => {
        let editor, modifiedPath;
        beforeEach(async () => {
          modifiedPath = path.resolve(__dirname, "fixtures", "project", "sample.js");
          editor = await atom.workspace.open(modifiedPath);
          editor.setCursorBufferPosition([0, 0]);
          editor.insertText(' ');
          expect(editor.isModified()).toBe(true);
        });

        it('is added to the results if not excluded', async () => {
          await resultsModel.search('quicksort =', '**/sample.js', '');
          expect(
            resultsModel.getResult(modifiedPath)
          ).not.toBe(undefined);
        });

        it('is excluded from the results if path patterns require it, even if there are matches', async () => {
          await resultsModel.search('quicksort =', '**/foo.js', '');
          expect(
            resultsModel.getResult(modifiedPath)
          ).toBe(undefined);
        });

        it('does not include a dirty buffer that would not have been included if it were clean', async () => {
          // In this case, `project/sample.js` should be implicitly excluded
          // because the user opted into a different root and no patterns apply
          // to the `project` root.
          await resultsModel.search('quicksort =', 'another-project-root/foo.js', '');
          expect(
            resultsModel.getResult(modifiedPath)
          ).toBe(undefined);
        });

        it('has its path inclusions and exclusions assessed properly', async () => {
          // The exclusion of `sample.js` in one root should not prevent the
          // inclusion `sample.js` in the other root.
          await resultsModel.search('quicksort =', '**/sample.js, !another-project-root/sample.js, project/sample.js', '');
          expect(
            resultsModel.getResult(modifiedPath)
          ).not.toBe(undefined);
        });
      });

      describe("and a file is modified after the search finishes", () => {
        let editor, modifiedPath;
        let modifyEditor = () => {};
        beforeEach(async () => {
          modifiedPath = path.resolve(__dirname, "fixtures", "project", "sample.js");
          editor = await atom.workspace.open(modifiedPath);
          modifyEditor = () => {
            editor.setCursorBufferPosition([0, 0]);
            editor.insertText(' ');
            expect(editor.isModified()).toBe(true);
            return new Disposable(() => editor.undo());
          };
        });

        afterEach(async () => editor.destroy());

        it('is added to the results once it matches (with no path pattern)', async () => {
          jasmine.useRealClock();
          await resultsModel.search(' var quicksort =', '', '');
          expect(
            resultsModel.getResult(modifiedPath)
          ).toBe(undefined);
          modifyEditor();
          await new Promise(r => setTimeout(r, 1000));
          expect(
            resultsModel.getResult(modifiedPath)
          ).not.toBe(undefined);
        });

        it('is added to the results once it matches (if universal path pattern matches)', async () => {
          jasmine.useRealClock();
          await resultsModel.search(' var quicksort =', '**/sample.js', '');
          expect(
            resultsModel.getResult(modifiedPath)
          ).toBe(undefined);
          modifyEditor();
          await waitForCondition(() => {
            return !!resultsModel.getResult(modifiedPath);
          });
          expect(
            resultsModel.getResult(modifiedPath)
          ).not.toBe(undefined);
        });

        it('is added to the results once it matches (if specific-to-this-root path pattern matches)', async () => {
          jasmine.useRealClock();
          await resultsModel.search(' var quicksort =', 'project/sample.js', '');
          expect(
            resultsModel.getResult(modifiedPath)
          ).toBe(undefined);
          modifyEditor();
          await waitForCondition(() => {
            return !!resultsModel.getResult(modifiedPath);
          });
          expect(
            resultsModel.getResult(modifiedPath)
          ).not.toBe(undefined);
        });

        it('is not added to the results once it matches (if path pattern excludes it)', async () => {
          jasmine.useRealClock();
          await resultsModel.search(' var quicksort =', '**/foo.js', '');
          expect(
            resultsModel.getResult(modifiedPath)
          ).toBe(undefined);
          modifyEditor();
          await new Promise(r => setTimeout(r, 1000));
          expect(
            resultsModel.getResult(modifiedPath)
          ).toBe(undefined);
        });

        it('is excluded from the results if appropriate, even if there are matches', async () => {
          await resultsModel.search('quicksort =', '**/foo.js', '');
          expect(
            resultsModel.getResult(modifiedPath)
          ).toBe(undefined);
        });

        it('does not include a dirty buffer that would not have been included if it were clean', async () => {
          // In this case, `project/sample.js` should be implicitly excluded
          // because the user opted into a different root and no patterns apply
          // to the `project` root.
          await resultsModel.search('quicksort =', '**/foo.js', '');
          expect(
            resultsModel.getResult(modifiedPath)
          ).toBe(undefined);
        });

        it('has its path inclusions and exclusions assessed properly', async () => {
          await resultsModel.search('quicksort =', '**/sample.js, another-project-root/foo.js, project/sample.js', '');
          expect(
            resultsModel.getResult(modifiedPath)
          ).not.toBe(undefined);
        })
      });
    });
  });

  describe("cancelling a search", () => {
    let cancelledSpy;

    beforeEach(() => {
      cancelledSpy = jasmine.createSpy();
      resultsModel.onDidCancelSearching(cancelledSpy);
    });

    it("populates the model with all the results, and updates in response to changes in the buffer", async () => {
      const searchPromise = resultsModel.search("items", "*.js", "");
      expect(resultsModel.inProgressSearchPromise).toBeTruthy();
      resultsModel.clear();
      expect(resultsModel.inProgressSearchPromise).toBeFalsy();

      await searchPromise;
      expect(cancelledSpy).toHaveBeenCalled();
    });

    it("populates the model with all the results, and updates in response to changes in the buffer", async () => {
      resultsModel.search("items", "*.js", "");
      await resultsModel.search("sort", "*.js", "");

      expect(cancelledSpy).toHaveBeenCalled();
      expect(resultsModel.getPathCount()).toBe(1);
      expect(resultsModel.getMatchCount()).toBe(5);
    });
  });
});
