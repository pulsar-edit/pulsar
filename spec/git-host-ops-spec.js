const GitRunner = require("../src/git-runner");
const createGitHostOps = require("../src/git-host-ops");

// Exercises the git-host op registry in-process (no fork) against a fake
// `execute`, mirroring how git-repository-*-provider specs inject execute.
describe("git-host ops", () => {
  let calls;

  function opsReturning(result) {
    calls = [];
    const execute = (args, cwd, options) => {
      calls.push({ args, cwd, options });
      return Promise.resolve({ exitCode: 0, stdout: "OUT", stderr: "", ...result });
    };
    return createGitHostOps(new GitRunner({ execute }));
  }

  it("runs status with porcelain v2 and returns the raw stdout", async () => {
    const ops = opsReturning();
    const result = await ops.status(
      { workingDirectory: "/repo", options: { includeIgnored: true } },
      {},
    );
    expect(result).toBe("OUT");
    expect(calls[0].cwd).toBe("/repo");
    expect(calls[0].args).toContain("status");
    expect(calls[0].args).toContain("--porcelain=v2");
    expect(calls[0].args).toContain("--ignored=matching");
  });

  it("fans refs out to five git commands and returns the raw bundle", async () => {
    const ops = opsReturning();
    const result = await ops.refs({ workingDirectory: "/repo", options: {} }, {});
    expect(calls.length).toBe(5);
    expect(result).toEqual({
      forEachRef: "OUT",
      remotes: "OUT",
      worktrees: "OUT",
      symbolicHead: "OUT",
      headOid: "OUT",
    });
  });

  it("maps a diff request onto git diff arguments", async () => {
    const ops = opsReturning();
    await ops.diffPatch(
      {
        workingDirectory: "/repo",
        request: { from: { type: "index" }, to: { type: "worktree" }, context: 3 },
        options: {},
      },
      {},
    );
    expect(calls[0].args).toContain("diff");
    expect(calls[0].args).toContain("--patch");
    expect(calls[0].args).toContain("--unified=3");
  });

  it("threads the worker AbortSignal through to the runner", async () => {
    const ops = opsReturning();
    const controller = new AbortController();
    await ops.status({ workingDirectory: "/repo", options: {} }, { signal: controller.signal });
    expect(calls[0].options.signal).toBe(controller.signal);
  });

  it("keeps unborn/missing-path handling in the worker op (returns null)", async () => {
    const execute = () =>
      Promise.resolve({
        exitCode: 128,
        stdout: "",
        stderr: "fatal: path 'x' does not exist in 'HEAD'",
      });
    const ops = createGitHostOps(new GitRunner({ execute }));
    const result = await ops.fileAtRevision(
      { workingDirectory: "/repo", relativePosixPath: "x", revision: "HEAD", options: {} },
      {},
    );
    expect(result).toBeNull();
  });

  it("fetches the HEAD blob for lineDiff and returns hunks", async () => {
    const ops = opsReturning({ stdout: "a\nb\nc\n" });
    const hunks = await ops.lineDiff(
      { workingDirectory: "/repo", relativePosixPath: "f.txt", headOid: "abc", text: "a\nB\nc\n" },
      {},
    );
    expect(calls[0].args).toContain("show");
    expect(calls[0].args).toContain("abc:f.txt");
    expect(hunks).toEqual([{ oldStart: 2, oldLines: 1, newStart: 2, newLines: 1 }]);
  });

  it("caches the HEAD blob per oid so repeated lineDiffs do not re-fetch", async () => {
    const ops = opsReturning({ stdout: "a\nb\nc\n" });
    const payload = {
      workingDirectory: "/repo",
      relativePosixPath: "f.txt",
      headOid: "abc",
      text: "a\nB\nc\n",
    };
    await ops.lineDiff(payload, {});
    await ops.lineDiff({ ...payload, text: "a\nZ\nc\n" }, {});
    expect(calls.length).toBe(1);
  });

  it("reads a config value with `config -z --get` and strips the trailing NUL", async () => {
    const ops = opsReturning({ stdout: "https://example.com/repo.git\0" });
    const value = await ops.configGet({ workingDirectory: "/repo", key: "remote.origin.url" }, {});
    expect(value).toBe("https://example.com/repo.git");
    expect(calls[0].args).toContain("config");
    expect(calls[0].args).toContain("--get");
    expect(calls[0].args).toContain("remote.origin.url");
  });

  it("returns null for an unset config key (git config exit code 1)", async () => {
    const execute = () => Promise.resolve({ exitCode: 1, stdout: "", stderr: "" });
    const ops = createGitHostOps(new GitRunner({ execute }));
    const value = await ops.configGet({ workingDirectory: "/repo", key: "branch.x.remote" }, {});
    expect(value).toBeNull();
  });

  it("runs an arbitrary write command with runResult semantics (exec)", async () => {
    const ops = opsReturning({ stdout: "done\n" });
    const result = await ops.exec(
      { workingDirectory: "/repo", args: ["commit", "--file=-"], options: { stdin: "msg" } },
      {},
    );
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("done\n");
    expect(calls[0].cwd).toBe("/repo");
    expect(calls[0].args).toContain("commit");
    expect(calls[0].options.stdin).toBe("msg");
  });

  it("runs a raw command without the color config (exec raw)", async () => {
    const ops = opsReturning();
    await ops.exec({ workingDirectory: "/repo", args: ["--version"], options: {}, raw: true }, {});
    expect(calls[0].args).toEqual(["--version"]);
  });

  it("rejects exec with a GitOperationError carrying command and stdout", async () => {
    const execute = () => Promise.resolve({ exitCode: 1, stdout: "partial", stderr: "boom" });
    const ops = createGitHostOps(new GitRunner({ execute }));

    let error;
    try {
      await ops.exec({ workingDirectory: "/repo", args: ["checkout", "x"], options: {} }, {});
    } catch (caught) {
      error = caught;
    }
    expect(error.name).toBe("GitOperationError");
    expect(error.command).toBe("checkout");
    expect(error.stdout).toBe("partial");
    expect(error.exitCode).toBe(1);
  });
});
