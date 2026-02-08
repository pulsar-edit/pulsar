const iconv = require('iconv-lite')
const jschardet = require('jschardet')
const fs = require('fs')
const SelectListView = require('pulsar-select-list')

module.exports =
class EncodingListView {
  constructor(encodings) {
    this.encodings = encodings
    this.selectList = new SelectListView({
      className: 'encoding-selector',
      itemsClassList: ['mark-active'],
      items: [],
      filterKeyForItem: (encoding) => encoding.name,
      elementForItem: (encoding) => {
        const element = document.createElement('li')
        if (encoding.id === this.currentEncoding) {
          element.classList.add('active')
        }
        element.textContent = encoding.name
        element.dataset.encoding = encoding.id
        return element
      },
      didConfirmSelection: (encoding) => {
        this.cancel()
        if (encoding.id === 'detect') {
          this.detectEncoding()
        } else {
          atom.workspace.getActiveTextEditor().setEncoding(encoding.id)
        }
      },
      didCancelSelection: () => {
        this.cancel()
      }
    })
  }

  destroy() {
    this.cancel()
    return this.selectList.destroy()
  }

  cancel() {
    this.selectList.hide()
    this.currentEncoding = null
  }

  attach() {
    this.selectList.reset()
    this.selectList.show()
  }

  async toggle() {
    if (this.selectList.isVisible()) {
      this.cancel()
    } else if (atom.workspace.getActiveTextEditor()) {
      const editor = atom.workspace.getActiveTextEditor()
      this.currentEncoding = editor.getEncoding()
      const encodingItems = []

      if (fs.existsSync(editor.getPath())) {
        encodingItems.push({id: 'detect', name: 'Auto Detect'})
      }

      for (let id in this.encodings) {
        encodingItems.push({id, name: this.encodings[id].list})
      }

      await this.selectList.update({items: encodingItems})
      this.attach()
    }
  }

  detectEncoding() {
    const editor = atom.workspace.getActiveTextEditor()
    const filePath = editor.getPath()
    if (fs.existsSync(filePath)) {
      fs.readFile(filePath, (error, buffer) => {
        if (!error) {
          let {encoding} = jschardet.detect(buffer) || {}
          if (encoding === 'ascii') {
            encoding = 'utf8'
          }

          if (iconv.encodingExists(encoding)) {
            editor.setEncoding(encoding.toLowerCase().replace(/[^0-9a-z]|:\d{4}$/g, ''))
          }
        }
      })
    }
  }
}
