/** @babel */

import {shell} from 'electron'
import {Range} from 'atom'
import {parse as parseURL} from 'url'
import path from 'path'

export default class GitHubFile {
  // Public
  static fromPath (filePath) {
    return new GitHubFile(filePath)
  }

  constructor (filePath) {
    this.filePath = filePath
    const [rootDir] = atom.project.relativizePath(this.filePath)

    if (rootDir != null) {
      const rootDirIndex = atom.project.getPaths().indexOf(rootDir)
      this.repo = atom.project.getRepositories()[rootDirIndex]
      this.type = 'none'
      if (this.repo && this.gitURL()) {
        if (this.isGitHubWikiURL(this.githubRepoURL())) {
          this.type = 'wiki'
        } else if (this.isGistURL(this.githubRepoURL())) {
          this.type = 'gist'
        } else {
          this.type = 'repo'
        }
      }
    }
  }

  // Public
  open (lineRange) {
    if (this.validateRepo()) {
      this.openURLInBrowser(this.blobURL() + this.getLineRangeSuffix(lineRange))
    }
  }

  // Public
  openOnMaster (lineRange) {
    if (this.validateRepo()) {
      this.openURLInBrowser(this.blobURLForMaster() + this.getLineRangeSuffix(lineRange))
    }
  }

  // Public
  blame (lineRange) {
    if (this.validateRepo()) {
      if (this.type === 'repo') {
        this.openURLInBrowser(this.blameURL() + this.getLineRangeSuffix(lineRange))
      } else {
        atom.notifications.addWarning(`Blames do not exist for ${this.type}s`)
      }
    }
  }

  history () {
    if (this.validateRepo()) {
      this.openURLInBrowser(this.historyURL())
    }
  }

  copyURL (lineRange) {
    if (this.validateRepo()) {
      atom.clipboard.write(this.shaURL() + this.getLineRangeSuffix(lineRange))
    }
  }

  openBranchCompare () {
    if (this.validateRepo()) {
      if (this.type === 'repo') {
        this.openURLInBrowser(this.branchCompareURL())
      } else {
        atom.notifications.addWarning(`Branches do not exist for ${this.type}s`)
      }
    }
  }

  openIssues () {
    if (this.validateRepo()) {
      if (this.type === 'repo') {
        this.openURLInBrowser(this.issuesURL())
      } else {
        atom.notifications.addWarning(`Issues do not exist for ${this.type}s`)
      }
    }
  }

  openPullRequests () {
    if (this.validateRepo()) {
      if (this.type === 'repo') {
        this.openURLInBrowser(this.pullRequestsURL())
      } else {
        atom.notifications.addWarning(`Pull requests do not exist for ${this.type}s`)
      }
    }
  }

  openRepository () {
    if (this.validateRepo()) {
      this.openURLInBrowser(this.githubRepoURL())
    }
  }

  getLineRangeSuffix (lineRange) {
    if (lineRange && this.type !== 'wiki' && atom.config.get('open-on-github.includeLineNumbersInUrls')) {
      lineRange = Range.fromObject(lineRange)
      const startRow = lineRange.start.row + 1
      const endRow = lineRange.end.row + 1

      if (startRow === endRow) {
        if (this.type === 'gist') {
          return `-L${startRow}`
        } else {
          return `#L${startRow}`
        }
      } else {
        if (this.type === 'gist') {
          return `-L${startRow}-L${endRow}`
        } else {
          return `#L${startRow}-L${endRow}`
        }
      }
    } else {
      return ''
    }
  }

  // Internal
  validateRepo () {
    if (!this.repo) {
      atom.notifications.addWarning(`No repository found for path: ${this.filePath}.`)
      return false
    } else if (!this.gitURL()) {
      atom.notifications.addWarning(`No URL defined for remote: ${this.remoteName()}`)
      return false
    } else if (!this.githubRepoURL()) {
      atom.notifications.addWarning(`Remote URL is not hosted on GitHub: ${this.gitURL()}`)
      return false
    }
    return true
  }

  // Internal
  openURLInBrowser (url) {
    shell.openExternal(url)
  }

  // Internal
  blobURL () {
    const gitHubRepoURL = this.githubRepoURL()
    const repoRelativePath = this.repoRelativePath()

    if (this.type === 'wiki') {
      return `${gitHubRepoURL}/${this.extractFileName(repoRelativePath)}`
    } else if (this.type === 'gist') {
      return `${gitHubRepoURL}#file-${this.encodeSegments(repoRelativePath.replace(/\./g, '-'))}`
    } else {
      return `${gitHubRepoURL}/blob/${this.remoteBranchName()}/${this.encodeSegments(repoRelativePath)}`
    }
  }

  // Internal
  blobURLForMaster () {
    const gitHubRepoURL = this.githubRepoURL()

    if (this.type === 'repo') {
      return `${gitHubRepoURL}/blob/master/${this.encodeSegments(this.repoRelativePath())}`
    } else {
      return this.blobURL() // Only repos have branches
    }
  }

  // Internal
  shaURL () {
    const gitHubRepoURL = this.githubRepoURL()
    const encodedSHA = this.encodeSegments(this.sha())
    const repoRelativePath = this.repoRelativePath()

    if (this.type === 'wiki') {
      return `${gitHubRepoURL}/${this.extractFileName(repoRelativePath)}/${encodedSHA}`
    } else if (this.type === 'gist') {
      return `${gitHubRepoURL}/${encodedSHA}#file-${this.encodeSegments(repoRelativePath.replace(/\./g, '-'))}`
    } else {
      return `${gitHubRepoURL}/blob/${encodedSHA}/${this.encodeSegments(repoRelativePath)}`
    }
  }

  // Internal
  blameURL () {
    return `${this.githubRepoURL()}/blame/${this.remoteBranchName()}/${this.encodeSegments(this.repoRelativePath())}`
  }

  // Internal
  historyURL () {
    const gitHubRepoURL = this.githubRepoURL()

    if (this.type === 'wiki') {
      return `${gitHubRepoURL}/${this.extractFileName(this.repoRelativePath())}/_history`
    } else if (this.type === 'gist') {
      return `${gitHubRepoURL}/revisions`
    } else {
      return `${gitHubRepoURL}/commits/${this.remoteBranchName()}/${this.encodeSegments(this.repoRelativePath())}`
    }
  }

  // Internal
  issuesURL () {
    return `${this.githubRepoURL()}/issues`
  }

  // Internal
  pullRequestsURL () {
    return `${this.githubRepoURL()}/pulls`
  }

  // Internal
  branchCompareURL () {
    return `${this.githubRepoURL()}/compare/${this.encodeSegments(this.branchName())}`
  }

  encodeSegments (segments = '') {
    return segments.split('/').map(segment => encodeURIComponent(segment)).join('/')
  }

  // Internal
  extractFileName (relativePath = '') {
    return path.parse(relativePath).name
  }

  // Internal
  gitURL () {
    const remoteName = this.remoteName()
    if (remoteName != null) {
      return this.repo.getConfigValue(`remote.${remoteName}.url`, this.filePath)
    } else {
      return this.repo.getConfigValue(`remote.origin.url`, this.filePath)
    }
  }

  // Internal
  githubRepoURL () {
    let url = this.gitURL()

    if (url.match(/git@[^:]+:/)) { // git@github.com:user/repo.git
      url = url.replace(/^git@([^:]+):(.+)$/, (match, host, repoPath) => {
        repoPath = repoPath.replace(/^\/+/, '')
        return `https://${host}/${repoPath}` // -> https://github.com/user/repo.git
      })
    } else if (url.match(/^ssh:\/\/git@([^/]+)\//)) { // ssh://git@github.com/user/repo.git
      url = `https://${url.substring(10)}` // -> https://github.com/user/repo.git
    } else if (url.match(/^git:\/\/[^/]+\//)) { // git://github.com/user/repo.git
      url = `https${url.substring(3)}` // -> https://github.com/user/repo.git
    } else if (url.match(/^https?:\/\/\w+@/)) { // https://user@github.com/user/repo.git
      url = url.replace(/^https?:\/\/\w+@/, 'https://') // -> https://github.com/user/repo.git
    }

    // Remove trailing .git and trailing slashes
    url = url.replace(/\.git$/, '').replace(/\/+$/, '')
    // Change .wiki to /wiki
    url = url.replace(/\.wiki$/, '/wiki')

    if (!this.isBitbucketURL(url)) {
      return url
    }
  }

  isGistURL (url) {
    try {
      const {host} = parseURL(url)

      return host === 'gist.github.com'
    } catch (error) {
      return false
    }
  }

  isGitHubWikiURL (url) {
    return /\/wiki$/.test(url)
  }

  isBitbucketURL (url) {
    if (url.startsWith('git@bitbucket.org')) {
      return true
    }

    try {
      const {host} = parseURL(url)

      return host === 'bitbucket.org'
    } catch (error) {
      return false
    }
  }

  // Internal
  repoRelativePath () {
    return this.repo.getRepo(this.filePath).relativize(this.filePath)
  }

  // Internal
  remoteName () {
    const gitConfigRemote = this.repo.getConfigValue('atom.open-on-github.remote', this.filePath)

    if (gitConfigRemote) {
      return gitConfigRemote
    }

    const shortBranch = this.repo.getShortHead(this.filePath)

    if (!shortBranch) {
      return null
    }

    const branchRemote = this.repo.getConfigValue(`branch.${shortBranch}.remote`, this.filePath)

    if (branchRemote && branchRemote.length > 0) {
      return branchRemote
    }

    return null
  }

  // Internal
  sha () {
    return this.repo.getReferenceTarget('HEAD', this.filePath)
  }

  // Internal
  branchName () {
    const shortBranch = this.repo.getShortHead(this.filePath)

    if (!shortBranch) {
      return null
    }

    const branchMerge = this.repo.getConfigValue(`branch.${shortBranch}.merge`, this.filePath)
    if (!(branchMerge && branchMerge.length > 11)) {
      return shortBranch
    }

    if (branchMerge.indexOf('refs/heads/') !== 0) {
      return shortBranch
    }

    return branchMerge.substring(11)
  }

  // Internal
  remoteBranchName () {
    const gitConfigBranch = this.repo.getConfigValue('atom.open-on-github.branch', this.filePath)

    if (gitConfigBranch) {
      return gitConfigBranch
    } else if (this.remoteName() != null) {
      return this.encodeSegments(this.branchName())
    } else {
      return 'master'
    }
  }
}
