/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const path = require('path')
const fs = require('fs-plus')
const temp = require('temp').track()
const url = require('url')
const { TextEditor } = require('atom')
const MarkdownPreviewView = require('../lib/markdown-preview-view')
const TextMateLanguageMode = new TextEditor().getBuffer().getLanguageMode()
  .constructor
const { conditionPromise } = require('./async-spec-helpers')

describe('MarkdownPreviewView', function () {
  let preview = null

  beforeEach(async () => {
    // Makes _.debounce work
    jasmine.useRealClock()

    jasmine.unspy(TextMateLanguageMode.prototype, 'tokenizeInBackground')
    spyOn(atom.packages, 'hasActivatedInitialPackages').andReturn(true)

    const filePath = atom.project
      .getDirectories()[0]
      .resolve('subdir/file.markdown')

    preview = new MarkdownPreviewView({ filePath })
    jasmine.attachToDOM(preview.element)

    await atom.packages.activatePackage('language-ruby')
    await atom.packages.activatePackage('language-javascript')
    await atom.packages.activatePackage('markdown-preview')
  })

  afterEach(() => preview.destroy())

  describe('::constructor', function () {
    it('shows a loading spinner and renders the markdown', async () => {
      preview.showLoading()
      expect(preview.element.querySelector('.markdown-spinner')).toBeDefined()

      await preview.renderMarkdown()
      expect(preview.element.querySelector('.emoji')).toBeDefined()
    })

    it('shows an error message when there is an error', function () {
      preview.showError('Not a real file')
      expect(preview.element.textContent).toMatch('Failed')
    })

    it('rerenders the markdown and the scrollTop stays the same', async () => {
      await preview.renderMarkdown()

      preview.element.style.maxHeight = '10px'
      preview.element.scrollTop = 24
      expect(preview.element.scrollTop).toBe(24)

      await preview.renderMarkdown()
      expect(preview.element.scrollTop).toBe(24)
    })
  })

  describe('serialization', function () {
    let newPreview = null

    afterEach(function () {
      if (newPreview) {
        newPreview.destroy()
      }
    })

    it('recreates the preview when serialized/deserialized', function () {
      newPreview = atom.deserializers.deserialize(preview.serialize())
      jasmine.attachToDOM(newPreview.element)
      expect(newPreview.getPath()).toBe(preview.getPath())
    })

    it('does not recreate a preview when the file no longer exists', function () {
      const filePath = path.join(temp.mkdirSync('markdown-preview-'), 'foo.md')
      fs.writeFileSync(filePath, '# Hi')

      preview.destroy()
      preview = new MarkdownPreviewView({ filePath })
      const serialized = preview.serialize()
      fs.removeSync(filePath)

      newPreview = atom.deserializers.deserialize(serialized)
      expect(newPreview).toBeUndefined()
    })

    it('serializes the editor id when opened for an editor', async () => {
      preview.destroy()

      await atom.workspace.open('new.markdown')

      preview = new MarkdownPreviewView({
        editorId: atom.workspace.getActiveTextEditor().id
      })

      jasmine.attachToDOM(preview.element)
      expect(preview.getPath()).toBe(
        atom.workspace.getActiveTextEditor().getPath()
      )

      newPreview = atom.deserializers.deserialize(preview.serialize())
      jasmine.attachToDOM(newPreview.element)
      expect(newPreview.getPath()).toBe(preview.getPath())
    })
  })

  describe('code block conversion to atom-text-editor tags', function () {
    beforeEach(async () => {
      await preview.renderMarkdown()
    })

    it('removes line decorations on rendered code blocks', function () {
      const editor = preview.element.querySelector(
        "atom-text-editor[data-grammar='text plain null-grammar']"
      )
      const decorations = editor
        .getModel()
        .getDecorations({ class: 'cursor-line', type: 'line' })
      expect(decorations.length).toBe(0)
    })

    it('sets the editors as read-only', function () {
      preview.element
        .querySelectorAll('atom-text-editor')
        .forEach(editorElement =>
          expect(editorElement.getAttribute('tabindex')).toBeNull()
        )
    })

    describe("when the code block's fence name has a matching grammar", function () {
      it('assigns the grammar on the atom-text-editor', function () {
        const rubyEditor = preview.element.querySelector(
          "atom-text-editor[data-grammar='source ruby']"
        )
        expect(rubyEditor.getModel().getText()).toBe(`\
def func
  x = 1
end\
`)

        // nested in a list item
        const jsEditor = preview.element.querySelector(
          "atom-text-editor[data-grammar='source js']"
        )
        expect(jsEditor.getModel().getText()).toBe(`\
if a === 3 {
b = 5
}\
`)
      })
    })

    describe("when the code block's fence name doesn't have a matching grammar", function () {
      it('does not assign a specific grammar', function () {
        const plainEditor = preview.element.querySelector(
          "atom-text-editor[data-grammar='text plain null-grammar']"
        )
        expect(plainEditor.getModel().getText()).toBe(`\
function f(x) {
  return x++;
}\
`)
      })
    })

    describe('when an editor cannot find the grammar that is later loaded', () => {
      it('updates the editor grammar', async () => {
        let renderSpy = null

        if (typeof atom.grammars.onDidRemoveGrammar !== 'function') {
          // TODO: Remove once atom.grammars.onDidRemoveGrammar is released
          await atom.packages.activatePackage('language-gfm')
        }
        renderSpy = spyOn(preview, 'renderMarkdown').andCallThrough()

        await atom.packages.deactivatePackage('language-ruby')

        await conditionPromise(
          () => renderSpy.callCount === 1,
          'renderMarkdown to be called after disabling a language'
        )

        await conditionPromise(
          () => {
            let rubyEditor = preview.element.querySelector(
              "atom-text-editor[data-grammar='source ruby']"
            )
            return rubyEditor == null
          },
          'atom-text-editor to reassign all language modes after re-render'
        )

        await atom.packages.activatePackage('language-ruby')

        await conditionPromise(
          () => renderSpy.callCount === 2,
          'renderMarkdown to be called after enabling a language'
        )

        const rubyEditor = preview.element.querySelector(
          "atom-text-editor[data-grammar='source ruby']"
        )
        expect(rubyEditor.getModel().getText()).toBe(`\
def func
  x = 1
end\
`)
      })
    })
  })

  describe('image resolving', function () {
    beforeEach(async () => {
      await preview.renderMarkdown()
    })

    describe('when the image uses a relative path', function () {
      it('resolves to a path relative to the file', function () {
        const image = preview.element.querySelector('img[alt=Image1]')
        expect(image.getAttribute('src')).toBe(
          atom.project.getDirectories()[0].resolve('subdir/image1.png')
        )
      })
    })

    describe('when the image uses an absolute path that does not exist', function () {
      it('resolves to a path relative to the project root', function () {
        const image = preview.element.querySelector('img[alt=Image2]')
        expect(image.src).toMatch(
          url.parse(atom.project.getDirectories()[0].resolve('tmp/image2.png'))
        )
      })
    })

    describe('when the image uses an absolute path that exists', function () {
      it("doesn't change the URL when allowUnsafeProtocols is true", async () => {
        preview.destroy()

        atom.config.set('markdown-preview.allowUnsafeProtocols', true)

        const filePath = path.join(temp.mkdirSync('atom'), 'foo.md')
        fs.writeFileSync(filePath, `![absolute](${filePath})`)
        preview = new MarkdownPreviewView({ filePath })
        jasmine.attachToDOM(preview.element)

        await preview.renderMarkdown()

        expect(
          preview.element.querySelector('img[alt=absolute]').src
        ).toMatch(url.parse(filePath))
      })
    })

    it('removes the URL when allowUnsafeProtocols is false', async () => {
      preview.destroy()

      atom.config.set('markdown-preview.allowUnsafeProtocols', false)

      const filePath = path.join(temp.mkdirSync('atom'), 'foo.md')
      fs.writeFileSync(filePath, `![absolute](${filePath})`)
      preview = new MarkdownPreviewView({ filePath })
      jasmine.attachToDOM(preview.element)

      await preview.renderMarkdown()

      expect(preview.element.querySelector('img[alt=absolute]').src).toMatch(
        ''
      )
    })

    describe('when the image uses a web URL', function () {
      it("doesn't change the URL", function () {
        const image = preview.element.querySelector('img[alt=Image3]')
        expect(image.src).toBe('http://github.com/image3.png')
      })
    })
  })

  describe('gfm newlines', function () {
    describe('when gfm newlines are not enabled', function () {
      it('creates a single paragraph with <br>', async () => {
        atom.config.set('markdown-preview.breakOnSingleNewline', false)

        await preview.renderMarkdown();

        expect(
          preview.element.querySelectorAll('p:last-child br').length
        ).toBe(0)
      })
    })

    describe('when gfm newlines are enabled', function () {
      it('creates a single paragraph with no <br>', async () => {
        atom.config.set('markdown-preview.breakOnSingleNewline', true)

        await preview.renderMarkdown();

        expect(
          preview.element.querySelectorAll('p:last-child br').length
        ).toBe(1)
      })
    })
  })

  describe('yaml front matter', function () {
    it('creates a table with the YAML variables', async () => {
      atom.config.set('markdown-preview.breakOnSingleNewline', true)

      await preview.renderMarkdown();

      expect(
        [...preview.element.querySelectorAll('table th')].map(
          el => el.textContent
        )
      ).toEqual(['variable1', 'array', 'object', 'key'])
      expect(
        [...preview.element.querySelectorAll('table td')].map(
          el => el.textContent
        )
      ).toEqual(['value1', 'foo,bar', 'keyvalue2', 'value2'])
    })
  })

  describe('text selections', function () {
    it('adds the `has-selection` class to the preview depending on if there is a text selection', async () => {
      jasmine.useRealClock();
      expect(preview.element.classList.contains('has-selection')).toBe(false)
      await conditionPromise(() => document.querySelector('atom-text-editor'));
      const selection = window.getSelection()
      selection.removeAllRanges()
      selection.selectAllChildren(document.querySelector('atom-text-editor'))

      await conditionPromise(
        () => preview.element.classList.contains('has-selection') === true
      )

      selection.removeAllRanges()

      await conditionPromise(
        () => preview.element.classList.contains('has-selection') === false
      )
    })
  })

  describe('when core:save-as is triggered', function () {
    beforeEach(async () => {
      jasmine.useRealClock()
      preview.destroy()
      const filePath = atom.project
        .getDirectories()[0]
        .resolve('subdir/code-block.md')
      preview = new MarkdownPreviewView({ filePath })
      // Add to workspace for core:save-as command to be propagated up to the workspace
      await atom.workspace.open(preview)
      jasmine.attachToDOM(atom.views.getView(atom.workspace))
    })

    it('saves the rendered HTML and opens it', async () => {
      const outputPath = fs.realpathSync(temp.mkdirSync()) + 'output.html'

      const createRule = (selector, css) => ({
        selectorText: selector,
        cssText: `${selector} ${css}`
      })
      const markdownPreviewStyles = [
        {
          rules: [createRule('.markdown-preview', '{ color: orange; }')]
        },
        {
          rules: [
            createRule('.not-included', '{ color: green; }'),
            createRule('.markdown-preview :host', '{ color: purple; }')
          ]
        }
      ]

      const atomTextEditorStyles = [
        'atom-text-editor .line { color: brown; }\natom-text-editor .number { color: cyan; }',
        'atom-text-editor :host .something { color: black; }',
        'atom-text-editor .hr { background: url(atom://markdown-preview/assets/hr.png); }'
      ]

      await preview.renderMarkdown();

      expect(fs.isFileSync(outputPath)).toBe(false)
      spyOn(preview, 'getSaveDialogOptions').andReturn({
        defaultPath: outputPath
      })
      spyOn(atom.applicationDelegate, 'showSaveDialog').andCallFake(function (
        options,
        callback
      ) {
        if (typeof callback === 'function') {
          callback(options.defaultPath)
        }
        // TODO: When https://github.com/atom/atom/pull/16245 lands remove the return
        // and the existence check on the callback
        return options.defaultPath
      })
      spyOn(preview, 'getDocumentStyleSheets').andReturn(
        markdownPreviewStyles
      )
      spyOn(preview, 'getTextEditorStyles').andReturn(atomTextEditorStyles)

      await atom.commands.dispatch(preview.element, 'core:save-as')

      await conditionPromise(() => {
        const activeEditor = atom.workspace.getActiveTextEditor()
        return activeEditor && activeEditor.getPath() === outputPath
      })

      const element = document.createElement('div')
      element.innerHTML = fs.readFileSync(outputPath)
      expect(element.querySelector('h1').innerText).toBe('Code Block')
      expect(
        element.querySelector(
          '.line .syntax--source.syntax--js .syntax--constant.syntax--numeric'
        ).innerText
      ).toBe('3')
      expect(
        element.querySelector(
          '.line .syntax--source.syntax--js .syntax--keyword.syntax--control'
        ).innerText
      ).toBe('if')
      expect(
        element.querySelector(
          '.line .syntax--source.syntax--js .syntax--constant.syntax--numeric'
        ).innerText
      ).toBe('3')
    })

    describe('text editor style extraction', function () {
      let [extractedStyles] = []

      const textEditorStyle = '.editor-style .extraction-test { color: blue; }'
      const unrelatedStyle = '.something else { color: red; }'

      beforeEach(function () {
        atom.styles.addStyleSheet(textEditorStyle, {
          context: 'atom-text-editor'
        })

        atom.styles.addStyleSheet(unrelatedStyle, {
          context: 'unrelated-context'
        })

        return (extractedStyles = preview.getTextEditorStyles())
      })

      it('returns an array containing atom-text-editor css style strings', function () {
        expect(extractedStyles.indexOf(textEditorStyle)).toBeGreaterThan(-1)
      })

      it('does not return other styles', function () {
        expect(extractedStyles.indexOf(unrelatedStyle)).toBe(-1)
      })
    })
  })

  describe('when core:copy is triggered', function () {
    beforeEach(async () => {
      preview.destroy()
      preview.element.remove()

      const filePath = atom.project
        .getDirectories()[0]
        .resolve('subdir/code-block.md')
      preview = new MarkdownPreviewView({ filePath })
      jasmine.attachToDOM(preview.element)

      await preview.renderMarkdown();
    })

    describe('when there is no text selected', function () {
      it('copies the rendered HTML of the entire Markdown document to the clipboard', async () => {
        expect(atom.clipboard.read()).toBe('initial clipboard content')

        await atom.commands.dispatch(preview.element, 'core:copy')

        const element = document.createElement('div')
        element.innerHTML = atom.clipboard.read()
        expect(element.querySelector('h1').innerText).toBe('Code Block')
        expect(
          element.querySelector(
            '.line .syntax--source.syntax--js .syntax--constant.syntax--numeric'
          ).innerText
        ).toBe('3')
        expect(
          element.querySelector(
            '.line .syntax--source.syntax--js .syntax--keyword.syntax--control'
          ).innerText
        ).toBe('if')
        expect(
          element.querySelector(
            '.line .syntax--source.syntax--js .syntax--constant.syntax--numeric'
          ).innerText
        ).toBe('3')
      })
    })

    describe('when there is a text selection', function () {
      it('directly copies the selection to the clipboard', function () {
        const selection = window.getSelection()
        selection.removeAllRanges()
        const range = document.createRange()
        range.setStart(document.querySelector('atom-text-editor'), 0)
        range.setEnd(document.querySelector('p').firstChild, 3)
        selection.addRange(range)

        atom.commands.dispatch(preview.element, 'core:copy')
        const clipboardText = atom.clipboard.read()

        expect(clipboardText).toBe(`\
if a === 3 {
  b = 5
}

enc\
`)
      })
    })
  })

  describe('when markdown-preview:select-all is triggered', () => {
    it('selects the entire Markdown preview', async () => {
      const filePath = atom.project
        .getDirectories()[0]
        .resolve('subdir/code-block.md')
      const preview2 = new MarkdownPreviewView({ filePath })
      jasmine.attachToDOM(preview2.element)

      await preview.renderMarkdown();

      {
        atom.commands.dispatch(preview.element, 'markdown-preview:select-all')
        const { commonAncestorContainer } = window.getSelection().getRangeAt(0)
        expect(commonAncestorContainer).toEqual(preview.element)
      }

      await preview2.renderMarkdown();

      {
        atom.commands.dispatch(preview2.element, 'markdown-preview:select-all')
        const selection = window.getSelection()
        expect(selection.rangeCount).toBe(1)
        const { commonAncestorContainer } = selection.getRangeAt(0)
        expect(commonAncestorContainer).toEqual(preview2.element)
      }
    })
  })

  describe('when markdown-preview:zoom-in or markdown-preview:zoom-out are triggered', function () {
    it('increases or decreases the zoom level of the markdown preview element', async () => {
      jasmine.attachToDOM(preview.element)

      await preview.renderMarkdown();

      const originalZoomLevel = getComputedStyle(preview.element).zoom
      atom.commands.dispatch(preview.element, 'markdown-preview:zoom-in')
      expect(getComputedStyle(preview.element).zoom).toBeGreaterThan(
        originalZoomLevel
      )
      atom.commands.dispatch(preview.element, 'markdown-preview:zoom-out')
      expect(getComputedStyle(preview.element).zoom).toBe(originalZoomLevel)
    })
  })

  describe('when GitHub styles are enabled', () => {
    beforeEach(() => {
      atom.config.set('markdown-preview.useGitHubStyle', true)
      atom.config.set('markdown-preview.gitHubStyleMode', 'light')
    })

    it('uses the GitHub styles', async () => {
      jasmine.attachToDOM(preview.element)

      // It's possible that these values will need to change when the GitHub
      // CSS is updated.
      const expectedColors = {
        light: `rgb(31, 35, 40)`,
        dark: `rgb(230, 237, 243)`
      }

      await preview.renderMarkdown();

      // Perform some basic sanity checks about these modes.
      expect(preview.element.dataset.useGithubStyle).toBe('light')
      let paragraph = preview.element.querySelector('p')
      expect(getComputedStyle(paragraph).color).toBe(expectedColors.light)

      atom.config.set('markdown-preview.gitHubStyleMode', 'dark')
      expect(preview.element.dataset.useGithubStyle).toBe('dark')
      expect(getComputedStyle(paragraph).color).toBe(expectedColors.dark)

      atom.config.set('markdown-preview.gitHubStyleMode', 'auto')
      expect(preview.element.dataset.useGithubStyle).toBe('auto')
      // We don't know which mode will be preferred on the system we're running
      // on, but as a sanity check we can at least verify that the style value
      // is one of the two values we just asserted.
      expect([expectedColors.light, expectedColors.dark]).toContain(getComputedStyle(paragraph).color)
    })
  })
})
