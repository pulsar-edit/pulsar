const fs = require("fs-plus");
const path = require("path");
const temp = require("temp").track();
const RepositoryFile = require("../lib/repository-file");

const { it, fit, ffit, beforeEach, afterEach } = require("./async-spec-helpers"); // eslint-disable-line no-unused-vars

describe("RepositoryFile", function () {
  let repositoryFile;
  let editor;

  describe("commands", () => {
    let workingDirPath;

    function fixturePath(fixtureName) {
      return path.join(__dirname, "fixtures", `${fixtureName}.git`);
    }

    function setupWorkingDir(fixtureName) {
      workingDirPath = temp.mkdirSync("open-repository-working-dir-");
      fs.copySync(fixturePath(fixtureName), path.join(workingDirPath, ".git"));

      let subdirectoryPath = path.join(workingDirPath, "some-dir");
      fs.makeTreeSync(subdirectoryPath);

      let filePath = path.join(subdirectoryPath, "some-file.md");
      fs.writeFileSync(filePath, "some file content");
    }

    async function setupRepositoryFile(filePath = "some-dir/some-file.md") {
      atom.project.setPaths([workingDirPath]);
      editor = await atom.workspace.open(filePath);
      repositoryFile = RepositoryFile.fromPath(editor.getPath());
      return repositoryFile;
    }

    describe("open", () => {
      describe("when the file is openable on GitHub.com", () => {
        let fixtureName = "github-remote";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("opens the GitHub.com blob URL for the file", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          repositoryFile.open();
          expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
            "https://github.com/some-user/some-repo/blob/master/some-dir/some-file.md",
          );
        });

        describe("when text is selected", () => {
          it("opens the GitHub.com blob URL for the file with the selection range in the hash", () => {
            atom.config.set("open-repository.includeLineNumbersInUrls", true);
            spyOn(repositoryFile, "openURLInBrowser");
            repositoryFile.open([
              [0, 0],
              [1, 1],
            ]);
            expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
              "https://github.com/some-user/some-repo/blob/master/some-dir/some-file.md#L1-L2",
            );
          });
        });

        describe("when the file has a '#' in its name", () => {
          it("opens the GitHub.com blob URL for the file", async () => {
            editor = await atom.workspace.open("a/b#/test#hash.md");
            repositoryFile = RepositoryFile.fromPath(editor.getPath());
            spyOn(repositoryFile, "openURLInBrowser");
            repositoryFile.open();
            expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
              "https://github.com/some-user/some-repo/blob/master/a/b%23/test%23hash.md",
            );
          });
        });
      });

      describe("when the file is part of a GitHub wiki", () => {
        let fixtureName = "github-remote-wiki";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("opens the GitHub.com wiki URL for the file", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          repositoryFile.open();
          expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
            "https://github.com/some-user/some-repo/wiki/some-file",
          );
        });
      });

      describe("when the file is part of a GitHub gist", () => {
        let fixtureName = "github-remote-gist";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile("some-file.md");
        });

        it("opens the gist.github.com URL for the file", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          repositoryFile.open();
          expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
            "https://gist.github.com/s0m3ha5h#file-some-file-md",
          );
        });
      });

      describe("when the branch has a '/' in its name", () => {
        let fixtureName = "branch-with-slash-in-name";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("opens the GitHub.com blob URL for the file", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          repositoryFile.open();
          expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
            "https://github.com/some-user/some-repo/blob/foo/bar/some-dir/some-file.md",
          );
        });
      });

      describe("when the branch has a '#' in its name", () => {
        let fixtureName = "branch-with-hash-in-name";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("opens the GitHub.com blob URL for the file", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          repositoryFile.open();
          expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
            "https://github.com/some-user/some-repo/blob/a%23b%23c/some-dir/some-file.md",
          );
        });
      });

      describe("when the remote has a '/' in its name", () => {
        let fixtureName = "remote-with-slash-in-name";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("opens the GitHub.com blob URL for the file", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          repositoryFile.open();
          expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
            "https://github.com/some-user/some-repo/blob/baz/some-dir/some-file.md",
          );
        });
      });

      describe("when the local branch is not tracked", () => {
        let fixtureName = "non-tracked-branch";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("opens the GitHub.com blob URL for the file on the master branch", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          repositoryFile.open();
          expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
            "https://github.com/some-user/some-repo/blob/master/some-dir/some-file.md",
          );
        });
      });

      describe("when there is no remote", () => {
        let fixtureName = "no-remote";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("shows a warning", () => {
          spyOn(atom.notifications, "addWarning");
          repositoryFile.open();
          expect(atom.notifications.addWarning).toHaveBeenCalledWith(
            "No URL defined for remote: null",
          );
        });
      });

      describe("when the root directory doesn't have a git repo", () => {
        beforeEach(async () => {
          workingDirPath = temp.mkdirSync("open-repository-working-dir");
          await setupRepositoryFile();
        });

        it("does nothing", () => {
          spyOn(atom.notifications, "addWarning");
          repositoryFile.open();
          expect(atom.notifications.addWarning).toHaveBeenCalled();
          expect(atom.notifications.addWarning.mostRecentCall.args[0]).toContain(
            "No repository found",
          );
        });
      });

      describe("when the remote repo is not hosted on github.com", () => {
        let fixtureName = "github-enterprise-remote";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          repositoryFile = await setupRepositoryFile();
        });

        it("opens a GitHub enterprise style blob URL for the file", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          repositoryFile.open();
          expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
            "https://git.enterprize.me/some-user/some-repo/blob/master/some-dir/some-file.md",
          );
        });
      });

      describe("when the git config is set", () => {
        let fixtureName = "git-config";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          repositoryFile = await setupRepositoryFile();
        });

        it("opens a URL that is specified by the git config", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          repositoryFile.open();
          expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
            "https://github.com/foo/bar/blob/some-branch/some-dir/some-file.md",
          );
        });
      });
    });

    describe("openOnMaster", () => {
      describe("when the file is openable on GitHub.com", () => {
        let fixtureName = "non-tracked-branch";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("opens the GitHub.com blob URL for the file", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          repositoryFile.openOnMaster();
          expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
            "https://github.com/some-user/some-repo/blob/master/some-dir/some-file.md",
          );
        });
      });

      describe("when the file is part of a GitHub wiki", () => {
        let fixtureName = "github-remote-wiki";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("opens the GitHub.com wiki URL for the file and behaves exactly like open", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          repositoryFile.openOnMaster();
          expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
            "https://github.com/some-user/some-repo/wiki/some-file",
          );
        });
      });

      describe("when the file is part of a GitHub gist", () => {
        let fixtureName = "github-remote-gist";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile("some-file.md");
        });

        it("opens the gist.github.com URL for the file and behaves exactly like open", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          repositoryFile.openOnMaster();
          expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
            "https://gist.github.com/s0m3ha5h#file-some-file-md",
          );
        });
      });
    });

    describe("blame", () => {
      describe("when the file is openable on GitHub.com", () => {
        let fixtureName = "github-remote";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("opens the GitHub.com blame URL for the file", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          repositoryFile.blame();
          expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
            "https://github.com/some-user/some-repo/blame/master/some-dir/some-file.md",
          );
        });

        describe("when text is selected", () => {
          it("opens the GitHub.com blame URL for the file with the selection range in the hash", () => {
            atom.config.set("open-repository.includeLineNumbersInUrls", true);
            spyOn(repositoryFile, "openURLInBrowser");
            repositoryFile.blame([
              [0, 0],
              [1, 1],
            ]);
            expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
              "https://github.com/some-user/some-repo/blame/master/some-dir/some-file.md#L1-L2",
            );
          });
        });
      });

      describe("when the local branch is not tracked", () => {
        let fixtureName = "non-tracked-branch";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("opens the GitHub.com blame URL for the file on the master branch", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          repositoryFile.blame();
          expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
            "https://github.com/some-user/some-repo/blame/master/some-dir/some-file.md",
          );
        });
      });

      describe("when the file is part of a GitHub wiki", () => {
        let fixtureName = "github-remote-wiki";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("shows a warning and does not attempt to open a URL", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          spyOn(atom.notifications, "addWarning");
          repositoryFile.blame();
          expect(atom.notifications.addWarning).toHaveBeenCalledWith(
            "Blames do not exist for wikis",
          );
          expect(repositoryFile.openURLInBrowser).not.toHaveBeenCalled();
        });
      });

      describe("when the file is part of a GitHub wiki", () => {
        let fixtureName = "github-remote-gist";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("shows a warning and does not attempt to open a URL", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          spyOn(atom.notifications, "addWarning");
          repositoryFile.blame();
          expect(atom.notifications.addWarning).toHaveBeenCalledWith(
            "Blames do not exist for gists",
          );
          expect(repositoryFile.openURLInBrowser).not.toHaveBeenCalled();
        });
      });
    });

    describe("branchCompare", () => {
      describe("when the file is openable on GitHub.com", () => {
        let fixtureName = "github-remote";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("opens the GitHub.com branch compare URL for the file", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          repositoryFile.openBranchCompare();
          expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
            "https://github.com/some-user/some-repo/compare/master",
          );
        });
      });

      describe("when the file is part of a GitHub wiki", () => {
        let fixtureName = "github-remote-wiki";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("shows a warning and does not attempt to open a URL", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          spyOn(atom.notifications, "addWarning");
          repositoryFile.openBranchCompare();
          expect(atom.notifications.addWarning).toHaveBeenCalledWith(
            "Branches do not exist for wikis",
          );
          expect(repositoryFile.openURLInBrowser).not.toHaveBeenCalled();
        });
      });

      describe("when the file is part of a GitHub wiki", () => {
        let fixtureName = "github-remote-gist";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("shows a warning and does not attempt to open a URL", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          spyOn(atom.notifications, "addWarning");
          repositoryFile.openBranchCompare();
          expect(atom.notifications.addWarning).toHaveBeenCalledWith(
            "Branches do not exist for gists",
          );
          expect(repositoryFile.openURLInBrowser).not.toHaveBeenCalled();
        });
      });
    });

    describe("history", () => {
      describe("when the file is openable on GitHub.com", () => {
        let fixtureName = "github-remote";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("opens the GitHub.com history URL for the file", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          repositoryFile.history();
          expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
            "https://github.com/some-user/some-repo/commits/master/some-dir/some-file.md",
          );
        });
      });

      describe("when the local branch is not tracked", () => {
        let fixtureName = "non-tracked-branch";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("opens the GitHub.com history URL for the file on the master branch", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          repositoryFile.history();
          expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
            "https://github.com/some-user/some-repo/commits/master/some-dir/some-file.md",
          );
        });
      });

      describe("when the file is part of a GitHub wiki", () => {
        let fixtureName = "github-remote-wiki";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("opens the GitHub.com wiki history URL for the file", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          repositoryFile.history();
          expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
            "https://github.com/some-user/some-repo/wiki/some-file/_history",
          );
        });
      });

      describe("when the file is part of a GitHub gist", () => {
        let fixtureName = "github-remote-gist";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile("some-file.md");
        });

        it("opens the gist.github.com history URL for the gist", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          repositoryFile.history();
          expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
            "https://gist.github.com/s0m3ha5h/revisions",
          );
        });
      });
    });

    describe("copyURL", () => {
      describe("when the file is openable on GitHub.com", () => {
        let fixtureName = "github-remote";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          atom.config.set("open-repository.includeLineNumbersInUrls", true);
          await setupRepositoryFile();
        });

        describe("when text is selected", () => {
          it("copies the URL to the clipboard with the selection range in the hash", () => {
            repositoryFile.copyURL([
              [0, 0],
              [1, 1],
            ]);
            expect(atom.clipboard.read()).toBe(
              "https://github.com/some-user/some-repo/blob/80b7897ceb6bd7531708509b50afeab36a4b73fd/some-dir/some-file.md#L1-L2",
            );
          });
        });

        describe("when no text is selected", () => {
          it("copies the URL to the clipboard with the cursor location in the hash", () => {
            repositoryFile.copyURL([
              [2, 1],
              [2, 1],
            ]);
            expect(atom.clipboard.read()).toBe(
              "https://github.com/some-user/some-repo/blob/80b7897ceb6bd7531708509b50afeab36a4b73fd/some-dir/some-file.md#L3",
            );
          });
        });
      });

      describe("when the file is part of a GitHub wiki", () => {
        let fixtureName = "github-remote-wiki";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          atom.config.set("open-repository.includeLineNumbersInUrls", true);
          await setupRepositoryFile();
        });

        it("copies the GitHub.com wiki URL to the clipboard and ignores any selection ranges", () => {
          repositoryFile.copyURL([
            [0, 0],
            [1, 1],
          ]);
          expect(atom.clipboard.read()).toBe(
            "https://github.com/some-user/some-repo/wiki/some-file/80b7897ceb6bd7531708509b50afeab36a4b73fd",
          );
        });
      });

      describe("when the file is part of a GitHub gist", () => {
        let fixtureName = "github-remote-gist";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          atom.config.set("open-repository.includeLineNumbersInUrls", true);
          await setupRepositoryFile("some-file.md");
        });

        describe("when text is selected", () => {
          it("copies the gist.github.com URL with the selection range with the selection range appended", () => {
            repositoryFile.copyURL([
              [0, 0],
              [1, 1],
            ]);
            expect(atom.clipboard.read()).toBe(
              "https://gist.github.com/s0m3ha5h/80b7897ceb6bd7531708509b50afeab36a4b73fd#file-some-file-md-L1-L2",
            );
          });
        });

        describe("when no text is selected", () => {
          it("copies the gist.github.com URL with the selection range with the cursor location appended", () => {
            repositoryFile.copyURL([
              [2, 1],
              [2, 1],
            ]);
            expect(atom.clipboard.read()).toBe(
              "https://gist.github.com/s0m3ha5h/80b7897ceb6bd7531708509b50afeab36a4b73fd#file-some-file-md-L3",
            );
          });
        });
      });
    });

    describe("openRepository", () => {
      describe("when the file is openable on GitHub.com", () => {
        let fixtureName = "github-remote";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("opens the GitHub.com repository URL", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          repositoryFile.openRepository();
          expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
            "https://github.com/some-user/some-repo",
          );
        });
      });

      describe("when the file is part of a GitHub wiki", () => {
        let fixtureName = "github-remote-wiki";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("opens the GitHub.com wiki history URL for the file", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          repositoryFile.openRepository();
          expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
            "https://github.com/some-user/some-repo/wiki",
          );
        });
      });

      describe("when the file is part of a GitHub gist", () => {
        let fixtureName = "github-remote-gist";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile("some-file.md");
        });

        it("opens the gist.github.com repository URL", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          repositoryFile.openRepository();
          expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
            "https://gist.github.com/s0m3ha5h",
          );
        });
      });
    });

    describe("openIssues", () => {
      describe("when the file is openable on GitHub.com", () => {
        let fixtureName = "github-remote";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("opens the GitHub.com issues URL", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          repositoryFile.openIssues();
          expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
            "https://github.com/some-user/some-repo/issues",
          );
        });
      });

      describe("when the file is part of a GitHub wiki", () => {
        let fixtureName = "github-remote-wiki";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("shows a warning and does not attempt to open a URL", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          spyOn(atom.notifications, "addWarning");
          repositoryFile.openIssues();
          expect(atom.notifications.addWarning).toHaveBeenCalledWith(
            "Issues do not exist for wikis",
          );
          expect(repositoryFile.openURLInBrowser).not.toHaveBeenCalled();
        });
      });

      describe("when the file is part of a GitHub wiki", () => {
        let fixtureName = "github-remote-gist";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("shows a warning and does not attempt to open a URL", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          spyOn(atom.notifications, "addWarning");
          repositoryFile.openIssues();
          expect(atom.notifications.addWarning).toHaveBeenCalledWith(
            "Issues do not exist for gists",
          );
          expect(repositoryFile.openURLInBrowser).not.toHaveBeenCalled();
        });
      });
    });

    describe("openPullRequests", () => {
      describe("when the file is openable on GitHub.com", () => {
        let fixtureName = "github-remote";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("opens the GitHub.com pull requests URL", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          repositoryFile.openPullRequests();
          expect(repositoryFile.openURLInBrowser).toHaveBeenCalledWith(
            "https://github.com/some-user/some-repo/pulls",
          );
        });
      });

      describe("when the file is part of a GitHub wiki", () => {
        let fixtureName = "github-remote-wiki";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("shows a warning and does not attempt to open a URL", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          spyOn(atom.notifications, "addWarning");
          repositoryFile.openPullRequests();
          expect(atom.notifications.addWarning).toHaveBeenCalledWith(
            "Pull requests do not exist for wikis",
          );
          expect(repositoryFile.openURLInBrowser).not.toHaveBeenCalled();
        });
      });

      describe("when the file is part of a GitHub wiki", () => {
        let fixtureName = "github-remote-gist";

        beforeEach(async () => {
          setupWorkingDir(fixtureName);
          await setupRepositoryFile();
        });

        it("shows a warning and does not attempt to open a URL", () => {
          spyOn(repositoryFile, "openURLInBrowser");
          spyOn(atom.notifications, "addWarning");
          repositoryFile.openPullRequests();
          expect(atom.notifications.addWarning).toHaveBeenCalledWith(
            "Pull requests do not exist for gists",
          );
          expect(repositoryFile.openURLInBrowser).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe("repoWebURL", () => {
    beforeEach(() => {
      repositoryFile = new RepositoryFile();
    });

    it("returns the GitHub.com URL for an HTTPS remote URL", () => {
      repositoryFile.gitURL = () => "https://github.com/foo/bar.git";
      expect(repositoryFile.repoWebURL()).toBe("https://github.com/foo/bar");
    });

    it("will only strip a single .git suffix", () => {
      repositoryFile.gitURL = () => "https://github.com/foo/bar.git.git";
      expect(repositoryFile.repoWebURL()).toBe("https://github.com/foo/bar.git");

      repositoryFile.gitURL = () => "https://github.com/foo/bar.git.other.git";
      expect(repositoryFile.repoWebURL()).toBe("https://github.com/foo/bar.git.other");
    });

    it("returns the GitHub.com URL for an HTTP remote URL", () => {
      repositoryFile.gitURL = () => "http://github.com/foo/bar.git";
      expect(repositoryFile.repoWebURL()).toBe("http://github.com/foo/bar");
    });

    it("returns the GitHub.com URL for an SSH remote URL", () => {
      repositoryFile.gitURL = () => "git@github.com:foo/bar.git";
      expect(repositoryFile.repoWebURL()).toBe("https://github.com/foo/bar");
    });

    it("returns a GitHub enterprise URL for a non-Github.com remote URL", () => {
      repositoryFile.gitURL = () => "https://git.enterprize.me/foo/bar.git";
      expect(repositoryFile.repoWebURL()).toBe("https://git.enterprize.me/foo/bar");

      repositoryFile.gitURL = () => "git@git.enterprize.me:foo/bar.git";
      expect(repositoryFile.repoWebURL()).toBe("https://git.enterprize.me/foo/bar");
    });

    it("returns the GitHub.com URL for a git:// URL", () => {
      repositoryFile.gitURL = () => "git://github.com/foo/bar.git";
      expect(repositoryFile.repoWebURL()).toBe("https://github.com/foo/bar");
    });

    it("returns the GitHub.com URL for a user@github.com URL", () => {
      repositoryFile.gitURL = () => "https://user@github.com/foo/bar.git";
      expect(repositoryFile.repoWebURL()).toBe("https://github.com/foo/bar");
    });

    it("returns the GitHub.com URL for a ssh:// URL", () => {
      repositoryFile.gitURL = () => "ssh://git@github.com/foo/bar.git";
      expect(repositoryFile.repoWebURL()).toBe("https://github.com/foo/bar");
    });

    it("returns the Bitbucket URL for Bitbucket remotes", () => {
      repositoryFile.gitURL = () => "https://bitbucket.org/somebody/repo.git";
      expect(repositoryFile.repoWebURL()).toBe("https://bitbucket.org/somebody/repo");

      repositoryFile.gitURL = () => "https://bitbucket.org/somebody/repo";
      expect(repositoryFile.repoWebURL()).toBe("https://bitbucket.org/somebody/repo");

      repositoryFile.gitURL = () => "git@bitbucket.org:somebody/repo.git";
      expect(repositoryFile.repoWebURL()).toBe("https://bitbucket.org/somebody/repo");

      repositoryFile.gitURL = () => "git@bitbucket.org:somebody/repo";
      expect(repositoryFile.repoWebURL()).toBe("https://bitbucket.org/somebody/repo");
    });

    it("returns the GitLab URL for a GitLab remote", () => {
      repositoryFile.gitURL = () => "git@gitlab.com:foo/bar.git";
      expect(repositoryFile.repoWebURL()).toBe("https://gitlab.com/foo/bar");
    });

    it("removes leading and trailing slashes", () => {
      repositoryFile.gitURL = () => "https://github.com/foo/bar/";
      expect(repositoryFile.repoWebURL()).toBe("https://github.com/foo/bar");

      repositoryFile.gitURL = () => "https://github.com/foo/bar//////";
      expect(repositoryFile.repoWebURL()).toBe("https://github.com/foo/bar");

      repositoryFile.gitURL = () => "git@github.com:/foo/bar.git";
      expect(repositoryFile.repoWebURL()).toBe("https://github.com/foo/bar");
    });
  });

  describe("when determining whether a repository is a Gist repository or not", () => {
    it("does not throw when the repository URL is a Bitbucket URL (regression)", () => {
      repositoryFile.gitURL = () => "https://bitbucket.org/somebody/repo.git";
      expect(repositoryFile.isGistURL()).toBe(false);
    });
  });

  describe("provider URL schemes", () => {
    const bases = {
      github: "https://github.com/owner/repo",
      gitlab: "https://gitlab.com/owner/repo",
      bitbucket: "https://bitbucket.org/owner/repo",
    };

    function repoFileFor(providerKey) {
      const file = new RepositoryFile();
      file.type = "repo";
      file.providerKey = providerKey;
      file.repoWebURL = () => bases[providerKey];
      file.repoRelativePath = () => "some-dir/some-file.md";
      file.remoteBranchName = () => "main";
      file.branchName = () => "feature";
      file.sha = () => "abc123";
      return file;
    }

    const expected = {
      github: {
        blob: "https://github.com/owner/repo/blob/main/some-dir/some-file.md",
        blame: "https://github.com/owner/repo/blame/main/some-dir/some-file.md",
        history: "https://github.com/owner/repo/commits/main/some-dir/some-file.md",
        issues: "https://github.com/owner/repo/issues",
        pulls: "https://github.com/owner/repo/pulls",
        compare: "https://github.com/owner/repo/compare/feature",
        lineMulti: "#L1-L2",
        lineSingle: "#L3",
      },
      gitlab: {
        blob: "https://gitlab.com/owner/repo/-/blob/main/some-dir/some-file.md",
        blame: "https://gitlab.com/owner/repo/-/blame/main/some-dir/some-file.md",
        history: "https://gitlab.com/owner/repo/-/commits/main/some-dir/some-file.md",
        issues: "https://gitlab.com/owner/repo/-/issues",
        pulls: "https://gitlab.com/owner/repo/-/merge_requests",
        compare:
          "https://gitlab.com/owner/repo/-/merge_requests/new?merge_request[source_branch]=feature",
        lineMulti: "#L1-2",
        lineSingle: "#L3",
      },
      bitbucket: {
        blob: "https://bitbucket.org/owner/repo/src/main/some-dir/some-file.md",
        blame: "https://bitbucket.org/owner/repo/annotate/main/some-dir/some-file.md",
        history: "https://bitbucket.org/owner/repo/history-node/main/some-dir/some-file.md",
        issues: "https://bitbucket.org/owner/repo/issues",
        pulls: "https://bitbucket.org/owner/repo/pull-requests",
        compare: "https://bitbucket.org/owner/repo/pull-requests/new?source=feature",
        lineMulti: "#lines-1:2",
        lineSingle: "#lines-3",
      },
    };

    for (const providerKey of ["github", "gitlab", "bitbucket"]) {
      describe(`for a ${providerKey} remote`, () => {
        let file;
        const want = expected[providerKey];

        beforeEach(() => {
          file = repoFileFor(providerKey);
          atom.config.set("open-repository.includeLineNumbersInUrls", true);
        });

        it("builds the blob, blame and history URLs", () => {
          expect(file.blobURL()).toBe(want.blob);
          expect(file.blameURL()).toBe(want.blame);
          expect(file.historyURL()).toBe(want.history);
        });

        it("builds the issues, pull-request and compare URLs", () => {
          expect(file.issuesURL()).toBe(want.issues);
          expect(file.pullRequestsURL()).toBe(want.pulls);
          expect(file.branchCompareURL()).toBe(want.compare);
        });

        it("builds the correct line-range suffix", () => {
          expect(
            file.getLineRangeSuffix([
              [0, 0],
              [1, 1],
            ]),
          ).toBe(want.lineMulti);
          expect(
            file.getLineRangeSuffix([
              [2, 1],
              [2, 1],
            ]),
          ).toBe(want.lineSingle);
        });
      });
    }
  });

  describe("detectProvider", () => {
    function repoFileWithConfig(configValues = {}) {
      const file = new RepositoryFile();
      file.repo = {
        getConfigValue: (key) => configValues[key] ?? null,
      };
      return file;
    }

    it("detects GitLab and Bitbucket from the host and defaults to GitHub", () => {
      const file = repoFileWithConfig();
      expect(file.detectProvider("https://gitlab.com/foo/bar")).toBe("gitlab");
      expect(file.detectProvider("https://gitlab.example.com/foo/bar")).toBe("gitlab");
      expect(file.detectProvider("https://bitbucket.org/foo/bar")).toBe("bitbucket");
      expect(file.detectProvider("https://github.com/foo/bar")).toBe("github");
      expect(file.detectProvider("https://git.enterprize.me/foo/bar")).toBe("github");
    });

    it("lets an explicit git config override the detected provider", () => {
      const file = repoFileWithConfig({ "atom.open-repository.provider": "gitlab" });
      expect(file.detectProvider("https://git.enterprize.me/foo/bar")).toBe("gitlab");
    });

    it("ignores an unknown git config override", () => {
      const file = repoFileWithConfig({ "atom.open-repository.provider": "nope" });
      expect(file.detectProvider("https://bitbucket.org/foo/bar")).toBe("bitbucket");
    });
  });

  it("activates when a command is triggered on the active editor", async () => {
    const activationPromise = atom.packages.activatePackage("open-repository");

    await atom.workspace.open();
    atom.commands.dispatch(
      atom.views.getView(atom.workspace.getActivePane()),
      "open-repository:file",
    );
    await activationPromise;
  });
});
