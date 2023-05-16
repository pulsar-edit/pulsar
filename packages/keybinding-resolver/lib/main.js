const {CompositeDisposable} = require('atom')

const KeyBindingResolverView = require('./keybinding-resolver-view')

const KEYBINDING_RESOLVER_URI = 'atom://keybinding-resolver'

module.exports = {
  activate () {
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(atom.workspace.addOpener(uri => {
      if (uri === KEYBINDING_RESOLVER_URI) {
        return new KeyBindingResolverView()
      }
    }))

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'key-binding-resolver:toggle': () => this.toggle()
    }))
  },

  deactivate () {
    this.subscriptions.dispose()
  },

  toggle () {
    atom.workspace.toggle(KEYBINDING_RESOLVER_URI)
  },

  deserializeKeyBindingResolverView (serialized) {
    return new KeyBindingResolverView()
  }
}
