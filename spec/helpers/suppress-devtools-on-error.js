// Keeps the uncaught-error handler from opening the dev tools during a
// headless run.
//
// `AtomEnvironment#installUncaughtErrorHandler` opens the dev tools on any
// uncaught error unless a `will-throw-error` listener calls
// `preventDefault()`. In a full suite that happens sooner or later.
//
// Docked dev tools eat into the viewport by ~550px in width, thereafter
// affecting geometry-sensitive specs. We think this contributes to the
// flakiness of some specs related to `TextEditorComponent` overlay
// decorations.
//
// Only headless runs are affected, on the logic that there's no point in
// showing dev tools that a human can't see. Testing via the GUI runner will
// still spawn dev tools on uncaught errors.
module.exports = function suppressDevToolsOnError(headless) {
  if (!headless) return;

  // Don't attach to `onWillThrowError` and call `preventDefault`; that gets in
  // the way of specs that assert on this behavior. Redefine these methods
  // instead. Any spec that tests this behavior will spy on these methods and
  // test that they were called, so that will continue to work just fine.
  atom.openDevTools = () => Promise.resolve();
  atom.executeJavaScriptInDevTools = () => Promise.resolve();

  console.log(
    'Headless run: dev tools will not be opened on uncaught errors ' +
      '(see spec/helpers/suppress-devtools-on-error.js).'
  );
};
