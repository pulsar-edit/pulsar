const {Disposable} = require('event-kit')
const Point = require('./point')

const EMPTY = []

module.exports =
class NullLanguageMode {
  bufferDidChange () {}
  bufferDidFinishTransaction () {}
  buildHighlightIterator () { return new NullHighlightIterator() }
  onDidChangeHighlighting () { return new Disposable(() => {}) }
  getLanguageId () { return null }
}

class NullHighlightIterator {
  seek (position) { return EMPTY }
  moveToSuccessor () { return false }
  getPosition () { return Point.INFINITY }
  getCloseTags () { return EMPTY }
  getOpenTags () { return EMPTY }
}
