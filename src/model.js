var nextInstanceId = 1;

module.exports = class Model {

  static resetNextInstanceId() {
    nextInstanceId = 1;
  }

  constructor(params) {
    this.alive = true;
    this.assignId(params != null ? params.id : undefined);
  }

  assignId(id) {
    if (this.id == null) {
      this.id = id != null ? id : nextInstanceId++;
    }
    if (id >= nextInstanceId) {
      nextInstanceId = id + 1;
    }
  }

  destroy() {
    if (!this.isAlive()) {
      return;
    }
    this.alive = false;
    if (typeof this.destroyed === "function") {
      this.destroyed();
    }
  }

  isAlive() {
    return this.alive;
  }

  isDestroyed() {
    return !this.isAlive();
  }

};
