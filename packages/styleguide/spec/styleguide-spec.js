const {it, fit, ffit, beforeEach, afterEach} = require('./async-spec-helpers') // eslint-disable-line no-unused-vars

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('Style Guide', () => {
  beforeEach(async () => {
    await atom.packages.activatePackage('styleguide')
  })

  describe('the Styleguide view', () => {
    let styleGuideView
    beforeEach(async () => {
      styleGuideView = await atom.workspace.open('atom://styleguide')
    })

    it('opens the style guide', () => {
      expect(styleGuideView.element.textContent).toContain('Styleguide')
    })

    it('assigns a grammar to its editors even if present before the correct grammar is added', async () => {
      jasmine.useRealClock();
      await wait(100);
      let editor = styleGuideView.element.querySelector('atom-text-editor')
      let te = editor.getModel();
      expect(te.getGrammar()?.scopeName).toBe('text.plain.null-grammar');

      await atom.packages.activatePackage('language-html')
      await wait(100);

      expect(te.getGrammar()?.scopeName).toBe('text.html.basic');
    })
  })
})
