/* global emit */

const async = require('async');
const ctags = require('ctags');
const getTagsFile = require('./get-tags-file');

module.exports = function loadTags(directoryPaths) {
  // TODO: I tried to remove the dependency on the `async` package but failed
  // spectacularly. I should try again at some point.
  return async.each(
    directoryPaths,
    (directoryPath, done) => {
      let tagsFilePath = getTagsFile(directoryPath);
      if (!tagsFilePath) { return done(); }

      let stream = ctags.createReadStream(tagsFilePath);
      stream.on('data', function(tags) {
        for (const tag of Array.from(tags)) { tag.directory = directoryPath; }
        return emit('tags', tags);
      });
      stream.on('end', done);
      return stream.on('error', done);
    }
    , this.async()
  );
};
