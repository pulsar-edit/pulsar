const fs = require('fs-plus')
const path = require('path')
const temp = require('temp').track()
const GitHubFile = require('../lib/github-file')

const {it, fit, ffit, beforeEach, afterEach} = require('./async-spec-helpers') // eslint-disable-line no-unused-vars

describe('GitHubFile', function () {
  let githubFile
  let editor

  describe('commands', () => {
    let workingDirPath

    function fixturePath (fixtureName) {
      return path.join(__dirname, 'fixtures', `${fixtureName}.git`)
    }

    function setupWorkingDir (fixtureName) {
      workingDirPath = temp.mkdirSync('open-on-github-working-dir-')
      fs.copySync(fixturePath(fixtureName), path.join(workingDirPath, '.git'))

      let subdirectoryPath = path.join(workingDirPath, 'some-dir')
      fs.makeTreeSync(subdirectoryPath)

      let filePath = path.join(subdirectoryPath, 'some-file.md')
      fs.writeFileSync(filePath, 'some file content')
    }

    async function setupGithubFile (filePath = 'some-dir/some-file.md') {
      atom.project.setPaths([workingDirPath])
      editor = await atom.workspace.open(filePath)
      githubFile = GitHubFile.fromPath(editor.getPath())
      return githubFile
    }

    describe('open', () => {
      describe('when the file is openable on GitHub.com', () => {
        let fixtureName = 'github-remote'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('opens the GitHub.com blob URL for the file', () => {
          spyOn(githubFile, 'openURLInBrowser')
          githubFile.open()
          expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/blob/master/some-dir/some-file.md')
        })

        describe('when text is selected', () => {
          it('opens the GitHub.com blob URL for the file with the selection range in the hash', () => {
            atom.config.set('open-on-github.includeLineNumbersInUrls', true)
            spyOn(githubFile, 'openURLInBrowser')
            githubFile.open([[0, 0], [1, 1]])
            expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/blob/master/some-dir/some-file.md#L1-L2')
          })
        })

        describe("when the file has a '#' in its name", () => {
          it('opens the GitHub.com blob URL for the file', async () => {
            editor = await atom.workspace.open('a/b#/test#hash.md')
            githubFile = GitHubFile.fromPath(editor.getPath())
            spyOn(githubFile, 'openURLInBrowser')
            githubFile.open()
            expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/blob/master/a/b%23/test%23hash.md')
          })
        })
      })

      describe('when the file is part of a GitHub wiki', () => {
        let fixtureName = 'github-remote-wiki'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('opens the GitHub.com wiki URL for the file', () => {
          spyOn(githubFile, 'openURLInBrowser')
          githubFile.open()
          expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/wiki/some-file')
        })
      })

      describe('when the file is part of a GitHub gist', () => {
        let fixtureName = 'github-remote-gist'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile('some-file.md')
        })

        it('opens the gist.github.com URL for the file', () => {
          spyOn(githubFile, 'openURLInBrowser')
          githubFile.open()
          expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://gist.github.com/s0m3ha5h#file-some-file-md')
        })
      })

      describe("when the branch has a '/' in its name", () => {
        let fixtureName = 'branch-with-slash-in-name'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('opens the GitHub.com blob URL for the file', () => {
          spyOn(githubFile, 'openURLInBrowser')
          githubFile.open()
          expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/blob/foo/bar/some-dir/some-file.md')
        })
      })

      describe("when the branch has a '#' in its name", () => {
        let fixtureName = 'branch-with-hash-in-name'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('opens the GitHub.com blob URL for the file', () => {
          spyOn(githubFile, 'openURLInBrowser')
          githubFile.open()
          expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/blob/a%23b%23c/some-dir/some-file.md')
        })
      })

      describe("when the remote has a '/' in its name", () => {
        let fixtureName = 'remote-with-slash-in-name'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('opens the GitHub.com blob URL for the file', () => {
          spyOn(githubFile, 'openURLInBrowser')
          githubFile.open()
          expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/blob/baz/some-dir/some-file.md')
        })
      })

      describe('when the local branch is not tracked', () => {
        let fixtureName = 'non-tracked-branch'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('opens the GitHub.com blob URL for the file on the master branch', () => {
          spyOn(githubFile, 'openURLInBrowser')
          githubFile.open()
          expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/blob/master/some-dir/some-file.md')
        })
      })

      describe('when there is no remote', () => {
        let fixtureName = 'no-remote'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('shows a warning', () => {
          spyOn(atom.notifications, 'addWarning')
          githubFile.open()
          expect(atom.notifications.addWarning).toHaveBeenCalledWith('No URL defined for remote: null')
        })
      })

      describe("when the root directory doesn't have a git repo", () => {
        beforeEach(async () => {
          workingDirPath = temp.mkdirSync('open-on-github-working-dir')
          await setupGithubFile()
        })

        it('does nothing', () => {
          spyOn(atom.notifications, 'addWarning')
          githubFile.open()
          expect(atom.notifications.addWarning).toHaveBeenCalled()
          expect(atom.notifications.addWarning.mostRecentCall.args[0]).toContain('No repository found')
        })
      })

      describe('when the remote repo is not hosted on github.com', () => {
        let fixtureName = 'github-enterprise-remote'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          githubFile = await setupGithubFile()
        })

        it('opens a GitHub enterprise style blob URL for the file', () => {
          spyOn(githubFile, 'openURLInBrowser')
          githubFile.open()
          expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://git.enterprize.me/some-user/some-repo/blob/master/some-dir/some-file.md')
        })
      })

      describe('when the git config is set', () => {
        let fixtureName = 'git-config'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          githubFile = await setupGithubFile()
        })

        it('opens a URL that is specified by the git config', () => {
          spyOn(githubFile, 'openURLInBrowser')
          githubFile.open()
          expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://github.com/foo/bar/blob/some-branch/some-dir/some-file.md')
        })
      })
    })

    describe('openOnMaster', () => {
      describe('when the file is openable on GitHub.com', () => {
        let fixtureName = 'non-tracked-branch'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('opens the GitHub.com blob URL for the file', () => {
          spyOn(githubFile, 'openURLInBrowser')
          githubFile.openOnMaster()
          expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/blob/master/some-dir/some-file.md')
        })
      })

      describe('when the file is part of a GitHub wiki', () => {
        let fixtureName = 'github-remote-wiki'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('opens the GitHub.com wiki URL for the file and behaves exactly like open', () => {
          spyOn(githubFile, 'openURLInBrowser')
          githubFile.openOnMaster()
          expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/wiki/some-file')
        })
      })

      describe('when the file is part of a GitHub gist', () => {
        let fixtureName = 'github-remote-gist'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile('some-file.md')
        })

        it('opens the gist.github.com URL for the file and behaves exactly like open', () => {
          spyOn(githubFile, 'openURLInBrowser')
          githubFile.openOnMaster()
          expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://gist.github.com/s0m3ha5h#file-some-file-md')
        })
      })
    })

    describe('blame', () => {
      describe('when the file is openable on GitHub.com', () => {
        let fixtureName = 'github-remote'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('opens the GitHub.com blame URL for the file', () => {
          spyOn(githubFile, 'openURLInBrowser')
          githubFile.blame()
          expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/blame/master/some-dir/some-file.md')
        })

        describe('when text is selected', () => {
          it('opens the GitHub.com blame URL for the file with the selection range in the hash', () => {
            atom.config.set('open-on-github.includeLineNumbersInUrls', true)
            spyOn(githubFile, 'openURLInBrowser')
            githubFile.blame([[0, 0], [1, 1]])
            expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/blame/master/some-dir/some-file.md#L1-L2')
          })
        })
      })

      describe('when the local branch is not tracked', () => {
        let fixtureName = 'non-tracked-branch'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('opens the GitHub.com blame URL for the file on the master branch', () => {
          spyOn(githubFile, 'openURLInBrowser')
          githubFile.blame()
          expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/blame/master/some-dir/some-file.md')
        })
      })

      describe('when the file is part of a GitHub wiki', () => {
        let fixtureName = 'github-remote-wiki'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('shows a warning and does not attempt to open a URL', () => {
          spyOn(githubFile, 'openURLInBrowser')
          spyOn(atom.notifications, 'addWarning')
          githubFile.blame()
          expect(atom.notifications.addWarning).toHaveBeenCalledWith('Blames do not exist for wikis')
          expect(githubFile.openURLInBrowser).not.toHaveBeenCalled()
        })
      })

      describe('when the file is part of a GitHub wiki', () => {
        let fixtureName = 'github-remote-gist'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('shows a warning and does not attempt to open a URL', () => {
          spyOn(githubFile, 'openURLInBrowser')
          spyOn(atom.notifications, 'addWarning')
          githubFile.blame()
          expect(atom.notifications.addWarning).toHaveBeenCalledWith('Blames do not exist for gists')
          expect(githubFile.openURLInBrowser).not.toHaveBeenCalled()
        })
      })
    })

    describe('branchCompare', () => {
      describe('when the file is openable on GitHub.com', () => {
        let fixtureName = 'github-remote'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('opens the GitHub.com branch compare URL for the file', () => {
          spyOn(githubFile, 'openURLInBrowser')
          githubFile.openBranchCompare()
          expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/compare/master')
        })
      })

      describe('when the file is part of a GitHub wiki', () => {
        let fixtureName = 'github-remote-wiki'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('shows a warning and does not attempt to open a URL', () => {
          spyOn(githubFile, 'openURLInBrowser')
          spyOn(atom.notifications, 'addWarning')
          githubFile.openBranchCompare()
          expect(atom.notifications.addWarning).toHaveBeenCalledWith('Branches do not exist for wikis')
          expect(githubFile.openURLInBrowser).not.toHaveBeenCalled()
        })
      })

      describe('when the file is part of a GitHub wiki', () => {
        let fixtureName = 'github-remote-gist'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('shows a warning and does not attempt to open a URL', () => {
          spyOn(githubFile, 'openURLInBrowser')
          spyOn(atom.notifications, 'addWarning')
          githubFile.openBranchCompare()
          expect(atom.notifications.addWarning).toHaveBeenCalledWith('Branches do not exist for gists')
          expect(githubFile.openURLInBrowser).not.toHaveBeenCalled()
        })
      })
    })

    describe('history', () => {
      describe('when the file is openable on GitHub.com', () => {
        let fixtureName = 'github-remote'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('opens the GitHub.com history URL for the file', () => {
          spyOn(githubFile, 'openURLInBrowser')
          githubFile.history()
          expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/commits/master/some-dir/some-file.md')
        })
      })

      describe('when the local branch is not tracked', () => {
        let fixtureName = 'non-tracked-branch'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('opens the GitHub.com history URL for the file on the master branch', () => {
          spyOn(githubFile, 'openURLInBrowser')
          githubFile.history()
          expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/commits/master/some-dir/some-file.md')
        })
      })

      describe('when the file is part of a GitHub wiki', () => {
        let fixtureName = 'github-remote-wiki'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('opens the GitHub.com wiki history URL for the file', () => {
          spyOn(githubFile, 'openURLInBrowser')
          githubFile.history()
          expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/wiki/some-file/_history')
        })
      })

      describe('when the file is part of a GitHub gist', () => {
        let fixtureName = 'github-remote-gist'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile('some-file.md')
        })

        it('opens the gist.github.com history URL for the gist', () => {
          spyOn(githubFile, 'openURLInBrowser')
          githubFile.history()
          expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://gist.github.com/s0m3ha5h/revisions')
        })
      })
    })

    describe('copyURL', () => {
      describe('when the file is openable on GitHub.com', () => {
        let fixtureName = 'github-remote'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          atom.config.set('open-on-github.includeLineNumbersInUrls', true)
          await setupGithubFile()
        })

        describe('when text is selected', () => {
          it('copies the URL to the clipboard with the selection range in the hash', () => {
            githubFile.copyURL([[0, 0], [1, 1]])
            expect(atom.clipboard.read()).toBe('https://github.com/some-user/some-repo/blob/80b7897ceb6bd7531708509b50afeab36a4b73fd/some-dir/some-file.md#L1-L2')
          })
        })

        describe('when no text is selected', () => {
          it('copies the URL to the clipboard with the cursor location in the hash', () => {
            githubFile.copyURL([[2, 1], [2, 1]])
            expect(atom.clipboard.read()).toBe('https://github.com/some-user/some-repo/blob/80b7897ceb6bd7531708509b50afeab36a4b73fd/some-dir/some-file.md#L3')
          })
        })
      })

      describe('when the file is part of a GitHub wiki', () => {
        let fixtureName = 'github-remote-wiki'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          atom.config.set('open-on-github.includeLineNumbersInUrls', true)
          await setupGithubFile()
        })

        it('copies the GitHub.com wiki URL to the clipboard and ignores any selection ranges', () => {
          githubFile.copyURL([[0, 0], [1, 1]])
          expect(atom.clipboard.read()).toBe('https://github.com/some-user/some-repo/wiki/some-file/80b7897ceb6bd7531708509b50afeab36a4b73fd')
        })
      })

      describe('when the file is part of a GitHub gist', () => {
        let fixtureName = 'github-remote-gist'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          atom.config.set('open-on-github.includeLineNumbersInUrls', true)
          await setupGithubFile('some-file.md')
        })

        describe('when text is selected', () => {
          it('copies the gist.github.com URL with the selection range with the selection range appended', () => {
            githubFile.copyURL([[0, 0], [1, 1]])
            expect(atom.clipboard.read()).toBe('https://gist.github.com/s0m3ha5h/80b7897ceb6bd7531708509b50afeab36a4b73fd#file-some-file-md-L1-L2')
          })
        })

        describe('when no text is selected', () => {
          it('copies the gist.github.com URL with the selection range with the cursor location appended', () => {
            githubFile.copyURL([[2, 1], [2, 1]])
            expect(atom.clipboard.read()).toBe('https://gist.github.com/s0m3ha5h/80b7897ceb6bd7531708509b50afeab36a4b73fd#file-some-file-md-L3')
          })
        })
      })
    })

    describe('openRepository', () => {
      describe('when the file is openable on GitHub.com', () => {
        let fixtureName = 'github-remote'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('opens the GitHub.com repository URL', () => {
          spyOn(githubFile, 'openURLInBrowser')
          githubFile.openRepository()
          expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo')
        })
      })

      describe('when the file is part of a GitHub wiki', () => {
        let fixtureName = 'github-remote-wiki'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('opens the GitHub.com wiki history URL for the file', () => {
          spyOn(githubFile, 'openURLInBrowser')
          githubFile.openRepository()
          expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/wiki')
        })
      })

      describe('when the file is part of a GitHub gist', () => {
        let fixtureName = 'github-remote-gist'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile('some-file.md')
        })

        it('opens the gist.github.com repository URL', () => {
          spyOn(githubFile, 'openURLInBrowser')
          githubFile.openRepository()
          expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://gist.github.com/s0m3ha5h')
        })
      })
    })

    describe('openIssues', () => {
      describe('when the file is openable on GitHub.com', () => {
        let fixtureName = 'github-remote'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('opens the GitHub.com issues URL', () => {
          spyOn(githubFile, 'openURLInBrowser')
          githubFile.openIssues()
          expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/issues')
        })
      })

      describe('when the file is part of a GitHub wiki', () => {
        let fixtureName = 'github-remote-wiki'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('shows a warning and does not attempt to open a URL', () => {
          spyOn(githubFile, 'openURLInBrowser')
          spyOn(atom.notifications, 'addWarning')
          githubFile.openIssues()
          expect(atom.notifications.addWarning).toHaveBeenCalledWith('Issues do not exist for wikis')
          expect(githubFile.openURLInBrowser).not.toHaveBeenCalled()
        })
      })

      describe('when the file is part of a GitHub wiki', () => {
        let fixtureName = 'github-remote-gist'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('shows a warning and does not attempt to open a URL', () => {
          spyOn(githubFile, 'openURLInBrowser')
          spyOn(atom.notifications, 'addWarning')
          githubFile.openIssues()
          expect(atom.notifications.addWarning).toHaveBeenCalledWith('Issues do not exist for gists')
          expect(githubFile.openURLInBrowser).not.toHaveBeenCalled()
        })
      })
    })

    describe('openPullRequests', () => {
      describe('when the file is openable on GitHub.com', () => {
        let fixtureName = 'github-remote'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('opens the GitHub.com pull requests URL', () => {
          spyOn(githubFile, 'openURLInBrowser')
          githubFile.openPullRequests()
          expect(githubFile.openURLInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/pulls')
        })
      })

      describe('when the file is part of a GitHub wiki', () => {
        let fixtureName = 'github-remote-wiki'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('shows a warning and does not attempt to open a URL', () => {
          spyOn(githubFile, 'openURLInBrowser')
          spyOn(atom.notifications, 'addWarning')
          githubFile.openPullRequests()
          expect(atom.notifications.addWarning).toHaveBeenCalledWith('Pull requests do not exist for wikis')
          expect(githubFile.openURLInBrowser).not.toHaveBeenCalled()
        })
      })

      describe('when the file is part of a GitHub wiki', () => {
        let fixtureName = 'github-remote-gist'

        beforeEach(async () => {
          setupWorkingDir(fixtureName)
          await setupGithubFile()
        })

        it('shows a warning and does not attempt to open a URL', () => {
          spyOn(githubFile, 'openURLInBrowser')
          spyOn(atom.notifications, 'addWarning')
          githubFile.openPullRequests()
          expect(atom.notifications.addWarning).toHaveBeenCalledWith('Pull requests do not exist for gists')
          expect(githubFile.openURLInBrowser).not.toHaveBeenCalled()
        })
      })
    })
  })

  describe('githubRepoURL', () => {
    beforeEach(() => {
      githubFile = new GitHubFile()
    })

    it('returns the GitHub.com URL for an HTTPS remote URL', () => {
      githubFile.gitURL = () => 'https://github.com/foo/bar.git'
      expect(githubFile.githubRepoURL()).toBe('https://github.com/foo/bar')
    })

    it('will only strip a single .git suffix', () => {
      githubFile.gitURL = () => 'https://github.com/foo/bar.git.git'
      expect(githubFile.githubRepoURL()).toBe('https://github.com/foo/bar.git')

      githubFile.gitURL = () => 'https://github.com/foo/bar.git.other.git'
      expect(githubFile.githubRepoURL()).toBe('https://github.com/foo/bar.git.other')
    })

    it('returns the GitHub.com URL for an HTTP remote URL', () => {
      githubFile.gitURL = () => 'http://github.com/foo/bar.git'
      expect(githubFile.githubRepoURL()).toBe('http://github.com/foo/bar')
    })

    it('returns the GitHub.com URL for an SSH remote URL', () => {
      githubFile.gitURL = () => 'git@github.com:foo/bar.git'
      expect(githubFile.githubRepoURL()).toBe('https://github.com/foo/bar')
    })

    it('returns a GitHub enterprise URL for a non-Github.com remote URL', () => {
      githubFile.gitURL = () => 'https://git.enterprize.me/foo/bar.git'
      expect(githubFile.githubRepoURL()).toBe('https://git.enterprize.me/foo/bar')

      githubFile.gitURL = () => 'git@git.enterprize.me:foo/bar.git'
      expect(githubFile.githubRepoURL()).toBe('https://git.enterprize.me/foo/bar')
    })

    it('returns the GitHub.com URL for a git:// URL', () => {
      githubFile.gitURL = () => 'git://github.com/foo/bar.git'
      expect(githubFile.githubRepoURL()).toBe('https://github.com/foo/bar')
    })

    it('returns the GitHub.com URL for a user@github.com URL', () => {
      githubFile.gitURL = () => 'https://user@github.com/foo/bar.git'
      expect(githubFile.githubRepoURL()).toBe('https://github.com/foo/bar')
    })

    it('returns the GitHub.com URL for a ssh:// URL', () => {
      githubFile.gitURL = () => 'ssh://git@github.com/foo/bar.git'
      expect(githubFile.githubRepoURL()).toBe('https://github.com/foo/bar')
    })

    it('returns undefined for Bitbucket URLs', () => {
      githubFile.gitURL = () => 'https://bitbucket.org/somebody/repo.git'
      expect(githubFile.githubRepoURL()).toBeUndefined()

      githubFile.gitURL = () => 'https://bitbucket.org/somebody/repo'
      expect(githubFile.githubRepoURL()).toBeUndefined()

      githubFile.gitURL = () => 'git@bitbucket.org:somebody/repo.git'
      expect(githubFile.githubRepoURL()).toBeUndefined()

      githubFile.gitURL = () => 'git@bitbucket.org:somebody/repo'
      expect(githubFile.githubRepoURL()).toBeUndefined()
    })

    it('removes leading and trailing slashes', () => {
      githubFile.gitURL = () => 'https://github.com/foo/bar/'
      expect(githubFile.githubRepoURL()).toBe('https://github.com/foo/bar')

      githubFile.gitURL = () => 'https://github.com/foo/bar//////'
      expect(githubFile.githubRepoURL()).toBe('https://github.com/foo/bar')

      githubFile.gitURL = () => 'git@github.com:/foo/bar.git'
      expect(githubFile.githubRepoURL()).toBe('https://github.com/foo/bar')
    })
  })

  describe('when determining whether a repository is a Gist repository or not', () => {
    it('does not throw when the repository URL is a Bitbucket URL (regression)', () => {
      githubFile.gitURL = () => 'https://bitbucket.org/somebody/repo.git'
      expect(githubFile.isGistURL()).toBe(false)
    })
  })

  it('activates when a command is triggered on the active editor', async () => {
    const activationPromise = atom.packages.activatePackage('open-on-github')

    await atom.workspace.open()
    atom.commands.dispatch(atom.views.getView(atom.workspace.getActivePane()), 'open-on-github:file')
    await activationPromise
  })
})
