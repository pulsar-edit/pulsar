/** @babel */
/** @jsx etch.dom */

import etch from 'etch'
import { shell } from 'electron'
import { Disposable, CompositeDisposable } from 'atom'

export default class SearchSettingView {
  constructor(setting, settingsView) {
    this.settingsView = settingsView
    this.setting = setting
    this.disposables = new CompositeDisposable()

    etch.initialize(this)

    this.handleButtonEvents()
  }

  render () {
    const title = this.setting.title ?? "";
    const path = this.setting.path;
    const description = this.setting.description ?? "";

    return (
      <div className='package-card col-lg-8'>
        <div className='body'>
          <h4 className='card-name'>
            <a ref='settingLink'>
              <span className='package-name'>{title}</span>
              <span className='value'>{path}</span>
            </a>
          </h4>
          <span className='package-description'>{description}</span>

        </div>

      </div>
    )
  }

  update () {}

  destroy () {
    this.disposables.dispose()
    return etch.destroy(this)
  }

  handleButtonEvents () {
    const settingsClickHandler = (event) => {
      event.stopPropagation()
      //this.settingsView.showPanelForURI("atom://settings-view")

      // Lets check if the setting we want to open is built in or from a package
      const settingLocation = this.setting.path.split(".")[0]
      // The above is the location where the setting exists, such as Core, or a packages name

      switch(settingLocation) {
        case "core":
          // There are some special cases of settings broken off into other panels
          let settingName = this.setting.path.split(".")[1]
          if (settingName === 'uriHandlerRegistration') {
            // the URI handler doesn't have any registered uri to actually reach it
            // funnily enough. So we will prompt a notification to go there
            atom.notifications.addInfo("Sorry, Pulsar is unable to link to this setting. Please select 'URI Handling' on the sidebar.")
          } else {
            atom.workspace.open("atom://config/core")
          }
          break;
        case "editor":
          atom.workspace.open("atom://config/editor")
          break;
        default:
          // The handling for any packages name
          atom.workspace.open(`atom://config/packages/${settingLocation}`)
          break;
      }
      //atom.workspace.open("atom://config/core/closeDeletedFileTabs")
      // Open the relevant settings page
    }

    this.refs.settingLink.addEventListener('click', settingsClickHandler)
    this.disposables.add(new Disposable(() => { this.refs.settingLink.removeEventListener('click', settingsClickHandler) }))
  }
}
