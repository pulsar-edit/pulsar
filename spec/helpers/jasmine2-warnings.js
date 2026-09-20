const {
  ensureNoDeprecatedFunctionCalls,
  ensureNoDeprecatedStylesheets,
  warnIfLeakingPathSubscriptions
} = require('./warnings')

// TEMPORARY (troubleshooting): the Windows suite runs ~5x slower than Linux and
// macOS. This hook runs after every one of the ~2365 specs, so teardown is the
// leading suspect. Time each part.
//
// Results go to a FILE, one line per spec. Console output from inside this hook
// has gone missing more than once for reasons I could not pin down; a file
// cannot be swallowed, survives a crash mid-run, and gives per-spec figures
// instead of running totals.
const TIMING_LOG = (() => {
  try {
    const os = require('os');
    const path = require('path');
    return path.join(process.env.GITHUB_WORKSPACE || os.tmpdir(), 'teardown-timing.log');
  } catch (e) {
    return null;
  }
})();

let specCount = 0;

function appendTiming(line) {
  if (!TIMING_LOG) return;
  try {
    require('fs').appendFileSync(TIMING_LOG, line + '\n');
  } catch (e) {
    // Never let instrumentation break a run.
  }
}

appendTiming('--- teardown timing start, platform=' + process.platform);
console.log('[teardown-timing] writing to ' + TIMING_LOG);

exports.register = (jasmineEnv) => {
  jasmineEnv.afterEach(async (done) => {
    let t;

    t = performance.now();
    ensureNoDeprecatedFunctionCalls();
    const depFns = performance.now() - t;

    t = performance.now();
    ensureNoDeprecatedStylesheets();
    const depStyles = performance.now() - t;

    t = performance.now();
    await atom.reset();
    const atomReset = performance.now() - t;

    t = performance.now();
    if (!window.debugContent) {
      document.getElementById('jasmine-content').innerHTML = '';
    }
    const clearContent = performance.now() - t;

    t = performance.now();
    warnIfLeakingPathSubscriptions();
    const leakCheck = performance.now() - t;

    specCount += 1;
    appendTiming(
      specCount +
        ' depFns=' + depFns.toFixed(1) +
        ' depStyles=' + depStyles.toFixed(1) +
        ' atomReset=' + atomReset.toFixed(1) +
        ' clearContent=' + clearContent.toFixed(1) +
        ' leakCheck=' + leakCheck.toFixed(1)
    );

    done();
  });
}
