Set.prototype.jasmineToString = function() {
  return `Set {${[...this.values()].join(', ')}}`;
};

Set.prototype.isEqual = function(other) {
  if (other instanceof Set) {
    let next;
    if (this.size !== other.size) { return false; }
    const values = this.values();
    while (!(next = values.next()).done) {
      if (!other.has(next.value)) { return false; }
    }
    return true;
  } else {
    return false;
  }
};
