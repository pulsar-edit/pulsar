const path = require('path');
const fs = require('fs-plus');
const Dialog = require('./dialog');
const { repoForPath } = require("./helpers");

module.exports =
class MoveDialog extends Dialog {
  constructor(initialPath, {willMove, onMove, onMoveFailed}) {
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
  }

  onConfirm(newPath) {
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

    const directoryPath = path.dirname(newPath);
    try {
      let repo;
      this.willMove?.({initialPath: this.initialPath, newPath});
      if (!fs.existsSync(directoryPath)) { fs.makeTreeSync(directoryPath); }
      fs.moveSync(this.initialPath, newPath);
      this.onMove?.({initialPath: this.initialPath, newPath});
      // eslint-disable-next-line no-cond-assign
      if (repo = repoForPath(newPath)) {
        repo.getPathStatus(this.initialPath);
        repo.getPathStatus(newPath);
      }
      return this.close();
    } catch (error) {
      this.showError(`${error.message}.`);
      return this.onMoveFailed?.({initialPath: this.initialPath, newPath});
    }
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
