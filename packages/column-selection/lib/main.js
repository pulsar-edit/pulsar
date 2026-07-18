const { CompositeDisposable, Disposable } = require("atom");

module.exports = {
  activate() {
    this.editor = null;
    this.context = false;
    this.switch = null;
    this.savedSelections = [];
    this.mouseStart = null;
    this.mouseEnd = null;
    this.dragging = false;
    this.selecting = false;
    this.stickyFlag = false;
    this.pickerFlag = false;
    this.atomicTabs = undefined;
    this.lastMoveEvent = null;

    this.disposables = new CompositeDisposable(
      atom.config.observe("editor.multiCursorOnClick", (value) => {
        this.multiCursorOnClick = value;
      }),
      atom.config.observe("column-selection.mouseButton", (value) => {
        this.mouseButton = value;
      }),
      atom.config.observe("column-selection.selectKey", (value) => {
        this.selectKey = value;
      }),
      atom.config.onDidChange("column-selection.statusBar", ({ newValue }) => {
        newValue ? this.activateStatusBar() : this.deactivateStatusBar();
      }),
      atom.commands.add("atom-workspace", {
        "column-selection:sticky": () => this.toggleSticky(),
        "column-selection:picker": () => this.togglePicker(),
      }),
    );

    this.selectBox = throttleWithAnimationFrame(this.selectBox.bind(this));
    this.registerEventListener(window, "mousedown", this.mouseDown.bind(this), true);
    this.registerEventListener(window, "mouseup", this.mouseUp.bind(this), true);
    this.registerEventListener(window, "mousemove", this.mouseMove.bind(this), true);
    this.registerEventListener(window, "contextmenu", this.contextMenu.bind(this), true);
    this.registerEventListener(window, "scroll", this.scrollEvent.bind(this), true);
  },

  deactivate() {
    this.dragging = false;
    this.restoreEditorPresentation();
    this.deactivateStatusBar();
    this.disposables.dispose();
    this.editor = null;
  },

  registerEventListener(element, type, listener, options) {
    element.addEventListener(type, listener, options);
    this.disposables.add(
      new Disposable(() => element.removeEventListener(type, listener, options)),
    );
  },

  toggleSticky() {
    this.stickyFlag = !this.stickyFlag;
    this.switch?.updateSticky();
  },

  togglePicker() {
    this.pickerFlag = this.pickerFlag ? false : true;
    if (!this.pickerFlag) {
      this.restoreEditorPresentation();
      this.resetGesture();
    }
    this.switch?.updatePicker();
  },

  findEditor(event) {
    if (!this.editor) {
      const element = event.target.closest?.("atom-text-editor");
      if (element) this.editor = element.getModel();
    }
    return this.editor;
  },

  shouldStartSelection(event) {
    if (this.stickyFlag && event.which === 1) return true;
    if (!this.mouseButton || event.which !== this.mouseButton) return false;

    switch (this.selectKey) {
      case 0:
        return true;
      case 1:
        return event.shiftKey;
      case 2:
        return event.altKey;
      case 3:
        return event.ctrlKey;
      default:
        return false;
    }
  },

  screenPositionForMouseEvent(event) {
    const pixelPosition = this.editor.component.pixelPositionForMouseEvent(event);
    let row;
    try {
      row = this.editor.component.screenPositionForPixelPosition(pixelPosition).row;
    } catch {
      return null;
    }
    const column = Math.round(pixelPosition.left / this.editor.defaultCharWidth);
    return { row, column };
  },

  disableAtomicSoftTabs() {
    if (this.editor && this.atomicTabs === undefined) {
      this.atomicTabs = this.editor.hasAtomicSoftTabs();
      if (this.atomicTabs) this.editor.displayLayer.atomicSoftTabs = false;
    }
  },

  restoreAtomicSoftTabs() {
    if (this.editor && this.atomicTabs !== undefined) {
      if (this.atomicTabs) this.editor.displayLayer.atomicSoftTabs = true;
      this.atomicTabs = undefined;
    }
  },

  mouseDown(event) {
    if (this.pickerFlag) {
      if (!this.findEditor(event)) return;
      this.disableAtomicSoftTabs();
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (this.stickyFlag && event.which === 1 && event.shiftKey) {
      if (!this.findEditor(event)) return;
      if (!this.mouseStart || this.editor.getSelections().length === 1) {
        this.saveSelections(true);
        this.mouseStart = this.editor.getLastCursor().getScreenPosition();
      }
      this.disableAtomicSoftTabs();
      this.selectBox(event);
      event.stopPropagation();
      return;
    }

    if (!this.shouldStartSelection(event) || !this.findEditor(event)) return;

    this.saveSelections(this.multiCursorOnClick && event.ctrlKey);
    this.dragging = true;
    this.lastMoveEvent = null;
    this.mouseEnd = null;
    this.disableAtomicSoftTabs();
    this.mouseStart = this.screenPositionForMouseEvent(event);
    if (!this.mouseStart) {
      this.restoreEditorPresentation();
      this.resetGesture();
      return;
    }
    this.autoscrollOnMouseDrag();
  },

  mouseUp(event) {
    if (this.pickerFlag) {
      this.finishPickerClick(event);
      return;
    }

    if (this.editor) {
      this.restoreEditorPresentation();
      this.resetGesture();
      event.preventDefault();
      event.stopPropagation();
    }
    this.dragging = false;
  },

  finishPickerClick(event) {
    if (!this.findEditor(event)) {
      this.togglePicker();
      return;
    }

    if (event.which === 1) {
      if (this.pickerFlag === 1) {
        this.saveSelections(this.multiCursorOnClick && event.ctrlKey);
        this.mouseEnd = this.screenPositionForMouseEvent(event);
        if (this.mouseEnd) this.selectBox();
        this.togglePicker();
      } else {
        this.pickerFlag = 1;
        this.mouseStart = this.screenPositionForMouseEvent(event);
      }
    } else if (event.which === 3) {
      this.context = true;
      this.togglePicker();
    }

    event.preventDefault();
    event.stopPropagation();
  },

  mouseMove(event) {
    if (!this.editor || this.pickerFlag) return;
    this.addSelectionClass();
    this.context = true;
    this.lastMoveEvent = event;
    this.selectBox(event);
    event.preventDefault();
    event.stopPropagation();
  },

  scrollEvent() {
    if (this.editor && !this.pickerFlag && this.lastMoveEvent) {
      this.selectBox(this.lastMoveEvent);
    }
  },

  autoscrollOnMouseDrag() {
    window.requestAnimationFrame(() => {
      if (!this.editor || !this.dragging) return;
      if (this.lastMoveEvent) {
        this.editor.component.autoscrollOnMouseDrag(this.lastMoveEvent);
      }
      this.autoscrollOnMouseDrag();
    });
  },

  contextMenu(event) {
    if (!this.context) return;
    this.context = false;
    event.preventDefault();
    event.stopPropagation();
  },

  selectBox(event) {
    if (!this.editor) return;
    if (event) {
      const nextPosition = this.screenPositionForMouseEvent(event);
      if (!nextPosition) return;
      if (
        this.mouseEnd &&
        nextPosition.row === this.mouseEnd.row &&
        nextPosition.column === this.mouseEnd.column
      ) {
        return;
      }
      this.mouseEnd = nextPosition;
    }
    if (!this.mouseStart || !this.mouseEnd) return;

    const ranges = this.rangesForBox(this.mouseStart, this.mouseEnd);
    if (!ranges.length) return;
    this.updateSelections(ranges, this.mouseEnd.column < this.mouseStart.column);
  },

  rangesForBox(start, end) {
    const zeroRanges = [];
    const realRanges = [];
    const reversed = end.column < start.column;
    const ascending = start.row <= end.row;

    for (let row = start.row; ascending ? row <= end.row : row >= end.row;) {
      const range = this.editor.bufferRangeForScreenRange([
        [row, start.column],
        [row, end.column],
      ]);
      if (!range.isEmpty()) {
        realRanges.push(range);
      } else {
        let pointStart = this.editor.screenPositionForBufferPosition(range.start);
        let pointEnd = this.editor.screenPositionForBufferPosition(range.end);
        if (reversed) [pointStart, pointEnd] = [pointEnd, pointStart];
        if (pointStart.column === start.column || pointEnd.column === end.column) {
          if (pointStart.column === 0 && pointEnd.column === 0) zeroRanges.push(range);
          else realRanges.push(range);
        }
      }
      ascending ? row++ : row--;
    }

    return realRanges.length ? realRanges : zeroRanges;
  },

  updateSelections(ranges, reversed) {
    const selections = this.editor.selections;
    const required = ranges.length + this.savedSelections.length;
    for (const selection of selections.slice(required)) selection.destroy();

    this.editor.mergeIntersectingSelections({}, () => {
      this.savedSelections.forEach((saved, index) => {
        if (selections[index]) {
          selections[index].setBufferRange(saved.range, { reversed: saved.reversed });
        } else {
          this.editor.addSelectionForBufferRange(saved.range, {
            reversed: saved.reversed,
          });
        }
      });
      ranges.forEach((range, index) => {
        const selection = selections[index + this.savedSelections.length];
        if (selection) selection.setBufferRange(range, { reversed });
        else this.editor.addSelectionForBufferRange(range, { reversed });
      });
    });
  },

  saveSelections(preserve) {
    this.savedSelections = preserve
      ? this.editor.selections.map((selection) => ({
          range: selection.getBufferRange(),
          reversed: selection.isReversed(),
        }))
      : [];
  },

  addSelectionClass() {
    if (!this.editor || this.selecting) return;
    this.selecting = true;
    this.editor.getElement().classList.add("column-selection");
  },

  removeSelectionClass() {
    if (!this.editor || !this.selecting) return;
    this.selecting = false;
    this.editor.getElement().classList.remove("column-selection");
  },

  restoreEditorPresentation() {
    if (!this.editor) return;
    this.removeSelectionClass();
    this.restoreAtomicSoftTabs();
  },

  resetGesture() {
    this.editor = null;
    this.mouseStart = null;
    this.mouseEnd = null;
    this.lastMoveEvent = null;
    this.savedSelections = [];
    this.dragging = false;
  },

  consumeStatusBar(statusBar) {
    this.statusBar = statusBar;
    if (atom.config.get("column-selection.statusBar")) this.activateStatusBar();
  },

  activateStatusBar() {
    if (!this.statusBar || this.switch) return;
    this.switch = this.createSwitch();
    this.switch.updateSticky();
    this.switch.updatePicker();
    this.statusBarTile = this.statusBar.addRightTile({
      item: this.switch,
      priority: -90,
    });
    this.tooltipDisposable = atom.tooltips.add(this.switch, {
      title: () => {
        if (this.pickerFlag) return "Picker mode is enabled";
        if (this.stickyFlag) return "Sticky column mode is enabled";
        return "Left click: Sticky | Right click: Picker";
      },
    });
  },

  deactivateStatusBar() {
    this.tooltipDisposable?.dispose();
    this.tooltipDisposable = null;
    this.statusBarTile?.destroy();
    this.statusBarTile = null;
    this.switch?.remove();
    this.switch = null;
  },

  createSwitch() {
    const element = document.createElement("div");
    element.classList.add("column-selection-icon", "inline-block");
    const icon = document.createElement("span");
    icon.classList.add("icon", "is-icon-only", "icon-three-bars");
    element.appendChild(icon);
    element.onmouseup = (event) => {
      if (event.which === 1) this.toggleSticky();
      else if (event.which === 3) this.togglePicker();
    };
    element.updateSticky = () => icon.classList.toggle("sticky", this.stickyFlag);
    element.updatePicker = () => icon.classList.toggle("picker", Boolean(this.pickerFlag));
    return element;
  },
};

function throttleWithAnimationFrame(callback) {
  let pending = false;
  return (...args) => {
    if (pending) return;
    callback(...args);
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
    });
  };
}
