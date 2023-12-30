_ = require 'underscore-plus'

escapeNode = null

escapeHtml = (str) ->
  escapeNode ?= document.createElement('div')
  escapeNode.innerText = str
  escapeNode.innerHTML

escapeRegex = (str) ->
  str.replace /[.?*+^$[\]\\(){}|-]/g, (match) -> "\\" + match

sanitizePattern = (pattern) ->
  pattern = escapeHtml(pattern)
  pattern.replace(/\n/g, '\\n').replace(/\t/g, '\\t')

getReplacementResultsMessage = ({findPattern, replacePattern, replacedPathCount, replacementCount}) ->
  if replacedPathCount
    "<span class=\"text-highlight\">Replaced <span class=\"highlight-error\">#{sanitizePattern(findPattern)}</span> with <span class=\"highlight-success\">#{sanitizePattern(replacePattern)}</span> #{_.pluralize(replacementCount, 'time')} in #{_.pluralize(replacedPathCount, 'file')}</span>"
  else
    "<span class=\"text-highlight\">Nothing replaced</span>"

getSearchResultsMessage = (results) ->
  if results?.findPattern?
    {findPattern, matchCount, pathCount, replacedPathCount} = results
    if matchCount
      "#{_.pluralize(matchCount, 'result')} found in #{_.pluralize(pathCount, 'file')} for <span class=\"highlight-info\">#{sanitizePattern(findPattern)}</span>"
    else
      "No #{if replacedPathCount? then 'more' else ''} results found for '#{sanitizePattern(findPattern)}'"
  else
    ''

showIf = (condition) ->
  if condition
    null
  else
    {display: 'none'}

capitalize = (str) ->
  return '' if str == ''
  str[0].toUpperCase() + str.toLowerCase().slice(1)

titleize = (str) -> str.toLowerCase().replace(/(?:^|\s)\S/g, (capital) -> capital.toUpperCase())

preserveCase = (text, reference) ->
  # If replaced text is capitalized (strict) like a sentence, capitalize replacement
  if reference is capitalize(reference.toLowerCase())
    capitalize(text)

  # If replaced text is titleized (i.e., each word start with an uppercase), titleize replacement
  else if reference is titleize(reference.toLowerCase())
    titleize(text)

  # If replaced text is uppercase, uppercase replacement
  else if reference is reference.toUpperCase()
    text.toUpperCase()

  # If replaced text is lowercase, lowercase replacement
  else if reference is reference.toLowerCase()
    text.toLowerCase()
  else
    text


module.exports = {
  escapeHtml, escapeRegex, sanitizePattern, getReplacementResultsMessage,
  getSearchResultsMessage, showIf, preserveCase
}
