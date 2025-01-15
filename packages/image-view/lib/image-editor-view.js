const fs = require('fs')
const {Emitter, CompositeDisposable, Disposable} = require('atom')
const etch = require('etch')
const $ = etch.dom

module.exports =
class ImageEditorView {
  constructor (editor) {
    this.editor = editor
    this.emitter = new Emitter()
    this.disposables = new CompositeDisposable()
    this.imageSize = fs.statSync(this.editor.getPath()).size
    this.loaded = false
    this.steps = [0.1, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2, 3, 4, 5, 7.5, 10]
    this.zoomFactor = 1.00
    etch.initialize(this)

    this.updateImageURI()

    this.disposables.add(this.editor.onDidChange(() => this.updateImageURI()))
    this.disposables.add(atom.commands.add(this.element, {
      'image-view:reload': () => this.updateImageURI(),
      'image-view:zoom-in': () => this.zoomIn(),
      'image-view:zoom-out': () => this.zoomOut(),
      'image-view:reset-zoom': () => this.resetZoom(),
      'image-view:zoom-to-fit': () => this.zoomToFit(),
      'core:move-up': () => this.scrollUp(),
      'core:move-down': () => this.scrollDown(),
      'core:page-up': () => this.pageUp(),
      'core:page-down': () => this.pageDown(),
      'core:move-to-top': () => this.scrollToTop(),
      'core:move-to-bottom': () => this.scrollToBottom()
    }))

    this.refs.image.onload = () => {
      this.refs.image.onload = null
      this.originalHeight = this.refs.image.naturalHeight
      this.originalWidth = this.refs.image.naturalWidth
      this.loaded = true
      this.refs.image.style.display = ''
      this.defaultBackgroundColor = atom.config.get('image-view.defaultBackgroundColor')
      this.refs.imageContainer.setAttribute('background', this.defaultBackgroundColor)
      this.zoomToFit(1)
      this.emitter.emit('did-load')
    }

    this.disposables.add(atom.tooltips.add(this.refs.whiteTransparentBackgroundButton, {title: 'Use white transparent background'}))
    this.disposables.add(atom.tooltips.add(this.refs.blackTransparentBackgroundButton, {title: 'Use black transparent background'}))
    this.disposables.add(atom.tooltips.add(this.refs.transparentTransparentBackgroundButton, {title: 'Use transparent background'}))

    const clickHandler = (event) => {
      event.preventDefault()
      event.stopPropagation()
      this.changeBackground(event.target.value)
    }

    this.refs.whiteTransparentBackgroundButton.addEventListener('click', clickHandler)
    this.disposables.add(new Disposable(() => { this.refs.whiteTransparentBackgroundButton.removeEventListener('click', clickHandler) }))
    this.refs.blackTransparentBackgroundButton.addEventListener('click', clickHandler)
    this.disposables.add(new Disposable(() => { this.refs.blackTransparentBackgroundButton.removeEventListener('click', clickHandler) }))
    this.refs.transparentTransparentBackgroundButton.addEventListener('click', clickHandler)
    this.disposables.add(new Disposable(() => { this.refs.transparentTransparentBackgroundButton.removeEventListener('click', clickHandler) }))

    const zoomInClickHandler = () => {
      this.zoomIn()
    }
    this.refs.zoomInButton.addEventListener('click', zoomInClickHandler)
    this.disposables.add(new Disposable(() => { this.refs.zoomInButton.removeEventListener('click', zoomInClickHandler) }))

    const zoomOutClickHandler = () => {
      this.zoomOut()
    }
    this.refs.zoomOutButton.addEventListener('click', zoomOutClickHandler)
    this.disposables.add(new Disposable(() => { this.refs.zoomOutButton.removeEventListener('click', zoomOutClickHandler) }))

    const resetZoomClickHandler = () => {
      this.resetZoom()
    }
    this.refs.resetZoomButton.addEventListener('click', resetZoomClickHandler)
    this.disposables.add(new Disposable(() => { this.refs.resetZoomButton.removeEventListener('click', resetZoomClickHandler) }))

    const zoomToFitClickHandler = () => {
      this.zoomToFit()
    }
    this.refs.zoomToFitButton.addEventListener('click', zoomToFitClickHandler)
    this.disposables.add(new Disposable(() => { this.refs.zoomToFitButton.removeEventListener('click', zoomToFitClickHandler) }))

    const wheelHandler = (event) => {
      if (event.ctrlKey) {
        const zoomOld = this.zoomFactor
        if (event.wheelDeltaY>0) {
          this.zoomFactor += 0.025
        } else {
          this.zoomFactor -= 0.025
        }
        this.zoomFactor = Math.round(Math.max(this.zoomFactor, 0.025)/0.025)*0.025
        this.updateSize()
      }
    }
    this.refs.imageContainer.addEventListener('wheel', wheelHandler)
    this.disposables.add(new Disposable(() => { this.refs.imageContainer.removeEventListener('wheel', wheelHandler) }))
  }

  onDidLoad (callback) {
    return this.emitter.on('did-load', callback)
  }

  update() {}

  destroy() {
    this.disposables.dispose()
    this.emitter.dispose()
    etch.destroy(this)
  }

  render() {
    return (
      $.div({className: 'image-view', tabIndex: -1},
        $.div({className: 'image-controls', ref: 'imageControls'},
          $.div({className: 'image-controls-group'},
            $.a({className: 'image-controls-color-white', value: 'white', ref: 'whiteTransparentBackgroundButton'},
              'white'
            ),
            $.a({className: 'image-controls-color-black', value: 'black', ref: 'blackTransparentBackgroundButton'},
              'black'
            ),
            $.a({className: 'image-controls-color-transparent', value: 'transparent', ref: 'transparentTransparentBackgroundButton'},
              'transparent'
            )
          ),
          $.div({className: 'image-controls-group btn-group'},
            $.button({className: 'btn', ref: 'zoomOutButton'},
              '-'
            ),
            $.button({className: 'btn reset-zoom-button', ref: 'resetZoomButton'},
              'Auto'
            ),
            $.button({className: 'btn', ref: 'zoomInButton'},
              '+'
            )
          ),
          $.div({className: 'image-controls-group btn-group'},
            $.button({className: 'btn zoom-to-fit-button', ref: 'zoomToFitButton'},
              'Zoom to fit'
            )
          )
        ),
        $.div({className: 'image-container', ref: 'imageContainer'},
          $.img({ref: 'image'})
        )
      )
    )
  }

  updateImageURI() {
    this.refs.image.src = `${this.editor.getEncodedURI()}?time=${Date.now()}`
    this.refs.image.onload = () => {
      this.refs.image.onload = null
      this.originalHeight = this.refs.image.naturalHeight
      this.originalWidth = this.refs.image.naturalWidth      
      this.imageSize = fs.statSync(this.editor.getPath()).size
      this.emitter.emit('did-update')
    }
  }

  onDidUpdate (callback) {
    return this.emitter.on('did-update', callback)
  }

  zoomOut() {
    for (let i = this.steps.length-1; i >= 0; i--) {
      if (this.steps[i]<this.zoomFactor) {
        this.zoomFactor = this.steps[i]
        this.updateSize()
        break
      }
    }
  }

  zoomIn() {
    for (let i = 0; i < this.steps.length; i++) {
      if (this.steps[i]>this.zoomFactor) {
        this.zoomFactor = this.steps[i]
        this.updateSize()
        break
      }
    }
  }

  resetZoom() {
    if (!this.loaded || this.element.offsetHeight === 0) {
      return
    }
    this.zoomFactor = 1
    this.updateSize()
  }

  zoomToFit(zoomLimit) {
    if (!this.loaded || this.element.offsetHeight === 0) {
      return
    }
    this.zoomFactor = Math.min(
      this.refs.imageContainer.offsetWidth/this.refs.image.naturalWidth,
      this.refs.imageContainer.offsetHeight/this.refs.image.naturalHeight,
    )
    if (zoomLimit) { this.zoomFactor = Math.min(this.zoomFactor, zoomLimit) }
    this.updateSize()
  }

  updateSize() {
    if (!this.loaded || this.element.offsetHeight === 0) {
      return
    }

    const newWidth = Math.round(this.refs.image.naturalWidth * this.zoomFactor)
    const newHeight = Math.round(this.refs.image.naturalHeight * this.zoomFactor)
    const percent = Math.round((newWidth / this.refs.image.naturalWidth) * 1000)/10

    this.refs.image.style.width = newWidth + 'px'
    this.refs.image.style.height = newHeight + 'px'
    this.refs.resetZoomButton.textContent = percent + '%'

    this.centerImage()
  }

  centerImage() {
    this.refs.imageContainer.scrollTop = this.zoomFactor*this.refs.image.naturalHeight/2-this.refs.imageContainer.offsetHeight/2
    this.refs.imageContainer.scrollLeft = this.zoomFactor*this.refs.image.naturalWidth/2-this.refs.imageContainer.offsetWidth/2
  }

  changeBackground (color) {
    if (this.loaded && this.element.offsetHeight > 0 && color) {
      this.refs.imageContainer.setAttribute('background', color)
    }
  }

  scrollUp() {
    this.refs.imageContainer.scrollTop -= this.refs.image.naturalHeight / 20
  }

  scrollDown() {
    this.refs.imageContainer.scrollTop += this.refs.image.naturalHeight / 20
  }

  pageUp() {
    this.refs.imageContainer.scrollTop -= this.element.offsetHeight
  }

  pageDown() {
    this.refs.imageContainer.scrollTop += this.element.offsetHeight
  }

  scrollToTop() {
    this.refs.imageContainer.scrollTop = 0
  }

  scrollToBottom() {
    this.refs.imageContainer.scrollTop = this.refs.imageContainer.scrollHeight
  }
}
