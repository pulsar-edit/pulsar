const {CompositeDisposable} = require('atom')
let StyleguideView = null

const STYLEGUIDE_URI = 'atom://styleguide'

module.exports = {
  activate () {
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.workspace.addOpener(filePath => {
      if (filePath === STYLEGUIDE_URI) return this.createStyleguideView({uri: STYLEGUIDE_URI})
    }))
    this.subscriptions.add(atom.commands.add('atom-workspace', 'styleguide:show', () => atom.workspace.open(STYLEGUIDE_URI))
    )
  },

  deactivate () {
    this.subscriptions.dispose()
  },

  createStyleguideView (state) {
    if (StyleguideView == null) StyleguideView = require('./styleguide-view')
    return new StyleguideView(state)
  }
}
