const path = require('path')
const _ = require('underscore-plus')
const {TextEditor, BufferedProcess, CompositeDisposable, Disposable} = require('atom')
const fs = require('fs-plus')

module.exports =
class PackageGeneratorView {
  constructor () {
    this.disposables = new CompositeDisposable()

    this.element = document.createElement('div')
    this.element.classList.add('package-generator')

    this.miniEditor = new TextEditor({mini: true})
    this.element.appendChild(this.miniEditor.element)

    this.error = document.createElement('div')
    this.error.classList.add('error')
    this.element.appendChild(this.error)

    this.message = document.createElement('div')
    this.message.classList.add('message')
    this.element.appendChild(this.message)

    this.disposables.add(atom.commands.add('atom-workspace', {
      'package-generator:generate-package': () => this.attach('package'),
      'package-generator:generate-language-package': () => this.attach('language'),
      'package-generator:generate-syntax-theme': () => this.attach('theme')
    }))

    const blurHandler = () => this.close()
    this.miniEditor.element.addEventListener('blur', blurHandler)
    this.disposables.add(new Disposable(() => this.miniEditor.element.removeEventListener('blur', blurHandler)))
    this.disposables.add(atom.commands.add(this.element, {
      'core:confirm': () => this.confirm(),
      'core:cancel': () => this.close()
    }))
  }

  destroy () {
    if (this.panel != null) this.panel.destroy()
    this.disposables.dispose()
  }

  attach (mode) {
    this.mode = mode
    if (this.panel == null) this.panel = atom.workspace.addModalPanel({item: this, visible: false})
    this.previouslyFocusedElement = document.activeElement
    this.panel.show()
    this.message.textContent = `Enter ${this.mode} path`
    if (this.mode === 'package') {
      this.setPathText('my-package')
    } else if (this.mode === 'language') {
      this.setPathText('language-my-language', [9, Infinity])
    } else {
      this.setPathText('my-theme-syntax', [0, 8])
    }
    this.miniEditor.element.focus()
  }

  setPathText (placeholderName, rangeToSelect) {
    if (rangeToSelect == null) rangeToSelect = [0, placeholderName.length]
    const packagesDirectory = this.getPackagesDirectory()
    this.miniEditor.setText(path.join(packagesDirectory, placeholderName))
    const pathLength = this.miniEditor.getText().length
    const endOfDirectoryIndex = pathLength - placeholderName.length
    this.miniEditor.setSelectedBufferRange([[0, endOfDirectoryIndex + rangeToSelect[0]], [0, endOfDirectoryIndex + rangeToSelect[1]]])
  }

  close () {
    if (!this.panel.isVisible()) return
    this.panel.hide()
    if (this.previouslyFocusedElement != null) this.previouslyFocusedElement.focus()
  }

  confirm () {
    if (this.validPackagePath()) {
      this.createPackageFiles(() => {
        const packagePath = this.getPackagePath()
        atom.open({pathsToOpen: [packagePath]})
        this.close()
      })
    }
  }

  getPackagePath () {
    const packagePath = fs.normalize(this.miniEditor.getText().trim())
    const packageName = _.dasherize(path.basename(packagePath))
    return path.join(path.dirname(packagePath), packageName)
  }

  getPackagesDirectory () {
    return process.env.ATOM_REPOS_HOME || atom.config.get('core.projectHome') || path.join(fs.getHomeDirectory(), 'github')
  }

  validPackagePath () {
    if (fs.existsSync(this.getPackagePath())) {
      this.error.textContent = `Path already exists at '${this.getPackagePath()}'`
      this.error.style.display = 'block'
      return false
    } else {
      return true
    }
  }

  getInitOptions (packagePath) {
    const options = [`--${this.mode}`, packagePath]
    if (this.mode !== 'theme') {
      return [...options, '--syntax', atom.config.get('package-generator.packageSyntax')]
    } else {
      return options
    }
  }

  initPackage (packagePath, callback) {
    const command = ['init'].concat(this.getInitOptions(packagePath))
    this.runCommand(atom.packages.getApmPath(), command, callback)
  }

  linkPackage (packagePath, callback) {
    const args = ['link']
    if (atom.config.get('package-generator.createInDevMode')) args.push('--dev')
    args.push(packagePath.toString())

    this.runCommand(atom.packages.getApmPath(), args, callback)
  }

  isStoredInDotAtom (packagePath) {
    const packagesPath = path.join(atom.getConfigDirPath(), 'packages', path.sep)
    if (packagePath.startsWith(packagesPath)) return true

    const devPackagesPath = path.join(atom.getConfigDirPath(), 'dev', 'packages', path.sep)
    return packagePath.startsWith(devPackagesPath)
  }

  createPackageFiles (callback) {
    const packagePath = this.getPackagePath()

    if (this.isStoredInDotAtom(packagePath)) {
      this.initPackage(packagePath, callback)
    } else {
      this.initPackage(packagePath, () => this.linkPackage(packagePath, callback))
    }
  }

  runCommand (command, args, exit) {
    this.process = new BufferedProcess({command, args, exit})
  }
}
