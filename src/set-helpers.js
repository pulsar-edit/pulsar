function setEqual(a, b) {
  let next;
  if (a.size !== b.size) {
    return false;
  }
  const iterator = a.values();
  while (!(next = iterator.next()).done) {
    if (!b.has(next.value)) {
      return false;
    }
  }
  return true;
}

function subtractSet(set, valuesToRemove) {
  if (set.size > valuesToRemove.size) {
    for (let value of valuesToRemove) {
      set.delete(value);
    }
  } else {
    for (let value of set) {
      if (valuesToRemove.has(value)) {
        set.delete(value);
      }
    }
  }
}

function addSet(set, valuesToAdd) {
  for (let value of valuesToAdd) {
    set.add(value);
  }
}

function intersectSet(set, other) {
  for (let value of set) {
    if (!other.has(value)) {
      set.delete(value);
    }
  }
}

module.exports = { setEqual, subtractSet, addSet, intersectSet };
