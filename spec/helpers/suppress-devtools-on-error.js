// Keeps the uncaught-error handler from opening the dev tools during a headless
// run.
//
// `AtomEnvironment#installUncaughtErrorHandler` opens the dev tools on any
// uncaught error unless a `will-throw-error` listener calls `preventDefault()`.
// In a full suite that happens sooner or later, and docked dev tools take 555px
// out of the content area — measured on all three platforms, with the window
// going from 800x572 to 245x572 on macOS and Linux and from 784x535 to 229x535
// on Windows. Every geometry-sensitive spec that runs afterwards is then
// measuring in a third of the intended viewport, which is how
// `TextEditorComponent overlay decorations` came to fail only on Windows: it
// needs 240px, and 229 is just short of it while 245 is just enough.
//
// Only headless runs are affected. Someone running the spec GUI inside Pulsar
// wants the dev tools to open on an error, and that behaviour is left alone.
//
// This stubs the two methods rather than calling `preventDefault()` on
// `will-throw-error`, because the suppression must not be visible to the specs
// that assert on this behaviour. `atom-environment-spec.js` spies on both
// methods in a `beforeEach`, and a spy shadows these stubs and restores them
// afterwards, so those specs still exercise the real logic.
module.exports = function suppressDevToolsOnError(headless) {
  if (!headless) return;

  atom.openDevTools = () => Promise.resolve();
  atom.executeJavaScriptInDevTools = () => Promise.resolve();

  console.log(
    'Headless run: dev tools will not be opened on uncaught errors ' +
      '(see spec/helpers/suppress-devtools-on-error.js).'
  );
};
