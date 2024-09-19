const pathwatcher = require("pathwatcher");
const _ = require("underscore-plus");
const Grim = require("grim");

exports.warnIfLeakingPathSubscriptions = function() {
  const watchedPaths = pathwatcher.getWatchedPaths();
  if (watchedPaths.length > 0) {
    console.error("WARNING: Leaking subscriptions for paths: " + watchedPaths.join(", "));
  }
  return pathwatcher.closeAllWatchers();
};

exports.ensureNoDeprecatedFunctionCalls = function() {
  const deprecations = _.clone(Grim.getDeprecations());
  Grim.clearDeprecations();
  if (deprecations.length > 0) {
    const originalPrepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = function(error, stack) {
      const output = [];
      for (let deprecation of Array.from(deprecations)) {
        output.push(`${deprecation.originName} is deprecated. ${deprecation.message}`);
        output.push(_.multiplyString("-", output[output.length - 1].length));
        for (stack of Array.from(deprecation.getStacks())) {
          for (let {functionName, location} of Array.from(stack)) {
            output.push(`${functionName} -- ${location}`);
          }
        }
        output.push("");
      }
      return output.join("\n");
    };

    const error = new Error(`Deprecated function(s) ${deprecations.map(({originName}) => originName).join(', ')}) were called.`);
    error.stack;
    Error.prepareStackTrace = originalPrepareStackTrace;
    throw error;
  }
};

exports.ensureNoDeprecatedStylesheets = function() {
  const deprecations = _.clone(atom.styles.getDeprecations());
  atom.styles.clearDeprecations();
  return (() => {
    const result = [];
    for (let sourcePath in deprecations) {
      const deprecation = deprecations[sourcePath];
      const title =
        sourcePath !== 'undefined' ?
          `Deprecated stylesheet at '${sourcePath}':`
          :
          "Deprecated stylesheet:";
      throw new Error(`${title}\n${deprecation.message}`);
    }
    return result;
  })();
};
