const fs = require("@lumine-code/fs-plus");
const path = require("path");
const temp = require("temp").track();
const GitUtils = require("@lumine-code/git-utils");
const {
  discoverRepositoryDescriptor,
  discoverGitDirectory,
} = require("../src/git-repository-descriptor");

// The descriptor replaces the libgit2 handle GitRepository used for identity and
// path routing. These specs pin it to the live git-utils behavior it succeeds,
// so the eventual git-utils removal cannot silently change discovery.
describe("git repository descriptor", () => {
  const fixturePath = (...segments) => path.join(__dirname, "fixtures", "git", ...segments);

  function copyFixture(name) {
    const dir = temp.mkdirSync(`descriptor-${name}-`);
    fs.copySync(fixturePath(name), dir);
    fs.renameSync(path.join(dir, "git.git"), path.join(dir, ".git"));
    return dir;
  }

  it("matches git-utils for a working tree opened at its root", () => {
    const workingDir = copyFixture("working-dir");
    const native = GitUtils.open(workingDir);
    try {
      const descriptor = discoverRepositoryDescriptor(workingDir);
      expect(descriptor.getWorkingDirectory()).toBe(native.getWorkingDirectory());
      expect(fs.absolute(descriptor.getPath())).toBe(fs.absolute(native.getPath()));
      expect(descriptor.caseInsensitiveFs).toBe(native.caseInsensitiveFs);
    } finally {
      native.release();
    }
  });

  it("matches git-utils when discovering from a nested path", () => {
    const workingDir = copyFixture("working-dir");
    const nested = path.join(workingDir, "a.txt");
    const native = GitUtils.open(nested);
    try {
      const descriptor = discoverRepositoryDescriptor(nested);
      expect(descriptor.getWorkingDirectory()).toBe(native.getWorkingDirectory());
      expect(fs.absolute(descriptor.getPath())).toBe(fs.absolute(native.getPath()));
    } finally {
      native.release();
    }
  });

  it("matches git-utils libgit2 discovery from inside the git directory", () => {
    const start = fixturePath("master.git", "objects");
    const native = GitUtils.open(start);
    try {
      const descriptor = discoverRepositoryDescriptor(start);
      expect(fs.absolute(descriptor.getPath())).toBe(fs.absolute(native.getPath()));
      expect(descriptor.getWorkingDirectory()).toBe(native.getWorkingDirectory());
    } finally {
      native.release();
    }
  });

  it("reads submodule paths from .gitmodules", () => {
    // GitUtils.open on this fixture recurses into the (non-repository) submodule
    // directories and crashes in the fork's openRepository, so parity here is
    // asserted directly against the known .gitmodules content instead.
    const repoDir = copyFixture("repo-with-submodules");
    const descriptor = discoverRepositoryDescriptor(repoDir);
    expect(descriptor.getSubmodulePaths().sort()).toEqual(["You-Dont-Need-jQuery", "jstips"]);
    expect(descriptor.isSubmodule("jstips")).toBe(true);
    expect(descriptor.isSubmodule("You-Dont-Need-jQuery")).toBe(true);
    expect(descriptor.isSubmodule("README")).toBe(false);
  });

  it("returns null outside a repository", () => {
    const dir = temp.mkdirSync("descriptor-no-repo-");
    expect(discoverRepositoryDescriptor(dir)).toBeNull();
    expect(discoverGitDirectory(path.join(dir, "missing.txt"))).toBeNull();
  });
});
