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
                Restored ability for `less` files in packages to use inline JavaScript inside backticks.
              </li>
              <li>
                Fixed a syntax highlighting issue inside the `styleguide` package.
              </li>
              <li>
                Fixed an issue with rubygems timing out on ARM Linux workflow.
              </li>
              <li>
                Rewrote Tree-sitter scope predicates to use `#is?` and `#is-not?` where applicable.
              </li>
              <li>
                Ensure that project-specific setting overrides don't leak to the user's config file when the settings UI is visited.
              </li>
              <li>
                Added a feature in `markdown-preview` that adds support for Linguist, Chroma, Rouge, and HighlightJS for
                language identifiers in fenced code blocks.
              </li>
              <li>
                Fixed the `TextMate` `language-toml` grammar to properly support whitespace where-ever it may appear.
              </li>
              <li>
                Added a Tree-Sitter grammar for YAML files.
              </li>
              <li>
                Added a new core package `pulsar-updater` to help users update Pulsar.
              </li>
              <li>
                Added `ppm` and `ppm.cmd` binaries/launchers within ppm. This allows easier integration of
                correctly named binaries on more systems in more contexts (especially Windows).
                Existing `apm` and `apm.cmd` binaries/launchers are still there for the time being.
              </li>
              <li>
                Added a modern Tree-Sitter grammar for Markdown files.
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
