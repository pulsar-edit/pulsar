fs = require 'fs-plus'
path = require 'path'
os = require 'os'
process = require 'process'

describe "Built-in Status Bar Tiles", ->
  [statusBar, workspaceElement, dummyView] = []

  beforeEach ->
    workspaceElement = atom.views.getView(atom.workspace)
    dummyView = document.createElement("div")
    statusBar = null

    waitsForPromise ->
      atom.packages.activatePackage('status-bar')

    runs ->
      statusBar = workspaceElement.querySelector("status-bar")

  describe "the file info, cursor and selection tiles", ->
    [editor, buffer, fileInfo, cursorPosition, selectionCount] = []

    beforeEach ->
      waitsForPromise ->
        atom.workspace.open('sample.js')

      runs ->
        [launchMode, fileInfo, cursorPosition, selectionCount] =
          statusBar.getLeftTiles().map (tile) -> tile.getItem()
        editor = atom.workspace.getActiveTextEditor()
        buffer = editor.getBuffer()

    describe "when associated with an unsaved buffer", ->
      it "displays 'untitled' instead of the buffer's path, but still displays the buffer position", ->
        waitsForPromise ->
          atom.workspace.open()

        runs ->
          atom.views.performDocumentUpdate()
          expect(fileInfo.currentPath.textContent).toBe 'untitled'
          expect(cursorPosition.textContent).toBe '1:1'
          expect(selectionCount).toBeHidden()

    describe "when the associated editor's path changes", ->
      it "updates the path in the status bar", ->
        waitsForPromise ->
          atom.workspace.open('sample.txt')

        runs ->
          expect(fileInfo.currentPath.textContent).toBe 'sample.txt'

    describe "when associated with remote file path", ->
      beforeEach ->
        jasmine.attachToDOM(workspaceElement)
        dummyView.getPath = -> 'remote://server:123/folder/remote_file.txt'
        atom.workspace.getActivePane().activateItem(dummyView)

      it "updates the path in the status bar", ->
        # The remote path isn't relativized in the test because no remote directory provider is registered.
        expect(fileInfo.currentPath.textContent).toBe 'remote://server:123/folder/remote_file.txt'
        expect(fileInfo.currentPath).toBeVisible()

      it "when the path is clicked", ->
        fileInfo.currentPath.click()
        expect(atom.clipboard.read()).toBe '/folder/remote_file.txt'

      it "calls relativize with the remote URL on shift-click", ->
        spy = spyOn(atom.project, 'relativize').andReturn 'remote_file.txt'
        event = new MouseEvent('click', shiftKey: true)
        fileInfo.dispatchEvent(event)
        expect(atom.clipboard.read()).toBe 'remote_file.txt'
        expect(spy).toHaveBeenCalledWith 'remote://server:123/folder/remote_file.txt'

    describe "when file info tile is clicked", ->
      it "copies the absolute path into the clipboard if available", ->
        waitsForPromise ->
          atom.workspace.open('sample.txt')

        runs ->
          fileInfo.click()
          expect(atom.clipboard.read()).toBe fileInfo.getActiveItem().getPath()

    describe "when the file info tile is shift-clicked", ->
      it "copies the relative path into the clipboard if available", ->
        waitsForPromise ->
          atom.workspace.open('sample.txt')

        runs ->
          event = new MouseEvent('click', shiftKey: true)
          fileInfo.dispatchEvent(event)
          expect(atom.clipboard.read()).toBe 'sample.txt'

    describe "when path of an unsaved buffer is clicked", ->
      it "copies the 'untitled' into clipboard", ->
        waitsForPromise ->
          atom.workspace.open()

        runs ->
          fileInfo.currentPath.click()
          expect(atom.clipboard.read()).toBe 'untitled'

    describe "when buffer's path is not clicked", ->
      it "doesn't display a path tooltip", ->
        jasmine.attachToDOM(workspaceElement)
        waitsForPromise ->
          atom.workspace.open()

        runs ->
          expect(document.querySelector('.tooltip')).not.toExist()

    describe "when buffer's path is clicked", ->
      it "displays path tooltip and the tooltip disappears after ~2 seconds", ->
        jasmine.attachToDOM(workspaceElement)
        waitsForPromise ->
          atom.workspace.open()

        runs ->
          fileInfo.currentPath.click()
          expect(document.querySelector('.tooltip')).toBeVisible()
          # extra leeway so test won't fail because tooltip disappeared few milliseconds too late
          advanceClock(2100)
          expect(document.querySelector('.tooltip')).not.toExist()

    describe "when saved buffer's path is clicked", ->
      it "displays a tooltip containing text 'Copied:' and an absolute native path", ->
        jasmine.attachToDOM(workspaceElement)
        waitsForPromise ->
          atom.workspace.open('sample.txt')

        runs ->
          fileInfo.currentPath.click()
          expect(document.querySelector('.tooltip')).toHaveText "Copied: #{fileInfo.getActiveItem().getPath()}"

      it "displays a tooltip containing text 'Copied:' for an absolute Unix path", ->
        jasmine.attachToDOM(workspaceElement)
        dummyView.getPath = -> '/user/path/for/my/file.txt'
        atom.workspace.getActivePane().activateItem(dummyView)

        runs ->
          fileInfo.currentPath.click()
          expect(document.querySelector('.tooltip')).toHaveText "Copied: #{dummyView.getPath()}"

      it "displays a tooltip containing text 'Copied:' for an absolute Windows path", ->
        jasmine.attachToDOM(workspaceElement)
        dummyView.getPath = -> 'c:\\user\\path\\for\\my\\file.txt'
        atom.workspace.getActivePane().activateItem(dummyView)

        runs ->
          fileInfo.currentPath.click()
          expect(document.querySelector('.tooltip')).toHaveText "Copied: #{dummyView.getPath()}"

    describe "when unsaved buffer's path is clicked", ->
      it "displays a tooltip containing text 'Copied: untitled", ->
        jasmine.attachToDOM(workspaceElement)
        waitsForPromise ->
          atom.workspace.open()

        runs ->
          fileInfo.currentPath.click()
          expect(document.querySelector('.tooltip')).toHaveText "Copied: untitled"

    describe "when the associated editor's buffer's content changes", ->
      it "enables the buffer modified indicator", ->
        expect(fileInfo.classList.contains('buffer-modified')).toBe(false)
        editor.insertText("\n")
        advanceClock(buffer.stoppedChangingDelay)
        expect(fileInfo.classList.contains('buffer-modified')).toBe(true)
        editor.backspace()

    describe "when the buffer content has changed from the content on disk", ->
      it "disables the buffer modified indicator on save", ->
        filePath = path.join(os.tmpdir(), "atom-whitespace.txt")
        fs.writeFileSync(filePath, "")

        waitsForPromise ->
          atom.workspace.open(filePath)

        runs ->
          editor = atom.workspace.getActiveTextEditor()
          expect(fileInfo.classList.contains('buffer-modified')).toBe(false)
          editor.insertText("\n")
          advanceClock(buffer.stoppedChangingDelay)
          expect(fileInfo.classList.contains('buffer-modified')).toBe(true)

        waitsForPromise ->
          # TODO - remove this Promise.resolve once atom/atom#14435 lands.
          Promise.resolve(editor.getBuffer().save())

        runs ->
          expect(fileInfo.classList.contains('buffer-modified')).toBe(false)

      it "disables the buffer modified indicator if the content matches again", ->
        expect(fileInfo.classList.contains('buffer-modified')).toBe(false)
        editor.insertText("\n")
        advanceClock(buffer.stoppedChangingDelay)
        expect(fileInfo.classList.contains('buffer-modified')).toBe(true)
        editor.backspace()
        advanceClock(buffer.stoppedChangingDelay)
        expect(fileInfo.classList.contains('buffer-modified')).toBe(false)

      it "disables the buffer modified indicator when the change is undone", ->
        expect(fileInfo.classList.contains('buffer-modified')).toBe(false)
        editor.insertText("\n")
        advanceClock(buffer.stoppedChangingDelay)
        expect(fileInfo.classList.contains('buffer-modified')).toBe(true)
        editor.undo()
        advanceClock(buffer.stoppedChangingDelay)
        expect(fileInfo.classList.contains('buffer-modified')).toBe(false)

    describe "when the buffer changes", ->
      it "updates the buffer modified indicator for the new buffer", ->
        expect(fileInfo.classList.contains('buffer-modified')).toBe(false)

        waitsForPromise ->
          atom.workspace.open('sample.txt')

        runs ->
          editor = atom.workspace.getActiveTextEditor()
          editor.insertText("\n")
          advanceClock(buffer.stoppedChangingDelay)
          expect(fileInfo.classList.contains('buffer-modified')).toBe(true)

      it "doesn't update the buffer modified indicator for the old buffer", ->
        oldBuffer = editor.getBuffer()
        expect(fileInfo.classList.contains('buffer-modified')).toBe(false)

        waitsForPromise ->
          atom.workspace.open('sample.txt')

        runs ->
          oldBuffer.setText("new text")
          advanceClock(buffer.stoppedChangingDelay)
          expect(fileInfo.classList.contains('buffer-modified')).toBe(false)

    describe "when the associated editor's cursor position changes", ->
      it "updates the cursor position in the status bar", ->
        jasmine.attachToDOM(workspaceElement)
        editor.setCursorScreenPosition([1, 2])
        atom.views.performDocumentUpdate()
        expect(cursorPosition.textContent).toBe '2:3'

      it "does not throw an exception if the cursor is moved as the result of the active pane item changing to a non-editor (regression)", ->
        waitsForPromise ->
          Promise.resolve(atom.packages.deactivatePackage('status-bar')) # Wrapped so works with Promise & non-Promise deactivate
        runs ->
          atom.workspace.onDidChangeActivePaneItem(-> editor.setCursorScreenPosition([1, 2]))
        waitsForPromise ->
          atom.packages.activatePackage('status-bar')
        runs ->
          statusBar = workspaceElement.querySelector("status-bar")
          cursorPosition = statusBar.getLeftTiles()[2].getItem()

          atom.workspace.getActivePane().activateItem(document.createElement('div'))
          expect(editor.getCursorScreenPosition()).toEqual([1, 2])
          atom.views.performDocumentUpdate()
          expect(cursorPosition).toBeHidden()

    describe "when the associated editor's selection changes", ->
      it "updates the selection count in the status bar", ->
        jasmine.attachToDOM(workspaceElement)

        editor.setSelectedBufferRange([[0, 0], [0, 0]])
        atom.views.performDocumentUpdate()
        expect(selectionCount.textContent).toBe ''

        editor.setSelectedBufferRange([[0, 0], [0, 2]])
        atom.views.performDocumentUpdate()
        expect(selectionCount.textContent).toBe '(1, 2)'

        editor.setSelectedBufferRange([[0, 0], [1, 30]])
        atom.views.performDocumentUpdate()
        expect(selectionCount.textContent).toBe "(2, 60)"

      it "does not throw an exception if the cursor is moved as the result of the active pane item changing to a non-editor (regression)", ->
        waitsForPromise ->
          Promise.resolve(atom.packages.deactivatePackage('status-bar')) # Wrapped so works with Promise & non-Promise deactivate
        runs ->
          atom.workspace.onDidChangeActivePaneItem(-> editor.setSelectedBufferRange([[1, 2], [1, 3]]))
        waitsForPromise ->
          atom.packages.activatePackage('status-bar')
        runs ->
          statusBar = workspaceElement.querySelector("status-bar")
          selectionCount = statusBar.getLeftTiles()[3].getItem()

          atom.workspace.getActivePane().activateItem(document.createElement('div'))
          expect(editor.getSelectedBufferRange()).toEqual([[1, 2], [1, 3]])
          atom.views.performDocumentUpdate()
          expect(selectionCount).toBeHidden()

    describe "when the active pane item does not implement getCursorBufferPosition()", ->
      it "hides the cursor position view", ->
        jasmine.attachToDOM(workspaceElement)
        atom.workspace.getActivePane().activateItem(dummyView)
        atom.views.performDocumentUpdate()
        expect(cursorPosition).toBeHidden()

    describe "when the active pane item implements getTitle() but not getPath()", ->
      it "displays the title", ->
        jasmine.attachToDOM(workspaceElement)
        dummyView.getTitle = -> 'View Title'
        atom.workspace.getActivePane().activateItem(dummyView)
        expect(fileInfo.currentPath.textContent).toBe 'View Title'
        expect(fileInfo.currentPath).toBeVisible()

    describe "when the active pane item neither getTitle() nor getPath()", ->
      it "hides the path view", ->
        jasmine.attachToDOM(workspaceElement)
        atom.workspace.getActivePane().activateItem(dummyView)
        expect(fileInfo.currentPath).toBeHidden()

    describe "when the active pane item's title changes", ->
      it "updates the path view with the new title", ->
        jasmine.attachToDOM(workspaceElement)
        callbacks = []
        dummyView.onDidChangeTitle = (fn) ->
          callbacks.push(fn)
          {
            dispose: ->
          }
        dummyView.getTitle = -> 'View Title'
        atom.workspace.getActivePane().activateItem(dummyView)
        expect(fileInfo.currentPath.textContent).toBe 'View Title'
        dummyView.getTitle = -> 'New Title'
        callback() for callback in callbacks
        expect(fileInfo.currentPath.textContent).toBe 'New Title'

    describe 'the cursor position tile', ->
      beforeEach ->
        atom.config.set('status-bar.cursorPositionFormat', 'foo %L bar %C')

      it 'respects a format string', ->
        jasmine.attachToDOM(workspaceElement)
        editor.setCursorScreenPosition([1, 2])
        atom.views.performDocumentUpdate()
        expect(cursorPosition.textContent).toBe 'foo 2 bar 3'

      it 'updates when the configuration changes', ->
        jasmine.attachToDOM(workspaceElement)
        editor.setCursorScreenPosition([1, 2])
        atom.views.performDocumentUpdate()
        expect(cursorPosition.textContent).toBe 'foo 2 bar 3'

        atom.config.set('status-bar.cursorPositionFormat', 'baz %C quux %L')
        atom.views.performDocumentUpdate()
        expect(cursorPosition.textContent).toBe 'baz 3 quux 2'

      describe "when clicked", ->
        it "triggers the go-to-line toggle event", ->
          eventHandler = jasmine.createSpy('eventHandler')
          atom.commands.add('atom-text-editor', 'go-to-line:toggle', eventHandler)
          cursorPosition.click()
          expect(eventHandler).toHaveBeenCalled()

    describe 'the selection count tile', ->
      beforeEach ->
        atom.config.set('status-bar.selectionCountFormat', '%L foo %C bar selected')

      it 'respects a format string', ->
        jasmine.attachToDOM(workspaceElement)
        editor.setSelectedBufferRange([[0, 0], [1, 30]])
        atom.views.performDocumentUpdate()
        expect(selectionCount.textContent).toBe "2 foo 60 bar selected"

      it 'updates when the configuration changes', ->
        jasmine.attachToDOM(workspaceElement)
        editor.setSelectedBufferRange([[0, 0], [1, 30]])
        atom.views.performDocumentUpdate()
        expect(selectionCount.textContent).toBe "2 foo 60 bar selected"

        atom.config.set('status-bar.selectionCountFormat', 'Selection: baz %C quux %L')
        atom.views.performDocumentUpdate()
        expect(selectionCount.textContent).toBe "Selection: baz 60 quux 2"

      it 'does not include the next line if the last selected character is a LF', ->
        lineEndingRegExp = /\r\n|\n|\r/g
        buffer = editor.getBuffer()
        buffer.setText(buffer.getText().replace(lineEndingRegExp, '\n'))
        jasmine.attachToDOM(workspaceElement)
        editor.setSelectedBufferRange([[0, 0], [1, 0]])
        atom.views.performDocumentUpdate()
        expect(selectionCount.textContent).toBe "1 foo 30 bar selected"

      it 'does not include the next line if the last selected character is CRLF', ->
        lineEndingRegExp = /\r\n|\n|\r/g
        buffer = editor.getBuffer()
        buffer.setText(buffer.getText().replace(lineEndingRegExp, '\r\n'))
        jasmine.attachToDOM(workspaceElement)
        editor.setSelectedBufferRange([[0, 0], [1, 0]])
        atom.views.performDocumentUpdate()
        expect(selectionCount.textContent).toBe "1 foo 31 bar selected"

  describe "the git tile", ->
    gitView = null

    hover = (element, fn) ->
      # FIXME: Only use hoverDefaults once Atom 1.13 is on stable
      hoverDelay = atom.tooltips.defaults.delay?.show ? atom.tooltips.hoverDefaults.delay.show
      element.dispatchEvent(new CustomEvent('mouseenter', bubbles: false))
      element.dispatchEvent(new CustomEvent('mouseover', bubbles: true))
      advanceClock(hoverDelay)
      fn()
      element.dispatchEvent(new CustomEvent('mouseleave', bubbles: false))
      element.dispatchEvent(new CustomEvent('mouseout', bubbles: true))
      advanceClock(hoverDelay)

    setupWorkingDir = (name) ->
      dir = atom.project.getDirectories()[0]
      target = "#{os.tmpdir()}/#{name}"
      targetGit = target + '/.git'
      fs.copySync(dir.resolve('git/working-dir'), path.resolve(target))
      fs.removeSync(path.resolve(targetGit))
      fs.copySync(dir.resolve("git/#{name}.git"), path.resolve(targetGit))
      target

    beforeEach ->
      [gitView] = statusBar.getRightTiles().map (tile) -> tile.getItem()

    describe "the git ahead/behind count labels", ->
      beforeEach ->
        jasmine.attachToDOM(workspaceElement)

      it "shows the number of commits that can be pushed/pulled", ->
        workingDir = setupWorkingDir('ahead-behind-repo')
        atom.project.setPaths([workingDir])
        filePath = atom.project.getDirectories()[0].resolve('a.txt')
        repo = atom.project.getRepositories()[0]

        waitsForPromise ->
          atom.workspace.open(filePath)
            .then -> repo.refreshStatus()

        runs ->
          behindElement = document.body.querySelector(".commits-behind-label")
          aheadElement = document.body.querySelector(".commits-ahead-label")
          expect(aheadElement).toBeVisible()
          expect(behindElement).toBeVisible()
          expect(aheadElement.textContent).toContain '1'

      it "stays hidden when no commits can be pushed/pulled", ->
        workingDir = setupWorkingDir('no-ahead-behind-repo')
        atom.project.setPaths([workingDir])
        filePath = atom.project.getDirectories()[0].resolve('a.txt')
        repo = atom.project.getRepositories()[0]

        waitsForPromise ->
          atom.workspace.open(filePath)
            .then -> repo.refreshStatus()

        runs ->
          behindElement = document.body.querySelector(".commits-behind-label")
          aheadElement = document.body.querySelector(".commits-ahead-label")
          expect(aheadElement).not.toBeVisible()
          expect(behindElement).not.toBeVisible()

    describe "the git branch label", ->
      projectPath = null
      beforeEach ->
        projectPath = atom.project.getDirectories()[0].resolve('git/working-dir')
        fs.moveSync(path.join(projectPath, 'git.git'), path.join(projectPath, '.git'))
        jasmine.attachToDOM(workspaceElement)

      afterEach ->
        fs.moveSync(path.join(projectPath, '.git'), path.join(projectPath, 'git.git'))

      it "displays the current branch for files in repositories", ->
        atom.project.setPaths([projectPath])

        waitsForPromise ->
          atom.workspace.open('a.txt')

        runs ->
          currentBranch = atom.project.getRepositories()[0].getShortHead()
          expect(gitView.branchArea).toBeVisible()
          expect(gitView.branchLabel.textContent).toBe currentBranch

          atom.workspace.getActivePane().destroyItems()
          expect(gitView.branchArea).toBeVisible()
          expect(gitView.branchLabel.textContent).toBe currentBranch

          atom.workspace.getActivePane().activateItem(dummyView)

        runs -> expect(gitView.branchArea).not.toBeVisible()

      it "displays the current branch tooltip", ->
        atom.project.setPaths([projectPath])

        waitsForPromise ->
          atom.workspace.open('a.txt')

        runs ->
          currentBranch = atom.project.getRepositories()[0].getShortHead()
          hover gitView.branchArea, ->
            expect(document.body.querySelector(".tooltip").innerText)
              .toBe("On branch #{currentBranch}")

      it "doesn't display the current branch for a file not in a repository", ->
        atom.project.setPaths([os.tmpdir()])

        waitsForPromise ->
          atom.workspace.open(path.join(os.tmpdir(), 'temp.txt'))

        runs ->
          expect(gitView.branchArea).toBeHidden()

      it "doesn't display the current branch for a file outside the current project", ->
        waitsForPromise ->
          atom.workspace.open(path.join(os.tmpdir(), 'atom-specs', 'not-in-project.txt'))

        runs ->
          expect(gitView.branchArea).toBeHidden()

    describe "the git status label", ->
      [repo, filePath, originalPathText, newPath, ignorePath, ignoredPath, projectPath] = []

      beforeEach ->
        projectPath = atom.project.getDirectories()[0].resolve('git/working-dir')
        fs.moveSync(path.join(projectPath, 'git.git'), path.join(projectPath, '.git'))
        atom.project.setPaths([projectPath])
        filePath = atom.project.getDirectories()[0].resolve('a.txt')
        newPath = atom.project.getDirectories()[0].resolve('new.txt')
        fs.writeFileSync(newPath, "I'm new here")
        ignorePath = path.join(projectPath, '.gitignore')
        fs.writeFileSync(ignorePath, 'ignored.txt')
        ignoredPath = path.join(projectPath, 'ignored.txt')
        fs.writeFileSync(ignoredPath, '')
        jasmine.attachToDOM(workspaceElement)

        repo = atom.project.getRepositories()[0]
        originalPathText = fs.readFileSync(filePath, 'utf8')
        waitsForPromise -> repo.refreshStatus()

      afterEach ->
        fs.writeFileSync(filePath, originalPathText)
        fs.removeSync(newPath)
        fs.removeSync(ignorePath)
        fs.removeSync(ignoredPath)
        fs.moveSync(path.join(projectPath, '.git'), path.join(projectPath, 'git.git'))

      it "displays the modified icon for a changed file", ->
        waitsForPromise ->
          atom.workspace.open(filePath)
            .then ->
              fs.writeFileSync(filePath, "i've changed for the worse")
              repo.refreshStatus()
        runs ->
          expect(gitView.gitStatusIcon).toHaveClass('icon-diff-modified')

      it "displays the 1 line added and not committed tooltip", ->
        waitsForPromise ->
          atom.workspace.open(filePath)
            .then ->
              fs.writeFileSync(filePath, "i've changed for the worse")
              repo.refreshStatus()

        runs ->
          hover gitView.gitStatusIcon, ->
            expect(document.body.querySelector(".tooltip").innerText)
              .toBe("1 line added to this file not yet committed")

      it "displays the x lines added and not committed tooltip", ->
        waitsForPromise ->
          atom.workspace.open(filePath)
            .then ->
              fs.writeFileSync(filePath, "i've changed#{os.EOL}for the worse")
              repo.refreshStatus()

        runs ->
          hover gitView.gitStatusIcon, ->
            expect(document.body.querySelector(".tooltip").innerText)
              .toBe("2 lines added to this file not yet committed")

      it "doesn't display the modified icon for an unchanged file", ->
        waitsForPromise ->
          atom.workspace.open(filePath)
            .then -> repo.refreshStatus()

        runs ->
          expect(gitView.gitStatusIcon).toHaveText('')

      it "displays the new icon for a new file", ->
        waitsForPromise ->
          atom.workspace.open(newPath)
            .then -> repo.refreshStatus()

        runs ->
          expect(gitView.gitStatusIcon).toHaveClass('icon-diff-added')
          hover gitView.gitStatusIcon, ->
            expect(document.body.querySelector(".tooltip").innerText)
              .toBe("1 line in this new file not yet committed")

      it "displays the 1 line added and not committed to new file tooltip", ->
        waitsForPromise ->
          atom.workspace.open(newPath)
            .then -> repo.refreshStatus()

        runs ->
          hover gitView.gitStatusIcon, ->
            expect(document.body.querySelector(".tooltip").innerText)
              .toBe("1 line in this new file not yet committed")

      it "displays the x lines added and not committed to new file tooltip", ->
        fs.writeFileSync(newPath, "I'm new#{os.EOL}here")
        waitsForPromise ->
          atom.workspace.open(newPath)
            .then -> repo.refreshStatus()

        runs ->
          hover gitView.gitStatusIcon, ->
            expect(document.body.querySelector(".tooltip").innerText)
              .toBe("2 lines in this new file not yet committed")

      it "displays the ignored icon for an ignored file", ->
        waitsForPromise ->
          atom.workspace.open(ignoredPath)

        runs ->
          expect(gitView.gitStatusIcon).toHaveClass('icon-diff-ignored')
          hover gitView.gitStatusIcon, ->
            expect(document.body.querySelector(".tooltip").innerText)
              .toBe("File is ignored by git")

      it "updates when a status-changed event occurs", ->
        waitsForPromise ->
          atom.workspace.open(filePath)
            .then ->
              fs.writeFileSync(filePath, "i've changed for the worse")
              repo.refreshStatus()
        runs ->
          expect(gitView.gitStatusIcon).toHaveClass('icon-diff-modified')

          waitsForPromise ->
            fs.writeFileSync(filePath, originalPathText)
            repo.refreshStatus()
          runs ->
            expect(gitView.gitStatusIcon).not.toHaveClass('icon-diff-modified')

      it "displays the diff stat for modified files", ->
        waitsForPromise ->
          atom.workspace.open(filePath)
            .then ->
              fs.writeFileSync(filePath, "i've changed for the worse")
              repo.refreshStatus()
        runs ->
          expect(gitView.gitStatusIcon).toHaveText('+1')

      it "displays the diff stat for new files", ->
        waitsForPromise ->
          atom.workspace.open(newPath)
            .then -> repo.refreshStatus()

        runs ->
          expect(gitView.gitStatusIcon).toHaveText('+1')

      it "does not display for files not in the current project", ->
        waitsForPromise ->
          atom.workspace.open('/tmp/atom-specs/not-in-project.txt')

        runs ->
          expect(gitView.gitStatusIcon).toBeHidden()
