const path = require('path');
const fs = require('fs-plus');
const Dialog = require('./dialog');
const { repoForPath } = require("./helpers");

module.exports =
class MoveDialog extends Dialog {
  constructor(initialPath, {fileOperations, willMove, onMove, onMoveFailed}) {
    let prompt;
    if (fs.isDirectorySync(initialPath)) {
      prompt = 'Enter the new path for the directory.';
    } else {
      prompt = 'Enter the new path for the file.';
    }

    super({
      prompt,
      initialPath: atom.project.relativize(initialPath),
      select: true,
      iconClass: 'icon-arrow-right'
    });

    this.initialPath = initialPath;
    this.willMove = willMove;
    this.onMove = onMove;
    this.onMoveFailed = onMoveFailed;
    this.fileOperations = fileOperations;
  }

  async onConfirm(newPath) {
    if (this.busy) return;
    newPath = newPath.replace(/\s+$/, ''); // Remove trailing whitespace
    if (!path.isAbsolute(newPath)) {
      let [rootPath] = Array.from(atom.project.relativizePath(this.initialPath));
      if (!rootPath) {
        // This path was never in the project in the first place. But we've
        // been given a project-relative URL, so we should move it into the
        // project and its new absolute path should start with the root path of
        // this project.
        let projectPaths = atom.project.getPaths();
        if (projectPaths.length === 1) {
          rootPath = projectPaths[0];
        } else {
          // But if there are _multiple_ root paths in this project, we do not
          // have a good way of sensing which root path relative to which this
          // file should be placed.
          this.showError(`Cannot move '${newPath}' into the project via a relative path because there is more than one project root. Please provide an absolute path.`);
          return;
        }
      }
      newPath = path.join(rootPath, newPath);
      if (!newPath) { return; }
    }

    if (this.initialPath === newPath) {
      this.close();
      return;
    }

    if (!this.isNewPathValid(newPath)) {
      this.showError(`'${newPath}' already exists.`);
      return;
    }

    let stats;
    try {
      stats = fs.lstatSync(this.initialPath);
    } catch (error) {
      // The source vanished after the dialog opened.
      return this.showError(`${error.message}.`);
    }

    let action = {
      kind: stats.isDirectory() ? 'folder' : 'file',
      oldPath: this.initialPath,
      newPath
    };
    let error;
    let moved;

    this.setBusy(true);
    try {
      [moved] = await this.fileOperations.run('move', [action], async ([action]) => {
        let { oldPath: initialPath, newPath } = action;
        try {
          // Check again: something may have appeared here during the wait.
          if (!this.isNewPathValid(newPath)) {
            throw new Error(`'${newPath}' already exists`);
          }
          this.willMove?.({ initialPath, newPath });
          let directoryPath = path.dirname(newPath);
          if (!fs.existsSync(directoryPath)) fs.makeTreeSync(directoryPath);
          fs.moveSync(initialPath, newPath);
          this.onMove?.({ initialPath, newPath });
          let repo = repoForPath(newPath);
          repo?.getPathStatus(initialPath);
          repo?.getPathStatus(newPath);
          return [action];
        } catch (e) {
          error = e;
          this.onMoveFailed?.({ initialPath, newPath });
          return [];
        }
      });
    } finally {
      this.setBusy(false);
    }

    if (!moved) {
      return this.showError(`${error.message}.`);
    }
    return this.close();
  }

  isNewPathValid(newPath) {
    try {
      const oldStat = fs.statSync(this.initialPath);
      const newStat = fs.statSync(newPath);

      // New path exists so check if it points to the same file as the initial
      // path to see if the case of the file name is being changed on a on a
      // case insensitive filesystem.
      return (this.initialPath.toLowerCase() === newPath.toLowerCase()) &&
        (oldStat.dev === newStat.dev) &&
        (oldStat.ino === newStat.ino);
    } catch (error) {
      return true; // new path does not exist so it is valid
    }
  }
}
