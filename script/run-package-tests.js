const fs = require('fs')
const path = require('path')
const packJson = require('../package.json')
const runAllSpecs = require('./run-tests')

module.exports = function(filter) {
  let packagePath = []

  for(let pack in packJson.packageDependencies) {
    if(pack.match(filter)) {
      let basePath = path.join('node_modules', pack)
      let testPath = path.join(basePath, 'test')
      let specPath = path.join(basePath, 'spec')
      if(fs.existsSync(testPath)) packagePath.push(testPath)
      if(fs.existsSync(specPath)) packagePath.push(specPath)
    }
  }

  runAllSpecs(packagePath)
}
