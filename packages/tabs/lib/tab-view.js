const path = require('path');
const {Disposable, CompositeDisposable} = require('atom');
const getIconServices = require('./get-icon-services');

const layout = require('./layout');

class TabView {
  constructor({item, pane, didClickCloseIcon, tabs, location}) {
    this.item = item;
    this.pane = pane;
    this.tabs = tabs;
    if (typeof this.item.getPath === 'function') {
      this.path = this.item.getPath();
    }

    this.element = document.createElement('li');
    this.element.setAttribute('is', 'tabs-tab');
    if (['TextEditor', 'TestView'].indexOf(this.item.constructor.name) > -1) {
      this.element.classList.add('texteditor');
    }
    this.element.classList.add('tab', 'sortable');

    this.itemTitle = document.createElement('div');
    this.itemTitle.classList.add('title');
    this.element.appendChild(this.itemTitle);

    if ((location === 'center') || !(typeof this.item.isPermanentDockItem === 'function' ? this.item.isPermanentDockItem() : undefined)) {
      const closeIcon = document.createElement('div');
      closeIcon.classList.add('close-icon');
      closeIcon.onclick = didClickCloseIcon;
      this.element.appendChild(closeIcon);
    }

    this.subscriptions = new CompositeDisposable();

    this.handleEvents();
    this.updateDataAttributes();
    this.updateTitle();
    this.updateIcon();
    this.updateModifiedStatus();
    this.setupTooltip();

    if (this.isItemPending()) {
      this.itemTitle.classList.add('temp');
      this.element.classList.add('pending-tab');
    }

    this.element.ondrag = e => layout.drag(e);
    this.element.ondragend = e => layout.end(e);

    this.element.pane = this.pane;
    this.element.item = this.item;
    this.element.itemTitle = this.itemTitle;
    this.element.path = this.path;
  }

  handleEvents() {
    const titleChangedHandler = () => {
      return this.updateTitle();
    };

    this.subscriptions.add(this.pane.onDidDestroy(() => this.destroy()));
    this.subscriptions.add(this.pane.onItemDidTerminatePendingState(item => {
      if (item === this.item) { return this.clearPending(); }
    })
    );

    if (typeof this.item.onDidChangeTitle === 'function') {
      const onDidChangeTitleDisposable = this.item.onDidChangeTitle(titleChangedHandler);
      if (Disposable.isDisposable(onDidChangeTitleDisposable)) {
        this.subscriptions.add(onDidChangeTitleDisposable);
      } else {
        console.warn("::onDidChangeTitle does not return a valid Disposable!", this.item);
      }
    } else if (typeof this.item.on === 'function') {
      //TODO Remove once old events are no longer supported
      this.item.on('title-changed', titleChangedHandler);
      this.subscriptions.add({dispose: () => {
        return (typeof this.item.off === 'function' ? this.item.off('title-changed', titleChangedHandler) : undefined);
      }
      });
    }

    const pathChangedHandler = path1 => {
      this.path = path1;
      this.updateDataAttributes();
      this.updateTitle();
      this.updateTooltip();
      return this.updateIcon();
    };

    if (typeof this.item.onDidChangePath === 'function') {
      const onDidChangePathDisposable = this.item.onDidChangePath(pathChangedHandler);
      if (Disposable.isDisposable(onDidChangePathDisposable)) {
        this.subscriptions.add(onDidChangePathDisposable);
      } else {
        console.warn("::onDidChangePath does not return a valid Disposable!", this.item);
      }
    } else if (typeof this.item.on === 'function') {
      //TODO Remove once old events are no longer supported
      this.item.on('path-changed', pathChangedHandler);
      this.subscriptions.add({dispose: () => {
        return (typeof this.item.off === 'function' ? this.item.off('path-changed', pathChangedHandler) : undefined);
      }
      });
    }

    const iconChangedHandler = () => {
      return this.updateIcon();
    };

    this.subscriptions.add(getIconServices().onDidChange(() => this.updateIcon()));

    if (typeof this.item.onDidChangeIcon === 'function') {
      const onDidChangeIconDisposable = typeof this.item.onDidChangeIcon === 'function' ? this.item.onDidChangeIcon(() => {
        return this.updateIcon();
      }) : undefined;
      if (Disposable.isDisposable(onDidChangeIconDisposable)) {
        this.subscriptions.add(onDidChangeIconDisposable);
      } else {
        console.warn("::onDidChangeIcon does not return a valid Disposable!", this.item);
      }
    } else if (typeof this.item.on === 'function') {
      //TODO Remove once old events are no longer supported
      this.item.on('icon-changed', iconChangedHandler);
      this.subscriptions.add({dispose: () => {
        return (typeof this.item.off === 'function' ? this.item.off('icon-changed', iconChangedHandler) : undefined);
      }
      });
    }

    const modifiedHandler = () => {
      return this.updateModifiedStatus();
    };

    if (typeof this.item.onDidChangeModified === 'function') {
      const onDidChangeModifiedDisposable = this.item.onDidChangeModified(modifiedHandler);
      if (Disposable.isDisposable(onDidChangeModifiedDisposable)) {
        this.subscriptions.add(onDidChangeModifiedDisposable);
      } else {
        console.warn("::onDidChangeModified does not return a valid Disposable!", this.item);
      }
    } else if (typeof this.item.on === 'function') {
      //TODO Remove once old events are no longer supported
      this.item.on('modified-status-changed', modifiedHandler);
      this.subscriptions.add({dispose: () => {
        return (typeof this.item.off === 'function' ? this.item.off('modified-status-changed', modifiedHandler) : undefined);
      }
      });
    }

    if (typeof this.item.onDidSave === 'function') {
      const onDidSaveDisposable = this.item.onDidSave(event => {
        this.terminatePendingState();
        if (event.path !== this.path) {
          this.path = event.path;
          if (atom.config.get('tabs.enableVcsColoring')) { return this.setupVcsStatus(); }
        }
      });

      if (Disposable.isDisposable(onDidSaveDisposable)) {
        this.subscriptions.add(onDidSaveDisposable);
      } else {
        console.warn("::onDidSave does not return a valid Disposable!", this.item);
      }
    }
    this.subscriptions.add(atom.config.observe('tabs.showIcons', () => {
      return this.updateIconVisibility();
    })
    );

    return this.subscriptions.add(atom.config.observe('tabs.enableVcsColoring', isEnabled => {
      if (isEnabled && (this.path != null)) { return this.setupVcsStatus(); } else { return this.unsetVcsStatus(); }
    })
    );
  }

  setupTooltip() {
    // Defer creating the tooltip until the tab is moused over
    const onMouseEnter = () => {
      this.mouseEnterSubscription.dispose();
      this.hasBeenMousedOver = true;
      this.updateTooltip();

      // Trigger again so the tooltip shows
      return this.element.dispatchEvent(new CustomEvent('mouseenter', {bubbles: true}));
    };

    this.mouseEnterSubscription = { dispose: () => {
      this.element.removeEventListener('mouseenter', onMouseEnter);
      return this.mouseEnterSubscription = null;
    }
  };

    return this.element.addEventListener('mouseenter', onMouseEnter);
  }

  updateTooltip() {
    if (!this.hasBeenMousedOver) { return; }

    this.destroyTooltip();

    if (this.path) {
      return this.tooltip = atom.tooltips.add(this.element, {
        title: this.path,
        html: false,
        delay: {
          show: 1000,
          hide: 100
        },
        placement: 'bottom'
      }
      );
    }
  }

  destroyTooltip() {
    if (!this.hasBeenMousedOver) { return; }
    return (this.tooltip != null ? this.tooltip.dispose() : undefined);
  }

  destroy() {
    if (this.subscriptions != null) {
      this.subscriptions.dispose();
    }
    if (this.mouseEnterSubscription != null) {
      this.mouseEnterSubscription.dispose();
    }
    if (this.repoSubscriptions != null) {
      this.repoSubscriptions.dispose();
    }
    this.destroyTooltip();
    return this.element.remove();
  }

  updateDataAttributes() {
    let itemClass;
    if (this.path) {
      this.itemTitle.dataset.name = path.basename(this.path);
      this.itemTitle.dataset.path = this.path;
    } else {
      delete this.itemTitle.dataset.name;
      delete this.itemTitle.dataset.path;
    }

    if ((itemClass = this.item.constructor != null ? this.item.constructor.name : undefined)) {
      return this.element.dataset.type = itemClass;
    } else {
      return delete this.element.dataset.type;
    }
  }

  updateTitle(param) {
    let title;
    if (param == null) { param = {}; }
    let {updateSiblings, useLongTitle} = param;
    if (this.updatingTitle) { return; }
    this.updatingTitle = true;

    if (updateSiblings === false) {
      title = this.item.getTitle();
      if (useLongTitle) { let left;
      title = (left = (typeof this.item.getLongTitle === 'function' ? this.item.getLongTitle() : undefined)) != null ? left : title; }
      this.itemTitle.textContent = title;
    } else {
      title = this.item.getTitle();
      useLongTitle = false;
      for (let tab of this.tabs) {
        if (tab !== this) {
          if (tab.item.getTitle() === title) {
            tab.updateTitle({updateSiblings: false, useLongTitle: true});
            useLongTitle = true;
          }
        }
      }
      if (useLongTitle) { let left1;
      title = (left1 = (typeof this.item.getLongTitle === 'function' ? this.item.getLongTitle() : undefined)) != null ? left1 : title; }

      this.itemTitle.textContent = title;
    }

    return this.updatingTitle = false;
  }

  updateIcon() {
    return getIconServices().updateTabIcon(this);
  }

  isItemPending() {
    if (this.pane.getPendingItem != null) {
      return this.pane.getPendingItem() === this.item;
    } else if (this.item.isPending != null) {
      return this.item.isPending();
    }
  }

  terminatePendingState() {
    if (this.pane.clearPendingItem != null) {
      if (this.pane.getPendingItem() === this.item) { return this.pane.clearPendingItem(); }
    } else if (this.item.terminatePendingState != null) {
      return this.item.terminatePendingState();
    }
  }

  clearPending() {
    this.itemTitle.classList.remove('temp');
    return this.element.classList.remove('pending-tab');
  }

  updateIconVisibility() {
    if (atom.config.get('tabs.showIcons')) {
      return this.itemTitle.classList.remove('hide-icon');
    } else {
      return this.itemTitle.classList.add('hide-icon');
    }
  }

  updateModifiedStatus() {
    if (typeof this.item.isModified === 'function' ? this.item.isModified() : undefined) {
      if (!this.isModified) { this.element.classList.add('modified'); }
      return this.isModified = true;
    } else {
      if (this.isModified) { this.element.classList.remove('modified'); }
      return this.isModified = false;
    }
  }

  setupVcsStatus() {
    if (this.path == null) { return; }
    return this.repoForPath(this.path).then(repo => {
      this.subscribeToRepo(repo);
      return this.updateVcsStatus(repo);
    });
  }

  // Subscribe to the project's repo for changes to the VCS status of the file.
  subscribeToRepo(repo) {
    if (repo == null) { return; }

    // Remove previous repo subscriptions.
    if (this.repoSubscriptions != null) {
      this.repoSubscriptions.dispose();
    }
    this.repoSubscriptions = new CompositeDisposable();

    this.repoSubscriptions.add(repo.onDidChangeStatus(event => {
      if (event.path === this.path) { return this.updateVcsStatus(repo, event.pathStatus); }
    })
    );
    return this.repoSubscriptions.add(repo.onDidChangeStatuses(() => {
      return this.updateVcsStatus(repo);
    })
    );
  }

  repoForPath() {
    for (let dir of atom.project.getDirectories()) {
      if (dir.contains(this.path)) { return atom.project.repositoryForDirectory(dir); }
    }
    return Promise.resolve(null);
  }

  // Update the VCS status property of this tab using the repo.
  updateVcsStatus(repo, status) {
    if (repo == null) { return; }

    let newStatus = null;
    if (repo.isPathIgnored(this.path)) {
      newStatus = 'ignored';
    } else {
      if (status == null) { status = repo.getCachedPathStatus(this.path); }
      if (repo.isStatusModified(status)) {
        newStatus = 'modified';
      } else if (repo.isStatusNew(status)) {
        newStatus = 'added';
      }
    }

    if (newStatus !== this.status) {
      this.status = newStatus;
      return this.updateVcsColoring();
    }
  }

  updateVcsColoring() {
    this.itemTitle.classList.remove('status-ignored', 'status-modified',  'status-added');
    if (this.status && atom.config.get('tabs.enableVcsColoring')) {
      return this.itemTitle.classList.add(`status-${this.status}`);
    }
  }

  unsetVcsStatus() {
    if (this.repoSubscriptions != null) {
      this.repoSubscriptions.dispose();
    }
    delete this.status;
    return this.updateVcsColoring();
  }
}

module.exports = TabView;
