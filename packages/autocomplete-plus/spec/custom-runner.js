const { createRunner } = require('atom-jasmine3-test-runner')

const options = {
  specHelper: true,
  silentInstallation: true
}

module.exports = createRunner(options)
