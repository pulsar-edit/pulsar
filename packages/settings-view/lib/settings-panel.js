/** @babel */

import {CompositeDisposable, Disposable, TextEditor} from 'atom'
import _ from 'underscore-plus'
import CollapsibleSectionPanel from './collapsible-section-panel'
import {getSettingDescription} from './rich-description'
import {getSettingTitle} from './rich-title'

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

    this.disposables.add(this.bindInputFields())
    this.disposables.add(this.bindSelectFields())
    this.disposables.add(this.bindEditors())
    this.disposables.add(this.bindTooltips())
    this.disposables.add(this.handleEvents())
  }

  destroy () {
    this.disposables.dispose()
    this.element.remove()
  }

  updateOverrideMessage (name) {
    let hasOverride = settingHasProjectOverride(name)
    let message = this.element.querySelector(`div.setting-override-warning[data-setting-key="${name}"]`)
    if (!message) return
    message.style.display = hasOverride ? 'block' : 'none'
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
      body.appendChild(elementForSetting(namespace, name, settings[name]))
    }
    container.appendChild(body)

    return container
  }

  sortSettings (namespace, settings) {
    return sortSettings(namespace, settings)
  }

  bindInputFields () {
    const disposables = Array.from(this.element.querySelectorAll('input[id]')).map((input) => {
      let type = input.type
      let name = type === 'radio' ? input.name : input.id

      this.observe(name, (value) => {
        this.updateOverrideMessage(name)
        if (type === 'checkbox') {
          input.checked = value
        } else if (type === 'radio') {
          input.checked = (value === this.parseValue(atom.config.getSchema(name).type, input.value))
        } else {
          if (type === 'color') {
            if (value && value.toHexString && value.toHexString()) {
              value = value.toHexString()
            }
          }

          if (value) {
            input.value = value
          }
        }
      })

      const changeHandler = () => {
        let value = input.value
        if (type === 'checkbox') {
          value = input.checked
        } else if (type === 'radio') {
          value = this.parseValue(atom.config.getSchema(name).type, value)
        } else {
          value = this.parseValue(type, value)
        }

        if (type === 'color') {
          // This is debounced since the color wheel fires lots of events
          // as you are dragging it around
          clearTimeout(this.colorDebounceTimeout)
          this.colorDebounceTimeout = setTimeout(() => { this.set(name, value) }, 100)
        } else {
          this.set(name, value)
        }
      }

      input.addEventListener('change', changeHandler)
      return new Disposable(() => input.removeEventListener('change', changeHandler))
    })

    return new CompositeDisposable(...disposables)
  }

  observe (name, callback) {
    let params = {sources: [atom.config.getUserConfigPath()]}
    if (atom.config.projectFile) {
      params.excludeSources = [atom.config.projectFile]
    }
    if (this.options.scopeName != null) {
      params.scope = [this.options.scopeName]
    }

    // We need to be sure that project-specific config overrides are never
    // reflected in the settings panel. We use `observe` to hook into any
    // possible changes to our value, but we double-check it by looking up the
    // value ourselves.
    let wrappedCallback = (nv) => {
      let params = {}
      if (this.options.scopeName != null) {
        params.scope = [this.options.scopeName]
      }
      callback(getWithoutProjectOverride(name, params))
    }

    this.disposables.add(atom.config.observe(name, params, wrappedCallback))
  }

  isDefault (name) {
    let params = {sources: [atom.config.getUserConfigPath()]}
    if (this.options.scopeName != null) {
      params.scope = [this.options.scopeName]
    }
    let defaultValue = this.getDefault(name)
    let value = atom.config.get(name, params)
    return (value == null) || (defaultValue === value)
  }

  getDefault (name) {
    let params = {excludeSources: [atom.config.getUserConfigPath()]}
    if (this.options.scopeName != null) {
      params.scope = [this.options.scopeName]
    }

    let defaultValue = atom.config.get(name, params)
    if (this.options.scopeName != null) {
      // If the unscoped default is the same as the scoped default, check the actual config.cson
      // to make sure that there isn't a non-default value that is overriding the scoped value
      // For example: the default editor.tabLength is 2, but if someone sets it to 4
      // the above check still returns 2 and not 4 for a scoped editor.tabLength,
      // because it bypasses config.cson.
      if (atom.config.get(name, {excludeSources: [atom.config.getUserConfigPath()]}) === defaultValue) {
        defaultValue = atom.config.get(name)
      }
    }
    return defaultValue
  }

  set (name, value) {
    if (this.options.scopeName) {
      if (value === undefined) {
        atom.config.unset(name, {scopeSelector: this.options.scopeName})
        return true
      } else {
        return atom.config.set(name, value, {scopeSelector: this.options.scopeName})
      }
    } else {
      return atom.config.set(name, value)
    }
  }

  setText (editor, name, type, value) {
    let stringValue
    if (this.isDefault(name)) {
      stringValue = ''
    } else {
      stringValue = this.valueToString(value) || ''
    }

    if (stringValue === editor.getText() || _.isEqual(value, this.parseValue(type, editor.getText()))) {
      return
    }

    editor.setText(stringValue)
    editor.moveToEndOfLine()
  }

  bindSelectFields () {
    const disposables = Array.from(this.element.querySelectorAll('select[id]')).map((select) => {
      const name = select.id
      this.observe(name, value => {
        select.value = value
        this.updateOverrideMessage(name)
      })
      const changeHandler = () => {
        this.set(name, select.value)
      }
      select.addEventListener('change', changeHandler)
      return new Disposable(() => select.removeEventListener('change', changeHandler))
    })

    return new CompositeDisposable(...disposables)
  }

  bindEditors () {
    const disposables = Array.from(this.element.querySelectorAll('atom-text-editor')).map((editorElement) => {
      let editor = editorElement.getModel()
      let name = editorElement.id
      let type = editorElement.getAttribute('type')
      let defaultValue = this.valueToString(this.getDefault(name))

      if (defaultValue != null) {
        editor.setPlaceholderText(`Default: ${defaultValue}`)
      }

      const subscriptions = new CompositeDisposable()

      const focusHandler = () => {
        if (this.isDefault(name)) {
          editor.setText(this.valueToString(this.getDefault(name)) || '')
        }
      }
      editorElement.addEventListener('focus', focusHandler)
      subscriptions.add(new Disposable(() => editorElement.removeEventListener('focus', focusHandler)))

      const blurHandler = () => {
        if (this.isDefault(name)) {
          editor.setText('')
        }
      }
      editorElement.addEventListener('blur', blurHandler)
      subscriptions.add(new Disposable(() => editorElement.removeEventListener('blur', blurHandler)))

      this.observe(name, (value) => {
        this.setText(editor, name, type, value)
        this.updateOverrideMessage(name)
      })

      subscriptions.add(editor.onDidStopChanging(() => {
        const {minimum, maximum} = atom.config.getSchema(name)
        const value = this.parseValue(type, editor.getText())
        if (minimum != null && value < minimum) {
          this.set(name, minimum)
          this.setText(editor, name, type, minimum)
        } else if (maximum != null && value > maximum) {
          this.set(name, maximum)
          this.setText(editor, name, type, maximum)
        } else if (!this.set(name, value)) {
          this.setText(editor, name, type, atom.config.get(name))
        }
      }))

      return subscriptions
    })

    return new CompositeDisposable(...disposables)
  }

  bindTooltips () {
    const disposables = Array.from(this.element.querySelectorAll('input[id], select[id], atom-text-editor[id]')).map((element) => {
      const schema = atom.config.getSchema(element.id)
      let defaultValue = this.valueToString(this.getDefault(element.id))
      if (defaultValue != null) {
        if (schema.enum && _.findWhere(schema.enum, {value: defaultValue})) {
          defaultValue = _.findWhere(schema.enum, {value: defaultValue}).description
        }
        return atom.tooltips.add(element, {
          title: `Default: ${defaultValue}`,
          delay: {show: 100},
          placement: 'auto left'
        })
      } else {
        return new Disposable(() => {}) // no-op
      }
    })

    return new CompositeDisposable(...disposables)
  }

  valueToString (value) {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return null
      }
      return value.map((val) => val.toString().replace(/,/g, '\\,')).join(', ')
    } else if (value != null) {
      return value.toString()
    } else {
      return null
    }
  }

  parseValue (type, value) {
    if (value === '') {
      return undefined
    } else if (type === 'number') {
      let floatValue = parseFloat(value)
      if (isNaN(floatValue)) {
        return value
      } else {
        return floatValue
      }
    } else if (type === 'integer') {
      let intValue = parseInt(value)
      if (isNaN(intValue)) {
        return value
      } else {
        return intValue
      }
    } else if (type === 'array') {
      let arrayValue = (value || '').split(',')
      arrayValue = arrayValue.reduce((values, val) => {
        const last = values.length - 1
        if (last >= 0 && values[last].endsWith('\\')) {
          values[last] = values[last].replace(/\\$/, ',') + val
        } else {
          values.push(val)
        }
        return values
      }, [])
      return arrayValue.filter((val) => val).map((val) => val.trim())
    } else {
      return value
    }
  }
}

/*
 * Space Pen Helpers
 */

let isEditableArray = function (array) {
  for (let item of array) {
    if (!_.isString(item)) {
      return false
    }
  }
  return true
}

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

function addOverrideWarning (name, element) {
  let div = document.createElement('div')
  div.classList.add('text-warning', 'setting-override-warning')
  div.textContent = `This global setting has been overridden by a project-specific setting. Changing it will affect your global config file, but may not have any effect in this window.`
  div.dataset.settingKey = name

  element.appendChild(div)
  return div
}

function elementForSetting (namespace, name, value) {
  let hasOverride = settingHasProjectOverride(`${namespace}.${name}`)
  if (namespace === 'core') {
    if (name === 'themes') { return document.createDocumentFragment() } // Handled in the Themes panel
    if (name === 'disabledPackages') { return document.createDocumentFragment() } // Handled in the Packages panel
    if (name === 'customFileTypes') { return document.createDocumentFragment() }
    if (name === 'uriHandlerRegistration') { return document.createDocumentFragment() } // Handled in the URI Handler panel
  }

  if (namespace === 'editor') {
    // There's no global default for these, they are defined by language packages
    if (['commentStart', 'commentEnd', 'increaseIndentPattern', 'decreaseIndentPattern', 'foldEndPattern'].includes(name)) {
      return document.createDocumentFragment()
    }
  }

  const controlGroup = document.createElement('div')
  controlGroup.classList.add('control-group')

  const controls = document.createElement('div')
  controls.classList.add('controls')
  controlGroup.appendChild(controls)

  let el = addOverrideWarning(`${namespace}.${name}`, controlGroup)
  el.style.display = hasOverride ? 'block' : 'none'

  let schema = atom.config.getSchema(`${namespace}.${name}`)
  if (schema && schema.enum) {
    controls.appendChild(elementForOptions(namespace, name, value, {radio: schema.radio}))
  } else if (schema && schema.type === 'color') {
    controls.appendChild(elementForColor(namespace, name, value))
  } else if (_.isBoolean(value) || (schema && schema.type === 'boolean')) {
    controls.appendChild(elementForCheckbox(namespace, name, value))
  } else if (_.isArray(value) || (schema && schema.type === 'array')) {
    if (isEditableArray(value)) {
      controls.appendChild(elementForArray(namespace, name, value))
    }
  } else if (_.isObject(value) || (schema && schema.type === 'object')) {
    controls.appendChild(elementForObject(namespace, name, value))
  } else {
    controls.appendChild(elementForEditor(namespace, name, value))
  }

  return controlGroup
}

function elementForOptions (namespace, name, value, {radio = false}) {
  let keyPath = `${namespace}.${name}`
  let schema = atom.config.getSchema(keyPath)
  let options = (schema && schema.enum) ? schema.enum : []

  const fragment = document.createDocumentFragment()

  const label = document.createElement('label')
  label.classList.add('control-label')

  const titleDiv = document.createElement('div')
  titleDiv.classList.add('setting-title')
  titleDiv.textContent = getSettingTitle(keyPath, name)
  label.appendChild(titleDiv)

  const descriptionDiv = document.createElement('div')
  descriptionDiv.classList.add('setting-description')
  descriptionDiv.innerHTML = getSettingDescription(keyPath)
  label.appendChild(descriptionDiv)

  fragment.appendChild(label)
  fragment.appendChild(enumOptions(options, {keyPath, radio}))

  return fragment
}

function elementForCheckbox (namespace, name, value) {
  let keyPath = `${namespace}.${name}`

  const div = document.createElement('div')
  div.classList.add('checkbox')

  const label = document.createElement('label')
  label.for = keyPath

  const input = document.createElement('input')
  input.id = keyPath
  input.type = 'checkbox'
  input.classList.add('input-checkbox')
  label.appendChild(input)

  const titleDiv = document.createElement('div')
  titleDiv.classList.add('setting-title')
  titleDiv.textContent = getSettingTitle(keyPath, name)
  label.appendChild(titleDiv)
  div.appendChild(label)

  const descriptionDiv = document.createElement('div')
  descriptionDiv.classList.add('setting-description')
  descriptionDiv.innerHTML = getSettingDescription(keyPath)
  div.appendChild(descriptionDiv)

  return div
}

function elementForColor (namespace, name, value) {
  let keyPath = `${namespace}.${name}`

  const div = document.createElement('div')
  div.classList.add('color')

  const label = document.createElement('label')
  label.for = keyPath

  const input = document.createElement('input')
  input.id = keyPath
  input.type = 'color'
  label.appendChild(input)

  const titleDiv = document.createElement('div')
  titleDiv.classList.add('setting-title')
  titleDiv.textContent = getSettingTitle(keyPath, name)
  label.appendChild(titleDiv)
  div.appendChild(label)

  const descriptionDiv = document.createElement('div')
  descriptionDiv.classList.add('setting-description')
  descriptionDiv.innerHTML = getSettingDescription(keyPath)
  div.appendChild(descriptionDiv)

  return div
}

function elementForEditor (namespace, name, value) {
  let keyPath = `${namespace}.${name}`
  let type = _.isNumber(value) ? 'number' : 'string'

  const fragment = document.createDocumentFragment()

  const label = document.createElement('label')
  label.classList.add('control-label')

  const titleDiv = document.createElement('div')
  titleDiv.classList.add('setting-title')
  titleDiv.textContent = getSettingTitle(keyPath, name)
  label.appendChild(titleDiv)

  const descriptionDiv = document.createElement('div')
  descriptionDiv.classList.add('setting-description')
  descriptionDiv.innerHTML = getSettingDescription(keyPath)
  label.appendChild(descriptionDiv)
  fragment.appendChild(label)

  const controls = document.createElement('div')
  controls.classList.add('controls')

  const editorContainer = document.createElement('div')
  editorContainer.classList.add('editor-container')

  const editor = new TextEditor({mini: true})
  editor.element.id = keyPath
  editor.element.setAttribute('type', type)
  editorContainer.appendChild(editor.element)
  controls.appendChild(editorContainer)
  fragment.appendChild(controls)

  return fragment
}

function elementForArray (namespace, name, value) {
  let keyPath = `${namespace}.${name}`

  const fragment = document.createDocumentFragment()

  const label = document.createElement('label')
  label.classList.add('control-label')

  const titleDiv = document.createElement('div')
  titleDiv.classList.add('setting-title')
  titleDiv.textContent = getSettingTitle(keyPath, name)
  label.appendChild(titleDiv)

  const descriptionDiv = document.createElement('div')
  descriptionDiv.classList.add('setting-description')
  descriptionDiv.innerHTML = getSettingDescription(keyPath)
  label.appendChild(descriptionDiv)
  fragment.appendChild(label)

  const controls = document.createElement('div')
  controls.classList.add('controls')

  const editorContainer = document.createElement('div')
  editorContainer.classList.add('editor-container')

  const editor = new TextEditor({mini: true})
  editor.element.id = keyPath
  editor.element.setAttribute('type', 'array')
  editorContainer.appendChild(editor.element)
  controls.appendChild(editorContainer)
  fragment.appendChild(controls)

  return fragment
}

function elementForObject (namespace, name, value) {
  if (_.keys(value).length === 0) {
    return document.createDocumentFragment()
  } else {
    let keyPath = `${namespace}.${name}`
    let schema = atom.config.getSchema(keyPath)
    let isCollapsed = schema.collapsed === true

    const section = document.createElement('section')
    section.classList.add('sub-section')
    if (isCollapsed) {
      section.classList.add('collapsed')
    }

    const h3 = document.createElement('h3')
    h3.classList.add('sub-section-heading', 'has-items')
    h3.textContent = getSettingTitle(keyPath, name)
    section.appendChild(h3)

    const descriptionDiv = document.createElement('div')
    descriptionDiv.classList.add('setting-description')
    descriptionDiv.innerHTML = getSettingDescription(keyPath)
    section.appendChild(descriptionDiv)

    const div = document.createElement('div')
    div.classList.add('sub-section-body')
    for (const key of sortSettings(keyPath, value)) {
      div.appendChild(elementForSetting(namespace, `${name}.${key}`, value[key]))
    }
    section.appendChild(div)

    return section
  }
}

function enumOptions (options, {keyPath, radio}) {
  const containerTag = radio ? 'fieldset' : 'select'
  const container = document.createElement(containerTag)
  container.id = keyPath
  const containerClass = radio ? 'input-radio-group' : 'form-control'
  container.classList.add(containerClass)

  const conversion = radio ? optionToRadio : optionToSelect
  const optionElements = options.map(option => conversion(option, keyPath))

  for (const optionElement of optionElements) { container.appendChild(optionElement) }

  return container
}

function optionToRadio (option, keyPath) {
  const button = document.createElement('input')
  const label = document.createElement('label')
  label.classList.add('input-label')
  let value
  let description = ''
  if (option.hasOwnProperty('value')) {
    value = option.value
    description = option.description
  } else {
    value = option
    description = option
  }
  button.classList.add('input-radio')
  button.id = `${keyPath}[${value}]`
  button.name = keyPath
  button.type = 'radio'
  button.value = value
  label.appendChild(button)
  label.appendChild(document.createTextNode(description))
  return label
}

function optionToSelect (option, keyPath) {
  const optionElement = document.createElement('option')
  if (option.hasOwnProperty('value')) {
    optionElement.value = option.value
    optionElement.textContent = option.description
  } else {
    optionElement.value = option
    optionElement.textContent = option
  }
  return optionElement
}
