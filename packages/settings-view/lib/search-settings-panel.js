/** @babel */
/** @jsx etch.dom */

import { TextEditor, CompositeDisposable } from 'atom'
import etch from 'etch'
import CollapsibleSectionPanel from './collapsible-section-panel'
import List from './list'

export default class SearchSettingsPanel extends CollapsibleSectionPanel {
  constructor(settingsView) {
    super()
    etch.initialize(this)
    this.settingsView = settingsView
    // Different settings sections
    this.items = {
      core: new List('name'),
      editor: new List('name'),
      uri_handling: new List('name'),
      system: new List('name'),
      keybindings: new List('name'),
      packages: new List('name'),
      themes: new List('name')
    }

    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(this.handleEvents())
    this.subscriptions.add(atom.commands.add(this.element, {
      'core:move-up': () => { this.scrollUp() },
      'core:move-down': () => { this.scrollDown() },
      'core:page-up': () => { this.pageUp() },
      'core:page-down': () => { this.pageDown() },
      'core:move-to-top': () => { this.scrollToTop() },
      'core:move-to-bottom': () => { this.scrollToBottom() }
    }))

    this.subscriptions.add(
      this.refs.searchEditor.onDidStopChanging(() => { this.matchSettings() })
    )
  }

  focus () {
    this.refs.searchEditor.element.focus()
  }

  show () {
    this.element.style.display = ''
  }

  destroy () {
    this.subscriptions.dispose()
    return etch.destroy(this)
  }

  update () {}

  render () {
    return (
      <div className='panels-item' tabIndex='-1'>
        <section className='section'>
          <div className='section-container'>
            <div className='section-heading icon icon-search-save'>
              Search Pulsar's Settings
            </div>
            <div className='editor-container'>
              <TextEditor ref='searchEditor' mini placeholderText='Start Searching for Settings' />
            </div>

            <section className='sub-section search-results'>
              <h3 ref='communityPackagesHeader' className='sub-section-heading icon icon-package'>
                Core Settings
              </h3>
              <div ref='search-results' className='container package-container'>
                <div ref='loadingArea' className='alert alert-info loading-area icon icon-hourglass'>
                  Loading Results...
                </div>
              </div>
            </section>

            <section className='sub-section search-results'>
              <h3 className='sub-section-heading icon icon-package'>
                Core Settings
              </h3>
              <div className='container package-container'>
                <div className='row'>

                  <div className='package-card col-lg-8'>
                    <div className='body'>
                      <h4 className='card-name'>
                        <a className='package-name'>Allow Pending Pane Items</a>
                        <span className='package-version'>
                          Current: True
                        </span>
                      </h4>
                      <span className='package-description'>
                        Allow to be previewed wihtout adding them to a pane permanently, such as when single clicking files in the tree view.
                      </span>
                    </div>

                    <div className='meta'>
                      <div className='meta-user'>
                        <a className='author'>Default: false</a>
                      </div>
                      <div className='meta-controls'>
                        <div className='btn-toolbar'>

                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </section>

          </div>
        </section>
      </div>
    )
  }

  matchSettings () {
    this.filterSettings(this.refs.searchEditor.getText())
  }

  filterSettings (text) {
    console.log(text)
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
