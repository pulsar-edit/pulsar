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
                Prevented an exception raised in the command palette in certain unusual filtering scenarios.
              </li>
              <li>
                Refrain from rendering anchor icons when showing a package's README file in `settings-view`.
              </li>
              <li>
                Build Linux binaries on Debian 10, for older glibc and compatibility with older Linux distros.
              </li>
              <li>
                Fixed a rendering error in `atom.ui.markdown.render` when `disableMode` was set to `"strict"` and the input contained HTML line breaks.
              </li>
              <li>
                Added support for the semanticolor package in modern tree-sitter grammars.
              </li>
              <li>
                Added new `--force` flag to `ppm link` command that will uninstall any conflicting package already installed.
              </li>
              <li>
                Added language entity colors to `syntax-variables.less`.
              </li>
              <li>
                Numerous Tree-Sitter Grammar syntax highlighting fixes.
              </li>
              <li>
                Bumped dugite to make the github package compatible with ARM Linux.
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
