# Run this to update the static list of properties stored in the
# completions.json file at the root of this repository.

fs = require 'fs'
request = require 'request'

requestOptions =
  url: 'https://api.github.com/repos/atom/atom/releases/latest'
  json: true
  headers:
    'User-Agent': 'agent'

request requestOptions, (error, response, release) ->
  if error?
    console.error(error.message)
    return process.exit(1)

  [apiAsset] = release.assets.filter ({name}) -> name is 'atom-api.json'

  unless apiAsset?.browser_download_url
    console.error('No atom-api.json asset found in latest release')
    return process.exit(1)

  apiRequestOptions =
    json: true
    url: apiAsset.browser_download_url

  request apiRequestOptions, (error, response, atomApi) ->
    if error?
      console.error(error.message)
      return process.exit(1)

    {classes} = atomApi

    publicClasses = {}
    for name, {instanceProperties, instanceMethods} of classes
      pluckPropertyAttributes = convertPropertyToSuggestion.bind(this, name)
      pluckMethodAttributes = convertMethodToSuggestion.bind(this, name)
      properties = instanceProperties.filter(isVisible).map(pluckPropertyAttributes).sort(textComparator)
      methods = instanceMethods.filter(isVisible).map(pluckMethodAttributes).sort(textComparator)

      if properties?.length > 0 or methods.length > 0
        publicClasses[name] = properties.concat(methods)

    fs.writeFileSync('completions.json', JSON.stringify(publicClasses, null, '  '))

isVisible = ({visibility}) ->
  visibility in ['Essential', 'Extended', 'Public']

convertMethodToSuggestion = (className, method) ->
  {name, summary, returnValues} = method
  args = method['arguments']

  snippets = []
  if args?.length
    for arg, i in args
      snippets.push("${#{i+1}:#{arg.name}}")

  text = null
  snippet = null
  if snippets.length
    snippet = "#{name}(#{snippets.join(', ')})"
  else
    text = "#{name}()"

  returnValue = returnValues?[0]?.type
  description = summary
  descriptionMoreURL = getDocLink(className, name)
  {name, text, snippet, description, descriptionMoreURL, leftLabel: returnValue, type: 'method'}

convertPropertyToSuggestion = (className, {name, summary}) ->
  text = name
  returnValue = summary?.match(/\{(\w+)\}/)?[1]
  description = summary
  descriptionMoreURL = getDocLink(className, name)
  {name, text, description, descriptionMoreURL, leftLabel: returnValue, type: 'property'}

getDocLink = (className, instanceName) ->
  "https://atom.io/docs/api/latest/#{className}#instance-#{instanceName}"

textComparator = (a, b) ->
  return 1 if a.name > b.name
  return -1 if a.name < b.name
  0
