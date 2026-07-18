const path = require('path')
const fs = require('fs')

module.exports = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'sample.js'), 'utf8')
