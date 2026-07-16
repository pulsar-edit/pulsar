const fs = require("fs");
const path = require("path");

const temp = require("temp").track();

const {
  parseCommitRecords,
  parseNameStatusTokens,
  parseBlamePorcelain,
} = require("../src/repository-history");
const DugiteRepositoryOperationProvider = require("../src/dugite-repository-operation-provider");
const GitRepository = require("../src/git-repository");

function logRecord({
  sha,
  parents = "",
  authorName = "Author",
  authorEmail = "author@example.com",
  authorDate = "2026-07-16T10:00:00+02:00",
  subject = "Subject",
  body = "",
}) {
  return [
    sha,
    parents,
    authorName,
    authorEmail,
    authorDate,
    "Committer",
    "committer@example.com",
    "2026-07-16T11:00:00+02:00",
    subject,
    body,
  ].join("\0");
}

describe("repository history", () => {
  describe("parseCommitRecords", () => {
    it("parses records with parents, multiline bodies, and empty bodies", () => {
      const output =
        [
          logRecord({
            sha: "a".repeat(40),
            parents: `${"b".repeat(40)} ${"c".repeat(40)}`,
            subject: "Merge",
            body: "First paragraph.\n\nSecond paragraph.\n",
          }),
          logRecord({ sha: "b".repeat(40), parents: "", subject: "Root", body: "" }),
        ].join("\0") + "\0";

      const commits = parseCommitRecords(output);

      expect(commits.length).toBe(2);
      expect(commits[0].parents).toEqual(["b".repeat(40), "c".repeat(40)]);
      expect(commits[0].body).toBe("First paragraph.\n\nSecond paragraph.");
      expect(commits[0].author.name).toBe("Author");
      expect(commits[0].author.date.toISOString()).toBe("2026-07-16T08:00:00.000Z");
      expect(commits[1].parents).toEqual([]);
      expect(commits[1].body).toBe("");
      expect(Object.isFrozen(commits[0])).toBe(true);
      expect(parseCommitRecords("")).toEqual([]);
    });

    it("rejects a token stream with broken arity", () => {
      expect(() => parseCommitRecords("only\0three\0fields\0")).toThrow();
    });
  });

  describe("parseNameStatusTokens", () => {
    it("parses NUL-separated and tab-joined records including renames", () => {
      const nulSeparated = ["M", "changed.txt", "R100", "old.txt", "new.txt", "A", "born.txt", ""]
        .join("\0");
      const tabJoined = ["M\tchanged.txt", "R100\told.txt", "new.txt", ""].join("\0");

      const nulFiles = parseNameStatusTokens(nulSeparated);
      expect(nulFiles).toEqual([
        { path: "changed.txt", originalPath: null, status: "modified", similarity: null },
        { path: "new.txt", originalPath: "old.txt", status: "renamed", similarity: 100 },
        { path: "born.txt", originalPath: null, status: "added", similarity: null },
      ]);

      const tabFiles = parseNameStatusTokens(tabJoined);
      expect(tabFiles[0].status).toBe("modified");
      expect(tabFiles[1]).toEqual({
        path: "new.txt",
        originalPath: "old.txt",
        status: "renamed",
        similarity: 100,
      });
    });
  });

  describe("parseBlamePorcelain", () => {
    it("reuses commit metadata emitted only on first occurrence", () => {
      const sha1 = "1".repeat(40);
      const sha2 = "2".repeat(40);
      const output = [
        `${sha1} 1 1 2`,
        "author First Author",
        "author-mail <first@example.com>",
        "author-time 1752652800",
        "author-tz +0000",
        "summary first commit",
        "filename file.txt",
        "\tline one",
        `${sha1} 2 2`,
        "\tline two",
        `${sha2} 3 3 1`,
        "author Second Author",
        "author-mail <second@example.com>",
        "author-time 1752739200",
        "author-tz +0000",
        "summary second commit",
        "filename file.txt",
        "\tline three",
        "",
      ].join("\n");

      const lines = parseBlamePorcelain(output);

      expect(lines.length).toBe(3);
      expect(lines[0].sha).toBe(sha1);
      expect(lines[0].author.name).toBe("First Author");
      expect(lines[0].author.email).toBe("first@example.com");
      expect(lines[1].sha).toBe(sha1);
      expect(lines[1].author.name).toBe("First Author");
      expect(lines[1].line).toBe(2);
      expect(lines[2].sha).toBe(sha2);
      expect(lines[2].summary).toBe("second commit");
    });
  });

  describe("GitRepository history APIs", () => {
    let repo, workingDirectory, operations, operationProvider;

    beforeEach(async () => {
      operationProvider = new DugiteRepositoryOperationProvider();
      workingDirectory = temp.mkdirSync("repository-history-repo");
      await operationProvider.initializeRepository(workingDirectory, { initialBranch: "main" });
      operations = operationProvider.createRepositoryOperations({ workingDirectory });
      await operations.setConfig("user.name", "Author One");
      await operations.setConfig("user.email", "one@example.com");

      fs.writeFileSync(path.join(workingDirectory, "file.txt"), "alpha\nbeta\n");
      await operations.stageFiles(["file.txt"]);
      await operations.commit("first");

      await operations.setConfig("user.name", "Author Two");
      await operations.setConfig("user.email", "two@example.com");
      fs.writeFileSync(path.join(workingDirectory, "file.txt"), "alpha\nBETA\n");
      await operations.stageFiles(["file.txt"]);
      await operations.commit("second\n\nBody line one.\n\nBody line two.");

      await operationProvider.run(["mv", "file.txt", "moved.txt"], workingDirectory);
      fs.writeFileSync(path.join(workingDirectory, "bin.dat"), Buffer.from([0, 1, 2, 255]));
      await operations.stageFiles(["bin.dat"]);
      await operations.commit("rename");

      repo = new GitRepository(workingDirectory, { refreshOnWindowFocus: false });
    });

    afterEach(() => {
      if (repo && !repo.isDestroyed()) repo.destroy();
    });

    it("paginates commit history with a stable cursor", async () => {
      const firstPage = await repo.getCommits({ limit: 2 });
      expect(firstPage.commits.map((commit) => commit.subject)).toEqual(["rename", "second"]);
      expect(firstPage.hasMore).toBe(true);
      expect(firstPage.nextCursor).toEqual({ revision: "HEAD", skip: 2 });
      expect(firstPage.commits[0].parents).toEqual([firstPage.commits[1].sha]);

      const secondPage = await repo.getCommits({ limit: 2, cursor: firstPage.nextCursor });
      expect(secondPage.commits.map((commit) => commit.subject)).toEqual(["first"]);
      expect(secondPage.hasMore).toBe(false);
      expect(secondPage.nextCursor).toBeNull();
      expect(secondPage.commits[0].parents).toEqual([]);
      expect(secondPage.commits[0].author.name).toBe("Author One");
    });

    it("follows renames for path-limited history", async () => {
      const history = await repo.getCommits({ path: path.join(workingDirectory, "moved.txt") });
      expect(history.commits.map((commit) => commit.subject)).toEqual([
        "rename",
        "second",
        "first",
      ]);
    });

    it("reads a commit with its changed-file summary and multiline body", async () => {
      const { commits } = await repo.getCommits();
      const renameCommit = await repo.getCommit(commits[0].sha);
      const renamedFile = renameCommit.changedFiles.find((file) => file.status === "renamed");
      expect(renamedFile).toEqual({
        path: "moved.txt",
        originalPath: "file.txt",
        status: "renamed",
        similarity: 100,
      });
      expect(
        renameCommit.changedFiles.find((file) => file.path === "bin.dat").status,
      ).toBe("added");

      const bodyCommit = await repo.getCommit(commits[1].sha);
      expect(bodyCommit.subject).toBe("second");
      expect(bodyCommit.body).toBe("Body line one.\n\nBody line two.");

      const rootCommit = await repo.getCommit(commits[2].sha);
      expect(rootCommit.parents).toEqual([]);
      expect(rootCommit.changedFiles).toEqual([
        { path: "file.txt", originalPath: null, status: "added", similarity: null },
      ]);
    });

    it("reads file contents at arbitrary revisions", async () => {
      expect(await repo.getFileAtRevision("moved.txt", "HEAD")).toBe("alpha\nBETA\n");
      expect(await repo.getFileAtRevision("file.txt", "HEAD~2")).toBe("alpha\nbeta\n");
      expect(await repo.getFileAtRevision("missing.txt", "HEAD")).toBeNull();
      expect(await repo.getFileAtRevision("moved.txt", "HEAD~2")).toBeNull();

      const buffer = await repo.getFileAtRevision("bin.dat", "HEAD", { encoding: "buffer" });
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(Buffer.compare(buffer, Buffer.from([0, 1, 2, 255]))).toBe(0);
    });

    it("attributes blame lines to the right commits and authors", async () => {
      const blame = await repo.getBlame(path.join(workingDirectory, "moved.txt"));
      expect(blame.lines.length).toBe(2);
      expect(blame.lines[0].line).toBe(1);
      expect(blame.lines[0].author.name).toBe("Author One");
      expect(blame.lines[0].summary).toBe("first");
      expect(blame.lines[1].line).toBe(2);
      expect(blame.lines[1].author.name).toBe("Author Two");
      expect(blame.lines[1].summary).toBe("second");
      expect(blame.lines[0].sha).not.toBe(blame.lines[1].sha);
    });

    it("resolves an empty page for an unborn repository", async () => {
      const unbornDirectory = temp.mkdirSync("repository-history-unborn");
      await operationProvider.initializeRepository(unbornDirectory, { initialBranch: "main" });
      const unbornRepo = new GitRepository(unbornDirectory, { refreshOnWindowFocus: false });

      try {
        expect(await unbornRepo.getCommits()).toEqual({
          commits: [],
          hasMore: false,
          nextCursor: null,
        });
      } finally {
        unbornRepo.destroy();
      }
    });
  });
});
