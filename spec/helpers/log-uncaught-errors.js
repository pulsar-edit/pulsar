// Makes uncaught errors during a spec run visible.
//
// `AtomEnvironment`'s uncaught-error handler emits `will-throw-error` and
// `did-throw-error`, but nothing in the harness listens, so an uncaught error
// leaves almost no trace: a single Chromium `INFO:CONSOLE` line among tens of
// thousands. That is how a `ResizeObserver` loop notification went unnoticed
// while it opened the dev tools mid-run and took 555px out of the viewport for
// every geometry spec that followed — and now that headless runs suppress the
// dev tools, that side effect is gone too, leaving even less to notice.
//
// This only logs. It deliberately does not call `preventDefault()`, so error
// handling behaves exactly as it would otherwise, and the specs in
// `atom-environment-spec.js` that assert on this machinery are unaffected.
//
// Registered once; `AtomEnvironment#reset()` does not dispose the emitter, so
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
