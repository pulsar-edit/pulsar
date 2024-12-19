/** @babel */
/** @jsx etch.dom */

import path from 'path'
import _ from 'underscore-plus'
import {Disposable, CompositeDisposable} from 'atom'
import etch from 'etch'
import KeybindingsPanel from './keybindings-panel'

// Displays the keybindings for a package namespace
export default class PackageKeymapView {
  constructor (pack) {
    this.pack = pack
    this.namespace = this.pack.name
    this.disposables = new CompositeDisposable()
    etch.initialize(this)

    const packagesWithKeymapsDisabled = atom.config.get('core.packagesWithKeymapsDisabled') || []
    this.refs.keybindingToggle.checked = !packagesWithKeymapsDisabled.includes(this.namespace)

    const changeHandler = (event) => {
      event.stopPropagation()
      const value = this.refs.keybindingToggle.checked
      if (value) {
        atom.config.removeAtKeyPath('core.packagesWithKeymapsDisabled', this.namespace)
      } else {
        atom.config.pushAtKeyPath('core.packagesWithKeymapsDisabled', this.namespace)
      }

      this.updateKeyBindingView()
    }
    this.refs.keybindingToggle.addEventListener('change', changeHandler)
    this.disposables.add(new Disposable(() => { this.refs.keybindingToggle.removeEventListener('change', changeHandler) }))

    const copyIconClickHandler = (event) => {
      const target = event.target.closest('.copy-icon')
      if (target) {
        event.preventDefault()
        event.stopPropagation()
        this.writeKeyBindingToClipboard(target.closest('tr').dataset)
      }
    }
    this.element.addEventListener('click', copyIconClickHandler)
    this.disposables.add(new Disposable(() => { this.element.removeEventListener('click', copyIconClickHandler) }))

    this.updateKeyBindingView()

    let hasKeymaps = false
    // eslint-disable-next-line no-unused-vars
    for (let [packageKeymapsPath, keymap] of atom.packages.getLoadedPackage(this.namespace).keymaps) {
      if (keymap.length > 0) {
        hasKeymaps = true
        break
      }
    }

    if (this.refs.keybindingItems.children.length === 0 && !hasKeymaps) {
      this.element.style.display = 'none'
    }
  }

  update () {}

  destroy () {
    this.disposables.dispose()
    return etch.destroy(this)
  }

  render () {
    return (
      <section className='section'>
        <div className='section-heading icon icon-keyboard'>Keybindings</div>
        <div className='checkbox'>
          <label for='toggleKeybindings'>
            <input id='toggleKeybindings' className='input-checkbox' type='checkbox' ref='keybindingToggle' />
            <div className='setting-title'>Enable</div>
          </label>
          <div className='setting-description'>
            {"Disable this if you want to bind your own keystrokes for this package's commands in your keymap."}
          </div>
        </div>
        <table className='package-keymap-table table native-key-bindings text' tabIndex='-1'>
          <thead>
            <tr>
              <th>Keystroke</th>
              <th>Command</th>
              <th>Selector</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody ref='keybindingItems' />
        </table>
      </section>
    )
  }

  updateKeyBindingView () {
    this.refs.keybindingItems.innerHTML = ''

    const packagesWithKeymapsDisabled = atom.config.get('core.packagesWithKeymapsDisabled') || []
    const keybindingsDisabled = packagesWithKeymapsDisabled.includes(this.namespace)
    if (keybindingsDisabled) {
      this.refs.keybindingItems.classList.add('text-subtle')
    } else {
      this.refs.keybindingItems.classList.remove('text-subtle')
    }

    const keyBindings = []
    if (atom.keymaps.build) {
      // eslint-disable-next-line no-unused-vars
      for (const [keymapPath, keymap] of atom.packages.getLoadedPackage(this.namespace).keymaps) {
        keyBindings.push(...atom.keymaps.build(this.namespace, keymap, 0, false))
      }
    } else {
      // Backwards compatibility for Atom <= 1.19
      for (const keyBinding of atom.keymaps.getKeyBindings()) {
        const {command} = keyBinding
        if (command && command.indexOf && command.indexOf(`${this.namespace}:`) === 0) {
          keyBindings.push(keyBinding)
        }
      }
    }

    for (const keyBinding of keyBindings) {
      const {command, keystrokes, selector, source} = keyBinding
      if (!command) {
        continue
      }

      if (!this.selectorIsCompatibleWithPlatform(selector)) {
        continue;
      }

      const keyBindingRow = document.createElement('tr')
      keyBindingRow.dataset.selector = selector
      keyBindingRow.dataset.keystrokes = keystrokes
      keyBindingRow.dataset.command = command

      const keystrokesTd = document.createElement('td')

      const copyIconSpan = document.createElement('span')
      copyIconSpan.classList.add('icon', 'icon-clippy', 'copy-icon')
      keystrokesTd.appendChild(copyIconSpan)

      const keystrokesSpan = document.createElement('span')
      keystrokesSpan.textContent = keystrokes
      keystrokesTd.appendChild(keystrokesSpan)

      keyBindingRow.appendChild(keystrokesTd)

      const commandTd = document.createElement('td')
      commandTd.textContent = command
      keyBindingRow.appendChild(commandTd)

      const selectorTd = document.createElement('td')
      selectorTd.textContent = selector
      keyBindingRow.appendChild(selectorTd)

      const sourceTd = document.createElement('td')
      sourceTd.textContent = KeybindingsPanel.determineSource(source)
      keyBindingRow.appendChild(sourceTd)

      this.refs.keybindingItems.appendChild(keyBindingRow)
    }
  }

  writeKeyBindingToClipboard ({selector, keystrokes, command}) {
    let content
    const keymapExtension = path.extname(atom.keymaps.getUserKeymapPath())
    if (keymapExtension === '.cson') {
      content = `\
'${selector}':
  '${keystrokes}': '${command}'\
`
    } else {
      content = `\
"${selector}": {
  "${keystrokes}": "${command}"
}\
`
    }

    atom.clipboard.write(content)
  }

  selectorIsCompatibleWithPlatform(selector, platform = process.platform) {
    const otherPlatformPattern = new RegExp(`\\.platform-(?!${_.escapeRegExp(platform)}\\b)`);
    const currentPlatformPattern = new RegExp(`\\.platform-(${_.escapeRegExp(platform)}\\b)`);

    return !(otherPlatformPattern.test(selector) && !currentPlatformPattern.test(selector));
  }
}
