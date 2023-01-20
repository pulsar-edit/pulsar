fs = require 'fs'
path = require 'path'
{shell} = require 'electron'

PackageDetailView = require '../lib/package-detail-view'
PackageManager = require '../lib/package-manager'
SettingsView = require '../lib/settings-view'
AtomIoClient = require '../lib/atom-io-client'
SnippetsProvider =
  getSnippets: -> {}

describe "PackageDetailView", ->
  packageManager = null
  view = null

  createClientSpy = ->
    jasmine.createSpyObj('client', ['package', 'avatar'])

  beforeEach ->
    packageManager = new PackageManager
    view = null

  loadPackageFromRemote = (packageName, opts) ->
    opts ?= {}
    packageManager.client = createClientSpy()
    packageManager.client.package.andCallFake (name, cb) ->
      packageData = require(path.join(__dirname, 'fixtures', packageName, 'package.json'))
      packageData.readme = fs.readFileSync(path.join(__dirname, 'fixtures', packageName, 'README.md'), 'utf8')
      cb(null, packageData)
    view = new PackageDetailView({name: packageName}, new SettingsView(), packageManager, SnippetsProvider)
    view.beforeShow(opts)

  loadCustomPackageFromRemote = (packageName, opts) ->
    opts ?= {}
    packageManager.client = createClientSpy()
    packageManager.client.package.andCallFake (name, cb) ->
      packageData = require(path.join(__dirname, 'fixtures', packageName, 'package.json'))
      cb(null, packageData)
    view = new PackageDetailView({name: packageName}, new SettingsView(), packageManager, SnippetsProvider)
    view.beforeShow(opts)

  it "renders a package when provided in `initialize`", ->
    atom.packages.loadPackage(path.join(__dirname, 'fixtures', 'package-with-config'))
    pack = atom.packages.getLoadedPackage('package-with-config')
    view = new PackageDetailView(pack, new SettingsView(), packageManager, SnippetsProvider)

    # Perhaps there are more things to assert here.
    expect(view.refs.title.textContent).toBe('Package With Config')

  it "does not call the atom.io api for package metadata when present", ->
    packageManager.client = createClientSpy()
    view = new PackageDetailView({name: 'package-with-config'}, new SettingsView(), packageManager, SnippetsProvider)

    # PackageCard is a subview, and it calls AtomIoClient::package once to load
    # metadata from the cache.
    expect(packageManager.client.package.callCount).toBe(1)

  it "shows a loading message and calls out to atom.io when package metadata is missing", ->
    loadPackageFromRemote('package-with-readme')
    expect(view.refs.loadingMessage).not.toBe(null)
    expect(view.refs.loadingMessage.classList.contains('hidden')).not.toBe(true)
    expect(packageManager.client.package).toHaveBeenCalled()

  it "shows an error when package metadata cannot be loaded via the API", ->
    packageManager.client = createClientSpy()
    packageManager.client.package.andCallFake (name, cb) ->
      error = new Error('API error')
      cb(error, null)

    view = new PackageDetailView({name: 'nonexistent-package'}, new SettingsView(), packageManager, SnippetsProvider)

    expect(view.refs.errorMessage.classList.contains('hidden')).not.toBe(true)
    expect(view.refs.loadingMessage.classList.contains('hidden')).toBe(true)
    expect(view.element.querySelectorAll('.package-card').length).toBe(0)

  it "shows an error when package metadata cannot be loaded from the cache and the network is unavailable", ->
    localStorage.removeItem('settings-view:packages/some-package')

    spyOn(AtomIoClient.prototype, 'online').andReturn(false)
    spyOn(AtomIoClient.prototype, 'request').andCallFake (path, callback) ->
      callback(new Error('getaddrinfo ENOENT atom.io:443'))
    spyOn(AtomIoClient.prototype, 'fetchFromCache').andCallThrough()

    view = new PackageDetailView({name: 'some-package'}, new SettingsView(), packageManager, SnippetsProvider)

    expect(AtomIoClient.prototype.fetchFromCache).toHaveBeenCalled()

    expect(view.refs.errorMessage.classList.contains('hidden')).not.toBe(true)
    expect(view.refs.loadingMessage.classList.contains('hidden')).toBe(true)
    expect(view.element.querySelectorAll('.package-card').length).toBe(0)

  it "renders the README successfully after a call to the atom.io api", ->
    loadPackageFromRemote('package-with-readme')
    expect(view.packageCard).toBeDefined()
    expect(view.packageCard.refs.packageName.textContent).toBe('package-with-readme')
    expect(view.element.querySelectorAll('.package-readme').length).toBe(1)

  it "renders the README successfully with sanitized html", ->
    loadPackageFromRemote('package-with-readme')
    expect(view.element.querySelectorAll('.package-readme script').length).toBe(0)
    expect(view.element.querySelectorAll('.package-readme iframe').length).toBe(0)
    expect(view.element.querySelectorAll('.package-readme input[type="checkbox"][disabled]').length).toBe(2)
    expect(view.element.querySelector('img[alt="AbsoluteImage"]').getAttribute('src')).toBe('https://example.com/static/image.jpg')
    expect(view.element.querySelector('img[alt="RelativeImage"]').getAttribute('src')).toBe('https://github.com/example/package-with-readme/blob/master/static/image.jpg')
    expect(view.element.querySelector('img[alt="Base64Image"]').getAttribute('src')).toBe('data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==')

  it "renders the README when the package path is undefined", ->
    atom.packages.loadPackage(path.join(__dirname, 'fixtures', 'package-with-readme'))
    pack = atom.packages.getLoadedPackage('package-with-readme')
    delete pack.path
    view = new PackageDetailView(pack, new SettingsView(), packageManager, SnippetsProvider)

    expect(view.packageCard).toBeDefined()
    expect(view.packageCard.refs.packageName.textContent).toBe('package-with-readme')
    expect(view.element.querySelectorAll('.package-readme').length).toBe(1)

  it "triggers a report issue button click and checks that the fallback repository issue tracker URL was opened", ->
    loadCustomPackageFromRemote('package-without-bugs-property')
    spyOn(shell, 'openExternal')
    view.refs.issueButton.click()
    expect(shell.openExternal).toHaveBeenCalledWith('https://github.com/example/package-without-bugs-property/issues/new')

  it "triggers a report issue button click and checks that the bugs URL string was opened", ->
    loadCustomPackageFromRemote('package-with-bugs-property-url-string')
    spyOn(shell, 'openExternal')
    view.refs.issueButton.click()
    expect(shell.openExternal).toHaveBeenCalledWith('https://example.com/custom-issue-tracker/new')

  it "triggers a report issue button click and checks that the bugs URL was opened", ->
    loadCustomPackageFromRemote('package-with-bugs-property-url')
    spyOn(shell, 'openExternal')
    view.refs.issueButton.click()
    expect(shell.openExternal).toHaveBeenCalledWith('https://example.com/custom-issue-tracker/new')

  it "triggers a report issue button click and checks that the bugs email link was opened", ->
    loadCustomPackageFromRemote('package-with-bugs-property-email')
    spyOn(shell, 'openExternal')
    view.refs.issueButton.click()
    expect(shell.openExternal).toHaveBeenCalledWith('mailto:issues@example.com')

  it "should show 'Install' as the first breadcrumb by default", ->
    loadPackageFromRemote('package-with-readme')
    expect(view.refs.breadcrumb.textContent).toBe('Install')

  it "should open repository url", ->
    loadPackageFromRemote('package-with-readme')
    spyOn(shell, 'openExternal')
    view.refs.packageRepo.click()
    expect(shell.openExternal).toHaveBeenCalledWith('https://github.com/example/package-with-readme')

  it "should open internal package repository url", ->
    loadPackageFromRemote('package-internal')
    spyOn(shell, 'openExternal')
    view.refs.packageRepo.click()
    expect(shell.openExternal).toHaveBeenCalledWith('https://github.com/pulsar-edit/pulsar/tree/master/packages/package-internal')
