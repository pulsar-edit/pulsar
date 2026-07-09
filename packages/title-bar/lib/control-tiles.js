class Tile {
  constructor(item, priority, tiles) {
    this.item = item;
    this.priority = priority;
    this.tiles = tiles;
  }

  getPriority() {
    return this.priority;
  }

  getItem() {
    return this.item;
  }

  destroy() {
    this.tiles.splice(this.tiles.indexOf(this), 1);
    this.item.remove();
  }
}

class ControlTiles {
  constructor(element) {
    this.element = element;
    this.tiles = [];
  }

  addItem(options) {
    const { item, priority = 0 } = options;
    const tile = new Tile(item, priority, this.tiles);

    // Find insertion index
    let index = 0;
    let nextElement = null;
    for (; index < this.tiles.length; index++) {
      if (this.tiles[index].priority > priority) {
        nextElement = this.tiles[index].item;
        break;
      }
    }

    this.tiles.splice(index, 0, tile);
    this.element.insertBefore(item, nextElement);
    return tile;
  }

  getTiles() {
    return this.tiles.slice();
  }

  destroy() {
    while (this.tiles.length > 0) {
      this.tiles[0].destroy();
    }
  }
}

module.exports = { ControlTiles, Tile };
