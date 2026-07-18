const fs = require('fs')
const path = require('path')

// Minimal file-backed data source for {TextBuffer}. It exposes only the slice
// of the old pathwatcher `File` surface that the buffer actually uses — path,
// base name, encoding, existence, and streams — and deliberately does **no**
// filesystem watching. Watching is owned by the buffer's host through
// `watchPath` (see `TextBuffer::subscribeToFile`).
//
// It is kept as its own class so that `TextBuffer`'s `instanceof File` fast
// paths (native `buffer.load(path)` / `buffer.save(path)`) still apply; a
// foreign data-source object falls back to the slower stream path instead.
module.exports = class File {
  constructor (filePath) {
    this.path = filePath
    this.encoding = 'utf8'
  }

  getPath () {
    return this.path
  }

  getBaseName () {
    return path.basename(this.path)
  }

  existsSync () {
    return fs.existsSync(this.path)
  }

  setEncoding (encoding) {
    this.encoding = encoding || 'utf8'
  }

  getEncoding () {
    return this.encoding
  }

  createReadStream () {
    return fs.createReadStream(this.path)
  }

  createWriteStream () {
    return fs.createWriteStream(this.path)
  }
}
