const { Disposable } = require("atom");
const fs = require("fs");
const os = require("os");
const path = require("path");

const Directory = require("../lib/directory");

function repositoryFor({ relativePath, statuses, directoryStatus = 0 }) {
  return {
    statuses,
    getDirectoryStatus: jasmine.createSpy("getDirectoryStatus").andReturn(directoryStatus),
    isPathIgnored: jasmine.createSpy("isPathIgnored").andReturn(false),
    isStatusModified(status) {
      return (status & 1) !== 0;
    },
    isStatusNew(status) {
      return (status & 2) !== 0;
    },
    isSubmodule() {
      return false;
    },
    onDidChangeStatus() {
      return new Disposable();
    },
    onDidChangeStatuses() {
      return new Disposable();
    },
    relativize() {
      return relativePath;
    },
  };
}

function createDirectory(fullPath, repository, { isRoot = false } = {}) {
  spyOn(atom.repositories, "getForPath").andReturn(repository);
  return new Directory({
    name: "repository",
    fullPath,
    isRoot,
    ignoredNames: { matches: () => false },
    useSyncFS: true,
  });
}

describe("TreeView Directory Git status", () => {
  let directory;
  let temporaryDirectories;

  beforeEach(() => {
    temporaryDirectories = [];
  });

  function makeTemporaryDirectory(name) {
    const directoryPath = fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));
    temporaryDirectories.push(directoryPath);
    return directoryPath;
  }

  afterEach(() => {
    directory?.destroy();
    for (const directoryPath of temporaryDirectories) {
      fs.rmSync(directoryPath, { recursive: true, force: true });
    }
  });

  it("aggregates status for a nested repository root", () => {
    const directoryPath = makeTemporaryDirectory("nested-repository-directory");
    const repository = repositoryFor({
      relativePath: "",
      statuses: { "modified.txt": 1 },
    });

    directory = createDirectory(directoryPath, repository);

    expect(directory.status).toBe("modified");
    expect(repository.getDirectoryStatus).not.toHaveBeenCalled();
  });

  it("limits a project root inside a repository to its displayed subtree", () => {
    const directoryPath = makeTemporaryDirectory("project-root-inside-repository");
    const repository = repositoryFor({
      relativePath: "packages/application",
      statuses: { "outside-project.txt": 1 },
      directoryStatus: 0,
    });

    directory = createDirectory(directoryPath, repository, { isRoot: true });

    expect(directory.status).toBeNull();
    expect(repository.getDirectoryStatus).toHaveBeenCalledWith(directoryPath);
  });
});
