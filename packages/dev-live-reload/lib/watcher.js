const { CompositeDisposable, Disposable, Emitter, watchPath, watchFile: watchSingleFile } = require("atom");
const path = require("path");

module.exports = class Watcher {
  constructor() {
    this.destroy = this.destroy.bind(this);
    this.emitter = new Emitter();
    this.disposables = new CompositeDisposable();
    this.entities = []; // Used for specs
    this.reloadTimer = null;
    this.destroyed = false;
  }

  onDidDestroy(callback) {
    return this.emitter.on("did-destroy", callback);
  }

  onDidChangeGlobals(callback) {
    return this.emitter.on("did-change-globals", callback);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    clearTimeout(this.reloadTimer);
    this.disposables.dispose();
    this.entities = null;
    this.emitter.emit("did-destroy");
    this.emitter.dispose();
  }

  watch() {
    // override me
  }

  loadStylesheet(_stylesheetPath) {
    // override me
  }

  loadAllStylesheets() {
    // override me
  }

  emitGlobalsChanged() {
    this.emitter.emit("did-change-globals");
  }

  scheduleReload(callback) {
    clearTimeout(this.reloadTimer);
    this.reloadTimer = setTimeout(() => {
      this.reloadTimer = null;
      if (!this.destroyed) callback();
    }, 25);
  }

  watchDirectory(directoryPath, callback = () => this.loadAllStylesheets()) {
    if (this.isInAsarArchive(directoryPath)) return;
    // Route change notifications through an emitter so tests can synthesize
    // events (like the old Directory) and callers can subscribe uniformly.
    const emitter = new Emitter();
    const watcherPromise = watchPath(directoryPath, {}, () => emitter.emit("did-change"));
    watcherPromise.catch(() => {});
    this.disposables.add(
      new Disposable(() => watcherPromise.then((watcher) => watcher.dispose(), () => {})),
      emitter.on("did-change", () => callback()),
      new Disposable(() => emitter.dispose()),
    );
    // PackageWatcher filters `entities` by `isFile()`/`getPath()` to avoid
    // re-watching known stylesheets; `emitter` mirrors the old Directory API.
    this.entities.push({
      getPath: () => directoryPath,
      isFile: () => false,
      isDirectory: () => true,
      emitter,
    });
  }

  watchFile(filePath) {
    if (this.isInAsarArchive(filePath)) return;
    const reloadFn = () => this.loadStylesheet(filePath);

    const watcher = watchSingleFile(filePath);
    this.disposables.add(
      watcher,
      watcher.onDidChange(reloadFn),
      watcher.onDidDelete(reloadFn),
      watcher.onDidRename(reloadFn),
    );
    this.entities.push({
      getPath: () => filePath,
      isFile: () => true,
      isDirectory: () => false,
      emitter: watcher.emitter,
    });
  }

  isInAsarArchive(pathToCheck) {
    const { resourcePath } = atom.getLoadSettings();
    return (
      pathToCheck.startsWith(`${resourcePath}${path.sep}`) && path.extname(resourcePath) === ".asar"
    );
  }
};
