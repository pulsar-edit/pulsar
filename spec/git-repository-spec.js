const path = require("path");
const fs = require("@lumine-code/fs-plus");
const temp = require("temp").track();
const GitRepository = require("../src/git-repository");
const Project = require("../src/project");
const RepositoryRegistry = require("../src/repository-registry");

describe("GitRepository", () => {
  let repo;

  beforeEach(() => {
    const gitPath = path.join(temp.dir, ".git");
    if (fs.isDirectorySync(gitPath)) fs.removeSync(gitPath);
  });

  afterEach(() => {
    if (repo && !repo.isDestroyed()) repo.destroy();
  });

  describe("@open(path)", () => {
    it("returns null when no repository is found", () => {
      expect(GitRepository.open(path.join(temp.dir, "nogit.txt"))).toBeNull();
    });
  });

  describe("new GitRepository(path)", () => {
    it("throws an exception when no repository is found", () => {
      expect(() => new GitRepository(path.join(temp.dir, "nogit.txt"))).toThrow();
    });
  });

  describe(".getPath()", () => {
    it("returns the repository path for a .git directory path with a directory", () => {
      repo = new GitRepository(path.join(__dirname, "fixtures", "git", "master.git", "objects"));
      expect(repo.getPath()).toBe(path.join(__dirname, "fixtures", "git", "master.git"));
    });

    it("returns the repository path for a repository path", () => {
      repo = new GitRepository(path.join(__dirname, "fixtures", "git", "master.git"));
      expect(repo.getPath()).toBe(path.join(__dirname, "fixtures", "git", "master.git"));
    });
  });

  describe(".relativize(path) and .getWorkingDirectory()", () => {
    it("relativizes paths in, at, and outside the working directory", () => {
      const workingDirectory = copyRepository();
      repo = new GitRepository(workingDirectory);

      expect(repo.getWorkingDirectory()).toBeTruthy();
      expect(repo.relativize(path.join(workingDirectory, "a.txt"))).toBe("a.txt");
      expect(repo.relativize(path.join(workingDirectory, "dir", "b.txt"))).toBe("dir/b.txt");
      expect(repo.relativize(path.join(workingDirectory, "does-not-exist.txt"))).toBe(
        "does-not-exist.txt",
      );
      expect(repo.relativize(workingDirectory)).toBe("");
      expect(repo.relativize("")).toBe("");
    });
  });

  describe(".isPathIgnored(path)", () => {
    it("reads ignored paths from the status snapshot", async () => {
      const workingDirectory = copyRepository();
      fs.writeFileSync(path.join(workingDirectory, ".gitignore"), "ignored.txt\n");
      fs.writeFileSync(path.join(workingDirectory, "ignored.txt"), "secret");
      repo = new GitRepository(workingDirectory, { refreshOnWindowFocus: false });
      await repo.refreshStatusSnapshot();

      expect(repo.isPathIgnored(path.join(workingDirectory, "ignored.txt"))).toBe(true);
      expect(repo.isPathIgnored(path.join(workingDirectory, "a.txt"))).toBe(false);
    });

    it("returns false before the status snapshot has loaded", () => {
      repo = new GitRepository(copyRepository(), { refreshOnWindowFocus: false });
      expect(repo.isPathIgnored("a.txt")).toBe(false);
    });
  });

  describe(".isPathModified(path)", () => {
    let filePath, newPath, workingDirPath;

    beforeEach(() => {
      workingDirPath = copyRepository();
      repo = new GitRepository(workingDirPath, { refreshOnWindowFocus: false });
      filePath = path.join(workingDirPath, "a.txt");
      newPath = path.join(workingDirPath, "new-path.txt");
    });

    it("reflects the status snapshot for modified and deleted paths", async () => {
      await repo.refreshStatusSnapshot();
      expect(repo.isPathModified(filePath)).toBe(false);

      fs.writeFileSync(filePath, "change");
      await repo.refreshStatusSnapshot();
      expect(repo.isPathModified(filePath)).toBe(true);

      fs.removeSync(filePath);
      await repo.refreshStatusSnapshot();
      expect(repo.isPathModified(filePath)).toBe(true);
    });

    it("returns false for a new (untracked) path", async () => {
      fs.writeFileSync(newPath, "new");
      await repo.refreshStatusSnapshot();
      expect(repo.isPathModified(newPath)).toBe(false);
    });
  });

  describe(".isPathNew(path)", () => {
    let filePath, newPath, workingDirPath;

    beforeEach(() => {
      workingDirPath = copyRepository();
      repo = new GitRepository(workingDirPath, { refreshOnWindowFocus: false });
      filePath = path.join(workingDirPath, "a.txt");
      newPath = path.join(workingDirPath, "new-path.txt");
      fs.writeFileSync(newPath, "i'm new here");
    });

    it("returns true for an untracked path from the status snapshot", async () => {
      await repo.refreshStatusSnapshot();
      expect(repo.isPathNew(newPath)).toBe(true);
      expect(repo.isPathNew(filePath)).toBe(false);
    });
  });

  describe(".checkoutHead(path)", () => {
    let filePath;

    beforeEach(() => {
      const workingDirPath = copyRepository();
      atom.project.setPaths([workingDirPath]);
      repo = atom.repositories.getRepositories()[0];
      filePath = path.join(workingDirPath, "a.txt");
    });

    it("restores the contents of the path to the version at HEAD", async () => {
      fs.writeFileSync(filePath, "ch ch changes");
      expect(await repo.checkoutHead(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, "utf8")).toBe("");
    });

    it("reports the path as unmodified after checkout", async () => {
      fs.writeFileSync(filePath, "ch ch changes");
      await repo.refreshStatusSnapshot();
      expect(repo.isPathModified(filePath)).toBe(true);

      await repo.checkoutHead(filePath);
      await repo.refreshStatusSnapshot();
      expect(repo.isPathModified(filePath)).toBe(false);
    });
  });

  describe(".checkoutHeadForEditor(editor)", () => {
    let filePath, editor;

    beforeEach(async () => {
      const workingDirPath = copyRepository();
      atom.project.setPaths([workingDirPath]);
      repo = atom.repositories.getRepositories()[0];
      filePath = path.join(workingDirPath, "a.txt");
      fs.writeFileSync(filePath, "ch ch changes");

      editor = await atom.workspace.open(filePath);
    });

    it("restores the editor's file to the version at HEAD", (done) => {
      jasmine.filterByPlatform({ except: ["win32"] }, done); // Flakey EPERM opening a.txt on Win32

      repo.checkoutHeadForEditor(editor).then(() => {
        expect(fs.readFileSync(filePath, "utf8")).toBe("");
        done();
      });
    });
  });

  describe(".destroy()", () => {
    it("throws an exception when any method is called after it is called", () => {
      repo = new GitRepository(path.join(__dirname, "fixtures", "git", "master.git"));
      repo.destroy();
      expect(() => repo.getShortHead()).toThrow();
    });
  });

  describe(".getDirectoryStatusSummary(path)", () => {
    let directoryPath, filePath, workingDirectory;

    beforeEach(() => {
      workingDirectory = copyRepository();
      repo = new GitRepository(workingDirectory, { refreshOnWindowFocus: false });
      directoryPath = path.join(workingDirectory, "fresh-dir");
      filePath = path.join(directoryPath, "new.txt");
    });

    it("aggregates the status of the files inside the directory from the snapshot", async () => {
      await repo.refreshStatusSnapshot();
      expect(repo.getDirectoryStatusSummary(directoryPath)).toBeNull();

      fs.mkdirSync(directoryPath);
      fs.writeFileSync(filePath, "abc");
      await repo.refreshStatusSnapshot();
      expect(repo.getDirectoryStatusSummary(directoryPath).added).toBe(true);
    });
  });

  describe(".refreshStatusSnapshot()", () => {
    let output, statusSnapshotProvider, workingDirectory;

    beforeEach(() => {
      workingDirectory = copyRepository();
      output = ["# branch.oid abc123", "# branch.head main", "? new file.txt", ""].join("\0");
      statusSnapshotProvider = {
        getStatus: jasmine.createSpy("getStatus").andCallFake(() => Promise.resolve(output)),
      };
      repo = new GitRepository(workingDirectory, {
        refreshOnWindowFocus: false,
        statusSnapshotProvider,
      });
    });

    it("caches immutable entries and only emits semantic changes", async () => {
      const changeHandler = jasmine.createSpy("changeHandler");
      repo.onDidChangeStatusSnapshot(changeHandler);

      const firstSnapshot = await repo.refreshStatusSnapshot();
      const secondSnapshot = await repo.refreshStatusSnapshot();

      expect(firstSnapshot.initialized).toBe(true);
      expect(firstSnapshot.generation).toBe(1);
      expect(secondSnapshot).toBe(firstSnapshot);
      expect(changeHandler.calls.count()).toBe(1);
      expect(repo.getStatusEntry("new file.txt")).toBe(firstSnapshot.files[0]);
      expect(repo.getStatusEntry(path.join(workingDirectory, "new file.txt"))).toBe(
        firstSnapshot.files[0],
      );

      output = "# branch.oid abc123\0# branch.head main\0";
      const cleanSnapshot = await repo.refreshStatusSnapshot();
      expect(cleanSnapshot.generation).toBe(2);
      expect(cleanSnapshot.files).toEqual([]);
      expect(repo.getStatusEntry("new file.txt")).toBeNull();
      expect(changeHandler.calls.count()).toBe(2);
    });

    it("forwards cancellation and ignored-file options", async () => {
      const signal = {};
      const snapshot = await repo.refreshStatusSnapshot({ includeIgnored: true, signal });

      expect(snapshot.includesIgnored).toBe(true);
      const [statusPath, statusOptions] = statusSnapshotProvider.getStatus.calls.argsFor(0);
      expect(statusPath).toBe(repo.getWorkingDirectory());
      expect(statusOptions.includeIgnored).toBe(true);
      expect(statusOptions.signal).toBe(signal);
    });

    it("resolves ignore state from the snapshot's ignored entries", async () => {
      output = [
        "# branch.oid abc123",
        "# branch.head main",
        "! secret.key",
        "! node_modules/",
        "",
      ].join("\0");
      await repo.refreshStatusSnapshot();

      expect(repo.isPathIgnoredCached(path.join(workingDirectory, "secret.key"))).toBe(true);
      expect(repo.isPathIgnoredCached(path.join(workingDirectory, "node_modules", "foo.js"))).toBe(
        true,
      );
      expect(repo.isPathIgnoredCached(path.join(workingDirectory, "node_modules"))).toBe(true);
      expect(repo.isPathIgnoredCached(path.join(workingDirectory, "src", "index.js"))).toBe(false);
    });

    it("does not let an older concurrent refresh replace a newer snapshot", async () => {
      const resolvers = [];
      statusSnapshotProvider.getStatus.andCallFake(
        () => new Promise((resolve) => resolvers.push(resolve)),
      );

      const olderRefresh = repo.refreshStatusSnapshot();
      const newerRefresh = repo.refreshStatusSnapshot();
      resolvers[1]("# branch.oid newest\0# branch.head main\0? newest.txt\0");
      const newerSnapshot = await newerRefresh;
      resolvers[0]("# branch.oid older\0# branch.head main\0? older.txt\0");

      expect(await olderRefresh).toBe(newerSnapshot);
      expect(repo.getStatusSnapshot()).toBe(newerSnapshot);
      expect(repo.getStatusEntry("newest.txt")).toBe(newerSnapshot.files[0]);
      expect(repo.getStatusEntry("older.txt")).toBeNull();
    });
  });

  describe("status snapshot scheduling", () => {
    let output, statusSnapshotProvider;

    // The spec clock is fake: advanceClock() fires the debounce timer, then a
    // few microtask turns let the provider promise settle.
    const runScheduler = async () => {
      advanceClock(1);
      for (let i = 0; i < 5; i++) await Promise.resolve();
    };

    beforeEach(() => {
      output = "# branch.oid abc123\0# branch.head main\0? new.txt\0";
      statusSnapshotProvider = {
        getStatus: jasmine.createSpy("getStatus").andCallFake(() => Promise.resolve(output)),
      };
      repo = new GitRepository(copyRepository(), {
        refreshOnWindowFocus: false,
        statusSnapshotDebounceMs: 0,
        statusSnapshotProvider,
      });
    });

    it("loads the snapshot when the first subscriber attaches", async () => {
      expect(repo.getStatusSnapshot().initialized).toBe(false);

      const snapshotPromise = new Promise((resolve) => repo.onDidChangeStatusSnapshot(resolve));
      await runScheduler();

      const snapshot = await snapshotPromise;
      expect(snapshot.initialized).toBe(true);
      expect(repo.getStatusSnapshot()).toBe(snapshot);
      expect(statusSnapshotProvider.getStatus.calls.count()).toBe(1);
    });

    it("coalesces refresh triggers within the debounce window", async () => {
      repo.onDidChangeStatusSnapshot(() => {});
      repo.onDidChangeStatusSnapshot(() => {});
      repo.scheduleStatusSnapshotRefresh();
      repo.scheduleStatusSnapshotRefresh();

      await runScheduler();
      await runScheduler();

      expect(statusSnapshotProvider.getStatus.calls.count()).toBe(1);
    });

    it("does not spawn a status subprocess without subscribers", async () => {
      repo.scheduleStatusSnapshotRefresh();
      await runScheduler();

      expect(statusSnapshotProvider.getStatus.calls.count()).toBe(0);
    });

    it("refreshes again when scheduled while a subscriber exists", async () => {
      repo.onDidChangeStatusSnapshot(() => {});
      await runScheduler();

      output = "# branch.oid def456\0# branch.head main\0? other.txt\0";
      repo.scheduleStatusSnapshotRefresh();
      await runScheduler();

      expect(repo.getStatusSnapshot().files[0].path).toBe("other.txt");
      expect(statusSnapshotProvider.getStatus.calls.count()).toBe(2);
    });

    it("stops scheduling after the last subscriber is disposed", async () => {
      const subscription = repo.onDidChangeStatusSnapshot(() => {});
      await runScheduler();

      subscription.dispose();
      subscription.dispose();
      repo.scheduleStatusSnapshotRefresh();
      await runScheduler();

      expect(statusSnapshotProvider.getStatus.calls.count()).toBe(1);
    });

    it("refreshes on resubscription so a returning consumer never sees stale state", async () => {
      const subscription = repo.onDidChangeStatusSnapshot(() => {});
      await runScheduler();
      subscription.dispose();

      repo.onDidChangeStatusSnapshot(() => {});
      await runScheduler();

      expect(statusSnapshotProvider.getStatus.calls.count()).toBe(2);
    });

    it("shares one in-flight load between concurrent ensureStatusSnapshot callers", async () => {
      const resolvers = [];
      statusSnapshotProvider.getStatus.andCallFake(
        () => new Promise((resolve) => resolvers.push(resolve)),
      );

      const firstEnsure = repo.ensureStatusSnapshot();
      const secondEnsure = repo.ensureStatusSnapshot();
      resolvers[0](output);

      const snapshot = await firstEnsure;
      expect(await secondEnsure).toBe(snapshot);
      expect(snapshot.initialized).toBe(true);
      expect(statusSnapshotProvider.getStatus.calls.count()).toBe(1);

      expect(await repo.ensureStatusSnapshot()).toBe(snapshot);
      expect(statusSnapshotProvider.getStatus.calls.count()).toBe(1);
    });

    it("survives destruction while a refresh is scheduled or in flight", async () => {
      statusSnapshotProvider.getStatus.andCallFake(() => new Promise(() => {}));
      repo.onDidChangeStatusSnapshot(() => {});
      repo.destroy();
      await runScheduler();

      const scheduled = new GitRepository(copyRepository(), {
        refreshOnWindowFocus: false,
        statusSnapshotDebounceMs: 1000,
        statusSnapshotProvider,
      });
      scheduled.onDidChangeStatusSnapshot(() => {});
      scheduled.destroy();
      expect(scheduled.statusSnapshotRefreshTimer).toBeNull();
    });
  });

  describe("refs snapshot scheduling", () => {
    let refsOutputs, refsSnapshotProvider;

    const runScheduler = async () => {
      advanceClock(1);
      for (let i = 0; i < 5; i++) await Promise.resolve();
    };

    const makeOutputs = (branch) => ({
      forEachRef: `refs/heads/${branch}\0${branch}\0aaaa\0commit\0\0\0\0\0*\0`,
      remotes: "",
      worktrees: "",
      symbolicHead: `refs/heads/${branch}\n`,
      headOid: "aaaa\n",
    });

    beforeEach(() => {
      refsOutputs = makeOutputs("main");
      refsSnapshotProvider = {
        getRefs: jasmine.createSpy("getRefs").andCallFake(() => Promise.resolve(refsOutputs)),
      };
      repo = new GitRepository(copyRepository(), {
        refreshOnWindowFocus: false,
        refsSnapshotDebounceMs: 0,
        refsSnapshotProvider,
      });
    });

    it("loads the refs snapshot when the first subscriber attaches", async () => {
      expect(repo.getRefsSnapshot().initialized).toBe(false);

      const snapshotPromise = new Promise((resolve) => repo.onDidChangeRefsSnapshot(resolve));
      await runScheduler();

      const snapshot = await snapshotPromise;
      expect(snapshot.initialized).toBe(true);
      expect(snapshot.head.name).toBe("main");
      expect(snapshot.branches[0].isHead).toBe(true);
      expect(repo.getRefsSnapshot()).toBe(snapshot);
      expect(refsSnapshotProvider.getRefs.calls.count()).toBe(1);
    });

    it("does not emit when the raw outputs are unchanged", async () => {
      const changeHandler = jasmine.createSpy("changeHandler");
      repo.onDidChangeRefsSnapshot(changeHandler);
      await runScheduler();

      const firstSnapshot = await repo.refreshRefsSnapshot();
      expect(await repo.refreshRefsSnapshot()).toBe(firstSnapshot);
      expect(changeHandler.calls.count()).toBe(1);

      refsOutputs = makeOutputs("feature");
      const secondSnapshot = await repo.refreshRefsSnapshot();
      expect(secondSnapshot.generation).toBe(2);
      expect(secondSnapshot.head.name).toBe("feature");
      expect(changeHandler.calls.count()).toBe(2);
    });

    it("does not let an older concurrent refresh replace a newer refs snapshot", async () => {
      const resolvers = [];
      refsSnapshotProvider.getRefs.andCallFake(
        () => new Promise((resolve) => resolvers.push(resolve)),
      );

      const olderRefresh = repo.refreshRefsSnapshot();
      const newerRefresh = repo.refreshRefsSnapshot();
      resolvers[1](makeOutputs("newest"));
      const newerSnapshot = await newerRefresh;
      resolvers[0](makeOutputs("older"));

      expect(await olderRefresh).toBe(newerSnapshot);
      expect(repo.getRefsSnapshot().head.name).toBe("newest");
    });

    it("refreshes refs again when scheduled while a subscriber exists", async () => {
      repo.onDidChangeRefsSnapshot(() => {});
      await runScheduler();

      refsOutputs = makeOutputs("switched");
      repo.scheduleRefsSnapshotRefresh();
      await runScheduler();

      expect(repo.getRefsSnapshot().head.name).toBe("switched");
      expect(refsSnapshotProvider.getRefs.calls.count()).toBe(2);
    });

    it("shares one in-flight load between concurrent ensureRefsSnapshot callers", async () => {
      const resolvers = [];
      refsSnapshotProvider.getRefs.andCallFake(
        () => new Promise((resolve) => resolvers.push(resolve)),
      );

      const firstEnsure = repo.ensureRefsSnapshot();
      const secondEnsure = repo.ensureRefsSnapshot();
      resolvers[0](refsOutputs);

      const snapshot = await firstEnsure;
      expect(await secondEnsure).toBe(snapshot);
      expect(refsSnapshotProvider.getRefs.calls.count()).toBe(1);
      expect(await repo.ensureRefsSnapshot()).toBe(snapshot);
      expect(refsSnapshotProvider.getRefs.calls.count()).toBe(1);
    });

    it("clears the pending refresh timer on destroy", () => {
      const scheduled = new GitRepository(copyRepository(), {
        refreshOnWindowFocus: false,
        refsSnapshotDebounceMs: 1000,
        refsSnapshotProvider,
      });
      scheduled.onDidChangeRefsSnapshot(() => {});
      scheduled.destroy();
      expect(scheduled.refsSnapshotRefreshTimer).toBeNull();
    });
  });

  describe("ref reads backed by the refs snapshot", () => {
    let repoWithRefs;

    beforeEach(async () => {
      const forEachRef = [
        // main branch, tracking origin/main, 2 ahead and 1 behind, is HEAD
        "refs/heads/main\0main\0aaaa1111\0commit\0\0refs/remotes/origin/main\0origin/main\0ahead 2, behind 1\0*\0",
        "refs/remotes/origin/main\0origin/main\0bbbb2222\0commit\0\0\0\0\0\0",
        "refs/tags/v1\0v1\0cccc3333\0commit\0\0\0\0\0\0",
      ].join("\n");
      const refsSnapshotProvider = {
        getRefs: () =>
          Promise.resolve({
            forEachRef,
            remotes:
              "origin\thttps://github.com/some-user/some-repo.git (fetch)\n" +
              "origin\thttps://github.com/some-user/some-repo.git (push)",
            worktrees: "",
            symbolicHead: "refs/heads/main\n",
            headOid: "aaaa1111\n",
          }),
      };
      repoWithRefs = new GitRepository(copyRepository(), {
        refreshOnWindowFocus: false,
        refsSnapshotProvider,
      });
      await repoWithRefs.refreshRefsSnapshot();
    });

    afterEach(() => {
      if (repoWithRefs && !repoWithRefs.isDestroyed()) repoWithRefs.destroy();
    });

    it("resolves reference targets from the snapshot without libgit2", () => {
      expect(repoWithRefs.getReferenceTarget("HEAD")).toBe("aaaa1111");
      expect(repoWithRefs.getReferenceTarget("refs/heads/main")).toBe("aaaa1111");
      expect(repoWithRefs.getReferenceTarget("refs/remotes/origin/main")).toBe("bbbb2222");
      expect(repoWithRefs.getReferenceTarget("refs/tags/v1")).toBe("cccc3333");
      expect(repoWithRefs.hasBranch("main")).toBe(true);
    });

    it("lists references from the snapshot", () => {
      expect(repoWithRefs.getReferences()).toEqual({
        heads: ["refs/heads/main"],
        remotes: ["refs/remotes/origin/main"],
        tags: ["refs/tags/v1"],
      });
    });

    it("reads the upstream branch and ahead/behind counts from the snapshot", () => {
      expect(repoWithRefs.getUpstreamBranch()).toBe("refs/remotes/origin/main");
      expect(repoWithRefs.getAheadBehindCount("main")).toEqual({ ahead: 2, behind: 1 });
      expect(repoWithRefs.getCachedUpstreamAheadBehindCount()).toEqual({ ahead: 2, behind: 1 });
    });

    it("reads the origin URL from the snapshot remotes", () => {
      expect(repoWithRefs.getOriginURL()).toBe("https://github.com/some-user/some-repo.git");
    });
  });

  describe("status summaries", () => {
    let output, statusSnapshotProvider, workingDirectory;

    beforeEach(() => {
      workingDirectory = copyRepository();
      output = "# branch.oid abc123\0# branch.head main\0";
      statusSnapshotProvider = {
        getStatus: jasmine.createSpy("getStatus").andCallFake(() => Promise.resolve(output)),
      };
      repo = new GitRepository(workingDirectory, {
        refreshOnWindowFocus: false,
        statusSnapshotProvider,
      });
    });

    it("returns null for every query before the snapshot loads", () => {
      expect(repo.getPathStatusSummary(path.join(workingDirectory, "a.txt"))).toBeNull();
      expect(repo.getDirectoryStatusSummary(workingDirectory)).toBeNull();
    });

    it("pins the snapshot classification to the legacy modified-beats-added order", async () => {
      output = [
        "# branch.oid abc123",
        "# branch.head main",
        "1 .M N... 100644 100644 100644 aaa bbb modified.txt",
        "1 A. N... 000000 100644 100644 000 bbb added.txt",
        "1 AM N... 000000 100644 100644 000 bbb added-modified.txt",
        "1 .D N... 100644 100644 000000 aaa bbb deleted.txt",
        "2 R. N... 100644 100644 100644 aaa bbb R100 renamed.txt",
        "old-name.txt",
        "u UU N... 100644 100644 100644 100644 aaa bbb ccc conflicted.txt",
        "? untracked.txt",
        "",
      ].join("\0");
      await repo.refreshStatusSnapshot();

      const summaryOf = (name) => repo.getPathStatusSummary(name);
      expect(summaryOf("modified.txt")).toEqual(
        jasmine.objectContaining({ source: "snapshot", modified: true, added: false }),
      );
      expect(summaryOf("added.txt")).toEqual(
        jasmine.objectContaining({ added: true, modified: false }),
      );
      expect(summaryOf("added-modified.txt")).toEqual(
        jasmine.objectContaining({ modified: true, added: false }),
      );
      expect(summaryOf("deleted.txt")).toEqual(jasmine.objectContaining({ modified: true }));
      expect(summaryOf("renamed.txt")).toEqual(
        jasmine.objectContaining({ modified: true, renamed: true }),
      );
      expect(summaryOf("conflicted.txt")).toEqual(
        jasmine.objectContaining({ conflicted: true, modified: false, added: false }),
      );
      expect(summaryOf("untracked.txt")).toEqual(
        jasmine.objectContaining({ added: true, modified: false }),
      );
      expect(summaryOf("absent.txt")).toBeNull();
    });

    it("aggregates directory status from the snapshot in one pass", async () => {
      output = [
        "# branch.oid abc123",
        "# branch.head main",
        "1 .M N... 100644 100644 100644 aaa bbb src/a.txt",
        "u UU N... 100644 100644 100644 100644 aaa bbb ccc src/deep/c.txt",
        "? src/deep/new.txt",
        "",
      ].join("\0");
      await repo.refreshStatusSnapshot();

      const deep = repo.getDirectoryStatusSummary(path.join(workingDirectory, "src", "deep"));
      expect(deep.source).toBe("snapshot");
      expect(deep.conflicted).toBe(true);
      expect(deep.added).toBe(true);
      expect(deep.modified).toBe(false);

      const src = repo.getDirectoryStatusSummary(path.join(workingDirectory, "src"));
      expect(src.conflicted).toBe(true);
      expect(src.modified).toBe(true);
      expect(src.added).toBe(true);

      const root = repo.getDirectoryStatusSummary(workingDirectory);
      expect(root.source).toBe("snapshot");
      expect(root.conflicted).toBe(true);

      expect(repo.getDirectoryStatusSummary(path.join(workingDirectory, "dir"))).toBeNull();
    });

    it("rebuilds the aggregates when a newer snapshot arrives", async () => {
      output = [
        "# branch.oid abc123",
        "# branch.head main",
        "1 .M N... 100644 100644 100644 aaa bbb src/a.txt",
        "",
      ].join("\0");
      await repo.refreshStatusSnapshot();
      expect(repo.getDirectoryStatusSummary(workingDirectory).modified).toBe(true);

      output = "# branch.oid abc123\0# branch.head main\0";
      await repo.refreshStatusSnapshot();
      expect(repo.getDirectoryStatusSummary(workingDirectory)).toBeNull();
    });
  });

  describe("buffer events", () => {
    let editor, repository;

    beforeEach(async () => {
      atom.project.setPaths([copyRepository()]);
      editor = await atom.workspace.open("other.txt");
      repository = atom.repositories.getRepositories()[0];
    });

    it("schedules a status snapshot refresh when a buffer is saved", async () => {
      editor.insertNewline();
      const refresh = spyOn(repository, "scheduleStatusSnapshotRefresh");
      await editor.save();
      expect(refresh).toHaveBeenCalled();
    });

    it("schedules a status snapshot refresh when a buffer is reloaded", async () => {
      fs.writeFileSync(editor.getPath(), "changed");
      const refresh = spyOn(repository, "scheduleStatusSnapshotRefresh");
      await editor.getBuffer().reload();
      expect(refresh).toHaveBeenCalled();
    });

    it("schedules a status snapshot refresh when a buffer's path changes", () => {
      const refresh = spyOn(repository, "scheduleStatusSnapshotRefresh");
      editor.getBuffer().emitter.emit("did-change-path");
      expect(refresh).toHaveBeenCalled();
    });

    it("stops listening to the buffer when the repository is destroyed (regression)", () => {
      repository.destroy();
      expect(() => editor.save()).not.toThrow();
    });
  });

  describe("when a project is deserialized", () => {
    let buffer, project2, repositoryRegistry2;

    afterEach(() => {
      if (project2) project2.destroy();
      if (repositoryRegistry2) repositoryRegistry2.destroy();
    });

    it("subscribes to all the serialized buffers in the project", async () => {
      atom.project.setPaths([copyRepository()]);

      await atom.workspace.open("file.txt");

      repositoryRegistry2 = new RepositoryRegistry({
        config: atom.config,
        notificationManager: atom.notifications,
      });
      project2 = new Project({
        notificationManager: atom.notifications,
        packageManager: atom.packages,
        confirm: atom.confirm,
        grammarRegistry: atom.grammars,
        applicationDelegate: atom.applicationDelegate,
        repositoryRegistry: repositoryRegistry2,
      });
      await project2.deserialize(atom.project.serialize({ isUnloading: false }));

      buffer = project2.getBuffers()[0];
      buffer.append("changes");

      const repository = repositoryRegistry2.getRepositories()[0];
      const refresh = spyOn(repository, "scheduleStatusSnapshotRefresh");
      await buffer.save();

      expect(refresh).toHaveBeenCalled();
    });
  });
});

function copyRepository() {
  const workingDirPath = temp.mkdirSync("atom-spec-git");
  fs.copySync(path.join(__dirname, "fixtures", "git", "working-dir"), workingDirPath);
  fs.renameSync(path.join(workingDirPath, "git.git"), path.join(workingDirPath, ".git"));
  return workingDirPath;
}
