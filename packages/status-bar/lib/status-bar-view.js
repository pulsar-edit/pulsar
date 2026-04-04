const Tile = require('./tile');

module.exports =
class StatusBarView {
  constructor() {
    this.element = document.createElement('status-bar');
    this.element.classList.add('status-bar');

    const flexboxHackElement = document.createElement('div');
    flexboxHackElement.classList.add('flexbox-repaint-hack');
    this.element.appendChild(flexboxHackElement);

    this.leftPanel = document.createElement('div');
    this.leftPanel.classList.add('status-bar-left');
    flexboxHackElement.appendChild(this.leftPanel);
    this.element.leftPanel = this.leftPanel;

    this.rightPanel = document.createElement('div');
    this.rightPanel.classList.add('status-bar-right');
    flexboxHackElement.appendChild(this.rightPanel);
    this.element.rightPanel = this.rightPanel;

    this.leftTiles = [];
    this.rightTiles = [];

    this.element.getLeftTiles = this.getLeftTiles.bind(this);
    this.element.getRightTiles = this.getRightTiles.bind(this);
    this.element.addLeftTile = this.addLeftTile.bind(this);
    this.element.addRightTile = this.addRightTile.bind(this);

    this.bufferSubscriptions = [];

    this.activeItemSubscription = atom.workspace.getCenter().onDidChangeActivePaneItem(() => {
      this.unsubscribeAllFromBuffer();
      this.storeActiveBuffer();
      this.subscribeAllToBuffer();

     this.element.dispatchEvent(new CustomEvent('active-buffer-changed', {bubbles: true}));
    });

    this.storeActiveBuffer();
  }

  destroy() {
    this.activeItemSubscription.dispose();
    this.unsubscribeAllFromBuffer();
    this.element.remove();
  }

  insertLeftTile(tile) {
    let index = this.leftTiles.findIndex(t => t.priority < tile.priority);
    if (index === -1) index = this.leftTiles.length;
    this.leftTiles.splice(index, 0, tile);
    const newElement = atom.views.getView(tile.item);
    const nextElement = this.leftPanel.children[index];
    this.leftPanel.insertBefore(newElement, nextElement);
  }

  insertRightTile(tile) {
    let index = this.rightTiles.findIndex(t => t.priority < tile.priority);
    if (index === -1) index = this.rightTiles.length;
    this.rightTiles.splice(index, 0, tile);
    const newElement = atom.views.getView(tile.item);
    const nextElement = this.rightPanel.children[index];
    this.rightPanel.insertBefore(newElement, nextElement);
  }

  addLeftTile(options) {
    const newItem = options.item;
    const newPriority = options?.priority != null ? -options.priority : this.leftTiles[this.leftTiles.length - 1].priority - 1;
    const newTile = new Tile(newItem, newPriority, this.leftTiles);
    this.insertLeftTile(newTile);
    return newTile;
  }

  addRightTile(options) {
    const newItem = options.item;
    const newPriority = options?.priority != null ? options?.priority : this.rightTiles[0].priority + 1;
    const newTile = new Tile(newItem, newPriority, this.rightTiles);
    this.insertRightTile(newTile);
    return newTile;
  }

  insertTileV2(tile) {
    if (tile.priority === 0) return;

    const isLeft = tile.priority < 0;
    const tiles = isLeft ? this.leftTiles : this.rightTiles;
    const panel = isLeft ? this.leftPanel : this.rightPanel;

    tile.collection = tiles;

    let index = tiles.findIndex(t => t.priority < tile.priority);
    if (index === -1) index = tiles.length;
    tiles.splice(index, 0, tile);
    panel.insertBefore(atom.views.getView(tile.item), panel.children[index]);
  }

  addTile(options) {
    const reinsert = (tile) => this.insertTileV2(tile);
    const newTile = new Tile(options.item, options?.priority ?? 0, this.leftTiles, {
      hideOnZero: true,
      reinsertFn: reinsert,
      priorityConfig: options?.priorityConfig
    });
    this.insertTileV2(newTile);
    return newTile;
  }

  getLeftTiles() {
    return this.leftTiles;
  }

  getRightTiles() {
    return this.rightTiles;
  }

  getTiles() {
    return [...this.leftTiles, ...this.rightTiles];
  }

  getActiveBuffer() {
    return this.buffer;
  }

  getActiveItem() {
    return atom.workspace.getCenter().getActivePaneItem();
  }

  storeActiveBuffer() {
    this.buffer = this.getActiveItem()?.getBuffer?.();
  }

  subscribeToBuffer(event, callback) {
    this.bufferSubscriptions.push([event, callback]);
    if (this.buffer) { return this.buffer.on(event, callback); }
  }

  subscribeAllToBuffer() {
    if (!this.buffer) { return; }

    const result = [];

    for (let [event, callback] of this.bufferSubscriptions) {
      result.push(this.buffer.on(event, callback));
    }

    return result;
  }

  unsubscribeAllFromBuffer() {
    if (!this.buffer) { return; }

    const result = [];

    for (let [event, callback] of this.bufferSubscriptions) {
      result.push(this.buffer.off(event, callback));
    }

    return result;
  }
}
