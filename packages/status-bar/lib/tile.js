module.exports =
class Tile {
  constructor(item, priority, collection, { hideOnZero = false, reinsertFn = null, priorityConfig = null } = {}) {
    this.item = item;
    this.collection = collection;
    this.hideOnZero = hideOnZero;
    this.reinsert = reinsertFn;
    this.configDisposable = null;

    this.priorityConfig = priorityConfig;

    if (priorityConfig) {
      this.priority = atom.config.get(priorityConfig);
      this.configDisposable = atom.config.onDidChange(priorityConfig, ({newValue}) => {
        this.setPriority(newValue);
      });
    } else {
      this.priority = priority;
    }

    if (this.hideOnZero && this.priority === 0) {
      atom.views.getView(this.item).style.display = 'none';
    }
  }

  getItem() {
    return this.item;
  }

  getPriority() {
    if (this.priorityConfig) {
      return atom.config.get(this.priorityConfig);
    }
    return this.priority;
  }

  isVisible() {
    if (!this.hideOnZero) return true;
    return this.priority !== 0;
  }

  setPriority(newPriority) {
    if (!this.reinsert) return;
    if (newPriority === this.priority) return;

    const element = atom.views.getView(this.item);

    const idx = this.collection.indexOf(this);
    if (idx !== -1) this.collection.splice(idx, 1);
    element.remove();

    this.priority = newPriority;

    if (this.hideOnZero && newPriority === 0) {
      element.style.display = 'none';
    } else {
      element.style.display = '';
    }

    this.reinsert(this);
  }

  destroy() {
    this.configDisposable?.dispose();
    this.configDisposable = null;
    const idx = this.collection.indexOf(this);
    if (idx !== -1) this.collection.splice(idx, 1);
    atom.views.getView(this.item).remove();
  }
}
