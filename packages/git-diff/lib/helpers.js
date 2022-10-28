'use babel';
import { Directory } from 'atom';

export default async function(goalPath) {
  if (goalPath) {
    return core.project.repositoryForDirectory(new Directory(goalPath));
  }
  return null;
}
