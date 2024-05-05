const {
  ensureNoDeprecatedFunctionCalls,
  ensureNoDeprecatedStylesheets,
  warnIfLeakingPathSubscriptions
} = require('./warnings')

afterEach(async (done) => {
  ensureNoDeprecatedFunctionCalls();
  ensureNoDeprecatedStylesheets();

  await atom.reset();

  if (!window.debugContent) { document.getElementById('jasmine-content').innerHTML = ''; }
  warnIfLeakingPathSubscriptions();

  done();
});
