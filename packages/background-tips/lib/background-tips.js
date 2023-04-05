const BackgroundTipsView = require('./background-tips-view')

module.exports = {
  activate () {
    this.backgroundTipsView = new BackgroundTipsView()
  },

  deactivate () {
    this.backgroundTipsView.destroy()
  }
}
