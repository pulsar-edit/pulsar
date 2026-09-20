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

    t = Date.now();
    ensureNoDeprecatedFunctionCalls();
    const depFns = Date.now() - t;

    t = Date.now();
    ensureNoDeprecatedStylesheets();
    const depStyles = Date.now() - t;

    t = Date.now();
    await atom.reset();
    const atomReset = Date.now() - t;

    t = Date.now();
    if (!window.debugContent) {
      document.getElementById('jasmine-content').innerHTML = '';
    }
    const clearContent = Date.now() - t;

    t = Date.now();
    warnIfLeakingPathSubscriptions();
    const leakCheck = Date.now() - t;

    specCount += 1;
    appendTiming(
      specCount +
        ' depFns=' + depFns +
        ' depStyles=' + depStyles +
        ' atomReset=' + atomReset +
        ' clearContent=' + clearContent +
        ' leakCheck=' + leakCheck
    );

    done();
  });
}
