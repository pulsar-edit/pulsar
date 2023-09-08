
module.exports =
class Tile {
  constructor(item, priority, collection) {
    this.item = item;
    this.priority = priority;
    this.collection = collection;
  }

  getItem() {
    return this.item;
  }

  getPriority() {
    return this.priority;
  }

  destroy() {
    this.collection.splice(this.collection.indexOf(this), 1);
    atom.views.getView(this.item).remove();
  }
}
