# Run this to update the list of builtin less functions

path = require 'path'
superagent = require 'superagent'
Promise = require 'bluebird'
CSON = require 'season'

FunctionsURL = 'https://raw.githubusercontent.com/less/less-docs/master/content/functions/data/functions.json'

functionsPromise = new Promise (resolve) ->
  superagent.get(FunctionsURL).set('Accept', 'application/json').then (response) ->
    if response.status isnt 200
      console.error("Request failed: #{response.status}")
      resolve(null)
    resolve(JSON.parse(response.text)) # SuperAgent should be able to autoparse the response.body but seems to fail doing so in CoffeeScript
  .catch (error) ->
    console.error(error)
    resolve(null)

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
