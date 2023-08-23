/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const path = require('path');
const Grim = require('grim');
const DeprecationCopView = require('../lib/deprecation-cop-view');
const _ = require('underscore-plus');

describe("DeprecationCopStatusBarView", function() {
  let [deprecatedMethod, statusBarView, workspaceElement] = [];

  beforeEach(function() {
    // jasmine.Clock.useMock() cannot mock _.debounce
    // http://stackoverflow.com/questions/13707047/spec-for-async-functions-using-jasmine
    spyOn(_, 'debounce').andCallFake(func => (function() { return func.apply(this, arguments); }));

    jasmine.snapshotDeprecations();

    workspaceElement = atom.views.getView(atom.workspace);
    jasmine.attachToDOM(workspaceElement);
    waitsForPromise(() => atom.packages.activatePackage('status-bar'));
    waitsForPromise(() => atom.packages.activatePackage('deprecation-cop'));

    return waitsFor(() => statusBarView = workspaceElement.querySelector('.deprecation-cop-status'));
  });

  afterEach(() => jasmine.restoreDeprecationsSnapshot());

  it("adds the status bar view when activated", function() {
    expect(statusBarView).toExist();
    expect(statusBarView.textContent).toBe('0 deprecations');
    return expect(statusBarView).not.toShow();
  });

  it("increments when there are deprecated methods", function() {
    deprecatedMethod = () => Grim.deprecate("This isn't used");
    const anotherDeprecatedMethod = () => Grim.deprecate("This either");
    expect(statusBarView.style.display).toBe('none');
    expect(statusBarView.offsetHeight).toBe(0);

    deprecatedMethod();
    expect(statusBarView.textContent).toBe('1 deprecation');
    expect(statusBarView.offsetHeight).toBeGreaterThan(0);

    deprecatedMethod();
    expect(statusBarView.textContent).toBe('2 deprecations');
    expect(statusBarView.offsetHeight).toBeGreaterThan(0);

    anotherDeprecatedMethod();
    expect(statusBarView.textContent).toBe('3 deprecations');
    return expect(statusBarView.offsetHeight).toBeGreaterThan(0);
  });

  // TODO: Remove conditional when the new StyleManager deprecation APIs reach stable.
  if (atom.styles.getDeprecations != null) {
    it("increments when there are deprecated selectors", function() {
      atom.styles.addStyleSheet(`\
atom-text-editor::shadow { color: red; }\
`, {sourcePath: 'file-1'});
      expect(statusBarView.textContent).toBe('1 deprecation');
      expect(statusBarView).toBeVisible();
      atom.styles.addStyleSheet(`\
atom-text-editor::shadow { color: blue; }\
`, {sourcePath: 'file-2'});
      expect(statusBarView.textContent).toBe('2 deprecations');
      return expect(statusBarView).toBeVisible();
    });
  }

  return it('opens deprecation cop tab when clicked', function() {
    expect(atom.workspace.getActivePane().getActiveItem()).not.toExist();

    return waitsFor(function(done) {
      atom.workspace.onDidOpen(function({item}) {
        expect(item instanceof DeprecationCopView).toBe(true);
        return done();
      });
      return statusBarView.click();
    });
  });
});
