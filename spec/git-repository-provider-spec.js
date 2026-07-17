const path = require("path");
const fs = require("@lumine-code/fs-plus");
const temp = require("temp").track();
const { Directory } = require("@lumine-code/pathwatcher");
const GitRepository = require("../src/git-repository");
const GitRepositoryProvider = require("../src/git-repository-provider");

describe("GitRepositoryProvider", () => {
  let provider;

  beforeEach(() => {
    provider = new GitRepositoryProvider(atom.project, atom.config, atom.confirm);
  });

  afterEach(() => {
    if (provider) {
      Object.keys(provider.pathToRepository).forEach((key) => {
        provider.pathToRepository[key].destroy();
      });
    }
  });

  describe(".repositoryForDirectory(directory)", () => {
    describe("when specified a Directory with a Git repository", () => {
      it("resolves with a GitRepository", async () => {
        const directory = new Directory(path.join(__dirname, "fixtures", "git", "master.git"));
        const result = await provider.repositoryForDirectory(directory);
        expect(result).toEqual(jasmine.any(GitRepository));
        expect(provider.pathToRepository[result.getPath()]).toBeTruthy();
        expect(result.getType()).toBe("git");
      });

      it("does not eagerly refresh status at open time", async () => {
        // The provider no longer forces a status pass when a repository is
        // discovered; consumers drive refreshes by subscribing to the Dugite
        // snapshot. This keeps startup off the per-repo status burst.
        const refreshStatusSnapshot = spyOn(
          GitRepository.prototype,
          "refreshStatusSnapshot",
        ).and.callThrough();
        const directory = new Directory(path.join(__dirname, "fixtures", "git", "master.git"));
        const result = await provider.repositoryForDirectory(directory);
        expect(result).toEqual(jasmine.any(GitRepository));
        expect(refreshStatusSnapshot).not.toHaveBeenCalled();
      });

      it("resolves with the same GitRepository for different Directory objects in the same repo", async () => {
        const firstRepo = await provider.repositoryForDirectory(
          new Directory(path.join(__dirname, "fixtures", "git", "master.git")),
        );
        const secondRepo = await provider.repositoryForDirectory(
          new Directory(path.join(__dirname, "fixtures", "git", "master.git", "objects")),
        );

        expect(firstRepo).toEqual(jasmine.any(GitRepository));
        expect(firstRepo).toBe(secondRepo);
      });
    });

    describe("when specified a Directory without a Git repository", () => {
      it("resolves with null", async () => {
        const directory = new Directory(temp.mkdirSync("dir"));
        const repo = await provider.repositoryForDirectory(directory);
        expect(repo).toBe(null);
      });
    });

    describe("when specified a Directory with an invalid Git repository", () => {
      it("resolves with null", async () => {
        const dirPath = temp.mkdirSync("dir");
        fs.writeFileSync(path.join(dirPath, ".git", "objects"), "");
        fs.writeFileSync(path.join(dirPath, ".git", "HEAD"), "");
        fs.writeFileSync(path.join(dirPath, ".git", "refs"), "");

        const directory = new Directory(dirPath);
        const repo = await provider.repositoryForDirectory(directory);
        expect(repo).toBe(null);
      });
    });

    describe("when specified a Directory with a valid gitfile-linked repository", () => {
      it("returns a Promise that resolves to a GitRepository", async () => {
        const gitDirPath = path.join(__dirname, "fixtures", "git", "master.git");
        const workDirPath = temp.mkdirSync("git-workdir");
        fs.writeFileSync(path.join(workDirPath, ".git"), `gitdir: ${gitDirPath}\n`);

        const directory = new Directory(workDirPath);
        const result = await provider.repositoryForDirectory(directory);
        expect(result).toEqual(jasmine.any(GitRepository));
        expect(provider.pathToRepository[result.getPath()]).toBeTruthy();
        expect(result.getType()).toBe("git");
      });
    });

    describe("when specified a Directory with a commondir file for a worktree", () => {
      it("returns a Promise that resolves to a GitRepository", async () => {
        const directory = new Directory(
          path.join(__dirname, "fixtures", "git", "master.git", "worktrees", "worktree-dir"),
        );
        const result = await provider.repositoryForDirectory(directory);
        expect(result).toEqual(jasmine.any(GitRepository));
        expect(provider.pathToRepository[result.getPath()]).toBeTruthy();
        expect(result.getType()).toBe("git");
      });
    });

    describe("when specified a Directory without exists()", () => {
      let directory;

      beforeEach(() => {
        // An implementation of Directory that does not implement existsSync().
        const subdirectory = {};
        directory = {
          getSubdirectory() {},
          isRoot() {
            return true;
          },
        };
        spyOn(directory, "getSubdirectory").and.returnValue(subdirectory);
      });

      it("returns a Promise that resolves to null", async () => {
        const repo = await provider.repositoryForDirectory(directory);
        expect(repo).toBe(null);
        expect(directory.getSubdirectory).toHaveBeenCalledWith(".git");
      });
    });
  });

  describe(".repositoryForDirectorySync(directory)", () => {
    describe("when specified a Directory with a Git repository", () => {
      it("resolves with a GitRepository", () => {
        const directory = new Directory(path.join(__dirname, "fixtures", "git", "master.git"));
        const result = provider.repositoryForDirectorySync(directory);
        expect(result).toEqual(jasmine.any(GitRepository));
        expect(provider.pathToRepository[result.getPath()]).toBeTruthy();
        expect(result.getType()).toBe("git");
      });

      it("resolves with the same GitRepository for different Directory objects in the same repo", () => {
        const firstRepo = provider.repositoryForDirectorySync(
          new Directory(path.join(__dirname, "fixtures", "git", "master.git")),
        );
        const secondRepo = provider.repositoryForDirectorySync(
          new Directory(path.join(__dirname, "fixtures", "git", "master.git", "objects")),
        );

        expect(firstRepo).toEqual(jasmine.any(GitRepository));
        expect(firstRepo).toBe(secondRepo);
      });
    });

    describe("when specified a Directory without a Git repository", () => {
      it("resolves with null", () => {
        const directory = new Directory(temp.mkdirSync("dir"));
        const repo = provider.repositoryForDirectorySync(directory);
        expect(repo).toBe(null);
      });
    });

    describe("when specified a Directory with an invalid Git repository", () => {
      it("resolves with null", () => {
        const dirPath = temp.mkdirSync("dir");
        fs.writeFileSync(path.join(dirPath, ".git", "objects"), "");
        fs.writeFileSync(path.join(dirPath, ".git", "HEAD"), "");
        fs.writeFileSync(path.join(dirPath, ".git", "refs"), "");

        const directory = new Directory(dirPath);
        const repo = provider.repositoryForDirectorySync(directory);
        expect(repo).toBe(null);
      });
    });

    describe("when specified a Directory with a valid gitfile-linked repository", () => {
      it("returns a Promise that resolves to a GitRepository", () => {
        const gitDirPath = path.join(__dirname, "fixtures", "git", "master.git");
        const workDirPath = temp.mkdirSync("git-workdir");
        fs.writeFileSync(path.join(workDirPath, ".git"), `gitdir: ${gitDirPath}\n`);

        const directory = new Directory(workDirPath);
        const result = provider.repositoryForDirectorySync(directory);
        expect(result).toEqual(jasmine.any(GitRepository));
        expect(provider.pathToRepository[result.getPath()]).toBeTruthy();
        expect(result.getType()).toBe("git");
      });
    });

    describe("when specified a Directory with a commondir file for a worktree", () => {
      it("returns a Promise that resolves to a GitRepository", () => {
        const directory = new Directory(
          path.join(__dirname, "fixtures", "git", "master.git", "worktrees", "worktree-dir"),
        );
        const result = provider.repositoryForDirectorySync(directory);
        expect(result).toEqual(jasmine.any(GitRepository));
        expect(provider.pathToRepository[result.getPath()]).toBeTruthy();
        expect(result.getType()).toBe("git");
      });
    });

    describe("when specified a Directory without existsSync()", () => {
      let directory;

      beforeEach(() => {
        // An implementation of Directory that does not implement existsSync().
        const subdirectory = {};
        directory = {
          getSubdirectory() {},
          isRoot() {
            return true;
          },
        };
        spyOn(directory, "getSubdirectory").and.returnValue(subdirectory);
      });

      it("returns null", () => {
        const repo = provider.repositoryForDirectorySync(directory);
        expect(repo).toBe(null);
        expect(directory.getSubdirectory).toHaveBeenCalledWith(".git");
      });
    });
  });

  describe("when GitRepository.open reports a dubious-ownership rejection", () => {
    const gitDir = { getPath: () => path.join(__dirname, "fixtures", "git", "owned.git") };
    let dubiousError;

    beforeEach(() => {
      dubiousError = new Error("repository path is not owned by the current user");
      dubiousError.code = "DubiousOwnership";
      spyOn(GitRepository, "open").and.callFake(() => {
        throw dubiousError;
      });
      spyOn(atom.notifications, "addError").and.callThrough();
    });

    it("returns null instead of throwing, and notifies the user once", () => {
      expect(provider.repositoryForGitDirectory(gitDir)).toBe(null);
      expect(provider.repositoryForGitDirectory(gitDir)).toBe(null);
      expect(atom.notifications.addError.calls.count()).toBe(1);
      const [message, options] = atom.notifications.addError.calls.mostRecent().args;
      expect(message).toContain("ownership");
      expect(options.buttons[0].text).toBe("Silence this session");
    });

    it("disables ownership validation and re-scans when the bypass button is clicked", () => {
      const GitUtils = require("@lumine-code/git-utils");
      spyOn(GitUtils, "setOwnerValidation");
      spyOn(atom.project.repositoryRegistry, "rescan").and.returnValue(Promise.resolve([]));

      provider.repositoryForGitDirectory(gitDir);
      const options = atom.notifications.addError.calls.mostRecent().args[1];
      options.buttons[0].onDidClick();

      expect(GitUtils.setOwnerValidation).toHaveBeenCalledWith(false);
      expect(atom.project.repositoryRegistry.rescan).toHaveBeenCalled();
    });
  });
});
