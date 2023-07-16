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
                Bumped github package to include fixes to the Less syntax, for compatiblity with Less 4
              </li>
              <li>
                Fixed a number of issues with the experimental modern Tree-sitter grammar mode
              </li>
              <li>
                Pulsar can now be added to the PATH on Windows, via the "System" pane within Settings View.
              </li>
              <li>
                Bumped `less-cache` to `v2.0.0` which uses `less@4.1.3`. This adds many new features of Less, while causing
                breaking changes to existing Less Stylesheets. Pulsar will attempt to automatically repair any breaking
                changes in any package style sheets, while emitting deprecations.
              </li>
              <li>
                Fixed a bug that would render files unable to be clicked with sticky headers enabled on One-Dark
                and One-Light themes.
              </li>
              <li>
                Added a Modern Tree-Sitter TOML Grammar.
              </li>
              <li>
                Added a new API endpoint within Pulsar of `atom.versionSatisfies()` to allow packages to safely
                check the version of Pulsar, instead of having to do so themeselves.
              </li>
              <li>
                An issue in a downstream dependency has been resolved that improperly flagged Pulsar as malicious.
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
