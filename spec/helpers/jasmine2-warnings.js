const {
  ensureNoDeprecatedFunctionCalls,
  ensureNoDeprecatedStylesheets,
  warnIfLeakingPathSubscriptions
} = require('./warnings')

// TEMPORARY (troubleshooting): the Windows suite runs ~5x slower than Linux and
// macOS, and this hook runs after every one of the ~2365 specs. Time each part
// so we know whether it is `atom.reset()`, the leak check, or neither.
//
// Deliberately dumb straight-line code: no helper wrappers and no extra `await`
// points, so the control flow is identical to what it replaced. This is
// throwaway instrumentation; the only thing that matters is that it runs and
// prints.
const TEARDOWN = {
  deprecatedFunctions: 0,
  deprecatedStylesheets: 0,
  atomReset: 0,
  clearContent: 0,
  leakCheck: 0,
  specs: 0
};

function reportTeardown() {
  try {
    console.log(
      '[teardown-timing] platform=' + process.platform +
      ' specs=' + TEARDOWN.specs +
      ' deprecatedFunctions=' + (TEARDOWN.deprecatedFunctions / 1000).toFixed(1) + 's' +
      ' deprecatedStylesheets=' + (TEARDOWN.deprecatedStylesheets / 1000).toFixed(1) + 's' +
      ' atomReset=' + (TEARDOWN.atomReset / 1000).toFixed(1) + 's' +
      ' clearContent=' + (TEARDOWN.clearContent / 1000).toFixed(1) + 's' +
      ' leakCheck=' + (TEARDOWN.leakCheck / 1000).toFixed(1) + 's'
    );
  } catch (e) {
    // Never let instrumentation break a run.
  }
}

console.log('[teardown-timing] instrumentation loaded');

exports.register = (jasmineEnv) => {
  jasmineEnv.afterEach(async (done) => {
    let t;

    t = Date.now();
    ensureNoDeprecatedFunctionCalls();
    TEARDOWN.deprecatedFunctions += Date.now() - t;

    t = Date.now();
    ensureNoDeprecatedStylesheets();
    TEARDOWN.deprecatedStylesheets += Date.now() - t;

    t = Date.now();
    await atom.reset();
    TEARDOWN.atomReset += Date.now() - t;

    t = Date.now();
    if (!window.debugContent) {
      document.getElementById('jasmine-content').innerHTML = '';
    }
    TEARDOWN.clearContent += Date.now() - t;

    t = Date.now();
    warnIfLeakingPathSubscriptions();
    TEARDOWN.leakCheck += Date.now() - t;

    TEARDOWN.specs += 1;
    if (TEARDOWN.specs % 100 === 0) reportTeardown();

    done();
  });
}
