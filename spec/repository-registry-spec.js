const fs = require("fs");
const path = require("path");

const { Emitter } = require("event-kit");
const temp = require("temp").track();

const RepositoryRegistry = require("../src/repository-registry");

class FakeRepository {
  constructor(workingDirectory) {
    this.workingDirectory = workingDirectory;
    this.gitDirectory = path.join(workingDirectory, ".git");
    fs.mkdirSync(this.gitDirectory, { recursive: true });
    this.emitter = new Emitter();
    this.destroyed = false;
  }

  getWorkingDirectory() {
    return this.workingDirectory;
  }

  getPath() {
    return this.gitDirectory;
  }

  isDestroyed() {
    return this.destroyed;
  }

  isPresent() {
    return fs.existsSync(this.gitDirectory);
  }

  onDidDestroy(callback) {
    return this.emitter.once("did-destroy", callback);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.emitter.emit("did-destroy");
    this.emitter.dispose();
  }
}

class FakeProject {
  constructor(repositories) {
    this.repositories = repositories;
    this.directories = [];
    this.buffers = [];
    this.emitter = new Emitter();
  }

  getBuffers() {
    return this.buffers;
  }

  addBuffer(buffer) {
    this.buffers.push(buffer);
    this.emitter.emit("did-add-buffer", buffer);
  }

  onDidAddBuffer(callback) {
    return this.emitter.on("did-add-buffer", callback);
  }

  onDidChangeFiles(callback) {
    return this.emitter.on("did-change-files", callback);
  }

  emitFileChanges(events) {
    this.emitter.emit("did-change-files", events);
  }

  getDirectories() {
    return this.directories;
  }

  getDirectoryForProjectPath(filePath) {
    return directoryFor(filePath);
  }

  repositoryForDirectoryFromProvidersSync(directory) {
    const directoryPath = directory.getPath();
    return (
      this.repositories
        .filter((repository) => contains(repository.getWorkingDirectory(), directoryPath))
        .sort(
          (left, right) => right.getWorkingDirectory().length - left.getWorkingDirectory().length,
        )[0] || null
    );
  }

  async repositoryForDirectoryFromProviders(directory) {
    return this.repositoryForDirectoryFromProvidersSync(directory);
  }
}

function normalize(filePath) {
  const resolved = path.resolve(filePath);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function contains(parentPath, childPath) {
  const parent = normalize(parentPath);
  const child = normalize(childPath);
  return child === parent || child.startsWith(`${parent}${path.sep}`);
}

function directoryFor(directoryPath) {
  return {
    getPath() {
      return directoryPath;
    },
    getRealPathSync() {
      return directoryPath;
    },
  };
}

function config(values = {}) {
  return {
    get(key) {
      return values[key];
    },
  };
}

function bufferFor(filePath) {
  const emitter = new Emitter();
  let currentPath = filePath;
  return {
    getPath() {
      return currentPath;
    },
    onDidChangePath(callback) {
      return emitter.on("did-change-path", callback);
    },
    onDidDestroy(callback) {
      return emitter.once("did-destroy", callback);
    },
    destroy() {
      emitter.emit("did-destroy");
      emitter.dispose();
    },
    setPath(nextPath) {
      currentPath = nextPath;
      emitter.emit("did-change-path");
    },
  };
}

describe("RepositoryRegistry", () => {
  let project;
  let registry;
  let repositories;

  beforeEach(() => {
    repositories = [];
    project = new FakeProject(repositories);
    registry = new RepositoryRegistry({ project, config: config() });
  });

  afterEach(() => registry.destroy());

  it("finds a repository containing a project root", () => {
    const workdir = temp.mkdirSync("containing-repository");
    const rootPath = path.join(workdir, "packages", "editor");
    repositories.push(new FakeRepository(workdir));

    registry.setProjectRoots([directoryFor(rootPath)]);

    expect(registry.getRepositories()).toEqual(repositories);
    expect(registry.getForPath(path.join(rootPath, "src", "main.js"))).toBe(repositories[0]);
  });

  it("routes a path to the nearest nested repository", () => {
    const outerPath = temp.mkdirSync("outer-repository");
    const nestedPath = path.join(outerPath, "packages", "nested");
    const outer = new FakeRepository(outerPath);
    const nested = new FakeRepository(nestedPath);
    repositories.push(outer, nested);

    registry.setProjectRoots([directoryFor(outerPath)]);
    registry.resolveForPathSync(path.join(nestedPath, "src", "main.js"));

    expect(registry.getForPath(path.join(outerPath, "README.md"))).toBe(outer);
    expect(registry.getForPath(path.join(nestedPath, "src", "main.js"))).toBe(nested);
  });

  it("routes cached paths without filesystem calls", () => {
    const workdir = temp.mkdirSync("cached-routing-repository");
    const repository = new FakeRepository(workdir);
    repositories.push(repository);
    registry.setProjectRoots([directoryFor(workdir)]);
    spyOn(fs.realpathSync, "native").andCallThrough();

    for (let index = 0; index < 1000; index++) {
      registry.getForPath(path.join(workdir, "src", `file-${index}.js`));
    }

    expect(fs.realpathSync.native).not.toHaveBeenCalled();
  });

  it("does not remove and re-add a repository when roots are replaced inside it", () => {
    const workdir = temp.mkdirSync("reconciled-repository");
    const repository = new FakeRepository(workdir);
    const changes = [];
    repositories.push(repository);
    registry.onDidChange((change) => changes.push(change));

    registry.setProjectRoots([directoryFor(path.join(workdir, "frontend"))]);
    changes.length = 0;
    registry.setProjectRoots([directoryFor(path.join(workdir, "backend"))]);

    expect(registry.getRepositories()).toEqual([repository]);
    expect(repository.isDestroyed()).toBe(false);
    expect(changes.length).toBe(1);
    expect(changes[0].added).toEqual([]);
    expect(changes[0].removed).toEqual([]);
  });

  it("keeps a repository until its last root owner is removed", () => {
    const workdir = temp.mkdirSync("multi-root-repository");
    const repository = new FakeRepository(workdir);
    repositories.push(repository);

    registry.setProjectRoots([
      directoryFor(path.join(workdir, "frontend")),
      directoryFor(path.join(workdir, "backend")),
    ]);
    registry.setProjectRoots([directoryFor(path.join(workdir, "backend"))]);

    expect(registry.getRepositories()).toEqual([repository]);
    expect(repository.isDestroyed()).toBe(false);

    registry.setProjectRoots([]);
    expect(registry.getRepositories()).toEqual([]);
    expect(repository.isDestroyed()).toBe(true);
  });

  it("keeps a pinned repository after its root is removed", () => {
    const workdir = temp.mkdirSync("pinned-repository");
    const repository = new FakeRepository(workdir);
    repositories.push(repository);

    registry.setProjectRoots([directoryFor(workdir)]);
    const pin = registry.retain(repository);
    registry.setProjectRoots([]);

    expect(registry.getRepositories()).toEqual([repository]);
    expect(repository.isDestroyed()).toBe(false);

    pin.dispose();
    expect(registry.getRepositories()).toEqual([]);
    expect(repository.isDestroyed()).toBe(true);
  });

  it("keeps a repository alive until an operation completes", async () => {
    const workdir = temp.mkdirSync("operation-owned-repository");
    const repository = new FakeRepository(workdir);
    repositories.push(repository);
    registry.setProjectRoots([directoryFor(workdir)]);

    let completeOperation;
    const operation = registry.runOperation(
      repository,
      () => new Promise((resolve) => (completeOperation = resolve)),
    );
    registry.setProjectRoots([]);
    expect(repository.isDestroyed()).toBe(false);

    completeOperation("done");
    expect(await operation).toBe("done");
    expect(repository.isDestroyed()).toBe(true);
  });

  it("keeps a repository until its last open buffer is destroyed", async () => {
    const workdir = temp.mkdirSync("buffer-owned-repository");
    const repository = new FakeRepository(workdir);
    const buffer = bufferFor(path.join(workdir, "src", "main.js"));
    repositories.push(repository);

    registry.setProjectRoots([directoryFor(workdir)]);
    project.addBuffer(buffer);
    registry.setProjectRoots([]);

    expect(registry.getRepositories()).toEqual([repository]);
    expect(repository.isDestroyed()).toBe(false);

    buffer.destroy();
    await Promise.resolve();
    expect(registry.getRepositories()).toEqual([]);
    expect(repository.isDestroyed()).toBe(true);
  });

  it("releases an old buffer repository after all path listeners run", async () => {
    const workdir = temp.mkdirSync("moved-buffer-repository");
    const repository = new FakeRepository(workdir);
    const buffer = bufferFor(path.join(workdir, "main.js"));
    repositories.push(repository);

    registry.setProjectRoots([directoryFor(workdir)]);
    project.addBuffer(buffer);
    registry.setProjectRoots([]);
    buffer.onDidChangePath(() => expect(repository.isDestroyed()).toBe(false));
    buffer.setPath(path.join(temp.mkdirSync("outside-repository"), "main.js"));

    await Promise.resolve();
    expect(repository.isDestroyed()).toBe(true);
  });

  it("discovers repositories below a project root to the requested depth", async () => {
    const rootPath = temp.mkdirSync("scanned-root");
    const nestedPath = path.join(rootPath, "packages", "nested");
    fs.mkdirSync(path.join(nestedPath, ".git"), { recursive: true });
    const nested = new FakeRepository(nestedPath);
    repositories.push(nested);

    registry.setProjectRoots([directoryFor(rootPath)]);
    await registry.scanProjectRoots({ depth: 2 });

    expect(registry.getRepositories()).toContain(nested);
  });

  it("removes repositories that disappeared during a manual rescan", async () => {
    const workdir = temp.mkdirSync("removed-repository");
    const repository = new FakeRepository(workdir);
    repositories.push(repository);
    project.directories = [directoryFor(workdir)];

    registry.setProjectRoots(project.directories);
    fs.rmSync(repository.getPath(), { recursive: true });
    await registry.rescan();

    expect(registry.getRepositories()).toEqual([]);
    expect(repository.isDestroyed()).toBe(true);
  });

  it("optionally detects repositories added and removed below a root", () => {
    registry.destroy();
    registry = new RepositoryRegistry({
      project,
      config: config({
        "core.repositoryWatchDiscovery": true,
        "core.repositoryWatchDepth": 1,
      }),
    });
    const rootPath = temp.mkdirSync("watched-root");
    const nestedPath = path.join(rootPath, "nested");
    fs.mkdirSync(nestedPath);
    registry.setProjectRoots([directoryFor(rootPath)]);

    const repository = new FakeRepository(nestedPath);
    repositories.push(repository);
    project.emitFileChanges([{ path: repository.getPath() }]);
    expect(registry.getForPath(nestedPath)).toBe(repository);

    fs.rmSync(repository.getPath(), { recursive: true });
    project.emitFileChanges([{ path: repository.getPath() }]);
    expect(registry.getForPath(nestedPath)).toBeNull();
    expect(repository.isDestroyed()).toBe(true);
  });
});
