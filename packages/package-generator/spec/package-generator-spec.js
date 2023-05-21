const path = require('path')
const fs = require('fs-plus')
const temp = require('temp')
const PackageGeneratorView = require('../lib/package-generator-view')

const {it, fit, ffit, afterEach, beforeEach, conditionPromise} = require('./async-spec-helpers') // eslint-disable-line no-unused-vars

describe('Package Generator', () => {
  let packageGeneratorView = null

  const getWorkspaceView = () => atom.views.getView(atom.workspace)

  const typeToPackageNameMap = new Map([
    ['package', 'my-package'],
    ['language', 'language-my-language'],
    ['theme', 'my-theme-syntax']
  ])

  const typeToSelectedTextMap = new Map([
    ['package', 'my-package'],
    ['language', 'my-language'],
    ['theme', 'my-theme']
  ])

  beforeEach(async () => {
    await atom.workspace.open('sample.js')

    packageGeneratorView = new PackageGeneratorView()
  })

  for (const [type, name] of typeToPackageNameMap) {
    describe(`when generating a ${type}`, () => {
      it('displays a mini-editor with the correct text and selection', () => {
        packageGeneratorView.attach(type)
        const editor = packageGeneratorView.miniEditor
        expect(editor.getSelectedText()).toEqual(typeToSelectedTextMap.get(type))
        const base = atom.config.get('core.projectHome')
        expect(editor.getText()).toEqual(path.join(base, name))
      })
    })
  }

  describe('when ATOM_REPOS_HOME is set', () => {
    beforeEach(() => {
      process.env.ATOM_REPOS_HOME = '/atom/repos/home'
    })

    afterEach(() => {
      delete process.env.ATOM_REPOS_HOME
    })

    it('overrides the default path', () => {
      packageGeneratorView.attach('package')
      const editor = packageGeneratorView.miniEditor
      expect(editor.getSelectedText()).toEqual('my-package')
      const base = '/atom/repos/home'
      expect(editor.getText()).toEqual(path.join(base, 'my-package'))
    })
  })

  describe('when the modal panel is canceled', () => {
    it('detaches from the DOM and focuses the the previously focused element', () => {
      jasmine.attachToDOM(getWorkspaceView())
      packageGeneratorView.attach('theme')
      expect(packageGeneratorView.previouslyFocusedElement).not.toBeUndefined()

      expect(document.activeElement.closest('atom-text-editor')).toBe(packageGeneratorView.element.querySelector('atom-text-editor'))

      packageGeneratorView.close()
      expect(atom.workspace.getModalPanels()[0].isVisible()).toBe(false)
      expect(document.activeElement.closest('atom-text-editor')).toBe(atom.views.getView(atom.workspace.getActiveTextEditor()))
    })
  })

  describe('when a package is generated', () => {
    let [packageName, packagePath, packageRoot] = []

    const packageInitCommandFor = (path, type = 'package', syntax = atom.config.get('package-generator.packageSyntax')) => {
      if (type !== 'theme') {
        return ['init', `--${type}`, path, '--syntax', syntax]
      } else {
        return ['init', `--${type}`, path]
      }
    }

    beforeEach(() => {
      spyOn(atom, 'open')

      packageRoot = temp.mkdirSync('atom')
      packageName = 'sweet-package-dude'
      packagePath = path.join(packageRoot, packageName)
      fs.removeSync(packageRoot)
    })

    afterEach(() => fs.removeSync(packageRoot))

    it("forces the package's name to be lowercase with dashes", () => {
      packageName = 'CamelCaseIsForTheBirds'
      packagePath = path.join(path.dirname(packagePath), packageName)

      packageGeneratorView.attach('package')
      const editor = packageGeneratorView.miniEditor
      editor.setText(packagePath)
      const apmExecute = spyOn(packageGeneratorView, 'runCommand')
      packageGeneratorView.confirm()

      expect(apmExecute).toHaveBeenCalled()
      expect(apmExecute.mostRecentCall.args[0]).toBe(atom.packages.getApmPath())
      expect(apmExecute.mostRecentCall.args[1]).toEqual(packageInitCommandFor(`${path.join(path.dirname(packagePath), 'camel-case-is-for-the-birds')}`))
    })

    it("normalizes the package's path", () => {
      packagePath = path.join('~', 'the-package')

      packageGeneratorView.attach('package')
      const editor = packageGeneratorView.miniEditor
      editor.setText(packagePath)
      const apmExecute = spyOn(packageGeneratorView, 'runCommand')
      packageGeneratorView.confirm()

      expect(apmExecute).toHaveBeenCalled()
      expect(apmExecute.mostRecentCall.args[0]).toBe(atom.packages.getApmPath())
      expect(apmExecute.mostRecentCall.args[1]).toEqual(packageInitCommandFor(`${fs.normalize(packagePath)}`))
    })

    for (const type of typeToPackageNameMap.keys()) {
      describe(`when creating a ${type}`, () => {
        let apmExecute = null

        const generatePackage = async (insidePackagesDirectory) => {
          const editor = packageGeneratorView.miniEditor
          spyOn(packageGeneratorView, 'isStoredInDotAtom').andReturn(insidePackagesDirectory)
          expect(packageGeneratorView.element.parentElement).toBeTruthy()
          editor.setText(packagePath)
          apmExecute = spyOn(packageGeneratorView, 'runCommand').andCallFake((command, args, exit) => process.nextTick(() => exit()))
          packageGeneratorView.confirm()
          await conditionPromise(() => atom.open.callCount === 1)
          expect(atom.open).toHaveBeenCalledWith({pathsToOpen: [packagePath]})
        }

        beforeEach(() => {
          jasmine.useRealClock()
          jasmine.attachToDOM(getWorkspaceView())
          packageGeneratorView.attach(type)
        })

        describe(`when the ${type} is created outside of the packages directory`, () => {
          describe('when package-generator.createInDevMode is set to false', () => {
            it('calls `apm init` and `apm link`', async () => {
              atom.config.set('package-generator.createInDevMode', false)

              await generatePackage(false)
              expect(apmExecute.argsForCall[0][0]).toBe(atom.packages.getApmPath())
              expect(apmExecute.argsForCall[0][1]).toEqual(packageInitCommandFor(`${packagePath}`, type))
              expect(apmExecute.argsForCall[1][0]).toBe(atom.packages.getApmPath())
              expect(apmExecute.argsForCall[1][1]).toEqual(['link', `${packagePath}`])
            })
          })

          describe('when package-generator.createInDevMode is set to true', () => {
            it('calls `apm init` and `apm link --dev`', async () => {
              atom.config.set('package-generator.createInDevMode', true)

              await generatePackage(false)
              expect(apmExecute.argsForCall[0][0]).toBe(atom.packages.getApmPath())
              expect(apmExecute.argsForCall[0][1]).toEqual(packageInitCommandFor(`${packagePath}`, type))
              expect(apmExecute.argsForCall[1][0]).toBe(atom.packages.getApmPath())
              expect(apmExecute.argsForCall[1][1]).toEqual(['link', '--dev', `${packagePath}`])
            })
          })
        })

        describe(`when the ${type} is created inside the packages directory`, () => {
          it('calls `apm init`', async () => {
            await generatePackage(true)
            expect(apmExecute.argsForCall[0][0]).toBe(atom.packages.getApmPath())
            expect(apmExecute.argsForCall[0][1]).toEqual(packageInitCommandFor(`${packagePath}`, type))
            expect(atom.open.argsForCall[0][0].pathsToOpen[0]).toBe(packagePath)
            expect(apmExecute.argsForCall[1]).toBeUndefined()
          })
        })

        describe(`when the ${type} is a coffeescript package`, () => {
          it('calls `apm init` with the correct syntax option', async () => {
            atom.config.set('package-generator.packageSyntax', 'coffeescript')
            await generatePackage(true)
            expect(apmExecute.argsForCall[0][0]).toBe(atom.packages.getApmPath())
            expect(apmExecute.argsForCall[0][1]).toEqual(packageInitCommandFor(`${packagePath}`, type, 'coffeescript'))
          })
        })

        describe(`when the ${type} is a javascript package`, () => {
          it('calls `apm init` with the correct syntax option', async () => {
            atom.config.set('package-generator.packageSyntax', 'javascript')
            await generatePackage(true)
            expect(apmExecute.argsForCall[0][0]).toBe(atom.packages.getApmPath())
            expect(apmExecute.argsForCall[0][1]).toEqual(packageInitCommandFor(`${packagePath}`, type, 'javascript'))
          })
        })

        describe(`when the ${type} path already exists`, () => {
          it('displays an error', () => {
            fs.makeTreeSync(packagePath)

            const editor = packageGeneratorView.miniEditor
            editor.setText(packagePath)
            expect(packageGeneratorView.element.parentElement).toBeTruthy()
            expect(packageGeneratorView.element.querySelector('.error').offsetHeight).toBe(0)

            packageGeneratorView.confirm()
            expect(packageGeneratorView.element.parentElement).toBeTruthy()
            expect(packageGeneratorView.element.querySelector('.error').offsetHeight).not.toBe(0)
          })
        })
      })
    }
  })
})
