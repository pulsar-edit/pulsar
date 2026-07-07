const {
  ensureNoDeprecatedFunctionCalls,
  ensureNoDeprecatedStylesheets,
  warnIfLeakingPathSubscriptions,
} = require("./warnings");

exports.register = (jasmineEnv) => {
  jasmineEnv.afterEach((done) => {
    ensureNoDeprecatedFunctionCalls();
    ensureNoDeprecatedStylesheets();

    atom.reset().then(() => {
      if (!window.debugContent) {
        document.getElementById("jasmine-content").innerHTML = "";
      }
      warnIfLeakingPathSubscriptions();

      done();
    }, done.fail);
  });
};
