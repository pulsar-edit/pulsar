const {PathReplacer} = require('scandal');

module.exports = function(filePaths, regexSource, regexFlags, replacementText) {
  const callback = this.async();
  const replacer = new PathReplacer();
  const regex = new RegExp(regexSource, regexFlags);
  replacer.on('file-error', ({code, path, message}) => emit('replace:file-error', {code, path, message}));
  replacer.on('path-replaced', (result) => emit('replace:path-replaced', result));
  replacer.replacePaths(regex, replacementText, filePaths, () => callback());
};
