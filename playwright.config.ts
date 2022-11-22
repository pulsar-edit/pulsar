let config = {
  testDir: 'integration',
  timeout: 60000,
  expect: {
    timeout: 25000,
    toMatchSnapshot: {threshold: 0.2},
  }
}

if(process.env.CI) {
  config.retries = 3
}

module.exports = config
