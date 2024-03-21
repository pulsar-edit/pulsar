/** @babel */

import {CompositeDisposable, Disposable} from 'atom'
import _ from 'underscore-plus'
import CollapsibleSectionPanel from './collapsible-section-panel'
const elementForSetting = require("./settings-values/elementForSetting.js");

const SCOPED_SETTINGS = [
  'autoIndent',
  'autoIndentOnPaste',
  'invisibles',
  'nonWordCharacters',
  'preferredLineLength',
  'scrollPastEnd',
  'showIndentGuide',
  'showInvisibles',
  'softWrap',
  'softWrapAtPreferredLineLength',
  'softWrapHangingIndent',
  'tabLength',
  'tabType'
]


export default class SettingsPanel extends CollapsibleSectionPanel {
  constructor (options = {}) {
    super()
    let namespace = options.namespace
    this.element = document.createElement('section')
    this.element.classList.add('section', 'settings-panel')
    this.options = options
    this.disposables = new CompositeDisposable()
    let settings
    if (this.options.scopeName) {
      namespace = 'editor'
      settings = {}
      for (const name of SCOPED_SETTINGS) {
        settings[name] = getWithoutProjectOverride(name, {scope: [this.options.scopeName]})
      }
    } else {
      settings = getWithoutProjectOverride(namespace)
    }

    this.element.appendChild(this.elementForSettings(namespace, settings))

    this.disposables.add(this.handleEvents())
  }

  destroy () {
    this.disposables.dispose()
    this.element.remove()
  }

  elementForSettings (namespace, settings) {
    if (_.isEmpty(settings)) {
      return document.createDocumentFragment()
    }

    let {title} = this.options
    const includeTitle = this.options.includeTitle != null ? this.options.includeTitle : true
    if (includeTitle) {
      if (title == null) {
        title = `${_.undasherize(_.uncamelcase(namespace))} Settings`
      }
    } else {
      if (title == null) {
        title = 'Settings'
      }
    }

    const icon = this.options.icon != null ? this.options.icon : 'gear'
    const {note} = this.options
    const sortedSettings = this.sortSettings(namespace, settings)

    const container = document.createElement('div')
    container.classList.add('section-container')

    const heading = document.createElement('div')
    heading.classList.add('block', 'section-heading', 'icon', `icon-${icon}`)
    heading.textContent = title
    container.appendChild(heading)

    if (note) {
      container.insertAdjacentHTML('beforeend', note)
    }

    const body = document.createElement('div')
    body.classList.add('section-body')
    for (const name of sortedSettings) {
      body.appendChild(
        elementForSetting(namespace, name, settings[name], {
          scopeName: this.options.scopeName,
          compositeDisposable: this.disposables,
          getWithoutProjectOverride: getWithoutProjectOverride,
          settingHasProjectOverride: settingHasProjectOverride,
          sortSettings: this.sortSettings,
          updateOverrideMessage: (name) => {
            let hasOverride = settingHasProjectOverride(name)
            let message = this.element.querySelector(`div.setting-override-warning[data-setting-key="${name}"]`)
            if (!message) return
            message.style.display = hasOverride ? 'block' : 'none'
          }
        })
      );
    }
    container.appendChild(body)

    return container
  }

  sortSettings (namespace, settings) {
    return sortSettings(namespace, settings)
  }
}

/*
 * Space Pen Helpers
 */


function sortSettings (namespace, settings) {
  return _.chain(settings)
    .keys()
    .sortBy((name) => name)
    .sortBy((name) => {
      const schema = atom.config.getSchema(`${namespace}.${name}`)
      return schema ? schema.order : null
    })
    .value()
}

function getWithoutProjectOverride (name, options = {}) {
  if (atom.config.projectFile) {
    options.excludeSources = [atom.config.projectFile]
  }
  return atom.config.get(name, options)
}

function getWithProjectOverride(name) {
  // Checking `atom.config.projectSettings` lets us skip value coercion and
  // find out whether a given value is defined.
  return _.get(atom.config.projectSettings, name.split('.'))
}

function settingHasProjectOverride (name) {
  return typeof getWithProjectOverride(name) !== 'undefined'
}
