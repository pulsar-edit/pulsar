/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
let MoveDialog;
const path = require('path');
const fs = require('fs-plus');
const Dialog = require('./dialog');
const {repoForPath} = require("./helpers");

module.exports =
(MoveDialog = class MoveDialog extends Dialog {
  constructor(initialPath, {willMove, onMove, onMoveFailed}) {
    let prompt;
    this.initialPath = initialPath;
    this.willMove = willMove;
    this.onMove = onMove;
    this.onMoveFailed = onMoveFailed;
    if (fs.isDirectorySync(this.initialPath)) {
      prompt = 'Enter the new path for the directory.';
    } else {
      prompt = 'Enter the new path for the file.';
    }

    super({
      prompt,
      initialPath: atom.project.relativize(this.initialPath),
      select: true,
      iconClass: 'icon-arrow-right'
    });
  }

  onConfirm(newPath) {
    newPath = newPath.replace(/\s+$/, ''); // Remove trailing whitespace
    if (!path.isAbsolute(newPath)) {
      const [rootPath] = Array.from(atom.project.relativizePath(this.initialPath));
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
});
