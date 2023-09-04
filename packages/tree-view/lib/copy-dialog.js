const path = require('path');
const fs = require('fs-plus');
const Dialog = require('./dialog');
const { repoForPath } = require("./helpers");

module.exports =
class CopyDialog extends Dialog {
  constructor(initialPath, {onCopy}) {
    super({
      prompt: 'Enter the new path for the duplicate.',
      initialPath: atom.project.relativize(initialPath),
      select: true,
      iconClass: 'icon-arrow-right'
    });

    this.initialPath = initialPath;
    this.onCopy = onCopy;
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

    if (fs.existsSync(newPath)) {
      this.showError(`'${newPath}' already exists.`);
      return;
    }

    let activeEditor = atom.workspace.getActiveTextEditor();
    if (activeEditor?.getPath() !== this.initialPath) { activeEditor = null; }
    try {
      let repo;
      if (fs.isDirectorySync(this.initialPath)) {
        fs.copySync(this.initialPath, newPath);
        this.onCopy?.({initialPath: this.initialPath, newPath});
      } else {
        fs.copy(this.initialPath, newPath, () => {
          this.onCopy?.({initialPath: this.initialPath, newPath});
          return atom.workspace.open(newPath, {
            activatePane: true,
            initialLine: activeEditor?.getLastCursor().getBufferRow(),
            initialColumn: activeEditor?.getLastCursor().getBufferColumn()
          }
          );
        });
      }
      if (repo = repoForPath(newPath)) {
        repo.getPathStatus(this.initialPath);
        repo.getPathStatus(newPath);
      }
      return this.close();
    } catch (error) {
      return this.showError(`${error.message}.`);
    }
  }
}
