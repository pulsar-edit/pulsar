const {Range} = require('atom')
const Insertion = require('./insertion')

// A tab stop:
// * belongs to a snippet
// * has an index (one tab stop per index)
// * has multiple Insertions
class TabStop {
  constructor ({ snippet, index, insertions }) {
    this.insertions = insertions || []
    Object.assign(this, { snippet, index })
  }

  isValid () {
    let any = this.insertions.some(insertion => insertion.isTransformation())
    if (!any) return true
    let all = this.insertions.every(insertion => insertion.isTransformation())
    // If there are any transforming insertions, there must be at least one
    // non-transforming insertion to act as the primary.
    return !all
  }

  addInsertion ({ range, substitution, references }) {
    let insertion = new Insertion({ range, substitution, references })
    let insertions = this.insertions
    insertions.push(insertion)
    insertions = insertions.sort((i1, i2) => {
      return i1.range.start.compare(i2.range.start)
    })
    let initial = insertions.find(insertion => !insertion.isTransformation())
    if (initial) {
      insertions.splice(insertions.indexOf(initial), 1)
      insertions.unshift(initial)
    }
    this.insertions = insertions
  }

  copyWithIndent (indent) {
    let { snippet, index, insertions } = this
    let newInsertions = insertions.map(insertion => {
      let { range, substitution } = insertion
      let newRange = Range.fromObject(range, true)
      if (newRange.start.row) {
        newRange.start.column += indent.length
        newRange.end.column += indent.length
      }
      return new Insertion({
        range: newRange,
        substitution
      })
    })

    return new TabStop({
      snippet,
      index,
      insertions: newInsertions
    })
  }
}

module.exports = TabStop
