const path = require('path')

function getPackageRoot () {
  const {resourcePath} = atom.getLoadSettings()
  const currentFileWasRequiredFromSnapshot = !path.isAbsolute(__dirname)
  if (currentFileWasRequiredFromSnapshot) {
    return path.join(resourcePath, 'node_modules', 'snippets')
  } else {
    return path.resolve(__dirname, '..')
  }
}

module.exports = {getPackageRoot}
