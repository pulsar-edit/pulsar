const {
  ensureNoDeprecatedFunctionCalls,
  ensureNoDeprecatedStylesheets,
  warnIfLeakingPathSubscriptions
} = require('./warnings')

exports.register = (jasmineEnv) => {
  jasmineEnv.afterEach(async (done) => {
    ensureNoDeprecatedFunctionCalls();
    ensureNoDeprecatedStylesheets();

    await atom.reset();

    if (!window.debugContent) {
      document.getElementById('jasmine-content').innerHTML = '';
    }
    warnIfLeakingPathSubscriptions();

    done();
  });
}
