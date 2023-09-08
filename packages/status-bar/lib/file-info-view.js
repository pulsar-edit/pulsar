const { Disposable } = require('atom');
const url = require('url');
const fs = require('fs-plus');

module.exports =
class FileInfoView {
  constructor() {
    this.element = document.createElement('status-bar-file');
    this.element.classList.add('file-info', 'inline-block');

    this.currentPath = document.createElement('a');
    this.currentPath.classList.add('current-path');
    this.element.appendChild(this.currentPath);
    this.element.currentPath = this.currentPath;

    this.element.getActiveItem = this.getActiveItem.bind(this);

    this.activeItemSubscription = atom.workspace.getCenter().onDidChangeActivePaneItem(() => {
      this.subscribeToActiveItem();
    });
    this.subscribeToActiveItem();

    this.registerTooltip();
    const clickHandler = event => {
      const isShiftClick = event.shiftKey;
      this.showCopiedTooltip(isShiftClick);
      const text = this.getActiveItemCopyText(isShiftClick);
      atom.clipboard.write(text);
      return setTimeout(() => {
        return this.clearCopiedTooltip();
      }
      , 2000);
    };

    this.element.addEventListener('click', clickHandler);
    this.clickSubscription = new Disposable(() => this.element.removeEventListener('click', clickHandler));
  }

  registerTooltip() {
    this.tooltip = atom.tooltips.add(this.element, { title() {
      return "Click to copy absolute file path (Shift + Click to copy relative path)";
    }
  });
  }

  clearCopiedTooltip() {
    this.copiedTooltip?.dispose();
    this.registerTooltip();
  }

  showCopiedTooltip(copyRelativePath) {
    this.tooltip?.dispose();
    this.copiedTooltip?.dispose();
    const text = this.getActiveItemCopyText(copyRelativePath);
    this.copiedTooltip = atom.tooltips.add(this.element, {
      title: `Copied: ${text}`,
      trigger: 'manual',
      delay: {
        show: 0
      }
    }
    );
  }

  getActiveItemCopyText(copyRelativePath) {
    const activeItem = this.getActiveItem();
    let path = activeItem?.getPath?.();
    if ((path == null)) { return activeItem?.getTitle?.() || ''; }

    // Make sure we try to relativize before parsing URLs.
    if (copyRelativePath) {
      const relativized = atom.project.relativize(path);
      if (relativized !== path) {
        return relativized;
      }
    }

    // An item path could be a url, we only want to copy the `path` part
    if (path?.indexOf('://') > 0) {
      ({
        path
      } = url.parse(path));
    }
    return path;
  }

  subscribeToActiveItem() {
    this.modifiedSubscription?.dispose();
    this.titleSubscription?.dispose();
    const activeItem = this.getActiveItem();

    if (activeItem) {
      if (this.updateCallback == null) { this.updateCallback = () => this.update(); }

      if (typeof activeItem.onDidChangeTitle === 'function') {
        this.titleSubscription = activeItem.onDidChangeTitle(this.updateCallback);
      } else if (typeof activeItem.on === 'function') {
        //TODO Remove once title-changed event support is removed
        activeItem.on('title-changed', this.updateCallback);
        this.titleSubscription = { dispose: () => {
          return activeItem.off?.('title-changed', this.updateCallback);
        }
      };
      }

      this.modifiedSubscription = activeItem.onDidChangeModified?.(this.updateCallback);
    }

    this.update();
  }

  destroy() {
    this.activeItemSubscription.dispose();
    this.titleSubscription?.dispose();
    this.modifiedSubscription?.dispose();
    this.clickSubscription?.dispose();
    this.copiedTooltip?.dispose();
    this.tooltip?.dispose();
  }

  getActiveItem() {
    return atom.workspace.getCenter().getActivePaneItem();
  }

  update() {
    this.updatePathText();
    this.updateBufferHasModifiedText(this.getActiveItem()?.isModified?.());
  }

  updateBufferHasModifiedText(isModified) {
    if (isModified) {
      this.element.classList.add('buffer-modified');
      this.isModified = true;
    } else {
      this.element.classList.remove('buffer-modified');
      this.isModified = false;
    }
  }

  updatePathText() {
    const path = this.getActiveItem()?.getPath?.();
    const title = this.getActiveItem()?.getTitle?.();

    if (path) {
      const relativized = atom.project.relativize(path);
      this.currentPath.textContent = (relativized != null) ? fs.tildify(relativized) : path;
    } else if (title) {
      this.currentPath.textContent = title;
    } else {
      this.currentPath.textContent = '';
    }
  }
}
