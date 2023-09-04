/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
let TreeView;
const path = require('path');
const {shell} = require('electron');

const _ = require('underscore-plus');
const {BufferedProcess, CompositeDisposable, Emitter} = require('atom');
const {repoForPath, getStyleObject, getFullExtension} = require("./helpers");
const fs = require('fs-plus');

const AddDialog = require('./add-dialog');
const MoveDialog = require('./move-dialog');
const CopyDialog = require('./copy-dialog');
let IgnoredNames = null; // Defer requiring until actually needed

const AddProjectsView = require('./add-projects-view');

const Directory = require('./directory');
const DirectoryView = require('./directory-view');
const RootDragAndDrop = require('./root-drag-and-drop');

const TREE_VIEW_URI = 'atom://tree-view';

const toggleConfig = keyPath => atom.config.set(keyPath, !atom.config.get(keyPath));

let nextId = 1;

module.exports =
(TreeView = class TreeView {
  constructor(state) {
    this.moveConflictingEntry = this.moveConflictingEntry.bind(this);
    this.onStylesheetsChanged = this.onStylesheetsChanged.bind(this);
    this.onDragEnter = this.onDragEnter.bind(this);
    this.onDragLeave = this.onDragLeave.bind(this);
    this.id = nextId++;
    this.element = document.createElement('div');
    this.element.classList.add('tool-panel', 'tree-view');
    this.element.tabIndex = -1;

    this.list = document.createElement('ol');
    this.list.classList.add('tree-view-root', 'full-menu', 'list-tree', 'has-collapsable-children', 'focusable-panel');

    this.disposables = new CompositeDisposable;
    this.emitter = new Emitter;
    this.roots = [];
    this.selectedPath = null;
    this.selectOnMouseUp = null;
    this.lastFocusedEntry = null;
    this.ignoredPatterns = [];
    this.useSyncFS = false;
    this.currentlyOpening = new Map;
    this.editorsToMove = [];
    this.editorsToDestroy = [];

    this.dragEventCounts = new WeakMap;
    this.rootDragAndDrop = new RootDragAndDrop(this);

    this.handleEvents();

    process.nextTick(() => {
      this.onStylesheetsChanged();
      const onStylesheetsChanged = _.debounce(this.onStylesheetsChanged, 100);
      this.disposables.add(atom.styles.onDidAddStyleElement(onStylesheetsChanged));
      this.disposables.add(atom.styles.onDidRemoveStyleElement(onStylesheetsChanged));
      return this.disposables.add(atom.styles.onDidUpdateStyleElement(onStylesheetsChanged));
    });

    this.updateRoots(state.directoryExpansionStates);

    if (state.selectedPaths?.length > 0) {
      for (let selectedPath of Array.from(state.selectedPaths)) { this.selectMultipleEntries(this.entryForPath(selectedPath)); }
    } else {
      this.selectEntry(this.roots[0]);
    }

    if ((state.scrollTop != null) || (state.scrollLeft != null)) {
      var observer = new IntersectionObserver(() => {
        if (this.isVisible()) {
          this.element.scrollTop = state.scrollTop;
          this.element.scrollLeft = state.scrollLeft;
          return observer.disconnect();
        }
      });
      observer.observe(this.element);
    }

    if (state.width > 0) { this.element.style.width = `${state.width}px`; }

    this.disposables.add(this.onWillMoveEntry(({initialPath, newPath}) => {
      const editors = atom.workspace.getTextEditors();
      if (fs.isDirectorySync(initialPath)) {
        initialPath += path.sep; // Avoid moving lib2's editors when lib was moved
        return (() => {
          const result = [];
          for (let editor of Array.from(editors)) {
            const filePath = editor.getPath();
            if (filePath?.startsWith(initialPath)) {
              result.push(this.editorsToMove.push(filePath));
            } else {
              result.push(undefined);
            }
          }
          return result;
        })();
      } else {
        return (() => {
          const result1 = [];
          for (let editor of Array.from(editors)) {
            const filePath = editor.getPath();
            if (filePath === initialPath) {
              result1.push(this.editorsToMove.push(filePath));
            } else {
              result1.push(undefined);
            }
          }
          return result1;
        })();
      }
    })
    );

    this.disposables.add(this.onEntryMoved(({initialPath, newPath}) => {
      return (() => {
        const result = [];
        for (let editor of Array.from(atom.workspace.getTextEditors())) {
          const filePath = editor.getPath();
          const index = this.editorsToMove.indexOf(filePath);
          if (index !== -1) {
            editor.getBuffer().setPath(filePath.replace(initialPath, newPath));
            result.push(this.editorsToMove.splice(index, 1));
          } else {
            result.push(undefined);
          }
        }
        return result;
      })();
    })
    );

    this.disposables.add(this.onMoveEntryFailed(({initialPath, newPath}) => {
      const index = this.editorsToMove.indexOf(initialPath);
      if (index !== -1) { return this.editorsToMove.splice(index, 1); }
    })
    );

    this.disposables.add(this.onWillDeleteEntry(({pathToDelete}) => {
      const editors = atom.workspace.getTextEditors();
      if (fs.isDirectorySync(pathToDelete)) {
        pathToDelete += path.sep; // Avoid destroying lib2's editors when lib was deleted
        return (() => {
          const result = [];
          for (let editor of Array.from(editors)) {
            const filePath = editor.getPath();
            if (filePath?.startsWith(pathToDelete) && !editor.isModified()) {
              result.push(this.editorsToDestroy.push(filePath));
            } else {
              result.push(undefined);
            }
          }
          return result;
        })();
      } else {
        return (() => {
          const result1 = [];
          for (let editor of Array.from(editors)) {
            const filePath = editor.getPath();
            if ((filePath === pathToDelete) && !editor.isModified()) {
              result1.push(this.editorsToDestroy.push(filePath));
            } else {
              result1.push(undefined);
            }
          }
          return result1;
        })();
      }
    })
    );

    this.disposables.add(this.onEntryDeleted(({pathToDelete}) => {
      return (() => {
        const result = [];
        for (let editor of Array.from(atom.workspace.getTextEditors())) {
          const index = this.editorsToDestroy.indexOf(editor.getPath());
          if (index !== -1) {
            editor.destroy();
            result.push(this.editorsToDestroy.splice(index, 1));
          } else {
            result.push(undefined);
          }
        }
        return result;
      })();
    })
    );

    this.disposables.add(this.onDeleteEntryFailed(({pathToDelete}) => {
      const index = this.editorsToDestroy.indexOf(pathToDelete);
      if (index !== -1) { return this.editorsToDestroy.splice(index, 1); }
    })
    );
  }

  serialize() {
    return {
      directoryExpansionStates: new (function(roots) {
        for (let root of Array.from(roots)) { this[root.directory.path] = root.directory.serializeExpansionState(); }
        return this;})(this.roots),
      deserializer: 'TreeView',
      selectedPaths: Array.from(this.getSelectedEntries(), entry => entry.getPath()),
      scrollLeft: this.element.scrollLeft,
      scrollTop: this.element.scrollTop,
      width: parseInt(this.element.style.width || 0)
    };
  }

  destroy() {
    for (let root of Array.from(this.roots)) { root.directory.destroy(); }
    this.disposables.dispose();
    this.rootDragAndDrop.dispose();
    return this.emitter.emit('did-destroy');
  }

  onDidDestroy(callback) {
    return this.emitter.on('did-destroy', callback);
  }

  getTitle() { return "Project"; }

  getURI() { return TREE_VIEW_URI; }

  getPreferredLocation() {
    if (atom.config.get('tree-view.showOnRightSide')) {
      return 'right';
    } else {
      return 'left';
    }
  }

  getAllowedLocations() { return ["left", "right"]; }

  isPermanentDockItem() { return true; }

  getPreferredWidth() {
    this.list.style.width = 'min-content';
    const result = this.list.offsetWidth;
    this.list.style.width = '';
    return result;
  }

  onDirectoryCreated(callback) {
    return this.emitter.on('directory-created', callback);
  }

  onEntryCopied(callback) {
    return this.emitter.on('entry-copied', callback);
  }

  onWillDeleteEntry(callback) {
    return this.emitter.on('will-delete-entry', callback);
  }

  onEntryDeleted(callback) {
    return this.emitter.on('entry-deleted', callback);
  }

  onDeleteEntryFailed(callback) {
    return this.emitter.on('delete-entry-failed', callback);
  }

  onWillMoveEntry(callback) {
    return this.emitter.on('will-move-entry', callback);
  }

  onEntryMoved(callback) {
    return this.emitter.on('entry-moved', callback);
  }

  onMoveEntryFailed(callback) {
    return this.emitter.on('move-entry-failed', callback);
  }

  onFileCreated(callback) {
    return this.emitter.on('file-created', callback);
  }

  handleEvents() {
    this.element.addEventListener('click', e => {
      // This prevents accidental collapsing when a .entries element is the event target
      if (e.target.classList.contains('entries')) { return; }

      if (!e.shiftKey && !e.metaKey && !e.ctrlKey) { return this.entryClicked(e); }
    });
    this.element.addEventListener('mousedown', e => this.onMouseDown(e));
    this.element.addEventListener('mouseup', e => this.onMouseUp(e));
    this.element.addEventListener('dragstart', e => this.onDragStart(e));
    this.element.addEventListener('dragenter', e => this.onDragEnter(e));
    this.element.addEventListener('dragleave', e => this.onDragLeave(e));
    this.element.addEventListener('dragover', e => this.onDragOver(e));
    this.element.addEventListener('drop', e => this.onDrop(e));

    atom.commands.add(this.element, {
     'core:move-up': e => this.moveUp(e),
     'core:move-down': e => this.moveDown(e),
     'core:page-up': () => this.pageUp(),
     'core:page-down': () => this.pageDown(),
     'core:move-to-top': () => this.scrollToTop(),
     'core:move-to-bottom': () => this.scrollToBottom(),
     'tree-view:expand-item': () => this.openSelectedEntry({pending: true}, true),
     'tree-view:recursive-expand-directory': () => this.expandDirectory(true),
     'tree-view:collapse-directory': () => this.collapseDirectory(),
     'tree-view:recursive-collapse-directory': () => this.collapseDirectory(true),
     'tree-view:collapse-all': () => this.collapseDirectory(true, true),
     'tree-view:open-selected-entry': () => this.openSelectedEntry(),
     'tree-view:open-selected-entry-right': () => this.openSelectedEntryRight(),
     'tree-view:open-selected-entry-left': () => this.openSelectedEntryLeft(),
     'tree-view:open-selected-entry-up': () => this.openSelectedEntryUp(),
     'tree-view:open-selected-entry-down': () => this.openSelectedEntryDown(),
     'tree-view:move': () => this.moveSelectedEntry(),
     'tree-view:copy': () => this.copySelectedEntries(),
     'tree-view:cut': () => this.cutSelectedEntries(),
     'tree-view:paste': () => this.pasteEntries(),
     'tree-view:copy-full-path': () => this.copySelectedEntryPath(false),
     'tree-view:show-in-file-manager': () => this.showSelectedEntryInFileManager(),
     'tree-view:open-in-new-window': () => this.openSelectedEntryInNewWindow(),
     'tree-view:copy-project-path': () => this.copySelectedEntryPath(true),
     'tree-view:unfocus': () => this.unfocus(),
     'tree-view:toggle-vcs-ignored-files'() { return toggleConfig('tree-view.hideVcsIgnoredFiles'); },
     'tree-view:toggle-ignored-names'() { return toggleConfig('tree-view.hideIgnoredNames'); },
     'tree-view:remove-project-folder': e => this.removeProjectFolder(e)
   }
    );

    [0, 1, 2, 3, 4, 5, 6, 7, 8].forEach(index => {
      return atom.commands.add(this.element, `tree-view:open-selected-entry-in-pane-${index + 1}`, () => {
        return this.openSelectedEntryInPane(index);
      });
    });

    this.disposables.add(atom.workspace.getCenter().onDidChangeActivePaneItem(() => {
      this.selectActiveFile();
      if (atom.config.get('tree-view.autoReveal')) { return this.revealActiveFile({show: false, focus: false}); }
    })
    );
    this.disposables.add(atom.project.onDidChangePaths(() => {
      return this.updateRoots();
    })
    );
    this.disposables.add(atom.config.onDidChange('tree-view.hideVcsIgnoredFiles', () => {
      return this.updateRoots();
    })
    );
    this.disposables.add(atom.config.onDidChange('tree-view.hideIgnoredNames', () => {
      return this.updateRoots();
    })
    );
    this.disposables.add(atom.config.onDidChange('core.ignoredNames', () => {
      if (atom.config.get('tree-view.hideIgnoredNames')) { return this.updateRoots(); }
    })
    );
    this.disposables.add(atom.config.onDidChange('tree-view.sortFoldersBeforeFiles', () => {
      return this.updateRoots();
    })
    );
    return this.disposables.add(atom.config.onDidChange('tree-view.squashDirectoryNames', () => {
      return this.updateRoots();
    })
    );
  }

  toggle() {
    return atom.workspace.toggle(this);
  }

  show(focus) {
    return atom.workspace.open(this, {
      searchAllPanes: true,
      activatePane: false,
      activateItem: false,
    }).then(() => {
      atom.workspace.paneContainerForURI(this.getURI()).show();
      if (focus) { return this.focus(); }
    });
  }

  hide() {
    return atom.workspace.hide(this);
  }

  focus() {
    return this.element.focus();
  }

  unfocus() {
    return atom.workspace.getCenter().activate();
  }

  hasFocus() {
    return document.activeElement === this.element;
  }

  toggleFocus() {
    if (this.hasFocus()) {
      return this.unfocus();
    } else {
      return this.show(true);
    }
  }

  entryClicked(e) {
    let entry;
    if (entry = e.target.closest('.entry')) {
      const isRecursive = e.altKey || false;
      this.selectEntry(entry);
      if (entry.classList.contains('directory')) {
        return entry.toggleExpansion(isRecursive);
      } else if (entry.classList.contains('file')) {
        return this.fileViewEntryClicked(e);
      }
    }
  }

  fileViewEntryClicked(e) {
    const filePath = e.target.closest('.entry').getPath();
    const detail = e.detail != null ? e.detail : 1;
    const alwaysOpenExisting = atom.config.get('tree-view.alwaysOpenExisting');
    if (detail === 1) {
      if (atom.config.get('core.allowPendingPaneItems')) {
        const openPromise = atom.workspace.open(filePath, {pending: true, activatePane: false, searchAllPanes: alwaysOpenExisting});
        this.currentlyOpening.set(filePath, openPromise);
        return openPromise.then(() => this.currentlyOpening.delete(filePath));
      }
    } else if (detail === 2) {
      return this.openAfterPromise(filePath, {searchAllPanes: alwaysOpenExisting});
    }
  }

  openAfterPromise(uri, options) {
    let promise;
    if ((promise = this.currentlyOpening.get(uri))) {
      return promise.then(() => atom.workspace.open(uri, options));
    } else {
      return atom.workspace.open(uri, options);
    }
  }

  updateRoots(expansionStates) {
    let root;
    if (expansionStates == null) { expansionStates = {}; }
    const selectedPaths = this.selectedPaths();

    const oldExpansionStates = {};
    for (root of Array.from(this.roots)) {
      oldExpansionStates[root.directory.path] = root.directory.serializeExpansionState();
      root.directory.destroy();
      root.remove();
    }

    this.roots = [];

    const projectPaths = atom.project.getPaths();
    if (projectPaths.length > 0) {
      if (!this.element.querySelector('tree-view-root')) { this.element.appendChild(this.list); }

      const addProjectsViewElement = this.element.querySelector('#add-projects-view');
      if (addProjectsViewElement) { this.element.removeChild(addProjectsViewElement); }

      if (IgnoredNames == null) { IgnoredNames = require('./ignored-names'); }

      this.roots = (() => {
        const result = [];
        for (let projectPath of Array.from(projectPaths)) {
          var left;
          let stats = fs.lstatSyncNoException(projectPath);
          if (!stats) { continue; }
          stats = _.pick(stats, ..._.keys(stats));
          for (let key of ["atime", "birthtime", "ctime", "mtime"]) {
            stats[key] = stats[key].getTime();
          }

          const directory = new Directory({
            name: path.basename(projectPath),
            fullPath: projectPath,
            symlink: false,
            isRoot: true,
            expansionState: (left = expansionStates[projectPath] != null ? expansionStates[projectPath] : oldExpansionStates[projectPath]) != null ? left : {isExpanded: true},
            ignoredNames: new IgnoredNames(),
            useSyncFS: this.useSyncFS,
            stats
          });
          root = new DirectoryView(directory).element;
          this.list.appendChild(root);
          result.push(root);
        }
        return result;
      })();

      // The DOM has been recreated; reselect everything
      return Array.from(selectedPaths).map((selectedPath) => this.selectMultipleEntries(this.entryForPath(selectedPath)));
    } else {
      if (this.element.querySelector('.tree-view-root')) { this.element.removeChild(this.list); }
      if (!this.element.querySelector('#add-projects-view')) { return this.element.appendChild(new AddProjectsView().element); }
    }
  }

  getActivePath() { return atom.workspace.getCenter().getActivePaneItem()?.getPath?.(); }

  selectActiveFile() {
    const activeFilePath = this.getActivePath();
    if (this.entryForPath(activeFilePath)) {
      return this.selectEntryForPath(activeFilePath);
    } else {
      // If the active file is not part of the project, deselect all entries
      return this.deselect();
    }
  }

  revealActiveFile(options) {
    if (options == null) { options = {}; }
    if (!atom.project.getPaths().length) { return Promise.resolve(); }

    let {show, focus} = options;

    if (focus == null) { focus = atom.config.get('tree-view.focusOnReveal'); }
    const promise = show || focus ? this.show(focus) : Promise.resolve();
    return promise.then(() => {
      let activeFilePath;
      if (!(activeFilePath = this.getActivePath())) { return; }

      const [rootPath, relativePath] = atom.project.relativizePath(activeFilePath);
      if (rootPath == null) { return; }

      const activePathComponents = relativePath.split(path.sep);
      // Add the root folder to the path components
      activePathComponents.unshift(rootPath.substr(rootPath.lastIndexOf(path.sep) + 1));
      // And remove it from the current path
      let currentPath = rootPath.substr(0, rootPath.lastIndexOf(path.sep));
      return (() => {
        const result = [];
        for (let pathComponent of Array.from(activePathComponents)) {
          currentPath += path.sep + pathComponent;
          const entry = this.entryForPath(currentPath);
          if (entry.classList.contains('directory')) {
            result.push(entry.expand());
          } else {
            this.selectEntry(entry);
            result.push(this.scrollToEntry(entry));
          }
        }
        return result;
      })();
    });
  }

  copySelectedEntryPath(relativePath) {
    let pathToCopy;
    if (relativePath == null) { relativePath = false; }
    if (pathToCopy = this.selectedPath) {
      if (relativePath) { pathToCopy = atom.project.relativize(pathToCopy); }
      return atom.clipboard.write(pathToCopy);
    }
  }

  entryForPath(entryPath) {
    let bestMatchEntry = null;
    let bestMatchLength = 0;

    for (let entry of Array.from(this.list.querySelectorAll('.entry'))) {
      if (entry.isPathEqual(entryPath)) {
        return entry;
      }

      const entryLength = entry.getPath().length;
      if (entry.directory?.contains(entryPath) && (entryLength > bestMatchLength)) {
        bestMatchEntry = entry;
        bestMatchLength = entryLength;
      }
    }

    return bestMatchEntry;
  }

  selectEntryForPath(entryPath) {
    return this.selectEntry(this.entryForPath(entryPath));
  }

  moveDown(event) {
    event?.stopImmediatePropagation();
    const selectedEntry = this.selectedEntry();
    if (selectedEntry != null) {
      let nextEntry;
      if (selectedEntry.classList.contains('directory')) {
        if (this.selectEntry(selectedEntry.entries.children[0])) {
          this.scrollToEntry(this.selectedEntry(), false);
          return;
        }
      }

      if (nextEntry = this.nextEntry(selectedEntry)) {
        this.selectEntry(nextEntry);
      }
    } else {
      this.selectEntry(this.roots[0]);
    }

    return this.scrollToEntry(this.selectedEntry(), false);
  }

  moveUp(event) {
    event.stopImmediatePropagation();
    const selectedEntry = this.selectedEntry();
    if (selectedEntry != null) {
      let previousEntry;
      if ((previousEntry = this.previousEntry(selectedEntry))) {
        this.selectEntry(previousEntry);
      } else {
        this.selectEntry(selectedEntry.parentElement.closest('.directory'));
      }
    } else {
      const entries = this.list.querySelectorAll('.entry');
      this.selectEntry(entries[entries.length - 1]);
    }

    return this.scrollToEntry(this.selectedEntry(), false);
  }

  nextEntry(entry) {
    let currentEntry = entry;
    while (currentEntry != null) {
      if (currentEntry.nextSibling != null) {
        currentEntry = currentEntry.nextSibling;
        if (currentEntry.matches('.entry')) {
          return currentEntry;
        }
      } else {
        currentEntry = currentEntry.parentElement.closest('.directory');
      }
    }

    return null;
  }

  previousEntry(entry) {
    let previousEntry = entry.previousSibling;
    while ((previousEntry != null) && !previousEntry.matches('.entry')) {
      previousEntry = previousEntry.previousSibling;
    }

    if (previousEntry == null) { return null; }

    // If the previous entry is an expanded directory,
    // we need to select the last entry in that directory,
    // not the directory itself
    if (previousEntry.matches('.directory.expanded')) {
      const entries = previousEntry.querySelectorAll('.entry');
      if (entries.length > 0) { return entries[entries.length - 1]; }
    }

    return previousEntry;
  }

  expandDirectory(isRecursive) {
    if (isRecursive == null) { isRecursive = false; }
    const selectedEntry = this.selectedEntry();
    if (selectedEntry == null) { return; }

    const directory = selectedEntry.closest('.directory');
    if ((isRecursive === false) && directory.isExpanded) {
      // Select the first entry in the expanded folder if it exists
      if (directory.directory.getEntries().length > 0) { return this.moveDown(); }
    } else {
      return directory.expand(isRecursive);
    }
  }

  collapseDirectory(isRecursive, allDirectories) {
    let directory;
    if (isRecursive == null) { isRecursive = false; }
    if (allDirectories == null) { allDirectories = false; }
    if (allDirectories) {
      for (let root of Array.from(this.roots)) { root.collapse(true); }
      return;
    }

    const selectedEntry = this.selectedEntry();
    if (selectedEntry == null) { return; }

    if (directory = selectedEntry.closest('.expanded.directory')) {
      directory.collapse(isRecursive);
      return this.selectEntry(directory);
    }
  }

  openSelectedEntry(options, expandDirectory) {
    if (options == null) { options = {}; }
    if (expandDirectory == null) { expandDirectory = false; }
    const selectedEntry = this.selectedEntry();
    if (selectedEntry == null) { return; }

    if (selectedEntry.classList.contains('directory')) {
      if (expandDirectory) {
        return this.expandDirectory(false);
      } else {
        return selectedEntry.toggleExpansion();
      }
    } else if (selectedEntry.classList.contains('file')) {
      if (atom.config.get('tree-view.alwaysOpenExisting')) {
        options = Object.assign({searchAllPanes: true}, options);
      }
      return this.openAfterPromise(selectedEntry.getPath(), options);
    }
  }

  openSelectedEntrySplit(orientation, side) {
    const selectedEntry = this.selectedEntry();
    if (selectedEntry == null) { return; }

    const pane = atom.workspace.getCenter().getActivePane();
    if (pane && selectedEntry.classList.contains('file')) {
      if (atom.workspace.getCenter().getActivePaneItem()) {
        const split = pane.split(orientation, side);
        return atom.workspace.openURIInPane(selectedEntry.getPath(), split);
      } else {
        return this.openSelectedEntry(true);
      }
    }
  }

  openSelectedEntryRight() {
    return this.openSelectedEntrySplit('horizontal', 'after');
  }

  openSelectedEntryLeft() {
    return this.openSelectedEntrySplit('horizontal', 'before');
  }

  openSelectedEntryUp() {
    return this.openSelectedEntrySplit('vertical', 'before');
  }

  openSelectedEntryDown() {
    return this.openSelectedEntrySplit('vertical', 'after');
  }

  openSelectedEntryInPane(index) {
    const selectedEntry = this.selectedEntry();
    if (selectedEntry == null) { return; }

    const pane = atom.workspace.getCenter().getPanes()[index];
    if (pane && selectedEntry.classList.contains('file')) {
      return atom.workspace.openURIInPane(selectedEntry.getPath(), pane);
    }
  }

  moveSelectedEntry() {
    let oldPath;
    if (this.hasFocus()) {
      const entry = this.selectedEntry();
      if ((entry == null) || Array.from(this.roots).includes(entry)) { return; }
      oldPath = entry.getPath();
    } else {
      oldPath = this.getActivePath();
    }

    if (oldPath) {
      const dialog = new MoveDialog(oldPath, {
        willMove: ({initialPath, newPath}) => {
          return this.emitter.emit('will-move-entry', {initialPath, newPath});
        },
        onMove: ({initialPath, newPath}) => {
          return this.emitter.emit('entry-moved', {initialPath, newPath});
        },
        onMoveFailed: ({initialPath, newPath}) => {
          return this.emitter.emit('move-entry-failed', {initialPath, newPath});
        }
      });
      return dialog.attach();
    }
  }

  showSelectedEntryInFileManager() {
    let filePath;
    if (!(filePath = this.selectedEntry()?.getPath())) { return; }

    if (!fs.existsSync(filePath)) {
      return atom.notifications.addWarning(`Unable to show ${filePath} in ${this.getFileManagerName()}`);
    }

    return shell.showItemInFolder(filePath);
  }

  showCurrentFileInFileManager() {
    let filePath;
    if (!(filePath = atom.workspace.getCenter().getActiveTextEditor()?.getPath())) { return; }

    if (!fs.existsSync(filePath)) {
      return atom.notifications.addWarning(`Unable to show ${filePath} in ${this.getFileManagerName()}`);
    }

    return shell.showItemInFolder(filePath);
  }

  getFileManagerName() {
    switch (process.platform) {
      case 'darwin':
        return 'Finder';
      case 'win32':
        return 'Explorer';
      default:
        return 'File Manager';
    }
  }

  openSelectedEntryInNewWindow() {
    let pathToOpen;
    if (pathToOpen = this.selectedEntry()?.getPath()) {
      return atom.open({pathsToOpen: [pathToOpen], newWindow: true});
    }
  }

  copySelectedEntry() {
    let oldPath;
    if (this.hasFocus()) {
      const entry = this.selectedEntry();
      if (Array.from(this.roots).includes(entry)) { return; }
      oldPath = entry?.getPath();
    } else {
      oldPath = this.getActivePath();
    }
    if (!oldPath) { return; }

    const dialog = new CopyDialog(oldPath, {
      onCopy: ({initialPath, newPath}) => {
        return this.emitter.emit('entry-copied', {initialPath, newPath});
      }
    });
    return dialog.attach();
  }

  removeSelectedEntries() {
    let activePath, selectedEntries, selectedPaths;
    if (this.hasFocus()) {
      selectedPaths = this.selectedPaths();
      selectedEntries = this.getSelectedEntries();
    } else if (activePath = this.getActivePath()) {
      selectedPaths = [activePath];
      selectedEntries = [this.entryForPath(activePath)];
    }

    if (!(selectedPaths?.length > 0)) { return; }

    for (let root of Array.from(this.roots)) {
      var needle;
      if ((needle = root.getPath(), Array.from(selectedPaths).includes(needle))) {
        atom.confirm({
          message: `The root directory '${root.directory.name}' can't be removed.`,
          buttons: ['OK']
        }, function() {} // noop
        );
        return;
      }
    }

    return atom.confirm({
      message: `Are you sure you want to delete the selected ${selectedPaths.length > 1 ? 'items' : 'item'}?`,
      detailedMessage: `You are deleting:\n${selectedPaths.join('\n')}`,
      buttons: ['Move to Trash', 'Cancel']
    }, response => {
      if (response === 0) { // Move to Trash
        let firstSelectedEntry;
        const failedDeletions = [];
        for (let selectedPath of Array.from(selectedPaths)) {
          // Don't delete entries which no longer exist. This can happen, for example, when:
          // * The entry is deleted outside of Atom before "Move to Trash" is selected
          // * A folder and one of its children are both selected for deletion,
          //   but the parent folder is deleted first
          var repo;
          if (!fs.existsSync(selectedPath)) { continue; }

          this.emitter.emit('will-delete-entry', {pathToDelete: selectedPath});
          if (shell.moveItemToTrash(selectedPath)) {
            this.emitter.emit('entry-deleted', {pathToDelete: selectedPath});
          } else {
            this.emitter.emit('delete-entry-failed', {pathToDelete: selectedPath});
            failedDeletions.push(selectedPath);
          }

          if (repo = repoForPath(selectedPath)) {
            repo.getPathStatus(selectedPath);
          }
        }

        if (failedDeletions.length > 0) {
          atom.notifications.addError(this.formatTrashFailureMessage(failedDeletions), {
            description: this.formatTrashEnabledMessage(),
            detail: `${failedDeletions.join('\n')}`,
            dismissable: true
          }
          );
        }

        // Focus the first parent folder
        if (firstSelectedEntry = selectedEntries[0]) {
          this.selectEntry(firstSelectedEntry.closest('.directory:not(.selected)'));
        }
        if (atom.config.get('tree-view.squashDirectoryNames')) { return this.updateRoots(); }
      }
    });
  }

  formatTrashFailureMessage(failedDeletions) {
    const fileText = failedDeletions.length > 1 ? 'files' : 'file';

    return `The following ${fileText} couldn't be moved to the trash.`;
  }

  formatTrashEnabledMessage() {
    switch (process.platform) {
      case 'linux': return 'Is `gvfs-trash` installed?';
      case 'darwin': return 'Is Trash enabled on the volume where the files are stored?';
      case 'win32': return 'Is there a Recycle Bin on the drive where the files are stored?';
    }
  }

  // Public: Copy the path of the selected entry element.
  //         Save the path in localStorage, so that copying from 2 different
  //         instances of atom works as intended
  //
  //
  // Returns `copyPath`.
  copySelectedEntries() {
    const selectedPaths = this.selectedPaths();
    if (!selectedPaths || !(selectedPaths.length > 0)) { return; }
    // save to localStorage so we can paste across multiple open apps
    window.localStorage.removeItem('tree-view:cutPath');
    return window.localStorage['tree-view:copyPath'] = JSON.stringify(selectedPaths);
  }

  // Public: Cut the path of the selected entry element.
  //         Save the path in localStorage, so that cutting from 2 different
  //         instances of atom works as intended
  //
  //
  // Returns `cutPath`
  cutSelectedEntries() {
    const selectedPaths = this.selectedPaths();
    if (!selectedPaths || !(selectedPaths.length > 0)) { return; }
    // save to localStorage so we can paste across multiple open apps
    window.localStorage.removeItem('tree-view:copyPath');
    return window.localStorage['tree-view:cutPath'] = JSON.stringify(selectedPaths);
  }

  // Public: Paste a copied or cut item.
  //         If a file is selected, the file's parent directory is used as the
  //         paste destination.
  pasteEntries() {
    const selectedEntry = this.selectedEntry();
    if (!selectedEntry) { return; }

    const cutPaths = window.localStorage['tree-view:cutPath'] ? JSON.parse(window.localStorage['tree-view:cutPath']) : null;
    const copiedPaths = window.localStorage['tree-view:copyPath'] ? JSON.parse(window.localStorage['tree-view:copyPath']) : null;
    const initialPaths = copiedPaths || cutPaths;
    if (!initialPaths?.length) { return; }

    let newDirectoryPath = selectedEntry.getPath();
    if (selectedEntry.classList.contains('file')) { newDirectoryPath = path.dirname(newDirectoryPath); }

    return (() => {
      const result = [];
      for (let initialPath of Array.from(initialPaths)) {
        if (fs.existsSync(initialPath)) {
          if (copiedPaths) {
            result.push(this.copyEntry(initialPath, newDirectoryPath));
          } else if (cutPaths) {
            if (!this.moveEntry(initialPath, newDirectoryPath)) { break; } else {
              result.push(undefined);
            }
          } else {
            result.push(undefined);
          }
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }

  add(isCreatingFile) {
    let left, left1;
    const selectedEntry = (left = this.selectedEntry()) != null ? left : this.roots[0];
    const selectedPath = (left1 = selectedEntry?.getPath()) != null ? left1 : '';

    const dialog = new AddDialog(selectedPath, isCreatingFile);
    dialog.onDidCreateDirectory(createdPath => {
      this.entryForPath(createdPath)?.reload();
      this.selectEntryForPath(createdPath);
      if (atom.config.get('tree-view.squashDirectoryNames')) { this.updateRoots(); }
      return this.emitter.emit('directory-created', {path: createdPath});
  });
    dialog.onDidCreateFile(createdPath => {
      this.entryForPath(createdPath)?.reload();
      atom.workspace.open(createdPath);
      if (atom.config.get('tree-view.squashDirectoryNames')) { this.updateRoots(); }
      return this.emitter.emit('file-created', {path: createdPath});
  });
    return dialog.attach();
  }

  removeProjectFolder(e) {
    // Remove the targeted project folder (generally this only happens through the context menu)
    let pathToRemove = e.target.closest(".project-root > .header")?.querySelector(".name")?.dataset.path;
    // If an entry is selected, remove that entry's project folder
    if (pathToRemove == null) { pathToRemove = this.selectedEntry()?.closest(".project-root")?.querySelector(".header")?.querySelector(".name")?.dataset.path; }
    // Finally, if only one project folder exists and nothing is selected, remove that folder
    if (this.roots.length === 1) { if (pathToRemove == null) { pathToRemove = this.roots[0].querySelector(".header")?.querySelector(".name")?.dataset.path; } }
    if (pathToRemove != null) { return atom.project.removePath(pathToRemove); }
  }

  selectedEntry() {
    return this.list.querySelector('.selected');
  }

  selectEntry(entry) {
    if (entry == null) { return; }

    this.selectedPath = entry.getPath();
    this.lastFocusedEntry = entry;

    const selectedEntries = this.getSelectedEntries();
    if ((selectedEntries.length > 1) || (selectedEntries[0] !== entry)) {
      this.deselect(selectedEntries);
      entry.classList.add('selected');
    }
    return entry;
  }

  getSelectedEntries() {
    return this.list.querySelectorAll('.selected');
  }

  deselect(elementsToDeselect) {
    if (elementsToDeselect == null) { elementsToDeselect = this.getSelectedEntries(); }
    for (let selected of Array.from(elementsToDeselect)) { selected.classList.remove('selected'); }
    return undefined;
  }

  scrollTop(top) {
    if (top != null) {
      return this.element.scrollTop = top;
    } else {
      return this.element.scrollTop;
    }
  }

  scrollBottom(bottom) {
    if (bottom != null) {
      return this.element.scrollTop = bottom - this.element.offsetHeight;
    } else {
      return this.element.scrollTop + this.element.offsetHeight;
    }
  }

  scrollToEntry(entry, center) {
    if (center == null) { center = true; }
    const element = entry?.classList.contains('directory') ? entry.header : entry;
    return element?.scrollIntoViewIfNeeded(center);
  }

  scrollToBottom() {
    let lastEntry;
    if (lastEntry = _.last(this.list.querySelectorAll('.entry'))) {
      this.selectEntry(lastEntry);
      return this.scrollToEntry(lastEntry);
    }
  }

  scrollToTop() {
    if (this.roots[0] != null) { this.selectEntry(this.roots[0]); }
    return this.element.scrollTop = 0;
  }

  pageUp() {
    return this.element.scrollTop -= this.element.offsetHeight;
  }

  pageDown() {
    return this.element.scrollTop += this.element.offsetHeight;
  }

  // Copies an entry from `initialPath` to `newDirectoryPath`
  // If the entry already exists in `newDirectoryPath`, a number is appended to the basename
  copyEntry(initialPath, newDirectoryPath) {
    const initialPathIsDirectory = fs.isDirectorySync(initialPath);

    // Do not allow copying test/a/ into test/a/b/
    // Note: A trailing path.sep is added to prevent false positives, such as test/a -> test/ab
    const realNewDirectoryPath = fs.realpathSync(newDirectoryPath) + path.sep;
    const realInitialPath = fs.realpathSync(initialPath) + path.sep;
    if (initialPathIsDirectory && realNewDirectoryPath.startsWith(realInitialPath)) {
      if (!fs.isSymbolicLinkSync(initialPath)) {
        atom.notifications.addWarning('Cannot copy a folder into itself');
        return;
      }
    }

    let newPath = path.join(newDirectoryPath, path.basename(initialPath));

    // append a number to the file if an item with the same name exists
    let fileCounter = 0;
    const originalNewPath = newPath;
    while (fs.existsSync(newPath)) {
      if (initialPathIsDirectory) {
        newPath = `${originalNewPath}${fileCounter}`;
      } else {
        const extension = getFullExtension(originalNewPath);
        const filePath = path.join(path.dirname(originalNewPath), path.basename(originalNewPath, extension));
        newPath = `${filePath}${fileCounter}${extension}`;
      }
      fileCounter += 1;
    }

    try {
      let repo;
      this.emitter.emit('will-copy-entry', {initialPath, newPath});
      if (initialPathIsDirectory) {
        // use fs.copy to copy directories since read/write will fail for directories
        fs.copySync(initialPath, newPath);
      } else {
        // read the old file and write a new one at target location
        // TODO: Replace with fs.copyFileSync
        fs.writeFileSync(newPath, fs.readFileSync(initialPath));
      }
      this.emitter.emit('entry-copied', {initialPath, newPath});

      if (repo = repoForPath(newPath)) {
        repo.getPathStatus(initialPath);
        return repo.getPathStatus(newPath);
      }

    } catch (error) {
      this.emitter.emit('copy-entry-failed', {initialPath, newPath});
      return atom.notifications.addWarning(`Failed to copy entry ${initialPath} to ${newDirectoryPath}`, {detail: error.message});
    }
  }

  // Moves an entry from `initialPath` to `newDirectoryPath`
  moveEntry(initialPath, newDirectoryPath) {
    // Do not allow moving test/a/ into test/a/b/
    // Note: A trailing path.sep is added to prevent false positives, such as test/a -> test/ab
    let error;
    try {
      const realNewDirectoryPath = fs.realpathSync(newDirectoryPath) + path.sep;
      const realInitialPath = fs.realpathSync(initialPath) + path.sep;
      if (fs.isDirectorySync(initialPath) && realNewDirectoryPath.startsWith(realInitialPath)) {
        if (!fs.isSymbolicLinkSync(initialPath)) {
          atom.notifications.addWarning('Cannot move a folder into itself');
          return;
        }
      }
    } catch (error1) {
      error = error1;
      atom.notifications.addWarning(`Failed to move entry ${initialPath} to ${newDirectoryPath}`, {detail: error.message});
    }

    const newPath = path.join(newDirectoryPath, path.basename(initialPath));

    try {
      let repo;
      this.emitter.emit('will-move-entry', {initialPath, newPath});
      fs.moveSync(initialPath, newPath);
      this.emitter.emit('entry-moved', {initialPath, newPath});

      if (repo = repoForPath(newPath)) {
        repo.getPathStatus(initialPath);
        repo.getPathStatus(newPath);
      }

    } catch (error2) {
      error = error2;
      if (error.code === 'EEXIST') {
        return this.moveConflictingEntry(initialPath, newPath, newDirectoryPath);
      } else {
        this.emitter.emit('move-entry-failed', {initialPath, newPath});
        atom.notifications.addWarning(`Failed to move entry ${initialPath} to ${newDirectoryPath}`, {detail: error.message});
      }
    }

    return true;
  }

  moveConflictingEntry(initialPath, newPath, newDirectoryPath) {
    try {
      if (!fs.isDirectorySync(initialPath)) {
        // Files, symlinks, anything but a directory
        let repo;
        const chosen = atom.confirm({
          message: `'${path.relative(newDirectoryPath, newPath)}' already exists`,
          detailedMessage: 'Do you want to replace it?',
          buttons: ['Replace file', 'Skip', 'Cancel']});

        switch (chosen) {
          case 0: // Replace
            fs.renameSync(initialPath, newPath);
            this.emitter.emit('entry-moved', {initialPath, newPath});

            if (repo = repoForPath(newPath)) {
              repo.getPathStatus(initialPath);
              repo.getPathStatus(newPath);
            }
            break;
          case 2: // Cancel
            return false;
            break;
        }
      } else {
        const entries = fs.readdirSync(initialPath);
        for (let entry of Array.from(entries)) {
          if (fs.existsSync(path.join(newPath, entry))) {
            if (!this.moveConflictingEntry(path.join(initialPath, entry), path.join(newPath, entry), newDirectoryPath)) { return false; }
          } else {
            this.moveEntry(path.join(initialPath, entry), newPath);
          }
        }

        // "Move" the containing folder by deleting it, since we've already moved everything in it
        if (!fs.readdirSync(initialPath).length) { fs.rmdirSync(initialPath); }
      }
    } catch (error) {
      this.emitter.emit('move-entry-failed', {initialPath, newPath});
      atom.notifications.addWarning(`Failed to move entry ${initialPath} to ${newPath}`, {detail: error.message});
    }

    return true;
  }

  onStylesheetsChanged() {
    // If visible, force a redraw so the scrollbars are styled correctly based on
    // the theme
    if (!this.isVisible()) { return; }
    this.element.style.display = 'none';
    this.element.offsetWidth;
    return this.element.style.display = '';
  }

  onMouseDown(e) {
    let entryToSelect, shiftKey;
    if (!(entryToSelect = e.target.closest('.entry'))) { return; }

    e.stopPropagation();

    // TODO: meta+click and ctrl+click should not do the same thing on Windows.
    //       Right now removing metaKey if platform is not darwin breaks tests
    //       that set the metaKey to true when simulating a cmd+click on macos
    //       and ctrl+click on windows and linux.
    const cmdKey = e.metaKey || (e.ctrlKey && (process.platform !== 'darwin'));

    // return early if clicking on a selected entry
    if (entryToSelect.classList.contains('selected')) {
      // mouse right click or ctrl click as right click on darwin platforms
      if ((e.button === 2) || (e.ctrlKey && (process.platform === 'darwin'))) {
        return;
      } else {
        // allow click on mouseup if not dragging
        ({shiftKey} = e);
        this.selectOnMouseUp = {shiftKey, cmdKey};
        return;
      }
    }

    if (e.shiftKey && cmdKey) {
      // select continuous from @lastFocusedEntry but leave others
      this.selectContinuousEntries(entryToSelect, false);
      return this.showMultiSelectMenuIfNecessary();
    } else if (e.shiftKey) {
      // select continuous from @lastFocusedEntry and deselect rest
      this.selectContinuousEntries(entryToSelect);
      return this.showMultiSelectMenuIfNecessary();
    // only allow ctrl click for multi selection on non darwin systems
    } else if (cmdKey) {
      this.selectMultipleEntries(entryToSelect);
      this.lastFocusedEntry = entryToSelect;
      return this.showMultiSelectMenuIfNecessary();
    } else {
      this.selectEntry(entryToSelect);
      return this.showFullMenu();
    }
  }

  onMouseUp(e) {
    let entryToSelect;
    if (this.selectOnMouseUp == null) { return; }

    const {shiftKey, cmdKey} = this.selectOnMouseUp;
    this.selectOnMouseUp = null;

    if (!(entryToSelect = e.target.closest('.entry'))) { return; }

    e.stopPropagation();

    if (shiftKey && cmdKey) {
      // select continuous from @lastFocusedEntry but leave others
      this.selectContinuousEntries(entryToSelect, false);
      return this.showMultiSelectMenuIfNecessary();
    } else if (shiftKey) {
      // select continuous from @lastFocusedEntry and deselect rest
      this.selectContinuousEntries(entryToSelect);
      return this.showMultiSelectMenuIfNecessary();
    // only allow ctrl click for multi selection on non darwin systems
    } else if (cmdKey) {
      this.deselect([entryToSelect]);
      this.lastFocusedEntry = entryToSelect;
      return this.showMultiSelectMenuIfNecessary();
    } else {
      this.selectEntry(entryToSelect);
      return this.showFullMenu();
    }
  }

  // Public: Return an array of paths from all selected items
  //
  // Example: @selectedPaths()
  // => ['selected/path/one', 'selected/path/two', 'selected/path/three']
  // Returns Array of selected item paths
  selectedPaths() {
    return Array.from(this.getSelectedEntries()).map((entry) => entry.getPath());
  }

  // Public: Selects items within a range defined by a currently selected entry and
  //         a new given entry. This is shift+click functionality
  //
  // Returns array of selected elements
  selectContinuousEntries(entry, deselectOthers) {
    if (deselectOthers == null) { deselectOthers = true; }
    const currentSelectedEntry = this.lastFocusedEntry != null ? this.lastFocusedEntry : this.selectedEntry();
    const parentContainer = entry.parentElement;
    let elements = [];
    if (parentContainer === currentSelectedEntry.parentElement) {
      const entries = Array.from(parentContainer.querySelectorAll('.entry'));
      const entryIndex = entries.indexOf(entry);
      const selectedIndex = entries.indexOf(currentSelectedEntry);
      elements = (__range__(entryIndex, selectedIndex, true).map((i) => entries[i]));

      if (deselectOthers) { this.deselect(); }
      for (let element of Array.from(elements)) { element.classList.add('selected'); }
    }

    return elements;
  }

  // Public: Selects consecutive given entries without clearing previously selected
  //         items. This is cmd+click functionality
  //
  // Returns given entry
  selectMultipleEntries(entry) {
    entry?.classList.toggle('selected');
    return entry;
  }

  // Public: Toggle full-menu class on the main list element to display the full context
  //         menu.
  showFullMenu() {
    this.list.classList.remove('multi-select');
    return this.list.classList.add('full-menu');
  }

  // Public: Toggle multi-select class on the main list element to display the
  //         menu with only items that make sense for multi select functionality
  showMultiSelectMenu() {
    this.list.classList.remove('full-menu');
    return this.list.classList.add('multi-select');
  }

  showMultiSelectMenuIfNecessary() {
    if (this.getSelectedEntries().length > 1) {
      return this.showMultiSelectMenu();
    } else {
      return this.showFullMenu();
    }
  }

  // Public: Check for multi-select class on the main list
  //
  // Returns boolean
  multiSelectEnabled() {
    return this.list.classList.contains('multi-select');
  }

  onDragEnter(e) {
    let entry;
    if (entry = e.target.closest('.entry.directory')) {
      if (this.rootDragAndDrop.isDragging(e)) { return; }
      if (!this.isAtomTreeViewEvent(e)) { return; }

      e.stopPropagation();

      if (!this.dragEventCounts.get(entry)) { this.dragEventCounts.set(entry, 0); }
      if ((this.dragEventCounts.get(entry) === 0) && !entry.classList.contains('selected')) {
        entry.classList.add('drag-over', 'selected');
      }

      return this.dragEventCounts.set(entry, this.dragEventCounts.get(entry) + 1);
    }
  }

  onDragLeave(e) {
    let entry;
    if (entry = e.target.closest('.entry.directory')) {
      if (this.rootDragAndDrop.isDragging(e)) { return; }
      if (!this.isAtomTreeViewEvent(e)) { return; }

      e.stopPropagation();

      this.dragEventCounts.set(entry, this.dragEventCounts.get(entry) - 1);
      if ((this.dragEventCounts.get(entry) === 0) && entry.classList.contains('drag-over')) {
        return entry.classList.remove('drag-over', 'selected');
      }
    }
  }

  // Handle entry name object dragstart event
  onDragStart(e) {
    let entry;
    this.dragEventCounts = new WeakMap;
    this.selectOnMouseUp = null;
    if (entry = e.target.closest('.entry')) {
      e.stopPropagation();

      if (this.rootDragAndDrop.canDragStart(e)) {
        return this.rootDragAndDrop.onDragStart(e);
      }

      const dragImage = document.createElement("ol");
      dragImage.classList.add("entries", "list-tree");
      dragImage.style.position = "absolute";
      dragImage.style.top = 0;
      dragImage.style.left = 0;
      // Ensure the cloned file name element is rendered on a separate GPU layer
      // to prevent overlapping elements located at (0px, 0px) from being used as
      // the drag image.
      dragImage.style.willChange = "transform";

      const initialPaths = [];
      for (let target of Array.from(this.getSelectedEntries())) {
        const entryPath = target.querySelector(".name").dataset.path;
        const parentSelected = target.parentNode.closest(".entry.selected");
        if (!parentSelected) {
          initialPaths.push(entryPath);
          const newElement = target.cloneNode(true);
          if (newElement.classList.contains("directory")) {
            newElement.querySelector(".entries").remove();
          }
          const object = getStyleObject(target);
          for (let key in object) {
            const value = object[key];
            newElement.style[key] = value;
          }
          newElement.style.paddingLeft = "1em";
          newElement.style.paddingRight = "1em";
          dragImage.append(newElement);
        }
      }

      document.body.appendChild(dragImage);

      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      e.dataTransfer.setData("initialPaths", JSON.stringify(initialPaths));
      e.dataTransfer.setData("atom-tree-view-event", "true");

      return window.requestAnimationFrame(() => dragImage.remove());
    }
  }

  // Handle entry dragover event; reset default dragover actions
  onDragOver(e) {
    let entry;
    if (entry = e.target.closest('.entry.directory')) {
      if (this.rootDragAndDrop.isDragging(e)) { return; }
      if (!this.isAtomTreeViewEvent(e)) { return; }

      e.preventDefault();
      e.stopPropagation();

      if ((this.dragEventCounts.get(entry) > 0) && !entry.classList.contains('selected')) {
        return entry.classList.add('drag-over', 'selected');
      }
    }
  }

  // Handle entry drop event
  onDrop(e) {
    let entry;
    this.dragEventCounts = new WeakMap;
    if (entry = e.target.closest('.entry.directory')) {
      if (this.rootDragAndDrop.isDragging(e)) { return; }
      if (!this.isAtomTreeViewEvent(e)) { return; }

      e.preventDefault();
      e.stopPropagation();

      const newDirectoryPath = entry.querySelector('.name')?.dataset.path;
      if (!newDirectoryPath) { return false; }

      let initialPaths = e.dataTransfer.getData('initialPaths');

      if (initialPaths) {
        // Drop event from Atom
        initialPaths = JSON.parse(initialPaths);
        if (initialPaths.includes(newDirectoryPath)) { return; }

        entry.classList.remove('drag-over', 'selected');

        // iterate backwards so files in a dir are moved before the dir itself
        return (() => {
          const result = [];
          for (let i = initialPaths.length - 1; i >= 0; i--) {
          // Note: this is necessary on Windows to circumvent node-pathwatcher
          // holding a lock on expanded folders and preventing them from
          // being moved or deleted
          // TODO: This can be removed when tree-view is switched to @atom/watcher
            const initialPath = initialPaths[i];
            this.entryForPath(initialPath)?.collapse?.();
            if (((process.platform === 'darwin') && e.metaKey) || e.ctrlKey) {
              result.push(this.copyEntry(initialPath, newDirectoryPath));
            } else {
              if (!this.moveEntry(initialPath, newDirectoryPath)) { break; } else {
                result.push(undefined);
              }
            }
          }
          return result;
        })();
      } else {
        // Drop event from OS
        entry.classList.remove('selected');
        return (() => {
          const result1 = [];
          for (let file of Array.from(e.dataTransfer.files)) {
            if (((process.platform === 'darwin') && e.metaKey) || e.ctrlKey) {
              result1.push(this.copyEntry(file.path, newDirectoryPath));
            } else {
              if (!this.moveEntry(file.path, newDirectoryPath)) { break; } else {
                result1.push(undefined);
              }
            }
          }
          return result1;
        })();
      }
    } else if (e.dataTransfer.files.length) {
      // Drop event from OS that isn't targeting a folder: add a new project folder
      return (() => {
        const result2 = [];
        for (entry of Array.from(e.dataTransfer.files)) {           result2.push(atom.project.addPath(entry.path));
        }
        return result2;
      })();
    }
  }

  isAtomTreeViewEvent(e) {
    for (let item of Array.from(e.dataTransfer.items)) {
      if ((item.type === 'atom-tree-view-event') || (item.kind === 'file')) {
        return true;
      }
    }

    return false;
  }

  isVisible() {
    return (this.element.offsetWidth !== 0) || (this.element.offsetHeight !== 0);
  }
});

function __range__(left, right, inclusive) {
  let range = [];
  let ascending = left < right;
  let end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}
