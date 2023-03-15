/** @babel */

import path from 'path'
import {CompositeDisposable} from 'atom'
import SettingsPanel from './settings-panel'

// View to display the grammars that a package has registered.
export default class PackageGrammarsView {
  constructor (packagePath) {
    this.element = document.createElement('section')
    this.element.classList.add('package-grammars')

    this.grammarSettings = document.createElement('div')
    this.element.appendChild(this.grammarSettings)

    this.disposables = new CompositeDisposable()
    this.packagePath = path.join(packagePath, path.sep)
    this.addGrammars()
    this.disposables.add(atom.grammars.onDidAddGrammar(() => this.addGrammars()))
    this.disposables.add(atom.grammars.onDidUpdateGrammar(() => this.addGrammars()))
  }

  destroy () {
    this.disposables.dispose()
    this.element.remove()
  }

  getPackageGrammars () {
    const packageGrammars = []
    const grammars = atom.grammars.grammars != null ? atom.grammars.grammars : []
    for (let grammar of grammars) {
      if (grammar.path) {
        if (grammar.path.indexOf(this.packagePath) === 0) {
          packageGrammars.push(grammar)
        }
      }
    }
    return packageGrammars.sort(function (grammar1, grammar2) {
      const name1 = grammar1.name || grammar1.scopeName || ''
      const name2 = grammar2.name || grammar2.scopeName || ''
      return name1.localeCompare(name2)
    })
  }

  addGrammarHeading (grammar, panel) {
    const container = document.createElement('div')
    container.classList.add('native-key-bindings', 'text')
    container.tabIndex = -1

    const grammarScope = document.createElement('div')
    grammarScope.classList.add('grammar-scope')

    const scopeStrong = document.createElement('strong')
    scopeStrong.textContent = 'Scope: '
    grammarScope.appendChild(scopeStrong)

    const scopeSpan = document.createElement('span')
    scopeSpan.textContent = grammar.scopeName != null ? grammar.scopeName : ''
    grammarScope.appendChild(scopeSpan)
    container.appendChild(grammarScope)

    const grammarFileTypes = document.createElement('div')
    grammarFileTypes.classList.add('grammar-filetypes')

    const fileTypesStrong = document.createElement('strong')
    fileTypesStrong.textContent = 'File Types: '
    grammarFileTypes.appendChild(fileTypesStrong)

    const fileTypes = grammar.fileTypes || []
    const fileTypesSpan = document.createElement('span')
    fileTypesSpan.textContent = fileTypes.join(', ')
    grammarFileTypes.appendChild(fileTypesSpan)
    container.appendChild(grammarFileTypes)

    const sectionBody = panel.element.querySelector('.section-body')
    sectionBody.parentElement.insertBefore(container, sectionBody)
  }

  addGrammars () {
    this.grammarSettings.innerHTML = ''
    for (let grammar of this.getPackageGrammars()) {
      let {scopeName, name} = grammar
      if (!scopeName || !name) {
        continue
      }

      if (!scopeName.startsWith('.')) {
        scopeName = `.${scopeName}`
      }

      const title = `${name} Grammar`
      const panel = new SettingsPanel({title, scopeName, icon: 'puzzle'})
      this.addGrammarHeading(grammar, panel)
      this.grammarSettings.appendChild(panel.element)
    }
  }
}
