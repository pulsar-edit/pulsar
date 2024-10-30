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
                Added a SQL State Storage alternative to IndexedDB (opt-in, off by default).
              </li>
              <li>
                Repackaged the AppImage so it uses our launcher script internally (supports more CLI/launch flags).
              </li>
              <li>
                [language-php] Highlighted “null-safe” property access correctly.
              </li>
              <li>
                [language-c] Scoped template delimiters properly in C++.
              </li>
              <li>
                [language-c] Consolidated common highlighting queries between the C and C++ grammars for more consistency in syntax highlighting.
              </li>
              <li>
                Fixed incorrect behavior in certain scenarios for “Fold at Indent Level X” commands.
              </li>
              <li>
                Fixed exception when resolving divided folds (e.g., <code>#ifdefs</code> in C/C++).
              </li>
              <li>
                Avoided "length of null" error in autocomplete-plus for the PHP Tree-sitter grammar.
              </li>
              <li>
                Preserved <code>/usr/bin/pulsar</code> and <code>/usr/bin/ppm</code> on RPM updates.
              </li>
              <li>
                [tree-view] Moved to a more modern API for file removal in preparation for an Electron upgrade.
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
