const TabStop = require('./tab-stop')

class TabStopList {
  constructor (snippet) {
    this.snippet = snippet
    this.list = {}
  }

  get length () {
    return Object.keys(this.list).length
  }

  get hasEndStop () {
    return !!this.list[Infinity]
  }

  findOrCreate ({ index, snippet }) {
    if (!this.list[index]) {
      this.list[index] = new TabStop({ index, snippet })
    }
    return this.list[index]
  }

  forEachIndex (iterator) {
    let indices = Object.keys(this.list).sort((a1, a2) => a1 - a2)
    indices.forEach(iterator)
  }

  getInsertions () {
    let results = []
    this.forEachIndex(index => {
      results.push(...this.list[index].insertions)
    })
    return results
  }

  toArray () {
    let results = []
    this.forEachIndex(index => {
      let tabStop = this.list[index]
      if (!tabStop.isValid()) return
      results.push(tabStop)
    })
    return results
  }
}

module.exports = TabStopList
