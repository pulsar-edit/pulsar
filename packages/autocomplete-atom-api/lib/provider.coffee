fs = require 'fs'
path = require 'path'

CLASSES = require('../completions.json')

propertyPrefixPattern = /(?:^|\[|\(|,|=|:|\s)\s*(atom\.(?:[a-zA-Z]+\.?){0,2})$/

module.exports =
  selector: '.source.coffee, .source.js'
  filterSuggestions: true

  getSuggestions: ({bufferPosition, editor}) ->
    return unless @isEditingAnAtomPackageFile(editor)
    line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition])
    @getCompletions(line)

  load: ->
    @loadCompletions()
    atom.project.onDidChangePaths => @scanProjectDirectories()
    @scanProjectDirectories()

  scanProjectDirectories: ->
    @packageDirectories = []
    atom.project.getDirectories().forEach (directory) =>
      return unless directory?
      @readMetadata directory, (error, metadata) =>
        if @isAtomPackage(metadata) or @isAtomCore(metadata)
          @packageDirectories.push(directory)

  readMetadata: (directory, callback) ->
    fs.readFile path.join(directory.getPath(), 'package.json'), (error, contents) ->
      unless error?
        try
          metadata = JSON.parse(contents)
        catch parseError
          error = parseError
      callback(error, metadata)

  isAtomPackage: (metadata) ->
    metadata?.engines?.atom?.length > 0

  isAtomCore: (metadata) ->
    metadata?.name is 'atom'

  isEditingAnAtomPackageFile: (editor) ->
    editorPath = editor.getPath()
    if editorPath?
      parsedPath = path.parse(editorPath)
      basename = path.basename(parsedPath.dir)
      if basename is '.atom' or basename is '.pulsar'
        if parsedPath.base is 'init.coffee' or parsedPath.base is 'init.js'
          return true
    for directory in @packageDirectories ? []
      return true if directory.contains(editorPath)
    false

  loadCompletions: ->
    @completions ?= {}
    @loadProperty('atom', 'AtomEnvironment', CLASSES)

  getCompletions: (line) ->
    completions = []
    match =  propertyPrefixPattern.exec(line)?[1]
    return completions unless match

    segments = match.split('.')
    prefix = segments.pop() ? ''
    segments = segments.filter (segment) -> segment
    property = segments[segments.length - 1]
    propertyCompletions = @completions[property]?.completions ? []
    for completion in propertyCompletions when not prefix or firstCharsEqual(completion.name, prefix)
      completions.push(clone(completion))
    completions

  getPropertyClass: (name) ->
    atom[name]?.constructor?.name

  loadProperty: (propertyName, className, classes, parent) ->
    classCompletions = classes[className]
    return unless classCompletions?

    @completions[propertyName] = completions: []

    for completion in classCompletions
      @completions[propertyName].completions.push(completion)
      if completion.type is 'property'
        propertyClass = @getPropertyClass(completion.name)
        @loadProperty(completion.name, propertyClass, classes)
    return

clone = (obj) ->
  newObj = {}
  newObj[k] = v for k, v of obj
  newObj

firstCharsEqual = (str1, str2) ->
  str1[0].toLowerCase() is str2[0].toLowerCase()
