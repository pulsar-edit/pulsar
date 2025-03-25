/** @babel */
/** @jsx etch.dom */

import etch from 'etch';

export default class ChangeLogView {
  constructor(props) {
    this.props = props;
    etch.initialize(this);
  }

  didChangeShowChangeLog() {
    atom.config.set('welcome.showChangeLog', this.checked);
  }

  dismissVersion() {
    atom.config.set('welcome.lastViewedChangeLog', atom.getVersion().split(" ")[0]);
  }

  wasVersionDismissed() {
    // Use the new `.versionSatisfies()` API to check if our last dismissed version
    // is the same as the current version. `.versionSatisfies()` compares equality
    // by default, so no comparator is needed
    return atom.versionSatisfies(atom.config.get('welcome.lastViewedChangeLog'));
  }

  update() {}

  serialize() {
    return {
      deserializer: 'ChangeLogView',
      uri: this.props.uri
    };
  }

  render() {
    return (
      <div className="welcome">
        <div className="welcome-container">
          <div className="header">
            <a title="Full Change Log" href="https://github.com/pulsar-edit/pulsar/blob/master/CHANGELOG.md">
              {/* LOGO GOES HERE */}
              <h1 className="welcome-title">
                Change Log
              </h1>
            </a>
          </div>
          <div className="welcome-panel">
            <p>Take a look at some of the awesome things {atom.branding.name} has changed:</p>
            <p>Feel free to read our <a href="https://github.com/pulsar-edit/pulsar/blob/master/CHANGELOG.md">Full Change Log</a>.</p>
            <ul>
              <li>
                Added a Jasmine 2-based test runner, migrated core editor tests to use it. Packages bundled into the core editor can migrate their tests to use this as well, over time. The Jasmine 1 test runner remains available.
              </li>
              <li>
                Adding <code>--enable-features=UseOzonePlatform</code> and <code>--ozone-platform=wayland</code> as parameters when running under Wayland on Linux (avoids using xwayland, which causes rendering problems on some systems, especially with NVidia)
              </li>
              <li>
                Many Tree-sitter/parser/grammar improvements.
                <ul>
                  <li>
                    Updated to <code>web-tree-sitter</code> version <code>0.25.3</code>.
                  </li>
                  <li>
                    Fixed a bug preventing folds from updating after code changes in some scenarios.
                  </li>
                  <li>
                    Better folding behavior in Python.
                  </li>
                  <li>
                    Better folding and syntax highlighting in Ruby of <code>case</code>/<code>in</code> statements.
                  </li>
                  <li>
                    Better syntax highlighting of private members in JavScript.
                  </li>
                  <li>
                    Better folding of multiline comments in PHP.
                  </li>
                </ul>
              </li>
              <li>
                Updated the `read` dependency in ppm
              </li>
            </ul>

            <section className="welcome-panel">
              <label>
                <input className="input-checkbox"
                  type="checkbox"
                  checked={atom.config.get('welcome.showChangeLog')}
                  onchange={this.didChangeShowChangeLog}
                />
                Show the Change Log after an update.
              </label>
            </section>
            <section className="welcome-panel">
              <label>
                <input className="input-checkbox"
                  type="checkbox"
                  checked={this.wasVersionDismissed()}
                  onchange={this.dismissVersion}
                />
                Dismiss this Change Log
              </label>
            </section>
          </div>
        </div>
      </div>
    );
  }

  getURI() {
    return this.props.uri;
  }

  getTitle() {
    return 'Change Log';
  }

  isEqual(other) {
    return other instanceof ChangeLogView;
  }
}
