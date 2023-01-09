const fs = require('fs')

const pack = fs.readFileSync('package.json', 'UTF-8')
const timestamp = (new Date()).toISOString().replace(/:.*/, '').replace(/[-T]/g, '')
const branch = process.env.CIRRUS_BRANCH

if(branch) {
  const matches = branch.match(/^release-v(.*)$/)
  if(matches) {
    fs.writeFileSync('package.json', pack.replace(/\"\d.*?\"/, `"${matches[1]}"`))
  } else if(branch === 'master') {
    fs.writeFileSync('package.json', pack.replace(/[0-9]*-dev/, timestamp))
  } else {
    fs.writeFileSync('package.json', pack.replace(/[0-9]*-dev/, `${timestamp}-${branch}`))
  }
} else {
  fs.writeFileSync('package.json', pack.replace(/[0-9]*-dev/, timestamp))
}

require('./electron-builder.js')
