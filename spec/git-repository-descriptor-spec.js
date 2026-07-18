const fs = require("@lumine-code/fs-plus");
const path = require("path");
const temp = require("temp").track();
const {
  discoverRepositoryDescriptor,
  discoverGitDirectory,
} = require("../src/git-repository-descriptor");

// The descriptor replaces the libgit2 handle GitRepository used for identity and
// path routing. Its discovery and working-directory computation were validated
// against live git-utils while that dependency existed; these specs pin the same
// behavior against the real filesystem so it cannot silently drift.
describe("git repository descriptor", () => {
  const fixturePath = (...segments) => path.join(__dirname, "fixtures", "git", ...segments);
  const real = (p) => fs.realpathSync.native(p);

  function copyFixture(name) {
    const dir = temp.mkdirSync(`descriptor-${name}-`);
    fs.copySync(fixturePath(name), dir);
    fs.renameSync(path.join(dir, "git.git"), path.join(dir, ".git"));
    return dir;
  }

  it("discovers the git directory and working directory for a working tree", () => {
    const workingDir = copyFixture("working-dir");
    const descriptor = discoverRepositoryDescriptor(workingDir);

    expect(real(descriptor.getWorkingDirectory())).toBe(real(workingDir));
    expect(real(descriptor.getPath())).toBe(real(path.join(workingDir, ".git")));
    expect(descriptor.caseInsensitiveFs).toBe(fs.isCaseInsensitive());
  });

  it("discovers the repository from a nested path", () => {
    const workingDir = copyFixture("working-dir");
    const descriptor = discoverRepositoryDescriptor(path.join(workingDir, "a.txt"));

    expect(real(descriptor.getWorkingDirectory())).toBe(real(workingDir));
    expect(real(descriptor.getPath())).toBe(real(path.join(workingDir, ".git")));
  });

  it("walks up into a bare-style git directory like libgit2 discovery", () => {
    const descriptor = discoverRepositoryDescriptor(fixturePath("master.git", "objects"));

    expect(real(descriptor.getPath())).toBe(real(fixturePath("master.git")));
    // master.git declares core.bare = false, so its working directory is the
    // directory that contains it.
    expect(real(descriptor.getWorkingDirectory())).toBe(real(fixturePath()));
  });

  it("reads submodule paths from .gitmodules", () => {
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
