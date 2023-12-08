const fs = require('fs-plus');
const path = require('path');

const FILES = [
  'TAGS',
  'tags',
  '.TAGS',
  '.tags',
  path.join('.git', 'tags'),
  path.join('.git', 'TAGS')
];

function getTagsFile(directoryPath) {
  if (!directoryPath) return;

  for (let file of FILES) {
    let tagsFile = path.join(directoryPath, file);
    if (fs.isFileSync(tagsFile)) return tagsFile;
  }
}

module.exports = getTagsFile;
