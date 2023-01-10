const path = require('path')
const ImageEditor = require('./image-editor')
const {CompositeDisposable} = require('atom')

// Files with these extensions will be opened as images
const imageExtensions = ['.bmp', '.gif', '.ico', '.jpeg', '.jpg', '.png', '.webp']

module.exports = {
  config: {
    defaultBackgroundColor: {
      type: 'string',
      enum: ['white', 'black', 'transparent'],
      default: 'transparent'
    }
  },

  activate () {
    this.imageEditorStatusView = null
    this.disposables = new CompositeDisposable()
    this.disposables.add(atom.workspace.addOpener(uri => {
      const uriExtension = path.extname(uri).toLowerCase()
      if (imageExtensions.includes(uriExtension)) {
        return new ImageEditor(uri)
      }
    }))
    this.disposables.add(atom.workspace.getCenter().onDidChangeActivePaneItem(() => this.attachImageEditorStatusView()))
  },

  deactivate () {
    if (this.imageEditorStatusView) {
      this.imageEditorStatusView.destroy()
    }
    this.disposables.dispose()
  },

  consumeStatusBar (statusBar) {
    this.statusBar = statusBar
    this.attachImageEditorStatusView()
  },

  attachImageEditorStatusView () {
    if (this.imageEditorStatusView || this.statusBar == null) {
      return
    }

    if (!(atom.workspace.getCenter().getActivePaneItem() instanceof ImageEditor)) {
      return
    }

    const ImageEditorStatusView = require('./image-editor-status-view')
    this.imageEditorStatusView = new ImageEditorStatusView(this.statusBar)
    this.imageEditorStatusView.attach()
  },

  deserialize (state) {
    return ImageEditor.deserialize(state)
  }
}
