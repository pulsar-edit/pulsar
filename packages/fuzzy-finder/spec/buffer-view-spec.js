const {it, fit, ffit, fffit, beforeEach, afterEach} = require('./async-spec-helpers') // eslint-disable-line no-unused-vars
const path = require('path')
const temp = require('temp').track()
const BufferView = require('../lib/buffer-view')

describe('BufferView', () => {
  it('shows the avatar for editors that are remote', async () => {
    const bufferView = new BufferView({incrementCounter: () => {}})

    const localEditor1 = await atom.workspace.open(path.join(temp.path(), 'a'))
    const localEditor2 = await atom.workspace.open(path.join(temp.path(), 'b'))
    const remoteEditor1 = await atom.workspace.open(path.join(temp.path(), 'c'))
    remoteEditor1.getURI = () => 'remote1-uri'
    const fakeTeletypeService = {
      async getRemoteEditors () {
        return [
          {uri: 'remote1-uri', path: 'remote1-path', hostGitHubUsername: 'user-1'},
          {uri: 'remote2-uri', path: 'remote2-path', hostGitHubUsername: 'user-2'}
        ]
      }
    }
    bufferView.setTeletypeService(fakeTeletypeService)
    await bufferView.toggle()

    expect(bufferView.items).toEqual([
      {uri: localEditor1.getURI(), filePath: localEditor1.getPath(), label: localEditor1.getPath()},
      {uri: localEditor2.getURI(), filePath: localEditor2.getPath(), label: localEditor2.getPath()},
      {uri: 'remote1-uri', filePath: 'remote1-path', label: '@user-1: remote1-path', ownerGitHubUsername: 'user-1'}
    ])
  })
})
