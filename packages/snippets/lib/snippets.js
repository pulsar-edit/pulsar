const path = require('path')
const {Emitter, Disposable, CompositeDisposable, File} = require('atom')
const _ = require('underscore-plus')
const async = require('async')
const CSON = require('season')
const fs = require('fs')
const ScopedPropertyStore = require('scoped-property-store')

const Snippet = require('./snippet')
const SnippetExpansion = require('./snippet-expansion')
const EditorStore = require('./editor-store')
const {getPackageRoot} = require('./helpers')

// TODO: Not sure about validity of numbers in here, but might as well be
// permissive.
const COMMAND_NAME_PATTERN = /^[a-z\d][a-z\d\-]*[a-z\d]$/
function isValidCommandName (commandName) {
  return COMMAND_NAME_PATTERN.test(commandName)
}

function showCommandNameConflictNotification (name, commandName, packageName, snippetsPath) {
  let remedy
  if (packageName === 'builtin') {
    // If somehow this happens with a builtin snippet, something crazy is
    // happening. But we shouldn't show a notification because there's no
    // action for the user to take. Just fail silently.
    return
  }
  if (packageName === 'snippets') {
    let extension = snippetsPath.substring(snippetsPath.length - 4)
    remedy = `Edit your \`snippets.${extension}\` file to resolve this conflict.`
  } else {
    remedy = `Contact the maintainer of \`${packageName}\` so they can resolve this conflict.`
  }
  const message = `Cannot register command \`${commandName}\` for snippet “${name}” because that command name already exists.\n\n${remedy}`
  atom.notifications.addError(
    `Snippets conflict`,
    {
      description: message,
      dismissable: true
    }
  )
}

function showInvalidCommandNameNotification (name, commandName) {
  const message = `Cannot register \`${commandName}\` for snippet “${name}” because the command name isn’t valid. Command names must be all lowercase and use hyphens between words instead of spaces.`
  atom.notifications.addError(
    `Snippets error`,
    {
      description: message,
      dismissable: true
    }
  )
}

// When we first run, checking `atom.commands.registeredCommands` is a good way
// of checking whether a command of a certain name already exists. But if we
// register a command and then unregister it (e.g., upon later disabling of a
// package's snippets), the relevant key won't get deleted from
// `registeredCommands`. So if the user re-enables the snippets, we'll
// incorrectly think that the command already exists.
//
// Hence, after the first check, we have to keep track ourselves. At least this
// gives us a place to keep track of individual command disposables.
//
const CommandMonitor = {
  map: new Map,
  disposables: new Map,
  compositeDisposable: new CompositeDisposable,
  exists (commandName) {
    let {map} = this
    if (!map.has(commandName)) {
      // If it's missing altogether from the registry, we haven't asked yet.
      let value = atom.commands.registeredCommands[commandName]
      map.set(commandName, value)
      return value
    } else {
      return map.get(commandName)
    }
  },

  add (commandName, disposable) {
    this.map.set(commandName, true)
    this.disposables.set(commandName, disposable)
    this.compositeDisposable.add(disposable)
  },

  remove (commandName) {
    this.map.set(commandName, false)
    let disposable = this.disposables.get(commandName)
    if (disposable) { disposable.dispose() }
  },

  reset () {
    this.map.clear()
    this.disposables.clear()
    this.compositeDisposable.dispose()
  }
}

// When we load snippets from packages, we're given a bunch of package paths
// instead of package names. This lets us match the former to the latter.
const PackageNameResolver = {
  pathsToNames: new Map,
  setup () {
    this.pathsToNames.clear()
    let meta = atom.packages.getLoadedPackages() || []
    for (let {name, path} of meta) {
      this.pathsToNames.set(path, name)
    }
    if (!this._observing) {
      atom.packages.onDidLoadPackage(() => this.setup())
      atom.packages.onDidUnloadPackage(() => this.setup())
    }
    this._observing = true
  },
  find (filePath) {
    for (let [packagePath, name] of this.pathsToNames.entries()) {
      if (filePath.startsWith(`${packagePath}${path.sep}`)) return name
    }
    return null
  }
}

module.exports = {
  activate () {
    this.loaded = false
    this.userSnippetsPath = null
    this.snippetIdCounter = 0
    this.snippetsByPackage = new Map
    this.parsedSnippetsById = new Map
    this.editorMarkerLayers = new WeakMap

    this.scopedPropertyStore = new ScopedPropertyStore
    // The above ScopedPropertyStore will store the main registry of snippets.
    // But we need a separate ScopedPropertyStore for the snippets that come
    // from disabled packages. They're isolated so that they're not considered
    // as candidates when the user expands a prefix, but we still need the data
    // around so that the snippets provided by those packages can be shown in
    // the settings view.
    this.disabledSnippetsScopedPropertyStore = new ScopedPropertyStore

    this.subscriptions = new CompositeDisposable
    this.subscriptions.add(atom.workspace.addOpener(uri => {
      if (uri === 'atom://.pulsar/snippets') {
        return atom.workspace.openTextFile(this.getUserSnippetsPath())
      }
    }))

    PackageNameResolver.setup()

    this.loadAll()
    this.watchUserSnippets(watchDisposable => {
      this.subscriptions.add(watchDisposable)
    })

    this.subscriptions.add(
      atom.config.onDidChange(
        'core.packagesWithSnippetsDisabled',
        ({newValue, oldValue}) => {
          this.handleDisabledPackagesDidChange(newValue, oldValue)
        }
      )
    )

    const snippets = this

    this.subscriptions.add(atom.commands.add('atom-text-editor', {
      'snippets:expand' (event) {
        const editor = this.getModel()
        if (snippets.snippetToExpandUnderCursor(editor)) {
          snippets.clearExpansions(editor)
          snippets.expandSnippetsUnderCursors(editor)
        } else {
          event.abortKeyBinding()
        }
      },

      'snippets:next-tab-stop' (event) {
        const editor = this.getModel()
        if (!snippets.goToNextTabStop(editor)) { event.abortKeyBinding() }
      },

      'snippets:previous-tab-stop' (event) {
        const editor = this.getModel()
        if (!snippets.goToPreviousTabStop(editor)) { event.abortKeyBinding() }
      },

      'snippets:available' (event) {
        const editor = this.getModel()
        const SnippetsAvailable = require('./snippets-available')
        if (snippets.availableSnippetsView == null) {
          snippets.availableSnippetsView = new SnippetsAvailable(snippets)
        }
        snippets.availableSnippetsView.toggle(editor)
      }
    }))
  },

  deactivate () {
    if (this.emitter != null) {
      this.emitter.dispose()
    }
    this.emitter = null
    this.editorSnippetExpansions = null
    atom.config.transact(() => this.subscriptions.dispose())
    CommandMonitor.reset()
  },

  getUserSnippetsPath () {
    if (this.userSnippetsPath != null) { return this.userSnippetsPath }

    this.userSnippetsPath = CSON.resolve(path.join(atom.getConfigDirPath(), 'snippets'))
    if (this.userSnippetsPath == null) { this.userSnippetsPath = path.join(atom.getConfigDirPath(), 'snippets.cson') }
    return this.userSnippetsPath
  },

  loadAll () {
    this.loadBundledSnippets(bundledSnippets => {
      this.loadPackageSnippets(packageSnippets => {
        this.loadUserSnippets(userSnippets => {
          atom.config.transact(() => {
            for (const [filepath, snippetsBySelector] of Object.entries(bundledSnippets)) {
              this.add(filepath, snippetsBySelector, 'builtin')
            }
            for (const [filepath, snippetsBySelector] of Object.entries(packageSnippets)) {
              let packageName = PackageNameResolver.find(filepath) || 'snippets'
              this.add(filepath, snippetsBySelector, packageName)
            }
            for (const [filepath, snippetsBySelector] of Object.entries(userSnippets)) {
              this.add(filepath, snippetsBySelector, 'snippets')
            }
          })
          this.doneLoading()
        })
      })
    })
  },

  loadBundledSnippets (callback) {
    const bundledSnippetsPath = CSON.resolve(path.join(getPackageRoot(), 'lib', 'snippets'))
    this.loadSnippetsFile(bundledSnippetsPath, snippets => {
      const snippetsByPath = {}
      snippetsByPath[bundledSnippetsPath] = snippets
      callback(snippetsByPath)
    })
  },

  loadUserSnippets (callback) {
    const userSnippetsPath = this.getUserSnippetsPath()
    fs.stat(userSnippetsPath, (error, stat) => {
      if (stat != null && stat.isFile()) {
        this.loadSnippetsFile(userSnippetsPath, snippets => {
          const result = {}
          result[userSnippetsPath] = snippets
          callback(result)
        })
      } else {
        callback({})
      }
    })
  },

  watchUserSnippets (callback) {
    const userSnippetsPath = this.getUserSnippetsPath()
    fs.stat(userSnippetsPath, (error, stat) => {
      if (stat != null && stat.isFile()) {
        const userSnippetsFileDisposable = new CompositeDisposable()
        const userSnippetsFile = new File(userSnippetsPath)
        try {
          userSnippetsFileDisposable.add(userSnippetsFile.onDidChange(() => this.handleUserSnippetsDidChange()))
          userSnippetsFileDisposable.add(userSnippetsFile.onDidDelete(() => this.handleUserSnippetsDidChange()))
          userSnippetsFileDisposable.add(userSnippetsFile.onDidRename(() => this.handleUserSnippetsDidChange()))
        } catch (e) {
          const message = `\
          Unable to watch path: \`snippets.cson\`. Make sure you have permissions
          to the \`~/.pulsar\` directory and \`${userSnippetsPath}\`.

          On linux there are currently problems with watch sizes. See
          [this document][watches] for more info.
          [watches]:https://github.com/atom/atom/blob/master/docs/build-instructions/linux.md#typeerror-unable-to-watch-path\
          `
          atom.notifications.addError(message, {dismissable: true})
        }

        callback(userSnippetsFileDisposable)
      } else {
        callback(new Disposable())
      }
    })
  },

  // Called when a user's snippets file is changed, deleted, or moved so that we
  // can immediately re-process the snippets it contains.
  handleUserSnippetsDidChange () {
    // TODO: There appear to be scenarios where this method gets invoked more
    // than once with each change to the user's `snippets.cson`. To prevent
    // more than one concurrent rescan of the snippets file, we block any
    // additional calls to this method while the first call is still operating.
    const userSnippetsPath = this.getUserSnippetsPath()

    if (this.isHandlingUserSnippetsChange) {
      return
    }

    this.isHandlingUserSnippetsChange = true
    atom.config.transact(() => {
      this.clearSnippetsForPath(userSnippetsPath)
      this.loadSnippetsFile(userSnippetsPath, result => {
        this.add(userSnippetsPath, result, 'snippets')
        this.isHandlingUserSnippetsChange = false
      })
    })
  },

  // Called when the "Enable" checkbox is checked/unchecked in the Snippets
  // section of a package's settings view.
  handleDisabledPackagesDidChange (newDisabledPackages = [], oldDisabledPackages = []) {
    const packagesToAdd = []
    const packagesToRemove = []
    for (const p of oldDisabledPackages) {
      if (!newDisabledPackages.includes(p)) { packagesToAdd.push(p) }
    }

    for (const p of newDisabledPackages) {
      if (!oldDisabledPackages.includes(p)) { packagesToRemove.push(p) }
    }

    atom.config.transact(() => {
      for (const p of packagesToRemove) { this.removeSnippetsForPackage(p) }
      for (const p of packagesToAdd) { this.addSnippetsForPackage(p) }
    })
  },

  addSnippetsForPackage (packageName) {
    const snippetSet = this.snippetsByPackage.get(packageName)
    for (const filePath in snippetSet) {
      const snippetsBySelector = snippetSet[filePath]
      this.add(filePath, snippetsBySelector, packageName)
    }
  },

  removeSnippetsForPackage (packageName) {
    const snippetSet = this.snippetsByPackage.get(packageName)
    // Copy these snippets to the "quarantined" ScopedPropertyStore so that they
    // remain present in the list of unparsed snippets reported to the settings
    // view.
    this.addSnippetsInDisabledPackage(snippetSet)
    for (const filePath in snippetSet) {
      this.clearSnippetsForPath(filePath)
    }
  },

  loadPackageSnippets (callback) {
    const disabledPackageNames = atom.config.get('core.packagesWithSnippetsDisabled') || []
    const packages = atom.packages.getLoadedPackages().sort((pack, _) => {
      return pack.path.includes(`${path.sep}node_modules${path.sep}`) ? -1 : 1
    })

    const snippetsDirPaths = []
    for (const pack of packages) {
      snippetsDirPaths.push(path.join(pack.path, 'snippets'))
    }

    async.map(snippetsDirPaths, this.loadSnippetsDirectory.bind(this), (error, results) => {
      const zipped = []
      for (const key in results) {
        zipped.push({result: results[key], pack: packages[key]})
      }

      const enabledPackages = []
      for (const o of zipped) {
        // Skip packages that contain no snippets.
        if (Object.keys(o.result).length === 0) { continue }
        // Keep track of which snippets come from which packages so we can
        // unload them selectively later. All packages get put into this map,
        // even disabled packages, because we need to know which snippets to add
        // if those packages are enabled again.
        this.snippetsByPackage.set(o.pack.name, o.result)
        if (disabledPackageNames.includes(o.pack.name)) {
          // Since disabled packages' snippets won't get added to the main
          // ScopedPropertyStore, we'll keep track of them in a separate
          // ScopedPropertyStore so that they can still be represented in the
          // settings view.
          this.addSnippetsInDisabledPackage(o.result)
        } else {
          enabledPackages.push(o.result)
        }
      }

      callback(_.extend({}, ...enabledPackages))
    })
  },

  doneLoading () {
    this.loaded = true
    this.getEmitter().emit('did-load-snippets')
  },

  onDidLoadSnippets (callback) {
    this.getEmitter().on('did-load-snippets', callback)
  },

  getEmitter () {
    if (this.emitter == null) {
      this.emitter = new Emitter
    }
    return this.emitter
  },

  loadSnippetsDirectory (snippetsDirPath, callback) {
    fs.stat(snippetsDirPath, (error, stat) => {
      if (error || !stat.isDirectory()) return callback(null, {})

      fs.readdir(snippetsDirPath, (error, entries) => {
        if (error) {
          console.warn(`Error reading snippets directory ${snippetsDirPath}`, error)
          return callback(null, {})
        }

        async.map(
          entries,
          (entry, done) => {
            const filePath = path.join(snippetsDirPath, entry)
            this.loadSnippetsFile(filePath, snippets => done(null, {filePath, snippets}))
          },
          (error, results) => {
            const snippetsByPath = {}
            for (const {filePath, snippets} of results) {
              snippetsByPath[filePath] = snippets
            }
            callback(null, snippetsByPath)
          }
        )
      })
    })
  },

  loadSnippetsFile (filePath, callback) {
    if (!CSON.isObjectPath(filePath)) { return callback({}) }
    CSON.readFile(filePath, {allowDuplicateKeys: false}, (error, object = {}) => {
      if (error != null) {
        console.warn(`Error reading snippets file '${filePath}': ${error.stack != null ? error.stack : error}`)
        atom.notifications.addError(`Failed to load snippets from '${filePath}'`, {detail: error.message, dismissable: true})
      }
      callback(object)
    })
  },

  add (filePath, snippetsBySelector, packageName = null, isDisabled = false) {
    packageName ??= 'snippets'
    for (const selector in snippetsBySelector) {
      const snippetsByName = snippetsBySelector[selector]
      const unparsedSnippetsByPrefix = {}
      for (const name in snippetsByName) {
        const attributes = snippetsByName[name]
        const {prefix, command, body} = attributes
        if (!prefix && !command) {
          // A snippet must define either `prefix` or `command`, or both.
          // TODO: Worth showing notification?
          console.error(`Skipping snippet ${name}: no "prefix" or "command" property present`)
          continue
        }
        attributes.selector = selector
        attributes.name = name
        attributes.id = this.snippetIdCounter++
        attributes.packageName = packageName
        // Snippets with "prefix"es will get indexed according to that prefix.
        // Snippets without "prefix"es will be indexed by their ID below _if_
        // they have a "command" property. Snippets without "prefix" or
        // "command" have already been filtered out.
        if (prefix) {
          if (typeof body === 'string') {
            unparsedSnippetsByPrefix[prefix] = attributes
          } else if (body == null) {
            unparsedSnippetsByPrefix[prefix] = null
          }
        }
        if (command) {
          if (!isValidCommandName(command)) {
            showInvalidCommandNameNotification(name, command)
            continue
          }
          if (!prefix) {
            // We need a key for these snippets that will not clash with any
            // prefix key. Since prefixes aren't allowed to have spaces, we'll
            // put a space in this key.
            //
            // We'll use the snippet ID as part of the key. If a snippet's
            // `command` property clashes with another command, we'll catch
            // that later.
            let unparsedSnippetsKey = `command ${attributes.id}`
            if (typeof body === 'string') {
              unparsedSnippetsByPrefix[unparsedSnippetsKey] = attributes
            } else {
              unparsedSnippetsByPrefix[unparsedSnippetsKey] = null
            }
          }
          if (!isDisabled) {
            this.addCommandForSnippet(attributes, packageName, selector)
          }
        }
      }

      this.storeUnparsedSnippets(unparsedSnippetsByPrefix, filePath, selector, packageName, isDisabled)
    }
  },

  addCommandForSnippet (attributes, packageName, selector) {
    packageName = packageName || 'snippets'
    let {name, command} = attributes
    let commandName = `${packageName}:${command}`
    if (CommandMonitor.exists(commandName)) {
      console.error(`Skipping ${commandName} because it's already been registered!`)
      showCommandNameConflictNotification(
        name,
        commandName,
        packageName,
        this.getUserSnippetsPath()
      )
      // We won't remove the snippet because it might still be triggerable by
      // prefix. But we will null out the `command` property to prevent any
      // possible confusion.
      attributes.command = null
      return
    }

    let commandHandler = (event) => {
      let editor = event.target.closest('atom-text-editor').getModel()

      // We match the multi-cursor behavior that prefix-triggered snippets
      // exhibit: only the last cursor determines which scoped set of snippets
      // we pull, but we'll insert this snippet for each cursor, whether it
      // happens to be valid for that cursor's scope or not. This could
      // possibly be refined in the future.
      let snippets = this.getSnippets(editor)

      let targetSnippet = null
      for (let snippet of Object.values(snippets)) {
        if (snippet.id === attributes.id) {
          targetSnippet = snippet
          break
        }
      }

      if (!targetSnippet) {
        // We don't show an error notification here because it isn't
        // necessarily a mistake. But we put a warning in the console just in
        // case the user is confused.
        console.warn(`Snippet “${name}” not invoked because its scope was not matched.`)

        // Because its scope was not matched, we abort the key binding; this
        // signals to the key binding resolver that it can pick the next
        // candidate for a key shortcut, if one exists.
        return event.abortKeyBinding()
      }

      this.expandSnippet(editor, targetSnippet)
    }

    let disposable = atom.commands.add(
      'atom-text-editor',
      commandName,
      commandHandler
    )

    this.subscriptions.add(disposable)
    CommandMonitor.add(commandName, disposable)
  },

  addSnippetsInDisabledPackage (bundle) {
    for (const filePath in bundle) {
      const snippetsBySelector = bundle[filePath]
      const packageName = PackageNameResolver.find(filePath)
      this.add(filePath, snippetsBySelector, packageName, true)
    }
  },

  getScopeChain (object) {
    let scopesArray = object
    if (object && object.getScopesArray) {
      scopesArray = object.getScopesArray()
    }

    return scopesArray
      .map(scope => scope[0] === '.' ? scope : `.${scope}`)
      .join(' ')
  },

  storeUnparsedSnippets (value, path, selector, packageName, isDisabled = false) {
    // The `isDisabled` flag determines which scoped property store we'll use.
    // Active snippets get put into one and inactive snippets get put into
    // another. Only the first one gets consulted when we look up a snippet
    // prefix for expansion, but both stores have their contents exported when
    // the settings view asks for all available snippets.
    const unparsedSnippets = {}
    unparsedSnippets[selector] = {"snippets": value}
    const store = isDisabled ? this.disabledSnippetsScopedPropertyStore : this.scopedPropertyStore
    store.addProperties(path, unparsedSnippets, {priority: this.priorityForSource(path)})
  },

  clearSnippetsForPath (path) {
    for (const scopeSelector in this.scopedPropertyStore.propertiesForSource(path)) {
      let object = this.scopedPropertyStore.propertiesForSourceAndSelector(path, scopeSelector)
      if (object.snippets) { object = object.snippets }
      for (const prefix in object) {
        const attributes = object[prefix]
        if (!attributes) { continue }
        let {command, packageName} = attributes
        if (packageName && command) {
          CommandMonitor.remove(`${packageName}:${command}`)
        }
        this.parsedSnippetsById.delete(attributes.id)
      }

      this.scopedPropertyStore.removePropertiesForSourceAndSelector(path, scopeSelector)
    }
  },

  parsedSnippetsForScopes (scopeDescriptor) {
    let unparsedLegacySnippetsByPrefix

    const unparsedSnippetsByPrefix = this.scopedPropertyStore.getPropertyValue(
      this.getScopeChain(scopeDescriptor),
      "snippets"
    )

    const legacyScopeDescriptor = atom.config.getLegacyScopeDescriptorForNewScopeDescriptor
      ? atom.config.getLegacyScopeDescriptorForNewScopeDescriptor(scopeDescriptor)
      : undefined

    if (legacyScopeDescriptor) {
      unparsedLegacySnippetsByPrefix = this.scopedPropertyStore.getPropertyValue(
        this.getScopeChain(legacyScopeDescriptor),
        "snippets"
      )
    }

    const snippets = {}

    if (unparsedSnippetsByPrefix) {
      for (const prefix in unparsedSnippetsByPrefix) {
        const attributes = unparsedSnippetsByPrefix[prefix]
        if (typeof (attributes != null ? attributes.body : undefined) !== 'string') { continue }
        snippets[prefix] = this.getParsedSnippet(attributes)
      }
    }

    if (unparsedLegacySnippetsByPrefix) {
      for (const prefix in unparsedLegacySnippetsByPrefix) {
        const attributes = unparsedLegacySnippetsByPrefix[prefix]
        if (snippets[prefix]) { continue }
        if (typeof (attributes != null ? attributes.body : undefined) !== 'string') { continue }
        snippets[prefix] = this.getParsedSnippet(attributes)
      }
    }

    return snippets
  },

  getParsedSnippet (attributes) {
    let snippet = this.parsedSnippetsById.get(attributes.id)
    if (snippet == null) {
      let {id, prefix, command, name, body, bodyTree, description, packageName, descriptionMoreURL, rightLabelHTML, leftLabel, leftLabelHTML, selector} = attributes
      if (bodyTree == null) { bodyTree = this.getBodyParser().parse(body) }
      snippet = new Snippet({id, name, prefix, command, bodyTree, description, packageName, descriptionMoreURL, rightLabelHTML, leftLabel, leftLabelHTML, selector, bodyText: body})
      this.parsedSnippetsById.set(attributes.id, snippet)
    }
    return snippet
  },

  priorityForSource (source) {
    if (source === this.getUserSnippetsPath()) {
      return 1000
    } else {
      return 0
    }
  },

  getBodyParser () {
    if (this.bodyParser == null) {
      this.bodyParser = require('./snippet-body-parser')
    }
    return this.bodyParser
  },

  // Get an {Object} with these keys:
  // * `snippetPrefix`: the possible snippet prefix text preceding the cursor
  // * `wordPrefix`: the word preceding the cursor
  //
  // Returns `null` if the values aren't the same for all cursors
  getPrefixText (snippets, editor) {
    const wordRegex = this.wordRegexForSnippets(snippets)

    let snippetPrefix = null
    let wordPrefix = null

    for (const cursor of editor.getCursors()) {
      const position = cursor.getBufferPosition()

      const prefixStart = cursor.getBeginningOfCurrentWordBufferPosition({wordRegex})
      const cursorSnippetPrefix = editor.getTextInRange([prefixStart, position])
      if ((snippetPrefix != null) && (cursorSnippetPrefix !== snippetPrefix)) { return null }
      snippetPrefix = cursorSnippetPrefix

      const wordStart = cursor.getBeginningOfCurrentWordBufferPosition()
      const cursorWordPrefix = editor.getTextInRange([wordStart, position])
      if ((wordPrefix != null) && (cursorWordPrefix !== wordPrefix)) { return null }
      wordPrefix = cursorWordPrefix
    }

    return {snippetPrefix, wordPrefix}
  },

  // Get a RegExp of all the characters used in the snippet prefixes
  wordRegexForSnippets (snippets) {
    const prefixes = {}

    for (const prefix in snippets) {
      for (const character of prefix) { prefixes[character] = true }
    }

    const prefixCharacters = Object.keys(prefixes).join('')
    return new RegExp(`[${_.escapeRegExp(prefixCharacters)}]+`)
  },

  // Get the best match snippet for the given prefix text.  This will return
  // the longest match where there is no exact match to the prefix text.
  snippetForPrefix (snippets, prefix, wordPrefix) {
    let longestPrefixMatch = null

    for (const snippetPrefix in snippets) {
      // Any snippet without a prefix was keyed on its snippet ID, but with a
      // space introduced to ensure it would never be a prefix match. But let's
      // play it safe here anyway.
      if (snippetPrefix.includes(' ')) { continue }
      const snippet = snippets[snippetPrefix]
      if (prefix.endsWith(snippetPrefix) && (wordPrefix.length <= snippetPrefix.length)) {
        if ((longestPrefixMatch == null) || (snippetPrefix.length > longestPrefixMatch.prefix.length)) {
          longestPrefixMatch = snippet
        }
      }
    }

    return longestPrefixMatch
  },

  getSnippets (editor) {
    return this.parsedSnippetsForScopes(editor.getLastCursor().getScopeDescriptor())
  },

  snippetToExpandUnderCursor (editor) {
    if (!editor.getLastSelection().isEmpty()) { return false }
    const snippets = this.getSnippets(editor)
    if (_.isEmpty(snippets)) { return false }

    const prefixData = this.getPrefixText(snippets, editor)
    if (prefixData) {
      return this.snippetForPrefix(snippets, prefixData.snippetPrefix, prefixData.wordPrefix)
    }
  },

  // Expands a snippet invoked via command.
  expandSnippet (editor, snippet) {
    this.getStore(editor).observeHistory({
      undo: event => { this.onUndoOrRedo(editor, event, true) },
      redo: event => { this.onUndoOrRedo(editor, event, false) }
    })

    this.findOrCreateMarkerLayer(editor)

    editor.transact(() => {
      const cursors = editor.getCursors()
      for (const cursor of cursors) {
        this.insert(snippet, editor, cursor, {method: 'command'})
      }
    })
  },

  // Expands a snippet defined via tab trigger _if_ such a snippet can be found
  // for the current prefix and scope.
  expandSnippetsUnderCursors (editor) {
    const snippet = this.snippetToExpandUnderCursor(editor)
    if (!snippet) { return false }

    this.getStore(editor).observeHistory({
      undo: event => { this.onUndoOrRedo(editor, event, true) },
      redo: event => { this.onUndoOrRedo(editor, event, false) }
    })

    this.findOrCreateMarkerLayer(editor)
    editor.transact(() => {
      const cursors = editor.getCursors()
      for (const cursor of cursors) {
        // Select the prefix text so that it gets consumed when the snippet
        // expands.
        const cursorPosition = cursor.getBufferPosition()
        const startPoint = cursorPosition.translate([0, -snippet.prefix.length], [0, 0])
        cursor.selection.setBufferRange([startPoint, cursorPosition])
        this.insert(snippet, editor, cursor, {method: 'prefix'})
      }
    })
    return true
  },

  goToNextTabStop (editor) {
    let nextTabStopVisited = false
    for (const expansion of this.getExpansions(editor)) {
      if (expansion && expansion.goToNextTabStop()) {
        nextTabStopVisited = true
      }
    }
    return nextTabStopVisited
  },

  goToPreviousTabStop (editor) {
    let previousTabStopVisited = false
    for (const expansion of this.getExpansions(editor)) {
      if (expansion && expansion.goToPreviousTabStop()) {
        previousTabStopVisited = true
      }
    }
    return previousTabStopVisited
  },

  getStore (editor) {
    return EditorStore.findOrCreate(editor)
  },

  findOrCreateMarkerLayer (editor) {
    let layer = this.editorMarkerLayers.get(editor)
    if (layer === undefined) {
      layer = editor.addMarkerLayer({maintainHistory: true})
      this.editorMarkerLayers.set(editor, layer)
    }
    return layer
  },

  getExpansions (editor) {
    return this.getStore(editor).getExpansions()
  },

  clearExpansions (editor) {
    const store = this.getStore(editor)
    store.clearExpansions()
    // There are no more active instances of this expansion, so we should undo
    // the spying we set up on this editor.
    store.stopObserving()
    store.stopObservingHistory()
  },

  addExpansion (editor, snippetExpansion) {
    this.getStore(editor).addExpansion(snippetExpansion)
  },

  textChanged (editor, event) {
    const store = this.getStore(editor)
    const activeExpansions = store.getExpansions()

    if ((activeExpansions.length === 0) || activeExpansions[0].isIgnoringBufferChanges) { return }

    this.ignoringTextChangesForEditor(editor, () =>
      editor.transact(() =>
        activeExpansions.map(expansion => expansion.textChanged(event)))
    )

    // Create a checkpoint here to consolidate all the changes we just made into
    // the transaction that prompted them.
    this.makeCheckpoint(editor)
  },

  // Perform an action inside the editor without triggering our `textChanged`
  // callback.
  ignoringTextChangesForEditor (editor, callback) {
    this.stopObservingEditor(editor)
    callback()
    this.observeEditor(editor)
  },

  observeEditor (editor) {
    this.getStore(editor).observe(event => this.textChanged(editor, event))
  },

  stopObservingEditor (editor) {
    this.getStore(editor).stopObserving()
  },

  makeCheckpoint (editor) {
    this.getStore(editor).makeCheckpoint()
  },

  insert (snippet, editor, cursor, {method = null} = {}) {
    if (editor == null) { editor = atom.workspace.getActiveTextEditor() }
    if (cursor == null) { cursor = editor.getLastCursor() }
    if (typeof snippet === 'string') {
      const bodyTree = this.getBodyParser().parse(snippet)
      snippet = new Snippet({id: this.snippetIdCounter++, name: '__anonymous', prefix: '', bodyTree, bodyText: snippet})
    }
    return new SnippetExpansion(snippet, editor, cursor, this, {method})
  },

  getUnparsedSnippets () {
    const results = []
    const iterate = sets => {
      for (const item of sets) {
        const newItem = _.deepClone(item)
        // The atom-slick library has already parsed the `selector` property,
        // so it's an AST here instead of a string. The object has a `toString`
        // method that turns it back into a string. That custom behavior won't
        // be preserved in the deep clone of the object, so we have to handle
        // it separately.
        newItem.selectorString = item.selector.toString()
        results.push(newItem)
      }
    }

    iterate(this.scopedPropertyStore.propertySets)
    iterate(this.disabledSnippetsScopedPropertyStore.propertySets)
    return results
  },

  provideSnippets () {
    return {
      bundledSnippetsLoaded: () => this.loaded,
      insertSnippet: this.insert.bind(this),
      snippetsForScopes: this.parsedSnippetsForScopes.bind(this),
      getUnparsedSnippets: this.getUnparsedSnippets.bind(this),
      getUserSnippetsPath: this.getUserSnippetsPath.bind(this)
    }
  },

  onUndoOrRedo (editor, event, isUndo) {
    const activeExpansions = this.getExpansions(editor)
    activeExpansions.forEach(expansion => expansion.onUndoOrRedo(isUndo))
  }
}
