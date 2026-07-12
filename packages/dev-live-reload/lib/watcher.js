const { CompositeDisposable, File, Directory, Emitter } = require("atom");
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
    const entity = new Directory(directoryPath);
    this.disposables.add(entity.onDidChange(callback));
    this.entities.push(entity);
  }

  watchFile(filePath) {
    if (this.isInAsarArchive(filePath)) return;
    const reloadFn = () => this.loadStylesheet(entity.getPath());

    const entity = new File(filePath);
    this.disposables.add(entity.onDidChange(reloadFn));
    this.disposables.add(entity.onDidDelete(reloadFn));
    this.disposables.add(entity.onDidRename(reloadFn));
    this.entities.push(entity);
  }

  isInAsarArchive(pathToCheck) {
    const { resourcePath } = atom.getLoadSettings();
    return (
      pathToCheck.startsWith(`${resourcePath}${path.sep}`) && path.extname(resourcePath) === ".asar"
    );
  }
};
