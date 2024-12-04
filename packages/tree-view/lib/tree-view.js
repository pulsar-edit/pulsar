const path = require('path');
const shell = require('electron').shell;
const _ = require('underscore-plus');
const fs = require('fs-plus');
const { CompositeDisposable, Emitter } = require('atom');

const {
  repoForPath,
  getStyleObject,
  getFullExtension
} = require('./helpers');

const AddDialog = require('./add-dialog');
const MoveDialog = require('./move-dialog');
const CopyDialog = require('./copy-dialog');

let IgnoredNames; // Defer requiring until actually needed

const AddProjectsView = require('./add-projects-view');
const Directory = require('./directory');
const DirectoryView = require('./directory-view');
const RootDragAndDrop = require('./root-drag-and-drop');

const TREE_VIEW_URI = 'atom://tree-view';

function toggleConfig(keyPath) {
  return atom.config.set(keyPath, !atom.config.get(keyPath));
}

let nextId = 1;

class TreeView {
  constructor(state) {
    this.onDragLeave = this.onDragLeave.bind(this);
    this.onDragEnter = this.onDragEnter.bind(this);

    this.onStylesheetsChanged = this.onStylesheetsChanged.bind(this);
    this.moveConflictingEntry = this.moveConflictingEntry.bind(this);

    this.id = nextId++;

    this.element = document.createElement('div');
    this.element.classList.add('tool-panel', 'tree-view');
    this.element.tabIndex = -1;

    this.list = document.createElement('ol');
    this.list.classList.add(
      'tree-view-root',
      'full-menu',
      'list-tree',
      'has-collapsable-children',
      'focusable-panel'
    );

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
      let onStylesheetsChanged = _.debounce(this.onStylesheetsChanged, 100);
      this.disposables.add(
        atom.styles.onDidAddStyleElement(onStylesheetsChanged),
        atom.styles.onDidRemoveStyleElement(onStylesheetsChanged),
        atom.styles.onDidUpdateStyleElement(onStylesheetsChanged)
      );
    });

    this.updateRoots(state.directoryExpansionStates);

    if (state.selectedPaths?.length > 0) {
      for (let selectedPath of state.selectedPaths) {
        this.selectMultipleEntries(this.entryForPath(selectedPath))
      }
    } else {
      this.selectEntry(this.roots[0]);
    }

    if (state.scrollTop != null || state.scrollLeft != null) {
      // We have to restore the last scroll offsets, but it's too early. We use
      // an `IntersectionObserver` so that we can be notified when the element
      // is rendered and visible. At that point, we can make the changes
      // exactly once, then disconnect this observer.
      let observer = new IntersectionObserver(() => {
        if (this.isVisible()) {
          this.element.scrollTop = state.scrollTop;
          this.element.scrollLeft = state.scrollLeft;
          observer.disconnect();
        }
      });
      observer.observe(this.element);
    }

    if (state.width > 0) {
      this.element.style.width = `${state.width}px`;
    }

    this.disposables.add(
      this.onWillMoveEntry(({ initialPath }) => {
        let editors = atom.workspace.getTextEditors();
        if (fs.isDirectorySync(initialPath)) {
          initialPath += path.sep; // Avoid moving lib2's editors when lib was moved
          for (let editor of editors) {
            let filePath = editor.getPath();
            if (filePath?.startsWith(initialPath)) {
              this.editorsToMove.push(filePath);
            }
          }
        } else {
          for (let editor of editors) {
            let filePath = editor.getPath();
            if (filePath === initialPath) {
              this.editorsToMove.push(filePath)
            }
          }
        }
      }),
      this.onEntryMoved(({ initialPath, newPath }) => {
        for (let editor of atom.workspace.getTextEditors()) {
          let filePath = editor.getPath();
          let index = this.editorsToMove.indexOf(filePath);
          if (index !== -1) {
            editor.getBuffer().setPath(filePath.replace(initialPath, newPath));
            this.editorsToMove.splice(index, 1);
          }
        }
      }),
      this.onMoveEntryFailed(({ initialPath }) => {
        let index = this.editorsToMove.indexOf(initialPath);
        if (index !== -1)
          this.editorsToMove.splice(index, 1);
      }),
      this.onWillDeleteEntry(({ pathToDelete }) => {
        let editors = atom.workspace.getTextEditors();
        if (fs.isDirectorySync(pathToDelete)) {
          pathToDelete += path.sep; // Avoid destroying lib2's editors when lib was deleted
          for (let editor of editors) {
            let filePath = editor.getPath();
            if (filePath?.startsWith(pathToDelete) && !editor.isModified()) {
              this.editorsToDestroy.push(filePath);
            }
          }
        } else {
          for (let editor of editors) {
            let filePath = editor.getPath();
            if (filePath === pathToDelete && !editor.isModified()) {
              this.editorsToDestroy.push(filePath);
            }
          }
        }
      }),
      this.onEntryDeleted(() => {
        for (let editor of atom.workspace.getTextEditors()) {
          let index = this.editorsToDestroy.indexOf(editor.getPath());
          if (index !== -1) {
            editor.destroy();
            this.editorsToDestroy.splice(index, 1);
          }
        }
      }),
      this.onDeleteEntryFailed(({ pathToDelete }) => {
        let index = this.editorsToDestroy.indexOf(pathToDelete);
        if (index !== -1) {
          this.editorsToDestroy.splice(index, 1);
        }
      })
    );
  }

  serialize() {
    let { scrollLeft, scrollTop } = this.element;
    let width = parseInt((this.element.style.width || 0), 10);

    class ExpansionStateBuilder {
      constructor(roots) {
        for (let root of roots) {
          this[root.directory.path] = root.directory.serializeExpansionState();
        }
      }
    }

    return {
      directoryExpansionStates: new ExpansionStateBuilder(this.roots),
      deserializer: 'TreeView',
      selectedPaths: Array.from(
        this.getSelectedEntries(),
        item => item.getPath()
      ),
      scrollLeft,
      scrollTop,
      width
    }
  }

  destroy() {
    for (let root of this.roots) {
      root.directory.destroy();
    }
    this.disposables.dispose();
    this.rootDragAndDrop.dispose();
    return this.emitter.emit('did-destroy');
  }

  onDidDestroy(callback) {
    return this.emitter.on('did-destroy', callback);
  }

  getTitle() {
    return "Project";
  }

  getURI() {
    return TREE_VIEW_URI;
  }

  getPreferredLocation() {
    return atom.config.get('tree-view.showOnRightSide') ? 'right' : 'left';
  }

  getAllowedLocations() {
    return ['left', 'right'];
  }

  isPermanentDockItem() {
    return true;
  }

  getPreferredWidth() {
    let result;
    this.list.style.width = 'min-content';
    result = this.list.offsetWidth;
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
    this.element.addEventListener('click', (e) => {
      // This prevents accidental collapsing when an `.entries` element is the
      // event target.
      if (e.target.classList.contains('entries')) return;
      if (!(e.shiftKey || e.metaKey || e.ctrlKey)) {
        return this.entryClicked(e);
      }
    });

    this.element.addEventListener('mousedown', e => this.onMouseDown(e));
    this.element.addEventListener('mouseup',   e => this.onMouseUp(e));
    this.element.addEventListener('dragstart', e => this.onDragStart(e));
    this.element.addEventListener('dragenter', e => this.onDragEnter(e));
    this.element.addEventListener('dragleave', e => this.onDragLeave(e));
    this.element.addEventListener('dragover',  e => this.onDragOver(e));
    this.element.addEventListener('drop',      e => this.onDrop(e));

    atom.commands.add(this.element, {
      'core:move-up':        (e) => this.moveUp(e),
      'core:move-down':      (e) => this.moveDown(e),
      'core:page-up':        (e) => this.pageUp(e),
      'core:page-down':      (e) => this.pageDown(e),
      'core:move-to-top':    (e) => this.scrollToTop(e),
      'core:move-to-bottom': (e) => this.scrollToBottom(e),

      'tree-view:expand-item': () => this.openSelectedEntry({ pending: true }, true),
      'tree-view:recursive-expand-directory': () => {
        this.expandDirectory(true);
      },
      'tree-view:collapse-directory': () => this.collapseDirectory(),
      'tree-view:recursive-collapse-directory': () => {
        this.collapseDirectory(true);
      },
      'tree-view:collapse-all': () => this.collapseDirectory(true, true),

      'tree-view:open-selected-entry':       () => this.openSelectedEntry(),
      'tree-view:open-selected-entry-right': () => this.openSelectedEntryRight(),
      'tree-view:open-selected-entry-left':  () => this.openSelectedEntryLeft(),
      'tree-view:open-selected-entry-up':    () => this.openSelectedEntryUp(),
      'tree-view:open-selected-entry-down':  () => this.openSelectedEntryDown(),

      'tree-view:move':  () => this.moveSelectedEntry(),
      'tree-view:copy':  () => this.copySelectedEntries(),
      'tree-view:cut':   () => this.cutSelectedEntries(),
      'tree-view:paste': () => this.pasteEntries(),

      'tree-view:copy-full-path':       () => this.copySelectedEntryPath(false),
      'tree-view:show-in-file-manager': () => this.showSelectedEntryInFileManager(),
      'tree-view:open-in-new-window':   () => this.openSelectedEntryInNewWindow(),
      'tree-view:copy-project-path':    () => this.copySelectedEntryPath(true),

      'tree-view:unfocus': () => this.unfocus(),

      'tree-view:toggle-vcs-ignored-files': () => toggleConfig(`tree-view.hideVcsIgnoredFiles`),
      'tree-view:toggle-ignored-names':     () => toggleConfig(`tree-view.hideIgnoredNames`),
      'tree-view:remove-project-folder':    (e) => this.removeProjectFolder(e)
    });

    for (let i = 0; i < 9; i++) {
      atom.commands.add(
        this.element,
        `tree-view:open-selected-entry-in-pane-${i + 1}`,
        () => this.openSelectedEntryInPane(i)
      );
    }

    // Update the tree view…
    this.disposables.add(
      // …when the active pane changes.
      atom.workspace.getCenter().onDidChangeActivePaneItem(() => {
        this.selectActiveFile();
        if (atom.config.get('tree-view.autoReveal')) {
          this.revealActiveFile({ show: false, focus: false });
        }
      }),
      // …when we detect new/deleted files in the project.
      atom.project.onDidChangePaths(() => this.updateRoots()),
      // …when the user changes any of the settings that affect what gets shown
      // (and in what order).
      atom.config.onDidChange(
        'tree-view.hideVcsIgnoredFiles',
        () => this.updateRoots()
      ),
      atom.config.onDidChange(
        'tree-view.hideIgnoredNames',
        () => this.updateRoots()
      ),
      atom.config.onDidChange(
        'core.ignoredNames',
        () => {
          if (atom.config.get('tree-view.hideIgnoredNames')) {
            this.updateRoots();
          }
        }
      ),
      atom.config.onDidChange(
        'tree-view.sortFoldersBeforeFiles',
        () => this.updateRoots()
      ),
      atom.config.onDidChange(
        'tree-view.squashDirectoryNames',
        () => this.updateRoots()
      )
    );
  }

  toggle() {
    return atom.workspace.toggle(this);
  }

  async show(focus) {
    await atom.workspace.open(this, {
      searchAllPanes: true,
      activatePane: false,
      activateItem: false
    });
    let container = atom.workspace.paneContainerForURI(this.getURI());
    if (!container) {
      console.error(`Cannot find container for:`, this.getURI());
      return;
    }
    container.show();
    if (focus) this.focus();
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

  entryClicked(event) {
    let entry = event.target.closest('.entry');
    if (!entry) return;

    let isRecursive = event.altKey ?? false;
    this.selectEntry(entry);
    if (entry.classList.contains('directory')) {
      return entry.toggleExpansion(isRecursive);
    } else if (entry.classList.contains('file')) {
      return this.fileViewEntryClicked(event);
    }
  }

  fileViewEntryClicked(event) {
    let filePath = event.target.closest('.entry').getPath();
    let { detail = 1 } = event;
    let alwaysOpenExisting = atom.config.get('tree-view.alwaysOpenExisting');
    let allowPendingPaneItems = atom.config.get('core.allowPendingPaneItems');
    if (detail === 1) {
      if (allowPendingPaneItems) {
        let openPromise = atom.workspace.open(filePath, {
          pending: true,
          activatePane: false,
          searchAllPanes: alwaysOpenExisting
        });
        this.currentlyOpening.set(filePath, openPromise);
        return openPromise.then(() => this.currentlyOpening.delete(filePath));
      }
    } else if (detail === 2) {
      return this.openAfterPromise(filePath, {
        searchAllPanes: alwaysOpenExisting
      });
    }
  }

  openAfterPromise(uri, options) {
    let promise = this.currentlyOpening.get(uri);
    if (promise) {
      return promise.then(() => atom.workspace.open(uri, options));
    } else {
      return atom.workspace.open(uri, options);
    }
  }

  // Update the state of the tree view by synchronizing it with the state of
  // the filesystem and the user's current settings.
  updateRoots(expansionStates = {}) {
    let selectedPaths = this.selectedPaths();
    let oldExpansionStates = {};
    for (let root of this.roots) {
      oldExpansionStates[root.directory.path] = root.directory.serializeExpansionState();
      root.directory.destroy();
      root.remove();
    }
    this.roots = [];
    let projectPaths = atom.project.getPaths();
    if (projectPaths.length > 0) {
      if (!this.element.querySelector('tree-view-root')) {
        this.element.appendChild(this.list);
      }
      let addProjectsViewElement = this.element.querySelector('#add-projects-view');
      if (addProjectsViewElement) {
        this.element.removeChild(addProjectsViewElement);
      }
      if (IgnoredNames == null) {
        IgnoredNames = require('./ignored-names');
      }

      for (let projectPath of projectPaths) {
        let stats = fs.lstatSyncNoException(projectPath);
        if (!stats) continue;

        stats = _.pick(stats, ..._.keys(stats));
        for (let key of ['atime', 'birthtime', 'ctime', 'mtime']) {
          stats[key] = stats[key].getTime();
        }

        let directory = new Directory({
          name: path.basename(projectPath),
          fullPath: projectPath,
          symlink: false,
          isRoot: true,
          expansionState: expansionStates[projectPath] ??
            oldExpansionStates[projectPath] ??
            { isExpanded: true },
          ignoredNames: new IgnoredNames(),
          useSyncFS: this.useSyncFS,
          stats
        });

        let root = new DirectoryView(directory).element;
        this.list.appendChild(root);
        this.roots.push(root);
      }
      let results = [];
      for (let selectedPath of selectedPaths) {
        results.push(
          this.selectMultipleEntries(this.entryForPath(selectedPath))
        );
      }
      return results;
    } else {
      if (this.element.querySelector('.tree-view-root')) {
        this.element.removeChild(this.list);
      }
      if (!this.element.querySelector('#add-projects-view')) {
        return this.element.appendChild(new AddProjectsView().element);
      }
    }
  }

  getActivePath() {
    return atom.workspace.getCenter()?.getActivePaneItem()?.getPath?.();
  }

  selectActiveFile() {
    let activeFilePath = this.getActivePath();
    if (this.entryForPath(activeFilePath)) {
      return this.selectEntryForPath(activeFilePath);
    } else {
      // If the active file is not part of the project, deselect all entries.
      return this.deselect();
    }
  }

  revealActiveFile(options = {}) {
    if (!atom.project.getPaths().length) {
      return Promise.resolve();
    }
    let { show, focus } = options;
    focus ??= atom.config.get('tree-view.focusOnReveal');
    let promise = (show || focus) ? this.show(focus) : Promise.resolve();

    return promise.then(() => {
      let activeFilePath = this.getActivePath();
      if (!activeFilePath) return;
      let [rootPath, relativePath] = atom.project.relativizePath(activeFilePath);
      if (rootPath == null) return;

      let activePathComponents = relativePath.split(path.sep);

      // Add the root folder to the path components…
      activePathComponents.unshift(
        rootPath.substring(rootPath.lastIndexOf(path.sep) + 1)
      );
      // …and remove it from the current path.
      let currentPath = rootPath.substring(0, rootPath.lastIndexOf(path.sep));
      let results = [];
      for (let pathComponent of activePathComponents) {
        currentPath += path.sep + pathComponent;
        let entry = this.entryForPath(currentPath);
        if (entry.classList.contains('directory')) {
          results.push(entry.expand());
        } else {
          this.selectEntry(entry);
          results.push(this.scrollToEntry(entry));
        }
      }
      return results;
    })
  }

  copySelectedEntryPath(relativePath = false) {
    let pathToCopy = this.selectedPath;
    if (!pathToCopy) return;
    if (relativePath) {
      pathToCopy = atom.project.relativize(pathToCopy);
    }
    return atom.clipboard.write(pathToCopy);
  }

  entryForPath(entryPath) {
    let entries = Array.from(this.list.querySelectorAll('.entry'));
    let bestMatchEntry = null, bestMatchLength = 0;
    for (let entry of entries) {
      if (entry.isPathEqual(entryPath)) return entry;
      let entryLength = entry.getPath().length;
      if (entry.directory?.contains(entryPath) && entryLength > bestMatchLength) {
        bestMatchEntry = entry;
        bestMatchLength = entryLength;
      }
    }
    return bestMatchEntry;
  }

  selectEntryForPath(entryPath) {
    let entry = this.entryForPath(entryPath);
    return this.selectEntry(entry);
  }

  moveDown(event) {
    event?.stopImmediatePropagation();
    let selectedEntry = this.selectedEntry();
    if (selectedEntry != null) {
      // If the current entry is a directory…
      if (selectedEntry.classList.contains('directory')) {
        // …the next entry should be its first child.
        if (this.selectEntry(selectedEntry.entries.children[0])) {
          this.scrollToEntry(this.selectedEntry(), false);
          return;
        }
      }
      let nextEntry = this.nextEntry(selectedEntry);
      if (nextEntry) this.selectEntry(nextEntry);
    } else {
      this.selectEntry(this.roots[0]);
    }
    return this.scrollToEntry(this.selectedEntry(), false);
  }

  moveUp(event) {
    event?.stopImmediatePropagation();
    let selectedEntry = this.selectedEntry();
    if (selectedEntry != null) {
      let previousEntry = this.previousEntry(selectedEntry);
      if (previousEntry) {
        this.selectEntry(previousEntry);
      } else {
        this.selectEntry(
          selectedEntry.parentElement.closest('.directory')
        );
      }
    } else {
      let entries = this.list.querySelectorAll('.entry');
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
    while (previousEntry && !previousEntry.matches('.entry')) {
      previousEntry = previousEntry.previousSibling;
    }
    if (!previousEntry) return null;
    // If the previous entry is an expanded directory, we need to select the
    // last entry in that directory, not the directory itself.
    if (previousEntry.matches('.directory.expanded')) {
      let entries = previousEntry.querySelectorAll('.entry');
      if (entries.length > 0) {
        return entries[entries.length - 1];
      }
    }
    return previousEntry;
  }

  expandDirectory(isRecursive = false) {
    let selectedEntry = this.selectedEntry();
    if (!selectedEntry) return;

    let directory = selectedEntry.closest('.directory');
    if (isRecursive === false && directory.isExpanded) {
      if (directory.directory.getEntries().length > 0) {
        // Select the first entry in the expanded folder if it exists.
        return this.moveDown();
      }
    } else {
      return directory.expand(isRecursive);
    }
  }

  collapseDirectory(isRecursive = false, allDirectories = false) {
    if (allDirectories) {
      for (let root of this.roots)
        root.collapse(true);
      return;
    }
    let selectedEntry = this.selectedEntry();
    if (!selectedEntry) return;

    let directory = selectedEntry.closest('.expanded.directory');
    if (directory) {
      directory.collapse(isRecursive);
      return this.selectEntry(directory);
    }
  }

  openSelectedEntry(options = {}, expandDirectory = false) {
    let selectedEntry = this.selectedEntry();
    if (!selectedEntry) return;

    if (selectedEntry.classList.contains('directory')) {
      if (expandDirectory) {
        return this.expandDirectory(false);
      } else {
        return selectedEntry.toggleExpansion();
      }
    } else if (selectedEntry.classList.contains('file')) {
      if (atom.config.get('tree-view.alwaysOpenExisting')) {
        options = { searchAllPanes: true, ...options };
      }
      return this.openAfterPromise(selectedEntry.getPath(), options);
    }
  }

  openSelectedEntrySplit(orientation, side) {
    let selectedEntry = this.selectedEntry();
    if (!selectedEntry) return;

    let pane = atom.workspace.getCenter().getActivePane();
    if (!pane || !selectedEntry.classList.contains('file')) return;

    if (atom.workspace.getCenter().getActivePaneItem()) {
      let split = pane.split(orientation, side);
      return atom.workspace.openURIInPane(selectedEntry.getPath(), split);
    } else {
      return this.openSelectedEntry(true);
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
    let selectedEntry = this.selectedEntry();
    if (selectedEntry == null) return;

    let pane = atom.workspace.getCenter().getPanes()[index];
    if (pane && selectedEntry.classList.contains('file')) {
      return atom.workspace.open(selectedEntry.getPath(), { pane });
    }
  }

  moveSelectedEntry() {
    let oldPath;
    if (this.hasFocus()) {
      let entry = this.selectedEntry();
      // Can't move it if it's a root project directory.
      if (!entry || this.roots.includes(entry)) {
        return;
      }
      oldPath = entry.getPath();
    } else {
      oldPath = this.getActivePath();
    }
    if (!oldPath) return;
    let dialog = new MoveDialog(oldPath, {
      willMove: ({ initialPath, newPath }) => {
        return this.emitter.emit('will-move-entry', { initialPath, newPath });
      },
      onMove: ({ initialPath, newPath }) => {
        return this.emitter.emit('entry-moved', { initialPath, newPath });
      },
      onMoveFailed: ({ initialPath, newPath }) => {
        return this.emitter.emit('move-entry-failed', { initialPath, newPath });
      }
    });
    return dialog.attach();
  }

  showSelectedEntryInFileManager() {
    let filePath = this.selectedEntry()?.getPath();
    if (!filePath) return;

    if (!fs.existsSync(filePath)) {
      return atom.notifications.addWarning(
        `Unable to show ${filePath} in ${this.getFileManagerName()}`
      );
    }
    return shell.showItemInFolder(filePath);
  }

  showCurrentFileInFileManager() {
    let filePath = atom.workspace.getCenter().getActiveTextEditor()?.getPath();
    if (!filePath) return;

    if (!fs.existsSync(filePath)) {
      return atom.notifications.addWarning(
        `Unable to show ${filePath} in ${this.getFileManagerName()}`
      );
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
    let pathToOpen = this.selectedEntry()?.getPath();
    if (pathToOpen) {
      return atom.open({ pathsToOpen: [pathToOpen], newWindow: true });
    }
  }

  copySelectedEntry() {
    let oldPath;
    if (this.hasFocus()) {
      let entry = this.selectedEntry();
      if (this.roots.includes(entry)) return;
      oldPath = entry?.getPath();
    } else {
      oldPath = this.getActivePath();
    }
    if (!oldPath) return;

    let dialog = new CopyDialog(oldPath, {
      onCopy({ initialPath, newPath }) {
        return this.emitter.emit('entry-copied', { initialPath, newPath });
      }
    });
    return dialog.attach();
  }

  async removeSelectedEntries() {
    let activePath = this.getActivePath();
    let selectedPaths, selectedEntries;
    if (this.hasFocus()) {
      selectedPaths = this.selectedPaths();
      selectedEntries = this.getSelectedEntries();
    } else if (activePath) {
      selectedPaths = [activePath];
      selectedEntries = [this.entryForPath(activePath)];
    }
    if ((selectedPaths?.length ?? 0) === 0) return;

    for (let root of this.roots) {
      if (selectedPaths.includes(root.getPath())) {
        atom.confirm({
          message: `The root directory '${root.directory.name} can't be removed.`,
          buttons: ['OK']
        }, () => {}); // noop
        return;
      }
    }

    atom.confirm({
      message: `Are you sure you want to delete the selected ${selectedPaths.length > 1 ? 'items' : 'item'}?`,
      detailedMessage: `You are deleting:\n${selectedPaths.join('\n')}`,
      buttons: ['Move to Trash', 'Cancel']
    }, async (response) => {
      if (response === 0) { // Move to Trash
        let failedDeletions = [];
        let deletionPromises = [];

        // Since this goes async, all entries that correspond to paths we're
        // about to delete will soon detach frmo the tree. So we should figure
        // out ahead of time which element we're going to select when we're
        // done.
        let newSelectedEntry;
        let firstSelectedEntry = selectedEntries[0];
        if (firstSelectedEntry) {
          newSelectedEntry = firstSelectedEntry.closest('.directory:not(.selected)');
        }

        for (let selectedPath of selectedPaths) {
          // Don't delete entries which no longer exist. This can happen, for
          // example, when
          //
          // * the entry is deleted outside of Atom before "Move to Trash" is
          //   selected;
          // * a folder and one of its children are both selected for deletion,
          //   but the parent folder is deleted first.
          if (!fs.existsSync(selectedPath)) continue;

          let meta = { pathToDelete: selectedPath };

          this.emitter.emit('will-delete-entry', meta);

          let promise = shell.trashItem(selectedPath).then(() => {
            this.emitter.emit('entry-deleted', meta);
          }).catch(() => {
            this.emitter.emit('delete-entry-failed', meta);
            failedDeletions.push(selectedPath);
          }).finally(() => {
            repoForPath(selectedPath)?.getPathStatus(selectedPath);
          });

          deletionPromises.push(promise);
        }

        await Promise.allSettled(deletionPromises);

        if (failedDeletions.length > 0) {
          atom.notifications.addError(
            this.formatTrashFailureMessage(failedDeletions),
            {
              description: this.formatTrashEnabledMessage(),
              detail: `${failedDeletions.join('\n')}`,
              dismissable: true
            }
          );
        }

        if (newSelectedEntry) {
          this.selectEntry(newSelectedEntry);
        }

        if (atom.config.get('tree-view.squashDirectoryNames')) {
          return this.updateRoots();
        }
      }
    });
  }

  formatTrashFailureMessage(failedDeletions) {
    let fileText = failedDeletions.length > 1 ? 'files' : 'file';
    return `The following ${fileText} couldn’t be moved to the trash:`;
  }

  formatTrashEnabledMessage() {
    switch (process.platform) {
      case 'linux':
        return 'Is `gvfs-trash` installed?';
      case 'darwin':
        return 'Is Trash enabled on the volume where the files are stored?';
      case 'win32':
        return 'Is there a Recycle Bin on the drive where the files are stored?';
    }
  }

  // Public: Copy the path of the selected entry or entries.
  //
  // Save the path in localStorage so that copying from two different instances
  // of Pulsar works as intended.
  copySelectedEntries() {
    let selectedPaths = this.selectedPaths();
    if (!(selectedPaths && selectedPaths.length > 0)) return;

    // Save to localStorage so we can paste across multiple open apps.
    window.localStorage.removeItem('tree-view:cutPath');
    window.localStorage['tree-view:copyPath'] = JSON.stringify(selectedPaths);
  }

  // Public: Cut the path of the selected entry or entries.
  //
  // Save the path in localStorage so that cutting from two different instances
  // of Pulsar works as intended.
  cutSelectedEntries() {
    let selectedPaths = this.selectedPaths();
    if (!(selectedPaths && selectedPaths.length > 0)) return;

    // Save to localStorage so we can paste across multiple open apps.
    window.localStorage.removeItem('tree-view:copyPath');
    window.localStorage['tree-view:cutPath'] = JSON.stringify(selectedPaths);
  }


  // Public: Paste a copied or cut item.
  //
  // If a file is selected, the file's parent directory is used as the paste
  // destination.
  pasteEntries() {
    let selectedEntry = this.selectedEntry();
    if (!selectedEntry) return;

    let cutPaths = null, copiedPaths = null;
    if (window.localStorage['tree-view:cutPath']) {
      cutPaths = JSON.parse(window.localStorage['tree-view:cutPath']);
    }
    if (window.localStorage['tree-view:copyPath']) {
      copiedPaths = JSON.parse(window.localStorage['tree-view:copyPath']);
    }
    // Both the copy action and the cut action delete the opposite
    // `localStorage` entry, so only one of these should ever exist.
    let initialPaths = copiedPaths ?? cutPaths;
    if (!(initialPaths && initialPaths.length > 0)) return;

    let newDirectoryPath = selectedEntry.getPath();
    if (selectedEntry.classList.contains('file')) {
      newDirectoryPath = path.dirname(newDirectoryPath);
    }
    let results = [];
    for (let initialPath of initialPaths) {
      if (fs.existsSync(initialPath)) {
        if (copiedPaths) {
          results.push(this.copyEntry(initialPath, newDirectoryPath));
        } else if (cutPaths) {
          if (!this.moveEntry(initialPath, newDirectoryPath)) {
            break;
          }
        }
      }
    }
  }

  add(isCreatingFile) {
    let selectedEntry = this.selectedEntry() ?? this.roots[0];
    let selectedPath = selectedEntry?.getPath() ?? '';

    let dialog = new AddDialog(selectedPath, isCreatingFile);

    dialog.onDidCreateDirectory((createdPath) => {
      this.entryForPath(createdPath)?.reload();
      this.selectEntryForPath(createdPath);
      if (atom.config.get('tree-view.squashDirectoryNames'))
        this.updateRoots();

      this.emitter.emit('directory-created', { path: createdPath });
    });

    dialog.onDidCreateFile((createdPath) => {
      this.entryForPath(createdPath)?.reload();
      atom.workspace.open(createdPath);
      if (atom.config.get('tree-view.squashDirectoryNames'))
        this.updateRoots();

      this.emitter.emit('file-created', { path: createdPath });
    });
    return dialog.attach();
  }

  removeProjectFolder(event) {
    // Remove the targeted project folder (generally this only happens through
    // the context menu)
    let pathToRemove = event.target.closest('.project-root > .header')
      ?.querySelector('.name')?.dataset.path;

    // If an entry is selected, remove that entry's project folder
    pathToRemove ??= this.selectedEntry()?.closest('.project-root')
      ?.querySelector('.header')?.querySelector('.name')?.dataset.path;

    // Finally, if only one project folder exists and nothing is selected,
    // remove that folder
    if (!pathToRemove && this.roots.length === 1) {
      pathToRemove = this.roots[0].querySelector('.header')?.
        querySelector('.name')?.dataset.path;
    }

    if (pathToRemove) {
      atom.project.removePath(pathToRemove);
    }
  }

  selectedEntry() {
    return this.list.querySelector('.selected');
  }

  selectEntry(entry) {
    if (!entry) return;
    this.selectedPath = entry.getPath();
    this.lastFocusedEntry = entry;
    let selectedEntries = this.getSelectedEntries();
    if (selectedEntries.length > 1 || selectedEntries[0] !== entry) {
      this.deselect(selectedEntries);
      entry.classList.add('selected');
    }
    return entry;
  }

  getSelectedEntries() {
    return this.list.querySelectorAll('.selected');
  }

  deselect(elementsToDeselect) {
    elementsToDeselect ??= this.getSelectedEntries();
    for (let selected of elementsToDeselect) {
      selected.classList.remove('selected');
    }
  }

  scrollTop(top = null) {
    if (top !== null) {
      return this.element.scrollTop = top;
    } else {
      return this.element.scrollTop;
    }
  }

  scrollBottom(bottom = null) {
    if (bottom !== null) {
      return this.element.scrollTop = bottom - this.element.offsetHeight;
    } else {
      return this.element.scrollTop + this.element.offsetHeight;
    }
  }

  scrollToEntry(entry, center = true) {
    let element = entry?.classList.contains('directory') ? entry.header : entry;
    element?.scrollIntoViewIfNeeded(center);
  }

  scrollToBottom() {
    let lastEntry = _.last(this.list.querySelectorAll('.entry'));
    if (lastEntry) {
      this.selectEntry(lastEntry);
      this.scrollToEntry(lastEntry);
    }
  }

  scrollToTop() {
    if (this.roots[0]) {
      this.selectEntry(this.roots[0]);
    }
    this.element.scrollTop = 0;
  }

  pageUp() {
    this.element.scrollTop -= this.element.offsetHeight;
  }

  pageDown() {
    this.element.scrollTop += this.element.offsetHeight;
  }

  // Copies an entry from `initialPath` to `newDirectoryPath`.
  //
  // If the entry already exists in `newDirectoryPath`, a number is appended to
  // the basename.
  copyEntry(initialPath, newDirectoryPath) {
    let initialPathIsDirectory = fs.isDirectorySync(initialPath);
    // Do not allow copying test/a/ into test/a/b/
    // Note: A trailing path.sep is added to prevent false positives, such as test/a -> test/ab
    let realNewDirectoryPath = fs.realpathSync(newDirectoryPath) + path.sep;
    let realInitialPath = fs.realpathSync(initialPath) + path.sep;

    if (initialPathIsDirectory && realNewDirectoryPath.startsWith(realInitialPath)) {
      if (!fs.isSymbolicLinkSync(initialPath)) {
        atom.notifications.addWarning('Cannot copy a folder into itself');
        return;
      }
    }
    let newPath = path.join(newDirectoryPath, path.basename(initialPath));
    // Append a number to the file if an item with the same name exists
    let fileCounter = 0;
    let originalNewPath = newPath;
    while (fs.existsSync(newPath)) {
      if (initialPathIsDirectory) {
        newPath = `${originalNewPath}${fileCounter}`;
      } else {
        let extension = getFullExtension(originalNewPath);
        let filePath = path.join(
          path.dirname(originalNewPath),
          path.basename(originalNewPath, extension)
        );
        newPath = `${filePath}${fileCounter}${extension}`;
      }
      fileCounter++;
    }

    try {
      this.emitter.emit('will-copy-entry', { initialPath, newPath });
      if (initialPathIsDirectory) {
        // use fs.copy to copy directories since read/write will fail for
        // directories
        fs.copySync(initialPath, newPath);
      } else {
        // read the old file and write a new one at target location
        // TODO: replace with fs.copyFileSync
        fs.writeFileSync(newPath, fs.readFileSync(initialPath));
      }
      this.emitter.emit('entry-copied', { initialPath, newPath });
      let repo = repoForPath(newPath);
      if (repo) {
        repo.getPathStatus(initialPath);
        repo.getPathStatus(newPath);
      }
    } catch (error) {
      this.emitter.emit('copy-entry-failed', { initialPath, newPath });
      atom.notifications.addWarning(
        `Failed to copy entry ${initialPath} to ${newDirectoryPath}`,
        { detail: error.message }
      );
    }
  }

  // Moves an entry from `initialPath` to `newDirectoryPath`.
  moveEntry(initialPath, newDirectoryPath) {
    // Do not allow moving test/a/ into test/a/b/
    // Note: A trailing path.sep is added to prevent false positives, such as test/a -> test/ab
    try {
      let realNewDirectoryPath = fs.realpathSync(newDirectoryPath) + path.sep;
      let realInitialPath = fs.realpathSync(initialPath) + path.sep;
      if (fs.isDirectorySync(initialPath) && realNewDirectoryPath.startsWith(realInitialPath)) {
        if (!fs.isSymbolicLinkSync(initialPath)) {
          atom.notifications.addWarning('Cannot move a folder into itself');
          return;
        }
      }
    } catch (error) {
      atom.notifications.addWarning(
        `Failed to move entry ${initialPath} to ${newDirectoryPath}`,
        { detail: error.message }
      );
    }
    let newPath = path.join(newDirectoryPath, path.basename(initialPath));
    try {
      this.emitter.emit('will-move-entry', { initialPath, newPath });
      fs.moveSync(initialPath, newPath);
      this.emitter.emit('entry-moved', { initialPath, newPath });
      let repo = repoForPath(newPath);
      if (repo) {
        repo.getPathStatus(initialPath);
        repo.getPathStatus(newPath);
      }
    } catch (error) {
      if (error.code === 'EEXIST') {
        return this.moveConflictingEntry(initialPath, newPath, newDirectoryPath);
      } else {
        this.emitter.emit('move-entry-failed', { initialPath, newPath });
        atom.notifications.addWarning(
          `Failed to move entry ${initialPath} to ${newDirectoryPath}`,
          { detail: error.message }
        );
      }
    }
    return true;
  }

  moveConflictingEntry(initialPath, newPath, newDirectoryPath) {
    try {
      if (!fs.isDirectorySync(initialPath)) {
        // Files, symlinks, anything but a directory
        let chosen = atom.confirm({
          message: `'${path.relative(newDirectoryPath, newPath)}' already exists`,
          detailedMessage: 'Do you want to replace it?',
          buttons: ['Replace file', 'Skip', 'Cancel']
        });
        switch (chosen) {
          case 0: {// Replace
            fs.renameSync(initialPath, newPath);
            this.emitter.emit('entry-moved', { initialPath, newPath });
            let repo = repoForPath(newPath);
            if (repo) {
              repo.getPathStatus(initialPath);
              repo.getPathStatus(newPath);
            }
            break;
          }
          case 2: // Cancel
            return false;
        }
      } else {
        let entries = fs.readdirSync(initialPath);
        for (let entry of entries) {
          if (fs.existsSync(path.join(newPath, entry))) {
            let result = this.moveConflictingEntry(
              path.join(initialPath, entry),
              path.join(newPath, entry),
              newDirectoryPath
            );
            if (!result) return false;
          } else {
            this.moveEntry(path.join(initialPath, entry), newPath);
          }
        }
        if (!fs.readdirSync(initialPath).length) {
          // "Move" the containing folder by deleting it, since we've already
          // moved everything in it
          fs.rmdirSync(initialPath);
        }
      }
    } catch (error) {
      this.emitter.emit('move-entry-failed', { initialPath, newPath });
      atom.notifications.addWarning(
        `Failed to move entry ${initialPath} to ${newPath}`,
        { detail: error.message }
      );
    }
    return true;
  }

  onStylesheetsChanged() {
    // If visible, force a redraw so the scrollbars are styled correctly based on
    // the theme.
    if (!this.isVisible()) return;
    this.element.style.display = 'none';
    this.element.offsetWidth;
    this.element.style.display = '';
  }

  onMouseDown(event) {
    let entryToSelect = event.target.closest('.entry');
    if (!entryToSelect) return;
    event.stopPropagation();

    // TODO: meta+click and ctrl+click should not do the same thing on Windows.
    // Right now removing metaKey if platform is not darwin breaks tests
    // that set the metaKey to true when simulating a cmd+click on macos
    // and ctrl+click on windows and linux
    let cmdKey = event.metaKey || (event.ctrlKey && process.platform !== 'darwin');
    // return early if clicking on a selected entry
    if (entryToSelect.classList.contains('selected')) {
      // mouse right click or ctrl click as right click on darwin platforms
      if (event.button === 2 || (event.ctrlKey && process.platform === 'darwin')) {
        return;
      } else {
        let shiftKey = event.shiftKey;
        this.selectOnMouseUp = { shiftKey, cmdKey };
        return;
      }
    }
    if (event.shiftKey && cmdKey) {
      // select continuous from this.lastFocusedEntry but leave others
      this.selectContinuousEntries(entryToSelect, false);
      this.showMultiSelectMenuIfNecessary();
    } else if (event.shiftKey) {
      // select continuous from this.lastFocusedEntry and deselect rest
      this.selectContinuousEntries(entryToSelect);
      this.showMultiSelectMenuIfNecessary();
      // only allow ctrl click for multi selection on non-darwin systems
    } else if (cmdKey) {
      this.selectMultipleEntries(entryToSelect);
      this.lastFocusedEntry = entryToSelect;
      this.showMultiSelectMenuIfNecessary();
    } else {
      this.selectEntry(entryToSelect);
      this.showFullMenu();
    }
  }

  onMouseUp(event) {
    if (!this.selectOnMouseUp) return;
    let { shiftKey, cmdKey } = this.selectOnMouseUp;
    this.selectOnMouseUp = null;

    let entryToSelect = event.target.closest('.entry');
    if (!entryToSelect) return;
    event.stopPropagation();

    if (shiftKey && cmdKey) {
      // select continuous from this.lastFocusedEntry but leave others
      this.selectContinuousEntries(entryToSelect, false);
      this.showMultiSelectMenuIfNecessary();
    } else if (shiftKey) {
      // select continuous from this.lastFocusedEntry and deselect rest
      this.selectContinuousEntries(entryToSelect);
      this.showMultiSelectMenuIfNecessary();
      // only allow ctrl click for multi selection on non darwin systems
    } else if (cmdKey) {
      this.deselect([entryToSelect]);
      this.lastFocusedEntry = entryToSelect;
      this.showMultiSelectMenuIfNecessary();
    } else {
      this.selectEntry(entryToSelect);
      this.showFullMenu();
    }
  }

  // Public: Return an array of paths from all selected items.
  //
  // Example:
  //
  //     this.selectedPaths()
  //     => ['selected/path/one', 'selected/path/two', 'selected/path/three']
  //
  // Returns Array of selected item paths.
  selectedPaths() {
    return Array.from(this.getSelectedEntries()).map(entry => entry.getPath());
  }

  // Public: Selects items within a range defined by a currently selected entry
  // and a new given entry. This is Shift+click functionality.
  selectContinuousEntries(entry, deselectOthers = true) {
    let currentSelectedEntry = this.lastFocusedEntry ?? this.selectedEntry();
    let parentContainer = entry.parentElement;
    let elements = [];
    if (parentContainer === currentSelectedEntry.parentElement) {
      let entries = Array.from(parentContainer.querySelectorAll('.entry'));
      let entryIndex = entries.indexOf(entry);
      let selectedIndex = entries.indexOf(currentSelectedEntry);
      let minIndex = Math.min(entryIndex, selectedIndex);
      let maxIndex = Math.max(entryIndex, selectedIndex);
      let elements = [];
      for (let i = minIndex; i <= maxIndex; i++) {
        elements.push(entries[i]);
      }
      if (deselectOthers) this.deselect();
      for (let element of elements) {
        element.classList.add('selected');
      }
    }
    return elements;
  }

  // Public: Selects an entry without clearing previously selected items. This
  // is Cmd+click functionality.
  selectMultipleEntries(entry) {
    entry?.classList.toggle('selected');
    return entry;
  }

  // Public: Toggle the `full-menu` class on the main list element to display
  // the full context menu.
  showFullMenu() {
    this.list.classList.remove('multi-select');
    this.list.classList.add('full-menu');
  }

  // Toggle the `multi-select` class on the main list element to display the
  // context menu with only the items that make sense for multi-select
  // functionality.
  showMultiSelectMenu() {
    this.list.classList.remove('full-menu');
    this.list.classList.add('multi-select');
  }

  showMultiSelectMenuIfNecessary() {
    if (this.getSelectedEntries().length > 1) {
      this.showMultiSelectMenu();
    } else {
      this.showFullMenu();
    }
  }

  // Public: Check for the `multi-select` class on the main list.
  //
  // Returns Boolean
  multiSelectEnabled() {
    return this.list.classList.contains('multi-select');
  }

  onDragEnter(event) {
    let entry = event.target.closest('.entry.directory');
    if (!entry) return;
    if (this.rootDragAndDrop.isDragging(event)) return;
    if (!this.isAtomTreeViewEvent(event)) return;
    event.stopPropagation();
    let count = this.dragEventCounts.get(entry);
    if (count == null) {
      count = 0;
      this.dragEventCounts.set(entry, count);
    }
    if (!(count !== 0 || entry.classList.contains('selected'))) {
      entry.classList.add('drag-over', 'selected');
    }
    this.dragEventCounts.set(entry, count + 1);
  }

  onDragLeave(event) {
    let entry = event.target.closest('.entry.directory');
    if (!entry) return;
    if (this.rootDragAndDrop.isDragging(event)) return;
    if (!this.isAtomTreeViewEvent(event)) return;
    event.stopPropagation();
    this.dragEventCounts.set(entry, this.dragEventCounts.get(entry) - 1);
    if (this.dragEventCounts.get(entry) === 0 && entry.classList.contains('drag-over')) {
      entry.classList.remove('drag-over', 'selected');
    }
  }

  // Handle entry name object dragstart event.
  onDragStart(event) {
    this.dragEventCounts = new WeakMap();
    this.selectOnMouseUp = null;
    let entry = event.target.closest('.entry');
    if (!entry) return;
    event.stopPropagation();
    if (this.rootDragAndDrop.canDragStart(event)) {
      return this.rootDragAndDrop.onDragStart(event);
    }
    let dragImage = document.createElement('ol');
    dragImage.classList.add('entries', 'list-tree');
    dragImage.style.position = 'absolute';
    dragImage.style.top = `0px`;
    dragImage.style.left = `0px`;
    // Ensure the cloned file name element is rendered on a separate GPU
    // layer to prevent overlapping elements located at (0px, 0px) from
    // being used as the drag image.
    dragImage.style.willChange = 'transform';
    let initialPaths = [];
    for (let target of this.getSelectedEntries()) {
      let entryPath = target.querySelector('.name').dataset.path;
      let parentSelected = target.parentNode.closest('.entry.selected');
      if (!parentSelected) {
        initialPaths.push(entryPath);
        let newElement = target.cloneNode(true);
        if (newElement.classList.contains('directory')) {
          newElement.querySelector('.entries').remove();
        }
        for (let [key, value] of Object.entries(getStyleObject(target))) {
          if (value === "") continue;
          newElement.style[key] = value;
        }
        newElement.style.paddingLeft = '1em';
        newElement.style.paddingRight = '1em';
        dragImage.append(newElement);
      }
    }
    document.body.appendChild(dragImage);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setDragImage(dragImage, 0, 0);
    event.dataTransfer.setData('initialPaths', JSON.stringify(initialPaths));
    event.dataTransfer.setData('atom-tree-view-event', 'true');
    window.requestAnimationFrame(() => dragImage.remove());
  }

  // Handle entry dragover event; reset default dragover actions.
  onDragOver(event) {
    let entry = event.target.closest('.entry.directory');
    if (!entry) return;
    if (this.rootDragAndDrop.isDragging(event)) return;
    if (!this.isAtomTreeViewEvent(event)) return;
    event.preventDefault();
    event.stopPropagation();
    if (this.dragEventCounts.get(entry) > 0 && entry.classList.contains('selected')) {
      entry.classList.add('drag-over', 'selected');
    }
  }

  // Handle entry drop event.
  onDrop(event) {
    this.dragEventCounts = new WeakMap();
    let entry = event.target.closest('.entry.directory');
    if (entry) {
      if (this.rootDragAndDrop.isDragging(event)) return;
      if (!this.isAtomTreeViewEvent(event)) return;
      event.preventDefault();
      event.stopPropagation();
      let newDirectoryPath = entry.querySelector('.name')?.dataset.path;
      if (!newDirectoryPath) return false;

      let initialPaths = event.dataTransfer.getData('initialPaths');
      if (initialPaths) {
        // Drop event from Atom
        initialPaths = JSON.parse(initialPaths);
        if (initialPaths.includes(newDirectoryPath)) return;

        entry.classList.remove('drag-over', 'selected');
        // Iterate backwards so that files in a dir are moved before the dir
        // itself.
        for (let j = initialPaths.length - 1; j >= 0; j -= 1) {
          // Note: This is necessary on Windows to circumvent node-pathwatcher
          // holding a lock on expanded folders and preventing them from being
          // moved or deleted.
          //
          // TODO: This can be removed when tree-view is switched to
          // @atom/watcher.
          let initialPath = initialPaths[j];
          this.entryForPath(initialPath)?.collapse?.();
          if ((process.platform === 'darwin' && event.metaKey) || event.ctrlKey) {
            // Mimic OS-specific conventions in which holding down a modifier
            // key means that an entry is copied rather than moved.
            this.copyEntry(initialPath, newDirectoryPath);
          } else if (!this.moveEntry(initialPath, newDirectoryPath)) {
            break;
          }
        }
      } else {
        // Drop event from OS
        entry.classList.remove('selected');
        for (let file of event.dataTransfer.files) {
          if ((process.platform === 'darwin' && event.metaKey) || event.ctrlKey) {
            this.copyEntry(file.path, newDirectoryPath);
          } else if (!this.moveEntry(file.path, newDirectoryPath)) {
            break;
          }
        }
      }
    } else if (event.dataTransfer.files.length) {
      // A drop event from the OS that isn't targeting a specific folder in the
      // tree view. This is probably the user dragging a folder into the tree
      // view in order to add a new folder to the project.
      for (let entry of event.dataTransfer.files) {
        atom.project.addPath(entry.path);
      }
    }
  }

  isAtomTreeViewEvent(event) {
    for (let item of event.dataTransfer.items) {
      if (item.type === 'atom-tree-view-event' || item.kind === 'file')
        return true;
    }
    return false;
  }

  isVisible() {
    return this.element.offsetWidth !== 0 || this.element.offsetHeight !== 0;
  }

}

module.exports = TreeView;
