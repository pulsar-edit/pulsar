// Makes uncaught errors during a spec run visible.
//
// This only logs. It deliberately does not call `preventDefault()`, so error
// handling behaves exactly as it would otherwise, and the specs in
// `atom-environment-spec.js` that assert on this machinery are unaffected.
//
// Registered once. `AtomEnvironment#reset()` does not dispose the emitter, so
// the subscription survives the whole run.
module.exports = function logUncaughtErrors() {
  atom.onWillThrowError(({ message, url, line, column, originalError }) => {
    const where = url ? `${url}:${line}:${column}` : 'unknown location';
    console.log(`UNCAUGHT ERROR DURING SPEC RUN: ${message}`);
    console.log(`  at ${where}`);
    if (originalError && originalError.stack) {
      console.log(String(originalError.stack));
    }
  });
};
