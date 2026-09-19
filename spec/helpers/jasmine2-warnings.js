const {
  ensureNoDeprecatedFunctionCalls,
  ensureNoDeprecatedStylesheets,
  warnIfLeakingPathSubscriptions
} = require('./warnings')

// TEMPORARY (troubleshooting): this hook runs after every one of the ~2365
// specs, and teardown is the leading suspect for the Windows suite running ~5x
// slower than Linux and macOS. Time each part separately: knowing it is
// `atom.reset()` rather than the leak check (or vice versa) is the difference
// between a narrow fix and another round of guessing.
const TEARDOWN = {
  deprecatedFunctions: 0,
  deprecatedStylesheets: 0,
  atomReset: 0,
  clearContent: 0,
  leakCheck: 0,
  specs: 0
};

const timed = async (key, fn) => {
  const startedAt = Date.now();
  try {
    return await fn();
  } finally {
    TEARDOWN[key] += Date.now() - startedAt;
  }
};

const reportTeardown = () => {
  const part = k => `${k} ${(TEARDOWN[k] / 1000).toFixed(1)}s`;
  console.log(
    `[teardown-timing] platform=${process.platform} specs=${TEARDOWN.specs}  ` +
      [
        'deprecatedFunctions',
        'deprecatedStylesheets',
        'atomReset',
        'clearContent',
        'leakCheck'
      ]
        .map(part)
        .join('  ')
  );
};

exports.register = (jasmineEnv) => {
  jasmineEnv.addReporter({ jasmineDone: reportTeardown });

  jasmineEnv.afterEach(async (done) => {
    TEARDOWN.specs += 1;
    await timed('deprecatedFunctions', () => ensureNoDeprecatedFunctionCalls());
    await timed('deprecatedStylesheets', () => ensureNoDeprecatedStylesheets());

    await timed('atomReset', () => atom.reset());

    await timed('clearContent', () => {
      if (!window.debugContent) {
        document.getElementById('jasmine-content').innerHTML = '';
      }
    });
    await timed('leakCheck', () => warnIfLeakingPathSubscriptions());

    done();
  });
}
