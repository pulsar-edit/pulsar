if (process.env.CI) {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;
} else {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
}
