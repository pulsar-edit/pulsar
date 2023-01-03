const {CompositeDisposable} = require('atom')
const ImageEditor = require('./image-editor')
const ImageEditorView = require('./image-editor-view')
const bytes = require('bytes')

module.exports =
class ImageEditorStatusView {
  constructor (statusBar) {
    this.statusBar = statusBar
    this.disposables = new CompositeDisposable()

    this.element = document.createElement('div')
    this.element.classList.add('status-image', 'inline-block')

    this.imageSizeStatus = document.createElement('span')
    this.imageSizeStatus.classList.add('image-size')
    this.element.appendChild(this.imageSizeStatus)

    this.attach()

    this.disposables.add(atom.workspace.getCenter().onDidChangeActivePaneItem(() => { this.updateImageSize() }))
  }

  attach () {
    this.statusBarTile = this.statusBar.addLeftTile({item: this})
    this.updateImageSize()
  }

  destroy () {
    this.statusBarTile.destroy()
    this.disposables.dispose()
  }

  getImageSize ({originalHeight, originalWidth, imageSize}) {
    this.imageSizeStatus.textContent = `${originalWidth}x${originalHeight} ${bytes(imageSize)}`
    this.imageSizeStatus.style.display = ''
  }

  updateImageSize () {
    if (this.imageLoadCompositeDisposable) {
      this.imageLoadCompositeDisposable.dispose()
    }

    const editor = atom.workspace.getCenter().getActivePaneItem()
    if (editor instanceof ImageEditor && editor.view instanceof ImageEditorView) {
      this.editorView = editor.view
      if (this.editorView.loaded) {
        this.getImageSize(this.editorView)
      }

      this.imageLoadCompositeDisposable = new CompositeDisposable()
      const callback = () => {
        if (editor === atom.workspace.getCenter().getActivePaneItem()) {
          this.getImageSize(this.editorView)
        }
      }
      this.imageLoadCompositeDisposable.add(this.editorView.onDidLoad(callback))
      this.imageLoadCompositeDisposable.add(this.editorView.onDidUpdate(callback))
    } else {
      this.imageSizeStatus.style.display = 'none'
    }
  }
}
