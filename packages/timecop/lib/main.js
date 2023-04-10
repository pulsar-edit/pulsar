const {CompositeDisposable} = require('atom')

let TimecopView = null
const ViewURI = 'atom://timecop'

module.exports = {
  activate () {
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.workspace.addOpener(filePath => {
      if (filePath === ViewURI) return this.createTimecopView({uri: ViewURI})
    }))

    this.subscriptions.add(atom.commands.add('atom-workspace', 'timecop:view', () => atom.workspace.open(ViewURI)))
  },

  deactivate () {
    this.subscriptions.dispose()
  },

  createTimecopView (state) {
    if (TimecopView == null) TimecopView = require('./timecop-view')
    return new TimecopView(state)
  }
}
