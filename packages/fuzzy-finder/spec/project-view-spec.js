const {it, fit, ffit, fffit, beforeEach, afterEach, conditionPromise} = require('./async-spec-helpers')  // eslint-disable-line no-unused-vars
const fs = require('fs')
const os = require('os')
const path = require('path')
const sinon = require('sinon')
const temp = require('temp').track()
const ProjectView = require('../lib/project-view')
const ReporterProxy = require('../lib/reporter-proxy')

const metricsReporter = new ReporterProxy()

describe('ProjectView', () => {
  beforeEach(() => {
    jasmine.useRealClock()

    // Limit concurrency on the crawler to avoid indeterminism.
    sinon.stub(os, 'cpus').returns({length: 1})
  })

  afterEach(() => {
    os.cpus.restore()
  })

  it('includes remote editors when teletype is enabled', async () => {
    const projectView = new ProjectView([], metricsReporter)

    const projectPath = fs.realpathSync(temp.mkdirSync())
    const file1Path = path.join(projectPath, 'a')
    fs.writeFileSync(file1Path, 'a')
    const file2Path = path.join(projectPath, 'b')
    fs.writeFileSync(file2Path, 'b')
    atom.project.setPaths([projectPath])

    projectView.setTeletypeService({
      async getRemoteEditors () {
        return [
          {uri: 'remote1-uri', path: 'remote1-path', hostGitHubUsername: 'user-1'},
          {uri: 'remote2-uri', path: 'remote2-path', hostGitHubUsername: 'user-2'}
        ]
      }
    })

    projectView.toggle()
    await conditionPromise(() => projectView.items.length === 4)
    expect(projectView.items).toEqual([
      {uri: 'remote1-uri', filePath: 'remote1-path', label: '@user-1: remote1-path', ownerGitHubUsername: 'user-1'},
      {uri: 'remote2-uri', filePath: 'remote2-path', label: '@user-2: remote2-path', ownerGitHubUsername: 'user-2'},
      {uri: file1Path, filePath: file1Path, label: 'a'},
      {uri: file2Path, filePath: file2Path, label: 'b'}
    ])
  })

  it('shows remote editors even when there is no open project', async () => {
    const projectView = new ProjectView([], metricsReporter)

    atom.project.setPaths([])
    projectView.setTeletypeService({
      async getRemoteEditors () {
        return [
          {uri: 'remote1-uri', path: 'remote1-path', hostGitHubUsername: 'user-1'},
          {uri: 'remote2-uri', path: 'remote2-path', hostGitHubUsername: 'user-2'}
        ]
      }
    })

    await projectView.toggle()
    expect(projectView.items).toEqual([
      {uri: 'remote1-uri', filePath: 'remote1-path', label: '@user-1: remote1-path', ownerGitHubUsername: 'user-1'},
      {uri: 'remote2-uri', filePath: 'remote2-path', label: '@user-2: remote2-path', ownerGitHubUsername: 'user-2'}
    ])
  })

  it('gracefully defaults to empty list if teletype is unable to provide remote editors', async () => {
    const projectView = new ProjectView([], metricsReporter)

    atom.project.setPaths([])
    projectView.setTeletypeService({
      async getRemoteEditors () {
        return null
      }
    })

    await projectView.toggle()
    expect(projectView.items).toEqual([])
  })
})
