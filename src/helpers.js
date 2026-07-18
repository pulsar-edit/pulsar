const {Patch} = require('@lumine-code/superstring')
const Range = require('./range')
const {traversal} = require('./point-helpers')

const LF_REGEX = /\n/g

exports.newlineRegex = /\r\n|\n|\r/g

exports.debounce = function debounce (fn, wait) {
  let timestamp, timeout

  function later () {
    const last = Date.now() - timestamp
    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last)
    } else {
      timeout = null
      fn()
    }
  }

  return function () {
    timestamp = Date.now()
    if (!timeout) timeout = setTimeout(later, wait)
  }
}

exports.spliceArray = function spliceArray(array, start, removedCount, insertedItems = []) {
  const oldLength = array.length
  const insertedCount = insertedItems.length
  removedCount = Math.min(removedCount, oldLength - start)
  const lengthDelta = insertedCount - removedCount
  const newLength = oldLength + lengthDelta

  if (lengthDelta > 0) {
    array.length = newLength
    for (let i = newLength - 1, end = start + insertedCount; i >= end; i--) {
      array[i] = array[i - lengthDelta]
    }
  } else if (lengthDelta < 0) {
    for (let i = start + insertedCount, end = newLength; i < end; i++) {
      array[i] = array[i - lengthDelta]
    }
    array.length = newLength
  }

  for (let i = 0; i < insertedItems.length; i++) {
    array[start + i] = insertedItems[i]
  }
}

exports.patchFromChanges = function patchFromChanges(changes) {
  const patch = new Patch()
  for (let i = 0; i < changes.length; i++) {
    const {oldStart, oldEnd, oldText, newStart, newEnd, newText} = changes[i]
    const oldExtent = traversal(oldEnd, oldStart)
    const newExtent = traversal(newEnd, newStart)
    patch.splice(newStart, oldExtent, newExtent, oldText, newText)
  }
  return patch
}

exports.normalizePatchChanges = function normalizePatchChanges(changes) {
  return changes.map((change) =>
    new TextChange(
      Range(change.oldStart, change.oldEnd),
      Range(change.newStart, change.newEnd),
      change.oldText, change.newText
    )
  )
}

exports.extentForText = function extentForText(text) {
  let lastLineStartIndex = 0
  let row = 0
  LF_REGEX.lastIndex = 0
  while (LF_REGEX.exec(text)) {
    row++
    lastLineStartIndex = LF_REGEX.lastIndex
  }
  return {row, column: text.length - lastLineStartIndex}
}

class TextChange {
  constructor (oldRange, newRange, oldText, newText) {
    this.oldRange = oldRange
    this.newRange = newRange
    this.oldText = oldText
    this.newText = newText
  }

  isEqual (other) {
    return (
      this.oldRange.isEqual(other.oldRange) &&
      this.newRange.isEqual(other.newRange) &&
      this.oldText === other.oldText &&
      this.newText === other.newText
    )
  }
}

Object.defineProperty(TextChange.prototype, 'start', {
  get () { return this.newRange.start },
  enumerable: false
})

Object.defineProperty(TextChange.prototype, 'oldStart', {
  get () { return this.oldRange.start },
  enumerable: false
})

Object.defineProperty(TextChange.prototype, 'newStart', {
  get () { return this.newRange.start },
  enumerable: false
})

Object.defineProperty(TextChange.prototype, 'oldEnd', {
  get () { return this.oldRange.end },
  enumerable: false
})

Object.defineProperty(TextChange.prototype, 'newEnd', {
  get () { return this.newRange.end },
  enumerable: false
})

Object.defineProperty(TextChange.prototype, 'oldExtent', {
  get () { return this.oldRange.getExtent() },
  enumerable: false
})

Object.defineProperty(TextChange.prototype, 'newExtent', {
  get () { return this.newRange.getExtent() },
  enumerable: false
})
