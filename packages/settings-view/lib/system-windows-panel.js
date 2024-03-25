/** @babel */
/** @jsx etch.dom */

import {WinShell, CompositeDisposable} from 'atom'
import etch from 'etch'

export default class SystemPanel {
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

    WinShell.fileHandler.isRegistered((i) => { this.refs.fileHandlerCheckbox.checked = i })
    WinShell.fileContextMenu.isRegistered((i) => { this.refs.fileContextMenuCheckbox.checked = i })
    WinShell.folderContextMenu.isRegistered((i) => { this.refs.folderContextMenuCheckbox.checked = i })
    WinShell.pathUser.isRegistered((i) => { this.refs.addToPathCheckbox.checked = i })
  }

  destroy () {
    this.subscriptions.dispose()
    return etch.destroy(this)
  }

  update () {}

  render () {
    return (
      <div className='panels-item' tabIndex='0'>
        <form className='general-panel section'>
          <div className='settings-panel'>
            <div className='section-container'>
              <div className='block section-heading icon icon-device-desktop'>System Settings</div>
              <div className='text icon icon-question'>These settings determine how Pulsar integrates with your operating system.</div>
              <div className='section-body'>
                <div className='control-group'>
                  <div className='controls'>
                    <div className='checkbox'>
                      <label for='system.windows.file-handler'>
                        <input
                          ref='fileHandlerCheckbox'
                          id='system.windows.file-handler'
                          className='input-checkbox'
                          type='checkbox'
                          onclick={(e) => { this.setRegistration(WinShell.fileHandler, e.target.checked) }} />
                        <div className='setting-title'>Register as file handler</div>
                        <div className='setting-description'>
                          Show {WinShell.appName} in the "Open with" application list for easy association with file types.
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
                <div className='control-group'>
                  <div className='controls'>
                    <div className='checkbox'>
                      <label for='system.windows.shell-menu-files'>
                        <input
                          ref='fileContextMenuCheckbox'
                          id='system.windows.shell-menu-files'
                          className='input-checkbox'
                          type='checkbox'
                          onclick={(e) => { this.setRegistration(WinShell.fileContextMenu, e.target.checked) }} />
                        <div className='setting-title'>Show in file context menus</div>
                        <div className='setting-description'>
                          Add "Open with {WinShell.appName}" to the File Explorer context menu for files.
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
                <div className='control-group'>
                  <div className='controls'>
                    <div className='checkbox'>
                      <label for='system.windows.shell-menu-folders'>
                        <input
                          ref='folderContextMenuCheckbox'
                          id='system.windows.shell-menu-folders'
                          className='input-checkbox'
                          type='checkbox'
                          onclick={(e) => {
                            this.setRegistration(WinShell.folderContextMenu, e.target.checked)
                            this.setRegistration(WinShell.folderBackgroundContextMenu, e.target.checked)
                          }} />
                        <div className='setting-title'>Show in folder context menus</div>
                        <div className='setting-description'>
                          Add "Open with {WinShell.appName}" to the File Explorer context menu for folders.
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
                { this.getPathUI() }
              </div>
            </div>
          </div>
        </form>
      </div>
    )
  }

  setRegistration (option, shouldBeRegistered) {
    if (shouldBeRegistered) {
      return option.register(function () {})
    } else {
      return option.deregister(function () {})
    }
  }

  getPathUI() {
    return (
      <div className='control-group'>
        <div className='controls'>
          <div className='checkbox'>
            <label for='system.windows.add-to-path'>
              <input
                ref='addToPathCheckbox'
                id='system.windows.add-to-path'
                className='input-checkbox'
                type='checkbox'
                onclick={(e) => {
                  this.setRegistration(WinShell.pathUser, e.target.checked)
                }} />
              <div className='setting-title'>Add Pulsar to PATH</div>
              <div className='setting-description'>
                Add Pulsar to Windows PATH to enable CLI usage. (May require a reboot to take effect.)
              </div>
            </label>
          </div>
        </div>
      </div>
    );
  }

  focus () {
    this.element.focus()
  }

  show () {
    this.element.style.display = ''
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
