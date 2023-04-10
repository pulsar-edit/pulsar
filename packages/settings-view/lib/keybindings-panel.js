/** @babel */
/** @jsx etch.dom */

import {CompositeDisposable, TextEditor} from 'atom'
import etch from 'etch'
import _ from 'underscore-plus'
import path from 'path'

export default class KeybindingsPanel {
  constructor () {
    etch.initialize(this)
    this.disposables = new CompositeDisposable()
    this.disposables.add(atom.commands.add(this.element, {
      'core:move-up': () => { this.scrollUp() },
      'core:move-down': () => { this.scrollDown() },
      'core:page-up': () => { this.pageUp() },
      'core:page-down': () => { this.pageDown() },
      'core:move-to-top': () => { this.scrollToTop() },
      'core:move-to-bottom': () => { this.scrollToBottom() }
    }))
    this.otherPlatformPattern = new RegExp(`\\.platform-(?!${_.escapeRegExp(process.platform)}\\b)`)
    this.platformPattern = new RegExp(`\\.platform-${_.escapeRegExp(process.platform)}\\b`)

    this.disposables.add(this.refs.searchEditor.onDidStopChanging(() => {
      this.filterKeyBindings(this.keyBindings, this.refs.searchEditor.getText())
    }))

    this.disposables.add(atom.keymaps.onDidReloadKeymap(() => { this.loadKeyBindings() }))
    this.disposables.add(atom.keymaps.onDidUnloadKeymap(() => { this.loadKeyBindings() }))
    this.loadKeyBindings()
  }

  destroy () {
    this.disposables.dispose()
    return etch.destroy(this)
  }

  update () {}

  render () {
    return (
      <div className='panels-item' tabIndex='-1'>
        <section className='keybinding-panel section'>
          <div className='section-heading icon icon-keyboard'>Keybindings</div>
          <div className='text native-key-bindings' tabIndex='-1'>
            <span className='icon icon-question' />
            <span>You can override these keybindings by copying </span>
            <span className='icon icon-clippy' />
            <span>and pasting them into </span>
            <a className='link' onclick={this.didClickOpenKeymapFile}>your keymap file</a>
          </div>

          <div className='editor-container'>
            <TextEditor mini ref='searchEditor' placeholderText='Search keybindings' />
          </div>

          <table className='native-key-bindings table text' tabIndex='-1'>
            <col className='keystroke' />
            <col className='command' />
            <col className='source' />
            <col className='selector' />
            <thead>
              <tr>
                <th className='keystroke'>Keystroke</th>
                <th className='command'>Command</th>
                <th className='source'>Source</th>
                <th className='selector'>Selector</th>
              </tr>
            </thead>
            <tbody ref='keybindingRows' />
          </table>
        </section>
      </div>
    )
  }

  loadKeyBindings () {
    this.refs.keybindingRows.innerHTML = ''
    this.keyBindings = _.sortBy(atom.keymaps.getKeyBindings(), 'keystrokes')
    this.appendKeyBindings(this.keyBindings)
    this.filterKeyBindings(this.keyBindings, this.refs.searchEditor.getText())
  }

  focus () {
    this.refs.searchEditor.element.focus()
  }

  show () {
    this.element.style.display = ''
  }

  filterKeyBindings (keyBindings, filterString) {
    this.refs.keybindingRows.innerHTML = ''
    for (let keyBinding of keyBindings) {
      let {selector, keystrokes, command, source} = keyBinding
      source = KeybindingsPanel.determineSource(source)
      var searchString = `${selector}${keystrokes}${command}${source}`.toLowerCase()
      if (!searchString) {
        continue
      }

      const keywords = filterString.trim().toLowerCase().split(' ')
      if (keywords.every(keyword => searchString.indexOf(keyword) !== -1)) {
        this.appendKeyBinding(keyBinding)
      }
    }
  }

  appendKeyBindings (keyBindings) {
    for (const keyBinding of keyBindings) {
      this.appendKeyBinding(keyBinding)
    }
  }

  appendKeyBinding (keyBinding) {
    if (!this.showSelector(keyBinding.selector)) {
      return
    }

    const element = this.elementForKeyBinding(keyBinding)
    element.dataset.keyBinding = keyBinding
    this.refs.keybindingRows.appendChild(element)
  }

  showSelector (selector) {
    let segments
    if (selector) {
      segments = selector.split(',') || []
    } else {
      segments = []
    }

    return segments.some((s) => this.platformPattern.test(s) || !this.otherPlatformPattern.test(s))
  }

  elementForKeyBinding (keyBinding) {
    let {selector, keystrokes, command, source} = keyBinding
    source = KeybindingsPanel.determineSource(source)

    const tr = document.createElement('tr')
    if (source === 'User') {
      tr.classList.add('is-user')
    }

    const keystrokeTd = document.createElement('td')
    keystrokeTd.classList.add('keystroke')

    const copyIcon = document.createElement('span')
    copyIcon.classList.add('icon', 'icon-clippy', 'copy-icon')
    copyIcon.onclick = () => {
      let content
      const keymapExtension = path.extname(atom.keymaps.getUserKeymapPath())

      const escapeCSON = (input) => {
        return JSON.stringify(input)
          .slice(1, -1) // Remove wrapping double quotes
          .replace(/\\"/g, '"') // Unescape double quotes
          .replace(/'/g, '\\\'') // Escape single quotes
      }

      if (keymapExtension === '.cson') {
        content = `'${escapeCSON(selector)}':\n  '${escapeCSON(keystrokes)}': '${escapeCSON(command)}'`
      } else {
        content = `${JSON.stringify(selector)}: {\n  ${JSON.stringify(keystrokes)}: ${JSON.stringify(command)}\n}`
      }
      return atom.clipboard.write(content)
    }
    keystrokeTd.appendChild(copyIcon)

    const keystrokesSpan = document.createElement('span')
    keystrokesSpan.textContent = keystrokes
    keystrokeTd.appendChild(keystrokesSpan)
    tr.appendChild(keystrokeTd)

    const commandTd = document.createElement('td')
    commandTd.classList.add('command')
    commandTd.textContent = command
    tr.appendChild(commandTd)

    const sourceTd = document.createElement('td')
    sourceTd.classList.add('source')
    sourceTd.textContent = source
    tr.appendChild(sourceTd)

    const selectorTd = document.createElement('td')
    selectorTd.classList.add('selector')
    selectorTd.textContent = selector
    tr.appendChild(selectorTd)

    return tr
  }

  didClickOpenKeymapFile (e) {
    e.preventDefault()
    atom.commands.dispatch(atom.views.getView(atom.workspace), 'application:open-your-keymap')
  }

  scrollUp () {
    this.element.scrollTop -= document.body.offsetHeight / 20
  }

  scrollDown () {
    this.element.scrollTop += document.body.offsetHeight / 20
  }

  pageUp () {
    this.element.scrollTop -= this.element.offsetHeight
  }

  pageDown () {
    this.element.scrollTop += this.element.offsetHeight
  }

  scrollToTop () {
    this.element.scrollTop = 0
  }

  scrollToBottom () {
    this.element.scrollTop = this.element.scrollHeight
  }

  // Private: Returns a user friendly description of where a keybinding was
  // loaded from.
  //
  // * filePath:
  //   The absolute path from which the keymap was loaded
  //
  // Returns one of:
  // * `Core` indicates it comes from a bundled package.
  // * `User` indicates that it was defined by a user.
  // * `<package-name>` the package which defined it.
  // * `Unknown` if an invalid path was passed in.
  static determineSource (filePath) {
    if (!filePath) {
      return 'Unknown'
    }

    if (filePath.indexOf(path.join(atom.getLoadSettings().resourcePath, 'keymaps')) === 0) {
      return 'Core'
    } else if (filePath === atom.keymaps.getUserKeymapPath()) {
      return 'User'
    } else {
      const pathParts = filePath.split(path.sep)
      const packageNameIndex = pathParts.length - 3
      const packageName = pathParts[packageNameIndex] != null ? pathParts[packageNameIndex] : ''
      return _.undasherize(_.uncamelcase(packageName))
    }
  }
}
