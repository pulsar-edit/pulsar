const path = require('path')

module.exports = {
  repositoryForPath (filePath) {
    const paths = atom.project.getPaths()
    for (let i = 0; i < paths.length; i++) {
      const projectPath = paths[i]
      if ((filePath === projectPath) || filePath.startsWith(projectPath + path.sep)) {
        return atom.project.getRepositories()[i]
      }
    }
    return null
  }
}
