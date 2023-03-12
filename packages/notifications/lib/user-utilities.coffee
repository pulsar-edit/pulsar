os = require 'os'
fs = require 'fs'
path = require 'path'
semver = require 'semver'
{BufferedProcess} = require 'atom'

###
A collection of methods for retrieving information about the user's system for
bug report purposes.
###

DEV_PACKAGE_PATH = path.join('dev', 'packages')

module.exports =

  ###
  Section: System Information
  ###

  getPlatform: ->
    os.platform()

  # OS version strings lifted from https://github.com/lee-dohm/bug-report
  getOSVersion: ->
    new Promise (resolve, reject) =>
      switch @getPlatform()
        when 'darwin' then resolve(@macVersionText())
        when 'win32' then resolve(@winVersionText())
        when 'linux' then resolve(@linuxVersionText())
        else resolve("#{os.platform()} #{os.release()}")

  macVersionText: ->
    @macVersionInfo().then (info) ->
      return 'Unknown macOS version' unless info.ProductName and info.ProductVersion
      "#{info.ProductName} #{info.ProductVersion}"

  macVersionInfo: ->
    new Promise (resolve, reject) ->
      stdout = ''
      plistBuddy = new BufferedProcess
        command: '/usr/libexec/PlistBuddy'
        args: [
          '-c'
          'Print ProductVersion'
          '-c'
          'Print ProductName'
          '/System/Library/CoreServices/SystemVersion.plist'
        ]
        stdout: (output) -> stdout += output
        exit: ->
          [ProductVersion, ProductName] = stdout.trim().split('\n')
          resolve({ProductVersion, ProductName})

      plistBuddy.onWillThrowError ({handle}) ->
        handle()
        resolve({})

  linuxVersionText: ->
    @linuxVersionInfo().then (info) ->
      if info.DistroName and info.DistroVersion
        "#{info.DistroName} #{info.DistroVersion}"
      else
        "#{os.platform()} #{os.release()}"

  linuxVersionInfo: ->
    new Promise (resolve, reject) ->
      stdout = ''

      lsbRelease = new BufferedProcess
        command: 'lsb_release'
        args: ['-ds']
        stdout: (output) -> stdout += output
        exit: (exitCode) ->
          [DistroName, DistroVersion] = stdout.trim().split(' ')
          resolve({DistroName, DistroVersion})

      lsbRelease.onWillThrowError ({handle}) ->
        handle()
        resolve({})

  winVersionText: ->
    new Promise (resolve, reject) ->
      data = []
      systemInfo = new BufferedProcess
        command: 'systeminfo'
        stdout: (oneLine) -> data.push(oneLine)
        exit: ->
          info = data.join('\n')
          info = if (res = /OS.Name.\s+(.*)$/im.exec(info)) then res[1] else 'Unknown Windows version'
          resolve(info)

      systemInfo.onWillThrowError ({handle}) ->
        handle()
        resolve('Unknown Windows version')

  ###
  Section: Installed Packages
  ###

  getNonCorePackages: ->
    new Promise (resolve, reject) ->
      nonCorePackages = atom.packages.getAvailablePackageMetadata().filter((p) -> not atom.packages.isBundledPackage(p.name))
      devPackageNames = atom.packages.getAvailablePackagePaths().filter((p) -> p.includes(DEV_PACKAGE_PATH)).map((p) -> path.basename(p))
      resolve("#{pack.name} #{pack.version} #{if pack.name in devPackageNames then '(dev)' else ''}" for pack in nonCorePackages)

  getLatestAtomData: ->
    githubHeaders = new Headers({
      accept: 'application/vnd.github.v3+json',
      contentType: "application/json"
    })
    fetch 'https://api.pulsar-edit.dev/api/updates', {headers: githubHeaders}
      .then (r) -> if r.ok then r.json() else Promise.reject new Error "Fetching updates resulted in status #{r.status}"

  checkAtomUpToDate: ->
    @getLatestAtomData().then (latestAtomData) ->
      installedVersion = atom.getVersion()?.replace(/-.*$/, '')
      latestVersion = latestAtomData.name
      upToDate = installedVersion? and semver.gte(installedVersion, latestVersion)
      {upToDate, latestVersion, installedVersion}

  getPackageVersion: (packageName) ->
    pack = atom.packages.getLoadedPackage(packageName)
    pack?.metadata.version

  getPackageVersionShippedWithAtom: (packageName) ->
    require(path.join(atom.getLoadSettings().resourcePath, 'package.json')).packageDependencies[packageName]

  getLatestPackageData: (packageName) ->
    githubHeaders = new Headers({
      accept: 'application/vnd.github.v3+json',
      contentType: "application/json"
    })
    fetch "https://api.pulsar-edit.dev/api/packages/#{packageName}", {headers: githubHeaders}
      .then (r) -> if r.ok then r.json() else Promise.reject new Error "Fetching package resulted in status #{r.status}"

  checkPackageUpToDate: (packageName) ->
    @getLatestPackageData(packageName).then (latestPackageData) =>
      installedVersion = @getPackageVersion(packageName)
      upToDate = installedVersion? and semver.gte(installedVersion, latestPackageData.releases.latest)
      latestVersion = latestPackageData.releases.latest
      versionShippedWithAtom = @getPackageVersionShippedWithAtom(packageName)

      if isCore = versionShippedWithAtom?
        # A core package is out of date if the version which is being used
        # is lower than the version which normally ships with the version
        # of Atom which is running. This will happen when there's a locally
        # installed version of the package with a lower version than Atom's.
        upToDate = installedVersion? and semver.gte(installedVersion, versionShippedWithAtom)

      {isCore, upToDate, latestVersion, installedVersion, versionShippedWithAtom}
