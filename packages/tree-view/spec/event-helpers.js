
module.exports.buildInternalDragEvents = function(dragged, enterTarget, dropTarget, treeView, copy) {
  if (copy == null) { copy = false; }
  const dataTransfer = {
    data: {},
    setData(key, value) { return this.data[key] = `${value}`; }, // Drag events stringify data values
    getData(key) { return this.data[key]; },
    clearData(key) {
      if (key) {
        return delete this.data[key];
      } else {
        return this.data = {};
      }
    },
    setDragImage(image) { this.image = image; }
  };

  Object.defineProperty(
    dataTransfer,
    'items', {
    get() {
      return Object.keys(dataTransfer.data).map(key => ({
        type: key
      }));
    }
  }
  );

  treeView.deselect();
  for (let entry of Array.from(dragged)) {
    treeView.selectMultipleEntries(entry);
  }

  const dragStartEvent = new DragEvent('dragstart');
  Object.defineProperty(dragStartEvent, 'target', {value: dragged[0]});
  Object.defineProperty(dragStartEvent, 'currentTarget', {value: dragged[0]});
  Object.defineProperty(dragStartEvent, 'dataTransfer', {value: dataTransfer});

  const dropEvent = new DragEvent('drop');
  Object.defineProperty(dropEvent, 'target', {value: dropTarget});
  Object.defineProperty(dropEvent, 'currentTarget', {value: dropTarget});
  Object.defineProperty(dropEvent, 'dataTransfer', {value: dataTransfer});
  if (copy) {
    const key = process.platform === 'darwin' ? 'metaKey' : 'ctrlKey';
    Object.defineProperty(dropEvent, key, {value: true});
  }

  const dragEnterEvent = new DragEvent('dragenter');
  Object.defineProperty(dragEnterEvent, 'target', {value: enterTarget});
  Object.defineProperty(dragEnterEvent, 'currentTarget', {value: enterTarget});
  Object.defineProperty(dragEnterEvent, 'dataTransfer', {value: dataTransfer});

  return [dragStartEvent, dragEnterEvent, dropEvent];
};

module.exports.buildExternalDropEvent = function(filePaths, dropTarget, copy) {
  if (copy == null) { copy = false; }
  const dataTransfer = {
    data: {},
    setData(key, value) { return this.data[key] = `${value}`; }, // Drag events stringify data values
    getData(key) { return this.data[key]; },
    clearData(key) {
      if (key) {
        return delete this.data[key];
      } else {
        return this.data = {};
      }
    },
    files: []
  };

  Object.defineProperty(
    dataTransfer,
    'items', {
    get() {
      return Object.keys(dataTransfer.data).map(key => ({
        type: key,
        kind: 'file'
      }));
    }
  }
  );

  const dropEvent = new DragEvent('drop');
  Object.defineProperty(dropEvent, 'target', {value: dropTarget});
  Object.defineProperty(dropEvent, 'currentTarget', {value: dropTarget});
  Object.defineProperty(dropEvent, 'dataTransfer', {value: dataTransfer});
  if (copy) {
    const key = process.platform === 'darwin' ? 'metaKey' : 'ctrlKey';
    Object.defineProperty(dropEvent, key, {value: true});
  }

  for (let filePath of Array.from(filePaths)) {
    dropEvent.dataTransfer.files.push({path: filePath});
    dropEvent.dataTransfer.setData(filePath, 'bla');
  } // Not technically correct, but gets the job done

  return dropEvent;
};

const buildElementPositionalDragEvents = function(el, dataTransfer, currentTargetSelector) {
  if ((el == null)) {
    return {};
  }

  const currentTarget = currentTargetSelector ? el.closest(currentTargetSelector) : el;

  const topEvent = new DragEvent('dragover');
  Object.defineProperty(topEvent, 'target', {value: el});
  Object.defineProperty(topEvent, 'currentTarget', {value: currentTarget});
  Object.defineProperty(topEvent, 'dataTransfer', {value: dataTransfer});
  Object.defineProperty(topEvent, 'pageY', {value: el.getBoundingClientRect().top});

  const middleEvent = new DragEvent('dragover');
  Object.defineProperty(middleEvent, 'target', {value: el});
  Object.defineProperty(middleEvent, 'currentTarget', {value: currentTarget});
  Object.defineProperty(middleEvent, 'dataTransfer', {value: dataTransfer});
  Object.defineProperty(middleEvent, 'pageY', {value: el.getBoundingClientRect().top + (el.offsetHeight * 0.5)});

  const bottomEvent = new DragEvent('dragover');
  Object.defineProperty(bottomEvent, 'target', {value: el});
  Object.defineProperty(bottomEvent, 'currentTarget', {value: currentTarget});
  Object.defineProperty(bottomEvent, 'dataTransfer', {value: dataTransfer});
  Object.defineProperty(bottomEvent, 'pageY', {value: el.getBoundingClientRect().bottom});

  return {top: topEvent, middle: middleEvent, bottom: bottomEvent};
};


module.exports.buildPositionalDragEvents = function(dragged, target, currentTargetSelector) {
  const dataTransfer = {
    data: {},
    setData(key, value) { return this.data[key] = `${value}`; }, // Drag events stringify data values
    getData(key) { return this.data[key]; },
    clearData(key) {
      if (key) {
        return delete this.data[key];
      } else {
        return this.data = {};
      }
    },
    setDragImage(image) { this.image = image; }
  };

  Object.defineProperty(
    dataTransfer,
    'items', {
    get() {
      return Object.keys(dataTransfer.data).map(key => ({
        type: key
      }));
    }
  }
  );

  const dragStartEvent = new DragEvent('dragstart');
  Object.defineProperty(dragStartEvent, 'target', {value: dragged});
  Object.defineProperty(dragStartEvent, 'currentTarget', {value: dragged});
  Object.defineProperty(dragStartEvent, 'dataTransfer', {value: dataTransfer});

  const dragEndEvent = new DragEvent('dragend');
  Object.defineProperty(dragEndEvent, 'target', {value: dragged});
  Object.defineProperty(dragEndEvent, 'currentTarget', {value: dragged});
  Object.defineProperty(dragEndEvent, 'dataTransfer', {value: dataTransfer});

  return [dragStartEvent, buildElementPositionalDragEvents(target, dataTransfer, currentTargetSelector), dragEndEvent];
};
