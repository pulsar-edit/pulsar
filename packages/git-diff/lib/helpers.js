const { Directory } = require('atom');

module.exports = async function (goalPath) {
  if (goalPath) {
    return atom.project.repositoryForDirectory(new Directory(goalPath));
  }
  return null;
}
