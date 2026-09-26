const probe = require('./helpers/environment-probe');

// The same probe at the end of the run. Timestamps suggest the penalty is
// constant from start to finish; comparing this reading against the early one
// measures that directly rather than inferring it.
describe('environment probe (late)', () => {
  let originalTimeout;

  beforeEach(() => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    // A floor, not an assignment, for the same reason as in
    // `text-editor-component-spec.js`: CI already grants more than this and a
    // plain assignment would take it away. Passing a timeout as `it`'s third
    // argument does not work in this harness — it is silently ignored.
    jasmine.DEFAULT_TIMEOUT_INTERVAL = Math.max(
      originalTimeout,
      probe.TIMEOUT_MS
    );
  });

  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  it('measures how long each kind of waiting takes', async () => {
    await probe.run('late');
  });
});
