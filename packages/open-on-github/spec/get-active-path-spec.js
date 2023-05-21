const path = require('path')
const getActivePath = require('../lib/get-active-path')

const { it, fit, beforeEach, afterEach } = require('./async-spec-helpers') // eslint-disable-line no-unused-vars

const projectPath = path.resolve(__dirname, './fixtures/project/')
const file1 = path.resolve(__dirname, './fixtures/project/file1.txt')
const file2 = path.resolve(__dirname, './fixtures/project/file2.txt')
const img1 = path.resolve(__dirname, './fixtures/project/img1.png')

describe('getActivePath', function () {
  let workspaceElement
  beforeEach(async function () {
    workspaceElement = atom.views.getView(atom.workspace)
    await atom.packages.activatePackage('tabs')
    await atom.packages.activatePackage('tree-view')
    atom.project.setPaths([projectPath])
  })

  it('returns project path when no target', function () {
    const itemPath = getActivePath()
    expect(itemPath).toBe(projectPath)
  })

  it('returns project path when nothing open', function () {
    const itemPath = getActivePath(workspaceElement)
    expect(itemPath).toBe(projectPath)
  })

  it('returns active file path when workspace is selected', async function () {
    await atom.workspace.open(file1)
    await atom.workspace.open(file2)

    const itemPath = getActivePath(workspaceElement)
    expect(itemPath).toBe(file2)
  })

  it('returns file path when tree view is selected', async function () {
    await atom.workspace.open(file1)
    await atom.workspace.open(file2)

    const { treeView } = atom.packages.getLoadedPackage('tree-view').mainModule
    const file1Target = treeView.selectEntryForPath(file1)

    const itemPath = getActivePath(file1Target)
    expect(itemPath).toBe(file1)
  })

  it('returns file path when tab is selected', async function () {
    await atom.workspace.open(file1)
    await atom.workspace.open(file2)
    const file1Target = workspaceElement.querySelector(".tab-bar [data-name='file1.txt']")

    const itemPath = getActivePath(file1Target)
    expect(itemPath).toBe(file1)
  })

  it('returns project when active pane is not a file', async function () {
    await atom.packages.activatePackage('settings-view')
    await atom.workspace.open(file1)
    await atom.workspace.open('atom://config')

    const itemPath = getActivePath(workspaceElement)
    expect(itemPath).toBe(projectPath)
  })

  it('returns active pane path when it is not a text file', async function () {
    await atom.packages.activatePackage('image-view')
    await atom.workspace.open(file1)
    await atom.workspace.open(img1)

    const itemPath = getActivePath(workspaceElement)
    expect(itemPath).toBe(img1)
  })
})
