(function() {
  var CSON, FunctionsURL, Promise, functionsPromise, path, request, sanitizeFunc;

  path = require('path');

  request = require('request');

  Promise = require('bluebird');

  CSON = require('season');

  FunctionsURL = 'https://raw.githubusercontent.com/less/less-docs/master/content/functions/data/functions.json';

  functionsPromise = new Promise(function(resolve) {
    return request({
      json: true,
      url: FunctionsURL
    }, function(error, response, properties) {
      if (error != null) {
        console.error(error.message);
        resolve(null);
      }
      if (response.statusCode !== 200) {
        console.error("Request failed: " + response.statusCode);
        resolve(null);
      }
      return resolve(properties);
    });
  });

  functionsPromise.then(function(results) {
    var builtins, config, configPath, func, functionType, functions, suggestions, _i, _len;
    suggestions = [];
    for (functionType in results) {
      functions = results[functionType];
      for (_i = 0, _len = functions.length; _i < _len; _i++) {
        func = functions[_i];
        suggestions.push({
          type: 'function',
          rightLabel: 'Less Builtin',
          snippet: sanitizeFunc(func.example),
          description: func.description,
          descriptionMoreURL: "http://lesscss.org/functions/#" + functionType + "-" + func.name
        });
      }
    }
    configPath = path.join(__dirname, 'settings', 'language-less.cson');
    config = CSON.readFileSync(configPath);
    builtins = config['.source.css.less .meta.property-value'].autocomplete.symbols.builtins;
    builtins.suggestions = suggestions;
    return CSON.writeFileSync(configPath, config);
  });

  sanitizeFunc = function(functionExample) {
    var argsRe;
    functionExample = functionExample.replace(';', '');
    functionExample = functionExample.replace(/\[, /g, ', [');
    functionExample = functionExample.replace(/\,] /g, '], ');
    argsRe = /\(([^\)]+)\)/;
    functionExample = functionExample.replace(argsRe, function(args) {
      var arg, index;
      args = argsRe.exec(args)[1];
      args = args.split(',');
      args = (function() {
        var _i, _len, _results;
        _results = [];
        for (index = _i = 0, _len = args.length; _i < _len; index = ++_i) {
          arg = args[index];
          _results.push("${" + (index + 1) + ":" + (arg.trim()) + "}");
        }
        return _results;
      })();
      return "(" + (args.join(', ')) + ")${" + (index + 1) + ":;}";
    });
    return functionExample + "$0";
  };

}).call(this);
