/** @babel */
/** @jsx etch.dom */

import {CompositeDisposable} from 'atom'
import etch from 'etch'
import SettingsPanel from './settings-panel'

export default class GeneralPanel {
  constructor () {
    etch.initialize(this)
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.commands.add(this.element, {
      'core:move-up': () => { this.scrollUp() },
      'core:move-down': () => { this.scrollDown() },
      'core:page-up': () => { this.pageUp() },
      'core:page-down': () => { this.pageDown() },
      'core:move-to-top': () => { this.scrollToTop() },
      'core:move-to-bottom': () => { this.scrollToBottom() }
    }))
  }

  destroy () {
    this.subscriptions.dispose()
    return etch.destroy(this)
  }

  update () {}

  render () {
    return (
      <div tabIndex='0' className='panels-item' onclick={this.didClick}>
        <SettingsPanel
          ref='panel'
          namespace='core'
          icon='settings'
          note={`<div class="text icon icon-question" id="core-settings-note" tabindex="-1">These are Pulsar's core settings which affect behavior unrelated to text editing. Individual packages may have their own additional settings found within their package card in the <a class="link packages-open">Packages list</a>.</div>`} />
      </div>
    )
  }

  focus () {
    this.element.focus()
  }

  show () {
    this.element.style.display = ''
  }

  didClick (event) {
    const target = event.target.closest('.packages-open')
    if (target) {
      atom.workspace.open('atom://config/packages')
    }
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
}
