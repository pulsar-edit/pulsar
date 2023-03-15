# Run this to update the static list of completions stored in the completions.json
# file at the root of this repository.

path = require 'path'
fs = require 'fs'
request = require 'request'
fetchPropertyDescriptions = require './fetch-property-docs'

PropertiesURL = 'https://raw.githubusercontent.com/adobe/brackets/master/src/extensions/default/CSSCodeHints/CSSProperties.json'

propertiesPromise = new Promise (resolve) ->
  request {json: true, url: PropertiesURL}, (error, response, properties) ->
    if error?
      console.error(error.message)
      resolve(null)
    if response.statusCode isnt 200
      console.error("Request for CSSProperties.json failed: #{response.statusCode}")
      resolve(null)
    resolve(properties)

propertyDescriptionsPromise = fetchPropertyDescriptions()

Promise.all([propertiesPromise, propertyDescriptionsPromise]).then (values) ->
  properties = {}
  propertiesRaw = values[0]
  propertyDescriptions = values[1]
  sortedPropertyNames = JSON.parse(fs.readFileSync(path.join(__dirname, 'sorted-property-names.json')))
  for propertyName in sortedPropertyNames
    continue unless metadata = propertiesRaw[propertyName]
    metadata.description = propertyDescriptions[propertyName]
    properties[propertyName] = metadata
    console.warn "No description for property #{propertyName}" unless propertyDescriptions[propertyName]?

  for propertyName of propertiesRaw
    console.warn "Ignoring #{propertyName}; not in sorted-property-names.json" if sortedPropertyNames.indexOf(propertyName) < 0

  tags = JSON.parse(fs.readFileSync(path.join(__dirname, 'html-tags.json')))
  pseudoSelectors = JSON.parse(fs.readFileSync(path.join(__dirname, 'pseudo-selectors.json')))

  completions = {tags, properties, pseudoSelectors}
  fs.writeFileSync(path.join(__dirname, 'completions.json'), "#{JSON.stringify(completions, null, '  ')}\n")
