const DugiteRepositoryStatusProvider = require("../src/dugite-repository-status-provider");
const { EMPTY_STATUS_SNAPSHOT, parseStatusSnapshot } = require("../src/repository-status-snapshot");

describe("Repository status snapshots", () => {
  it("starts with an immutable uninitialized snapshot", () => {
    expect(EMPTY_STATUS_SNAPSHOT.initialized).toBe(false);
    expect(EMPTY_STATUS_SNAPSHOT.generation).toBe(0);
    expect(EMPTY_STATUS_SNAPSHOT.files).toEqual([]);
    expect(Object.isFrozen(EMPTY_STATUS_SNAPSHOT)).toBe(true);
    expect(Object.isFrozen(EMPTY_STATUS_SNAPSHOT.files)).toBe(true);
    expect(Object.isFrozen(EMPTY_STATUS_SNAPSHOT.counts)).toBe(true);
  });

  it("parses branch, tracked, renamed, conflicted, untracked, and ignored status", () => {
    const output = [
      "# branch.oid abc123",
      "# branch.head main",
      "# branch.upstream origin/main",
      "# branch.ab +2 -3",
      "1 M. N... 100644 100644 100644 head index staged file.txt",
      "1 .M SCMU 160000 160000 160000 head index vendor/module",
      "2 R. N... 100644 100644 100644 head index R087 renamed file.txt",
      "original file.txt",
      "u UU N... 100644 100644 100644 100644 one two three conflict.txt",
      "? new file.txt",
      "! ignored directory/",
      "",
    ].join("\0");

    const snapshot = parseStatusSnapshot(output, {
      generation: 4,
      includesIgnored: true,
    });

    expect(snapshot.generation).toBe(4);
    expect(snapshot.initialized).toBe(true);
    expect(snapshot.includesIgnored).toBe(true);
    expect(snapshot.head).toEqual({
      oid: "abc123",
      name: "main",
      detached: false,
      unborn: false,
    });
    expect(snapshot.upstream).toEqual({ name: "origin/main", ahead: 2, behind: 3 });
    expect(snapshot.counts).toEqual({
      total: 6,
      staged: 3,
      unstaged: 3,
      conflicted: 1,
      untracked: 1,
      ignored: 1,
    });

    expect(snapshot.files[0]).toEqual(
      jasmine.objectContaining({
        path: "staged file.txt",
        kind: "ordinary",
        indexStatus: "M",
        worktreeStatus: null,
        staged: true,
        unstaged: false,
      }),
    );
    expect(snapshot.files[1].submodule).toEqual({
      isSubmodule: true,
      commitChanged: true,
      modified: true,
      hasUntrackedChanges: true,
    });
    expect(snapshot.files[2]).toEqual(
      jasmine.objectContaining({
        path: "renamed file.txt",
        originalPath: "original file.txt",
        kind: "renamed",
        similarity: 87,
      }),
    );
    expect(snapshot.files[3].conflicted).toBe(true);
    expect(snapshot.files[4].untracked).toBe(true);
    expect(snapshot.files[5].ignored).toBe(true);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.files[0])).toBe(true);
    expect(Object.isFrozen(snapshot.files[1].submodule)).toBe(true);
  });

  it("represents unborn and detached heads explicitly", () => {
    const unborn = parseStatusSnapshot("# branch.oid (initial)\0# branch.head main\0");
    expect(unborn.head).toEqual({
      oid: null,
      name: "main",
      detached: false,
      unborn: true,
    });

    const detached = parseStatusSnapshot("# branch.oid deadbeef\0# branch.head (detached)\0");
    expect(detached.head).toEqual({
      oid: "deadbeef",
      name: null,
      detached: true,
      unborn: false,
    });
  });

  it("uses the whole repository and only includes ignored files on request", async () => {
    const runner = {
      run: jasmine.createSpy("run").andReturn(Promise.resolve("status")),
    };
    const provider = new DugiteRepositoryStatusProvider({ runner });

    await provider.getStatus("C:\\repository");
    await provider.getStatus("C:\\repository", { includeIgnored: true, signal: "signal" });

    expect(runner.run.calls.argsFor(0)[0]).toEqual([
      "status",
      "--porcelain=v2",
      "--branch",
      "-z",
      "--untracked-files=all",
      "--ignore-submodules=none",
      "--renames",
    ]);
    expect(runner.run.calls.argsFor(1)[0]).toEqual([
      "status",
      "--porcelain=v2",
      "--branch",
      "-z",
      "--untracked-files=all",
      "--ignore-submodules=none",
      "--renames",
      "--ignored=matching",
    ]);
    expect(runner.run.calls.argsFor(1)[2].signal).toBe("signal");
  });
});
