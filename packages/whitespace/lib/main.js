const Whitespace = require('./whitespace')

module.exports = {
  activate () {
    this.whitespace = new Whitespace()
  },

  deactivate () {
    if (this.whitespace) this.whitespace.destroy()
    this.whitespace = null
  }
}
