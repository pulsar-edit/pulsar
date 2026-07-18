const {Patch} = require('@lumine-code/superstring')
const MarkerLayer = require('./marker-layer');
const {traversal} = require('./point-helpers');
const {patchFromChanges} = require('./helpers');

const SerializationVersion = 6;

class Checkpoint {
  constructor(id, snapshot, isBarrier) {
    this.id = id;
    this.snapshot = snapshot;
    this.isBarrier = isBarrier;
    if (this.snapshot == null) {
      global.atom?.assert(false, "Checkpoint created without snapshot");
      this.snapshot = {};
    }
  }
}

class Transaction {
  constructor(markerSnapshotBefore, patch, markerSnapshotAfter, groupingInterval=0) {
    this.markerSnapshotBefore = markerSnapshotBefore;
    this.patch = patch;
    this.markerSnapshotAfter = markerSnapshotAfter;
    this.groupingInterval = groupingInterval;
    this.timestamp = Date.now();
  }

  shouldGroupWith(previousTransaction) {
    const timeBetweenTransactions = this.timestamp - previousTransaction.timestamp;
    return timeBetweenTransactions < Math.min(this.groupingInterval, previousTransaction.groupingInterval);
  }

  groupWith(previousTransaction) {
    return new Transaction(
      previousTransaction.markerSnapshotBefore,
      Patch.compose([previousTransaction.patch, this.patch]),
      this.markerSnapshotAfter,
      this.groupingInterval
    );
  }
}

// Manages undo/redo for {TextBuffer}
class DefaultHistoryProvider {
  constructor(buffer) {
    this.buffer = buffer;
    this.maxUndoEntries = this.buffer.maxUndoEntries;
    this.nextCheckpointId = 1;
    this.undoStack = [];
    this.redoStack = [];
  }

  createCheckpoint(options) {
    const checkpoint = new Checkpoint(this.nextCheckpointId++, options?.markers, options?.isBarrier);
    this.undoStack.push(checkpoint);
    return checkpoint.id;
  }

  groupChangesSinceCheckpoint(checkpointId, options) {
    const deleteCheckpoint = options?.deleteCheckpoint ?? false;
    const markerSnapshotAfter = options?.markers;
    let checkpointIndex = null;
    let markerSnapshotBefore = null;
    const patchesSinceCheckpoint = [];

    for (let i = this.undoStack.length - 1; i >= 0; i--) {
      const entry = this.undoStack[i];
      if (checkpointIndex != null) { break; }

      switch (entry.constructor) {
        case Checkpoint:
          if (entry.id === checkpointId) {
            checkpointIndex = i;
            markerSnapshotBefore = entry.snapshot;
          } else if (entry.isBarrier) {
            return false;
          }
          break;
        case Transaction:
          patchesSinceCheckpoint.unshift(entry.patch);
          break;
        case Patch:
          patchesSinceCheckpoint.unshift(entry);
          break;
        default:
          throw new Error(`Unexpected undo stack entry type: ${entry.constructor.name}`);
      }
    }

    if (checkpointIndex != null) {
      const composedPatches = Patch.compose(patchesSinceCheckpoint);
      if (patchesSinceCheckpoint.length > 0) {
        this.undoStack.splice(checkpointIndex + 1);
        this.undoStack.push(new Transaction(markerSnapshotBefore, composedPatches, markerSnapshotAfter));
      }
      if (deleteCheckpoint) {
        this.undoStack.splice(checkpointIndex, 1);
      }
      return composedPatches.getChanges();
    } else {
      return false;
    }
  }

  getChangesSinceCheckpoint(checkpointId) {
    let checkpointIndex = null;
    const patchesSinceCheckpoint = [];

    for (let i = this.undoStack.length - 1; i >= 0; i--) {
      const entry = this.undoStack[i];
      if (checkpointIndex != null) { break; }

      switch (entry.constructor) {
        case Checkpoint:
          if (entry.id === checkpointId) {
            checkpointIndex = i;
          }
          break;
        case Transaction:
          patchesSinceCheckpoint.unshift(entry.patch);
          break;
        case Patch:
          patchesSinceCheckpoint.unshift(entry);
          break;
        default:
          throw new Error(`Unexpected undo stack entry type: ${entry.constructor.name}`);
      }
    }

    if (checkpointIndex != null) {
      return Patch.compose(patchesSinceCheckpoint).getChanges();
    } else {
      return null;
    }
  }

  groupLastChanges() {
    let markerSnapshotAfter = null;
    let markerSnapshotBefore = null;
    const patchesSinceCheckpoint = [];

    for (let i = this.undoStack.length - 1; i >= 0; i--) {
      const entry = this.undoStack[i];
      switch (entry.constructor) {
        case Checkpoint:
          if (entry.isBarrier) { return false; }
          break;
        case Transaction:
          if (patchesSinceCheckpoint.length === 0) {
            ({
              markerSnapshotAfter
            } = entry);
          } else if (patchesSinceCheckpoint.length === 1) {
            ({
              markerSnapshotBefore
            } = entry);
          }
          patchesSinceCheckpoint.unshift(entry.patch);
          break;
        case Patch:
          patchesSinceCheckpoint.unshift(entry);
          break;
        default:
          throw new Error(`Unexpected undo stack entry type: ${entry.constructor.name}`);
      }

      if (patchesSinceCheckpoint.length === 2) {
        const composedPatch = Patch.compose(patchesSinceCheckpoint);
        this.undoStack.splice(i);
        this.undoStack.push(new Transaction(markerSnapshotBefore, composedPatch, markerSnapshotAfter));
        return true;
      }
    }
  }

  enforceUndoStackSizeLimit() {
    if (this.undoStack.length > this.maxUndoEntries) {
      this.undoStack.splice(0, this.undoStack.length - this.maxUndoEntries);
    }
  }

  applyGroupingInterval(groupingInterval) {
    const topEntry = this.undoStack[this.undoStack.length - 1];
    const previousEntry = this.undoStack[this.undoStack.length - 2];

    if (topEntry instanceof Transaction) {
      topEntry.groupingInterval = groupingInterval;
    } else {
      return;
    }

    if (groupingInterval === 0) { return; }

    if (previousEntry instanceof Transaction && topEntry.shouldGroupWith(previousEntry)) {
      this.undoStack.splice(this.undoStack.length - 2, 2, topEntry.groupWith(previousEntry));
    }
  }

  pushChange({newStart, oldExtent, newExtent, oldText, newText}) {
    const patch = new Patch;
    patch.splice(newStart, oldExtent, newExtent, oldText, newText);
    this.pushPatch(patch);
  }

  pushPatch(patch) {
    this.undoStack.push(patch);
    this.clearRedoStack();
  }

  undo() {
    let snapshotBelow = null;
    let patch = null;
    let spliceIndex = null;

    for (let i = this.undoStack.length - 1; i >= 0; i--) {
      const entry = this.undoStack[i];
      if (spliceIndex != null) { break; }

      switch (entry.constructor) {
        case Checkpoint:
          if (entry.isBarrier) {
            return false;
          }
          break;
        case Transaction:
          snapshotBelow = entry.markerSnapshotBefore;
          patch = entry.patch.invert();
          spliceIndex = i;
          break;
        case Patch:
          patch = entry.invert();
          spliceIndex = i;
          break;
        default:
          throw new Error(`Unexpected entry type when popping undoStack: ${entry.constructor.name}`);
      }
    }

    if (spliceIndex != null) {
      // This feels strange, but what it actually does is remove N elements
      // from the undo stack in place (as is expected)… and then the `reverse`
      // is applied to the items that were removed from the stack. That's
      // appropriate, since they're suppopsed to flip their order when going
      // onto the redo stack.
      this.redoStack.push(...this.undoStack.splice(spliceIndex).reverse() || []);
      return {
        textUpdates: patch.getChanges(),
        markers: snapshotBelow
      };
    } else {
      return false;
    }
  }

  redo() {
    let snapshotBelow = null;
    let patch = null;
    let spliceIndex = null;

    for (let i = this.redoStack.length - 1; i >= 0; i--) {
      const entry = this.redoStack[i];
      if (spliceIndex != null) { break; }

      switch (entry.constructor) {
        case Checkpoint:
          if (entry.isBarrier) {
            throw new Error("Invalid redo stack state");
          }
          break;
        case Transaction:
          snapshotBelow = entry.markerSnapshotAfter;
          ({
            patch
          } = entry);
          spliceIndex = i;
          break;
        case Patch:
          patch = entry;
          spliceIndex = i;
          break;
        default:
          throw new Error(`Unexpected entry type when popping redoStack: ${entry.constructor.name}`);
      }
    }

    while (this.redoStack[spliceIndex - 1] instanceof Checkpoint) {
      spliceIndex--;
    }

    if (spliceIndex != null) {
      // This feels strange, but what it actually does is remove N elements
      // from the redo stack in place (as is expected)… and then the `reverse`
      // is applied to the items that were removed from the stack. That's
      // appropriate, since they're suppopsed to flip their order when going
      // onto the undo stack.
      this.undoStack.push(...this.redoStack.splice(spliceIndex).reverse() || []);
      return {
        textUpdates: patch.getChanges(),
        markers: snapshotBelow
      };
    } else {
      return false;
    }
  }

  revertToCheckpoint(checkpointId) {
    let snapshotBelow = null;
    let spliceIndex = null;
    const patchesSinceCheckpoint = [];

    for (let i = this.undoStack.length - 1; i >= 0; i--) {
      const entry = this.undoStack[i];
      if (spliceIndex != null) { break; }

      switch (entry.constructor) {
        case Checkpoint:
          if (entry.id === checkpointId) {
            snapshotBelow = entry.snapshot;
            spliceIndex = i;
          } else if (entry.isBarrier) {
            return false;
          }
          break;
        case Transaction:
          patchesSinceCheckpoint.push(entry.patch.invert());
          break;
        default:
          patchesSinceCheckpoint.push(entry.invert());
      }
    }

    if (spliceIndex != null) {
      this.undoStack.splice(spliceIndex);
      return {
        textUpdates: Patch.compose(patchesSinceCheckpoint).getChanges(),
        markers: snapshotBelow
      };
    } else {
      return false;
    }
  }

  clear() {
    this.clearUndoStack();
    this.clearRedoStack();
  }

  clearUndoStack() {
    this.undoStack.length = 0;
  }

  clearRedoStack() {
    this.redoStack.length = 0;
  }

  toString() {
    let output = '';
    for (let entry of this.undoStack) {
      switch (entry.constructor) {
        case Checkpoint:
          output += "Checkpoint, ";
          break;
        case Transaction:
          output += "Transaction, ";
          break;
        case Patch:
          output += "Patch, ";
          break;
        default:
          output += `Unknown {${JSON.stringify(entry)}}, `;
      }
    }
    return '[' + output.slice(0, -2) + ']';
  }

  serialize(options) {
    return {
      version: SerializationVersion,
      nextCheckpointId: this.nextCheckpointId,
      undoStack: this.serializeStack(this.undoStack, options),
      redoStack: this.serializeStack(this.redoStack, options),
      maxUndoEntries: this.maxUndoEntries
    };
  }

  deserialize(state) {
    if (state.version !== SerializationVersion) { return; }
    this.nextCheckpointId = state.nextCheckpointId;
    this.maxUndoEntries = state.maxUndoEntries;
    this.undoStack = this.deserializeStack(state.undoStack);
    this.redoStack = this.deserializeStack(state.redoStack);
  }

  getSnapshot(maxEntries) {
    let entry;
    const undoStackPatches = [];
    const undoStack = [];
    for (let i = this.undoStack.length - 1; i >= 0; i--) {
      entry = this.undoStack[i];
      switch (entry.constructor) {
        case Checkpoint:
          undoStack.unshift(snapshotFromCheckpoint(entry));
          break;
        case Transaction:
          undoStack.unshift(snapshotFromTransaction(entry));
          undoStackPatches.unshift(entry.patch);
          break;
      }

      if (undoStack.length === maxEntries) { break; }
    }

    const redoStack = [];
    for (let j = this.redoStack.length - 1; j >= 0; j--) {
      entry = this.redoStack[j];
      switch (entry.constructor) {
        case Checkpoint:
          redoStack.unshift(snapshotFromCheckpoint(entry));
          break;
        case Transaction:
          redoStack.unshift(snapshotFromTransaction(entry));
          break;
      }

      if (redoStack.length === maxEntries) { break; }
    }

    return {
      nextCheckpointId: this.nextCheckpointId,
      undoStackChanges: Patch.compose(undoStackPatches).getChanges(),
      undoStack,
      redoStack
    };
  }

  restoreFromSnapshot({nextCheckpointId, undoStack, redoStack}) {
    this.nextCheckpointId = nextCheckpointId;
    this.undoStack = undoStack.map(function(entry) {
      switch (entry.type) {
        case 'transaction':
          return transactionFromSnapshot(entry);
        case 'checkpoint':
          return checkpointFromSnapshot(entry);
      }
    });

    return this.redoStack = redoStack.map(function(entry) {
      switch (entry.type) {
        case 'transaction':
          return transactionFromSnapshot(entry);
        case 'checkpoint':
          return checkpointFromSnapshot(entry);
      }
    });
  }

  /*
  Section: Private
  */

  getCheckpointIndex(checkpointId) {
    for (let i = this.undoStack.length - 1; i >= 0; i--) {
      const entry = this.undoStack[i];
      if (entry instanceof Checkpoint && (entry.id === checkpointId)) {
        return i;
      }
    }
    return null;
  }

  serializeStack(stack, options) {
    const result = [];
    for (let entry of stack) {
      switch (entry.constructor) {
        case Checkpoint:
          result.push({
            type: 'checkpoint',
            id: entry.id,
            snapshot: this.serializeSnapshot(entry.snapshot, options),
            isBarrier: entry.isBarrier
          });
          break;
        case Transaction:
          result.push({
            type: 'transaction',
            markerSnapshotBefore: this.serializeSnapshot(entry.markerSnapshotBefore, options),
            markerSnapshotAfter: this.serializeSnapshot(entry.markerSnapshotAfter, options),
            patch: entry.patch.serialize().toString('base64')
          });
          break;
        case Patch:
          result.push({
            type: 'patch',
            data: entry.serialize().toString('base64')
          });
          break;
        default:
          throw new Error(`Unexpected undoStack entry type during serialization: ${entry.constructor.name}`);
      }
    }
    return result;
  }

  deserializeStack(stack) {
    let result = [];
    for (let entry of stack) {
      switch (entry.type) {
        case 'checkpoint':
          result.push(new Checkpoint(
            entry.id,
            MarkerLayer.deserializeSnapshot(entry.snapshot),
            entry.isBarrier
          ));
          break;
        case 'transaction':
          result.push(new Transaction(
            MarkerLayer.deserializeSnapshot(entry.markerSnapshotBefore),
            Patch.deserialize(Buffer.from(entry.patch, 'base64')),
            MarkerLayer.deserializeSnapshot(entry.markerSnapshotAfter)
          ));
          break;
        case 'patch':
          result.push(Patch.deserialize(Buffer.from(entry.data, 'base64')));
          break;
        default:
          throw new Error(`Unexpected undoStack entry type during deserialization: ${entry.type}`);
      }
    }
    return result;
  }

  serializeSnapshot(snapshot, options) {
    if (!options.markerLayers) { return; }

    const serializedLayerSnapshots = {};
    for (let layerId in snapshot) {
      const layerSnapshot = snapshot[layerId];
      if (!this.buffer.getMarkerLayer(layerId)?.persistent) { continue; }
      const serializedMarkerSnapshots = {};
      for (let markerId in layerSnapshot) {
        const markerSnapshot = layerSnapshot[markerId];
        const serializedMarkerSnapshot = Object.assign({}, markerSnapshot);
        delete serializedMarkerSnapshot.marker;
        serializedMarkerSnapshots[markerId] = serializedMarkerSnapshot;
      }
      serializedLayerSnapshots[layerId] = serializedMarkerSnapshots;
    }
    return serializedLayerSnapshots;
  }
}

function snapshotFromCheckpoint(checkpoint) {
  return {
    type: 'checkpoint',
    id: checkpoint.id,
    markers: checkpoint.snapshot
  };
}

function checkpointFromSnapshot ({id, markers}) {
  return new Checkpoint(id, markers, false);
}

function snapshotFromTransaction (transaction) {
  const changes = [];
  const iterable = transaction.patch.getChanges();
  for (let i = 0; i < iterable.length; i++) {
    const change = iterable[i];
    changes.push({
      oldStart: change.oldStart,
      oldEnd: change.oldEnd,
      newStart: change.newStart,
      newEnd: change.newEnd,
      oldText: change.oldText,
      newText: change.newText
    });
  }

  return {
    type: 'transaction',
    changes,
    markersBefore: transaction.markerSnapshotBefore,
    markersAfter: transaction.markerSnapshotAfter
  };
}

function transactionFromSnapshot ({changes, markersBefore, markersAfter}) {
  // TODO: Return raw patch if there's no markersBefore && markersAfter
  return new Transaction(markersBefore, patchFromChanges(changes), markersAfter);
}

module.exports = DefaultHistoryProvider;
