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
                Various tree-sitter grammar improvements
                <ul>
                  <li>
                    Docs Fixes
                  </li>
                  <li>
                    A parser update for PHP
                  </li>
                  <li>
                    Miscellaneous grammar fixes and improvements
                  </li>
                </ul>
              </li>
              <li>
                Added a preference <code>core.allowWindowTransparency</code> so that themes and user stylesheets can make editor windows' backgrounds transparent.
              </li>
              <li>
                Added a new modern tree sitter "test" for highlight query - <code>ancestorTypeNearerThan</code> that matches if it finds the <i>first</i> type as an ancestor, but <i>doesn't match</i> if any "other" ancestors are found before
              </li>
              <li>
                Syntax quoting and unquoting in Clojure now highlights correctly, and also highlights full qualified keywords differently than generated ones
              </li>
              <li>
                <code>content</code> field of addInjectionPoint for modern-tree-sitter now supports a second <code>buffer</code> argument, for better customization if one wants to
              </li>
              <li>
                EDN is back to being detected as Clojure (for compatibility) but highlights as EDN
              </li>
              <li>
                Fixed syntax quoting on Clojure grammar (newer tree-sitter), fixed some injection points on Clojure. Added support for highligting metadata, and added better support for "def" elements (for example - doesn't scope <code>default</code> or <code>definition</code> as a <code>def</code>, but highlights <code>p/defresolver</code>)
              </li>
              <li>
                Fixed <code>textChanged</code> property to be accurate when deleting characters
              </li>
              <li>
                Fixed <code>ppm publish</code> for publishing brand new packages
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
