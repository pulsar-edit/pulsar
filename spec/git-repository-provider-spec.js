const path = require("path");
const fs = require("@lumine-code/fs-plus");
const temp = require("temp").track();
const ProjectDirectory = require("../src/project-directory");
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
        const directory = new ProjectDirectory(path.join(__dirname, "fixtures", "git", "master.git"));
        const result = await provider.repositoryForDirectory(directory);
        expect(result).toEqual(jasmine.any(GitRepository));
        expect(provider.pathToRepository[result.getPath()]).toBeTruthy();
        expect(result.getType()).toBe("git");
      });

      it("does not eagerly refresh status at open time", async () => {
        // The provider no longer forces a status pass when a repository is
        // discovered; consumers drive refreshes by subscribing to the Git
        // snapshot. This keeps startup off the per-repo status burst.
        const refreshStatusSnapshot = spyOn(
          GitRepository.prototype,
          "refreshStatusSnapshot",
        ).and.callThrough();
        const directory = new ProjectDirectory(path.join(__dirname, "fixtures", "git", "master.git"));
        const result = await provider.repositoryForDirectory(directory);
        expect(result).toEqual(jasmine.any(GitRepository));
        expect(refreshStatusSnapshot).not.toHaveBeenCalled();
      });

      it("resolves with the same GitRepository for different Directory objects in the same repo", async () => {
        const firstRepo = await provider.repositoryForDirectory(
          new ProjectDirectory(path.join(__dirname, "fixtures", "git", "master.git")),
        );
        const secondRepo = await provider.repositoryForDirectory(
          new ProjectDirectory(path.join(__dirname, "fixtures", "git", "master.git", "objects")),
        );

        expect(firstRepo).toEqual(jasmine.any(GitRepository));
        expect(firstRepo).toBe(secondRepo);
      });
    });

    describe("when specified a Directory without a Git repository", () => {
      it("resolves with null", async () => {
        const directory = new ProjectDirectory(temp.mkdirSync("dir"));
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

        const directory = new ProjectDirectory(dirPath);
        const repo = await provider.repositoryForDirectory(directory);
        expect(repo).toBe(null);
      });
    });

    describe("when specified a Directory with a valid gitfile-linked repository", () => {
      it("returns a Promise that resolves to a GitRepository", async () => {
        const gitDirPath = path.join(__dirname, "fixtures", "git", "master.git");
        const workDirPath = temp.mkdirSync("git-workdir");
        fs.writeFileSync(path.join(workDirPath, ".git"), `gitdir: ${gitDirPath}\n`);

        const directory = new ProjectDirectory(workDirPath);
        const result = await provider.repositoryForDirectory(directory);
        expect(result).toEqual(jasmine.any(GitRepository));
        expect(provider.pathToRepository[result.getPath()]).toBeTruthy();
        expect(result.getType()).toBe("git");
      });
    });

    describe("when specified a Directory with a commondir file for a worktree", () => {
      it("returns a Promise that resolves to a GitRepository", async () => {
        const directory = new ProjectDirectory(
          path.join(__dirname, "fixtures", "git", "master.git", "worktrees", "worktree-dir"),
        );
        const result = await provider.repositoryForDirectory(directory);
        expect(result).toEqual(jasmine.any(GitRepository));
        expect(provider.pathToRepository[result.getPath()]).toBeTruthy();
        expect(result.getType()).toBe("git");
      });
    });

    describe("when specified a plain directory path string with no repository", () => {
      it("returns a Promise that resolves to null", async () => {
        const repo = await provider.repositoryForDirectory(temp.mkdirSync("dir"));
        expect(repo).toBe(null);
      });
    });
  });

  describe(".repositoryForDirectorySync(directory)", () => {
    describe("when specified a Directory with a Git repository", () => {
      it("resolves with a GitRepository", () => {
        const directory = new ProjectDirectory(path.join(__dirname, "fixtures", "git", "master.git"));
        const result = provider.repositoryForDirectorySync(directory);
        expect(result).toEqual(jasmine.any(GitRepository));
        expect(provider.pathToRepository[result.getPath()]).toBeTruthy();
        expect(result.getType()).toBe("git");
      });

      it("resolves with the same GitRepository for different Directory objects in the same repo", () => {
        const firstRepo = provider.repositoryForDirectorySync(
          new ProjectDirectory(path.join(__dirname, "fixtures", "git", "master.git")),
        );
        const secondRepo = provider.repositoryForDirectorySync(
          new ProjectDirectory(path.join(__dirname, "fixtures", "git", "master.git", "objects")),
        );

        expect(firstRepo).toEqual(jasmine.any(GitRepository));
        expect(firstRepo).toBe(secondRepo);
      });
    });

    describe("when specified a Directory without a Git repository", () => {
      it("resolves with null", () => {
        const directory = new ProjectDirectory(temp.mkdirSync("dir"));
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

        const directory = new ProjectDirectory(dirPath);
        const repo = provider.repositoryForDirectorySync(directory);
        expect(repo).toBe(null);
      });
    });

    describe("when specified a Directory with a valid gitfile-linked repository", () => {
      it("returns a Promise that resolves to a GitRepository", () => {
        const gitDirPath = path.join(__dirname, "fixtures", "git", "master.git");
        const workDirPath = temp.mkdirSync("git-workdir");
        fs.writeFileSync(path.join(workDirPath, ".git"), `gitdir: ${gitDirPath}\n`);

        const directory = new ProjectDirectory(workDirPath);
        const result = provider.repositoryForDirectorySync(directory);
        expect(result).toEqual(jasmine.any(GitRepository));
        expect(provider.pathToRepository[result.getPath()]).toBeTruthy();
        expect(result.getType()).toBe("git");
      });
    });

    describe("when specified a Directory with a commondir file for a worktree", () => {
      it("returns a Promise that resolves to a GitRepository", () => {
        const directory = new ProjectDirectory(
          path.join(__dirname, "fixtures", "git", "master.git", "worktrees", "worktree-dir"),
        );
        const result = provider.repositoryForDirectorySync(directory);
        expect(result).toEqual(jasmine.any(GitRepository));
        expect(provider.pathToRepository[result.getPath()]).toBeTruthy();
        expect(result.getType()).toBe("git");
      });
    });

    describe("when specified a directory-like object exposing only getPath()", () => {
      it("returns null for a path without a Git repository", () => {
        // The provider derives the path via `getPath()` and walks the tree with
        // `fs`; it must not require any other Directory method (existsSync,
        // getSubdirectory, …) on the value object.
        const directory = { getPath: () => temp.mkdirSync("dir") };
        const repo = provider.repositoryForDirectorySync(directory);
        expect(repo).toBe(null);
      });
    });
  });
});
