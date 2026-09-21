// TEMPORARY (troubleshooting): shared append-only sink for the Windows
// slowness investigation. Console output from inside spec hooks has gone
// missing repeatedly; a file has not. Uses `performance.now()` at the call
// sites because `Date.now` is faked by `jasmine2-time.js`.
const TIMING_LOG = (() => {
  try {
    const os = require('os');
    const path = require('path');
    return path.join(process.env.GITHUB_WORKSPACE || os.tmpdir(), 'teardown-timing.log');
  } catch (e) {
    return null;
  }
})();

exports.append = (line) => {
  if (!TIMING_LOG) return;
  try {
    require('fs').appendFileSync(TIMING_LOG, line + '\n');
  } catch (e) {
    // Never let instrumentation break a run.
  }
};
