const {it, fit, ffit, beforeEach, afterEach} = require('./async-spec-helpers') // eslint-disable-line no-unused-vars

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
  })
})
