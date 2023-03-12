fs = require 'fs-plus'
path = require 'path'
StackTraceParser = require 'stacktrace-parser'

CommandLogger = require './command-logger'
UserUtilities = require './user-utilities'

TITLE_CHAR_LIMIT = 100 # Truncate issue title to 100 characters (including ellipsis)

FileURLRegExp = new RegExp('file://\w*/(.*)')

module.exports =
class NotificationIssue
  constructor: (@notification) ->

  findSimilarIssues: ->
    repoUrl = @getRepoUrl()
    repoUrl = 'pulsar-edit/pulsar' unless repoUrl?
    repo = repoUrl.replace /http(s)?:\/\/(\d+\.)?github.com\//gi, ''
    issueTitle = @getIssueTitle()
    query = "#{issueTitle} repo:#{repo}"
    githubHeaders = new Headers({
      accept: 'application/vnd.github.v3+json'
      contentType: "application/json"
    })

    fetch "https://api.github.com/search/issues?q=#{encodeURIComponent(query)}&sort=created", {headers: githubHeaders}
      .then (r) -> r?.json()
      .then (data) ->
        if data?.items?
          issues = {}
          for issue in data.items
            if issue.title.indexOf(issueTitle) > -1 and not issues[issue.state]?
              issues[issue.state] = issue
              return issues if issues.open? and issues.closed?

          return issues if issues.open? or issues.closed?
        null
      .catch (e) -> null

  getIssueUrlForSystem: ->
    # Windows will not launch URLs greater than ~2000 bytes so we need to shrink it
    # Also is.gd has a limit of 5000 bytes...
    @getIssueUrl().then (issueUrl) ->
      fetch "https://is.gd/create.php?format=simple", {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: "url=#{encodeURIComponent(issueUrl)}"
      }
      .then (r) -> r.text()
      .catch (e) -> null

  getIssueUrl: ->
    @getIssueBody().then (issueBody) =>
      repoUrl = @getRepoUrl()
      repoUrl = 'https://github.com/pulsar-edit/pulsar' unless repoUrl?
      "#{repoUrl}/issues/new?title=#{@encodeURI(@getIssueTitle())}&body=#{@encodeURI(issueBody)}"

  encodeURI: (str) ->
    encodeURI(str).replace(/#/g, '%23').replace(/;/g, '%3B').replace(/%20/g, '+')

  getIssueTitle: ->
    title = @notification.getMessage()
    title = title.replace(process.env.ATOM_HOME, '$ATOM_HOME')
    if process.platform is 'win32'
      title = title.replace(process.env.USERPROFILE, '~')
      title = title.replace(path.sep, path.posix.sep) # Standardize issue titles
    else
      title = title.replace(process.env.HOME, '~')

    if title.length > TITLE_CHAR_LIMIT
      title = title.substring(0, TITLE_CHAR_LIMIT - 3) + '...'
    title.replace(/\r?\n|\r/g, "")

  getIssueBody: ->
    new Promise (resolve, reject) =>
      return resolve(@issueBody) if @issueBody
      systemPromise = UserUtilities.getOSVersion()
      nonCorePackagesPromise = UserUtilities.getNonCorePackages()

      Promise.all([systemPromise, nonCorePackagesPromise]).then (all) =>
        [systemName, nonCorePackages] = all

        message = @notification.getMessage()
        options = @notification.getOptions()
        repoUrl = @getRepoUrl()
        packageName = @getPackageName()
        packageVersion = atom.packages.getLoadedPackage(packageName)?.metadata?.version if packageName?
        copyText = ''
        systemUser = process.env.USER
        rootUserStatus = ''

        if systemUser is 'root'
          rootUserStatus = '**User**: root'

        if packageName? and repoUrl?
          packageMessage = "[#{packageName}](#{repoUrl}) package #{packageVersion}"
        else if packageName?
          packageMessage = "'#{packageName}' package v#{packageVersion}"
        else
          packageMessage = 'Pulsar Core'

        @issueBody = """
          <!--
          Have you read Pulsar's Code of Conduct? By filing an Issue, you are expected to comply with it, including treating everyone with respect: https://pulsar-edit.dev/docs/resources/conduct/

          Do you want to ask a question? Are you looking for support? See our community areas to get in contact: https://pulsar-edit.dev/community.html
          -->

          ### Prerequisites

          * [ ] Put an X between the brackets on this line if you have done all of the following:
              * Reproduced the problem in Safe Mode: <https://pulsar-edit.dev/docs/atom-archive/faq/sections/what-does-safe-mode-do.html/#using-safe-mode>
              * Followed all applicable steps in the debugging guide: <https://pulsar-edit.dev/docs/atom-archive/hacking-atom/#debugging/>
              * Checked the FAQs on the message board for common solutions: <https://pulsar-edit.dev/docs/launch-manual/sections/faq/>
              * Checked that your issue isn't already filed: <https://github.com/issues?q=is%3Aissue+user%3Apulsar-edit+is%3Aopen>
              * Checked that there is not already an Pulsar package that provides the described functionality: <https://web.pulsar-edit.dev/>

          ### Description

          <!-- Description of the issue -->

          ### Steps to Reproduce

          1. <!-- First Step -->
          2. <!-- Second Step -->
          3. <!-- and so on… -->

          **Expected behavior:**

          <!-- What you expect to happen -->

          **Actual behavior:**

          <!-- What actually happens -->

          ### Versions

          **Pulsar**: #{atom.getVersion()} #{process.arch}
          **Electron**: #{process.versions.electron}
          **OS**: #{systemName}
          **Thrown From**: #{packageMessage}
          #{rootUserStatus}

          ### Stack Trace

          #{message}

          ```
          At #{options.detail}

          #{@normalizedStackPaths(options.stack)}
          ```

          ### Commands

          #{CommandLogger.instance().getText()}

          ### Non-Core Packages

          ```
          #{nonCorePackages.join('\n')}
          ```

          ### Additional Information

          <!-- Any additional information, configuration or data that might be necessary to reproduce the issue. -->
          #{copyText}
        """
        resolve(@issueBody)

  normalizedStackPaths: (stack) =>
    stack?.replace /(^\W+at )([\w.]{2,} [(])?(.*)(:\d+:\d+[)]?)/gm, (m, p1, p2, p3, p4) => p1 + (p2 or '') +
      @normalizePath(p3) + p4

  normalizePath: (path) ->
    path.replace('file:///', '')                         # Randomly inserted file url protocols
        .replace(/[/]/g, '\\')                           # Temp switch for Windows home matching
        .replace(fs.getHomeDirectory(), '~')             # Remove users home dir for apm-dev'ed packages
        .replace(/\\/g, '/')                             # Switch \ back to / for everyone
        .replace(/.*(\/(app\.asar|packages\/).*)/, '$1') # Remove everything before app.asar or pacakges

  getRepoUrl: ->
    packageName = @getPackageName()
    return unless packageName?
    repo = atom.packages.getLoadedPackage(packageName)?.metadata?.repository
    repoUrl = repo?.url ? repo
    unless repoUrl
      if packagePath = atom.packages.resolvePackagePath(packageName)
        try
          repo = JSON.parse(fs.readFileSync(path.join(packagePath, 'package.json')))?.repository
          repoUrl = repo?.url ? repo

    repoUrl?.replace(/\.git$/, '').replace(/^git\+/, '')

  getPackageNameFromFilePath: (filePath) ->
    return unless filePath

    packageName = /\/\.pulsar\/dev\/packages\/([^\/]+)\//.exec(filePath)?[1]
    return packageName if packageName

    packageName = /\\\.pulsar\\dev\\packages\\([^\\]+)\\/.exec(filePath)?[1]
    return packageName if packageName

    packageName = /\/\.pulsar\/packages\/([^\/]+)\//.exec(filePath)?[1]
    return packageName if packageName

    packageName = /\\\.pulsar\\packages\\([^\\]+)\\/.exec(filePath)?[1]
    return packageName if packageName

  getPackageName: ->
    options = @notification.getOptions()

    return options.packageName if options.packageName?
    return unless options.stack? or options.detail?

    packagePaths = @getPackagePathsByPackageName()
    for packageName, packagePath of packagePaths
      if packagePath.indexOf(path.join('.pulsar', 'dev', 'packages')) > -1 or packagePath.indexOf(path.join('.pulsar', 'packages')) > -1
        packagePaths[packageName] = fs.realpathSync(packagePath)

    getPackageName = (filePath) =>
      filePath = /\((.+?):\d+|\((.+)\)|(.+)/.exec(filePath)[0]

      # Stack traces may be a file URI
      if match = FileURLRegExp.exec(filePath)
        filePath = match[1]

      filePath = path.normalize(filePath)

      if path.isAbsolute(filePath)
        for packName, packagePath of packagePaths
          continue if filePath is 'node.js'
          isSubfolder = filePath.indexOf(path.normalize(packagePath + path.sep)) is 0
          return packName if isSubfolder
      @getPackageNameFromFilePath(filePath)

    if options.detail? and packageName = getPackageName(options.detail)
      return packageName

    if options.stack?
      stack = StackTraceParser.parse(options.stack)
      for i in [0...stack.length]
        {file} = stack[i]

        # Empty when it was run from the dev console
        return unless file
        packageName = getPackageName(file)
        return packageName if packageName?

    return

  getPackagePathsByPackageName: ->
    packagePathsByPackageName = {}
    for pack in atom.packages.getLoadedPackages()
      packagePathsByPackageName[pack.name] = pack.path
    packagePathsByPackageName
