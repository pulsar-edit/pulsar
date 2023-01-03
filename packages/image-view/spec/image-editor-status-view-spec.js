const {it, fit, ffit, beforeEach, afterEach, conditionPromise, emitterEventPromise} = require('./async-spec-helpers') // eslint-disable-line no-unused-vars

const fs = require('fs-plus')

describe('ImageEditorStatusView', () => {
  let filePath, filePath2, statusBar

  beforeEach(async () => {
    jasmine.useRealClock() // Needed for conditionPromise

    const workspaceElement = atom.views.getView(atom.workspace)
    filePath = atom.project.getDirectories()[0].resolve('binary-file.png')
    filePath2 = atom.project.getDirectories()[0].resolve('binary-file-2.png')
    jasmine.attachToDOM(workspaceElement)

    await atom.packages.activatePackage('image-view')
    await atom.packages.activatePackage('status-bar')
    statusBar = workspaceElement.querySelector('status-bar')
  })

  it('displays the size of the image', async () => {
    const editor = await atom.workspace.open(filePath)
    const view = editor.view
    view.element.style.height = '100px'

    await conditionPromise(() => view.loaded)

    const imageSizeStatus = statusBar.leftPanel.querySelector('.status-image')
    expect(imageSizeStatus.textContent).toBe('10x10 392B')
  })

  it('updates when a different image is opened', async () => {
    let editor = await atom.workspace.open(filePath)
    let view = editor.view
    view.element.style.height = '100px'

    await conditionPromise(() => view.loaded)

    let imageSizeStatus = statusBar.leftPanel.querySelector('.status-image')
    expect(imageSizeStatus.textContent).toBe('10x10 392B')

    editor = await atom.workspace.open(filePath2)
    view = editor.view
    view.element.style.height = '100px'

    await conditionPromise(() => view.loaded)

    imageSizeStatus = statusBar.leftPanel.querySelector('.status-image')
    expect(imageSizeStatus.textContent).toBe('10x10 498B')
  })

  it('updates when the image is reloaded', async () => {
    const editor = await atom.workspace.open(filePath)
    const view = editor.view
    view.element.style.height = '100px'

    await conditionPromise(() => view.loaded)

    let imageSizeStatus = statusBar.leftPanel.querySelector('.status-image')
    expect(imageSizeStatus.textContent).toBe('10x10 392B')

    spyOn(fs, 'statSync').andReturn({size: 300})
    editor.view.updateImageURI()

    await emitterEventPromise(editor.view.emitter, 'did-update')

    imageSizeStatus = statusBar.leftPanel.querySelector('.status-image')
    expect(imageSizeStatus.textContent).toBe('10x10 300B')
  })
})
