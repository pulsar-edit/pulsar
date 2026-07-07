const url = require("url");

module.exports = class RootDragAndDropHandler {
  constructor(treeView) {
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragLeave = this.onDragLeave.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
    this.onDropOnOtherWindow = this.onDropOnOtherWindow.bind(this);
    this.onDrop = this.onDrop.bind(this);
    this.treeView = treeView;
    this.onStorageEvent = (e) => {
      if (e.key === "tree-view:project-folder-dropped" && e.newValue) {
        const data = JSON.parse(e.newValue);
        if (data.targetWindowId === this.getWindowId()) {
          this.onDropOnOtherWindow(null, data.fromItemIndex);
        }
      }
    };
    window.addEventListener("storage", this.onStorageEvent);
    this.handleEvents();
  }

  dispose() {
    window.removeEventListener("storage", this.onStorageEvent);
  }

  handleEvents() {
    // onDragStart is called directly by TreeView's onDragStart
    // will be cleaned up by tree view, since they are tree-view's handlers
    this.treeView.element.addEventListener("dragenter", this.onDragEnter.bind(this));
    this.treeView.element.addEventListener("dragend", this.onDragEnd.bind(this));
    this.treeView.element.addEventListener("dragleave", this.onDragLeave.bind(this));
    this.treeView.element.addEventListener("dragover", this.onDragOver.bind(this));
    this.treeView.element.addEventListener("drop", this.onDrop.bind(this));
  }

  onDragStart(e) {
    if (!this.treeView.list.contains(e.target)) {
      return;
    }

    this.prevDropTargetIndex = null;
    e.dataTransfer.setData("atom-tree-view-root-event", "true");
    const projectRoot = e.target.closest(".project-root");
    const { directory } = projectRoot;

    e.dataTransfer.setData(
      "project-root-index",
      Array.from(projectRoot.parentElement.children).indexOf(projectRoot),
    );

    let rootIndex = this.treeView.roots.findIndex((root) => root.directory === directory);

    e.dataTransfer.setData("from-root-index", rootIndex);
    e.dataTransfer.setData("from-root-path", directory.path);

    // Collect all selected project roots if the dragged root is among them
    const selectedRoots = Array.from(
      this.treeView.element.querySelectorAll(".project-root.selected"),
    );
    const fromRootPaths =
      selectedRoots.length > 0 && selectedRoots.some((r) => r.directory === directory)
        ? selectedRoots.map((r) => r.directory.path)
        : [directory.path];
    e.dataTransfer.setData("from-root-paths", JSON.stringify(fromRootPaths));

    e.dataTransfer.setData("from-window-id", this.getWindowId());

    e.dataTransfer.setData("text/plain", directory.path);

    if (["darwin", "linux"].includes(process.platform)) {
      let pathUri = this.uriHasProtocol(directory.path)
        ? directory.path
        : `file://${directory.path}`;
      return e.dataTransfer.setData("text/uri-list", pathUri);
    }
  }

  uriHasProtocol(uri) {
    try {
      return url.parse(uri).protocol != null;
    } catch (error) {
      return false;
    }
  }

  onDragEnter(e) {
    if (!this.treeView.list.contains(e.target)) {
      return;
    }
    if (!this.isAtomTreeViewEvent(e)) {
      return;
    }

    return e.stopPropagation();
  }

  onDragLeave(e) {
    if (!this.treeView.list.contains(e.target)) {
      return;
    }
    if (!this.isAtomTreeViewEvent(e)) {
      return;
    }

    e.stopPropagation();
    if (e.target === e.currentTarget) {
      return this.removePlaceholder();
    }
  }

  onDragEnd(e) {
    if (!e.target.matches(".project-root-header")) {
      return;
    }
    if (!this.isAtomTreeViewEvent(e)) {
      return;
    }

    e.stopPropagation();
    return this.clearDropTarget();
  }

  onDragOver(e) {
    let element;
    if (!this.treeView.list.contains(e.target)) {
      return;
    }
    if (!this.isAtomTreeViewEvent(e)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (this.treeView.roots.length === 0) {
      this.treeView.list.appendChild(this.getPlaceholder());
      return;
    }

    const newDropTargetIndex = this.getDropTargetIndex(e);
    if (newDropTargetIndex == null) {
      return;
    }
    if (this.prevDropTargetIndex === newDropTargetIndex) {
      return;
    }
    this.prevDropTargetIndex = newDropTargetIndex;

    const projectRoots = this.treeView.roots;

    if (newDropTargetIndex < projectRoots.length) {
      element = projectRoots[newDropTargetIndex];
      element.classList.add("is-drop-target");
      return element.parentElement.insertBefore(this.getPlaceholder(), element);
    } else {
      element = projectRoots[newDropTargetIndex - 1];
      element.classList.add("drop-target-is-after");
      return element.parentElement.insertBefore(this.getPlaceholder(), element.nextSibling);
    }
  }

  onDropOnOtherWindow(e, fromItemIndex) {
    const paths = atom.project.getPaths();
    paths.splice(fromItemIndex, 1);
    atom.project.setPaths(paths);

    return this.clearDropTarget();
  }

  clearDropTarget() {
    const element = this.treeView.element.querySelector(".is-dragging");
    element?.classList.remove("is-dragging");
    element?.updateTooltip();
    return this.removePlaceholder();
  }

  onDrop(e) {
    let projectPaths;
    if (!this.treeView.list.contains(e.target)) {
      return;
    }
    if (!this.isAtomTreeViewEvent(e)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const { dataTransfer } = e;

    const fromWindowId = parseInt(dataTransfer.getData("from-window-id"));
    const fromRootPath = dataTransfer.getData("from-root-path");
    const fromIndex = parseInt(dataTransfer.getData("project-root-index"));

    let toIndex = this.getDropTargetIndex(e);

    this.clearDropTarget();

    if (fromWindowId === this.getWindowId()) {
      const fromRootPathsData = dataTransfer.getData("from-root-paths");
      const fromRootPaths = fromRootPathsData ? JSON.parse(fromRootPathsData) : [fromRootPath];

      projectPaths = atom.project.getPaths();

      // Find current indices of all selected roots, sorted ascending
      const fromIndices = fromRootPaths
        .map((p) => projectPaths.indexOf(p))
        .filter((i) => i !== -1)
        .sort((a, b) => a - b);

      if (fromIndices.length === 0) return;

      // Adjust toIndex by how many selected roots sit before the drop target
      const adjustedToIndex = toIndex - fromIndices.filter((i) => i < toIndex).length;

      // Build the new order: remove selected roots, then insert them at adjusted position
      const extracted = fromIndices.map((i) => projectPaths[i]);
      const remaining = projectPaths.filter((_, i) => !fromIndices.includes(i));
      remaining.splice(adjustedToIndex, 0, ...extracted);

      if (remaining.join("\0") !== projectPaths.join("\0")) {
        return atom.project.setPaths(remaining);
      }
    } else {
      projectPaths = atom.project.getPaths();
      projectPaths.splice(toIndex, 0, fromRootPath);
      atom.project.setPaths(projectPaths);

      if (!isNaN(fromWindowId)) {
        // Let the window where the drag started know that the tab was dropped
        const payload = JSON.stringify({ targetWindowId: fromWindowId, fromItemIndex: fromIndex });
        localStorage.setItem("tree-view:project-folder-dropped", payload);
        localStorage.removeItem("tree-view:project-folder-dropped");
      }
    }
  }

  getDropTargetIndex(e) {
    if (this.isPlaceholder(e.target)) {
      return;
    }

    const projectRoots = this.treeView.roots;
    let projectRoot = e.target.closest(".project-root");
    if (!projectRoot) {
      projectRoot = projectRoots[projectRoots.length - 1];
    }

    if (!projectRoot) {
      return 0;
    }

    const projectRootIndex = this.treeView.roots.indexOf(projectRoot);

    const center = projectRoot.getBoundingClientRect().top + projectRoot.offsetHeight / 2;

    if (e.pageY < center) {
      return projectRootIndex;
    } else {
      return projectRootIndex + 1;
    }
  }

  canDragStart(e) {
    return e.target.closest(".project-root-header");
  }

  isDragging(e) {
    for (let item of Array.from(e.dataTransfer.items)) {
      if (item.type === "from-root-path") {
        return true;
      }
    }

    return false;
  }

  isAtomTreeViewEvent(e) {
    for (let item of Array.from(e.dataTransfer.items)) {
      if (item.type === "atom-tree-view-root-event") {
        return true;
      }
    }

    return false;
  }

  getPlaceholder() {
    if (!this.placeholderEl) {
      this.placeholderEl = document.createElement("li");
      this.placeholderEl.classList.add("placeholder");
    }
    return this.placeholderEl;
  }

  removePlaceholder() {
    this.placeholderEl?.remove();
    return (this.placeholderEl = null);
  }

  isPlaceholder(element) {
    return element.classList.contains("placeholder");
  }

  getWindowId() {
    return this.processId != null ? this.processId : (this.processId = atom.getCurrentWindow().id);
  }
};
