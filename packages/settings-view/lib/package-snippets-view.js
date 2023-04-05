/** @babel */
/** @jsx etch.dom */

import path from 'path'
import _ from 'underscore-plus'
import etch from 'etch'
import {CompositeDisposable, Disposable} from 'atom'

// View to display the snippets that a package has registered.
export default class PackageSnippetsView {
  constructor (pack, snippetsProvider) {
    this.pack = pack
    this.namespace = this.pack.name
    this.snippetsProvider = snippetsProvider
    this.packagePath = path.join(pack.path, path.sep)
    etch.initialize(this)
    this.disposables = new CompositeDisposable()
    this.updateSnippetsView()

    const packagesWithSnippetsDisabled = atom.config.get('core.packagesWithSnippetsDisabled') || []
    this.refs.snippetToggle.checked = !packagesWithSnippetsDisabled.includes(this.namespace)

    const changeHandler = (event) => {
      event.stopPropagation()
      const value = this.refs.snippetToggle.checked
      if (value) {
        atom.config.removeAtKeyPath('core.packagesWithSnippetsDisabled', this.namespace)
      } else {
        atom.config.pushAtKeyPath('core.packagesWithSnippetsDisabled', this.namespace)
      }
      this.updateSnippetsView()
    }

    this.refs.snippetToggle.addEventListener('change', changeHandler)
    this.disposables.add(new Disposable(() => { this.refs.snippetToggle.removeEventListener('change', changeHandler) }))
  }

  destroy () {
    this.disposables.dispose()
    return etch.destroy(this)
  }

  update () {}

  render () {
    return (
      <section className='section'>
        <div className='section-heading icon icon-code'>Snippets</div>
        <div className='checkbox'>
          <label for='toggleSnippets'>
            <input id='toggleSnippets' className='input-checkbox' type='checkbox' ref='snippetToggle' />
            <div className='setting-title'>Enable</div>
          </label>
          <div className='setting-description' ref='snippetSettingDescription'>
            <p>Disable this if you want to prevent this package’s snippets from appearing as suggestions or if you want to customize them in your snippets file.</p>

            <p>To <strong>disable</strong> most snippets and <strong>enable</strong> just a few, use the <kbd>Copy</kbd> button on any snippet you want to enable, then paste the result into your own snippets file.</p>

            <p>To <strong>enable</strong> most snippets and <strong>disable</strong> just a few, use the <kbd>Copy</kbd> button on any snippet you want to disable, paste the result into your own snippets file, and change the body to <code>null</code>.</p>
          </div>
        </div>

        <table className='package-snippets-table table native-key-bindings text' tabIndex={-1}>
          <thead>
            <tr>
              <th>Trigger</th>
              <th ref="headingCommand">Command</th>
              <th>Name</th>
              <th>Scope</th>
              <th>Body</th>
            </tr>
          </thead>
          <tbody ref='snippets' />
        </table>
      </section>
    )
  }

  getSnippetProperties () {
    const packageProperties = {}
    for (const {name, properties} of this.snippetsProvider.getSnippets()) {
      if (name && name.indexOf && name.indexOf(this.packagePath) === 0) {
        const object = properties.snippets != null ? properties.snippets : {}
        for (let key in object) {
          const snippet = object[key]
          if (snippet != null) {
            if (packageProperties[key] == null) {
              packageProperties[key] = snippet
            }
          }
        }
      }
    }

    return _.values(packageProperties).sort((snippet1, snippet2) => {
      const prefix1 = snippet1.prefix != null ? snippet1.prefix : ''
      const prefix2 = snippet2.prefix != null ? snippet2.prefix : ''
      return prefix1.localeCompare(prefix2)
    })
  }

  getSnippets (callback) {
    const snippetsPackage = atom.packages.getLoadedPackage('snippets')
    const snippetsModule = snippetsPackage ? snippetsPackage.mainModule : null
    if (snippetsModule) {
      if (snippetsModule.loaded) {
        callback(this.getSnippetProperties())
      } else {
        snippetsModule.onDidLoadSnippets(() => callback(this.getSnippetProperties()))
      }
    } else {
      callback([]) // eslint-disable-line standard/no-callback-literal
    }
  }

  updateSnippetsView () {
    const packagesWithSnippetsDisabled = atom.config.get('core.packagesWithSnippetsDisabled') || []
    const snippetsDisabled = packagesWithSnippetsDisabled.includes(this.namespace)

    this.getSnippets((snippets) => {
      this.refs.snippets.innerHTML = ''

      let anyWithCommand = snippets.some(s => ('command' in s))

      if (snippetsDisabled) {
        this.refs.snippets.classList.add('text-subtle')
      } else {
        this.refs.snippets.classList.remove('text-subtle')
      }

      for (let {body, bodyText, command, name, packageName, prefix, selector} of snippets) {
        if (name == null) {
          name = ''
        }

        if (prefix == null) {
          prefix = ''
        }

        if (body == null) {
          body = bodyText || ''
        }

        if (selector == null) {
          selector = ''
        }

        let commandName = ''
        if (packageName && command) {
          commandName = `${packageName}:${command}`
        }

        const row = document.createElement('tr')

        const prefixTd = document.createElement('td')
        prefixTd.classList.add('snippet-prefix')
        prefixTd.textContent = prefix
        row.appendChild(prefixTd)

        const commandTd = document.createElement('td')
        commandTd.textContent = commandName
        row.appendChild(commandTd)
        commandTd.style.display = anyWithCommand ? '' : 'none'

        const nameTd = document.createElement('td')
        nameTd.textContent = name
        row.appendChild(nameTd)

        const scopeTd = document.createElement('td')
        scopeTd.classList.add('snippet-scope-name')
        scopeTd.textContent = selector
        row.appendChild(scopeTd)

        const bodyTd = document.createElement('td')
        bodyTd.classList.add('snippet-body')
        row.appendChild(bodyTd)

        this.refs.snippets.appendChild(row)
        this.createButtonsForSnippetRow(bodyTd, {body, prefix, scope: selector, name, command})
      }

      if (this.refs.snippets.children.length > 0) {
        this.element.style.display = ''
      } else {
        this.element.style.display = 'none'
      }

      // The “Command” column should only be shown if at least one snippet is
      // mapped to a command name.
      this.refs.headingCommand.style.display = anyWithCommand ? '' : 'none'
    })
  }

  createButtonsForSnippetRow (td, {scope, body, name, prefix, command}) {
    let buttonContainer = document.createElement('div')
    buttonContainer.classList.add('btn-group', 'btn-group-xs')

    let viewButton = document.createElement('button')
    let copyButton = document.createElement('button')

    viewButton.setAttribute('type', 'button')
    viewButton.textContent = 'View'
    viewButton.classList.add('btn', 'snippet-view-btn')

    let tooltip = atom.tooltips.add(viewButton, {
      title: body,
      html: false,
      trigger: 'click',
      placement: 'auto left',
      'class': 'snippet-body-tooltip'
    })

    this.disposables.add(tooltip)

    copyButton.setAttribute('type', 'button')
    copyButton.textContent = 'Copy'
    copyButton.classList.add('btn', 'snippet-copy-btn')

    copyButton.addEventListener('click', (event) => {
      event.preventDefault()
      return this.writeSnippetToClipboard({scope, body, name, prefix, command})
    })

    buttonContainer.appendChild(viewButton)
    buttonContainer.appendChild(copyButton)

    td.appendChild(buttonContainer)
  }

  writeSnippetToClipboard ({scope, body, name, prefix, command}) {
    let content
    const extension = path.extname(this.snippetsProvider.getUserSnippetsPath())
    body = body.replace(/\n/g, '\\n').replace(/\t/g, '\\t')
    // Either `prefix` or `command` will be present, or else both. Only copy
    // the values that are present.
    let triggers = []
    if (extension === '.cson') {
      if (prefix) {
        triggers.push(`    'prefix': '${prefix}'`)
      }
      if (command) {
        triggers.push(`    'command': '${command}'`)
      }
      body = body.replace(/'/g, `\\'`)
      content = `
'${scope}':
  '${name}':
${triggers.join('\n')}
    'body': '${body}'
`
    } else {
      if (prefix) {
        triggers.push(`    "prefix": "${prefix}"`)
      }
      if (command) {
        triggers.push(`    "command": "${command}"`)
      }
      body = body.replace(/"/g, `\\"`)
      content = `
  "${scope}": {
    "${name}": {
${triggers.join(',\n')}
      "body": "${body}"
    }
  }
`
    }

    atom.clipboard.write(content)
  }
}
