let config = {
  testDir: 'integration',
  timeout: 60000,
  // Every spec drives a Pulsar window on the same display, and the tests
  // depend on which window has keyboard focus. Two instances at once steal it
  // from each other.
  workers: 1,
  expect: {
    timeout: 25000,
    toMatchSnapshot: {threshold: 0.2},
  }
}

if(process.env.CI) {
  config.retries = 3
}

module.exports = config
