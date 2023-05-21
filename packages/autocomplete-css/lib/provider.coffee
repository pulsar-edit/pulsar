COMPLETIONS = require('../completions.json')

firstInlinePropertyNameWithColonPattern = /{\s*(\S+)\s*:/ # .example { display: }
inlinePropertyNameWithColonPattern = /(?:;.+?)*;\s*(\S+)\s*:/ # .example { display: block; float: left; color: } (match the last one)
propertyNameWithColonPattern = /^\s*(\S+)\s*:/ # display:
propertyNamePrefixPattern = /[a-zA-Z]+[-a-zA-Z]*$/
pseudoSelectorPrefixPattern = /:(:)?([a-z]+[a-z-]*)?$/
tagSelectorPrefixPattern = /(^|\s|,)([a-z]+)?$/
importantPrefixPattern = /(![a-z]+)$/
cssDocsURL = "https://developer.mozilla.org/en-US/docs/Web/CSS"

module.exports =
  selector: '.source.css, .source.sass, .source.css.postcss'
  disableForSelector: '.source.css .comment, .source.css .string, .source.sass .comment, .source.sass .string, .source.css.postcss .comment, source.css.postcss .string'
  properties: COMPLETIONS.properties
  pseudoSelectors: COMPLETIONS.pseudoSelectors
  tags: COMPLETIONS.tags

  # Tell autocomplete to fuzzy filter the results of getSuggestions(). We are
  # still filtering by the first character of the prefix in this provider for
  # efficiency.
  filterSuggestions: true

  getSuggestions: (request) ->
    completions = null
    scopes = request.scopeDescriptor.getScopesArray()
    isSass = hasScope(scopes, 'source.sass', true)

    if @isCompletingValue(request)
      completions = @getPropertyValueCompletions(request)
    else if @isCompletingPseudoSelector(request)
      completions = @getPseudoSelectorCompletions(request)
    else
      if isSass and @isCompletingNameOrTag(request)
        completions = @getPropertyNameCompletions(request)
          .concat(@getTagCompletions(request))
      else if not isSass and @isCompletingName(request)
        completions = @getPropertyNameCompletions(request)

    if not isSass and @isCompletingTagSelector(request)
      tagCompletions = @getTagCompletions(request)
      if tagCompletions?.length
        completions ?= []
        completions = completions.concat(tagCompletions)

    completions

  onDidInsertSuggestion: ({editor, suggestion}) ->
    setTimeout(@triggerAutocomplete.bind(this, editor), 1) if suggestion.type is 'property'

  triggerAutocomplete: (editor) ->
    atom.commands.dispatch(atom.views.getView(editor), 'autocomplete-plus:activate', {activatedManually: false})

  isCompletingValue: ({scopeDescriptor, bufferPosition, prefix, editor}) ->
    scopes = scopeDescriptor.getScopesArray()

    beforePrefixBufferPosition = [bufferPosition.row, Math.max(0, bufferPosition.column - prefix.length - 1)]
    beforePrefixScopes = editor.scopeDescriptorForBufferPosition(beforePrefixBufferPosition)
    beforePrefixScopesArray = beforePrefixScopes.getScopesArray()

    previousBufferPosition = [bufferPosition.row, Math.max(0, bufferPosition.column - 1)]
    previousScopes = editor.scopeDescriptorForBufferPosition(previousBufferPosition)
    previousScopesArray = previousScopes.getScopesArray()

    (hasScope(scopes, 'meta.property-list.css') and prefix.trim() is ":") or
    (hasScope(previousScopesArray, 'meta.property-value.css')) or
    (hasScope(scopes, 'meta.property-list.scss') and prefix.trim() is ":") or
    (hasScope(previousScopesArray, 'meta.property-value.scss')) or
    (hasScope(scopes, 'meta.property-list.postcss') and prefix.trim() is ":") or
    (hasScope(previousScopesArray, 'meta.property-value.postcss')) or
    (hasScope(scopes, 'source.sass', true) and (hasScope(scopes, 'meta.property-value.sass') or
      (not hasScope(beforePrefixScopesArray, 'entity.name.tag.css') and prefix.trim() is ":")
    ))

  isCompletingName: ({scopeDescriptor, bufferPosition, prefix, editor}) ->
    scopes = scopeDescriptor.getScopesArray()
    isAtTerminator = prefix.endsWith(';')
    isAtParentSymbol = prefix.endsWith('&')
    isVariable = hasScope(scopes, 'variable.css') or
      hasScope(scopes, 'variable.scss') or
      hasScope(scopes, 'variable.var.postcss')
    isInPropertyList = not isAtTerminator and
      (hasScope(scopes, 'meta.property-list.css') or
      hasScope(scopes, 'meta.property-list.scss') or
      hasScope(scopes, 'meta.property-list.postcss'))

    return false unless isInPropertyList
    return false if isAtParentSymbol or isVariable

    previousBufferPosition = [bufferPosition.row, Math.max(0, bufferPosition.column - prefix.length - 1)]
    previousScopes = editor.scopeDescriptorForBufferPosition(previousBufferPosition)
    previousScopesArray = previousScopes.getScopesArray()

    return false if hasScope(previousScopesArray, 'entity.other.attribute-name.class.css') or
      hasScope(previousScopesArray, 'entity.other.attribute-name.id.css') or
      hasScope(previousScopesArray, 'entity.other.attribute-name.id') or
      hasScope(previousScopesArray, 'entity.other.attribute-name.parent-selector.css') or
      hasScope(previousScopesArray, 'entity.name.tag.reference.scss') or
      hasScope(previousScopesArray, 'entity.name.tag.scss') or
      hasScope(previousScopesArray, 'entity.name.tag.reference.postcss') or
      hasScope(previousScopesArray, 'entity.name.tag.postcss')

    isAtBeginScopePunctuation = hasScope(scopes, 'punctuation.section.property-list.begin.bracket.curly.css') or
      hasScope(scopes, 'punctuation.section.property-list.begin.bracket.curly.scss') or
      hasScope(scopes, 'punctuation.section.property-list.begin.postcss')
    isAtEndScopePunctuation = hasScope(scopes, 'punctuation.section.property-list.end.bracket.curly.css') or
      hasScope(scopes, 'punctuation.section.property-list.end.bracket.curly.scss') or
      hasScope(scopes, 'punctuation.section.property-list.end.postcss')

    if isAtBeginScopePunctuation
      # * Disallow here: `canvas,|{}`
      # * Allow here: `canvas,{| }`
      prefix.endsWith('{')
    else if isAtEndScopePunctuation
      # * Disallow here: `canvas,{}|`
      # * Allow here: `canvas,{ |}`
      not prefix.endsWith('}')
    else
      true

  isCompletingNameOrTag: ({scopeDescriptor, bufferPosition, editor}) ->
    scopes = scopeDescriptor.getScopesArray()
    prefix = @getPropertyNamePrefix(bufferPosition, editor)
    return @isPropertyNamePrefix(prefix) and
      hasScope(scopes, 'meta.selector.css') and
      not hasScope(scopes, 'entity.other.attribute-name.id.css.sass') and
      not hasScope(scopes, 'entity.other.attribute-name.class.sass')

  isCompletingTagSelector: ({editor, scopeDescriptor, bufferPosition}) ->
    scopes = scopeDescriptor.getScopesArray()
    tagSelectorPrefix = @getTagSelectorPrefix(editor, bufferPosition)
    return false unless tagSelectorPrefix?.length

    previousBufferPosition = [bufferPosition.row, Math.max(0, bufferPosition.column - 1)]
    previousScopes = editor.scopeDescriptorForBufferPosition(previousBufferPosition)
    previousScopesArray = previousScopes.getScopesArray()

    if hasScope(scopes, 'meta.selector.css') or hasScope(previousScopesArray, 'meta.selector.css')
      true
    else if hasScope(scopes, 'source.css.scss', true) or hasScope(scopes, 'source.css.less', true) or hasScope(scopes, 'source.css.postcss', true)
      not hasScope(previousScopesArray, 'meta.property-value.scss') and
        not hasScope(previousScopesArray, 'meta.property-value.css') and
        not hasScope(previousScopesArray, 'meta.property-value.postcss') and
        not hasScope(previousScopesArray, 'support.type.property-value.css')
    else
      false

  isCompletingPseudoSelector: ({editor, scopeDescriptor, bufferPosition}) ->
    scopes = scopeDescriptor.getScopesArray()
    previousBufferPosition = [bufferPosition.row, Math.max(0, bufferPosition.column - 1)]
    previousScopes = editor.scopeDescriptorForBufferPosition(previousBufferPosition)
    previousScopesArray = previousScopes.getScopesArray()
    if (hasScope(scopes, 'meta.selector.css') or hasScope(previousScopesArray, 'meta.selector.css')) and not hasScope(scopes, 'source.sass', true)
      true
    else if hasScope(scopes, 'source.css.scss', true) or hasScope(scopes, 'source.css.less', true) or hasScope(scopes, 'source.sass', true) or hasScope(scopes, 'source.css.postcss', true)
      prefix = @getPseudoSelectorPrefix(editor, bufferPosition)
      if prefix
        previousBufferPosition = [bufferPosition.row, Math.max(0, bufferPosition.column - prefix.length - 1)]
        previousScopes = editor.scopeDescriptorForBufferPosition(previousBufferPosition)
        previousScopesArray = previousScopes.getScopesArray()
        not hasScope(previousScopesArray, 'meta.property-name.scss') and
          not hasScope(previousScopesArray, 'meta.property-value.scss') and
          not hasScope(previousScopesArray, 'meta.property-value.postcss') and
          not hasScope(previousScopesArray, 'support.type.property-name.css') and
          not hasScope(previousScopesArray, 'support.type.property-value.css') and
          not hasScope(previousScopesArray, 'support.type.property-name.postcss')
      else
        false
    else
      false

  isPropertyValuePrefix: (prefix) ->
    prefix = prefix.trim()
    prefix.length > 0 and prefix isnt ':'

  isPropertyNamePrefix: (prefix) ->
    return false unless prefix?
    prefix = prefix.trim()
    prefix.length > 0 and prefix.match(/^[a-zA-Z-]+$/)

  getImportantPrefix: (editor, bufferPosition) ->
    line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition])
    importantPrefixPattern.exec(line)?[1]

  getPreviousPropertyName: (bufferPosition, editor) ->
    {row, column} = bufferPosition
    while row >= 0
      line = editor.lineTextForBufferRow(row)
      line = line.substr(0, column) if row is bufferPosition.row
      propertyName = inlinePropertyNameWithColonPattern.exec(line)?[1]
      propertyName ?= firstInlinePropertyNameWithColonPattern.exec(line)?[1]
      propertyName ?= propertyNameWithColonPattern.exec(line)?[1]
      return propertyName if propertyName
      row--
    return

  getPropertyValueCompletions: ({bufferPosition, editor, prefix, scopeDescriptor}) ->
    property = @getPreviousPropertyName(bufferPosition, editor)
    values = @properties[property]?.values
    return null unless values?

    scopes = scopeDescriptor.getScopesArray()
    addSemicolon = not lineEndsWithSemicolon(bufferPosition, editor) and not hasScope(scopes, 'source.sass', true)

    completions = []
    if @isPropertyValuePrefix(prefix)
      for value in values when firstCharsEqual(value, prefix)
        completions.push(@buildPropertyValueCompletion(value, property, addSemicolon))
    else if not hasScope(scopes, 'keyword.other.unit.percentage.css') and # CSS
    not hasScope(scopes, 'keyword.other.unit.scss') and # SCSS (TODO: remove in Atom 1.19.0)
    not hasScope(scopes, 'keyword.other.unit.css') # Less, Sass (TODO: remove in Atom 1.19.0)
      # Don't complete here: `width: 100%|`
      for value in values
        completions.push(@buildPropertyValueCompletion(value, property, addSemicolon))

    if importantPrefix = @getImportantPrefix(editor, bufferPosition)
      # attention: règle dangereux
      completions.push
        type: 'keyword'
        text: '!important'
        displayText: '!important'
        replacementPrefix: importantPrefix
        description: "Forces this property to override any other declaration of the same property. Use with caution."
        descriptionMoreURL: "#{cssDocsURL}/Specificity#The_!important_exception"

    completions

  buildPropertyValueCompletion: (value, propertyName, addSemicolon) ->
    text = value
    text += ';' if addSemicolon

    {
      type: 'value'
      text: text
      displayText: value
      description: "#{value} value for the #{propertyName} property"
      descriptionMoreURL: "#{cssDocsURL}/#{propertyName}#Values"
    }

  getPropertyNamePrefix: (bufferPosition, editor) ->
    line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition])
    propertyNamePrefixPattern.exec(line)?[0]

  getPropertyNameCompletions: ({bufferPosition, editor, scopeDescriptor, activatedManually}) ->
    # Don't autocomplete property names in SASS on root level
    scopes = scopeDescriptor.getScopesArray()
    line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition])
    return [] if hasScope(scopes, 'source.sass', true) and not line.match(/^(\s|\t)/)

    prefix = @getPropertyNamePrefix(bufferPosition, editor)
    return [] unless activatedManually or prefix

    completions = []
    for property, options of @properties when not prefix or firstCharsEqual(property, prefix)
      completions.push(@buildPropertyNameCompletion(property, prefix, options))
    completions

  buildPropertyNameCompletion: (propertyName, prefix, {description}) ->
    type: 'property'
    text: "#{propertyName}: "
    displayText: propertyName
    replacementPrefix: prefix
    description: description
    descriptionMoreURL: "#{cssDocsURL}/#{propertyName}"

  getPseudoSelectorPrefix: (editor, bufferPosition) ->
    line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition])
    line.match(pseudoSelectorPrefixPattern)?[0]

  getPseudoSelectorCompletions: ({bufferPosition, editor}) ->
    prefix = @getPseudoSelectorPrefix(editor, bufferPosition)
    return null unless prefix

    completions = []
    for pseudoSelector, options of @pseudoSelectors when firstCharsEqual(pseudoSelector, prefix)
      completions.push(@buildPseudoSelectorCompletion(pseudoSelector, prefix, options))
    completions

  buildPseudoSelectorCompletion: (pseudoSelector, prefix, {argument, description}) ->
    completion =
      type: 'pseudo-selector'
      replacementPrefix: prefix
      description: description
      descriptionMoreURL: "#{cssDocsURL}/#{pseudoSelector}"

    if argument?
      completion.snippet = "#{pseudoSelector}(${1:#{argument}})"
    else
      completion.text = pseudoSelector
    completion

  getTagSelectorPrefix: (editor, bufferPosition) ->
    line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition])
    tagSelectorPrefixPattern.exec(line)?[2]

  getTagCompletions: ({bufferPosition, editor, prefix}) ->
    completions = []
    if prefix
      for tag in @tags when firstCharsEqual(tag, prefix)
        completions.push(@buildTagCompletion(tag))
    completions

  buildTagCompletion: (tag) ->
    type: 'tag'
    text: tag
    description: "Selector for <#{tag}> elements"

lineEndsWithSemicolon = (bufferPosition, editor) ->
  {row} = bufferPosition
  line = editor.lineTextForBufferRow(row)
  /;\s*$/.test(line)

hasScope = (scopesArray, scope, checkEmbedded = false) ->
  scopesArray.indexOf(scope) isnt -1 or
    (checkEmbedded and scopesArray.indexOf("#{scope}.embedded.html") isnt -1)

firstCharsEqual = (str1, str2) ->
  str1[0].toLowerCase() is str2[0].toLowerCase()
