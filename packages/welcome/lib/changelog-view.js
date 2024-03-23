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
                Fixed some folds in Ruby like <code>unless</code>, some blocks, multiline comments, function calls, and different array syntaxes for strings and keywords.
              </li>
              <li>
                Improved the accuracy of indentation hinting in modern Tree-sitter grammars, especially in multi-cursor scenarios.
              </li>
              <li>
                Improved the ability of the user to opt into a specific kind of grammar for a specific language.
              </li>
              <li>
                Changed the behavior of the <code>grammar-selector</code> package so that it will show the user's preferred grammar for a specific language.
              </li>
              <li>
                Updated to version <code>0.20.9</code> of <code>web-tree-sitter</code>.
              </li>
              <li>
                Improved syntax highlighting, indentation, and code folding in various languages, including TypeScript, shell scripts, Ruby, and C/C++.
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
