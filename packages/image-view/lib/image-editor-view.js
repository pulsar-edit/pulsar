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
    this.levels = [0.05, 0.1, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2, 3, 4, 5, 7.5, 10]
    this.zoom = 1.00 ; this.step = null ; this.auto = false
    etch.initialize(this)

    this.defaultBackgroundColor = atom.config.get('image-view.defaultBackgroundColor')
    this.refs.imageContainer.setAttribute('background', this.defaultBackgroundColor)

    this.refs.image.style.display = 'none'
    this.updateImageURI()

    this.disposables.add(this.editor.onDidChange(() => this.updateImageURI()))
    this.disposables.add(atom.commands.add(this.element, {
      'image-view:reload': () => this.updateImageURI(),
      'image-view:zoom-in': () => this.zoomIn(),
      'image-view:zoom-out': () => this.zoomOut(),
      'image-view:reset-zoom': () => this.resetZoom(),
      'image-view:zoom-to-fit': () => this.zoomToFit(),
      'image-view:center': () => this.centerImage(),
      'core:move-up': () => this.scrollUp(),
      'core:move-down': () => this.scrollDown(),
      'core:move-left': () => this.scrollLeft(),
      'core:move-right': () => this.scrollRight(),
      'core:page-up': () => this.pageUp(),
      'core:page-down': () => this.pageDown(),
      'core:move-to-top': () => this.scrollToTop(),
      'core:move-to-bottom': () => this.scrollToBottom()
    }))

    this.disposables.add(atom.tooltips.add(this.refs.whiteTransparentBackgroundButton, { title: 'Use white transparent background' }))
    this.disposables.add(atom.tooltips.add(this.refs.blackTransparentBackgroundButton, { title: 'Use black transparent background' }))
    this.disposables.add(atom.tooltips.add(this.refs.transparentTransparentBackgroundButton, { title: 'Use transparent background' }))
    this.disposables.add(atom.tooltips.add(this.refs.nativeBackgroundButton, { title: 'Use native background' }))

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
    this.refs.nativeBackgroundButton.addEventListener('click', clickHandler)
    this.disposables.add(new Disposable(() => { this.refs.nativeBackgroundButton.removeEventListener('click', clickHandler) }))

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

    const centerClickHandler = () => {
      this.centerImage()
    }
    this.refs.centerButton.addEventListener('click', centerClickHandler)
    this.disposables.add(new Disposable(() => { this.refs.centerButton.removeEventListener('click', centerClickHandler) }))

    const zoomToFitClickHandler = () => {
      this.zoomToFit()
    }
    this.refs.zoomToFitButton.addEventListener('click', zoomToFitClickHandler)
    this.disposables.add(new Disposable(() => { this.refs.zoomToFitButton.removeEventListener('click', zoomToFitClickHandler) }))

    const wheelContainerHandler = (event) => {
      if (event.ctrlKey) {
        event.stopPropagation()
        const factor = event.wheelDeltaY>0 ? 1.2/1 : 1/1.2
        this.zoomToCenterPoint(factor*this.zoom)
      }
    }
    this.refs.imageContainer.addEventListener('wheel', wheelContainerHandler)
    this.disposables.add(new Disposable(() => { this.refs.imageContainer.removeEventListener('wheel', wheelContainerHandler) }))

    const wheelImageHandler = (event) => {
      if (event.ctrlKey) {
        event.stopPropagation()
        const factor = event.wheelDeltaY>0 ? 1.2/1 : 1/1.2
        this.zoomToMousePosition(factor*this.zoom, event)
      }
    }
    this.refs.image.addEventListener('wheel', wheelImageHandler)
    this.disposables.add(new Disposable(() => { this.refs.image.removeEventListener('wheel', wheelImageHandler) }))

    this.resizeObserver = new ResizeObserver(() => {
      if (this.auto) {
        this.zoomToFit(typeof this.auto === "number" ? this.auto : false)
      }
    })
    this.resizeObserver.observe(this.refs.imageContainer)
  }

  onDidLoad (callback) {
    return this.emitter.on('did-load', callback)
  }

  update() {}

  destroy() {
    this.disposables.dispose()
    this.emitter.dispose()
    this.resizeObserver.disconnect()
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
            ),
            $.a({className: 'image-controls-color-native', value: 'native', ref: 'nativeBackgroundButton'},
              'native'
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
            $.button({className: 'btn center-button', ref: 'centerButton'},
              'Center'
            ),
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
      this.loaded = true
      this.zoomToFit(1)
      this.refs.image.style.display = ''
      this.emitter.emit('did-update')
      this.emitter.emit('did-load')
    }
  }

  onDidUpdate (callback) {
    return this.emitter.on('did-update', callback)
  }

  updateSize(zoom) {
    if (!this.loaded || this.element.offsetHeight === 0) {
      return
    }
    this.auto = false
    this.refs.zoomToFitButton.classList.remove('selected')
    const prev = this.zoom
    this.zoom = Math.min(Math.max(zoom, 0.001), 100)
    this.step = this.zoom/prev
    const newWidth = Math.round(this.refs.image.naturalWidth * this.zoom)
    const newHeight = Math.round(this.refs.image.naturalHeight * this.zoom)
    const percent = Math.round(this.zoom * 1000) / 10
    this.refs.image.style.width = newWidth + 'px'
    this.refs.image.style.height = newHeight + 'px'
    this.refs.resetZoomButton.textContent = percent + '%'
  }

  centerImage() {
    this.refs.imageContainer.scrollTop = this.zoom * this.refs.image.naturalHeight / 2 - this.refs.imageContainer.offsetHeight / 2
    this.refs.imageContainer.scrollLeft = this.zoom *this.refs.image.naturalWidth / 2 - this.refs.imageContainer.offsetWidth / 2
  }

  zoomToMousePosition(zoom, event) {
    this.updateSize(zoom)
    const {left, top} = this.refs.imageContainer.getBoundingClientRect()
    this.refs.imageContainer.scrollLeft = this.step * event.offsetX - (event.pageX - left)
    this.refs.imageContainer.scrollTop = this.step * event.offsetY - (event.pageY - top)
  }

  zoomToCenterPoint(zoom) {
    const coorX = this.refs.imageContainer.scrollLeft + this.refs.imageContainer.offsetWidth / 2
    const coorY = this.refs.imageContainer.scrollTop + this.refs.imageContainer.offsetHeight / 2
    this.updateSize(zoom)
    this.refs.imageContainer.scrollLeft = this.step * coorX - this.refs.imageContainer.offsetWidth / 2
    this.refs.imageContainer.scrollTop = this.step * coorY - this.refs.imageContainer.offsetHeight / 2
  }

  zoomToFit(limit) {
    if (!this.loaded || this.element.offsetHeight === 0) {
      return
    }
    let zoom = Math.min(
      this.refs.imageContainer.offsetWidth / this.refs.image.naturalWidth,
      this.refs.imageContainer.offsetHeight / this.refs.image.naturalHeight,
    )
    if (limit) { zoom = Math.min(zoom, limit) }
    this.updateSize(zoom)
    this.auto = limit ? limit : true
    this.refs.zoomToFitButton.classList.add('selected')
  }

  zoomOut() {
    for (let i = this.levels.length-1; i >= 0; i--) {
      if (this.levels[i]<this.zoom) {
        this.zoomToCenterPoint(this.levels[i])
        break
      }
    }
  }

  zoomIn() {
    for (let i = 0; i < this.levels.length; i++) {
      if (this.levels[i]>this.zoom) {
        this.zoomToCenterPoint(this.levels[i])
        break
      }
    }
  }

  resetZoom() {
    if (!this.loaded || this.element.offsetHeight === 0) {
      return
    }
    this.zoomToCenterPoint(1)
  }

  changeBackground (color) {
    if (this.loaded && this.element.offsetHeight > 0 && color) {
      this.refs.imageContainer.setAttribute('background', color)
    }
  }

  scrollUp() {
    this.refs.imageContainer.scrollTop -= this.refs.imageContainer.offsetHeight / 10
  }

  scrollDown() {
    this.refs.imageContainer.scrollTop += this.refs.imageContainer.offsetHeight / 10
  }

  scrollLeft() {
    this.refs.imageContainer.scrollLeft -= this.refs.imageContainer.offsetWidth / 10
  }

  scrollRight() {
    this.refs.imageContainer.scrollLeft += this.refs.imageContainer.offsetWidth / 10
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
