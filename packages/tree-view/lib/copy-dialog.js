const path = require('path');
const fs = require('fs-plus');
const Dialog = require('./dialog');
const { repoForPath } = require("./helpers");

module.exports =
class CopyDialog extends Dialog {
  constructor(initialPath, {fileOperations, onCopy}) {
    super({
      prompt: 'Enter the new path for the duplicate.',
      initialPath: atom.project.relativize(initialPath),
      select: true,
      iconClass: 'icon-arrow-right'
    });

    this.initialPath = initialPath;
    this.onCopy = onCopy;
    this.fileOperations = fileOperations;
  }

  async onConfirm(newPath) {
    if (this.busy) return;

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

    let action = {
      kind: fs.isDirectorySync(this.initialPath) ? 'folder' : 'file',
      newPath
    };

    let error;
    let copied;
    this.setBusy(true);
    try {
      [copied] = await this.fileOperations.run('create', [action], async ([action]) => {
        try {
          if (fs.existsSync(newPath)) {
            throw new Error(`'${newPath}' already exists`);
          }
          if (action.kind === 'folder') {
            fs.copySync(this.initialPath, newPath);
          } else {
            fs.copyFileSync(this.initialPath, newPath);
          }
          let repo = repoForPath(newPath);
          repo?.getPathStatus(this.initialPath);
          repo?.getPathStatus(newPath);
          return [action];
        } catch (e) {
          error = e;
          return [];
        }
      });
    } finally {
      this.setBusy(false);
    }

    if (!copied) {
      return this.showError(`${error.message}.`);
    }

    this.onCopy?.({ initialPath: this.initialPath, newPath });
    if (action.kind === 'file') {
      atom.workspace.open(newPath, {
        activatePane: true,
        initialLine: activeEditor?.getLastCursor().getBufferRow(),
        initialColumn: activeEditor?.getLastCursor().getBufferColumn()
      });
    }
    return this.close();
  }
}
