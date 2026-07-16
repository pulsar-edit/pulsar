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

  describe(".isPathIgnored(path)", () => {
    it("returns true for an ignored path", () => {
      repo = new GitRepository(path.join(__dirname, "fixtures", "git", "ignore.git"));
      expect(repo.isPathIgnored("a.txt")).toBeTruthy();
    });

    it("returns false for a non-ignored path", () => {
      repo = new GitRepository(path.join(__dirname, "fixtures", "git", "ignore.git"));
      expect(repo.isPathIgnored("b.txt")).toBeFalsy();
    });
  });

  describe(".isPathModified(path)", () => {
    let filePath, newPath;

    beforeEach(() => {
      const workingDirPath = copyRepository();
      repo = new GitRepository(workingDirPath);
      filePath = path.join(workingDirPath, "a.txt");
      newPath = path.join(workingDirPath, "new-path.txt");
    });

    describe("when the path is unstaged", () => {
      it("returns false if the path has not been modified", () => {
        expect(repo.isPathModified(filePath)).toBeFalsy();
      });

      it("returns true if the path is modified", () => {
        fs.writeFileSync(filePath, "change");
        expect(repo.isPathModified(filePath)).toBeTruthy();
      });

      it("returns true if the path is deleted", () => {
        fs.removeSync(filePath);
        expect(repo.isPathModified(filePath)).toBeTruthy();
      });

      it("returns false if the path is new", () => {
        expect(repo.isPathModified(newPath)).toBeFalsy();
      });
    });
  });

  describe(".isPathNew(path)", () => {
    let filePath, newPath;

    beforeEach(() => {
      const workingDirPath = copyRepository();
      repo = new GitRepository(workingDirPath);
      filePath = path.join(workingDirPath, "a.txt");
      newPath = path.join(workingDirPath, "new-path.txt");
      fs.writeFileSync(newPath, "i'm new here");
    });

    describe("when the path is unstaged", () => {
      it("returns true if the path is new", () => {
        expect(repo.isPathNew(newPath)).toBeTruthy();
      });

      it("returns false if the path isn't new", () => {
        expect(repo.isPathNew(filePath)).toBeFalsy();
      });
    });
  });

  describe(".checkoutHead(path)", () => {
    let filePath;

    beforeEach(() => {
      const workingDirPath = copyRepository();
      repo = new GitRepository(workingDirPath);
      filePath = path.join(workingDirPath, "a.txt");
    });

    it("no longer reports a path as modified after checkout", () => {
      expect(repo.isPathModified(filePath)).toBeFalsy();
      fs.writeFileSync(filePath, "ch ch changes");
      expect(repo.isPathModified(filePath)).toBeTruthy();
      expect(repo.checkoutHead(filePath)).toBeTruthy();
      expect(repo.isPathModified(filePath)).toBeFalsy();
    });

    it("restores the contents of the path to the original text", () => {
      fs.writeFileSync(filePath, "ch ch changes");
      expect(repo.checkoutHead(filePath)).toBeTruthy();
      expect(fs.readFileSync(filePath, "utf8")).toBe("");
    });

    it("fires a status-changed event if the checkout completes successfully", () => {
      fs.writeFileSync(filePath, "ch ch changes");
      repo.getPathStatus(filePath);
      const statusHandler = jasmine.createSpy("statusHandler");
      repo.onDidChangeStatus(statusHandler);
      repo.checkoutHead(filePath);
      expect(statusHandler.calls.count()).toBe(1);
      expect(statusHandler.calls.argsFor(0)[0]).toEqual({
        path: filePath,
        pathStatus: 0,
      });

      repo.checkoutHead(filePath);
      expect(statusHandler.calls.count()).toBe(1);
    });
  });

  describe(".checkoutHeadForEditor(editor)", () => {
    let filePath, editor;

    beforeEach(async () => {
      spyOn(atom, "confirm");

      const workingDirPath = copyRepository();
      repo = new GitRepository(workingDirPath, {
        project: atom.project,
        config: atom.config,
        confirm: atom.confirm,
      });
      filePath = path.join(workingDirPath, "a.txt");
      fs.writeFileSync(filePath, "ch ch changes");

      editor = await atom.workspace.open(filePath);
    });

    it("displays a confirmation dialog by default", (done) => {
      jasmine.filterByPlatform({ except: ["win32"] }, done); // Permissions issues with this test on Windows

      atom.confirm.and.callFake(({ buttons }) => buttons.OK());
      atom.config.set("editor.confirmCheckoutHeadRevision", true);

      repo.checkoutHeadForEditor(editor);

      expect(fs.readFileSync(filePath, "utf8")).toBe("");

      done();
    });

    it("does not display a dialog when confirmation is disabled", (done) => {
      jasmine.filterByPlatform({ except: ["win32"] }, done); // Flakey EPERM opening a.txt on Win32

      atom.config.set("editor.confirmCheckoutHeadRevision", false);

      repo.checkoutHeadForEditor(editor);

      expect(fs.readFileSync(filePath, "utf8")).toBe("");
      expect(atom.confirm).not.toHaveBeenCalled();

      done();
    });
  });

  describe(".destroy()", () => {
    it("throws an exception when any method is called after it is called", () => {
      repo = new GitRepository(path.join(__dirname, "fixtures", "git", "master.git"));
      repo.destroy();
      expect(() => repo.getShortHead()).toThrow();
    });
  });

  describe(".getPathStatus(path)", () => {
    let filePath;

    beforeEach(() => {
      const workingDirectory = copyRepository();
      repo = new GitRepository(workingDirectory);
      filePath = path.join(workingDirectory, "file.txt");
    });

    it("trigger a status-changed event when the new status differs from the last cached one", () => {
      const statusHandler = jasmine.createSpy("statusHandler");
      repo.onDidChangeStatus(statusHandler);
      fs.writeFileSync(filePath, "");
      let status = repo.getPathStatus(filePath);
      expect(statusHandler.calls.count()).toBe(1);
      expect(statusHandler.calls.argsFor(0)[0]).toEqual({
        path: filePath,
        pathStatus: status,
      });

      fs.writeFileSync(filePath, "abc");
      repo.getPathStatus(filePath);
      expect(statusHandler.calls.count()).toBe(1);
    });
  });

  describe(".getDirectoryStatus(path)", () => {
    let directoryPath, filePath;

    beforeEach(() => {
      const workingDirectory = copyRepository();
      repo = new GitRepository(workingDirectory);
      directoryPath = path.join(workingDirectory, "dir");
      filePath = path.join(directoryPath, "b.txt");
    });

    it("gets the status based on the files inside the directory", () => {
      expect(repo.isStatusModified(repo.getDirectoryStatus(directoryPath))).toBe(false);
      fs.writeFileSync(filePath, "abc");
      repo.getPathStatus(filePath);
      expect(repo.isStatusModified(repo.getDirectoryStatus(directoryPath))).toBe(true);
    });
  });

  describe(".refreshStatus()", () => {
    let newPath, modifiedPath, cleanPath, workingDirectory;

    beforeEach(() => {
      workingDirectory = copyRepository();
      repo = new GitRepository(workingDirectory, {
        project: atom.project,
        config: atom.config,
      });
      modifiedPath = path.join(workingDirectory, "file.txt");
      newPath = path.join(workingDirectory, "untracked.txt");
      cleanPath = path.join(workingDirectory, "other.txt");
      fs.writeFileSync(cleanPath, "Full of text");
      fs.writeFileSync(newPath, "");
      newPath = fs.absolute(newPath);
    });

    it("returns status information for all new and modified files", async () => {
      const statusHandler = jasmine.createSpy("statusHandler");
      repo.onDidChangeStatuses(statusHandler);
      fs.writeFileSync(modifiedPath, "making this path modified");

      await repo.refreshStatus();
      expect(statusHandler.calls.count()).toBe(1);
      expect(repo.getCachedPathStatus(cleanPath)).toBeUndefined();
      expect(repo.isStatusNew(repo.getCachedPathStatus(newPath))).toBeTruthy();
      expect(repo.isStatusModified(repo.getCachedPathStatus(modifiedPath))).toBeTruthy();
    });

    it("caches the proper statuses when a subdir is open", async () => {
      const subDir = path.join(workingDirectory, "dir");
      fs.mkdirSync(subDir);
      const filePath = path.join(subDir, "b.txt");
      fs.writeFileSync(filePath, "");
      atom.project.setPaths([subDir]);
      await atom.workspace.open("b.txt");
      repo = atom.project.getRepositories()[0];

      await repo.refreshStatus();
      const status = repo.getCachedPathStatus(filePath);
      expect(repo.isStatusModified(status)).toBe(false);
      expect(repo.isStatusNew(status)).toBe(false);
    });

    it("works correctly when the project has multiple folders (regression)", async () => {
      atom.project.addPath(workingDirectory);
      atom.project.addPath(path.join(__dirname, "fixtures", "dir"));

      await repo.refreshStatus();
      expect(repo.getCachedPathStatus(cleanPath)).toBeUndefined();
      expect(repo.isStatusNew(repo.getCachedPathStatus(newPath))).toBeTruthy();
      expect(repo.isStatusModified(repo.getCachedPathStatus(modifiedPath))).toBeTruthy();
    });

    it("caches statuses that were looked up synchronously", async () => {
      const originalContent = "undefined";
      fs.writeFileSync(modifiedPath, "making this path modified");
      repo.getPathStatus("file.txt");

      fs.writeFileSync(modifiedPath, originalContent);
      await repo.refreshStatus();
      expect(repo.isStatusModified(repo.getCachedPathStatus(modifiedPath))).toBeFalsy();
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
      await repo.refreshStatus();
      repo.getPathStatus("a.txt");
      await runScheduler();

      expect(statusSnapshotProvider.getStatus.calls.count()).toBe(0);
    });

    it("refreshes after refreshStatus while a subscriber exists", async () => {
      repo.onDidChangeStatusSnapshot(() => {});
      await runScheduler();

      output = "# branch.oid def456\0# branch.head main\0? other.txt\0";
      await repo.refreshStatus();
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

    it("classifies from the synchronous cache before the snapshot loads", async () => {
      const filePath = path.join(workingDirectory, "dir", "b.txt");
      fs.writeFileSync(filePath, "changed");
      await repo.refreshStatus();

      const fileSummary = repo.getPathStatusSummary(filePath);
      expect(fileSummary.source).toBe("cache");
      expect(fileSummary.modified).toBe(true);
      expect(fileSummary.added).toBe(false);
      expect(fileSummary.conflicted).toBe(false);

      const directorySummary = repo.getDirectoryStatusSummary(path.join(workingDirectory, "dir"));
      expect(directorySummary.source).toBe("cache");
      expect(directorySummary.modified).toBe(true);

      const rootSummary = repo.getDirectoryStatusSummary(workingDirectory);
      expect(rootSummary.source).toBe("cache");
      expect(rootSummary.modified).toBe(true);

      expect(repo.getPathStatusSummary(path.join(workingDirectory, "no-such-file.txt"))).toBeNull();
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

    it("keeps snapshot-era queries working for paths only the cache knows", async () => {
      const filePath = path.join(workingDirectory, "dir", "b.txt");
      fs.writeFileSync(filePath, "changed");
      await repo.refreshStatus();
      await repo.refreshStatusSnapshot();

      // The fake snapshot reports a clean tree; the cache still knows the
      // change, mirroring how submodule contents surface only in the cache.
      const summary = repo.getPathStatusSummary(filePath);
      expect(summary.source).toBe("cache");
      expect(summary.modified).toBe(true);

      const directorySummary = repo.getDirectoryStatusSummary(path.join(workingDirectory, "dir"));
      expect(directorySummary.source).toBe("cache");
    });
  });

  describe("buffer events", () => {
    let editor;

    beforeEach(async () => {
      atom.project.setPaths([copyRepository()]);
      const refreshPromise = new Promise((resolve) =>
        atom.project.getRepositories()[0].onDidChangeStatuses(resolve),
      );
      editor = await atom.workspace.open("other.txt");
      await refreshPromise;
    });

    it("emits a status-changed event when a buffer is saved", async () => {
      editor.insertNewline();

      const statusHandler = jasmine.createSpy("statusHandler");
      atom.project.getRepositories()[0].onDidChangeStatus(statusHandler);

      await editor.save();
      expect(statusHandler.calls.count()).toBe(1);
      expect(statusHandler).toHaveBeenCalledWith({
        path: editor.getPath(),
        pathStatus: 256,
      });
    });

    it("emits a status-changed event when a buffer is reloaded", async () => {
      fs.writeFileSync(editor.getPath(), "changed");

      const statusHandler = jasmine.createSpy("statusHandler");
      atom.project.getRepositories()[0].onDidChangeStatus(statusHandler);

      await editor.getBuffer().reload();
      expect(statusHandler.calls.count()).toBe(1);
      expect(statusHandler).toHaveBeenCalledWith({
        path: editor.getPath(),
        pathStatus: 256,
      });

      await editor.getBuffer().reload();
      expect(statusHandler.calls.count()).toBe(1);
    });

    it("emits a status-changed event when a buffer's path changes", () => {
      fs.writeFileSync(editor.getPath(), "changed");

      const statusHandler = jasmine.createSpy("statusHandler");
      atom.project.getRepositories()[0].onDidChangeStatus(statusHandler);
      editor.getBuffer().emitter.emit("did-change-path");
      expect(statusHandler.calls.count()).toBe(1);
      expect(statusHandler).toHaveBeenCalledWith({
        path: editor.getPath(),
        pathStatus: 256,
      });
      editor.getBuffer().emitter.emit("did-change-path");
      expect(statusHandler.calls.count()).toBe(1);
    });

    it("stops listening to the buffer when the repository is destroyed (regression)", () => {
      atom.project.getRepositories()[0].destroy();
      expect(() => editor.save()).not.toThrow();
    });
  });

  describe("when a project is deserialized", () => {
    let buffer, project2, repositoryRegistry2, statusHandler;

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

      statusHandler = jasmine.createSpy("statusHandler");
      project2.getRepositories()[0].onDidChangeStatus(statusHandler);
      await buffer.save();

      expect(statusHandler.calls.count()).toBe(1);
      expect(statusHandler).toHaveBeenCalledWith({
        path: buffer.getPath(),
        pathStatus: 256,
      });
    });
  });
});

function copyRepository() {
  const workingDirPath = temp.mkdirSync("atom-spec-git");
  fs.copySync(path.join(__dirname, "fixtures", "git", "working-dir"), workingDirPath);
  fs.renameSync(path.join(workingDirPath, "git.git"), path.join(workingDirPath, ".git"));
  return workingDirPath;
}
