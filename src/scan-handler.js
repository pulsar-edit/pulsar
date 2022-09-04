const path = require("path");
const async = require("async");

const {PathSearcher, PathScanner, search} = require('scandal');

module.exports = function(rootPaths, regexSource, options, searchOptions = {}) {
  const callback = this.async();
  const PATHS_COUNTER_SEARCHED_CHUNK = 50;
  var pathsSearched = 0;
  var searcher = new PathSearcher(searchOptions);
  searcher.on('file-error', function({code, path, message}) {
    return emit('scan:file-error', {code, path, message});
  });
  searcher.on('results-found', function(result) {
    return emit('scan:result-found', result);
  });
  let flags = "g";
  if (options.ignoreCase) {
    flags += "i";
  }
  var regex = new RegExp(regexSource, flags);
  return async.each(rootPaths, function(rootPath, next) {
    const options2 = Object.assign({}, options, {
      inclusions: processPaths(rootPath, options.inclusions),
      globalExclusions: processPaths(rootPath, options.globalExclusions)
    });
    const scanner = new PathScanner(rootPath, options2);
    scanner.on('path-found', function() {
      pathsSearched++;
      if (pathsSearched % PATHS_COUNTER_SEARCHED_CHUNK === 0) {
        emit('scan:paths-searched', pathsSearched);
      }
    });
    search(regex, scanner, searcher, function() {
      emit('scan:paths-searched', pathsSearched);
      next();
    });
  }, callback);
};

var processPaths = function(rootPath, paths) {
  if (paths == null || paths.length == 0) {
    return paths;
  }
  const rootPathBase = path.basename(rootPath);
  const results = [];
  for (let givenPath of paths) {
    const segments = givenPath.split(path.sep);
    const firstSegment = segments.shift();
    results.push(givenPath);
    if (firstSegment === rootPathBase) {
      if (segments.length === 0) {
        results.push(path.join("**", "*"));
      } else {
        results.push(path.join(...segments));
      }
    }
  }
  return results;
};
