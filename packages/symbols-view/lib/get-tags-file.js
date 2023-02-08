/** @babel */

import path from 'path';
import fs from 'fs-plus';

const files = ['tags', 'TAGS', '.tags', '.TAGS', path.join('.git', 'tags'), path.join('.git', 'TAGS')];
export default function(directoryPath) {
  if (!directoryPath) {
    return undefined;
  }

  for (const file of files) {
    const tagsFile = path.join(directoryPath, file);
    if (fs.isFileSync(tagsFile)) {
      return tagsFile;
    }
  }

  return undefined;
}
