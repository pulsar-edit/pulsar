require('etch').setScheduler({
  updateDocument(callback) { callback(); },
  getNextUpdatePromise() { return Promise.resolve(); }
});

// The CI on Atom has been failing with this package. Experiments
// indicate the dev tools were being opened, which caused test
// failures. Dev tools are meant to be triggered on an uncaught
// exception.
//
// These failures are flaky though, so an exact cause
// has not yet been found. For now the following is added
// to reduce the number of flaky failures, which have been
// causing false failures on unrelated Atom PRs.
//
// See more in https://github.com/atom/atom/pull/21335
global.beforeEach(() => {
  spyOn(atom, 'openDevTools').andReturn((console.error("ERROR: Dev tools attempted to open"), Promise.resolve()));
});
