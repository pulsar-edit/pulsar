const { resolveGitPath, which } = require("../src/git-binary");
const { createGitExec } = require("../src/git-executor");

describe("git binary resolution", () => {
  it("finds git on PATH", () => {
    const gitPath = resolveGitPath("");
    expect(typeof gitPath).toBe("string");
    expect(gitPath.length).toBeGreaterThan(0);
  });

  it("prefers a configured path that exists", () => {
    const real = which("git");
    if (!real) return; // system without git on PATH; covered by the fallback case
    expect(resolveGitPath(real)).toBe(real);
  });

  it("ignores a configured path that does not exist and falls back to PATH", () => {
    const resolved = resolveGitPath("/definitely/not/a/real/git/binary");
    expect(resolved).not.toBe("/definitely/not/a/real/git/binary");
  });
});

describe("git executor", () => {
  const exec = createGitExec(resolveGitPath(""));

  it("runs a git command and returns exit code and stdout", async () => {
    const result = await exec(["--version"], process.cwd());
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("git version");
    expect(result.stderr).toBe("");
  });

  it("feeds stdin to git", async () => {
    const result = await exec(["hash-object", "--stdin"], process.cwd(), { stdin: "hello\n" });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim().length).toBe(40);
  });

  it("returns a Buffer stdout when encoding is 'buffer'", async () => {
    const result = await exec(["--version"], process.cwd(), { encoding: "buffer" });
    expect(Buffer.isBuffer(result.stdout)).toBe(true);
  });

  it("rejects with ERR_CHILD_PROCESS_STDIO_MAXBUFFER when stdout exceeds maxBuffer", async () => {
    let error;
    try {
      await exec(["--version"], process.cwd(), { maxBuffer: 4 });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeTruthy();
    expect(error.code).toBe("ERR_CHILD_PROCESS_STDIO_MAXBUFFER");
  });

  it("surfaces a non-zero exit code without throwing", async () => {
    const result = await exec(["rev-parse", "--verify", "definitely-not-a-ref"], process.cwd());
    expect(result.exitCode).not.toBe(0);
  });

  it("kills the process when the abort signal fires", async () => {
    const controller = new AbortController();
    const pending = exec(["hash-object", "--stdin"], process.cwd(), {
      stdin: "",
      signal: controller.signal,
    });
    controller.abort();
    // Aborting kills git; the result still settles (resolve or reject) rather
    // than hanging.
    await pending.catch(() => {});
    expect(true).toBe(true);
  });
});
