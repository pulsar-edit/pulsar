const {Emitter} = require('atom')

module.exports =
class List {
  constructor (key) {
    this.key = key
    this.items = []
    this.emitter = new Emitter()
  }

  getItems () {
    return this.items
  }

  filterItems (filterFn) {
    const result = []
    for (const item of this.items) {
      if (filterFn(item)) {
        result.push(item)
      }
    }
    return result
  }

  keyForItem (item) {
    return item[this.key]
  }

  setItems (items) {
    items = items.slice()
    const setToAdd = difference(items, this.items, this.key)
    const setToRemove = difference(this.items, items, this.key)

    this.items = items

    for (const item of setToAdd) {
      this.emitter.emit('did-add-item', item)
    }

    for (const item of setToRemove) {
      this.emitter.emit('did-remove-item', item)
    }
  }

  onDidAddItem (callback) {
    return this.emitter.on('did-add-item', callback)
  }

  onDidRemoveItem (callback) {
    return this.emitter.on('did-remove-item', callback)
  }
}

const difference = (array1, array2, key) => {
  const obj1 = {}
  for (const item of array1) {
    obj1[item[key]] = item
  }

  const obj2 = {}
  for (const item of array2) {
    obj2[item[key]] = item
  }

  const diff = []
  for (const k in obj1) {
    const v = obj1[k]
    if (obj2[k] == null) diff.push(v)
  }
  return diff
}
