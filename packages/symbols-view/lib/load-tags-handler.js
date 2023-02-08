/** @babel */
/* global emit*/

import async from 'async';
import ctags from 'ctags';
import getTagsFile from './get-tags-file';

export default function(directoryPaths) {
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
}
