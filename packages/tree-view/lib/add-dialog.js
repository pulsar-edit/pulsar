const path = require('path');
const fs = require('fs-plus');
const Dialog = require('./dialog');
const { repoForPath } = require('./helpers');

module.exports =
class AddDialog extends Dialog {
  constructor(initialPath, isCreatingFile, fileOperations) {
    let directoryPath;

    if (fs.isFileSync(initialPath)) {
      directoryPath = path.dirname(initialPath);
    } else {
      directoryPath = initialPath;
    }

    let rootProjectPath;
    let relativeDirectoryPath = directoryPath;
    [rootProjectPath, relativeDirectoryPath] = atom.project.relativizePath(directoryPath);
    if (relativeDirectoryPath.length > 0) { relativeDirectoryPath += path.sep; }

    super({
      prompt: "Enter the path for the new " + (isCreatingFile ? "file." : "folder."),
      initialPath: relativeDirectoryPath,
      select: false,
      iconClass: isCreatingFile ? 'icon-file-add' : 'icon-file-directory-create'
    });

    this.isCreatingFile = isCreatingFile;
    this.rootProjectPath = rootProjectPath;
    this.fileOperations = fileOperations;
  }

  onDidCreateFile(callback) {
    return this.emitter.on('did-create-file', callback);
  }

  onDidCreateDirectory(callback) {
    return this.emitter.on('did-create-directory', callback);
  }

  async onConfirm(newPath) {
    if (this.busy) return;

    newPath = newPath.replace(/\s+$/, ''); // Remove trailing whitespace
    const endsWithDirectorySeparator = newPath[newPath.length - 1] === path.sep;
    if (!path.isAbsolute(newPath)) {
      if (this.rootProjectPath == null) {
        this.showError("You must open a directory to create a file with a relative path");
        return;
      }

      newPath = path.join(this.rootProjectPath, newPath);
    }

    if (!newPath) { return; }

    if (fs.existsSync(newPath)) {
      return this.showError(`'${newPath}' already exists.`);
    }

    if (this.isCreatingFile && endsWithDirectorySeparator) {
      return this.showError(`File names must not end with a '${path.sep}' character.`);
    }

    let action = { kind: this.isCreatingFile ? 'file' : 'folder', newPath };
    let error;
    let created;

    this.setBusy(true);
    try {
      [created] = await this.fileOperations.run('create', [action], async ([action]) => {
        try {
          // Check again; something may have appeared here while consumers were
          // reacting.
          if (fs.existsSync(newPath)) {
            throw new Error(`'${newPath}' already exists`);
          }
          if (action.kind === 'file') {
            fs.writeFileSync(newPath, '');
            repoForPath(newPath)?.getPathStatus(newPath);
          } else {
            fs.makeTreeSync(newPath);
          }
          return [action];
        } catch (e) {
          error = e;
          return [];
        }
      });
    } finally {
      this.setBusy(false);
    }

    if (!created) {
      return this.showError(`${error.message}.`);
    }

    if (this.isCreatingFile) {
      this.emitter.emit('did-create-file', newPath);
      return this.close();
    } else {
      this.emitter.emit('did-create-directory', newPath);
      return this.cancel();
    }
  }
}
