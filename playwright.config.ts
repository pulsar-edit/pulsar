module.exports = {
  testDir: 'tests',
  timeout: 60000,
  expect: {
    timeout: 25000,
    toMatchSnapshot: {threshold: 0.2},
  }
}
