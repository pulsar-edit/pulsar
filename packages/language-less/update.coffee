# Run this to update the list of builtin less functions

path = require 'path'
request = require 'request'
Promise = require 'bluebird'
CSON = require 'season'

FunctionsURL = 'https://raw.githubusercontent.com/less/less-docs/master/content/functions/data/functions.json'

functionsPromise = new Promise (resolve) ->
  request {json: true, url: FunctionsURL}, (error, response, properties) ->
    if error?
      console.error(error.message)
      resolve(null)
    if response.statusCode isnt 200
      console.error("Request failed: #{response.statusCode}")
      resolve(null)
    resolve(properties)

functionsPromise.then (results) ->
  suggestions = []
  for functionType, functions of results
    for func in functions
      suggestions.push
        type: 'function'
        rightLabel: 'Less Builtin'
        snippet: sanitizeFunc(func.example)
        description: func.description
        descriptionMoreURL: "http://lesscss.org/functions/##{functionType}-#{func.name}"

  configPath = path.join(__dirname, 'settings', 'language-less.cson')
  config = CSON.readFileSync(configPath)
  builtins = config['.source.css.less .meta.property-value'].autocomplete.symbols.builtins
  builtins.suggestions = suggestions
  CSON.writeFileSync(configPath, config)

sanitizeFunc = (functionExample) ->
  functionExample = functionExample.replace(';', '')
  functionExample = functionExample.replace(/\[, /g, ', [')
  functionExample = functionExample.replace(/\,] /g, '], ')

  argsRe = /\(([^\)]+)\)/
  functionExample = functionExample.replace argsRe, (args) ->
    args = argsRe.exec(args)[1]
    args = args.split(',')
    args = ("${#{index + 1}:#{arg.trim()}}" for arg, index in args)
    "(#{args.join(', ')})${#{index+1}:;}"

  "#{functionExample}$0"
