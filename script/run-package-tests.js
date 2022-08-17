const cp = require('child_process')
const fs = require('fs')
const path = require('path')
const packJson = require('../package.json')

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

  // console.log('yarn', 'start', '--test', ...packagePath)
  const res = cp.spawnSync('yarn', ['start', '--test', ...packagePath], {
    cwd: process.cwd(),
    detached: true,
    stdio: "inherit"
  })

  process.exit(res.status)
}
