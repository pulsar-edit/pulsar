const path = require('path');
const {Disposable, CompositeDisposable} = require('atom');
const getIconServices = require('./get-icon-services');

const layout = require('./layout');

class TabView {
  isModified = false;
  isDeleted = false;
  isConflicted = false;

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
    this.subscriptions.add(
      // Destroy a tab when its pane item is destroyed.
      this.pane.onDidDestroy(() => this.destroy()),
      // Take a tab out of "pending" state when the same happens for the pane
      // item.
      this.pane.onItemDidTerminatePendingState(item => {
        if (item === this.item) this.clearPending();
      }),
      // Update whether icons are shown when the user changes the associated
      // setting.
      atom.config.observe('tabs.showIcons', () => {
        this.updateIconVisibility();
      }),
      // Update whether VCS status colors are used when the user changes the
      // associated setting.
      atom.config.observe('tabs.enableVcsColoring', isEnabled => {
        if (isEnabled && (this.path != null)) {
          this.setupVcsStatus();
        } else {
          this.unsetVcsStatus();
        }
      }),

      atom.config.observe('tabs.enableItemStatusColoring', this.setBufferStatusColoring.bind(this))
    );

    const titleChangedHandler = () => this.updateTitle();

    // Subscribe to title changes on this pane item.
    if (typeof this.item.onDidChangeTitle === 'function') {
      const onDidChangeTitleDisposable = this.item.onDidChangeTitle(titleChangedHandler);
      this.addItemDisposable(onDidChangeTitleDisposable, 'onDidChangeTitle');
    } else if (typeof this.item.on === 'function') {
      // TODO: Remove once old events are no longer supported.
      this.item.on('title-changed', titleChangedHandler);
      this.subscriptions.add(
        new Disposable(() => {
          this.item.off?.('title-changed', titleChangedHandler)
        })
      );
    }

    const pathChangedHandler = newPath => {
      this.path = newPath;
      this.updateDataAttributes();
      this.updateTitle();
      this.updateTooltip();
      this.updateIcon();
    };

    // Subscribe to path changes on this pane item.
    if (typeof this.item.onDidChangePath === 'function') {
      const onDidChangePathDisposable = this.item.onDidChangePath(pathChangedHandler);
      this.addItemDisposable(onDidChangePathDisposable, 'onDidChangePath');
    } else if (typeof this.item.on === 'function') {
      // TODO: Remove once old events are no longer supported.
      this.item.on('path-changed', pathChangedHandler);
      this.subscriptions.add(
        new Disposable(() => {
          this.item.off?.('path-changed', pathChangedHandler);
        })
      );
    }

    const iconChangedHandler = () => this.updateIcon();
    this.subscriptions.add(
      getIconServices().onDidChange(iconChangedHandler)
    );

    // Subscribe to icon changes on this pane item.
    if (typeof this.item.onDidChangeIcon === 'function') {
      const onDidChangeIconDisposable = this.item.onDidChangeIcon(() => {
        return this.updateIcon();
      });
      if (Disposable.isDisposable(onDidChangeIconDisposable)) {
        this.subscriptions.add(onDidChangeIconDisposable);
      } else {
        console.warn("::onDidChangeIcon does not return a valid Disposable!", this.item);
      }
    } else if (typeof this.item.on === 'function') {
      //TODO Remove once old events are no longer supported
      this.item.on('icon-changed', iconChangedHandler);
      this.subscriptions.add(
        new Disposable(() => {
          this.item.off?.('icon-changed', iconChangedHandler);
        })
      );
    }

    const modifiedHandler = () => this.updateModifiedStatus();

    // Subscribe to changes in "modified" status on this pane item.
    if (typeof this.item.onDidChangeModified === 'function') {
      const onDidChangeModifiedDisposable = this.item.onDidChangeModified(modifiedHandler);
      this.addItemDisposable(onDidChangeModifiedDisposable, 'onDidChangeModified');
    } else if (typeof this.item.on === 'function') {
      // TODO: Remove once old events are no longer supported.
      this.item.on('modified-status-changed', modifiedHandler);
      this.subscriptions.add(
        new Disposable(() => {
          this.item.off?.('modified-status-changed', modifiedHandler)
        })
      );
    }

    // Subscribe to changes in "conflicted" status on this pane item.
    if (typeof this.item.onDidConflict === 'function') {
      const onDidConflictDisposable = this.item.onDidConflict(() => {
        this.updateConflictedStatus();
      });
      this.addItemDisposable(onDidConflictDisposable, 'onDidConflict');
    }

    // Subscribe to changes in "deleted" status on this pane item.
    if (typeof this.item.onDidDelete === 'function') {
      let onDidDeleteDisposable = this.item.onDidDelete(() => {
        this.terminatePendingState();
        this.updateDeletedStatus();
      });
      this.addItemDisposable(onDidDeleteDisposable, 'onDidDelete');
    }

    // Subscribe to "save" events on this pane item, since those correlate with
    // changes in several pane item states.
    if (typeof this.item.onDidSave === 'function') {
      const onDidSaveDisposable = this.item.onDidSave(event => {
        this.terminatePendingState();
        this.updateConflictedStatus();
        this.updateDeletedStatus();
        if (event.path !== this.path) {
          this.path = event.path;
          if (atom.config.get('tabs.enableVcsColoring')) {
            this.setupVcsStatus();
          }
        }
      });
      this.addItemDisposable(onDidSaveDisposable, 'onDidSave');
    }
  }

  setBufferStatusColoring (isEnabled) {
    this.useBufferStatusColoring = isEnabled;
    if (!isEnabled) {
      this.toggleTabClass('conflicted', false);
      this.toggleTabClass('deleted', false);
    } else {
      this.toggleTabClass('conflicted', this.isConflicted);
      this.toggleTabClass('deleted', this.isDeleted);
    }
  }

  addItemDisposable (disposable, methodName) {
    if (!Disposable.isDisposable(disposable)) {
      console.warn(`::${methodName} does not return a valid Disposable!`, this.item);
      return;
    }
    this.subscriptions.add(disposable);
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

    this.mouseEnterSubscription = {
      dispose: () => {
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

  updateConflictedStatus () {
    this.isConflicted = this.item.isInConflict?.() ?? false;
    this.toggleTabClass('conflicted', this.useBufferStatusColoring && this.isConflicted);
    return this.isConflicted;
  }

  updateDeletedStatus () {
    this.isDeleted = this.item.isDeleted?.() ?? false;
    this.toggleTabClass('deleted', this.useBufferStatusColoring && this.isDeleted);
    return this.isDeleted;
  }

  updateModifiedStatus() {
    this.isModified = this.item.isModified?.() ?? false;
    this.toggleTabClass('modified', this.isModified);
    return this.isModified;
  }

  setupVcsStatus() {
    if (this.path == null) { return; }
    return this.repoForPath(this.path).then(repo => {
      this.subscribeToRepo(repo);
      this.updateVcsStatus(repo);
    });
  }

  toggleTabClass (className, condition) {
    if (condition) {
      this.element.classList.add(className);
    } else {
      this.element.classList.remove(className);
    }
  }

  // Subscribe to the project's repo for changes to the VCS status of the file.
  subscribeToRepo(repo) {
    if (repo == null) return;

    // Remove previous repo subscriptions.
    this.repoSubscriptions?.dispose();
    this.repoSubscriptions = new CompositeDisposable();

    this.repoSubscriptions.add(
      repo.onDidChangeStatus(event => {
        if (event.path === this.path) {
          return this.updateVcsStatus(repo, event.pathStatus);
        }
      }),

      repo.onDidChangeStatuses(() => {
        return this.updateVcsStatus(repo);
      })
    );
  }

  repoForPath() {
    for (let dir of atom.project.getDirectories()) {
      if (dir.contains(this.path)) {
        return atom.project.repositoryForDirectory(dir);
      }
    }
    return Promise.resolve(null);
  }

  // Update the VCS status property of this tab using the repo.
  updateVcsStatus(repo, status) {
    if (repo == null) return;

    let newStatus = null;
    if (repo.isPathIgnored(this.path)) {
      newStatus = 'ignored';
    } else {
      status ??= repo.getCachedPathStatus(this.path);
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
      this.itemTitle.classList.add(`status-${this.status}`);
    }
  }

  unsetVcsStatus() {
    if (this.repoSubscriptions != null) {
      this.repoSubscriptions.dispose();
    }
    delete this.status;
    this.updateVcsColoring();
  }
}

module.exports = TabView;
