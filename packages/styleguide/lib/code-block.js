const {TextEditor} = require('atom')

module.exports =
class CodeBlock {
  constructor (props) {
    this.editor = new TextEditor({readonly: true, keyboardInputEnabled: false})
    this.element = document.createElement('div')
    this.element.appendChild(this.editor.getElement())
    atom.grammars.assignLanguageMode(this.editor, props.grammarScopeName)
    this.update(props)
  }

  update ({cssClass, code}) {
    this.editor.setText(code)
    this.element.classList.add(cssClass)
  }
}
