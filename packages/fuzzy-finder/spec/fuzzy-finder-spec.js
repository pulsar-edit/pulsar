const net = require('net')
const path = require('path')
const _ = require('underscore-plus')
const etch = require('etch')
const fs = require('fs')
const os = require('os')
const sinon = require('sinon')
const temp = require('temp')
const wrench = require('wrench')

const fuzzyFinderPackage = require('..')
const PathLoader = require('../lib/path-loader')
const DefaultFileIcons = require('../lib/default-file-icons')
const getIconServices = require('../lib/get-icon-services')
const {Disposable} = require('atom')

const {it, fit, ffit, afterEach, beforeEach, conditionPromise} = require('./async-spec-helpers') // eslint-disable-line no-unused-vars

function rmrf (_path) {
  if (fs.statSync(_path).isDirectory()) {
    _.each(fs.readdirSync(_path), (child) => rmrf(path.join(_path, child)))
    fs.rmdirSync(_path)
  } else {
    fs.unlinkSync(_path)
  }
}

function getOrScheduleUpdatePromise () {
  return new Promise((resolve) => etch.getScheduler().updateDocument(resolve))
}

const genPromiseToCheck = fn => new Promise(resolve => {
  const interval = setInterval(() => { if(fn()) resolve() }, 100)
  setTimeout(() => clearInterval(interval), 4000)
})

describe('FuzzyFinder', () => {
  let disposable, reporterStub
  let rootDir1, rootDir2
  let fuzzyFinder, projectView, bufferView, gitStatusView, workspaceElement, fixturesPath
  const filesPromise = () => genPromiseToCheck( () =>
    gitStatusView?.element?.querySelectorAll('.file')?.length ||
    bufferView?.element?.querySelectorAll('.file')?.length ||
    projectView?.element?.querySelectorAll('.file')?.length
  )

  beforeEach(async () => {
    reporterStub = {
      addTiming: sinon.spy(),
      incrementCounter: () => {}
    }
    disposable = fuzzyFinderPackage.consumeMetricsReporter(reporterStub)

    const ancestorDir = fs.realpathSync(temp.mkdirSync())
    rootDir1 = path.join(ancestorDir, 'root-dir1')
    rootDir2 = path.join(ancestorDir, 'root-dir2')

    fixturesPath = atom.project.getPaths()[0]

    wrench.copyDirSyncRecursive(
      path.join(fixturesPath, 'root-dir1'),
      rootDir1,
      {forceDelete: true}
    )

    wrench.copyDirSyncRecursive(
      path.join(fixturesPath, 'root-dir2'),
      rootDir2,
      {forceDelete: true}
    )

    atom.project.setPaths([rootDir1, rootDir2])

    workspaceElement = atom.views.getView(atom.workspace)

    await atom.workspace.open(path.join(rootDir1, 'sample.js'))

    const pack = await atom.packages.activatePackage('fuzzy-finder')
    fuzzyFinder = pack.mainModule
    bufferView = fuzzyFinder.createBufferView()
    gitStatusView = fuzzyFinder.createGitStatusView()

    jasmine.useRealClock()
  })

  afterEach(() => {
    if (disposable) {
      disposable.dispose()
    }
  })

  async function waitForPathsToDisplay (fuzzyFinderView) {
    return conditionPromise(() => fuzzyFinderView.element.querySelectorAll('li').length > 0)
  }

  async function waitForReCrawlerToFinish (fuzzyFinderView) {
    return conditionPromise(
      () => !fuzzyFinderView.element.querySelector('.loading .loading-message')
    )
  }

  function waitForInitialCrawlerToFinish (fuzzyFinder) {
    return new Promise(
      resolve => fuzzyFinder.loadPathsTask.on('task:completed', () => resolve())
    )
  }

  function eachFilePath (dirPaths, fn) {
    for (let dirPath of dirPaths) {
      wrench.readdirSyncRecursive(dirPath).filter((filePath) => {
        const fullPath = path.join(dirPath, filePath)
        if (fs.statSync(fullPath).isFile()) {
          fn(filePath)
        }
      })
    }
  }

  function parseResults (elementContainer) {
    return Array.from(elementContainer.querySelectorAll('li')).map(
      element => ({
        label: element.querySelector('.primary-line').textContent,
        description: element.querySelector('.secondary-line').textContent
      })
    )
  }

  for (const useRipGrep of [true, false]) {
    describe(`file-finder behavior (ripgrep=${useRipGrep})`, () => {
      beforeEach(async () => {
        projectView = fuzzyFinder.createProjectView()

        atom.config.set('fuzzy-finder.useRipGrep', useRipGrep)
        sinon.stub(os, 'cpus').returns({length: 1})

        await projectView.selectListView.update({maxResults: null})
      })

      afterEach(() => {
        os.cpus.restore()
      })

      describe('toggling', () => {
        describe('when the project has multiple paths', () => {
          it('shows or hides the fuzzy-finder and returns focus to the active editor if it is already showing', async () => {
            jasmine.attachToDOM(workspaceElement)

            expect(atom.workspace.panelForItem(projectView)).toBeNull()
            atom.workspace.getActivePane().splitRight({copyActiveItem: true})
            const [editor1, editor2] = atom.workspace.getTextEditors()

            await projectView.toggle()

            expect(atom.workspace.panelForItem(projectView).isVisible()).toBe(true)
            expect(projectView.selectListView.refs.queryEditor.element).toHaveFocus()
            projectView.selectListView.refs.queryEditor.insertText('this should not show up next time we toggle')

            await projectView.toggle()

            expect(atom.views.getView(editor1)).not.toHaveFocus()
            expect(atom.views.getView(editor2)).toHaveFocus()
            expect(atom.workspace.panelForItem(projectView).isVisible()).toBe(false)

            await projectView.toggle()

            expect(projectView.selectListView.refs.queryEditor.getText()).toBe('')
          })

          it('shows all files for the current project and selects the first', async () => {
            jasmine.attachToDOM(workspaceElement)
            await projectView.toggle()

            await waitForPathsToDisplay(projectView)

            eachFilePath([rootDir1, rootDir2], (filePath) => {
              const item = Array.from(projectView.element.querySelectorAll('li')).find(a => a.textContent.includes(filePath))
              expect(item).toExist()
              const nameDiv = item.querySelector('div:first-child')
              expect(nameDiv.dataset.name).toBe(path.basename(filePath))
              expect(nameDiv.textContent).toBe(path.basename(filePath))
            })

            expect(projectView.element.querySelector('.loading')).not.toBeVisible()
          })

          it("shows each file's path, including which root directory it's in", async () => {
            await projectView.toggle()

            await waitForPathsToDisplay(projectView)

            eachFilePath([rootDir1], (filePath) => {
              const item = Array.from(projectView.element.querySelectorAll('li')).find(a => a.textContent.includes(filePath))
              expect(item).toExist()
              expect(item.querySelectorAll('div')[1].textContent).toBe(path.join(path.basename(rootDir1), filePath))
            })

            eachFilePath([rootDir2], (filePath) => {
              const item = Array.from(projectView.element.querySelectorAll('li')).find(a => a.textContent.includes(filePath))
              expect(item).toExist()
              expect(item.querySelectorAll('div')[1].textContent).toBe(path.join(path.basename(rootDir2), filePath))
            })
          })

          it('only creates a single path loader task', async () => {
            spyOn(PathLoader, 'startTask').andCallThrough()

            await projectView.toggle() // Show

            await projectView.toggle() // Hide

            await projectView.toggle() // Show again

            expect(PathLoader.startTask.callCount).toBe(1)
          })

          it('puts the last opened path first', async () => {
            await atom.workspace.open('sample.txt')
            await atom.workspace.open('sample.js')

            await projectView.toggle()

            await waitForPathsToDisplay(projectView)

            const results = projectView.element.querySelectorAll('li')

            expect(results[0].textContent).toContain('sample.txt')
            expect(results[results.length - 1].textContent).toContain('sample.html')
          })

          it('displays paths correctly if the last-opened path is not part of the project (regression)', async () => {
            await atom.workspace.open('foo.txt')
            await atom.workspace.open('sample.js')

            await projectView.toggle()

            await waitForPathsToDisplay(projectView)
          })

          describe('symlinks on #darwin or #linux', () => {
            let junkDirPath, junkFilePath

            beforeEach(() => {
              junkDirPath = fs.realpathSync(temp.mkdirSync('junk-1'))
              junkFilePath = path.join(junkDirPath, 'file.txt')
              fs.writeFileSync(junkFilePath, 'txt')
              fs.writeFileSync(path.join(junkDirPath, 'a'), 'txt')

              const brokenFilePath = path.join(junkDirPath, 'delete.txt')
              fs.writeFileSync(brokenFilePath, 'delete-me')

              fs.symlinkSync(junkFilePath, atom.project.getDirectories()[0].resolve('symlink-to-file'))
              fs.symlinkSync(junkDirPath, atom.project.getDirectories()[0].resolve('symlink-to-dir'))
              fs.symlinkSync(brokenFilePath, atom.project.getDirectories()[0].resolve('broken-symlink'))

              fs.symlinkSync(atom.project.getDirectories()[0].resolve('sample.txt'), atom.project.getDirectories()[0].resolve('symlink-to-internal-file'))
              fs.symlinkSync(atom.project.getDirectories()[0].resolve('dir'), atom.project.getDirectories()[0].resolve('symlink-to-internal-dir'))
              fs.symlinkSync(atom.project.getDirectories()[0].resolve('..'), atom.project.getDirectories()[0].resolve('symlink-to-project-dir-ancestor'))

              fs.unlinkSync(brokenFilePath)
            })

            it('indexes project paths that are symlinks', async () => {
              const symlinkProjectPath = path.join(junkDirPath, 'root-dir-symlink')
              fs.symlinkSync(atom.project.getPaths()[0], symlinkProjectPath)

              atom.project.setPaths([symlinkProjectPath])

              await projectView.toggle()

              await waitForPathsToDisplay(projectView)

              expect(Array.from(projectView.element.querySelectorAll('li')).find(a => a.textContent.includes('sample.txt'))).toBeDefined()
            })

            it('includes symlinked file paths', async () => {
              await projectView.toggle()

              await waitForPathsToDisplay(projectView)

              const results = Array.from(projectView.element.querySelectorAll('li'))
              const sourceSymlink = results.find(a => a.textContent.includes('symlink-to-internal-file'))
              const destSymlink = results.find(a => a.textContent.includes('symlink-to-file'))

              expect(destSymlink).toBeDefined()

              // The behaviour when ripgrep is enabled is slightly different.
              if (useRipGrep) {
                expect(sourceSymlink).toBeDefined()
              } else {
                expect(sourceSymlink).not.toBeDefined()
              }
            })

            it('excludes symlinked folder paths if followSymlinks is false', async () => {
              atom.config.set('core.followSymlinks', false)

              await projectView.toggle()

              await waitForPathsToDisplay(projectView)

              const results = Array.from(projectView.element.querySelectorAll('li'))

              expect(results.find(a => a.textContent.includes('symlink-to-dir'))).not.toBeDefined()
              expect(results.find(a => a.textContent.includes('symlink-to-dir/a'))).not.toBeDefined()
              expect(results.find(a => a.textContent.includes('symlink-to-internal-dir'))).not.toBeDefined()
              expect(results.find(a => a.textContent.includes('symlink-to-internal-dir/a'))).not.toBeDefined()
            })

            it('includes symlinked folder paths if followSymlinks is true', async () => {
              atom.config.set('core.followSymlinks', true)

              await projectView.toggle()

              await waitForPathsToDisplay(projectView)

              const results = Array.from(projectView.element.querySelectorAll('li'))
              const sourceSymlink = results.find(a => a.textContent.includes('symlink-to-internal-dir/a'))
              const destSymlink = results.find(a => a.textContent.includes('symlink-to-dir/a'))

              expect(destSymlink).toBeDefined()

              // The behaviour when ripgrep is enabled is slightly different.
              if (useRipGrep) {
                expect(sourceSymlink).toBeDefined()
              } else {
                expect(sourceSymlink).not.toBeDefined()
              }
            })
          })

          describe('socket files on #darwin or #linux', () => {
            let socketServer, socketPath

            beforeEach(() => new Promise((resolve, reject) => {
              socketServer = net.createServer(() => {})
              socketPath = path.join(rootDir1, 'some.sock')
              socketServer.on('listening', resolve)
              socketServer.on('error', reject)
              socketServer.listen(socketPath)
            }))

            afterEach(() => new Promise(resolve => socketServer.close(resolve)))

            it('does not interfere with ability to load files', async () => {
              await projectView.toggle()

              await waitForPathsToDisplay(projectView)
              expect(Array.from(projectView.element.querySelectorAll('li')).find(a => a.textContent.includes('a'))).toBeDefined()
              expect(Array.from(projectView.element.querySelectorAll('li')).find(a => a.textContent.includes('some.sock'))).not.toBeDefined()
            })
          })

          it('ignores paths that match entries in config.fuzzy-finder.ignoredNames', async () => {
            atom.config.set('fuzzy-finder.ignoredNames', ['sample.js', '*.txt'])

            await projectView.toggle()

            await waitForPathsToDisplay(projectView)

            expect(Array.from(projectView.element.querySelectorAll('li')).find(a => a.textContent.includes('sample.js'))).not.toBeDefined()
            expect(Array.from(projectView.element.querySelectorAll('li')).find(a => a.textContent.includes('sample.txt'))).not.toBeDefined()
            expect(Array.from(projectView.element.querySelectorAll('li')).find(a => a.textContent.includes('a'))).toBeDefined()
          })

          it("only shows a given path once, even if it's within multiple root folders", async () => {
            const childDir1 = path.join(rootDir1, 'a-child')
            const childFile1 = path.join(childDir1, 'child-file.txt')
            fs.mkdirSync(childDir1)
            fs.writeFileSync(childFile1, 'stuff')
            atom.project.addPath(childDir1)

            await projectView.toggle()

            await waitForPathsToDisplay(projectView)

            expect(Array.from(projectView.element.querySelectorAll('li')).filter(a => a.textContent.includes('child-file.txt')).length).toBe(1)
          })

          it('returns all the results if they have the same relative path across multiple root folders', async () => {
            fs.writeFileSync(path.join(rootDir1, 'whatever.js'), 'stuff')
            fs.writeFileSync(path.join(rootDir2, 'whatever.js'), 'stuff')

            await projectView.toggle()
            await waitForPathsToDisplay(projectView)

            await projectView.selectListView.refs.queryEditor.setText('whatever.js')
            await getOrScheduleUpdatePromise()

            // Sort results by path to ensure test is deterministic
            const results = parseResults(projectView.element)
              .sort((a, b) => a.description.localeCompare(b.description))
            expect(results).toEqual([
              {label: 'whatever.js', description: path.join('root-dir1', 'whatever.js')},
              {label: 'whatever.js', description: path.join('root-dir2', 'whatever.js')}
            ])
          })

          it('returns all the results if they have the same relative path across multiple root folders with the same name', async () => {
            const ancestorDir = fs.realpathSync(temp.mkdirSync())
            const rootDir3 = path.join(ancestorDir, 'root-dir1')
            fs.mkdirSync(rootDir3)

            fs.writeFileSync(path.join(rootDir1, 'whatever.js'), 'stuff')
            fs.writeFileSync(path.join(rootDir3, 'whatever.js'), 'stuff')

            atom.project.addPath(rootDir3)

            await projectView.toggle()
            await waitForPathsToDisplay(projectView)

            await projectView.selectListView.refs.queryEditor.setText('whatever.js')
            await getOrScheduleUpdatePromise()

            expect(parseResults(projectView.element)).toEqual([
              {label: 'whatever.js', description: path.join('root-dir1', 'whatever.js')},
              {label: 'whatever.js', description: path.join('root-dir1', 'whatever.js')}
            ])
          })
        })

        describe('when the project only has one path', () => {
          beforeEach(() => atom.project.setPaths([rootDir1]))

          it("doesn't show the name of each file's root directory", async () => {
            await projectView.toggle()

            await waitForPathsToDisplay(projectView)

            const items = Array.from(projectView.element.querySelectorAll('li'))
            eachFilePath([rootDir1], (filePath) => {
              const item = items.find(a => a.textContent.includes(filePath))
              expect(item).toExist()
              expect(item).not.toHaveText(path.basename(rootDir1))
            })
          })
        })

        describe('when the project has no path', () => {
          beforeEach(() => {
            jasmine.attachToDOM(workspaceElement)
            atom.project.setPaths([])
          })

          it('shows an empty message with no files in the list', async () => {
            await projectView.toggle()

            expect(projectView.selectListView.refs.emptyMessage).toBeVisible()
            expect(projectView.selectListView.refs.emptyMessage.textContent).toBe('Project is empty')
            expect(projectView.element.querySelectorAll('li').length).toBe(0)
          })
        })
      })

      describe("when a project's root path is unlinked", () => {
        beforeEach(() => {
          if (fs.existsSync(rootDir1)) { rmrf(rootDir1) }
          if (fs.existsSync(rootDir2)) { rmrf(rootDir2) }
        })

        it('posts an error notification', async () => {
          spyOn(atom.notifications, 'addError')
          await projectView.toggle()

          await conditionPromise(() => atom.workspace.panelForItem(projectView).isVisible())
          expect(atom.notifications.addError).toHaveBeenCalled()
        })
      })

      describe('when a path selection is confirmed', () => {
        it('opens the file associated with that path in that split', async () => {
          jasmine.attachToDOM(workspaceElement)
          const editor1 = atom.workspace.getActiveTextEditor()
          atom.workspace.getActivePane().splitRight({copyActiveItem: true})
          const editor2 = atom.workspace.getActiveTextEditor()
          const expectedPath = atom.project.getDirectories()[0].resolve('dir/a')

          await projectView.toggle()

          projectView.confirm({uri: expectedPath})

          await conditionPromise(() => atom.workspace.getActivePane().getItems().length === 2)

          const editor3 = atom.workspace.getActiveTextEditor()
          expect(atom.workspace.panelForItem(projectView).isVisible()).toBe(false)
          expect(editor1.getPath()).not.toBe(expectedPath)
          expect(editor2.getPath()).not.toBe(expectedPath)
          expect(editor3.getPath()).toBe(expectedPath)
          expect(atom.views.getView(editor3)).toHaveFocus()
        })

        describe('when the selected path is a directory', () =>
          it("leaves the the tree view open, doesn't open the path in the editor, and displays an error", async () => {
            jasmine.attachToDOM(workspaceElement)
            const editorPath = atom.workspace.getActiveTextEditor().getPath()
            await projectView.toggle()

            projectView.confirm({uri: atom.project.getDirectories()[0].resolve('dir')})
            expect(projectView.element.parentElement).toBeDefined()
            expect(atom.workspace.getActiveTextEditor().getPath()).toBe(editorPath)

            await conditionPromise(() => projectView.selectListView.refs.errorMessage)

            jasmine.useMockClock()

            advanceClock(2000)

            await conditionPromise(() => !projectView.selectListView.refs.errorMessage)
          })
        )
      })

      describe('buffer-finder behavior', () => {
        describe('toggling', () => {
          describe('when there are pane items with paths', () => {
            beforeEach(async () => {
              jasmine.attachToDOM(workspaceElement)

              await atom.workspace.open('sample.txt')
            })

            it("shows the FuzzyFinder if it isn't showing, or hides it and returns focus to the active editor", async () => {
              expect(atom.workspace.panelForItem(bufferView)).toBeNull()
              atom.workspace.getActivePane().splitRight({copyActiveItem: true})
              const [editor1, editor2, editor3] = atom.workspace.getTextEditors() // eslint-disable-line no-unused-vars
              expect(atom.workspace.getActivePaneItem()).toBe(editor3)

              expect(atom.views.getView(editor3)).toHaveFocus()

              await bufferView.toggle()

              expect(atom.workspace.panelForItem(bufferView).isVisible()).toBe(true)
              expect(workspaceElement.querySelector('.fuzzy-finder')).toHaveFocus()
              bufferView.selectListView.refs.queryEditor.insertText('this should not show up next time we toggle')

              await bufferView.toggle()

              expect(atom.views.getView(editor3)).toHaveFocus()
              expect(atom.workspace.panelForItem(bufferView).isVisible()).toBe(false)

              await bufferView.toggle()

              expect(bufferView.selectListView.refs.queryEditor.getText()).toBe('')
            })

            it('lists the paths of the current items, sorted by most recently opened but with the current item last', async () => {
              await atom.workspace.open('sample-with-tabs.coffee')

              bufferView.toggle()
              await filesPromise()
              expect(atom.workspace.panelForItem(bufferView).isVisible()).toBe(true)
              expect([...bufferView.element.querySelectorAll('li > div.file')]
                .map(e => e.textContent))
                .toEqual(['sample.txt', 'sample.js', 'sample-with-tabs.coffee'])

              await bufferView.toggle()
              expect(atom.workspace.panelForItem(bufferView).isVisible()).toBe(false)

              await atom.workspace.open('sample.txt')
              bufferView.toggle()
              await genPromiseToCheck(() =>
                bufferView?.element?.querySelector('li > div.file')
                  ?.innerText?.match(/sample-with-tabs/)
              )
              expect(atom.workspace.panelForItem(bufferView).isVisible()).toBe(true)
              expect([...bufferView.element.querySelectorAll('li > div.file')]
                .map(e => e.textContent))
                .toEqual(['sample-with-tabs.coffee', 'sample.js', 'sample.txt'])
              expect(bufferView.element.querySelector('li')).toHaveClass('selected')
            })

            it('serializes the list of paths and their last opened time', async () => {
              await atom.workspace.open('sample-with-tabs.coffee')
              await bufferView.toggle()
              await atom.workspace.open('sample.js')
              await bufferView.toggle()
              await atom.workspace.open()
              await atom.packages.deactivatePackage('fuzzy-finder')

              let states = _.map(atom.packages.getPackageState('fuzzy-finder'), (path, time) => [path, time])
              expect(states.length).toBe(3)
              states = _.sortBy(states, (path, time) => -time)

              const paths = ['sample-with-tabs.coffee', 'sample.txt', 'sample.js']
              for (let [time, bufferPath] of states) {
                expect(_.last(bufferPath.split(path.sep))).toBe(paths.shift())
                expect(time).toBeGreaterThan(50000)
              }
            })
          })

          describe('when there are only panes with anonymous items', () =>
            it('does not open', async () => {
              atom.workspace.getActivePane().destroy()
              await atom.workspace.open()

              await bufferView.toggle()

              expect(atom.workspace.panelForItem(bufferView)).toBeNull()
            })
          )

          describe('when there are no pane items', () =>
            it('does not open', async () => {
              atom.workspace.getActivePane().destroy()
              await bufferView.toggle()

              expect(atom.workspace.panelForItem(bufferView)).toBeNull()
            })
          )

          describe('when multiple sessions are opened on the same path', () =>
            it('does not display duplicates for that path in the list', async () => {
              await atom.workspace.open('sample.js')

              atom.workspace.getActivePane().splitRight({copyActiveItem: true})

              bufferView.toggle()
              await filesPromise()
              expect(Array.from(bufferView.element.querySelectorAll('li > div.file')).map(e => e.textContent)).toEqual(['sample.js'])
            })
          )
        })

        describe('when a path selection is confirmed', () => {
          let editor1, editor2, editor3

          beforeEach(async () => {
            jasmine.attachToDOM(workspaceElement)
            atom.workspace.getActivePane().splitRight({copyActiveItem: true})

            await atom.workspace.open('sample.txt');

            [editor1, editor2, editor3] = atom.workspace.getTextEditors()

            expect(atom.workspace.getActiveTextEditor()).toBe(editor3)

            atom.commands.dispatch(atom.views.getView(editor2), 'pane:show-previous-item')

            await bufferView.toggle()
          })

          describe('when the active pane has an item for the selected path', () =>
            it('switches to the item for the selected path', async () => {
              const expectedPath = atom.project.getDirectories()[0].resolve('sample.txt')
              bufferView.confirm({uri: expectedPath})

              await conditionPromise(() => atom.workspace.getActiveTextEditor().getPath() === expectedPath)

              expect(atom.workspace.panelForItem(bufferView).isVisible()).toBe(false)
              expect(editor1.getPath()).not.toBe(expectedPath)
              expect(editor2.getPath()).not.toBe(expectedPath)
              expect(editor3.getPath()).toBe(expectedPath)
              expect(atom.views.getView(editor3)).toHaveFocus()
            })
          )

          describe('when the active pane does not have an item for the selected path and fuzzy-finder.searchAllPanes is false', () =>
            it('adds a new item to the active pane for the selected path', async () => {
              const expectedPath = atom.project.getDirectories()[0].resolve('sample.txt')

              await bufferView.toggle()

              atom.views.getView(editor1).focus()

              await bufferView.toggle()

              expect(atom.workspace.getActiveTextEditor()).toBe(editor1)
              bufferView.confirm({uri: expectedPath}, atom.config.get('fuzzy-finder.searchAllPanes'))

              await conditionPromise(() => atom.workspace.getActivePane().getItems().length === 2)

              const editor4 = atom.workspace.getActiveTextEditor()

              expect(atom.workspace.panelForItem(bufferView).isVisible()).toBe(false)

              expect(editor4).not.toBe(editor1)
              expect(editor4).not.toBe(editor2)
              expect(editor4).not.toBe(editor3)

              expect(editor4.getPath()).toBe(expectedPath)
              expect(atom.views.getView(editor4)).toHaveFocus()
            })
          )

          describe('when the active pane does not have an item for the selected path and fuzzy-finder.searchAllPanes is true', () => {
            beforeEach(() => atom.config.set('fuzzy-finder.searchAllPanes', true))

            it('switches to the pane with the item for the selected path', async () => {
              const expectedPath = atom.project.getDirectories()[0].resolve('sample.txt')
              let originalPane = null

              await bufferView.toggle()

              atom.views.getView(editor1).focus()
              originalPane = atom.workspace.getActivePane()

              await bufferView.toggle()

              expect(atom.workspace.getActiveTextEditor()).toBe(editor1)
              bufferView.confirm({uri: expectedPath}, {searchAllPanes: atom.config.get('fuzzy-finder.searchAllPanes')})

              await conditionPromise(() => atom.workspace.getActiveTextEditor().getPath() === expectedPath)

              expect(atom.workspace.panelForItem(bufferView).isVisible()).toBe(false)
              expect(atom.workspace.getActivePane()).not.toBe(originalPane)
              expect(atom.workspace.getActiveTextEditor()).toBe(editor3)
              expect(atom.workspace.getPaneItems().length).toBe(3)
            })
          })
        })
      })

      describe('common behavior between file and buffer finder', () =>
        describe('when the fuzzy finder is cancelled', () => {
          describe('when an editor is open', () =>
            it('detaches the finder and focuses the previously focused element', async () => {
              jasmine.attachToDOM(workspaceElement)
              const activeEditor = atom.workspace.getActiveTextEditor()

              await projectView.toggle()

              expect(projectView.element.parentElement).toBeDefined()
              expect(projectView.selectListView.refs.queryEditor.element).toHaveFocus()

              projectView.cancel()

              expect(atom.workspace.panelForItem(projectView).isVisible()).toBe(false)
              expect(atom.views.getView(activeEditor)).toHaveFocus()
            })
          )

          describe('when no editors are open', () =>
            it('detaches the finder and focuses the previously focused element', async () => {
              jasmine.attachToDOM(workspaceElement)
              atom.workspace.getActivePane().destroy()

              const inputView = document.createElement('input')
              workspaceElement.appendChild(inputView)
              inputView.focus()

              await projectView.toggle()

              expect(projectView.element.parentElement).toBeDefined()
              expect(projectView.selectListView.refs.queryEditor.element).toHaveFocus()
              projectView.cancel()
              expect(atom.workspace.panelForItem(projectView).isVisible()).toBe(false)
              expect(inputView).toHaveFocus()
            })
          )
        })
      )

      describe('cached file paths', () => {
        beforeEach(() => {
          spyOn(PathLoader, 'startTask').andCallThrough()
          spyOn(atom.workspace, 'getTextEditors').andCallThrough()
        })

        it('caches file paths after first time', async () => {
          await projectView.toggle()

          await waitForPathsToDisplay(projectView)

          expect(PathLoader.startTask).toHaveBeenCalled()
          PathLoader.startTask.reset()

          await projectView.toggle()

          await projectView.toggle()

          await waitForPathsToDisplay(projectView)

          expect(PathLoader.startTask).not.toHaveBeenCalled()
        })

        it("doesn't cache buffer paths", async () => {
          await bufferView.toggle()

          await waitForPathsToDisplay(bufferView)

          expect(atom.workspace.getTextEditors).toHaveBeenCalled()
          atom.workspace.getTextEditors.reset()

          await bufferView.toggle()

          await bufferView.toggle()

          await waitForPathsToDisplay(bufferView)

          expect(atom.workspace.getTextEditors).toHaveBeenCalled()
        })

        it('busts the cache when the window gains focus', async () => {
          await projectView.toggle()

          await waitForPathsToDisplay(projectView)

          expect(PathLoader.startTask).toHaveBeenCalled()
          PathLoader.startTask.reset()
          window.dispatchEvent(new CustomEvent('focus'))
          await projectView.toggle()

          await projectView.toggle()

          expect(PathLoader.startTask).toHaveBeenCalled()
        })

        it('busts the cache when the project path changes', async () => {
          await projectView.toggle()

          await waitForPathsToDisplay(projectView)

          expect(PathLoader.startTask).toHaveBeenCalled()
          PathLoader.startTask.reset()
          atom.project.setPaths([temp.mkdirSync('atom')])

          await projectView.toggle()

          await projectView.toggle()

          expect(PathLoader.startTask).toHaveBeenCalled()

          await waitForReCrawlerToFinish(projectView)

          expect(projectView.element.querySelectorAll('li').length).toBe(0)
        })

        describe('the initial load paths task started during package activation', () => {
          beforeEach(async () => {
            fuzzyFinder.projectView.destroy()
            fuzzyFinder.projectView = null
            fuzzyFinder.startLoadPathsTask()

            await conditionPromise(() => fuzzyFinder.projectPaths)
          })

          it('passes the indexed paths into the project view when it is created', () => {
            const {projectPaths} = fuzzyFinder
            expect(projectPaths.length).toBe(19)
            projectView = fuzzyFinder.createProjectView()
            expect(projectView.paths).toBe(projectPaths)
            expect(projectView.reloadPaths).toBe(false)
          })

          it('busts the cached paths when the project paths change', () => {
            atom.project.setPaths([])

            const {projectPaths} = fuzzyFinder
            expect(projectPaths).toBe(null)

            projectView = fuzzyFinder.createProjectView()
            expect(projectView.paths).toBe(null)
            expect(projectView.reloadPaths).toBe(true)
          })
        })
      })

      describe('opening a path into a split', () => {
        it('opens the path by splitting the active editor left', async () => {
          expect(atom.workspace.getCenter().getPanes().length).toBe(1)
          let filePath = null

          await bufferView.toggle();

          ({filePath} = bufferView.selectListView.getSelectedItem())
          atom.commands.dispatch(bufferView.element, 'pane:split-left')

          await conditionPromise(() => atom.workspace.getCenter().getPanes().length === 2)

          await conditionPromise(() => atom.workspace.getActiveTextEditor())

          const [leftPane, rightPane] = atom.workspace.getCenter().getPanes() // eslint-disable-line no-unused-vars
          expect(atom.workspace.getActivePane()).toBe(leftPane)
          expect(atom.workspace.getActiveTextEditor().getPath()).toBe(atom.project.getDirectories()[0].resolve(filePath))
        })

        it('opens the path by splitting the active editor right', async () => {
          expect(atom.workspace.getCenter().getPanes().length).toBe(1)
          let filePath = null

          await bufferView.toggle();

          ({filePath} = bufferView.selectListView.getSelectedItem())
          atom.commands.dispatch(bufferView.element, 'pane:split-right')

          await conditionPromise(() => atom.workspace.getCenter().getPanes().length === 2)

          await conditionPromise(() => atom.workspace.getActiveTextEditor())

          const [leftPane, rightPane] = atom.workspace.getCenter().getPanes() // eslint-disable-line no-unused-vars
          expect(atom.workspace.getActivePane()).toBe(rightPane)
          expect(atom.workspace.getActiveTextEditor().getPath()).toBe(atom.project.getDirectories()[0].resolve(filePath))
        })

        it('opens the path by splitting the active editor up', async () => {
          expect(atom.workspace.getCenter().getPanes().length).toBe(1)
          let filePath = null

          await bufferView.toggle();

          ({filePath} = bufferView.selectListView.getSelectedItem())
          atom.commands.dispatch(bufferView.element, 'pane:split-up')

          await conditionPromise(() => atom.workspace.getCenter().getPanes().length === 2)

          await conditionPromise(() => atom.workspace.getActiveTextEditor())

          const [topPane, bottomPane] = atom.workspace.getCenter().getPanes() // eslint-disable-line no-unused-vars
          expect(atom.workspace.getActivePane()).toBe(topPane)
          expect(atom.workspace.getActiveTextEditor().getPath()).toBe(atom.project.getDirectories()[0].resolve(filePath))
        })

        it('opens the path by splitting the active editor down', async () => {
          expect(atom.workspace.getCenter().getPanes().length).toBe(1)
          let filePath = null

          await bufferView.toggle();

          ({filePath} = bufferView.selectListView.getSelectedItem())
          atom.commands.dispatch(bufferView.element, 'pane:split-down')

          await conditionPromise(() => atom.workspace.getCenter().getPanes().length === 2)

          await conditionPromise(() => atom.workspace.getActiveTextEditor())

          const [topPane, bottomPane] = atom.workspace.getCenter().getPanes() // eslint-disable-line no-unused-vars
          expect(atom.workspace.getActivePane()).toBe(bottomPane)
          expect(atom.workspace.getActiveTextEditor().getPath()).toBe(atom.project.getDirectories()[0].resolve(filePath))
        })
      })

      describe('when the query contains a colon', () => {
        beforeEach(async () => {
          jasmine.attachToDOM(workspaceElement)
          expect(atom.workspace.panelForItem(projectView)).toBeNull()

          await atom.workspace.open('sample.txt')

          const [editor1, editor2] = atom.workspace.getTextEditors()
          editor1.setCursorBufferPosition([8, 3])
          expect(atom.workspace.getActiveTextEditor()).toBe(editor2)
          expect(editor1.getCursorBufferPosition()).toEqual([8, 3])
        })

        describe('when the colon is followed by numbers', () => {
          describe('when the numbers are not followed by another colon', () => {
            describe('when the filter text has a file path', () => {
              it('opens the selected path to that line number', async () => {
                const [editor1, editor2] = atom.workspace.getTextEditors() // eslint-disable-line no-unused-vars

                await bufferView.toggle()

                expect(atom.workspace.panelForItem(bufferView).isVisible()).toBe(true)
                bufferView.selectListView.refs.queryEditor.setText('sample.js:4')

                await getOrScheduleUpdatePromise()

                const {filePath} = bufferView.selectListView.getSelectedItem()
                expect(atom.project.getDirectories()[0].resolve(filePath)).toBe(editor1.getPath())

                spyOn(bufferView, 'moveToCaretPosition').andCallThrough()
                atom.commands.dispatch(bufferView.element, 'core:confirm')

                await conditionPromise(() => bufferView.moveToCaretPosition.callCount > 0)

                expect(atom.workspace.getActiveTextEditor()).toBe(editor1)
                expect(editor1.getCursorBufferPosition()).toEqual([3, 4])
              })
            })

            describe("when the filter text doesn't have a file path", () => {
              it('moves the cursor in the active editor to that line number', async () => {
                const [editor1, editor2] = atom.workspace.getTextEditors() // eslint-disable-line no-unused-vars

                await atom.workspace.open('sample.js')

                expect(atom.workspace.getActiveTextEditor()).toBe(editor1)

                await bufferView.toggle()

                expect(atom.workspace.panelForItem(bufferView).isVisible()).toBe(true)
                bufferView.selectListView.refs.queryEditor.insertText(':4')

                await getOrScheduleUpdatePromise()

                expect(bufferView.element.querySelectorAll('li').length).toBe(0)
                spyOn(bufferView, 'moveToCaretPosition').andCallThrough()
                atom.commands.dispatch(bufferView.element, 'core:confirm')

                await conditionPromise(() => bufferView.moveToCaretPosition.callCount > 0)

                expect(atom.workspace.getActiveTextEditor()).toBe(editor1)
                expect(editor1.getCursorBufferPosition()).toEqual([3, 4])
              })
            })
          })

          describe('when the numbers are followed by another colon', () => {
            describe('when the colon is followed by more numbers', () => {
              describe('when the filter text has a file path', () => {
                it('opens the selected path to that line number and column', async () => {
                  const [editor1, editor2] = atom.workspace.getTextEditors() // eslint-disable-line no-unused-vars

                  await bufferView.toggle()

                  expect(atom.workspace.panelForItem(bufferView).isVisible()).toBe(true)
                  bufferView.selectListView.refs.queryEditor.setText('sample.js:4:6')

                  await getOrScheduleUpdatePromise()

                  const {filePath} = bufferView.selectListView.getSelectedItem()
                  expect(atom.project.getDirectories()[0].resolve(filePath)).toBe(editor1.getPath())

                  spyOn(bufferView, 'moveToCaretPosition').andCallThrough()
                  atom.commands.dispatch(bufferView.element, 'core:confirm')

                  await conditionPromise(() => bufferView.moveToCaretPosition.callCount > 0)

                  expect(atom.workspace.getActiveTextEditor()).toBe(editor1)
                  expect(editor1.getCursorBufferPosition()).toEqual([3, 6])
                })
              })

              describe("when the filter text doesn't have a file path", () => {
                it('moves the cursor in the active editor to that line number and column', async () => {
                  const [editor1, editor2] = atom.workspace.getTextEditors() // eslint-disable-line no-unused-vars

                  await atom.workspace.open('sample.js')

                  expect(atom.workspace.getActiveTextEditor()).toBe(editor1)

                  await bufferView.toggle()

                  expect(atom.workspace.panelForItem(bufferView).isVisible()).toBe(true)
                  bufferView.selectListView.refs.queryEditor.insertText(':4:6')

                  await getOrScheduleUpdatePromise()

                  expect(bufferView.selectListView.refs.emptyMessage.innerText).toEqual(
                    'Jump to line and column in active editor'
                  )
                  expect(bufferView.element.querySelectorAll('li').length).toBe(0)
                  spyOn(bufferView, 'moveToCaretPosition').andCallThrough()
                  atom.commands.dispatch(bufferView.element, 'core:confirm')

                  await conditionPromise(() => bufferView.moveToCaretPosition.callCount > 0)

                  expect(atom.workspace.getActiveTextEditor()).toBe(editor1)
                  expect(editor1.getCursorBufferPosition()).toEqual([3, 6])
                })
              })
            })

            describe('when the colon is not followed by more numbers', () => {
              describe('when the filter text has a file path', () => {
                it('opens the file, jumps to the first character of the line and does not throw an error', async () => {
                  const [editor1, editor2] = atom.workspace.getTextEditors() // eslint-disable-line no-unused-vars

                  await bufferView.toggle()

                  expect(atom.workspace.panelForItem(bufferView).isVisible()).toBe(true)
                  bufferView.selectListView.refs.queryEditor.setText('sample.js:5:a')

                  await getOrScheduleUpdatePromise()

                  const {filePath} = bufferView.selectListView.getSelectedItem()
                  expect(atom.project.getDirectories()[0].resolve(filePath)).toBe(editor1.getPath())

                  spyOn(bufferView, 'moveToCaretPosition').andCallThrough()
                  atom.commands.dispatch(bufferView.element, 'core:confirm')

                  await conditionPromise(() => bufferView.moveToCaretPosition.callCount > 0)

                  expect(atom.workspace.getActiveTextEditor()).toBe(editor1)
                  expect(editor1.getCursorBufferPosition()).toEqual([4, 4])
                })
              })

              describe("when the filter text doesn't have a file path", () => {
                it('jumps to the first character of the line and does not throw an error', async () => {
                  const [editor1, editor2] = atom.workspace.getTextEditors() // eslint-disable-line no-unused-vars

                  await atom.workspace.open('sample.js')

                  expect(atom.workspace.getActiveTextEditor()).toBe(editor1)

                  await bufferView.toggle()

                  expect(atom.workspace.panelForItem(bufferView).isVisible()).toBe(true)
                  bufferView.selectListView.refs.queryEditor.setText(':5:a')

                  await getOrScheduleUpdatePromise()

                  spyOn(bufferView, 'moveToCaretPosition').andCallThrough()
                  atom.commands.dispatch(bufferView.element, 'core:confirm')

                  await conditionPromise(() => bufferView.moveToCaretPosition.callCount > 0)

                  expect(atom.workspace.getActiveTextEditor()).toBe(editor1)
                  expect(editor1.getCursorBufferPosition()).toEqual([4, 4])
                })
              })
            })
          })
        })

        describe('when the colon is not followed by numbers', () => {
          describe('when the filter text has a file path', () => {
            it('opens the file and does not throw an error', async () => {
              const [editor1, editor2] = atom.workspace.getTextEditors() // eslint-disable-line no-unused-vars

              await bufferView.toggle()

              expect(atom.workspace.panelForItem(bufferView).isVisible()).toBe(true)
              bufferView.selectListView.refs.queryEditor.setText('sample.js:a')

              await getOrScheduleUpdatePromise()

              const {filePath} = bufferView.selectListView.getSelectedItem()
              expect(atom.project.getDirectories()[0].resolve(filePath)).toBe(editor1.getPath())

              spyOn(bufferView, 'moveToCaretPosition').andCallThrough()
              atom.commands.dispatch(bufferView.element, 'core:confirm')

              await conditionPromise(() => bufferView.moveToCaretPosition.callCount > 0)

              expect(atom.workspace.getActiveTextEditor()).toBe(editor1)
              expect(editor1.getCursorBufferPosition()).toEqual([8, 3])
            })
          })

          describe("when the filter text doesn't have a file path", () => {
            it('shows an error and does not move the cursor', async () => {
              const [editor1, editor2] = atom.workspace.getTextEditors() // eslint-disable-line no-unused-vars

              await atom.workspace.open('sample.js')

              expect(atom.workspace.getActiveTextEditor()).toBe(editor1)

              await bufferView.toggle()

              expect(atom.workspace.panelForItem(bufferView).isVisible()).toBe(true)
              bufferView.selectListView.refs.queryEditor.setText('::')

              await getOrScheduleUpdatePromise()

              expect(bufferView.selectListView.refs.errorMessage.innerText).toEqual('Invalid line number')

              expect(bufferView.element.querySelectorAll('li').length).toBe(0)
              spyOn(bufferView, 'moveToCaretPosition').andCallThrough()
              atom.commands.dispatch(bufferView.element, 'core:confirm')

              await conditionPromise(() => bufferView.moveToCaretPosition.callCount > 0)

              expect(atom.workspace.getActiveTextEditor()).toBe(editor1)
              expect(editor1.getCursorBufferPosition()).toEqual([8, 3])
            })

            it('updates the message when the error gets resolved', async () => {
              const [editor1, editor2] = atom.workspace.getTextEditors() // eslint-disable-line no-unused-vars

              const emptyMessage = 'Jump to line in active editor'
              const errorMessage = 'Invalid line number'

              await atom.workspace.open('sample.js')

              expect(atom.workspace.getActiveTextEditor()).toBe(editor1)

              await bufferView.toggle()

              expect(atom.workspace.panelForItem(bufferView).isVisible()).toBe(true)

              bufferView.selectListView.refs.queryEditor.setText(':42')
              await getOrScheduleUpdatePromise()
              expect(bufferView.selectListView.refs.emptyMessage.innerText).toEqual(emptyMessage)
              expect(bufferView.selectListView.refs.errorMessage).toBeUndefined()

              bufferView.selectListView.refs.queryEditor.setText(':42a')
              await getOrScheduleUpdatePromise()
              expect(bufferView.selectListView.refs.emptyMessage).toBeUndefined()
              expect(bufferView.selectListView.refs.errorMessage.innerText).toEqual(errorMessage)

              bufferView.selectListView.refs.queryEditor.setText(':42')
              await getOrScheduleUpdatePromise()
              expect(bufferView.selectListView.refs.emptyMessage.innerText).toEqual(emptyMessage)
              expect(bufferView.selectListView.refs.errorMessage).toBeUndefined()
            })

            it('shows a specific error message when the column is invalid', async () => {
              const [editor1] = atom.workspace.getTextEditors()
              const errorMessage = 'Invalid column number'

              await atom.workspace.open('sample.js')

              expect(atom.workspace.getActiveTextEditor()).toBe(editor1)

              await bufferView.toggle()

              expect(atom.workspace.panelForItem(bufferView).isVisible()).toBe(true)

              bufferView.selectListView.refs.queryEditor.setText(':42:12a')
              await getOrScheduleUpdatePromise()
              expect(bufferView.selectListView.refs.emptyMessage).toBeUndefined()
              expect(bufferView.selectListView.refs.errorMessage.innerText).toEqual(errorMessage)
            })

            it('shows a more specific message when jumping to line and column', async () => {
              const [editor1] = atom.workspace.getTextEditors()
              const emptyColumnMessage = 'Jump to line and column in active editor'

              await atom.workspace.open('sample.js')

              expect(atom.workspace.getActiveTextEditor()).toBe(editor1)

              await bufferView.toggle()

              expect(atom.workspace.panelForItem(bufferView).isVisible()).toBe(true)

              bufferView.selectListView.refs.queryEditor.setText(':42:')
              await getOrScheduleUpdatePromise()
              expect(bufferView.selectListView.refs.emptyMessage.innerText).toEqual(emptyColumnMessage)

              bufferView.selectListView.refs.queryEditor.setText(':42:12')
              await getOrScheduleUpdatePromise()
              expect(bufferView.selectListView.refs.emptyMessage.innerText).toEqual(emptyColumnMessage)
            })
          })
        })
      })

      describe('match highlighting', () => {
        beforeEach(async () => {
          jasmine.attachToDOM(workspaceElement)
          await bufferView.toggle()
        })

        it('highlights an exact match', async () => {
          bufferView.selectListView.refs.queryEditor.setText('sample.js')

          await getOrScheduleUpdatePromise()

          const resultView = bufferView.element.querySelector('li')
          const primaryMatches = resultView.querySelectorAll('.primary-line .character-match')
          const secondaryMatches = resultView.querySelectorAll('.secondary-line .character-match')
          expect(primaryMatches.length).toBe(1)
          expect(primaryMatches[primaryMatches.length - 1].textContent).toBe('sample.js')
          // Use `toBeGreaterThan` because dir may have some characters in it
          expect(secondaryMatches.length).toBeGreaterThan(0)
          expect(secondaryMatches[secondaryMatches.length - 1].textContent).toBe('sample.js')
        })

        it('highlights a partial match', async () => {
          bufferView.selectListView.refs.queryEditor.setText('sample')

          await getOrScheduleUpdatePromise()

          const resultView = bufferView.element.querySelector('li')
          const primaryMatches = resultView.querySelectorAll('.primary-line .character-match')
          const secondaryMatches = resultView.querySelectorAll('.secondary-line .character-match')
          expect(primaryMatches.length).toBe(1)
          expect(primaryMatches[primaryMatches.length - 1].textContent).toBe('sample')
          // Use `toBeGreaterThan` because dir may have some characters in it
          expect(secondaryMatches.length).toBeGreaterThan(0)
          expect(secondaryMatches[secondaryMatches.length - 1].textContent).toBe('sample')
        })

        it('highlights multiple matches in the file name', async () => {
          bufferView.selectListView.refs.queryEditor.setText('samplejs')

          await getOrScheduleUpdatePromise()

          const resultView = bufferView.element.querySelector('li')
          const primaryMatches = resultView.querySelectorAll('.primary-line .character-match')
          const secondaryMatches = resultView.querySelectorAll('.secondary-line .character-match')
          expect(primaryMatches.length).toBe(2)
          expect(primaryMatches[0].textContent).toBe('sample')
          expect(primaryMatches[primaryMatches.length - 1].textContent).toBe('js')
          // Use `toBeGreaterThan` because dir may have some characters in it
          expect(secondaryMatches.length).toBeGreaterThan(1)
          expect(secondaryMatches[secondaryMatches.length - 1].textContent).toBe('js')
        })

        it('highlights matches in the directory and file name', async () => {
          spyOn(bufferView, 'projectRelativePathsForFilePaths').andCallFake((paths) => paths)
          bufferView.selectListView.refs.queryEditor.setText('root-dirsample')

          await bufferView.setItems([
            {
              filePath: path.join('test', 'root-dir1', 'sample.js'),
              label: path.join('root-dir1', 'sample.js')
            }
          ])

          await filesPromise()
          const resultView = bufferView.element.querySelector('li')
          const primaryMatches = resultView.querySelectorAll('.primary-line .character-match')
          const secondaryMatches = resultView.querySelectorAll('.secondary-line .character-match')
          expect(primaryMatches.length).toBe(1)
          expect(primaryMatches[primaryMatches.length - 1].textContent).toBe('sample')
          expect(secondaryMatches.length).toBe(2)
          expect(secondaryMatches[0].textContent).toBe('root-dir')
          expect(secondaryMatches[secondaryMatches.length - 1].textContent).toBe('sample')
        })

        describe('when splitting panes', () => {
          it('opens the selected path to that line number in a new pane', async () => {
            const [editor1, editor2] = atom.workspace.getTextEditors() // eslint-disable-line no-unused-vars

            await atom.workspace.open('sample.js')

            expect(atom.workspace.getActiveTextEditor()).toBe(editor1)

            await bufferView.toggle()

            expect(atom.workspace.panelForItem(bufferView).isVisible()).toBe(true)
            bufferView.selectListView.refs.queryEditor.insertText(':4')

            await getOrScheduleUpdatePromise()

            expect(bufferView.element.querySelectorAll('li').length).toBe(0)
            spyOn(bufferView, 'moveToCaretPosition').andCallThrough()
            atom.commands.dispatch(bufferView.element, 'pane:split-left')

            await conditionPromise(() => bufferView.moveToCaretPosition.callCount > 0)

            expect(atom.workspace.getActiveTextEditor()).not.toBe(editor1)
            expect(atom.workspace.getActiveTextEditor().getPath()).toBe(editor1.getPath())
            expect(atom.workspace.getActiveTextEditor().getCursorBufferPosition()).toEqual([3, 4])
          })
        })
      })

      describe('preserve last search', () => {
        it('does not preserve last search by default', async () => {
          await projectView.toggle()

          expect(atom.workspace.panelForItem(projectView).isVisible()).toBe(true)
          bufferView.selectListView.refs.queryEditor.insertText('this should not show up next time we open finder')

          await projectView.toggle()

          expect(atom.workspace.panelForItem(projectView).isVisible()).toBe(false)

          await projectView.toggle()

          expect(atom.workspace.panelForItem(projectView).isVisible()).toBe(true)
          expect(projectView.selectListView.getQuery()).toBe('')
        })

        it('preserves last search when the config is set', async () => {
          atom.config.set('fuzzy-finder.preserveLastSearch', true)

          await projectView.toggle()

          expect(atom.workspace.panelForItem(projectView).isVisible()).toBe(true)
          projectView.selectListView.refs.queryEditor.insertText('this should show up next time we open finder')

          await projectView.toggle()

          expect(atom.workspace.panelForItem(projectView).isVisible()).toBe(false)

          await projectView.toggle()

          expect(atom.workspace.panelForItem(projectView).isVisible()).toBe(true)
          expect(projectView.selectListView.getQuery()).toBe('this should show up next time we open finder')
          expect(projectView.selectListView.refs.queryEditor.getSelectedText()).toBe('this should show up next time we open finder')
        })
      })

      describe('prefill query from selection', () => {
        it('should not be enabled by default', async () => {
          await atom.workspace.open()

          atom.workspace.getActiveTextEditor().setText('sample.txt')
          atom.workspace.getActiveTextEditor().setSelectedBufferRange([[0, 0], [0, 10]])
          expect(atom.workspace.getActiveTextEditor().getSelectedText()).toBe('sample.txt')

          await projectView.toggle()

          expect(atom.workspace.panelForItem(projectView).isVisible()).toBe(true)
          expect(projectView.selectListView.getQuery()).toBe('')
          expect(projectView.selectListView.refs.queryEditor.getSelectedText()).toBe('')
        })

        it('takes selection from active editor and prefills query with it', async () => {
          atom.config.set('fuzzy-finder.prefillFromSelection', true)

          await atom.workspace.open()

          atom.workspace.getActiveTextEditor().setText('sample.txt')
          atom.workspace.getActiveTextEditor().setSelectedBufferRange([[0, 0], [0, 10]])
          expect(atom.workspace.getActiveTextEditor().getSelectedText()).toBe('sample.txt')

          await projectView.toggle()

          expect(atom.workspace.panelForItem(projectView).isVisible()).toBe(true)
          expect(projectView.selectListView.getQuery()).toBe('sample.txt')
          expect(projectView.selectListView.refs.queryEditor.getSelectedText()).toBe('sample.txt')
        })
      })

      describe('default file icons', () => {
        it('shows a text icon for text-based formats', async () => {
          await atom.workspace.open('sample.js')

          await bufferView.toggle()

          expect(atom.workspace.panelForItem(bufferView).isVisible()).toBe(true)
          bufferView.selectListView.refs.queryEditor.insertText('js')

          await getOrScheduleUpdatePromise()

          const firstResult = bufferView.element.querySelector('li .primary-line')
          expect(DefaultFileIcons.iconClassForPath(firstResult.dataset.path)).toBe('icon-file-text')
        })

        it('shows an image icon for graphic formats', async () => {
          await atom.workspace.open('sample.gif')

          await bufferView.toggle()

          expect(atom.workspace.panelForItem(bufferView).isVisible()).toBe(true)
          bufferView.selectListView.refs.queryEditor.insertText('gif')

          await getOrScheduleUpdatePromise()

          const firstResult = bufferView.element.querySelector('li .primary-line')
          expect(DefaultFileIcons.iconClassForPath(firstResult.dataset.path)).toBe('icon-file-media')
        })
      })

      describe('icon services', () => {
        describe('atom.file-icons', () => {
          it('has a default handler', () => {
            expect(getIconServices().fileIcons).toBe(DefaultFileIcons)
          })

          it('allows services to replace the default handler', async () => {
            const provider = {iconClassForPath: () => 'foo bar'}
            const disposable = atom.packages.serviceHub.provide('atom.file-icons', '1.0.0', provider)
            expect(getIconServices().fileIcons).toBe(provider)

            await atom.workspace.open('sample.js')

            await bufferView.toggle()

            expect(atom.workspace.panelForItem(bufferView).isVisible()).toBe(true)
            bufferView.selectListView.refs.queryEditor.insertText('js')

            await getOrScheduleUpdatePromise()

            const firstResult = bufferView.element.querySelector('li .primary-line')
            expect(firstResult).toBeDefined()
            expect(firstResult.className).toBe('primary-line file icon foo bar')
            disposable.dispose()
            expect(getIconServices().fileIcons).toBe(DefaultFileIcons)
          })
        })

        describe('file-icons.element-icons', () => {
          it('has no default handler', () => {
            expect(getIconServices().elementIcons).toBe(null)
          })

          it('uses the element-icon service if available', async () => {
            const provider = element => {
              element.classList.add('foo', 'bar')
              return new Disposable(() => {
                element.classList.remove('foo', 'bar')
              })
            }
            const disposable = atom.packages.serviceHub.provide('file-icons.element-icons', '1.0.0', provider)
            expect(getIconServices().elementIcons).toBe(provider)

            await atom.workspace.open('sample.js')

            await bufferView.toggle()

            expect(atom.workspace.panelForItem(bufferView).isVisible()).toBe(true)
            bufferView.selectListView.refs.queryEditor.insertText('js')

            await getOrScheduleUpdatePromise()

            const firstResult = bufferView.element.querySelector('li .primary-line')
            expect(firstResult).toBeDefined()
            expect(firstResult.className).toBe('primary-line file icon foo bar')
            disposable.dispose()
            expect(getIconServices().elementIcons).toBe(null)
            expect(firstResult.classList).not.toBe('primary-line file icon foo bar')
          })
        })

        describe('when both services are provided', () => {
          it('gives priority to the element-icon service', async () => {
            const basicProvider = {iconClassForPath: () => 'foo'}
            const elementProvider = element => {
              element.classList.add('bar')
              return new Disposable(() => {
                element.classList.remove('bar')
              })
            }
            spyOn(basicProvider, 'iconClassForPath').andCallThrough()
            atom.packages.serviceHub.provide('atom.file-icons', '1.0.0', basicProvider)
            atom.packages.serviceHub.provide('file-icons.element-icons', '1.0.0', elementProvider)
            expect(getIconServices().fileIcons).toBe(basicProvider)
            expect(getIconServices().elementIcons).toBe(elementProvider)

            await atom.workspace.open('sample.js')

            await bufferView.toggle()

            expect(atom.workspace.panelForItem(bufferView).isVisible()).toBe(true)
            bufferView.selectListView.refs.queryEditor.insertText('js')

            await getOrScheduleUpdatePromise()

            const firstResult = bufferView.element.querySelector('li .primary-line')
            expect(firstResult).toBeDefined()
            expect(firstResult.className).toBe('primary-line file icon bar')
            expect(basicProvider.iconClassForPath).not.toHaveBeenCalled()
          })
        })
      })

      describe('Git integration', () => {
        let projectPath, gitRepository, gitDirectory

        beforeEach(() => {
          projectPath = atom.project.getDirectories()[0].resolve('git/working-dir')
          fs.renameSync(path.join(projectPath, 'git.git'), path.join(projectPath, '.git'))
          atom.project.setPaths([rootDir2, projectPath])

          gitDirectory = atom.project.getDirectories()[1]
          gitRepository = atom.project.getRepositories()[1]

          return new Promise(
            resolve => gitRepository.onDidChangeStatuses(resolve)
          )
        })

        describe('git-status-finder behavior', () => {
          let originalPath, newPath

          beforeEach(async () => {
            jasmine.attachToDOM(workspaceElement)

            await atom.workspace.open(path.join(projectPath, 'a.txt'))

            const editor = atom.workspace.getActiveTextEditor()
            originalPath = editor.getPath()
            fs.writeFileSync(originalPath, 'making a change for the better')
            gitRepository.getPathStatus(originalPath)

            newPath = atom.project.getDirectories()[1].resolve('newsample.js')
            fs.writeFileSync(newPath, '')
            gitRepository.getPathStatus(newPath)
          })

          it('displays all new and modified paths', async () => {
            expect(atom.workspace.panelForItem(gitStatusView)).toBeNull()
            await gitStatusView.toggle()

            await filesPromise()
            expect(atom.workspace.panelForItem(gitStatusView).isVisible()).toBe(true)
            expect(gitStatusView.element.querySelectorAll('.file').length).toBe(4)
            expect(gitStatusView.element.querySelectorAll('.status.status-modified').length).toBe(1)
            expect(gitStatusView.element.querySelectorAll('.status.status-added').length).toBe(3)
          })
        })

        describe('status decorations', () => {
          let originalPath, editor, newPath

          beforeEach(async () => {
            jasmine.attachToDOM(workspaceElement)

            await atom.workspace.open(path.join(projectPath, 'a.txt'))

            editor = atom.workspace.getActiveTextEditor()
            originalPath = editor.getPath()
            newPath = gitDirectory.resolve('newsample.js')
            fs.writeFileSync(newPath, '')
            fs.writeFileSync(originalPath, 'a change')
          })

          describe('when a modified file is shown in the list', () =>
            it('displays the modified icon', async () => {
              gitRepository.getPathStatus(editor.getPath())

              bufferView.toggle()
              await filesPromise()
              expect(bufferView.element.querySelectorAll('.status.status-modified').length).toBe(1)
              expect(bufferView.element.querySelector('.status.status-modified').closest('li').querySelector('.file').textContent).toBe('a.txt')
            })
          )

          describe('when a new file is shown in the list', () =>
            it('displays the new icon', async () => {
              await atom.workspace.open(path.join(projectPath, 'newsample.js'))

              gitRepository.getPathStatus(editor.getPath())

              bufferView.toggle()
              await filesPromise()
              expect(bufferView.element.querySelectorAll('.status.status-added').length).toBe(1)
              expect(bufferView.element.querySelector('.status.status-added').closest('li').querySelector('.file').textContent).toBe('newsample.js')
            })
          )
        })

        describe('when core.excludeVcsIgnoredPaths is set to true', () => {
          beforeEach(() => atom.config.set('core.excludeVcsIgnoredPaths', true))

          describe("when the project's path is the repository's working directory", () => {
            beforeEach(() => {
              const ignoreFile = path.join(projectPath, '.gitignore')
              fs.writeFileSync(ignoreFile, 'ignored.txt')

              const ignoredFile = path.join(projectPath, 'ignored.txt')
              fs.writeFileSync(ignoredFile, 'ignored text')
            })

            it('excludes paths that are git ignored', async () => {
              await projectView.toggle()

              await waitForPathsToDisplay(projectView)

              expect(Array.from(projectView.element.querySelectorAll('li')).find(a => a.textContent.includes('ignored.txt'))).not.toBeDefined()
            })
          })

          describe("when the project's path is a subfolder of the repository's working directory", () => {
            beforeEach(() => {
              atom.project.setPaths([gitDirectory.resolve('dir')])
              const ignoreFile = path.join(projectPath, '.gitignore')
              fs.writeFileSync(ignoreFile, 'b.txt')
            })

            if (useRipGrep) {
              it('does excludes paths that are git ignored', async () => {
                fs.writeFileSync(path.join(projectPath, 'dir', 'a.txt'), 'something')

                await projectView.toggle()

                await waitForPathsToDisplay(projectView)

                expect(Array.from(projectView.element.querySelectorAll('li')).find(a => a.textContent.includes('b.txt'))).not.toBeDefined()
              })
            } else {
              it('does not exclude paths that are git ignored', async () => {
                await projectView.toggle()

                await waitForPathsToDisplay(projectView)

                expect(Array.from(projectView.element.querySelectorAll('li')).find(a => a.textContent.includes('b.txt'))).toBeDefined()
              })
            }
          })

          describe('when the .gitignore matches parts of the path to the root folder', () => {
            beforeEach(() => {
              const ignoreFile = path.join(projectPath, '.gitignore')
              fs.writeFileSync(ignoreFile, path.basename(projectPath))
            })

            it('only applies the .gitignore patterns to relative paths within the root folder', async () => {
              await projectView.toggle()

              await waitForPathsToDisplay(projectView)

              expect(Array.from(projectView.element.querySelectorAll('li')).find(a => a.textContent.includes('file.txt'))).toBeDefined()
            })
          })

          describe('when core.ignoredNames does not have .git in its glob patterns', () => {
            beforeEach(() => {
              atom.config.set('core.ignoredNames', [])
            })

            it('still ignores .git directory', async () => {
              await projectView.toggle()

              await waitForPathsToDisplay(projectView)

              expect(Array.from(projectView.element.querySelectorAll('li')).find(a =>
                a.textContent.includes('HEAD'))).not.toBeDefined()
            })
          })
        })

        describe('when core.excludeVcsIgnoredPaths is set to false', () => {
          beforeEach(() => atom.config.set('core.excludeVcsIgnoredPaths', false))

          describe("when the project's path is the repository's working directory", () => {
            beforeEach(() => {
              const ignoreFile = path.join(projectPath, '.gitignore')
              fs.writeFileSync(ignoreFile, 'ignored.txt')

              const ignoredFile = path.join(projectPath, 'ignored.txt')
              fs.writeFileSync(ignoredFile, 'ignored text')
            })

            it("doesn't exclude paths that are git ignored", async () => {
              await projectView.toggle()

              await waitForPathsToDisplay(projectView)

              expect(Array.from(projectView.element.querySelectorAll('li')).find(a => a.textContent.includes('ignored.txt'))).toBeDefined()
            })
          })
        })

        describe('logging of metrics events', () => {
          it('logs the crawling time', async () => {
            // After setting the reporter it may receive some old events from previous tests
            // that we want to discard.
            reporterStub.addTiming.resetHistory()

            await projectView.toggle()

            await waitForPathsToDisplay(projectView)

            expect(reporterStub.addTiming.firstCall.args[0]).toEqual('fuzzy-finder-v1')
            expect(reporterStub.addTiming.firstCall.args[2]).toEqual(
              {ec: 'time-to-crawl', el: useRipGrep ? 'ripgrep' : 'fs', ev: 5}
            )
          })

          it('queues the events until a reporter is set', async () => {
            // After setting the reporter it may receive some old events from previous tests
            // that we want to discard.
            reporterStub.addTiming.resetHistory()

            await projectView.toggle()

            await waitForPathsToDisplay(projectView)

            fuzzyFinderPackage.consumeMetricsReporter(reporterStub)

            expect(reporterStub.addTiming.firstCall.args[0]).toEqual('fuzzy-finder-v1')
            expect(reporterStub.addTiming.firstCall.args[2]).toEqual(
              {ec: 'time-to-crawl', el: useRipGrep ? 'ripgrep' : 'fs', ev: 5}
            )
          })
        })
      })

      describe('error handling', () => {
        beforeEach(() => {
          const junkDirPath = fs.realpathSync(temp.mkdirSync('junk-1'))
          const brokenFilePath = path.join(junkDirPath, 'delete.txt')
          fs.writeFileSync(brokenFilePath, 'delete-me')

          for (let i = 0; i < 1000; i++) {
            fs.symlinkSync(brokenFilePath, atom.project.getDirectories()[0].resolve('broken-symlink-' + i))
          }

          fs.unlinkSync(brokenFilePath)
        })

        it('copes with a lot of errors during indexing', async () => {
          await projectView.toggle()

          await waitForPathsToDisplay(projectView)

          expect(projectView.element.querySelector('.loading')).not.toBeVisible()
        })
      })
    })
  }

  it('shows all files for the current project once the initial crawler has finished', async () => {
    await waitForInitialCrawlerToFinish(fuzzyFinder)

    projectView = fuzzyFinder.createProjectView()
    jasmine.attachToDOM(workspaceElement)

    await projectView.selectListView.update({maxResults: null})
    await projectView.toggle()

    expect(projectView.element.querySelector('.loading')).not.toBeVisible()

    await waitForPathsToDisplay(projectView)

    eachFilePath([rootDir1, rootDir2], (filePath) => {
      const item = Array.from(projectView.element.querySelectorAll('li')).find(a => a.textContent.includes(filePath))
      expect(item).toExist()
      const nameDiv = item.querySelector('div:first-child')
      expect(nameDiv.dataset.name).toBe(path.basename(filePath))
      expect(nameDiv.textContent).toBe(path.basename(filePath))
    })

    expect(projectView.element.querySelector('.loading')).not.toBeVisible()
  })
})
