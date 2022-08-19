module.exports = {
  testDir: 'integration',
  timeout: 60000,
  expect: {
    timeout: 25000,
    toMatchSnapshot: {threshold: 0.2},
  }
}
