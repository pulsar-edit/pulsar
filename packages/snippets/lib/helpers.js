/** @babel */

import path from 'path'

export function getPackageRoot() {
  const {resourcePath} = atom.getLoadSettings()
  const currentFileWasRequiredFromSnapshot = !path.isAbsolute(__dirname)
  if (currentFileWasRequiredFromSnapshot) {
    return path.join(resourcePath, 'node_modules', 'snippets')
  } else {
    return path.resolve(__dirname, '..')
  }
}
