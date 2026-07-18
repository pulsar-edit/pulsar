const fs = require("fs");
const path = require("path");

const temp = require("temp").track();

const { EMPTY_REFS_SNAPSHOT, parseRefsSnapshot } = require("../src/repository-refs-snapshot");
const GitRepositoryRefsProvider = require("../src/git-repository-refs-provider");
const GitRepositoryOperationProvider = require("../src/git-repository-operation-provider");

function refRecord({
  ref,
  shortName,
  oid = "1111111111111111111111111111111111111111",
  objectType = "commit",
  peeledOid = "",
  upstreamRef = "",
  upstreamShort = "",
  upstreamTrack = "",
  headMarker = "",
  symref = "",
}) {
  return [
    ref,
    shortName,
    oid,
    objectType,
    peeledOid,
    upstreamRef,
    upstreamShort,
    upstreamTrack,
    headMarker,
    symref,
  ].join("\0");
}

function rawBundle(overrides = {}) {
  return {
    forEachRef: "",
    remotes: "",
    worktrees: "",
    symbolicHead: "refs/heads/main\n",
    headOid: "1111111111111111111111111111111111111111\n",
    ...overrides,
  };
}

describe("repository refs snapshot", () => {
  describe("parseRefsSnapshot", () => {
    it("starts from an immutable uninitialized snapshot", () => {
      expect(EMPTY_REFS_SNAPSHOT.initialized).toBe(false);
      expect(EMPTY_REFS_SNAPSHOT.generation).toBe(0);
      expect(Object.isFrozen(EMPTY_REFS_SNAPSHOT)).toBe(true);
      expect(Object.isFrozen(EMPTY_REFS_SNAPSHOT.branches)).toBe(true);
    });

    it("parses a named head and freezes the result", () => {
      const snapshot = parseRefsSnapshot(rawBundle(), { generation: 3 });

      expect(snapshot.initialized).toBe(true);
      expect(snapshot.generation).toBe(3);
      expect(snapshot.head.name).toBe("main");
      expect(snapshot.head.ref).toBe("refs/heads/main");
      expect(snapshot.head.oid).toBe("1111111111111111111111111111111111111111");
      expect(snapshot.head.detached).toBe(false);
      expect(snapshot.head.unborn).toBe(false);
      expect(Object.isFrozen(snapshot)).toBe(true);
      expect(Object.isFrozen(snapshot.head)).toBe(true);
      expect(Object.isFrozen(snapshot.branches)).toBe(true);
    });

    it("recognizes detached and unborn heads exactly", () => {
      const detached = parseRefsSnapshot(rawBundle({ symbolicHead: "" }));
      expect(detached.head.detached).toBe(true);
      expect(detached.head.name).toBeNull();
      expect(detached.head.unborn).toBe(false);

      const unborn = parseRefsSnapshot(rawBundle({ headOid: "" }));
      expect(unborn.head.unborn).toBe(true);
      expect(unborn.head.oid).toBeNull();
      expect(unborn.head.name).toBe("main");
      expect(unborn.head.detached).toBe(false);
    });

    it("classifies branches with every upstream tracking state", () => {
      const forEachRef = [
        refRecord({
          ref: "refs/heads/main",
          shortName: "main",
          upstreamRef: "refs/remotes/origin/main",
          upstreamShort: "origin/main",
          upstreamTrack: "",
          headMarker: "*",
        }),
        refRecord({
          ref: "refs/heads/feature",
          shortName: "feature",
          upstreamRef: "refs/remotes/origin/feature",
          upstreamShort: "origin/feature",
          upstreamTrack: "ahead 2, behind 1",
        }),
        refRecord({
          ref: "refs/heads/orphaned",
          shortName: "orphaned",
          upstreamRef: "refs/remotes/origin/gone-branch",
          upstreamShort: "origin/gone-branch",
          upstreamTrack: "gone",
        }),
        refRecord({ ref: "refs/heads/local-only", shortName: "local-only" }),
      ].join("\n");

      const { branches } = parseRefsSnapshot(rawBundle({ forEachRef }));

      expect(branches.map((branch) => branch.name)).toEqual([
        "main",
        "feature",
        "orphaned",
        "local-only",
      ]);
      expect(branches[0].isHead).toBe(true);
      expect(branches[0].upstream).toEqual(
        jasmine.objectContaining({ name: "origin/main", ahead: 0, behind: 0, gone: false }),
      );
      expect(branches[1].isHead).toBe(false);
      expect(branches[1].upstream).toEqual(
        jasmine.objectContaining({ ahead: 2, behind: 1, gone: false }),
      );
      expect(branches[2].upstream.gone).toBe(true);
      expect(branches[3].upstream).toBeNull();
    });

    it("distinguishes annotated tags from lightweight tags", () => {
      const forEachRef = [
        refRecord({
          ref: "refs/tags/v1",
          shortName: "v1",
          oid: "2222222222222222222222222222222222222222",
          objectType: "tag",
          peeledOid: "3333333333333333333333333333333333333333",
        }),
        refRecord({
          ref: "refs/tags/lightweight",
          shortName: "lightweight",
          oid: "4444444444444444444444444444444444444444",
        }),
      ].join("\n");

      const { tags } = parseRefsSnapshot(rawBundle({ forEachRef }));

      expect(tags[0].annotated).toBe(true);
      expect(tags[0].targetOid).toBe("3333333333333333333333333333333333333333");
      expect(tags[1].annotated).toBe(false);
      expect(tags[1].targetOid).toBe("4444444444444444444444444444444444444444");
    });

    it("classifies remote branches and the origin/HEAD symref", () => {
      const forEachRef = [
        refRecord({
          ref: "refs/remotes/origin/HEAD",
          shortName: "origin/HEAD",
          symref: "refs/remotes/origin/main",
        }),
        refRecord({ ref: "refs/remotes/origin/main", shortName: "origin/main" }),
        refRecord({ ref: "refs/remotes/fork/topic", shortName: "fork/topic" }),
      ].join("\n");

      const { remoteBranches } = parseRefsSnapshot(rawBundle({ forEachRef }));

      expect(remoteBranches[0].symrefTarget).toBe("refs/remotes/origin/main");
      expect(remoteBranches[0].remoteName).toBe("origin");
      expect(remoteBranches[1].symrefTarget).toBeNull();
      expect(remoteBranches[2].remoteName).toBe("fork");
    });

    it("merges fetch and push URLs per remote", () => {
      const remotes = [
        "origin\thttps://example.com/fetch.git (fetch)",
        "origin\thttps://example.com/push.git (push)",
        "upstream\tgit@example.com:c.git (fetch)",
        "upstream\tgit@example.com:c.git (push)",
        "",
      ].join("\n");

      const snapshot = parseRefsSnapshot(rawBundle({ remotes }));

      expect(snapshot.remotes).toEqual([
        {
          name: "origin",
          fetchUrl: "https://example.com/fetch.git",
          pushUrl: "https://example.com/push.git",
        },
        { name: "upstream", fetchUrl: "git@example.com:c.git", pushUrl: "git@example.com:c.git" },
      ]);
    });

    it("parses worktrees including bare, detached, and locked entries", () => {
      const worktrees = [
        "worktree /repos/main",
        "HEAD 1111111111111111111111111111111111111111",
        "branch refs/heads/main",
        "",
        "worktree /repos/hotfix",
        "HEAD 2222222222222222222222222222222222222222",
        "detached",
        "locked being repaired",
        "",
        "worktree /repos/bare",
        "bare",
        "",
        "",
      ].join("\0");

      const snapshot = parseRefsSnapshot(rawBundle({ worktrees }));

      expect(snapshot.worktrees.length).toBe(3);
      expect(snapshot.worktrees[0]).toEqual(
        jasmine.objectContaining({ path: "/repos/main", branch: "refs/heads/main" }),
      );
      expect(snapshot.worktrees[1]).toEqual(
        jasmine.objectContaining({ detached: true, locked: true, lockedReason: "being repaired" }),
      );
      expect(snapshot.worktrees[2].bare).toBe(true);
    });

    it("rejects malformed for-each-ref records", () => {
      expect(() => parseRefsSnapshot(rawBundle({ forEachRef: "refs/heads/main\0main" }))).toThrow();
    });
  });

  describe("GitRepositoryRefsProvider", () => {
    it("reads refs, remotes, worktrees, and head state from a real repository", async () => {
      const operationProvider = new GitRepositoryOperationProvider();
      const workingDirectory = temp.mkdirSync("refs-provider-repo");
      const worktreePath = path.join(temp.mkdirSync("refs-provider-worktrees"), "feature");

      await operationProvider.initializeRepository(workingDirectory, { initialBranch: "main" });
      const operations = operationProvider.createRepositoryOperations({ workingDirectory });
      await operations.setConfig("user.name", "Lumine Specs");
      await operations.setConfig("user.email", "specs@lumine.invalid");
      fs.writeFileSync(path.join(workingDirectory, "file.txt"), "content\n");
      await operations.stageFiles(["file.txt"]);
      await operations.commit("Initial commit");
      await operationProvider.run(["branch", "feature"], workingDirectory);
      await operationProvider.run(["tag", "-a", "v1", "-m", "release"], workingDirectory);
      await operationProvider.run(["tag", "lightweight"], workingDirectory);
      await operations.addRemote("origin", "https://example.com/repo.git");
      await operationProvider.run(["worktree", "add", worktreePath, "feature"], workingDirectory);

      const refsProvider = new GitRepositoryRefsProvider();
      const snapshot = parseRefsSnapshot(await refsProvider.getRefs(workingDirectory));

      expect(snapshot.head.name).toBe("main");
      expect(snapshot.head.detached).toBe(false);
      expect(snapshot.head.unborn).toBe(false);
      expect(snapshot.head.oid).toMatch(/^[0-9a-f]{40}$/);

      const branchNames = snapshot.branches.map((branch) => branch.name).sort();
      expect(branchNames).toEqual(["feature", "main"]);
      expect(snapshot.branches.find((branch) => branch.name === "main").isHead).toBe(true);

      const annotated = snapshot.tags.find((tag) => tag.name === "v1");
      expect(annotated.annotated).toBe(true);
      expect(annotated.targetOid).toBe(snapshot.head.oid);
      expect(annotated.oid).not.toBe(annotated.targetOid);
      const lightweight = snapshot.tags.find((tag) => tag.name === "lightweight");
      expect(lightweight.annotated).toBe(false);
      expect(lightweight.targetOid).toBe(snapshot.head.oid);

      expect(snapshot.remotes).toEqual([
        {
          name: "origin",
          fetchUrl: "https://example.com/repo.git",
          pushUrl: "https://example.com/repo.git",
        },
      ]);

      expect(snapshot.worktrees.length).toBe(2);
      const featureWorktree = snapshot.worktrees.find(
        (worktree) => worktree.branch === "refs/heads/feature",
      );
      expect(featureWorktree).toBeDefined();

      // A detached checkout is reported as detached, not as a branch head.
      await operationProvider.run(["checkout", "--detach"], workingDirectory);
      const detachedSnapshot = parseRefsSnapshot(await refsProvider.getRefs(workingDirectory));
      expect(detachedSnapshot.head.detached).toBe(true);
      expect(detachedSnapshot.head.name).toBeNull();
      expect(detachedSnapshot.head.oid).toBe(snapshot.head.oid);
    });

    it("reports an unborn branch in a freshly initialized repository", async () => {
      const operationProvider = new GitRepositoryOperationProvider();
      const workingDirectory = temp.mkdirSync("refs-provider-unborn");
      await operationProvider.initializeRepository(workingDirectory, { initialBranch: "main" });

      const refsProvider = new GitRepositoryRefsProvider();
      const snapshot = parseRefsSnapshot(await refsProvider.getRefs(workingDirectory));

      expect(snapshot.head.unborn).toBe(true);
      expect(snapshot.head.oid).toBeNull();
      expect(snapshot.head.name).toBe("main");
      expect(snapshot.branches).toEqual([]);
    });
  });
});
