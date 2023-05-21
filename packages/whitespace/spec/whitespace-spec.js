const path = require('path')
const fs = require('fs-plus')
const temp = require('temp')
const {it, fit, ffit, beforeEach} = require('./async-spec-helpers') // eslint-disable-line

describe('Whitespace', () => {
  let editor, buffer, workspaceElement

  beforeEach(async () => {
    const directory = temp.mkdirSync()
    atom.project.setPaths([directory])
    workspaceElement = atom.views.getView(atom.workspace)
    const filePath = path.join(directory, 'atom-whitespace.txt')
    fs.writeFileSync(filePath, '')
    fs.writeFileSync(path.join(directory, 'sample.txt'), 'Some text.\n')

    editor = await atom.workspace.open(filePath)
    buffer = editor.getBuffer()
    await atom.packages.activatePackage('whitespace')
  })

  describe('when the editor is destroyed', () => {
    beforeEach(() => editor.destroy())

    it('does not leak subscriptions', async () => {
      const {whitespace} = atom.packages.getActivePackage('whitespace').mainModule
      expect(whitespace.subscriptions.disposables.size).toBe(2)

      await atom.packages.deactivatePackage('whitespace')
      expect(whitespace.subscriptions.disposables).toBeNull()
    })
  })

  describe("when 'whitespace.removeTrailingWhitespace' is true", () => {
    beforeEach(() => atom.config.set('whitespace.removeTrailingWhitespace', true))

    it('strips trailing whitespace before an editor saves a buffer', async () => {
      // works for buffers that are already open when package is initialized
      editor.insertText('foo   \nbar\t   \n\nbaz\n')
      await editor.save()
      expect(editor.getText()).toBe('foo\nbar\n\nbaz\n')

      editor = await atom.workspace.open('sample.txt')

      editor.moveToEndOfLine()
      editor.insertText('           ')

      // move cursor to next line to avoid ignoreWhitespaceOnCurrentLine
      editor.moveToBottom()

      await editor.save()
      expect(editor.getText()).toBe('Some text.\n')
    })

    it('works for files with CRLF line endings', async () => {
      editor.insertText('foo   \r\nbar\t   \r\n\r\nbaz\r\n')
      await editor.save()
      expect(editor.getText()).toBe('foo\r\nbar\r\n\r\nbaz\r\n')
    })

    it('clears blank lines when the editor inserts a newline', () => {
      // Need autoIndent to be true
      editor.update({autoIndent: true})

      // Create an indent level and insert a newline
      editor.setIndentationForBufferRow(0, 1)
      editor.insertText('\n')
      expect(editor.getText()).toBe('\n  ')

      // Undo the newline insert and redo it
      editor.undo()
      expect(editor.getText()).toBe('  ')
      editor.redo()
      expect(editor.getText()).toBe('\n  ')

      // Test for multiple cursors, possibly without blank lines
      editor.insertText('foo')
      editor.insertText('\n')
      editor.setCursorBufferPosition([1, 5])    // Cursor after 'foo'
      editor.addCursorAtBufferPosition([2, 2])  // Cursor on the next line (blank)
      editor.insertText('\n')
      expect(editor.getText()).toBe('\n  foo\n  \n\n  ')
    })
  })

  describe("when 'whitespace.removeTrailingWhitespace' is false", () => {
    beforeEach(() => atom.config.set('whitespace.removeTrailingWhitespace', false))

    it('does not trim trailing whitespace', async () => {
      editor.insertText("don't trim me \n\n")
      await editor.save()
      expect(editor.getText()).toBe("don't trim me \n")
    })

    describe('when the setting is set scoped to the grammar', () => {
      beforeEach(() => {
        atom.config.set('whitespace.removeTrailingWhitespace', true)
        atom.config.set('whitespace.removeTrailingWhitespace', false, {scopeSelector: '.text.plain'})
      })

      it('does not trim trailing whitespace', async () => {
        editor.insertText("don't trim me \n\n")
        await editor.save()
        expect(editor.getText()).toBe("don't trim me \n")
      })
    })
  })

  describe("when 'whitespace.ignoreWhitespaceOnCurrentLine' is true", () => {
    beforeEach(() => atom.config.set('whitespace.ignoreWhitespaceOnCurrentLine', true))

    describe('respects multiple cursors', () => {
      it('removes the whitespace from all lines, excluding the current lines', async () => {
        editor.insertText('1  \n2  \n3  \n')
        editor.setCursorBufferPosition([1, 3])
        editor.addCursorAtBufferPosition([2, 3])
        await editor.save()
        expect(editor.getText()).toBe('1\n2  \n3  \n')
      })
    })

    describe('when buffer is opened in multiple editors', () => {
      let editor2
      beforeEach(async () => {
        editor2 = atom.workspace.buildTextEditor({buffer: editor.buffer})
        await atom.workspace.open(editor2)
      })

      it('[editor is activeEditor] remove WS with excluding active editor\'s cursor line', async () => {
        editor.insertText('1  \n2  \n3  \n')
        editor.setCursorBufferPosition([1, 3])
        editor2.setCursorBufferPosition([2, 3])

        atom.workspace.getActivePane().activateItem(editor)
        expect(atom.workspace.getActiveTextEditor()).toBe(editor)
        await editor.save()
        expect(editor.getText()).toBe('1\n2  \n3\n')
      })

      it('[editor2 is activeEditor] remove WS with excluding active editor\'s cursor line', async () => {
        editor.insertText('1  \n2  \n3  \n')
        editor.setCursorBufferPosition([1, 3])
        editor2.setCursorBufferPosition([2, 3])

        atom.workspace.getActivePane().activateItem(editor2)
        expect(atom.workspace.getActiveTextEditor()).toBe(editor2)
        await editor2.save()
        expect(editor.getText()).toBe('1\n2\n3  \n')
      })

      it('[either editor nor editor2 is activeEditor] remove WS but doesn\'t exclude cursor line for non active editor', async () => {
        editor.insertText('1  \n2  \n3  \n')
        editor.setCursorBufferPosition([1, 3])
        editor2.setCursorBufferPosition([1, 3])

        const editor3 = await atom.workspace.open()
        expect(atom.workspace.getActiveTextEditor()).toBe(editor3)
        await editor.save()
        expect(editor.getText()).toBe('1\n2\n3\n') // all trainling-WS were removed
      })
    })
  })

  describe("when 'whitespace.ignoreWhitespaceOnCurrentLine' is false", () => {
    beforeEach(() => atom.config.set('whitespace.ignoreWhitespaceOnCurrentLine', false))

    it('removes the whitespace from all lines, including the current lines', async () => {
      editor.insertText('1  \n2  \n3  \n')
      editor.setCursorBufferPosition([1, 3])
      editor.addCursorAtBufferPosition([2, 3])
      await editor.save()
      expect(editor.getText()).toBe('1\n2\n3\n')
    })
  })

  describe("when 'whitespace.ignoreWhitespaceOnlyLines' is false", () => {
    beforeEach(() => atom.config.set('whitespace.ignoreWhitespaceOnlyLines', false))

    it('removes the whitespace from all lines, including the whitespace-only lines', async () => {
      editor.insertText('1  \n2\t  \n\t \n3\n')

      // move cursor to bottom for preventing effect of whitespace.ignoreWhitespaceOnCurrentLine
      editor.moveToBottom()
      await editor.save()
      expect(editor.getText()).toBe('1\n2\n\n3\n')
    })
  })

  describe("when 'whitespace.ignoreWhitespaceOnlyLines' is true", () => {
    beforeEach(() => atom.config.set('whitespace.ignoreWhitespaceOnlyLines', true))

    it('removes the whitespace from all lines, excluding the whitespace-only lines', async () => {
      editor.insertText('1  \n2\t  \n\t \n3\n')

      // move cursor to bottom for preventing effect of whitespace.ignoreWhitespaceOnCurrentLine
      editor.moveToBottom()
      await editor.save()
      expect(editor.getText()).toBe('1\n2\n\t \n3\n')
    })
  })

  describe("when 'whitespace.ensureSingleTrailingNewline' is true", () => {
    beforeEach(() => atom.config.set('whitespace.ensureSingleTrailingNewline', true))

    it('adds a trailing newline when there is no trailing newline', async () => {
      editor.insertText('foo')
      await editor.save()
      expect(editor.getText()).toBe('foo\n')
    })

    it('removes extra trailing newlines and only keeps one', async () => {
      editor.insertText('foo\n\n\n\n')
      await editor.save()
      expect(editor.getText()).toBe('foo\n')
    })

    it('leaves a buffer with a single trailing newline untouched', async () => {
      editor.insertText('foo\nbar\n')
      await editor.save()
      expect(editor.getText()).toBe('foo\nbar\n')
    })

    it('leaves an empty buffer untouched', () => {
      editor.insertText('')
      editor.save()
      expect(editor.getText()).toBe('')
    })

    it('leaves a buffer that is a single newline untouched', () => {
      editor.insertText('\n')
      editor.save()
      expect(editor.getText()).toBe('\n')
    })

    it('does not move the cursor when the new line is added', async () => {
      editor.insertText('foo\nboo')
      editor.setCursorBufferPosition([0, 3])
      await editor.save()
      expect(editor.getText()).toBe('foo\nboo\n')
      expect(editor.getCursorBufferPosition()).toEqual([0, 3])
    })

    it('preserves selections when saving on last line', async () => {
      editor.insertText('foo')
      editor.setCursorBufferPosition([0, 0])
      editor.selectToEndOfLine()
      const originalSelectionRange = editor.getLastSelection().getBufferRange()
      await editor.save()
      const newSelectionRange = editor.getLastSelection().getBufferRange()
      expect(originalSelectionRange).toEqual(newSelectionRange)
    })
  })

  describe("when 'whitespace.ensureSingleTrailingNewline' is false", () => {
    beforeEach(() => atom.config.set('whitespace.ensureSingleTrailingNewline', false))

    it('does not add trailing newline if ensureSingleTrailingNewline is false', () => {
      editor.insertText('no trailing newline')
      editor.save()
      expect(editor.getText()).toBe('no trailing newline')
    })
  })

  describe('GFM whitespace trimming', () => {
    describe('when keepMarkdownLineBreakWhitespace is true', () => {
      beforeEach(() => {
        atom.config.set('whitespace.removeTrailingWhitespace', true)
        atom.config.set('whitespace.ignoreWhitespaceOnCurrentLine', false)
        atom.config.set('whitespace.keepMarkdownLineBreakWhitespace', true)

        waitsForPromise(() => atom.packages.activatePackage('language-gfm'))

        runs(() => editor.setGrammar(atom.grammars.grammarForScopeName('source.gfm')))
      })

      it('trims GFM text with a single space', async () => {
        editor.insertText('foo \nline break!')
        await editor.save()
        expect(editor.getText()).toBe('foo\nline break!\n')
      })

      it('leaves GFM text with double spaces alone', async () => {
        editor.insertText('foo  \nline break!')
        await editor.save()
        expect(editor.getText()).toBe('foo  \nline break!\n')
      })

      it('leaves GFM text with a more than two spaces', async () => {
        editor.insertText('foo   \nline break!')
        await editor.save()
        expect(editor.getText()).toBe('foo   \nline break!\n')
      })

      it('trims empty lines', async () => {
        editor.insertText('foo\n  ')
        await editor.save()
        expect(editor.getText()).toBe('foo\n')

        editor.setText('foo\n ')
        await editor.save()
        expect(editor.getText()).toBe('foo\n')
      })

      it("respects 'whitespace.ignoreWhitespaceOnCurrentLine' setting", async () => {
        atom.config.set('whitespace.ignoreWhitespaceOnCurrentLine', true)

        editor.insertText('foo \nline break!')
        editor.setCursorBufferPosition([0, 4])
        await editor.save()
        expect(editor.getText()).toBe('foo \nline break!\n')
      })

      it("respects 'whitespace.ignoreWhitespaceOnlyLines' setting", async () => {
        atom.config.set('whitespace.ignoreWhitespaceOnlyLines', true)

        editor.insertText('\t \nline break!')
        await editor.save()
        expect(editor.getText()).toBe('\t \nline break!\n')
      })
    })

    describe('when keepMarkdownLineBreakWhitespace is false', () => {
      beforeEach(() => {
        atom.config.set('whitespace.ignoreWhitespaceOnCurrentLine', false)
        atom.config.set('whitespace.keepMarkdownLineBreakWhitespace', false)

        waitsForPromise(() => atom.packages.activatePackage('language-gfm'))

        runs(() => editor.setGrammar(atom.grammars.grammarForScopeName('source.gfm')))
      })

      it('trims GFM text with a single space', async () => {
        editor.insertText('foo \nline break!')
        await editor.save()
        expect(editor.getText()).toBe('foo\nline break!\n')
      })

      it('trims GFM text with two spaces', async () => {
        editor.insertText('foo  \nline break!')
        await editor.save()
        expect(editor.getText()).toBe('foo\nline break!\n')
      })

      it('trims GFM text with a more than two spaces', async () => {
        editor.insertText('foo   \nline break!')
        await editor.save()
        expect(editor.getText()).toBe('foo\nline break!\n')
      })

      it('trims empty lines', async () => {
        editor.insertText('foo\n  ')
        await editor.save()
        expect(editor.getText()).toBe('foo\n')

        editor.setText('foo\n ')
        await editor.save()
        expect(editor.getText()).toBe('foo\n')
      })

      it("respects 'whitespace.ignoreWhitespaceOnCurrentLine' setting", async () => {
        atom.config.set('whitespace.ignoreWhitespaceOnCurrentLine', true)

        editor.insertText('foo \nline break!')
        editor.setCursorBufferPosition([0, 4])
        await editor.save()
        expect(editor.getText()).toBe('foo \nline break!\n')
      })

      it("respects 'whitespace.ignoreWhitespaceOnlyLines' setting", async () => {
        atom.config.set('whitespace.ignoreWhitespaceOnlyLines', true)

        editor.insertText('\t \nline break!')
        await editor.save()
        expect(editor.getText()).toBe('\t \nline break!\n')
      })
    })
  })

  describe('when the editor is split', () =>
    it('does not throw exceptions when the editor is saved after the split is closed (regression)', async () => {
      atom.workspace.getActivePane().splitRight({copyActiveItem: true})
      atom.workspace.getPanes()[0].destroyItems()

      editor = atom.workspace.getActivePaneItem()
      editor.setText('test')
      await editor.save()
      expect(editor.getText()).toBe('test\n')
    })
  )

  describe('when deactivated', () =>
    it('does not remove trailing whitespace from editors opened after deactivation', async () => {
      atom.config.set('whitespace.removeTrailingWhitespace', true)
      await atom.packages.deactivatePackage('whitespace')

      editor.setText('foo \n')
      await editor.save()
      expect(editor.getText()).toBe('foo \n')

      await atom.workspace.open('sample2.txt')

      editor = atom.workspace.getActiveTextEditor()
      editor.setText('foo \n')
      await editor.save()
      expect(editor.getText()).toBe('foo \n')
    })
  )

  describe("when the 'whitespace:remove-trailing-whitespace' command is run", () => {
    beforeEach(() => buffer.setText('foo   \nbar\t   \n\nbaz'))

    it('removes the trailing whitespace in the active editor', () => {
      atom.commands.dispatch(workspaceElement, 'whitespace:remove-trailing-whitespace')
      expect(buffer.getText()).toBe('foo\nbar\n\nbaz')
    })

    it('does not attempt to remove whitespace when the package is deactivated', async () => {
      await atom.packages.deactivatePackage('whitespace')
      expect(buffer.getText()).toBe('foo   \nbar\t   \n\nbaz')
    })
  })

  describe("when the 'whitespace:save-with-trailing-whitespace' command is run", () => {
    beforeEach(() => {
      atom.config.set('whitespace.removeTrailingWhitespace', true)
      atom.config.set('whitespace.ensureSingleTrailingNewline', false)
      buffer.setText('foo   \nbar\t   \n\nbaz')
    })

    it('saves the file without removing any trailing whitespace', () =>
      waitsFor((done) => {
        buffer.onDidSave(() => {
          expect(buffer.getText()).toBe('foo   \nbar\t   \n\nbaz')
          expect(buffer.isModified()).toBe(false)
          done()
        })
        atom.commands.dispatch(workspaceElement, 'whitespace:save-with-trailing-whitespace')
      })
    )
  })

  describe("when the 'whitespace:save-without-trailing-whitespace' command is run", () => {
    beforeEach(() => {
      atom.config.set('whitespace.removeTrailingWhitespace', false)
      atom.config.set('whitespace.ensureSingleTrailingNewline', false)
      buffer.setText('foo   \nbar\t   \n\nbaz')
    })

    it('saves the file and removes any trailing whitespace', () =>
      waitsFor(function (done) {
        buffer.onDidSave(() => {
          expect(buffer.getText()).toBe('foo\nbar\n\nbaz')
          expect(buffer.isModified()).toBe(false)
          done()
        })
        atom.commands.dispatch(workspaceElement, 'whitespace:save-without-trailing-whitespace')
      })
    )
  })

  describe("when the 'whitespace:convert-tabs-to-spaces' command is run", () => {
    it('removes leading \\t characters and replaces them with spaces using the configured tab length', () => {
      editor.setTabLength(2)
      buffer.setText('\ta\n\t\nb\t\nc\t\td')
      atom.commands.dispatch(workspaceElement, 'whitespace:convert-tabs-to-spaces')
      expect(buffer.getText()).toBe('  a\n  \nb\t\nc\t\td')

      editor.setTabLength(3)
      buffer.setText('\ta\n\t\nb\t\nc\t\td')
      atom.commands.dispatch(workspaceElement, 'whitespace:convert-tabs-to-spaces')
      expect(buffer.getText()).toBe('   a\n   \nb\t\nc\t\td')
    })

    it('changes the tab type to soft tabs', () => {
      atom.commands.dispatch(workspaceElement, 'whitespace:convert-tabs-to-spaces')
      expect(editor.getSoftTabs()).toBe(true)
    })
  })

  describe("when the 'whitespace:convert-spaces-to-tabs' command is run", () => {
    it('removes leading space characters and replaces them with hard tabs', () => {
      editor.setTabLength(2)
      buffer.setText('   a\n  \nb  \nc    d')
      atom.commands.dispatch(workspaceElement, 'whitespace:convert-spaces-to-tabs')
      expect(buffer.getText()).toBe('\t a\n\t\nb  \nc    d')

      editor.setTabLength(3)
      buffer.setText('     a\n   \nb   \nc      d')
      atom.commands.dispatch(workspaceElement, 'whitespace:convert-spaces-to-tabs')
      expect(buffer.getText()).toBe('\t  a\n\t\nb   \nc      d')
    })

    it('handles mixed runs of tabs and spaces correctly', () => {
      editor.setTabLength(4)
      buffer.setText('     \t    \t\ta   ')
      atom.commands.dispatch(workspaceElement, 'whitespace:convert-spaces-to-tabs')
      expect(buffer.getText()).toBe('\t\t\t\t\ta   ')
    })

    it('changes the tab type to hard tabs', () => {
      atom.commands.dispatch(workspaceElement, 'whitespace:convert-spaces-to-tabs')
      expect(editor.getSoftTabs()).toBe(false)
    })

    it("changes the tab length to user's tab-size", () => {
      editor.setTabLength(4)
      buffer.setText('    ')
      atom.commands.dispatch(workspaceElement, 'whitespace:convert-spaces-to-tabs')
      expect(editor.getTabLength()).toBe(2)
    })
  })

  describe("when the 'whitespace:convert-all-tabs-to-spaces' command is run", () => {
    it('removes all \\t characters and replaces them with spaces using the configured tab length', () => {
      editor.setTabLength(2)
      buffer.setText('\ta\n\t\nb\t\nc\t\td')
      atom.commands.dispatch(workspaceElement, 'whitespace:convert-all-tabs-to-spaces')
      expect(buffer.getText()).toBe('  a\n  \nb  \nc    d')

      editor.setTabLength(3)
      buffer.setText('\ta\n\t\nb\t\nc\t\td')
      atom.commands.dispatch(workspaceElement, 'whitespace:convert-all-tabs-to-spaces')
      expect(buffer.getText()).toBe('   a\n   \nb   \nc      d')
    })

    it('changes the tab type to soft tabs', () => {
      atom.commands.dispatch(workspaceElement, 'whitespace:convert-all-tabs-to-spaces')
      expect(editor.getSoftTabs()).toBe(true)
    })
  })
})
