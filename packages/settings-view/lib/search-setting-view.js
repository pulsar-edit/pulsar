/** @babel */
/** @jsx etch.dom */

import etch from 'etch'
import { shell } from 'electron'
import { Disposable, CompositeDisposable } from 'atom'
import { getSettingTitle } from './rich-title'

export default class SearchSettingView {
  constructor(setting, settingsView) {
    this.settingsView = settingsView
    this.setting = setting
    this.disposables = new CompositeDisposable()

    etch.initialize(this)

    this.handleButtonEvents()
  }

  render () {
    const title = this.setting.title ?? getSettingTitle(this.setting.path, this.setting.path.split(".")[1]);
    const path = atom.config.get("settings-view.searchSettingsMetadata") ? this.setting.path + ": " : "";
    const description = this.setting.description ?? "";
    const packageName = this.setting.path.split(".")[0];
    const icon = this.getIcon(packageName);
    const score = atom.config.get("settings-view.searchSettingsMetadata") ? this.setting.rank.totalScore.toFixed(2) + " Search Score" : "";

    return (
      <div className='search-result col-lg-8'>
        <span className='search-package-name pull-right'>
          <span className={icon}></span>
          {packageName}
        </span>
        <div className='body'>
          <h4 className='card-name'>
            <a ref='settingLink'>
              <span className='search-name'>{title}</span>
              <span className='search-id'>{path}{score}</span>
            </a>
          </h4>
          <span className='search-description'>{description}</span>

        </div>

      </div>
    )
  }

  update () {}

  destroy () {
    this.disposables.dispose()
    return etch.destroy(this)
  }

  getIcon(namespace) {
    // Takes a setting namespace and returns the appropriate icon for it.
    switch(namespace) {
      case "core":
        return "icon icon-settings search-result-icon";
        break;
      case "editor":
        return "icon icon-code search-result-icon";
        break;
      default:
        return "icon icon-package search-result-icon";
        break;
    }
  }

  handleButtonEvents () {
    const settingsClickHandler = (event) => {
      event.stopPropagation()

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
    }

    this.refs.settingLink.addEventListener('click', settingsClickHandler)
    this.disposables.add(new Disposable(() => { this.refs.settingLink.removeEventListener('click', settingsClickHandler) }))
  }
}
