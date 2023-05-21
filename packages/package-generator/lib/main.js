const PackageGeneratorView = require('./package-generator-view')

module.exports = {
  activate () {
    this.view = new PackageGeneratorView()
  },

  deactivate () {
    if (this.view) this.view.destroy()
  }
}
